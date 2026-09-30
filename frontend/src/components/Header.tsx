import React from 'react';
import { Printer, TrendingUp, Settings, CircleCheck, AlertCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: 'pos' | 'revenue' | 'pricing';
  setActiveTab: (tab: 'pos' | 'revenue' | 'pricing') => void;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, isOnline }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Store Brand */}
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-sm">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">PrintWise</span>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                  Sari-Sari Edition
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Automatic Color Quoting & Store POS</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'pos'
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Quoter & POS</span>
            </button>

            <button
              onClick={() => setActiveTab('revenue')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'revenue'
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Sales Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('pricing')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'pricing'
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Rates</span>
            </button>
          </nav>

          {/* Backend Status indicator */}
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CircleCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Backend Ready</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Connecting...</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
