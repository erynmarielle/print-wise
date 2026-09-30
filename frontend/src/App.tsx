import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { QuoteViewer } from './components/QuoteViewer';
import { RevenueDashboard } from './components/RevenueDashboard';
import { PricingSettings } from './components/PricingSettings';
import type { QuoteResponse } from './types';
import { checkBackendHealth, uploadAndQuote, quoteFromUrl, fetchSampleQuote } from './api';
import { AlertCircle, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pos' | 'revenue' | 'pricing'>('pos');
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);

  // Poll backend health every 8 seconds
  useEffect(() => {
    const check = async () => {
      const ok = await checkBackendHealth();
      setIsOnline(ok);
    };
    check();
    const interval = setInterval(check, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await uploadAndQuote(file);
      setQuote(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlSubmit = async (url: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await quoteFromUrl(url);
      setQuote(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch and analyze Google Docs/Slides');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleLoad = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetchSampleQuote();
      setQuote(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load sample print document');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} isOnline={isOnline} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-red-800 animate-in fade-in duration-150">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-bold">Error analyzing document: </span>
              {errorMessage}
            </div>
          </div>
        )}

        {/* Tab 1: POS & Quoting Screen */}
        {activeTab === 'pos' && (
          <div>
            <UploadSection
              onFileUpload={handleFileUpload}
              onUrlSubmit={handleUrlSubmit}
              onSampleLoad={handleSampleLoad}
              isLoading={isLoading}
            />

            {quote ? (
              <QuoteViewer
                quote={quote}
                onQuoteUpdated={(updated) => setQuote(updated)}
                onPaymentSuccess={() => {
                  // After payment, keep quote visible or ready for next order
                }}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center shadow-xs">
                <div className="grid grid-cols-2 gap-2 p-3.5 bg-slate-100 rounded-2xl w-14 h-14 mx-auto mb-4 border border-slate-200/80 items-center justify-center shadow-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Printing Counter Ready
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
                  Drop customer files from Messenger or paste Google Docs/Slides links to immediately calculate CMYK ink coverage, paper sizes, and exact job prices.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleSampleLoad}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all pressable"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    <span>Run Demo on 4-Page Sample PDF</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto mt-8 pt-6 border-t border-slate-100 text-left text-xs text-slate-600">
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70">
                    <span className="font-bold text-slate-900 block mb-0.5">CMYK Tiers</span>
                    <span className="text-[11px] text-slate-500">Auto B&W, Accent, Medium & Photo detection</span>
                  </div>
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70">
                    <span className="font-bold text-slate-900 block mb-0.5">Paper Sizing</span>
                    <span className="text-[11px] text-slate-500">Short, A4 & Long (8.5x13) +₱1 surcharge</span>
                  </div>
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70">
                    <span className="font-bold text-slate-900 block mb-0.5">Cashier Ledger</span>
                    <span className="text-[11px] text-slate-500">GCash & Cash drawer totals with profit margins</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Revenue & Sales Ledger */}
        {activeTab === 'revenue' && <RevenueDashboard />}

        {/* Tab 3: Store Rates Configuration */}
        {activeTab === 'pricing' && <PricingSettings />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          PrintWise • Automated Print Quoting & POS Engine for Sari-Sari Printing Operations
        </div>
      </footer>
    </div>
  );
};

export default App;
