import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Flame, CheckCircle, AlertTriangle, Eye, ChefHat, XCircle, FileText } from 'lucide-react';
import Badge from './Badge';
import Button from './Button';
import { useKitchenOrderStore } from '../../store/useKitchenOrderStore';
import { cn } from '../../lib/cn';

export default function OrderCard({ order, onViewDetails }) {
  const { updateOrderStatus } = useKitchenOrderStore();
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    const calculateElapsed = () => {
      if (!order.placed_at) return;
      const placed = new Date(order.placed_at).getTime();
      const now = new Date().getTime();
      const diffMins = Math.floor((now - placed) / (1000 * 60));
      setElapsedMinutes(diffMins >= 0 ? diffMins : 0);
    };

    calculateElapsed();
    const timer = setInterval(calculateElapsed, 30000); // update every 30s
    return () => clearInterval(timer);
  }, [order.placed_at]);

  const status = order.status || 'pending';
  const isUrgent = elapsedMinutes > (order.estimated_prep_time || 15);

  const handleStatusChange = (newStatus, e) => {
    e.stopPropagation();
    updateOrderStatus(order.id, newStatus);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      onClick={() => onViewDetails(order)}
      className={cn(
        'bg-[#131b2e] border rounded-3xl p-5 shadow-xl transition-all duration-200 flex flex-col justify-between cursor-pointer select-none relative overflow-hidden',
        status === 'preparing' ? 'border-blue-500/50 shadow-glow-blue' :
        status === 'ready' ? 'border-emerald-500/50 shadow-glow-emerald' :
        status === 'pending' ? 'border-amber-500/50 shadow-glow-amber' :
        status === 'cancelled' ? 'border-rose-500/40 opacity-75' :
        'border-slate-800'
      )}
    >
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black font-mono text-amber-400">
                #{order.token_number || order.order_number || '101'}
              </span>
              <Badge type="customer" value={order.customer_type || 'Guest'} />
            </div>
            <p className="text-xs font-extrabold text-slate-300">
              Table #{order.table_number || 'N/A'} &bull; <span className="text-slate-400 font-medium">{order.customer_name || 'Diner'}</span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Badge type="status" value={status} />
            {order.is_priority && <Badge type="priority" />}
          </div>
        </div>

        {/* Elapsed Timer & Prep Time */}
        <div className="py-2.5 flex items-center justify-between text-xs font-semibold border-b border-slate-800/40">
          <div className={cn('flex items-center gap-1.5 font-mono font-bold', isUrgent ? 'text-rose-400 animate-pulse' : 'text-slate-400')}>
            <Clock className="w-3.5 h-3.5" />
            <span>{elapsedMinutes}m elapsed</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Est. Prep: <span className="text-slate-200 font-bold">{order.estimated_prep_time || 15}m</span>
          </div>
        </div>

        {/* Items List (Max 3 shown in card body) */}
        <div className="py-3 space-y-2.5">
          {(order.items || []).slice(0, 3).map((item, idx) => (
            <div key={item.id || idx} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 font-black text-[11px] flex items-center justify-center shrink-0">
                  {item.quantity}x
                </span>
                <span className="font-bold text-slate-200 truncate">{item.name}</span>
                <Badge type="diet" value={item.is_veg !== undefined ? item.is_veg : true} />
              </div>
              <span className="font-mono text-slate-400 font-bold shrink-0">
                ${(Number(item.price || 0) * (item.quantity || 1)).toFixed(2)}
              </span>
            </div>
          ))}

          {(order.items || []).length > 3 && (
            <p className="text-[11px] font-bold text-amber-400 pt-0.5">
              +{(order.items || []).length - 3} more item(s)...
            </p>
          )}
        </div>

        {/* Special Instructions Note */}
        {order.special_instructions && (
          <div className="mb-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 text-xs text-amber-300">
            <FileText className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="line-clamp-2 font-medium leading-tight">{order.special_instructions}</p>
          </div>
        )}
      </div>

      {/* Action Footer Buttons */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
        {status === 'pending' && (
          <>
            <Button
              variant="preparing"
              size="sm"
              className="flex-1"
              icon={ChefHat}
              onClick={(e) => handleStatusChange('preparing', e)}
            >
              Start Preparing
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-400 hover:text-rose-300"
              icon={XCircle}
              onClick={(e) => handleStatusChange('cancelled', e)}
            >
              Cancel
            </Button>
          </>
        )}

        {status === 'preparing' && (
          <Button
            variant="success"
            size="sm"
            className="w-full"
            icon={CheckCircle}
            onClick={(e) => handleStatusChange('ready', e)}
          >
            Mark Order Ready
          </Button>
        )}

        {status === 'ready' && (
          <Button
            variant="secondary"
            size="sm"
            className="w-full text-emerald-400 border-emerald-500/30"
            icon={CheckCircle}
            onClick={(e) => handleStatusChange('completed', e)}
          >
            Mark Completed
          </Button>
        )}

        {status === 'completed' && (
          <div className="w-full py-1.5 text-center text-xs font-bold text-slate-500">
            Order Delivered & Completed
          </div>
        )}

        {status === 'cancelled' && (
          <div className="w-full py-1.5 text-center text-xs font-bold text-rose-400">
            Order Cancelled
          </div>
        )}
      </div>
    </motion.div>
  );
}
