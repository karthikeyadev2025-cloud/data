# INeedLeads — Contact Data Scraper (SaaS)

Multi-tenant SaaS platform for real business contact data scraping.

**Live scrapers**
- Google Maps Scraper (Google Places API New v1) + auto website enrichment
- YouTube Scraper (YouTube Data API v3)
- Website Scraper (extracts email, phone, socials from any URL)
- E-commerce Scraper (extracts product info via OpenGraph + LD-JSON)
- Google Search Scraper (via SerpAPI — add key from Super Admin panel)
- Instagram / Facebook Scraper (via Apify actors — add token from Super Admin panel)

**Features**
- Google OAuth (id-token verification) + Email/password auth
- Multi-tenant with strict isolation, credit-based billing
- Razorpay top-ups (test + live mode)
- Super Admin panel: manage tenants, plans, all API keys, transactions, audit
- CSV / XLSX exports
- Mobile-responsive, enterprise UI (React + shadcn/ui + Tailwind)

---

## Tech Stack
- **Backend**: FastAPI, Supabase Python client, httpx, BeautifulSoup, pandas, razorpay
- **Frontend**: React 19 + CRA + Tailwind + shadcn/ui + Framer Motion + Recharts
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT (jose) + Google OAuth ID token verification
- **Payments**: Razorpay (INR)

---

## Local Development

### 1) Set up Supabase
1. Create a project at https://supabase.com
2. From the dashboard → Project Settings → API, copy:
   - Project URL
   - anon key (public)
   - service_role key (secret)
3. Open SQL Editor → New Query → paste contents of `backend/supabase_schema.sql` → Run

### 2) Backend env (`backend/.env`)
```env
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
SUPER_ADMIN_EMAIL="you@yourcompany.com"
SUPER_ADMIN_PASSWORD="change-me-strong-password"
JWT_SECRET="change-me-to-a-long-random-string"
JWT_ALGORITHM="HS256"
JWT_EXPIRE_HOURS="168"
GOOGLE_API_KEY="AIzaSy..."     # bootstrap; can be overridden from super admin panel
DEV_MODE="true"                # creates a demo tenant on first run (turn off in prod)
CORS_ORIGINS="https://your-frontend.vercel.app,http://localhost:3000"
```

### 3) Frontend env (`frontend/.env`)
```env
REACT_APP_BACKEND_URL="http://localhost:8001"
```

### 4) Install & run
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend
cd frontend
yarn
yarn start
```

### 5) Test credentials
- **Super Admin**: set via `SUPER_ADMIN_EMAIL` + `SUPER_ADMIN_PASSWORD` env vars → `/admin`
- **Demo Tenant** (if DEV_MODE=true): `demo@ineedleads.com` / `Demo@1234` → `/dashboard`

---

## Enabling scrapers (from the Super Admin panel)

Sign in as super admin → **Settings** → paste the appropriate key → **Save**:

| Scraper           | Key to add                             | Where to get                                                            |
| ----------------- | -------------------------------------- | ----------------------------------------------------------------------- |
| Google Maps       | `google_api_key`                       | Google Cloud Console → enable **Places API (New)** + Geocoding API      |
| YouTube           | reuses `google_api_key` (or set `youtube_api_key`) | Enable **YouTube Data API v3** on the same project           |
| Google Search     | `serpapi_key`                          | https://serpapi.com (free tier: 100 searches/month)                     |
| Instagram / Facebook | `apify_token`                       | https://apify.com → Settings → Integrations → API tokens               |
| Razorpay payments | `razorpay_key_id`, `razorpay_key_secret` | https://dashboard.razorpay.com → Settings → API Keys                 |
| Google OAuth      | `google_oauth_client_id`, `google_oauth_client_secret` | Google Cloud Console → Credentials → OAuth 2.0 Client ID |

Changes take effect **globally, in real-time** — no redeploy required.

---

## Deployment

### Frontend → Vercel
1. Push repo to GitHub.
2. https://vercel.com/new → import the repo → select `frontend/` as the root.
3. Framework preset: **Create React App**. Build cmd `yarn build`, output dir `build`.
4. Add env var: `REACT_APP_BACKEND_URL = https://your-backend.onrender.com` (see below).
5. Deploy.

### Backend → Render / Railway / Fly (Vercel does support Python serverless but FastAPI + heavy scraping is better on a long-lived host)

**Recommended: Render.com free tier**
1. https://render.com → New → Web Service → connect the repo
2. Root: `backend/`
3. Build cmd: `pip install -r requirements.txt`
4. Start cmd: `uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Add all env vars from your `backend/.env`.
6. Deploy.

After backend deploys, update the Vercel env var `REACT_APP_BACKEND_URL` with your Render URL, redeploy the frontend.

---

## Architecture notes

- **All secrets are database-driven**. The bootstrap `.env` values are only fallbacks for first boot. Once super admin edits keys in the **Settings** page, those values take precedence platform-wide.
- **Tenant isolation** is enforced at the FastAPI layer via `get_current_user` → tenant_id checks on every query. RLS is disabled in Supabase since we use the service_role key.
- **Credits** = 1 credit per business result (except unlimited plans). Deduction happens after successful scrape; failed scrapes do not deduct.
- **Website enrichment** for Google Maps + Google Search runs in parallel (ThreadPoolExecutor, 8 workers) for speed.
- **Razorpay signature verification** is done server-side with HMAC-SHA256.

---

## Security TODO before production
- [ ] Set `DEV_MODE=false` and delete the demo tenant
- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Change super admin password after first login (add a route or update via SQL)
- [ ] Enable RLS on all Supabase tables (currently disabled)
- [ ] Restrict CORS origins to your Vercel domain
- [ ] Add rate-limiting on `/api/search` (currently open)
- [ ] Rotate `GOOGLE_API_KEY` and restrict by API + HTTP referrer/IP

---

© INeedLeads by NIKKI TECH LABS. Built with ❤️ in Chennai / Hyderabad / Bangalore.
