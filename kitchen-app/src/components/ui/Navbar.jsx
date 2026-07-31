import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, Volume2, VolumeX, Plus, User, LogOut, Clock, Activity } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useKitchenOrderStore } from '../../store/useKitchenOrderStore';
import { cn } from '../../lib/cn';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { kitchenStatus, setKitchenStatus, soundEnabled, toggleSound, addDemoOrder, orders } = useKitchenOrderStore();
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAddDemoOrder = () => {
    const sampleIds = ['104', '105', '106', '107'];
    const nextNum = sampleIds[orders.length % sampleIds.length] || `${orders.length + 100}`;
    const tables = [3, 7, 14, 2, 9];
    const tableNum = tables[orders.length % tables.length];

    const newOrder = {
      id: `ord_${Date.now()}`,
      token_number: nextNum,
      table_number: tableNum,
      customer_type: Math.random() > 0.5 ? 'Registered' : 'Guest',
      customer_name: `Table #${tableNum} Diner`,
      placed_at: new Date().toISOString(),
      status: 'pending',
      estimated_prep_time: 15,
      is_priority: Math.random() > 0.6,
      special_instructions: 'No ice in drinks, serve fast.',
      items: [
        {
          id: `item_${Date.now()}_1`,
          name: 'Crispy Garlic Wings',
          quantity: 2,
          price: 14.00,
          is_veg: false,
          image_url: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=400&q=80',
          instructions: 'Extra dip sauce on side',
        },
        {
          id: `item_${Date.now()}_2`,
          name: 'Fresh Mango Mocktail',
          quantity: 2,
          price: 6.50,
          is_veg: true,
          image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
          instructions: 'Less sugar',
        },
      ],
    };
    addDemoOrder(newOrder);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#131b2e]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
      {/* Brand & Kitchen Status */}
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-glow-amber group-hover:scale-105 transition-transform">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white tracking-tight">SmartServe</span>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-black uppercase rounded-full">
                KITCHEN KDS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Live Preparation Display</p>
          </div>
        </Link>

        {/* Status Selector */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold">
          <span className={cn('w-2.5 h-2.5 rounded-full animate-pulse', kitchenStatus === 'online' ? 'bg-emerald-400' : kitchenStatus === 'busy' ? 'bg-amber-400' : 'bg-rose-400')} />
          <select
            value={kitchenStatus}
            onChange={(e) => setKitchenStatus(e.target.value)}
            className="bg-transparent text-slate-200 outline-none cursor-pointer font-bold capitalize"
          >
            <option value="online" className="bg-slate-900 text-emerald-400">Kitchen Status: Online</option>
            <option value="busy" className="bg-slate-900 text-amber-400">Kitchen Status: Busy</option>
            <option value="paused" className="bg-slate-900 text-rose-400">Kitchen Status: Paused</option>
          </select>
        </div>
      </div>

      {/* Clock & Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Clock */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs font-mono font-bold text-amber-400">
          <Clock className="w-3.5 h-3.5" />
          <span>{timeString}</span>
        </div>

        {/* Audio Sound Toggle */}
        <button
          onClick={toggleSound}
          className={cn('p-2.5 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-bold', soundEnabled ? 'bg-slate-800 text-amber-400 border-amber-500/30' : 'bg-slate-900 text-slate-500 border-slate-800')}
          title={soundEnabled ? 'Mute Kitchen Audio Alerts' : 'Enable Kitchen Audio Alerts'}
        >
          {soundEnabled ? <Volume2 className="w-4.5 h-4.5 text-amber-400" /> : <VolumeX className="w-4.5 h-4.5" />}
          <span className="hidden sm:inline">{soundEnabled ? 'Audio ON' : 'Muted'}</span>
        </button>

        {/* Add Demo Order Button */}
        <button
          onClick={handleAddDemoOrder}
          className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 active:scale-95"
          title="Simulate incoming kitchen order"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Sample Order</span>
        </button>

        {/* User / Profile Link */}
        {user ? (
          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 text-xs font-bold transition-colors"
            >
              <User className="w-4 h-4 text-amber-400" />
              <span className="hidden lg:inline">{user.full_name || 'Chef'}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
              title="Logout"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-glow-amber transition-all"
          >
            Kitchen Login
          </Link>
        )}
      </div>
    </header>
  );
}
