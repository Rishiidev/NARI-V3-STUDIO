import React, { useMemo } from 'react';
import { CycleEntry, UserSettings } from '../lib/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { format, parseISO, differenceInDays, subMonths, isAfter } from 'date-fns';
import { getCyclesInRange } from '../features/export/doctorReport';
import { generateInsights } from '../lib/insights';
import { Droplets, Moon, Activity, Calendar, Lightbulb } from 'lucide-react';

interface ReportsProps {
  entries: CycleEntry[];
  settings: UserSettings;
}

export const Reports: React.FC<ReportsProps> = ({ entries, settings }) => {
  const insights = useMemo(() => generateInsights(entries), [entries]);
  // 1. Cycle History Data
  const cycleHistoryData = useMemo(() => {
    const cycles = getCyclesInRange(entries, 6, []);
    return cycles.map((c, i) => ({
      name: format(c.startDate, 'MMM'),
      length: c.length,
      period: c.periodLength,
    })).reverse();
  }, [entries]);

  // 2. Habit Consistency Data (Last 30 days)
  const habitData = useMemo(() => {
    const thirtyDaysAgo = subMonths(new Date(), 1);
    const recentEntries = entries
      .filter(e => isAfter(parseISO(e.date), thirtyDaysAgo))
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

    return recentEntries.map(e => ({
      date: format(parseISO(e.date), 'dd MMM'),
      water: e.waterIntake || 0,
      sleep: e.sleepDuration || 0,
      exercise: e.exercise?.duration || 0,
    }));
  }, [entries]);

  // 3. Top Symptoms
  const topSymptoms = useMemo(() => {
    const symptomCounts: Record<string, number> = {};
    entries.forEach(e => {
      e.symptoms.forEach(s => {
        symptomCounts[s] = (symptomCounts[s] || 0) + 1;
      });
    });
    return Object.entries(symptomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [entries]);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif text-brand-900">Reports & Trends</h2>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <section className="bg-gradient-to-br from-brand-50 to-white p-6 rounded-3xl border border-brand-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
              <Lightbulb size={16} />
            </div>
            <h3 className="text-lg font-serif text-brand-900">AI-Free Insights</h3>
          </div>
          <div className="space-y-3">
            {insights.map(insight => (
              <div key={insight.id} className="bg-white p-4 rounded-2xl border border-brand-50 shadow-sm">
                <p className="text-sm font-bold text-brand-900 mb-1">{insight.title}</p>
                <p className="text-sm text-brand-600">{insight.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cycle History Chart */}
      <section className="bg-white p-6 rounded-3xl border border-brand-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-500">
            <Calendar size={16} />
          </div>
          <h3 className="text-lg font-serif text-brand-900">Cycle History</h3>
        </div>
        
        {cycleHistoryData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cycleHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="length" name="Cycle Length" fill="#f4a261" radius={[4, 4, 0, 0]} />
                <Bar dataKey="period" name="Period Length" fill="#e76f51" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-brand-400 text-center py-8">Not enough data to show cycle history.</p>
        )}
      </section>

      {/* Habit Consistency */}
      <section className="bg-white p-6 rounded-3xl border border-brand-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">
            <Droplets size={16} />
          </div>
          <h3 className="text-lg font-serif text-brand-900">Habit Trends (30 Days)</h3>
        </div>

        {habitData.length > 0 ? (
          <div className="space-y-8">
            <div>
              <p className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-2">Water Intake (ml)</p>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={habitData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" hide />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="water" stroke="#60a5fa" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div>
              <p className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-2">Sleep Duration (hrs)</p>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={habitData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" hide />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="sleep" stroke="#818cf8" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-brand-400 text-center py-8">Log habits to see your trends.</p>
        )}
      </section>

      {/* Top Symptoms */}
      <section className="bg-white p-6 rounded-3xl border border-brand-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-500">
            <Activity size={16} />
          </div>
          <h3 className="text-lg font-serif text-brand-900">Most Frequent Symptoms</h3>
        </div>
        
        {topSymptoms.length > 0 ? (
          <div className="space-y-4">
            {topSymptoms.map(([symptom, count]) => (
              <div key={symptom} className="flex items-center justify-between">
                <span className="text-sm text-brand-700 capitalize">{symptom}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-brand-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-400 rounded-full" 
                      style={{ width: `${Math.min(100, (count / entries.length) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-brand-400 font-medium w-8 text-right">{count}x</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-brand-400 text-center py-8">No symptoms logged yet.</p>
        )}
      </section>
    </div>
  );
};
