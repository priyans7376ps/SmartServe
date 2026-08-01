import React from 'react';

export const Loader = ({ fullPage = false, label = 'Loading data...' }) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-12 h-12">
        <div className="w-12 h-12 rounded-full border-4 border-amber-200 dark:border-amber-900/40 border-t-amber-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-amber-500 rounded-full animate-ping" />
        </div>
      </div>
      {label && <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export const SkeletonCard = () => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 animate-pulse space-y-4">
    <div className="flex justify-between items-center">
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
      <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
    </div>
    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden animate-pulse">
    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex gap-4">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
    </div>
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="p-4 flex items-center justify-between gap-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/5" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/6" />
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-20" />
        </div>
      ))}
    </div>
  </div>
);

export default Loader;
