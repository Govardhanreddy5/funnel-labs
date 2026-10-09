import React, { useState } from 'react';
import {
  Users,
  ShoppingBag,
  IndianRupee,
  Plus,
  ArrowUpRight,
  Trophy,
  Sparkles,
  ArrowRight,
  BarChart3,
  Eye,
  Zap,
  Percent,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { useExperimentEvaluation } from '../../hooks/useExperimentEvaluation';

export const DashboardPage: React.FC = () => {
  const { setIsCreateModalOpen, viewExperimentDetails, experiments, campaigns, addToast } =
    useApp();

  const [activeChartMetric, setActiveChartMetric] = useState<'all' | 'volume' | 'rates'>('all');

  // Aggregated campaign KPIs
  const totalReach = campaigns.reduce((acc, c) => acc + c.reach, 0);
  const totalPurchases = campaigns.reduce((acc, c) => acc + c.purchases, 0);
  const totalRevenue = campaigns.reduce((acc, c) => acc + c.revenue, 0);

  // Find the primary T-Shirt Offer Campaign & evaluate dynamically
  const heroExperiment = experiments.find((e) => e.id === 'exp-1') || experiments[0];
  const heroEval = useExperimentEvaluation(heroExperiment);

  const variantA = heroEval?.variantA || heroExperiment?.variants?.[0];
  const variantB = heroEval?.variantB || heroExperiment?.variants?.[1];
  const lifts = heroEval?.lifts;

  // Best Conversion Rate across all experiments
  const bestConversionRate = experiments.reduce((max, e) => {
    const eMax = e.variants.reduce((vM, v) => Math.max(vM, v.conversionRate || 0), 0);
    return Math.max(max, eMax);
  }, 9.0);

  // Chart data comparing the two variants
  const comparisonBarData = [
    {
      metric: 'Clicks',
      [variantA?.name || 'Variant A']: variantA?.clicks || 1240,
      [variantB?.name || 'Variant B']: variantB?.clicks || 1860,
      displayA: (variantA?.clicks || 1240).toLocaleString(),
      displayB: (variantB?.clicks || 1860).toLocaleString(),
      lift:
        variantA?.clicks && variantB?.clicks
          ? `${Math.round(((variantB.clicks - variantA.clicks) / variantA.clicks) * 100)}%`
          : '+50%',
    },
    {
      metric: 'Purchases',
      [variantA?.name || 'Variant A']: variantA?.purchases || 62,
      [variantB?.name || 'Variant B']: variantB?.purchases || 84,
      displayA: (variantA?.purchases || 62).toString(),
      displayB: (variantB?.purchases || 84).toString(),
      lift: lifts ? `${lifts.purchasesLift > 0 ? '+' : ''}${lifts.purchasesLift}%` : '+35%',
    },
    {
      metric: 'Revenue (₹)',
      [variantA?.name || 'Variant A']: variantA?.revenue || 12400,
      [variantB?.name || 'Variant B']: variantB?.revenue || 18300,
      displayA: `₹${(variantA?.revenue || 12400).toLocaleString()}`,
      displayB: `₹${(variantB?.revenue || 18300).toLocaleString()}`,
      lift: lifts ? `${lifts.revenueLift > 0 ? '+' : ''}${lifts.revenueLift}%` : '+48%',
    },
    {
      metric: 'Conv. Rate (%)',
      [variantA?.name || 'Variant A']: variantA?.conversionRate || 5.0,
      [variantB?.name || 'Variant B']: variantB?.conversionRate || 9.0,
      displayA: `${variantA?.conversionRate || 5.0}%`,
      displayB: `${variantB?.conversionRate || 9.0}%`,
      lift: lifts
        ? `${lifts.relativeConversionLift > 0 ? '+' : ''}${lifts.relativeConversionLift}%`
        : '+80%',
    },
    {
      metric: 'Cost / Conv (₹)',
      [variantA?.name || 'Variant A']:
        (variantA as any)?.costPerAcquisition || (variantA as any)?.costPerConversion || 200,
      [variantB?.name || 'Variant B']:
        (variantB as any)?.costPerAcquisition || (variantB as any)?.costPerConversion || 120,
      displayA: `₹${(variantA as any)?.costPerAcquisition || (variantA as any)?.costPerConversion || 200}`,
      displayB: `₹${(variantB as any)?.costPerAcquisition || (variantB as any)?.costPerConversion || 120}`,
    },
  ];

  // Volume & rate breakdowns for tailored charts
  const volumeData = comparisonBarData.filter((d) => ['Clicks', 'Purchases'].includes(d.metric));
  const rateData = [
    {
      metric: 'Conversion Rate',
      [variantA?.name || 'Variant A']: variantA?.conversionRate || 5.0,
      [variantB?.name || 'Variant B']: variantB?.conversionRate || 9.0,
      unit: '%',
    },
    {
      metric: 'Cost per Conversion (₹)',
      [variantA?.name || 'Variant A']:
        (variantA as any)?.costPerAcquisition || (variantA as any)?.costPerConversion || 200,
      [variantB?.name || 'Variant B']:
        (variantB as any)?.costPerAcquisition || (variantB as any)?.costPerConversion || 120,
      unit: '₹',
    },
  ];

  const handleAllocateBudget = () => {
    addToast({
      title: 'Budget Allocation Applied!',
      message: '₹10,000 budget re-routed to Variant B (Buy 2 Get 1).',
      type: 'success',
    });
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Marketing Experiments
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Test different strategies and find out what actually works for your business.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Experiment</span>
          </button>
        </div>
      </div>

      {/* Four Required KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Campaign Reach */}
        <div className="card-clean p-5 relative overflow-hidden group hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Campaign Reach</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            {(totalReach || 12500).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+28% from previous period</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* KPI 2: Total Purchases */}
        <div className="card-clean p-5 relative overflow-hidden group hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Purchases</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            {(totalPurchases || 146).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+35% from previous period</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* KPI 3: Total Revenue */}
        <div className="card-clean p-5 relative overflow-hidden group hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            ₹{(totalRevenue || 30700).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+42% from previous period</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* KPI 4: Best Conversion Rate */}
        <div className="card-clean p-5 relative overflow-hidden group hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Best Conversion Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            {bestConversionRate}%
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+4.0% improvement</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* CORE UX CARD: “Which marketing option should I spend more money on?” */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-indigo-300 mb-0.5">
              Direct Decision Engine
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              “Which marketing option should I spend more money on?”
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Answer:{' '}
              {heroEval?.decisionState === 'winner_declared' && heroEval.winnerVariant ? (
                <>
                  <strong className="text-emerald-400">{heroEval.winnerVariant.name}</strong>{' '}
                  produces{' '}
                  {heroEval.lifts.purchasesLift > 0
                    ? `+${heroEval.lifts.purchasesLift}%`
                    : `${heroEval.lifts.purchasesLift}%`}{' '}
                  more purchases,{' '}
                  {heroEval.lifts.relativeConversionLift > 0
                    ? `+${heroEval.lifts.relativeConversionLift}%`
                    : `${heroEval.lifts.relativeConversionLift}%`}{' '}
                  higher conversion rate, and saves ₹{Math.abs(heroEval.lifts.cpaSavings)} per
                  acquisition ({heroEval.stats.confidenceScore}% confidence).
                </>
              ) : heroEval?.decisionState === 'in_progress' ? (
                <>
                  <strong className="text-blue-400">Data collection in progress</strong> (
                  {heroEval.stats.confidenceScore}% confidence). Minimum sample size met (
                  {heroEval.minSampleSizeRequired} clicks), continue testing before shifting budget.
                </>
              ) : heroEval?.decisionState === 'insufficient_data' ? (
                <>
                  <strong className="text-amber-400">Sample size insufficient</strong> (
                  {Math.min(variantA?.clicks || 0, variantB?.clicks || 0)} /{' '}
                  {heroEval.minSampleSizeRequired} clicks). Maintain 50/50 split before scaling
                  budget.
                </>
              ) : (
                <>
                  <strong className="text-slate-300">Inconclusive test</strong>. Neither variant
                  reached significant lift.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAllocateBudget}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-emerald-500/30 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Scale Winner Ad</span>
          </button>
          <button
            onClick={() => viewExperimentDetails('exp-1')}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm border border-white/20 transition-all flex items-center gap-1.5"
          >
            <span>View Full Study</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ACTIVE EXPERIMENT CARD (Large Card with Side-by-Side Variants) */}
      {heroExperiment && (
        <div className="card-clean p-6 sm:p-8 bg-white shadow-sm border border-slate-200">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  Primary Active Experiment
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Active
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {heroExperiment.name}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">“{heroExperiment.description}”</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => viewExperimentDetails(heroExperiment.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>View Full Details</span>
              </button>
            </div>
          </div>

          {/* Two Variants Side by Side */}
          {variantA && variantB && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* VARIANT A */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-200 text-slate-700">
                    VARIANT A
                  </span>
                  <span className="text-xs font-medium text-slate-500">Baseline Control</span>
                </div>

                <div className="mb-5">
                  <h3 className="text-lg font-bold text-slate-900">{variantA.name}</h3>
                  <p className="text-sm text-slate-600 font-medium italic mt-0.5">
                    “{variantA.tagline}”
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-200/80">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Clicks
                    </span>
                    <span className="text-lg font-bold text-slate-800">
                      {variantA.clicks.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Purchases
                    </span>
                    <span className="text-lg font-bold text-slate-800">{variantA.purchases}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Revenue
                    </span>
                    <span className="text-lg font-bold text-slate-800">
                      ₹{variantA.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Conversion Rate
                    </span>
                    <span className="text-lg font-bold text-slate-800">
                      {variantA.conversionRate}%
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/70 col-span-2 sm:col-span-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Cost per Conv
                    </span>
                    <span className="text-lg font-bold text-slate-800">
                      ₹{variantA.costPerConversion}
                    </span>
                  </div>
                </div>
              </div>

              {/* VARIANT B (CLEARLY HIGHLIGHTED AS WINNER) */}
              <div className="card-winner p-6 rounded-2xl relative overflow-hidden transition-all">
                {/* Winner Badge Ribbon */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-600 text-white shadow-sm flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" />
                      VARIANT B
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ★ WINNING VARIANT
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">
                    {heroEval?.stats?.confidenceScore || 98.4}% Confidence
                  </span>
                </div>

                <div className="mb-5">
                  <h3 className="text-lg font-bold text-slate-900">{variantB.name}</h3>
                  <p className="text-sm text-emerald-800 font-semibold italic mt-0.5">
                    “{variantB.tagline}”
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-emerald-200">
                  <div className="bg-white/95 p-3 rounded-xl border border-emerald-200 shadow-sm">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Clicks
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-extrabold text-slate-900">
                        {variantB.clicks.toLocaleString()}
                      </span>
                      {variantA?.clicks && (
                        <span className="text-[10px] font-bold text-emerald-600">
                          {Math.round(
                            ((variantB.clicks - variantA.clicks) / variantA.clicks) * 100
                          )}
                          %
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-white/95 p-3 rounded-xl border border-emerald-200 shadow-sm">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Purchases
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-extrabold text-slate-900">
                        {variantB.purchases}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600">
                        {lifts?.purchasesLift
                          ? `${lifts.purchasesLift > 0 ? '+' : ''}${lifts.purchasesLift}%`
                          : '+35%'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/95 p-3 rounded-xl border border-emerald-200 shadow-sm">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Revenue
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-extrabold text-slate-900">
                        ₹{variantB.revenue.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600">
                        {lifts?.revenueLift
                          ? `${lifts.revenueLift > 0 ? '+' : ''}${lifts.revenueLift}%`
                          : '+48%'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/95 p-3 rounded-xl border border-emerald-200 shadow-sm">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Conversion Rate
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-extrabold text-emerald-600">
                        {variantB.conversionRate}%
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600">
                        {lifts?.absoluteConversionLift
                          ? `+${lifts.absoluteConversionLift}%`
                          : '+4.0%'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/95 p-3 rounded-xl border border-emerald-200 shadow-sm col-span-2 sm:col-span-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Cost per Conv
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-extrabold text-emerald-700">
                        ₹
                        {(variantB as any)?.costPerAcquisition ||
                          (variantB as any)?.costPerConversion ||
                          120}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600">
                        {lifts?.cpaSavings ? `₹${Math.abs(lifts.cpaSavings)} saved` : '₹80 saved'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Winner Callout Strip */}
                <div className="mt-4 p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-900">
                    Outperformed Variant A in all 5 measurable metrics
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded shadow-xs">
                    PROVEN
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PERFORMANCE COMPARISON VISUALIZATION */}
      <div className="card-clean p-6 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Performance Comparison</h2>
            </div>
            <p className="text-xs text-slate-500">
              Direct comparison between Ad A (20% Off) vs Ad B (Buy 2 Get 1 Free)
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium self-start sm:self-auto">
            <button
              onClick={() => setActiveChartMetric('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeChartMetric === 'all'
                  ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Metrics Overview
            </button>
            <button
              onClick={() => setActiveChartMetric('volume')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeChartMetric === 'volume'
                  ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Clicks & Purchases
            </button>
            <button
              onClick={() => setActiveChartMetric('rates')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeChartMetric === 'rates'
                  ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rates & CPA
            </button>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeChartMetric === 'rates' ? (
              <BarChart data={rateData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="metric"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip
                  formatter={(value: any, name: string) => [`${value}`, name]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '15px' }} />
                <Bar dataKey="Variant A (20% Off)" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Variant B (Buy 2 Get 1)" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : activeChartMetric === 'volume' ? (
              <BarChart data={volumeData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="metric"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip
                  formatter={(value: any, name: string) => [Number(value).toLocaleString(), name]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '15px' }} />
                <Bar dataKey="Variant A (20% Off)" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Variant B (Buy 2 Get 1)" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart
                data={comparisonBarData}
                margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="metric"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip
                  formatter={(value: any, name: string, item: any) => {
                    const isAdA = name.includes('Variant A');
                    const display = isAdA ? item.payload.displayA : item.payload.displayB;
                    return [display, name];
                  }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '15px' }} />
                <Bar dataKey="Variant A (20% Off)" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Variant B (Buy 2 Get 1)" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Metric summary footer tags */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6 mt-4 border-t border-slate-100 text-center">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Traffic Lift</span>
            <span className="text-sm font-bold text-slate-800">+50% Clicks</span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
            <span className="text-[11px] text-emerald-700 block">Orders Generated</span>
            <span className="text-sm font-bold text-emerald-800">+35% Purchases</span>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-100">
            <span className="text-[11px] text-amber-700 block">Revenue Added</span>
            <span className="text-sm font-bold text-amber-800">+₹5,900 Revenue</span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
            <span className="text-[11px] text-emerald-700 block">Conversion Delta</span>
            <span className="text-sm font-bold text-emerald-800">5.0% → 9.0%</span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-emerald-700 block">Cost Efficiency</span>
            <span className="text-sm font-bold text-emerald-800">₹80 Lower CPA</span>
          </div>
        </div>
      </div>

      {/* KEY INSIGHT CARD */}
      <div className="card-clean p-6 sm:p-7 bg-gradient-to-br from-white via-indigo-50/20 to-emerald-50/30 border-l-4 border-l-emerald-500 shadow-card">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Key Experiment Insight
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Ad B generated 35% more purchases at a lower cost.
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                “The ‘Buy 2, Get 1 Free’ offer outperformed the 20% discount with higher
                conversions, higher revenue, and a lower cost per conversion.”
              </p>
            </div>

            <div className="pt-2">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
                <span>Recommendation:</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                Allocate more budget to Ad B and consider running it for a longer period.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 min-w-[210px]">
            <button
              onClick={handleAllocateBudget}
              className="w-full px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all text-center"
            >
              Allocate Budget to Ad B
            </button>
            <button
              onClick={() => viewExperimentDetails('exp-1')}
              className="w-full px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm border border-slate-300 transition-all text-center"
            >
              View Full Statistical Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
