import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { XMLParser } from 'fast-xml-parser';

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn('Failed to initialize GoogleGenAI client:', e);
    }
  }
  return geminiClient;
}

// In-memory cache for news & rates to reduce external load
interface RatesCacheEntry {
  timestamp: number;
  data: unknown;
}
const ratesCache = new Map<string, RatesCacheEntry>();
let cachedNews: unknown[] | null = null;
let newsCacheTime = 0;

// API Route: Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), magic: 'active' });
});

// API Route: Rates Proxy
app.get('/api/rates', async (req, res) => {
  const base = ((req.query.base as string) || 'USD').toUpperCase();
  const cached = ratesCache.get(base);
  const now = Date.now();

  // Return cached if fresh (10 mins)
  if (cached && now - cached.timestamp < 10 * 60 * 1000) {
    return res.json(cached.data);
  }

  try {
    const apiRes = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    if (apiRes.ok) {
      const data = await apiRes.json();
      ratesCache.set(base, { timestamp: now, data });
      return res.json(data);
    }
  } catch (err) {
    console.warn('Backend failed to fetch from open.er-api:', err);
  }

  // Fallback to cached even if older
  if (cached) {
    return res.json(cached.data);
  }

  res.status(500).json({ error: 'Failed to fetch real-time rates from external oracle' });
});

// API Route: Live FX News Aggregator
app.get('/api/news', async (_req, res) => {
  const now = Date.now();
  if (cachedNews && now - newsCacheTime < 15 * 60 * 1000) {
    return res.json(cachedNews);
  }

  try {
    // Try fetching from Forex RSS feeds
    const feeds = [
      'https://www.investing.com/rss/forex.rss',
      'https://finance.yahoo.com/news/rssindex',
    ];

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });

    for (const feedUrl of feeds) {
      try {
        const response = await fetch(feedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; FXWizardNewsBot/1.0)',
            Accept: 'application/rss+xml, application/xml, text/xml',
          },
          signal: AbortSignal.timeout(4000),
        });

        if (response.ok) {
          const xmlText = await response.text();
          const parsed = parser.parse(xmlText);
          const rawItems = parsed?.rss?.channel?.item || parsed?.feed?.entry;

          if (Array.isArray(rawItems) && rawItems.length > 0) {
            const articles = rawItems.slice(0, 10).map((item: Record<string, string>, idx: number) => {
              const title = item.title || 'Global Currency Market Movement';
              const link = item.link || item.guid || '#';
              const pubDate = item.pubDate || new Date().toISOString();
              const description = (item.description || item.summary || '')
                .replace(/<[^>]*>?/gm, '')
                .slice(0, 220);

              const lower = `${title} ${description}`.toLowerCase();
              let sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILE' = 'NEUTRAL';
              if (lower.includes('surge') || lower.includes('rally') || lower.includes('gain') || lower.includes('jump') || lower.includes('bull')) {
                sentiment = 'BULLISH';
              } else if (lower.includes('plunge') || lower.includes('drop') || lower.includes('fall') || lower.includes('sink') || lower.includes('bear')) {
                sentiment = 'BEARISH';
              } else if (lower.includes('inflation') || lower.includes('fed') || lower.includes('rate') || lower.includes('volatile') || lower.includes('swing')) {
                sentiment = 'VOLATILE';
              }

              const currencies: string[] = [];
              ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BTC', 'ETH'].forEach((c) => {
                if (lower.includes(c.toLowerCase()) || lower.includes(c)) {
                  currencies.push(c);
                }
              });

              return {
                id: `server_news_${idx}_${Date.now()}`,
                title,
                link,
                pubDate,
                description: description ? `${description}...` : 'Market intelligence and currency valuation insights.',
                source: 'Global FX Meridian Feed',
                sentiment,
                currencies: currencies.length > 0 ? currencies : ['USD', 'EUR'],
                merlinWisdom: `Merlin's Divination: The cosmic balance shifts. Align your positions with disciplined risk barriers.`,
              };
            });

            cachedNews = articles;
            newsCacheTime = now;
            return res.json(articles);
          }
        }
      } catch {
        // Feed fetch attempt failed, try next
      }
    }
  } catch (e) {
    console.warn('News aggregator fallback triggered:', e);
  }

  // Fallback to high-quality curated FX chronicle
  const curated = [
    {
      id: 'news_1',
      title: 'US Dollar Consolidates as Global Central Banks Calibrate Monetary Horizons',
      link: 'https://www.federalreserve.gov',
      pubDate: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      description: 'Foreign exchange liquidity pools remain robust with institutional dollar demand anchored across transatlantic sovereign debt auctions.',
      source: 'Merlin Treasury Gazette',
      sentiment: 'BULLISH',
      currencies: ['USD', 'EUR', 'GBP'],
      merlinWisdom: 'The Greenback Scepter radiates steady aura. Cross-continental trades find firm ground at primary support thresholds.',
    },
    {
      id: 'news_2',
      title: 'European Central Bank Assesses Inflation Equilibrium Across Major Corridors',
      link: 'https://www.ecb.europa.eu',
      pubDate: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      description: 'Eurozone industrial output and service indices balance interest rate projections as the Euro stabilizes against major trading pairs.',
      source: 'Frankfurt Arcane Dispatch',
      sentiment: 'NEUTRAL',
      currencies: ['EUR', 'CHF', 'USD'],
      merlinWisdom: 'The Guilded Crown seeks calm harbors. A patient alchemist observes before deploying heavy capital spells.',
    },
    {
      id: 'news_3',
      title: 'Yen and Asian Currencies React to Shifting Carry Trade Dynamics and Export Flow',
      link: 'https://www.boj.or.jp/en',
      pubDate: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      description: 'Tokyo market desks report heightened volume across Asian currency crosses as international investors adjust macro positioning.',
      source: 'Pacific Meridian Wire',
      sentiment: 'VOLATILE',
      currencies: ['JPY', 'USD', 'AUD', 'SGD'],
      merlinWisdom: 'The Rising Sun Dragon stirs in mystical currents. Guard your leverage when trading fast JPY eddies.',
    },
    {
      id: 'news_4',
      title: 'Commodity Currencies Surge Following Strong Resource Demand and Energy Trades',
      link: 'https://www.rba.gov.au',
      pubDate: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      description: 'Australian and Canadian dollars rally on sustained commodity pricing and resilient agricultural trade partnerships.',
      source: 'Global Alchemical Resource',
      sentiment: 'BULLISH',
      currencies: ['AUD', 'CAD', 'NZD'],
      merlinWisdom: 'The Golden Opal and Boreal Loonie draw strength from fertile planetary strata. Auspicious winds favor resource troves.',
    },
  ];

  cachedNews = curated;
  newsCacheTime = now;
  res.json(curated);
});

