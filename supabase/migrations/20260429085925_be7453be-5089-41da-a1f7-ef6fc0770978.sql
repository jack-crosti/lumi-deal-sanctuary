
-- =========================================================================
-- ENUMS
-- =========================================================================
create type public.location_mode as enum ('blind', 'suburb', 'exact');
create type public.business_status as enum ('draft', 'published', 'archived');
create type public.access_level as enum ('teaser', 'im', 'financial', 'serious', 'full_dd');
create type public.document_type as enum ('im', 'financials', 'gst', 'pos', 'lease', 'chattels', 'staff', 'vendor_notes', 'photo', 'video', 'other');
create type public.document_visibility as enum ('hidden', 'teaser', 'im', 'financial', 'serious', 'full_dd');
create type public.activity_event as enum (
  'login','business_view','im_view','financial_view','location_view',
  'document_view','document_download','question_submitted','request_submitted',
  'offer_started','offer_submitted','return_visit'
);
create type public.question_status as enum ('open','answered','closed');
create type public.request_type as enum ('information','document_access','call','other');
create type public.request_status as enum ('open','in_progress','closed');
create type public.offer_status as enum ('draft','submitted','withdrawn','progressing','closed');
create type public.presentation_status as enum ('draft','published','archived');
create type public.section_type as enum (
  'hero','location_advantage','business_overview','key_highlights',
  'financial_snapshot','lease_summary','operations_staff','growth_opportunities',
  'buyer_fit','risks_due_diligence','photo_gallery','supporting_documents',
  'ask_question','request_information','start_offer_discussion','voiceover_script'
);

-- =========================================================================
-- HELPER: access-level rank (used to compare buyer level vs document visibility)
-- =========================================================================
create or replace function public.access_level_rank(_level public.access_level)
returns int language sql immutable as $$
  select case _level
    when 'teaser' then 1
    when 'im' then 2
    when 'financial' then 3
    when 'serious' then 4
    when 'full_dd' then 5
  end
$$;

create or replace function public.visibility_rank(_v public.document_visibility)
returns int language sql immutable as $$
  select case _v
    when 'hidden' then 99
    when 'teaser' then 1
    when 'im' then 2
    when 'financial' then 3
    when 'serious' then 4
    when 'full_dd' then 5
  end
$$;

-- =========================================================================
-- BUSINESSES
-- =========================================================================
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  headline text,
  summary text,
  location_mode public.location_mode not null default 'blind',
  suburb text,
  region text,
  address text,
  asking_price numeric,
  ebitda numeric,
  revenue numeric,
  tenure text,
  status public.business_status not null default 'draft',
  hero_image_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.businesses enable row level security;

create trigger trg_businesses_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

-- =========================================================================
-- BUYER BUSINESS ACCESS
-- =========================================================================
create table public.buyer_business_access (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  access_level public.access_level not null default 'teaser',
  assigned_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (buyer_id, business_id)
);
alter table public.buyer_business_access enable row level security;
create index idx_bba_buyer on public.buyer_business_access(buyer_id);
create index idx_bba_business on public.buyer_business_access(business_id);

create trigger trg_bba_updated_at
before update on public.buyer_business_access
for each row execute function public.set_updated_at();

-- Helper: does buyer currently have access to a business (not expired)
create or replace function public.buyer_has_business(_user uuid, _business uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.buyer_business_access
    where buyer_id = _user
      and business_id = _business
      and (expires_at is null or expires_at > now())
  )
$$;

-- Helper: get buyer's access level for a business
create or replace function public.buyer_access_level(_user uuid, _business uuid)
returns public.access_level language sql stable security definer set search_path = public as $$
  select access_level from public.buyer_business_access
  where buyer_id = _user and business_id = _business
    and (expires_at is null or expires_at > now())
  limit 1
$$;

-- =========================================================================
-- DOCUMENTS
-- =========================================================================
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null,
  doc_type public.document_type not null default 'other',
  storage_path text,
  file_size bigint,
  mime_type text,
  visibility public.document_visibility not null default 'hidden',
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.documents enable row level security;
create index idx_documents_business on public.documents(business_id);

create trigger trg_documents_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

-- =========================================================================
-- DOCUMENT ACCESS (per-buyer overrides)
-- =========================================================================
create table public.document_access (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (buyer_id, document_id)
);
alter table public.document_access enable row level security;

create or replace function public.buyer_can_see_document(_user uuid, _doc uuid)
returns boolean language sql stable security definer set search_path = public as $$
  with d as (
    select business_id, visibility from public.documents where id = _doc
  )
  select
    -- explicit override
    exists (select 1 from public.document_access where buyer_id = _user and document_id = _doc)
    or (
      -- buyer has access to the business AND their level meets the document visibility
      (select visibility from d) <> 'hidden'
      and public.buyer_has_business(_user, (select business_id from d))
      and public.visibility_rank((select visibility from d))
          <= public.access_level_rank(public.buyer_access_level(_user, (select business_id from d)))
    )
$$;

-- =========================================================================
-- BUYER ACTIVITY
-- =========================================================================
create table public.buyer_activity (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  event_type public.activity_event not null,
  metadata jsonb not null default '{}'::jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);
alter table public.buyer_activity enable row level security;
create index idx_activity_buyer on public.buyer_activity(buyer_id);
create index idx_activity_business on public.buyer_activity(business_id);
create index idx_activity_created on public.buyer_activity(created_at desc);

