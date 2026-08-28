import React, { useState, useEffect, useCallback } from 'react';
import { Header, NavTabType } from './components/Header';
import { MultiCurrencyConverter } from './components/MultiCurrencyConverter';
import { CurrencyChartTab } from './components/CurrencyChartTab';
import { FxCalculator } from './components/FxCalculator';
import { FxNewsFeed } from './components/FxNewsFeed';
import { RateAlertsDrawer } from './components/RateAlertsDrawer';
import { CurrencySelectorModal } from './components/CurrencySelectorModal';
import { MerlinOracleModal } from './components/MerlinOracleModal';
import { HistoricalChartModal } from './components/HistoricalChartModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DisqusComments } from './components/DisqusComments';
import { 
  fetchExchangeRates, 
  getSavedAlerts, 
  saveAlerts, 
  checkRateAlerts, 
  fetchFxNews,
  triggerMagicSparks
} from './services/fxService';
import { playSpellChime, playRuneClick } from './services/sound';
import { ExchangeRatesData, NewsItem, RateAlert } from './types';
import { DEFAULT_VIEW_CURRENCIES } from './data/currencies';
import { 
  Sparkles, 
  Bell, 
  Globe, 
  ShieldCheck, 
  Wand2 
} from 'lucide-react';

export default function App() {
  // State
  const [baseCurrency, setBaseCurrency] = useState<string>(() => {
    const saved = localStorage.getItem('fx_wizard_base_currency_v3') || localStorage.getItem('fx_wizard_base_currency_v2') || localStorage.getItem('fx_wizard_base_currency');
    if (saved && typeof saved === 'string' && saved !== 'null' && saved !== 'undefined' && saved.trim()) {
      const clean = saved.trim().toUpperCase();
      if (clean !== 'BTC' && clean !== 'ETH' && clean !== 'XAU' && clean !== 'XAG') return clean;
    }
    return 'SGD';
  });

  const [activeCurrencies, setActiveCurrencies] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fx_wizard_active_currencies_v3') || localStorage.getItem('fx_wizard_active_currencies_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed
            .filter((c): c is string => typeof c === 'string' && c.trim().length > 0 && c !== 'null' && c !== 'undefined')
            .map((c) => c.trim().toUpperCase())
            .filter((c) => c !== 'BTC' && c !== 'ETH' && c !== 'XAU' && c !== 'XAG');
          if (cleaned.length > 0) return cleaned;
        }
      }
    } catch {}
    return DEFAULT_VIEW_CURRENCIES;
  });

  const [ratesData, setRatesData] = useState<ExchangeRatesData | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [lastUpdatedFormatted, setLastUpdatedFormatted] = useState<string>('Just now');

  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState<boolean>(false);

  const [alerts, setAlerts] = useState<RateAlert[]>(() => getSavedAlerts());
  const [triggeredBanner, setTriggeredBanner] = useState<{ alert: RateAlert; rate: number } | null>(null);

  const [activeTab, setActiveTab] = useState<NavTabType>('converter');
  const [chartTargetCurrency, setChartTargetCurrency] = useState<string>('EUR');

  // Modals & Drawers
  const [isCurrencySelectorOpen, setIsCurrencySelectorOpen] = useState<boolean>(false);
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState<boolean>(false);
  const [isOracleModalOpen, setIsOracleModalOpen] = useState<boolean>(false);
  const [chartModalState, setChartModalState] = useState<{
    isOpen: boolean;
    base: string;
    target: string;
    rate: number;
  }>({
    isOpen: false,
    base: 'USD',
    target: 'EUR',
    rate: 1.0,
  });

  const [alertPresetPair, setAlertPresetPair] = useState<{ target: string; rate: number } | null>(null);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      loadRates(baseCurrency, false);
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [baseCurrency]);

  // Load Rates
  const loadRates = useCallback(async (base: string, triggerEffect = true) => {
    setIsRefreshing(true);
    try {
      const data = await fetchExchangeRates(base);
      setRatesData(data);
      setIsOffline(Boolean(data.isOffline));

      const updatedTime = data.time_last_update_utc
        ? new Date(data.time_last_update_utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Cached';
      setLastUpdatedFormatted(updatedTime);

      // Check alerts
      const { updatedAlerts } = checkRateAlerts(data, alerts, (triggeredAlert, currentRate) => {
        setTriggeredBanner({ alert: triggeredAlert, rate: currentRate });
      });
      setAlerts(updatedAlerts);

      if (triggerEffect) {
        playSpellChime();
        triggerMagicSparks();
      }
    } catch (err) {
      console.error('Failed to conjure rates:', err);
    } finally {
      setIsLoadingRates(false);
      setIsRefreshing(false);
    }
  }, [alerts]);

  // Load News
  const loadNews = useCallback(async () => {
    setIsLoadingNews(true);
    try {
      const newsItems = await fetchFxNews();
      setNews(newsItems);
    } catch (err) {
      console.error('Failed to fetch news:', err);
    } finally {
      setIsLoadingNews(false);
    }
  }, []);

  // Initial Data Load
  useEffect(() => {
    loadRates(baseCurrency, false);
    loadNews();

    // Polling every 60s for live rates and alerts
    const interval = setInterval(() => {
      loadRates(baseCurrency, false);
    }, 60000);

    return () => clearInterval(interval);
  }, [baseCurrency]);

  // Save changes to base & currencies
  const handleChangeBaseCurrency = (newBase: string) => {
    setBaseCurrency(newBase);
    localStorage.setItem('fx_wizard_base_currency_v2', newBase);
    localStorage.setItem('fx_wizard_base_currency', newBase);
    loadRates(newBase, true);
  };

  const handleToggleCurrency = (code: string) => {
    let updated: string[];
    if (activeCurrencies.includes(code)) {
      updated = activeCurrencies.filter((c) => c !== code);
    } else {
      updated = [...activeCurrencies, code];
      triggerMagicSparks();
      playSpellChime();
    }
    setActiveCurrencies(updated);
    localStorage.setItem('fx_wizard_active_currencies_v2', JSON.stringify(updated));
    localStorage.setItem('fx_wizard_active_currencies', JSON.stringify(updated));
  };

  const handleRemoveCurrency = (code: string) => {
    const updated = activeCurrencies.filter((c) => c !== code);
    setActiveCurrencies(updated);
    localStorage.setItem('fx_wizard_active_currencies_v2', JSON.stringify(updated));
    localStorage.setItem('fx_wizard_active_currencies', JSON.stringify(updated));
  };

  const handleReorderCurrencies = (newCurrencies: string[]) => {
    setActiveCurrencies(newCurrencies);
    localStorage.setItem('fx_wizard_active_currencies_v2', JSON.stringify(newCurrencies));
    localStorage.setItem('fx_wizard_active_currencies', JSON.stringify(newCurrencies));
  };

  const handleOpenAlertForPair = (targetCurrency: string, currentRate: number) => {
    setAlertPresetPair({ target: targetCurrency, rate: currentRate });
    setIsAlertsDrawerOpen(true);
  };

  const handleOpenChartForPair = (base: string, target: string) => {
    setChartTargetCurrency(target);
    setActiveTab('charts');
  };

  const triggeredCount = alerts.filter((a) => a.isTriggered).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 relative overflow-x-hidden pb-20 md:pb-10">
      
      {/* Mystical Background Celestial Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-amber-500/8 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-purple-950/15 rounded-full blur-[160px]" />
      </div>

      {/* Main Header */}
      <Header
        isOffline={isOffline}
        lastUpdated={lastUpdatedFormatted}
        isRefreshing={isRefreshing}
        onRefresh={() => loadRates(baseCurrency, true)}
        activeAlertsCount={alerts.length}
        triggeredAlertsCount={triggeredCount}
        onOpenAlerts={() => setIsAlertsDrawerOpen(true)}
        onOpenNews={() => setActiveTab('news')}
        onOpenOracle={() => setIsOracleModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Triggered Alert Floating Banner */}
      {triggeredBanner && (
        <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950 via-rose-950/80 to-slate-900 border-2 border-amber-400 shadow-xl shadow-amber-950/50 flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-bounce">⚡</span>
              <div>
                <h4 className="text-sm font-bold text-amber-200 font-serif">
                  Merlin Threshold Alert Triggered!
                </h4>
                <p className="text-xs text-slate-300">
                  <strong className="text-amber-300 font-mono">
                    {triggeredBanner.alert.baseCurrency}/{triggeredBanner.alert.targetCurrency}
                  </strong>{' '}
                  has reached{' '}
                  <strong className="text-emerald-400 font-mono">
                    {triggeredBanner.rate.toFixed(4)}
                  </strong>{' '}
                  ({triggeredBanner.alert.condition === 'ABOVE' ? '≥' : '≤'}{' '}
                  {triggeredBanner.alert.thresholdRate}). {triggeredBanner.alert.note}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsAlertsDrawerOpen(true);
                  setTriggeredBanner(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shadow-md transition-colors whitespace-nowrap"
              >
                View Watchtower
              </button>
              <button
                onClick={() => setTriggeredBanner(null)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
        
        {/* Tab 1: Multi-Currency Converter */}
        {activeTab === 'converter' && (
          <MultiCurrencyConverter
            baseCurrency={baseCurrency}
            onChangeBaseCurrency={handleChangeBaseCurrency}
            activeCurrencies={activeCurrencies}
            onAddCurrency={() => setIsCurrencySelectorOpen(true)}
            onRemoveCurrency={handleRemoveCurrency}
            onReorderCurrencies={handleReorderCurrencies}
            ratesData={ratesData}
            isLoading={isLoadingRates}
            onOpenAlertForPair={handleOpenAlertForPair}
            onOpenChartForPair={handleOpenChartForPair}
          />
        )}

        {/* Tab 2: Dedicated Currency Chart Tab */}
        {activeTab === 'charts' && (
          <CurrencyChartTab
            ratesData={ratesData}
            baseCurrency={baseCurrency}
            onChangeBaseCurrency={handleChangeBaseCurrency}
            onOpenAlertForPair={handleOpenAlertForPair}
            onOpenOracle={() => setIsOracleModalOpen(true)}
            onSwitchToConverter={() => setActiveTab('converter')}
            initialTargetCurrency={chartTargetCurrency}
          />
        )}

        {/* Tab 3: Real-time FX Calculator */}
        {activeTab === 'calculator' && (
          <FxCalculator
            ratesData={ratesData}
            onOpenChartForPair={handleOpenChartForPair}
          />
        )}

        {/* Tab 4: Live FX News Feed (When News Tab is selected directly) */}
        {activeTab === 'news' && (
          <FxNewsFeed
            news={news}
            isLoading={isLoadingNews}
            onRefreshNews={loadNews}
          />
        )}

        {/* Tab 5: Rate Alerts Dashboard Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
              <div>
                <h2 className="text-xl font-bold text-amber-200 font-serif flex items-center gap-2">
                  <span>⚡ Merlin's Rate Watchtower</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Automated threshold monitoring with desktop fanfares & cosmic particle spells
                </p>
              </div>

              <button
                onClick={() => setIsAlertsDrawerOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all active:scale-95"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Open Alert Forge</span>
              </button>
            </div>

            {/* Quick Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Active Alert Charms</span>
                <p className="text-2xl font-bold font-mono text-amber-300">
                  {alerts.filter((a) => a.isActive).length}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Triggered Breaches</span>
                <p className="text-2xl font-bold font-mono text-rose-400">
                  {triggeredCount}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Oracle Health</span>
                <p className="text-2xl font-bold font-mono text-emerald-400">
                  {isOffline ? 'Offline Grimoire' : 'Real-Time Sync'}
                </p>
              </div>
            </div>

            {/* Embed the alert drawer content directly into the view */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
              <RateAlertsDrawer
                isOpen={true}
                onClose={() => {}}
                alerts={alerts}
                onUpdateAlerts={setAlerts}
                ratesData={ratesData}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FX NEWS FEED (Positioned before Community Discussion) */}
        {/* ========================================================================= */}
        {activeTab === 'converter' && (
          <section id="landing-fx-news" className="pt-2">
            <FxNewsFeed
              news={news}
              isLoading={isLoadingNews}
              onRefreshNews={loadNews}
            />
          </section>
        )}

        {/* ========================================================================= */}
        {/* Disqus Community Discussion (Positioned after FX News) */}
        {/* ========================================================================= */}
        <DisqusComments
          shortname="totoro-2"
          currentLocation={{
            id: 'fx-wizard-landing',
            name: 'FX Wizard - Global Currency Converter & Live Exchange Rates'
          }}
        />

        {/* Feature Highlights Footer Bar */}
        <div className="pt-6 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200">100% Free Live FX Data</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Powered by open public exchange rate oracles with zero required API keys.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200">Offline Grimoire Storage</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Exchange rates, formulas, and alerts cached locally for seamless offline travel.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200">Merlin the FX Magician</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Archmage moniker with synthesized sound spells, starbursts, and market divination.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        triggeredAlertsCount={triggeredCount}
      />

      {/* Currency Selector Modal */}
      <CurrencySelectorModal
        isOpen={isCurrencySelectorOpen}
        onClose={() => setIsCurrencySelectorOpen(false)}
        activeCurrencies={activeCurrencies}
        onToggleCurrency={handleToggleCurrency}
        mode="multi"
      />

      {/* Rate Alerts Side Drawer (when opened via header or card) */}
      <RateAlertsDrawer
        isOpen={isAlertsDrawerOpen}
        onClose={() => {
          setIsAlertsDrawerOpen(false);
          setAlertPresetPair(null);
        }}
        alerts={alerts}
        onUpdateAlerts={setAlerts}
        ratesData={ratesData}
        initialTargetCurrency={alertPresetPair?.target || 'EUR'}
        initialRate={alertPresetPair?.rate}
      />

      {/* Merlin Oracle Scrying Pool Modal */}
      <MerlinOracleModal
        isOpen={isOracleModalOpen}
        onClose={() => setIsOracleModalOpen(false)}
        ratesData={ratesData}
        defaultPair={`${baseCurrency}/EUR`}
      />

      {/* Historical Trend Chart Modal */}
      <HistoricalChartModal
        isOpen={chartModalState.isOpen}
        onClose={() => setChartModalState((prev) => ({ ...prev, isOpen: false }))}
        baseCurrency={chartModalState.base}
        targetCurrency={chartModalState.target}
        currentRate={chartModalState.rate}
      />
    </div>
  );
}
