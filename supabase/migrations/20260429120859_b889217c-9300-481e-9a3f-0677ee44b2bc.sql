-- Financial source and review status enums
create type public.financial_source as enum (
  'accountant',
  'gst_returns',
  'pos_reports',
  'vendor_supplied',
  'broker_estimate',
  'other'
);

create type public.financial_review_status as enum (
  'draft',
  'needs_verification',
  'verified',
  'not_available'
);

-- Extend businesses with financial fields
alter table public.businesses
  add column if not exists gross_profit numeric,
  add column if not exists gross_profit_pct numeric,
  add column if not exists wage_cost numeric,
  add column if not exists wage_pct numeric,
  add column if not exists rent_pct_sales numeric,
  add column if not exists owner_profit numeric,
  add column if not exists add_backs numeric,
  add column if not exists asking_price_multiple numeric,
  add column if not exists financial_notes text,
  add column if not exists financial_source public.financial_source,
  add column if not exists financial_review_status public.financial_review_status not null default 'draft';
