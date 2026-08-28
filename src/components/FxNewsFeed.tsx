import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock,
  Filter,
  Globe,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { NewsItem } from '../types';
import { playRuneClick, playSpellChime } from '../services/sound';

interface FxNewsFeedProps {
  news: NewsItem[];
  isLoading: boolean;
  onRefreshNews: () => void;
  initialLimit?: number;
}

export const FxNewsFeed: React.FC<FxNewsFeedProps> = ({
  news,
  isLoading,
  onRefreshNews,
  initialLimit = 4,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('ALL');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const currencyFilters = ['ALL', 'USD', 'EUR', 'SGD', 'MYR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];
  const sentimentFilters = ['ALL', 'BULLISH', 'BEARISH', 'VOLATILE', 'NEUTRAL'];

  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      if (!item) return false;
      const title = item.title || '';
      const desc = item.description || '';
      const source = item.source || '';
      const search = (searchTerm || '').toLowerCase();

      const matchesSearch =
        !search ||
        title.toLowerCase().includes(search) ||
        desc.toLowerCase().includes(search) ||
        source.toLowerCase().includes(search);

      const currencies = Array.isArray(item.currencies) ? item.currencies : [];
      const matchesCurrency =
        selectedCurrency === 'ALL' ||
        currencies.includes(selectedCurrency) ||
        title.toUpperCase().includes(selectedCurrency);

      const matchesSentiment =
        selectedSentiment === 'ALL' || item.sentiment === selectedSentiment;

      return matchesSearch && matchesCurrency && matchesSentiment;
    });
  }, [news, searchTerm, selectedCurrency, selectedSentiment]);

  // Display top 4 by default unless expanded
  const displayedNews = useMemo(() => {
    if (isExpanded) {
      return filteredNews;
    }
    return filteredNews.slice(0, initialLimit);
  }, [filteredNews, isExpanded, initialLimit]);

  const hasMoreNews = filteredNews.length > initialLimit;
  const remainingCount = Math.max(0, filteredNews.length - initialLimit);

  const getSentimentBadge = (sentiment: NewsItem['sentiment']) => {
    switch (sentiment) {
      case 'BULLISH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Bullish Wind</span>
          </span>
        );
      case 'BEARISH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40">
            <TrendingDown className="w-3 h-3 text-rose-400" />
            <span>Bearish Tide</span>
          </span>
        );
      case 'VOLATILE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
            <Activity className="w-3 h-3 text-amber-400" />
            <span>Volatile Tempest</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
            <Globe className="w-3 h-3 text-slate-400" />
            <span>Neutral Stance</span>
          </span>
        );
    }
  };

  return (
    <div id="fx-news-feed" className="space-y-6">
      
      {/* Feed Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-amber-200 font-serif flex items-center gap-2">
              <span>📜 Merlin's Global FX Chronicle</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Top {Math.min(initialLimit, filteredNews.length)} of {filteredNews.length}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time currency intelligence and macroeconomic dispatches from free global market oracles
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasMoreNews && (
            <button
              onClick={() => {
                playRuneClick();
                setIsExpanded(!isExpanded);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-200 text-xs font-semibold shadow-sm transition-all"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Show Top 4 Only</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>See More (+{remainingCount})</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => {
              playSpellChime();
              onRefreshNews();
            }}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Scanning...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          
          {/* Search Input */}
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search FX dispatches by keyword, central bank, rate..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Sentiment Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            <select
              value={selectedSentiment}
              onChange={(e) => {
                playRuneClick();
                setSelectedSentiment(e.target.value);
              }}
              className="w-full sm:w-auto py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="ALL">All Sentiments</option>
              <option value="BULLISH">Bullish Only</option>
              <option value="BEARISH">Bearish Only</option>
              <option value="VOLATILE">Volatile Only</option>
              <option value="NEUTRAL">Neutral Only</option>
            </select>
          </div>
        </div>

        {/* Currency Tags Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[11px] text-slate-400 mr-1 whitespace-nowrap">Currencies:</span>
          {currencyFilters.map((code) => (
            <button
              key={code}
              onClick={() => {
                playRuneClick();
                setSelectedCurrency(code);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                selectedCurrency === code
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* News Articles Grid (Top 4 by default) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedNews.map((item) => (
          <div
            key={item.id}
            id={`news-card-${item.id}`}
            className="flex flex-col justify-between p-5 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all shadow-md group"
          >
            <div className="space-y-3">
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getSentimentBadge(item.sentiment)}
                  <span className="text-[11px] text-slate-400 font-mono font-medium">
                    {item.source}
                  </span>
                </div>

                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </span>
              </div>

              {/* Title */}
              <h3 className="text-sm md:text-base font-bold text-slate-100 group-hover:text-amber-200 transition-colors leading-snug">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                {item.description}
              </p>

              {/* Merlin's Arcane Take */}
              {item.merlinWisdom && (
                <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-indigo-200 italic font-serif">
                  ✨ <span className="font-bold font-sans not-italic text-amber-300">Merlin's Divination:</span> {item.merlinWisdom}
                </div>
              )}
            </div>

            {/* Card Footer: Currency tags & External Link */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1">
                {item.currencies.map((c) => (
                  <span
                    key={c}
                    className="px-1.5 py-0.5 rounded bg-slate-950 text-[10px] font-mono text-slate-400 border border-slate-800"
                  >
                    {c}
                  </span>
                ))}
              </div>

              <a
                href={item.link}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                <span>Read Dispatch</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}

        {filteredNews.length === 0 && (
          <div className="col-span-full p-12 text-center text-slate-400 rounded-3xl bg-slate-900 border border-slate-800">
            <BookOpen className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
            <p className="text-sm font-bold text-slate-300">No dispatches match your query.</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting your filters or search keywords.</p>
          </div>
        )}
      </div>

      {/* See More / Show Less Bottom Banner */}
      {hasMoreNews && (
        <div className="flex justify-center pt-2">
          <button
            id="see-more-news-btn"
            onClick={() => {
              playSpellChime();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 hover:from-slate-850 hover:to-slate-850 border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:text-amber-200 text-xs sm:text-sm font-bold shadow-lg shadow-black/40 transition-all active:scale-98 group"
          >
            <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>
              {isExpanded
                ? 'Collapse Dispatches (Show Top 4)'
                : `See More Dispatches (${remainingCount} More)`}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-amber-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-amber-400" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};
