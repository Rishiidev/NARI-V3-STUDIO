import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Database, Heart } from 'lucide-react';
import { cn } from '../lib/utils';

interface OnboardingProps {
  onComplete: (cycleLength: number, periodLength: number, name: string | null) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = React.useState(0);
  const [cycleLength, setCycleLength] = React.useState(28);
  const [periodLength, setPeriodLength] = React.useState(5);
  const [name, setName] = React.useState('');

  const steps = [
    {
      title: "A space that’s just yours",
      description: "No noise. No pressure. Just a quiet place to keep track of your cycle.",
      icon: <Heart className="text-brand-500" size={48} />,
    },
    {
      title: "Everything stays with you",
      description: "Your data never leaves your device.\nNo accounts. No tracking. No one else can see it.",
      icon: <Shield className="text-brand-500" size={48} />,
    },
    {
      title: "What should we call you?",
      description: "So this feels a little more like yours",
      content: (
        <div className="space-y-8 w-full">
          <input 
            type="text" 
            placeholder="Optional name" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            className="w-full p-4 rounded-2xl border border-brand-200 text-center text-lg"
          />
          <div className="space-y-4">
            <label className="block text-sm font-medium text-brand-700">Average Cycle Length (days)</label>
            <div className="flex items-center gap-4">
              <input 
                type="range" min="20" max="45" value={cycleLength} 
                onChange={(e) => setCycleLength(parseInt(e.target.value))}
                className="flex-1 accent-brand-500"
              />
              <span className="text-2xl font-serif text-brand-900 w-12">{cycleLength}</span>
            </div>
          </div>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-brand-700">Average Period Length (days)</label>
            <div className="flex items-center gap-4">
              <input 
                type="range" min="2" max="10" value={periodLength} 
                onChange={(e) => setPeriodLength(parseInt(e.target.value))}
                className="flex-1 accent-brand-500"
              />
              <span className="text-2xl font-serif text-brand-900 w-12">{periodLength}</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(cycleLength, periodLength, name || null);
    }
  };

  const ctaText = step === 0 ? "Continue" : step === 1 ? "Sounds good" : "Let’s begin";

  return (
    <div className="fixed inset-0 bg-bg-warm z-[100] flex flex-col p-8 safe-bottom">
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-6 flex flex-col items-center w-full"
        >
          {steps[step].icon && (
            <div className="p-6 bg-brand-100 rounded-[40px] mb-4">
              {steps[step].icon}
            </div>
          )}
          <h1 className="text-4xl font-serif text-brand-900">{steps[step].title}</h1>
          <p className="text-brand-600 leading-relaxed">{steps[step].description}</p>
          {steps[step].content}
        </motion.div>
      </div>

      <div className="space-y-4">
        <button onClick={next} className="w-full btn-primary py-4 text-lg">
          {ctaText}
        </button>
        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-8 bg-brand-500" : "w-2 bg-brand-200"
              )} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};
