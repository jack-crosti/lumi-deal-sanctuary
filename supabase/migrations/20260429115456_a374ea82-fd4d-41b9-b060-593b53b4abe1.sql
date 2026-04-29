REVOKE ALL ON FUNCTION public.save_presentation_snapshot(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.restore_presentation_snapshot(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_presentation_snapshot(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_presentation_snapshot(uuid) TO authenticated;