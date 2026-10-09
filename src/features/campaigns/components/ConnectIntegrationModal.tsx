import React, { useState } from 'react';
import { X, ShoppingBag, ShieldCheck, ExternalLink, Zap, Lock, AlertCircle } from 'lucide-react';
import { validateShopifyDomain, validateMetaAccountId } from '../../../utils/validators';

interface ConnectIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProvider?: 'shopify' | 'meta';
  onConnect: (
    provider: 'shopify' | 'meta',
    details?: { shop?: string; accountId?: string; accountName?: string }
  ) => Promise<boolean>;
  onStartOAuth: (provider: 'shopify' | 'meta', shop?: string) => Promise<void>;
}

export const ConnectIntegrationModal: React.FC<ConnectIntegrationModalProps> = ({
  isOpen,
  onClose,
  defaultProvider = 'shopify',
  onConnect,
  onStartOAuth,
}) => {
  const [provider, setProvider] = useState<'shopify' | 'meta'>(defaultProvider);
  const [shopDomain, setShopDomain] = useState('bombay-threads.myshopify.com');
  const [metaAccountId, setMetaAccountId] = useState('act_884920147');
  const [connectionMode, setConnectionMode] = useState<'oauth' | 'mock'>('mock');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (provider === 'shopify') {
      const err = validateShopifyDomain(shopDomain);
      if (err) {
        setValidationError(err);
        return;
      }
    } else {
      const err = validateMetaAccountId(metaAccountId);
      if (err) {
        setValidationError(err);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (connectionMode === 'oauth') {
        await onStartOAuth(provider, provider === 'shopify' ? shopDomain : undefined);
      } else {
        const success = await onConnect(provider, {
          shop: provider === 'shopify' ? shopDomain : undefined,
          accountId: provider === 'meta' ? metaAccountId : undefined,
          accountName:
            provider === 'shopify'
              ? `${shopDomain.replace('.myshopify.com', '')} Store`
              : 'Meta Ads — Bombay Threads (Instagram)',
        });
        if (success) {
          onClose();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Connect Marketing Channel</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sync real order transactions and ad metrics directly to Funnel Labs.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
          {validationError && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Channel Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setProvider('shopify')}
              className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                provider === 'shopify'
                  ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Shopify Store</div>
                <div className="text-[11px] text-slate-500">Orders & Revenue</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setProvider('meta')}
              className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                provider === 'meta'
                  ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Meta & Instagram</div>
                <div className="text-[11px] text-slate-500">Spend & Clicks</div>
              </div>
            </button>
          </div>

          {/* Provider Specific Inputs */}
          {provider === 'shopify' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Shopify Store Domain (.myshopify.com)
              </label>
              <input
                type="text"
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                placeholder="store-name.myshopify.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/30"
                required
              />
              <p className="text-[11px] text-slate-400">
                Permissions requested: <code>read_orders</code>, <code>read_products</code>,{' '}
                <code>read_analytics</code>.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Meta Ad Account ID</label>
              <input
                type="text"
                value={metaAccountId}
                onChange={(e) => setMetaAccountId(e.target.value)}
                placeholder="act_1234567890"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/30"
                required
              />
              <p className="text-[11px] text-slate-400">
                Permissions requested: <code>ads_read</code>, <code>read_insights</code>,{' '}
                <code>instagram_basic</code>.
              </p>
            </div>
          )}

          {/* Connection Mode Selection */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
            <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              Integration Mode
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-xs cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="connMode"
                  checked={connectionMode === 'mock'}
                  onChange={() => setConnectionMode('mock')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-semibold text-slate-800">Local Dev Adapter</div>
                  <div className="text-[10px] text-slate-500">Realistic mock sandbox</div>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-xs cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="connMode"
                  checked={connectionMode === 'oauth'}
                  onChange={() => setConnectionMode('oauth')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-semibold text-slate-800">Live OAuth Flow</div>
                  <div className="text-[10px] text-slate-500">Production OAuth redirect</div>
                </div>
              </label>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/80 border border-blue-200/60 text-blue-900 text-xs">
            <Lock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold">AES-256-GCM Encrypted Storage</span>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Tokens are encrypted server-side with AES-256-GCM authenticated encryption.
                Credentials are never sent to or visible inside browser code.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-xs transition-all shadow-sm ${
                provider === 'shopify'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } disabled:opacity-50`}
            >
              {isSubmitting ? (
                <>Connecting...</>
              ) : connectionMode === 'oauth' ? (
                <>
                  <ExternalLink className="w-4 h-4" />
                  <span>Authenticate with {provider === 'shopify' ? 'Shopify' : 'Meta'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Connect Channel Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
