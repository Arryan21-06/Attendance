import { useState, useMemo } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameMonth, isToday, isBefore, isAfter,
  parseISO, startOfDay, addMonths, subMonths, getDay as getDayOfWeek
} from 'date-fns';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useSubjects, useTimetableSlots, useAttendanceLogs, useSettings, addAttendanceLog } from '../hooks/useStore';
import type { AttendanceStatus, Subject, TimetableSlot } from '../db/db';
import ClassAttendanceCard from '../components/ClassAttendanceCard';

// Color maps for indicators
const STATUS_DOT: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-500',
  absent: 'bg-rose-500',
  teacher_absent: 'bg-amber-400',
  holiday: 'bg-amber-400',
};

interface DayIndicator {
  slotId: string;
  subjectId: string;
  status: AttendanceStatus | null; // null = scheduled but no log
  subject: Subject;
  slot: TimetableSlot;
}

export default function CalendarTab() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'theory' | 'lab'>('all');

  const subjects = useSubjects();
  const slots = useTimetableSlots();
  const logs = useAttendanceLogs();
  const settings = useSettings();

  const today = startOfDay(new Date());
  const sessionStart = settings ? parseISO(settings.sessionStartDate) : today;

  // Navigation bounds
  const canGoPrev = isBefore(startOfMonth(subMonths(currentMonth, 1)), startOfMonth(today)) &&
    !isBefore(startOfMonth(subMonths(currentMonth, 1)), startOfMonth(sessionStart))
    ? true
    : !isBefore(startOfMonth(currentMonth), startOfMonth(addMonths(sessionStart, 1)));
  const canGoNext = isBefore(startOfMonth(currentMonth), startOfMonth(today));

  // Build calendar grid: Sun-Sat
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Leading empty cells (Sunday = 0 offset)
  const leadingBlanks = getDayOfWeek(startOfMonth(currentMonth));

  // Build a lookup: dateStr -> DayIndicator[]
  const dayIndicators = useMemo(() => {
    const map = new Map<string, DayIndicator[]>();
    
    for (const day of monthDays) {
      if (isBefore(day, sessionStart) || isAfter(day, today)) continue;
      
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayOfWeek = getDay(day);
      const daySlots = slots
        .filter(s => s.dayOfWeek === dayOfWeek)
        .filter(s => filterSubjectId === 'all' || s.subjectId === filterSubjectId)
        .filter(s => {
          if (filterType === 'all') return true;
          const subj = subjects.find(sub => sub.id === s.subjectId);
          return subj?.type === filterType;
        })
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      if (daySlots.length === 0) continue;
      
      const indicators: DayIndicator[] = daySlots.map(slot => {
        const log = logs.find(l => l.date === dateStr && l.timetableSlotId === slot.id);
        const subject = subjects.find(s => s.id === slot.subjectId);
        if (!subject) return null;
        return {
          slotId: slot.id,
          subjectId: slot.subjectId,
          status: log ? log.status : null,
          subject,
          slot,
        };
      }).filter(Boolean) as DayIndicator[];
      
      if (indicators.length > 0) {
        map.set(dateStr, indicators);
      }
    }
    
    return map;
  }, [monthDays, slots, logs, subjects, sessionStart, today, filterSubjectId, filterType]);

  // Detail sheet data
  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  
  // Slots for days with no log (upcoming or no timetable)
  const selectedDaySlots = useMemo(() => {
    if (!selectedDate) return [];
    const dayOfWeek = getDay(selectedDate);
    return slots
      .filter(s => s.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [selectedDate, slots]);

  // Logs for selected date (all, for the card handler)
  const selectedDayLogs = useMemo(() => {
    if (!selectedDateStr) return [];
    return logs.filter(l => l.date === selectedDateStr);
  }, [logs, selectedDateStr]);

  const handleStatusClick = (slotId: string, subjectId: string, status: AttendanceStatus) => {
    if (!selectedDateStr) return;
    const existingLog = selectedDayLogs.find(l => l.timetableSlotId === slotId);
    addAttendanceLog({
      id: existingLog ? existingLog.id : crypto.randomUUID(),
      date: selectedDateStr,
      timetableSlotId: slotId,
      subjectId,
      status,
    });
  };

  const WEEK_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="py-4 space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-white/60 backdrop-blur rounded-2xl p-3 shadow-sm border border-white/40">
        <button
          onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
          disabled={!canGoPrev}
          className="p-2 rounded-full hover:bg-slate-200/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div className="text-center">
          <div className="text-lg font-bold text-slate-800">{format(currentMonth, 'MMMM yyyy')}</div>
        </div>
        <button
          onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
          disabled={!canGoNext}
          className="p-2 rounded-full hover:bg-slate-200/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      {/* Filter Row */}
      <div className="space-y-2">
        {/* Subject Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setFilterSubjectId('all')}
            className={clsx(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
              filterSubjectId === 'all'
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white/70 text-slate-600 border-white/50 hover:bg-white/90"
            )}
          >
            All Subjects
          </button>
          {subjects.map(s => (
            <button
              key={s.id}
              onClick={() => setFilterSubjectId(s.id)}
              className={clsx(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                filterSubjectId === s.id
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white/70 text-slate-600 border-white/50 hover:bg-white/90"
              )}
            >
              {s.code}
            </button>
          ))}
        </div>
        
        {/* Type Filter */}
        <div className="flex gap-2">
          {(['all', 'theory', 'lab'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={clsx(
                "px-3 py-1 rounded-full text-xs font-semibold border transition-all capitalize",
                filterType === t
                  ? "bg-slate-600 text-white border-slate-600"
                  : "bg-white/60 text-slate-500 border-white/40 hover:bg-white/80"
              )}
            >
              {t === 'all' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-md border border-white/60 overflow-hidden">
        {/* Week headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {WEEK_HEADERS.map(h => (
            <div key={h} className="py-2 text-center text-[10px] font-bold uppercase text-slate-400 tracking-widest">
              {h}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {/* Leading blanks */}
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} className="min-h-[52px] border-b border-r border-slate-50/80 last:border-r-0" />
          ))}

          {monthDays.map((day, idx) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const indicators = dayIndicators.get(dateStr) ?? [];
            const hasClasses = indicators.length > 0;
            const isPast = !isAfter(day, today) && !isToday(day);
            const isFuture = isAfter(day, today);
            const isBeforeSession = isBefore(day, sessionStart);
            const isCurrentDay = isToday(day);
            const isSelected = selectedDate ? format(selectedDate, 'yyyy-MM-dd') === dateStr : false;
            const colIdx = (leadingBlanks + idx) % 7;
            const isLastInRow = colIdx === 6;
            const isInCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <button
                key={dateStr}
                onClick={() => hasClasses || (!isFuture && !isBeforeSession) ? setSelectedDate(day) : undefined}
                className={clsx(
                  "min-h-[52px] flex flex-col items-center pt-1.5 pb-1 border-b border-slate-50/80 transition-all",
                  !isLastInRow && "border-r",
                  hasClasses && !isFuture && "cursor-pointer hover:bg-slate-50/60 active:bg-slate-100/60",
                  isSelected && "bg-slate-100/80",
                  !isInCurrentMonth && "opacity-30"
                )}
              >
                {/* Date number */}
                <span className={clsx(
                  "w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mb-1 transition-colors",
                  isCurrentDay && "bg-slate-800 text-white",
                  !isCurrentDay && isPast && hasClasses && "text-slate-700",
                  !isCurrentDay && (isFuture || isBeforeSession || !hasClasses) && "text-slate-300",
                  isSelected && !isCurrentDay && "ring-2 ring-slate-400"
                )}>
                  {format(day, 'd')}
                </span>

                {/* Indicators row */}
                {hasClasses && !isFuture && !isBeforeSession && (
                  <div className="flex gap-0.5 flex-wrap justify-center max-w-[44px]">
                    {indicators.slice(0, 5).map((ind, i) => (
                      <span
                        key={i}
                        className={clsx(
                          "w-1.5 h-1.5 rounded-full flex-shrink-0",
                          ind.status === null ? "bg-slate-300" : STATUS_DOT[ind.status]
                        )}
                      />
                    ))}
                    {indicators.length > 5 && (
                      <span className="text-[8px] text-slate-400 font-bold">+{indicators.length - 5}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-1">
        {[
          { color: 'bg-emerald-500', label: 'Present' },
          { color: 'bg-rose-500', label: 'Absent' },
          { color: 'bg-amber-400', label: 'Excused' },
          { color: 'bg-slate-300', label: 'Unmarked' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={clsx("w-2 h-2 rounded-full", color)} />
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Day Detail Bottom Sheet */}
      {selectedDate && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setSelectedDate(null)}
          />

          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 rounded-t-3xl bg-white/95 backdrop-blur-xl shadow-2xl border-t border-white/60 max-h-[75vh] flex flex-col">
            {/* Handle + Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  {format(selectedDate, 'EEEE')}
                </p>
                <h2 className="text-xl font-bold text-slate-800">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </h2>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-4 pb-8 space-y-3">
              {selectedDaySlots.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-400 font-medium">No classes scheduled</p>
                  <p className="text-slate-300 text-sm mt-1">This day has no timetable entries</p>
                </div>
              ) : isAfter(selectedDate, today) || isBefore(selectedDate, sessionStart) ? (
                <div className="text-center py-10">
                  <p className="text-slate-400 font-medium">
                    {isBefore(selectedDate, sessionStart) ? 'Before session start' : 'Upcoming classes'}
                  </p>
                  <p className="text-slate-300 text-sm mt-1">
                    {selectedDaySlots.length} class{selectedDaySlots.length !== 1 ? 'es' : ''} scheduled
                  </p>
                </div>
              ) : (
                selectedDaySlots.map(slot => {
                  const subject = subjects.find(s => s.id === slot.subjectId);
                  const log = selectedDayLogs.find(l => l.timetableSlotId === slot.id);
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
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
