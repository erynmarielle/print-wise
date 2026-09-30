import { Printer, TrendingUp, Sliders, AlertCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: 'pos' | 'revenue' | 'pricing';
  setActiveTab: (tab: 'pos' | 'revenue' | 'pricing') => void;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, isOnline }) => {
  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Mark with CMYK signature dots */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center gap-1.5" aria-label="CMYK colors">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" title="Cyan" />
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" title="Magenta" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" title="Yellow" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900" title="Key / Black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">PrintWise</span>
                <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  POS Counter
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Automatic Color Quoting & Cashier Ledger</p>
            </div>
          </div>

          {/* Tactile Segmented Navigation */}
          <nav className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all pressable ${
                activeTab === 'pos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-sky-600" />
              <span>Quoter & POS</span>
            </button>

            <button
              onClick={() => setActiveTab('revenue')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all pressable ${
                activeTab === 'revenue'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
              <span>Sales Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('pricing')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all pressable ${
                activeTab === 'pricing'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              <span>Store Rates</span>
            </button>
          </nav>

          {/* Engine Status */}
          <div className="flex items-center">
            {isOnline ? (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-50/90 border border-sky-200/80 text-sky-800 text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                </span>
                <span className="hidden sm:inline">Engine Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Connecting</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

