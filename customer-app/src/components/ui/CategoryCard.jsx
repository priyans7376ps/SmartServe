import React from 'react';
import { motion } from 'framer-motion';
import { Utensils } from 'lucide-react';
import { cn } from '../../lib/cn';
import { springs } from '../../lib/motion';

export default function CategoryCard({ category, isActive, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      transition={springs.snappy}
      onClick={onClick}
      role="radio"
      aria-checked={isActive}
      className={cn(
        'flex items-center gap-2.5 px-4 py-2.5 rounded-full font-bold text-caption',
        'whitespace-nowrap shrink-0 touch-target cursor-pointer',
        'transition-all duration-200 border',
        isActive
          ? 'bg-gradient-to-b from-brand-400 to-brand-600 text-white border-brand-500/50 shadow-glow-sm'
          : 'bg-surface-1 text-ink-secondary border-subtle hover:border-default hover:text-ink-primary',
      )}
    >
      <div className={cn(
        'w-6 h-6 rounded-lg flex items-center justify-center transition-colors',
        isActive ? 'bg-white/20' : 'bg-brand-50 dark:bg-brand-950/50 text-brand-500',
      )}>
        <Utensils className="w-3.5 h-3.5" aria-hidden="true" />
      </div>
      <span>{category.name}</span>
    </motion.button>
  );
}
