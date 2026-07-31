import React from 'react';
import { Clock, Flame, CheckCircle, AlertCircle, ShoppingBag, XCircle } from 'lucide-react';
import { useKitchenOrderStore } from '../../store/useKitchenOrderStore';
import { cn } from '../../lib/cn';

export default function KitchenStatsCard() {
  const { orders, statusFilter, setStatusFilter } = useKitchenOrderStore();

  const totalCount = orders.length;
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const preparingCount = orders.filter((o) => o.status === 'preparing').length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

  const stats = [
    { key: 'all', label: "All Orders", count: totalCount, icon: ShoppingBag, color: 'text-slate-200', border: 'border-slate-800' },
    { key: 'pending', label: 'Pending', count: pendingCount, icon: Clock, color: 'text-amber-400', border: 'border-amber-500/40 bg-amber-500/10' },
    { key: 'preparing', label: 'Preparing', count: preparingCount, icon: Flame, color: 'text-blue-400', border: 'border-blue-500/40 bg-blue-500/10' },
    { key: 'ready', label: 'Ready', count: readyCount, icon: CheckCircle, color: 'text-emerald-400', border: 'border-emerald-500/40 bg-emerald-500/10' },
    { key: 'completed', label: 'Completed', count: completedCount, icon: CheckCircle, color: 'text-slate-400', border: 'border-slate-800' },
    { key: 'cancelled', label: 'Cancelled', count: cancelledCount, icon: XCircle, color: 'text-rose-400', border: 'border-rose-500/40 bg-rose-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((item) => {
        const Icon = item.icon;
        const isActive = statusFilter === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setStatusFilter(item.key)}
            className={cn(
              'p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer select-none active:scale-95',
              isActive
                ? 'bg-slate-800 border-amber-500 shadow-glow-amber ring-1 ring-amber-500/50'
                : 'bg-[#131b2e] hover:bg-slate-800/80 border-slate-800'
            )}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider line-clamp-1">{item.label}</span>
              <Icon className={cn('w-4 h-4 shrink-0', item.color)} />
            </div>
            <div className="flex items-baseline justify-between">
              <span className={cn('text-2xl font-black font-mono', item.color)}>{item.count}</span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
