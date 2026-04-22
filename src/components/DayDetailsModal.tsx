import React from 'react';
import { format, parseISO } from 'date-fns';
import { CycleEntry } from '../lib/db';
import { X } from 'lucide-react';

interface DayDetailsModalProps {
  date: Date;
  entries: CycleEntry[];
  onClose: () => void;
}

export const DayDetailsModal: React.FC<DayDetailsModalProps> = ({ date, entries, onClose }) => {
  const dayEntries = entries.filter(e => e.date === format(date, 'yyyy-MM-dd'));

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-serif text-brand-900">{format(date, 'MMMM d, yyyy')}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-brand-100">
            <X size={20} />
          </button>
        </div>
        {dayEntries.length > 0 ? (
          <div className="space-y-4">
            {dayEntries.map((entry, i) => (
              <div key={i} className="bg-brand-50 p-4 rounded-2xl space-y-2">
                <p className="font-medium text-brand-900 capitalize">{entry.type.replace('_', ' ')}</p>
                {entry.flow !== 'none' && <p className="text-sm text-brand-700 capitalize">Flow: {entry.flow}</p>}
                {(entry.symptoms || []).length > 0 && <p className="text-sm text-brand-700">Symptoms: {(entry.symptoms || []).join(', ')}</p>}
                {(entry.moods || []).length > 0 && <p className="text-sm text-brand-700">Moods: {(entry.moods || []).join(', ')}</p>}
                {entry.notes && <p className="text-sm text-brand-600 italic">"{entry.notes}"</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-brand-500 text-center py-4">No data logged for this day.</p>
        )}
      </div>
    </div>
  );
};
