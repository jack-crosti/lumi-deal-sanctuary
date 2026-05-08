
-- 1. Restrict offer_interest status values buyers can set
DROP POLICY IF EXISTS "Buyers create own offer interest" ON public.offer_interest;
DROP POLICY IF EXISTS "Buyers update own draft offer interest" ON public.offer_interest;

CREATE POLICY "Buyers create own offer interest"
ON public.offer_interest
FOR INSERT
TO authenticated
WITH CHECK (
  buyer_id = auth.uid()
  AND public.buyer_has_business(auth.uid(), business_id)
  AND status IN ('draft'::offer_status, 'submitted'::offer_status)
);

CREATE POLICY "Buyers update own draft offer interest"
ON public.offer_interest
FOR UPDATE
TO authenticated
USING (
  buyer_id = auth.uid()
  AND status = 'draft'::offer_status
)
WITH CHECK (
  buyer_id = auth.uid()
  AND status IN ('draft'::offer_status, 'submitted'::offer_status, 'withdrawn'::offer_status)
);

-- 2. Prevent buyers from changing admin-managed profile fields
CREATE OR REPLACE FUNCTION public.protect_admin_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.buyer_status IS DISTINCT FROM OLD.buyer_status
     OR NEW.ca_status IS DISTINCT FROM OLD.ca_status
     OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes
     OR NEW.is_pending IS DISTINCT FROM OLD.is_pending
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.id IS DISTINCT FROM OLD.id
  THEN
    RAISE EXCEPTION 'Only administrators can modify these profile fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_admin_profile_fields_trg ON public.profiles;
CREATE TRIGGER protect_admin_profile_fields_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_admin_profile_fields();
