export type ProviderType = 'shopify' | 'meta' | 'google';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'syncing';
export type SyncStatus = 'success' | 'failed' | 'in_progress' | 'rate_limited';

export interface IntegrationConnectionRecord {
  id: string;
  organization_id: string;
  provider: ProviderType;
  status: IntegrationStatus;
  account_id: string | null;
  account_name: string | null;
  encrypted_access_token?: string | null;
  token_iv?: string | null;
  token_auth_tag?: string | null;
  token_expires_at?: string | null;
  scope?: string | null;
  metadata: Record<string, any>;
  last_sync_at: string | null;
  last_sync_status: SyncStatus | null;
  last_error: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PublicIntegrationConnection {
  id: string;
  organization_id: string;
  provider: ProviderType;
  status: IntegrationStatus;
  account_id: string | null;
  account_name: string | null;
  metadata: Record<string, any>;
  last_sync_at: string | null;
  last_sync_status: SyncStatus | null;
  last_error: string | null;
}

export interface NormalizedDailyMetric {
  id?: string;
  organization_id: string;
  provider: ProviderType;
  campaign_id: string;
  campaign_name: string;
  date: string; // YYYY-MM-DD
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
  raw_data?: Record<string, any>;
}

export interface SyncJobRecord {
  id: string;
  organization_id: string;
  provider: ProviderType;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rate_limited';
  trigger_type: 'manual' | 'scheduled' | 'webhook';
  idempotency_key: string;
  started_at: string;
  completed_at?: string | null;
  records_synced: number;
  retry_count: number;
  max_retries: number;
  error_message?: string | null;
  rate_limit_info?: Record<string, any>;
}

export interface SyncResult {
  success: boolean;
  recordsSynced: number;
  metrics: NormalizedDailyMetric[];
  rateLimitInfo?: Record<string, any>;
  error?: string;
}
