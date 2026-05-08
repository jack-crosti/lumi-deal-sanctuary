REVOKE EXECUTE ON FUNCTION public.list_buyer_businesses() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_buyer_businesses() FROM anon;
GRANT EXECUTE ON FUNCTION public.list_buyer_businesses() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.protect_admin_profile_fields() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_admin_profile_fields() FROM anon;
REVOKE EXECUTE ON FUNCTION public.protect_admin_profile_fields() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;