import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface CustomHabit {
  id: string;
  name: string;
  type: 'boolean' | 'counter';
  unit?: string;
  goal?: number;
}

export interface CycleEntry {
  id?: number;
  date: string; // ISO string YYYY-MM-DD
  type: 'period_start' | 'period_end' | 'spotting' | 'ovulation' | 'none';
  flow: 'spotting' | 'light' | 'medium' | 'heavy' | 'none';
  symptoms: string[];
  symptomIntensities?: Record<string, number | null>; // 1-5 scale or null
  moods: string[];
  notes: string;
  medications?: string[];
  waterIntake?: number; // in ml
  sleepQuality?: number | null; // 1-5 scale
  sleepDuration?: number; // in hours
  exercise?: { type: string, intensity: 'low' | 'medium' | 'high', duration?: number } | null;
  customHabitValues?: Record<string, boolean | number>;
}

export interface UserSettings {
  id: string;
  averageCycleLength: number;
  averagePeriodLength: number;
  lastPeriodDate: string | null;
  isAppLocked: boolean;
  passcode: string | null;
  decoyPasscode: string | null;
  useBiometrics: boolean;
  onboardingComplete: boolean;
  theme: 'light' | 'dark' | 'system';
  accentColor?: 'terracotta' | 'sage' | 'lavender' | 'ocean';
  customMoods: string[];
  customSymptoms: string[];
  hiddenSymptoms: string[];
  customMedications: string[];
  customExerciseTypes: string[];
  name: string | null;
  excludedCycleStartDates: string[]; // ISO strings of cycle start dates
  dashboardOrder: string[];
  waterGoal: number; // in ml
  sleepGoal: number; // in hours
  exerciseGoal: number; // in minutes
  customPeriodLength?: number;
  customPhaseTips?: Record<string, string[]>;
  customHabits?: CustomHabit[];
}

interface NariDB extends DBSchema {
  entries: {
    key: number;
    value: CycleEntry;
    indexes: { 'by-date': string };
  };
  settings: {
    key: string;
    value: UserSettings;
  };
}

const DB_NAME = 'nari-db';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<NariDB>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<NariDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (oldVersion < 1) {
          const entryStore = db.createObjectStore('entries', {
            keyPath: 'id',
            autoIncrement: true,
          });
          entryStore.createIndex('by-date', 'date');

          db.createObjectStore('settings', {
            keyPath: 'id',
          });
        }
        if (oldVersion < 2) {
          const entryStore = transaction.objectStore('entries');
          entryStore.openCursor().then(async function cursorIterate(cursor) {
            if (!cursor) return;
            const entry = cursor.value;
            entry.flow = 'none';
            await cursor.update(entry);
            cursor.continue().then(cursorIterate);
          });
        }
      },
    });
  }
  return dbPromise;
};

export const db = {
  async getEntries(): Promise<CycleEntry[]> {
    const database = await getDB();
    return database.getAllFromIndex('entries', 'by-date');
  },

  async addEntry(entry: CycleEntry): Promise<number> {
    const database = await getDB();
    return database.add('entries', entry);
  },

  async bulkAddEntries(entries: CycleEntry[]): Promise<void> {
    const database = await getDB();
    const tx = database.transaction('entries', 'readwrite');
    for (const entry of entries) {
      await tx.store.add(entry);
    }
    await tx.done;
  },

  async updateEntry(entry: CycleEntry): Promise<number> {
    const database = await getDB();
    return database.put('entries', entry);
  },

  async deleteEntry(id: number): Promise<void> {
    const database = await getDB();
    return database.delete('entries', id);
  },

  async getSettings(): Promise<UserSettings | undefined> {
    const database = await getDB();
    return database.get('settings', 'user-settings');
  },

  async saveSettings(settings: UserSettings): Promise<string> {
    const database = await getDB();
    return database.put('settings', settings);
  },

  async clearAllData(): Promise<void> {
    const database = await getDB();
    await database.clear('entries');
    await database.clear('settings');
  }
};
