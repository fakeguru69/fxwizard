import { ExchangeRatesData, NewsItem, RateAlert } from '../types';
import { playSpellChime, playThresholdFanfare } from './sound';
import confetti from 'canvas-confetti';

const STORAGE_KEYS = {
  RATES_CACHE_PREFIX: 'fx_wizard_rates_',
  SAVED_BASE: 'fx_wizard_base_currency',
  SAVED_VIEW_CURRENCIES: 'fx_wizard_active_currencies',
  ALERTS: 'fx_wizard_rate_alerts',
  ALERT_HISTORY: 'fx_wizard_alert_history',
  SAVED_NEWS: 'fx_wizard_cached_news',
  CALC_HISTORY: 'fx_wizard_calc_history',
};

// Fallback rates if user is completely offline on first launch
const OFFLINE_FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 154.5,
  CHF: 0.90,
  CAD: 1.36,
  AUD: 1.52,
  CNY: 7.24,
  INR: 83.5,
  SGD: 1.35,
  NZD: 1.66,
  HKD: 7.82,
  SEK: 10.65,
  NOK: 10.82,
  DKK: 6.86,
  AED: 3.67,
  SAR: 3.75,
  BRL: 5.45,
  MXN: 18.2,
  ZAR: 18.3,
  KRW: 1380.0,
  TRY: 33.2,
  PLN: 3.98,
  THB: 36.8,
  IDR: 16250.0,
  MYR: 4.71,
  PHP: 58.6,
  CZK: 23.2,
  HUF: 365.0,
  ILS: 3.72,
  CLP: 940.0,
  COP: 4120.0,
  EGP: 48.5,
  QAR: 3.64,
  KWD: 0.31,
  BHD: 0.38,
  OMR: 0.38,
  VND: 25400.0,
  TWD: 32.5,
  ARS: 935.0,
  PEN: 3.75,
  NGN: 1510.0,
  KES: 130.0,
  GHS: 15.2,
  PKR: 278.0,
  BDT: 117.5,
  RON: 4.58,
  BGN: 1.80,
  ISK: 139.0,
};

/**
 * Trigger magical starburst particle effect
 */
export function triggerMagicSparks() {
  confetti({
    particleCount: 40,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#fbbf24', '#f59e0b', '#818cf8', '#c084fc', '#60a5fa'],
    shapes: ['star', 'circle'],
    ticks: 150,
  });
}

/**
 * Fetch latest exchange rates with multi-layer free API fallback and offline caching
 */
