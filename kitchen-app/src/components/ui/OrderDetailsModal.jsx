import React from 'react';
import Modal from './Modal';
import Badge from './Badge';
import Button from './Button';
import { useKitchenOrderStore } from '../../store/useKitchenOrderStore';
import { ChefHat, CheckCircle, Clock, XCircle, FileText, Printer } from 'lucide-react';

export default function OrderDetailsModal({ isOpen, onClose, order }) {
  const { updateOrderStatus } = useKitchenOrderStore();

  if (!order) return null;

  const status = order.status || 'pending';

  const handleStatusUpdate = (newStatus) => {
    updateOrderStatus(order.id, newStatus);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order Details #${order.token_number || order.order_number}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Header Metadata */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black font-mono text-amber-400">
                #{order.token_number || '101'}
              </span>
              <Badge type="status" value={status} />
              <Badge type="customer" value={order.customer_type} />
            </div>
            <p className="text-xs font-bold text-slate-300">
              Table #{order.table_number || 'N/A'} &bull; Customer: {order.customer_name || 'Guest'}
            </p>
          </div>

          <div className="text-right text-xs font-semibold text-slate-400 space-y-1">
            <div>Placed: <span className="text-slate-200 font-mono">{order.placed_at ? new Date(order.placed_at).toLocaleTimeString() : 'Just now'}</span></div>
            <div>Est. Prep: <span className="text-amber-400 font-bold">{order.estimated_prep_time || 15} mins</span></div>
          </div>
        </div>

        {/* Special Instructions */}
        {order.special_instructions && (
          <div className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-2xl space-y-1 text-amber-300">
            <div className="flex items-center gap-2 font-bold text-xs">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Special Kitchen Instructions</span>
            </div>
            <p className="text-xs font-medium pl-6 leading-relaxed">{order.special_instructions}</p>
          </div>
        )}

        {/* Items List Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ordered Items ({order.items?.length || 0})</h3>

          <div className="space-y-2.5">
            {(order.items || []).map((item, i) => (
              <div
                key={item.id || i}
                className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'}
                    alt={item.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100 truncate">{item.name}</span>
                      <Badge type="diet" value={item.is_veg} />
                    </div>
                    {item.instructions && (
                      <p className="text-xs text-amber-400 font-medium italic truncate">
                        Note: {item.instructions}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 font-mono font-black text-sm rounded-lg">
                    {item.quantity}x
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-200">
                    ${(Number(item.price || 0) * (item.quantity || 1)).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Summary */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs font-bold">
          <span className="text-slate-400 uppercase tracking-wider">Total Order Amount</span>
          <span className="text-xl font-black text-amber-400 font-mono">
            ${(order.items || []).reduce((acc, i) => acc + Number(i.price || 0) * (i.quantity || 1), 0).toFixed(2)}
          </span>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
          <Button variant="outline" size="sm" icon={Printer} onClick={() => window.print()}>
            Print Ticket
          </Button>

          <div className="flex items-center gap-2">
            {status === 'pending' && (
              <Button variant="preparing" size="md" icon={ChefHat} onClick={() => handleStatusUpdate('preparing')}>
                Accept & Start Preparing
              </Button>
            )}
            {status === 'preparing' && (
              <Button variant="success" size="md" icon={CheckCircle} onClick={() => handleStatusUpdate('ready')}>
                Mark Order Ready
              </Button>
            )}
            {status === 'ready' && (
              <Button variant="secondary" size="md" icon={CheckCircle} onClick={() => handleStatusUpdate('completed')}>
                Mark Order Completed
              </Button>
            )}
            {status !== 'cancelled' && status !== 'completed' && (
              <Button variant="danger" size="md" icon={XCircle} onClick={() => handleStatusUpdate('cancelled')}>
                Cancel Order
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
