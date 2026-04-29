ALTER TABLE public.ai_edit_requests
  ADD COLUMN IF NOT EXISTS proposal jsonb,
  ADD COLUMN IF NOT EXISTS warnings text[] NOT NULL DEFAULT '{}';
