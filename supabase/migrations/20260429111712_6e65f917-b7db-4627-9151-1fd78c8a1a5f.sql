
-- Extend offer_status enum with new workflow states
alter type public.offer_status add value if not exists 'broker_reviewing';
alter type public.offer_status add value if not exists 'call_booked';
alter type public.offer_status add value if not exists 'spa_preparing';
alter type public.offer_status add value if not exists 'not_proceeding';
alter type public.offer_status add value if not exists 'closed';

-- Add structured offer fields
alter table public.offer_interest
  add column if not exists proposed_price numeric,
  add column if not exists deposit_amount numeric,
  add column if not exists stock_treatment text,
  add column if not exists price_notes text,
  add column if not exists conditions text[] not null default '{}',
  add column if not exists other_condition_text text,
  add column if not exists due_diligence_period text,
  add column if not exists settlement_timeframe text,
  add column if not exists takeover_date text,
  add column if not exists finance_approval_timeframe text,
  add column if not exists buyer_entity text,
  add column if not exists solicitor_name text,
  add column if not exists solicitor_email text,
  add column if not exists accountant_name text,
  add column if not exists accountant_email text,
  add column if not exists additional_notes text;

create index if not exists offer_interest_business_idx on public.offer_interest (business_id, created_at desc);
create index if not exists offer_interest_buyer_idx on public.offer_interest (buyer_id, created_at desc);
