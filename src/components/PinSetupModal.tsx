import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { hashPIN } from '../lib/crypto';

interface PinSetupModalProps {
  onClose: () => void;
  onSave: (hashedPin: string, isDecoy?: boolean) => void;
}

export const PinSetupModal: React.FC<PinSetupModalProps> = ({ onClose, onSave }) => {
  const [pin, setPin] = useState('');
  const [isDecoy, setIsDecoy] = useState(false);

  const handleSave = async () => {
    if (pin.length === 4) {
      const hashed = await hashPIN(pin);
      onSave(hashed, isDecoy);
      onClose();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-6"
    >
      <div className="bg-white p-6 rounded-3xl w-full max-w-sm space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-serif">Set {isDecoy ? 'Decoy' : 'Main'} PIN</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <input 
          type="password"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
          className="w-full text-center text-4xl tracking-widest p-4 border border-brand-100 rounded-2xl"
          placeholder="0000"
        />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isDecoy} onChange={(e) => setIsDecoy(e.target.checked)} />
          <span>Set as Decoy PIN</span>
        </label>
        <button 
          onClick={handleSave}
          disabled={pin.length !== 4}
          className="w-full py-4 bg-brand-900 text-white rounded-2xl disabled:opacity-50"
        >
          Save {isDecoy ? 'Decoy' : 'Main'} PIN
        </button>
      </div>
    </motion.div>
  );
};
