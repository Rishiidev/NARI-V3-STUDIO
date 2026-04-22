import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Droplets, ChevronUp, X, Smile, Activity, MessageSquare, Calendar } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { CycleEntry, UserSettings } from '../lib/db';
import { cn } from '../lib/utils';

interface QuickLogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: CycleEntry) => void;
  settings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
}

export const QuickLog: React.FC<QuickLogProps> = ({ isOpen, onClose, onSave, settings, onUpdateSettings }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showMedications, setShowMedications] = useState(false);
  const [newMedication, setNewMedication] = useState('');
  const [showHydration, setShowHydration] = useState(false);
  const [showSleep, setShowSleep] = useState(false);
  const [showExercise, setShowExercise] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomIntensities, setSymptomIntensities] = useState<Record<string, number | null>>({});
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<'spotting' | 'light' | 'medium' | 'heavy' | 'none'>('none');
  const [selectedType, setSelectedType] = useState<'period_start' | 'period_end' | 'spotting' | 'ovulation' | 'none'>('none');
  const [notes, setNotes] = useState('');
  const [selectedMedications, setSelectedMedications] = useState<string[]>([]);
  const [waterIntake, setWaterIntake] = useState<number>(0);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [sleepDuration, setSleepDuration] = useState<number>(0);
  const [exercise, setExercise] = useState<{ type: string, intensity: 'low' | 'medium' | 'high', duration?: number } | null>(null);
  const [customHabitValues, setCustomHabitValues] = useState<Record<string, boolean | number>>({});
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [logDate, setLogDate] = useState(new Date());

  useEffect(() => {
    if (isOpen) {
      setShowDetails(false);
      setShowConfirmEnd(false);
      setSelectedSymptoms([]);
      setSymptomIntensities({});
      setSelectedMoods([]);
      setSelectedFlow('none');
      setSelectedType('none');
      setNotes('');
      setSelectedMedications([]);
      setWaterIntake(0);
      setSleepQuality(null);
      setSleepDuration(0);
      setExercise(null);
      setCustomHabitValues({});
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
      type: selectedType,
      flow: selectedFlow,
      symptoms: selectedSymptoms,
      symptomIntensities: symptomIntensities,
      moods: selectedMoods,
      notes,
      medications: selectedMedications,
      waterIntake,
      sleepQuality,
      sleepDuration,
      exercise,
      customHabitValues,
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
          {showConfirmEnd && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-3xl shadow-xl max-w-sm w-full">
                <h4 className="text-lg font-serif text-brand-900 mb-2">End Period?</h4>
                <p className="text-sm text-brand-500 mb-6">Are you sure you want to end your period? This action affects your cycle predictions.</p>
                <div className="flex gap-4">
                  <button onClick={() => setShowConfirmEnd(false)} className="flex-1 py-2 rounded-xl bg-brand-100 text-brand-700">Cancel</button>
                  <button onClick={() => {
                    setSelectedType('period_end');
                    setSelectedFlow('none');
                    setShowDetails(true);
                    setShowConfirmEnd(false);
                  }} className="flex-1 py-2 rounded-xl bg-[#D97757] text-white">Confirm</button>
                </div>
              </div>
            </div>
          )}
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-bg-warm rounded-t-[40px] z-50 safe-bottom shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-bg-warm z-10 py-2">
                <h3 className="text-2xl font-serif text-brand-900">Quick Log</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowDetails(!showDetails)}
                    className="px-4 py-2 bg-brand-50 rounded-full text-brand-600 text-sm font-medium"
                  >
                    {showDetails ? 'Hide Details' : 'Add Details'}
                  </button>
                  <button onClick={onClose} className="p-2 bg-brand-100 rounded-full text-brand-600">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Past Period Log Input */}
              <div className="mb-6 flex items-center gap-2">
                <Calendar size={18} className="text-brand-400" />
                <input 
                  type="date" 
                  value={format(logDate, 'yyyy-MM-dd')}
                  onChange={(e) => setLogDate(parseISO(e.target.value))}
                  className="bg-white p-2 rounded-xl border border-brand-100 text-sm"
                />
              </div>

              {/* Type Selection Buttons */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button 
                  onClick={() => {
                    if (selectedType === 'period_start') {
                      setSelectedType('none');
                      setSelectedFlow('none');
                    } else {
                      setSelectedType('period_start');
                      setSelectedFlow('medium');
                      setShowDetails(true);
                    }
                  }}
                  className={cn(
                    "py-6 rounded-3xl font-bold text-lg transition-all active:scale-95",
                    selectedType === 'period_start' 
                      ? "bg-[#D97757] text-white shadow-lg shadow-[#D97757]/30" 
                      : "bg-[#F7EBE7] text-[#723328] hover:bg-[#F3DCD5]"
                  )}
                >
                  Start Period
                </button>
                <button 
                  onClick={() => {
                    if (selectedType === 'period_end') {
                      setSelectedType('none');
                    } else {
                      setShowConfirmEnd(true);
                    }
                  }}
                  className={cn(
                    "py-6 rounded-3xl font-bold text-lg transition-all active:scale-95",
                    selectedType === 'period_end' 
                      ? "bg-[#D97757] text-white shadow-lg shadow-[#D97757]/30" 
                      : "bg-[#F7EBE7] text-[#723328] hover:bg-[#F3DCD5]"
                  )}
                >
                  End Period
                </button>
              </div>

              {/* Optional Inputs */}
              <AnimatePresence>
                {showDetails && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-6 mb-6">
                      <div>
                        <p className="text-xs font-bold text-brand-400 uppercase mb-3">Flow Intensity</p>
                        <div className="flex gap-2 flex-wrap">
                          {(['spotting', 'light', 'medium', 'heavy'] as const).map(f => (
                            <button
                              key={f}
                              disabled={selectedType === 'period_start' || selectedType === 'period_end'}
                              onClick={() => setSelectedFlow(f)}
                              className={cn(
                                "px-4 py-2 rounded-full text-xs font-medium transition-all capitalize",
                                selectedFlow === f ? "bg-brand-500 text-white" : "bg-white text-brand-400 border border-brand-100",
                                (selectedType === 'period_start' || selectedType === 'period_end') && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-brand-400 uppercase mb-3">Symptoms</p>
                        <div className="flex flex-wrap gap-2">
                          {settings.customSymptoms.map(s => (
                            <div key={s} className="flex flex-col gap-1">
                              <button
                                onClick={() => setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(i => i !== s) : [...prev, s])}
                                className={cn(
                                  "px-4 py-2 rounded-full text-xs font-medium transition-all",
                                  selectedSymptoms.includes(s) ? "bg-brand-200 text-brand-900" : "bg-white text-brand-400 border border-brand-100"
                                )}
                              >
                                {s}
                              </button>
                              {selectedSymptoms.includes(s) && (
                                <div className="flex flex-col gap-1 mt-2">
                                  <div className="flex justify-between px-1 text-[10px] font-bold text-brand-400 uppercase tracking-widest">
                                    <span>Mild</span>
                                    <span>Moderate</span>
                                    <span>Severe</span>
                                  </div>
                                  <div className="flex gap-1 justify-between">
                                    {[1, 2, 3, 4, 5].map(i => (
                                      <button 
                                        key={i}
                                        onClick={() => setSymptomIntensities(prev => ({ ...prev, [s]: i }))}
                                        className={cn("flex-1 h-6 rounded-full transition-colors", symptomIntensities[s] === i ? "bg-brand-900" : "bg-brand-100")}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-brand-400 uppercase mb-3">Mood</p>
                        <div className="flex gap-2 flex-wrap">
                          {settings.customMoods.map(m => (
                            <button
                              key={m}
                              onClick={() => setSelectedMoods(prev => prev.includes(m) ? prev.filter(i => i !== m) : [...prev, m])}
                              className={cn(
                                "px-4 py-3 rounded-2xl text-xs font-medium transition-all",
                                selectedMoods.includes(m) ? "bg-brand-200 text-brand-900" : "bg-white text-brand-400 border border-brand-100"
                              )}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                        <div className="border-t border-brand-100 pt-4">
                          <button onClick={() => setShowMedications(!showMedications)} className="flex justify-between w-full items-center">
                            <p className="text-xs font-bold text-brand-400 uppercase">Medications</p>
                            <ChevronUp className={cn("transition-transform", !showMedications && "rotate-180")} size={16} />
                          </button>
                          <AnimatePresence>
                            {showMedications && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-4 space-y-3">
                                <div className="flex gap-2">
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
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="border-t border-brand-100 pt-4">
                          <button onClick={() => setShowHydration(!showHydration)} className="flex justify-between w-full items-center">
                            <p className="text-xs font-bold text-brand-400 uppercase">Water Intake</p>
                            <ChevronUp className={cn("transition-transform", !showHydration && "rotate-180")} size={16} />
                          </button>
                          <AnimatePresence>
                            {showHydration && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-4">
                                <div className="flex justify-between items-end mb-4">
                                  <p className="text-sm font-bold text-brand-600">{waterIntake} <span className="text-xs font-normal text-brand-400">/ {settings.waterGoal} ml</span></p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {Array.from({ length: Math.max(8, Math.ceil(settings.waterGoal / 250)) }).map((_, i) => (
                                    <button
                                      key={i}
                                      onClick={() => setWaterIntake((i + 1) * 250)}
                                      className={cn(
                                        "w-10 h-12 rounded-b-xl rounded-t-sm flex items-center justify-center transition-all active:scale-95 border-2",
                                        waterIntake >= (i + 1) * 250 ? "bg-blue-100 border-blue-400 text-blue-500" : "bg-white border-brand-100 text-brand-300"
                                      )}
                                    >
                                      <Droplets size={20} fill={waterIntake >= (i + 1) * 250 ? 'currentColor' : 'none'} />
                                    </button>
                                  ))}
                                </div>
                                <div className="flex justify-between mt-3 text-[10px] text-brand-400 uppercase font-bold">
                                  <button onClick={() => setWaterIntake(0)} className="text-red-400 px-2 py-1 bg-red-50 rounded-lg">Reset</button>
                                  <span>1 cup = 250ml</span>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="border-t border-brand-100 pt-4">
                          <button onClick={() => setShowSleep(!showSleep)} className="flex justify-between w-full items-center">
                            <p className="text-xs font-bold text-brand-400 uppercase">Sleep</p>
                            <ChevronUp className={cn("transition-transform", !showSleep && "rotate-180")} size={16} />
                          </button>
                          <AnimatePresence>
                            {showSleep && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-4 space-y-6">
                                <div>
                                  <div className="flex justify-between items-end mb-2">
                                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Duration</p>
                                    <p className="text-xl font-bold font-serif text-brand-600">{sleepDuration} <span className="text-xs font-sans text-brand-400">hours</span></p>
                                  </div>
                                  <input 
                                    type="range"
                                    min="0"
                                    max="14"
                                    step="0.5"
                                    value={sleepDuration}
                                    onChange={(e) => setSleepDuration(parseFloat(e.target.value) || 0)}
                                    className="w-full h-2 bg-brand-100 rounded-lg appearance-none cursor-pointer accent-brand-500"
                                  />
                                  <div className="flex justify-between text-[10px] font-medium text-brand-400 mt-2 px-1">
                                    <span>0h</span>
                                    <span>7h</span>
                                    <span>14h</span>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-3">Quality</p>
                                  <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(i => (
                                      <button
                                        key={i}
                                        onClick={() => setSleepQuality(i)}
                                        className={cn(
                                          "flex-1 py-3 animate-none rounded-2xl text-lg transition-all border-b-4",
                                          sleepQuality === i ? "bg-brand-100 border-brand-500 transform translate-y-1 border-b-0" : "bg-white border-brand-200"
                                        )}
                                      >
                                        {i === 1 && '😫'}
                                        {i === 2 && '🥱'}
                                        {i === 3 && '😐'}
                                        {i === 4 && '🙂'}
                                        {i === 5 && '🤩'}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="border-t border-brand-100 pt-4">
                          <button onClick={() => setShowExercise(!showExercise)} className="flex justify-between w-full items-center">
                            <p className="text-xs font-bold text-brand-400 uppercase">Exercise</p>
                            <ChevronUp className={cn("transition-transform", !showExercise && "rotate-180")} size={16} />
                          </button>
                          <AnimatePresence>
                            {showExercise && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-4 space-y-4">
                                <div className="flex gap-2 flex-wrap mb-2">
                                  {settings.customExerciseTypes.map(e => (
                                    <button
                                      key={e}
                                      onClick={() => setExercise(prev => prev?.type === e ? null : { type: e, intensity: 'medium', duration: 30 })}
                                      className={cn(
                                        "px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all active:scale-95",
                                        exercise?.type === e ? "bg-orange-50 border-orange-500 text-orange-700" : "bg-white border-brand-100 text-brand-500"
                                      )}
                                    >
                                      {e}
                                    </button>
                                  ))}
                                </div>
                                {exercise && (
                                  <div className="bg-surface p-4 rounded-3xl border border-brand-100 space-y-5">
                                    <div>
                                      <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-3">Duration</p>
                                      <div className="flex flex-wrap gap-2">
                                        {[10, 15, 30, 45, 60, 90].map(dur => (
                                          <button 
                                            key={dur}
                                            onClick={() => setExercise({ ...exercise, duration: dur })} 
                                            className={cn(
                                              "px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 border-b-4",
                                              exercise.duration === dur ? "bg-brand-500 text-white border-brand-700 transform translate-y-1 border-b-0" : "bg-white text-brand-500 border-brand-200"
                                            )}
                                          >
                                            {dur}m
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-3">Intensity</p>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => setExercise({ ...exercise, intensity: 'low' })}
                                          className={cn(
                                            "flex-1 py-3 rounded-xl text-sm font-bold transition-all flex flex-col items-center gap-1 border-b-4",
                                            exercise.intensity === 'low' ? "bg-green-100 text-green-700 border-green-500 transform translate-y-1 border-b-0" : "bg-white text-brand-400 border-brand-200"
                                          )}
                                        >
                                          <span className="text-xl">🌱</span> Low
                                        </button>
                                        <button
                                          onClick={() => setExercise({ ...exercise, intensity: 'medium' })}
                                          className={cn(
                                            "flex-1 py-3 rounded-xl text-sm font-bold transition-all flex flex-col items-center gap-1 border-b-4",
                                            exercise.intensity === 'medium' ? "bg-orange-100 text-orange-700 border-orange-500 transform translate-y-1 border-b-0" : "bg-white text-brand-400 border-brand-200"
                                          )}
                                        >
                                          <span className="text-xl">🔥</span> Med
                                        </button>
                                        <button
                                          onClick={() => setExercise({ ...exercise, intensity: 'high' })}
                                          className={cn(
                                            "flex-1 py-3 rounded-xl text-sm font-bold transition-all flex flex-col items-center gap-1 border-b-4",
                                            exercise.intensity === 'high' ? "bg-red-100 text-red-700 border-red-500 transform translate-y-1 border-b-0" : "bg-white text-brand-400 border-brand-200"
                                          )}
                                        >
                                          <span className="text-xl">⚡</span> High
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        
                        {(settings.customHabits || []).length > 0 && (
                          <div className="border-t border-brand-100 pt-4">
                            <p className="text-xs font-bold text-brand-400 uppercase mb-3">Custom Habits</p>
                            <div className="space-y-3">
                              {settings.customHabits?.map(habit => (
                                <div key={habit.id} className="bg-surface p-4 rounded-2xl border border-brand-100 flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-brand-900">{habit.name}</p>
                                    {(habit.unit || habit.goal) && (
                                      <p className="text-xs text-brand-500">
                                        Goal: {habit.goal || '-'} {habit.unit}
                                      </p>
                                    )}
                                  </div>
                                  
                                  {habit.type === 'boolean' ? (
                                    <button 
                                      onClick={() => setCustomHabitValues(prev => ({ ...prev, [habit.id]: !prev[habit.id] }))}
                                      className={cn(
                                        "w-8 h-8 rounded-xl flex items-center justify-center border transition-colors",
                                        customHabitValues[habit.id] ? "bg-brand-500 border-brand-500 text-white" : "border-brand-200 bg-white"
                                      )}
                                    >
                                      {customHabitValues[habit.id] && <div className="w-3 h-3 bg-white rounded-sm" />}
                                    </button>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <button 
                                        onClick={() => setCustomHabitValues(prev => ({ ...prev, [habit.id]: Math.max(0, ((prev[habit.id] as number) || 0) - 1) }))}
                                        className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center"
                                      >
                                        -
                                      </button>
                                      <span className="font-bold w-6 text-center text-sm">{((customHabitValues[habit.id] as number) || 0)}</span>
                                      <button 
                                        onClick={() => setCustomHabitValues(prev => ({ ...prev, [habit.id]: ((prev[habit.id] as number) || 0) + 1 }))}
                                        className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center"
                                      >
                                        +
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

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
                        Save Log
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
