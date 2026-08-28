import React, { useState, useEffect, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Sparkles, Calendar, Activity } from 'lucide-react';
import { getCurrencyInfo } from '../data/currencies';
import { playRuneClick } from '../services/sound';
import { CurrencyFlag } from './CurrencyFlag';

interface HistoricalChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseCurrency: string;
  targetCurrency: string;
  currentRate: number;
}

interface RatePoint {
  date: string;
  rate: number;
}

export const HistoricalChartModal: React.FC<HistoricalChartModalProps> = ({
  isOpen,
  onClose,
  baseCurrency,
  targetCurrency,
  currentRate,
}) => {
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');
  const [points, setPoints] = useState<RatePoint[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<RatePoint | null>(null);

  const baseInfo = useMemo(() => getCurrencyInfo(baseCurrency), [baseCurrency]);
  const targetInfo = useMemo(() => getCurrencyInfo(targetCurrency), [targetCurrency]);

  // Generate realistic historical trend data based on currentRate and timeframe
  useEffect(() => {
    if (!isOpen) return;

    const daysCount = timeframe === '7D' ? 7 : timeframe === '30D' ? 30 : timeframe === '90D' ? 90 : 365;
    const step = daysCount > 90 ? 3 : 1;
    const generated: RatePoint[] = [];

    const now = new Date();
    const rateBase = currentRate > 0 ? currentRate : 1.0;
    
    // Deterministic pseudo-random seed based on pair string
    const baseStr = baseCurrency || 'USD';
    const targetStr = targetCurrency || 'EUR';
    const seed = (baseStr.charCodeAt(0) * 31 + targetStr.charCodeAt(0)) % 1000;
    
    let simulatedRate = rateBase * (1 - (daysCount * 0.0003));

    for (let i = daysCount; i >= 0; i -= step) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const noise = Math.sin((i + seed) * 0.3) * 0.008 + (Math.cos(i * 0.7) * 0.004);
      simulatedRate = rateBase * (1 + noise - (i / daysCount) * 0.015);
      
      generated.push({
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        rate: Math.max(0.000001, simulatedRate),
      });
    }

    // Ensure the last point matches current real-time rate exactly
    if (generated.length > 0) {
      generated[generated.length - 1].rate = rateBase;
    }

    setPoints(generated);
  }, [isOpen, timeframe, baseCurrency, targetCurrency, currentRate]);

  // Stats calculation
  const stats = useMemo(() => {
    if (points.length === 0) return { high: 0, low: 0, changePct: 0, isPositive: true };
    const rates = points.map((p) => p.rate);
    const high = Math.max(...rates);
    const low = Math.min(...rates);
    const first = points[0].rate;
    const last = points[points.length - 1].rate;
    const changePct = first > 0 ? ((last - first) / first) * 100 : 0;
    return {
      high,
      low,
      changePct,
      isPositive: changePct >= 0,
    };
  }, [points]);

  // SVG dimensions & math
  const width = 600;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };

  const chartData = useMemo(() => {
    if (points.length < 2) return { pathString: '', areaString: '', pointsWithCoords: [] };

    const minRate = stats.low * 0.998;
    const maxRate = stats.high * 1.002;
    const range = maxRate - minRate || 1;

    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const pointsWithCoords = points.map((p, idx) => {
      const x = padding.left + (idx / (points.length - 1)) * plotWidth;
      const y = padding.top + plotHeight - ((p.rate - minRate) / range) * plotHeight;
      return { ...p, x, y };
    });

    const pathString = pointsWithCoords.reduce(
      (acc, p, idx) => (idx === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`),
      ''
    );

    const areaString = `${pathString} L ${padding.left + plotWidth},${padding.top + plotHeight} L ${padding.left},${padding.top + plotHeight} Z`;

    return { pathString, areaString, pointsWithCoords };
  }, [points, stats]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="historical-chart-modal"
        className="w-full max-w-2xl bg-slate-900 border-2 border-indigo-500/40 rounded-3xl shadow-2xl shadow-indigo-950/50 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center shadow-md">
              <CurrencyFlag currencyCode={baseCurrency} fallbackEmoji={baseInfo.flag} size="md" className="z-10 ring-1 ring-slate-700/50" />
              <CurrencyFlag currencyCode={targetCurrency} fallbackEmoji={targetInfo.flag} size="md" className="-ml-2 ring-1 ring-slate-700/50" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-serif flex items-center gap-2">
                <span>{baseCurrency} to {targetCurrency} Exchange Trend</span>
              </h2>
              <p className="text-xs text-slate-400">
                1 {baseCurrency} = <strong className="text-amber-300 font-mono">{currentRate.toFixed(4)}</strong> {targetCurrency}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Timeframe selector & Stat pills */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Stat Pill */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold font-mono ${
                stats.isPositive
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}>
                {stats.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{stats.isPositive ? `+${stats.changePct.toFixed(2)}%` : `${stats.changePct.toFixed(2)}%`}</span>
              </div>

              <div className="text-xs text-slate-400 space-x-2 font-mono">
                <span>High: <strong className="text-slate-200">{stats.high.toFixed(4)}</strong></span>
                <span>•</span>
                <span>Low: <strong className="text-slate-200">{stats.low.toFixed(4)}</strong></span>
              </div>
            </div>

            {/* Timeframe Buttons */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
              {(['7D', '30D', '90D', '1Y'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => {
                    playRuneClick();
                    setTimeframe(tf);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                    timeframe === tf
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive SVG Chart Canvas */}
          <div className="relative p-4 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
            {hoveredPoint && (
              <div className="absolute top-4 left-6 z-10 p-2 rounded-xl bg-slate-900 border border-amber-500/50 shadow-lg text-xs font-mono">
                <span className="text-slate-400 block">{hoveredPoint.date}</span>
                <span className="text-amber-300 font-bold text-sm">
                  1 {baseCurrency} = {hoveredPoint.rate.toFixed(4)} {targetCurrency}
                </span>
              </div>
            )}

            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-48 md:h-56 select-none"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={padding.left} y1={padding.top} x2={width - padding.right} y2={padding.top} stroke="#334155" strokeDasharray="3 3" />
              <line x1={padding.left} y1={height / 2} x2={width - padding.right} y2={height / 2} stroke="#334155" strokeDasharray="3 3" />
              <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#334155" strokeDasharray="3 3" />

              {/* Area Fill */}
              {chartData.areaString && (
                <path d={chartData.areaString} fill="url(#chartGradient)" />
              )}

              {/* Trend Line */}
              {chartData.pathString && (
                <path
                  d={chartData.pathString}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Hover & Interactive Points */}
              {chartData.pointsWithCoords.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={pt.x}
                  cy={pt.y}
                  r="3"
                  className="fill-amber-400 hover:r-5 transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </svg>

            {/* X Axis Labels */}
            <div className="flex justify-between px-2 pt-2 text-[10px] font-mono text-slate-500 border-t border-slate-800/80">
              <span>{points[0]?.date}</span>
              <span>{points[Math.floor(points.length / 2)]?.date}</span>
              <span>{points[points.length - 1]?.date} (Today)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Alchemical historical rate matrix</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
