import { useState } from 'react';
import { CalendarDays, BarChart2, Settings as SettingsIcon, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';
import TodayTab from '../pages/TodayTab';
import StatsTab from '../pages/StatsTab';
import SettingsTab from '../pages/SettingsTab';
import CalendarTab from '../pages/CalendarTab';

type Tab = 'today' | 'stats' | 'calendar' | 'settings';

const TABS: { id: Tab; label: string; icon: React.ReactNode; activeIcon: React.ReactNode }[] = [
  {
    id: 'today',
    label: 'Today',
    icon: <BookOpen className="w-5 h-5" />,
    activeIcon: <BookOpen className="w-5 h-5 fill-slate-200" />,
  },
  {
    id: 'stats',
    label: 'Stats',
    icon: <BarChart2 className="w-5 h-5" />,
    activeIcon: <BarChart2 className="w-5 h-5 fill-slate-200" />,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: <CalendarDays className="w-5 h-5" />,
    activeIcon: <CalendarDays className="w-5 h-5 fill-slate-200" />,
  },
];

export default function Layout() {
  const [activeTab, setActiveTab] = useState<Tab>('today');

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative bg-white/30 backdrop-blur-sm shadow-xl overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 pt-safe shrink-0 border-b border-white/30 bg-white/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shadow-sm">
            <CalendarDays className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">AttendTrack</h1>
        </div>
        <button
          onClick={() => setActiveTab('settings')}
          className={clsx(
            "p-2 rounded-full transition-colors",
            activeTab === 'settings' ? "bg-slate-200 text-slate-900" : "text-slate-600 hover:bg-white/60"
          )}
          aria-label="Settings"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+72px)] px-4">
        {activeTab === 'today' && <TodayTab />}
        {activeTab === 'stats' && <StatsTab />}
        {activeTab === 'calendar' && <CalendarTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white/85 backdrop-blur-md border-t border-slate-200/60 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex justify-around items-center h-16">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200",
                activeTab === tab.id
                  ? "text-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {activeTab === tab.id ? tab.activeIcon : tab.icon}
              <span className={clsx(
                "text-[10px] font-semibold uppercase tracking-wider transition-all",
                activeTab === tab.id ? "text-slate-900" : "text-slate-400"
              )}>
                {tab.label}
              </span>
              {/* Active indicator dot */}
              {activeTab === tab.id && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-slate-800" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
