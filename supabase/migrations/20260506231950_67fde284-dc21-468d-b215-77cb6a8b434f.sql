CREATE OR REPLACE FUNCTION public.buyer_can_see_document(_user uuid, _doc uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with d as (
    select business_id, availability, required_access_level
    from public.documents where id = _doc
  )
  select
    exists (select 1 from public.document_access where buyer_id = _user and document_id = _doc)
    or (
      (select availability from d) = 'available'
      and public.buyer_has_business(_user, (select business_id from d))
      and public.access_level_rank((select required_access_level from d))
          <= public.access_level_rank(public.buyer_access_level(_user, (select business_id from d)))
    )
$function$;