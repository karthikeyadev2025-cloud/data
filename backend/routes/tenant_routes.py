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
        return {"total_searches": 0, "total_results": 0, "credits_used": 0, "credits_balance": 0,
                "daily_searches": [], "daily_credits": [], "scraper_breakdown": [], "top_cities": [],
                "recent_searches": []}
    t = sb().table("tenants").select("*").eq("id", tid).limit(1).execute()
    tenant = t.data[0] if t.data else {}
    j = sb().table("search_jobs").select("id,results_count,credits_used,scraper_type,location,created_at", count="exact").eq("tenant_id", tid).execute()
    all_jobs = j.data or []
    total_searches = j.count or 0
    total_results = sum((row.get("results_count") or 0) for row in all_jobs)
    total_credits_used = sum((row.get("credits_used") or 0) for row in all_jobs)

    # ── Analytics: daily trends (last 30 days) ──
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    day_30_ago = now - timedelta(days=30)
    daily_map = {}
    credit_map = {}
    scraper_counts = {}
    city_counts = {}

    for job in all_jobs:
        created = job.get("created_at", "")
        try:
            dt = datetime.fromisoformat(created.replace("Z", "+00:00")) if created else None
        except Exception:
            dt = None

        if dt and dt >= day_30_ago:
            day_key = dt.strftime("%Y-%m-%d")
            daily_map[day_key] = daily_map.get(day_key, 0) + 1
            credit_map[day_key] = credit_map.get(day_key, 0) + (job.get("credits_used") or 0)

        # Scraper breakdown (all-time)
        st = job.get("scraper_type") or "unknown"
        scraper_counts[st] = scraper_counts.get(st, 0) + 1

        # Top cities
        loc = (job.get("location") or "").strip()
        if loc:
            city_counts[loc] = city_counts.get(loc, 0) + 1

    # Build ordered daily arrays
    daily_searches = []
    daily_credits = []
    for i in range(30):
        d = (day_30_ago + timedelta(days=i + 1)).strftime("%Y-%m-%d")
        daily_searches.append({"date": d, "count": daily_map.get(d, 0)})
        daily_credits.append({"date": d, "credits": credit_map.get(d, 0)})

    # Sort scraper breakdown
    scraper_breakdown = sorted(
        [{"type": k, "count": v} for k, v in scraper_counts.items()],
        key=lambda x: x["count"], reverse=True
    )

    # Top 10 cities
    top_cities = sorted(
        [{"city": k, "count": v} for k, v in city_counts.items()],
        key=lambda x: x["count"], reverse=True
    )[:10]

    # Recent 5
    recent = sb().table("search_jobs").select("*").eq("tenant_id", tid).order("created_at", desc=True).limit(5).execute()

    return {
        "total_searches": total_searches,
        "total_results": total_results,
        "credits_used": total_credits_used,
        "credits_balance": tenant.get("credits_balance", 0),
        "plan_code": tenant.get("plan_code"),
        "daily_searches": daily_searches,
        "daily_credits": daily_credits,
        "scraper_breakdown": scraper_breakdown,
        "top_cities": top_cities,
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
