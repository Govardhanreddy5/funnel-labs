import React, { useState } from 'react';
import { X, FlaskConical, Sparkles, Layers } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { ExperimentType, Experiment } from '../../../types';
import { validateExperimentForm } from '../../../utils/validators';

export const CreateExperimentModal: React.FC = () => {
  const { isCreateModalOpen, setIsCreateModalOpen, createExperiment, campaigns } = useApp();

  const [name, setName] = useState('Festive Diwali Flash Offer');
  const [type, setType] = useState<ExperimentType>('Offer Test');
  const [description, setDescription] = useState(
    'Compare flat 25% discount vs ₹500 instant voucher on orders above ₹1999.'
  );
  const [primaryGoal, setPrimaryGoal] = useState<Experiment['primaryGoal']>('Purchases');
  const [budget, setBudget] = useState('20000');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [connectedCampaign, setConnectedCampaign] = useState(
    campaigns[0]?.name || 'Instagram — T-Shirt Offer'
  );

  // Variant A fields
  const [variantAName, setVariantAName] = useState('Ad A — 25% Flat Discount');
  const [variantATagline, setVariantATagline] = useState('Get Flat 25% OFF Storewide Today');

  // Variant B fields
  const [variantBName, setVariantBName] = useState('Ad B — ₹500 Voucher Club');
  const [variantBTagline, setVariantBTagline] = useState('₹500 Instant Cashback on Cart > ₹1999');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isCreateModalOpen) return null;

  const validate = () => {
    const result = validateExperimentForm({
      name,
      type,
      description,
      budget,
      startDate,
      endDate,
      variantAName,
      variantATagline,
      variantBName,
      variantBTagline,
    });
    setErrors(result.errors);
    return result.isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    createExperiment({
      name,
      type,
      description,
      primaryGoal,
      budget: Number(budget),
      startDate,
      endDate,
      connectedCampaign,
      status: 'Active',
      confidenceScore: 68.5,
      winnerName: 'Evaluating initial traffic',
      variants: [
        {
          id: `var-${Date.now()}-a`,
          label: 'Variant A',
          name: variantAName,
          tagline: variantATagline,
          clicks: 320,
          purchases: 18,
          revenue: 12600,
          conversionRate: 5.6,
          costPerConversion: 185,
          isWinner: false,
        },
        {
          id: `var-${Date.now()}-b`,
          label: 'Variant B',
          name: variantBName,
          tagline: variantBTagline,
          clicks: 410,
          purchases: 32,
          revenue: 24800,
          conversionRate: 7.8,
          costPerConversion: 125,
          isWinner: true,
        },
      ],
    });
  };

  const experimentTypes: ExperimentType[] = [
    'Offer Test',
    'Ad Creative',
    'Message Test',
    'Landing Page',
    'Other',
  ];

  const goalOptions: Experiment['primaryGoal'][] = [
    'Purchases',
    'Conversion Rate',
    'Revenue',
    'Clicks',
    'Leads',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Create New Marketing Experiment</h2>
              <p className="text-xs text-slate-500">
                Test different variations and discover what maximizes conversions
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Experiment Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Experiment Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Free Shipping vs Flat ₹100 Off"
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 outline-none transition-all ${
                errors.name
                  ? 'border-rose-400 bg-rose-50/30'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
              }`}
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Hypothesis / Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you testing and why?"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
            />
          </div>

          {/* Experiment Type & Primary Goal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Experiment Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ExperimentType)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                {experimentTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Primary Goal <span className="text-rose-500">*</span>
              </label>
              <select
                value={primaryGoal}
                onChange={(e) => setPrimaryGoal(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                {goalOptions.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Variant A and Variant B Configuration */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Setup Comparison Variants
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Variant A */}
              <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                    VARIANT A (Control)
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Variant Name
                  </label>
                  <input
                    type="text"
                    value={variantAName}
                    onChange={(e) => setVariantAName(e.target.value)}
                    placeholder="e.g. Ad A — 20% Off"
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                  {errors.variantA && (
                    <p className="text-[11px] text-rose-500 mt-0.5">{errors.variantA}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Message / Headline
                  </label>
                  <input
                    type="text"
                    value={variantATagline}
                    onChange={(e) => setVariantATagline(e.target.value)}
                    placeholder="e.g. 20% Off Today"
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Variant B */}
              <div className="p-3.5 bg-white rounded-lg border border-indigo-200 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    VARIANT B (Challenger)
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Variant Name
                  </label>
                  <input
                    type="text"
                    value={variantBName}
                    onChange={(e) => setVariantBName(e.target.value)}
                    placeholder="e.g. Ad B — Buy 2 Get 1"
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                  {errors.variantB && (
                    <p className="text-[11px] text-rose-500 mt-0.5">{errors.variantB}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Message / Headline
                  </label>
                  <input
                    type="text"
                    value={variantBTagline}
                    onChange={(e) => setVariantBTagline(e.target.value)}
                    placeholder="e.g. Buy 2, Get 1 Free"
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Budget and Campaign Connection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Test Budget (INR ₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="20000"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
              {errors.budget && <p className="text-xs text-rose-500 mt-1">{errors.budget}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Connected Campaign
              </label>
              <select
                value={connectedCampaign}
                onChange={(e) => setConnectedCampaign(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                {campaigns.map((camp) => (
                  <option key={camp.id} value={camp.name}>
                    {camp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              {errors.startDate && <p className="text-xs text-rose-500 mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                End Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              {errors.endDate && <p className="text-xs text-rose-500 mt-1">{errors.endDate}</p>}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(false)}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200/80 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all active:scale-[0.98] flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create Experiment</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateExperimentModal;
