"""Super admin only routes. All API keys and platform config live here."""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
import datetime as dt

from db import sb
from auth import require_super_admin

router = APIRouter(prefix="/admin", tags=["admin"])


# ============== Analytics ==============
@router.get("/stats")
def stats(user: dict = Depends(require_super_admin)):
    c = sb()
    tenants_count = c.table("tenants").select("id", count="exact").execute().count or 0
    active_tenants = c.table("tenants").select("id", count="exact").eq("is_active", True).execute().count or 0
    total_searches = c.table("search_jobs").select("id", count="exact").execute().count or 0
    total_results = c.table("search_results").select("id", count="exact").execute().count or 0
    # revenue: sum amount_inr of successful razorpay_topup
    tx = c.table("transactions").select("amount_inr,credits_delta,type,status").eq("status", "success").execute()
    revenue = sum(float(r.get("amount_inr") or 0)
                  for r in (tx.data or []) if r.get("type") == "razorpay_topup")
    credits_sold = sum(int(r.get("credits_delta") or 0)
                       for r in (tx.data or []) if r.get("type") in ("razorpay_topup", "admin_grant") and (r.get("credits_delta") or 0) > 0)
    credits_used = -sum(int(r.get("credits_delta") or 0)
                        for r in (tx.data or []) if r.get("type") == "usage")
    return {
        "tenants_count": tenants_count,
        "active_tenants": active_tenants,
        "total_searches": total_searches,
        "total_results": total_results,
        "revenue_inr": revenue,
        "credits_sold": credits_sold,
        "credits_used": credits_used,
    }


@router.get("/chart/searches")
def chart_searches(days: int = 14, user: dict = Depends(require_super_admin)):
    since = (dt.datetime.utcnow() - dt.timedelta(days=days)).isoformat()
    r = sb().table("search_jobs").select("created_at,results_count,scraper_type").gte("created_at", since).execute()
    buckets: dict[str, dict] = {}
    for row in (r.data or []):
        d = (row.get("created_at") or "")[:10]
        b = buckets.setdefault(d, {"day": d, "searches": 0, "results": 0})
        b["searches"] += 1
        b["results"] += row.get("results_count") or 0
    return {"data": sorted(buckets.values(), key=lambda x: x["day"])}


# ============== Tenants management ==============
@router.get("/tenants")
def list_tenants(user: dict = Depends(require_super_admin)):
    r = sb().table("tenants").select("*").order("created_at", desc=True).execute()
    tenants = r.data or []
    # attach owner user
    for t in tenants:
        u = sb().table("users").select("id,email,full_name,role,is_active").eq("tenant_id", t["id"]).limit(1).execute()
        t["owner"] = u.data[0] if u.data else None
    return {"tenants": tenants}


class TenantUpdate(BaseModel):
    is_active: bool | None = None
    plan_code: str | None = None
    credits_balance: int | None = None
    add_credits: int | None = None
    name: str | None = None


@router.patch("/tenants/{tenant_id}")
def update_tenant(tenant_id: str, body: TenantUpdate, user: dict = Depends(require_super_admin)):
    c = sb()
    t = c.table("tenants").select("*").eq("id", tenant_id).limit(1).execute()
    if not t.data:
        raise HTTPException(status_code=404, detail="Tenant not found")
    tenant = t.data[0]
    updates = {}
    if body.is_active is not None:
        updates["is_active"] = body.is_active
    if body.plan_code is not None:
        # validate plan exists
        p = c.table("plans").select("code").eq("code", body.plan_code).limit(1).execute()
        if not p.data:
            raise HTTPException(status_code=400, detail="Invalid plan_code")
        updates["plan_code"] = body.plan_code
    if body.credits_balance is not None:
        updates["credits_balance"] = max(0, body.credits_balance)
    if body.add_credits is not None and body.add_credits != 0:
        updates["credits_balance"] = max(0, (tenant.get("credits_balance") or 0) + body.add_credits)
        # log txn
        c.table("transactions").insert({
            "tenant_id": tenant_id, "user_id": user["id"],
            "type": "admin_grant", "amount_inr": 0,
            "credits_delta": body.add_credits, "status": "success",
            "notes": f"Manual grant by super admin {user['email']}",
        }).execute()
    if body.name is not None:
        updates["name"] = body.name

    if updates:
        c.table("tenants").update(updates).eq("id", tenant_id).execute()
        c.table("audit_logs").insert({
            "actor_id": user["id"], "actor_email": user["email"],
            "tenant_id": tenant_id, "action": "tenant.update",
            "target_type": "tenant", "target_id": tenant_id,
            "details": updates,
        }).execute()
    fresh = c.table("tenants").select("*").eq("id", tenant_id).limit(1).execute().data[0]
    return {"tenant": fresh}


