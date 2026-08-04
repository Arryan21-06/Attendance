import { useState } from 'react';
import { useSettings, updateSettings } from '../hooks/useStore';
import { getDB } from '../db/db';
import { Save, Download, Upload, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function SettingsTab() {
  const settings = useSettings();
  
  const [startDate, setStartDate] = useState(settings?.sessionStartDate || format(new Date(), 'yyyy-MM-dd'));
  const [threshold, setThreshold] = useState(settings?.attendanceThreshold.toString() || '75');
  const [saveStatus, setSaveStatus] = useState('');

  if (!settings) {
    return <div className="p-4 text-center">Loading settings...</div>;
  }

  const handleSave = async () => {
    const t = parseInt(threshold, 10);
    if (isNaN(t) || t < 0 || t > 100) {
      setSaveStatus('Invalid threshold');
      return;
    }
    await updateSettings({
      id: 'main',
      sessionStartDate: startDate,
      attendanceThreshold: t
    });
    setSaveStatus('Saved!');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const handleExport = async () => {
    try {
      const db = await getDB();
      const data = {
        subjects: await db.getAll('subjects'),
        timetableSlots: await db.getAll('timetableSlots'),
        attendanceLogs: await db.getAll('attendanceLogs'),
        settings: await db.get('settings', 'main')
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendtrack-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Export failed');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('This will replace all current data. Continue?')) {
      e.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.settings || !data.subjects || !data.timetableSlots) {
        throw new Error('Invalid backup file');
      }

      const db = await getDB();
      const tx = db.transaction(['subjects', 'timetableSlots', 'attendanceLogs', 'settings'], 'readwrite');
      
      await tx.objectStore('subjects').clear();
      await tx.objectStore('timetableSlots').clear();
      await tx.objectStore('attendanceLogs').clear();
      await tx.objectStore('settings').clear();

      for (const s of data.subjects) await tx.objectStore('subjects').put(s);
      for (const s of data.timetableSlots) await tx.objectStore('timetableSlots').put(s);
      for (const l of data.attendanceLogs || []) await tx.objectStore('attendanceLogs').put(l);
      await tx.objectStore('settings').put(data.settings);

      await tx.done;
      alert('Import successful! App will reload.');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to import data. Check file format.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="py-4 space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 ml-2">Settings</h2>

      <div className="bg-white/60 backdrop-blur rounded-3xl p-5 shadow-sm border border-white/50 space-y-5">
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Session Start Date</label>
          <p className="text-xs text-slate-500 mb-2">Attendance math only counts classes on or after this date.</p>
          <input 
            type="date" 
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-slate-300 focus:border-slate-300 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Target Attendance (%)</label>
          <p className="text-xs text-slate-500 mb-2">Used for bunk margin and recovery calculations.</p>
          <input 
            type="number" 
            min="0" max="100"
            value={threshold}
            onChange={e => setThreshold(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-slate-300 focus:border-slate-300 outline-none"
          />
        </div>

        <button 
          onClick={handleSave}
          className="w-full bg-slate-800 text-white font-semibold py-3.5 rounded-xl shadow-sm hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          Save Settings
        </button>
        {saveStatus && <p className="text-center text-sm font-medium text-emerald-600">{saveStatus}</p>}
      </div>

      <div className="bg-white/60 backdrop-blur rounded-3xl p-5 shadow-sm border border-white/50 space-y-4">
        <h3 className="font-bold text-slate-800">Data Management</h3>
        
        <button 
          onClick={handleExport}
          className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export Data (Backup)
        </button>

        <label className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer">
          <Upload className="w-4 h-4" />
          <span>Import Data</span>
          <input 
            type="file" 
            accept=".json" 
            className="hidden" 
            onChange={handleImport}
          />
        </label>
      </div>
      
      <div className="bg-white/60 backdrop-blur rounded-3xl p-5 shadow-sm border border-white/50">
         <h3 className="font-bold text-slate-800 mb-2">Timetable Editor</h3>
         <p className="text-sm text-slate-600 mb-4">To edit the timetable, export your data, edit the JSON file, and import it back. A full UI editor is coming soon.</p>
         <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
           <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
           <p className="text-xs text-amber-800 font-medium leading-relaxed">
             Make sure to keep the IDs matching if you want to preserve your attendance history for existing subjects.
           </p>
         </div>
      </div>

    </div>
  );
}
