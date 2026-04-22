import { CycleSummary } from '../export/doctorReport';
import { getVariability } from './irregular';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'none';

export const getConfidence = (cycles: CycleSummary[]): ConfidenceLevel => {
  if (cycles.length < 3) return 'none';
  
  const variability = getVariability(cycles);
  
  if (variability >= 7) return 'low';
  if (variability >= 3) return 'medium';
  return 'high';
};
