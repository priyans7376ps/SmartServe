import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({ children, className = '', title, subtitle, action }) => (
  <div className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between mb-5">
        <div>
          {title && <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    {children}
  </div>
);

export const StatCard = ({
  title,
  value,
  change,
  changeType = 'positive', // 'positive' | 'negative' | 'neutral'
  icon: Icon,
  iconBg = 'bg-amber-500/10 text-amber-500',
  description,
  onClick,
}) => (
  <motion.div
    whileHover={{ y: -3 }}
    transition={{ duration: 0.2 }}
    onClick={onClick}
    className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden ${
      onClick ? 'cursor-pointer hover:border-amber-500/40' : ''
    }`}
  >
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
        <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</h4>
      </div>
      {Icon && (
        <div className={`p-3 rounded-xl ${iconBg} shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>

    {(change || description) && (
      <div className="mt-4 flex items-center gap-2 text-xs font-medium">
        {change && (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              changeType === 'positive'
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                : changeType === 'negative'
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {change}
          </span>
        )}
        {description && <span className="text-slate-500 dark:text-slate-400 truncate">{description}</span>}
      </div>
    )}
  </motion.div>
);

export default StatCard;
