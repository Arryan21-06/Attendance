import { useState, useMemo } from 'react';
import { format, addDays, subDays, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Tent } from 'lucide-react';
import { useSubjects, useTimetableSlots, useAttendanceLogs, addAttendanceLog } from '../hooks/useStore';
import type { AttendanceStatus } from '../db/db';
import ClassAttendanceCard from '../components/ClassAttendanceCard';

export default function TodayTab() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const subjects = useSubjects();
  const slots = useTimetableSlots();
  const logs = useAttendanceLogs();

  const dayOfWeek = getDay(selectedDate);
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Find slots for this day, sort by start time
  const todaysSlots = useMemo(() => {
    return slots
      .filter((s) => s.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [slots, dayOfWeek]);

  // Find logs for this date
  const logsForDate = useMemo(() => {
    return logs.filter((l) => l.date === dateStr);
  }, [logs, dateStr]);

  const handleStatusClick = (slotId: string, subjectId: string, status: AttendanceStatus) => {
    const existingLog = logsForDate.find(l => l.timetableSlotId === slotId);
    
    // Quick haptic feedback if supported
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }

    addAttendanceLog({
      id: existingLog ? existingLog.id : crypto.randomUUID(),
      date: dateStr,
      timetableSlotId: slotId,
      subjectId: subjectId,
      status: status
    });
  };

  const markFullHoliday = () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([50, 50]);
    }
    todaysSlots.forEach(slot => {
      handleStatusClick(slot.id, slot.subjectId, 'holiday');
    });
  };

  return (
    <div className="py-4 space-y-6">
      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-white/60 backdrop-blur rounded-2xl p-3 shadow-sm border border-white/40">
        <button 
          onClick={() => setSelectedDate(prev => subDays(prev, 1))}
          className="p-2 rounded-full hover:bg-slate-200/50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div className="text-center">
          <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">
            {format(selectedDate, 'EEEE')}
          </div>
          <div className="text-lg font-bold text-slate-800">
            {format(selectedDate, 'MMM d, yyyy')}
          </div>
        </div>
        <button 
          onClick={() => setSelectedDate(prev => addDays(prev, 1))}
          className="p-2 rounded-full hover:bg-slate-200/50 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      {todaysSlots.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white/40 backdrop-blur rounded-3xl border border-white/50">
          <p className="text-slate-500 font-medium">No classes scheduled for this day.</p>
        </div>
      ) : (
        <>
          <button 
            onClick={markFullHoliday}
            className="w-full py-3 bg-white/60 hover:bg-white/80 backdrop-blur rounded-xl border border-white/50 shadow-sm text-sm font-semibold text-slate-600 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Tent className="w-4 h-4" />
            Mark Full College Holiday
          </button>

          <div className="space-y-4">
            {todaysSlots.map(slot => {
              const subject = subjects.find(s => s.id === slot.subjectId);
              const log = logsForDate.find(l => l.timetableSlotId === slot.id);
              if (!subject) return null;

              return (
                <ClassAttendanceCard
                  key={slot.id}
                  slot={slot}
                  subject={subject}
                  log={log}
                  onStatusClick={handleStatusClick}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
