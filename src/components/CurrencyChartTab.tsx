import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft, 
  Sparkles, 
  Calendar, 
  Activity, 
  BarChart2, 
  LineChart, 
  Flame, 
  Bell, 
  Compass, 
  Zap,
  Info
} from 'lucide-react';
import { ExchangeRatesData } from '../types';
import { getCurrencyInfo, CURRENCIES } from '../data/currencies';
import { playRuneClick, playSpellChime } from '../services/sound';
import { triggerMagicSparks } from '../services/fxService';

interface CurrencyChartTabProps {
  ratesData: ExchangeRatesData | null;
  baseCurrency: string;
  onChangeBaseCurrency: (code: string) => void;
  onOpenAlertForPair: (targetCurrency: string, currentRate: number) => void;
  onOpenOracle: () => void;
  onSwitchToConverter: () => void;
  initialTargetCurrency?: string;
}

interface HistoricalPoint {
  date: string;
  timeLabel: string;
  rate: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export const CurrencyChartTab: React.FC<CurrencyChartTabProps> = ({
  ratesData,
  baseCurrency,
  onChangeBaseCurrency,
  onOpenAlertForPair,
  onOpenOracle,
  onSwitchToConverter,
  initialTargetCurrency = 'EUR',
}) => {
  const [targetCurrency, setTargetCurrency] = useState<string>(
    initialTargetCurrency === baseCurrency ? (baseCurrency === 'USD' ? 'EUR' : 'USD') : initialTargetCurrency
  );
  const [timeframe, setTimeframe] = useState<'24H' | '7D' | '1M' | '3M' | '1Y'>('1M');
  const [chartType, setChartType] = useState<'line' | 'candles' | 'area'>('line');
  const [hoveredPoint, setHoveredPoint] = useState<HistoricalPoint | null>(null);

  const baseInfo = useMemo(() => getCurrencyInfo(baseCurrency), [baseCurrency]);
  const targetInfo = useMemo(() => getCurrencyInfo(targetCurrency), [targetCurrency]);

  // Calculate live current rate
  const currentRate = useMemo(() => {
    if (!ratesData || !ratesData.rates) return 1.0;
    const b = ratesData.rates[baseCurrency] || 1.0;
    const t = ratesData.rates[targetCurrency] || 1.0;
    return b > 0 ? t / b : 1.0;
  }, [ratesData, baseCurrency, targetCurrency]);

  // Swap base and target
  const handleSwap = () => {
    playSpellChime();
    triggerMagicSparks();
    const oldBase = baseCurrency;
    onChangeBaseCurrency(targetCurrency);
    setTargetCurrency(oldBase);
  };

  // Generate historical simulation data
  const dataPoints = useMemo<HistoricalPoint[]>(() => {
    const pointsCount = timeframe === '24H' ? 24 : timeframe === '7D' ? 14 : timeframe === '1M' ? 30 : timeframe === '3M' ? 45 : 60;
    const rateBase = currentRate > 0 ? currentRate : 1.0;
    
    // Seed from string values
    const baseStr = baseCurrency || 'USD';
    const targetStr = targetCurrency || 'EUR';
    const seed = (baseStr.charCodeAt(0) * 19 + targetStr.charCodeAt(0) * 37) % 500;
    const result: HistoricalPoint[] = [];
    const now = new Date();

    const totalMs = timeframe === '24H' 
      ? 24 * 3600 * 1000 
      : timeframe === '7D' 
      ? 7 * 86400 * 1000 
      : timeframe === '1M' 
      ? 30 * 86400 * 1000 
      : timeframe === '3M' 
      ? 90 * 86400 * 1000 
      : 365 * 86400 * 1000;

    const intervalMs = totalMs / (pointsCount - 1);

    for (let i = pointsCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * intervalMs);
      const progress = (pointsCount - 1 - i) / (pointsCount - 1);
      
      // Arcane wave synthesis
      const wave1 = Math.sin((progress * 12) + seed * 0.1) * 0.015;
      const wave2 = Math.cos((progress * 5) + seed * 0.2) * 0.008;
      const trend = (progress - 0.5) * 0.02;

      const simulatedClose = i === 0 ? rateBase : rateBase * (1 + wave1 + wave2 + trend);
      const simulatedOpen = simulatedClose * (1 + (Math.sin(i * 3 + seed) * 0.004));
      const simulatedHigh = Math.max(simulatedOpen, simulatedClose) * (1 + Math.abs(Math.sin(i * 7)) * 0.005);
      const simulatedLow = Math.min(simulatedOpen, simulatedClose) * (1 - Math.abs(Math.cos(i * 5)) * 0.005);

      const dateStr = timeframe === '24H' 
        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      result.push({
        date: dateStr,
        timeLabel: d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        rate: simulatedClose,
        open: simulatedOpen,
        high: simulatedHigh,
        low: simulatedLow,
        close: simulatedClose,
      });
    }

    return result;
  }, [currentRate, baseCurrency, targetCurrency, timeframe]);

