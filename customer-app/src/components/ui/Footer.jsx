import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, UtensilsCrossed, ShoppingBag, User } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { cn } from '../../lib/cn';

const NAV_ITEMS = [
  { path: '/',        icon: Home,           label: 'Home'    },
  { path: '/menu',    icon: UtensilsCrossed, label: 'Menu'   },
  { path: '/cart',    icon: ShoppingBag,    label: 'Cart'    },
  { path: '/profile', icon: User,           label: 'Profile' },
];

export default function Footer() {
  const location = useLocation();
  const { getItemCount } = useCartStore();
  const itemCount = getItemCount();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* ── DESKTOP FOOTER ─────────────────────── */}
      <footer className="hidden md:block border-t border-subtle bg-surface-1 py-6 mt-12" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-caption text-ink-muted font-medium">
            SmartServe &copy; {new Date().getFullYear()} · Digital Table Ordering System
          </p>
          <nav className="flex items-center gap-6" aria-label="Footer navigation">
            {NAV_ITEMS.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className="text-caption font-semibold text-ink-muted hover:text-brand-500 transition-colors duration-150"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>

      {/* ── MOBILE BOTTOM NAV ──────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-subtle safe-area-inset-bottom"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-stretch justify-around h-16">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            const isCart = path === '/cart';

            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5 flex-1',
                  'transition-colors duration-150 cursor-pointer',
                  active ? 'text-brand-500' : 'text-ink-muted hover:text-ink-secondary',
                )}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
              >
                {/* Active indicator pill */}
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute top-1 w-8 h-0.5 rounded-full bg-brand-500"
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    aria-hidden="true"
                  />
                )}

                {/* Icon + Cart badge */}
                <div className="relative mt-2">
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-transform duration-200',
                      active && 'scale-110',
                    )}
                    aria-hidden="true"
                  />
                  {isCart && itemCount > 0 && (
                    <motion.span
                      key={itemCount}
                      initial={{ scale: 0.4 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm"
                      aria-hidden="true"
                    >
                      {itemCount > 9 ? '9+' : itemCount}
                    </motion.span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'text-[10px] font-bold transition-all duration-200',
                    active ? 'opacity-100' : 'opacity-70',
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom safe area spacer for mobile */}
      <div className="md:hidden h-16" aria-hidden="true" />
    </>
  );
}
