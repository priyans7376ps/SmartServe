import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, ArrowRight, Home, Utensils } from 'lucide-react';
import { useTableStore } from '../store/useTableStore';
import Button from '../components/ui/Button';
import { springs } from '../lib/motion';

export default function OrderSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tableNumber, restaurantName } = useTableStore();
  const [activeOrder, setActiveOrder] = useState(null);
  const tokenNumber = searchParams.get('token') || '8492';

  useEffect(() => {
    const saved = localStorage.getItem('active_order');
    if (saved) { try { setActiveOrder(JSON.parse(saved)); } catch {} }
  }, []);

  return (
    <div className="max-w-2xl mx-auto text-center space-y-8 py-10 sm:py-16">
      {/* Celebration Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={springs.bouncy}
        className="inline-block"
      >
        <div className="relative">
          {/* Outer pulse ring */}
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute inset-0 rounded-3xl bg-success-500/20"
            aria-hidden="true"
          />
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-b from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-xl mx-auto">
            <CheckCircle2 className="w-14 h-14 sm:w-20 sm:h-20 stroke-[1.5]" aria-hidden="true" />
          </div>
        </div>
      </motion.div>

      {/* Message */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        className="space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-success-bg border border-success-border rounded-full text-success-text text-label font-bold uppercase tracking-wider">
          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
          Order Successfully Received
        </div>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-ink-primary leading-tight">
          Thank You <br className="sm:hidden" />
          for Ordering!
        </h1>
        <p className="text-body text-ink-muted max-w-sm mx-auto leading-relaxed">
          Your order has been sent to the kitchen at {restaurantName || 'SmartServe Restaurant'}.
        </p>
      </motion.div>

      {/* Token Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        className="bg-surface-1 border border-default rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="grid grid-cols-2 divide-x divide-subtle">
          <div className="p-6 sm:p-8 flex flex-col items-center gap-1">
            <span className="text-label font-bold uppercase tracking-widest text-ink-muted">Token No.</span>
            <span className="text-4xl sm:text-5xl font-black gradient-brand" aria-label={`Token number ${tokenNumber}`}>
              #{tokenNumber}
            </span>
          </div>
          <div className="p-6 sm:p-8 flex flex-col items-center gap-1">
            <span className="text-label font-bold uppercase tracking-widest text-ink-muted">Your Table</span>
            <span className="text-4xl sm:text-5xl font-black text-ink-primary" aria-label={`Table ${tableNumber}`}>
              {tableNumber}
            </span>
          </div>
        </div>

        {/* Estimated time footer */}
        <div className="flex items-center justify-center gap-2.5 p-4 bg-brand-50 dark:bg-brand-950/30 border-t border-brand-200/60 dark:border-brand-800/40 text-brand-700 dark:text-brand-400 text-caption font-bold">
          <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Estimated preparation: 15 – 20 minutes</span>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        className="flex flex-col sm:flex-row items-center justify-center gap-3"
      >
        <Button variant="primary" size="lg" iconRight={ArrowRight} onClick={() => navigate('/order-tracking')}>
          Track Live Preparation
        </Button>
        <Button variant="secondary" size="lg" icon={Home} onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </motion.div>
    </div>
  );
}
