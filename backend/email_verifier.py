"""Email verification via DNS MX + SMTP handshake.

No third-party API needed. Works for ~80% of emails.
Returns: 'valid', 'invalid', 'catch_all', or 'unknown'.
"""
import re
import socket
import smtplib
import logging
from functools import lru_cache

log = logging.getLogger("email_verifier")

# Simple cache so we don't re-verify the same email in one process lifetime
_cache: dict[str, str] = {}

EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


@lru_cache(maxsize=500)
def _get_mx(domain: str) -> list[str]:
    """Resolve MX records for a domain. Returns list of mail server hostnames."""
    try:
        import dns.resolver
        answers = dns.resolver.resolve(domain, "MX")
        # Sort by priority (lowest = best)
        mx_list = sorted(answers, key=lambda x: x.preference)
        return [str(r.exchange).rstrip(".") for r in mx_list]
    except Exception as e:
        log.debug(f"MX lookup failed for {domain}: {e}")
        return []


def _smtp_check(email: str, mx_host: str, timeout: float = 10.0) -> str:
    """
    Perform SMTP handshake to check if email exists.
    Returns: 'valid', 'invalid', 'catch_all', or 'unknown'.
    """
    try:
        with smtplib.SMTP(mx_host, 25, timeout=timeout) as smtp:
            smtp.helo("ineedleads.com")
            smtp.mail("verify@ineedleads.com")
            code, _ = smtp.rcpt(email)
            if code == 250:
                return "valid"
            elif code == 550 or code == 551 or code == 553:
                return "invalid"
            elif code == 252:
                return "catch_all"
            else:
                return "unknown"
    except smtplib.SMTPServerDisconnected:
        return "unknown"
    except smtplib.SMTPConnectError:
        return "unknown"
    except socket.timeout:
        return "unknown"
    except Exception as e:
        log.debug(f"SMTP check failed for {email} via {mx_host}: {e}")
        return "unknown"


def verify_email(email: str) -> dict:
    """
    Verify a single email address.
    Returns dict: {email, status, mx_host}
    """
    email = email.strip().lower()

    # Check cache
    if email in _cache:
        return {"email": email, "status": _cache[email], "mx_host": None}

    # Validate format
    if not EMAIL_RE.match(email):
        result = {"email": email, "status": "invalid", "mx_host": None}
        _cache[email] = "invalid"
        return result

    domain = email.split("@")[1]

    # Known free providers — skip SMTP (they always return catch_all or block)
    FREE_PROVIDERS = {"gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
                      "live.com", "aol.com", "icloud.com", "me.com",
                      "protonmail.com", "zoho.com", "yandex.com", "mail.com",
                      "gmx.com", "fastmail.com", "tutanota.com", "rediffmail.com"}
    if domain in FREE_PROVIDERS:
        result = {"email": email, "status": "catch_all", "mx_host": domain}
        _cache[email] = "catch_all"
        return result

    # Get MX records
    mx_hosts = _get_mx(domain)
    if not mx_hosts:
        result = {"email": email, "status": "invalid", "mx_host": None}
        _cache[email] = "invalid"
        return result

    # Try SMTP check with first available MX
    for mx in mx_hosts[:2]:
        status = _smtp_check(email, mx)
        if status != "unknown":
            _cache[email] = status
            return {"email": email, "status": status, "mx_host": mx}

    _cache[email] = "unknown"
    return {"email": email, "status": "unknown", "mx_host": mx_hosts[0] if mx_hosts else None}


def verify_emails_batch(emails: list[str]) -> list[dict]:
    """Verify a batch of emails. Returns list of verification results."""
    results = []
    for email in emails:
        if not email:
            continue
        try:
            r = verify_email(email)
            results.append(r)
        except Exception as e:
            log.warning(f"Verification error for {email}: {e}")
            results.append({"email": email, "status": "unknown", "mx_host": None})
    return results
