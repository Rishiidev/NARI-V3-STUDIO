import React, { useMemo } from 'react';
import { CycleEntry, UserSettings } from '../lib/db';
import { Sparkles, Droplets, Moon, Activity, TrendingDown, AlertCircle } from 'lucide-react';

interface HabitSymptomInsightsProps {
  entries: CycleEntry[];
  settings: UserSettings;
}

export const HabitSymptomInsights: React.FC<HabitSymptomInsightsProps> = ({ entries, settings }) => {
  const insights = useMemo(() => {
    const results: { message: string; habit: string; percent: number; isPositive: boolean }[] = [];
    
    const habits = [
      { id: 'water', name: 'water goal', check: (e: CycleEntry) => (e.waterIntake || 0) >= (settings.waterGoal || 2000) },
      { id: 'sleep', name: 'sleep goal', check: (e: CycleEntry) => (e.sleepDuration || 0) >= (settings.sleepGoal || 8) },
      { id: 'exercise', name: 'exercise goal', check: (e: CycleEntry) => (e.exercise?.duration || 0) >= (settings.exerciseGoal || 30) }
    ];

    const allSymptoms = new Set<string>();
    entries.forEach(e => {
      if (e.symptomIntensities) Object.keys(e.symptomIntensities).forEach(s => allSymptoms.add(s));
    });

    habits.forEach(habit => {
      const met = entries.filter(habit.check);
      const missed = entries.filter(e => !habit.check(e));

      if (met.length >= 2 && missed.length >= 2) {
        allSymptoms.forEach(symptom => {
          const metAvg = met.reduce((sum, e) => sum + (e.symptomIntensities?.[symptom] || 0), 0) / met.length;
          const missedAvg = missed.reduce((sum, e) => sum + (e.symptomIntensities?.[symptom] || 0), 0) / missed.length;

          if (missedAvg > 0 && metAvg < missedAvg) {
            const drop = missedAvg - metAvg;
            const percentDrop = Math.round((drop / missedAvg) * 100);
            if (percentDrop >= 15 && drop >= 0.3) {
              results.push({
                message: `On days you hit your ${habit.name}, your ${symptom} intensity drops by ${percentDrop}%.`,
                habit: habit.id,
                percent: percentDrop,
                isPositive: true
              });
            }
          } else if (metAvg > 0 && missedAvg < metAvg) {
             const increase = metAvg - missedAvg;
             const percentIncrease = Math.round((increase / metAvg) * 100);
             if (percentIncrease >= 15 && increase >= 0.3) {
                results.push({
                  message: `Your ${symptom} intensity is ${percentIncrease}% higher on days you miss your ${habit.name}.`,
                  habit: habit.id,
                  percent: percentIncrease,
                  isPositive: false
                });
             }
          }
        });
      }
    });

    // Sort by highest percentage impact
    return results.sort((a, b) => b.percent - a.percent).slice(0, 4); // Top 4 insights
  }, [entries, settings]);

  const getIcon = (habit: string) => {
    switch (habit) {
      case 'water': return <Droplets size={16} className="text-blue-500" />;
      case 'sleep': return <Moon size={16} className="text-indigo-500" />;
      case 'exercise': return <Activity size={16} className="text-green-500" />;
      default: return <Sparkles size={16} className="text-amber-500" />;
    }
  };

  return (
    <section className="bg-white p-6 rounded-3xl border border-brand-100 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-amber-500" size={20} />
        <h3 className="text-lg font-serif text-brand-900">Habit Insights</h3>
      </div>
      
      {insights.length === 0 ? (
        <div className="bg-brand-50 p-4 rounded-2xl text-center">
          <p className="text-sm text-brand-600">
            Keep logging your habits and symptoms for a few more days to unlock personalized correlations here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, idx) => (
            <div key={idx} className="flex gap-3 p-3 bg-brand-50 rounded-2xl items-start">
              <div className="mt-0.5 bg-white p-1.5 rounded-full shadow-sm">
                {getIcon(insight.habit)}
              </div>
              <div>
                <p className="text-sm text-brand-900 leading-snug">
                  {insight.message}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {insight.isPositive ? (
                    <TrendingDown size={12} className="text-green-600" />
                  ) : (
                    <AlertCircle size={12} className="text-amber-600" />
                  )}
                  <span className={`text-xs font-medium ${insight.isPositive ? 'text-green-600' : 'text-amber-600'}`}>
                    {insight.isPositive ? 'Positive Correlation' : 'Observation'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
