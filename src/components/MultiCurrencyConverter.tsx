import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  TrendingUp, 
  Sparkles, 
  ChevronUp, 
  ChevronDown, 
  Calculator,
  Delete,
  X,
  Equal,
  Crown,
  Anchor,
  ArrowUpDown,
  CornerDownRight,
  Sparkle
} from 'lucide-react';
import { ExchangeRatesData } from '../types';
import { getCurrencyInfo } from '../data/currencies';
import { playRuneClick, playSpellChime } from '../services/sound';
import { triggerMagicSparks, evaluateMathExpression } from '../services/fxService';

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
  // Base currency amount string
  const [baseAmountStr, setBaseAmountStr] = useState<string>('1.00');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [guruProphecyIndex, setGuruProphecyIndex] = useState<number>(0);
  
  // Interactive Calculator Modal State
  const [isCalcModalOpen, setIsCalcModalOpen] = useState<boolean>(false);
  const [activeCalcCurrency, setActiveCalcCurrency] = useState<string>(baseCurrency);
  const [calcInputExprs, setCalcInputExprs] = useState<Record<string, string>>({});

  // Evaluated base amount
  const numericBaseAmount = useMemo(() => {
    if (!baseAmountStr.trim()) return 0;
    const evaluated = evaluateMathExpression(baseAmountStr);
    return evaluated !== null ? evaluated : parseFloat(baseAmountStr) || 0;
  }, [baseAmountStr]);

  // Check if string contains math operators
  const hasMathExpression = (val: string) => {
    return /[+\-*/()%]/.test(val);
  };

  // Format currency value cleanly
  const formatAmount = (val: number) => {
    if (isNaN(val)) return '0.00';
    if (val > 0 && val < 0.001) {
      return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
    }
    if (val >= 10000) {
      return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  // Build unified cards list for ALL active currencies (including anchor)
  const unifiedCards = useMemo(() => {
    if (!ratesData || !ratesData.rates) return [];
    const baseRate = ratesData.rates[baseCurrency] || 1.0;

    return activeCurrencies.map((code) => {
      const info = getCurrencyInfo(code);
      const isAnchor = code === baseCurrency;
      const targetRateGlobal = ratesData.rates[code] || 0;
      const rateAgainstBase = isAnchor ? 1.0 : (baseRate > 0 ? targetRateGlobal / baseRate : 0);
      const convertedValue = isAnchor ? numericBaseAmount : numericBaseAmount * rateAgainstBase;
      const invertedRate = rateAgainstBase > 0 ? 1 / rateAgainstBase : 0;

      return {
        ...info,
        isAnchor,
        rate: rateAgainstBase,
        invertedRate,
        convertedValue,
      };
    });
  }, [activeCurrencies, baseCurrency, ratesData, numericBaseAmount]);

  // Active target expression for calculator
  const getActiveExpression = (code: string): string => {
    if (code === baseCurrency) {
      return baseAmountStr;
    }
    if (calcInputExprs[code] !== undefined) {
      return calcInputExprs[code];
    }
    const card = unifiedCards.find((c) => c.code === code);
    return card ? formatAmount(card.convertedValue).replace(/,/g, '') : '0';
  };

  // Evaluated math preview for active calculator target
  const previewActiveMathResult = useMemo(() => {
    const expr = getActiveExpression(activeCalcCurrency);
    if (!hasMathExpression(expr)) return null;
    const evaluated = evaluateMathExpression(expr);
    if (evaluated !== null && !isNaN(evaluated)) {
      return evaluated < 0.01 
        ? evaluated.toFixed(4) 
        : evaluated.toLocaleString(undefined, { maximumFractionDigits: 4 });
    }
    return null;
  }, [baseAmountStr, calcInputExprs, activeCalcCurrency, unifiedCards]);

  // Settle expression for any currency
  const handleSettleMath = (targetCode = activeCalcCurrency) => {
    playRuneClick();
    if (targetCode === baseCurrency) {
      const evaluated = evaluateMathExpression(baseAmountStr);
      if (evaluated !== null && !isNaN(evaluated)) {
        const clean = evaluated < 0.001 
          ? evaluated.toFixed(6) 
          : evaluated < 1 
          ? evaluated.toFixed(4) 
          : (Math.round(evaluated * 100) / 100).toString();
        setBaseAmountStr(clean);
      }
    } else {
      const currentExpr = calcInputExprs[targetCode];
      if (currentExpr) {
        const evaluated = evaluateMathExpression(currentExpr);
        if (evaluated !== null && !isNaN(evaluated) && ratesData?.rates) {
          const bRate = ratesData.rates[baseCurrency] || 1.0;
          const tRate = ratesData.rates[targetCode] || 1.0;
          const rateAgainstBase = bRate > 0 ? tRate / bRate : 1.0;
          if (rateAgainstBase > 0) {
            const calculatedBase = evaluated / rateAgainstBase;
            const formatted = calculatedBase < 0.001 
              ? calculatedBase.toFixed(6) 
              : calculatedBase < 1 
              ? calculatedBase.toFixed(4) 
              : (Math.round(calculatedBase * 100) / 100).toString();
            setBaseAmountStr(formatted);
          }
          setCalcInputExprs((prev) => {
            const next = { ...prev };
            delete next[targetCode];
            return next;
          });
        }
      }
    }
  };

  // Open calculator popup for a specific currency
  const openCalculator = (code: string) => {
    playRuneClick();
    setActiveCalcCurrency(code);
    setIsCalcModalOpen(true);
  };

  // Handle direct input change on any currency card
  const handleCardInputChange = (targetCode: string, inputVal: string) => {
    if (targetCode === baseCurrency) {
      setBaseAmountStr(inputVal);
      return;
    }

    setCalcInputExprs((prev) => ({ ...prev, [targetCode]: inputVal }));

    if (!ratesData || !ratesData.rates) return;

    const bRate = ratesData.rates[baseCurrency] || 1.0;
    const tRate = ratesData.rates[targetCode] || 1.0;
    const rateAgainstBase = bRate > 0 ? tRate / bRate : 1.0;

    const evaluatedVal = evaluateMathExpression(inputVal);
    const num = evaluatedVal !== null ? evaluatedVal : parseFloat(inputVal) || 0;

    if (rateAgainstBase > 0) {
      const calculatedBase = num / rateAgainstBase;
      const formatted = calculatedBase < 0.001 
        ? calculatedBase.toFixed(6) 
        : calculatedBase < 1 
        ? calculatedBase.toFixed(4) 
        : (Math.round(calculatedBase * 100) / 100).toString();
      setBaseAmountStr(formatted);
    }
  };

  // Keypad button click handler for popup calculator
  const handleKeypadPress = (btn: string) => {
    playRuneClick();
    const currentVal = getActiveExpression(activeCalcCurrency);

    if (btn === 'CLEAR') {
      if (activeCalcCurrency === baseCurrency) {
        setBaseAmountStr('0');
      } else {
        handleCardInputChange(activeCalcCurrency, '0');
      }
      return;
    }

    if (btn === 'BACKSPACE') {
      const nextVal = currentVal.length > 1 ? currentVal.slice(0, -1) : '0';
      if (activeCalcCurrency === baseCurrency) {
        setBaseAmountStr(nextVal);
      } else {
        handleCardInputChange(activeCalcCurrency, nextVal);
      }
      return;
    }

    if (btn === '=') {
      handleSettleMath(activeCalcCurrency);
      return;
    }

    // Append operator or digit
    let nextVal = currentVal;
    if (currentVal === '0' && /^[0-9]$/.test(btn)) {
      nextVal = btn;
    } else if (currentVal === '1.00' && /^[0-9]$/.test(btn)) {
      nextVal = btn;
    } else {
      nextVal = currentVal + btn;
    }

    if (activeCalcCurrency === baseCurrency) {
      setBaseAmountStr(nextVal);
    } else {
      handleCardInputChange(activeCalcCurrency, nextVal);
    }
  };

  // Quick percentage or multiplier modifier
  const handleQuickModifier = (modifier: string) => {
    playRuneClick();
    const currentVal = getActiveExpression(activeCalcCurrency);
    let nextVal = currentVal;

    if (modifier === '+10') nextVal = `${currentVal} + 10`;
    else if (modifier === '+50') nextVal = `${currentVal} + 50`;
    else if (modifier === '+100') nextVal = `${currentVal} + 100`;
    else if (modifier === '+500') nextVal = `${currentVal} + 500`;
    else if (modifier === '+5%') nextVal = `${currentVal} + 5%`;
    else if (modifier === '+10%') nextVal = `${currentVal} + 10%`;
    else if (modifier === '*2') nextVal = `${currentVal} * 2`;
    else if (modifier === '/2') nextVal = `${currentVal} / 2`;

    if (activeCalcCurrency === baseCurrency) {
      setBaseAmountStr(nextVal);
    } else {
      handleCardInputChange(activeCalcCurrency, nextVal);
    }
  };

  // Reordering functions
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

  // Promote any currency to Anchor
  const promoteToAnchor = (code: string) => {
    playSpellChime();
    triggerMagicSparks();
    setActiveCalcCurrency(code);
    onChangeBaseCurrency(code);
  };

  const handleCopy = (text: string, code: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    playRuneClick();
    setTimeout(() => setCopiedCode(null), 2000);
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

  return (
    <div id="multi-currency-converter" className="max-w-2xl mx-auto space-y-3.5 sm:space-y-4">
      
      {/* Streamlined Quick Controls Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <div className="flex items-center gap-1.5 flex-nowrap">
          <button
            onClick={() => handleApplyPresetPack(['SGD', 'MYR', 'USD', 'EUR'])}
            className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 whitespace-nowrap text-xs font-semibold active:scale-95 transition-all"
          >
            🇸🇬 SGD Anchor Pack
          </button>
          <button
            onClick={() => handleApplyPresetPack(['USD', 'EUR', 'SGD', 'MYR'])}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap text-xs active:scale-95 transition-all"
          >
            ✨ 4 Pairs
          </button>
          <button
            onClick={() => handleApplyPresetPack(['SGD', 'MYR', 'THB', 'IDR', 'PHP', 'VND', 'USD'])}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap text-xs active:scale-95 transition-all"
          >
            🌴 ASEAN
          </button>
          <button
            onClick={() => handleApplyPresetPack(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'])}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap text-xs active:scale-95 transition-all"
          >
            👑 Majors
          </button>
        </div>

        {/* Live Status Tag */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono flex-shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${ratesData?.isOffline ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
          <span>{ratesData?.isOffline ? 'cached' : 'live'}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* UNIFIED CURRENCY CARDS LIST (Same Layout & Design for Anchor & All Rest) */}
      {/* ========================================================================= */}
      <div className="space-y-2.5">
        {unifiedCards.map((curr, idx) => {
          const isAnchor = curr.code === baseCurrency;
          const formattedVal = isAnchor 
            ? (numericBaseAmount < 0.001 && numericBaseAmount > 0 ? numericBaseAmount.toFixed(6) : numericBaseAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }))
            : formatAmount(curr.convertedValue);
          
          const currentDisplayVal = isAnchor
            ? baseAmountStr
            : (calcInputExprs[curr.code] !== undefined ? calcInputExprs[curr.code] : formattedVal);

          const rateFormatted = curr.rate < 0.001 ? curr.rate.toFixed(6) : curr.rate.toFixed(4);

          return (
            <div
              key={curr.code}
              id={`currency-card-${curr.code}`}
              className={`group relative rounded-2xl p-3 sm:p-3.5 transition-all shadow-md ${
                isAnchor
                  ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50 border-2 border-amber-400 shadow-amber-950/20 ring-1 ring-amber-400/30'
                  : 'bg-slate-900/90 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                
                {/* Left Section: Reorder arrows + Flag + Code & Name + Anchor Pill */}
                <div className="flex items-center gap-2 min-w-0">
                  {/* Reorder Arrows */}
                  <div className="flex flex-col items-center justify-center -space-y-1">
                    <button
                      onClick={() => moveCurrency(idx, 'up')}
                      className="p-0.5 text-slate-500 hover:text-amber-300 transition-colors"
                      title="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveCurrency(idx, 'down')}
                      className="p-0.5 text-slate-500 hover:text-amber-300 transition-colors"
                      title="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Flag & Currency Name */}
                  <div 
                    onClick={() => {
                      if (!isAnchor) promoteToAnchor(curr.code);
                    }}
                    className="flex items-center gap-2.5 cursor-pointer min-w-0 group/info"
                    title={isAnchor ? 'Active Anchor Currency' : `Click to make ${curr.code} Anchor`}
                  >
                    <span className="text-2xl sm:text-3xl select-none flex-shrink-0">
                      {curr.flag}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-base font-extrabold font-mono tracking-tight transition-colors ${
                          isAnchor ? 'text-amber-300' : 'text-slate-100 group-hover/info:text-amber-300'
                        }`}>
                          {curr.code}
                        </span>

                        {/* Anchor Status / Switch Button */}
                        {isAnchor ? (
                          <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 uppercase font-mono shadow-sm">
                            <Crown className="w-2.5 h-2.5" />
                            <span>Anchor</span>
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              promoteToAnchor(curr.code);
                            }}
                            className="opacity-80 hover:opacity-100 flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-300 transition-all font-mono border border-slate-700"
                            title={`Make ${curr.code} the anchor currency`}
                          >
                            <Anchor className="w-2.5 h-2.5" />
                            <span>Set Anchor</span>
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate max-w-[95px] sm:max-w-[140px]">
                        {curr.name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Section: Editable Amount Box with Calculator Pop-up Trigger */}
                <div className="flex items-center gap-1.5 flex-1 justify-end">
                  
                  {/* Interactive Editable Amount Box */}
                  <div className="relative max-w-[145px] sm:max-w-[185px] w-full">
                    <input
                      type="text"
                      inputMode="text"
                      value={currentDisplayVal}
                      onClick={() => openCalculator(curr.code)}
                      onFocus={() => openCalculator(curr.code)}
                      onChange={(e) => {
                        handleCardInputChange(curr.code, e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSettleMath(curr.code);
                        }
                      }}
                      placeholder="0.00"
                      className={`w-full text-right px-2.5 py-1.5 bg-slate-950 border ${
                        isAnchor 
                          ? 'border-amber-400/80 text-amber-300 ring-1 ring-amber-400/30' 
                          : 'border-slate-800 hover:border-slate-700 text-amber-200'
                      } rounded-xl text-base sm:text-lg font-mono font-bold placeholder-slate-600 focus:outline-none transition-all shadow-inner cursor-pointer`}
                    />
                  </div>

                  {/* Calculator Button (Pop-up Trigger) */}
                  <button
                    onClick={() => openCalculator(curr.code)}
                    className={`p-2 rounded-xl transition-all ${
                      isCalcModalOpen && activeCalcCurrency === curr.code
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                        : isAnchor
                        ? 'bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-400/40'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-300 border border-slate-800'
                    }`}
                    title={`Open Calculator for ${curr.code}`}
                  >
                    <Calculator className="w-4 h-4" />
                  </button>

                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopy(formattedVal, curr.code)}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition-colors border border-slate-800"
                    title="Copy value"
                  >
                    {copiedCode === curr.code ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  {/* Chart shortcut (Desktop only) */}
                  {!isAnchor && (
                    <button
                      onClick={() => onOpenChartForPair(baseCurrency, curr.code)}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-indigo-950 text-slate-400 hover:text-indigo-300 transition-colors hidden sm:flex border border-slate-800"
                      title={`View ${baseCurrency}/${curr.code} Chart`}
                    >
                      <TrendingUp className="w-4 h-4" />
                    </button>
                  )}

                  {/* Remove Button (Non-anchor cards only) */}
                  {!isAnchor ? (
                    <button
                      onClick={() => {
                        playRuneClick();
                        onRemoveCurrency(curr.code);
                      }}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-rose-950 text-slate-500 hover:text-rose-400 transition-colors border border-slate-800"
                      title={`Remove ${curr.code}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={onAddCurrency}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-amber-950 text-slate-400 hover:text-amber-300 transition-colors border border-slate-800 hidden sm:flex"
                      title="Add more currencies"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Subtext Footer: Rate & Info */}
              <div className="mt-1.5 pt-1 border-t border-slate-800/50 flex items-center justify-between text-[10px] font-mono text-slate-400">
                {isAnchor ? (
                  <span className="text-amber-300/80 font-medium">
                    Primary Anchor Currency (All pairs converted from here)
                  </span>
                ) : (
                  <span>
                    1 {baseCurrency} = <strong className="text-slate-200">{rateFormatted}</strong> {curr.code}
                  </span>
                )}

                <span className="text-slate-500 text-[10px]">
                  {isAnchor ? 'Tap any card to switch' : 'Tap input for calculator'}
                </span>
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
          <span>+ Summon Another Currency</span>
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
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-gradient-to-b from-slate-900 via-indigo-950/50 to-slate-950 border-2 border-amber-500/60 shadow-2xl shadow-black p-4 sm:p-5 space-y-3.5 animate-in slide-in-from-bottom-6 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl select-none">{activeCalcInfo.flag}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white font-serif">
                      {activeCalcInfo.name} ({activeCalcInfo.code})
                    </span>
                    {activeCalcCurrency === baseCurrency ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-slate-950">
                        Anchor
                      </span>
                    ) : (
                      <button
                        onClick={() => promoteToAnchor(activeCalcCurrency)}
                        className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-amber-300 border border-slate-700 transition-colors flex items-center gap-1"
                      >
                        <Anchor className="w-2.5 h-2.5" />
                        <span>Make Anchor</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Live currency math calculator & expression evaluator
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCalcModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close Calculator"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Spell Multipliers & Percentages */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap mr-1">
                Quick Spells:
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
                  {activeCalcInfo.code} Expression
                </span>
                <span className="text-xl sm:text-2xl font-bold text-amber-300 truncate block">
                  {getActiveExpression(activeCalcCurrency)}
                </span>
              </div>
              {previewActiveMathResult && (
                <div className="text-right pl-3">
                  <span className="text-[10px] text-emerald-400 block uppercase">Calculated</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-300">
                    = {previewActiveMathResult}
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
                onClick={() => handleSettleMath(activeCalcCurrency)}
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
