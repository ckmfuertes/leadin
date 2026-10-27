import { useState, useEffect } from 'react';
import { Settings, Briefcase, ExternalLink } from 'lucide-react';
import { SettingsTab } from '../../src/components/SettingsTab';
import { TrackerTab } from '../../src/components/TrackerTab';
import type { LeadInSettings } from '../../src/types';
import { loadAllSettings, saveAllSettings } from '../../src/lib/storage';

function App() {
  // Set up states
  const [activeTab, setActiveTab] = useState<'tracker' | 'settings'>('tracker');
  const [settings, setSettings] = useState<LeadInSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted settings on mount
  useEffect(() => {
    async function init() {
      try {
        const loaded = await loadAllSettings();
        setSettings(loaded);

        // If user hasn't configured webhook or resume yet, default to Settings tab
        const isConfigured = loaded.webhookUrl.trim() !== '' && loaded.resumeText.trim() !== '';
        if (!isConfigured) {
          setActiveTab('settings');
        }
      } catch (err) {
        console.error('Failed to load storage:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Save settings handler
  const handleSaveSettings = async (newSettings: LeadInSettings) => {
    await saveAllSettings(newSettings);
    setSettings(newSettings);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="w-[460px] h-[580px] bg-[#f8fafc] flex items-center justify-center text-slate-400 text-xs font-medium">
        Loading LeadIn...
      </div>
    );
  }

  return (
    <div className="w-[460px] h-[580px] bg-[#f8fafc] text-slate-800 flex flex-col font-sans select-none antialiased">
      {/* Top Header */}
      <header className="px-5 pt-4 pb-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <img src="/icon.svg" alt="LeadIn Logo" className="w-8 h-8 rounded-xl shadow-md shadow-teal-500/20 object-contain" />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">
                LeadIn
              </h1>
              {settings?.jobBoardUrl && (
                <a
                  href={settings.jobBoardUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Open Job Board"
                  className="text-slate-400 hover:text-teal-600 transition"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-normal mt-0.5">
              AI Job Tracker
            </p>
          </div>
        </div>

        {/* Tactile Capsule Tabs */}
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
          <TrackerTab 
            settings={settings} 
            onNavigateToSettings={() => setActiveTab('settings')} 
          />
        ) : (
          <SettingsTab initialSettings={settings} onSave={handleSaveSettings} />
        )}
      </main>
    </div>
  );
}

export default App;
