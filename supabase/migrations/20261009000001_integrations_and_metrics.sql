-- ==============================================================================
-- Funnel Labs — Real Data Integrations (Shopify & Meta Ads/Instagram)
-- Migration: 20261009000001_integrations_and_metrics.sql
-- ==============================================================================

-- 1. Integration Connections (Multi-Tenant, Encrypted Token Storage)
CREATE TABLE IF NOT EXISTS public.integration_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('shopify', 'meta', 'google')),
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'syncing')),
  account_id TEXT,             -- e.g. "bombay-threads.myshopify.com" or Meta Ad Account "act_884920147"
  account_name TEXT,           -- e.g. "Bombay Threads Store" or "Meta Ads - Bombay Threads"
  encrypted_access_token TEXT, -- AES-256-GCM ciphertext
  token_iv TEXT,               -- AES-256-GCM initialization vector (base64)
  token_auth_tag TEXT,         -- AES-256-GCM authentication tag (base64)
  token_expires_at TIMESTAMPTZ,
  scope TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'failed', 'in_progress', 'rate_limited')),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_integration_org_provider UNIQUE (organization_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_integrations_org ON public.integration_connections(organization_id);

-- 2. Sync Jobs (Idempotency, Retries, Rate Limit Tracking)
CREATE TABLE IF NOT EXISTS public.sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('shopify', 'meta', 'google')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'rate_limited')),
  trigger_type TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'scheduled', 'webhook')),
  idempotency_key TEXT NOT NULL UNIQUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  records_synced INTEGER NOT NULL DEFAULT 0,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  rate_limit_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_org ON public.sync_jobs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_idempotency ON public.sync_jobs(idempotency_key);

-- 3. Normalized Daily Campaign Metrics (Time-series aggregations)
CREATE TABLE IF NOT EXISTS public.campaign_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('shopify', 'meta', 'google')),
  campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  date DATE NOT NULL,
  impressions BIGINT NOT NULL DEFAULT 0,
  reach BIGINT NOT NULL DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0,
  spend NUMERIC(14, 2) NOT NULL DEFAULT 0,
  purchases INTEGER NOT NULL DEFAULT 0,
  revenue NUMERIC(14, 2) NOT NULL DEFAULT 0,
  ctr NUMERIC(8, 4) NOT NULL DEFAULT 0,
  cvr NUMERIC(8, 4) NOT NULL DEFAULT 0,
  cpa NUMERIC(12, 2) NOT NULL DEFAULT 0,
  roas NUMERIC(8, 2) NOT NULL DEFAULT 0,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_daily_metrics_org_provider_camp_date UNIQUE (organization_id, provider, campaign_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_org_date ON public.campaign_metrics_daily(organization_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_provider_camp ON public.campaign_metrics_daily(provider, campaign_id);

-- Enable Row Level Security
ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_metrics_daily ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS Policies for Integrations & Sync Tables
-- ------------------------------------------------------------------------------

-- integration_connections policies
DROP POLICY IF EXISTS "Users can view integration connections for their org" ON public.integration_connections;
CREATE POLICY "Users can view integration connections for their org"
  ON public.integration_connections
  FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT public.get_user_organizations()));

DROP POLICY IF EXISTS "Admins can manage integration connections" ON public.integration_connections;
CREATE POLICY "Admins can manage integration connections"
  ON public.integration_connections
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- sync_jobs policies
DROP POLICY IF EXISTS "Users can view sync jobs for their org" ON public.sync_jobs;
CREATE POLICY "Users can view sync jobs for their org"
  ON public.sync_jobs
  FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT public.get_user_organizations()));

DROP POLICY IF EXISTS "Users can create sync jobs for their org" ON public.sync_jobs;
CREATE POLICY "Users can create sync jobs for their org"
  ON public.sync_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (SELECT public.get_user_organizations()));

DROP POLICY IF EXISTS "Users can update sync jobs for their org" ON public.sync_jobs;
CREATE POLICY "Users can update sync jobs for their org"
  ON public.sync_jobs
  FOR UPDATE
  TO authenticated
  USING (organization_id IN (SELECT public.get_user_organizations()));

-- campaign_metrics_daily policies
DROP POLICY IF EXISTS "Users can view daily metrics for their org" ON public.campaign_metrics_daily;
CREATE POLICY "Users can view daily metrics for their org"
  ON public.campaign_metrics_daily
  FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT public.get_user_organizations()));

DROP POLICY IF EXISTS "Admins can insert or modify daily metrics" ON public.campaign_metrics_daily;
CREATE POLICY "Admins can insert or modify daily metrics"
  ON public.campaign_metrics_daily
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
