-- =====================================================
-- INEEDLEADS — CONTACT DATA SCRAPER SAAS
-- Supabase (PostgreSQL) Schema
-- Run this in Supabase SQL Editor (one-shot)
-- =====================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- =====================================================
-- 1. PLATFORM SETTINGS (single-row config, editable by super admin)
-- =====================================================
create table if not exists platform_settings (
  id                  uuid primary key default uuid_generate_v4(),
  google_api_key      text,
  serpapi_key         text,
  apify_token         text,
  youtube_api_key     text,
  razorpay_key_id     text,
  razorpay_key_secret text,
  google_oauth_client_id      text,
  google_oauth_client_secret  text,
  free_trial_credits  integer default 25,
  brand_name          text default 'INeedLeads',
  footer_text         text default 'An innovation by NIKKI TECH LABS',
  support_email       text default 'adexosindia@gmail.com',
  google_service_account_json text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Seed initial row
insert into platform_settings (id, free_trial_credits, brand_name, footer_text)
select uuid_generate_v4(), 25, 'INeedLeads', 'An innovation by NIKKI TECH LABS'
where not exists (select 1 from platform_settings);

-- =====================================================
-- 2. PLANS
-- =====================================================
create table if not exists plans (
  id            uuid primary key default uuid_generate_v4(),
  code          text unique not null,   -- 'free','starter','pro','enterprise'
  name          text not null,
  price_inr     integer not null default 0,
  monthly_credits integer not null default 0, -- 0 means custom/unlimited
  is_unlimited  boolean default false,
  features      jsonb default '[]'::jsonb,
  active        boolean default true,
  created_at    timestamptz default now()
);

insert into plans (code, name, price_inr, monthly_credits, is_unlimited, features)
values
  ('free',       'Free Trial', 0,     25,   false, '["25 search credits","Google Maps scraper","Website enrichment","CSV export"]'::jsonb),
  ('starter',    'Starter',    999,   500,  false, '["500 credits/month","All scrapers","CSV + XLSX export","Search history","Email support"]'::jsonb),
  ('pro',        'Pro',        2999,  2000, false, '["2,000 credits/month","All scrapers","Priority speed","API access","Priority support"]'::jsonb),
  ('enterprise', 'Enterprise', 9999,  0,    true,  '["Unlimited credits","All scrapers","Dedicated support","Custom integrations","SLA"]'::jsonb)
on conflict (code) do nothing;

-- =====================================================
-- 3. TENANTS (each paying client = one tenant)
-- =====================================================
create table if not exists tenants (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  slug            text unique,
  plan_code       text references plans(code) default 'free',
  credits_balance integer default 25,
  is_active       boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists idx_tenants_active on tenants(is_active);

-- =====================================================
-- 4. USERS (super_admin + tenant_admin + tenant_user)
-- =====================================================
create table if not exists users (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid references tenants(id) on delete cascade,
  email           text unique not null,
  full_name       text,
  avatar_url      text,
  password_hash   text,          -- only for super_admin (Google users have null)
  role            text not null default 'tenant_admin', -- 'super_admin' | 'tenant_admin' | 'tenant_user'
  google_sub      text,          -- Google OAuth subject id
  is_active       boolean default true,
  last_login_at   timestamptz,
  created_at      timestamptz default now()
);
create index if not exists idx_users_tenant on users(tenant_id);
create index if not exists idx_users_email on users(email);
create index if not exists idx_users_role on users(role);

-- =====================================================
-- 5. SEARCH JOBS (one per user query)
-- =====================================================
create table if not exists search_jobs (
  id             uuid primary key default uuid_generate_v4(),
  tenant_id      uuid not null references tenants(id) on delete cascade,
  user_id        uuid references users(id) on delete set null,
  scraper_type   text not null, -- 'google_maps','google_search','youtube','instagram','facebook','website','ecommerce'
  query          text not null,
  location       text,
  max_results    integer default 20,
  status         text default 'pending', -- pending, running, completed, failed
  results_count  integer default 0,
  credits_used   integer default 0,
  error_message  text,
  metadata       jsonb default '{}'::jsonb,
  created_at     timestamptz default now(),
  completed_at   timestamptz
);
create index if not exists idx_search_tenant on search_jobs(tenant_id, created_at desc);
create index if not exists idx_search_user on search_jobs(user_id);
create index if not exists idx_search_type on search_jobs(scraper_type);

-- =====================================================
-- 6. SEARCH RESULTS (rows per business/entity)
-- =====================================================
create table if not exists search_results (
  id            uuid primary key default uuid_generate_v4(),
  job_id        uuid not null references search_jobs(id) on delete cascade,
  tenant_id     uuid not null references tenants(id) on delete cascade,
  name          text,
  phone         text,
  email         text,
  website       text,
  address       text,
  city          text,
  category      text,
  rating        numeric(3,2),
  reviews_count integer,
  latitude      numeric(10,7),
  longitude     numeric(10,7),
  instagram     text,
  facebook      text,
  linkedin      text,
  twitter       text,
  youtube       text,
  whatsapp      text,
  extra         jsonb default '{}'::jsonb, -- scraper-specific fields (video info, product price, etc.)
  created_at    timestamptz default now()
);
create index if not exists idx_results_job on search_results(job_id);
create index if not exists idx_results_tenant on search_results(tenant_id);

-- =====================================================
-- 7. TRANSACTIONS (credit purchases + manual grants)
-- =====================================================
create table if not exists transactions (
  id                uuid primary key default uuid_generate_v4(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  user_id           uuid references users(id),
  type              text not null, -- 'razorpay_topup','admin_grant','plan_upgrade','refund','usage'
  amount_inr        numeric(10,2) default 0,
  credits_delta     integer not null default 0,
  status            text default 'success', -- pending, success, failed
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  notes             text,
  metadata          jsonb default '{}'::jsonb,
  created_at        timestamptz default now()
);
create index if not exists idx_tx_tenant on transactions(tenant_id, created_at desc);
create index if not exists idx_tx_type on transactions(type);

-- =====================================================
-- 8. AUDIT LOGS
-- =====================================================
create table if not exists audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  actor_id    uuid references users(id),
  actor_email text,
  tenant_id   uuid references tenants(id),
  action      text not null,
  target_type text,
  target_id   text,
  details     jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);
create index if not exists idx_audit_actor on audit_logs(actor_id);
create index if not exists idx_audit_created on audit_logs(created_at desc);

-- =====================================================
-- Trigger: updated_at auto-update
-- =====================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tenants_updated_at on tenants;
create trigger tenants_updated_at
  before update on tenants
  for each row execute procedure set_updated_at();

drop trigger if exists settings_updated_at on platform_settings;
create trigger settings_updated_at
  before update on platform_settings
  for each row execute procedure set_updated_at();

-- =====================================================
-- 9. LEAD LISTS (named collections of saved contacts)
-- =====================================================
create table if not exists lead_lists (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  user_id     uuid references users(id) on delete set null,
  name        text not null,
  description text,
  color       text default '#0EA5A4',
  count       integer default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists idx_lists_tenant on lead_lists(tenant_id, created_at desc);

-- =====================================================
-- 10. LEAD LIST ITEMS (junction: result → list)
-- =====================================================
create table if not exists lead_list_items (
  id          uuid primary key default uuid_generate_v4(),
  list_id     uuid not null references lead_lists(id) on delete cascade,
  result_id   uuid not null references search_results(id) on delete cascade,
  notes       text,
  created_at  timestamptz default now(),
  unique(list_id, result_id)
);
create index if not exists idx_list_items_list on lead_list_items(list_id);
create index if not exists idx_list_items_result on lead_list_items(result_id);

drop trigger if exists lead_lists_updated_at on lead_lists;
create trigger lead_lists_updated_at
  before update on lead_lists
  for each row execute procedure set_updated_at();

-- =====================================================
-- Done.  RLS is intentionally disabled because we use
-- the service_role key from the FastAPI backend and
-- enforce authorization at the API layer.
-- =====================================================
