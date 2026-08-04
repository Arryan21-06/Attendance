import { useState, useEffect } from 'react';
import { getDB, type Subject, type TimetableSlot, type AttendanceLog, type AppSettings } from '../db/db';

// A simple event emitter to notify hooks of db changes
class DBStore {
  private listeners: (() => void)[] = [];

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach((l) => l());
  }
}

export const dbStore = new DBStore();

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    async function load() {
      const db = await getDB();
      const all = await db.getAll('subjects');
      setSubjects(all);
    }
    load();
    return dbStore.subscribe(load);
  }, []);

  return subjects;
}

export function useTimetableSlots() {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);

  useEffect(() => {
    async function load() {
      const db = await getDB();
      const all = await db.getAll('timetableSlots');
      setSlots(all);
    }
    load();
    return dbStore.subscribe(load);
  }, []);

  return slots;
}

export function useAttendanceLogs() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);

  useEffect(() => {
    async function load() {
      const db = await getDB();
      const all = await db.getAll('attendanceLogs');
      setLogs(all);
    }
    load();
    return dbStore.subscribe(load);
  }, []);

  return logs;
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    async function load() {
      const db = await getDB();
      const s = await db.get('settings', 'main');
      if (s) setSettings(s);
    }
    load();
    return dbStore.subscribe(load);
  }, []);

  return settings;
}

// Write helpers that automatically notify listeners
export async function addAttendanceLog(log: AttendanceLog) {
  const db = await getDB();
  await db.put('attendanceLogs', log);
  dbStore.notify();
}

export async function deleteAttendanceLog(id: string) {
  const db = await getDB();
  await db.delete('attendanceLogs', id);
  dbStore.notify();
}

export async function updateSettings(settings: AppSettings) {
  const db = await getDB();
  await db.put('settings', settings);
  dbStore.notify();
}

export async function updateSubject(subject: Subject) {
  const db = await getDB();
  await db.put('subjects', subject);
  dbStore.notify();
}

export async function updateTimetableSlot(slot: TimetableSlot) {
  const db = await getDB();
  await db.put('timetableSlots', slot);
  dbStore.notify();
}
