
-- 1. New enum for document availability
do $$ begin
  create type public.document_availability as enum ('hidden', 'available', 'requires_approval');
exception when duplicate_object then null; end $$;

-- 2. Add new event type for document access requests
alter type public.activity_event add value if not exists 'document_access_request';

-- 3. Extend documents table
alter table public.documents
  add column if not exists availability public.document_availability not null default 'hidden',
  add column if not exists required_access_level public.access_level not null default 'im',
  add column if not exists download_allowed boolean not null default false,
  add column if not exists notes text;

-- Backfill availability + required_access_level from legacy `visibility` if it carries info
update public.documents
set availability = case when visibility = 'hidden' then 'hidden'::public.document_availability
                        else 'available'::public.document_availability end,
    required_access_level = case visibility
      when 'teaser' then 'teaser'::public.access_level
      when 'im' then 'im'::public.access_level
      when 'financial' then 'financial'::public.access_level
      when 'serious' then 'serious'::public.access_level
      when 'full_dd' then 'full_dd'::public.access_level
      else required_access_level
    end
where availability = 'hidden' and visibility is not null;

-- 4. Replace buyer_can_see_document to use new fields
create or replace function public.buyer_can_see_document(_user uuid, _doc uuid)
returns boolean
language sql
stable security definer
set search_path = public
as $$
  with d as (
    select business_id, availability, required_access_level
    from public.documents where id = _doc
  )
  select
    exists (select 1 from public.document_access where buyer_id = _user and document_id = _doc)
    or (
      (select availability from d) <> 'hidden'
      and public.buyer_has_business(_user, (select business_id from d))
      and public.access_level_rank((select required_access_level from d))
          <= public.access_level_rank(public.buyer_access_level(_user, (select business_id from d)))
    )
$$;

-- 5. Storage bucket (private)
insert into storage.buckets (id, name, public)
values ('business-documents', 'business-documents', false)
on conflict (id) do nothing;

-- 6. Storage RLS
drop policy if exists "Admins manage business documents" on storage.objects;
create policy "Admins manage business documents"
on storage.objects for all to authenticated
using (bucket_id = 'business-documents' and public.has_role(auth.uid(), 'admin'))
with check (bucket_id = 'business-documents' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "Buyers read permitted business documents" on storage.objects;
create policy "Buyers read permitted business documents"
on storage.objects for select to authenticated
using (
  bucket_id = 'business-documents'
  and exists (
    select 1 from public.documents d
    where d.storage_path = storage.objects.name
      and public.buyer_can_see_document(auth.uid(), d.id)
  )
);