  // Statistical calculations
  const stats = useMemo(() => {
    if (dataPoints.length === 0) {
      return { high: currentRate, low: currentRate, avg: currentRate, changePct: 0, isPositive: true, volatility: '1.2%' };
    }
    const closes = dataPoints.map((p) => p.close);
    const highs = dataPoints.map((p) => p.high);
    const lows = dataPoints.map((p) => p.low);

    const high = Math.max(...highs);
    const low = Math.min(...lows);
    const avg = closes.reduce((a, b) => a + b, 0) / closes.length;
    const first = dataPoints[0].open;
    const last = dataPoints[dataPoints.length - 1].close;
    const changePct = first > 0 ? ((last - first) / first) * 100 : 0;
    const volatilityVal = high > low && avg > 0 ? (((high - low) / avg) * 100).toFixed(2) + '%' : '0.8%';

    return {
      high,
      low,
      avg,
      changePct,
      isPositive: changePct >= 0,
      volatility: volatilityVal,
    };
  }, [dataPoints, currentRate]);

  // SVG Chart Geometry
  const svgWidth = 800;
  const svgHeight = 320;
  const pad = { top: 25, right: 30, bottom: 40, left: 65 };
  const plotWidth = svgWidth - pad.left - pad.right;
  const plotHeight = svgHeight - pad.top - pad.bottom;

  const minVal = stats.low * 0.997;
  const maxVal = stats.high * 1.003;
  const valRange = maxVal - minVal || 1;

  const coords = useMemo(() => {
    return dataPoints.map((pt, idx) => {
      const x = pad.left + (idx / (dataPoints.length - 1)) * plotWidth;
      const y = pad.top + plotHeight - ((pt.close - minVal) / valRange) * plotHeight;
      const yHigh = pad.top + plotHeight - ((pt.high - minVal) / valRange) * plotHeight;
      const yLow = pad.top + plotHeight - ((pt.low - minVal) / valRange) * plotHeight;
      const yOpen = pad.top + plotHeight - ((pt.open - minVal) / valRange) * plotHeight;
      return { ...pt, x, y, yHigh, yLow, yOpen };
    });
  }, [dataPoints, minVal, valRange, plotWidth, plotHeight]);

