import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RefreshCw, Bell, Utensils, BellOff } from 'lucide-react';
import { useTableStore } from '../store/useTableStore';
import OrderTimeline from '../components/ui/OrderTimeline';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';
import { cn } from '../lib/cn';
import { pageVariants, staggerContainer, staggerItem } from '../lib/motion';

const STATUS_LIST = ['pending', 'preparing', 'ready', 'completed'];

const STATUS_META = {
  pending:   { label: 'Order Placed',  color: 'text-info-500',    bg: 'bg-info-bg border-info-border' },
  preparing: { label: 'Preparing',     color: 'text-brand-500',   bg: 'bg-brand-50 dark:bg-brand-950/30 border-brand-200/60 dark:border-brand-800/40' },
  ready:     { label: 'Ready!',        color: 'text-success-500', bg: 'bg-success-bg border-success-border' },
  completed: { label: 'Delivered',     color: 'text-success-500', bg: 'bg-success-bg border-success-border' },
};

export default function OrderTrackingPage() {
  const { tableNumber, restaurantName } = useTableStore();
  const [activeOrder, setActiveOrder] = useState(null);
  const [statusIndex, setStatusIndex] = useState(1);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const currentStatus = STATUS_LIST[statusIndex];
  const meta = STATUS_META[currentStatus];

  useEffect(() => {
    const saved = localStorage.getItem('active_order');
    if (saved) {
      try { setActiveOrder(JSON.parse(saved)); } catch {}
    }
  }, []);

  /* Auto-advance status for demo */
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev < STATUS_LIST.length - 1 ? prev + 1 : prev));
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleCallWaiter = () => {
    if (waiterCalled) return;
    setWaiterCalled(true);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  return (
    <motion.div {...pageVariants} className="max-w-4xl mx-auto space-y-6 pb-12 relative">
      <Toast
        isVisible={showToast}
        message={`Staff notified! A waiter will arrive at Table ${tableNumber} shortly.`}
        type="success"
        onClose={() => setShowToast(false)}
      />

      {/* ── HEADER ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-subtle">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" aria-hidden="true" />
            <span className="text-label font-black uppercase text-brand-500 tracking-widest">Live Tracking</span>
          </div>
          <h1 className="text-h2 font-display font-extrabold text-ink-primary">Order Status</h1>
          <p className="text-caption text-ink-muted mt-0.5">
            Table {tableNumber} · Token #{activeOrder?.tokenNumber || '8492'}
          </p>
        </div>

        <Button
          variant={waiterCalled ? 'secondary' : 'primary'}
          icon={waiterCalled ? BellOff : Bell}
          onClick={handleCallWaiter}
          disabled={waiterCalled}
          aria-label={waiterCalled ? 'Waiter already notified' : 'Call waiter to your table'}
        >
          {waiterCalled ? 'Waiter Notified' : 'Call Waiter'}
        </Button>
      </div>

      {/* ── STATUS CARD ────────────────────────── */}
      <div className="bg-surface-1 border border-default rounded-3xl shadow-xl overflow-hidden">
        {/* Status badge header */}
        <div className={cn('px-6 py-4 border-b border-subtle flex items-center justify-between gap-4', meta.bg)}>
          <div>
            <p className="text-label text-ink-muted uppercase tracking-wider font-bold mb-0.5">Current Status</p>
            <p className={cn('text-h3 font-extrabold font-display', meta.color)}>{meta.label}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-1/70 rounded-xl border border-subtle">
            <RefreshCw className="w-3.5 h-3.5 text-brand-500 animate-spin" aria-hidden="true" />
            <span className="text-label font-bold text-ink-muted">Polling</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-6 sm:p-8">
          <OrderTimeline status={currentStatus} />
        </div>
      </div>

      {/* ── DETAILS GRID ───────────────────────── */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Table Info */}
        <motion.div variants={staggerItem} className="bg-surface-1 border border-subtle rounded-2xl shadow-card p-5 space-y-3">
          <h3 className="text-subtitle font-bold text-ink-primary">Table Details</h3>
          <div className="space-y-2">
            {[
              { label: 'Restaurant',     value: restaurantName || 'SmartServe Restaurant', valueClass: '' },
              { label: 'Assigned Table', value: `Table ${tableNumber}`, valueClass: 'text-brand-500' },
              { label: 'Payment',        value: 'Pay at Table', valueClass: 'text-success-500' },
            ].map(({ label, value, valueClass }) => (
              <div key={label} className="flex items-center justify-between text-caption">
                <span className="font-semibold text-ink-muted">{label}</span>
                <span className={cn('font-bold text-ink-primary', valueClass)}>{value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Help */}
        <motion.div variants={staggerItem} className="bg-surface-1 border border-subtle rounded-2xl shadow-card p-5 space-y-3">
          <h3 className="text-subtitle font-bold text-ink-primary">Need Assistance?</h3>
          <p className="text-caption text-ink-muted leading-relaxed">
            Need cutlery, napkins, or want to modify your order? Use the Call Waiter button to notify your server.
          </p>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 text-caption font-bold text-brand-500 hover:text-brand-600 transition-colors"
            aria-label="Order additional items from menu"
          >
            <Utensils className="w-3.5 h-3.5" aria-hidden="true" />
            Order Additional Items
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
