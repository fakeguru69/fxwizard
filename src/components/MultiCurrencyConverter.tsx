import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Percent,
  Sliders
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
  // Base currency amount input string
  const [baseAmountStr, setBaseAmountStr] = useState<string>('1.00');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [guruProphecyIndex, setGuruProphecyIndex] = useState<number>(0);
  
  // Interactive Calculator State
  const [showKeypad, setShowKeypad] = useState<boolean>(false);
  const [activeKeypadTarget, setActiveKeypadTarget] = useState<string>(baseCurrency);
  const [targetInputExprs, setTargetInputExprs] = useState<Record<string, string>>({});

  const anchorInputRef = useRef<HTMLInputElement>(null);

  const baseInfo = useMemo(() => getCurrencyInfo(baseCurrency), [baseCurrency]);

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

  // Build sorted list of target cards
  const targetCards = useMemo(() => {
    if (!ratesData || !ratesData.rates) return [];

    const baseRate = ratesData.rates[baseCurrency] || 1.0;

    return activeCurrencies
      .filter((code) => code !== baseCurrency)
      .map((code) => {
        const info = getCurrencyInfo(code);
        const targetRateGlobal = ratesData.rates[code] || 0;
        const rateAgainstBase = baseRate > 0 ? targetRateGlobal / baseRate : 0;
        const convertedValue = numericBaseAmount * rateAgainstBase;
        const invertedRate = rateAgainstBase > 0 ? 1 / rateAgainstBase : 0;

        return {
          ...info,
          rate: rateAgainstBase,
          invertedRate,
          convertedValue,
        };
      });
  }, [activeCurrencies, baseCurrency, ratesData, numericBaseAmount]);

  // Get active expression string for the currently targeted currency
  const getActiveExpression = (): string => {
    if (activeKeypadTarget === baseCurrency) {
      return baseAmountStr;
    }
    if (targetInputExprs[activeKeypadTarget] !== undefined) {
      return targetInputExprs[activeKeypadTarget];
    }
    const card = targetCards.find((c) => c.code === activeKeypadTarget);
    return card ? formatAmount(card.convertedValue).replace(/,/g, '') : '0';
  };

  // Real-time active expression result preview
  const previewActiveMathResult = useMemo(() => {
    const expr = getActiveExpression();
    if (!hasMathExpression(expr)) return null;
    const evaluated = evaluateMathExpression(expr);
    if (evaluated !== null && !isNaN(evaluated)) {
      return evaluated < 0.01 
        ? evaluated.toFixed(4) 
        : evaluated.toLocaleString(undefined, { maximumFractionDigits: 4 });
    }
    return null;
  }, [baseAmountStr, targetInputExprs, activeKeypadTarget, targetCards]);

  // Settle expression for the active currency
  const handleSettleMath = (targetCode = activeKeypadTarget) => {
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
      const currentExpr = targetInputExprs[targetCode];
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
          // Clear custom input so it falls back to sync
          setTargetInputExprs((prev) => {
            const next = { ...prev };
            delete next[targetCode];
            return next;
          });
        }
      }
    }
  };

  // Handle direct input on any currency card (bidirectional calculation)
  const handleCardInputChange = (targetCode: string, inputVal: string) => {
    setActiveKeypadTarget(targetCode);
    setShowKeypad(true);

    if (targetCode === baseCurrency) {
      setBaseAmountStr(inputVal);
      return;
    }

    setTargetInputExprs((prev) => ({ ...prev, [targetCode]: inputVal }));

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

  // Keypad button click handler for active target
  const handleKeypadPress = (btn: string) => {
    playRuneClick();
    const currentVal = getActiveExpression();

    if (btn === 'CLEAR') {
      if (activeKeypadTarget === baseCurrency) {
        setBaseAmountStr('0');
      } else {
        handleCardInputChange(activeKeypadTarget, '0');
      }
      return;
    }

    if (btn === 'BACKSPACE') {
      const nextVal = currentVal.length > 1 ? currentVal.slice(0, -1) : '0';
      if (activeKeypadTarget === baseCurrency) {
        setBaseAmountStr(nextVal);
      } else {
        handleCardInputChange(activeKeypadTarget, nextVal);
      }
      return;
    }

    if (btn === '=') {
      handleSettleMath(activeKeypadTarget);
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

    if (activeKeypadTarget === baseCurrency) {
      setBaseAmountStr(nextVal);
    } else {
      handleCardInputChange(activeKeypadTarget, nextVal);
    }
  };

  // Quick percentage or multiplier modifier
  const handleQuickModifier = (modifier: string) => {
    playRuneClick();
    const currentVal = getActiveExpression();
    let nextVal = currentVal;

    if (modifier === '+10') nextVal = `${currentVal} + 10`;
    else if (modifier === '+50') nextVal = `${currentVal} + 50`;
    else if (modifier === '+100') nextVal = `${currentVal} + 100`;
    else if (modifier === '+500') nextVal = `${currentVal} + 500`;
    else if (modifier === '+5%') nextVal = `${currentVal} + 5%`;
    else if (modifier === '+10%') nextVal = `${currentVal} + 10%`;
    else if (modifier === '*2') nextVal = `${currentVal} * 2`;
    else if (modifier === '/2') nextVal = `${currentVal} / 2`;

    if (activeKeypadTarget === baseCurrency) {
      setBaseAmountStr(nextVal);
    } else {
      handleCardInputChange(activeKeypadTarget, nextVal);
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

  const promoteToAnchor = (code: string) => {
    playSpellChime();
    triggerMagicSparks();
    setActiveKeypadTarget(code);
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

  return (
    <div id="multi-currency-converter" className="max-w-2xl mx-auto space-y-3.5 sm:space-y-4">
      
      {/* Streamlined Quick Controls Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <div className="flex items-center gap-1.5 flex-nowrap">
          <button
            onClick={() => handleApplyPresetPack(['USD', 'EUR', 'SGD', 'MYR'])}
            className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 whitespace-nowrap text-xs font-semibold active:scale-95 transition-all"
          >
            ✨ 4 Pairs (USD/EUR/SGD/MYR)
          </button>
          <button
            onClick={() => handleApplyPresetPack(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'])}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap text-xs active:scale-95 transition-all"
          >
            👑 Majors
          </button>
          <button
            onClick={() => handleApplyPresetPack(['USD', 'SGD', 'MYR', 'THB', 'IDR', 'PHP', 'VND'])}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap text-xs active:scale-95 transition-all"
          >
            🌴 ASEAN
          </button>
          <button
            onClick={() => handleApplyPresetPack(['EUR', 'USD', 'GBP', 'CHF', 'SEK', 'NOK'])}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap text-xs active:scale-95 transition-all"
          >
            🏰 Europe
          </button>
        </div>

        {/* Live Status Tag */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono flex-shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${ratesData?.isOffline ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
          <span>{ratesData?.isOffline ? 'cached' : 'live'}</span>
        </div>
      </div>

      {/* CURRENCY CONVERSION STACK */}
      <div className="space-y-2.5">
        
        {/* ========================================================================= */}
        {/* 1. TOP ANCHOR CARD */}
        {/* ========================================================================= */}
        <div 
          id={`currency-card-${baseCurrency}`}
          className={`relative rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border-2 ${
            activeKeypadTarget === baseCurrency 
              ? 'border-amber-400 shadow-xl shadow-amber-950/30 ring-2 ring-amber-400/20' 
              : 'border-amber-400/80 shadow-lg shadow-amber-950/20'
          } p-3.5 sm:p-4 transition-all`}
        >
          <div className="flex items-center justify-between gap-3">
            
            {/* Left: Flag, Code & Name */}
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl sm:text-3xl select-none flex-shrink-0">
                {baseInfo.flag}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold text-amber-200 font-mono tracking-tight">
                    {baseInfo.code}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 uppercase font-mono">
                    Anchor
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate max-w-[110px] sm:max-w-[150px]">
                  {baseInfo.name}
                </p>
              </div>
            </div>

            {/* Right: Editable Amount Input & Calculator Button */}
            <div className="flex items-center gap-1.5 flex-1 justify-end">
              <div className="relative max-w-[170px] sm:max-w-[210px] w-full">
                <input
                  ref={anchorInputRef}
                  id="anchor-amount-input"
                  type="text"
                  inputMode="text"
                  value={baseAmountStr}
                  onClick={() => {
                    setActiveKeypadTarget(baseCurrency);
                    setShowKeypad(true);
                  }}
                  onFocus={() => {
                    setActiveKeypadTarget(baseCurrency);
                    setShowKeypad(true);
                  }}
                  onChange={(e) => {
                    setActiveKeypadTarget(baseCurrency);
                    setBaseAmountStr(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSettleMath(baseCurrency);
                    }
                  }}
                  placeholder="1.00"
                  className={`w-full text-right px-2.5 py-1.5 bg-slate-950 border ${
                    activeKeypadTarget === baseCurrency
                      ? 'border-amber-400 text-amber-300 ring-1 ring-amber-400/40'
                      : 'border-amber-400/60 text-amber-300'
                  } rounded-xl text-lg sm:text-xl font-mono font-bold placeholder-slate-600 focus:outline-none transition-all shadow-inner`}
                />

                {/* Math Live Evaluator Preview Badge for Anchor */}
                {activeKeypadTarget === baseCurrency && previewActiveMathResult && (
                  <button
                    onClick={() => handleSettleMath(baseCurrency)}
                    className="absolute -bottom-5 right-1 flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-slate-900 px-2 py-0.5 rounded-lg border border-emerald-500/40 shadow hover:bg-slate-800 z-10 animate-in fade-in duration-150"
                    title="Click to calculate expression"
                  >
                    <span>= {previewActiveMathResult}</span>
                    <Equal className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>

              {/* Quick Calculator Keypad Toggle */}
              <button
                onClick={() => {
                  playRuneClick();
                  setActiveKeypadTarget(baseCurrency);
                  setShowKeypad(!showKeypad || activeKeypadTarget !== baseCurrency);
                }}
                className={`p-2 rounded-xl transition-all ${
                  showKeypad && activeKeypadTarget === baseCurrency
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 scale-105' 
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                }`}
                title="Calculator Keypad"
              >
                <Calculator className="w-4 h-4" />
              </button>

              {/* Chart Button */}
              <button
                onClick={() => onOpenChartForPair(baseCurrency, targetCards[0]?.code || 'EUR')}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                title="View Chart"
              >
                <TrendingUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. SUBSEQUENT TARGET CARDS */}
        {/* ========================================================================= */}
        {targetCards.map((curr, idx) => {
          const isTargetActiveInCalc = activeKeypadTarget === curr.code;
          const formattedVal = formatAmount(curr.convertedValue);
          const currentDisplayVal = targetInputExprs[curr.code] !== undefined
            ? targetInputExprs[curr.code]
            : formattedVal;
          const rateFormatted = curr.rate < 0.001 ? curr.rate.toFixed(6) : curr.rate.toFixed(4);

          return (
            <div
              key={curr.code}
              id={`currency-card-${curr.code}`}
              className={`group relative rounded-2xl bg-slate-900/90 border ${
                isTargetActiveInCalc 
                  ? 'border-amber-400 shadow-xl shadow-amber-950/20 ring-1 ring-amber-400/20' 
                  : 'border-slate-800 hover:border-slate-700 shadow-md'
              } p-3 sm:p-3.5 transition-all`}
            >
              <div className="flex items-center justify-between gap-2">
                
                {/* Left: Reorder arrows + Flag + Code & Name */}
                <div className="flex items-center gap-1.5 min-w-0">
                  {/* Reorder Arrows */}
                  <div className="flex flex-col items-center justify-center -space-y-1">
                    <button
                      onClick={() => moveCurrency(idx + 1, 'up')}
                      className="p-0.5 text-slate-500 hover:text-amber-300 transition-colors"
                      title="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveCurrency(idx + 1, 'down')}
                      className="p-0.5 text-slate-500 hover:text-amber-300 transition-colors"
                      title="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Flag & Promotable Code */}
                  <div 
                    onClick={() => promoteToAnchor(curr.code)}
                    className="flex items-center gap-2 cursor-pointer min-w-0 group/info"
                    title={`Click to set ${curr.code} as Anchor`}
                  >
                    <span className="text-2xl sm:text-3xl select-none flex-shrink-0">
                      {curr.flag}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-base font-bold text-slate-100 group-hover/info:text-amber-300 font-mono transition-colors">
                          {curr.code}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {curr.symbol}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-[85px] sm:max-w-[130px]">
                        {curr.name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Live Value Box & Actions */}
                <div className="flex items-center gap-1.5 flex-1 justify-end">
                  
                  {/* Interactive Editable Amount Box with Calculator Trigger */}
                  <div className="relative max-w-[145px] sm:max-w-[185px] w-full">
                    <input
                      type="text"
                      inputMode="text"
                      value={currentDisplayVal}
                      onClick={() => {
                        setActiveKeypadTarget(curr.code);
                        setShowKeypad(true);
                      }}
                      onFocus={() => {
                        setActiveKeypadTarget(curr.code);
                        setShowKeypad(true);
                      }}
                      onChange={(e) => handleCardInputChange(curr.code, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSettleMath(curr.code);
                        }
                      }}
                      className={`w-full text-right px-2.5 py-1.5 bg-slate-950 border ${
                        isTargetActiveInCalc
                          ? 'border-amber-400 text-amber-200 ring-1 ring-amber-400/30'
                          : 'border-slate-800 hover:border-slate-700 text-amber-200'
                      } rounded-xl text-base sm:text-lg font-mono font-bold placeholder-slate-600 focus:outline-none transition-all shadow-inner`}
                    />

                    {/* Math Live Evaluator Preview Badge for Target Card */}
                    {isTargetActiveInCalc && previewActiveMathResult && (
                      <button
                        onClick={() => handleSettleMath(curr.code)}
                        className="absolute -bottom-5 right-1 flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-slate-900 px-2 py-0.5 rounded-lg border border-emerald-500/40 shadow hover:bg-slate-800 z-10 animate-in fade-in duration-150"
                        title="Click to calculate expression"
                      >
                        <span>= {previewActiveMathResult}</span>
                        <Equal className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  {/* Calculator Button on each card */}
                  <button
                    onClick={() => {
                      playRuneClick();
                      if (activeKeypadTarget === curr.code && showKeypad) {
                        setShowKeypad(false);
                      } else {
                        setActiveKeypadTarget(curr.code);
                        setShowKeypad(true);
                      }
                    }}
                    className={`p-2 rounded-xl transition-all ${
                      isTargetActiveInCalc && showKeypad
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-300'
                    }`}
                    title={`Calculate ${curr.code}`}
                  >
                    <Calculator className="w-4 h-4" />
                  </button>

                  {/* Quick Copy Button */}
                  <button
                    onClick={() => handleCopy(formattedVal, curr.code)}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition-colors"
                    title="Copy value"
                  >
                    {copiedCode === curr.code ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  {/* Chart shortcut (Desktop only) */}
                  <button
                    onClick={() => onOpenChartForPair(baseCurrency, curr.code)}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-indigo-950 text-slate-400 hover:text-indigo-300 transition-colors hidden sm:flex"
                    title={`View ${baseCurrency}/${curr.code} Chart`}
                  >
                    <TrendingUp className="w-4 h-4" />
                  </button>

                  {/* Remove Button (✕) */}
                  <button
                    onClick={() => {
                      playRuneClick();
                      onRemoveCurrency(curr.code);
                    }}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-rose-950 text-slate-500 hover:text-rose-400 transition-colors"
                    title={`Remove ${curr.code}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Clean Rate Subtext */}
              <div className="mt-1.5 pt-1 border-t border-slate-800/40 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>
                  1 {baseCurrency} = <strong className="text-slate-300">{rateFormatted}</strong> {curr.code}
                </span>
                <span className="text-slate-500 text-[10px]">
                  Tap currency to make Anchor
                </span>
              </div>
            </div>
          );
        })}

        {/* ========================================================================= */}
        {/* 3. DOCKED INTERACTIVE CALCULATOR PANEL (Activates on Click/Input) */}
        {/* ========================================================================= */}
        {showKeypad && (
          <div 
            id="interactive-currency-calculator"
            className="p-4 rounded-3xl bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-950 border-2 border-amber-500/50 shadow-2xl shadow-black/60 animate-in fade-in zoom-in-95 duration-200 space-y-3"
          >
            {/* Header: Current Active Currency Info & Close */}
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  <Calculator className="w-4 h-4" />
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-100 font-serif">
                      Alchemical Math Cauldron
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-slate-950">
                      {activeKeypadTarget}
                    </span>
                    {activeKeypadTarget === baseCurrency && (
                      <span className="text-[9px] text-amber-300 font-mono">
                        (Anchor)
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Input numbers, arithmetic (+, -, ×, ÷), or % modifiers to convert live
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleSettleMath(activeKeypadTarget)}
                  className="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow transition-colors flex items-center gap-1"
                >
                  <Equal className="w-3.5 h-3.5" />
                  <span>Calculate</span>
                </button>
                <button
                  onClick={() => setShowKeypad(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
                  title="Close Calculator"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Multiplier & Percentage Spells */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap mr-1">
                Quick Spells:
              </span>
              {['+10', '+50', '+100', '+500', '+5%', '+10%', '*2', '/2'].map((mod) => (
                <button
                  key={mod}
                  onClick={() => handleQuickModifier(mod)}
                  className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-indigo-900/40 text-amber-300 hover:text-amber-200 border border-slate-800 hover:border-amber-500/40 font-mono text-xs font-semibold active:scale-95 transition-all whitespace-nowrap"
                >
                  {mod === '*2' ? '×2' : mod === '/2' ? '÷2' : mod}
                </button>
              ))}
            </div>

            {/* Current Expression Display */}
            <div className="px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-500 block">Current Expression ({activeKeypadTarget})</span>
                <span className="text-base sm:text-lg font-bold text-amber-200 truncate block">
                  {getActiveExpression()}
                </span>
              </div>
              {previewActiveMathResult && (
                <div className="text-right pl-2">
                  <span className="text-[10px] text-emerald-400 block">Live Result</span>
                  <span className="text-sm sm:text-base font-bold text-emerald-300">
                    = {previewActiveMathResult}
                  </span>
                </div>
              )}
            </div>

            {/* Full Alchemical Keypad Grid */}
            <div className="grid grid-cols-4 gap-1.5 font-mono text-sm sm:text-base">
              <button 
                onClick={() => handleKeypadPress('CLEAR')} 
                className="py-2.5 sm:py-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 font-bold border border-rose-500/30 active:scale-95 transition-all"
              >
                C
              </button>
              <button 
                onClick={() => handleKeypadPress('(')} 
                className="py-2.5 sm:py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 active:scale-95 transition-all"
              >
                (
              </button>
              <button 
                onClick={() => handleKeypadPress(')')} 
                className="py-2.5 sm:py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 active:scale-95 transition-all"
              >
                )
              </button>
              <button 
                onClick={() => handleKeypadPress('/')} 
                className="py-2.5 sm:py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 active:scale-95 transition-all"
              >
                ÷
              </button>

              <button 
                onClick={() => handleKeypadPress('7')} 
                className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 active:scale-95 transition-all"
              >
                7
              </button>
              <button 
                onClick={() => handleKeypadPress('8')} 
                className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 active:scale-95 transition-all"
              >
                8
              </button>
              <button 
                onClick={() => handleKeypadPress('9')} 
                className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 active:scale-95 transition-all"
              >
                9
              </button>
              <button 
                onClick={() => handleKeypadPress('*')} 
                className="py-2.5 sm:py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 active:scale-95 transition-all"
              >
                ×
              </button>

              <button 
                onClick={() => handleKeypadPress('4')} 
                className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 active:scale-95 transition-all"
              >
                4
              </button>
              <button 
                onClick={() => handleKeypadPress('5')} 
                className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 active:scale-95 transition-all"
              >
                5
              </button>
              <button 
                onClick={() => handleKeypadPress('6')} 
                className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 active:scale-95 transition-all"
              >
                6
              </button>
              <button 
                onClick={() => handleKeypadPress('-')} 
                className="py-2.5 sm:py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 active:scale-95 transition-all"
              >
                −
              </button>

              <button 
                onClick={() => handleKeypadPress('1')} 
                className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 active:scale-95 transition-all"
              >
                1
              </button>
              <button 
                onClick={() => handleKeypadPress('2')} 
                className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 active:scale-95 transition-all"
              >
                2
              </button>
              <button 
                onClick={() => handleKeypadPress('3')} 
                className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 active:scale-95 transition-all"
              >
                3
              </button>
              <button 
                onClick={() => handleKeypadPress('+')} 
                className="py-2.5 sm:py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 active:scale-95 transition-all"
              >
                +
              </button>

              <button 
                onClick={() => handleKeypadPress('0')} 
                className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 active:scale-95 transition-all"
              >
                0
              </button>
              <button 
                onClick={() => handleKeypadPress('.')} 
                className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 active:scale-95 transition-all"
              >
                .
              </button>
              <button 
                onClick={() => handleKeypadPress('BACKSPACE')} 
                className="py-2.5 sm:py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center active:scale-95 transition-all"
                title="Delete"
              >
                <Delete className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleKeypadPress('=')} 
                className="py-2.5 sm:py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black border border-amber-300 shadow-md active:scale-95 transition-all"
              >
                =
              </button>
            </div>
          </div>
        )}

        {/* 4. + SUMMON ANOTHER CURRENCY BUTTON */}
        <button
          id="summon-currency-list-btn"
          onClick={onAddCurrency}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-dashed border-slate-800 hover:border-amber-500/50 bg-slate-950/40 hover:bg-indigo-950/20 text-slate-400 hover:text-amber-300 font-bold font-serif text-xs sm:text-sm transition-all duration-200 active:scale-98 group"
        >
          <Plus className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
          <span>+ Summon Another Currency</span>
        </button>
      </div>

      {/* 5. COMPACT PROPHETIC GURU BANNER */}
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

