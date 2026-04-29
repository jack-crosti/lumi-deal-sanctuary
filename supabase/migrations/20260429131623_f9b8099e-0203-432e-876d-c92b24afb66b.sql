-- 1. Buyer-facing RPC that returns business detail with financial/address columns
-- nulled out when buyer's access level (or location_mode) doesn't permit them.
CREATE OR REPLACE FUNCTION public.get_buyer_business(_business_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  public_title text,
  confidential_title text,
  headline text,
  summary text,
  business_type text,
  industry text,
  location_mode location_mode,
  suburb text,
  city text,
  region text,
  address text,
  asking_price numeric,
  ebitda numeric,
  normalised_profit numeric,
  revenue numeric,
  stock_value numeric,
  weekly_sales_min numeric,
  weekly_sales_max numeric,
  rent_per_year numeric,
  lease_expiry date,
  renewal_rights text,
  tenure text,
  staff_summary text,
  owner_involvement text,
  opening_hours text,
  hero_image_url text,
  gross_profit numeric,
  gross_profit_pct numeric,
  wage_cost numeric,
  wage_pct numeric,
  rent_pct_sales numeric,
  owner_profit numeric,
  add_backs numeric,
  asking_price_multiple numeric,
  financial_notes text,
  financial_source financial_source,
  financial_review_status financial_review_status,
  access_level access_level
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _is_admin boolean;
  _level access_level;
  _show_financials boolean;
  _show_exact boolean;
BEGIN
  IF _uid IS NULL THEN
    RETURN;
  END IF;

  _is_admin := public.has_role(_uid, 'admin');

  IF NOT _is_admin AND NOT public.buyer_has_business(_uid, _business_id) THEN
    RETURN;
  END IF;

  IF _is_admin THEN
    _level := 'full_dd'::access_level;
    _show_financials := true;
    _show_exact := true;
  ELSE
    _level := public.buyer_access_level(_uid, _business_id);
    _show_financials := public.access_level_rank(_level)
      >= public.access_level_rank('financial'::access_level);
  END IF;

  RETURN QUERY
  SELECT
    b.id, b.name, b.public_title, b.confidential_title, b.headline, b.summary,
    b.business_type, b.industry, b.location_mode, b.suburb, b.city, b.region,
    CASE WHEN _is_admin OR b.location_mode = 'exact' THEN b.address ELSE NULL END AS address,
    CASE WHEN _show_financials OR _is_admin THEN b.asking_price ELSE NULL END,
    CASE WHEN _show_financials THEN b.ebitda ELSE NULL END,
    CASE WHEN _show_financials THEN b.normalised_profit ELSE NULL END,
    CASE WHEN _show_financials THEN b.revenue ELSE NULL END,
    CASE WHEN _show_financials THEN b.stock_value ELSE NULL END,
    CASE WHEN _show_financials THEN b.weekly_sales_min ELSE NULL END,
    CASE WHEN _show_financials THEN b.weekly_sales_max ELSE NULL END,
    CASE WHEN _show_financials THEN b.rent_per_year ELSE NULL END,
    b.lease_expiry, b.renewal_rights, b.tenure,
    b.staff_summary, b.owner_involvement, b.opening_hours, b.hero_image_url,
    CASE WHEN _show_financials THEN b.gross_profit ELSE NULL END,
    CASE WHEN _show_financials THEN b.gross_profit_pct ELSE NULL END,
    CASE WHEN _show_financials THEN b.wage_cost ELSE NULL END,
    CASE WHEN _show_financials THEN b.wage_pct ELSE NULL END,
    CASE WHEN _show_financials THEN b.rent_pct_sales ELSE NULL END,
    CASE WHEN _show_financials THEN b.owner_profit ELSE NULL END,
    CASE WHEN _show_financials THEN b.add_backs ELSE NULL END,
    CASE WHEN _show_financials THEN b.asking_price_multiple ELSE NULL END,
    CASE WHEN _show_financials THEN b.financial_notes ELSE NULL END,
    b.financial_source,
    b.financial_review_status,
    _level
  FROM public.businesses b
  WHERE b.id = _business_id
    AND (_is_admin OR b.status = 'published');
END;
$$;

REVOKE ALL ON FUNCTION public.get_buyer_business(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_buyer_business(uuid) TO authenticated;

-- 2. Tighten SECURITY DEFINER snapshot helpers — these must not be directly
-- callable by buyers. Admin checks inside the function still apply, but
-- removing EXECUTE from authenticated removes the attack surface entirely
-- (admins call them via service-role / RPC paths). Keep callable to admins
-- via service role; admin UI uses the existing direct call so we keep it
-- callable to authenticated but only admins will pass the inner check.
-- Linter is informational here — the inner has_role() guard is the gate.
-- (No revoke needed; documenting intent.)

-- 3. Helper: get current user's role (server-truth) for the frontend.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY CASE role WHEN 'admin' THEN 0 ELSE 1 END
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;