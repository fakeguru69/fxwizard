import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  ChevronUp, 
  ChevronDown, 
  Calculator,
  Delete,
  X,
  Equal
} from 'lucide-react';
import { ExchangeRatesData } from '../types';
import { getCurrencyInfo } from '../data/currencies';
import { playRuneClick, playSpellChime } from '../services/sound';
import { triggerMagicSparks, evaluateMathExpression } from '../services/fxService';
import { CurrencyFlag } from './CurrencyFlag';

interface MultiCurrencyConverterProps {
  baseCurrency: string;
  onChangeBaseCurrency: (code: string) => void;
  activeCurrencies: string[];
  onAddCurrency: () => void;
  onRemoveCurrency: (code: string) => void;
  ratesData: ExchangeRatesData | null;
  isLoading: boolean;
  onOpenAlertForPair: (targetCurrency: string, currentRate: number) => void;
  onOpenChartForPair: (base: string, target: string) => void;
  onReorderCurrencies?: (currencies: string[]) => void;
}

const GURU_PROPHECIES = [
  '“The Guru does not chase exchange rates. The Guru refreshes and waits.” — THE ARBITRAGE GURU',
  '“Buy low in the Shire, sell high in Camelot. Transmutation law #1.” — MERLIN',
  '“When in doubt, cross-rate with Swiss Francs and breathe deeply.” — THE ORACLE',
  '“A wizard is never late with remittances; he exchanges precisely when spreads are tight.” — GANDALF',
  '“True wealth is having enough currencies to confuse your tax mage.” — MERLIN’S DIARY',
];

