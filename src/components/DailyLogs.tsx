import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Droplets, Smile, Activity, Calendar, Coffee, Moon, Dumbbell } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { CycleEntry } from '../lib/db';

interface DailyLogsProps {
  isOpen: boolean;
  onClose: () => void;
  entries: CycleEntry[];
}

export const DailyLogs: React.FC<DailyLogsProps> = ({ isOpen, onClose, entries }) => {
  const sortedEntries = [...entries].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-bg-warm z-50 overflow-y-auto safe-bottom"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-bg-warm z-10 py-2">
              <h3 className="text-2xl font-serif text-brand-900">Daily Logs</h3>
              <button onClick={onClose} className="p-2 bg-brand-100 rounded-full text-brand-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {sortedEntries.length === 0 && (
                <p className="text-center text-brand-400 py-10">No logs yet.</p>
              )}
              {sortedEntries.map((entry) => (
                <div key={entry.id} className="bg-white p-6 rounded-3xl shadow-sm border border-brand-50 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-serif text-brand-900 text-lg">{format(parseISO(entry.date), 'MMMM d, yyyy')}</h4>
                    <span className="text-xs font-bold text-brand-400 uppercase">{entry.type}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {entry.waterIntake !== undefined && entry.waterIntake > 0 && (
                      <div className="flex items-center gap-2 text-brand-700">
                        <Droplets size={16} className="text-brand-400" />
                        {entry.waterIntake} ml
                      </div>
                    )}
                    {entry.sleepQuality && (
                      <div className="flex items-center gap-2 text-brand-700">
                        <Moon size={16} className="text-brand-400" />
                        {entry.sleepDuration ? `${entry.sleepDuration} hrs (${entry.sleepQuality}/5)` : `${entry.sleepQuality} / 5`}
                      </div>
                    )}
                    {!entry.sleepQuality && entry.sleepDuration && (
                      <div className="flex items-center gap-2 text-brand-700">
                        <Moon size={16} className="text-brand-400" />
                        {entry.sleepDuration} hrs
                      </div>
                    )}
                    {entry.exercise && (
                      <div className="flex items-center gap-2 text-brand-700 col-span-2">
                        <Dumbbell size={16} className="text-brand-400" />
                        {entry.exercise.type} ({entry.exercise.intensity}){entry.exercise.duration ? ` - ${entry.exercise.duration} mins` : ''}
                      </div>
                    )}
                  </div>

                  {entry.symptoms.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-brand-400 uppercase mb-2">Symptoms</p>
                      <div className="flex flex-wrap gap-2">
                        {entry.symptoms.map(s => <span key={s} className="px-3 py-1 bg-brand-50 rounded-full text-xs text-brand-700">{s}</span>)}
                      </div>
                    </div>
                  )}
                  
                  {entry.medications && entry.medications.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-brand-400 uppercase mb-2">Medications</p>
                      <div className="flex flex-wrap gap-2">
                        {entry.medications.map(m => <span key={m} className="px-3 py-1 bg-brand-50 rounded-full text-xs text-brand-700">{m}</span>)}
                      </div>
                    </div>
                  )}

                  {entry.notes && (
                    <p className="text-sm text-brand-600 italic">"{entry.notes}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
