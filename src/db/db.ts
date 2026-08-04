import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export type SubjectType = 'theory' | 'lab';

export interface Subject {
  id: string;
  code: string;
  name: string;
  type: SubjectType;
  color: string;
}

export interface TimetableSlot {
  id: string;
  subjectId: string;
  dayOfWeek: number; // 0 for Sunday, 1 for Monday, etc.
  startTime: string; // HH:mm format
  endTime: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'teacher_absent' | 'holiday';

export interface AttendanceLog {
  id: string;
  date: string; // YYYY-MM-DD
  timetableSlotId: string;
  subjectId: string;
  status: AttendanceStatus;
}

export interface AppSettings {
  id: 'main'; // Single row for settings
  sessionStartDate: string; // YYYY-MM-DD
  attendanceThreshold: number; // Default 75
}

interface AttendTrackDB extends DBSchema {
  subjects: {
    key: string;
    value: Subject;
  };
  timetableSlots: {
    key: string;
    value: TimetableSlot;
    indexes: { 'by-day': number };
  };
  attendanceLogs: {
    key: string;
    value: AttendanceLog;
    indexes: { 'by-date': string, 'by-subject': string };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

let dbPromise: Promise<IDBPDatabase<AttendTrackDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<AttendTrackDB>('attendtrack-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('subjects')) {
          db.createObjectStore('subjects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('timetableSlots')) {
          const slotStore = db.createObjectStore('timetableSlots', { keyPath: 'id' });
          slotStore.createIndex('by-day', 'dayOfWeek');
        }
        if (!db.objectStoreNames.contains('attendanceLogs')) {
          const logStore = db.createObjectStore('attendanceLogs', { keyPath: 'id' });
          logStore.createIndex('by-date', 'date');
          logStore.createIndex('by-subject', 'subjectId');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}
