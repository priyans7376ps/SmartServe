import React, { useState } from 'react';
import { Menu, Bell, Sun, Moon, Search, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';

export const TopNavbar = () => {
  const { toggleSidebar, darkMode, toggleDarkMode, notifications, markNotificationAsRead } = useUIStore();
  const { user } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const getNotifIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <header className="h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Restaurant Monitoring
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          title="Toggle Theme (Placeholder)"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-40 overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Notifications</h4>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <p className="p-4 text-xs text-center text-slate-400">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-3.5 flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        n.unread ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <div className="mt-0.5">{getNotifIcon(n.type)}</div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{n.message}</p>
                        <span className="text-[9px] text-slate-400 mt-1 block">{n.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="pl-2 border-l border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
