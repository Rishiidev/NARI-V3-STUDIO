import React, { useState } from 'react';
import { Lock, Fingerprint, Delete } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { UserSettings } from '../lib/db';
import { hashPIN } from '../lib/crypto';

interface LockScreenProps {
  onUnlock: (isDecoy: boolean) => void;
  settings: UserSettings;
  isExitDecoyMode?: boolean;
  onUpdateSettings?: (s: Partial<UserSettings>) => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, settings, isExitDecoyMode = false, onUpdateSettings }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  React.useEffect(() => {
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => setIsBiometricSupported(available))
        .catch(() => setIsBiometricSupported(false));
    }
  }, []);

  const attemptBiometric = async () => {
    if (!isBiometricSupported) return;
    try {
      if (!settings.useBiometrics) {
        // Enable biometrics
        const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
          challenge: new Uint8Array(32),
          rp: { name: "Nari App", id: window.location.hostname },
          user: {
            id: new Uint8Array(16),
            name: "user@nari.app",
            displayName: "Nari User"
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
          timeout: 60000,
          attestation: "none"
        };
        const credential = await navigator.credentials.create({ publicKey: publicKeyCredentialCreationOptions });
        if (credential) {
          if (onUpdateSettings) {
             onUpdateSettings({ useBiometrics: true });
          }
          onUnlock(false);
        }
      } else {
        // Use biometrics
        const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
          challenge: new Uint8Array(32),
          timeout: 60000,
          userVerification: "required"
        };
        const assertion = await navigator.credentials.get({ publicKey: publicKeyCredentialRequestOptions });
        if (assertion) {
          onUnlock(false);
        }
      }
    } catch (e) {
      console.error('Biometric failed', e);
    }
  };

  React.useEffect(() => {
    if (settings.useBiometrics) {
      attemptBiometric();
    }
  }, [settings.useBiometrics]);

  const handleInput = async (num: string) => {
    if (passcode.length < 4 && !error) {
      const newPass = passcode + num;
      setPasscode(newPass);
      if (newPass.length === 4) {
        const hashed = await hashPIN(newPass);
        if (hashed === settings.passcode) {
          setTimeout(() => onUnlock(false), 200);
        } else if (!isExitDecoyMode && settings.decoyPasscode && hashed === settings.decoyPasscode) {
          setTimeout(() => onUnlock(true), 200);
        } else {
          setError(true);
          setFailedAttempts(prev => prev + 1);
          setTimeout(() => {
            setPasscode('');
            setError(false);
          }, 600);
        }
      }
    }
  };

  return (
    <motion.div 
      animate={error ? { backgroundColor: ['#fdf8f6', '#fee2e2', '#fdf8f6'] } : {}}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 bg-bg-warm z-[200] flex flex-col items-center justify-center p-8"
    >
      <div className="mb-12 flex flex-col items-center gap-4">
        <div className="p-6 bg-brand-100 rounded-[40px] text-brand-500">
          <Lock size={48} />
        </div>
        <h2 className="text-2xl font-serif text-brand-900">Nari is Locked</h2>
        <p className={cn("text-sm transition-colors", error ? "text-red-500 font-medium" : "text-brand-400")}>
          {error ? "Incorrect passcode" : "Enter passcode to continue"}
        </p>
        {failedAttempts >= 3 && (
          <p className="text-xs text-brand-500">Too many attempts. Please wait a moment.</p>
        )}
      </div>

      <motion.div 
        animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex gap-4 mb-12"
      >
        {[0, 1, 2, 3].map(i => (
          <div 
            key={i} 
            className={cn(
              "w-4 h-4 rounded-full border-2 transition-all",
              passcode.length > i 
                ? (error ? "bg-red-500 border-red-500 scale-110" : "bg-brand-500 border-brand-500 scale-110") 
                : (error ? "border-red-300" : "border-brand-300 bg-transparent")
            )} 
          />
        ))}
      </motion.div>

      <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map((key, i) => {
          if (key === '') return <div key={i} />;
          if (key === 'back') return (
            <button 
              key={i} 
              onClick={() => setPasscode(p => p.slice(0, -1))}
              className="w-16 h-16 flex items-center justify-center text-brand-400 active:scale-90 transition-transform"
            >
              <Delete size={24} />
            </button>
          );
          return (
            <button
              key={i}
              onClick={() => handleInput(key)}
              className="w-16 h-16 rounded-full bg-white border border-brand-100 text-2xl font-serif text-brand-900 active:bg-brand-100 active:scale-95 transition-all shadow-sm flex items-center justify-center"
            >
              {key}
            </button>
          );
        })}
      </div>

      {isBiometricSupported && (
        <button 
          onClick={() => attemptBiometric()}
          className="mt-12 flex items-center gap-2 text-brand-500 font-medium active:scale-95 transition-transform"
        >
          <Fingerprint size={20} />
          <span>{settings.useBiometrics ? "Use Biometrics" : "Enable Biometrics"}</span>
        </button>
      )}
    </motion.div>
  );
};
