import React from 'react';
import { CycleEntry, UserSettings } from '../lib/db';
import { PredictionResult } from '../lib/predictions';
import { Calendar } from './Calendar';
import { PredictionExplanation } from './PredictionExplanation';
import { SymptomCorrelationHeatmap } from './SymptomCorrelationHeatmap';
import { PhaseBasedTips } from './PhaseBasedTips';
import { CircularCycleView } from './CircularCycleView';
import { HabitSymptomInsights } from './HabitSymptomInsights';
import { PartnerSummaryWidget } from './PartnerSummaryWidget';
import { Droplets, Calendar as CalendarIcon, Target, Activity, Moon } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { getStatusMessage } from '../lib/predictions';
import { cn } from '../lib/utils';

interface DashboardProps {
  entries: CycleEntry[];
  settings: UserSettings;
  predictions: PredictionResult | null;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  setIsLogOpen: (isOpen: boolean) => void;
  addEntry: (entry: CycleEntry) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  phaseInfo: { phase: string };
  cycleDay: number;
  isPeriodActive: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  entries,
  settings,
  predictions,
  selectedDate,
  setSelectedDate,
  setIsLogOpen,
  addEntry,
  updateSettings,
  phaseInfo,
  cycleDay,
  isPeriodActive,
}) => {
  const todayEntry = entries.find(e => e.date === format(new Date(), 'yyyy-MM-dd'));
  const waterProgress = Math.min(100, ((todayEntry?.waterIntake || 0) / (settings.waterGoal || 2000)) * 100);
  const sleepProgress = Math.min(100, ((todayEntry?.sleepDuration || 0) / (settings.sleepGoal || 8)) * 100);
  const exerciseProgress = Math.min(100, ((todayEntry?.exercise?.duration || 0) / (settings.exerciseGoal || 30)) * 100);

  // Calculate Streak
  const currentStreak = React.useMemo(() => {
    let streak = 0;
    const sortedDates = Array.from(new Set(entries.map(e => e.date))).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let checkDate = new Date();
    // If they haven't logged today, start checking from yesterday
    if (!sortedDates.includes(format(checkDate, 'yyyy-MM-dd'))) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    for (const dateStr of sortedDates) {
      if (dateStr === format(checkDate, 'yyyy-MM-dd')) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [entries]);

  const WIDGETS: Record<string, React.ReactNode> = {
    status: (
      <section className="bg-gradient-to-br from-white to-brand-50/50 rounded-3xl p-6 shadow-sm border border-brand-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <Droplets size={80} />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-brand-400 text-[10px] uppercase tracking-widest font-bold mb-1">Current Status</p>
              <h2 className="text-2xl font-serif text-brand-900 leading-tight tracking-tight">
                {getStatusMessage(cycleDay, entries, predictions)}
              </h2>
            </div>
            {currentStreak > 0 && (
              <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                🔥 {currentStreak} Day{currentStreak !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          
          {predictions && predictions.confidence !== 'none' && (
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-brand-100 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-brand-400 text-[9px] uppercase tracking-widest font-bold mb-0.5">Next Period</p>
                <p className="text-brand-900 font-serif text-lg">
                  {predictions.isVariable 
                    ? `${format(predictions.nextPeriodStartRange[0], 'MMM d')} - ${format(predictions.nextPeriodStartRange[1], 'MMM d')}`
                    : format(predictions.nextPeriodStartRange[0], 'MMM d, yyyy')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-brand-500 font-bold text-xl">
                  {differenceInDays(predictions.nextPeriodStartRange[0], new Date()) > 0 
                    ? differenceInDays(predictions.nextPeriodStartRange[0], new Date())
                    : 0}
                </p>
                <p className="text-brand-400 text-[9px] uppercase tracking-widest font-bold">Days Away</p>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setSelectedDate(new Date());
                addEntry({
                  date: format(new Date(), 'yyyy-MM-dd'),
                  type: isPeriodActive ? 'period_end' : 'period_start',
                  flow: isPeriodActive ? 'none' : 'medium',
                  symptoms: [],
                  moods: [],
                  notes: ''
                });
              }}
              className="flex-1 bg-brand-600 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all hover:shadow-lg hover:bg-brand-700"
            >
              <span>{isPeriodActive ? 'End Period' : 'Start Period'}</span>
            </button>
            <button 
              onClick={() => {
                setSelectedDate(new Date());
                setIsLogOpen(true);
              }}
              className="px-4 py-3 bg-brand-100 border border-brand-200 text-brand-900 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all hover:bg-brand-200"
            >
              Log
            </button>
          </div>
        </div>
      </section>
    ),
    habit_status: (
      <section className="bg-surface rounded-3xl p-6 shadow-sm border border-brand-100 relative overflow-hidden">
        <h3 className="text-brand-900 font-serif font-bold text-lg mb-4">Today's Habits</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-bold text-brand-600 mb-1">
              <span className="flex items-center gap-1"><Droplets size={12} /> Water</span>
              <span>{todayEntry?.waterIntake || 0} / {settings.waterGoal || 2000} ml</span>
            </div>
            <div className="w-full bg-brand-50 rounded-full h-2">
              <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${waterProgress}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-bold text-brand-600 mb-1">
              <span className="flex items-center gap-1"><Moon size={12} /> Sleep</span>
              <span>{todayEntry?.sleepDuration || 0} / {settings.sleepGoal || 8} hrs</span>
            </div>
            <div className="w-full bg-brand-50 rounded-full h-2">
              <div className="bg-indigo-400 h-2 rounded-full" style={{ width: `${sleepProgress}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-bold text-brand-600 mb-1">
              <span className="flex items-center gap-1"><Activity size={12} /> Activity</span>
              <span>{todayEntry?.exercise?.duration || 0} / {settings.exerciseGoal || 30} min</span>
            </div>
            <div className="w-full bg-brand-50 rounded-full h-2">
              <div className="bg-orange-400 h-2 rounded-full" style={{ width: `${exerciseProgress}%` }}></div>
            </div>
          </div>
        </div>
      </section>
    ),
    circular_cycle: (
      <CircularCycleView 
        cycleDay={cycleDay} 
        settings={settings} 
        phase={phaseInfo.phase} 
      />
    ),
    calendar: (
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-serif text-brand-900">Calendar</h3>
        </div>
        <Calendar 
          entries={entries} 
          predictions={predictions}
          selectedDate={selectedDate} 
          onDateSelect={(date) => {
            setSelectedDate(date);
            setIsLogOpen(true);
          }} 
        />
      </section>
    ),
    insights: (
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-brand-100 space-y-2">
          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-500">
            <CalendarIcon size={16} />
          </div>
          <p className="text-xs text-brand-400 font-medium">Avg Cycle</p>
          <p className="text-xl font-serif text-brand-900">{settings.averageCycleLength} days</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-brand-100 space-y-2">
          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-500">
            <Droplets size={16} />
          </div>
          <p className="text-xs text-brand-400 font-medium">Avg Period</p>
          <p className="text-xl font-serif text-brand-900">{settings.averagePeriodLength} days</p>
        </div>
      </section>
    ),
    habits: (
      <section className="bg-surface rounded-3xl p-6 shadow-sm border border-brand-100 relative overflow-hidden">
        <h3 className="text-brand-900 font-serif font-bold text-lg mb-4">Today's Habits</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-bold text-brand-600 mb-1">
              <span className="flex items-center gap-1"><Droplets size={12} /> Water</span>
              <span>{todayEntry?.waterIntake || 0} / {settings.waterGoal || 2000} ml</span>
            </div>
            <div className="w-full bg-brand-50 rounded-full h-2">
              <div className="bg-blue-400 h-2 rounded-full transition-all duration-500" style={{ width: `${waterProgress}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-bold text-brand-600 mb-1">
              <span className="flex items-center gap-1"><Moon size={12} /> Sleep</span>
              <span>{todayEntry?.sleepDuration || 0} / {settings.sleepGoal || 8} hrs</span>
            </div>
            <div className="w-full bg-brand-50 rounded-full h-2">
              <div className="bg-indigo-400 h-2 rounded-full transition-all duration-500" style={{ width: `${sleepProgress}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-bold text-brand-600 mb-1">
              <span className="flex items-center gap-1"><Activity size={12} /> Activity</span>
              <span>{todayEntry?.exercise?.duration || 0} / {settings.exerciseGoal || 30} min</span>
            </div>
            <div className="w-full bg-brand-50 rounded-full h-2">
              <div className="bg-orange-400 h-2 rounded-full transition-all duration-500" style={{ width: `${exerciseProgress}%` }}></div>
            </div>
          </div>
        </div>
      </section>
    ),
    prediction: (
      <section>
        <PredictionExplanation entries={entries} />
      </section>
    ),
    daily_insight: (
      <section>
        <PhaseBasedTips 
          currentPhase={phaseInfo.phase === 'unknown' ? 'follicular' : phaseInfo.phase as any} 
          settings={settings}
          onUpdateSettings={updateSettings}
        />
      </section>
    ),
    symptom_patterns: (
      <section>
        <SymptomCorrelationHeatmap entries={entries} />
      </section>
    ),
    habit_insights: (
      <HabitSymptomInsights entries={entries} settings={settings} />
    ),
    partner_sync: (
      <PartnerSummaryWidget phase={phaseInfo.phase} todayEntry={todayEntry} />
    ),
  };

  return (
    <div className="space-y-6">
      {settings.dashboardOrder.map(id => (
        <React.Fragment key={id}>
          {WIDGETS[id]}
        </React.Fragment>
      ))}
    </div>
  );
};
