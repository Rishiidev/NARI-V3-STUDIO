import { CycleEntry, UserSettings } from './db';
import { jsPDF } from 'jspdf';

export const exportToJSON = (entries: CycleEntry[], settings: UserSettings) => {
  const data = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    entries,
    settings: {
      averageCycleLength: settings.averageCycleLength,
      averagePeriodLength: settings.averagePeriodLength,
    }
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nari-data-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportToCSV = (entries: CycleEntry[]) => {
  const headers = ['Date', 'Type', 'Flow', 'Symptom Intensities', 'Symptoms', 'Moods', 'Notes'];
  const rows = entries.map(e => [
    e.date,
    e.type,
    e.flow || 'none',
    e.symptomIntensities ? Object.entries(e.symptomIntensities).map(([s, i]) => `${s}:${i}`).join(';') : '',
    (e.symptoms || []).join(';'),
    (e.moods || []).join(';'),
    e.notes.replace(/,/g, ';')
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nari-data-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportToPDF = (entries: CycleEntry[]) => {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text('Nari Cycle Report', 20, 20);
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);

  let y = 45;
  entries.forEach((e, i) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.text(`${e.date} - ${e.type.replace('_', ' ')}`, 20, y);
    doc.setFont('helvetica', 'normal');
    y += 7;
    if (e.symptomIntensities) {
      const intensities = Object.entries(e.symptomIntensities).map(([s, i]) => `${s}: ${i}`).join(', ');
      doc.text(`Symptom Intensities: ${intensities}`, 25, y);
      y += 5;
    }
    if (e.symptoms?.length) {
      doc.text(`Symptoms: ${e.symptoms.join(', ')}`, 25, y);
      y += 5;
    }
    if (e.moods?.length) {
      doc.text(`Moods: ${e.moods.join(', ')}`, 25, y);
      y += 5;
    }
    if (e.notes) {
      doc.setFont('helvetica', 'italic');
      const splitNotes = doc.splitTextToSize(`Notes: ${e.notes}`, 160);
      doc.text(splitNotes, 25, y);
      y += (splitNotes.length * 6);
      doc.setFont('helvetica', 'normal');
    }
    y += 5;
    doc.line(20, y, 190, y);
    y += 10;
  });

  doc.save(`nari-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportToDailySummary = (entries: CycleEntry[]) => {
  const summary = entries.map(e => `
Date: ${e.date}
Type: ${e.type.replace('_', ' ')}
Symptoms: ${(e.symptoms || []).join(', ')}
Moods: ${(e.moods || []).join(', ')}
Notes: ${e.notes}
-------------------
  `).join('\n');

  const blob = new Blob([summary], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nari-summary-${new Date().toISOString().split('T')[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};
