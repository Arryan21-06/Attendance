import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useSubjects, useTimetableSlots, useAttendanceLogs, useSettings, deleteAttendanceLog } from '../hooks/useStore';
import { calculateSubjectStats, calculateOverallAttendance, type SubjectStats } from '../utils/attendanceMath';
import { format, parseISO } from 'date-fns';

export default function StatsTab() {
  const subjects = useSubjects();
  const slots = useTimetableSlots();
  const logs = useAttendanceLogs();
  const settings = useSettings();

  const [selectedSubject, setSelectedSubject] = useState<SubjectStats | null>(null);

  const stats = useMemo(() => {
    if (!settings) return [];
    return subjects.map(subject => 
      calculateSubjectStats(subject, slots, logs, settings.sessionStartDate, settings.attendanceThreshold)
    );
  }, [subjects, slots, logs, settings]);

  const overallPercentage = useMemo(() => {
    return calculateOverallAttendance(stats);
  }, [stats]);

  if (!settings) {
    return <div className="p-4 text-center">Loading settings...</div>;
  }

  // Details View
  if (selectedSubject) {
    const subjectLogs = logs
      .filter(l => l.subjectId === selectedSubject.subjectId)
      .sort((a, b) => b.date.localeCompare(a.date));

    return (
      <div className="py-4 space-y-6 relative h-full">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white/50 z-10 flex items-center gap-3">
          <button 
            onClick={() => setSelectedSubject(null)}
            className="p-2 -ml-2 rounded-full hover:bg-slate-200/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{selectedSubject.subjectCode}</h2>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{selectedSubject.subjectType}</p>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur rounded-2xl p-5 shadow-sm border border-white/40 text-center">
          <div className="text-4xl font-black text-slate-800 mb-1">
            {selectedSubject.percentage.toFixed(1)}%
          </div>
          <p className="text-sm font-medium text-slate-500 mb-4">
            Attended {selectedSubject.totalAttended} of {selectedSubject.totalHeld} classes
          </p>
          
          {selectedSubject.status === 'good' && (
            <div className="bg-emerald-100 text-emerald-800 py-2 px-4 rounded-xl text-sm font-semibold inline-block">
              Safe to bunk {selectedSubject.bunkMargin} class{selectedSubject.bunkMargin !== 1 && 'es'}
            </div>
          )}
          {selectedSubject.status === 'warning' && (
            <div className="bg-amber-100 text-amber-800 py-2 px-4 rounded-xl text-sm font-semibold inline-block">
              Warning! Safe to bunk {selectedSubject.bunkMargin} class{selectedSubject.bunkMargin !== 1 && 'es'}
            </div>
          )}
          {selectedSubject.status === 'critical' && (
            <div className="bg-rose-100 text-rose-800 py-2 px-4 rounded-xl text-sm font-semibold inline-block">
              Attend next {selectedSubject.recoveryCount} class{selectedSubject.recoveryCount !== 1 && 'es'} to recover
            </div>
          )}
        </div>

        <h3 className="font-bold text-slate-700 px-2 mt-6 mb-3">Attendance History</h3>
        
        {subjectLogs.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No records yet.</p>
        ) : (
          <div className="space-y-3">
            {subjectLogs.map(log => (
              <div key={log.id} className="flex justify-between items-center bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-white/50">
                <div>
                  <div className="font-semibold text-slate-800">{format(parseISO(log.date), 'MMM d, yyyy')}</div>
                  <div className={clsx(
                    "text-xs font-bold uppercase tracking-wider mt-0.5",
                    log.status === 'present' ? 'text-emerald-600' :
                    log.status === 'absent' ? 'text-rose-600' :
                    log.status === 'teacher_absent' ? 'text-amber-600' :
                    'text-sky-600'
                  )}>
                    {log.status === 'teacher_absent' ? 'No Prof' : log.status}
                  </div>
                </div>
                <button 
                  onClick={() => deleteAttendanceLog(log.id)}
                  className="text-xs text-rose-500 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg font-medium"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="py-4 space-y-6">
      {/* Overall Stats */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white/50 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent" />
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest relative z-10 mb-2">Overall Attendance</h2>
        <div className="text-5xl font-black text-slate-800 relative z-10">
          {overallPercentage.toFixed(1)}<span className="text-3xl text-slate-400">%</span>
        </div>
      </div>

      <div className="space-y-4">
        {stats.map(stat => (
          <button 
            key={stat.subjectId}
            onClick={() => setSelectedSubject(stat)}
            className="w-full text-left bg-white/70 hover:bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/50 transition-all active:scale-95 group relative overflow-hidden"
          >
            {/* Status indicator bar */}
            <div className={clsx(
              "absolute left-0 top-0 bottom-0 w-1.5",
              stat.status === 'good' ? "bg-emerald-400" :
              stat.status === 'warning' ? "bg-amber-400" :
              "bg-rose-400"
            )} />

            <div className="pl-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-lg leading-tight">{stat.subjectCode}</h3>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">{stat.subjectType}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-800 leading-tight">{stat.percentage.toFixed(0)}%</div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">
                    {stat.status === 'critical' ? (
                      <span className="text-rose-500">Need {stat.recoveryCount}</span>
                    ) : (
                      <span className={stat.status === 'warning' ? 'text-amber-500' : 'text-emerald-500'}>
                        Bunk {stat.bunkMargin}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
