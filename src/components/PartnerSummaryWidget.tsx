import React, { useState } from 'react';
import { CycleEntry } from '../lib/db';
import { HeartHandshake, Copy, Check } from 'lucide-react';

interface PartnerSummaryWidgetProps {
  phase: string;
  todayEntry?: CycleEntry;
}

export const PartnerSummaryWidget: React.FC<PartnerSummaryWidgetProps> = ({ phase, todayEntry }) => {
  const [copied, setCopied] = useState(false);

  const getPartnerMessage = () => {
    let baseMessage = "";
    switch (phase) {
      case 'menstrual':
        baseMessage = "I'm currently in my menstrual phase. My body is doing a lot of hard work, so my energy is naturally lower. I'd love some extra grace, comfort, and maybe some help with chores today!";
        break;
      case 'follicular':
        baseMessage = "I'm in my follicular phase! My energy and creativity are rising. It's a great time for us to plan a fun date or tackle some projects together.";
        break;
      case 'ovulation':
        baseMessage = "I'm in my ovulation phase! I'm feeling energetic and communicative. Let's spend some quality time together!";
        break;
      case 'luteal':
        baseMessage = "I'm in my luteal phase. My body is naturally slowing down, and I might feel a bit more inward or sensitive. Extra patience, a listening ear, and low-key evenings would mean the world to me right now.";
        break;
      default:
        baseMessage = "I'm currently tracking my cycle to better understand my body's rhythms.";
    }

    if (todayEntry?.moods && todayEntry.moods.length > 0) {
      const moodsList = todayEntry.moods.join(' and ');
      baseMessage += ` Just so you know, I'm feeling ${moodsList} today.`;
    }

    return baseMessage;
  };

  const message = getPartnerMessage();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <section className="bg-gradient-to-br from-rose-50 to-orange-50 p-6 rounded-3xl border border-rose-100 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <HeartHandshake className="text-rose-500" size={20} />
        <h3 className="text-lg font-serif text-brand-900">Partner Sync</h3>
      </div>
      
      <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/50 mb-4">
        <p className="text-sm text-brand-800 leading-relaxed italic">
          "{message}"
        </p>
      </div>

      <button
        onClick={handleCopy}
        className="w-full py-3 px-4 bg-white text-rose-600 rounded-xl font-bold text-sm shadow-sm border border-rose-100 flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-rose-50"
      >
        {copied ? (
          <>
            <Check size={16} />
            <span>Copied to Clipboard!</span>
          </>
        ) : (
          <>
            <Copy size={16} />
            <span>Copy Message to Share</span>
          </>
        )}
      </button>
      <p className="text-[10px] text-center text-brand-400 mt-3 font-medium uppercase tracking-widest">
        Safe & Private • No Raw Data Shared
      </p>
    </section>
  );
};
