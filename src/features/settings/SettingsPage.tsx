import React, { useState } from 'react';
import { User, Bell, Sliders, Save, Check, Store, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserSettings } from '../../types';
import { validateSettingsForm } from '../../utils/validators';

export const SettingsPage: React.FC = () => {
  const { userSettings, updateUserSettings } = useApp();

  const [formData, setFormData] = useState<UserSettings>(userSettings);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof UserSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateSettingsForm({
      storeName: formData.storeName,
      currency: formData.currency,
      minSampleSize: formData.minSampleSize,
      confidenceThreshold: formData.confidenceThreshold,
      alertThreshold: formData.alertThreshold,
      emailAlerts: formData.emailAlerts,
      alertEmail: formData.alertEmail,
    });

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors({});
    updateUserSettings(formData);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Account & Experiment Settings
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure your D2C brand parameters, notification triggers, and experimentation
            confidence thresholds.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all active:scale-[0.98] self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6" noValidate>
        {Object.keys(formErrors).length > 0 && (
          <div
            role="alert"
            className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-700"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold">Please fix the following settings errors:</span>
              <ul className="list-disc list-inside space-y-0.5">
                {Object.values(formErrors).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Section 1: Profile */}
        <div className="card-clean p-6 bg-white space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Profile</h2>
              <p className="text-xs text-slate-500">Your personal details and founder profile</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Founder Full Name
              </label>
              <input
                type="text"
                value={formData.founderName}
                onChange={(e) => handleChange('founderName', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Work Email Address
              </label>
              <input
                type="email"
                value={formData.founderEmail}
                onChange={(e) => handleChange('founderEmail', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Business Information */}
        <div className="card-clean p-6 bg-white space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Business Information</h2>
              <p className="text-xs text-slate-500">
                Your connected e-commerce store and operational metrics
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Store Name
              </label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => handleChange('storeName', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Store URL
              </label>
              <input
                type="url"
                value={formData.storeUrl}
                onChange={(e) => handleChange('storeUrl', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                E-Commerce Platform
              </label>
              <select
                value={formData.platform}
                onChange={(e) => handleChange('platform', e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Shopify">Shopify</option>
                <option value="WooCommerce">WooCommerce</option>
                <option value="Custom D2C">Custom Headless / Next.js</option>
                <option value="Magento">Magento</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Account Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="INR (₹)">INR (₹) — Indian Rupee</option>
                <option value="USD ($)">USD ($) — US Dollar</option>
                <option value="GBP (£)">GBP (£) — British Pound</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Estimated Monthly Ad Spend (INR ₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  value={formData.monthlyAdSpend}
                  onChange={(e) => handleChange('monthlyAdSpend', Number(e.target.value))}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Notification Preferences */}
        <div className="card-clean p-6 bg-white space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Notification Preferences</h2>
              <p className="text-xs text-slate-500">
                Alert triggers when experiments produce decisive statistical results
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifyWinner}
                onChange={(e) => handleChange('notifyWinner', e.target.checked)}
                className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  Winning Variant Detected Alert
                </p>
                <p className="text-xs text-slate-500">
                  Receive instant in-app and email alert the moment a challenger variant achieves
                  statistical victory.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifyDaily}
                onChange={(e) => handleChange('notifyDaily', e.target.checked)}
                className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  Daily Experiment Executive Digest
                </p>
                <p className="text-xs text-slate-500">
                  Morning snapshot summarizing purchases, spend, and conversion deltas for active
                  tests.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifyBudget}
                onChange={(e) => handleChange('notifyBudget', e.target.checked)}
                className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Budget Milestone Alerts</p>
                <p className="text-xs text-slate-500">
                  Get notified when an experiment reaches 80% and 100% of allocated testing budget.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Section 4: Experiment Preferences */}
        <div className="card-clean p-6 bg-white space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Experiment Preferences</h2>
              <p className="text-xs text-slate-500">
                Statistical rules and automated optimization guardrails
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Confidence Threshold (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="80"
                  max="99"
                  value={formData.confidenceThreshold}
                  onChange={(e) => handleChange('confidenceThreshold', Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <span className="font-bold text-sm text-slate-900 w-12 text-right">
                  {formData.confidenceThreshold}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Recommended: 95% for statistical significance
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Minimum Sample Size (Visitors per Variant)
              </label>
              <input
                type="number"
                value={formData.minSampleSize}
                onChange={(e) => handleChange('minSampleSize', Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Prevents premature call on low traffic spikes
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoPauseLosers}
                  onChange={(e) => handleChange('autoPauseLosers', e.target.checked)}
                  className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Auto-Pause Losing Variant when Winner is Proven
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Automatically divert 100% of remaining experiment ad spend to the proven winner
                    once statistical threshold is reached.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Bottom Save Action */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 transition-all active:scale-[0.98] flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
