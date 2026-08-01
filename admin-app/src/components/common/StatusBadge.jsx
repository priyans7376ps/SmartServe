import React from 'react';

export const StatusBadge = ({ status, type = 'order' }) => {
  const normalized = (status || '').toString().toLowerCase();

  const getStyles = () => {
    switch (normalized) {
      // Order status
      case 'completed':
      case 'paid':
      case 'active':
      case 'resolved':
      case 'success':
      case 'successful':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';

      case 'pending':
      case 'new':
      case 'in_progress':
      case 'in progress':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800';

      case 'preparing':
      case 'kitchen':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800';

      case 'ready':
      case 'served':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';

      case 'cancelled':
      case 'failed':
      case 'rejected':
      case 'inactive':
      case 'deactivated':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800';

      case 'registered':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-800';

      case 'guest':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';

      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const label = status ? status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ') : 'N/A';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStyles()}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75" />
      {label}
    </span>
  );
};

export default StatusBadge;