export async function fetchExchangeRates(baseCurrency = 'USD'): Promise<ExchangeRatesData> {
  const base = (baseCurrency && typeof baseCurrency === 'string' ? baseCurrency : 'USD').trim().toUpperCase();
  const cacheKey = `${STORAGE_KEYS.RATES_CACHE_PREFIX}${base}`;

  // Step 1: Try Primary Free Open API (open.er-api.com - no key required, 160+ currencies)
  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
      cache: 'no-cache',
      headers: { Accept: 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.rates && typeof data.rates === 'object') {
        const payload: ExchangeRatesData = {
          result: 'success',
          provider: 'Open Exchange Rates (Live)',
          base_code: base,
          time_last_update_utc: data.time_last_update_utc || new Date().toUTCString(),
          time_next_update_utc: data.time_next_update_utc,
          time_last_update_unix: data.time_last_update_unix || Math.floor(Date.now() / 1000),
          rates: data.rates,
          isOffline: false,
          cachedAt: Date.now(),
        };

        // Persist to local storage for offline resilience
        try {
          localStorage.setItem(cacheKey, JSON.stringify(payload));
          localStorage.setItem('fx_wizard_last_live_sync', String(Date.now()));
        } catch {
          // ignore storage quota error
        }

        return payload;
      }
    }
  } catch (err) {
    console.warn('Primary open.er-api failed, trying secondary fallback...', err);
  }

  // Step 2: Try Secondary Free Open API (Frankfurter API - ECB rates)
  try {
    const frankResponse = await fetch(`https://api.frankfurter.app/latest?from=${base}`);
    if (frankResponse.ok) {
      const frankData = await frankResponse.json();
      if (frankData && frankData.rates) {
        const combinedRates = { ...OFFLINE_FALLBACK_RATES, ...frankData.rates, [base]: 1.0 };
        const payload: ExchangeRatesData = {
          result: 'success',
          provider: 'European Central Bank (Frankfurter Live)',
          base_code: base,
          time_last_update_utc: frankData.date || new Date().toUTCString(),
          time_last_update_unix: Math.floor(Date.now() / 1000),
          rates: combinedRates,
          isOffline: false,
          cachedAt: Date.now(),
        };

        try {
          localStorage.setItem(cacheKey, JSON.stringify(payload));
        } catch {}

        return payload;
      }
    }
  } catch (err) {
    console.warn('Secondary fallback failed, trying backend proxy...', err);
  }

  // Step 3: Try internal backend proxy
  try {
    const backendRes = await fetch(`/api/rates?base=${base}`);
    if (backendRes.ok) {
      const backendData = await backendRes.json();
      if (backendData && backendData.rates) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(backendData));
        } catch {}
        return backendData;
      }
    }
  } catch (err) {
    console.warn('Backend proxy unreachable, falling back to offline cache...', err);
  }

  // Step 4: Fallback to Offline Cached Data in LocalStorage
  const cachedStr = localStorage.getItem(cacheKey);
  if (cachedStr) {
    try {
      const cachedData: ExchangeRatesData = JSON.parse(cachedStr);
      cachedData.isOffline = true;
      cachedData.provider = `Offline Grimoire (Cached ${new Date(cachedData.cachedAt || Date.now()).toLocaleTimeString()})`;
      return cachedData;
    } catch {
      // JSON parse error
    }
  }

  // Step 5: If nothing cached for this base, derive from USD cache or OFFLINE_FALLBACK_RATES
  const usdCacheStr = localStorage.getItem(`${STORAGE_KEYS.RATES_CACHE_PREFIX}USD`);
  let baseRates = OFFLINE_FALLBACK_RATES;
  if (usdCacheStr) {
    try {
      const usdCache = JSON.parse(usdCacheStr);
      if (usdCache.rates) baseRates = usdCache.rates;
    } catch {}
  }

  // Cross-rate calculation relative to chosen base
  const targetBaseRateInUsd = baseRates[base] || 1.0;
  const derivedRates: Record<string, number> = {};
  Object.keys(baseRates).forEach((code) => {
    derivedRates[code] = (baseRates[code] || 1.0) / targetBaseRateInUsd;
  });
  derivedRates[base] = 1.0;

  return {
    result: 'offline_derived',
    provider: 'Merlin\'s Ancient Alchemy (Offline Grimoire)',
    base_code: base,
    time_last_update_utc: new Date().toUTCString(),
    time_last_update_unix: Math.floor(Date.now() / 1000),
    rates: derivedRates,
    isOffline: true,
    cachedAt: Date.now(),
  };
}

/**
 * Load user's saved rate alerts
 */
export function getSavedAlerts(): RateAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ALERTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (a) => a && typeof a.baseCurrency === 'string' && typeof a.targetCurrency === 'string'
        );
      }
    }
  } catch {}
  return [
    {
      id: 'alert_default_1',
      baseCurrency: 'USD',
      targetCurrency: 'EUR',
      thresholdRate: 0.95,
      condition: 'ABOVE',
      isActive: true,
      isTriggered: false,
      createdAt: Date.now() - 86400000,
      note: 'Merlin Euro Guild buying target',
    },
    {
      id: 'alert_default_2',
      baseCurrency: 'USD',
      targetCurrency: 'JPY',
      thresholdRate: 155.0,
      condition: 'ABOVE',
      isActive: true,
      isTriggered: false,
      createdAt: Date.now() - 43200000,
      note: 'Sun Dragon Resistance Peak',
    },
  ];
}

/**
 * Save rate alerts to local storage
 */
export function saveAlerts(alerts: RateAlert[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
  } catch {}
}

