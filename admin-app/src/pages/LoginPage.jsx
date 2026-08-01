import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';

export const LoginPage = () => {
  const [email, setEmail] = useState('admin@smartserve.com');
  const [password, setPassword] = useState('AdminPass123!');
  const { login, loading, error } = useAuthStore();
  const { addToast } = useUIStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      addToast('Welcome to SmartServe Admin Portal', 'success');
      navigate('/dashboard');
    } else {
      addToast(result.error || 'Authentication failed', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden text-slate-100">
      {/* Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-2">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">SmartServe Admin</h1>
          <p className="text-xs text-slate-400">Sign in with your Manager or Owner credentials</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@smartserve.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-slate-700 text-amber-500 focus:ring-0" />
              Remember Session
            </label>
            <span className="text-amber-500 hover:underline cursor-pointer">Role Verification Active</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-center gap-2 text-slate-500 text-xs">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <span>JWT Protected Enterprise Authentication</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
