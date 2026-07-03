"""Search routes: run scrapers, list history, view results, export CSV/XLSX."""
import io
import csv
import datetime as dt
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import pandas as pd

from db import sb, get_effective_key
from auth import get_current_user
from scraper_core import (scrape_google_maps, scrape_youtube,
                          scrape_website, scrape_ecommerce, scrape_google_search)

router = APIRouter(prefix="/search", tags=["search"])

VALID_SCRAPERS = {"google_maps", "google_search", "youtube", "instagram",
                  "facebook", "website", "ecommerce"}


class SearchIn(BaseModel):
    scraper_type: str = Field(pattern="^(google_maps|google_search|youtube|instagram|facebook|website|ecommerce)$")
    query: str = Field(min_length=1, max_length=200)
    location: str | None = None
    max_results: int = Field(default=20, ge=1, le=60)


def _require_active_tenant(user: dict) -> dict:
    if user["role"] == "super_admin":
        raise HTTPException(status_code=400, detail="Super admin cannot run searches. Use a tenant account.")
    if not user.get("tenant_id"):
        raise HTTPException(status_code=400, detail="No tenant associated with this user")
    t = sb().table("tenants").select("*").eq("id", user["tenant_id"]).limit(1).execute()
    if not t.data:
        raise HTTPException(status_code=404, detail="Tenant not found")
    tenant = t.data[0]
    if not tenant.get("is_active", True):
        raise HTTPException(status_code=403, detail="Tenant is disabled")
    return tenant


def _check_credits(tenant: dict, need: int) -> None:
    # Look up plan for unlimited flag
    p = sb().table("plans").select("*").eq("code", tenant.get("plan_code") or "free").limit(1).execute()
    plan = p.data[0] if p.data else {}
    if plan.get("is_unlimited"):
        return
    if (tenant.get("credits_balance") or 0) < need:
        raise HTTPException(status_code=402, detail=f"Insufficient credits. Need {need}, have {tenant.get('credits_balance', 0)}. Please buy more credits.")


@router.post("")
def run_search(body: SearchIn, user: dict = Depends(get_current_user)):
    tenant = _require_active_tenant(user)
    _check_credits(tenant, body.max_results)

    # Create job row (pending)
    job = sb().table("search_jobs").insert({
        "tenant_id": tenant["id"],
        "user_id": user["id"],
        "scraper_type": body.scraper_type,
        "query": body.query,
        "location": body.location,
        "max_results": body.max_results,
        "status": "running",
    }).execute().data[0]
    job_id = job["id"]

    try:
        rows = _dispatch_scraper(body)
    except HTTPException:
        sb().table("search_jobs").update({"status": "failed", "error_message": "scraper key missing"}).eq("id", job_id).execute()
        raise
    except Exception as e:
        sb().table("search_jobs").update({"status": "failed", "error_message": str(e)[:500]}).eq("id", job_id).execute()
        raise HTTPException(status_code=500, detail=f"Scraper error: {e}")

    # Insert results in batches
    if rows:
        payload = []
        for r in rows:
            payload.append({
                "job_id": job_id, "tenant_id": tenant["id"],
                "name": (r.get("name") or "")[:500],
                "phone": (r.get("phone") or None),
                "email": (r.get("email") or None),
                "website": r.get("website"),
                "address": r.get("address"),
                "city": r.get("city"),
                "category": r.get("category"),
                "rating": r.get("rating"),
                "reviews_count": r.get("reviews_count"),
                "latitude": r.get("latitude"),
                "longitude": r.get("longitude"),
                "instagram": r.get("instagram"),
                "facebook": r.get("facebook"),
                "linkedin": r.get("linkedin"),
                "twitter": r.get("twitter"),
                "youtube": r.get("youtube"),
                "whatsapp": r.get("whatsapp"),
                "extra": r.get("extra") or {},
            })
        # batch insert (Supabase allows up to ~1000 in one call)
        sb().table("search_results").insert(payload).execute()

    # Deduct credits (only for results returned) unless unlimited
    p = sb().table("plans").select("*").eq("code", tenant.get("plan_code") or "free").limit(1).execute()
    plan = p.data[0] if p.data else {}
    credits_used = 0
    if not plan.get("is_unlimited"):
        credits_used = len(rows)
        new_bal = max(0, (tenant.get("credits_balance") or 0) - credits_used)
        sb().table("tenants").update({"credits_balance": new_bal}).eq("id", tenant["id"]).execute()
        if credits_used > 0:
            sb().table("transactions").insert({
                "tenant_id": tenant["id"], "user_id": user["id"],
                "type": "usage", "amount_inr": 0, "credits_delta": -credits_used,
                "status": "success", "notes": f"{body.scraper_type}: {body.query}",
            }).execute()

    sb().table("search_jobs").update({
        "status": "completed", "results_count": len(rows),
        "credits_used": credits_used,
        "completed_at": dt.datetime.utcnow().isoformat(),
    }).eq("id", job_id).execute()

    return {
        "job_id": job_id,
        "results_count": len(rows),
        "credits_used": credits_used,
        "results": rows,
    }


