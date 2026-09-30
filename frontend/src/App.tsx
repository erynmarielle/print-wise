import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { QuoteViewer } from './components/QuoteViewer';
import { RevenueDashboard } from './components/RevenueDashboard';
import { PricingSettings } from './components/PricingSettings';
import type { QuoteResponse } from './types';
import { checkBackendHealth, uploadAndQuote, quoteFromUrl } from './api';
import { AlertCircle, Printer, CheckCircle2 } from 'lucide-react';

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
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Printer className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Ready for Document</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                  Upload a PDF from Messenger or paste a Google Docs / Google Slides link above.
                  Our system will automatically scan every page's ink coverage and compute the exact price.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Auto B&W vs Color Detection
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Short & Long Paper Detection
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    GCash & Cash Ledger
                  </span>
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