// API Route: Merlin's Arcane Oracle (AI-powered or heuristic market divination)
app.post('/api/merlin/oracle', async (req, res) => {
  const { pair, rate, baseCurrency, targetCurrency } = req.body;
  const pairName = pair || `${baseCurrency || 'USD'}/${targetCurrency || 'EUR'}`;
  const currentRateNum = Number(rate) || 1.0;

  const client = getGeminiClient();
  if (client) {
    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `You are Merlin the Magician, an ancient archmage and legendary financial sorcerer of the FX Wizard realm.
Provide a mystical, engaging, and wise financial divination for the currency pair "${pairName}" (current conversion rate: ${currentRateNum}).
Tone: Wise, arcane, mythical, eloquent, yet practical for currency traders and travelers.
Return JSON with this exact schema:
{
  "pair": "${pairName}",
  "currentRate": ${currentRateNum},
  "sentiment": "Bullish Sovereign | Bearish Tides | Arcane Balance | Volatile Storm",
  "arcaneProphecy": "2-3 sentences of Merlin's mystical prophecy regarding this currency pair",
  "elementalForce": "Aether | Ignis | Terra | Aquila | Tempestas",
  "volatilityIndex": "Calm Breeze | Chirping Storm | Tempestuous Maelstrom",
  "luckySpells": ["Spell name 1: short trading wisdom", "Spell name 2: short risk hedging advice"]
}`,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json(parsed);
      }
    } catch (err) {
      console.warn('Gemini Oracle invocation failed, falling back to Merlin Grimoire:', err);
    }
  }

  // Enchanted Algorithmic Grimoire fallback
  const elements = ['Aether', 'Ignis (Fire)', 'Terra (Earth)', 'Aquila (Air)', 'Aura Aurum'];
  const volatilities: Array<'Calm Breeze' | 'Chirping Storm' | 'Tempestuous Maelstrom'> = [
    'Calm Breeze',
    'Chirping Storm',
    'Tempestuous Maelstrom',
  ];

  const seed = (pairName.charCodeAt(0) + pairName.charCodeAt(pairName.length - 1)) % 3;
  const element = elements[seed % elements.length];
  const vol = volatilities[seed];

  const prophecies = [
    `The planetary alignment bestows steadfast fortitude upon ${pairName}. As celestial currents converge around ${currentRateNum.toFixed(4)}, the alchemical forces suggest a fortified consolidation before the next seasonal migration.`,
    `Gaze into the scrying pool: ${pairName} dances upon the crest of the ancient tide. Transmutation occurs where patience meets calculated precision; beware the siren call of sudden volatility.`,
    `The arcane runes glow with vibrant amber essence. Traders seeking safe passage through ${pairName} corridors should anchor their treasuries with balanced stop-spells.`,
  ];

  res.json({
    pair: pairName,
    currentRate: currentRateNum,
    sentiment: seed === 0 ? 'Bullish Sovereign' : seed === 1 ? 'Arcane Balance' : 'Volatile Storm',
    arcaneProphecy: prophecies[seed],
    elementalForce: element,
    volatilityIndex: vol,
    luckySpells: [
      'Alchemical Aegis: Set a strict stop-loss rune at 1.5% below key support.',
      'Sovereign Patience: Avoid chasing sudden lightning spikes during low-liquidity witching hours.',
    ],
  });
});

// Vite & Static Serving Configuration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🧙 Merlin FX Wizard server conjured on http://localhost:${PORT}`);
  });
}

startServer();
