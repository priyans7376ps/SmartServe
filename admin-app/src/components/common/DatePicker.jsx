import React from 'react';
import { Calendar } from 'lucide-react';

export const DatePicker = ({ startDate, endDate, onChange, className = '' }) => (
  <div className={`flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 ${className}`}>
    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
    <input
      type="date"
      value={startDate || ''}
      onChange={(e) => onChange && onChange({ startDate: e.target.value, endDate })}
      className="bg-transparent focus:outline-none cursor-pointer"
    />
    <span className="text-slate-400">to</span>
    <input
      type="date"
      value={endDate || ''}
      onChange={(e) => onChange && onChange({ startDate, endDate: e.target.value })}
      className="bg-transparent focus:outline-none cursor-pointer"
    />
  </div>
);

export default DatePicker;
