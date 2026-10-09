import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, ShoppingBag, Sparkles, Percent, Zap } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useApp, DateRange } from '../../context/AppContext';
import { analyticsTrendData } from '../../data/mockData';

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { dateRange, setDateRange, viewExperimentDetails } = useApp();

  const currentData = analyticsTrendData[dateRange] || analyticsTrendData['Last 7 days'];

  const dateOptions: DateRange[] = ['Last 7 days', 'Last 30 days', 'Last 90 days'];

  const handleReviewExperiment = (expId: string) => {
    viewExperimentDetails(expId);
    navigate(`/experiments/${expId}`);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header with Title and Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Analytics & Growth Insights
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Actionable answers to help you spend your marketing budget where it actually drives
            sales.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-xs self-start sm:self-auto">
          {dateOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setDateRange(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateRange === opt
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Actionable Summary Strip */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Primary Executive Takeaway</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Experimentation with Bundle Offers (Buy 2 Get 1) improved your blended store
              conversion rate from <strong className="text-emerald-400">5.0% to 9.0%</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleReviewExperiment('exp-1')}
            className="px-4 py-2 rounded-xl bg-white text-slate-900 font-semibold text-xs hover:bg-slate-100 transition-colors"
          >
            Review Experiment
          </button>
        </div>
      </div>

      {/* MARKETING INSIGHTS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Marketing Insights</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Insight Card 1 */}
          <div className="card-clean p-5 bg-white border-l-4 border-l-emerald-500 hover:shadow-card-hover transition-all">
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">
                Offer Efficiency
              </span>
              <span className="text-xs font-bold text-emerald-600">+80% Delta</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              “Buy 2 Get 1 offers are currently converting 80% better than the 20% discount.”
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Customers perceive multi-unit volume value significantly higher than standard
              percentage discounts, unlocking higher cart sizes with less discount leakage.
            </p>
          </div>

          {/* Insight Card 2 */}
          <div className="card-clean p-5 bg-white border-l-4 border-l-indigo-500 hover:shadow-card-hover transition-all">
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">
                Cost Optimization
              </span>
              <span className="text-xs font-bold text-indigo-600">₹120 CPA</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              “Ad B has the lowest cost per conversion.”
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              At ₹120 per conversion compared to ₹200 for Ad A, Ad B provides 40% cheaper customer
              acquisition costs for your apparel catalog.
            </p>
          </div>

          {/* Insight Card 3 */}
          <div className="card-clean p-5 bg-white border-l-4 border-l-pink-500 hover:shadow-card-hover transition-all">
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="p-1.5 rounded-lg bg-pink-50 text-pink-700 text-xs font-semibold">
                Channel Volume
              </span>
              <span className="text-xs font-bold text-pink-600">146 Orders</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              “Instagram currently generates the highest purchase volume.”
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Instagram Reel placements accounted for 146 out of 339 total store purchases,
              producing ₹30,700 in direct revenue.
            </p>
          </div>

          {/* Insight Card 4 */}
          <div className="card-clean p-5 bg-white border-l-4 border-l-amber-500 hover:shadow-card-hover transition-all">
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold">
                Experiment Lift
              </span>
              <span className="text-xs font-bold text-amber-600">9.0% Peak</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              “Your conversion rate improved from 5.0% to 9.0% during the latest experiment.”
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Implementing tested winning offers raised overall traffic conversion velocity,
              resulting in ₹18,300 additional revenue on the same ad budget.
            </p>
          </div>
        </div>
      </div>

      {/* TREND CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Conversion Rate Trend */}
        <div className="card-clean p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Conversion Rate Trend</h3>
              </div>
              <p className="text-xs text-slate-500">
                Weekly progression during active experimentation
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Current: 9.0%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cvrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} unit="%" domain={[0, 10]} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Conversion Rate']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="conversionRate"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#cvrGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Revenue Trend */}
        <div className="card-clean p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Revenue Trend (INR)</h3>
              </div>
              <p className="text-xs text-slate-500">
                Gross revenue generated across tested campaigns
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              +42% Growth
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 3 & 4: Purchases Trend & Channel Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Purchases Trend */}
        <div className="card-clean p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Purchases Trend</h3>
              </div>
              <p className="text-xs text-slate-500">Completed customer orders per period</p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              146 Total
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} orders`, 'Purchases']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Bar dataKey="purchases" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Performance Breakdown */}
        <div className="card-clean p-6 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Campaign Channel Breakdown</h3>
                <p className="text-xs text-slate-500">Volume and revenue by acquisition source</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Instagram */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                  <span className="text-slate-800">Instagram Ads (Active Experiment)</span>
                  <span className="text-slate-900">₹30,700 (52%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-pink-500 rounded-full" style={{ width: '52%' }}></div>
                </div>
              </div>

              {/* WhatsApp Broadcast */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                  <span className="text-slate-800">WhatsApp Broadcast</span>
                  <span className="text-slate-900">₹24,600 (31%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: '31%' }}
                  ></div>
                </div>
              </div>

              {/* Google Search */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                  <span className="text-slate-800">Google Search Ads</span>
                  <span className="text-slate-900">₹14,900 (13%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '13%' }}></div>
                </div>
              </div>

              {/* Facebook Retargeting */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                  <span className="text-slate-800">Facebook New Customer</span>
                  <span className="text-slate-900">₹7,200 (4%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '4%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              Recommendation for next ad spend allocation:
            </span>
            <span className="font-bold text-indigo-700">Instagram + WhatsApp VIP</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
