import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, ChevronRight, Info } from 'lucide-react';
import { CycleEntry, UserSettings } from '../lib/db';
import { CyclePhaseInfo } from '../lib/predictions';
import { format, subDays, isAfter, parseISO } from 'date-fns';

interface AIInsightsProps {
  phaseInfo: CyclePhaseInfo;
  entries: CycleEntry[];
  settings: UserSettings;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ phaseInfo, entries, settings }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsight = async () => {
    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Get symptoms from last 7 days
      const last7Days = subDays(new Date(), 7);
      const recentEntries = entries.filter(e => isAfter(parseISO(e.date), last7Days));
      const recentSymptoms = Array.from(new Set(recentEntries.flatMap(e => e.symptoms)));
      const recentMoods = Array.from(new Set(recentEntries.flatMap(e => e.moods)));

      const prompt = `
        You are Nari, a supportive and expert menstrual health assistant. 
        The user is currently in their ${phaseInfo.description}.
        Recent symptoms logged: ${recentSymptoms.join(', ') || 'None'}.
        Recent moods logged: ${recentMoods.join(', ') || 'None'}.
        User's average cycle length: ${settings.averageCycleLength} days.
        
        Provide a short, supportive, and personalized health insight (max 2 sentences). 
        Focus on what they might be feeling right now and a small, actionable tip (nutrition, movement, or self-care).
        Keep the tone warm, organic, and empowering. Do not use medical jargon.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview",
        contents: prompt,
      });

      setInsight(response.text || "You're doing great! Remember to listen to your body today.");
    } catch (err) {
      console.error('Failed to generate AI insight', err);
      setError('Could not load insight right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!insight && !loading) {
      generateInsight();
    }
  }, [phaseInfo.phase]);

  return (
    <section className="bg-brand-950 text-white rounded-[32px] p-6 shadow-xl relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-500/20 rounded-full blur-3xl" />
      
      <div className="relative z-10 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-brand-300">
            <Sparkles size={16} />
            <span className="text-[10px] uppercase tracking-widest font-bold">AI Insight</span>
          </div>
          <button 
            onClick={generateInsight}
            disabled={loading}
            className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <div className="h-4 bg-white/10 rounded-full w-3/4 animate-pulse" />
              <div className="h-4 bg-white/10 rounded-full w-1/2 animate-pulse" />
            </motion.div>
          ) : error ? (
            <motion.p 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-brand-300 italic"
            >
              {error}
            </motion.p>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <p className="text-sm leading-relaxed font-medium">
                "{insight}"
              </p>
              <div className="flex items-center gap-1 text-brand-400 text-[10px] font-bold uppercase tracking-wider">
                <Info size={10} />
                <span>Based on your current phase</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
