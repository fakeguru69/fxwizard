import React, { useState, useMemo } from 'react';
import { 
  ArrowRightLeft, 
  Copy, 
  Check, 
  RotateCcw, 
  Percent, 
  Sparkles, 
  History, 
  Sliders, 
  Equal,
  Delete,
  TrendingUp
} from 'lucide-react';
import { ExchangeRatesData } from '../types';
import { CURRENCIES, getCurrencyInfo } from '../data/currencies';
import { playRuneClick, playSpellChime } from '../services/sound';
import { evaluateMathExpression, triggerMagicSparks } from '../services/fxService';
import { CurrencyFlag } from './CurrencyFlag';

interface FxCalculatorProps {
  ratesData: ExchangeRatesData | null;
  onOpenChartForPair: (base: string, target: string) => void;
}

interface CalculationHistoryItem {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  inputExpr: string;
  evaluatedInput: number;
  rate: number;
  feePercent: number;
  result: number;
  timestamp: number;
}

export const FxCalculator: React.FC<FxCalculatorProps> = ({
  ratesData,
  onOpenChartForPair,
}) => {
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [expression, setExpression] = useState<string>('1250');
  const [feePercent, setFeePercent] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [history, setHistory] = useState<CalculationHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('fx_wizard_calc_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const fromInfo = useMemo(() => getCurrencyInfo(fromCurrency), [fromCurrency]);
  const toInfo = useMemo(() => getCurrencyInfo(toCurrency), [toCurrency]);

  // Derive cross-rate between fromCurrency and toCurrency
  const pairRate = useMemo(() => {
    if (!ratesData || !ratesData.rates) return 1.0;
    const fromRateGlobal = ratesData.rates[fromCurrency] || 1.0;
    const toRateGlobal = ratesData.rates[toCurrency] || 1.0;
    if (fromRateGlobal <= 0) return 1.0;
    return toRateGlobal / fromRateGlobal;
  }, [ratesData, fromCurrency, toCurrency]);

  // Evaluated input number
  const numericInput = useMemo(() => {
    if (!expression.trim()) return 0;
    const res = evaluateMathExpression(expression);
    return res !== null ? res : parseFloat(expression) || 0;
  }, [expression]);

  // Final conversion total taking fee/spread into account
  const effectiveRate = useMemo(() => {
    const feeMultiplier = 1 - feePercent / 100;
    return pairRate * Math.max(0, feeMultiplier);
  }, [pairRate, feePercent]);

  const convertedTotal = useMemo(() => {
    return numericInput * effectiveRate;
  }, [numericInput, effectiveRate]);

  const feeAmount = useMemo(() => {
    const rawTotal = numericInput * pairRate;
    return (rawTotal * (feePercent / 100));
  }, [numericInput, pairRate, feePercent]);

  const handleKeypadPress = (val: string) => {
    playRuneClick();
    if (val === 'C') {
      setExpression('0');
    } else if (val === 'DEL') {
      setExpression((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else if (val === '=') {
      const evaluated = evaluateMathExpression(expression);
      if (evaluated !== null) {
        setExpression(evaluated.toFixed(2));
        saveToHistory(evaluated);
      }
    } else {
      setExpression((prev) => (prev === '0' && !['+', '-', '*', '/', '.'].includes(val) ? val : prev + val));
    }
  };

  const saveToHistory = (evalInput: number) => {
    const newItem: CalculationHistoryItem = {
      id: `calc_${Date.now()}`,
      fromCurrency,
      toCurrency,
      inputExpr: expression,
      evaluatedInput: evalInput,
      rate: pairRate,
      feePercent,
      result: evalInput * effectiveRate,
      timestamp: Date.now(),
    };

    const nextHistory = [newItem, ...history.slice(0, 7)];
    setHistory(nextHistory);
    try {
      localStorage.setItem('fx_wizard_calc_history', JSON.stringify(nextHistory));
    } catch {}
  };

  const handleSwapCurrencies = () => {
    playSpellChime();
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleCopyResult = () => {
    navigator.clipboard.writeText(convertedTotal.toFixed(2));
    setCopied(true);
    playRuneClick();
    setTimeout(() => setCopied(false), 2000);
  };

  // Quick matrix amounts
  const matrixAmounts = [1, 10, 50, 100, 500, 1000, 5000];

  return (
    <div id="fx-calculator-section" className="space-y-6">
      
      {/* Title Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
        <div>
          <h2 className="text-xl font-bold text-amber-200 font-serif flex items-center gap-2">
            <span>🧙‍♂️ The Archmage's Real-Time FX Calculator</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time cross-currency arithmetic, spread slippage modifiers, and instant conversion spells
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenChartForPair(fromCurrency, toCurrency)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-indigo-500/30 text-indigo-300 text-xs hover:bg-slate-800 transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{fromCurrency}/{toCurrency} Chart</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Calculator Cauldron */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Main Calculator Screen Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-950 border border-amber-500/40 shadow-2xl shadow-amber-950/30 space-y-5">
            
            {/* Currency Selectors & Swap */}
            <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
              
              {/* From Currency */}
              <div className="sm:col-span-5 space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 block">
                  Source Currency (From)
                </label>
                <div className="relative">
                  <select
                    id="calc-from-currency"
                    value={fromCurrency}
                    onChange={(e) => {
                      playRuneClick();
                      setFromCurrency(e.target.value);
                    }}
                    className="w-full appearance-none pl-11 pr-8 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-bold text-slate-100 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-slate-950 text-slate-100">
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <CurrencyFlag currencyCode={fromCurrency} fallbackEmoji={fromInfo.flag} size="sm" />
                  </span>
                </div>
              </div>

              {/* Swap Button */}
              <div className="sm:col-span-1 flex justify-center pt-5 sm:pt-0">
                <button
                  id="calc-swap-btn"
                  onClick={handleSwapCurrencies}
                  className="p-2.5 rounded-full bg-indigo-900/80 hover:bg-amber-500 hover:text-slate-950 border border-indigo-500/40 text-indigo-200 transition-all hover:scale-110 shadow-md"
                  title="Swap Currencies"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>

              {/* To Currency */}
              <div className="sm:col-span-5 space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 block">
                  Target Currency (To)
                </label>
                <div className="relative">
                  <select
                    id="calc-to-currency"
                    value={toCurrency}
                    onChange={(e) => {
                      playRuneClick();
                      setToCurrency(e.target.value);
                    }}
                    className="w-full appearance-none pl-11 pr-8 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-bold text-slate-100 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-slate-950 text-slate-100">
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <CurrencyFlag currencyCode={toCurrency} fallbackEmoji={toInfo.flag} size="sm" />
                  </span>
                </div>
              </div>
            </div>

            {/* Formula Input Screen */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Input Expression ({fromCurrency})</span>
                <span>Evaluated: {numericInput.toLocaleString()}</span>
              </div>
              <input
                id="calc-formula-input"
                type="text"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder="Enter calculation e.g. 500 * 2 + 50"
                className="w-full bg-transparent text-2xl md:text-3xl font-mono font-bold text-amber-100 focus:outline-none placeholder-slate-700"
              />
            </div>

            {/* Alchemical Spread & Fee Modifier */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1 font-semibold">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>Exchange Spread / Bank Fee Modifier</span>
                </span>
                <span className="font-mono text-amber-300 font-bold">{feePercent.toFixed(1)}% Fee</span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={feePercent}
                  onChange={(e) => setFeePercent(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <button onClick={() => setFeePercent(0)} className="hover:text-amber-300">0% Pure Mid-Market</button>
                <button onClick={() => setFeePercent(1.5)} className="hover:text-amber-300">1.5% Standard Card</button>
                <button onClick={() => setFeePercent(3.0)} className="hover:text-amber-300">3.0% Travel Kiosk</button>
              </div>
            </div>

            {/* Main Result Showcase */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-indigo-950/50 to-slate-950 border border-amber-500/40 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-amber-400/90 font-serif uppercase tracking-wider">
                  Transmuted Output
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl md:text-4xl font-mono font-black text-amber-200 tracking-tight">
                    {convertedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-sm font-bold text-slate-300">{toCurrency}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  1 {fromCurrency} = {effectiveRate.toFixed(4)} {toCurrency} 
                  {feePercent > 0 && <span className="text-amber-400/80"> (-{feeAmount.toFixed(2)} {toCurrency} fee)</span>}
                </p>
              </div>

              <button
                onClick={handleCopyResult}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all active:scale-95 whitespace-nowrap"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-950" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Interactive Magical Keypad */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              {[
                { label: 'C', val: 'C', cls: 'bg-rose-950/50 text-rose-300 border-rose-800/40' },
                { label: '(', val: '(', cls: 'bg-slate-900 text-indigo-300 border-slate-800' },
                { label: ')', val: ')', cls: 'bg-slate-900 text-indigo-300 border-slate-800' },
                { label: '÷', val: '/', cls: 'bg-indigo-900/60 text-indigo-200 border-indigo-600/40' },

                { label: '7', val: '7', cls: 'bg-slate-900 text-slate-100 border-slate-800' },
                { label: '8', val: '8', cls: 'bg-slate-900 text-slate-100 border-slate-800' },
                { label: '9', val: '9', cls: 'bg-slate-900 text-slate-100 border-slate-800' },
                { label: '×', val: '*', cls: 'bg-indigo-900/60 text-indigo-200 border-indigo-600/40' },

                { label: '4', val: '4', cls: 'bg-slate-900 text-slate-100 border-slate-800' },
                { label: '5', val: '5', cls: 'bg-slate-900 text-slate-100 border-slate-800' },
                { label: '6', val: '6', cls: 'bg-slate-900 text-slate-100 border-slate-800' },
                { label: '-', val: '-', cls: 'bg-indigo-900/60 text-indigo-200 border-indigo-600/40' },

                { label: '1', val: '1', cls: 'bg-slate-900 text-slate-100 border-slate-800' },
                { label: '2', val: '2', cls: 'bg-slate-900 text-slate-100 border-slate-800' },
                { label: '3', val: '3', cls: 'bg-slate-900 text-slate-100 border-slate-800' },
                { label: '+', val: '+', cls: 'bg-indigo-900/60 text-indigo-200 border-indigo-600/40' },

                { label: '0', val: '0', cls: 'bg-slate-900 text-slate-100 border-slate-800' },
                { label: '.', val: '.', cls: 'bg-slate-900 text-slate-100 border-slate-800' },
                { label: '⌫', val: 'DEL', cls: 'bg-slate-900 text-slate-300 border-slate-800' },
                { label: '=', val: '=', cls: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black border-amber-400' },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={() => handleKeypadPress(btn.val)}
                  className={`py-3 rounded-xl border text-base font-bold font-mono transition-all active:scale-95 shadow-sm ${btn.cls}`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Matrix & Calculation History */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Quick Preset Matrix Table */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider font-bold text-amber-300 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Conversion Matrix ({fromCurrency} → {toCurrency})</span>
              </h3>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              {matrixAmounts.map((amt) => {
                const converted = amt * effectiveRate;
                return (
                  <div
                    key={amt}
                    onClick={() => {
                      playRuneClick();
                      setExpression(String(amt));
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800/80 hover:border-amber-500/40 cursor-pointer transition-colors"
                  >
                    <span className="text-slate-300 font-bold">
                      {amt.toLocaleString()} {fromCurrency}
                    </span>
                    <span className="text-amber-300 font-bold">
                      {converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toCurrency}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Calculation History */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-300 font-mono flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-indigo-400" />
                <span>Grimoire History Log</span>
              </h3>
              {history.length > 0 && (
                <button
                  onClick={() => {
                    setHistory([]);
                    localStorage.removeItem('fx_wizard_calc_history');
                  }}
                  className="text-[11px] text-slate-500 hover:text-rose-400"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    playRuneClick();
                    setFromCurrency(item.fromCurrency);
                    setToCurrency(item.toCurrency);
                    setExpression(item.inputExpr);
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/70 hover:border-indigo-500/40 cursor-pointer text-xs space-y-1 transition-colors"
                >
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-mono">{item.inputExpr} {item.fromCurrency}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono font-bold text-amber-300">
                    <span>= {item.result.toFixed(2)} {item.toCurrency}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      @ {item.rate.toFixed(4)}
                    </span>
                  </div>
                </div>
              ))}

              {history.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">
                  No calculations recorded yet. Press '=' to record a formula.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
