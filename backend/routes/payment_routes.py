"""Razorpay top-up flow."""
import hmac
import hashlib
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from db import sb, get_effective_key
from auth import get_current_user

router = APIRouter(prefix="/payments", tags=["payments"])

# Simple pricing: 1 credit = ₹2 (edit anytime via admin panel plans, but MVP uses this)
CREDIT_PRICE_INR = 2


class CreateOrderIn(BaseModel):
    credits: int = Field(ge=10, le=100000)


class VerifyIn(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    credits: int


def _rzp_client():
    key_id = get_effective_key("razorpay_key_id")
    key_secret = get_effective_key("razorpay_key_secret")
    if not key_id or not key_secret:
        raise HTTPException(status_code=400,
            detail="Razorpay is not configured. Super admin must add keys in Settings.")
    import razorpay
    return razorpay.Client(auth=(key_id, key_secret)), key_id, key_secret


@router.get("/config")
def payment_config(user: dict = Depends(get_current_user)):
    key_id = get_effective_key("razorpay_key_id")
    return {
        "enabled": bool(key_id),
        "razorpay_key_id": key_id,
        "credit_price_inr": CREDIT_PRICE_INR,
    }


@router.post("/create-order")
def create_order(body: CreateOrderIn, user: dict = Depends(get_current_user)):
    if not user.get("tenant_id"):
        raise HTTPException(status_code=400, detail="No tenant")
    client, key_id, _ = _rzp_client()
    amount = body.credits * CREDIT_PRICE_INR * 100  # paise
    order = client.order.create({
        "amount": amount,
        "currency": "INR",
        "notes": {"tenant_id": user["tenant_id"], "credits": body.credits},
    })
    # log pending transaction
    sb().table("transactions").insert({
        "tenant_id": user["tenant_id"], "user_id": user["id"],
        "type": "razorpay_topup", "amount_inr": body.credits * CREDIT_PRICE_INR,
        "credits_delta": body.credits, "status": "pending",
        "razorpay_order_id": order["id"],
        "notes": f"Pending Razorpay order for {body.credits} credits",
    }).execute()
    return {
        "order_id": order["id"],
        "amount": amount,
        "currency": "INR",
        "razorpay_key_id": key_id,
        "credits": body.credits,
    }


@router.post("/verify")
def verify_payment(body: VerifyIn, user: dict = Depends(get_current_user)):
    _, _, key_secret = _rzp_client()
    msg = f"{body.razorpay_order_id}|{body.razorpay_payment_id}".encode()
    expected = hmac.new(key_secret.encode(), msg, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, body.razorpay_signature):
        # mark as failed
        sb().table("transactions").update({"status": "failed",
            "razorpay_payment_id": body.razorpay_payment_id,
            "razorpay_signature": body.razorpay_signature,
            "notes": "signature mismatch"}).eq("razorpay_order_id", body.razorpay_order_id).execute()
        raise HTTPException(status_code=400, detail="Invalid Razorpay signature")
    # success -> credit tenant + update txn
    tenant_id = user["tenant_id"]
    t = sb().table("tenants").select("credits_balance").eq("id", tenant_id).limit(1).execute().data[0]
    new_bal = (t.get("credits_balance") or 0) + body.credits
    sb().table("tenants").update({"credits_balance": new_bal}).eq("id", tenant_id).execute()
    sb().table("transactions").update({
        "status": "success",
        "razorpay_payment_id": body.razorpay_payment_id,
        "razorpay_signature": body.razorpay_signature,
        "notes": "payment verified",
    }).eq("razorpay_order_id", body.razorpay_order_id).execute()
    return {"ok": True, "credits_balance": new_bal}
