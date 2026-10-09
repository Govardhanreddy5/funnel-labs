import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export interface PublicIntegrationConnection {
  id: string;
  organization_id: string;
  provider: 'shopify' | 'meta';
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  account_id: string | null;
  account_name: string | null;
  last_sync_at: string | null;
  last_sync_status: 'success' | 'failed' | 'in_progress' | 'rate_limited' | null;
  last_error: string | null;
  metadata: Record<string, any>;
}

export interface NormalizedMetric {
  id?: string;
  organization_id: string;
  provider: 'shopify' | 'meta';
  campaign_id: string;
  campaign_name: string;
  date: string;
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  purchases: number;
  revenue: number;
  ctr: number;
  cvr: number;
  cpa: number;
  roas: number;
}

export interface IntegrationsState {
  shopify: PublicIntegrationConnection | null;
  meta: PublicIntegrationConnection | null;
  metrics: NormalizedMetric[];
  loading: boolean;
  syncingProvider: 'shopify' | 'meta' | 'all' | null;
  error: string | null;
  refreshStatus: () => Promise<void>;
  syncProvider: (provider: 'shopify' | 'meta') => Promise<boolean>;
  connectProvider: (
    provider: 'shopify' | 'meta',
    details?: { shop?: string; accountId?: string; accountName?: string }
  ) => Promise<boolean>;
  disconnectProvider: (provider: 'shopify' | 'meta') => Promise<boolean>;
  initiateOAuth: (provider: 'shopify' | 'meta', shopDomain?: string) => Promise<void>;
}

export function useIntegrations(): IntegrationsState {
  const { currentOrganization } = useAuth();
  const { addToast } = useApp();

  const orgId = currentOrganization?.id || 'a0000000-0000-0000-0000-000000000001';

  const [shopify, setShopify] = useState<PublicIntegrationConnection | null>(null);
  const [meta, setMeta] = useState<PublicIntegrationConnection | null>(null);
  const [metrics, setMetrics] = useState<NormalizedMetric[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncingProvider, setSyncingProvider] = useState<'shopify' | 'meta' | 'all' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch connection statuses and normalized metrics
  const refreshStatus = useCallback(async () => {
    try {
      const [statusRes, metricsRes] = await Promise.all([
        fetch(`/api/integrations/status?organizationId=${encodeURIComponent(orgId)}`),
        fetch(`/api/integrations/metrics?organizationId=${encodeURIComponent(orgId)}`),
      ]);

      if (statusRes.ok) {
        const data = await statusRes.json();
        setShopify(data.shopify);
        setMeta(data.meta);
      }

      if (metricsRes.ok) {
        const mData = await metricsRes.json();
        setMetrics(mData.metrics || []);
      }
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch integration status:', err);
      setError(err.message || 'Failed to communicate with integrations service');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // 2. Trigger server-side sync with idempotency
  const syncProvider = useCallback(
    async (provider: 'shopify' | 'meta'): Promise<boolean> => {
      setSyncingProvider(provider);
      const idempotencyKey = `manual_sync_${orgId}_${provider}_${Date.now()}`;

      try {
        const res = await fetch('/api/integrations/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId: orgId,
            provider,
            idempotencyKey,
            days: 14,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          addToast({
            title: `${provider === 'shopify' ? 'Shopify' : 'Meta Ads'} Synced`,
            message: `Successfully synchronized ${data.recordsSynced} daily performance records.`,
            type: 'success',
          });
          await refreshStatus();
          return true;
        } else {
          throw new Error(data.error || 'Sync request failed');
        }
      } catch (err: any) {
        addToast({
          title: `Sync Failed`,
          message: err.message || `Unable to sync ${provider} metrics.`,
          type: 'error',
        });
        return false;
      } finally {
        setSyncingProvider(null);
      }
    },
    [orgId, addToast, refreshStatus]
  );

  // 3. Connect provider (Direct / Mock flow)
  const connectProvider = useCallback(
    async (
      provider: 'shopify' | 'meta',
      details?: { shop?: string; accountId?: string; accountName?: string }
    ): Promise<boolean> => {
      setLoading(true);
      try {
        const res = await fetch('/api/integrations/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId: orgId,
            provider,
            accountId: details?.shop || details?.accountId,
            accountName: details?.accountName,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          addToast({
            title: 'Channel Connected',
            message: `Successfully linked ${provider === 'shopify' ? 'Shopify Store' : 'Meta Ads / Instagram'}.`,
            type: 'success',
          });
          await refreshStatus();
          return true;
        } else {
          throw new Error(data.error || 'Failed to connect channel');
        }
      } catch (err: any) {
        addToast({
          title: 'Connection Error',
          message: err.message || 'Failed to link provider channel.',
          type: 'error',
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [orgId, addToast, refreshStatus]
  );

  // 4. Disconnect provider
  const disconnectProvider = useCallback(
    async (provider: 'shopify' | 'meta'): Promise<boolean> => {
      try {
        const res = await fetch('/api/integrations/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organizationId: orgId, provider }),
        });

        if (res.ok) {
          addToast({
            title: 'Channel Disconnected',
            message: `${provider === 'shopify' ? 'Shopify' : 'Meta Ads'} has been disconnected.`,
            type: 'info',
          });
          await refreshStatus();
          return true;
        }
        return false;
      } catch (err: any) {
        addToast({
          title: 'Error',
          message: err.message || 'Failed to disconnect channel.',
          type: 'error',
        });
        return false;
      }
    },
    [orgId, addToast, refreshStatus]
  );

  // 5. Initiate OAuth flow
  const initiateOAuth = useCallback(
    async (provider: 'shopify' | 'meta', shopDomain?: string): Promise<void> => {
      try {
        const shopParam = shopDomain ? `&shop=${encodeURIComponent(shopDomain)}` : '';
        const res = await fetch(
          `/api/integrations/oauth/start?organizationId=${encodeURIComponent(
            orgId
          )}&provider=${provider}${shopParam}`
        );
        const data = await res.json();
        if (res.ok && data.authorizationUrl) {
          window.location.href = data.authorizationUrl;
        } else {
          throw new Error(data.error || 'Failed to generate OAuth authorization link.');
        }
      } catch (err: any) {
        addToast({
          title: 'OAuth Error',
          message: err.message || 'Failed to start authorization flow.',
          type: 'error',
        });
      }
    },
    [orgId, addToast]
  );

  return {
    shopify,
    meta,
    metrics,
    loading,
    syncingProvider,
    error,
    refreshStatus,
    syncProvider,
    connectProvider,
    disconnectProvider,
    initiateOAuth,
  };
}
