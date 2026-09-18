import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, X, Clock, AlertCircle } from 'lucide-react';
import { useWaiterStore } from '../../store/useWaiterStore';

export default function WaiterRequestsModal() {
  const { requests, isModalOpen, setIsModalOpen, acknowledgeRequest, resolveRequest, fetchRequests, isLoading } = useWaiterStore();

  if (!isModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white">Waiter Call Requests</h2>
                <p className="text-xs text-slate-400 font-medium">
                  {requests.length} active customer request{requests.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="p-6 overflow-y-auto flex-1 space-y-3">
            {requests.length === 0 ? (
              <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-2">
                <CheckCheck className="w-10 h-10 text-slate-600" />
                <p className="text-sm font-bold">No pending waiter calls</p>
                <p className="text-xs text-slate-500">All customer requests have been resolved.</p>
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 font-mono font-black text-sm">
                      #{req.table_number}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm">Table #{req.table_number}</span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            req.status === 'pending' || req.status === 'open'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      {req.notes && (
                        <p className="text-xs text-slate-300 mt-0.5">{req.notes}</p>
                      )}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {req.created_at
                            ? new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Recently'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {(req.status === 'pending' || req.status === 'open') && (
                      <button
                        onClick={() => acknowledgeRequest(req.id)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-sm"
                        title="Acknowledge call (informs diner you are on the way)"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Ack
                      </button>
                    )}
                    <button
                      onClick={() => resolveRequest(req.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-sm"
                      title="Mark resolved"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Resolve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Updates dynamically via real-time WebSocket & backup polling</span>
            <button
              onClick={() => fetchRequests()}
              disabled={isLoading}
              className="text-amber-400 hover:underline font-bold"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
