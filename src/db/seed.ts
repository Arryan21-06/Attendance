import { getDB, type Subject, type TimetableSlot, type AppSettings } from './db';

const initialSubjects: Subject[] = [
  { id: 'sub-os-th', code: 'OS', name: 'Operating Systems', type: 'theory', color: 'bg-[#DCEBF7]' },
  { id: 'sub-os-lab', code: 'OS LAB', name: 'Operating Systems Lab', type: 'lab', color: 'bg-[#DCEBF7]' },
  
  { id: 'sub-dsd-th', code: 'DSD', name: 'Digital System Design', type: 'theory', color: 'bg-[#B9D4EC]' },
  { id: 'sub-dsd-lab', code: 'DSD LAB', name: 'Digital System Design Lab', type: 'lab', color: 'bg-[#B9D4EC]' },
  
  { id: 'sub-oop-th', code: 'OOP', name: 'Object Oriented Programming', type: 'theory', color: 'bg-[#F3D9E4]' },
  { id: 'sub-oop-lab', code: 'OOP LAB', name: 'Object Oriented Programming Lab', type: 'lab', color: 'bg-[#F3D9E4]' },
  
  { id: 'sub-ds-th', code: 'DS', name: 'Data Structures', type: 'theory', color: 'bg-[#F7EFE3]' },
  { id: 'sub-ds-lab', code: 'DS LAB', name: 'Data Structures Lab', type: 'lab', color: 'bg-[#F7EFE3]' },
  
  { id: 'sub-sem-th', code: 'SEM', name: 'Software Engineering & Management', type: 'theory', color: 'bg-[#98bfa7]' },
  { id: 'sub-sem-lab', code: 'SEM LAB', name: 'Software Engineering & Management Lab', type: 'lab', color: 'bg-[#98bfa7]' },
];

const initialSlots: TimetableSlot[] = [
  // MONDAY (1)
  { id: 'slot-mon-1', subjectId: 'sub-os-th', dayOfWeek: 1, startTime: '10:00', endTime: '11:00' },
  { id: 'slot-mon-2', subjectId: 'sub-dsd-th', dayOfWeek: 1, startTime: '11:00', endTime: '12:00' },
  { id: 'slot-mon-3', subjectId: 'sub-oop-th', dayOfWeek: 1, startTime: '12:00', endTime: '13:00' },
  { id: 'slot-mon-4', subjectId: 'sub-ds-th', dayOfWeek: 1, startTime: '14:00', endTime: '15:00' },
  { id: 'slot-mon-5', subjectId: 'sub-sem-th', dayOfWeek: 1, startTime: '15:00', endTime: '16:00' },
  { id: 'slot-mon-6', subjectId: 'sub-sem-lab', dayOfWeek: 1, startTime: '16:00', endTime: '18:00' },

  // TUESDAY (2)
  { id: 'slot-tue-1', subjectId: 'sub-dsd-lab', dayOfWeek: 2, startTime: '10:00', endTime: '12:00' },
  { id: 'slot-tue-2', subjectId: 'sub-dsd-th', dayOfWeek: 2, startTime: '12:00', endTime: '13:00' },
  { id: 'slot-tue-3', subjectId: 'sub-oop-th', dayOfWeek: 2, startTime: '13:00', endTime: '14:00' },

  // WEDNESDAY (3)
  { id: 'slot-wed-1', subjectId: 'sub-os-th', dayOfWeek: 3, startTime: '09:00', endTime: '10:00' },
  { id: 'slot-wed-2', subjectId: 'sub-oop-th', dayOfWeek: 3, startTime: '11:00', endTime: '12:00' },
  { id: 'slot-wed-3', subjectId: 'sub-dsd-th', dayOfWeek: 3, startTime: '12:00', endTime: '13:00' },
  { id: 'slot-wed-4', subjectId: 'sub-sem-th', dayOfWeek: 3, startTime: '15:00', endTime: '16:00' },
  { id: 'slot-wed-5', subjectId: 'sub-oop-lab', dayOfWeek: 3, startTime: '16:00', endTime: '18:00' },

  // THURSDAY (4)
  { id: 'slot-thu-1', subjectId: 'sub-ds-th', dayOfWeek: 4, startTime: '13:00', endTime: '14:00' },
  { id: 'slot-thu-2', subjectId: 'sub-os-lab', dayOfWeek: 4, startTime: '14:00', endTime: '16:00' },

  // FRIDAY (5)
  { id: 'slot-fri-1', subjectId: 'sub-ds-lab', dayOfWeek: 5, startTime: '10:00', endTime: '12:00' },
  { id: 'slot-fri-2', subjectId: 'sub-ds-th', dayOfWeek: 5, startTime: '13:00', endTime: '14:00' },
  { id: 'slot-fri-3', subjectId: 'sub-os-th', dayOfWeek: 5, startTime: '14:00', endTime: '15:00' },
  { id: 'slot-fri-4', subjectId: 'sub-sem-th', dayOfWeek: 5, startTime: '15:00', endTime: '16:00' },
];

export async function seedDatabase() {
  const db = await getDB();
  
  // Check if already seeded by looking for settings
  const settingsCount = await db.count('settings');
  if (settingsCount > 0) {
    return; // Already seeded
  }

  const tx = db.transaction(['subjects', 'timetableSlots', 'settings'], 'readwrite');
  
  // Add Subjects
  for (const subject of initialSubjects) {
    tx.objectStore('subjects').put(subject);
  }

  // Add Slots
  for (const slot of initialSlots) {
    tx.objectStore('timetableSlots').put(slot);
  }

  // Add Default Settings
  const defaultSettings: AppSettings = {
    id: 'main',
    sessionStartDate: '2026-07-28', // As requested in prompt
    attendanceThreshold: 75,
  };
  tx.objectStore('settings').put(defaultSettings);

  await tx.done;
  console.log('Database seeded successfully');
}
