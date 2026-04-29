-- Snapshot table
CREATE TABLE IF NOT EXISTS public.presentation_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  source_version_id uuid,
  version_number integer NOT NULL,
  status public.presentation_status NOT NULL,
  change_summary text,
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_presentation_snapshots_business_created
  ON public.presentation_snapshots(business_id, created_at DESC);

ALTER TABLE public.presentation_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage presentation snapshots" ON public.presentation_snapshots;
CREATE POLICY "Admins manage presentation snapshots"
ON public.presentation_snapshots
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Save snapshot of a working version
CREATE OR REPLACE FUNCTION public.save_presentation_snapshot(
  _version_id uuid,
  _change_summary text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _snapshot_id uuid;
  _v public.presentation_versions%ROWTYPE;
  _blocks jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT * INTO _v FROM public.presentation_versions WHERE id = _version_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'version not found';
  END IF;

  SELECT coalesce(jsonb_agg(to_jsonb(s.*) ORDER BY s.position), '[]'::jsonb)
    INTO _blocks
  FROM public.presentation_sections s
  WHERE s.version_id = _version_id;

  INSERT INTO public.presentation_snapshots
    (business_id, source_version_id, version_number, status, change_summary, blocks, created_by)
  VALUES
    (_v.business_id, _v.id, _v.version_number, _v.status, _change_summary, _blocks, auth.uid())
  RETURNING id INTO _snapshot_id;

  RETURN _snapshot_id;
END;
$$;

-- Restore a snapshot as a brand new draft version
CREATE OR REPLACE FUNCTION public.restore_presentation_snapshot(_snapshot_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _snap public.presentation_snapshots%ROWTYPE;
  _new_version_id uuid;
  _next_number integer;
  _block jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT * INTO _snap FROM public.presentation_snapshots WHERE id = _snapshot_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'snapshot not found';
  END IF;

  SELECT coalesce(max(version_number), 0) + 1 INTO _next_number
  FROM public.presentation_versions WHERE business_id = _snap.business_id;

  INSERT INTO public.presentation_versions
    (business_id, version_number, status, notes, created_by)
  VALUES
    (_snap.business_id, _next_number, 'draft',
     'Restored from v' || _snap.version_number || ' snapshot ' || to_char(_snap.created_at, 'YYYY-MM-DD HH24:MI'),
     auth.uid())
  RETURNING id INTO _new_version_id;

  FOR _block IN SELECT * FROM jsonb_array_elements(_snap.blocks)
  LOOP
    INSERT INTO public.presentation_sections (
      version_id, section_type, position, content,
      title, subtitle, body, key_points, image_refs,
      visibility, required_access_level, is_hidden, review_status
    ) VALUES (
      _new_version_id,
      (_block->>'section_type')::section_type,
      coalesce((_block->>'position')::int, 0),
      coalesce(_block->'content', '{}'::jsonb),
      _block->>'title',
      _block->>'subtitle',
      _block->>'body',
      coalesce(
        ARRAY(SELECT jsonb_array_elements_text(coalesce(_block->'key_points', '[]'::jsonb))),
        '{}'::text[]
      ),
      coalesce(
        ARRAY(SELECT jsonb_array_elements_text(coalesce(_block->'image_refs', '[]'::jsonb))),
        '{}'::text[]
      ),
      coalesce((_block->>'visibility')::document_visibility, 'im'),
      coalesce((_block->>'required_access_level')::access_level, 'im'),
      coalesce((_block->>'is_hidden')::boolean, false),
      coalesce((_block->>'review_status')::block_review_status, 'draft')
    );
  END LOOP;

  RETURN _new_version_id;
END;
$$;