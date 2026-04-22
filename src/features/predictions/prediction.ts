import { addDays, subDays, parseISO } from 'date-fns';
import { CycleEntry } from '../../lib/db';
import { getCyclesInRange } from '../export/doctorReport';
import { isIrregular, getVariability } from './irregular';
import { getConfidence, ConfidenceLevel } from './confidence';

export interface EnhancedPrediction {
  nextPeriodStartRange: [Date, Date];
  nextPeriodEndRange: [Date, Date];
  ovulationDay?: Date;
  fertileWindowStart?: Date;
  fertileWindowEnd?: Date;
  confidence: ConfidenceLevel;
  isVariable: boolean;
  message: string;
  helperText?: string;
  recentCycleLengths: number[];
  variability: number;
}

export const getPrediction = (
  entries: CycleEntry[],
  avgCycleLength: number = 28,
  avgPeriodLength: number = 5,
  excludedCycleStartDates: string[] = []
): EnhancedPrediction | null => {
  const periodStarts = entries
    .filter(e => e.type === 'period_start')
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  if (periodStarts.length === 0) return null;

  const lastStart = parseISO(periodStarts[0].date);
  
  // Get up to 12 months of cycles to ensure we have enough data
  const cycles = getCyclesInRange(entries, 12, excludedCycleStartDates);
  
  if (cycles.length < 3) {
    // Not enough data
    return {
      nextPeriodStartRange: [addDays(lastStart, avgCycleLength), addDays(lastStart, avgCycleLength)],
      nextPeriodEndRange: [addDays(lastStart, avgCycleLength + avgPeriodLength - 1), addDays(lastStart, avgCycleLength + avgPeriodLength - 1)],
      confidence: 'none',
      isVariable: false,
      message: 'Log a few cycles to get predictions',
      recentCycleLengths: cycles.map(c => c.length),
      variability: 0
    };
  }

  const recentCycles = cycles.slice(-6);
  const lengths = recentCycles.map(c => c.length);
  const minCycleLength = Math.min(...lengths);
  const maxCycleLength = Math.max(...lengths);
  
  const variable = isIrregular(cycles);
  const confidence = getConfidence(cycles);
  const variability = getVariability(cycles);
  
  // Calculate weighted average period length from recent cycles
  const recentPeriodLengths = recentCycles.map(c => c.periodLength).filter(l => l > 0);
  let calcAvgPeriodLength = avgPeriodLength;
  if (recentPeriodLengths.length > 0) {
    const weights = recentPeriodLengths.map((_, i) => i + 1);
    const weightSum = weights.reduce((a, b) => a + b, 0);
    calcAvgPeriodLength = Math.round(recentPeriodLengths.reduce((sum, length, i) => sum + length * weights[i], 0) / weightSum);
  }

  // Calculate weighted average cycle length
  const weights = lengths.map((_, i) => i + 1);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const weightedAvgCycleLength = Math.round(lengths.reduce((sum, length, i) => sum + length * weights[i], 0) / weightSum);

  // Calculate standard deviation for variability
  const variance = lengths.reduce((sum, length) => sum + Math.pow(length - weightedAvgCycleLength, 2), 0) / lengths.length;
  const stdDev = Math.round(Math.sqrt(variance));

  let startRange: [Date, Date];
  let endRange: [Date, Date];
  let message = '';
  let helperText = '';
  
  if (variable || stdDev > 2) {
    const margin = Math.max(2, stdDev);
    startRange = [
      addDays(lastStart, weightedAvgCycleLength - margin),
      addDays(lastStart, weightedAvgCycleLength + margin)
    ];
    endRange = [
      addDays(startRange[0], calcAvgPeriodLength - 1),
      addDays(startRange[1], calcAvgPeriodLength - 1)
    ];
    message = 'Your cycle varies, so predictions are wider';
    helperText = 'Cycles can vary due to stress, routine changes, etc.';
    
    return {
      nextPeriodStartRange: startRange,
      nextPeriodEndRange: endRange,
      confidence,
      isVariable: true,
      message,
      helperText,
      recentCycleLengths: lengths,
      variability
    };
  } else {
    const margin = Math.max(1, Math.round(stdDev));
    startRange = [
      addDays(lastStart, weightedAvgCycleLength - margin),
      addDays(lastStart, weightedAvgCycleLength + margin)
    ];
    endRange = [
      addDays(startRange[0], calcAvgPeriodLength - 1),
      addDays(startRange[1], calcAvgPeriodLength - 1)
    ];
    message = 'Based on your recent cycles';
    
    // Calculate ovulation for regular cycles
    const predictedNextStart = addDays(lastStart, weightedAvgCycleLength);
    const ovulation = subDays(predictedNextStart, 14);
    const fertileStart = subDays(ovulation, 5);
    const fertileEnd = addDays(ovulation, 1);
    
    return {
      nextPeriodStartRange: startRange,
      nextPeriodEndRange: endRange,
      ovulationDay: ovulation,
      fertileWindowStart: fertileStart,
      fertileWindowEnd: fertileEnd,
      confidence,
      isVariable: false,
      message,
      recentCycleLengths: lengths,
      variability
    };
  }
};
