# plan.md — Nikki Tech Labs Contact Scraper (Multi-tenant SaaS)

## 1) Objectives
- Deliver a **production-ready MVP** of a multi-tenant lead/contact scraping SaaS targeted at Indian (South Indian) SMB/agency users.
- Provide a unified dashboard with multiple scrapers:
  - ✅ Google Maps Scraper (Google **Places API New v1**) + website enrichment
  - ✅ YouTube Scraper (YouTube Data API v3)
  - ✅ Website contact enrichment (emails/phones/social links)
  - ✅ E-commerce/product page scraper (OpenGraph + LD-JSON best-effort)
  - ⚙️ Google Search Results Scraper (via **SerpAPI** — key required)
  - ⚙️ Instagram/Facebook scrapers (via **Apify actors** — token required)
- Support **multi-tenant SaaS operations**: tenant dashboards, strict tenant isolation, credit-based usage, search history, exports.
- Provide **Super Admin** panel to manage tenants, plans, credits, API keys (stored in DB), transactions and audit logs.
- Support **payments via Razorpay** to top-up credits (end-to-end once keys are added).
- Ship git-ready codebase + deployment documentation:
  - Frontend: Vercel
  - Backend: Render/Railway/Fly (recommended long-lived server for scraping)
  - Database: Supabase (PostgreSQL)
- Ensure enterprise UI/UX and branding:
  - Footer: **“An innovation by Nikki Tech Labs”**
  - Tenant accent: teal; Admin accent: amber
  - Mobile responsive, clean tables and exports

---

## 2) Implementation Steps

### Phase 1 — Core Scraper POC (must pass before app) ✅ COMPLETE
**Goal:** validate scraping/enrichment pipeline on real queries.

**What was built + verified**
1. Implemented `scraper_core.py` and `test_core.py` POC suite.
2. Verified **Supabase connectivity** and schema readiness.
3. Implemented Google Maps scraping using **Places API (New) v1** (searchText) and validated real results.
4. Implemented website enrichment (homepage + contact paths) extracting:
   - emails (regex/mailto)
   - social links (instagram/facebook/linkedin/twitter/youtube/whatsapp)
5. Implemented YouTube scraper using YouTube Data API v3.
6. Implemented e-commerce/product scraper (best-effort) using OpenGraph + LD-JSON.
7. Added **parallel website enrichment** (ThreadPoolExecutor) to keep searches fast.

**Exit criteria achieved**
- POC PASSED on real searches.
- Confirmed real Google Maps query example: **“coffee shops Bangalore” → 10 real businesses** with phone + some enriched socials/emails.

---

### Phase 2 — Full MVP App (core UX + backend + admin) ✅ COMPLETE
**Goal:** complete multi-tenant SaaS application around proven core.

#### Backend (FastAPI + Supabase Postgres)
- ✅ Migrated from Mongo to **Supabase (PostgreSQL)**.
- ✅ Added full SQL schema: `supabase_schema.sql`.
- ✅ Implemented JWT auth + roles:
  - `super_admin` (static password login seeded on startup)
  - `tenant_admin` (email/password signup/login; Google OAuth API endpoint ready)
- ✅ Implemented tenant isolation checks on all tenant routes.
- ✅ Implemented scraper endpoints:
  - `POST /api/search` (google_maps, youtube, website, ecommerce)
  - `GET /api/search` (history)
  - `GET /api/search/{id}` (detail)
  - `GET /api/search/{id}/export?format=csv|xlsx`
- ✅ Implemented credits model:
  - 1 credit per result returned (unlimited plans bypass)
  - usage logged in `transactions` as `type=usage`
- ✅ Implemented Super Admin API:
  - Stats, tenants management, plans management, settings (API keys), transactions, audit
- ✅ Implemented payments module (Razorpay) with graceful “not configured” behavior until keys are added.

#### Supabase reliability hardening
- ✅ Fixed intermittent Supabase HTTP/2 disconnects by **forcing HTTP/1.1** for the internal httpx client + retry/reset behavior.
- ✅ Added middleware fallback returning 503 on transient DB issues.

