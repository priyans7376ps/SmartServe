import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Ticket, Award, Clock, ShoppingBag, ChevronRight, Edit2, Key, Check } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useTableStore } from '../store/useTableStore';
import { useProfile } from '../hooks/useProfile';
import { useOrders } from '../hooks/useOrders';
import { useCoupons } from '../hooks/useCoupons';
import { useLoyalty } from '../hooks/useLoyalty';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
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

  const { profile, updateProfile, isUpdating, changePassword, isChangingPassword } = useProfile();
  const { historyOrders, isLoadingHistory } = useOrders();
  const { coupons, isLoading: isLoadingCoupons } = useCoupons();
  const { loyalty, isLoadingLoyalty } = useLoyalty();

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile?.full_name || user?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || user?.phone || '');
  const [updateMsg, setUpdateMsg] = useState('');

  // Change Password State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');

  const handleLogout = () => { logout(); navigate('/'); };
  const displayUser = profile || user;
  const initial = displayUser?.full_name?.charAt(0)?.toUpperCase() || 'C';

  const handleUpdateProfileSubmit = async (e) => {
    e.preventDefault();
    setUpdateMsg('');
    try {
      await updateProfile({ name, phone });
      setIsEditing(false);
      setUpdateMsg('Profile updated successfully!');
    } catch (err) {
      setUpdateMsg(err.message || 'Update failed');
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdMsg('');
    try {
      await changePassword({ current_password: currPassword, new_password: newPassword });
      setPwdMsg('Password changed successfully!');
      setCurrPassword('');
      setNewPassword('');
      setTimeout(() => setShowPasswordModal(false), 1500);
    } catch (err) {
      setPwdMsg(err.message || 'Password change failed');
    }
  };

  return (
    <motion.div {...pageVariants} className="max-w-4xl mx-auto space-y-7 pb-12">

      {/* ── HERO CARD ──────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#1a0f00] to-slate-950 text-white p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.15),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-brand-400 to-brand-600 flex items-center justify-center text-2xl font-black text-white shadow-glow shrink-0">
              {initial}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-h3 font-bold text-white">{displayUser?.full_name || 'Customer Diner'}</h1>
                <span className="px-2 py-0.5 bg-brand-500/20 border border-brand-500/40 text-brand-400 text-label font-bold rounded-full uppercase">
                  {displayUser?.role || 'Customer'}
                </span>
              </div>
              <p className="text-caption text-white/60 font-medium">
                {displayUser?.email || `Active Session · Table #${tableNumber}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="glass" size="sm" icon={Edit2} onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
            <Button variant="destructive" size="sm" icon={LogOut} onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Profile Edit Inline Form */}
        {isEditing && (
          <form onSubmit={handleUpdateProfileSubmit} className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/70 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-xs focus:outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/70 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-xs focus:outline-none focus:border-brand-400"
              />
            </div>
            <div className="sm:col-span-2 flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="text-xs text-brand-400 hover:underline font-bold flex items-center gap-1"
              >
                <Key className="w-3.5 h-3.5" /> Change Password
              </button>
              <Button type="submit" variant="primary" size="sm" isLoading={isUpdating}>
                Save Changes
              </Button>
            </div>
            {updateMsg && <p className="text-xs font-bold text-amber-400 sm:col-span-2">{updateMsg}</p>}
          </form>
        )}
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-1 border border-default p-6 rounded-3xl max-w-sm w-full space-y-4">
            <h3 className="text-subtitle font-bold text-ink-primary">Change Password</h3>
            <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
              <Input
                label="Current Password"
                type="password"
                value={currPassword}
                onChange={(e) => setCurrPassword(e.target.value)}
                required
              />
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              {pwdMsg && <p className="text-xs font-bold text-amber-500">{pwdMsg}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" isLoading={isChangingPassword}>
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            {isLoadingHistory ? (
              <p className="text-caption text-ink-muted text-center py-8">Loading order history...</p>
            ) : historyOrders.length === 0 ? (
              <div className="p-8 text-center bg-surface-1 border border-subtle rounded-2xl">
                <p className="text-caption text-ink-muted">No past order history found.</p>
              </div>
            ) : (
              historyOrders.map((ord) => (
                <motion.div
                  key={ord.id}
                  variants={staggerItem}
                  whileHover={{ y: -1 }}
                  transition={springs.snappy}
                  className="flex items-center justify-between gap-4 p-4 sm:p-5 bg-surface-1 border border-subtle rounded-2xl shadow-card hover:shadow-card-hover hover:border-default transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/order-tracking?order_id=${ord.id}`)}
                  role="button"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-5 h-5 text-brand-500" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-caption font-extrabold text-ink-primary">Order #{ord.order_number || ord.id.slice(-4)}</span>
                        <span className="badge bg-success-bg text-success-text border border-success-border capitalize">
                          {ord.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-label text-ink-muted font-medium">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        <span>{new Date(ord.placed_at || Date.now()).toLocaleDateString()}</span>
                        <span aria-hidden="true">·</span>
                        <span>{ord.items_count || 1} items</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-subtitle font-black text-brand-500">₹{Number(ord.total_amount || 0).toFixed(2)}</span>
                    <ChevronRight className="w-4 h-4 text-ink-muted" aria-hidden="true" />
                  </div>
                </motion.div>
              ))
            )}
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
            {isLoadingCoupons ? (
              <p className="text-caption text-ink-muted text-center col-span-2 py-8">Loading available coupons...</p>
            ) : coupons.length === 0 ? (
              <p className="text-caption text-ink-muted text-center col-span-2 py-8">No public coupons available at this time.</p>
            ) : (
              coupons.map((c) => (
                <motion.div
                  key={c.code}
                  variants={staggerItem}
                  className="relative overflow-hidden p-5 bg-surface-1 border border-subtle rounded-2xl shadow-card space-y-3 hover:border-brand-200 dark:hover:border-brand-800 transition-colors duration-200"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-brand-400 to-brand-600 rounded-l-2xl" aria-hidden="true" />
                  <div className="flex items-center justify-between pl-3">
                    <span className="px-3 py-1 bg-gradient-to-b from-brand-400 to-brand-600 text-white text-label font-black rounded-lg uppercase tracking-wider">
                      {c.code}
                    </span>
                    <Ticket className="w-5 h-5 text-brand-500" aria-hidden="true" />
                  </div>
                  <div className="pl-3">
                    <h4 className="text-caption font-bold text-ink-primary">{c.description || `${c.discount_value}${c.discount_type === 'percentage' ? '%' : ' Flat'} OFF`}</h4>
                    <p className="text-label text-ink-muted mt-0.5">Min order amount: ₹{c.min_order_amount || 0}</p>
                  </div>
                </motion.div>
              ))
            )}
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
              <p className="text-display font-black gradient-brand">{loyalty?.current_balance || 0} PTS</p>
              <h3 className="text-subtitle font-bold text-ink-primary mt-1 capitalize">{loyalty?.current_tier || 'Bronze'} Tier Member</h3>
              <p className="text-caption text-ink-muted max-w-xs mx-auto mt-2 leading-relaxed">
                Earn points on every order placed from your table!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
