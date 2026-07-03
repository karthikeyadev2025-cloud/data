"""JWT + password + user resolution helpers."""
import os
import datetime as dt
from typing import Optional
from fastapi import HTTPException, Header, Depends
from passlib.context import CryptContext
from jose import jwt, JWTError
import httpx

from db import sb

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret")
JWT_ALGO = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXP_HOURS = int(os.environ.get("JWT_EXPIRE_HOURS", "168"))


def hash_password(p: str) -> str:
    return pwd.hash(p)


def verify_password(p: str, hashed: str) -> bool:
    try:
        return pwd.verify(p, hashed)
    except Exception:
        return False


def issue_jwt(user_id: str, email: str, role: str, tenant_id: str | None) -> str:
    payload = {
        "sub": user_id, "email": email, "role": role,
        "tenant_id": tenant_id,
        "iat": dt.datetime.utcnow(),
        "exp": dt.datetime.utcnow() + dt.timedelta(hours=JWT_EXP_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def decode_jwt(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


def get_current_user(authorization: Optional[str] = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    payload = decode_jwt(token)
    # fetch fresh user to guarantee active + latest role
    res = sb().table("users").select("*").eq("id", payload["sub"]).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=401, detail="User no longer exists")
    u = res.data[0]
    if not u.get("is_active", True):
        raise HTTPException(status_code=403, detail="User is disabled")
    return u


def require_super_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin only")
    return user


# ---------- Google OAuth ID token verification ----------
def verify_google_id_token(id_token: str) -> dict:
    """Verify a Google ID token via Google's tokeninfo endpoint (no client secret needed).
    Returns dict with sub, email, name, picture, aud, email_verified.
    """
    with httpx.Client(timeout=8) as c:
        r = c.get("https://oauth2.googleapis.com/tokeninfo", params={"id_token": id_token})
        if r.status_code != 200:
            raise HTTPException(status_code=401, detail=f"Google token invalid: {r.text[:200]}")
        data = r.json()
    if not data.get("email_verified") == "true" and not data.get("email_verified") is True:
        # tokeninfo returns 'true' as string sometimes
        if str(data.get("email_verified", "")).lower() != "true":
            raise HTTPException(status_code=401, detail="Google email not verified")
    return data
