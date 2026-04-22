import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday,
  parseISO,
  isBefore
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { CycleEntry } from '../lib/db';
import { isDateInPeriod, isDateInPredictedPeriod, PredictionResult, getCyclePhase } from '../lib/predictions';

interface CalendarProps {
  entries: CycleEntry[];
  predictions: PredictionResult | null;
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
}

export const Calendar: React.FC<CalendarProps> = ({ entries, predictions, onDateSelect, selectedDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-4 py-4">
        <h2 className="text-2xl font-serif text-brand-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        {predictions && (
          <div className={cn(
            "px-2 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold",
            predictions.confidence === 'high' ? "bg-green-100 text-green-700" :
            predictions.confidence === 'medium' ? "bg-yellow-100 text-yellow-700" :
            "bg-brand-100 text-brand-700"
          )}>
            {predictions.confidence}
          </div>
        )}
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-full hover:bg-brand-100 text-brand-700 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-full hover:bg-brand-100 text-brand-700 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-brand-400 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-y-1">
        {calendarDays.map((day, i) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const inPeriod = entries.some(e => isSameDay(parseISO(e.date), day) && e.flow !== 'none');
          const inPredictedPeriod = isDateInPredictedPeriod(day, predictions);
          const hasNote = entries.some(e => isSameDay(parseISO(e.date), day) && (e.notes || (e.symptoms || []).length || (e.moods || []).length));
          const isTodayDate = isToday(day);
          const isPast = isBefore(day, new Date()) && !isTodayDate;
          
          const phaseInfo = getCyclePhase(day, entries, predictions);
          let phaseColorClass = "";
          if (phaseInfo.phase === 'follicular') phaseColorClass = "bg-blue-50 border-blue-200";
          else if (phaseInfo.phase === 'ovulatory') phaseColorClass = "bg-green-50 border-green-200";
          else if (phaseInfo.phase === 'luteal') phaseColorClass = "bg-purple-50 border-purple-200";
          else if (phaseInfo.phase === 'menstrual') phaseColorClass = "bg-brand-100 border-brand-300";

          return (
            <div
              key={i}
              onClick={() => onDateSelect(day)}
              className={cn(
                "relative flex flex-col items-center justify-center aspect-square cursor-pointer transition-all",
                !isCurrentMonth && "opacity-30",
                isPast && "opacity-80"
              )}
            >
              {/* Phase Background */}
              {phaseInfo.phase !== 'unknown' && !inPeriod && !inPredictedPeriod && (
                <div className={cn("absolute inset-1 rounded-full opacity-50", phaseColorClass.split(' ')[0])} />
              )}

              {/* Predicted Period Background */}
              {inPredictedPeriod && !inPeriod && (
                <div className="absolute inset-0 bg-brand-50 rounded-full" />
              )}
              
              {/* Period Indicator Background */}
              {inPeriod && (
                <div className="absolute inset-1 bg-brand-200 rounded-full" />
              )}

              {/* Predicted Period Indicator (Dashed) */}
              {inPredictedPeriod && !inPeriod && (
                <div className="absolute inset-1 border-2 border-dashed border-brand-200 rounded-full" />
              )}

              {/* Today Indicator */}
              {isTodayDate && (
                <div className="absolute inset-0 border-2 border-brand-400 rounded-full" />
              )}
              
              {/* Selection Ring */}
              {isSelected && (
                <div className="absolute inset-0 border-2 border-brand-500 rounded-full scale-110" />
              )}

              <span className={cn(
                "relative z-10 text-sm font-medium",
                isSelected ? "text-brand-900" : (inPeriod ? "text-brand-800" : "text-ink"),
                isTodayDate && !isSelected && "text-brand-600 font-bold"
              )}>
                {format(day, 'd')}
              </span>

              {/* Note/Symptom Dot */}
              {hasNote && (
                <div className="absolute bottom-1.5 w-1 h-1 bg-brand-400 rounded-full" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-2 shadow-sm border border-brand-100">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      
      {/* Legend */}
      <div className="px-4 py-3 flex flex-wrap gap-3 justify-center border-t border-brand-50 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-200"></div>
          <span className="text-[10px] font-medium text-brand-600 uppercase tracking-wider">Menstrual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-100"></div>
          <span className="text-[10px] font-medium text-brand-600 uppercase tracking-wider">Follicular</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-100"></div>
          <span className="text-[10px] font-medium text-brand-600 uppercase tracking-wider">Ovulation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-100"></div>
          <span className="text-[10px] font-medium text-brand-600 uppercase tracking-wider">Luteal</span>
        </div>
      </div>
    </div>
  );
};
