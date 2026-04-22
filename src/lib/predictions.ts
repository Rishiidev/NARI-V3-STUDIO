import { 
  addDays, 
  differenceInDays, 
  format, 
  isAfter, 
  isBefore, 
  isSameDay, 
  parseISO, 
  startOfDay,
  subDays
} from 'date-fns';
import { CycleEntry } from './db';
import { getPrediction, EnhancedPrediction } from '../features/predictions/prediction';

export type PredictionResult = EnhancedPrediction;

export const calculatePredictions = (
  entries: CycleEntry[],
  avgCycleLength: number = 28,
  avgPeriodLength: number = 5,
  excludedCycleStartDates: string[] = []
): PredictionResult | null => {
  return getPrediction(entries, avgCycleLength, avgPeriodLength, excludedCycleStartDates);
};

export const getCycleDay = (date: Date, entries: CycleEntry[]): number | null => {
  const periodStarts = entries
    .filter(e => e.type === 'period_start')
    .filter(e => isBefore(parseISO(e.date), addDays(date, 1)))
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  if (periodStarts.length === 0) return null;

  const lastStart = parseISO(periodStarts[0].date);
  return differenceInDays(startOfDay(date), startOfDay(lastStart)) + 1;
};

export const isDateInPeriod = (date: Date, entries: CycleEntry[]): boolean => {
  const sortedEntries = [...entries].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  
  let inPeriod = false;
  let lastStart: Date | null = null;

  for (const entry of sortedEntries) {
    const entryDate = parseISO(entry.date);
    if (entry.type === 'period_start') {
      lastStart = entryDate;
      if (isSameDay(date, entryDate) || isAfter(date, entryDate)) {
        inPeriod = true;
      }
    } else if (entry.type === 'period_end') {
      if (lastStart && (isSameDay(date, entryDate) || isBefore(date, entryDate)) && (isSameDay(date, lastStart) || isAfter(date, lastStart))) {
        inPeriod = true;
      }
      if (isAfter(date, entryDate)) {
        inPeriod = false;
      }
    }
  }
  
  // If we have a start but no end yet, assume it's still going if it's within a reasonable range (e.g. 7 days)
  if (inPeriod && lastStart && differenceInDays(date, lastStart) > 10) {
    inPeriod = false;
  }

  return inPeriod;
};

export const isDateInPredictedPeriod = (date: Date, predictions: PredictionResult | null): boolean => {
  if (!predictions) return false;
  return (isSameDay(date, predictions.nextPeriodStartRange[0]) || isAfter(date, predictions.nextPeriodStartRange[0])) &&
         (isSameDay(date, predictions.nextPeriodEndRange[1]) || isBefore(date, predictions.nextPeriodEndRange[1]));
};

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'unknown';

export interface CyclePhaseInfo {
  phase: CyclePhase;
  description: string;
  advice: string;
  icon: string;
}

export const getCyclePhase = (
  date: Date, 
  entries: CycleEntry[], 
  predictions: PredictionResult | null
): CyclePhaseInfo => {
  const inPeriod = isDateInPeriod(date, entries);
  if (inPeriod) {
    return {
      phase: 'menstrual',
      description: 'Menstrual Phase',
      advice: 'Focus on rest and warm foods. Gentle movement like yoga can help with cramps.',
      icon: 'Droplets'
    };
  }

  if (!predictions || predictions.isVariable || !predictions.ovulationDay || !predictions.fertileWindowStart || !predictions.fertileWindowEnd) {
    return {
      phase: 'unknown',
      description: 'Cycle ongoing',
      advice: 'Keep logging your symptoms to get better predictions.',
      icon: 'Activity'
    };
  }

  const today = startOfDay(date);
  const ovulation = startOfDay(predictions.ovulationDay);
  const fertileStart = startOfDay(predictions.fertileWindowStart);
  const fertileEnd = startOfDay(predictions.fertileWindowEnd);
  const nextPeriod = startOfDay(predictions.nextPeriodStartRange[0]);

  // Ovulatory Phase (Fertile Window)
  if ((isSameDay(today, fertileStart) || isAfter(today, fertileStart)) && 
      (isSameDay(today, fertileEnd) || isBefore(today, fertileEnd))) {
    return {
      phase: 'ovulatory',
      description: 'Ovulatory Phase',
      advice: 'Energy levels are usually high. Great time for social activities and intense workouts.',
      icon: 'Sparkles'
    };
  }

  // Follicular Phase (After period, before fertile window)
  const periodStarts = entries
    .filter(e => e.type === 'period_start')
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  
  if (periodStarts.length > 0) {
    const lastStart = parseISO(periodStarts[0].date);
    if (isAfter(today, lastStart) && isBefore(today, fertileStart)) {
      return {
        phase: 'follicular',
        description: 'Follicular Phase',
        advice: 'Creativity and planning are peaked. Try new things and stay active.',
        icon: 'Zap'
      };
    }
  }

  // Luteal Phase (After ovulation, before next period)
  if (isAfter(today, fertileEnd) && isBefore(today, nextPeriod)) {
    return {
      phase: 'luteal',
      description: 'Luteal Phase',
      advice: 'You might feel more introspective. Prioritize self-care and magnesium-rich foods.',
      icon: 'Moon'
    };
  }

  return {
    phase: 'unknown',
    description: 'Cycle ongoing',
    advice: 'Keep logging your symptoms to get better predictions.',
    icon: 'Activity'
  };
};

export const getStatusMessage = (
  cycleDay: number | null, 
  entries: CycleEntry[], 
  predictions: PredictionResult | null
): string => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const hasLoggedToday = entries.some(e => e.date === today);

  if (!hasLoggedToday) return "No logs yet today";

  if (predictions && !predictions.isVariable) {
    const daysToPeriod = differenceInDays(predictions.nextPeriodStartRange[0], new Date());
    if (daysToPeriod >= 0 && daysToPeriod <= 3) return `Next period in ~${daysToPeriod} days`;
    if (daysToPeriod > 3 && daysToPeriod <= 7) return "You’re within your usual range";
  } else if (predictions && predictions.isVariable) {
    const daysToPeriodStart = differenceInDays(predictions.nextPeriodStartRange[0], new Date());
    const daysToPeriodEnd = differenceInDays(predictions.nextPeriodStartRange[1], new Date());
    if (daysToPeriodStart <= 3 && daysToPeriodEnd >= 0) return "Period expected soon";
  }

  if (cycleDay) return "Cycle ongoing";

  return "Ready to track";
};
