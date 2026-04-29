create type public.voiceover_style as enum (
  'professional',
  'calm',
  'premium',
  'direct',
  'warm',
  'investor'
);

create type public.voiceover_approval as enum (
  'draft',
  'needs_review',
  'approved'
);

create table public.voiceover_scripts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique,
  style public.voiceover_style not null default 'professional',
  approval_status public.voiceover_approval not null default 'draft',
  preview_text text,
  opening text,
  location text,
  business_overview text,
  financials text,
  growth text,
  next_steps text,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index voiceover_scripts_business_idx
  on public.voiceover_scripts (business_id);

alter table public.voiceover_scripts enable row level security;

create policy "Admins manage voiceover scripts"
  on public.voiceover_scripts
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create trigger voiceover_scripts_set_updated_at
  before update on public.voiceover_scripts
  for each row execute function public.set_updated_at();
