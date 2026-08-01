import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Users,
  Ticket,
  MessageSquareWarning,
  UserCheck,
  TrendingUp,
  FileBarChart,
  Settings,
  User,
  LogOut,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/payments', label: 'Payments', icon: CreditCard },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/coupons', label: 'Coupons', icon: Ticket },
  { path: '/complaints', label: 'Complaints', icon: MessageSquareWarning },
  { path: '/staff', label: 'Staff Management', icon: UserCheck },
  { path: '/analytics', label: 'Analytics', icon: TrendingUp },
  { path: '/reports', label: 'Reports', icon: FileBarChart },
  { path: '/settings', label: 'Restaurant Settings', icon: Settings },
  { path: '/profile', label: 'Profile', icon: User },
];

export const Sidebar = () => {
  const { logout, user } = useAuthStore();
  const { sidebarOpen } = useUIStore();

  if (!sidebarOpen) return null;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 z-30 shrink-0 text-slate-300">
      {/* Brand Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
          <UtensilsCrossed className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-extrabold text-white tracking-tight leading-tight">SmartServe</h1>
          <p className="text-[10px] font-semibold tracking-wider text-amber-500 uppercase">Admin Portal</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-500 text-white font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-500 text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'Administrator'}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@smartserve.com'}</p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
