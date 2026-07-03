"""Support ticket routes (tenant + super admin)."""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
import datetime as dt

from db import sb
from auth import get_current_user, require_super_admin

router = APIRouter(prefix="/support", tags=["support"])


class TicketCreate(BaseModel):
    subject: str = Field(min_length=3, max_length=200)
    message: str = Field(min_length=5, max_length=5000)
    priority: str = Field(default="normal", pattern="^(low|normal|high|urgent)$")


class MessageIn(BaseModel):
    message: str = Field(min_length=1, max_length=5000)


class TicketUpdate(BaseModel):
    status: str | None = Field(default=None, pattern="^(open|in_progress|resolved|closed)$")
    priority: str | None = Field(default=None, pattern="^(low|normal|high|urgent)$")


@router.post("/tickets")
def create_ticket(body: TicketCreate, user: dict = Depends(get_current_user)):
    if user["role"] == "super_admin":
        raise HTTPException(status_code=400, detail="Super admin cannot open tickets")
    if not user.get("tenant_id"):
        raise HTTPException(status_code=400, detail="No tenant associated")
    t = sb().table("support_tickets").insert({
        "tenant_id": user["tenant_id"], "user_id": user["id"],
        "subject": body.subject, "priority": body.priority, "status": "open",
    }).execute().data[0]
    sb().table("ticket_messages").insert({
        "ticket_id": t["id"], "author_id": user["id"], "author_role": "tenant",
        "message": body.message,
    }).execute()
    return {"ticket": t}


@router.get("/tickets")
def list_my_tickets(user: dict = Depends(get_current_user)):
    if user["role"] == "super_admin":
        raise HTTPException(status_code=400, detail="Use /admin/tickets")
    if not user.get("tenant_id"):
        return {"tickets": []}
    r = sb().table("support_tickets").select("*").eq("tenant_id", user["tenant_id"]).order("created_at", desc=True).execute()
    return {"tickets": r.data or []}


@router.get("/tickets/{ticket_id}")
def get_ticket(ticket_id: str, user: dict = Depends(get_current_user)):
    t = sb().table("support_tickets").select("*").eq("id", ticket_id).limit(1).execute()
    if not t.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket = t.data[0]
    if user["role"] != "super_admin" and ticket["tenant_id"] != user.get("tenant_id"):
        raise HTTPException(status_code=403, detail="Not your ticket")
    msgs = sb().table("ticket_messages").select("*").eq("ticket_id", ticket_id).order("created_at", desc=False).execute()
    return {"ticket": ticket, "messages": msgs.data or []}


@router.post("/tickets/{ticket_id}/reply")
def reply(ticket_id: str, body: MessageIn, user: dict = Depends(get_current_user)):
    t = sb().table("support_tickets").select("*").eq("id", ticket_id).limit(1).execute()
    if not t.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket = t.data[0]
    role = user["role"]
    if role != "super_admin" and ticket["tenant_id"] != user.get("tenant_id"):
        raise HTTPException(status_code=403, detail="Not your ticket")
    author_role = "super_admin" if role == "super_admin" else "tenant"
    m = sb().table("ticket_messages").insert({
        "ticket_id": ticket_id, "author_id": user["id"],
        "author_role": author_role, "message": body.message,
    }).execute().data[0]
    # Auto-move to in_progress when admin replies to an open ticket
    if role == "super_admin" and ticket["status"] == "open":
        sb().table("support_tickets").update({"status": "in_progress"}).eq("id", ticket_id).execute()
    sb().table("support_tickets").update({"updated_at": dt.datetime.utcnow().isoformat()}).eq("id", ticket_id).execute()
    return {"message": m}


# ---------- Super admin ----------
admin_router = APIRouter(prefix="/admin", tags=["admin-support"])


@admin_router.get("/tickets")
def admin_list(status: str | None = Query(default=None),
               user: dict = Depends(require_super_admin)):
    q = sb().table("support_tickets").select("*").order("created_at", desc=True)
    if status:
        q = q.eq("status", status)
    r = q.execute()
    tickets = r.data or []
    # attach tenant name
    if tickets:
        tenant_ids = list({t["tenant_id"] for t in tickets})
        tn = sb().table("tenants").select("id,name").in_("id", tenant_ids).execute()
        tmap = {x["id"]: x["name"] for x in (tn.data or [])}
        for t in tickets:
            t["tenant_name"] = tmap.get(t["tenant_id"])
    return {"tickets": tickets}


@admin_router.patch("/tickets/{ticket_id}")
def admin_update_ticket(ticket_id: str, body: TicketUpdate,
                        user: dict = Depends(require_super_admin)):
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    r = sb().table("support_tickets").update(updates).eq("id", ticket_id).execute()
    if not r.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    sb().table("audit_logs").insert({
        "actor_id": user["id"], "actor_email": user["email"],
        "action": "ticket.update", "target_type": "ticket",
        "target_id": ticket_id, "details": updates,
    }).execute()
    return {"ticket": r.data[0]}
