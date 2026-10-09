import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Trophy,
  CheckCircle2,
  Sparkles,
  Calendar,
  ChevronRight,
  BarChart3,
  Zap,
  Target,
  AlertCircle,
  HelpCircle,
  Activity,
  ShieldCheck,
  Scale,
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
import { useApp } from '../../../context/AppContext';
import { useExperimentEvaluation } from '../../../hooks/useExperimentEvaluation';
import { ErrorState } from '../../../components/common/ErrorState';

export const ExperimentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { experiments, selectedExperiment, exportExperimentData, addToast } = useApp();

  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  // Look up experiment by URL id parameter, fallback to selectedExperiment
  const exp = id ? experiments.find((e) => e.id === id) : selectedExperiment;

  // Run statistical evaluation engine
  const evalResult = useExperimentEvaluation(exp);

  if (!exp || !evalResult) {
    return (
      <div className="py-8">
        <ErrorState
          title="Experiment Not Found"
          message={
            id
              ? `No experiment matches the ID "${id}". It may have been archived or removed.`
              : 'Please choose an experiment from the experiments list.'
          }
          action={{
            label: 'Back to Experiments',
            onClick: () => navigate('/experiments'),
          }}
        />
      </div>
    );
  }

  const {
    variantA,
    variantB,
    winnerVariant,
    decisionState,
    stateBadgeLabel,
    stateDescription,
    lifts,
    stats,
    minSampleSizeRequired,
    confidenceThresholdRequired,
    sampleSizeProgressPercent,
    minSampleSizeMet,
    headlineRecommendation,
    actionableSummary,
    budgetScalingAdvice,
    assumptions,
    limitations,
  } = evalResult;

  // Dynamic Chart data for Recharts comparison
  const chartData = [
    {
      metric: 'Clicks',
      [variantA.name]: variantA.clicks,
      [variantB.name]: variantB.clicks,
    },
    {
      metric: 'Purchases',
      [variantA.name]: variantA.purchases,
      [variantB.name]: variantB.purchases,
    },
    {
      metric: 'Conv. Rate (%)',
      [variantA.name]: variantA.conversionRate,
      [variantB.name]: variantB.conversionRate,
    },
    {
      metric: 'Cost/Conv (₹)',
      [variantA.name]: variantA.costPerAcquisition,
      [variantB.name]: variantB.costPerAcquisition,
    },
    {
      metric: 'ROAS',
      [variantA.name]: variantA.roas,
      [variantB.name]: variantB.roas,
    },
  ];

  const handleExport = (fmt: 'csv' | 'json') => {
    setExportFormat(fmt);
    exportExperimentData(exp, fmt);
  };

  const handleScaleWinner = () => {
    if (winnerVariant) {
      addToast({
        title: 'Action Triggered!',
        message: `Reallocated 80% campaign budget to ${winnerVariant.name}.`,
        type: 'success',
      });
    } else {
      addToast({
        title: 'Recommendation Applied',
        message: 'Maintained 50/50 split while data collection is in progress.',
        type: 'info',
      });
    }
  };

  const getStateBadgeStyle = () => {
    switch (decisionState) {
      case 'winner_declared':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'insufficient_data':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'inconclusive':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  const getStateIcon = () => {
    switch (decisionState) {
      case 'winner_declared':
        return <Trophy className="w-5 h-5 text-emerald-400" />;
      case 'in_progress':
        return <Activity className="w-5 h-5 text-blue-400 animate-pulse" />;
      case 'insufficient_data':
        return <AlertCircle className="w-5 h-5 text-amber-400" />;
      case 'inconclusive':
        return <HelpCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          onClick={() => navigate('/experiments')}
          className="hover:text-indigo-600 transition-colors flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Experiments</span>
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-md">
          {exp.name}
        </span>
      </div>

      {/* Header Info & Action Buttons */}
      <div className="card-clean p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              {exp.type}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                exp.status === 'Active'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : exp.status === 'Completed'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {exp.status === 'Active' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              )}
              Status: {exp.status}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {exp.startDate} to {exp.endDate}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {exp.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{exp.description}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex rounded-xl shadow-xs border border-slate-200 bg-white p-1">
            <button
              onClick={() => handleExport('csv')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                exportFormat === 'csv'
                  ? 'text-indigo-700 bg-indigo-50'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => handleExport('json')}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                exportFormat === 'json'
                  ? 'text-indigo-700 bg-indigo-50 font-semibold'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              JSON
            </button>
          </div>

          <button
            onClick={handleScaleWinner}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Apply Recommendation</span>
          </button>
        </div>
      </div>

      {/* STATISTICAL DECISION BANNER */}
      <div className="card-clean p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white border-none shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className={`p-1.5 rounded-lg border ${getStateBadgeStyle()}`}>
                {getStateIcon()}
              </span>
              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-300">
                Decision Engine: {stateBadgeLabel}
              </span>
            </div>

            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                {decisionState === 'winner_declared' ? 'DECISIVE WINNER:' : 'EVALUATION STATUS:'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
                {winnerVariant ? winnerVariant.name : headlineRecommendation}
              </h2>
            </div>

            {/* Calculated Performance Metrics Strip */}
            <div className="pt-1 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
              <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="text-slate-400 mr-1.5">CONFIDENCE:</span>
                <strong
                  className={`font-bold ${stats.isStatisticallySignificant ? 'text-emerald-300' : 'text-amber-300'}`}
                >
                  {stats.confidenceScore}%
                </strong>
                <span className="text-[11px] text-slate-400 ml-1">
                  (Target: {confidenceThresholdRequired}%)
                </span>
              </div>

              <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="text-slate-400 mr-1.5">P-VALUE:</span>
                <strong className="text-white font-mono font-bold">
                  {stats.pValue.toFixed(4)}
                </strong>
              </div>

              <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="text-slate-400 mr-1.5">Z-SCORE:</span>
                <strong className="text-white font-mono font-bold">
                  {stats.zScore.toFixed(2)}
                </strong>
              </div>

              {winnerVariant && (
                <div className="bg-emerald-900/60 border border-emerald-500/40 px-3 py-1.5 rounded-lg">
                  <span className="text-slate-300 mr-1.5">MEASURED LIFT:</span>
                  <strong className="text-emerald-300 font-bold">
                    {lifts.relativeConversionLift > 0 ? '+' : ''}
                    {lifts.relativeConversionLift}% conversion rate
                  </strong>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">{stateDescription}</p>
          </div>

          {/* Actionable Strategy Card */}
          <div className="lg:max-w-md p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 space-y-2">
            <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>STRATEGIC RECOMMENDATION:</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              {actionableSummary}
            </p>
            <div className="pt-2 border-t border-white/10 text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              <span>{budgetScalingAdvice}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SAMPLE SIZE & STATISTICAL HEALTH BAR */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Statistical Significance & Sample Size Health
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Threshold configured: <strong>{minSampleSizeRequired.toLocaleString()} visitors</strong>{' '}
            @ <strong>{confidenceThresholdRequired}% confidence</strong> (Settings)
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-slate-600">
            <span>
              Sample Size Progress: {Math.min(variantA.clicks, variantB.clicks).toLocaleString()} /{' '}
              {minSampleSizeRequired.toLocaleString()} clicks
            </span>
            <span
              className={
                minSampleSizeMet ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'
              }
            >
              {sampleSizeProgressPercent}%{' '}
              {minSampleSizeMet ? '✓ Minimum Threshold Attained' : '• Collecting Traffic'}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                minSampleSizeMet ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${sampleSizeProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* TWO VARIANT CARDS (Side-by-Side Detailed Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VARIANT A */}
        <div
          className={`card-clean p-6 bg-white relative ${winnerVariant?.id === variantA.id ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/10' : ''}`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded text-xs font-bold bg-slate-100 text-slate-700">
                  {variantA.label}
                </span>
                {winnerVariant?.id === variantA.id && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    WINNER
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-2">{variantA.name}</h3>
              {variantA.tagline && (
                <p className="text-xs text-slate-500 italic mt-0.5">“{variantA.tagline}”</p>
              )}
            </div>
            <span className="text-xs font-semibold text-slate-400">Control Variant</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Clicks</span>
              <p className="text-lg font-bold text-slate-800">{variantA.clicks.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Purchases</span>
              <p className="text-lg font-bold text-slate-800">
                {variantA.purchases.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Revenue</span>
              <p className="text-lg font-bold text-slate-800">
                ₹{variantA.revenue.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                Conversion Rate
              </span>
              <p className="text-lg font-bold text-slate-800">{variantA.conversionRate}%</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                Cost Per Acquisition
              </span>
              <p className="text-lg font-bold text-slate-800">₹{variantA.costPerAcquisition}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                Return On Ad Spend (ROAS)
              </span>
              <p className="text-lg font-bold text-slate-800">{variantA.roas}x</p>
            </div>
          </div>
        </div>

        {/* VARIANT B */}
        <div
          className={`card-clean p-6 bg-white relative ${winnerVariant?.id === variantB.id ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/10 shadow-lg shadow-emerald-500/5' : ''}`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded text-xs font-bold ${winnerVariant?.id === variantB.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                >
                  {variantB.label}
                </span>
                {winnerVariant?.id === variantB.id && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    WINNER
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-2">{variantB.name}</h3>
              {variantB.tagline && (
                <p className="text-xs text-slate-500 italic mt-0.5">“{variantB.tagline}”</p>
              )}
            </div>
            <span className="text-xs font-semibold text-slate-400">Challenger Variant</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Clicks</span>
                {variantA.clicks > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {Math.round(((variantB.clicks - variantA.clicks) / variantA.clicks) * 100)}%
                  </span>
                )}
              </div>
              <p className="text-lg font-bold text-slate-800">{variantB.clicks.toLocaleString()}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">
                  Purchases
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {lifts.purchasesLift > 0 ? '+' : ''}
                  {lifts.purchasesLift}%
                </span>
              </div>
              <p className="text-lg font-bold text-slate-800">
                {variantB.purchases.toLocaleString()}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Revenue</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {lifts.revenueLift > 0 ? '+' : ''}
                  {lifts.revenueLift}%
                </span>
              </div>
              <p className="text-lg font-bold text-slate-800">
                ₹{variantB.revenue.toLocaleString()}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">
                  Conversion Rate
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {lifts.relativeConversionLift > 0 ? '+' : ''}
                  {lifts.relativeConversionLift}% lift
                </span>
              </div>
              <p className="text-lg font-bold text-emerald-600">{variantB.conversionRate}%</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">
                  Cost Per Acquisition
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  ₹{Math.abs(lifts.cpaSavings)} saved
                </span>
              </div>
              <p className="text-lg font-bold text-emerald-700">₹{variantB.costPerAcquisition}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">ROAS</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {lifts.roasLift > 0 ? '+' : ''}
                  {lifts.roasLift}x
                </span>
              </div>
              <p className="text-lg font-bold text-emerald-700">{variantB.roas}x</p>
            </div>
          </div>
        </div>
      </div>

      {/* COMPARISON CHARTS SECTION */}
      <div className="card-clean p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>Calculated Variant Metrics Comparison</span>
            </h3>
            <p className="text-xs text-slate-500">
              Visual comparison of measurable KPIs derived from experiment data
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                }}
              />
              <Legend />
              <Bar dataKey={variantA.name} fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey={variantB.name} fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* STATISTICAL ASSUMPTIONS & LIMITATIONS SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Methodological Assumptions & Statistical Limitations
            </h3>
            <p className="text-xs text-slate-500">
              Clear statistical parameters and guardrails used by the experimentation engine.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Statistical Assumptions */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Model Assumptions</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600">
              {assumptions.map((a, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Statistical Limitations */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Real-World Limitations</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600">
              {limitations.map((l, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <span>{l}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperimentDetailPage;
