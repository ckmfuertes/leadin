import { useState } from 'react';
import { Target, Settings, Briefcase } from 'lucide-react';
import { SettingsTab } from '../../src/components/SettingsTab';
import type { LeadInSettings } from '../../src/types';

function App() {
  const [activeTab, setActiveTab] = useState<'tracker' | 'settings'>('settings');

  const handleSaveSettings = (settings: LeadInSettings) => {
    console.log('Settings to save:', settings);
  };

  return (
    <div className="w-[430px] h-[550px] bg-[#f8fafc] text-slate-800 flex flex-col font-sans select-none antialiased">
      {/* Top Header */}
      <header className="px-5 pt-4 pb-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <Target className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">
              LeadIn
            </h1>
            <p className="text-[11px] text-slate-400 font-normal mt-0.5">
              AI Job Tracker
            </p>
          </div>
        </div>

        {/* Tactile Capsule Tabs (like Peek) */}
        <nav className="flex items-center bg-slate-200/60 p-1 rounded-full border border-slate-200/50">
          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer ${
              activeTab === 'tracker'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Tracker</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-5 pb-5 pt-1">
        {activeTab === 'tracker' ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 mb-3">
              <Briefcase className="w-6 h-6 stroke-[1.75]" />
            </div>
            <h3 className="text-xs font-semibold text-slate-700">No Job Selected</h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[240px] leading-relaxed">
              Highlight job text on any webpage and click LeadIn to evaluate fit.
            </p>
          </div>
        ) : (
          <SettingsTab onSave={handleSaveSettings} />
        )}
      </main>
    </div>
  );
}

export default App;
