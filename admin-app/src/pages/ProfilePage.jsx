import React, { useState } from 'react';
import { User, Lock, Shield, LogOut, Save } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';

export const ProfilePage = () => {
  const { user, logout } = useAuthStore();
  const { addToast } = useUIStore();

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addToast('New passwords do not match.', 'error');
      return;
    }
    addToast('Password changed successfully.', 'success');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Admin Profile</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage personal admin account credentials and security preferences</p>
      </div>

      {/* Profile Info Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-500 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{user?.name || 'Administrator'}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email || 'admin@smartserve.com'}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-wider">
              Role: {user?.role || 'Super Admin'}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center gap-2 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Change Password Form */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Lock className="w-4 h-4 text-amber-500" />
          Security & Password Update
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Current Password</label>
            <input
              type="password"
              required
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">New Password</label>
            <input
              type="password"
              required
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Confirm New Password</label>
            <input
              type="password"
              required
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:bg-amber-600 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
