import { createClient } from '@supabase/supabase-js';
import { decryptToken } from './crypto';
import { ShopifyAdapter } from './adapters/shopifyAdapter';
import { MetaAdapter } from './adapters/metaAdapter';
import {
  ProviderType,
  NormalizedDailyMetric,
  SyncResult,
  IntegrationConnectionRecord,
} from './types';

// In-memory fallback stores for local development resilience
const memoryMetricsStore = new Map<string, NormalizedDailyMetric[]>();
const activeJobTracker = new Set<string>();

function getSupabaseClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export class SyncEngine {
  private shopifyAdapter: ShopifyAdapter;
  private metaAdapter: MetaAdapter;

  constructor() {
    this.shopifyAdapter = new ShopifyAdapter();
    this.metaAdapter = new MetaAdapter();
  }

  /**
   * Run an idempotent synchronization job for a provider with retry and backoff
   */
  async runSyncJob(
    organizationId: string,
    provider: ProviderType,
    options: {
      idempotencyKey?: string;
      daysToSync?: number;
      triggerType?: 'manual' | 'scheduled' | 'webhook';
    } = {}
  ): Promise<SyncResult> {
    const days = options.daysToSync || 14;
    const now = new Date();
    const endDate = now.toISOString().slice(0, 10);
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const idempotencyKey =
      options.idempotencyKey ||
      `sync_${organizationId}_${provider}_${now.toISOString().slice(0, 13)}`;

    // 1. Idempotency Guard
    if (activeJobTracker.has(idempotencyKey)) {
      return {
        success: false,
        recordsSynced: 0,
        metrics: [],
        error: 'A sync job with this idempotency key is already actively executing.',
      };
    }

    activeJobTracker.add(idempotencyKey);
    const supabase = getSupabaseClient();
    let jobId: string | null = null;

    try {
      // 2. Fetch connection record & check active status
      const connection = await this.getConnection(organizationId, provider);
      if (!connection || connection.status === 'disconnected') {
        throw new Error(`Integration for ${provider} is not connected. Please connect first.`);
      }

      // Record sync job in DB if available
      if (supabase) {
        try {
          const { data: jobData } = await supabase
            .from('sync_jobs')
            .insert({
              organization_id: organizationId,
              provider,
              status: 'running',
              trigger_type: options.triggerType || 'manual',
              idempotency_key: idempotencyKey,
              started_at: new Date().toISOString(),
            })
            .select('id')
            .single();

          if (jobData) jobId = jobData.id;
        } catch {
          // Schema may still be pending execution
        }

        // Set status to 'syncing'
        await this.updateConnectionStatus(organizationId, provider, {
          status: 'syncing',
          last_error: null,
        });
      }

      // 3. Decrypt token if present (or fallback for mock)
      let decryptedToken = 'mock_token';
      if (
        connection.encrypted_access_token &&
        connection.token_iv &&
        connection.token_auth_tag
      ) {
        try {
          decryptedToken = decryptToken(
            connection.encrypted_access_token,
            connection.token_iv,
            connection.token_auth_tag
          );
        } catch (decryptErr) {
          console.warn(`[SyncEngine] Decryption failed, falling back to mock mode:`, decryptErr);
        }
      }

      // 4. Execute extraction with Exponential Backoff Retries
      const { metrics, rateLimitInfo } = await this.executeWithRetry(
        provider,
        organizationId,
        connection.account_id || 'default_account',
        decryptedToken,
        startDate,
        endDate
      );

      // 5. Idempotent normalized data ingestion
      await this.persistNormalizedMetrics(organizationId, metrics);

      // 6. Update connection status and timestamps
      await this.updateConnectionStatus(organizationId, provider, {
        status: 'connected',
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'success',
        last_error: null,
      });

      // 7. Complete sync job
      if (supabase && jobId) {
        try {
          await supabase
            .from('sync_jobs')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              records_synced: metrics.length,
              rate_limit_info: rateLimitInfo,
            })
            .eq('id', jobId);
        } catch {
          // Ignore
        }
      }

      return {
        success: true,
        recordsSynced: metrics.length,
        metrics,
        rateLimitInfo,
      };
    } catch (err: any) {
      console.error(`[SyncEngine] Error syncing ${provider}:`, err.message);

      // Record failure state
      await this.updateConnectionStatus(organizationId, provider, {
        status: 'error',
        last_sync_status: 'failed',
        last_error: err.message,
      });

      if (supabase && jobId) {
        try {
          await supabase
            .from('sync_jobs')
            .update({
              status: 'failed',
              completed_at: new Date().toISOString(),
              error_message: err.message,
            })
            .eq('id', jobId);
        } catch {
          // Ignore
        }
      }

      return {
        success: false,
        recordsSynced: 0,
        metrics: [],
        error: err.message,
      };
    } finally {
      activeJobTracker.delete(idempotencyKey);
    }
  }

  /**
   * Execute adapter extraction with exponential backoff and jitter for transient errors
   */
  private async executeWithRetry(
    provider: ProviderType,
    organizationId: string,
    accountId: string,
    token: string,
    startDate: string,
    endDate: string,
    maxRetries = 3
  ): Promise<{ metrics: NormalizedDailyMetric[]; rateLimitInfo: Record<string, any> }> {
    let attempt = 0;
    let lastError: any = null;

    while (attempt <= maxRetries) {
      try {
        if (provider === 'shopify') {
          return await this.shopifyAdapter.fetchDailyMetrics(
            organizationId,
            accountId,
            token,
            startDate,
            endDate
          );
        } else if (provider === 'meta') {
          return await this.metaAdapter.fetchDailyInsights(
            organizationId,
            accountId,
            token,
            startDate,
            endDate
          );
        } else {
          throw new Error(`Unsupported provider: ${provider}`);
        }
      } catch (error: any) {
        lastError = error;
        attempt++;

        // Only retry retryable status codes (429, 500, 502, 503, 504)
        const isRetryable =
          error.status === 429 ||
          (error.status >= 500 && error.status <= 504) ||
          error.message?.includes('network') ||
          error.message?.includes('rate limit');

        if (!isRetryable || attempt > maxRetries) {
          throw error;
        }

        // Exponential backoff: base * 2^attempt + jitter
        const baseMs = error.retryAfter ? error.retryAfter * 1000 : 500;
        const delay = Math.min(baseMs * Math.pow(2, attempt) + Math.random() * 300, 10000);

        console.log(
          `[SyncEngine] Transient error on ${provider} (attempt ${attempt}/${maxRetries}). Retrying in ${Math.round(
            delay
          )}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Fetch connection details
   */
  async getConnection(
    organizationId: string,
    provider: ProviderType
  ): Promise<IntegrationConnectionRecord | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('integration_connections')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('provider', provider)
          .maybeSingle();

        if (!error && data) return data as IntegrationConnectionRecord;
      } catch {
        // Fallback below
      }
    }

    // Default development fallback connection
    return {
      id: `dev-${provider}-${organizationId}`,
      organization_id: organizationId,
      provider,
      status: 'connected',
      account_id: provider === 'shopify' ? 'bombay-threads.myshopify.com' : 'act_884920147',
      account_name: provider === 'shopify' ? 'Bombay Threads Store' : 'Meta Ads — Bombay Threads',
      metadata: { mode: 'mock_development' },
      last_sync_at: new Date(Date.now() - 3600000).toISOString(),
      last_sync_status: 'success',
      last_error: null,
    };
  }

  /**
   * Persist normalized metrics to database with idempotent upsert
   */
  async persistNormalizedMetrics(
    organizationId: string,
    metrics: NormalizedDailyMetric[]
  ): Promise<void> {
    const supabase = getSupabaseClient();

    // Store in-memory cache for instant UI rendering
    const existing = memoryMetricsStore.get(organizationId) || [];
    // Merge on (provider, campaign_id, date)
    const key = (m: NormalizedDailyMetric) => `${m.provider}_${m.campaign_id}_${m.date}`;
    const map = new Map(existing.map((m) => [key(m), m]));
    for (const m of metrics) {
      map.set(key(m), m);
    }
    memoryMetricsStore.set(organizationId, Array.from(map.values()));

    if (!supabase || metrics.length === 0) return;

    try {
      const records = metrics.map((m) => ({
        organization_id: m.organization_id,
        provider: m.provider,
        campaign_id: m.campaign_id,
        campaign_name: m.campaign_name,
        date: m.date,
        impressions: m.impressions,
        reach: m.reach,
        clicks: m.clicks,
        spend: m.spend,
        purchases: m.purchases,
        revenue: m.revenue,
        ctr: m.ctr,
        cvr: m.cvr,
        cpa: m.cpa,
        roas: m.roas,
        raw_data: m.raw_data || {},
        updated_at: new Date().toISOString(),
      }));

      await supabase.from('campaign_metrics_daily').upsert(records, {
        onConflict: 'organization_id,provider,campaign_id,date',
      });
    } catch (err: any) {
      console.warn('[SyncEngine] DB metric upsert skipped (schema may be pending):', err.message);
    }
  }

  /**
   * Get cached or database metrics for dashboard
   */
  async getMetrics(
    organizationId: string,
    provider?: ProviderType
  ): Promise<NormalizedDailyMetric[]> {
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        let query = supabase
          .from('campaign_metrics_daily')
          .select('*')
          .eq('organization_id', organizationId)
          .order('date', { ascending: false });

        if (provider) {
          query = query.eq('provider', provider);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as NormalizedDailyMetric[];
        }
      } catch {
        // Fall back to memory store
      }
    }

    const memoryList = memoryMetricsStore.get(organizationId) || [];
    if (provider) {
      return memoryList.filter((m) => m.provider === provider);
    }
    return memoryList;
  }

  /**
   * Update integration connection status
   */
  async updateConnectionStatus(
    organizationId: string,
    provider: ProviderType,
    updates: Partial<IntegrationConnectionRecord>
  ): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      await supabase
        .from('integration_connections')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId)
        .eq('provider', provider);
    } catch {
      // Ignore
    }
  }
}

export const syncEngine = new SyncEngine();
