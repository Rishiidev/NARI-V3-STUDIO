import React from 'react';
import { motion } from 'motion/react';
import { UserSettings } from '../lib/db';
import { getStatusMessage } from '../lib/predictions';

interface CircularCycleViewProps {
  cycleDay: number;
  settings: UserSettings;
  phase: string;
}

export const CircularCycleView: React.FC<CircularCycleViewProps> = ({
  cycleDay,
  settings,
  phase
}) => {
  const cycleLength = settings.averageCycleLength || 28;
  const periodLength = settings.averagePeriodLength || 5;
  
  // Calculate segments
  // Menstrual: day 1 to periodLength
  // Follicular: periodLength + 1 to ovulation - 1
  // Ovulation: roughly day 14 (or cycleLength - 14)
  // Luteal: ovulation + 1 to cycleLength
  
  const ovulationDay = Math.max(1, cycleLength - 14);
  
  const getPhaseColor = (day: number) => {
    if (day <= periodLength) return '#ef4444'; // Menstrual - red
    if (day >= ovulationDay - 2 && day <= ovulationDay + 2) return '#eab308'; // Ovulation - yellow
    if (day > periodLength && day < ovulationDay - 2) return '#3b82f6'; // Follicular - blue
    return '#8b5cf6'; // Luteal - purple
  };

  const getPhaseName = (day: number) => {
    if (day <= periodLength) return 'Menstrual';
    if (day >= ovulationDay - 2 && day <= ovulationDay + 2) return 'Ovulation';
    if (day > periodLength && day < ovulationDay - 2) return 'Follicular';
    return 'Luteal';
  };

  const radius = 100;
  const strokeWidth = 24;
  const center = radius + strokeWidth;
  const size = center * 2;
  
  const circumference = 2 * Math.PI * radius;
  
  return (
    <section className="bg-white p-6 rounded-3xl border border-brand-100 shadow-sm flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6">
        <h3 className="text-lg font-serif text-brand-900">Cycle Overview</h3>
        <span className="text-xs font-bold text-brand-500 uppercase tracking-widest">Day {cycleDay}</span>
      </div>
      
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background ring */}
        <svg width={size} height={size} className="transform -rotate-90">
          {Array.from({ length: cycleLength }).map((_, i) => {
            const day = i + 1;
            const segmentLength = circumference / cycleLength;
            const gap = 2; // gap between segments
            const dashArray = `${segmentLength - gap} ${circumference}`;
            const dashOffset = -(i * segmentLength);
            
            const isCurrentDay = day === cycleDay;
            const color = getPhaseColor(day);
            
            return (
              <circle
                key={day}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={isCurrentDay ? strokeWidth + 8 : strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                opacity={isCurrentDay ? 1 : 0.3}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-serif text-brand-900">{cycleDay}</span>
          <span className="text-xs font-bold text-brand-400 uppercase tracking-widest mt-1">
            {getPhaseName(cycleDay)}
          </span>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-8">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 opacity-50" />
          <span className="text-xs font-medium text-brand-600">Menstrual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 opacity-50" />
          <span className="text-xs font-medium text-brand-600">Follicular</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-50" />
          <span className="text-xs font-medium text-brand-600">Ovulation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500 opacity-50" />
          <span className="text-xs font-medium text-brand-600">Luteal</span>
        </div>
      </div>
    </section>
  );
};