-- =========================================================================
-- BUYER QUESTIONS
-- =========================================================================
create table public.buyer_questions (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  question text not null,
  status public.question_status not null default 'open',
  answer text,
  answered_by uuid references auth.users(id) on delete set null,
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.buyer_questions enable row level security;
create trigger trg_questions_updated_at
before update on public.buyer_questions
for each row execute function public.set_updated_at();

-- =========================================================================
-- BUYER REQUESTS
-- =========================================================================
create table public.buyer_requests (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  request_type public.request_type not null default 'information',
  message text,
  status public.request_status not null default 'open',
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.buyer_requests enable row level security;
create trigger trg_requests_updated_at
before update on public.buyer_requests
for each row execute function public.set_updated_at();

-- =========================================================================
-- OFFER INTEREST
-- =========================================================================
create table public.offer_interest (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  indicative_amount numeric,
  terms text,
  status public.offer_status not null default 'draft',
  disclaimer_accepted boolean not null default false,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.offer_interest enable row level security;
create trigger trg_offer_updated_at
before update on public.offer_interest
for each row execute function public.set_updated_at();

-- =========================================================================
-- PRESENTATION VERSIONS + SECTIONS
-- =========================================================================
create table public.presentation_versions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  version_number int not null,
  status public.presentation_status not null default 'draft',
  notes text,
  published_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, version_number)
);
alter table public.presentation_versions enable row level security;
create trigger trg_pv_updated_at
before update on public.presentation_versions
for each row execute function public.set_updated_at();

create table public.presentation_sections (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.presentation_versions(id) on delete cascade,
  section_type public.section_type not null,
  position int not null default 0,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.presentation_sections enable row level security;
create index idx_sections_version on public.presentation_sections(version_id);
create trigger trg_ps_updated_at
before update on public.presentation_sections
for each row execute function public.set_updated_at();

-- Helper: does a published version exist for this business
create or replace function public.business_has_published_version(_business uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.presentation_versions
    where business_id = _business and status = 'published'
  )
$$;

-- =========================================================================
-- RLS POLICIES
-- =========================================================================

-- BUSINESSES
create policy "Admins manage businesses"
  on public.businesses for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Buyers view assigned published businesses"
  on public.businesses for select to authenticated
  using (
    status = 'published'
    and public.buyer_has_business(auth.uid(), id)
  );

-- BUYER BUSINESS ACCESS
create policy "Admins manage buyer access"
  on public.buyer_business_access for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Buyers view own access"
  on public.buyer_business_access for select to authenticated
  using (buyer_id = auth.uid());

-- DOCUMENTS
create policy "Admins manage documents"
  on public.documents for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Buyers view permitted documents"
  on public.documents for select to authenticated
  using (public.buyer_can_see_document(auth.uid(), id));

-- DOCUMENT ACCESS
create policy "Admins manage document access"
  on public.document_access for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Buyers view own document access"
  on public.document_access for select to authenticated
  using (buyer_id = auth.uid());

-- BUYER ACTIVITY
create policy "Admins view all activity"
  on public.buyer_activity for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Buyers view own activity"
  on public.buyer_activity for select to authenticated
  using (buyer_id = auth.uid());

create policy "Buyers insert own activity"
  on public.buyer_activity for insert to authenticated
  with check (
    buyer_id = auth.uid()
    and (business_id is null or public.buyer_has_business(auth.uid(), business_id))
  );

-- BUYER QUESTIONS
create policy "Admins manage questions"
  on public.buyer_questions for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Buyers view own questions"
  on public.buyer_questions for select to authenticated
  using (buyer_id = auth.uid());

create policy "Buyers create own questions"
  on public.buyer_questions for insert to authenticated
  with check (
    buyer_id = auth.uid()
    and public.buyer_has_business(auth.uid(), business_id)
  );

-- BUYER REQUESTS
create policy "Admins manage requests"
  on public.buyer_requests for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Buyers view own requests"
  on public.buyer_requests for select to authenticated
  using (buyer_id = auth.uid());

create policy "Buyers create own requests"
  on public.buyer_requests for insert to authenticated
  with check (
    buyer_id = auth.uid()
    and public.buyer_has_business(auth.uid(), business_id)
  );

-- OFFER INTEREST
create policy "Admins manage offer interest"
  on public.offer_interest for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Buyers view own offer interest"
  on public.offer_interest for select to authenticated
  using (buyer_id = auth.uid());

create policy "Buyers create own offer interest"
  on public.offer_interest for insert to authenticated
  with check (
    buyer_id = auth.uid()
    and public.buyer_has_business(auth.uid(), business_id)
  );

create policy "Buyers update own draft offer interest"
  on public.offer_interest for update to authenticated
  using (buyer_id = auth.uid() and status = 'draft')
  with check (buyer_id = auth.uid());

-- PRESENTATION VERSIONS
create policy "Admins manage presentation versions"
  on public.presentation_versions for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Buyers view published versions of assigned businesses"
  on public.presentation_versions for select to authenticated
  using (
    status = 'published'
    and public.buyer_has_business(auth.uid(), business_id)
  );

-- PRESENTATION SECTIONS
create policy "Admins manage presentation sections"
  on public.presentation_sections for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Buyers view sections of published assigned versions"
  on public.presentation_sections for select to authenticated
  using (
    exists (
      select 1 from public.presentation_versions v
      where v.id = version_id
        and v.status = 'published'
        and public.buyer_has_business(auth.uid(), v.business_id)
    )
  );
