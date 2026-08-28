import React from 'react';
import { Sparkles, Wifi, WifiOff, Volume2, VolumeX, RefreshCw, Bell, BookOpen, Wand2, LineChart } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled, playSpellChime, playRuneClick } from '../services/sound';
import { triggerMagicSparks } from '../services/fxService';

export type NavTabType = 'converter' | 'charts' | 'calculator' | 'news' | 'alerts';

interface HeaderProps {
  isOffline: boolean;
  lastUpdated: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  activeAlertsCount: number;
  triggeredAlertsCount: number;
  onOpenAlerts: () => void;
  onOpenNews: () => void;
  onOpenOracle: () => void;
  activeTab: NavTabType;
  setActiveTab: (tab: NavTabType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isOffline,
  lastUpdated,
  isRefreshing,
  onRefresh,
  activeAlertsCount,
  triggeredAlertsCount,
  onOpenAlerts,
  onOpenNews,
  onOpenOracle,
  activeTab,
  setActiveTab,
}) => {
  const [soundOn, setSoundOn] = React.useState<boolean>(isSoundEnabled());

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      playSpellChime();
    }
  };

  const handleCastMagic = () => {
    playSpellChime();
    triggerMagicSparks();
  };

  return (
    <header id="fx-wizard-header" className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-amber-500/20 shadow-xl shadow-amber-950/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
        
        {/* Brand & Moniker */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-start">
          <div 
            onClick={handleCastMagic}
            className="group flex items-center gap-2.5 cursor-pointer select-none min-w-0"
            title="Click to cast Merlin's Sparks"
          >
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-indigo-900 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/50 group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
              <span className="text-lg sm:text-xl drop-shadow">🧙‍♂️</span>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-[8px] text-slate-950 font-black">
                ✨
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-100 bg-clip-text text-transparent font-serif leading-tight">
                  FX Wizard
                </h1>
                <span className="hidden xs:inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-indigo-950 text-indigo-300 font-mono border border-indigo-500/30">
                  REAL-TIME
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 font-sans truncate">
                Live Exchange Rates & Currency Oracle
              </p>
            </div>
          </div>

          {/* Mobile Right Action shortcut */}
          <div className="flex md:hidden items-center gap-1 flex-shrink-0">
            {/* Oracle Shortcut */}
            <button
              id="header-mobile-oracle-btn"
              onClick={onOpenOracle}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-900 border border-slate-800 text-indigo-300 hover:bg-slate-800"
              title="Merlin's Oracle"
            >
              <span className="text-sm">🔮</span>
            </button>

            <button
              id="header-mobile-refresh-btn"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-900 border border-slate-800 text-amber-300 hover:bg-slate-800 disabled:opacity-50"
              title="Conjure Latest Rates"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              id="header-mobile-alerts-btn"
              onClick={onOpenAlerts}
              className="relative p-1.5 sm:p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300"
              title="Rate Alerts"
            >
              <Bell className="w-3.5 h-3.5" />
              {triggeredAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white animate-pulse">
                  {triggeredAlertsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center p-1 bg-slate-900/90 rounded-xl border border-slate-800 shadow-inner w-auto justify-center">
          <button
            id="nav-tab-converter"
            onClick={() => { playRuneClick(); setActiveTab('converter'); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'converter'
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/30 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Multi-Converter</span>
          </button>

          <button
            id="nav-tab-charts"
            onClick={() => { playRuneClick(); setActiveTab('charts'); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'charts'
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/30 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LineChart className="w-3.5 h-3.5 text-amber-400" />
            <span>Currency Chart</span>
          </button>

          <button
            id="nav-tab-calculator"
            onClick={() => { playRuneClick(); setActiveTab('calculator'); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'calculator'
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/30 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>FX Calculator</span>
          </button>

          <button
            id="nav-tab-news"
            onClick={() => { playRuneClick(); setActiveTab('news'); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'news'
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/30 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Market News</span>
          </button>

          <button
            id="nav-tab-alerts"
            onClick={() => { playRuneClick(); setActiveTab('alerts'); }}
            className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'alerts'
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/30 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-rose-400" />
            <span>Threshold Alerts</span>
            {triggeredAlertsCount > 0 && (
              <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white animate-pulse">
                {triggeredAlertsCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Status & Controls */}
        <div className="hidden md:flex items-center gap-3">
          {/* Online/Offline Status Indicator */}
          <div 
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isOffline
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
            }`}
            title={isOffline ? 'Using offline cached exchange rates' : 'Live real-time oracle stream connected'}
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Offline Grimoire</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Oracle</span>
              </>
            )}
          </div>

          {/* Merlin Oracle Scrying Pool Button */}
          <button
            id="merlin-oracle-header-btn"
            onClick={onOpenOracle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 text-xs font-semibold shadow-sm transition-all hover:scale-105"
            title="Consult Merlin's Arcane Oracle"
          >
            <span className="text-sm">🔮</span>
            <span>Oracle</span>
          </button>

          {/* Sound Toggle */}
          <button
            id="sound-toggle-btn"
            onClick={toggleSound}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:bg-slate-800 transition-colors"
            title={soundOn ? 'Mute Enchanted Chimes' : 'Enable Enchanted Chimes'}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Refresh Rates Button */}
          <button
            id="refresh-rates-btn"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-600/30 transition-all active:scale-95 disabled:opacity-50"
            title={`Conjure latest rates (Last: ${lastUpdated})`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Conjuring...' : 'Sync Rates'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
