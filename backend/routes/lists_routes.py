"""Lead Lists CRUD: create, list, update, delete lists + manage items + export."""
import io
import csv
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional
import pandas as pd

from db import sb
from auth import get_current_user

router = APIRouter(prefix="/lists", tags=["lists"])


# ── Models ──────────────────────────────────────────
class ListCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    color: str = "#0EA5A4"

class ListUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None

class ItemsAdd(BaseModel):
    result_ids: list[str] = Field(min_length=1, max_length=500)

class ItemsRemove(BaseModel):
    item_ids: list[str] = Field(min_length=1, max_length=500)


def _tenant_id(user: dict) -> str:
    if user["role"] == "super_admin":
        raise HTTPException(400, "Super admin cannot manage lead lists")
    tid = user.get("tenant_id")
    if not tid:
        raise HTTPException(400, "No tenant")
    return tid


def _own_list(list_id: str, tid: str) -> dict:
    r = sb().table("lead_lists").select("*").eq("id", list_id).eq("tenant_id", tid).limit(1).execute()
    if not r.data:
        raise HTTPException(404, "List not found")
    return r.data[0]


def _refresh_count(list_id: str):
    """Update the cached count on a lead list."""
    r = sb().table("lead_list_items").select("id", count="exact").eq("list_id", list_id).execute()
    sb().table("lead_lists").update({"count": r.count or 0}).eq("id", list_id).execute()


# ── CRUD ────────────────────────────────────────────
@router.get("")
def list_lists(user: dict = Depends(get_current_user)):
    tid = _tenant_id(user)
    r = sb().table("lead_lists").select("*").eq("tenant_id", tid).order("created_at", desc=True).execute()
    return {"lists": r.data or []}


@router.post("")
def create_list(body: ListCreate, user: dict = Depends(get_current_user)):
    tid = _tenant_id(user)
    row = sb().table("lead_lists").insert({
        "tenant_id": tid,
        "user_id": user["id"],
        "name": body.name,
        "description": body.description,
        "color": body.color,
    }).execute()
    return row.data[0]


@router.get("/{list_id}")
def get_list(list_id: str, user: dict = Depends(get_current_user)):
    tid = _tenant_id(user)
    lst = _own_list(list_id, tid)
    # Fetch items with joined result data
    items = sb().table("lead_list_items").select(
        "id,result_id,notes,created_at,search_results(id,name,phone,email,website,address,city,category,rating,reviews_count,instagram,facebook,linkedin,twitter,youtube,whatsapp,extra)"
    ).eq("list_id", list_id).order("created_at", desc=True).execute()
    return {"list": lst, "items": items.data or []}


@router.patch("/{list_id}")
def update_list(list_id: str, body: ListUpdate, user: dict = Depends(get_current_user)):
    tid = _tenant_id(user)
    _own_list(list_id, tid)
    updates = {k: v for k, v in body.dict(exclude_none=True).items()}
    if not updates:
        raise HTTPException(400, "Nothing to update")
    r = sb().table("lead_lists").update(updates).eq("id", list_id).execute()
    return r.data[0] if r.data else {"ok": True}


@router.delete("/{list_id}")
def delete_list(list_id: str, user: dict = Depends(get_current_user)):
    tid = _tenant_id(user)
    _own_list(list_id, tid)
    sb().table("lead_lists").delete().eq("id", list_id).execute()
    return {"ok": True}


# ── Items ───────────────────────────────────────────
@router.post("/{list_id}/items")
def add_items(list_id: str, body: ItemsAdd, user: dict = Depends(get_current_user)):
    tid = _tenant_id(user)
    _own_list(list_id, tid)
    added = 0
    for rid in body.result_ids:
        try:
            sb().table("lead_list_items").insert({
                "list_id": list_id,
                "result_id": rid,
            }).execute()
            added += 1
        except Exception:
            pass  # duplicate — skip
    _refresh_count(list_id)
    return {"added": added}


@router.delete("/{list_id}/items")
def remove_items(list_id: str, body: ItemsRemove, user: dict = Depends(get_current_user)):
    tid = _tenant_id(user)
    _own_list(list_id, tid)
    for iid in body.item_ids:
        sb().table("lead_list_items").delete().eq("id", iid).eq("list_id", list_id).execute()
    _refresh_count(list_id)
    return {"ok": True}


@router.patch("/{list_id}/items/{item_id}/notes")
def update_item_notes(list_id: str, item_id: str, body: dict, user: dict = Depends(get_current_user)):
    tid = _tenant_id(user)
    _own_list(list_id, tid)
    sb().table("lead_list_items").update({"notes": body.get("notes", "")}).eq("id", item_id).eq("list_id", list_id).execute()
    return {"ok": True}


# ── Export ──────────────────────────────────────────
@router.get("/{list_id}/export")
def export_list(list_id: str, format: str = Query(default="csv"), user: dict = Depends(get_current_user)):
    tid = _tenant_id(user)
    lst = _own_list(list_id, tid)
    items = sb().table("lead_list_items").select(
        "notes,search_results(name,phone,email,website,address,city,category,rating,reviews_count,instagram,facebook,linkedin,twitter,youtube,whatsapp)"
    ).eq("list_id", list_id).execute()

    rows = []
    for it in (items.data or []):
        r = it.get("search_results") or {}
        r["notes"] = it.get("notes") or ""
        rows.append(r)

    df_cols = ["name", "phone", "email", "website", "address", "city",
               "category", "rating", "reviews_count",
               "instagram", "facebook", "linkedin", "twitter", "youtube", "whatsapp", "notes"]
    data = [{c: r.get(c) for c in df_cols} for r in rows]
    safe_name = lst["name"].replace(" ", "-")[:30]
    fname = f"ineedleads-list-{safe_name}"

    if format == "xlsx":
        df = pd.DataFrame(data, columns=df_cols)
        buf = io.BytesIO()
        with pd.ExcelWriter(buf, engine="openpyxl") as w:
            df.to_excel(w, index=False, sheet_name="Leads")
        buf.seek(0)
        return StreamingResponse(buf, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                 headers={"Content-Disposition": f'attachment; filename="{fname}.xlsx"'})

    # CSV default
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=df_cols)
    writer.writeheader()
    writer.writerows(data)
    buf.seek(0)
    return StreamingResponse(io.BytesIO(buf.getvalue().encode()), media_type="text/csv",
                             headers={"Content-Disposition": f'attachment; filename="{fname}.csv"'})
