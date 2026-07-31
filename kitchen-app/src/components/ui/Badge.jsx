import React from 'react';
import { Flame, Sparkles, Star, Clock, AlertTriangle, Leaf, Drumstick, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

export default function Badge({ type = 'status', value, text, className = '' }) {
  // Order status badge
  if (type === 'status') {
    const statusMap = {
      pending: { label: 'PENDING', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: Clock },
      accepted: { label: 'ACCEPTED', bg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30', icon: Clock },
      preparing: { label: 'PREPARING', bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30 animate-pulse-fast', icon: Flame },
      ready: { label: 'READY', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
      completed: { label: 'COMPLETED', bg: 'bg-slate-800 text-slate-400 border-slate-700', icon: CheckCircle },
      cancelled: { label: 'CANCELLED', bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30', icon: XCircle },
    };

    const config = statusMap[value] || statusMap.pending;
    const Icon = config.icon;

    return (
      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider border', config.bg, className)}>
        <Icon className="w-3 h-3" />
        <span>{text || config.label}</span>
      </span>
    );
  }

  // Veg / Non-Veg badge
  if (type === 'diet') {
    const isVeg = value === true || value === 'veg';
    return (
      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border', isVeg ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800' : 'bg-rose-950/60 text-rose-400 border-rose-800', className)}>
        {isVeg ? <Leaf className="w-2.5 h-2.5 text-emerald-400" /> : <Drumstick className="w-2.5 h-2.5 text-rose-400" />}
        <span>{isVeg ? 'VEG' : 'NON-VEG'}</span>
      </span>
    );
  }

  // Priority badge
  if (type === 'priority') {
    return (
      <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-glow-rose uppercase tracking-wider animate-bounce-slow', className)}>
        <AlertTriangle className="w-3 h-3" />
        <span>HIGH PRIORITY</span>
      </span>
    );
  }

  // Customer Type badge
  if (type === 'customer') {
    const isGuest = value === 'Guest' || value === 'guest';
    return (
      <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold', isGuest ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-purple-950/60 text-purple-300 border border-purple-800', className)}>
        {isGuest ? 'GUEST' : 'MEMBER'}
      </span>
    );
  }

  // General tag badge (Special, Popular, Recommended, Enabled/Disabled)
  if (type === 'tag') {
    const tagMap = {
      special: { label: "Today's Special", bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: Flame },
      popular: { label: 'Popular', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40', icon: Sparkles },
      recommended: { label: 'Chef Pick', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40', icon: Star },
      enabled: { label: 'Active', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: CheckCircle },
      disabled: { label: 'Disabled', bg: 'bg-slate-800 text-slate-400 border-slate-700', icon: XCircle },
    };

    const config = tagMap[value] || tagMap.enabled;
    const Icon = config.icon;

    return (
      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border', config.bg, className)}>
        <Icon className="w-3 h-3" />
        <span>{text || config.label}</span>
      </span>
    );
  }

  return (
    <span className={cn('px-2 py-0.5 bg-slate-800 text-slate-300 text-xs font-bold rounded', className)}>
      {text || value}
    </span>
  );
}
