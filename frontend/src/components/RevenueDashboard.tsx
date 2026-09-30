import React, { useEffect, useState } from 'react';
import type { RevenueSummary, RecentJob } from '../types';
import { getRevenueSummary, getRecentJobs } from '../api';
import {
  Banknote, Smartphone, RefreshCw, CheckCircle, Clock
} from 'lucide-react';


export const RevenueDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
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
      {/* Date Filter & Refresh Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Printing Sales & Cashier Ledger</h2>
          <p className="text-xs text-slate-500">
            Track daily earnings, GCash receipts, paper/ink consumables, and net margin.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={() => loadData(selectedDate)}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Revenue
            </span>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-slate-900">
                ₱{summary.total_revenue.toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <span>{summary.paid_jobs_count} completed jobs</span>
            </div>
          </div>

          {/* Cash vs GCash Split */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Payment Breakdown
            </span>
            <div className="space-y-1.5 my-2">
              <div className="flex justify-between items-center text-sm font-bold text-emerald-800">
                <span className="flex items-center gap-1 font-semibold text-xs text-slate-600">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Cash:
                </span>
                <span>₱{summary.cash_revenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-sky-800">
                <span className="flex items-center gap-1 font-semibold text-xs text-slate-600">
                  <Smartphone className="w-3.5 h-3.5 text-sky-600" /> GCash:
                </span>
                <span>₱{summary.gcash_revenue.toFixed(2)}</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400">Drawer reconciliation</span>
          </div>

          {/* Volume Printed */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pages Printed
            </span>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {summary.total_pages_printed}
              </span>
              <span className="text-xs font-semibold text-slate-500 ml-1.5">sheets</span>
            </div>
            <span className="text-xs text-slate-500">
              Paper est.: ~₱{summary.estimated_paper_cost.toFixed(2)}
            </span>
          </div>

          {/* Estimated Net Profit */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-sm p-5 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
              Estimated Net Profit
            </span>
            <div className="my-2">
              <span className="text-3xl font-black">
                ₱{summary.estimated_gross_profit.toFixed(2)}
              </span>
            </div>
            <span className="text-xs text-emerald-100">
              After ~₱{(summary.estimated_paper_cost + summary.estimated_ink_cost).toFixed(2)} consumables
            </span>
          </div>
        </div>
      )}

      {/* Recent Print Jobs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-base">Recent Print Orders</h3>
          <span className="text-xs text-slate-500">{jobs.length} logged records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Document</th>
                <th className="px-5 py-3">Customer / Note</th>
                <th className="px-5 py-3">Pages / Size</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400 text-sm">
                    No print jobs recorded yet.
                  </td>
                </tr>
              ) : (
                jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500">
                      {new Date(j.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900 max-w-[200px] truncate">
                      {j.filename}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {j.customer_name || 'Walk-in'}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <span className="font-bold text-slate-800">{j.total_pages}</span> pgs (
                      {j.paper_size.toUpperCase()})
                    </td>
                    <td className="px-5 py-3.5 font-bold text-emerald-700">
                      ₱{j.total_price.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5">
                      {j.payment_method === 'GCASH' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-800">
                          <Smartphone className="w-3 h-3" /> GCash
                        </span>
                      ) : j.payment_method === 'CASH' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <Banknote className="w-3 h-3" /> Cash
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {j.status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600">
                          <Clock className="w-3 h-3" /> Quoted
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
