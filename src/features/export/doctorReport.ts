import { CycleEntry } from '../../lib/db';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { parseISO, differenceInDays, isAfter, subMonths, format, subDays } from 'date-fns';

export interface CycleSummary {
  cycleNumber: number;
  startDate: Date;
  endDate: Date;
  length: number;
  periodLength: number;
}

export const getCyclesInRange = (entries: CycleEntry[], months: number = 3, excludedCycleStartDates: string[] = []): CycleSummary[] => {
  const cutoffDate = subMonths(new Date(), months);
  
  // Sort entries chronologically
  const sorted = [...entries].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  
  const cycles: CycleSummary[] = [];
  let currentCycleStart: Date | null = null;
  let currentPeriodEnd: Date | null = null;
  let cycleCount = 1;

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const entryDate = parseISO(entry.date);

    if (entry.type === 'period_start') {
      if (currentCycleStart) {
        // Close previous cycle
        const cycleLength = differenceInDays(entryDate, currentCycleStart);
        let periodLength = currentPeriodEnd ? differenceInDays(currentPeriodEnd, currentCycleStart) + 1 : 5; // Default to 5 if no end logged
        
        // If period length is unreasonable, fallback to counting flow days
        if (periodLength > 14 || periodLength < 1) {
           const flowDays = sorted.filter(e => 
             parseISO(e.date) >= currentCycleStart! && 
             parseISO(e.date) < entryDate && 
             e.flow !== 'none'
           ).length;
           periodLength = flowDays > 0 ? flowDays : 5;
        }

        if (isAfter(currentCycleStart, cutoffDate)) {
          const startDateStr = format(currentCycleStart, 'yyyy-MM-dd');
          if (!excludedCycleStartDates.includes(startDateStr)) {
            cycles.push({
              cycleNumber: cycleCount++,
              startDate: currentCycleStart,
              endDate: subDays(entryDate, 1),
              length: cycleLength,
              periodLength
            });
          }
        }
      }
      currentCycleStart = entryDate;
      currentPeriodEnd = null;
    } else if (entry.type === 'period_end' && currentCycleStart) {
      currentPeriodEnd = entryDate;
    }
  }

  return cycles;
};

export const calculateCycleStats = (cycles: CycleSummary[]) => {
  if (cycles.length === 0) return null;
  
  const lengths = cycles.map(c => c.length);
  const periodLengths = cycles.map(c => c.periodLength);
  
  return {
    avgCycleLength: Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length),
    minCycleLength: Math.min(...lengths),
    maxCycleLength: Math.max(...lengths),
    avgPeriodLength: Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length),
    totalCycles: cycles.length
  };
};

export const getSymptomFrequency = (entries: CycleEntry[], months: number = 3) => {
  const cutoffDate = subMonths(new Date(), months);
  const recentEntries = entries.filter(e => isAfter(parseISO(e.date), cutoffDate));
  
  const counts: Record<string, number> = {};
  recentEntries.forEach(e => {
    (e.symptoms || []).forEach(s => {
      counts[s] = (counts[s] || 0) + 1;
    });
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
};

export const generateDoctorReportPDF = (entries: CycleEntry[], months: number = 3) => {
  const cycles = getCyclesInRange(entries, months);
  const stats = calculateCycleStats(cycles);
  const topSymptoms = getSymptomFrequency(entries, months);

  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Nari', 20, 20);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('Cycle Report', 20, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('For personal / clinical reference', 20, 36);
  doc.text(`Generated on: ${format(new Date(), 'MMM d, yyyy')}`, 20, 42);
  doc.text(`Reporting Period: Last ${months} months`, 20, 48);
  
  doc.setTextColor(0);

  if (!stats) {
    doc.setFontSize(12);
    doc.text('Not enough completed cycle data available for this period.', 20, 65);
    doc.save(`nari-doctor-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    return;
  }

  // Section 1: Summary
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Cycle Summary', 20, 65);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Average Cycle Length: ${stats.avgCycleLength} days (Range: ${stats.minCycleLength} - ${stats.maxCycleLength} days)`, 20, 75);
  doc.text(`Average Period Length: ${stats.avgPeriodLength} days`, 20, 82);
  doc.text(`Total Cycles Tracked: ${stats.totalCycles}`, 20, 89);

  // Section 2: Cycle Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Cycle History', 20, 105);

  const tableData = cycles.map(c => [
    c.cycleNumber,
    format(c.startDate, 'MMM d, yyyy'),
    format(c.endDate, 'MMM d, yyyy'),
    `${c.length} days`,
    `${c.periodLength} days`
  ]);

  autoTable(doc, {
    startY: 110,
    head: [['Cycle #', 'Start Date', 'End Date', 'Length', 'Period Length']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [40, 40, 40], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 4 },
  });

  // Section 3: Symptom Overview
  let finalY = (doc as any).lastAutoTable.finalY + 15;
  
  if (finalY > 250) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Most Common Symptoms', 20, finalY);
  
  if (topSymptoms.length > 0) {
    autoTable(doc, {
      startY: finalY + 5,
      head: [['Symptom', 'Frequency']],
      body: topSymptoms.map(([symptom, count]) => [symptom, `${count} times`]),
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: 0 },
      styles: { fontSize: 10, cellPadding: 4 },
    });
    finalY = (doc as any).lastAutoTable.finalY;
  } else {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('No symptoms logged in this period.', 20, finalY + 10);
    finalY += 10;
  }

  // Section 4: Notes (Optional)
  finalY += 15;
  if (finalY > 250) {
    doc.addPage();
    finalY = 20;
  }

  const recentNotes = entries
    .filter(e => e.notes && e.notes.trim().length > 0 && isAfter(parseISO(e.date), subMonths(new Date(), months)))
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
    .slice(0, 5);

  if (recentNotes.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Notes', 20, finalY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    let noteY = finalY + 10;
    
    recentNotes.forEach(entry => {
      if (noteY > 270) {
        doc.addPage();
        noteY = 20;
      }
      const noteText = `${format(parseISO(entry.date), 'MMM d')}: ${entry.notes}`;
      const splitNotes = doc.splitTextToSize(noteText, 170);
      
      // Truncate if too long (e.g. more than 3 lines)
      const displayNotes = splitNotes.length > 3 ? [...splitNotes.slice(0, 3), '...'] : splitNotes;
      
      doc.text(displayNotes, 20, noteY);
      noteY += (displayNotes.length * 5) + 4;
    });
  }

  // Section 5: Disclaimer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150);
  
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text('This report is generated from user-logged data and is not a medical diagnosis.', 20, 285);
  }

  doc.save(`nari-doctor-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
