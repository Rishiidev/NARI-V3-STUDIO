import React, { useState, useMemo } from 'react';
import { format, subDays, isAfter, parseISO } from 'date-fns';
import { CycleEntry, UserSettings, CustomHabit } from '../lib/db';
import { Activity, Droplets, Moon, Edit3, Check, Plus, Trash2, X, TrendingUp, Flame, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';

// Helper calculates current streak
const calculateStreak = (metDates: Set<string>) => {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

  let streak = 0;
  let currDate = today;

  if (!metDates.has(todayStr) && !metDates.has(yesterdayStr)) {
    return 0;
  }

  if (!metDates.has(todayStr)) {
    currDate = subDays(today, 1);
  }

  while (metDates.has(format(currDate, 'yyyy-MM-dd'))) {
    streak++;
    currDate = subDays(currDate, 1);
  }

  return streak;
};

// Core Habit Widget Component
const CoreHabitCard = ({ 
  title, 
  value, 
  goal, 
  unit, 
  icon: Icon,
  colorClass,
  streak = 0,
  onLog
}: { 
  title: string, value: number, goal: number, unit: string, icon: any, colorClass: string, streak?: number, onLog: (val: number) => void 
}) => {
  const progress = Math.min(100, (value / goal) * 100);
  
  return (
    <div className="bg-surface p-5 rounded-3xl border border-brand-100 shadow-sm relative overflow-hidden">
      <div className={`absolute top-0 right-0 p-4 opacity-5 ${colorClass}`}>
        <Icon size={80} />
      </div>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${colorClass} bg-opacity-20`}>
              <Icon size={20} className={colorClass} />
            </div>
            <h3 className="font-serif font-bold text-lg text-brand-900">{title}</h3>
            {streak >= 7 && (
              <Award size={16} className={streak >= 30 ? "text-red-500" : "text-yellow-500"} />
            )}
            {streak > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 ml-1">
                <Flame size={10} className="text-orange-500" /> {streak} {streak === 1 ? 'day' : 'days'}
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-brand-600">{value} <span className="text-xs font-normal text-brand-400">/ {goal} {unit}</span></p>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 w-full bg-brand-50 rounded-full overflow-hidden mb-4">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={`h-full ${progress >= 100 ? 'bg-green-500' : 'bg-brand-500'}`}
          />
        </div>

        {/* Quick Log Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={() => onLog(value + (title === 'Water' ? 250 : title === 'Sleep' ? 1 : 15))}
            className="flex-1 py-2 bg-brand-50 text-brand-700 rounded-xl text-sm font-bold active:scale-95 transition-transform"
          >
            + {title === 'Water' ? '250ml' : title === 'Sleep' ? '1 hr' : '15 min'}
          </button>
          <button 
            onClick={() => onLog(Math.max(0, value - (title === 'Water' ? 250 : title === 'Sleep' ? 1 : 15)))}
            disabled={value === 0}
            className="px-4 py-2 bg-brand-50/50 text-brand-500 rounded-xl text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
          >
            -
          </button>
        </div>
      </div>
    </div>
  );
};

const ContributionGraph = ({ entries, settings }: { entries: CycleEntry[], settings: UserSettings }) => {
  const [showTooltip, setShowTooltip] = useState<{ x: number, y: number, date: string, count: number } | null>(null);

  const days = useMemo(() => {
    const today = new Date();
    const result = [];
    const maxScore = 3 + (settings.customHabits?.length || 0);

    // we will show last 14 weeks = 98 days
    for (let i = 97; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const entry = entries.find(e => e.date === dateStr);
      
      let score = 0;
      if (entry) {
        if ((entry.waterIntake || 0) >= (settings.waterGoal || 2000)) score++;
        if ((entry.sleepDuration || 0) >= (settings.sleepGoal || 8)) score++;
        if ((entry.exercise?.duration || 0) >= (settings.exerciseGoal || 30)) score++;
        (settings.customHabits || []).forEach(h => {
          if (h.type === 'boolean' && entry.customHabitValues?.[h.id]) score++;
          if (h.type === 'counter' && (entry.customHabitValues?.[h.id] as number || 0) >= (h.goal || 1)) score++;
        });
      }

      let level = 0;
      if (maxScore > 0) {
        const ratio = score / maxScore;
        if (ratio > 0 && ratio <= 0.25) level = 1;
        else if (ratio > 0.25 && ratio <= 0.5) level = 2;
        else if (ratio > 0.5 && ratio <= 0.75) level = 3;
        else if (ratio > 0.75) level = 4;
      }

      result.push({ date: dateStr, score, level });
    }
    return result;
  }, [entries, settings]);

  const getColor = (level: number) => {
    if (level === 4) return 'bg-brand-600';
    if (level === 3) return 'bg-brand-500';
    if (level === 2) return 'bg-brand-300';
    if (level === 1) return 'bg-brand-200';
    return 'bg-brand-50/50';
  };

  // Organize by week and day of week
  // We want to render columns (weeks). 
  // Wait, standard github graph renders left to right by column. Each column is a week. Row 0 = Sunday.
  const columns: any[][] = [];
  let currentColumn: any[] = [];
  
  days.forEach((day, i) => {
    const dayOfWeek = new Date(day.date).getDay(); // 0-6
    // if it's the very first element, we might need to pad the beginning so Sunday is row 0
    if (i === 0) {
      for (let pad = 0; pad < dayOfWeek; pad++) {
        currentColumn.push(null);
      }
    }
    
    currentColumn.push(day);
    if (currentColumn.length === 7) {
      columns.push(currentColumn);
      currentColumn = [];
    }
  });
  if (currentColumn.length > 0) {
    while (currentColumn.length < 7) currentColumn.push(null);
    columns.push(currentColumn);
  }

  return (
    <div className="bg-surface p-5 rounded-3xl border border-brand-100 shadow-sm relative w-full overflow-hidden">
      <h4 className="text-sm font-bold text-brand-900 mb-4 flex items-center justify-between">
        Consistency Map
        <span className="text-[10px] font-normal text-brand-500">Last 98 days</span>
      </h4>
      <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar" onMouseLeave={() => setShowTooltip(null)}>
        {columns.map((col, colIdx) => (
          <div key={colIdx} className="flex flex-col gap-1">
            {col.map((day, rowIdx) => {
              if (!day) return <div key={rowIdx} className="w-[10px] h-[10px] sm:w-3 sm:h-3 transparent" />;
              return (
                <div 
                  key={rowIdx} 
                  className={cn("w-[10px] h-[10px] sm:w-3 sm:h-3 rounded-[2px]", getColor(day.level))}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setShowTooltip({ x: rect.left, y: rect.top, date: day.date, count: day.score });
                  }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setShowTooltip({ x: rect.left, y: rect.top, date: day.date, count: day.score });
                    setTimeout(() => setShowTooltip(null), 2000);
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 mt-3 justify-end text-[10px] text-brand-400 font-medium">
        Less
        <div className="w-[10px] h-[10px] rounded-[2px] bg-brand-50/50 ml-1"></div>
        <div className="w-[10px] h-[10px] rounded-[2px] bg-brand-200"></div>
        <div className="w-[10px] h-[10px] rounded-[2px] bg-brand-300"></div>
        <div className="w-[10px] h-[10px] rounded-[2px] bg-brand-500"></div>
        <div className="w-[10px] h-[10px] rounded-[2px] bg-brand-600 mr-1"></div>
        More
      </div>
      
      {showTooltip && (
        <div 
          className="fixed z-50 pointer-events-none bg-gray-900 text-white text-[10px] py-1 px-2 rounded font-medium transform -translate-y-full -translate-x-1/2"
          style={{ top: showTooltip.y - 4, left: showTooltip.x + 5 }}
        >
          <div className="whitespace-nowrap">{showTooltip.count} goals on {format(parseISO(showTooltip.date), 'MMM d, yyyy')}</div>
        </div>
      )}
    </div>
  );
};

const CustomHabitCard = ({
  habit,
  value,
  streak = 0,
  historicalData,
  onLog
}: {
  habit: CustomHabit,
  value: boolean | number | undefined,
  streak?: number,
  historicalData?: any[],
  onLog: (val: boolean | number) => void
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [localVal, setLocalVal] = useState(typeof value === 'number' ? value : 0);
  const [loggingAnim, setLoggingAnim] = useState(false);

  React.useEffect(() => {
    if (typeof value === 'number') {
      setLocalVal(value);
    }
  }, [value]);

  const handleLogBoolean = (newVal: boolean) => {
    setLoggingAnim(true);
    onLog(newVal);
    setTimeout(() => setLoggingAnim(false), 300);
  };

  const handleLogCounter = (newVal: number) => {
    setLocalVal(newVal);
    setLoggingAnim(true);
    onLog(newVal);
    setTimeout(() => setLoggingAnim(false), 300);
  };

  if (habit.type === 'boolean') {
    const isChecked = !!value;
    return (
      <div className="bg-surface rounded-3xl border border-brand-100 shadow-sm overflow-hidden transition-all mb-4">
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "p-5 cursor-pointer transition-colors flex items-center justify-between",
            isChecked ? "bg-brand-50" : "bg-surface"
          )}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-brand-900">{habit.name}</span>
            {streak >= 7 && (
              <Award size={14} className={streak >= 30 ? "text-red-500" : "text-yellow-500"} />
            )}
            {streak > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
                <Flame size={10} className="text-orange-500" /> {streak}
              </span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleLogBoolean(!isChecked); }}
            className={cn(
              "w-6 h-6 rounded-lg flex items-center justify-center border transition-all",
              loggingAnim ? "scale-110" : "scale-100",
              isChecked ? "bg-brand-500 border-brand-500 text-white" : "border-brand-200 bg-white text-transparent"
            )}
          >
            <Check size={14} />
          </button>
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-5 pb-5 pt-0 overflow-hidden"
            >
              <div className="pt-4 border-t border-brand-100/50 flex gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-brand-400 font-bold">Goal</span>
                  <span className="text-xs text-brand-900 font-medium">Daily Yes</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-brand-400 font-bold">Current Streak</span>
                  <span className="text-xs text-brand-900 font-medium">{streak} days</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Counter
  const count = localVal;
  return (
    <div className="bg-surface rounded-3xl border border-brand-100 shadow-sm overflow-hidden transition-all mb-4">
      <div className="p-5 flex items-center justify-between flex-wrap gap-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-brand-900">{habit.name}</h3>
            {streak >= 7 && (
              <Award size={14} className={streak >= 30 ? "text-red-500" : "text-yellow-500"} />
            )}
            {streak > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
                <Flame size={10} className="text-orange-500" /> {streak}
              </span>
            )}
          </div>
          {(habit.goal || habit.unit) && (
            <p className="text-xs text-brand-500 mt-1">
              {count} {habit.goal ? `/ ${habit.goal}` : ''} {habit.unit || ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button 
            onClick={() => handleLogCounter(Math.max(0, count - 1))}
            className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center active:scale-95"
          >
            -
          </button>
          <input 
             type="number"
             value={count}
             onChange={(e) => {
               const v = parseInt(e.target.value) || 0;
               setLocalVal(v);
             }}
             onBlur={() => handleLogCounter(count)}
             className={cn("w-10 text-center font-bold text-sm bg-transparent border-b border-transparent focus:border-brand-200 outline-none transition-all", loggingAnim ? "text-brand-500 scale-110" : "text-brand-900")}
          />
          <button 
            onClick={() => handleLogCounter(count + 1)}
            className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center active:scale-95"
          >
            +
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 pb-5 pt-0 overflow-hidden"
          >
            <div className="pt-4 border-t border-brand-100/50 flex justify-between items-center">
              <div className="flex gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-brand-400 font-bold">Goal</span>
                  <span className="text-xs text-brand-900 font-medium">{habit.goal || 'None'} {habit.unit}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-brand-400 font-bold">Current Streak</span>
                  <span className="text-xs text-brand-900 font-medium">{streak} days</span>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowHistory(!showHistory); }}
                className="text-xs font-bold text-brand-500 bg-brand-50 px-3 py-1.5 rounded-full"
              >
                {showHistory ? 'Hide History' : 'View History'}
              </button>
            </div>
            
            <AnimatePresence>
              {showHistory && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 pt-4 border-t border-brand-100/50 h-32 w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 4px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                        labelStyle={{ fontSize: '10px', color: '#a54231' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey={habit.id} 
                        stroke="#10b981" 
                        strokeWidth={2} 
                        dot={false} 
                        name={habit.name} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


export const HabitsPage = ({ 
  entries, 
  settings, 
  addEntry, 
  updateEntry,
  updateSettings
}: { 
  entries: CycleEntry[], 
  settings: UserSettings, 
  addEntry: (e: CycleEntry) => Promise<void>, 
  updateEntry: (e: CycleEntry) => Promise<void>,
  updateSettings: (s: Partial<UserSettings>) => Promise<void>
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitType, setNewHabitType] = useState<'boolean'|'counter'>('boolean');
  const [newHabitUnit, setNewHabitUnit] = useState('');
  const [newHabitGoal, setNewHabitGoal] = useState<number | ''>('');
  const [newHabitStartValue, setNewHabitStartValue] = useState<number>(0);
  
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayEntry = entries.find(e => e.date === todayStr);

  const getDatesGoalMet = (criteria: (e: CycleEntry) => boolean) => {
    return new Set(entries.filter(criteria).map(e => e.date));
  };

  const streaks = useMemo(() => {
    const waterStreak = calculateStreak(getDatesGoalMet(e => (e.waterIntake || 0) >= settings.waterGoal));
    const sleepStreak = calculateStreak(getDatesGoalMet(e => (e.sleepDuration || 0) >= settings.sleepGoal));
    const exerciseStreak = calculateStreak(getDatesGoalMet(e => (e.exercise?.duration || 0) >= settings.exerciseGoal));
    
    const customStreaks: Record<string, number> = {};
    (settings.customHabits || []).forEach(habit => {
      customStreaks[habit.id] = calculateStreak(
        getDatesGoalMet(e => habit.type === 'boolean' 
          ? !!e.customHabitValues?.[habit.id] 
          : (e.customHabitValues?.[habit.id] as number || 0) >= (habit.goal || 1)
        )
      );
    });

    return { waterStreak, sleepStreak, exerciseStreak, customStreaks };
  }, [entries, settings]);

  const trophies = useMemo(() => [
    { id: 'water-7', title: 'Hydration Hero', desc: '7-day water streak', icon: Droplets, color: 'text-blue-500 bg-blue-100 border-blue-200', unlocked: streaks.waterStreak >= 7 },
    { id: 'sleep-7', title: 'Sleep Master', desc: '7-day sleep streak', icon: Moon, color: 'text-indigo-500 bg-indigo-100 border-indigo-200', unlocked: streaks.sleepStreak >= 7 },
    { id: 'exercise-3', title: 'Getting Active', desc: '3-day exercise streak', icon: Activity, color: 'text-orange-500 bg-orange-100 border-orange-200', unlocked: streaks.exerciseStreak >= 3 },
    { id: 'all-30', title: 'Unstoppable', desc: '30-day streak in any habit', icon: Flame, color: 'text-red-500 bg-red-100 border-red-200', unlocked: Math.max(streaks.waterStreak, streaks.sleepStreak, streaks.exerciseStreak, ...Object.values(streaks.customStreaks)) >= 30 }
  ], [streaks]);

  const historicalData = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    return entries
      .filter(e => isAfter(parseISO(e.date), thirtyDaysAgo))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(e => {
        const dataPoint: any = {
          date: format(parseISO(e.date), 'MMM dd'),
          water: e.waterIntake || 0,
          sleep: e.sleepDuration || 0,
          exercise: e.exercise?.duration || 0
        };
        (settings.customHabits || []).forEach(habit => {
          if (habit.type === 'counter') {
            dataPoint[habit.id] = (e.customHabitValues?.[habit.id] as number) || 0;
          }
        });
        return dataPoint;
      });
  }, [entries, settings.customHabits]);

  const handleUpdateCore = async (field: 'waterIntake' | 'sleepDuration', value: number) => {
    if (todayEntry) {
      await updateEntry({ ...todayEntry, [field]: value });
    } else {
      await addEntry({
        date: todayStr,
        type: 'none',
        flow: 'none',
        symptoms: [],
        moods: [],
        notes: '',
        [field]: value
      });
    }
  };

  const handleUpdateExercise = async (duration: number) => {
    const exercise = todayEntry?.exercise ? { ...todayEntry.exercise, duration } : { type: 'Other', intensity: 'medium' as const, duration };
    if (todayEntry) {
      await updateEntry({ ...todayEntry, exercise });
    } else {
      await addEntry({
        date: todayStr,
        type: 'none',
        flow: 'none',
        symptoms: [],
        moods: [],
        notes: '',
        exercise
      });
    }
  };

  const handleUpdateCustom = async (id: string, value: boolean | number) => {
    if (todayEntry) {
      const customHabitValues = { ...(todayEntry.customHabitValues || {}), [id]: value };
      await updateEntry({ ...todayEntry, customHabitValues });
    } else {
      await addEntry({
        date: todayStr,
        type: 'none',
        flow: 'none',
        symptoms: [],
        moods: [],
        notes: '',
        customHabitValues: { [id]: value }
      });
    }
  };

  const handleAddCustomHabit = async () => {
    if (!newHabitName.trim()) return;
    const newHabit: CustomHabit = {
      id: `habit_${Date.now()}`,
      name: newHabitName.trim(),
      type: newHabitType,
      ...(newHabitType === 'counter' && newHabitUnit ? { unit: newHabitUnit } : {}),
      ...(newHabitType === 'counter' && typeof newHabitGoal === 'number' ? { goal: newHabitGoal } : {})
    };
    const updatedHabits = [...(settings.customHabits || []), newHabit];
    await updateSettings({ customHabits: updatedHabits });
    
    // Log starting value
    if (newHabitType === 'counter' && typeof newHabitStartValue === 'number') {
      // Need custom update function call logic for starting value
      if (todayEntry) {
        const customHabitValues = { ...(todayEntry.customHabitValues || {}), [newHabit.id]: newHabitStartValue };
        await updateEntry({ ...todayEntry, customHabitValues });
      } else {
        await addEntry({
          date: todayStr,
          type: 'none',
          flow: 'none',
          symptoms: [],
          moods: [],
          notes: '',
          customHabitValues: { [newHabit.id]: newHabitStartValue }
        });
      }
    }

    setNewHabitName('');
    setNewHabitUnit('');
    setNewHabitGoal('');
    setNewHabitStartValue(0);
    setIsEditing(false);
  };

  const handleDeleteCustomHabit = async (id: string) => {
    const updatedHabits = (settings.customHabits || []).filter(h => h.id !== id);
    await updateSettings({ customHabits: updatedHabits });
  };

  return (
    <div className="pb-24 pt-6 px-6 max-w-md mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-brand-400 text-[10px] uppercase tracking-widest font-bold mb-1">Today's Habits</p>
          <h2 className="text-2xl font-serif text-brand-900 leading-tight">Daily Tracking</h2>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="p-2 bg-white rounded-full border border-brand-100 text-brand-600 shadow-sm"
        >
          {isEditing ? <Check size={20} /> : <Edit3 size={20} />}
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-400 uppercase tracking-widest px-2">Core Habits</h3>
        <CoreHabitCard 
          title="Water"
          value={todayEntry?.waterIntake || 0}
          goal={settings.waterGoal || 2000}
          unit="ml"
          icon={Droplets}
          colorClass="text-blue-500"
          streak={streaks.waterStreak}
          onLog={(v) => handleUpdateCore('waterIntake', v)}
        />
        <CoreHabitCard 
          title="Sleep"
          value={todayEntry?.sleepDuration || 0}
          goal={settings.sleepGoal || 8}
          unit="hrs"
          icon={Moon}
          colorClass="text-indigo-500"
          streak={streaks.sleepStreak}
          onLog={(v) => handleUpdateCore('sleepDuration', v)}
        />
        <CoreHabitCard 
          title="Exercise"
          value={todayEntry?.exercise?.duration || 0}
          goal={settings.exerciseGoal || 30}
          unit="mins"
          icon={Activity}
          colorClass="text-orange-500"
          streak={streaks.exerciseStreak}
          onLog={(v) => handleUpdateExercise(v)}
        />
      </div>

      <div className="space-y-4 mt-8">
        <h3 className="text-xs font-bold text-brand-400 uppercase tracking-widest px-2">Custom Habits</h3>
        
        {(!settings.customHabits || settings.customHabits.length === 0) && !isEditing && (
          <div className="bg-brand-50 p-6 rounded-3xl text-center border border-brand-100 border-dashed">
            <p className="text-sm text-brand-600 mb-3">You don't have any custom habits yet.</p>
            <button 
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-white rounded-xl text-brand-700 text-sm font-bold shadow-sm"
            >
              Create One
            </button>
          </div>
        )}

        {settings.customHabits?.map(habit => (
          <div key={habit.id} className="relative">
            <CustomHabitCard 
              habit={habit}
              value={todayEntry?.customHabitValues?.[habit.id]}
              streak={streaks.customStreaks[habit.id]}
              historicalData={historicalData}
              onLog={(val) => handleUpdateCustom(habit.id, val)}
            />
            {isEditing && (
              <button 
                onClick={() => handleDeleteCustomHabit(habit.id)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-sm"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}

        {isEditing && (
          <div className="bg-white p-4 rounded-3xl border border-brand-100 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-brand-900">Add New Habit</h4>
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Habit Name (e.g. Read 10 mins)"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                className="w-full p-3 rounded-xl border border-brand-100 text-sm"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => setNewHabitType('boolean')}
                  className={cn("flex-1 py-2 text-xs font-bold rounded-xl border", newHabitType === 'boolean' ? "bg-brand-500 text-white border-brand-500" : "bg-white text-brand-600 border-brand-100")}
                >
                  Yes/No
                </button>
                <button 
                  onClick={() => setNewHabitType('counter')}
                  className={cn("flex-1 py-2 text-xs font-bold rounded-xl border", newHabitType === 'counter' ? "bg-brand-500 text-white border-brand-500" : "bg-white text-brand-600 border-brand-100")}
                >
                  Counter
                </button>
              </div>

              {newHabitType === 'counter' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Unit (e.g. cups)"
                      value={newHabitUnit}
                      onChange={(e) => setNewHabitUnit(e.target.value)}
                      className="flex-1 p-3 rounded-xl border border-brand-100 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Goal"
                      value={newHabitGoal}
                      onChange={(e) => setNewHabitGoal(e.target.value ? parseInt(e.target.value) : '')}
                      className="flex-1 p-3 rounded-xl border border-brand-100 text-sm"
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm font-medium text-brand-600 flex-1">Starting Value (Today)</span>
                    <input
                      type="number"
                      placeholder="Start Value"
                      value={newHabitStartValue}
                      onChange={(e) => setNewHabitStartValue(e.target.value ? parseInt(e.target.value) : 0)}
                      className="w-24 p-3 rounded-xl border border-brand-100 text-sm text-center"
                    />
                  </div>
                </div>
              )}

              <button 
                onClick={handleAddCustomHabit}
                disabled={!newHabitName.trim()}
                className="w-full py-3 bg-brand-100 text-brand-700 rounded-xl text-sm font-bold disabled:opacity-50"
              >
                Add Habit
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 pt-8 border-t border-brand-100">
        <h3 className="text-xs font-bold text-brand-400 uppercase tracking-widest px-2 flex items-center gap-2">
          <Award size={14} /> Trophies & Milestones
        </h3>
        
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar px-2 -mx-2">
          {trophies.map((trophy) => (
            <div 
              key={trophy.id} 
              className={cn(
                "snap-start shrink-0 w-40 p-4 rounded-3xl border transition-all",
                trophy.unlocked ? `${trophy.color} border-current opacity-100` : "bg-surface border-brand-100 opacity-50 grayscale"
              )}
            >
              <div className="w-12 h-12 rounded-2xl bg-white/50 backdrop-blur flex items-center justify-center mb-3">
                <trophy.icon size={24} className={trophy.unlocked ? "text-current" : "text-brand-400"} />
              </div>
              <h4 className="text-sm font-bold mb-1 line-clamp-1">{trophy.title}</h4>
              <p className="text-[10px] opacity-80 leading-tight">{trophy.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-brand-100">
        <h3 className="text-xs font-bold text-brand-400 uppercase tracking-widest px-2 flex items-center gap-2">
          <TrendingUp size={14} /> 30-Day Trends
        </h3>
        
        <ContributionGraph entries={entries} settings={settings} />

        <div className="bg-surface p-5 rounded-3xl border border-brand-100 shadow-sm relative">
          <h4 className="text-sm font-bold text-brand-900 mb-4">Core Habits</h4>
          {historicalData.length > 0 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a54231' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#a54231' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ fontSize: '12px', color: '#a54231', marginBottom: '4px' }}
                  />
                  <Line type="monotone" dataKey="water" stroke="#3b82f6" strokeWidth={2} dot={false} name="Water (ml)" />
                  <Line type="monotone" dataKey="sleep" stroke="#6366f1" strokeWidth={2} dot={false} name="Sleep (hr)" />
                  <Line type="monotone" dataKey="exercise" stroke="#f97316" strokeWidth={2} dot={false} name="Exercise (m)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-brand-500 text-center py-8">Not enough data to show trends.</p>
          )}
        </div>

        {(settings.customHabits || []).filter(h => h.type === 'counter').length > 0 && (
          <div className="bg-surface p-5 rounded-3xl border border-brand-100 shadow-sm relative">
            <h4 className="text-sm font-bold text-brand-900 mb-4">Custom Habits</h4>
            {historicalData.length > 0 ? (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a54231' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#a54231' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      labelStyle={{ fontSize: '12px', color: '#a54231', marginBottom: '4px' }}
                    />
                    {settings.customHabits?.filter(h => h.type === 'counter').map((habit, index) => {
                      const colors = ['#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4'];
                      return (
                        <Line 
                          key={habit.id}
                          type="monotone" 
                          dataKey={habit.id} 
                          stroke={colors[index % colors.length]} 
                          strokeWidth={2} 
                          dot={false} 
                          name={habit.name + (habit.unit ? ` (${habit.unit})` : '')} 
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-brand-500 text-center py-8">Not enough data to show trends.</p>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
