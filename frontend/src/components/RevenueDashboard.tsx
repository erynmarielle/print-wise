import React, { useEffect, useState } from 'react';
import type { RevenueSummary, RecentJob } from '../types';
import { getRevenueSummary, getRecentJobs } from '../api';
import {
  Banknote, Smartphone, RefreshCw, CheckCircle2, Clock,
  Layers, TrendingUp
} from 'lucide-react';

export const RevenueDashboard: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [jobs, setJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async (date: string) => {
    setLoading(true);
    try {
      const [sumData, jobsData] = await Promise.all([
        getRevenueSummary(date),
        getRecentJobs(30),
      ]);
      setSummary(sumData);
      setJobs(jobsData);
    } catch (err) {
      console.error('Failed to load revenue data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  return (
    <div className="space-y-6">
      {/* Date Filter & Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Printing Sales & Cashier Ledger</h2>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Daily Bookkeeping
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time reconciliation of cash drawer, GCash collections, and ink/paper consumable costs.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedDate !== todayStr && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="text-xs font-semibold px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all pressable"
            >
              Today
            </button>
          )}

          <div className="relative flex-1 sm:w-44">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-xs font-bold font-mono-numbers bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <button
            onClick={() => loadData(selectedDate)}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all pressable"
            title="Refresh Ledger Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Ledger Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Gross Sales */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Gross Collections
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="my-2.5">
              <span className="font-mono-numbers text-3xl font-extrabold text-slate-900 tracking-tight">
                ₱{summary.total_revenue.toFixed(2)}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              <span className="font-mono-numbers font-bold text-slate-800">{summary.paid_jobs_count}</span> paid print orders
            </div>
          </div>

          {/* Card 2: Drawer vs GCash Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Payment Breakdown
              </span>
              <span className="text-[10px] text-slate-400 font-mono">RECONCILE</span>
            </div>
            <div className="space-y-2 my-2">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Cash Drawer:
                </span>
                <span className="font-mono-numbers font-bold text-slate-900">₱{summary.cash_revenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" /> GCash Total:
                </span>
                <span className="font-mono-numbers font-bold text-slate-900">₱{summary.gcash_revenue.toFixed(2)}</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400">Total matched to drawer</span>
          </div>

          {/* Card 3: Sheets Printed & Consumables Cost */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Consumables Used
              </span>
              <Layers className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="my-2.5">
              <span className="font-mono-numbers text-3xl font-extrabold text-slate-900 tracking-tight">
                {summary.total_pages_printed}
              </span>
              <span className="text-xs font-semibold text-slate-500 ml-1.5">sheets</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Paper: <span className="font-mono-numbers font-medium text-slate-700">₱{summary.estimated_paper_cost.toFixed(2)}</span> · Ink: <span className="font-mono-numbers font-medium text-slate-700">₱{summary.estimated_ink_cost.toFixed(2)}</span>
            </div>
          </div>

          {/* Card 4: Net Estimated Profit */}
          <div className="bg-slate-900 text-white rounded-2xl border border-slate-900 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Est. Net Profit Margin
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="my-2.5">
              <span className="font-mono-numbers text-3xl font-extrabold text-emerald-400 tracking-tight">
                ₱{summary.estimated_gross_profit.toFixed(2)}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Net after ~₱{(summary.estimated_paper_cost + summary.estimated_ink_cost).toFixed(2)} supplies
            </div>
          </div>
        </div>
      )}

      {/* Transaction Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Recent Print Orders</h3>
            <p className="text-xs text-slate-500">Historical job log with paper and payment status.</p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
            {jobs.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">File / Document</th>
                <th className="px-5 py-3">Customer / Note</th>
                <th className="px-5 py-3">Sheets & Size</th>
                <th className="px-5 py-3">Total Charged</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-xs">
                    No print jobs recorded in ledger yet. Run a quote and click "Collect / Pay" to register your first transaction!
                  </td>
                </tr>
              ) : (
                jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                      {new Date(j.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-900 max-w-[220px] truncate">
                      {j.filename}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {j.customer_name || <span className="text-slate-400 italic">Walk-in</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono-numbers font-bold text-slate-900">{j.total_pages}</span> sheets
                      <span className="ml-1.5 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {j.paper_size}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono-numbers font-extrabold text-slate-900 text-sm">
                      ₱{j.total_price.toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
                      {j.payment_method === 'GCASH' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          <Smartphone className="w-3 h-3 text-blue-600" /> GCash
                        </span>
                      ) : j.payment_method === 'CASH' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Banknote className="w-3 h-3 text-emerald-600" /> Cash
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {j.status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                          <Clock className="w-3 h-3 text-slate-500" /> Quoted
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

