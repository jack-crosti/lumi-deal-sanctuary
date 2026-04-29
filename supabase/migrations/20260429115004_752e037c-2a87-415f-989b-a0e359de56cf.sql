-- Extend presentation_status with the broader workflow
ALTER TYPE public.presentation_status ADD VALUE IF NOT EXISTS 'internal_review';
ALTER TYPE public.presentation_status ADD VALUE IF NOT EXISTS 'ready_to_publish';

-- Block-level review status
DO $$ BEGIN
  CREATE TYPE public.block_review_status AS ENUM ('draft','needs_review','approved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extend presentation_sections with editable block fields
ALTER TABLE public.presentation_sections
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS key_points text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS image_refs text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS visibility public.document_visibility NOT NULL DEFAULT 'im',
  ADD COLUMN IF NOT EXISTS required_access_level public.access_level NOT NULL DEFAULT 'im',
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_status public.block_review_status NOT NULL DEFAULT 'draft';

-- Buyers: only see non-hidden blocks of published versions of assigned businesses,
-- and only if their access level meets the block requirement.
DROP POLICY IF EXISTS "Buyers view sections of published assigned versions" ON public.presentation_sections;
CREATE POLICY "Buyers view sections of published assigned versions"
ON public.presentation_sections
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.presentation_versions v
    WHERE v.id = presentation_sections.version_id
      AND v.status = 'published'
      AND public.buyer_has_business(auth.uid(), v.business_id)
      AND public.access_level_rank(presentation_sections.required_access_level)
          <= public.access_level_rank(public.buyer_access_level(auth.uid(), v.business_id))
  )
  AND is_hidden = false
);

CREATE INDEX IF NOT EXISTS idx_presentation_sections_version_position
  ON public.presentation_sections(version_id, position);
CREATE INDEX IF NOT EXISTS idx_presentation_versions_business_status
  ON public.presentation_versions(business_id, status);