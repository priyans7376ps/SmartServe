import React from 'react';
import { cva } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';
import { springs } from '../../lib/motion';

/* ── CVA DEFINITION ─────────────────────────────────── */
const buttonVariants = cva(
  // Base — shared by every variant
  [
    'inline-flex items-center justify-center gap-2 font-bold select-none',
    'cursor-pointer transition-all touch-target',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-40',
  ],
  {
    variants: {
      variant: {
        /* Premium amber CTA */
        primary: [
          'bg-gradient-to-b from-brand-400 to-brand-600 text-white',
          'shadow-glow-sm hover:shadow-glow',
          'border border-brand-500/50',
          'hover:from-brand-300 hover:to-brand-500',
        ],
        /* Secondary surface */
        secondary: [
          'bg-surface-2 text-ink-primary',
          'border border-default',
          'hover:bg-surface-1 hover:border-strong',
        ],
        /* Ghost / text */
        ghost: [
          'bg-transparent text-ink-secondary',
          'hover:bg-surface-2 hover:text-ink-primary',
        ],
        /* Glass morphism */
        glass: [
          'bg-white/10 dark:bg-white/5 text-ink-primary',
          'border border-white/20 dark:border-white/10',
          'backdrop-blur-sm',
          'hover:bg-white/20 dark:hover:bg-white/10',
        ],
        /* Destructive */
        destructive: [
          'bg-gradient-to-b from-red-400 to-red-600 text-white',
          'shadow-sm hover:shadow-md border border-red-500/50',
        ],
        /* Outline */
        outline: [
          'border-2 border-brand-500 text-brand-600 dark:text-brand-400',
          'hover:bg-brand-500 hover:text-white',
        ],
        /* Icon only — no text */
        icon: [
          'bg-surface-2 text-ink-secondary',
          'border border-subtle',
          'hover:bg-surface-1 hover:text-ink-primary hover:border-default',
        ],
      },
      size: {
        xs: 'h-8  px-3  text-xs    rounded-lg',
        sm: 'h-9  px-4  text-sm    rounded-xl',
        md: 'h-11 px-5  text-btn   rounded-xl',
        lg: 'h-13 px-6  text-body  rounded-2xl',
        xl: 'h-14 px-8  text-subtitle rounded-2xl',
        /* Square icon buttons */
        'icon-sm': 'h-9  w-9  rounded-xl p-0',
        'icon-md': 'h-11 w-11 rounded-xl p-0',
        'icon-lg': 'h-12 w-12 rounded-2xl p-0',
      },
      fullWidth: {
        true:  'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size:    'md',
      fullWidth: false,
    },
  }
);

/* ── COMPONENT ──────────────────────────────────────── */
export default function Button({
  children,
  variant,
  size,
  fullWidth,
  isLoading = false,
  icon: Icon,
  iconRight: IconRight,
  className,
  onClick,
  type = 'button',
  disabled,
  'aria-label': ariaLabel,
  ...props
}) {
  const isDisabled = disabled || isLoading;

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02 } : undefined}
      whileTap={!isDisabled   ? { scale: 0.97 } : undefined}
      transition={springs.snappy}
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
          {children}
          {IconRight && <IconRight className="w-4 h-4 shrink-0" aria-hidden="true" />}
        </>
      )}
    </motion.button>
  );
}

/* Named export for direct use in class-only contexts */
export { buttonVariants };
