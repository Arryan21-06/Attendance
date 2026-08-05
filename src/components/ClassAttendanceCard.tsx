import { useState } from 'react';
import { CheckCircle2, XCircle, UserMinus, Tent, Check } from 'lucide-react';
import { clsx } from 'clsx';
import type { Subject, TimetableSlot, AttendanceStatus, AttendanceLog } from '../db/db';

interface ClassAttendanceCardProps {
  slot: TimetableSlot;
  subject: Subject;
  log?: AttendanceLog;
  onStatusClick: (slotId: string, subjectId: string, status: AttendanceStatus) => void;
}

export default function ClassAttendanceCard({
  slot,
  subject,
  log,
  onStatusClick
}: ClassAttendanceCardProps) {
  const [justTapped, setJustTapped] = useState<AttendanceStatus | null>(null);

  const handleClick = (status: AttendanceStatus) => {
    // Lightweight haptics
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
    
    // Transient pulse confirmation
    setJustTapped(status);
    setTimeout(() => setJustTapped(null), 500);
    
    onStatusClick(slot.id, subject.id, status);
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-md border border-white/60 relative overflow-hidden transition-all">
      {/* Left accent bar mapping to subject color */}
      <div className={clsx("absolute left-0 top-0 bottom-0 w-1.5", subject.color)} />
      
      <div className="pl-3 mb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-slate-800 text-lg leading-tight">{subject.code}</h3>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">{subject.type}</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-semibold text-slate-700">{slot.startTime} - {slot.endTime}</span>
          </div>
        </div>
      </div>

      {/* 4-Tap Actions - styled as pill buttons */}
      <div className="grid grid-cols-4 gap-2 mt-4">
        <StatusButton 
          status="present"
          currentStatus={log?.status}
          justTapped={justTapped === 'present'}
          onClick={() => handleClick('present')}
          label="Present"
          icon={<CheckCircle2 className="w-5 h-5 mb-1" />}
          activeColors="bg-emerald-500 text-white shadow-emerald-200 shadow-sm border-emerald-500"
          inactiveColors="bg-slate-50 border-slate-100 text-slate-400 hover:bg-emerald-50"
        />
        <StatusButton 
          status="absent"
          currentStatus={log?.status}
          justTapped={justTapped === 'absent'}
          onClick={() => handleClick('absent')}
          label="Absent"
          icon={<XCircle className="w-5 h-5 mb-1" />}
          activeColors="bg-rose-500 text-white shadow-rose-200 shadow-sm border-rose-500"
          inactiveColors="bg-slate-50 border-slate-100 text-slate-400 hover:bg-rose-50"
        />
        <StatusButton 
          status="teacher_absent"
          currentStatus={log?.status}
          justTapped={justTapped === 'teacher_absent'}
          onClick={() => handleClick('teacher_absent')}
          label="No Prof"
          icon={<UserMinus className="w-5 h-5 mb-1" />}
          activeColors="bg-amber-500 text-white shadow-amber-200 shadow-sm border-amber-500"
          inactiveColors="bg-slate-50 border-slate-100 text-slate-400 hover:bg-amber-50"
        />
        <StatusButton 
          status="holiday"
          currentStatus={log?.status}
          justTapped={justTapped === 'holiday'}
          onClick={() => handleClick('holiday')}
          label="Holiday"
          icon={<Tent className="w-5 h-5 mb-1" />}
          activeColors="bg-sky-500 text-white shadow-sky-200 shadow-sm border-sky-500"
          inactiveColors="bg-slate-50 border-slate-100 text-slate-400 hover:bg-sky-50"
        />
      </div>
    </div>
  );
}

interface StatusButtonProps {
  status: AttendanceStatus;
  currentStatus?: AttendanceStatus;
  justTapped: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  activeColors: string;
  inactiveColors: string;
}

function StatusButton({ 
  status, 
  currentStatus, 
  justTapped, 
  onClick, 
  label, 
  icon, 
  activeColors, 
  inactiveColors 
}: StatusButtonProps) {
  const isActive = currentStatus === status;
  
  return (
    <button
      onClick={onClick}
      className={clsx(
        "relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 border",
        isActive ? activeColors : inactiveColors,
        justTapped && "scale-95"
      )}
    >
      {justTapped ? (
        <Check className="w-5 h-5 mb-1 animate-in zoom-in spin-in-12 duration-200" />
      ) : (
        icon
      )}
      <span className="text-[10px] font-bold uppercase tracking-wider leading-none">{label}</span>
    </button>
  );
}
