-- ==============================================================================
-- Funnel Labs — Multi-Tenant D2C Experimentation Platform Schema & RLS
-- ==============================================================================

-- 1. Organizations (Tenants / D2C Brands)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Organization Memberships (Multi-Tenant User Association)
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT organization_members_org_user_key UNIQUE (organization_id, user_id)
);

-- Index for fast tenant resolution
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);

-- 3. User & Store Settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  founder_name TEXT NOT NULL DEFAULT 'Aarav Sharma',
  founder_email TEXT NOT NULL DEFAULT 'founder@bombaythreads.com',
  store_name TEXT NOT NULL DEFAULT 'Bombay Threads D2C',
  store_url TEXT NOT NULL DEFAULT 'https://bombaythreads.com',
  platform TEXT NOT NULL DEFAULT 'Shopify' CHECK (platform IN ('Shopify', 'WooCommerce', 'Custom D2C', 'Magento')),
  currency TEXT NOT NULL DEFAULT 'INR (₹)',
  monthly_ad_spend NUMERIC NOT NULL DEFAULT 150000,
  notify_winner BOOLEAN NOT NULL DEFAULT true,
  notify_daily BOOLEAN NOT NULL DEFAULT true,
  notify_budget BOOLEAN NOT NULL DEFAULT true,
  confidence_threshold NUMERIC NOT NULL DEFAULT 95,
  min_sample_size INTEGER NOT NULL DEFAULT 500,
  auto_pause_losers BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_settings_user_org_key UNIQUE (user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_user_settings_org_id ON public.user_settings(organization_id);

-- 4. Campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id TEXT PRIMARY KEY DEFAULT ('camp-' || gen_random_uuid()::text),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('Instagram', 'Google Search', 'Facebook', 'WhatsApp')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Paused', 'Completed')),
  reach INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  purchases INTEGER NOT NULL DEFAULT 0,
  revenue NUMERIC NOT NULL DEFAULT 0,
  spend NUMERIC NOT NULL DEFAULT 0,
  connected_experiment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_org_id ON public.campaigns(organization_id);

-- 5. Experiments
CREATE TABLE IF NOT EXISTS public.experiments (
  id TEXT PRIMARY KEY DEFAULT ('exp-' || gen_random_uuid()::text),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Offer Test', 'Ad Creative', 'Message Test', 'Landing Page', 'Other')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Planned', 'Completed')),
  description TEXT NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
  primary_goal TEXT NOT NULL DEFAULT 'Purchases',
  budget NUMERIC NOT NULL DEFAULT 15000,
  connected_campaign TEXT NOT NULL DEFAULT 'Instagram — T-Shirt Offer',
  confidence_score NUMERIC DEFAULT 50,
  winner_name TEXT DEFAULT 'Evaluating initial traffic',
  winner_label TEXT,
  winner_reason TEXT,
  recommendation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_experiments_org_id ON public.experiments(organization_id);

-- 6. Experiment Variants
CREATE TABLE IF NOT EXISTS public.variants (
  id TEXT PRIMARY KEY DEFAULT ('var-' || gen_random_uuid()::text),
  experiment_id TEXT NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  purchases INTEGER NOT NULL DEFAULT 0,
  revenue NUMERIC NOT NULL DEFAULT 0,
  conversion_rate NUMERIC NOT NULL DEFAULT 0,
  cost_per_conversion NUMERIC NOT NULL DEFAULT 0,
  is_winner BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_variants_experiment_id ON public.variants(experiment_id);
CREATE INDEX IF NOT EXISTS idx_variants_org_id ON public.variants(organization_id);

-- 7. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT ('notif-' || gen_random_uuid()::text),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  time_label TEXT NOT NULL DEFAULT 'Just now',
  is_read BOOLEAN NOT NULL DEFAULT false,
  type TEXT NOT NULL DEFAULT 'alert' CHECK (type IN ('alert', 'success', 'info')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON public.notifications(organization_id);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================

-- Helper function to return organization IDs accessible by the current authenticated user
CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = auth.uid();
$$;

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. Organizations Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;
CREATE POLICY "Users can view organizations they belong to"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (id IN (SELECT public.get_user_organizations()));

DROP POLICY IF EXISTS "Users can create new organizations" ON public.organizations;
CREATE POLICY "Users can create new organizations"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Owners and admins can update their organization" ON public.organizations;
CREATE POLICY "Owners and admins can update their organization"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Owners can delete their organization" ON public.organizations;
CREATE POLICY "Owners can delete their organization"
  ON public.organizations
  FOR DELETE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Trigger to automatically add the creating user as owner of the organization
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (NEW.id, auth.uid(), 'owner')
    ON CONFLICT (organization_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_organization();

-- ------------------------------------------------------------------------------
-- 2. Organization Members Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members can view other members in their organization" ON public.organization_members;
CREATE POLICY "Members can view other members in their organization"
  ON public.organization_members
  FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT public.get_user_organizations()));

DROP POLICY IF EXISTS "Users can add themselves to an organization or admins can add members" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can add members to organization" ON public.organization_members;
CREATE POLICY "Admins can add members to organization"
  ON public.organization_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins can update membership roles" ON public.organization_members;
CREATE POLICY "Admins can update membership roles"
  ON public.organization_members
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins can remove members from organization" ON public.organization_members;
CREATE POLICY "Admins can remove members from organization"
  ON public.organization_members
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ------------------------------------------------------------------------------
-- 3. User Settings Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view user settings for their organization" ON public.user_settings;
CREATE POLICY "Users can view user settings for their organization"
  ON public.user_settings
  FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT public.get_user_organizations()));