# ============== Platform settings ==============
@router.get("/settings")
def get_settings(user: dict = Depends(require_super_admin)):
    r = sb().table("platform_settings").select("*").limit(1).execute()
    if not r.data:
        raise HTTPException(status_code=500, detail="platform_settings row missing")
    return {"settings": r.data[0]}


class SettingsUpdate(BaseModel):
    google_api_key: str | None = None
    serpapi_key: str | None = None
    apify_token: str | None = None
    youtube_api_key: str | None = None
    razorpay_key_id: str | None = None
    razorpay_key_secret: str | None = None
    google_oauth_client_id: str | None = None
    google_oauth_client_secret: str | None = None
    free_trial_credits: int | None = None
    brand_name: str | None = None
    footer_text: str | None = None
    support_email: str | None = None
    tagline: str | None = None
    primary_color_hex: str | None = None
    google_service_account_json: str | None = None


@router.patch("/settings")
def update_settings(body: SettingsUpdate, user: dict = Depends(require_super_admin)):
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    r = sb().table("platform_settings").select("id").limit(1).execute()
    if not r.data:
        raise HTTPException(status_code=500, detail="platform_settings row missing")
    settings_id = r.data[0]["id"]
    sb().table("platform_settings").update(updates).eq("id", settings_id).execute()
    # clear the cached settings getter
    try:
        from db import get_platform_settings
        # No lru_cache used on get_platform_settings currently; still safe.
    except Exception:
        pass
    sb().table("audit_logs").insert({
        "actor_id": user["id"], "actor_email": user["email"],
        "action": "settings.update", "target_type": "platform_settings",
        "details": {k: ("***" if "key" in k or "secret" in k or "token" in k else v)
                    for k, v in updates.items()},
    }).execute()
    fresh = sb().table("platform_settings").select("*").limit(1).execute().data[0]
    return {"settings": fresh}


# ============== Plans management ==============
@router.get("/plans")
def admin_plans(user: dict = Depends(require_super_admin)):
    r = sb().table("plans").select("*").order("price_inr").execute()
    return {"plans": r.data or []}


class PlanUpdate(BaseModel):
    name: str | None = None
    price_inr: int | None = None
    monthly_credits: int | None = None
    is_unlimited: bool | None = None
    features: list[str] | None = None
    active: bool | None = None


@router.patch("/plans/{code}")
def update_plan(code: str, body: PlanUpdate, user: dict = Depends(require_super_admin)):
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    r = sb().table("plans").update(updates).eq("code", code).execute()
    if not r.data:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"plan": r.data[0]}


# ============== Transactions & Audit ==============
@router.get("/transactions")
def admin_transactions(limit: int = Query(default=200, le=1000),
                       user: dict = Depends(require_super_admin)):
    r = sb().table("transactions").select("*").order("created_at", desc=True).limit(limit).execute()
    return {"transactions": r.data or []}


@router.get("/audit")
def admin_audit(limit: int = Query(default=200, le=1000),
                user: dict = Depends(require_super_admin)):
    r = sb().table("audit_logs").select("*").order("created_at", desc=True).limit(limit).execute()
    return {"logs": r.data or []}


@router.get("/searches")
def admin_searches(limit: int = Query(default=200, le=1000),
                   user: dict = Depends(require_super_admin)):
    r = sb().table("search_jobs").select("*").order("created_at", desc=True).limit(limit).execute()
    return {"searches": r.data or []}
