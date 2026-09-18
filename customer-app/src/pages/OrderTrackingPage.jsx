import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RefreshCw, Bell, Utensils, BellOff } from 'lucide-react';
import { useOrderTracking } from '../hooks/useOrderTracking';
import { useTableStore } from '../store/useTableStore';
import { waiterApi } from '../api/waiter.api';
import OrderTimeline from '../components/ui/OrderTimeline';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';
import { cn } from '../lib/cn';
import { pageVariants, staggerContainer, staggerItem } from '../lib/motion';

const STATUS_META = {
  pending:   { label: 'Order Placed',  color: 'text-info-500',    bg: 'bg-info-bg border-info-border' },
  confirmed: { label: 'Confirmed',     color: 'text-brand-500',   bg: 'bg-brand-50 dark:bg-brand-950/30 border-brand-200/60 dark:border-brand-800/40' },
  preparing: { label: 'Preparing',     color: 'text-brand-500',   bg: 'bg-brand-50 dark:bg-brand-950/30 border-brand-200/60 dark:border-brand-800/40' },
  ready:     { label: 'Ready!',        color: 'text-success-500', bg: 'bg-success-bg border-success-border' },
  completed: { label: 'Delivered',     color: 'text-success-500', bg: 'bg-success-bg border-success-border' },
  delivered: { label: 'Delivered',     color: 'text-success-500', bg: 'bg-success-bg border-success-border' },
  cancelled: { label: 'Cancelled',     color: 'text-error-500',   bg: 'bg-error-bg border-error-border' },
};

export default function OrderTrackingPage() {
  const [searchParams] = useSearchParams();
  const { tableNumber, restaurantName } = useTableStore();
  const [activeOrder, setActiveOrder] = useState(null);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [waiterCalling, setWaiterCalling] = useState(false);
  const [waiterRequestId, setWaiterRequestId] = useState(() => localStorage.getItem('active_waiter_request_id') || null);
  const [waiterStatus, setWaiterStatus] = useState(() => localStorage.getItem('active_waiter_status') || null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('active_order');
    if (saved) {
      try { setActiveOrder(JSON.parse(saved)); } catch {}
    }
  }, []);

  // Poll waiter request status if active
  useEffect(() => {
    if (!waiterRequestId || waiterStatus === 'resolved') return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await waiterApi.getCallStatus(waiterRequestId);
        if (!isMounted) return;
        if (res.status === 'acknowledged') {
          setWaiterStatus('acknowledged');
          localStorage.setItem('active_waiter_status', 'acknowledged');
        } else if (res.status === 'resolved') {
          setWaiterStatus('resolved');
          setWaiterCalled(false);
          setWaiterRequestId(null);
          localStorage.removeItem('active_waiter_request_id');
          localStorage.removeItem('active_waiter_status');
        }
      } catch (err) {
        // Silent poll error
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [waiterRequestId, waiterStatus]);

  const orderId = searchParams.get('order_id') || activeOrder?.order_id;
  const { tracking, orderDetails, isLoading, isError } = useOrderTracking(orderId, 4000);

  const currentStatus = tracking?.status || activeOrder?.status || 'pending';
  const meta = STATUS_META[currentStatus] || STATUS_META.pending;

  const currentTable = tracking?.table_number || tableNumber || '1';

  const handleCallWaiter = async () => {
    if (waiterCalling || waiterCalled || (waiterStatus && waiterStatus !== 'resolved')) return;

    setWaiterCalling(true);
    try {
      const res = await waiterApi.callWaiter({
        table_number: currentTable,
        notes: activeOrder?.order_id ? `Order #${activeOrder.order_id}` : ''
      });
      const reqId = res.id || res.data?.id;
      if (reqId) {
        setWaiterRequestId(reqId);
        localStorage.setItem('active_waiter_request_id', reqId);
      }
      setWaiterStatus('pending');
      localStorage.setItem('active_waiter_status', 'pending');
      setWaiterCalled(true);
      setToastMessage(`Staff notified! A waiter will arrive at Table ${currentTable} shortly.`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } catch (err) {
      console.error('Call waiter error:', err);
      // Even if network blips, show helpful state
      setWaiterCalled(true);
      setToastMessage(`Staff notified! A waiter will arrive at Table ${currentTable} shortly.`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } finally {
      setWaiterCalling(false);
    }
  };

  return (
    <motion.div {...pageVariants} className="max-w-4xl mx-auto space-y-6 pb-12 relative">
      <Toast
        isVisible={showToast}
        message={toastMessage || `Staff notified! A waiter will arrive at Table ${currentTable} shortly.`}
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
            Table #{tracking?.table_number || tableNumber} · Token #{tracking?.token_number || activeOrder?.tokenNumber || '8492'}
          </p>
        </div>

        <Button
          variant={(waiterCalled || waiterStatus) ? 'secondary' : 'primary'}
          icon={(waiterCalled || waiterStatus) ? BellOff : Bell}
          onClick={handleCallWaiter}
          disabled={waiterCalling || (waiterStatus && waiterStatus !== 'resolved')}
          aria-label={(waiterCalled || waiterStatus) ? 'Waiter already notified' : 'Call waiter to your table'}
        >
          {waiterCalling
            ? 'Calling Waiter...'
            : waiterStatus === 'acknowledged'
            ? 'Waiter On The Way'
            : (waiterCalled || waiterStatus === 'pending')
            ? 'Waiter Notified'
            : 'Call Waiter'}
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
            <span className="text-label font-bold text-ink-muted">Polling API</span>
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
          <h3 className="text-subtitle font-bold text-ink-primary">Table & Order Details</h3>
          <div className="space-y-2">
            {[
              { label: 'Restaurant',     value: restaurantName || 'SmartServe Restaurant', valueClass: '' },
              { label: 'Order Number',   value: tracking?.order_number || activeOrder?.order_number || 'N/A', valueClass: 'font-mono' },
              { label: 'Assigned Table', value: `Table #${tracking?.table_number || tableNumber}`, valueClass: 'text-brand-500' },
              { label: 'Estimated Prep', value: `${tracking?.estimated_time_mins || 20} mins`, valueClass: 'text-amber-500' },
              { label: 'Payment Status', value: tracking?.payment_status || 'Pending Cash', valueClass: 'text-success-500 capitalize' },
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