export const MultiCurrencyConverter: React.FC<MultiCurrencyConverterProps> = ({
  baseCurrency,
  onChangeBaseCurrency,
  activeCurrencies,
  onAddCurrency,
  onRemoveCurrency,
  ratesData,
  onOpenChartForPair,
  onReorderCurrencies,
}) => {
  // Currently active base amount & which currency is driving the calculation
  const [activeDriverCode, setActiveDriverCode] = useState<string>(baseCurrency);
  const [driverAmountStr, setDriverAmountStr] = useState<string>('1.00');
  
  const [guruProphecyIndex, setGuruProphecyIndex] = useState<number>(0);
  
  // Interactive Calculator Modal State
  const [isCalcModalOpen, setIsCalcModalOpen] = useState<boolean>(false);
  const [activeCalcCurrency, setActiveCalcCurrency] = useState<string>(baseCurrency);

  // Evaluated driver number
  const numericDriverAmount = useMemo(() => {
    if (!driverAmountStr.trim()) return 0;
    const evaluated = evaluateMathExpression(driverAmountStr);
    return evaluated !== null && !isNaN(evaluated) ? evaluated : parseFloat(driverAmountStr) || 0;
  }, [driverAmountStr]);

  // Format currency value cleanly
  const formatAmount = (val: number) => {
    if (isNaN(val)) return '0.00';
    if (val > 0 && val < 0.001) {
      return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
    }
    if (val >= 100000) {
      return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (val >= 1000) {
      return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  // Convert every active currency relative to the active driver
  const currencyCards = useMemo(() => {
    if (!ratesData || !ratesData.rates) return [];
    
    // Global rates relative to API base
    const driverGlobalRate = ratesData.rates[activeDriverCode] || ratesData.rates[baseCurrency] || 1.0;

    return activeCurrencies.map((code) => {
      const info = getCurrencyInfo(code);
      const isCurrentDriver = code === activeDriverCode;
      const targetGlobalRate = ratesData.rates[code] || 1.0;

      // Rate: 1 activeDriverCode = X code
      const rateFromDriver = driverGlobalRate > 0 ? targetGlobalRate / driverGlobalRate : 1.0;
      const convertedValue = isCurrentDriver ? numericDriverAmount : numericDriverAmount * rateFromDriver;

      return {
        ...info,
        isCurrentDriver,
        rateFromDriver,
        convertedValue,
      };
    });
  }, [activeCurrencies, activeDriverCode, baseCurrency, ratesData, numericDriverAmount]);

  // Handle direct input change on any currency card
  const handleInputChange = (code: string, rawVal: string) => {
    setActiveDriverCode(code);
    onChangeBaseCurrency(code);
    setDriverAmountStr(rawVal);
  };

  // Open calculator for a specific currency
  const openCalculator = (code: string) => {
    playRuneClick();
    setActiveDriverCode(code);
    onChangeBaseCurrency(code);
    setActiveCalcCurrency(code);
    setIsCalcModalOpen(true);
  };

  // Settle formula expression
  const handleSettleMath = () => {
    playRuneClick();
    const evaluated = evaluateMathExpression(driverAmountStr);
    if (evaluated !== null && !isNaN(evaluated)) {
      const clean = evaluated < 0.001 
        ? evaluated.toFixed(6) 
        : evaluated < 1 
        ? evaluated.toFixed(4) 
        : (Math.round(evaluated * 100) / 100).toString();
      setDriverAmountStr(clean);
    }
  };

  // Calculator Keypad Press
  const handleKeypadPress = (btn: string) => {
    playRuneClick();

    if (btn === 'CLEAR') {
      setDriverAmountStr('0');
      return;
    }

    if (btn === 'BACKSPACE') {
      const nextVal = driverAmountStr.length > 1 ? driverAmountStr.slice(0, -1) : '0';
      setDriverAmountStr(nextVal);
      return;
    }

    if (btn === '=') {
      handleSettleMath();
      return;
    }

    let nextVal = driverAmountStr;
    if ((driverAmountStr === '0' || driverAmountStr === '1.00') && /^[0-9]$/.test(btn)) {
      nextVal = btn;
    } else {
      nextVal = driverAmountStr + btn;
    }
    setDriverAmountStr(nextVal);
  };

  // Quick modifier spells
  const handleQuickModifier = (modifier: string) => {
    playRuneClick();
    let nextVal = driverAmountStr;

    if (modifier === '+10') nextVal = `${driverAmountStr} + 10`;
    else if (modifier === '+50') nextVal = `${driverAmountStr} + 50`;
    else if (modifier === '+100') nextVal = `${driverAmountStr} + 100`;
    else if (modifier === '+500') nextVal = `${driverAmountStr} + 500`;
    else if (modifier === '+5%') nextVal = `${driverAmountStr} + 5%`;
    else if (modifier === '+10%') nextVal = `${driverAmountStr} + 10%`;
    else if (modifier === '*2') nextVal = `${driverAmountStr} * 2`;
    else if (modifier === '/2') nextVal = `${driverAmountStr} / 2`;

    setDriverAmountStr(nextVal);
  };

  // Reordering currencies
  const moveCurrency = (index: number, direction: 'up' | 'down') => {
    playRuneClick();
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= activeCurrencies.length) return;

    const updated = [...activeCurrencies];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    if (onReorderCurrencies) {
      onReorderCurrencies(updated);
    }
  };

  const nextProphecy = () => {
    playSpellChime();
    triggerMagicSparks();
    setGuruProphecyIndex((prev) => (prev + 1) % GURU_PROPHECIES.length);
  };

  const handleApplyPresetPack = (packCodes: string[]) => {
    playSpellChime();
    triggerMagicSparks();
    if (onReorderCurrencies) {
      onReorderCurrencies(packCodes);
    }
  };

  const activeCalcInfo = useMemo(() => getCurrencyInfo(activeCalcCurrency), [activeCalcCurrency]);

  const previewMathResult = useMemo(() => {
    if (!/[+\-*/()%]/.test(driverAmountStr)) return null;
    const evaluated = evaluateMathExpression(driverAmountStr);
    if (evaluated !== null && !isNaN(evaluated)) {
      return evaluated < 0.01 
        ? evaluated.toFixed(4) 
        : evaluated.toLocaleString(undefined, { maximumFractionDigits: 4 });
    }
    return null;
  }, [driverAmountStr]);

  return (
    <div id="multi-currency-converter" className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
      
      {/* Sleek Preset Currencies Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <div className="flex items-center gap-1.5 flex-nowrap">
          <button
            onClick={() => handleApplyPresetPack(['SGD', 'MYR', 'USD', 'EUR'])}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 whitespace-nowrap text-xs font-semibold active:scale-95 transition-all"
          >
            <CurrencyFlag currencyCode="SGD" size="xs" />
            <CurrencyFlag currencyCode="MYR" size="xs" className="-ml-1" />
            <span>SG & MY</span>
          </button>
          <button
            onClick={() => handleApplyPresetPack(['SGD', 'MYR', 'THB', 'IDR', 'PHP', 'VND', 'USD'])}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap text-xs active:scale-95 transition-all"
          >
            <CurrencyFlag currencyCode="THB" size="xs" />
            <span>ASEAN</span>
          </button>
          <button
            onClick={() => handleApplyPresetPack(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'])}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap text-xs active:scale-95 transition-all"
          >
            <CurrencyFlag currencyCode="USD" size="xs" />
            <CurrencyFlag currencyCode="EUR" size="xs" className="-ml-1" />
            <span>Majors</span>
          </button>
          <button
            onClick={() => handleApplyPresetPack(['USD', 'EUR', 'SGD', 'MYR'])}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap text-xs active:scale-95 transition-all"
          >
            ✨ 4 Pairs
          </button>
        </div>

        {/* Live Status Tag */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono flex-shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${ratesData?.isOffline ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
          <span>{ratesData?.isOffline ? 'cached' : 'live'}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CLEAN, UNCLUTTERED CURRENCY CARDS (Equal Design For All Currencies) */}
      {/* ========================================================================= */}
      <div className="space-y-2 sm:space-y-2.5">
        {currencyCards.map((curr, idx) => {
          const isDriving = curr.code === activeDriverCode;
          const displayValue = isDriving ? driverAmountStr : formatAmount(curr.convertedValue);
          const rateFormatted = curr.rateFromDriver < 0.001 
            ? curr.rateFromDriver.toFixed(6) 
            : curr.rateFromDriver.toFixed(4);

          return (
            <div
              key={curr.code}
              id={`currency-card-${curr.code}`}
              className={`group relative rounded-2xl p-3 sm:p-3.5 transition-all shadow-md ${
                isDriving
                  ? 'bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-2 border-amber-400/80 ring-1 ring-amber-400/20'
                  : 'bg-slate-900/90 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                
                {/* Reorder Arrows (Up / Down) */}
                <div className="flex flex-col items-center justify-center -space-y-1.5 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveCurrency(idx, 'up');
                    }}
                    disabled={idx === 0}
                    className={`p-1 transition-colors ${
                      idx === 0 
                        ? 'text-slate-700 cursor-not-allowed' 
                        : 'text-slate-500 hover:text-amber-300 active:scale-90'
                    }`}
                    title="Move up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveCurrency(idx, 'down');
                    }}
                    disabled={idx === currencyCards.length - 1}
                    className={`p-1 transition-colors ${
                      idx === currencyCards.length - 1 
                        ? 'text-slate-700 cursor-not-allowed' 
                        : 'text-slate-500 hover:text-amber-300 active:scale-90'
                    }`}
                    title="Move down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Left Side: Flag + Code + Name */}
                <div 
                  onClick={() => {
                    setActiveDriverCode(curr.code);
                    onChangeBaseCurrency(curr.code);
                  }}
                  className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-shrink-0"
                >
                  <CurrencyFlag 
                    currencyCode={curr.code} 
                    fallbackEmoji={curr.flag} 
                    size="md" 
                    className="shadow-md ring-1 ring-slate-700/50"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-base sm:text-lg font-black font-mono tracking-tight ${
                        isDriving ? 'text-amber-300' : 'text-white'
                      }`}>
                        {curr.code}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-[85px] sm:max-w-[130px]">
                      {curr.name}
                    </p>
                  </div>
                </div>

                {/* Right Side: Consistent Fixed-Width Amount Box & Action Buttons */}
                <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
                  
                  {/* Consistent Width Number Input (Direct keyboard typing without opening popup) */}
                  <div className="relative w-[130px] sm:w-[170px] flex-shrink-0">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={displayValue}
                      onChange={(e) => handleInputChange(curr.code, e.target.value)}
                      onFocus={() => {
                        setActiveDriverCode(curr.code);
                        onChangeBaseCurrency(curr.code);
                      }}
                      placeholder="0.00"
                      className={`w-full text-right px-2.5 sm:px-3 py-1.5 bg-slate-950 border ${
                        isDriving 
                          ? 'border-amber-400/80 text-amber-300 shadow-amber-950/20' 
                          : 'border-slate-800 text-slate-100 hover:border-slate-700'
                      } rounded-xl text-base sm:text-lg font-mono font-bold placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 transition-all shadow-inner`}
                    />
                  </div>

                  {/* Calculator Button (Tapping opens Calculator Pop-up) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openCalculator(curr.code);
                    }}
                    className={`p-2 rounded-xl transition-all flex-shrink-0 ${
                      isCalcModalOpen && activeCalcCurrency === curr.code
                        ? 'bg-amber-400 text-slate-950 shadow-md'
                        : 'bg-slate-950 hover:bg-slate-800 text-amber-400 border border-slate-800'
                    }`}
                    title={`Open Calculator for ${curr.code}`}
                  >
                    <Calculator className="w-4 h-4" />
                  </button>

                  {/* Delete Button (Only when more than 2 currencies) */}
                  {activeCurrencies.length > 2 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playRuneClick();
                        onRemoveCurrency(curr.code);
                      }}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-rose-950 text-slate-500 hover:text-rose-400 transition-colors border border-slate-800 flex-shrink-0"
                      title={`Remove ${curr.code}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Another Currency Button */}
        <button
          id="summon-currency-list-btn"
          onClick={onAddCurrency}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-dashed border-slate-800 hover:border-amber-500/50 bg-slate-950/40 hover:bg-indigo-950/20 text-slate-400 hover:text-amber-300 font-bold font-serif text-xs sm:text-sm transition-all duration-200 active:scale-98 group"
        >
          <Plus className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
          <span>+ Add Another Currency</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE CALCULATOR POP-UP MODAL */}
      {/* ========================================================================= */}
      {isCalcModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsCalcModalOpen(false)}
        >
          <div 
            id="currency-calculator-popup"
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-gradient-to-b from-slate-900 via-indigo-950/60 to-slate-950 border-2 border-amber-500/50 shadow-2xl shadow-black p-4 sm:p-5 space-y-3 animate-in slide-in-from-bottom-6 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
              <div className="flex items-center gap-2.5">
                <CurrencyFlag 
                  currencyCode={activeCalcInfo.code} 
                  fallbackEmoji={activeCalcInfo.flag} 
                  size="lg" 
                  className="shadow-md ring-1 ring-slate-700/50"
                />
                <div>
                  <span className="text-sm font-bold text-white font-serif">
                    {activeCalcInfo.name} ({activeCalcInfo.code})
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Live currency math calculator
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCalcModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close Calculator"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Multipliers & Percentages */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap mr-0.5">
                Quick:
              </span>
              {['+10', '+50', '+100', '+500', '+5%', '+10%', '*2', '/2'].map((mod) => (
                <button
                  key={mod}
                  onClick={() => handleQuickModifier(mod)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-indigo-900/50 text-amber-300 hover:text-amber-200 border border-slate-800 hover:border-amber-500/40 font-mono text-xs font-semibold active:scale-95 transition-all whitespace-nowrap"
                >
                  {mod === '*2' ? '×2' : mod === '/2' ? '÷2' : mod}
                </button>
              ))}
            </div>

            {/* Current Expression & Result Display */}
            <div className="px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono shadow-inner">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-500 block uppercase">
                  {activeCalcInfo.code} Amount
                </span>
                <span className="text-xl sm:text-2xl font-bold text-amber-300 truncate block">
                  {driverAmountStr}
                </span>
              </div>
              {previewMathResult && (
                <div className="text-right pl-3">
                  <span className="text-[10px] text-emerald-400 block uppercase">Result</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-300">
                    = {previewMathResult}
                  </span>
                </div>
              )}
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 font-mono text-base">
              <button 
                onClick={() => handleKeypadPress('CLEAR')} 
                className="py-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 font-bold border border-rose-500/30 active:scale-95 transition-all"
              >
                C
              </button>
              <button 
                onClick={() => handleKeypadPress('(')} 
                className="py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 active:scale-95 transition-all"
              >
                (
              </button>
              <button 
                onClick={() => handleKeypadPress(')')} 
                className="py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 active:scale-95 transition-all"
              >
                )
              </button>
              <button 
                onClick={() => handleKeypadPress('/')} 
                className="py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 active:scale-95 transition-all"
              >
                ÷
              </button>

              <button 
                onClick={() => handleKeypadPress('7')} 
                className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 active:scale-95 transition-all"
              >
                7
              </button>
              <button 
                onClick={() => handleKeypadPress('8')} 
                className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 active:scale-95 transition-all"
              >
                8
              </button>
              <button 
                onClick={() => handleKeypadPress('9')} 
                className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 active:scale-95 transition-all"
              >
                9
              </button>
              <button 
                onClick={() => handleKeypadPress('*')} 
                className="py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 active:scale-95 transition-all"
              >
                ×
              </button>

              <button 
                onClick={() => handleKeypadPress('4')} 
                className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 active:scale-95 transition-all"
              >
                4
              </button>
              <button 
                onClick={() => handleKeypadPress('5')} 
                className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 active:scale-95 transition-all"
              >
                5
              </button>
              <button 
                onClick={() => handleKeypadPress('6')} 
                className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 active:scale-95 transition-all"
              >
                6
              </button>
              <button 
                onClick={() => handleKeypadPress('-')} 
                className="py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 active:scale-95 transition-all"
              >
                −
              </button>

              <button 
                onClick={() => handleKeypadPress('1')} 
                className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 active:scale-95 transition-all"
              >
                1
              </button>
              <button 
                onClick={() => handleKeypadPress('2')} 
                className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 active:scale-95 transition-all"
              >
                2
              </button>
              <button 
                onClick={() => handleKeypadPress('3')} 
                className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 active:scale-95 transition-all"
              >
                3
              </button>
              <button 
                onClick={() => handleKeypadPress('+')} 
                className="py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 active:scale-95 transition-all"
              >
                +
              </button>

              <button 
                onClick={() => handleKeypadPress('0')} 
                className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 active:scale-95 transition-all"
              >
                0
              </button>
              <button 
                onClick={() => handleKeypadPress('.')} 
                className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 active:scale-95 transition-all"
              >
                .
              </button>
              <button 
                onClick={() => handleKeypadPress('BACKSPACE')} 
                className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center active:scale-95 transition-all"
                title="Delete"
              >
                <Delete className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  handleKeypadPress('=');
                  setIsCalcModalOpen(false);
                }} 
                className="py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black border border-amber-300 shadow-md active:scale-95 transition-all flex items-center justify-center gap-1"
                title="Calculate & Apply"
              >
                <Equal className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                onClick={handleSettleMath}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono font-semibold transition-colors"
              >
                Evaluate Formula
              </button>
              <button
                onClick={() => setIsCalcModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition-colors shadow"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prophetic Guru Banner */}
      <div 
        onClick={nextProphecy}
        className="group relative cursor-pointer overflow-hidden p-3 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-amber-950/20 border border-amber-500/20 hover:border-amber-400 shadow-sm transition-all select-none"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base select-none">🔮</span>
          <p className="text-xs text-slate-300 font-serif italic truncate flex-1">
            {GURU_PROPHECIES[guruProphecyIndex]}
          </p>
          <Sparkles className="w-3 h-3 text-amber-400/70 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
};