  const linePath = useMemo(() => {
    return coords.reduce((acc, p, idx) => (idx === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`), '');
  }, [coords]);

  const areaPath = useMemo(() => {
    if (!linePath) return '';
    return `${linePath} L ${pad.left + plotWidth},${pad.top + plotHeight} L ${pad.left},${pad.top + plotHeight} Z`;
  }, [linePath, plotWidth, plotHeight]);

  // Merlin Technical & Prophetic Wisdom for this Pair
  const pairWisdom = useMemo(() => {
    const isBull = stats.isPositive;
    const pairKey = `${baseCurrency}/${targetCurrency}`;
    const prophecies = [
      `The ${baseInfo.alchemyTitle || baseCurrency} holds sacred dominance against ${targetInfo.alchemyTitle || targetCurrency}. Celestial momentum signals ${isBull ? 'expansion into higher astral realms' : 'an alchemical accumulation zone'}.`,
      `Alchemical moving averages reveal harmonious resonance. Transmutation equilibrium currently pivots around ${stats.avg.toFixed(4)}.`,
      `The Oracle observes subtle planetary carry-trade currents. Volatility index is calibrated at ${stats.volatility}.`,
    ];
    return prophecies[(pairKey.length + timeframe.length) % prophecies.length];
  }, [baseCurrency, targetCurrency, baseInfo, targetInfo, stats, timeframe]);

  return (
    <div id="currency-chart-tab" className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner & Pair Selector */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-950 border border-amber-500/30 shadow-2xl p-6 md:p-8">
        
        {/* Glow backgrounds */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">📈</span>
                <h2 className="text-xl font-bold text-amber-200 font-serif">
                  Arcane Currency Chart & Technical Oracle
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Analyze live exchange rate constellations, historical trends, and price trajectories
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                id="chart-set-alert-btn"
                onClick={() => {
                  playSpellChime();
                  onOpenAlertForPair(targetCurrency, currentRate);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-950 border border-slate-700 hover:border-amber-500/40 text-amber-300 text-xs font-semibold transition-all active:scale-95"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Set Alert</span>
              </button>

              <button
                id="chart-oracle-btn"
                onClick={onOpenOracle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-400/40 text-indigo-200 text-xs font-semibold transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                <span>Divinate Pair</span>
              </button>
            </div>
          </div>

          {/* Interactive Pair Selector Control Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Base Currency Dropdown */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Anchor Currency (Base)
              </label>
              <div className="relative">
                <select
                  value={baseCurrency}
                  onChange={(e) => {
                    playRuneClick();
                    onChangeBaseCurrency(e.target.value);
                  }}
                  className="w-full appearance-none pl-12 pr-10 py-3 bg-slate-950 border-2 border-slate-700 hover:border-amber-500/50 rounded-2xl text-sm font-bold text-slate-100 focus:outline-none focus:border-amber-400 transition-all cursor-pointer"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-slate-950 text-slate-100">
                      {c.flag} {c.code} - {c.name}
                    </option>
                  ))}
                </select>
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-2xl pointer-events-none">
                  {baseInfo.flag}
                </span>
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
                  ▼
                </span>
              </div>
            </div>

            {/* Swap Button */}
            <div className="md:col-span-1 flex justify-center pt-4 md:pt-0">
              <button
                id="chart-swap-pair-btn"
                onClick={handleSwap}
                className="p-3 rounded-2xl bg-indigo-900/60 hover:bg-amber-600 hover:text-slate-950 border border-indigo-400/40 text-indigo-200 transition-all hover:scale-110 shadow-lg"
                title="Swap Base & Target Currencies"
              >
                <ArrowRightLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Target Currency Dropdown */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Target Quote Currency
              </label>
              <div className="relative">
                <select
                  value={targetCurrency}
                  onChange={(e) => {
                    playRuneClick();
                    setTargetCurrency(e.target.value);
                  }}
                  className="w-full appearance-none pl-12 pr-10 py-3 bg-slate-950 border-2 border-slate-700 hover:border-amber-500/50 rounded-2xl text-sm font-bold text-slate-100 focus:outline-none focus:border-amber-400 transition-all cursor-pointer"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-slate-950 text-slate-100">
                      {c.flag} {c.code} - {c.name}
                    </option>
                  ))}
                </select>
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-2xl pointer-events-none">
                  {targetInfo.flag}
                </span>
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
                  ▼
                </span>
              </div>
            </div>

            {/* Live Spot Rate Hero Display */}
            <div className="md:col-span-3 p-3.5 rounded-2xl bg-slate-950/90 border border-amber-500/40 text-center md:text-right">
              <span className="text-[11px] text-slate-400 block font-mono">Spot Alchemy Rate</span>
              <div className="text-2xl font-mono font-bold text-amber-300 tracking-tight">
                {currentRate < 0.001 ? currentRate.toFixed(6) : currentRate.toFixed(4)}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                1 {baseCurrency} = {targetCurrency}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Stage Container */}
      <div className="p-5 md:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
        
        {/* Controls Toolbar: Timeframe & Chart Style */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          
          {/* Rate Change Badge */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold font-mono ${
              stats.isPositive
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
            }`}>
              {stats.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{stats.isPositive ? `+${stats.changePct.toFixed(2)}%` : `${stats.changePct.toFixed(2)}%`}</span>
            </div>

            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              Period Trend ({timeframe})
            </span>
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
              {(['24H', '7D', '1M', '3M', '1Y'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => {
                    playRuneClick();
                    setTimeframe(tf);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    timeframe === tf
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Chart Style Toggle */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                onClick={() => setChartType('line')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  chartType === 'line' ? 'bg-indigo-900 text-indigo-200' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Glowing Line Chart"
              >
                <LineChart className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartType('candles')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  chartType === 'candles' ? 'bg-indigo-900 text-indigo-200' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Arcane Candlesticks"
              >
                <BarChart2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* SVG Interactive Canvas */}
        <div className="relative p-2 md:p-4 rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden">
          
          {/* Active Hover Inspection Badge */}
          {hoveredPoint && (
            <div className="absolute top-4 left-6 z-20 p-3 rounded-2xl bg-slate-900/95 border border-amber-500/60 shadow-xl backdrop-blur-md text-xs font-mono animate-in fade-in duration-150">
              <div className="text-slate-400 font-sans">{hoveredPoint.timeLabel}</div>
              <div className="text-amber-300 font-bold text-base mt-0.5">
                1 {baseCurrency} = {hoveredPoint.rate < 0.001 ? hoveredPoint.rate.toFixed(6) : hoveredPoint.rate.toFixed(4)} {targetCurrency}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                <span>O: {hoveredPoint.open.toFixed(4)}</span>
                <span>H: {hoveredPoint.high.toFixed(4)}</span>
                <span>L: {hoveredPoint.low.toFixed(4)}</span>
              </div>
            </div>
          )}

          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-64 md:h-80 select-none"
          >
            <defs>
              <linearGradient id="chartGradientActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#6366f1" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Grid & Horizontal Benchmark lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const y = pad.top + pct * plotHeight;
              const rateVal = maxVal - pct * valRange;
              return (
                <g key={idx}>
                  <line
                    x1={pad.left}
                    y1={y}
                    x2={pad.left + plotWidth}
                    y2={y}
                    stroke="#334155"
                    strokeWidth="1"
                    strokeDasharray={idx === 0 || idx === 4 ? '' : '3 3'}
                    strokeOpacity="0.4"
                  />
                  <text
                    x={pad.left - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-slate-500 text-[10px] font-mono select-none"
                  >
                    {rateVal < 0.001 ? rateVal.toFixed(6) : rateVal.toFixed(4)}
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            {chartType !== 'candles' && areaPath && (
              <path d={areaPath} fill="url(#chartGradientActive)" />
            )}

            {/* Main Trend Line */}
            {chartType !== 'candles' && linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />
            )}

            {/* Candlestick Visualization */}
            {chartType === 'candles' && (
              <g>
                {coords.map((pt, idx) => {
                  const isUp = pt.close >= pt.open;
                  const candleColor = isUp ? '#10b981' : '#f43f5e';
                  const candleWidth = Math.max(3, (plotWidth / coords.length) * 0.6);
                  const top = Math.min(pt.yOpen, pt.y);
                  const h = Math.max(2, Math.abs(pt.y - pt.yOpen));

                  return (
                    <g key={idx} onMouseEnter={() => setHoveredPoint(pt)} onMouseLeave={() => setHoveredPoint(null)}>
                      {/* Wick */}
                      <line
                        x1={pt.x}
                        y1={pt.yHigh}
                        x2={pt.x}
                        y2={pt.yLow}
                        stroke={candleColor}
                        strokeWidth="1.5"
                      />
                      {/* Body */}
                      <rect
                        x={pt.x - candleWidth / 2}
                        y={top}
                        width={candleWidth}
                        height={h}
                        fill={candleColor}
                        rx="1"
                        className="cursor-pointer hover:opacity-80"
                      />
                    </g>
                  );
                })}
              </g>
            )}

            {/* Interactive Data Dots (Line mode) */}
            {chartType !== 'candles' && coords.map((pt, idx) => (
              <circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r={hoveredPoint?.date === pt.date ? '6' : '3'}
                className="fill-amber-400 hover:fill-amber-300 transition-all cursor-pointer"
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            ))}
          </svg>

          {/* Time axis labels */}
          <div className="flex justify-between px-4 pt-2 text-[11px] font-mono text-slate-500 border-t border-slate-800">
            <span>{dataPoints[0]?.date}</span>
            <span>{dataPoints[Math.floor(dataPoints.length / 2)]?.date}</span>
            <span>{dataPoints[dataPoints.length - 1]?.date} (Now)</span>
          </div>
        </div>

        {/* Statistical Metrics Bento Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block font-mono">Period High</span>
            <div className="text-base sm:text-lg font-bold font-mono text-emerald-400">
              {stats.high < 0.001 ? stats.high.toFixed(6) : stats.high.toFixed(4)}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Peak constellation</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block font-mono">Period Low</span>
            <div className="text-base sm:text-lg font-bold font-mono text-rose-400">
              {stats.low < 0.001 ? stats.low.toFixed(6) : stats.low.toFixed(4)}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Trough support</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block font-mono">Average Rate</span>
            <div className="text-base sm:text-lg font-bold font-mono text-amber-300">
              {stats.avg < 0.001 ? stats.avg.toFixed(6) : stats.avg.toFixed(4)}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Alchemical median</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block font-mono">Volatility Index</span>
            <div className="text-base sm:text-lg font-bold font-mono text-indigo-300">
              {stats.volatility}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Astral variance</span>
          </div>
        </div>

        {/* Merlin Wisdom & Technical Analysis Commentary */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-950 to-slate-950 border border-indigo-500/30 flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-lg select-none">
            🧙‍♂️
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider font-mono">
              Merlin's Chart Divination ({baseCurrency}/{targetCurrency})
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed italic font-serif">
              "{pairWisdom}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
