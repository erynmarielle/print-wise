import React, { useEffect, useState } from 'react';
import type { PricingConfig } from '../types';
import { getPricing, updatePricing } from '../api';
import { Settings, Save, CheckCircle, RefreshCw } from 'lucide-react';

export const PricingSettings: React.FC = () => {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    getPricing().then(setConfig).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    try {
      await updatePricing(config);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save pricing: ' + String(err));
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return (
      <div className="p-8 text-center text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
        Loading store pricing rules...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Store Rate Rules & Tiers</h2>
          <p className="text-xs text-slate-500">
            Configure how much your sari-sari store charges per page tier in Philippine Pesos (₱).
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* B&W */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Monochrome / B&W (₱)
            </label>
            <input
              type="number"
              step="0.50"
              value={config.price_mono}
              onChange={(e) =>
                setConfig({ ...config, price_mono: parseFloat(e.target.value) || 0 })
              }
              className="w-full text-base font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">Plain text, resumes, research docs</p>
          </div>

          {/* Accent Color */}
          <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100">
            <label className="block text-xs font-bold uppercase text-sky-800 mb-1">
              Accent Color (&lt; 5% area) (₱)
            </label>
            <input
              type="number"
              step="0.50"
              value={config.price_accent}
              onChange={(e) =>
                setConfig({ ...config, price_accent: parseFloat(e.target.value) || 0 })
              }
              className="w-full text-base font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">Logos, hyperlinks, colored headers</p>
          </div>

          {/* Medium Color */}
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
            <label className="block text-xs font-bold uppercase text-indigo-800 mb-1">
              Medium Graphic (5% - 25%) (₱)
            </label>
            <input
              type="number"
              step="0.50"
              value={config.price_medium}
              onChange={(e) =>
                setConfig({ ...config, price_medium: parseFloat(e.target.value) || 0 })
              }
              className="w-full text-base font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">Presentation slides, diagrams, charts</p>
          </div>

          {/* Full Photo */}
          <div className="bg-pink-50/50 p-4 rounded-xl border border-pink-100">
            <label className="block text-xs font-bold uppercase text-pink-800 mb-1">
              Full Photo / Heavy (&gt; 25%) (₱)
            </label>
            <input
              type="number"
              step="0.50"
              value={config.price_photo}
              onChange={(e) =>
                setConfig({ ...config, price_photo: parseFloat(e.target.value) || 0 })
              }
              className="w-full text-base font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">Full-bleed photos, certificates, posters</p>
          </div>
        </div>

        {/* Paper Surcharges */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
            Paper Surcharge
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-slate-800">
                Long / Folio / Legal Surcharge (₱)
              </span>
              <p className="text-[11px] text-slate-500">
                Additional fee added per page when printing on 8.5x13 or Legal size
              </p>
            </div>
            <input
              type="number"
              step="0.50"
              value={config.long_paper_surcharge}
              onChange={(e) =>
                setConfig({ ...config, long_paper_surcharge: parseFloat(e.target.value) || 0 })
              }
              className="w-24 text-base font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-right"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-between">
          {savedSuccess ? (
            <span className="inline-flex items-center text-xs font-semibold text-emerald-600 gap-1.5">
              <CheckCircle className="w-4 h-4" /> Pricing rates saved and active!
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-sm flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Rate Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
