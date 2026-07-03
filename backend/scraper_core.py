"""
Nikki Tech Labs — Unified Scraper Core
All scraper modules in one place. Every function returns list[dict] with a
normalized shape so results can be stored in `search_results` table cleanly.

SCRAPERS:
  - scrape_google_maps(query, location, max_results, api_key) -> [BusinessRow]
  - scrape_youtube(query, max_results, api_key) -> [VideoRow]
  - scrape_website(url) -> single enriched dict (email, phone, socials)
  - scrape_ecommerce(url) -> product dict (name, price, images, description)
  - scrape_google_search(query, max_results, serpapi_key) -> [SearchRow] (needs SerpAPI key)

All functions are sync but call external HTTP quickly and defensively.
"""
from __future__ import annotations
import re
import json
import time
import logging
from typing import Any
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

log = logging.getLogger("scraper")

# ---------- Regex + Constants ----------
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE_RE = re.compile(r"\+?\d[\d\-\s().]{7,}\d")
CONTACT_PATHS = ["/contact", "/contact-us", "/contacts", "/about", "/about-us",
                 "/support", "/help", "/reach-us"]
SOCIAL_PATTERNS = {
    "instagram": re.compile(r"https?://(?:www\.)?instagram\.com/[A-Za-z0-9_.\-/?=&]+", re.I),
    "facebook":  re.compile(r"https?://(?:www\.)?facebook\.com/[A-Za-z0-9_.\-/?=&]+", re.I),
    "linkedin":  re.compile(r"https?://(?:[a-z]+\.)?linkedin\.com/[A-Za-z0-9_.\-/?=&]+", re.I),
    "twitter":   re.compile(r"https?://(?:www\.)?(?:twitter|x)\.com/[A-Za-z0-9_.\-/?=&]+", re.I),
    "youtube":   re.compile(r"https?://(?:www\.)?youtube\.com/[A-Za-z0-9_.\-/?=&@]+", re.I),
    "whatsapp":  re.compile(r"https?://(?:wa\.me|api\.whatsapp\.com|whatsapp\.com/send)[A-Za-z0-9_./?=&+\-]*", re.I),
}
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; NikkiScraperBot/1.0; +https://nikki-tech-labs)",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}


# ======================================================================
# 1. Website enrichment — email + phone + social handles from any URL
# ======================================================================
def _fetch(url: str, timeout: float = 8.0) -> str | None:
    try:
        with httpx.Client(follow_redirects=True, timeout=timeout, verify=False,
                          headers=HEADERS) as c:
            r = c.get(url)
            if r.status_code == 200 and r.text:
                return r.text
    except Exception as e:
        log.debug(f"fetch failed {url}: {e}")
    return None


def _extract_from_html(html: str) -> dict:
    out: dict[str, Any] = {"email": None, "phone": None,
                           "instagram": None, "facebook": None,
                           "linkedin": None, "twitter": None,
                           "youtube": None, "whatsapp": None}
    # emails
    emails = list({e.strip().lower() for e in EMAIL_RE.findall(html)
                   if not any(bad in e.lower() for bad in
                              ["example.com", "sentry.io", "wixpress", "@2x", ".png", ".jpg"])})
    if emails:
        out["email"] = emails[0]
    # phones (from html text — very rough; page phone often better than google)
    ph = PHONE_RE.findall(html)
    if ph:
        # pick longest
        best = max(ph, key=lambda x: len(re.sub(r"\D", "", x)))
        digits = re.sub(r"\D", "", best)
        if 10 <= len(digits) <= 15:
            out["phone"] = best.strip()
    # socials
    for key, pat in SOCIAL_PATTERNS.items():
        m = pat.search(html)
        if m:
            url = m.group(0).rstrip("\"'<>)")
            # skip share/intent links
            if "share" in url or "intent" in url or "sharer" in url:
                continue
            out[key] = url
    return out


def scrape_website(url: str) -> dict:
    """Fetch homepage + one contact page and extract contact info."""
    result = {"source_url": url, "email": None, "phone": None,
              "instagram": None, "facebook": None, "linkedin": None,
              "twitter": None, "youtube": None, "whatsapp": None}
    if not url:
        return result
    # normalize
    if not url.startswith("http"):
        url = "https://" + url
    # 1) homepage
    html = _fetch(url)
    if html:
        for k, v in _extract_from_html(html).items():
            if v and not result.get(k):
                result[k] = v
    # 2) try one contact page if we lack email
    if not result["email"]:
        parsed = urlparse(url)
        base = f"{parsed.scheme}://{parsed.netloc}"
        for path in CONTACT_PATHS[:3]:
            html2 = _fetch(urljoin(base, path), timeout=6.0)
            if html2:
                for k, v in _extract_from_html(html2).items():
                    if v and not result.get(k):
                        result[k] = v
                if result["email"]:
                    break
    return result