/**
 * Check active alerts against latest exchange rates and trigger alert notifications
 */
export function checkRateAlerts(
  ratesData: ExchangeRatesData,
  currentAlerts: RateAlert[],
  onTrigger?: (triggeredAlert: RateAlert, currentRate: number) => void
): { updatedAlerts: RateAlert[]; triggeredCount: number } {
  if (!ratesData || !ratesData.rates) return { updatedAlerts: currentAlerts, triggeredCount: 0 };

  let triggeredCount = 0;
  const updatedAlerts = currentAlerts.map((alert) => {
    if (!alert.isActive) return alert;

    // Check if the current rates base matches or convert
    let currentRate = 0;
    if (ratesData.base_code === alert.baseCurrency) {
      currentRate = ratesData.rates[alert.targetCurrency];
    } else {
      // Calculate cross-rate: Target / Base
      const targetRateFromGlobalBase = ratesData.rates[alert.targetCurrency];
      const baseRateFromGlobalBase = ratesData.rates[alert.baseCurrency];
      if (baseRateFromGlobalBase && targetRateFromGlobalBase) {
        currentRate = targetRateFromGlobalBase / baseRateFromGlobalBase;
      }
    }

    if (!currentRate) return alert;

    const conditionMet =
      alert.condition === 'ABOVE'
        ? currentRate >= alert.thresholdRate
        : currentRate <= alert.thresholdRate;

    if (conditionMet && !alert.isTriggered) {
      triggeredCount++;
      playThresholdFanfare();
      triggerMagicSparks();

      // Show browser notification if allowed
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`⚡ Merlin Alert: ${alert.baseCurrency}/${alert.targetCurrency} Triggered!`, {
            body: `Rate has reached ${currentRate.toFixed(4)} (${alert.condition === 'ABOVE' ? '≥' : '≤'} ${alert.thresholdRate}). Note: ${alert.note || 'No note'}`,
            icon: 'favicon.ico',
          });
        } catch {}
      }

      if (onTrigger) {
        onTrigger(alert, currentRate);
      }

      return {
        ...alert,
        isTriggered: true,
        lastTriggeredAt: Date.now(),
      };
    }

    // Reset triggered state if condition is no longer met
    if (!conditionMet && alert.isTriggered) {
      return {
        ...alert,
        isTriggered: false,
      };
    }

    return alert;
  });

  if (triggeredCount > 0) {
    saveAlerts(updatedAlerts);
  }

  return { updatedAlerts, triggeredCount };
}

/**
 * Fetch currency and FX market news from free API sources with offline fallback
 */
