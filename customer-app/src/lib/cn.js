import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn — Canonical class-name utility
 * Combines clsx conditional logic with tailwind-merge deduplication.
 * Every component in this codebase MUST use this for className construction.
 *
 * @example
 *   cn('px-4 py-2', isActive && 'bg-brand-500', className)
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
