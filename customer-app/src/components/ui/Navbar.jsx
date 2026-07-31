import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Search, Sun, Moon, Utensils, User, SlidersHorizontal } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { useTableStore } from '../../store/useTableStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { cn } from '../../lib/cn';
import { springs } from '../../lib/motion';

/* ── ICON BUTTON ─────────────────────────────────────── */
function NavIconBtn({ onClick, title, className, children }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      transition={springs.snappy}
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        'flex items-center justify-center w-10 h-10 rounded-xl',
        'text-ink-secondary hover:text-ink-primary',
        'hover:bg-surface-2 transition-colors duration-150 touch-target',
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

/* ── NAVBAR ──────────────────────────────────────────── */
export default function Navbar({ onOpenSearch, onOpenFilter, onOpenCart }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { getItemCount } = useCartStore();
  const { tableNumber, restaurantName } = useTableStore();
  const { darkMode, toggleDarkMode } = useSettingsStore();

  const itemCount = getItemCount();

  return (
    <header
      className="sticky top-0 z-40 w-full glass"
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-4">

        {/* ── BRAND ──────────────────────────────── */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="SmartServe home">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-b from-brand-400 to-brand-600 flex items-center justify-center text-white shadow-glow-sm group-hover:shadow-glow transition-shadow duration-200">
              <Utensils className="w-4.5 h-4.5 sm:w-5 sm:h-5" aria-hidden="true" />
            </div>
            <div className="leading-none">
              <span className="block font-display font-extrabold text-subtitle gradient-brand">
                SmartServe
              </span>
              {restaurantName && (
                <span className="block text-label text-ink-muted mt-0.5 max-w-[120px] truncate">
                  {restaurantName}
                </span>
              )}
            </div>
          </Link>

          {/* Table chip */}
          {tableNumber && (
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border border-brand-200 dark:border-brand-800/50 bg-brand-50/80 dark:bg-brand-950/30 text-brand-700 dark:text-brand-400 text-label font-bold"
              aria-label={`Table ${tableNumber}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse-ring" aria-hidden="true" />
              Table {tableNumber}
            </div>
          )}
        </div>

        {/* ── SEARCH (desktop) ───────────────────── */}
        <div className="flex-1 max-w-sm hidden md:block">
          <button
            onClick={() => onOpenSearch ? onOpenSearch() : navigate('/menu')}
            className={cn(
              'w-full flex items-center gap-3 px-4 h-10 rounded-xl',
              'bg-surface-2 border border-subtle',
              'text-ink-muted hover:text-ink-secondary hover:border-default',
              'transition-all duration-150 text-body text-left',
            )}
            aria-label="Search menu"
          >
            <Search className="w-4 h-4 text-brand-500 shrink-0" aria-hidden="true" />
            <span className="text-sm truncate">Search dishes, drinks...</span>
          </button>
        </div>

        {/* ── ACTIONS ────────────────────────────── */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile search */}
          <NavIconBtn
            onClick={() => onOpenSearch ? onOpenSearch() : navigate('/menu')}
            title="Search Menu"
            className="md:hidden"
          >
            <Search className="w-5 h-5" aria-hidden="true" />
          </NavIconBtn>

          {/* Filter */}
          {onOpenFilter && (
            <NavIconBtn onClick={onOpenFilter} title="Filters">
              <SlidersHorizontal className="w-5 h-5" aria-hidden="true" />
            </NavIconBtn>
          )}

          {/* Dark mode */}
          <NavIconBtn onClick={toggleDarkMode} title={darkMode ? 'Light mode' : 'Dark mode'}>
            <motion.div
              key={darkMode ? 'sun' : 'moon'}
              initial={{ scale: 0.7, rotate: -30, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={springs.bouncy}
            >
              {darkMode
                ? <Sun  className="w-5 h-5 text-brand-400" aria-hidden="true" />
                : <Moon className="w-5 h-5" aria-hidden="true" />}
            </motion.div>
          </NavIconBtn>

          {/* Cart */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            transition={springs.snappy}
            onClick={() => onOpenCart ? onOpenCart() : navigate('/cart')}
            className={cn(
              'relative flex items-center gap-2 h-10 px-3.5 rounded-xl',
              'bg-gradient-to-b from-brand-400 to-brand-600 hover:from-brand-300 hover:to-brand-500',
              'text-white font-bold text-btn border border-brand-500/50',
              'shadow-glow-sm hover:shadow-glow transition-shadow duration-200 touch-target',
            )}
            aria-label={`Cart, ${itemCount} items`}
          >
            <ShoppingBag className="w-4.5 h-4.5 sm:w-5 sm:h-5" aria-hidden="true" />
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 && (
              <motion.span
                key={itemCount}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={springs.bouncy}
                className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-brand-700 text-[10px] font-black shadow-sm"
                aria-hidden="true"
              >
                {itemCount > 9 ? '9+' : itemCount}
              </motion.span>
            )}
          </motion.button>

          {/* Auth / Profile */}
          {isAuthenticated ? (
            <Link
              to="/profile"
              className={cn(
                'flex items-center gap-2 h-10 px-3 rounded-xl',
                'bg-surface-2 border border-subtle hover:border-default',
                'text-ink-primary font-semibold text-caption transition-all duration-150 touch-target',
              )}
              aria-label="My profile"
            >
              <User className="w-4 h-4 text-brand-500 shrink-0" aria-hidden="true" />
              <span className="hidden lg:inline max-w-[96px] truncate">
                {user?.full_name || 'Profile'}
              </span>
            </Link>
          ) : (
            <Link
              to="/auth"
              className={cn(
                'flex items-center h-10 px-3.5 rounded-xl',
                'bg-surface-2 border border-subtle hover:border-default',
                'text-ink-primary font-bold text-btn transition-all duration-150 touch-target',
              )}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
