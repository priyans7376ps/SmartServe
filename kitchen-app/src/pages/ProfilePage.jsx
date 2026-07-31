import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Shield, Volume2, LogOut, Key, CheckCircle, ChefHat } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useKitchenOrderStore } from '../store/useKitchenOrderStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { soundEnabled, toggleSound } = useKitchenOrderStore();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage('Kitchen password updated successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 800);
  };

  const handleTestSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {}
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <ChefHat className="w-7 h-7 text-amber-400" />
          <span>Kitchen Staff Profile & Settings</span>
        </h1>
        <p className="text-xs text-slate-400 font-medium">
          Manage shift credentials, audio alerts, and security settings
        </p>
      </div>

      {/* User Info Banner */}
      <div className="p-6 bg-gradient-to-r from-[#131b2e] via-amber-950/30 to-[#131b2e] border border-slate-800 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl font-black shadow-glow-amber shrink-0">
            {user?.full_name?.charAt(0) || 'K'}
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-lg font-black text-white">{user?.full_name || 'Kitchen Staff'}</h2>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full font-bold text-[10px] uppercase">
                {user?.role || 'KITCHEN'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">{user?.email || 'kitchen@smartserve.com'}</p>
          </div>
        </div>

        <Button variant="danger" size="sm" icon={LogOut} onClick={handleLogout}>
          End Shift & Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Change Password Card */}
        <div className="p-6 bg-[#131b2e] border border-slate-800 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Key className="w-5 h-5 text-amber-400" />
            <span>Change Security Password</span>
          </div>

          {successMessage && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-400">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3">
            <Input
              label="Current Password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              placeholder="••••••••"
            />

            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="••••••••"
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
            />

            <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isLoading}>
              Update Password
            </Button>
          </form>
        </div>

        {/* Audio Alerts & Hardware Setup */}
        <div className="p-6 bg-[#131b2e] border border-slate-800 rounded-3xl shadow-xl space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Volume2 className="w-5 h-5 text-amber-400" />
              <span>Kitchen Audio Alert System</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Kitchen Display System (KDS) plays synthesized sound chimes for incoming orders, urgent items, and cancellations.
            </p>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Audio Alerts</span>
                <span className="text-[11px] text-slate-400">{soundEnabled ? 'Enabled' : 'Muted'}</span>
              </div>
              <Button variant={soundEnabled ? 'primary' : 'secondary'} size="sm" onClick={toggleSound}>
                {soundEnabled ? 'Sound ON' : 'Muted'}
              </Button>
            </div>

            <Button variant="outline" size="sm" className="w-full" icon={Volume2} onClick={handleTestSound}>
              Test Alert Chime Sound
            </Button>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-amber-400 block">KDS Station Status</span>
            <div className="text-xs text-slate-300 font-mono space-y-1">
              <div>Station: <span className="text-slate-100">Main Kitchen Prep Line #1</span></div>
              <div>Display Resolution: <span className="text-slate-100">{window.innerWidth} x {window.innerHeight}</span></div>
              <div>WebSocket Pipeline: <span className="text-emerald-400">Active Polling (10s)</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
