-- Prevent buyers from querying raw businesses rows directly.
-- Buyer-facing business data must go through RPCs that mask confidential fields.
DROP POLICY IF EXISTS "Buyers view assigned published businesses" ON public.businesses;

-- Safe dashboard listing for a buyer's assigned opportunities.
-- This exposes only fields needed on the buyer dashboard and masks exact address/financials.
CREATE OR REPLACE FUNCTION public.list_buyer_businesses()
RETURNS TABLE (
  id uuid,
  name text,
  public_title text,
  confidential_title text,
  business_type text,
  industry text,
  location_mode public.location_mode,
  suburb text,
  city text,
  region text,
  address text,
  asking_price numeric,
  ebitda numeric,
  normalised_profit numeric,
  status public.business_status,
  hero_image_url text,
  access_level public.access_level
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    b.id,
    b.name,
    b.public_title,
    b.confidential_title,
    b.business_type,
    b.industry,
    b.location_mode,
    b.suburb,
    b.city,
    b.region,
    CASE WHEN b.location_mode = 'exact'::public.location_mode THEN b.address ELSE NULL END AS address,
    b.asking_price,
    CASE
      WHEN public.access_level_rank(a.access_level) >= public.access_level_rank('financial'::public.access_level)
      THEN b.ebitda
      ELSE NULL
    END AS ebitda,
    CASE
      WHEN public.access_level_rank(a.access_level) >= public.access_level_rank('financial'::public.access_level)
      THEN b.normalised_profit
      ELSE NULL
    END AS normalised_profit,
    b.status,
    b.hero_image_url,
    a.access_level
  FROM public.buyer_business_access a
  JOIN public.businesses b ON b.id = a.business_id
  WHERE a.buyer_id = _uid
    AND (a.expires_at IS NULL OR a.expires_at > now())
    AND b.status = 'published'::public.business_status;
END;
$$;

REVOKE ALL ON FUNCTION public.list_buyer_businesses() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_buyer_businesses() TO authenticated;

-- Buyers must create offer discussions as drafts first, then may submit their own draft.
DROP POLICY IF EXISTS "Buyers create own offer interest" ON public.offer_interest;
DROP POLICY IF EXISTS "Buyers update own draft offer interest" ON public.offer_interest;

CREATE POLICY "Buyers create own offer interest"
ON public.offer_interest
FOR INSERT
TO authenticated
WITH CHECK (
  buyer_id = auth.uid()
  AND public.buyer_has_business(auth.uid(), business_id)
  AND status = 'draft'::public.offer_status
);

CREATE POLICY "Buyers update own draft offer interest"
ON public.offer_interest
FOR UPDATE
TO authenticated
USING (
  buyer_id = auth.uid()
  AND status = 'draft'::public.offer_status
)
WITH CHECK (
  buyer_id = auth.uid()
  AND status IN ('draft'::public.offer_status, 'submitted'::public.offer_status)
);

-- Public/anonymous visitors should not be able to execute internal SECURITY DEFINER helpers.
-- Keep authenticated access because RLS policies and logged-in app flows rely on these helpers.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.buyer_has_business(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.buyer_access_level(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.buyer_can_see_document(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.access_level_rank(public.access_level) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.visibility_rank(public.document_visibility) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.business_has_published_version(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_buyer_business(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.save_presentation_snapshot(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.restore_presentation_snapshot(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.protect_admin_profile_fields() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.buyer_has_business(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.buyer_access_level(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.buyer_can_see_document(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.access_level_rank(public.access_level) TO authenticated;
GRANT EXECUTE ON FUNCTION public.visibility_rank(public.document_visibility) TO authenticated;
GRANT EXECUTE ON FUNCTION public.business_has_published_version(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_buyer_business(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_presentation_snapshot(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_presentation_snapshot(uuid) TO authenticated;