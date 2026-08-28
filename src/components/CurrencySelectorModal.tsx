import React, { useState, useMemo } from 'react';
import { Search, X, Check, Plus, Globe } from 'lucide-react';
import { CURRENCIES, getCurrencyInfo } from '../data/currencies';
import { CurrencyInfo } from '../types';
import { playRuneClick } from '../services/sound';
import { CurrencyFlag } from './CurrencyFlag';

interface CurrencySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCurrencies: string[];
  onToggleCurrency: (currencyCode: string) => void;
  onSelectSingle?: (currencyCode: string) => void;
  mode?: 'multi' | 'single';
  title?: string;
}

export const CurrencySelectorModal: React.FC<CurrencySelectorModalProps> = ({
  isOpen,
  onClose,
  activeCurrencies,
  onToggleCurrency,
  onSelectSingle,
  mode = 'multi',
  title = 'Enchanted Currency Vault',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');

  const regions = ['All', 'Americas', 'Europe', 'Asia-Pacific', 'Middle East & Africa'];

  const filteredCurrencies = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return CURRENCIES.filter((c) => {
      const matchesSearch =
        c.code.toLowerCase().includes(term) ||
        c.name.toLowerCase().includes(term) ||
        (c.alchemyTitle && c.alchemyTitle.toLowerCase().includes(term));
      const matchesRegion = selectedRegion === 'All' || c.region === selectedRegion;
      return matchesSearch && matchesRegion;
    });
  }, [searchTerm, selectedRegion]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="currency-selector-modal"
        className="w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-950/40 flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📜</span>
            <div>
              <h2 className="text-base font-bold text-amber-200 font-serif">{title}</h2>
              <p className="text-xs text-slate-400">
                {mode === 'multi'
                  ? 'Select currencies to summon into your real-time viewing altar'
                  : 'Choose a primary currency'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="currency-search-input"
              type="text"
              placeholder="Search by code (e.g. EUR, JPY), country, or moniker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Region Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {regions.map((region) => (
              <button
                key={region}
                onClick={() => {
                  playRuneClick();
                  setSelectedRegion(region);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedRegion === region
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        {/* Currency Grid */}
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-950/40">
          {filteredCurrencies.map((currency) => {
            const isSelected = activeCurrencies.includes(currency.code);

            return (
              <div
                key={currency.code}
                id={`currency-item-${currency.code}`}
                onClick={() => {
                  playRuneClick();
                  if (mode === 'single' && onSelectSingle) {
                    onSelectSingle(currency.code);
                    onClose();
                  } else {
                    onToggleCurrency(currency.code);
                  }
                }}
                className={`group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-amber-950/30 border-amber-500/50 text-amber-100 shadow-sm shadow-amber-950/50'
                    : 'bg-slate-900/90 border-slate-800/80 hover:border-slate-700 text-slate-200 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CurrencyFlag 
                    currencyCode={currency.code} 
                    fallbackEmoji={currency.flag} 
                    size="md" 
                    className="shadow-sm ring-1 ring-slate-700/50"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-100">{currency.code}</span>
                      <span className="text-xs text-amber-400/80 font-mono font-medium">({currency.symbol})</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{currency.name}</p>
                    {currency.alchemyTitle && (
                      <p className="text-[10px] text-amber-500/70 truncate italic font-serif">
                        {currency.alchemyTitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center ml-2">
                  {mode === 'single' ? (
                    <span className="text-xs text-indigo-400 group-hover:text-indigo-300 font-medium">Select</span>
                  ) : (
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'bg-amber-500 border-amber-400 text-slate-950'
                          : 'bg-slate-950 border-slate-700 text-slate-500 group-hover:border-slate-500'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredCurrencies.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400">
              <Globe className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
              <p className="text-sm">No currencies discovered in this realm.</p>
              <p className="text-xs text-slate-500 mt-1">Try another search term or filter.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {mode === 'multi' ? (
              <span>
                <strong className="text-amber-400">{activeCurrencies.length}</strong> currencies active on altar
              </span>
            ) : (
              <span>Select any world currency</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
