-- ==============================================================================
-- Funnel Labs — Migration 20261009000002: Google OAuth Support & User Trigger
-- ==============================================================================
-- 1. Updates handle_new_user() trigger to handle Google OAuth user onboarding
-- 2. Supports automated organization creation when users sign in via Google
-- 3. Guarantees identity linking compatibility for existing email accounts
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  user_store_name TEXT;
  user_founder_name TEXT;
  existing_membership_count INT;
BEGIN
  -- 1. Idempotency Check:
  -- If user already belongs to an organization (e.g., identity linking or pre-invited member),
  -- avoid creating redundant organizations.
  SELECT COUNT(*) INTO existing_membership_count
  FROM public.organization_members
  WHERE user_id = new.id;

  IF existing_membership_count > 0 THEN
    RETURN new;
  END IF;

  -- 2. Extract Founder Name:
  -- Works for both Email/Password (raw_user_meta_data.full_name) and
  -- Google OAuth (raw_user_meta_data.full_name or raw_user_meta_data.name)
  user_founder_name := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(new.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(initcap(split_part(new.email, '@', 1))), ''),
    'Founder'
  );

  -- 3. Extract or Infer Store Name:
  -- Email signups provide store_name; Google signups default to "<Founder>'s Store"
  user_store_name := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data->>'store_name'), ''),
    NULLIF(TRIM(user_founder_name || '''s Store'), ''),
    'My D2C Store'
  );

  -- 4. Create Default Organization for the New User
  INSERT INTO public.organizations (name, slug)
  VALUES (
    user_store_name,
    lower(regexp_replace(user_store_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 8)
  )
  RETURNING id INTO new_org_id;

  -- 5. Add User as Owner in organization_members
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, new.id, 'owner')
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  -- 6. Initialize Default User Settings
  INSERT INTO public.user_settings (
    user_id,
    organization_id,
    founder_name,
    founder_email,
    store_name,
    store_url,
    platform,
    currency,
    monthly_ad_spend
  ) VALUES (
    new.id,
    new_org_id,
    user_founder_name,
    new.email,
    user_store_name,
    'https://' || lower(regexp_replace(user_store_name, '[^a-zA-Z0-9]+', '', 'g')) || '.com',
    'Shopify',
    'INR (₹)',
    150000
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

-- Ensure trigger is active on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
