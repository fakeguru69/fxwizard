import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Wand2, 
  RefreshCw, 
  ShieldCheck, 
  Flame, 
  Wind, 
  Compass,
  AlertCircle
} from 'lucide-react';
import { ExchangeRatesData, MerlinDivination } from '../types';
import { CURRENCIES } from '../data/currencies';
import { playSpellChime, playRuneClick } from '../services/sound';
import { triggerMagicSparks } from '../services/fxService';

interface MerlinOracleModalProps {
  isOpen: boolean;
  onClose: () => void;
  ratesData: ExchangeRatesData | null;
  defaultPair?: string;
}

export const MerlinOracleModal: React.FC<MerlinOracleModalProps> = ({
  isOpen,
  onClose,
  ratesData,
  defaultPair = 'USD/EUR',
}) => {
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');
  const [targetCurrency, setTargetCurrency] = useState<string>('EUR');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [divination, setDivination] = useState<MerlinDivination | null>(null);

  // Derive current spot rate
  const currentRate = React.useMemo(() => {
    if (!ratesData || !ratesData.rates) return 1.0;
    const b = ratesData.rates[baseCurrency] || 1.0;
    const t = ratesData.rates[targetCurrency] || 1.0;
    return b > 0 ? t / b : 1.0;
  }, [ratesData, baseCurrency, targetCurrency]);

  const handleConsultOracle = async () => {
    setIsLoading(true);
    playSpellChime();
    triggerMagicSparks();

    try {
      const res = await fetch('/api/merlin/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pair: `${baseCurrency}/${targetCurrency}`,
          rate: currentRate,
          baseCurrency,
          targetCurrency,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDivination(data);
      } else {
        // Fallback
        setDivination({
          pair: `${baseCurrency}/${targetCurrency}`,
          currentRate,
          sentiment: 'Arcane Equilibrium',
          arcaneProphecy: `The currents of ${baseCurrency} and ${targetCurrency} dance in mystical synchronicity. Maintain steady treasuries while celestial alignments unfold.`,
          elementalForce: 'Aether (Cosmic Balance)',
          volatilityIndex: 'Calm Breeze',
          luckySpells: [
            'Aegis Rune: Anchor positions with calculated stop loss barriers.',
            'Patience Charm: Observe sovereign treasury announcements.',
          ],
        });
      }
    } catch {
      setDivination({
        pair: `${baseCurrency}/${targetCurrency}`,
        currentRate,
        sentiment: 'Sovereign Equilibrium',
        arcaneProphecy: `The celestial balance between ${baseCurrency} and ${targetCurrency} remains fortified. Fortunes favor those who calculate their risk with alchemical precision.`,
        elementalForce: 'Terra & Aurum',
        volatilityIndex: 'Calm Breeze',
        luckySpells: [
          'Diversification Spell: Cast capital across multiple sovereign realms.',
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial consult on open if not yet fetched
  React.useEffect(() => {
    if (isOpen && !divination && !isLoading) {
      handleConsultOracle();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="merlin-oracle-modal"
        className="w-full max-w-xl bg-gradient-to-b from-slate-900 via-indigo-950/80 to-slate-950 border-2 border-amber-500/40 rounded-3xl shadow-2xl shadow-indigo-950/60 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-2xl shadow-md shadow-amber-500/30">
              🔮
            </div>
            <div>
              <h2 className="text-base font-bold text-amber-200 font-serif">
                Merlin's Arcane Scrying Pool
              </h2>
              <p className="text-xs text-slate-400">
                Divining cosmic market forces, volatility winds, and currency alchemy
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
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Pair Selector */}
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={baseCurrency}
                onChange={(e) => {
                  playRuneClick();
                  setBaseCurrency(e.target.value);
                }}
                className="py-1.5 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-slate-100 focus:outline-none"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>

              <span className="text-amber-400 font-bold font-mono">/</span>

              <select
                value={targetCurrency}
                onChange={(e) => {
                  playRuneClick();
                  setTargetCurrency(e.target.value);
                }}
                className="py-1.5 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-slate-100 focus:outline-none"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleConsultOracle}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all active:scale-95"
            >
              <Wand2 className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Scrying...' : 'Divine Pair'}</span>
            </button>
          </div>

          {/* Divination Result */}
          {divination && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
              
              {/* Prophecy Scroll Card */}
              <div className="relative p-5 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>The Archmage's Oracle</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-mono">
                    1 {baseCurrency} = {currentRate.toFixed(4)} {targetCurrency}
                  </span>
                </div>

                <p className="text-sm md:text-base text-amber-100 font-serif leading-relaxed italic border-l-2 border-amber-500/60 pl-3">
                  "{divination.arcaneProphecy}"
                </p>
              </div>

              {/* Elemental Affinities & Volatility Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] block">Elemental Domain</span>
                  <p className="font-bold text-indigo-300 font-mono flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>{divination.elementalForce}</span>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] block">Atmospheric Volatility</span>
                  <p className="font-bold text-amber-300 font-mono flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{divination.volatilityIndex}</span>
                  </p>
                </div>
              </div>

              {/* Merlin's Protection Spells */}
              {divination.luckySpells && divination.luckySpells.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-indigo-500/30 space-y-2">
                  <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Enchanted Risk Hedging Spells</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {divination.luckySpells.map((spell, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 text-sm leading-none">•</span>
                        <span>{spell}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span className="italic font-serif text-slate-500">
            "Knowledge is the supreme currency of the cosmos."
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
          >
            Close Scrying Pool
          </button>
        </div>
      </div>
    </div>
  );
};
