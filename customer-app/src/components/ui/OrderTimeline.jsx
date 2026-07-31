import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ChefHat, CheckCircle2, PackageCheck } from 'lucide-react';
import { cn } from '../../lib/cn';
import { springs } from '../../lib/motion';

const STEPS = [
  {
    key: 'pending',
    label: 'Order Placed',
    desc: 'Your order is confirmed and queued.',
    icon: Clock,
  },
  {
    key: 'preparing',
    label: 'Preparing',
    desc: 'Chef is crafting your dishes.',
    icon: ChefHat,
  },
  {
    key: 'ready',
    label: 'Ready',
    desc: 'Order ready — being brought to you.',
    icon: PackageCheck,
  },
  {
    key: 'completed',
    label: 'Delivered',
    desc: 'Enjoy your meal!',
    icon: CheckCircle2,
  },
];

const STATUS_ORDER = ['pending', 'preparing', 'ready', 'completed'];

export default function OrderTimeline({ status = 'pending' }) {
  const currentIndex = STATUS_ORDER.indexOf(status);

  return (
    <div className="space-y-1" role="list" aria-label="Order status timeline">
      {STEPS.map((step, i) => {
        const isDone    = i < currentIndex;
        const isActive  = i === currentIndex;
        const isPending = i > currentIndex;

        const Icon = step.icon;

        return (
          <div
            key={step.key}
            className="flex items-start gap-4"
            role="listitem"
            aria-current={isActive ? 'step' : undefined}
          >
            {/* Icon + Line */}
            <div className="flex flex-col items-center shrink-0">
              <motion.div
                initial={{ scale: 0.7 }}
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={springs.bouncy}
                className={cn(
                  'w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-300',
                  isDone   && 'bg-success-bg border-success-border text-success-500',
                  isActive && 'bg-gradient-to-b from-brand-400 to-brand-600 border-brand-600 text-white shadow-glow-sm',
                  isPending && 'bg-surface-2 border-subtle text-ink-muted',
                )}
              >
                {isActive ? (
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </motion.div>
                ) : (
                  <Icon className="w-5 h-5" aria-hidden="true" />
                )}
              </motion.div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="relative w-0.5 flex-1 my-1 min-h-[28px]">
                  <div className="absolute inset-0 bg-surface-2 rounded-full" />
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: isDone ? 1 : 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1, ease: [0.25, 1, 0.5, 1] }}
                    style={{ originY: 0 }}
                    className="absolute inset-0 bg-success-500 rounded-full"
                  />
                </div>
              )}
            </div>

            {/* Content */}
            <div className={cn(
              'pb-6 flex-1 pt-1.5 transition-opacity duration-300',
              isPending && 'opacity-40',
            )}>
              <p className={cn(
                'text-caption font-extrabold transition-colors',
                isActive  ? 'text-brand-500'   : '',
                isDone    ? 'text-success-text' : '',
                isPending ? 'text-ink-muted'   : '',
              )}>
                {step.label}
              </p>
              <p className="text-label text-ink-muted mt-0.5 leading-relaxed">{step.desc}</p>
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springs.smooth}
                  className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 dark:bg-brand-950/30 border border-brand-200/60 dark:border-brand-800/40 rounded-full"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" aria-hidden="true" />
                  <span className="text-label font-bold text-brand-500">In progress</span>
                </motion.div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
