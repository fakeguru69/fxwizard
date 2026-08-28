import React from 'react';
import { Sparkles, LineChart, Wand2, BookOpen, Bell } from 'lucide-react';
import { playRuneClick } from '../services/sound';

export type NavTabType = 'converter' | 'charts' | 'calculator' | 'news' | 'alerts';

interface MobileBottomNavProps {
  activeTab: NavTabType;
  setActiveTab: (tab: NavTabType) => void;
  triggeredAlertsCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  triggeredAlertsCount,
}) => {
  const tabs = [
    { id: 'converter' as NavTabType, label: 'Transmute', icon: Sparkles },
    { id: 'charts' as NavTabType, label: 'Charts', icon: LineChart },
    { id: 'calculator' as NavTabType, label: 'Calc', icon: Wand2 },
    { id: 'news' as NavTabType, label: 'News', icon: BookOpen },
    { id: 'alerts' as NavTabType, label: 'Alerts', icon: Bell, badge: triggeredAlertsCount },
  ];

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-amber-500/20 px-2 py-1.5 shadow-2xl safe-area-pb"
    >
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`mobile-tab-${tab.id}`}
              onClick={() => {
                playRuneClick();
                setActiveTab(tab.id);
              }}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all select-none min-w-[56px] ${
                isActive
                  ? 'text-amber-300 font-bold bg-amber-500/10 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400 scale-110' : 'text-slate-400'}`} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white animate-pulse">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
