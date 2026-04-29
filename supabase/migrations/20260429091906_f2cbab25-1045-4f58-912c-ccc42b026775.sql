-- Extend business_status enum
ALTER TYPE public.business_status ADD VALUE IF NOT EXISTS 'internal_review' BEFORE 'published';
ALTER TYPE public.business_status ADD VALUE IF NOT EXISTS 'ready_to_publish' BEFORE 'published';

-- Add new columns to businesses
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS public_title text,
  ADD COLUMN IF NOT EXISTS confidential_title text,
  ADD COLUMN IF NOT EXISTS business_type text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS stock_value numeric,
  ADD COLUMN IF NOT EXISTS weekly_sales_min numeric,
  ADD COLUMN IF NOT EXISTS weekly_sales_max numeric,
  ADD COLUMN IF NOT EXISTS normalised_profit numeric,
  ADD COLUMN IF NOT EXISTS rent_per_year numeric,
  ADD COLUMN IF NOT EXISTS lease_expiry date,
  ADD COLUMN IF NOT EXISTS renewal_rights text,
  ADD COLUMN IF NOT EXISTS staff_summary text,
  ADD COLUMN IF NOT EXISTS owner_involvement text,
  ADD COLUMN IF NOT EXISTS opening_hours text,
  ADD COLUMN IF NOT EXISTS broker_notes text,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- Trigger for updated_at on businesses (idempotent)
DROP TRIGGER IF EXISTS set_businesses_updated_at ON public.businesses;
CREATE TRIGGER set_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();