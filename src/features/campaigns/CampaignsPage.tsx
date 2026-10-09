import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Search, Play, Pause, Layers, Share2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CampaignStatus, CampaignChannel } from '../../types';
import { EmptyState } from '../../components/common/EmptyState';
import { IntegrationsSection } from './components/IntegrationsSection';

export const CampaignsPage: React.FC = () => {
  const navigate = useNavigate();
  const { campaigns, toggleCampaignStatus, viewExperimentDetails, addToast } = useApp();

  const [statusFilter, setStatusFilter] = useState<'All' | CampaignStatus>('All');
  const [channelFilter] = useState<'All' | CampaignChannel>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCampaigns = campaigns.filter((camp) => {
    const matchesStatus = statusFilter === 'All' || camp.status === statusFilter;
    const matchesChannel = channelFilter === 'All' || camp.channel === channelFilter;
    const matchesSearch = camp.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesChannel && matchesSearch;
  });

  const totalReach = campaigns.reduce((acc, c) => acc + c.reach, 0);
  const totalPurchases = campaigns.reduce((acc, c) => acc + c.purchases, 0);
  const totalRevenue = campaigns.reduce((acc, c) => acc + c.revenue, 0);
  const totalSpend = campaigns.reduce((acc, c) => acc + c.spend, 0);
  const blendedRoas = (totalRevenue / (totalSpend || 1)).toFixed(2);

  const getChannelBadge = (channel: CampaignChannel) => {
    switch (channel) {
      case 'Instagram':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
            Instagram
          </span>
        );
      case 'Google Search':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Google Search
          </span>
        );
      case 'Facebook':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Facebook
          </span>
        );
      case 'WhatsApp':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            WhatsApp
          </span>
        );
    }
  };

  const handleOpenExperiment = (expId: string) => {
    viewExperimentDetails(expId);
    navigate(`/experiments/${expId}`);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Campaigns
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track and synchronize the marketing channels connected to your experiments.
          </p>
        </div>

        <button
          onClick={() => {
            addToast({
              title: 'Ad Channel Sync',
              message: 'Shopify Store and Meta Ads / Instagram data synced.',
              type: 'success',
            });
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm transition-all shadow-sm self-start sm:self-auto"
        >
          <Share2 className="w-4 h-4" />
          <span>Sync Channels</span>
        </button>
      </div>

      {/* Connected Real Data Integrations Status Bar */}
      <IntegrationsSection />

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-clean p-4 bg-white">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Total Reach
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {totalReach.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">+24% vs last mo</span>
        </div>
        <div className="card-clean p-4 bg-white">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Purchases
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900">{totalPurchases}</div>
          <span className="text-[11px] text-emerald-600 font-medium">339 orders logged</span>
        </div>
        <div className="card-clean p-4 bg-white">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Total Revenue
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            ₹{totalRevenue.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">+42% revenue lift</span>
        </div>
        <div className="card-clean p-4 bg-white">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Blended ROAS
          </span>
          <div className="text-xl sm:text-2xl font-black text-indigo-600">{blendedRoas}x</div>
          <span className="text-[11px] text-slate-500 font-medium">
            ₹{(totalSpend / 1000).toFixed(1)}k total spend
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card-clean p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['All', 'Active', 'Paused', 'Completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                statusFilter === tab
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Campaigns Content */}
      {filteredCampaigns.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="w-7 h-7 text-indigo-600" />}
          title="No campaigns found"
          description={
            searchQuery || statusFilter !== 'All'
              ? 'Try modifying your search or filter settings to see more campaigns.'
              : 'You have not connected any ad campaigns to Funnel Labs yet.'
          }
          action={
            searchQuery || statusFilter !== 'All'
              ? {
                  label: 'Clear Filters',
                  onClick: () => {
                    setStatusFilter('All');
                    setSearchQuery('');
                  },
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map((camp) => {
            return (
              <div
                key={camp.id}
                className="card-clean p-5 sm:p-6 bg-white hover:border-slate-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Campaign Title & Meta */}
                <div className="space-y-2 lg:max-w-md">
                  <div className="flex items-center gap-2">
                    {getChannelBadge(camp.channel)}
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        camp.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : camp.status === 'Paused'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {camp.status === 'Active' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      )}
                      {camp.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{camp.name}</h3>

                  {camp.connectedExperimentId && (
                    <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Connected to experiment</span>
                      <button
                        onClick={() => handleOpenExperiment(camp.connectedExperimentId!)}
                        className="underline font-semibold hover:text-indigo-800 ml-1"
                      >
                        View Experiment →
                      </button>
                    </div>
                  )}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 flex-1 lg:max-w-xl">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Reach
                    </span>
                    <span className="text-base sm:text-lg font-bold text-slate-800">
                      {camp.reach.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Clicks
                    </span>
                    <span className="text-base sm:text-lg font-bold text-slate-800">
                      {camp.clicks.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Purchases
                    </span>
                    <span className="text-base sm:text-lg font-bold text-slate-800">
                      {camp.purchases}
                    </span>
                  </div>

                  <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 block mb-0.5">
                      Revenue
                    </span>
                    <span className="text-base sm:text-lg font-bold text-emerald-900">
                      ₹{camp.revenue.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                  <button
                    onClick={() => toggleCampaignStatus(camp.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      camp.status === 'Active'
                        ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {camp.status === 'Active' ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause Campaign</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Resume Campaign</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CampaignsPage;
