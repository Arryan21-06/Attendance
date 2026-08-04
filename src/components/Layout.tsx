import { useState } from 'react';
import { Calendar, BarChart2, Settings as SettingsIcon } from 'lucide-react';
import { clsx } from 'clsx';
import TodayTab from '../pages/TodayTab';
import StatsTab from '../pages/StatsTab';
import SettingsTab from '../pages/SettingsTab';

type Tab = 'today' | 'stats' | 'settings';

export default function Layout() {
  const [activeTab, setActiveTab] = useState<Tab>('today');

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative bg-white/30 backdrop-blur-sm shadow-xl overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center p-4 pt-safe shrink-0">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">AttendTrack</h1>
        <button 
          onClick={() => setActiveTab('settings')}
          className={clsx("p-2 rounded-full transition-colors", activeTab === 'settings' ? "bg-slate-200" : "hover:bg-white/50")}
        >
          <SettingsIcon className="w-6 h-6 text-slate-700" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+80px)] px-4">
        {activeTab === 'today' && <TodayTab />}
        {activeTab === 'stats' && <StatsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={() => setActiveTab('today')}
            className={clsx(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
              activeTab === 'today' ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Calendar className={clsx("w-6 h-6", activeTab === 'today' && "fill-slate-200")} />
            <span className="text-xs font-medium">Today</span>
          </button>
          
          <button
            onClick={() => setActiveTab('stats')}
            className={clsx(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
              activeTab === 'stats' ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <BarChart2 className={clsx("w-6 h-6", activeTab === 'stats' && "fill-slate-200")} />
            <span className="text-xs font-medium">Stats</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
