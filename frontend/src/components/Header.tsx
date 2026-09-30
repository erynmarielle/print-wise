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
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">PrintWise</span>
                {/* Micro CMYK indicator */}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200" title="CMYK Color Density Engine">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                </span>
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
              <Printer className="w-3.5 h-3.5 text-emerald-600" />
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
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
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
              <Sliders className="w-3.5 h-3.5 text-amber-600" />
              <span>Store Rates</span>
            </button>
          </nav>

          {/* Engine Status */}
          <div className="flex items-center">
            {isOnline ? (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50/80 border border-emerald-200/80 text-emerald-800 text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
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