def _dispatch_scraper(body: SearchIn) -> list[dict]:
    stype = body.scraper_type
    google_key = get_effective_key("google_api_key", "GOOGLE_API_KEY")
    if stype == "google_maps":
        if not google_key:
            raise HTTPException(status_code=400, detail="Google API key not configured. Super admin must add it in Settings.")
        return scrape_google_maps(body.query, body.location or "", body.max_results, google_key, enrich_websites=True)
    if stype == "youtube":
        yt = get_effective_key("youtube_api_key", "GOOGLE_API_KEY") or google_key
        if not yt:
            raise HTTPException(status_code=400, detail="YouTube API key not configured")
        return scrape_youtube(body.query, body.max_results, yt)
    if stype == "google_search":
        serp = get_effective_key("serpapi_key")
        if not serp:
            raise HTTPException(status_code=400, detail="SerpAPI key not configured. Super admin must add it in Settings.")
        return scrape_google_search(body.query, body.max_results, serp)
    if stype == "website":
        info = scrape_website(body.query)
        info["name"] = info.get("source_url") or body.query
        info["website"] = info.get("source_url") or body.query
        info["category"] = "website"
        info["address"] = None
        info["city"] = None
        info["rating"] = None
        info["reviews_count"] = None
        info["latitude"] = None
        info["longitude"] = None
        info["extra"] = {}
        return [info]
    if stype == "ecommerce":
        info = scrape_ecommerce(body.query)
        info["city"] = None
        info["rating"] = None
        info["reviews_count"] = None
        info["latitude"] = None
        info["longitude"] = None
        return [info]
    if stype in ("instagram", "facebook"):
        apify = get_effective_key("apify_token")
        if not apify:
            raise HTTPException(status_code=400,
                detail=f"{stype.title()} scraper requires an Apify token. Super admin must add it in Settings.")
        # Placeholder for Apify integration (add actor call here when key is present)
        raise HTTPException(status_code=501,
            detail=f"Apify token detected but actor integration is pending. Contact support.")
    raise HTTPException(status_code=400, detail="Unknown scraper type")


@router.get("")
def list_searches(user: dict = Depends(get_current_user),
                  limit: int = Query(default=50, le=200)):
    if user["role"] == "super_admin":
        res = sb().table("search_jobs").select("*").order("created_at", desc=True).limit(limit).execute()
    else:
        if not user.get("tenant_id"):
            return {"searches": []}
        res = sb().table("search_jobs").select("*").eq("tenant_id", user["tenant_id"]).order("created_at", desc=True).limit(limit).execute()
    return {"searches": res.data or []}


@router.get("/{job_id}")
def get_search(job_id: str, user: dict = Depends(get_current_user)):
    job_res = sb().table("search_jobs").select("*").eq("id", job_id).limit(1).execute()
    if not job_res.data:
        raise HTTPException(status_code=404, detail="Search not found")
    job = job_res.data[0]
    if user["role"] != "super_admin" and job["tenant_id"] != user.get("tenant_id"):
        raise HTTPException(status_code=403, detail="Not your search")
    r = sb().table("search_results").select("*").eq("job_id", job_id).order("created_at", desc=False).execute()
    return {"job": job, "results": r.data or []}


@router.get("/{job_id}/export")
def export_search(job_id: str, format: str = Query(default="csv"),
                  user: dict = Depends(get_current_user)):
    job_res = sb().table("search_jobs").select("*").eq("id", job_id).limit(1).execute()
    if not job_res.data:
        raise HTTPException(status_code=404, detail="Search not found")
    job = job_res.data[0]
    if user["role"] != "super_admin" and job["tenant_id"] != user.get("tenant_id"):
        raise HTTPException(status_code=403, detail="Not your search")
    r = sb().table("search_results").select("*").eq("job_id", job_id).execute()
    rows = r.data or []

    df_cols = ["name", "phone", "email", "website", "address", "city",
               "category", "rating", "reviews_count",
               "instagram", "facebook", "linkedin", "twitter", "youtube", "whatsapp"]
    data = [{c: r.get(c) for c in df_cols} for r in rows]

    fname_base = f"nikki-scraper-{(job.get('scraper_type') or 'search')}-{job_id[:8]}"

    if format == "xlsx":
        df = pd.DataFrame(data, columns=df_cols)
        buf = io.BytesIO()
        with pd.ExcelWriter(buf, engine="openpyxl") as w:
            df.to_excel(w, index=False, sheet_name="Results")
        buf.seek(0)
        return StreamingResponse(
            buf,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{fname_base}.xlsx"'},
        )
    # default csv
    out = io.StringIO()
    w = csv.DictWriter(out, fieldnames=df_cols)
    w.writeheader()
    for row in data:
        w.writerow(row)
    out.seek(0)
    return StreamingResponse(
        iter([out.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{fname_base}.csv"'},
    )
