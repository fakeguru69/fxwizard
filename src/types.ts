export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  region: 'Americas' | 'Europe' | 'Asia-Pacific' | 'Middle East & Africa';
  alchemyTitle?: string;
  popular?: boolean;
}

export interface ExchangeRatesData {
  result: string;
  provider: string;
  base_code: string;
  time_last_update_utc: string;
  time_next_update_utc?: string;
  time_last_update_unix: number;
  rates: Record<string, number>;
  isOffline?: boolean;
  cachedAt?: number;
}

export interface RateAlert {
  id: string;
  baseCurrency: string;
  targetCurrency: string;
  thresholdRate: number;
  condition: 'ABOVE' | 'BELOW';
  isActive: boolean;
  isTriggered: boolean;
  createdAt: number;
  lastTriggeredAt?: number;
  note?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILE';
  currencies: string[];
  merlinWisdom?: string;
}

export interface MerlinDivination {
  pair: string;
  currentRate: number;
  sentiment: string;
  arcaneProphecy: string;
  elementalForce: string; // 'Aether', 'Ignis', 'Terra', 'Aquila'
  volatilityIndex: 'Calm Breeze' | 'Chirping Storm' | 'Tempestuous Maelstrom';
  luckySpells: string[];
}
