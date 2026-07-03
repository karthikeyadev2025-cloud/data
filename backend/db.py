"""Supabase client wrapper. Uses SERVICE_ROLE_KEY on backend (bypasses RLS)."""
import os
from functools import lru_cache
from supabase import create_client, Client


@lru_cache(maxsize=1)
def sb() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


def get_platform_settings() -> dict:
    """Fetches the single platform_settings row. Auto-creates if missing."""
    c = sb()
    res = c.table("platform_settings").select("*").limit(1).execute()
    if res.data:
        return res.data[0]
    # bootstrap
    ins = c.table("platform_settings").insert({
        "brand_name": "Nikki Tech Labs",
        "footer_text": "An innovation by Nikki Tech Labs",
        "free_trial_credits": 25,
    }).execute()
    return ins.data[0]


def get_effective_key(key_field: str, env_fallback: str | None = None) -> str | None:
    """Return API key: super-admin-managed value first, else env fallback."""
    settings = get_platform_settings()
    val = settings.get(key_field)
    if val:
        return val
    if env_fallback:
        return os.environ.get(env_fallback)
    return None
