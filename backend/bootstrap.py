"""On backend startup, ensure super admin user exists with the static credentials."""
import os
import logging
from db import sb
from auth import hash_password

log = logging.getLogger("bootstrap")


def ensure_super_admin() -> None:
    email = os.environ.get("SUPER_ADMIN_EMAIL", "adexosindia@gmail.com").strip().lower()
    password = os.environ.get("SUPER_ADMIN_PASSWORD", "Karthi@20252026")
    c = sb()
    res = c.table("users").select("*").eq("email", email).limit(1).execute()
    if res.data:
        u = res.data[0]
        # Ensure role is super_admin and password matches current env value
        updates = {}
        if u.get("role") != "super_admin":
            updates["role"] = "super_admin"
        # Reset password to env value every boot (per user request: 'static')
        updates["password_hash"] = hash_password(password)
        updates["is_active"] = True
        c.table("users").update(updates).eq("id", u["id"]).execute()
        log.info(f"Super admin '{email}' ensured (updated).")
        return
    c.table("users").insert({
        "email": email,
        "full_name": "Nikki Tech Labs Super Admin",
        "password_hash": hash_password(password),
        "role": "super_admin",
        "tenant_id": None,
        "is_active": True,
    }).execute()
    log.info(f"Super admin '{email}' created.")


def ensure_dev_tenant() -> None:
    """Create a demo tenant + demo user for testing (only if DEV_MODE=true)."""
    if os.environ.get("DEV_MODE", "false").lower() != "true":
        return
    c = sb()
    demo_email = "demo@nikkitechlabs.com"
    exist = c.table("users").select("*").eq("email", demo_email).limit(1).execute()
    if exist.data:
        return
    # create tenant
    t = c.table("tenants").insert({
        "name": "Demo Tenant",
        "slug": "demo",
        "plan_code": "free",
        "credits_balance": 100,
    }).execute()
    tenant_id = t.data[0]["id"]
    c.table("users").insert({
        "email": demo_email,
        "full_name": "Demo User",
        "password_hash": hash_password("Demo@1234"),
        "role": "tenant_admin",
        "tenant_id": tenant_id,
        "is_active": True,
    }).execute()
    log.info("Demo tenant + demo user created.")
