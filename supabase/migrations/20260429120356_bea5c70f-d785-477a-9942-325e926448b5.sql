-- Storage bucket for IM PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('im-imports', 'im-imports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (admin only)
CREATE POLICY "Admins read im-imports"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'im-imports' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins upload im-imports"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'im-imports' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update im-imports"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'im-imports' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete im-imports"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'im-imports' AND public.has_role(auth.uid(), 'admin'));

-- Status enum for the import lifecycle
CREATE TYPE public.im_import_status AS ENUM (
  'uploading',
  'extracting',
  'generating',
  'ready_for_review',
  'applied',
  'rejected',
  'failed'
);

CREATE TABLE public.im_imports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL,
  admin_id uuid NOT NULL,
  storage_path text NOT NULL,
  file_name text,
  file_size bigint,
  status public.im_import_status NOT NULL DEFAULT 'uploading',
  extracted_text text,
  extracted_facts jsonb,
  generated_blocks jsonb,
  warnings text[] NOT NULL DEFAULT '{}',
  admin_notes text,
  error_message text,
  draft_version_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_im_imports_business ON public.im_imports(business_id, created_at DESC);

ALTER TABLE public.im_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage im imports"
ON public.im_imports
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_im_imports_updated_at
BEFORE UPDATE ON public.im_imports
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
