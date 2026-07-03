# plan.md — Nikki Tech Labs Contact Scraper (Multi-tenant SaaS)

## 1) Objectives
- Prove the **core workflow** works with real data: Google Places → Place Details → website crawl → extract **phone + email + social handles**.
- Build a **multi-tenant SaaS MVP**: tenant dashboards, strict data isolation, credits, search history, export CSV/XLSX.
- Add **Google OAuth + JWT**, **Razorpay top-ups**, and **Super Admin** controls + analytics.
- Ship git-ready, clean UI/UX, mobile responsive, footer: **“An innovation by Nikki Tech Labs”**.

---

## 2) Implementation Steps

### Phase 1 — Core Scraper POC (must pass before app)
**Goal:** validate scraping/enrichment pipeline on real queries.
1. Websearch: confirm best practices for Google Places Text Search + Place Details usage, quotas, pagination, fields, and safe crawling timeouts.
2. Create `/app/backend/test_core.py`:
   - Reads `GOOGLE_API_KEY` from `.env`.
   - Inputs: `keyword`, `location`, `max_results`.
   - Calls Places Text Search (paginate if needed) → collects `place_id`.
   - Calls Place Details for fields: name, formatted_address, formatted_phone_number, website, types, rating, user_ratings_total, opening_hours.
   - If `website`: fetch `homepage` + best-guess contact URLs (`/contact`, `/contact-us`, etc.), follow redirects, 8s timeout.
   - Parse with BeautifulSoup; extract:
     - emails (regex + mailto)
     - social links (href patterns for instagram.com, facebook.com, linkedin.com, youtube.com, x.com/twitter.com)
   - Print table + summary metrics + `POC PASSED/FAILED`.
3. Iterate until exit criteria met (below). Store the working extraction logic in `scraper_core.py` for reuse.

**Phase 1 user stories**
1. As a developer, I can run a script with keyword+location and get 5–10 real businesses.
2. As a developer, I get phone + website from Google Places details per business.
3. As a developer, if a website exists, I can extract at least one email or social handle when available.
4. As a developer, I can see clear success/failure reasons per row (no website, timeout, blocked, etc.).
5. As a developer, the script never crashes on bad HTML/SSL; it returns partial results.

---

### Phase 2 — V1 App Development (no OAuth/payments yet; core UX first)
**Goal:** working SaaS app around proven core with a temporary dev auth.
1. Backend (FastAPI + Motor + MongoDB):
   - Core models: Tenant, User, SearchJob, SearchResult, Plan.
   - Multi-tenancy enforced via `tenant_id` on every record + query filter.
   - Endpoints:
     - `POST /api/search` (runs scraper, stores results)
     - `GET /api/searches` (history)
     - `GET /api/searches/{id}` (detail)
     - `GET /api/searches/{id}/export?format=csv|xlsx`
     - `GET /api/plans`
     - `GET /api/me`
   - Credits logic stubbed with dev tenant (deduct 1 credit per result returned).
   - Add basic rate limiting on `/api/search`.
2. Frontend (React + Tailwind + shadcn/ui):
   - Landing page + pricing section.
   - Tenant dashboard: credits badge, quick search, recent searches.
   - Search page: keyword+location+max_results, loading state, results table, export buttons.
   - History + Search Detail pages.
   - Footer on all pages.
3. Dev-only auth for testing (`DEV_MODE=true`): a simple “Login as demo tenant” button.
4. Run 1 full E2E test pass of V1 (core UX + export + history).

**Phase 2 user stories**
1. As a visitor, I can view a landing page with pricing and product explanation.
2. As a tenant, I can run a search and see results in a clean table.
3. As a tenant, I can export results to CSV/XLSX.
4. As a tenant, I can view my search history and open a past search.
5. As a tenant, my credits decrease based on results returned and I’m blocked at 0.

---

### Phase 3 — Auth + Multi-tenant SaaS hardening + Super Admin
**Goal:** real Google OAuth, JWT sessions, tenant isolation verification.
1. Implement Google OAuth (Google Identity Services on frontend; backend verifies ID token):
   - `POST /api/auth/google` → verify token → create/update user + auto-create tenant → return JWT.
   - Middleware/dependencies: `get_current_user`, role checks.
2. Super admin access controlled by `SUPER_ADMIN_EMAILS` env var.
3. Admin endpoints:
   - Stats: tenants, searches, credits usage
   - Tenants table: activate/deactivate, change plan, add credits
   - Transactions/searches listing (search filters)
4. Re-test all tenant isolation rules (tenant A never sees tenant B).

**Phase 3 user stories**
1. As a user, I can sign in with Google and land in my tenant dashboard.
2. As a new user, my tenant is auto-created with Free Trial credits.
3. As a tenant, I can’t access other tenant searches by URL guessing.
4. As super admin, I can view all tenants and update their plan/credits.
5. As super admin, I can see high-level analytics charts.

---

### Phase 4 — Razorpay Top-ups + Credits + Webhooks
**Goal:** real payment flow in test mode + credit grants.
1. Integrate Razorpay:
   - `POST /api/payments/create-order` (amount, tenant_id)
   - `POST /api/payments/verify` (signature verification)
   - Optional webhook handler for production reliability.
2. Credits ledger:
   - Transaction record per top-up; idempotency checks.
   - If scraper fails due to quota/errors → refund credits for that request.
3. UI: Billing page, Buy Credits modal, post-payment success/fail states.
4. E2E test: order → checkout → verify → credits increment → search allowed.

**Phase 4 user stories**
1. As a tenant, I can buy credits via Razorpay and see credits increase.
2. As a tenant, failed payments don’t add credits and show clear error.
3. As a tenant, I can view a list of my credit transactions.
4. As admin, I can view all transactions with filters.
5. As a tenant, if Google quota blocks a search, I don’t lose credits.

---

### Phase 5 — Polish + Deploy readiness
1. Improve enrichment quality: dedupe results, normalize phones (E.164), validate emails.
2. Performance: concurrency limits, caching place details, store crawl outcomes.
3. Security: CORS, strict env handling, remove DEV_MODE in prod, input validation.
4. Deployment guides:
   - Frontend → Vercel
   - Backend → Render/Railway/Fly
   - DB → Mongo Atlas
   - Full README with env vars + setup.
5. Final E2E regression test.

**Phase 5 user stories**
1. As a tenant, I can re-open old searches and re-export without spending credits.
2. As a tenant, I see verified/normalized phone + email indicators.
3. As a tenant, large searches don’t freeze UI; progress/loading is clear.
4. As an admin, I can safely operate without breaking tenant isolation.
5. As a developer, I can deploy using README steps with minimal friction.

---

## 3) Next Actions (to start immediately)
1. You share: `GOOGLE_API_KEY` (Places enabled). If needed also: `GOOGLE_OAUTH_CLIENT_ID`.
2. I implement Phase 1 `test_core.py` + `scraper_core.py` and run it on 2 real queries.
3. If `POC PASSED`, begin Phase 2 V1 app build (core UX + export + history).

---

## 4) Success Criteria
- **POC:** On a real query (e.g., “bangle shops Hyderabad”, 10 results):
  - ≥7/10 have phone (from Place Details)
  - ≥3/10 have at least one extracted email OR social link
  - Script prints `POC PASSED` reliably.
- **MVP:** Tenant can search, view results, export CSV/XLSX, see history; credits enforce limits; mobile responsive.
- **SaaS:** Google OAuth works, strict tenant isolation proven, super admin panel works.
- **Payments:** Razorpay test flow credits top-up works end-to-end with verified signature and transaction logs.
