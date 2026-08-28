import React, { useState } from 'react';
import { 
  Bell, 
  BellRing, 
  Plus, 
  Trash2, 
  X, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  Volume2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { RateAlert, ExchangeRatesData } from '../types';
import { CURRENCIES, getCurrencyInfo } from '../data/currencies';
import { playRuneClick, playThresholdFanfare, playSpellChime } from '../services/sound';
import { saveAlerts, triggerMagicSparks } from '../services/fxService';

interface RateAlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: RateAlert[];
  onUpdateAlerts: (updated: RateAlert[]) => void;
  ratesData: ExchangeRatesData | null;
  initialTargetCurrency?: string;
  initialRate?: number;
}

export const RateAlertsDrawer: React.FC<RateAlertsDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onUpdateAlerts,
  ratesData,
  initialTargetCurrency = 'EUR',
  initialRate,
}) => {
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');
  const [targetCurrency, setTargetCurrency] = useState<string>(initialTargetCurrency);
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [thresholdInput, setThresholdInput] = useState<string>('');
  const [alertNote, setAlertNote] = useState<string>('');
  const [notificationPermission, setNotificationPermission] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  // Calculate live current rate for selected pair
  const currentPairRate = React.useMemo(() => {
    if (!ratesData || !ratesData.rates) return initialRate || 1.0;
    const baseGlobal = ratesData.rates[baseCurrency] || 1.0;
    const targetGlobal = ratesData.rates[targetCurrency] || 1.0;
    return baseGlobal > 0 ? targetGlobal / baseGlobal : 1.0;
  }, [ratesData, baseCurrency, targetCurrency, initialRate]);

  // Set default threshold input when pair changes
  React.useEffect(() => {
    if (currentPairRate > 0 && !thresholdInput) {
      const suggested = condition === 'ABOVE' ? currentPairRate * 1.02 : currentPairRate * 0.98;
      setThresholdInput(suggested.toFixed(4));
    }
  }, [currentPairRate, condition, thresholdInput]);

  const requestNotificationAccess = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        playSpellChime();
        triggerMagicSparks();
      }
    }
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const rateVal = parseFloat(thresholdInput);
    if (isNaN(rateVal) || rateVal <= 0) return;

    playSpellChime();
    triggerMagicSparks();

    const newAlert: RateAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      baseCurrency,
      targetCurrency,
      thresholdRate: rateVal,
      condition,
      isActive: true,
      isTriggered: false,
      createdAt: Date.now(),
      note: alertNote.trim() || `Notify when ${baseCurrency}/${targetCurrency} is ${condition.toLowerCase()} ${rateVal}`,
    };

    const updated = [newAlert, ...alerts];
    onUpdateAlerts(updated);
    saveAlerts(updated);

    setAlertNote('');
    setThresholdInput('');
  };

  const handleDeleteAlert = (id: string) => {
    playRuneClick();
    const updated = alerts.filter((a) => a.id !== id);
    onUpdateAlerts(updated);
    saveAlerts(updated);
  };

  const handleToggleAlertActive = (id: string) => {
    playRuneClick();
    const updated = alerts.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a));
    onUpdateAlerts(updated);
    saveAlerts(updated);
  };

  const handleTestTrigger = (alert: RateAlert) => {
    playThresholdFanfare();
    triggerMagicSparks();
    const updated = alerts.map((a) =>
      a.id === alert.id ? { ...a, isTriggered: true, lastTriggeredAt: Date.now() } : a
    );
    onUpdateAlerts(updated);
    saveAlerts(updated);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`⚡ Merlin Alert Triggered!`, {
          body: `${alert.baseCurrency}/${alert.targetCurrency} threshold met: ${alert.thresholdRate}`,
        });
      } catch {}
    }
  };

  const setRelativeOffset = (pct: number) => {
    playRuneClick();
    const newRate = currentPairRate * (1 + pct / 100);
    setThresholdInput(newRate.toFixed(4));
    setCondition(pct >= 0 ? 'ABOVE' : 'BELOW');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="rate-alerts-drawer"
        className="w-full max-w-md bg-slate-900 border-l border-amber-500/30 shadow-2xl flex flex-col h-full overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <BellRing className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-amber-200 font-serif">Arcane Rate Alerts</h2>
              <p className="text-xs text-slate-400">
                Merlin watches exchange rates and rings the bell on threshold breaches
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Notification Permission Banner */}
          {notificationPermission !== 'granted' && (
            <div className="p-3.5 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-start justify-between gap-3 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-indigo-200">Enable Desktop Alerts</p>
                <p className="text-slate-400 text-[11px]">
                  Receive enchanted browser notifications even when this tab is asleep.
                </p>
              </div>
              <button
                onClick={requestNotificationAccess}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs whitespace-nowrap shadow-sm"
              >
                Enable
              </button>
            </div>
          )}

          {/* Create Alert Form */}
          <form onSubmit={handleCreateAlert} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Conjure New Rate Alert</span>
            </h3>

            {/* Currency Pair Selectors */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Base Currency</label>
                <select
                  value={baseCurrency}
                  onChange={(e) => setBaseCurrency(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Target Currency</label>
                <select
                  value={targetCurrency}
                  onChange={(e) => setTargetCurrency(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Current Spot Display */}
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Live Spot Rate:</span>
              <span className="text-amber-300 font-bold">
                1 {baseCurrency} = {currentPairRate.toFixed(4)} {targetCurrency}
              </span>
            </div>

            {/* Condition: Above / Below */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { playRuneClick(); setCondition('ABOVE'); }}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  condition === 'ABOVE'
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Rises Above (≥)</span>
              </button>

              <button
                type="button"
                onClick={() => { playRuneClick(); setCondition('BELOW'); }}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  condition === 'BELOW'
                    ? 'bg-rose-950/60 border-rose-500/60 text-rose-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Drops Below (≤)</span>
              </button>
            </div>

            {/* Threshold Input & Quick Delta Pills */}
            <div className="space-y-2">
              <label className="text-[11px] text-slate-400 block">Threshold Target Rate</label>
              <input
                type="number"
                step="any"
                required
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                placeholder="e.g. 1.1000"
                className="w-full py-2.5 px-3.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono font-bold text-amber-200 focus:outline-none focus:border-amber-400"
              />

              {/* Relative Offset Shortcuts */}
              <div className="flex items-center gap-1.5 pt-1">
                {[-5, -1, 1, 5].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setRelativeOffset(pct)}
                    className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-amber-300"
                  >
                    {pct > 0 ? `+${pct}%` : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Note Input */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 block">Note / Spell Moniker (Optional)</label>
              <input
                type="text"
                value={alertNote}
                onChange={(e) => setAlertNote(e.target.value)}
                placeholder="e.g. Summer vacation budget trigger"
                className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-600/30 transition-all active:scale-95"
            >
              Arm Rate Enchantment
            </button>
          </form>

          {/* Active Alerts List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Active Watchtower ({alerts.length})
              </h3>
            </div>

            <div className="space-y-2.5">
              {alerts.map((alert) => {
                // Calculate live delta
                let currentPair = 0;
                if (ratesData && ratesData.rates) {
                  const bRate = ratesData.rates[alert.baseCurrency] || 1.0;
                  const tRate = ratesData.rates[alert.targetCurrency] || 1.0;
                  currentPair = bRate > 0 ? tRate / bRate : 0;
                }

                const diffPct = currentPair > 0 ? ((alert.thresholdRate - currentPair) / currentPair) * 100 : 0;

                return (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      alert.isTriggered
                        ? 'bg-rose-950/40 border-rose-500/50 shadow-md shadow-rose-950/40'
                        : alert.isActive
                        ? 'bg-slate-950/80 border-slate-800'
                        : 'bg-slate-950/40 border-slate-850 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-100 font-mono">
                            {alert.baseCurrency} / {alert.targetCurrency}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                              alert.condition === 'ABOVE'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {alert.condition === 'ABOVE' ? '≥' : '≤'} {alert.thresholdRate}
                          </span>
                          {alert.isTriggered && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500 text-white animate-pulse">
                              TRIGGERED
                            </span>
                          )}
                        </div>

                        {alert.note && (
                          <p className="text-xs text-slate-400 truncate italic">
                            "{alert.note}"
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 pt-1">
                          <span>Spot: {currentPair > 0 ? currentPair.toFixed(4) : '...'}</span>
                          <span>•</span>
                          <span className={diffPct > 0 ? 'text-amber-400' : 'text-indigo-400'}>
                            {diffPct > 0 ? `+${diffPct.toFixed(2)}% away` : `${diffPct.toFixed(2)}% away`}
                          </span>
                        </div>
                      </div>

                      {/* Alert Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleTestTrigger(alert)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                          title="Test chime spell"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleAlertActive(alert.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            alert.isActive
                              ? 'text-emerald-400 hover:bg-slate-800'
                              : 'text-slate-600 hover:text-slate-400'
                          }`}
                          title={alert.isActive ? 'Pause alert' : 'Activate alert'}
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete alert"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {alerts.length === 0 && (
                <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  <Bell className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                  <p className="text-xs">No active alerts set in the watchtower.</p>
                  <p className="text-[11px] text-slate-600 mt-1">Arm an alert above to get notified.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
