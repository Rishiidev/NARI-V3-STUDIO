import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Heart } from 'lucide-react';

interface EducationProps {
  isOpen: boolean;
  onClose: () => void;
}

const glossary = [
  { term: 'Follicular Phase', definition: 'The phase of your cycle that starts on the first day of your period and ends when you ovulate. This is when your body prepares to release an egg.' },
  { term: 'Ovulation', definition: 'The process in which a mature egg is released from the ovary. This is your most fertile window.' },
  { term: 'Luteal Phase', definition: 'The phase after ovulation and before your period starts. This is when your body prepares for a potential pregnancy, and PMS symptoms are most common.' },
  { term: 'Menstrual Phase', definition: 'The phase when you are on your period. This is the start of your cycle.' },
];

const tips = [
  { title: 'Managing Cramps', content: 'Try using a heating pad, taking a warm bath, or practicing gentle yoga. Staying hydrated can also help reduce muscle tension.' },
  { title: 'Nutrition for your Cycle', content: 'Focus on iron-rich foods during your period, and complex carbohydrates and fiber during your luteal phase to help manage blood sugar and mood.' },
  { title: 'Sleep Hygiene', content: 'Keep your bedroom cool, dark, and quiet. Try to maintain a consistent sleep schedule, even on weekends.' },
];

export const Education: React.FC<EducationProps> = ({ isOpen, onClose }) => {
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
              <h3 className="text-2xl font-serif text-brand-900">Learn & Grow</h3>
              <button onClick={onClose} className="p-2 bg-brand-100 rounded-full text-brand-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-8">
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="text-brand-500" />
                  <h4 className="text-xl font-serif text-brand-900">Cycle Glossary</h4>
                </div>
                <div className="space-y-4">
                  {glossary.map((item) => (
                    <div key={item.term} className="bg-white p-5 rounded-2xl border border-brand-50 shadow-sm">
                      <p className="font-bold text-brand-900 mb-1">{item.term}</p>
                      <p className="text-sm text-brand-600">{item.definition}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="text-brand-500" />
                  <h4 className="text-xl font-serif text-brand-900">Health Tips</h4>
                </div>
                <div className="space-y-4">
                  {tips.map((tip) => (
                    <div key={tip.title} className="bg-white p-5 rounded-2xl border border-brand-50 shadow-sm">
                      <p className="font-bold text-brand-900 mb-1">{tip.title}</p>
                      <p className="text-sm text-brand-600">{tip.content}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
