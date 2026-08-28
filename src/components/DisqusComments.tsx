import React, { useState } from 'react';
import { MessageSquare, MessageCircle, ChevronDown, ChevronUp, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';

interface DisqusCommentsProps {
  currentLocation?: { id: string; name: string };
  shortname?: string;
  id?: string;
  title?: string;
  className?: string;
}

export const DisqusComments: React.FC<DisqusCommentsProps> = ({ 
  currentLocation,
  shortname = 'totoro-2',
  id = 'fx-wizard-community',
  title = 'FX Wizard Community Discussion',
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const targetId = currentLocation?.id || id;
  const targetTitle = currentLocation?.name || title;

  const embedSrc = `/disqus-embed.html?shortname=${encodeURIComponent(shortname)}&id=${encodeURIComponent(targetId)}&title=${encodeURIComponent(targetTitle)}`;

  return (
    <section className={`rounded-3xl p-4 sm:p-6 border border-slate-800 bg-slate-900/90 shadow-xl flex flex-col gap-4 ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-300">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white font-serif">Community Discussion & Prophecies</h2>
            <p className="text-xs text-white font-medium">Share FX insights, travel tips, and currency transmutation tactics</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <a
            href={`https://${shortname}.disqus.com`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Disqus ({shortname})</span>
            <ExternalLink className="w-3 h-3 text-white" />
          </a>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-full hover:bg-slate-800 text-white hover:text-amber-300 transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="min-h-[380px] relative flex flex-col gap-2.5">
          <div className="bg-slate-950 rounded-2xl p-2 border border-slate-800 overflow-hidden shadow-inner">
            <iframe
              key={`${targetId}-${reloadKey}`}
              src={embedSrc}
              title={`Disqus Comments for ${targetTitle}`}
              className="w-full min-h-[420px] md:min-h-[500px] border-0 bg-slate-950 text-white"
              loading="lazy"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-white px-1 font-mono">
            <span className="flex items-center gap-1 text-white">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Disqus Discussion Oracle (US English)
            </span>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="flex items-center gap-1 hover:text-amber-300 transition-colors cursor-pointer text-white"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Frame</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
