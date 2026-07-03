"""Auth: super admin password login, tenant email/pw signup+login, Google OAuth."""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field
import datetime as dt

from db import sb
from auth import (verify_password, hash_password, issue_jwt,
                  verify_google_id_token, get_current_user)

router = APIRouter(prefix="/auth", tags=["auth"])


class PasswordLoginIn(BaseModel):
    email: EmailStr
    password: str


class SignupIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2, max_length=80)
    company: str | None = None


class GoogleLoginIn(BaseModel):
    id_token: str


def _login_response(user: dict) -> dict:
    tenant = None
    if user.get("tenant_id"):
        t = sb().table("tenants").select("*").eq("id", user["tenant_id"]).limit(1).execute()
        tenant = t.data[0] if t.data else None
    token = issue_jwt(user["id"], user["email"], user["role"], user.get("tenant_id"))
    # touch last_login
    sb().table("users").update({"last_login_at": dt.datetime.utcnow().isoformat()}).eq("id", user["id"]).execute()
    return {"token": token, "user": user, "tenant": tenant}


@router.post("/login")
def password_login(body: PasswordLoginIn):
    """Password login. Used for super admin (and dev tenant if DEV_MODE)."""
    email = body.email.strip().lower()
    res = sb().table("users").select("*").eq("email", email).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    u = res.data[0]
    if not u.get("password_hash"):
        raise HTTPException(status_code=401, detail="This account uses Google sign-in")
    if not verify_password(body.password, u["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not u.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is disabled")
    return _login_response(u)


@router.post("/signup")
def signup(body: SignupIn):
    """Email/password signup that auto-creates a tenant. Used when no Google OAuth configured."""
    email = body.email.strip().lower()
    exist = sb().table("users").select("id").eq("email", email).limit(1).execute()
    if exist.data:
        raise HTTPException(status_code=409, detail="Email already registered. Please log in.")
    # Fetch free trial credits from platform_settings
    ps = sb().table("platform_settings").select("free_trial_credits").limit(1).execute()
    ftc = (ps.data[0] if ps.data else {}).get("free_trial_credits", 25)
    # Create tenant
    tname = body.company or (body.full_name + "'s workspace")
    slug_base = tname.lower().replace(" ", "-").replace("'", "")[:40]
    # ensure slug unique
    slug = slug_base
    i = 1
    while sb().table("tenants").select("id").eq("slug", slug).limit(1).execute().data:
        slug = f"{slug_base}-{i}"
        i += 1
    t = sb().table("tenants").insert({
        "name": tname, "slug": slug, "plan_code": "free",
        "credits_balance": ftc, "is_active": True,
    }).execute()
    tenant_id = t.data[0]["id"]
    u = sb().table("users").insert({
        "email": email,
        "full_name": body.full_name,
        "password_hash": hash_password(body.password),
        "role": "tenant_admin",
        "tenant_id": tenant_id,
        "is_active": True,
    }).execute().data[0]
    return _login_response(u)


@router.post("/google")
def google_oauth(body: GoogleLoginIn):
    info = verify_google_id_token(body.id_token)
    email = info["email"].strip().lower()
    google_sub = info.get("sub")
    full_name = info.get("name") or email.split("@")[0]
    picture = info.get("picture")

    res = sb().table("users").select("*").eq("email", email).limit(1).execute()
    if res.data:
        u = res.data[0]
        # link google_sub if not present
        if not u.get("google_sub") and google_sub:
            sb().table("users").update({"google_sub": google_sub, "avatar_url": picture}).eq("id", u["id"]).execute()
            u["google_sub"] = google_sub
        if not u.get("is_active", True):
            raise HTTPException(status_code=403, detail="Account disabled")
        return _login_response(u)
    # New user: auto-create tenant
    ps = sb().table("platform_settings").select("free_trial_credits").limit(1).execute()
    ftc = (ps.data[0] if ps.data else {}).get("free_trial_credits", 25)
    slug_base = email.split("@")[0].lower().replace(".", "-")[:40]
    slug = slug_base
    i = 1
    while sb().table("tenants").select("id").eq("slug", slug).limit(1).execute().data:
        slug = f"{slug_base}-{i}"; i += 1
    t = sb().table("tenants").insert({
        "name": full_name + "'s workspace", "slug": slug,
        "plan_code": "free", "credits_balance": ftc, "is_active": True,
    }).execute()
    tenant_id = t.data[0]["id"]
    u = sb().table("users").insert({
        "email": email, "full_name": full_name, "avatar_url": picture,
        "google_sub": google_sub, "role": "tenant_admin",
        "tenant_id": tenant_id, "is_active": True,
    }).execute().data[0]
    return _login_response(u)


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    tenant = None
    if user.get("tenant_id"):
        t = sb().table("tenants").select("*").eq("id", user["tenant_id"]).limit(1).execute()
        tenant = t.data[0] if t.data else None
    return {"user": user, "tenant": tenant}
