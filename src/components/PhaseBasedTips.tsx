import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Edit2, Check } from 'lucide-react';
import { UserSettings } from '../lib/db';

interface PhaseBasedTipsProps {
  currentPhase: 'follicular' | 'ovulatory' | 'luteal' | 'menstrual' | 'unknown';
  settings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
}

const DEFAULT_TIPS: Record<string, string[]> = {
  follicular: ["Energy levels often rise. Great time for new projects and exercise."],
  ovulatory: ["You might feel more social and energetic. Keep an eye on hydration."],
  luteal: ["Energy may dip. Prioritize rest and gentle movement."],
  menstrual: ["Focus on comfort and self-care. Listen to your body's needs."],
  unknown: ["Keep logging your symptoms to get phase-specific insights."]
};

export const PhaseBasedTips: React.FC<PhaseBasedTipsProps> = ({ currentPhase, settings, onUpdateSettings }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const currentTips = settings.customPhaseTips?.[currentPhase] || DEFAULT_TIPS[currentPhase] || DEFAULT_TIPS['unknown'];
  const [editedTip, setEditedTip] = useState(currentTips[0]);

  useEffect(() => {
    setEditedTip(currentTips[0]);
  }, [currentPhase, currentTips]);

  const handleSave = () => {
    const newTips = {
      ...(settings.customPhaseTips || DEFAULT_TIPS),
      [currentPhase]: [editedTip]
    };
    onUpdateSettings({ customPhaseTips: newTips });
    setIsEditing(false);
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-brand-100 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-brand-900">
          <Info size={18} />
          <h3 className="text-lg font-serif">Daily Insight</h3>
        </div>
        <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="text-brand-400 hover:text-brand-600">
          {isEditing ? <Check size={18} /> : <Edit2 size={18} />}
        </button>
      </div>
      
      {isEditing ? (
        <textarea
          value={editedTip}
          onChange={(e) => setEditedTip(e.target.value)}
          className="w-full p-3 rounded-xl border border-brand-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
          rows={3}
        />
      ) : (
        <p className="text-sm text-brand-600 leading-relaxed">{editedTip}</p>
      )}
    </div>
  );
};
