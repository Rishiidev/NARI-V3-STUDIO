import React, { useState, useRef, useMemo } from 'react';
import { 
  Shield, 
  Trash2, 
  Lock, 
  ArrowLeft, 
  ChevronRight,
  ChevronUp,
  ChevronDown,
  FileJson,
  FileSpreadsheet,
  FileText,
  Download,
  X,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserSettings, CycleEntry, db } from '../lib/db';
import { exportToJSON, exportToCSV, exportToPDF, exportToDailySummary } from '../lib/export';
import { generateDoctorReportPDF, getCyclesInRange } from '../features/export/doctorReport';
import { PinSetupModal } from './PinSetupModal';
import { DeleteDataModal } from './DeleteDataModal';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface SettingsProps {
  settings: UserSettings;
  entries: CycleEntry[];
  onUpdateSettings: (s: Partial<UserSettings>) => void;
  onClearData: () => Promise<void>;
  onBack: () => void;
  onOpenLogs?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  settings, 
  entries, 
  onUpdateSettings, 
  onClearData, 
  onBack,
  onOpenLogs
}) => {
  const [newMood, setNewMood] = useState('');
  const [newSymptom, setNewSymptom] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newExercise, setNewExercise] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const cycles = useMemo(() => getCyclesInRange(entries, 12), [entries]);

  const toggleCycleExclusion = (startDate: Date) => {
    const dateStr = format(startDate, 'yyyy-MM-dd');
    const excluded = settings.excludedCycleStartDates || [];
    if (excluded.includes(dateStr)) {
      onUpdateSettings({ excludedCycleStartDates: excluded.filter(d => d !== dateStr) });
    } else {
      onUpdateSettings({ excludedCycleStartDates: [...excluded, dateStr] });
    }
  };

  const addExercise = () => {
    if (newExercise && !(settings.customExerciseTypes || []).includes(newExercise)) {
      onUpdateSettings({ customExerciseTypes: [...(settings.customExerciseTypes || []), newExercise] });
      setNewExercise('');
    }
  };

  const removeExercise = (exercise: string) => {
    onUpdateSettings({ customExerciseTypes: (settings.customExerciseTypes || []).filter(e => e !== exercise) });
  };

  const addMood = () => {
    if (newMood && !settings.customMoods.includes(newMood)) {
      onUpdateSettings({ customMoods: [...settings.customMoods, newMood] });
      setNewMood('');
    }
  };

  const removeMood = (mood: string) => {
    onUpdateSettings({ customMoods: settings.customMoods.filter(m => m !== mood) });
  };

  const addSymptom = () => {
    if (newSymptom && !settings.customSymptoms.includes(newSymptom)) {
      onUpdateSettings({ customSymptoms: [...settings.customSymptoms, newSymptom] });
      setNewSymptom('');
    }
  };

  const removeSymptom = (symptom: string) => {
    onUpdateSettings({ customSymptoms: settings.customSymptoms.filter(s => s !== symptom) });
  };

  const addMedication = () => {
    if (newMedication && !settings.customMedications.includes(newMedication)) {
      onUpdateSettings({ customMedications: [...settings.customMedications, newMedication] });
      setNewMedication('');
    }
  };

  const removeMedication = (medication: string) => {
    onUpdateSettings({ customMedications: settings.customMedications.filter(m => m !== medication) });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.entries) {
          // Merge logic: check for duplicates by date and type
          const existingEntries = await db.getEntries();
          const newEntries = data.entries.filter((newEntry: CycleEntry) => 
            !existingEntries.some(existing => existing.date === newEntry.date && existing.type === newEntry.type)
          );
          if (newEntries.length > 0) {
            await db.bulkAddEntries(newEntries);
            alert(`Imported ${newEntries.length} new entries.`);
            window.location.reload();
          } else {
            alert('No new entries to import.');
          }
        }
      } catch (error) {
        alert('Failed to import JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-0 bg-bg-warm z-[60] flex flex-col safe-bottom"
    >
      <header className="p-6 flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-serif text-brand-900">Settings</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-6 space-y-8 pb-12">
        {/* Privacy Trust Card */}
        <div className="bg-brand-900 text-brand-50 p-6 rounded-[32px] space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="text-brand-300" size={24} />
            <h3 className="font-medium">Privacy First</h3>
          </div>
          <p className="text-sm text-brand-200 leading-relaxed">
            Nari is built on the principle of local-first. Your data is stored in your browser's IndexedDB. We never see it, and it never leaves your device unless you export it.
          </p>
        </div>

        {/* Cycle Config */}
        <section className="space-y-4">
          <h4 className="text-xs font-medium text-brand-400 uppercase tracking-widest px-2">Cycle Configuration</h4>
          <div className="bg-white rounded-3xl overflow-hidden border border-brand-100">
            <div className="p-4 flex items-center justify-between border-bottom border-brand-50">
              <span className="text-sm font-medium">Cycle Length</span>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  value={settings.averageCycleLength}
                  onChange={(e) => onUpdateSettings({ averageCycleLength: parseInt(e.target.value) })}
                  className="w-12 text-right font-serif text-brand-600 focus:outline-none"
                />
                <span className="text-xs text-brand-400">days</span>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between border-bottom border-brand-50">
              <span className="text-sm font-medium">Predicted Period Length</span>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  value={settings.averagePeriodLength}
                  onChange={(e) => onUpdateSettings({ averagePeriodLength: parseInt(e.target.value) })}
                  className="w-12 text-right font-serif text-brand-600 focus:outline-none"
                />
                <span className="text-xs text-brand-400">days</span>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm font-medium">Custom Period Length (Override)</span>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  value={settings.customPeriodLength || ''}
                  onChange={(e) => onUpdateSettings({ customPeriodLength: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Auto"
                  className="w-12 text-right font-serif text-brand-600 focus:outline-none placeholder:text-brand-300"
                />
                <span className="text-xs text-brand-400">days</span>
              </div>
            </div>
            <div className="p-4 border-t border-brand-50">
              <span className="text-sm font-medium mb-2 block">Include Cycles in Prediction</span>
              <div className="space-y-2">
                {cycles.map(cycle => {
                  const dateStr = format(cycle.startDate, 'yyyy-MM-dd');
                  const isExcluded = (settings.excludedCycleStartDates || []).includes(dateStr);
                  return (
                    <button 
                      key={`${cycle.cycleNumber}-${cycle.startDate.toISOString()}`}
                      onClick={() => toggleCycleExclusion(cycle.startDate)}
                      className={cn(
                        "w-full p-3 rounded-xl text-sm flex justify-between items-center",
                        isExcluded ? "bg-brand-50 text-brand-400" : "bg-brand-100 text-brand-900"
                      )}
                    >
                      <span>Cycle {cycle.cycleNumber} ({format(cycle.startDate, 'MMM d')})</span>
                      <span>{isExcluded ? 'Excluded' : 'Included'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Goals */}
        <section className="space-y-4">
          <h4 className="text-xs font-medium text-brand-400 uppercase tracking-widest px-2">Daily Goals</h4>
          <div className="bg-white rounded-3xl overflow-hidden border border-brand-100">
            <div className="p-4 flex items-center justify-between border-b border-brand-50">
              <span className="text-sm font-medium">Water Intake</span>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  value={settings.waterGoal || 2000}
                  onChange={(e) => onUpdateSettings({ waterGoal: parseInt(e.target.value) || 0 })}
                  className="w-16 text-right font-serif text-brand-600 focus:outline-none"
                />
                <span className="text-xs text-brand-400">ml</span>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between border-b border-brand-50">
              <span className="text-sm font-medium">Sleep Duration</span>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  value={settings.sleepGoal || 8}
                  onChange={(e) => onUpdateSettings({ sleepGoal: parseFloat(e.target.value) || 0 })}
                  className="w-16 text-right font-serif text-brand-600 focus:outline-none"
                  step="0.5"
                />
                <span className="text-xs text-brand-400">hrs</span>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between border-b border-brand-50">
              <span className="text-sm font-medium">Exercise</span>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  value={settings.exerciseGoal || 30}
                  onChange={(e) => onUpdateSettings({ exerciseGoal: parseInt(e.target.value) || 0 })}
                  className="w-16 text-right font-serif text-brand-600 focus:outline-none"
                />
                <span className="text-xs text-brand-400">mins</span>
              </div>
            </div>
            {(settings.customHabits || []).filter(h => h.type === 'counter').map(habit => (
              <div key={habit.id} className="p-4 flex items-center justify-between border-b border-brand-50 last:border-0">
                <span className="text-sm font-medium">{habit.name}</span>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    value={habit.goal || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const newHabits = (settings.customHabits || []).map(h => h.id === habit.id ? { ...h, goal: val } : h);
                      onUpdateSettings({ customHabits: newHabits });
                    }}
                    className="w-16 text-right font-serif text-brand-600 focus:outline-none"
                  />
                  <span className="text-xs text-brand-400">{habit.unit || 'units'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Dashboard Layout */}
        <section className="space-y-4">
          <h4 className="text-xs font-medium text-brand-400 uppercase tracking-widest px-2">Dashboard Layout</h4>
          <div className="bg-white rounded-3xl p-4 border border-brand-100 space-y-4">
            <div>
              <h5 className="text-xs font-bold text-brand-500 mb-2">Active Widgets</h5>
              <div className="space-y-2">
                {settings.dashboardOrder.map((id, index) => (
                  <div key={id} className="flex items-center justify-between p-3 bg-brand-50 rounded-xl">
                    <span className="text-sm font-medium capitalize">{id.replace(/_/g, ' ')}</span>
                    <div className="flex gap-1 items-center">
                      <button 
                        disabled={index === 0}
                        onClick={() => {
                          const newOrder = [...settings.dashboardOrder];
                          [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
                          onUpdateSettings({ dashboardOrder: newOrder });
                        }}
                        className="p-1 disabled:opacity-30 text-brand-600"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button 
                        disabled={index === settings.dashboardOrder.length - 1}
                        onClick={() => {
                          const newOrder = [...settings.dashboardOrder];
                          [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                          onUpdateSettings({ dashboardOrder: newOrder });
                        }}
                        className="p-1 disabled:opacity-30 text-brand-600"
                      >
                        <ChevronDown size={16} />
                      </button>
                      <button
                        onClick={() => {
                          onUpdateSettings({ dashboardOrder: settings.dashboardOrder.filter(w => w !== id) });
                        }}
                        className="p-1 text-red-500 ml-2"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {['status', 'circular_cycle', 'partner_sync', 'habits', 'habit_insights', 'calendar', 'insights', 'prediction', 'daily_insight', 'symptom_patterns'].filter(w => !settings.dashboardOrder.includes(w)).length > 0 && (
              <div>
                <h5 className="text-xs font-bold text-brand-500 mb-2 mt-4">Available Widgets</h5>
                <div className="space-y-2">
                  {['status', 'circular_cycle', 'partner_sync', 'habits', 'habit_insights', 'calendar', 'insights', 'prediction', 'daily_insight', 'symptom_patterns']
                    .filter(w => !settings.dashboardOrder.includes(w))
                    .map(id => (
                      <div key={id} className="flex items-center justify-between p-3 bg-white border border-brand-100 rounded-xl">
                        <span className="text-sm font-medium capitalize text-brand-600">{id.replace(/_/g, ' ')}</span>
                        <button
                          onClick={() => {
                            onUpdateSettings({ dashboardOrder: [...settings.dashboardOrder, id] });
                          }}
                          className="px-3 py-1 bg-brand-100 text-brand-700 rounded-lg text-xs font-bold"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Appearance */}
        <section className="space-y-4">
          <h4 className="text-xs font-medium text-brand-400 uppercase tracking-widest px-2">Appearance</h4>
          <div className="bg-white rounded-3xl p-4 border border-brand-100 space-y-6">
            <div>
              <label className="text-sm font-medium mb-3 block">Theme</label>
              <div className="flex gap-2">
                {(['light', 'dark', 'system'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => onUpdateSettings({ theme: t })}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-medium transition-all capitalize",
                      settings.theme === t ? "bg-brand-500 text-white" : "bg-brand-50 text-brand-700"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-3 block">Accent Color</label>
              <div className="flex gap-3">
                {[
                  { id: 'terracotta', color: 'bg-[#d96d52]' },
                  { id: 'sage', color: 'bg-[#548a5b]' },
                  { id: 'lavender', color: 'bg-[#8359b3]' },
                  { id: 'ocean', color: 'bg-[#0ea5e9]' }
                ].map(c => (
                  <button
                    key={c.id}
                    onClick={() => onUpdateSettings({ accentColor: c.id as any })}
                    className={cn(
                      "w-10 h-10 rounded-full transition-all flex items-center justify-center",
                      c.color,
                      (settings.accentColor || 'terracotta') === c.id ? "ring-4 ring-brand-200 ring-offset-2" : "opacity-80"
                    )}
                  >
                    {(settings.accentColor || 'terracotta') === c.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Customization */}
        <section className="space-y-4">
          <h4 className="text-xs font-medium text-brand-400 uppercase tracking-widest px-2">Customization</h4>
          <div className="bg-white rounded-3xl p-4 border border-brand-100 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Moods</label>
              <div className="flex gap-2 mb-2">
                <input 
                  value={newMood} 
                  onChange={(e) => setNewMood(e.target.value)} 
                  className="flex-1 p-2 rounded-xl border border-brand-100 text-sm"
                  placeholder="Add mood..."
                />
                <button onClick={addMood} className="px-4 py-2 bg-brand-500 text-white rounded-xl text-sm">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {settings.customMoods.map(m => (
                  <span key={m} className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs flex items-center gap-1">
                    {m}
                    <button onClick={() => removeMood(m)}><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Symptoms</label>
              <div className="flex gap-2 mb-2">
                <input 
                  value={newSymptom} 
                  onChange={(e) => setNewSymptom(e.target.value)} 
                  className="flex-1 p-2 rounded-xl border border-brand-100 text-sm"
                  placeholder="Add symptom..."
                />
                <button onClick={addSymptom} className="px-4 py-2 bg-brand-500 text-white rounded-xl text-sm">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {settings.customSymptoms.map(s => (
                  <span key={s} className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs flex items-center gap-1">
                    {s}
                    <button onClick={() => removeSymptom(s)}><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Medications & Supplements</label>
              <div className="flex gap-2 mb-2">
                <input 
                  value={newMedication} 
                  onChange={(e) => setNewMedication(e.target.value)} 
                  className="flex-1 p-2 rounded-xl border border-brand-100 text-sm"
                  placeholder="Add medication..."
                />
                <button onClick={addMedication} className="px-4 py-2 bg-brand-500 text-white rounded-xl text-sm">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {settings.customMedications.map(m => (
                  <span key={m} className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs flex items-center gap-1">
                    {m}
                    <button onClick={() => removeMedication(m)}><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Exercise Types</label>
              <div className="flex gap-2 mb-2">
                <input 
                  value={newExercise} 
                  onChange={(e) => setNewExercise(e.target.value)} 
                  className="flex-1 p-2 rounded-xl border border-brand-100 text-sm"
                  placeholder="Add exercise (e.g., Badminton)..."
                />
                <button onClick={addExercise} className="px-4 py-2 bg-brand-500 text-white rounded-xl text-sm">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(settings.customExerciseTypes || []).map(e => (
                  <span key={e} className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs flex items-center gap-1">
                    {e}
                    <button onClick={() => removeExercise(e)}><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="space-y-4">
          <h4 className="text-xs font-medium text-brand-400 uppercase tracking-widest px-2">Security</h4>
          <div className="bg-white rounded-3xl overflow-hidden border border-brand-100">
            <div className="p-4 flex items-center justify-between border-b border-brand-50">
              <div className="flex items-center gap-3">
                <Lock size={18} className="text-brand-400" />
                <span className="text-sm font-medium">App Lock</span>
              </div>
              <button 
                onClick={() => {
                  if (!settings.isAppLocked) {
                    setShowPinModal(true);
                  } else {
                    onUpdateSettings({ isAppLocked: false, passcode: null });
                  }
                }}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  settings.isAppLocked ? "bg-brand-500" : "bg-brand-200"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  settings.isAppLocked ? "left-7" : "left-1"
                )} />
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock size={18} className="text-brand-400" />
                <span className="text-sm font-medium">Decoy Mode</span>
              </div>
              <button 
                onClick={() => setShowPinModal(true)}
                className="text-xs text-brand-500 font-medium"
              >
                Set Decoy PIN
              </button>
            </div>
          </div>
        </section>

        {/* Export/Import */}
        <section className="space-y-4">
          <h4 className="text-xs font-medium text-brand-400 uppercase tracking-widest px-2">Data Management</h4>
          {onOpenLogs && (
            <div className="bg-white rounded-3xl overflow-hidden border border-brand-100 mb-3">
              <button 
                onClick={onOpenLogs}
                className="w-full p-4 flex items-center justify-between text-brand-900 active:bg-brand-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <List size={18} className="text-brand-500" />
                  <span className="text-sm font-medium">View All Logs</span>
                </div>
                <ChevronRight size={18} className="text-brand-300" />
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-brand-100 gap-2 active:bg-brand-50 cursor-pointer">
              <Download size={20} className="text-brand-500" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Import JSON</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button 
              onClick={() => exportToJSON(entries, settings)}
              className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-brand-100 gap-2 active:bg-brand-50"
            >
              <FileJson size={20} className="text-brand-500" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Export JSON</span>
            </button>
            <button 
              onClick={() => exportToCSV(entries)}
              className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-brand-100 gap-2 active:bg-brand-50"
            >
              <FileSpreadsheet size={20} className="text-brand-500" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Export CSV</span>
            </button>
            <button 
              onClick={() => exportToPDF(entries)}
              className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-brand-100 gap-2 active:bg-brand-50"
            >
              <FileText size={20} className="text-brand-500" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Export PDF</span>
            </button>
            <button 
              onClick={() => exportToDailySummary(entries)}
              className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-brand-100 gap-2 active:bg-brand-50"
            >
              <FileText size={20} className="text-brand-500" />
              <span className="text-[10px] font-bold uppercase tracking-tighter text-center">Export Daily Summary</span>
            </button>
            <button 
              onClick={() => generateDoctorReportPDF(entries, 6)}
              className="flex flex-col items-center justify-center p-4 bg-brand-50 rounded-3xl border border-brand-200 gap-2 active:bg-brand-100 col-span-2"
            >
              <FileText size={20} className="text-brand-600" />
              <span className="text-[10px] font-bold uppercase tracking-tighter text-center text-brand-700">Export for Doctor (PDF)</span>
            </button>
          </div>
        </section>

        {/* Privacy */}
        <section className="space-y-4">
          <h4 className="text-xs font-medium text-brand-400 uppercase tracking-widest px-2">Privacy</h4>
          <div className="bg-white rounded-3xl overflow-hidden border border-red-100">
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="w-full p-4 flex items-center justify-between text-red-600 active:bg-red-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Trash2 size={18} />
                <span className="text-sm font-medium">Delete All Data</span>
              </div>
              <ChevronRight size={18} className="text-red-300" />
            </button>
          </div>
        </section>
      </div>
      
      <AnimatePresence>
        {showPinModal && (
          <PinSetupModal 
            onClose={() => setShowPinModal(false)}
            onSave={(hashedPin, isDecoy) => {
              if (isDecoy) {
                onUpdateSettings({ decoyPasscode: hashedPin });
              } else {
                onUpdateSettings({ isAppLocked: true, passcode: hashedPin });
              }
            }}
          />
        )}
        {showDeleteModal && (
          <DeleteDataModal 
            onClose={() => setShowDeleteModal(false)}
            onConfirm={async () => {
              await onClearData();
              // The app will automatically redirect to onboarding because settings.onboardingComplete becomes false
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
