import React from 'react';
import { CycleEntry } from '../lib/db';
import { getPrediction } from '../features/predictions/prediction';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '../lib/utils';

interface Props {
  entries: CycleEntry[];
}

export const PredictionExplanation: React.FC<Props> = ({ entries }) => {
  const prediction = getPrediction(entries);
  
  if (!prediction || prediction.confidence === 'none') {
    return <div className="p-4 bg-gray-100 rounded-lg">Not enough data for prediction.</div>;
  }

  const cycleLengths = prediction.recentCycleLengths;
  const avgCycleLength = cycleLengths.length > 0 ? cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length : 0;
  const variability = prediction.variability;

  // Simple visual indicator: 0-10 days range
  const variabilityWidth = Math.min(100, (variability / 10) * 100);

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold mb-4">Why this prediction?</h2>
      
      <div className="space-y-4 text-sm">
        <div>
          <p className="font-medium mb-1">Cycle Variability</p>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                variability <= 3 ? "bg-green-500" : variability <= 6 ? "bg-yellow-500" : "bg-red-500"
              )}
              style={{ width: `${variabilityWidth}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{variability} days variation</p>
        </div>
        
        {prediction.recentCycleLengths.length > 0 && (
          <p><span className="font-medium">Last cycle lengths:</span> {prediction.recentCycleLengths.join(', ')} days</p>
        )}
        {avgCycleLength > 0 && (
          <p><span className="font-medium">Average cycle length:</span> {avgCycleLength.toFixed(1)} days</p>
        )}
        
        <p className="mt-4 text-gray-600">
          This prediction is based on your last {prediction.recentCycleLengths.length} cycles. 
          Your cycle is {prediction.isVariable ? 'variable' : 'regular'}, 
          giving us {prediction.confidence} confidence in this range.
        </p>
      </div>
    </div>
  );
};
