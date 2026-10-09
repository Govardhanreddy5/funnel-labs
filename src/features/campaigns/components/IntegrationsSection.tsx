import React, { useState } from 'react';
import {
  ShoppingBag,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Link2,
  Unlink,
} from 'lucide-react';
import { useIntegrations } from '../../../hooks/useIntegrations';
import { ConnectIntegrationModal } from './ConnectIntegrationModal';
import { NormalizedMetricsTable } from './NormalizedMetricsTable';

export const IntegrationsSection: React.FC = () => {
  const {
    shopify,
    meta,
    metrics,
    syncingProvider,
    syncProvider,
    connectProvider,
    disconnectProvider,
    initiateOAuth,
  } = useIntegrations();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaultProvider, setModalDefaultProvider] = useState<'shopify' | 'meta'>('shopify');
  const [showNormalizedTable, setShowNormalizedTable] = useState(false);

  const openConnectModal = (provider: 'shopify' | 'meta') => {
    setModalDefaultProvider(provider);
    setModalOpen(true);
  };

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Never synced';
    const date = new Date(timestamp);
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Integrations Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Data Ingestion
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-500">
                AES-256-GCM Token Security
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              Connected Marketing & Store Channels
            </h2>
            <p className="text-xs text-slate-500">
              Synchronize Shopify order revenue and Meta Ads / Instagram impressions to compare
              marketing channels.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => setShowNormalizedTable(!showNormalizedTable)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-xs font-semibold transition-all shadow-xs"
            >
              <span>
                {showNormalizedTable
                  ? 'Hide Ingested Data'
                  : `View Synced Records (${metrics.length})`}
              </span>
              {showNormalizedTable ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Integration Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          {/* 1. Shopify Channel Card */}
          <div className="p-4 rounded-xl border border-slate-200/90 bg-gradient-to-br from-emerald-50/20 via-white to-white flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-xs flex-shrink-0">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Shopify Store</span>
                    {shopify?.status === 'connected' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Connected
                      </span>
                    ) : shopify?.status === 'syncing' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
                        Syncing...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Disconnected
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">
                    {shopify?.account_id || 'bombay-threads.myshopify.com'}
                  </div>
                </div>
              </div>

              {shopify?.status === 'connected' && (
                <button
                  onClick={() => disconnectProvider('shopify')}
                  title="Disconnect channel"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Unlink className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Last Sync: <strong>{formatLastSync(shopify?.last_sync_at ?? null)}</strong>
                </span>
              </div>

              {shopify?.status === 'connected' ? (
                <button
                  onClick={() => syncProvider('shopify')}
                  disabled={syncingProvider === 'shopify'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-60"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${syncingProvider === 'shopify' ? 'animate-spin' : ''}`}
                  />
                  <span>{syncingProvider === 'shopify' ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              ) : (
                <button
                  onClick={() => openConnectModal('shopify')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-xs"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Connect Store</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. Meta Ads & Instagram Channel Card */}
          <div className="p-4 rounded-xl border border-slate-200/90 bg-gradient-to-br from-indigo-50/20 via-white to-white flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Meta Ads & Instagram</span>
                    {meta?.status === 'connected' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                        Connected
                      </span>
                    ) : meta?.status === 'syncing' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
                        Syncing...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Disconnected
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">
                    {meta?.account_name || 'Ad Account act_884920147'}
                  </div>
                </div>
              </div>

              {meta?.status === 'connected' && (
                <button
                  onClick={() => disconnectProvider('meta')}
                  title="Disconnect channel"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Unlink className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Last Sync: <strong>{formatLastSync(meta?.last_sync_at ?? null)}</strong>
                </span>
              </div>

              {meta?.status === 'connected' ? (
                <button
                  onClick={() => syncProvider('meta')}
                  disabled={syncingProvider === 'meta'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-60"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${syncingProvider === 'meta' ? 'animate-spin' : ''}`}
                  />
                  <span>{syncingProvider === 'meta' ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              ) : (
                <button
                  onClick={() => openConnectModal('meta')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-xs"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Connect Meta</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sync or Rate Limit Notice */}
        {(shopify?.last_error || meta?.last_error) && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Sync Alert: {shopify?.last_error || meta?.last_error}</span>
          </div>
        )}
      </div>

      {/* Expandable Normalized Metrics Table */}
      {showNormalizedTable && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <NormalizedMetricsTable metrics={metrics} />
        </div>
      )}

      {/* Connect Modal */}
      <ConnectIntegrationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultProvider={modalDefaultProvider}
        onConnect={connectProvider}
        onStartOAuth={initiateOAuth}
      />
    </div>
  );
};
