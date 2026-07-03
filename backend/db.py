"""Supabase client wrapper. Uses SERVICE_ROLE_KEY on backend (bypasses RLS).
Forces HTTP/1.1 on the underlying httpx client to avoid intermittent HTTP/2
"Server disconnected" resets from Supabase.
"""
import os
import time
import logging
import httpx
from supabase import create_client, Client
from supabase.client import ClientOptions
from postgrest import SyncPostgrestClient

log = logging.getLogger("db")

_client_state = {"client": None, "created_at": 0}


def _force_http1_on_supabase(client: Client) -> None:
    """Replace the internal httpx clients with HTTP/1.1-only versions.
    This prevents the recurring 'HTTP/2 Server disconnected' error we've seen
    from Supabase's pooler at low RPS.
    """
    try:
        # PostgREST client (used for .table() operations)
        pg: SyncPostgrestClient = client.postgrest
        # Recreate the underlying session with http2=False + connection recycling
        headers = dict(pg.session.headers)
        base_url = str(pg.session.base_url)
        pg.session.aclose() if hasattr(pg.session, "aclose") else pg.session.close()
        pg.session = httpx.Client(
            base_url=base_url,
            headers=headers,
            http2=False,
            timeout=httpx.Timeout(20.0, connect=8.0),
            limits=httpx.Limits(max_keepalive_connections=5, keepalive_expiry=15.0),
        )
    except Exception as e:
        log.warning(f"Could not tune Supabase httpx client: {e}")


def sb() -> Client:
    now = time.time()
    if not _client_state["client"] or (now - _client_state["created_at"]) > 900:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        opts = ClientOptions(auto_refresh_token=False, persist_session=False)
        c = create_client(url, key, options=opts)
        _force_http1_on_supabase(c)
        _client_state["client"] = c
        _client_state["created_at"] = now
    return _client_state["client"]


def reset_sb():
    _client_state["client"] = None


def _retry(fn, *args, **kwargs):
    """Run a Supabase call with 1 automatic retry after client reset."""
    try:
        return fn(*args, **kwargs)
    except (httpx.RemoteProtocolError, httpx.ConnectError, httpx.ReadError) as e:
        log.warning(f"Transient Supabase error: {e}; retrying once with fresh client")
        reset_sb()
        return fn(*args, **kwargs)


def get_platform_settings() -> dict:
    def _fetch():
        return sb().table("platform_settings").select("*").limit(1).execute()
    res = _retry(_fetch)
    if res.data:
        return res.data[0]
    ins = sb().table("platform_settings").insert({
        "brand_name": "Nikki Tech Labs",
        "footer_text": "An innovation by Nikki Tech Labs",
        "free_trial_credits": 25,
    }).execute()
    return ins.data[0]


def get_effective_key(key_field: str, env_fallback: str | None = None) -> str | None:
    try:
        settings = get_platform_settings()
    except Exception:
        settings = {}
    val = settings.get(key_field)
    if val:
        return val
    if env_fallback:
        return os.environ.get(env_fallback)
    return None
