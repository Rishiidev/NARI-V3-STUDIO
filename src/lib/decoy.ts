import { CycleEntry } from './db';
import { format, subDays } from 'date-fns';

export const generateFakeEntries = (): CycleEntry[] => {
  const entries: CycleEntry[] = [];
  const today = new Date();
  
  // Generate 3 cycles with varied lengths (26-32 days)
  let currentDay = today;
  for (let cycle = 0; cycle < 3; cycle++) {
    const cycleLength = 26 + Math.floor(Math.random() * 7);
    const periodLength = 3 + Math.floor(Math.random() * 3);
    
    for (let day = 0; day < cycleLength; day++) {
      const date = subDays(currentDay, day);
      
      let type: CycleEntry['type'] = 'spotting';
      let symptoms: string[] = [];
      let moods: string[] = [];
      let symptomIntensities: Record<string, number> = {};
      
      // Simulate habits
      const hitWater = Math.random() > 0.4;
      const hitSleep = Math.random() > 0.3;
      const hitExercise = Math.random() > 0.5;
      
      if (day < periodLength) {
        type = 'period_start';
        symptoms = Math.random() > 0.5 ? ['cramps', 'fatigue'] : ['headache', 'bloating'];
        moods = ['irritable', 'sad'];
        
        // Make symptoms worse if habits missed
        symptoms.forEach(s => {
          let base = 3;
          if (!hitWater && s === 'headache') base += 1;
          if (!hitSleep && s === 'fatigue') base += 2;
          if (!hitExercise && s === 'cramps') base += 1;
          symptomIntensities[s] = Math.min(5, base);
        });
      } else if (day === Math.floor(cycleLength / 2)) {
        type = 'ovulation';
        moods = ['happy', 'energetic'];
        symptoms = ['bloating'];
        symptomIntensities['bloating'] = hitWater ? 1 : 3;
      } else {
        moods = ['calm', 'happy'];
        if (Math.random() > 0.7) {
          symptoms = ['headache'];
          symptomIntensities['headache'] = hitSleep ? 1 : 4;
        }
      }
      
      entries.push({
        date: format(date, 'yyyy-MM-dd'),
        type,
        flow: type === 'period_start' ? 'medium' : 'none',
        symptoms,
        moods,
        notes: type === 'period_start' ? 'Fake period' : 'Fake day',
        symptomIntensities,
        waterIntake: hitWater ? 2000 : 1000,
        sleepDuration: hitSleep ? 8 : 5,
        exercise: hitExercise ? { duration: 30, type: 'Yoga', intensity: 'low' } : undefined
      });
    }
    currentDay = subDays(currentDay, cycleLength);
  }
  return entries;
};
