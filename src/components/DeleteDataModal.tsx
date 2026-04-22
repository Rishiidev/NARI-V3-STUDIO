import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteDataModalProps {
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteDataModal: React.FC<DeleteDataModalProps> = ({ onClose, onConfirm }) => {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDeleted, setIsDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const HOLD_DURATION = 2000; // 2 seconds
  const UPDATE_INTERVAL = 50; // 50ms

  const handleStartHold = () => {
    setIsHolding(true);
    setProgress(0);
    setError(null);

    let currentProgress = 0;
    progressIntervalRef.current = setInterval(() => {
      currentProgress += (UPDATE_INTERVAL / HOLD_DURATION) * 100;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(progressIntervalRef.current!);
      }
      setProgress(currentProgress);
    }, UPDATE_INTERVAL);

    holdTimerRef.current = setTimeout(async () => {
      clearInterval(progressIntervalRef.current!);
      try {
        await onConfirm();
        setIsDeleted(true);
      } catch (err) {
        setError("Could not delete data. Try again.");
        setIsHolding(false);
        setProgress(0);
      }
    }, HOLD_DURATION);
  };

  const handleEndHold = () => {
    if (isDeleted) return;
    
    setIsHolding(false);
    setProgress(0);
    
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={isDeleted ? undefined : onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-sm bg-white rounded-[32px] p-6 shadow-xl overflow-hidden"
      >
        {!isDeleted && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-brand-400 hover:text-brand-600 rounded-full hover:bg-brand-50 transition-colors"
          >
            <X size={20} />
          </button>
        )}

        <div className="flex flex-col items-center text-center space-y-4 pt-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDeleted ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-500'}`}>
            <AlertTriangle size={32} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-serif text-ink">
              {isDeleted ? "Data Erased" : "Delete all your data?"}
            </h3>
            <p className="text-sm text-brand-600">
              {isDeleted 
                ? "All data permanently erased from this device."
                : "This will permanently erase all your logs from this device. This cannot be undone."}
            </p>
            <p className="text-xs text-brand-400 font-medium">
              We don't store your data anywhere else.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500 font-medium bg-red-50 px-4 py-2 rounded-xl w-full">
              {error}
            </p>
          )}

          <div className="w-full pt-4">
            {isDeleted ? (
              <p className="text-sm text-green-600 font-medium py-3">
                Redirecting...
              </p>
            ) : (
              <div className="relative w-full">
                <button
                  onMouseDown={handleStartHold}
                  onMouseUp={handleEndHold}
                  onMouseLeave={handleEndHold}
                  onTouchStart={handleStartHold}
                  onTouchEnd={handleEndHold}
                  className="w-full relative overflow-hidden bg-red-50 text-red-600 border border-red-200 py-4 rounded-2xl font-medium select-none touch-none"
                >
                  <div 
                    className="absolute inset-y-0 left-0 bg-red-100 transition-all duration-75 ease-linear"
                    style={{ width: `${progress}%` }}
                  />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isHolding ? "Keep holding..." : "Hold to delete"}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
