import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Settings as SettingsIcon, 
  Plus, 
  Droplets, 
  Info,
  ChevronRight,
  ShieldCheck,
  Lock,
  List,
  Activity,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isSameDay, parseISO, differenceInDays } from 'date-fns';
import { CycleEntry } from './lib/db';

import { useCycle } from './hooks/useCycle';
import { Calendar } from './components/Calendar';
import { Dashboard } from './components/Dashboard';
import { QuickLog } from './components/QuickLog';
import { Education } from './components/Education';
import { Onboarding } from './components/Onboarding';
import { Settings } from './components/Settings';
import { LockScreen } from './components/LockScreen';
import { PredictionExplanation } from './components/PredictionExplanation';
import { SymptomCorrelationHeatmap } from './components/SymptomCorrelationHeatmap';
import { PhaseBasedTips } from './components/PhaseBasedTips';
import { DailyLogs } from './components/DailyLogs';
import { Reports } from './components/Reports';
import { HabitsPage } from './components/HabitsPage';
import { generateFakeEntries } from './lib/decoy';
import { cn } from './lib/utils';
import { getCycleDay, getStatusMessage, isDateInPeriod, getCyclePhase } from './lib/predictions';

export default function App() {
  const { 
    entries, 
    settings, 
    predictions, 
    loading, 
    addEntry, 
    updateEntry, 
    updateSettings, 
    clearData 
  } = useCycle();

  const [activeTab, setActiveTab] = useState<'home' | 'reports' | 'habits'>('home');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isEducationOpen, setIsEducationOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isDecoyMode, setIsDecoyMode] = useState(false);
  const [isExitingDecoy, setIsExitingDecoy] = useState(false);
  const [decoyEntries, setDecoyEntries] = useState<CycleEntry[]>([]);

  // Apply theme and accent color
  React.useEffect(() => {
    const root = window.document.documentElement;
    
    // Handle dark mode
    const isDark = 
      settings.theme === 'dark' || 
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Handle accent color
    root.classList.remove('theme-terracotta', 'theme-sage', 'theme-lavender', 'theme-ocean');
    if (settings.accentColor && settings.accentColor !== 'terracotta') {
      root.classList.add(`theme-${settings.accentColor}`);
    }
  }, [settings.theme, settings.accentColor]);

  // Initial lock check
  React.useEffect(() => {
    if (settings.isAppLocked) {
      setIsLocked(true);
    }
  }, [settings.isAppLocked]);

  // Check for Quick Log shortcut
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('quick-log') === 'true') {
      setIsLogOpen(true);
    }
  }, []);

  const handleUnlock = (isDecoy: boolean) => {
    setIsLocked(false);
    setIsExitingDecoy(false);
    setIsDecoyMode(isDecoy);
    if (isDecoy) {
      setDecoyEntries(generateFakeEntries());
    }
  };

  const currentEntries = isDecoyMode ? decoyEntries : entries;
  const selectedEntry = useMemo(() => {
    return currentEntries.find(e => isSameDay(parseISO(e.date), selectedDate));
  }, [currentEntries, selectedDate]);

  const cycleDay = useMemo(() => {
    return getCycleDay(new Date(), currentEntries);
  }, [currentEntries]);

  const isPeriodActive = useMemo(() => {
    return isDateInPeriod(new Date(), currentEntries);
  }, [currentEntries]);

  const phaseInfo = useMemo(() => {
    return getCyclePhase(new Date(), currentEntries, predictions);
  }, [currentEntries, predictions]);

  if (loading) return (
    <div className="fixed inset-0 bg-bg-warm flex items-center justify-center">
      <motion.div 
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="text-brand-500"
      >
        <Droplets size={48} />
      </motion.div>
    </div>
  );

  if (!settings.onboardingComplete) {
    return (
      <Onboarding 
        onComplete={(cycle, period, name) => {
          updateSettings({ 
            averageCycleLength: cycle, 
            averagePeriodLength: period, 
            onboardingComplete: true,
            name: name
          });
        }} 
      />
    );
  }

  if (isLocked) {
    return <LockScreen onUnlock={handleUnlock} settings={settings} isExitDecoyMode={isExitingDecoy} onUpdateSettings={updateSettings} />;
  }

  if (isDecoyMode) {
    return (
      <div className="min-h-screen bg-bg-warm flex flex-col max-w-md mx-auto relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full bg-red-500 text-white text-center py-1 text-xs z-[100]">
          Decoy Mode Active
        </div>
        <Calendar 
          entries={decoyEntries} 
          predictions={null}
          selectedDate={selectedDate} 
          onDateSelect={setSelectedDate} 
        />
        <button 
          onClick={() => {
            setIsExitingDecoy(true);
            setIsLocked(true);
          }}
          className="absolute bottom-6 right-6 p-4 bg-brand-900 text-white rounded-full shadow-lg"
        >
          <Lock size={24} />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-warm flex flex-col max-w-md mx-auto relative overflow-hidden">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif text-brand-900">Nari</h1>
          <p className="text-brand-600 text-sm mt-1">
            {settings.name ? `Nothing logged today, ${settings.name}` : "Take your time"}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button 
            onClick={() => setIsEducationOpen(true)}
            className="p-3 bg-surface rounded-2xl shadow-sm border border-brand-50 text-brand-600 active:scale-95 transition-transform hover:bg-brand-50"
            aria-label="Education"
          >
            <BookOpen size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 space-y-6 pb-32 overflow-y-auto">
        {activeTab === 'home' && (
          <Dashboard 
            entries={currentEntries}
            settings={settings}
            predictions={predictions}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            setIsLogOpen={setIsLogOpen}
            addEntry={addEntry}
            updateSettings={updateSettings}
            phaseInfo={phaseInfo}
            cycleDay={cycleDay}
            isPeriodActive={isPeriodActive}
          />
        )}
        {activeTab === 'reports' && (
          <div className="pt-4">
            <Reports entries={currentEntries} settings={settings} />
          </div>
        )}
        {activeTab === 'habits' && (
          <div className="pt-4">
            <HabitsPage 
              entries={currentEntries} 
              settings={settings}
              addEntry={addEntry}
              updateEntry={updateEntry}
              updateSettings={updateSettings}
            />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-100 safe-bottom pt-2 px-6 z-40">
        <div className="max-w-md mx-auto flex justify-between items-center relative">
          <button 
            onClick={() => setActiveTab('home')}
            className={cn("flex flex-col items-center p-2 min-w-[64px]", activeTab === 'home' ? "text-brand-600" : "text-brand-300")}
          >
            <CalendarIcon size={24} />
            <span className="text-[10px] font-medium mt-1">Today</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('habits')}
            className={cn("flex flex-col items-center p-2 min-w-[64px]", activeTab === 'habits' ? "text-brand-600" : "text-brand-300")}
          >
            <Activity size={24} />
            <span className="text-[10px] font-medium mt-1">Habits</span>
          </button>

          {/* Floating Action Button - Positioned in the middle */}
          <div className="relative -top-8">
            <button 
              onClick={() => {
                setSelectedDate(new Date());
                setIsLogOpen(true);
              }}
              className="w-14 h-14 bg-brand-900 text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform border-4 border-white"
            >
              <Plus size={28} />
            </button>
          </div>

          <button 
            onClick={() => setActiveTab('reports')}
            className={cn("flex flex-col items-center p-2 min-w-[64px]", activeTab === 'reports' ? "text-brand-600" : "text-brand-300")}
          >
            <List size={24} />
            <span className="text-[10px] font-medium mt-1">Reports</span>
          </button>
          
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className={cn("flex flex-col items-center p-2 min-w-[64px]", isSettingsOpen ? "text-brand-600" : "text-brand-300")}
          >
            <SettingsIcon size={24} />
            <span className="text-[10px] font-medium mt-1">Settings</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <QuickLog 
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        onSave={(entry) => {
          addEntry(entry);
        }}
        settings={settings}
        onUpdateSettings={updateSettings}
      />

      <DailyLogs 
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
        entries={entries}
      />

      <Education 
        isOpen={isEducationOpen}
        onClose={() => setIsEducationOpen(false)}
      />

      <AnimatePresence>
        {isSettingsOpen && (
          <Settings 
            settings={settings}
            entries={entries}
            onUpdateSettings={updateSettings}
            onClearData={clearData}
            onBack={() => setIsSettingsOpen(false)}
            onOpenLogs={() => {
              setIsSettingsOpen(false);
              setIsLogsOpen(true);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
