import React, { useState } from 'react';
import { NormalizedMetric } from '../../../hooks/useIntegrations';
import {
  Table,
  ArrowUpDown,
  Calendar,
  DollarSign,
  Eye,
  MousePointer,
  ShoppingCart,
} from 'lucide-react';

interface NormalizedMetricsTableProps {
  metrics: NormalizedMetric[];
  currencySymbol?: string;
}

export const NormalizedMetricsTable: React.FC<NormalizedMetricsTableProps> = ({
  metrics,
  currencySymbol = '₹',
}) => {
  const [channelFilter, setChannelFilter] = useState<'all' | 'shopify' | 'meta'>('all');
  const [sortField, setSortField] = useState<'date' | 'revenue' | 'spend' | 'purchases'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = metrics
    .filter((m) => channelFilter === 'all' || m.provider === channelFilter)
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortField === 'revenue') cmp = a.revenue - b.revenue;
      else if (sortField === 'spend') cmp = a.spend - b.spend;
      else if (sortField === 'purchases') cmp = a.purchases - b.purchases;
      return sortAsc ? cmp : -cmp;
    });

  const toggleSort = (field: 'date' | 'revenue' | 'spend' | 'purchases') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Normalized Daily Channel Metrics ({filtered.length} Records)
            </h3>
            <p className="text-[11px] text-slate-500">
              Synchronized time-series performance from Shopify and Meta Ads / Instagram.
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setChannelFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              channelFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Channels
          </button>
          <button
            onClick={() => setChannelFilter('shopify')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              channelFilter === 'shopify'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Shopify Store
          </button>
          <button
            onClick={() => setChannelFilter('meta')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              channelFilter === 'meta'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Meta & Instagram
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-[700px] text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/30 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th
                onClick={() => toggleSort('date')}
                className="py-3 px-4 cursor-pointer hover:text-slate-800 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4">Channel & Campaign</th>
              <th className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Impressions</span>
                </div>
              </th>
              <th className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <MousePointer className="w-3.5 h-3.5" />
                  <span>Clicks</span>
                </div>
              </th>
              <th
                onClick={() => toggleSort('spend')}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-800 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Ad Spend</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('purchases')}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-800 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Purchases</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('revenue')}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-800 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Revenue</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">ROAS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  No normalized records found. Click &quot;Sync Now&quot; above to ingest metrics.
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => {
                const isShopify = item.provider === 'shopify';
                return (
                  <tr
                    key={`${item.provider}-${item.campaign_id}-${item.date}-${idx}`}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-slate-700 whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isShopify
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {isShopify ? 'Shopify' : 'Meta Ads'}
                        </span>
                        <span
                          className="font-medium text-slate-800 truncate max-w-[200px]"
                          title={item.campaign_name}
                        >
                          {item.campaign_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {item.impressions > 0 ? item.impressions.toLocaleString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {item.clicks > 0 ? item.clicks.toLocaleString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                      {item.spend > 0 ? `${currencySymbol}${item.spend.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {item.purchases.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      {currencySymbol}
                      {item.revenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      {item.roas > 0 ? (
                        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {item.roas.toFixed(2)}x
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
