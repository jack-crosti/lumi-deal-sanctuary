-- Fix buyer access when an admin creates a pending buyer profile before the buyer signs up.
-- The app stores access against profiles.id. Supabase auth creates a different id on signup.
-- This function claims the pending profile by email, transfers access/activity, and makes the logged-in user the profile owner.

create or replace function public.claim_pending_buyer_profile()
returns table (
  profile_id uuid,
  claimed_placeholder boolean,
  transferred_access_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_name text := nullif(auth.jwt() -> 'user_metadata' ->> 'full_name', '');
  v_pending public.profiles%rowtype;
  v_existing public.profiles%rowtype;
  v_access_count integer := 0;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  if v_email = '' then
    raise exception 'Authenticated user email is missing';
  end if;

  select * into v_existing
  from public.profiles
  where id = v_user
  limit 1;

  select * into v_pending
  from public.profiles
  where lower(email) = v_email
    and id <> v_user
    and is_pending = true
  order by created_at asc
  limit 1
  for update;

  if v_pending.id is not null then
    -- Move all dependent rows from the placeholder id to the real auth id.
    update public.buyer_business_access
       set buyer_id = v_user,
           updated_at = now()
     where buyer_id = v_pending.id
       and not exists (
         select 1
         from public.buyer_business_access existing
         where existing.buyer_id = v_user
           and existing.business_id = buyer_business_access.business_id
       );
    get diagnostics v_access_count = row_count;

    delete from public.buyer_business_access p
    where p.buyer_id = v_pending.id
      and exists (
        select 1
        from public.buyer_business_access existing
        where existing.buyer_id = v_user
          and existing.business_id = p.business_id
      );

    update public.document_access
       set buyer_id = v_user
     where buyer_id = v_pending.id
       and not exists (
         select 1
         from public.document_access existing
         where existing.buyer_id = v_user
           and existing.document_id = document_access.document_id
       );

    delete from public.document_access p
    where p.buyer_id = v_pending.id
      and exists (
        select 1
        from public.document_access existing
        where existing.buyer_id = v_user
          and existing.document_id = p.document_id
      );

    update public.buyer_activity set buyer_id = v_user where buyer_id = v_pending.id;
    update public.buyer_questions set buyer_id = v_user where buyer_id = v_pending.id;
    update public.buyer_requests set buyer_id = v_user where buyer_id = v_pending.id;
    update public.offer_interest set buyer_id = v_user where buyer_id = v_pending.id;

    if v_existing.id is not null then
      update public.profiles
         set email = coalesce(profiles.email, v_pending.email, v_email),
             first_name = coalesce(profiles.first_name, v_pending.first_name),
             last_name = coalesce(profiles.last_name, v_pending.last_name),
             full_name = coalesce(profiles.full_name, v_pending.full_name, v_name),
             phone = coalesce(profiles.phone, v_pending.phone),
             company = coalesce(profiles.company, v_pending.company),
             buyer_type = coalesce(profiles.buyer_type, v_pending.buyer_type),
             budget_min = coalesce(profiles.budget_min, v_pending.budget_min),
             budget_max = coalesce(profiles.budget_max, v_pending.budget_max),
             finance_status = coalesce(profiles.finance_status, v_pending.finance_status, 'unknown'),
             hospitality_experience = coalesce(profiles.hospitality_experience, v_pending.hospitality_experience),
             preferred_business_type = coalesce(profiles.preferred_business_type, v_pending.preferred_business_type),
             preferred_location = coalesce(profiles.preferred_location, v_pending.preferred_location),
             owner_intent = coalesce(profiles.owner_intent, v_pending.owner_intent),
             ca_status = greatest(profiles.ca_status::text, v_pending.ca_status::text)::public.ca_status,
             buyer_status = coalesce(profiles.buyer_status, v_pending.buyer_status, 'active'),
             admin_notes = coalesce(profiles.admin_notes, v_pending.admin_notes),
             is_pending = false,
             updated_at = now()
       where id = v_user;

      delete from public.profiles where id = v_pending.id;
    else
      update public.profiles
         set id = v_user,
             email = coalesce(email, v_email),
             full_name = coalesce(full_name, v_name),
             is_pending = false,
             buyer_status = case when buyer_status = 'new' then 'active' else buyer_status end,
             updated_at = now()
       where id = v_pending.id;
    end if;
  elsif v_existing.id is null then
    insert into public.profiles (
      id,
      email,
      full_name,
      buyer_status,
      ca_status,
      finance_status,
      is_pending
    ) values (
      v_user,
      v_email,
      v_name,
      'active',
      'not_sent',
      'unknown',
      false
    );
  else
    update public.profiles
       set email = coalesce(email, v_email),
           full_name = coalesce(full_name, v_name),
           is_pending = false,
           updated_at = now()
     where id = v_user;
  end if;

  insert into public.user_roles (user_id, role)
  select v_user, 'buyer'::public.app_role
  where not exists (
    select 1 from public.user_roles where user_id = v_user
  );

  return query select v_user, v_pending.id is not null, coalesce(v_access_count, 0);
end;
$$;

grant execute on function public.claim_pending_buyer_profile() to authenticated;

-- Keep duplicate business assignments from breaking buyer dashboards.
create unique index if not exists buyer_business_access_unique_buyer_business
on public.buyer_business_access (buyer_id, business_id);

-- Keep duplicate document grants clean as well.
create unique index if not exists document_access_unique_buyer_document
on public.document_access (buyer_id, document_id);
