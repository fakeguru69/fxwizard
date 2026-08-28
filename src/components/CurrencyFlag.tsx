import React, { useState } from 'react';

// ISO 3166-1 alpha-2 country codes for currencies
export const CURRENCY_COUNTRY_CODE_MAP: Record<string, string> = {
  USD: 'us',
  EUR: 'eu',
  SGD: 'sg',
  MYR: 'my',
  GBP: 'gb',
  JPY: 'jp',
  CHF: 'ch',
  CAD: 'ca',
  AUD: 'au',
  CNY: 'cn',
  INR: 'in',
  NZD: 'nz',
  HKD: 'hk',
  SEK: 'se',
  NOK: 'no',
  DKK: 'dk',
  AED: 'ae',
  SAR: 'sa',
  BRL: 'br',
  MXN: 'mx',
  ZAR: 'za',
  KRW: 'kr',
  TRY: 'tr',
  PLN: 'pl',
  THB: 'th',
  IDR: 'id',
  PHP: 'ph',
  CZK: 'cz',
  HUF: 'hu',
  ILS: 'il',
  CLP: 'cl',
  COP: 'co',
  EGP: 'eg',
  QAR: 'qa',
  KWD: 'kw',
  BHD: 'bh',
  OMR: 'om',
  VND: 'vn',
  TWD: 'tw',
  ARS: 'ar',
  PEN: 'pe',
  NGN: 'ng',
  KES: 'ke',
  GHS: 'gh',
  PKR: 'pk',
  BDT: 'bd',
  RON: 'ro',
  BGN: 'bg',
  ISK: 'is',
  HRK: 'hr',
};

interface CurrencyFlagProps {
  currencyCode: string;
  fallbackEmoji?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const CurrencyFlag: React.FC<CurrencyFlagProps> = ({
  currencyCode,
  fallbackEmoji,
  className = '',
  size = 'md',
}) => {
  const [hasError, setHasError] = useState(false);
  const countryCode = CURRENCY_COUNTRY_CODE_MAP[currencyCode?.toUpperCase()] || currencyCode?.slice(0, 2).toLowerCase();

  const sizeClasses = {
    xs: 'w-4 h-3 rounded-[3px]',
    sm: 'w-5 h-3.5 rounded-[4px]',
    md: 'w-7 h-5 rounded-[5px]',
    lg: 'w-8 h-6 rounded-[6px]',
    xl: 'w-10 h-7.5 rounded-[7px]',
  };

  const emojiSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  if (!countryCode || hasError) {
    return (
      <span 
        className={`inline-flex items-center justify-center select-none ${emojiSizes[size]} ${className}`}
        role="img"
        aria-label={`${currencyCode} flag`}
      >
        {fallbackEmoji || '🌐'}
      </span>
    );
  }

  // Flag image from CDN with crisp scaling
  const flagUrl = `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;

  return (
    <div 
      className={`inline-flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm border border-slate-700/60 bg-slate-800 ${sizeClasses[size]} ${className}`}
    >
      <img
        src={flagUrl}
        alt={`${currencyCode} flag`}
        className="w-full h-full object-cover object-center select-none"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </div>
  );
};