# ======================================================================
# 2. Google Maps Scraper — Places API (New) v1 (real, legal, future-proof)
# ======================================================================
PLACES_NEW_SEARCH = "https://places.googleapis.com/v1/places:searchText"
PLACES_NEW_DETAILS_BASE = "https://places.googleapis.com/v1/places"

# All useful fields for a business listing (New API uses camelCase field mask)
_PLACES_FIELD_MASK = (
    "places.id,places.displayName,places.formattedAddress,"
    "places.internationalPhoneNumber,places.nationalPhoneNumber,"
    "places.websiteUri,places.rating,places.userRatingCount,"
    "places.types,places.primaryType,places.location,"
    "places.googleMapsUri,places.businessStatus,"
    "places.regularOpeningHours.weekdayDescriptions,"
    "nextPageToken"
)


def scrape_google_maps(query: str, location: str = "", max_results: int = 20,
                      api_key: str | None = None,
                      enrich_websites: bool = True) -> list[dict]:
    """Returns list of businesses with contact + social info.
    Uses Google Places API (New) v1 which is the current recommended API.
    """
    if not api_key:
        raise ValueError("google api_key required")
    q = f"{query} in {location}" if location else query
    log.info(f"[google_maps] query='{q}' max={max_results}")

    all_places: list[dict] = []
    page_token: str | None = None
    with httpx.Client(timeout=25) as c:
        while len(all_places) < max_results:
            body: dict[str, Any] = {"textQuery": q, "pageSize": min(20, max_results - len(all_places))}
            if page_token:
                body["pageToken"] = page_token
                time.sleep(2)  # New API also requires a brief pause between pages
            r = c.post(PLACES_NEW_SEARCH,
                       headers={"Content-Type": "application/json",
                                "X-Goog-Api-Key": api_key,
                                "X-Goog-FieldMask": _PLACES_FIELD_MASK},
                       json=body)
            if r.status_code != 200:
                # Bubble up Google's error message so it's easy to fix
                raise RuntimeError(f"Places API (New) error {r.status_code}: {r.text[:400]}")
            data = r.json()
            batch = data.get("places", []) or []
            if not batch:
                break
            all_places.extend(batch)
            page_token = data.get("nextPageToken")
            if not page_token:
                break

    all_places = all_places[:max_results]

    rows: list[dict] = []
    for p in all_places:
        loc = p.get("location") or {}
        row = {
            "name": (p.get("displayName") or {}).get("text") if isinstance(p.get("displayName"), dict) else p.get("displayName"),
            "phone": p.get("internationalPhoneNumber") or p.get("nationalPhoneNumber"),
            "email": None,
            "website": p.get("websiteUri"),
            "address": p.get("formattedAddress"),
            "city": location or None,
            "category": p.get("primaryType") or (p.get("types") or [None])[0],
            "rating": p.get("rating"),
            "reviews_count": p.get("userRatingCount"),
            "latitude": loc.get("latitude"),
            "longitude": loc.get("longitude"),
            "instagram": None, "facebook": None, "linkedin": None,
            "twitter": None, "youtube": None, "whatsapp": None,
            "extra": {
                "google_maps_url": p.get("googleMapsUri"),
                "place_id": p.get("id"),
                "types": p.get("types") or [],
                "business_status": p.get("businessStatus"),
                "opening_hours": (p.get("regularOpeningHours") or {}).get("weekdayDescriptions") or [],
            },
        }

        if enrich_websites and row["website"]:
            try:
                enrich = scrape_website(row["website"])
                for k in ["email", "instagram", "facebook", "linkedin",
                          "twitter", "youtube", "whatsapp"]:
                    if enrich.get(k):
                        row[k] = enrich[k]
                if not row["phone"] and enrich.get("phone"):
                    row["phone"] = enrich["phone"]
            except Exception as e:
                log.debug(f"enrich failed for {row['website']}: {e}")

        rows.append(row)
        log.info(f"  ✓ {row['name']} | ph={bool(row['phone'])} em={bool(row['email'])} ig={bool(row['instagram'])}")

    return rows


