import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Ticket, Award, Clock, ShoppingBag, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useTableStore } from '../store/useTableStore';
import Button from '../components/ui/Button';
import { cn } from '../lib/cn';
import { pageVariants, staggerContainer, staggerItem, springs } from '../lib/motion';

/* ── TAB PILL ────────────────────────────────────────── */
function TabPill({ active, icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl text-label font-bold',
        'transition-all duration-200 touch-target',
        active
          ? 'bg-gradient-to-b from-brand-400 to-brand-600 text-white shadow-glow-sm'
          : 'bg-surface-2 border border-subtle text-ink-muted hover:text-ink-primary hover:border-default',
      )}
    >
      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

/* ── PROFILE PAGE ────────────────────────────────────── */
export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { tableNumber } = useTableStore();
  const [activeTab, setActiveTab] = useState('orders');

  const mockOrders = [
    { id: 'ord_9812', token: '8492', date: 'Today, 6:45 PM', total: 38.50, status: 'Completed', count: 3 },
    { id: 'ord_7714', token: '5120', date: 'Yesterday, 8:15 PM', total: 54.00, status: 'Completed', count: 4 },
  ];

  const mockCoupons = [
    { code: 'WELCOME10', title: '10% Discount on First Order', desc: 'Valid on orders above $20' },
    { code: 'FLAT5',     title: 'Flat $5 Discount',           desc: 'Valid on orders above $30' },
  ];

  const handleLogout = () => { logout(); navigate('/'); };
  const initial = user?.full_name?.charAt(0)?.toUpperCase() || 'G';

  return (
    <motion.div {...pageVariants} className="max-w-4xl mx-auto space-y-7 pb-12">

      {/* ── HERO CARD ──────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#1a0f00] to-slate-950 text-white p-6 sm:p-8">
        {/* bg glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.15),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-brand-400 to-brand-600 flex items-center justify-center text-2xl font-black text-white shadow-glow shrink-0">
              {initial}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-h3 font-bold text-white">{user?.full_name || 'Guest Diner'}</h1>
                <span className="px-2 py-0.5 bg-brand-500/20 border border-brand-500/40 text-brand-400 text-label font-bold rounded-full uppercase">
                  {user?.role || 'Guest'}
                </span>
              </div>
              <p className="text-caption text-white/60 font-medium">
                {user?.email || `Active Session · Table ${tableNumber}`}
              </p>
            </div>
          </div>

          <Button variant="destructive" size="sm" icon={LogOut} onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {/* ── TABS ───────────────────────────────────── */}
      <div
        className="flex items-center gap-2"
        role="tablist"
        aria-label="Profile sections"
      >
        <TabPill active={activeTab === 'orders'}  icon={ShoppingBag} label="Order History" onClick={() => setActiveTab('orders')} />
        <TabPill active={activeTab === 'coupons'} icon={Ticket}      label="My Coupons"    onClick={() => setActiveTab('coupons')} />
        <TabPill active={activeTab === 'points'}  icon={Award}       label="Loyalty Points" onClick={() => setActiveTab('points')} />
      </div>

      {/* ── TAB CONTENT ────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* Order History */}
        {activeTab === 'orders' && (
          <motion.div
            key="orders"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0 }}
            className="space-y-3"
            role="tabpanel"
          >
            {mockOrders.map((ord) => (
              <motion.div
                key={ord.id}
                variants={staggerItem}
                whileHover={{ y: -1 }}
                transition={springs.snappy}
                className="flex items-center justify-between gap-4 p-4 sm:p-5 bg-surface-1 border border-subtle rounded-2xl shadow-card hover:shadow-card-hover hover:border-default transition-all duration-200 cursor-pointer"
                onClick={() => navigate('/order-tracking')}
                role="button"
                aria-label={`Order ${ord.token}, ${ord.status}`}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/order-tracking')}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-5 h-5 text-brand-500" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-caption font-extrabold text-ink-primary">Order #{ord.token}</span>
                      <span className="badge bg-success-bg text-success-text border border-success-border">
                        {ord.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-label text-ink-muted font-medium">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      <span>{ord.date}</span>
                      <span aria-hidden="true">·</span>
                      <span>{ord.count} items</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-subtitle font-black text-brand-500">${ord.total.toFixed(2)}</span>
                  <ChevronRight className="w-4 h-4 text-ink-muted" aria-hidden="true" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Coupons */}
        {activeTab === 'coupons' && (
          <motion.div
            key="coupons"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            role="tabpanel"
          >
            {mockCoupons.map((c) => (
              <motion.div
                key={c.code}
                variants={staggerItem}
                className="relative overflow-hidden p-5 bg-surface-1 border border-subtle rounded-2xl shadow-card space-y-3 hover:border-brand-200 dark:hover:border-brand-800 transition-colors duration-200"
              >
                {/* Dashed left edge decoration */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-brand-400 to-brand-600 rounded-l-2xl" aria-hidden="true" />
                <div className="flex items-center justify-between pl-3">
                  <span className="px-3 py-1 bg-gradient-to-b from-brand-400 to-brand-600 text-white text-label font-black rounded-lg uppercase tracking-wider">
                    {c.code}
                  </span>
                  <Ticket className="w-5 h-5 text-brand-500" aria-hidden="true" />
                </div>
                <div className="pl-3">
                  <h4 className="text-caption font-bold text-ink-primary">{c.title}</h4>
                  <p className="text-label text-ink-muted mt-0.5">{c.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Loyalty Points */}
        {activeTab === 'points' && (
          <motion.div
            key="points"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={springs.smooth}
            className="p-8 bg-surface-1 border border-subtle rounded-3xl shadow-card text-center space-y-5"
            role="tabpanel"
          >
            <motion.div
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
              className="w-20 h-20 mx-auto rounded-3xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center"
            >
              <Award className="w-10 h-10 text-brand-500" aria-hidden="true" />
            </motion.div>
            <div>
              <p className="text-display font-black gradient-brand" aria-label="250 loyalty points">250 PTS</p>
              <h3 className="text-subtitle font-bold text-ink-primary mt-1">Gold Tier Member</h3>
              <p className="text-caption text-ink-muted max-w-xs mx-auto mt-2 leading-relaxed">
                Earn 10 points per $1 spent. Redeem for free appetizers and special discounts.
              </p>
            </div>
            <div className="max-w-xs mx-auto space-y-2">
              <div className="flex justify-between text-caption font-semibold text-ink-muted">
                <span>Progress to Platinum</span>
                <span className="text-brand-500 font-bold">250 / 500</span>
              </div>
              <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '50%' }}
                  transition={{ delay: 0.3, duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
                  className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
