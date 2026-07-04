"""Tenant-side helpers: plans list, tenant stats."""
from fastapi import APIRouter, Depends, HTTPException
from db import sb
from auth import get_current_user

router = APIRouter(tags=["tenant"])


@router.get("/plans")
def list_plans():
    res = sb().table("plans").select("*").eq("active", True).order("price_inr", desc=False).execute()
    return {"plans": res.data or []}


@router.get("/branding")
def branding():
    r = sb().table("platform_settings").select("brand_name,footer_text,tagline,primary_color_hex").limit(1).execute()
    if not r.data:
        return {"brand_name": "INeedLeads",
                "footer_text": "An innovation by NIKKI TECH LABS",
                "tagline": "Real business contacts. One dashboard. Six scrapers.",
                "primary_color_hex": "#0EA5A4"}
    d = r.data[0]
    # sensible defaults if newly-added columns are null
    d["tagline"] = d.get("tagline") or "Real business contacts. One dashboard. Six scrapers."
    d["primary_color_hex"] = d.get("primary_color_hex") or "#0EA5A4"
    return d


@router.get("/dashboard/stats")
def tenant_stats(user: dict = Depends(get_current_user)):
    if user["role"] == "super_admin":
        raise HTTPException(status_code=400, detail="Use /admin/stats instead")
    tid = user.get("tenant_id")
    if not tid:
        return {"total_searches": 0, "total_results": 0, "credits_used": 0, "credits_balance": 0}
    t = sb().table("tenants").select("*").eq("id", tid).limit(1).execute()
    tenant = t.data[0] if t.data else {}
    j = sb().table("search_jobs").select("id,results_count,credits_used", count="exact").eq("tenant_id", tid).execute()
    total_searches = j.count or 0
    total_results = sum((row.get("results_count") or 0) for row in (j.data or []))
    total_credits_used = sum((row.get("credits_used") or 0) for row in (j.data or []))
    # recent 5
    recent = sb().table("search_jobs").select("*").eq("tenant_id", tid).order("created_at", desc=True).limit(5).execute()
    return {
        "total_searches": total_searches,
        "total_results": total_results,
        "credits_used": total_credits_used,
        "credits_balance": tenant.get("credits_balance", 0),
        "plan_code": tenant.get("plan_code"),
        "recent_searches": recent.data or [],
    }


@router.get("/transactions")
def list_transactions(user: dict = Depends(get_current_user)):
    if user["role"] == "super_admin":
        raise HTTPException(status_code=400, detail="Use /admin/transactions")
    tid = user.get("tenant_id")
    if not tid:
        return {"transactions": []}
    r = sb().table("transactions").select("*").eq("tenant_id", tid).order("created_at", desc=True).limit(200).execute()
    return {"transactions": r.data or []}
