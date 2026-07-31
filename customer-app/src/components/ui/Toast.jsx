import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export default function Toast({ isVisible, message, type = 'success', onClose }) {
  if (!isVisible) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-100',
    error: 'border-red-500/30 bg-red-50/90 dark:bg-red-950/90 text-red-900 dark:text-red-100',
    warning: 'border-amber-500/30 bg-amber-50/90 dark:bg-amber-950/90 text-amber-900 dark:text-amber-100',
    info: 'border-blue-500/30 bg-blue-50/90 dark:bg-blue-950/90 text-blue-900 dark:text-blue-100',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className={`fixed top-20 right-4 z-50 p-4 rounded-2xl border shadow-xl backdrop-blur-md flex items-center gap-3 max-w-sm w-full ${borders[type]}`}
      >
        {icons[type]}
        <p className="text-xs sm:text-sm font-bold flex-1">{message}</p>
        <button
          onClick={onClose}
          className="p-1 hover:bg-black/10 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 opacity-70" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
