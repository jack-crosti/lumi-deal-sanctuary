-- Enums for buyer profile
DO $$ BEGIN
  CREATE TYPE public.ca_status AS ENUM ('not_sent', 'sent', 'signed', 'approved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.buyer_status AS ENUM ('new', 'active', 'warm', 'hot', 'not_suitable', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.buyer_type AS ENUM ('individual', 'company', 'investor', 'family_office', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.finance_status AS ENUM ('unknown', 'self_funded', 'pre_approved', 'needs_finance', 'not_disclosed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.owner_intent AS ENUM ('working_owner', 'investor', 'either');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS buyer_type public.buyer_type,
  ADD COLUMN IF NOT EXISTS budget_min NUMERIC,
  ADD COLUMN IF NOT EXISTS budget_max NUMERIC,
  ADD COLUMN IF NOT EXISTS finance_status public.finance_status DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS hospitality_experience TEXT,
  ADD COLUMN IF NOT EXISTS preferred_business_type TEXT,
  ADD COLUMN IF NOT EXISTS preferred_location TEXT,
  ADD COLUMN IF NOT EXISTS owner_intent public.owner_intent,
  ADD COLUMN IF NOT EXISTS ca_status public.ca_status NOT NULL DEFAULT 'not_sent',
  ADD COLUMN IF NOT EXISTS buyer_status public.buyer_status NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS is_pending BOOLEAN NOT NULL DEFAULT false;

-- Make email unique-friendly (case-insensitive lookup) — index, not constraint, to avoid breaking existing dupes
CREATE INDEX IF NOT EXISTS profiles_email_lower_idx ON public.profiles ((lower(email)));

-- Admin policies on profiles
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Updated trigger function: merge admin-pre-created profile by email when buyer signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  user_count int;
  assigned_role public.app_role;
  existing_profile_id uuid;
begin
  -- Look for a pre-created buyer profile with the same email
  select id into existing_profile_id
  from public.profiles
  where lower(email) = lower(new.email) and is_pending = true
  limit 1;

  if existing_profile_id is not null then
    -- Reassign the existing profile to the new auth user id
    update public.profiles
      set id = new.id,
          is_pending = false,
          full_name = coalesce(full_name, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
          updated_at = now()
      where id = existing_profile_id;

    -- Move any access rows attached to the placeholder id
    update public.buyer_business_access set buyer_id = new.id where buyer_id = existing_profile_id;
  else
    insert into public.profiles (id, email, full_name)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''));
  end if;

  select count(*) into user_count from public.user_roles;
  if user_count = 0 then
    assigned_role := 'admin';
  else
    assigned_role := 'buyer';
  end if;

  insert into public.user_roles (user_id, role) values (new.id, assigned_role)
  on conflict do nothing;
  return new;
end;
$function$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger for profiles
DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();