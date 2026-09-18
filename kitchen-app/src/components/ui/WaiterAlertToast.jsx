import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { useWaiterStore } from '../../store/useWaiterStore';

export default function WaiterAlertToast() {
  const { activeAlert, dismissAlert, acknowledgeRequest, resolveRequest } = useWaiterStore();

  if (!activeAlert) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.95 }}
        className="fixed top-20 right-4 sm:right-8 z-50 max-w-md w-full bg-gradient-to-r from-amber-950/90 to-slate-900/95 border-2 border-amber-500 shadow-2xl shadow-amber-500/20 rounded-2xl p-4 backdrop-blur-xl text-white"
        role="alert"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0 animate-bounce">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Waiter Assistance
                </span>
                <span className="text-[11px] text-slate-400">Just now</span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">
                Table #{activeAlert.table_number}
              </h3>
              {activeAlert.notes && (
                <p className="text-xs text-slate-300 mt-0.5">{activeAlert.notes}</p>
              )}
            </div>
          </div>

          <button
            onClick={dismissAlert}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="Dismiss notification"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
          <button
            onClick={() => acknowledgeRequest(activeAlert.id)}
            className="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md"
          >
            <Check className="w-4 h-4" />
            Acknowledge
          </button>
          <button
            onClick={() => resolveRequest(activeAlert.id)}
            className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md"
          >
            <CheckCheck className="w-4 h-4" />
            Resolve
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
