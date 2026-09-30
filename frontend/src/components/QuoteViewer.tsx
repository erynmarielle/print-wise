import React, { useState } from 'react';
import type { QuoteResponse, PageQuote } from '../types';
import {
  FileText, CheckCircle2, DollarSign,
  Palette, Smartphone, Banknote, Layers,
  Receipt, X, ChevronDown
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
      // 1. Record job in database
      const jobId = await recordPrintJob({
        filename: quote.filename,
        file_type: 'pdf',
        primary_paper_size: paperSize,
        is_duplex: isDuplex,
        total_pages: quote.total_pages,
        total_price: quote.total_price,
        pages: pagesState,
      });

      // 2. Record cashier payment
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

  const numericPaid = parseFloat(amountPaid) || 0;
  const changeDue = Math.max(0, numericPaid - quote.total_price);

  return (
    <div className="space-y-6">
      {/* Top Banner: Print Order Summary & POS Action Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
        {/* Card Header: Document info & Clean CMYK Badges */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 text-slate-700">
              <FileText className="w-5 h-5 text-slate-800" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight truncate max-w-[280px] sm:max-w-md">
                  {quote.filename}
                </h3>
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                  {quote.total_pages} {quote.total_pages === 1 ? 'Sheet' : 'Sheets'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Auto-detected: <span className="font-semibold text-slate-700 uppercase">{quote.primary_paper_size}</span> · 150 DPI page scan
              </p>
            </div>
          </div>

          {/* Clean CMYK Color Breakdown */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200/80">
              <span className="w-2 h-2 rounded-full bg-slate-900" />
              <span>B&W</span>
              <span className="font-mono-numbers font-bold text-slate-900 ml-0.5">{quote.tier_summary.mono}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-900 border border-sky-200">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>Accent</span>
              <span className="font-mono-numbers font-bold text-sky-900 ml-0.5">{quote.tier_summary.accent}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Medium</span>
              <span className="font-mono-numbers font-bold text-amber-900 ml-0.5">{quote.tier_summary.medium}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-900 border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Photo</span>
              <span className="font-mono-numbers font-bold text-rose-900 ml-0.5">{quote.tier_summary.photo}</span>
            </div>
          </div>
        </div>

        {/* Card Footer: Document Controls & Checkout CTA */}
        <div className="px-5 py-4 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Print Options */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Paper:
              </span>
              <div className="relative">
                <select
                  value={paperSize}
                  onChange={(e) => handlePaperChange(e.target.value)}
                  className="appearance-none bg-white border border-slate-300 rounded-lg text-xs font-semibold pl-2.5 pr-8 py-1.5 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none shadow-2xs cursor-pointer hover:border-slate-400 transition-colors"
                >
                  <option value="short">Short (Letter)</option>
                  <option value="a4">A4 Standard</option>
                  <option value="long">Long (Folio +₱1)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="h-4 w-px bg-slate-300 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Mode:
              </span>
              <button
                type="button"
                onClick={handleGlobalGrayToggle}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 pressable shadow-2xs ${
                  forceAllGray
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
                title="Recalculates all pages as black and white for discount inquiries"
              >
                <Palette className="w-3.5 h-3.5 text-amber-500" />
                <span>{forceAllGray ? '✓ B&W Mode' : 'Color As-Is'}</span>
              </button>
            </div>

            <div className="h-4 w-px bg-slate-300 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Print:
              </span>
              <button
                type="button"
                onClick={handleDuplexToggle}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 pressable shadow-2xs ${
                  isDuplex
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>{isDuplex ? '✓ 2-Sided' : '1-Sided'}</span>
              </button>
            </div>
          </div>

          {/* Pricing & Checkout Action */}
          <div className="flex items-center justify-between lg:justify-end gap-5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200">
            <div className="text-left lg:text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Due
              </span>
              <span className="font-mono-numbers text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none block mt-0.5">
                ₱{quote.total_price.toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => {
                setAmountPaid(quote.total_price.toString());
                setIsCheckingOut(true);
              }}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 pressable"
            >
              <DollarSign className="w-4 h-4 text-sky-200" />
              <span className="text-xs sm:text-sm">Collect / Pay</span>
            </button>
          </div>
        </div>
      </div>


      {/* Checkout / Cashier Drawer Modal */}
      {isCheckingOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {paymentSuccess ? (
              <div className="p-6">
                {/* Paper Receipt Roll Styling */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-5 font-mono text-xs text-slate-800 space-y-3">
                  <div className="text-center pb-3 border-b border-dashed border-slate-300">
                    <p className="font-bold text-sm tracking-wide text-slate-900">PRINTWISE SARI-SARI POS</p>
                    <p className="text-[10px] text-slate-500">Official Printing Sales Receipt</p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date().toLocaleString()}</p>
                  </div>

                  <div className="space-y-1.5 py-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Job:</span>
                      <span className="font-semibold truncate max-w-[200px]">{quote.filename}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pages:</span>
                      <span>{quote.total_pages} sheet(s) ({paperSize.toUpperCase()})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mode:</span>
                      <span>{isDuplex ? '2-Sided Duplex' : '1-Sided'} · {forceAllGray ? 'Forced B&W' : 'CMYK/Color'}</span>
                    </div>
                    {customerName && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Customer:</span>
                        <span className="font-semibold">{customerName}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-dashed border-slate-300 space-y-1">
                    <div className="flex justify-between text-slate-900 font-bold text-sm">
                      <span>TOTAL DUE:</span>
                      <span className="font-mono-numbers">₱{quote.total_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Paid via {paymentMethod}:</span>
                      <span className="font-mono-numbers">₱{numericPaid.toFixed(2)}</span>
                    </div>
                    {paymentMethod === 'CASH' && (
                      <div className="flex justify-between font-bold text-amber-800">
                        <span>CHANGE RETURNED:</span>
                        <span className="font-mono-numbers">₱{changeDue.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCheckingOut(false);
                      setPaymentSuccess(false);
                    }}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-sm transition-all pressable shadow-xs"
                  >
                    Done · Next Customer
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit}>
                {/* Modal Header */}
                <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Receipt className="w-5 h-5 text-sky-400" />
                    <div>
                      <h3 className="font-bold text-sm">Cashier Payment Register</h3>
                      <p className="text-[11px] text-slate-400 font-mono truncate max-w-[280px]">
                        {quote.filename}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCheckingOut(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all pressable"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {/* Total Due Banner */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Total Amount to Collect
                    </span>
                    <div className="font-mono-numbers text-3xl font-extrabold text-slate-900 mt-0.5">
                      ₱{quote.total_price.toFixed(2)}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {quote.total_pages} page(s) · {paperSize.toUpperCase()} · {isDuplex ? 'Back-to-Back' : 'Single'}
                    </span>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-600 mb-1.5">
                      Payment Channel
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CASH')}
                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all pressable ${
                          paymentMethod === 'CASH'
                            ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20 shadow-2xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <Banknote className="w-4 h-4 text-amber-600" />
                        <span>Cash Drawer</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('GCASH')}
                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all pressable ${
                          paymentMethod === 'GCASH'
                            ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20 shadow-2xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <Smartphone className="w-4 h-4 text-blue-600" />
                        <span>GCash QR / Mobile</span>
                      </button>
                    </div>
                  </div>

                  {/* Cash Drawer Calculator */}
                  {paymentMethod === 'CASH' ? (
                    <div className="space-y-3 bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/80">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold uppercase tracking-wide text-amber-900">
                          Cash Tendered (₱)
                        </label>
                        <span className="text-[11px] text-slate-500">Tap quick bill preset:</span>
                      </div>

                      {/* Quick Denomination Presets */}
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          Math.ceil(quote.total_price),
                          20,
                          50,
                          100,
                          200,
                          500,
                          1000,
                        ]
                          .filter((v, i, a) => v >= quote.total_price && a.indexOf(v) === i)
                          .slice(0, 5)
                          .map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setAmountPaid(val.toString())}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all pressable ${
                                numericPaid === val
                                  ? 'bg-amber-600 text-white border-amber-600'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              ₱{val}
                            </button>
                          ))}
                      </div>

                      <input
                        type="number"
                        step="0.50"
                        min={quote.total_price}
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        className="w-full text-base font-bold font-mono-numbers px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                      />

                      {/* Change Due readout */}
                      <div className="flex justify-between items-center px-1 pt-1 border-t border-amber-200/80 text-xs font-semibold">
                        <span className="text-slate-600">Change to Return:</span>
                        <span className="font-mono-numbers text-base font-extrabold text-amber-900">
                          ₱{changeDue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                        <span>Collect via GCash</span>
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Ask the customer to scan the shop's GCash QR code or send <strong>₱{quote.total_price.toFixed(2)}</strong> to your store number.
                      </p>
                    </div>
                  )}

                  {/* Customer / Note */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-600 mb-1">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Maria (Messenger)"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-600 mb-1">
                        Notes / Status
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Stapled, Walk-in"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCheckingOut(false)}
                      className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-all pressable"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 pressable"
                    >
                      <CheckCircle2 className="w-4 h-4 text-sky-200" />
                      <span>{isSubmitting ? 'Recording...' : `Confirm Payment (₱${quote.total_price.toFixed(2)})`}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Page-by-Page Preview Grid with CMYK Meters */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base tracking-tight">
              Page-by-Page CMYK Color Breakdown
            </h3>
            <p className="text-xs text-slate-500">
              Review exact pixel coverage and individually toggle B&W on specific pages.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-900" /> B&W (₱3)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-500" /> Accent (₱5)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Medium (₱8)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Photo (₱15)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {pagesState.map((page, idx) => {
            const isGray = forceAllGray || page.force_grayscale;
            const badgeBg = isGray
              ? 'bg-slate-100 text-slate-800 border-slate-300'
              : page.tier === 'photo'
              ? 'bg-rose-50 text-rose-800 border-rose-300'
              : page.tier === 'medium'
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : page.tier === 'accent'
              ? 'bg-sky-50 text-sky-800 border-sky-300'
              : 'bg-slate-100 text-slate-800 border-slate-300';

            const tierLabel = isGray
              ? 'B&W'
              : page.tier === 'photo'
              ? 'Photo Tier'
              : page.tier === 'medium'
              ? 'Medium Color'
              : page.tier === 'accent'
              ? 'Accent Color'
              : 'B&W';

            const meterColor = isGray
              ? 'bg-slate-400'
              : page.tier === 'photo'
              ? 'bg-rose-500'
              : page.tier === 'medium'
              ? 'bg-amber-500'
              : page.tier === 'accent'
              ? 'bg-sky-500'
              : 'bg-slate-400';

            return (
              <div
                key={page.page_number}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all"
              >
                {/* Page Preview Thumbnail */}
                <div className="relative bg-slate-100/80 aspect-[1/1.33] flex items-center justify-center p-2.5 overflow-hidden">
                  <img
                    src={page.thumbnail}
                    alt={`Page ${page.page_number}`}
                    className={`max-h-full max-w-full object-contain rounded shadow-2xs transition-all duration-200 ${
                      isGray ? 'grayscale opacity-90' : ''
                    }`}
                  />
                  {/* Page Number Tag */}
                  <div className="absolute top-2 left-2 bg-slate-900/90 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                    p.{page.page_number}
                  </div>
                  {/* Tier Badge */}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shadow-2xs ${badgeBg}`}
                    >
                      {tierLabel}
                    </span>
                  </div>
                </div>

                {/* Page Metrics & Controls */}
                <div className="p-3 bg-white border-t border-slate-100 flex flex-col gap-2">
                  {/* Color Ink Coverage Meter */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 font-medium">Color:</span>
                      <span className="font-mono-numbers font-semibold text-slate-800">
                        {isGray ? '0.0%' : `${page.color_coverage_pct}%`}
                      </span>
                    </div>
                    {/* Visual Meter Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${meterColor}`}
                        style={{
                          width: `${isGray ? 0 : Math.min(100, Math.max(4, page.color_coverage_pct * 2.5))}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] text-slate-400 font-mono uppercase">
                      {page.detected_paper_size}
                    </span>
                    <span className="font-mono-numbers text-sm font-extrabold text-slate-900">
                      ₱{page.price.toFixed(2)}
                    </span>
                  </div>

                  {/* Tactile Force B&W Button */}
                  <button
                    type="button"
                    disabled={forceAllGray}
                    onClick={() => handlePageGrayToggle(idx)}
                    className={`w-full text-[11px] font-semibold py-1 px-2 rounded-lg border transition-all text-center pressable ${
                      forceAllGray
                        ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-200'
                        : page.force_grayscale
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
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
