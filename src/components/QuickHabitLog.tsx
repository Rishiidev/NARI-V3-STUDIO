import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Droplets, Calendar, Moon, Dumbbell } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { CycleEntry, UserSettings } from '../lib/db';
import { cn } from '../lib/utils';

interface QuickHabitLogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: CycleEntry) => void;
  settings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
}

export const QuickHabitLog: React.FC<QuickHabitLogProps> = ({ isOpen, onClose, onSave, settings, onUpdateSettings }) => {
  const [selectedMedications, setSelectedMedications] = useState<string[]>([]);
  const [newMedication, setNewMedication] = useState('');
  const [waterIntake, setWaterIntake] = useState<number>(0);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [sleepDuration, setSleepDuration] = useState<number>(0);
  const [exercise, setExercise] = useState<{ type: string, intensity: 'low' | 'medium' | 'high', duration?: number } | null>(null);
  const [notes, setNotes] = useState('');
  const [logDate, setLogDate] = useState(new Date());

  useEffect(() => {
    if (isOpen) {
      setSelectedMedications([]);
      setNewMedication('');
      setWaterIntake(0);
      setSleepQuality(null);
      setSleepDuration(0);
      setExercise(null);
      setNotes('');
      setLogDate(new Date());
    }
  }, [isOpen]);

  const handleAddMedication = () => {
    if (newMedication && !settings.customMedications.includes(newMedication)) {
      onUpdateSettings({ customMedications: [...settings.customMedications, newMedication] });
      setSelectedMedications(prev => [...prev, newMedication]);
      setNewMedication('');
    }
  };

  const handleLog = () => {
    onSave({
      date: format(logDate, 'yyyy-MM-dd'),
      type: 'none',
      flow: 'none',
      symptoms: [],
      moods: [],
      notes,
      medications: selectedMedications,
      waterIntake,
      sleepQuality,
      sleepDuration,
      exercise,
    });
    setTimeout(onClose, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-bg-warm rounded-t-[40px] z-50 safe-bottom shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-bg-warm z-10 py-2">
                <h3 className="text-2xl font-serif text-brand-900">Log Habits</h3>
                <button onClick={onClose} className="p-2 bg-brand-100 rounded-full text-brand-600">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6 flex items-center gap-2">
                <Calendar size={18} className="text-brand-400" />
                <input 
                  type="date" 
                  value={format(logDate, 'yyyy-MM-dd')}
                  onChange={(e) => setLogDate(parseISO(e.target.value))}
                  className="bg-white p-2 rounded-xl border border-brand-100 text-sm"
                />
              </div>

              <div className="space-y-6 mb-6">
                <div>
                  <p className="text-xs font-bold text-brand-400 uppercase mb-3">Medications</p>
                  <div className="flex gap-2 mb-3">
                    <input 
                      value={newMedication} 
                      onChange={(e) => setNewMedication(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && handleAddMedication()}
                      className="flex-1 p-2 rounded-xl border border-brand-100 text-sm"
                      placeholder="Add new medication..."
                    />
                    <button onClick={handleAddMedication} className="px-4 py-2 bg-brand-100 text-brand-700 font-medium rounded-xl text-sm">Add</button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {settings.customMedications.map(m => (
                      <button
                        key={m}
                        onClick={() => setSelectedMedications(prev => prev.includes(m) ? prev.filter(i => i !== m) : [...prev, m])}
                        className={cn(
                          "px-4 py-2 rounded-full text-xs font-medium transition-all",
                          selectedMedications.includes(m) ? "bg-brand-500 text-white" : "bg-white text-brand-400 border border-brand-100"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-400 uppercase mb-3">Water Intake (ml)</p>
                  <input 
                    type="number"
                    value={waterIntake || ''}
                    onChange={(e) => setWaterIntake(parseInt(e.target.value) || 0)}
                    className="w-full p-4 rounded-2xl border border-brand-100 text-sm"
                    placeholder="0"
                  />
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setWaterIntake(prev => prev + 250)} className="flex-1 py-2 bg-brand-50 text-brand-700 rounded-xl text-xs font-medium active:scale-95 transition-transform">+ 250 ml</button>
                    <button onClick={() => setWaterIntake(prev => prev + 500)} className="flex-1 py-2 bg-brand-50 text-brand-700 rounded-xl text-xs font-medium active:scale-95 transition-transform">+ 500 ml</button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-400 uppercase mb-3">Sleep</p>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">Duration (Hours)</p>
                      <input 
                        type="number"
                        value={sleepDuration || ''}
                        onChange={(e) => setSleepDuration(parseFloat(e.target.value) || 0)}
                        className="w-full p-4 rounded-2xl border border-brand-100 text-sm"
                        placeholder="0 hours"
                        step="0.5"
                      />
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => setSleepDuration(6)} className="flex-1 py-2 bg-brand-50 text-brand-700 rounded-xl text-xs font-medium active:scale-95 transition-transform">6 hrs</button>
                        <button onClick={() => setSleepDuration(7)} className="flex-1 py-2 bg-brand-50 text-brand-700 rounded-xl text-xs font-medium active:scale-95 transition-transform">7 hrs</button>
                        <button onClick={() => setSleepDuration(8)} className="flex-1 py-2 bg-brand-50 text-brand-700 rounded-xl text-xs font-medium active:scale-95 transition-transform">8 hrs</button>
                        <button onClick={() => setSleepDuration(9)} className="flex-1 py-2 bg-brand-50 text-brand-700 rounded-xl text-xs font-medium active:scale-95 transition-transform">9 hrs</button>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">Quality</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(i => (
                          <button
                            key={i}
                            onClick={() => setSleepQuality(i)}
                            className={cn(
                              "flex-1 py-3 rounded-2xl text-sm font-medium transition-all",
                              sleepQuality === i ? "bg-brand-500 text-white" : "bg-white text-brand-400 border border-brand-100"
                            )}
                          >
                            {i}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-400 uppercase mb-3">Exercise</p>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {settings.customExerciseTypes.map(e => (
                      <button
                        key={e}
                        onClick={() => setExercise(prev => prev?.type === e ? null : { type: e, intensity: 'medium', duration: 30 })}
                        className={cn(
                          "px-4 py-2 rounded-full text-xs font-medium transition-all",
                          exercise?.type === e ? "bg-brand-500 text-white" : "bg-white text-brand-400 border border-brand-100"
                        )}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                  {exercise && (
                    <div className="space-y-4 mt-4">
                      <div>
                        <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">Duration (Minutes)</p>
                        <input 
                          type="number"
                          value={exercise.duration || ''}
                          onChange={(e) => setExercise({ ...exercise, duration: parseInt(e.target.value) || 0 })}
                          className="w-full p-4 rounded-2xl border border-brand-100 text-sm"
                          placeholder="0 mins"
                        />
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => setExercise({ ...exercise, duration: 15 })} className="flex-1 py-2 bg-brand-50 text-brand-700 rounded-xl text-xs font-medium active:scale-95 transition-transform">15m</button>
                          <button onClick={() => setExercise({ ...exercise, duration: 30 })} className="flex-1 py-2 bg-brand-50 text-brand-700 rounded-xl text-xs font-medium active:scale-95 transition-transform">30m</button>
                          <button onClick={() => setExercise({ ...exercise, duration: 45 })} className="flex-1 py-2 bg-brand-50 text-brand-700 rounded-xl text-xs font-medium active:scale-95 transition-transform">45m</button>
                          <button onClick={() => setExercise({ ...exercise, duration: 60 })} className="flex-1 py-2 bg-brand-50 text-brand-700 rounded-xl text-xs font-medium active:scale-95 transition-transform">60m</button>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">Intensity</p>
                        <div className="flex gap-2">
                          {(['low', 'medium', 'high'] as const).map(i => (
                            <button
                              key={i}
                              onClick={() => setExercise({ ...exercise, intensity: i })}
                              className={cn(
                                "flex-1 py-2 rounded-xl text-xs font-medium transition-all capitalize",
                                exercise.intensity === i ? "bg-brand-200 text-brand-900" : "bg-white text-brand-400 border border-brand-100"
                              )}
                            >
                              {i}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-400 uppercase mb-3">Notes</p>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-brand-100 text-sm"
                    placeholder="Add notes..."
                  />
                </div>
                <button 
                  onClick={handleLog}
                  className="w-full py-4 bg-brand-900 text-white rounded-2xl font-medium text-lg active:scale-95 transition-transform mt-4"
                >
                  Save Habits
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
