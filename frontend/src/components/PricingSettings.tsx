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

  const sampleTotal = (config.price_mono || 0) + (config.price_accent || 0) + (config.price_medium || 0) + (config.price_photo || 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
        <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <Settings className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Printing Rate Rules & Tiers</h2>
            <p className="text-xs text-slate-500">
              Configure baseline prices charged per page tier in Philippine Pesos (₱). All quoter computations update instantly.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 4 Color Tiers Grid */}
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
              Per-Page Color Tiers (Short / A4 Baseline)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* B&W */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-900" />
                    Monochrome / B&W
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">0% Color</span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-400 font-mono">
                    ₱
                  </span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={config.price_mono}
                    onChange={(e) =>
                      setConfig({ ...config, price_mono: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full pl-7 pr-3 py-2 text-base font-bold font-mono-numbers bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">Plain text, research papers, resumes</p>
              </div>

              {/* Accent Color */}
              <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    Accent Color
                  </span>
                  <span className="text-[10px] font-mono text-sky-700">&lt; 5% Coverage</span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-sky-400 font-mono">
                    ₱
                  </span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={config.price_accent}
                    onChange={(e) =>
                      setConfig({ ...config, price_accent: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full pl-7 pr-3 py-2 text-base font-bold font-mono-numbers bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">Logos, hyperlinks, colored headers</p>
              </div>

              {/* Medium Graphic */}
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Medium Graphic
                  </span>
                  <span className="text-[10px] font-mono text-amber-700">5% – 25%</span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-amber-400 font-mono">
                    ₱
                  </span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={config.price_medium}
                    onChange={(e) =>
                      setConfig({ ...config, price_medium: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full pl-7 pr-3 py-2 text-base font-bold font-mono-numbers bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">Presentation slides, diagrams, charts</p>
              </div>

              {/* Full Photo */}
              <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Full Photo / Heavy
                  </span>
                  <span className="text-[10px] font-mono text-rose-700">&gt; 25% Coverage</span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-rose-400 font-mono">
                    ₱
                  </span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={config.price_photo}
                    onChange={(e) =>
                      setConfig({ ...config, price_photo: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full pl-7 pr-3 py-2 text-base font-bold font-mono-numbers bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">Full-bleed photos, certificates, heavy graphics</p>
              </div>
            </div>
          </div>

          {/* Surcharges and Discounts */}
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
              Size & Duplex Adjustments
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Long / Folio Surcharge (₱)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5 mb-2">
                    Added per page for 8.5x13 or 8.5x14 paper
                  </p>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-400 font-mono">
                    +₱
                  </span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={config.long_paper_surcharge}
                    onChange={(e) =>
                      setConfig({ ...config, long_paper_surcharge: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full pl-9 pr-3 py-2 text-sm font-bold font-mono-numbers bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Back-to-Back Discount (%)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5 mb-2">
                    Discount percentage applied when customer chooses duplex
                  </p>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="50"
                    value={config.duplex_discount_percent || 0}
                    onChange={(e) =>
                      setConfig({ ...config, duplex_discount_percent: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full pr-8 pl-3 py-2 text-sm font-bold font-mono-numbers bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-slate-400 font-mono">
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Rate Calculator Preview Docket */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-200">Live Rate Calculation Preview</p>
              <p className="text-[11px] text-slate-400">
                1 Monochrome + 1 Accent + 1 Medium Graphic + 1 Full Photo on Short Paper:
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono-numbers text-2xl font-extrabold text-sky-400">
                ₱{sampleTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            {savedSuccess ? (
              <span className="inline-flex items-center text-xs font-semibold text-sky-700 gap-1.5">
                <CheckCircle className="w-4 h-4 text-sky-600" />
                Store pricing rates saved and active!
              </span>
            ) : (
              <span />
            )}

            <button
              type="submit"
              disabled={saving}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs sm:text-sm transition-all shadow-xs flex items-center gap-2 pressable"
            >
              <Save className="w-4 h-4 text-sky-400" />
              <span>{saving ? 'Saving Changes...' : 'Save Rate Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
