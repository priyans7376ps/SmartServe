import React from 'react';
import { cn } from '../../lib/cn';

export default function Input({
  label,
  error,
  icon: Icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  className = '',
  id,
  required,
  ...props
}) {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-slate-400 uppercase tracking-wider"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <Icon className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
        )}

        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={cn(
            'w-full py-2.5 bg-slate-900 border border-slate-800 text-sm font-medium text-slate-100 rounded-xl outline-none transition-all focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 placeholder:text-slate-600',
            Icon ? 'pl-10' : 'pl-3.5',
            'pr-3.5',
            error && 'border-rose-500/80 ring-1 ring-rose-500/20',
            className
          )}
          {...props}
        />
      </div>

      {error && <p className="text-xs font-semibold text-rose-400 pl-1">{error}</p>}
    </div>
  );
}
