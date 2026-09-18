import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, FolderKanban, UserCog, Bell } from 'lucide-react';
import { useWaiterStore } from '../../store/useWaiterStore';
import { cn } from '../../lib/cn';

export default function Sidebar() {
  const { requests, setIsModalOpen } = useWaiterStore();
  const navItems = [
    { to: '/', label: 'Live Order Queue', icon: LayoutDashboard },
    { to: '/menu', label: 'Menu Management', icon: UtensilsCrossed },
    { to: '/categories', label: 'Categories', icon: FolderKanban },
    { to: '/profile', label: 'Kitchen Profile', icon: UserCog },
  ];

  return (
    <aside className="w-full md:w-64 bg-[#131b2e] border-r border-slate-800/80 p-4 flex md:flex-col justify-between shrink-0">
      <nav className="flex md:flex-col gap-2 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-150 flex-1 md:flex-initial',
                  isActive
                    ? 'bg-amber-500 text-white shadow-glow-amber'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* Dedicated Waiter Requests Nav Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className={cn(
            'flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-150 text-left w-full border mt-1',
            requests.some((r) => r.status === 'pending')
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-glow-amber'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-transparent'
          )}
          title="Open Waiter Requests Modal"
        >
          <div className="flex items-center gap-3">
            <Bell className={cn('w-4 h-4 shrink-0', requests.some((r) => r.status === 'pending') && 'animate-bounce text-amber-400')} />
            <span>Waiter Requests</span>
          </div>
          {requests.length > 0 && (
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-black',
                requests.some((r) => r.status === 'pending')
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300'
              )}
            >
              {requests.length}
            </span>
          )}
        </button>
      </nav>
    </aside>
  );
}
