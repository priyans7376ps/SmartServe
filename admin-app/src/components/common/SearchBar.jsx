import React from 'react';
import { Search, X } from 'lucide-react';

export const SearchBar = ({ value, onChange, placeholder = 'Search...', className = '' }) => (
  <div className={`relative flex items-center ${className}`}>
    <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-10 pr-9 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
    />
    {value && (
      <button
        onClick={() => onChange('')}
        className="absolute right-3 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

export default SearchBar;
