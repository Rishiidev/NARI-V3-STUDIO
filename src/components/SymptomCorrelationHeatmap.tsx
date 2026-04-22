import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { CycleEntry } from '../lib/db';
import { getCycleDay } from '../lib/predictions';
import { parseISO, format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface SymptomCorrelationHeatmapProps {
  entries: CycleEntry[];
}

export const SymptomCorrelationHeatmap: React.FC<SymptomCorrelationHeatmapProps> = ({ entries }) => {
  const [selectedPoint, setSelectedPoint] = useState<any>(null);

  const data = useMemo(() => {
    const heatmapData: any[] = [];
    const symptoms = new Set<string>();
    
    entries.forEach(entry => {
      if (entry.symptomIntensities && Object.keys(entry.symptomIntensities).length > 0) {
        const cycleDay = getCycleDay(parseISO(entry.date), entries);
        
        Object.entries(entry.symptomIntensities).forEach(([symptom, intensity]) => {
          if (intensity) {
            symptoms.add(symptom);
            heatmapData.push({
              symptom,
              cycleDay,
              intensity,
              entry, // Keep reference to the full entry for the click handler
            });
          }
        });
      }
    });

    return { data: heatmapData, symptoms: Array.from(symptoms) };
  }, [entries]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-brand-100 text-sm">
          <p className="font-bold text-brand-900 mb-1">Day {data.cycleDay}</p>
          <p className="text-brand-600 capitalize">{data.symptom}: Level {data.intensity}</p>
          <p className="text-xs text-brand-400 mt-1">Click to view details</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-brand-100 shadow-sm">
      <h3 className="text-lg font-serif text-brand-900 mb-4">Symptom Patterns</h3>
      
      {data.symptoms.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-brand-400 text-sm text-center px-4">
          Log symptoms with intensity to see your patterns here over time.
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <XAxis type="number" dataKey="cycleDay" name="Cycle Day" domain={[1, 35]} tickCount={8} />
              <YAxis type="category" dataKey="symptom" name="Symptom" width={80} tick={{ fontSize: 12 }} />
              <ZAxis type="number" dataKey="intensity" range={[100, 400]} domain={[1, 5]} name="Intensity" />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter 
                name="Symptoms" 
                data={data.data} 
              >
                {data.data.map((entry, index) => {
                  const colors = ['#f7d8cf', '#f3b8a8', '#ed9881', '#d96d52', '#a54231'];
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colors[Math.min(4, Math.max(0, entry.intensity - 1))]} 
                      onClick={() => setSelectedPoint(entry)}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  );
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      <AnimatePresence>
        {selectedPoint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-4"
          >
            <div className="bg-brand-50 p-4 rounded-2xl relative">
              <button 
                onClick={() => setSelectedPoint(null)}
                className="absolute top-4 right-4 text-brand-400 hover:text-brand-600"
              >
                <X size={16} />
              </button>
              <h4 className="font-bold text-brand-900 mb-2">
                {format(parseISO(selectedPoint.entry.date), 'MMMM d, yyyy')} 
                <span className="text-brand-500 font-normal ml-2">(Cycle Day {selectedPoint.cycleDay})</span>
              </h4>
              
              <div className="space-y-2 text-sm">
                {selectedPoint.entry.symptoms?.length > 0 && (
                  <div>
                    <span className="font-medium text-brand-700">Symptoms: </span>
                    <span className="text-brand-600">{selectedPoint.entry.symptoms.join(', ')}</span>
                  </div>
                )}
                {selectedPoint.entry.moods?.length > 0 && (
                  <div>
                    <span className="font-medium text-brand-700">Moods: </span>
                    <span className="text-brand-600">{selectedPoint.entry.moods.join(', ')}</span>
                  </div>
                )}
                {selectedPoint.entry.notes && (
                  <div>
                    <span className="font-medium text-brand-700 block mb-1">Notes: </span>
                    <p className="text-brand-600 bg-white p-3 rounded-xl border border-brand-100 italic">
                      "{selectedPoint.entry.notes}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
