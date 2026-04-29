-- Status enum for AI edit requests
CREATE TYPE public.ai_edit_status AS ENUM ('pending', 'processing', 'applied', 'rejected', 'failed');

-- Approval enum
CREATE TYPE public.ai_edit_approval AS ENUM ('unreviewed', 'approved', 'rejected');

CREATE TABLE public.ai_edit_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL,
  version_id uuid,
  target_block_id uuid,
  admin_id uuid NOT NULL,
  instruction text NOT NULL,
  status public.ai_edit_status NOT NULL DEFAULT 'pending',
  result_preview text,
  approval_status public.ai_edit_approval NOT NULL DEFAULT 'unreviewed',
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_edit_requests_business ON public.ai_edit_requests(business_id, created_at DESC);
CREATE INDEX idx_ai_edit_requests_block ON public.ai_edit_requests(target_block_id);

ALTER TABLE public.ai_edit_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ai edit requests"
ON public.ai_edit_requests
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_ai_edit_requests_updated_at
BEFORE UPDATE ON public.ai_edit_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
