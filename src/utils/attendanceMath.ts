import type { Subject, TimetableSlot, AttendanceLog } from '../db/db';
import { isBefore, parseISO, isSameDay } from 'date-fns';

export interface SubjectStats {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  subjectType: 'theory' | 'lab';
  totalHeld: number;
  totalAttended: number;
  percentage: number;
  status: 'good' | 'warning' | 'critical'; // good: >= threshold, warning: within 5%, critical: below
  bunkMargin: number; // Max future absent allowed while maintaining threshold
  recoveryCount: number; // Min consecutive present needed to reach threshold
}

/**
 * Pure function to calculate attendance stats for a specific subject based on provided logs, slots, and threshold.
 */
export function calculateSubjectStats(
  subject: Subject,
  _slots: TimetableSlot[],
  logs: AttendanceLog[],
  sessionStartDate: string,
  attendanceThreshold: number
): SubjectStats {
  const subjectLogs = logs.filter(l => l.subjectId === subject.id);
  
  // Only count logs that are on or after the session start date
  const start = parseISO(sessionStartDate);
  
  let totalHeld = 0;
  let totalAttended = 0;

  subjectLogs.forEach(log => {
    const logDate = parseISO(log.date);
    if (isBefore(logDate, start) && !isSameDay(logDate, start)) return;

    if (log.status === 'present' || log.status === 'absent') {
      totalHeld++;
    }
    
    if (log.status === 'present') {
      totalAttended++;
    }
    // 'teacher_absent' and 'holiday' do not affect totalHeld or totalAttended
  });

  let percentage = totalHeld === 0 ? 100 : (totalAttended / totalHeld) * 100;

  let status: 'good' | 'warning' | 'critical' = 'good';
  if (percentage < attendanceThreshold) {
    status = 'critical';
  } else if (percentage - attendanceThreshold <= 5) {
    status = 'warning';
  }

  // Bunk Margin Math: Max future absent allowed
  // if attended / (totalHeld + x) >= threshold / 100
  // attended >= (totalHeld + x) * (threshold / 100)
  // attended / (threshold / 100) >= totalHeld + x
  // x <= (attended * 100 / threshold) - totalHeld
  let bunkMargin = 0;
  if (percentage >= attendanceThreshold) {
    bunkMargin = Math.floor((totalAttended * 100) / attendanceThreshold) - totalHeld;
  }

  // Recovery Counter: Min consecutive present needed
  // (attended + x) / (totalHeld + x) >= threshold / 100
  // attended + x >= (totalHeld + x) * (threshold / 100)
  // let t = threshold / 100
  // attended + x >= totalHeld * t + x * t
  // x - x*t >= totalHeld * t - attended
  // x * (1 - t) >= totalHeld * t - attended
  // x >= (totalHeld * t - attended) / (1 - t)
  let recoveryCount = 0;
  if (percentage < attendanceThreshold) {
    const t = attendanceThreshold / 100;
    recoveryCount = Math.ceil((totalHeld * t - totalAttended) / (1 - t));
  }

  return {
    subjectId: subject.id,
    subjectCode: subject.code,
    subjectName: subject.name,
    subjectType: subject.type,
    totalHeld,
    totalAttended,
    percentage,
    status,
    bunkMargin,
    recoveryCount
  };
}

export function calculateOverallAttendance(stats: SubjectStats[]): number {
  let totalHeld = 0;
  let totalAttended = 0;
  
  stats.forEach(s => {
    totalHeld += s.totalHeld;
    totalAttended += s.totalAttended;
  });

  if (totalHeld === 0) return 100;
  return (totalAttended / totalHeld) * 100;
}