export async function fetchFxNews(): Promise<NewsItem[]> {
  // Step 1: Try server-side live news aggregator
  try {
    const res = await fetch('/api/news');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(STORAGE_KEYS.SAVED_NEWS, JSON.stringify(data));
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend news proxy failed, trying public RSS-to-JSON fallback...', err);
  }

  // Step 2: Try public RSS to JSON free endpoint for Yahoo FX / ForexLive
  try {
    const rssUrls = [
      'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ffinance.yahoo.com%2Fnews%2Frssindex',
      'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.investing.com%2Frss%2Fforex.rss',
    ];

    for (const url of rssUrls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const json = await response.json();
          if (json && json.items && Array.isArray(json.items) && json.items.length > 0) {
            const parsed: NewsItem[] = json.items.slice(0, 12).map((item: { title: string; link: string; pubDate: string; description: string; author?: string }, index: number) => {
              const lower = (item.title + ' ' + (item.description || '')).toLowerCase();
              let sentiment: NewsItem['sentiment'] = 'NEUTRAL';
              if (lower.includes('surge') || lower.includes('rally') || lower.includes('high') || lower.includes('gain') || lower.includes('bullish') || lower.includes('soar')) {
                sentiment = 'BULLISH';
              } else if (lower.includes('fall') || lower.includes('plunge') || lower.includes('drop') || lower.includes('low') || lower.includes('bearish') || lower.includes('cut')) {
                sentiment = 'BEARISH';
              } else if (lower.includes('volatile') || lower.includes('swing') || lower.includes('rate decision') || lower.includes('inflation') || lower.includes('fed')) {
                sentiment = 'VOLATILE';
              }

              const currencies: string[] = [];
              ['USD', 'EUR', 'SGD', 'MYR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'].forEach((code) => {
                if (lower.includes(code.toLowerCase()) || lower.includes(code)) {
                  currencies.push(code);
                }
              });

              return {
                id: `rss_${index}_${Date.now()}`,
                title: item.title,
                link: item.link,
                pubDate: item.pubDate || new Date().toISOString(),
                description: item.description ? item.description.replace(/<[^>]*>?/gm, '').slice(0, 200) + '...' : 'Latest currency market development analyzed by the wizardry grimoire.',
                source: item.author || 'Forex Financial Wire',
                sentiment,
                currencies: currencies.length > 0 ? currencies : ['USD', 'EUR'],
                merlinWisdom: generateMerlinWisdom(item.title, sentiment),
              };
            });

            localStorage.setItem(STORAGE_KEYS.SAVED_NEWS, JSON.stringify(parsed));
            return parsed;
          }
        }
      } catch {}
    }
  } catch {}

  // Step 3: Check cached news in local storage
  const cachedNewsStr = localStorage.getItem(STORAGE_KEYS.SAVED_NEWS);
  if (cachedNewsStr) {
    try {
      const parsed = JSON.parse(cachedNewsStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {}
  }

  // Step 4: Rich Curated Merlin FX Wizard Dispatch (Guaranteed zero-failure fallback)
  const curatedFallback: NewsItem[] = [
    {
      id: 'news_curated_1',
      title: 'Federal Reserve Monetary Stance Holds Global Dollar In Arcane Equilibrium',
      link: 'https://www.federalreserve.gov/monetarypolicy.htm',
      pubDate: new Date(Date.now() - 3600000).toISOString(),
      description: 'US Treasury yields stabilize as central bankers evaluate inflation trajectories. Currency desks report balanced cross-border dollar liquidity across transatlantic corridors.',
      source: 'Merlin Treasury Chronicle',
      sentiment: 'BULLISH',
      currencies: ['USD', 'EUR', 'GBP'],
      merlinWisdom: 'The Greenback Scepter radiates steady warmth. Traders seeking transatlantic ventures shall find fortified support around sovereign pivot points.',
    },
    {
      id: 'news_curated_2',
      title: 'European Central Bank Monitors Eurozone Wage Indices Amid Industrial Rebound',
      link: 'https://www.ecb.europa.eu',
      pubDate: new Date(Date.now() - 7200000).toISOString(),
      description: 'ECB Governing Council remarks suggest watchful monetary prudence as service sector resilience offsets manufacturing variance across Germany and France.',
      source: 'Frankfurt Arcane Dispatch',
      sentiment: 'NEUTRAL',
      currencies: ['EUR', 'CHF', 'USD'],
      merlinWisdom: 'The Guilded Crown seeks calm waters. A patient alchemist watches the Frankfurt towers before committing large cross-continental reserves.',
    },
    {
      id: 'news_curated_3',
      title: 'Bank of Japan Navigates Yield Curve Adjustments as Yen Volatility Surges',
      link: 'https://www.boj.or.jp/en',
      pubDate: new Date(Date.now() - 14400000).toISOString(),
      description: 'Tokyo currency authorities observe rapid shifts in carry trade positioning as differential spreads contract between JGB benchmarks and Western debt instruments.',
      source: 'Pacific Meridian Wire',
      sentiment: 'VOLATILE',
      currencies: ['JPY', 'USD', 'AUD'],
      merlinWisdom: 'The Rising Sun Dragon stirs in its slumber. Swift currents await those trading the JPY corridors; hold your stop-loss enchantments close.',
    },
    {
      id: 'news_curated_4',
      title: 'Bank of England Balances Inflation Moderation with Sterling Sovereign Demand',
      link: 'https://www.bankofengland.co.uk',
      pubDate: new Date(Date.now() - 21600000).toISOString(),
      description: 'London foreign exchange desks report steady institutional inflows into gilt-backed assets as UK consumer price dynamics align with policy benchmarks.',
      source: 'Thames Royal Exchange',
      sentiment: 'BULLISH',
      currencies: ['GBP', 'EUR', 'USD'],
      merlinWisdom: 'The Sterling Lion roars with dignified vigor. Sterling-denominated shields offer dependable defense in volatile autumn tides.',
    },
    {
      id: 'news_curated_5',
      title: 'Commodity Currencies Rally as Global Trade Flows and Metal Demands Expand',
      link: 'https://www.rba.gov.au',
      pubDate: new Date(Date.now() - 28800000).toISOString(),
      description: 'Australian and Canadian dollars gain upward momentum supported by higher resource exports and sustained agricultural shipments across emerging markets.',
      source: 'Global Resource Oracle',
      sentiment: 'BULLISH',
      currencies: ['AUD', 'CAD', 'CNY'],
      merlinWisdom: 'The Golden Opal and Boreal Loonie draw strength from the earth\'s mineral veins. Alchemical prosperity flows to resource-linked troves.',
    },
    {
      id: 'news_curated_6',
      title: 'Monetary Authority of Singapore and Bank Negara Malaysia Maintain Strong Liquidity Reserves',
      link: 'https://www.mas.gov.sg',
      pubDate: new Date(Date.now() - 36000000).toISOString(),
      description: 'Singapore Dollar (SGD) and Malaysian Ringgit (MYR) trade in stable regional corridors amid robust Southeast Asian trade surplus and capital inflows.',
      source: 'ASEAN Alchemical Vault Gazette',
      sentiment: 'BULLISH',
      currencies: ['SGD', 'MYR', 'USD'],
      merlinWisdom: 'The Merlion Scepter and Hornbill Quill anchor cross-border commerce with serene stability across Southeast Asian trading routes.',
    },
  ];

  return curatedFallback;
}

function generateMerlinWisdom(title: string, sentiment: string): string {
  const proverbs = [
    'As the celestial stars align, currency currents flow toward disciplined treasuries.',
    'A wise wizard never puts all gold pieces into one cauldron; balance your currency talismans.',
    'When market tempests brew, patience and precise calculations transmute risk into fortune.',
    'The arcane runes reveal steady tides for vigilant traders observing sovereign pivot points.',
  ];
  const idx = Math.abs(title.length) % proverbs.length;
  return `${proverbs[idx]} (${sentiment} resonance detected)`;
}

/**
 * Safe mathematical evaluator for the enchanted FX calculator
 */
export function evaluateMathExpression(expr: string): number | null {
  try {
    if (!expr || typeof expr !== 'string') return null;
    let sanitized = expr.trim();
    if (!sanitized) return null;

    // Handle percentage expressions e.g. "100 + 10%" -> "100 + (100 * 0.1)"
    sanitized = sanitized.replace(/(\d+(?:\.\d+)?)\s*([+-])\s*(\d+(?:\.\d+)?)\s*%/g, '($1 $2 ($1 * $3 / 100))');
    // Handle "500 * 5%" -> "500 * (5 / 100)"
    sanitized = sanitized.replace(/(\d+(?:\.\d+)?)\s*([*/])\s*(\d+(?:\.\d+)?)\s*%/g, '($1 $2 ($3 / 100))');
    // Standalone percentages "50%" -> "(50/100)"
    sanitized = sanitized.replace(/(\d+(?:\.\d+)?)\s*%/g, '($1 / 100)');

    // Sanitize: allow only numbers, decimal points, +, -, *, /, (, ), and spaces
    sanitized = sanitized.replace(/[^0-9+\-*/().\s]/g, '');
    
    // Trim any trailing operator like "100 +" or "50 *" before evaluating
    sanitized = sanitized.replace(/[+\-*/\s.]+$/, '');
    if (!sanitized.trim()) return null;

    // Use Function constructor with strict sanitized string
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const result = new Function(`'use strict'; return (${sanitized})`)();
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return result;
    }
    return null;
  } catch {
    return null;
  }
}
