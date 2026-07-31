import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, FolderKanban, UserCog } from 'lucide-react';
import { cn } from '../../lib/cn';

export default function Sidebar() {
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
      </nav>
    </aside>
  );
}
