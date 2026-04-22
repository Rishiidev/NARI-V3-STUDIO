import React, { useState, useMemo } from 'react';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format, parseISO, differenceInDays, subMonths, subYears, isAfter } from 'date-fns';
import { CycleEntry } from '../lib/db';
import { motion } from 'motion/react';
import { BarChart as BarChartIcon } from 'lucide-react';
import { cn } from '../lib/utils';

import { PredictionResult } from '../lib/predictions';

interface TrendsProps {
  entries: CycleEntry[];
  predictions: PredictionResult | null;
}

export const Trends: React.FC<TrendsProps> = ({ entries, predictions }) => {
  const [filter, setFilter] = useState<'3m' | '6m' | '1y'>('6m');

  const filteredEntries = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    if (filter === '3m') startDate = subMonths(now, 3);
    else if (filter === '6m') startDate = subMonths(now, 6);
    else startDate = subYears(now, 1);

    return entries.filter(e => isAfter(parseISO(e.date), startDate));
  }, [entries, filter]);

  const cycleData = useMemo(() => {
    const periodStarts = filteredEntries
      .filter(e => e.type === 'period_start')
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

    if (periodStarts.length < 2) return [];

    const data = [];
    for (let i = 0; i < periodStarts.length - 1; i++) {
      const start = parseISO(periodStarts[i].date);
      const nextStart = parseISO(periodStarts[i + 1].date);
      const length = differenceInDays(nextStart, start);
      data.push({
        month: format(start, 'MMM'),
        length,
      });
    }
    return data;
  }, [filteredEntries]);

  const symptomData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEntries.forEach(e => {
      e.symptoms.forEach(s => {
        counts[s] = (counts[s] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredEntries]);

  const moodData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEntries.forEach(e => {
      e.moods.forEach(m => {
        counts[m] = (counts[m] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredEntries]);

  if (entries.length < 5) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto text-brand-300">
          <BarChartIcon size={40} />
        </div>
        <h2 className="text-2xl font-serif text-brand-900">Not enough data</h2>
        <p className="text-brand-400 text-sm">
          Keep logging your cycles to see trends and patterns over time.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 pb-32">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif text-brand-900">Trends</h1>
          <p className="text-brand-400 text-sm">Your cycle patterns at a glance</p>
        </div>
        <div className="flex gap-1 bg-brand-50 p-1 rounded-full">
          {(['3m', '6m', '1y'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium uppercase",
                filter === f ? "bg-white text-brand-900 shadow-sm" : "text-brand-400"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </header>


      {/* Prediction Visualization */}
      {predictions && (
        <section className="bg-white p-6 rounded-[32px] shadow-sm border border-brand-50 space-y-4">
          <h3 className="text-lg font-serif text-brand-800">Next Period Prediction</h3>
          <div className="bg-brand-50 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs text-brand-500 uppercase tracking-widest font-bold">Predicted Start</p>
              <p className="text-brand-900 font-serif text-xl">
                {format(predictions.nextPeriodStartRange[0], 'MMM d')}
                {predictions.isVariable && ` - ${format(predictions.nextPeriodStartRange[1], 'MMM d')}`}
              </p>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-full text-xs uppercase tracking-widest font-bold",
              predictions.confidence === 'high' ? "bg-green-100 text-green-700" :
              predictions.confidence === 'medium' ? "bg-yellow-100 text-yellow-700" :
              "bg-brand-100 text-brand-700"
            )}>
              {predictions.confidence} confidence
            </div>
          </div>
        </section>
      )}

      {/* Cycle Length Chart */}
      <section className="bg-white p-6 rounded-[32px] shadow-sm border border-brand-50 space-y-4">
        <h3 className="text-lg font-serif text-brand-800">Cycle Length</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={cycleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#a54231' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#a54231' }} 
              />
              <Tooltip 
                cursor={{ fill: '#fdf8f6' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="length" fill="#d96d52" radius={[8, 8, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Period Length Chart */}
      <section className="bg-white p-6 rounded-[32px] shadow-sm border border-brand-50 space-y-4">
        <h3 className="text-lg font-serif text-brand-800">Period Length</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={cycleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#a54231' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#a54231' }} 
              />
              <Tooltip 
                cursor={{ fill: '#fdf8f6' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="periodLength" fill="#88b0a9" radius={[8, 8, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Symptom Frequency */}
      <section className="bg-white p-6 rounded-[32px] shadow-sm border border-brand-50 space-y-4">
        <h3 className="text-lg font-serif text-brand-800">Common Symptoms</h3>
        <div className="space-y-3">
          {symptomData.map((item, idx) => (
            <div key={item.name} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-brand-700">{item.name}</span>
                <span className="text-brand-400">{item.count} times</span>
              </div>
              <div className="h-2 bg-brand-50 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(item.count / symptomData[0].count) * 100}%` }}
                  className="h-full bg-brand-300 rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mood Frequency */}
      <section className="bg-white p-6 rounded-[32px] shadow-sm border border-brand-50 space-y-4">
        <h3 className="text-lg font-serif text-brand-800">Mood Patterns</h3>
        <div className="flex flex-wrap gap-2">
          {moodData.map((item) => (
            <div 
              key={item.name} 
              className="px-4 py-2 bg-brand-50 rounded-2xl border border-brand-100 flex items-center gap-2"
            >
              <span className="text-sm font-medium text-brand-700">{item.name}</span>
              <span className="text-xs text-brand-400 bg-white px-2 py-0.5 rounded-full">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Daily Habits */}
      <section className="bg-white p-6 rounded-[32px] shadow-sm border border-brand-50 space-y-4">
        <h3 className="text-lg font-serif text-brand-800">Daily Habits</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-brand-700">Avg Water Intake</span>
            <span className="font-medium text-brand-900">
              {filteredEntries.length > 0 
                ? Math.round(filteredEntries.reduce((acc, e) => acc + (e.waterIntake || 0), 0) / filteredEntries.length) 
                : 0} ml
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-brand-700">Avg Sleep Quality</span>
            <span className="font-medium text-brand-900">
              {(filteredEntries.reduce((acc, e) => acc + (e.sleepQuality || 0), 0) / (filteredEntries.filter(e => e.sleepQuality).length || 1)).toFixed(1)} / 5
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
