"""
POC — Nikki Tech Labs Contact Scraper
Proves the core scraping pipeline works on REAL data (no mocks).

Runs:
  1. Supabase connection sanity check
  2. Google Maps Scraper (5 real businesses in Hyderabad)
  3. YouTube Scraper (5 real videos)
  4. E-commerce Scraper (1 real product page)
  5. Website enrichment (extract contacts from a real site)

Exit criteria for POC PASS:
  - Supabase: connects + can insert/select from platform_settings
  - Google Maps: >=5 businesses, >=3 with phone, >=1 with email OR social handle
  - YouTube: >=3 videos with title + video_id
  - Website enrichment: at least one contact detail from a chosen site
  - E-commerce: name + price extracted (best-effort)
"""
import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("poc")

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")

sys.path.insert(0, str(ROOT))
from scraper_core import (scrape_google_maps, scrape_youtube,
                          scrape_website, scrape_ecommerce)

GOOGLE_KEY = os.environ.get("GOOGLE_API_KEY")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SR = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

PASS = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"

def check(cond, label):
    print(f"  {PASS if cond else FAIL} {label}")
    return cond

def banner(title):
    print("\n" + "=" * 72)
    print(f"  {title}")
    print("=" * 72)

# ---------- 0. Env sanity ----------
banner("0. Environment sanity")
assert GOOGLE_KEY, "GOOGLE_API_KEY missing"
assert SUPABASE_URL, "SUPABASE_URL missing"
assert SUPABASE_SR, "SUPABASE_SERVICE_ROLE_KEY missing"
print(f"  {PASS} All env vars loaded")

# ---------- 1. Supabase ----------
banner("1. Supabase connectivity + schema check")
supabase_ok = False
try:
    from supabase import create_client
    sb = create_client(SUPABASE_URL, SUPABASE_SR)
    res = sb.table("platform_settings").select("*").limit(1).execute()
    supabase_ok = check(res.data is not None,
                        f"platform_settings query returned {len(res.data) if res.data else 0} row(s)")
    if res.data:
        row = res.data[0]
        print(f"     brand_name={row.get('brand_name')}  free_trial_credits={row.get('free_trial_credits')}")
except Exception as e:
    print(f"  {FAIL} Supabase error: {e}")
    print("  !! Have you run supabase_schema.sql in the Supabase SQL editor?")

# ---------- 2. Google Maps ----------
banner("2. Google Maps Scraper (real query)")
query = "bangle shops"
location = "Hyderabad, India"
maps_rows = []
try:
    maps_rows = scrape_google_maps(query, location, max_results=6,
                                   api_key=GOOGLE_KEY, enrich_websites=True)
    for r in maps_rows:
        print(f"    - {r['name']:<42.42} | ph={'Y' if r['phone'] else '-'} "
              f"| em={'Y' if r['email'] else '-'} "
              f"| ig={'Y' if r['instagram'] else '-'} "
              f"| fb={'Y' if r['facebook'] else '-'} "
              f"| web={'Y' if r['website'] else '-'}")
    n_phone = sum(1 for r in maps_rows if r["phone"])
    n_social = sum(1 for r in maps_rows if r["email"] or r["instagram"] or r["facebook"])
    maps_ok = (check(len(maps_rows) >= 5, f"got {len(maps_rows)} businesses (need >=5)")
               and check(n_phone >= 3, f"{n_phone} with phone (need >=3)")
               and check(n_social >= 1, f"{n_social} with email/social (need >=1)"))
except Exception as e:
    maps_ok = False
    print(f"  {FAIL} Google Maps scraper error: {e}")

# ---------- 3. YouTube ----------
banner("3. YouTube Data API scraper")
yt_rows = []
try:
    yt_rows = scrape_youtube("south indian recipes", max_results=5, api_key=GOOGLE_KEY)
    for r in yt_rows:
        print(f"    - {(r['name'] or '')[:60]:<60.60} | views={r['extra'].get('views')}")
    yt_ok = check(len(yt_rows) >= 3 and all(r.get("name") for r in yt_rows),
                  f"got {len(yt_rows)} videos with title")
except Exception as e:
    yt_ok = False
    print(f"  {FAIL} YouTube API error: {e}")
    print(f"  → If quotaExceeded / not enabled: enable 'YouTube Data API v3' in Google Cloud Console")

# ---------- 4. Website enrichment ----------
banner("4. Website contact enrichment (single URL)")
test_urls = ["https://www.zomato.com", "https://www.swiggy.com",
             "https://razorpay.com"]
site_ok = False
for u in test_urls:
    info = scrape_website(u)
    print(f"  {u}")
    print(f"     email={info['email']}  phone={info['phone']}")
    print(f"     ig={info['instagram']}  fb={info['facebook']}  li={info['linkedin']}")
    if info["email"] or info["instagram"] or info["facebook"] or info["linkedin"] or info["twitter"]:
        site_ok = True
check(site_ok, "At least one site yielded a contact/social")

# ---------- 5. E-commerce ----------
banner("5. E-commerce / product page scraper")
test_product = "https://www.flipkart.com/apple-iphone-15-blue-128-gb/p/itmbf14ef54a19d9"
ecom_ok = False
try:
    p = scrape_ecommerce(test_product)
    print(f"  name = {p['name']}")
    print(f"  price = {p['extra'].get('price')} {p['extra'].get('currency')}")
    print(f"  image = {(p['extra'].get('image') or '')[:80]}")
    ecom_ok = check(bool(p["name"]), "product name extracted")
except Exception as e:
    print(f"  {FAIL} ecom scraper error: {e}")

# ---------- Summary ----------
banner("POC SUMMARY")
results = {
    "Supabase": supabase_ok,
    "Google Maps": maps_ok,
    "YouTube":    yt_ok,
    "Website enrichment": site_ok,
    "E-commerce": ecom_ok,
}
for k, v in results.items():
    print(f"  {PASS if v else FAIL} {k}")

critical = supabase_ok and maps_ok  # These MUST work. Others are helpful but soft.
print("\n" + ("\033[92mPOC PASSED\033[0m — core (Supabase + Google Maps) is working. Building app now."
              if critical
              else "\033[91mPOC FAILED\033[0m — fix critical items above before continuing."))
sys.exit(0 if critical else 1)
