import { CycleSummary } from '../export/doctorReport';

export const isIrregular = (cycles: CycleSummary[]): boolean => {
  if (cycles.length < 3) return false;
  
  const recentCycles = cycles.slice(-6);
  const lengths = recentCycles.map(c => c.length);
  
  const minCycleLength = Math.min(...lengths);
  const maxCycleLength = Math.max(...lengths);
  const variability = maxCycleLength - minCycleLength;
  
  return variability >= 7;
};

export const getVariability = (cycles: CycleSummary[]): number => {
  if (cycles.length < 3) return 0;
  const recentCycles = cycles.slice(-6);
  const lengths = recentCycles.map(c => c.length);
  return Math.max(...lengths) - Math.min(...lengths);
};
