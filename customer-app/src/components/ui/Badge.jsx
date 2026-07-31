import React from 'react';
import { cva } from 'class-variance-authority';
import { Flame, Sparkles, Star, Tag, Leaf, Drumstick } from 'lucide-react';
import { cn } from '../../lib/cn';

/* ── CVA DEFINITION ─────────────────────────────────── */
const badgeVariants = cva(
  'inline-flex items-center gap-1 font-bold select-none whitespace-nowrap',
  {
    variants: {
      variant: {
        veg:         'bg-success-bg text-success-text border border-success-border rounded-full px-2.5 py-0.5 text-label',
        'non-veg':   'bg-error-bg   text-error-text  border border-error-border  rounded-full px-2.5 py-0.5 text-label',
        special:     'bg-gradient-to-r from-brand-500 to-red-500 text-white rounded-full px-2.5 py-0.5 text-label shadow-sm',
        popular:     'bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full px-2.5 py-0.5 text-label shadow-sm',
        recommended: 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-full px-2.5 py-0.5 text-label shadow-sm',
        new:         'bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-full px-2.5 py-0.5 text-label shadow-sm',
        default:     'bg-surface-2 text-ink-secondary border border-subtle rounded-lg px-2 py-0.5 text-label',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

const icons = {
  veg:         <Leaf className="w-2.5 h-2.5" aria-hidden="true" />,
  'non-veg':   <Drumstick className="w-2.5 h-2.5" aria-hidden="true" />,
  special:     <Flame className="w-2.5 h-2.5" aria-hidden="true" />,
  popular:     <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />,
  recommended: <Star className="w-2.5 h-2.5" aria-hidden="true" />,
  new:         <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />,
  default:     <Tag className="w-2.5 h-2.5" aria-hidden="true" />,
};

const defaultLabels = {
  veg:         'VEG',
  'non-veg':   'NON-VEG',
  special:     "Today's Special",
  popular:     'Popular',
  recommended: 'Chef Recommended',
  new:         'New',
};

export default function Badge({ variant = 'default', text, className }) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      role="status"
      aria-label={text || defaultLabels[variant]}
    >
      {icons[variant]}
      <span>{text || defaultLabels[variant]}</span>
    </span>
  );
}

export { badgeVariants };
