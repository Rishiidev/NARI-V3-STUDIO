import { useState, useEffect, useCallback } from 'react';
import { db, CycleEntry, UserSettings } from '../lib/db';
import { calculatePredictions, PredictionResult } from '../lib/predictions';

const DEFAULT_SETTINGS: UserSettings = {
  id: 'user-settings',
  averageCycleLength: 28,
  averagePeriodLength: 5,
  lastPeriodDate: null,
  isAppLocked: false,
  passcode: null,
  decoyPasscode: null,
  useBiometrics: false,
  onboardingComplete: false,
  theme: 'system',
  accentColor: 'terracotta',
  customMoods: ['Happy', 'Sad', 'Anxious', 'Energetic', 'Tired'],
  customSymptoms: ['Cramps', 'Headache', 'Bloating', 'Acne', 'Breast Tenderness'],
  customMedications: [],
  customExerciseTypes: ['Yoga', 'Running', 'Strength', 'Walking', 'Pilates'],
  name: null,
  excludedCycleStartDates: [],
  dashboardOrder: ['status', 'circular_cycle', 'partner_sync', 'habits', 'habit_insights', 'calendar', 'insights', 'prediction', 'daily_insight', 'symptom_patterns'],
  waterGoal: 2000,
  sleepGoal: 8,
  exerciseGoal: 30,
  hiddenSymptoms: [],
  customHabits: [
    { id: 'vitamins', name: 'Take Vitamins', type: 'boolean' },
    { id: 'coffee', name: 'Cups of Coffee', type: 'counter', unit: 'cups' },
    { id: 'read', name: 'Read Pages', type: 'counter', unit: 'pages', goal: 10 }
  ],
};

export function useCycle() {
  const [entries, setEntries] = useState<CycleEntry[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [predictions, setPredictions] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [storedEntries, storedSettings] = await Promise.all([
        db.getEntries(),
        db.getSettings(),
      ]);

      setEntries(storedEntries);
      if (storedSettings) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...storedSettings,
          customMoods: storedSettings.customMoods || DEFAULT_SETTINGS.customMoods,
          customSymptoms: storedSettings.customSymptoms || DEFAULT_SETTINGS.customSymptoms,
          customHabits: storedSettings.customHabits || DEFAULT_SETTINGS.customHabits,
        });
      } else {
        await db.saveSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (entries.length > 0) {
      const pred = calculatePredictions(
        entries, 
        settings.averageCycleLength, 
        settings.customPeriodLength || settings.averagePeriodLength,
        settings.excludedCycleStartDates || []
      );
      setPredictions(pred);
    }
  }, [entries, settings]);

  const addEntry = async (entry: CycleEntry) => {
    await db.addEntry(entry);
    await loadData();
  };

  const updateEntry = async (entry: CycleEntry) => {
    await db.updateEntry(entry);
    await loadData();
  };

  const deleteEntry = async (id: number) => {
    await db.deleteEntry(id);
    await loadData();
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await db.saveSettings(updated);
  };

  const clearData = async () => {
    await db.clearAllData();
    setEntries([]);
    setSettings(DEFAULT_SETTINGS);
    setPredictions(null);
  };

  return {
    entries,
    settings,
    predictions,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    updateSettings,
    clearData,
    refresh: loadData,
  };
}
