import { CurrencyInfo } from '../types';

export const CURRENCIES: CurrencyInfo[] = [
  // 4 Primary Starting Currencies & Major Pairs
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', region: 'Americas', alchemyTitle: 'The Sovereign Greenback', popular: true },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', region: 'Europe', alchemyTitle: 'The Guilded Crown', popular: true },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', region: 'Asia-Pacific', alchemyTitle: 'The Merlion Scepter', popular: true },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', region: 'Asia-Pacific', alchemyTitle: 'The Hornbill Quill', popular: true },

  // Major Popular Currencies
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', region: 'Europe', alchemyTitle: 'The Sterling Lion', popular: true },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', region: 'Asia-Pacific', alchemyTitle: 'The Rising Sun Dragon', popular: true },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', region: 'Europe', alchemyTitle: 'The Alpine Fortress', popular: true },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦', region: 'Americas', alchemyTitle: 'The Boreal Loonie', popular: true },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', region: 'Asia-Pacific', alchemyTitle: 'The Golden Opal', popular: true },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', region: 'Asia-Pacific', alchemyTitle: 'The Red Dragon Orb', popular: true },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', region: 'Asia-Pacific', alchemyTitle: 'The Vedic Lotus', popular: true },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿', region: 'Asia-Pacific', alchemyTitle: 'The Southern Kiwi', popular: true },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰', region: 'Asia-Pacific', alchemyTitle: 'The Harbor Pearl', popular: true },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', region: 'Europe', alchemyTitle: 'The Nordic Rune', popular: true },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴', region: 'Europe', alchemyTitle: 'The Fjord Crest', popular: true },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰', region: 'Europe', alchemyTitle: 'The Viking Shield', popular: true },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', region: 'Middle East & Africa', alchemyTitle: 'The Desert Mirage', popular: true },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦', region: 'Middle East & Africa', alchemyTitle: 'The Oasis Treasury', popular: true },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', region: 'Americas', alchemyTitle: 'The Amazonian Emerald', popular: true },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', flag: '🇲🇽', region: 'Americas', alchemyTitle: 'The Aztec Sunstone', popular: true },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', region: 'Middle East & Africa', alchemyTitle: 'The Diamond Shard', popular: true },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', region: 'Asia-Pacific', alchemyTitle: 'The Morning Calm', popular: true },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', region: 'Middle East & Africa', alchemyTitle: 'The Bosphorus Talon', popular: true },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱', region: 'Europe', alchemyTitle: 'The White Eagle', popular: true },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', region: 'Asia-Pacific', alchemyTitle: 'The Siamese Elephant', popular: true },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩', region: 'Asia-Pacific', alchemyTitle: 'The Nusantara Talisman', popular: false },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭', region: 'Asia-Pacific', alchemyTitle: 'The Pearl Archipelago', popular: false },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿', region: 'Europe', alchemyTitle: 'The Bohemian Crystal', popular: false },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', flag: '🇭🇺', region: 'Europe', alchemyTitle: 'The Magyar Relic', popular: false },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', flag: '🇮🇱', region: 'Middle East & Africa', alchemyTitle: 'The Solomon Seal', popular: false },
  { code: 'CLP', name: 'Chilean Peso', symbol: 'CLP$', flag: '🇨🇱', region: 'Americas', alchemyTitle: 'The Andean Copper', popular: false },
  { code: 'COP', name: 'Colombian Peso', symbol: 'COL$', flag: '🇨🇴', region: 'Americas', alchemyTitle: 'The Eldorado Gold', popular: false },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', flag: '🇪🇬', region: 'Middle East & Africa', alchemyTitle: 'The Pharaoh Scarab', popular: false },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QR', flag: '🇶🇦', region: 'Middle East & Africa', alchemyTitle: 'The Gulf Falcon', popular: false },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD', flag: '🇰🇼', region: 'Middle East & Africa', alchemyTitle: 'The Titan Vault', popular: true },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD', flag: '🇧🇭', region: 'Middle East & Africa', alchemyTitle: 'The Pearl Diver', popular: false },
  { code: 'OMR', name: 'Omani Rial', symbol: 'OMR', flag: '🇴🇲', region: 'Middle East & Africa', alchemyTitle: 'The Frankincense Censer', popular: false },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳', region: 'Asia-Pacific', alchemyTitle: 'The Ascending Dragon', popular: false },
  { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$', flag: '🇹🇼', region: 'Asia-Pacific', alchemyTitle: 'The Formosa Aegis', popular: false },
  { code: 'ARS', name: 'Argentine Peso', symbol: 'Arg$', flag: '🇦🇷', region: 'Americas', alchemyTitle: 'The Pampas Wind', popular: false },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/.', flag: '🇵🇪', region: 'Americas', alchemyTitle: 'The Inca Sun Glyph', popular: false },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', region: 'Middle East & Africa', alchemyTitle: 'The Niger Torrent', popular: false },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', region: 'Middle East & Africa', alchemyTitle: 'The Savannah Shield', popular: false },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', flag: '🇬🇭', region: 'Middle East & Africa', alchemyTitle: 'The Ashanti Stool', popular: false },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰', region: 'Asia-Pacific', alchemyTitle: 'The Indus Stream', popular: false },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩', region: 'Asia-Pacific', alchemyTitle: 'The Bengal Tiger', popular: false },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', flag: '🇷🇴', region: 'Europe', alchemyTitle: 'The Carpathian Guard', popular: false },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', flag: '🇧🇬', region: 'Europe', alchemyTitle: 'The Balkan Rose', popular: false },
  { code: 'ISK', name: 'Icelandic Krona', symbol: 'kr', flag: '🇮🇸', region: 'Europe', alchemyTitle: 'The Geyser Flame', popular: false },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', flag: '🇭🇷', region: 'Europe', alchemyTitle: 'The Adriatic Mist', popular: false },
];

export const DEFAULT_VIEW_CURRENCIES = ['USD', 'EUR', 'SGD', 'MYR'];

export const CURRENCY_MAP = new Map<string, CurrencyInfo>(
  CURRENCIES.map((c) => [c.code, c])
);

export function getCurrencyInfo(code?: string | null): CurrencyInfo {
  if (!code || typeof code !== 'string') {
    return {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      flag: '🇺🇸',
      region: 'Americas',
      alchemyTitle: 'The Sovereign Greenback',
      popular: true,
    };
  }
  const cleanCode = code.trim().toUpperCase();
  return (
    CURRENCY_MAP.get(cleanCode) || {
      code: cleanCode,
      name: cleanCode,
      symbol: cleanCode,
      flag: '🌐',
      region: 'Americas',
      alchemyTitle: `The ${cleanCode} Orb`,
    }
  );
}
