import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { seedDatabase } from './db/seed.ts'
import { getDB } from './db/db.ts'

/**
 * One-time migration: DS Lab moved from Friday 10:00-12:00 → Tuesday 08:00-10:00.
 *
 * Runs on every app load BEFORE seeding. Detects the old slot by its stable id
 * ("slot-fri-1") combined with the old day/time values, then updates day and time
 * in-place. The id and subjectId are intentionally unchanged so existing
 * AttendanceLog rows (linked via timetableSlotId + subjectId) remain intact and
 * continue to appear correctly in Stats and Calendar views.
 *
 * After the first run the slot will have dayOfWeek:2, so the guard condition is
 * false on every subsequent load and the function becomes a no-op.
 */
async function migrateDsLabSlot() {
  try {
    const db = await getDB();
    const slot = await db.get('timetableSlots', 'slot-fri-1');
    if (slot && slot.dayOfWeek === 5 && slot.startTime === '10:00') {
      const updated = { ...slot, dayOfWeek: 2, startTime: '08:00', endTime: '10:00' };
      await db.put('timetableSlots', updated);
      console.log('[Migration] DS Lab slot moved: Friday 10:00-12:00 → Tuesday 08:00-10:00');
    }
  } catch (error) {
    console.error('[Migration] migrateDsLabSlot failed:', error);
  }
}

async function init() {
  try {
    // Run migration first so existing installs update before the seed guard runs
    await migrateDsLabSlot();
    await seedDatabase();
  } catch (error) {
    console.error('Failed to initialise database:', error);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

init();
