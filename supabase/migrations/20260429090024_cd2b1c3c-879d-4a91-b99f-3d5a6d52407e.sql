
create or replace function public.access_level_rank(_level public.access_level)
returns int language sql immutable security invoker set search_path = public as $$
  select case _level
    when 'teaser' then 1
    when 'im' then 2
    when 'financial' then 3
    when 'serious' then 4
    when 'full_dd' then 5
  end
$$;

create or replace function public.visibility_rank(_v public.document_visibility)
returns int language sql immutable security invoker set search_path = public as $$
  select case _v
    when 'hidden' then 99
    when 'teaser' then 1
    when 'im' then 2
    when 'financial' then 3
    when 'serious' then 4
    when 'full_dd' then 5
  end
$$;

revoke execute on function public.buyer_has_business(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.buyer_access_level(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.buyer_can_see_document(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.business_has_published_version(uuid) from public, anon, authenticated;