DROP POLICY IF EXISTS "Users can create settings for their organization" ON public.user_settings;
CREATE POLICY "Users can create settings for their organization"
  ON public.user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    organization_id IN (SELECT public.get_user_organizations())
  );

DROP POLICY IF EXISTS "Users can update their settings" ON public.user_settings;
CREATE POLICY "Users can update their settings"
  ON public.user_settings
  FOR UPDATE
  TO authenticated
  USING (organization_id IN (SELECT public.get_user_organizations()));

-- ------------------------------------------------------------------------------
-- 4. Campaigns Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenant members can view campaigns" ON public.campaigns;
CREATE POLICY "Tenant members can view campaigns"
  ON public.campaigns
  FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT public.get_user_organizations()));

DROP POLICY IF EXISTS "Tenant members can insert campaigns" ON public.campaigns;
CREATE POLICY "Tenant members can insert campaigns"
  ON public.campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (SELECT public.get_user_organizations()));

DROP POLICY IF EXISTS "Tenant members can update campaigns" ON public.campaigns;
CREATE POLICY "Tenant members can update campaigns"
  ON public.campaigns
  FOR UPDATE
  TO authenticated
  USING (organization_id IN (SELECT public.get_user_organizations()));

DROP POLICY IF EXISTS "Tenant members can delete campaigns" ON public.campaigns;
CREATE POLICY "Tenant members can delete campaigns"
  ON public.campaigns
  FOR DELETE
  TO authenticated
  USING (organization_id IN (SELECT public.get_user_organizations()));

-- ------------------------------------------------------------------------------
-- 5. Experiments Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenant members can view experiments" ON public.experiments;
CREATE POLICY "Tenant members can view experiments"
  ON public.experiments
  FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT public.get_user_organizations()));

DROP POLICY IF EXISTS "Tenant members can insert experiments" ON public.experiments;
CREATE POLICY "Tenant members can insert experiments"
  ON public.experiments
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (SELECT public.get_user_organizations()));

DROP POLICY IF EXISTS "Tenant members can update experiments" ON public.experiments;
CREATE POLICY "Tenant members can update experiments"
  ON public.experiments
  FOR UPDATE
  TO authenticated
  USING (organization_id IN (SELECT public.get_user_organizations()));

DROP POLICY IF EXISTS "Tenant members can delete experiments" ON public.experiments;
CREATE POLICY "Tenant members can delete experiments"
  ON public.experiments
  FOR DELETE
  TO authenticated
  USING (organization_id IN (SELECT public.get_user_organizations()));

-- ------------------------------------------------------------------------------
-- 6. Variants Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenant members can view variants" ON public.variants;
CREATE POLICY "Tenant members can view variants"
  ON public.variants
  FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT public.get_user_organizations()));

DROP POLICY IF EXISTS "Tenant members can insert variants" ON public.variants;
CREATE POLICY "Tenant members can insert variants"
  ON public.variants
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (SELECT public.get_user_organizations()));

DROP POLICY IF EXISTS "Tenant members can update variants" ON public.variants;
CREATE POLICY "Tenant members can update variants"
  ON public.variants
  FOR UPDATE
  TO authenticated
  USING (organization_id IN (SELECT public.get_user_organizations()));

DROP POLICY IF EXISTS "Tenant members can delete variants" ON public.variants;
CREATE POLICY "Tenant members can delete variants"
  ON public.variants
  FOR DELETE
  TO authenticated
  USING (organization_id IN (SELECT public.get_user_organizations()));

-- ------------------------------------------------------------------------------
-- 7. Notifications Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenant members can view notifications" ON public.notifications;
CREATE POLICY "Tenant members can view notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT public.get_user_organizations()));

DROP POLICY IF EXISTS "Tenant members can insert notifications" ON public.notifications;
CREATE POLICY "Tenant members can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (SELECT public.get_user_organizations()));

DROP POLICY IF EXISTS "Tenant members can update notifications" ON public.notifications;
CREATE POLICY "Tenant members can update notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (organization_id IN (SELECT public.get_user_organizations()));

DROP POLICY IF EXISTS "Tenant members can delete notifications" ON public.notifications;
CREATE POLICY "Tenant members can delete notifications"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (organization_id IN (SELECT public.get_user_organizations()));

-- ==============================================================================
-- Automatic Onboarding Trigger for New Users
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
BEGIN
  user_store_name := COALESCE(new.raw_user_meta_data->>'store_name', 'Bombay Threads D2C');
  user_founder_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  -- 1. Create a default organization for the user
  INSERT INTO public.organizations (name, slug)
  VALUES (
    user_store_name,
    lower(regexp_replace(user_store_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 8)
  )
  RETURNING id INTO new_org_id;

  -- 2. Add the user as the owner of the organization
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, new.id, 'owner');

  -- 3. Initialize user & store settings
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
  );

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