# ======================================================================
# 3. YouTube Scraper — YouTube Data API v3
# ======================================================================
def scrape_youtube(query: str, max_results: int = 20,
                  api_key: str | None = None) -> list[dict]:
    if not api_key:
        raise ValueError("youtube api_key required (google api key with YouTube Data API v3 enabled)")
    log.info(f"[youtube] query='{query}' max={max_results}")
    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": query,
        "maxResults": min(max_results, 50),
        "type": "video",
        "key": api_key,
    }
    with httpx.Client(timeout=15) as c:
        r = c.get(url, params=params)
        r.raise_for_status()
        data = r.json()
    items = data.get("items", [])[:max_results]

    # get statistics in one call
    video_ids = [it["id"]["videoId"] for it in items if it.get("id", {}).get("videoId")]
    stats_map: dict[str, dict] = {}
    if video_ids:
        with httpx.Client(timeout=15) as c:
            s = c.get("https://www.googleapis.com/youtube/v3/videos", params={
                "part": "statistics,contentDetails",
                "id": ",".join(video_ids),
                "key": api_key,
            })
            s.raise_for_status()
            for it in s.json().get("items", []):
                stats_map[it["id"]] = it

    rows = []
    for it in items:
        vid = it.get("id", {}).get("videoId")
        sn = it.get("snippet", {})
        st = stats_map.get(vid, {}).get("statistics", {})
        rows.append({
            "name": sn.get("title"),
            "category": "youtube_video",
            "website": f"https://youtube.com/watch?v={vid}" if vid else None,
            "youtube": f"https://youtube.com/channel/{sn.get('channelId')}" if sn.get("channelId") else None,
            "phone": None, "email": None, "address": None,
            "instagram": None, "facebook": None, "linkedin": None,
            "twitter": None, "whatsapp": None,
            "extra": {
                "video_id": vid,
                "channel_id": sn.get("channelId"),
                "channel_title": sn.get("channelTitle"),
                "description": (sn.get("description") or "")[:500],
                "published_at": sn.get("publishedAt"),
                "thumbnail": sn.get("thumbnails", {}).get("high", {}).get("url"),
                "views": st.get("viewCount"),
                "likes": st.get("likeCount"),
                "comments": st.get("commentCount"),
            },
        })
    return rows


# ======================================================================
# 4. E-commerce / generic product scraper
# ======================================================================
def scrape_ecommerce(url: str) -> dict:
    """Extract product info from a public product URL using OpenGraph + LD-JSON."""
    result = {
        "name": None, "website": url, "category": "product",
        "phone": None, "email": None, "address": None,
        "instagram": None, "facebook": None, "linkedin": None,
        "twitter": None, "youtube": None, "whatsapp": None,
        "extra": {"price": None, "currency": None, "image": None,
                  "brand": None, "description": None, "availability": None}
    }
    html = _fetch(url, timeout=12)
    if not html:
        return result
    soup = BeautifulSoup(html, "html.parser")

    def meta(prop):
        t = soup.find("meta", attrs={"property": prop}) or soup.find("meta", attrs={"name": prop})
        return t.get("content") if t else None

    result["name"] = meta("og:title") or (soup.title.string.strip() if soup.title and soup.title.string else None)
    result["extra"]["description"] = meta("og:description") or meta("description")
    result["extra"]["image"] = meta("og:image")

    # ld+json
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string or "{}")
            if isinstance(data, list):
                data = next((d for d in data if isinstance(d, dict) and
                             str(d.get("@type", "")).lower() == "product"), None)
            if data and str(data.get("@type", "")).lower() == "product":
                result["name"] = result["name"] or data.get("name")
                result["extra"]["brand"] = (data.get("brand") or {}).get("name") if isinstance(data.get("brand"), dict) else data.get("brand")
                offers = data.get("offers") or {}
                if isinstance(offers, list):
                    offers = offers[0]
                result["extra"]["price"] = offers.get("price")
                result["extra"]["currency"] = offers.get("priceCurrency")
                result["extra"]["availability"] = offers.get("availability")
                break
        except Exception:
            continue
    # enrich contact info from same domain
    contact = scrape_website(url)
    for k in ["email", "phone", "instagram", "facebook", "linkedin",
              "twitter", "youtube", "whatsapp"]:
        if contact.get(k):
            result[k] = contact[k]
    return result


# ======================================================================
# 5. Google Search Scraper — via SerpAPI (needs paid key, plugged later)
# ======================================================================
def scrape_google_search(query: str, max_results: int = 20,
                        serpapi_key: str | None = None,
                        enrich_websites: bool = True) -> list[dict]:
    if not serpapi_key:
        raise ValueError("SerpAPI key required. Super admin can add via panel.")
    log.info(f"[google_search] query='{query}' max={max_results}")
    url = "https://serpapi.com/search.json"
    params = {"engine": "google", "q": query, "num": min(max_results, 100),
              "api_key": serpapi_key}
    with httpx.Client(timeout=25) as c:
        r = c.get(url, params=params)
        r.raise_for_status()
        data = r.json()
    organic = data.get("organic_results", [])[:max_results]
    rows: list[dict] = []
    for it in organic:
        row = {
            "name": it.get("title"),
            "website": it.get("link"),
            "address": None, "city": None,
            "category": "google_search",
            "phone": None, "email": None,
            "rating": None, "reviews_count": None,
            "instagram": None, "facebook": None, "linkedin": None,
            "twitter": None, "youtube": None, "whatsapp": None,
            "extra": {"snippet": it.get("snippet"), "position": it.get("position")},
        }
        if enrich_websites and row["website"]:
            enrich = scrape_website(row["website"])
            for k in ["email", "phone", "instagram", "facebook", "linkedin",
                      "twitter", "youtube", "whatsapp"]:
                if enrich.get(k):
                    row[k] = enrich[k]
        rows.append(row)
    return rows