#### Frontend (React + Tailwind + shadcn/ui)
- ✅ Landing page with pricing and 6 scraper tiles.
- ✅ Login + Signup (email/password). Super admin uses password login.
- ✅ Tenant app:
  - Dashboard (KPIs, quick search CTA, recent searches)
  - Search page with 6 scraper tabs + results table + export buttons
  - History page + search detail page + exports
  - Billing page (plans + buy credits modal; Razorpay disabled until configured)
- ✅ Super Admin panel:
  - Overview analytics + charts
  - Tenants management (activate/deactivate, grant credits, change plan)
  - Settings (API keys, brand config)
  - Plans management
  - Transactions log
  - Audit log
- ✅ Design guidelines applied:
  - Tenant teal accent; admin amber accent
  - IBM Plex + Space Grotesk fonts
  - Mobile responsiveness
  - Footer text on all pages

---

### Phase 3 — Production integrations (keys  payments  social scrapers) ⚙️ IN PROGRESS / WAITING ON USER
**Goal:** unlock paid features + social scrapers and finalize production deployment settings.

1. **Razorpay keys** (Super Admin Settings)
   - Add `razorpay_key_id` + `razorpay_key_secret`
   - Verify end-to-end:
     - `/api/payments/create-order`
     - `/api/payments/verify`
     - credits increase + transaction logged

2. **SerpAPI key** (Super Admin Settings)
   - Add `serpapi_key`
   - Enables **Google Search Results Scraper** in the UI.

3. **Apify token** (Super Admin Settings)
   - Add `apify_token`
   - Implement actor integration for:
     - Instagram scraper
     - Facebook posts/page scraper

4. **Google OAuth (optional)**
   - Add `google_oauth_client_id` + `google_oauth_client_secret` in platform settings.
   - Update login page to show “Sign in with Google” button.

**Phase 3 user stories**
- Tenant can buy credits via Razorpay; credits update immediately.
- Tenant can run Google Search (SerpAPI) and see enriched contacts.
- Tenant can run IG/FB (Apify) scrapers from the same Search UI.

---

### Phase 4 — Polish + enterprise hardening (optional) 🔜
1. Better enrichment quality:
   - phone normalization (E.164)
   - email validation + confidence flags
   - deduplication and merging across sources
2. Performance:
   - background job queue for large searches
   - progress tracking for long runs
3. Security:
   - stricter CORS
   - rate-limiting on `/api/search`
   - enable Supabase RLS + least-privilege keys (optional)
4. Product features:
   - team members per tenant
   - invoices download, billing history
   - API access tokens for enterprise

---

## 3) Next Actions (current)
1. **User provides keys in Super Admin → Settings** (no code changes needed):
   - Razorpay keys to enable payments
   - SerpAPI key to enable Google Search scraper
   - Apify token to enable IG/FB scrapers
   - (Optional) Google OAuth client credentials
2. Push repository to GitHub.
3. Deploy:
   - Frontend → Vercel
   - Backend → Render/Railway/Fly
   - DB → Supabase (already configured)
4. Run a short production verification checklist:
   - login/signup
   - run Google Maps search (5 results)
   - export CSV/XLSX
   - admin grant credits
   - (if keys added) Razorpay payment + SerpAPI + Apify

---

## 4) Success Criteria (updated)
- ✅ **POC success**: Real data returned for Google Maps (Places New v1), YouTube, Website enrichment, E-commerce; Supabase verified.
- ✅ **MVP success**:
  - Multi-tenant dashboards + history + exports
  - Credits enforced (402 on insufficient credits)
  - Super admin panel operational
  - Mobile responsive + enterprise UI
- ✅ **Reliability**:
  - Supabase intermittent HTTP/2 issue resolved by forcing HTTP/1.1 + retry/reset
- ⏳ **Payments success** (pending keys): Razorpay test mode works end-to-end, credits update + transactions logged.
- ⏳ **Expanded scraper success** (pending keys): SerpAPI and Apify integrations enabled from admin settings with no redeploy.
