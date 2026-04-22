import { CycleEntry } from './db';
import { differenceInDays, parseISO, isBefore, addDays } from 'date-fns';

export interface Insight {
  id: string;
  type: 'correlation' | 'trend' | 'info';
  title: string;
  description: string;
}

export const generateInsights = (entries: CycleEntry[]): Insight[] => {
  const insights: Insight[] = [];
  if (entries.length < 5) return insights;

  // 1. Symptom before period correlation
  const periodStarts = entries.filter(e => e.type === 'period_start').sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  
  if (periodStarts.length >= 2) {
    const symptomCountsBeforePeriod: Record<string, number> = {};
    let totalPeriodsAnalyzed = 0;

    periodStarts.forEach(startEntry => {
      const startDate = parseISO(startEntry.date);
      // Look at 3 days before period
      const daysBefore = entries.filter(e => {
        const d = parseISO(e.date);
        return isBefore(d, startDate) && differenceInDays(startDate, d) <= 3;
      });

      if (daysBefore.length > 0) {
        totalPeriodsAnalyzed++;
        const uniqueSymptoms = new Set<string>();
        daysBefore.forEach(d => d.symptoms.forEach(s => uniqueSymptoms.add(s)));
        uniqueSymptoms.forEach(s => {
          symptomCountsBeforePeriod[s] = (symptomCountsBeforePeriod[s] || 0) + 1;
        });
      }
    });

    // Find symptoms that happen before > 50% of periods
    Object.entries(symptomCountsBeforePeriod).forEach(([symptom, count]) => {
      if (count >= 2 && count / totalPeriodsAnalyzed >= 0.5) {
        insights.push({
          id: `symptom_before_period_${symptom}`,
          type: 'correlation',
          title: 'Pre-menstrual Pattern',
          description: `You frequently log '${symptom}' 1-3 days before your period starts.`,
        });
      }
    });
  }

  // 2. Exercise and Sleep correlation
  const exerciseDays = entries.filter(e => e.exercise && e.exercise.duration && e.exercise.duration >= 30);
  if (exerciseDays.length >= 3) {
    let totalSleepQuality = 0;
    let sleepLogsCount = 0;
    exerciseDays.forEach(e => {
      if (e.sleepQuality) {
        totalSleepQuality += e.sleepQuality;
        sleepLogsCount++;
      }
    });

    if (sleepLogsCount >= 3) {
      const avgSleepQuality = (totalSleepQuality / sleepLogsCount).toFixed(1);
      if (parseFloat(avgSleepQuality) >= 4.0) {
        insights.push({
          id: 'exercise_sleep_positive',
          type: 'correlation',
          title: 'Exercise & Sleep',
          description: `On days you exercise for 30+ mins, your sleep quality averages ${avgSleepQuality}/5.`,
        });
      }
    }
  }

  return insights;
};
