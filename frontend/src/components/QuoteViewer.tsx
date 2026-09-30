import React, { useState } from 'react';
import type { QuoteResponse, PageQuote } from '../types';
import {
  FileText, CheckCircle2, DollarSign,
  Palette, Smartphone, Banknote, Layers
} from 'lucide-react';
import { recalculateQuote, recordPrintJob, recordPayment } from '../api';

interface QuoteViewerProps {
  quote: QuoteResponse;
  onQuoteUpdated: (updated: QuoteResponse) => void;
  onPaymentSuccess: () => void;
}

export const QuoteViewer: React.FC<QuoteViewerProps> = ({
  quote,
  onQuoteUpdated,
  onPaymentSuccess,
}) => {
  const [paperSize, setPaperSize] = useState<string>(quote.primary_paper_size || 'short');
  const [forceAllGray, setForceAllGray] = useState<boolean>(quote.force_all_grayscale || false);
  const [isDuplex, setIsDuplex] = useState<boolean>(quote.is_duplex || false);
  const [pagesState, setPagesState] = useState<PageQuote[]>(quote.pages);

  // POS Checkout state
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'GCASH'>('CASH');
  const [amountPaid, setAmountPaid] = useState<string>(quote.total_price.toString());
  const [customerName, setCustomerName] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);


  // Trigger recalculation on configuration change
  const triggerRecalc = async (
    newPaper: string,
    newGray: boolean,
    newDuplex: boolean,
    newPages: PageQuote[]
  ) => {
    try {
      const res = await recalculateQuote(newPaper, newGray, newDuplex, newPages);
      res.filename = quote.filename;
      setPagesState(res.pages);
      onQuoteUpdated(res);
      setAmountPaid(res.total_price.toString());
    } catch (err) {
      console.error('Failed to recalculate:', err);
    }
  };

  const handlePaperChange = (newSize: string) => {
    setPaperSize(newSize);
    triggerRecalc(newSize, forceAllGray, isDuplex, pagesState);
  };

  const handleGlobalGrayToggle = () => {
    const nextVal = !forceAllGray;
    setForceAllGray(nextVal);
    triggerRecalc(paperSize, nextVal, isDuplex, pagesState);
  };

  const handleDuplexToggle = () => {
    const nextVal = !isDuplex;
    setIsDuplex(nextVal);
    triggerRecalc(paperSize, forceAllGray, nextVal, pagesState);
  };

  const handlePageGrayToggle = (pageIndex: number) => {
    const updated = [...pagesState];
    updated[pageIndex] = {
      ...updated[pageIndex],
      force_grayscale: !updated[pageIndex].force_grayscale,
    };
    setPagesState(updated);
    triggerRecalc(paperSize, forceAllGray, isDuplex, updated);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Record job
      const jobId = await recordPrintJob({
        filename: quote.filename,
        file_type: 'pdf',
        primary_paper_size: paperSize,
        is_duplex: isDuplex,
        total_pages: quote.total_pages,
        total_price: quote.total_price,
        pages: pagesState,
      });

      // 2. Record payment transaction

      await recordPayment({
        job_id: jobId,
        payment_method: paymentMethod,
        amount_paid: parseFloat(amountPaid) || quote.total_price,
        customer_name: customerName,
        notes: orderNotes,
      });

      setPaymentSuccess(true);
      onPaymentSuccess();
    } catch (err) {
      alert('Error recording payment: ' + String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeDue = Math.max(0, (parseFloat(amountPaid) || 0) - quote.total_price);

  return (
    <div className="space-y-6">
      {/* Top Banner: File Summary & Action Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* File info & Tier Badges */}
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-slate-100 rounded-lg text-slate-700">
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{quote.filename}</h3>
                <p className="text-xs text-slate-500">
                  {quote.total_pages} total pages | Auto-detected size: {quote.primary_paper_size.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Color Tier Breakdown Pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-slate-500 mr-1.5" />
                {quote.tier_summary.mono} Monochrome
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                <span className="w-2 h-2 rounded-full bg-sky-500 mr-1.5" />
                {quote.tier_summary.accent} Accent Color
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <span className="w-2 h-2 rounded-full bg-indigo-500 mr-1.5" />
                {quote.tier_summary.medium} Graphic / Chart
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200">
                <span className="w-2 h-2 rounded-full bg-pink-500 mr-1.5" />
                {quote.tier_summary.photo} Heavy / Photo
              </span>
            </div>
          </div>

          {/* Controls & Total Display */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* Paper Size Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Paper Size
              </label>
              <select
                value={paperSize}
                onChange={(e) => handlePaperChange(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg text-sm px-3 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="short">Short / Letter (8.5x11)</option>
                <option value="a4">A4 (8.27x11.69)</option>
                <option value="long">Long / Folio (8.5x13) +₱1</option>
              </select>
            </div>

            {/* Quick Force All B&W Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Grayscale Discount
              </label>
              <button
                type="button"
                onClick={handleGlobalGrayToggle}
                className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-all flex items-center gap-1.5 ${
                  forceAllGray
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>{forceAllGray ? '✓ All B&W Active' : 'Force All B&W'}</span>
              </button>
            </div>

            {/* Duplex Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Print Mode
              </label>
              <button
                type="button"
                onClick={handleDuplexToggle}
                className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-all flex items-center gap-1.5 ${
                  isDuplex
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isDuplex ? '✓ Back-to-Back' : 'Single-Sided'}</span>
              </button>
            </div>

            {/* Total Price Banner & Action */}
            <div className="pl-2 sm:border-l border-slate-200 flex flex-col justify-center">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Total Price
              </span>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-emerald-600">
                  ₱{quote.total_price.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsCheckingOut(true)}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <DollarSign className="w-4 h-4" />
              <span>Collect / POS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Checkout / Payment Modal */}
      {isCheckingOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {paymentSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Payment Recorded!</h3>
                <p className="text-sm text-slate-600 mt-2">
                  Transaction logged successfully in the store sales ledger.
                </p>
                <div className="mt-4 bg-slate-50 rounded-xl p-4 text-left text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Method:</span>
                    <span className="font-semibold text-slate-800">{paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Charged:</span>
                    <span className="font-semibold text-slate-800">₱{quote.total_price.toFixed(2)}</span>
                  </div>
                  {paymentMethod === 'CASH' && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Change Given:</span>
                      <span className="font-semibold text-emerald-600">₱{changeDue.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setIsCheckingOut(false);
                    setPaymentSuccess(false);
                  }}
                  className="mt-6 w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl transition-all"
                >
                  Done / Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">Collect Print Payment</h3>
                    <p className="text-xs text-slate-500">{quote.filename}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCheckingOut(false)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
                  >
                    ✕
                  </button>
                </div>

                {/* Amount to pay banner */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                    Total Amount Due
                  </span>
                  <div className="text-4xl font-extrabold text-emerald-700 mt-0.5">
                    ₱{quote.total_price.toFixed(2)}
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-all ${
                        paymentMethod === 'CASH'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <Banknote className="w-5 h-5 text-emerald-600" />
                      <span>Cash</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('GCASH')}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-all ${
                        paymentMethod === 'GCASH'
                          ? 'border-sky-600 bg-sky-50 text-sky-800 ring-2 ring-sky-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 text-sky-600" />
                      <span>GCash</span>
                    </button>
                  </div>
                </div>

                {/* Amount Tendered (Cash only) */}
                {paymentMethod === 'CASH' && (
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                      Cash Tendered (₱)
                    </label>
                    <input
                      type="number"
                      step="0.50"
                      min={quote.total_price}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="w-full text-lg font-bold px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <div className="flex justify-between items-center mt-2 px-1 text-sm font-semibold">
                      <span className="text-slate-500">Change to return:</span>
                      <span className="text-emerald-700 text-base">₱{changeDue.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Customer name / Messenger note */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Customer Name / Messenger Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Maria (Messenger) or USB Walk-in"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Pickup Notes */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Pickup Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Stapled, Pickup at 5 PM"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>


                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCheckingOut(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmitting ? 'Recording...' : 'Mark as Paid'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Page-by-Page Preview Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-base">Page-by-Page Color Breakdown</h3>
          <span className="text-xs text-slate-500 font-medium">
            Click 'Force B&W' on any page if customer requested that page monochrome
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {pagesState.map((page, idx) => {
            const isGray = forceAllGray || page.force_grayscale;
            const badgeColor = isGray
              ? 'bg-slate-100 text-slate-700 border-slate-200'
              : page.tier === 'photo'
              ? 'bg-pink-100 text-pink-800 border-pink-200'
              : page.tier === 'medium'
              ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
              : page.tier === 'accent'
              ? 'bg-sky-100 text-sky-800 border-sky-200'
              : 'bg-slate-100 text-slate-700 border-slate-200';

            const tierName = isGray
              ? 'B&W'
              : page.tier === 'photo'
              ? 'Full Photo'
              : page.tier === 'medium'
              ? 'Graphic'
              : page.tier === 'accent'
              ? 'Accent Color'
              : 'B&W';

            return (
              <div
                key={page.page_number}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
              >
                {/* Page Thumbnail Preview */}
                <div className="relative bg-slate-100 aspect-[1/1.3] flex items-center justify-center p-2 overflow-hidden">
                  <img
                    src={page.thumbnail}
                    alt={`Page ${page.page_number}`}
                    className={`max-h-full max-w-full object-contain rounded shadow-xs transition-all ${
                      isGray ? 'grayscale' : ''
                    }`}
                  />
                  <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    #{page.page_number}
                  </div>
                  <div className="absolute top-2 right-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-xs ${badgeColor}`}
                    >
                      {tierName}
                    </span>
                  </div>
                </div>

                {/* Page Metrics & Price */}
                <div className="p-3 bg-white border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Color: {page.color_coverage_pct}%
                    </span>
                    <span className="text-sm font-extrabold text-emerald-700">
                      ₱{page.price.toFixed(2)}
                    </span>
                  </div>

                  {/* Force B&W Button */}
                  <button
                    type="button"
                    disabled={forceAllGray}
                    onClick={() => handlePageGrayToggle(idx)}
                    className={`text-[11px] font-semibold py-1 px-2 rounded-lg border transition-all text-center ${
                      forceAllGray
                        ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-200'
                        : page.force_grayscale
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {page.force_grayscale ? '✓ B&W Forced' : 'Print as B&W'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
