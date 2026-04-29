-- Extend request_type enum
ALTER TYPE public.request_type ADD VALUE IF NOT EXISTS 'financial';
ALTER TYPE public.request_type ADD VALUE IF NOT EXISTS 'lease';
ALTER TYPE public.request_type ADD VALUE IF NOT EXISTS 'pos';
ALTER TYPE public.request_type ADD VALUE IF NOT EXISTS 'chattels';
ALTER TYPE public.request_type ADD VALUE IF NOT EXISTS 'vendor_meeting';
ALTER TYPE public.request_type ADD VALUE IF NOT EXISTS 'dd_question';

-- Extend request_status enum
ALTER TYPE public.request_status ADD VALUE IF NOT EXISTS 'waiting_vendor';
ALTER TYPE public.request_status ADD VALUE IF NOT EXISTS 'replied';

-- Priority enum
DO $$ BEGIN
  CREATE TYPE public.request_priority AS ENUM ('normal', 'high');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Contact method enum
DO $$ BEGIN
  CREATE TYPE public.contact_method AS ENUM ('email', 'phone', 'either');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- New columns on buyer_requests
ALTER TABLE public.buyer_requests
  ADD COLUMN IF NOT EXISTS preferred_contact public.contact_method,
  ADD COLUMN IF NOT EXISTS preferred_call_time text,
  ADD COLUMN IF NOT EXISTS priority public.request_priority NOT NULL DEFAULT 'normal';

-- Index for admin inbox listing
CREATE INDEX IF NOT EXISTS idx_buyer_requests_created_at ON public.buyer_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_buyer_requests_status ON public.buyer_requests (status);