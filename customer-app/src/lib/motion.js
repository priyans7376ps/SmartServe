/**
 * Motion Variants — Centralized Framer Motion configuration
 * All components import from here for consistency.
 * Rule: 150–300ms max, spring physics for tactile elements.
 */

/* ── SPRING CONFIGS ──────────────────────────────────── */
export const springs = {
  snappy:  { type: 'spring', stiffness: 500, damping: 30, mass: 0.8 },
  bouncy:  { type: 'spring', stiffness: 380, damping: 22, mass: 1 },
  smooth:  { type: 'spring', stiffness: 300, damping: 28, mass: 1 },
  gentle:  { type: 'spring', stiffness: 200, damping: 24, mass: 1 },
  drawer:  { type: 'spring', stiffness: 350, damping: 32, mass: 0.9 },
  overlay: { type: 'tween', duration: 0.2, ease: [0.4, 0, 0.2, 1] },
};

/* ── PAGE TRANSITIONS ────────────────────────────────── */
export const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.25, 1, 0.5, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } },
};

/* ── FADE ────────────────────────────────────────────── */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
};

/* ── SCALE POPUP ─────────────────────────────────────── */
export const scaleIn = {
  initial: { opacity: 0, scale: 0.93 },
  animate: { opacity: 1, scale: 1, transition: springs.snappy },
  exit:    { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

/* ── SLIDE UP (modals, drawers from bottom) ──────────── */
export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: springs.smooth },
  exit:    { opacity: 0, y: 16, transition: { duration: 0.18 } },
};

/* ── SLIDE FROM RIGHT (drawer) ───────────────────────── */
export const slideRight = {
  initial: { x: '100%' },
  animate: { x: 0, transition: springs.drawer },
  exit:    { x: '100%', transition: springs.drawer },
};

/* ── STAGGER CONTAINER ───────────────────────────────── */
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.25, 1, 0.5, 1] } },
};

/* ── TACTILE / PRESS ─────────────────────────────────── */
export const tapScale = {
  whileTap: { scale: 0.96, transition: springs.snappy },
};

export const hoverLift = {
  whileHover: { y: -2, transition: springs.snappy },
  whileTap:   { y: 0,  scale: 0.97, transition: springs.snappy },
};

export const pressButton = {
  whileHover: { scale: 1.02, transition: springs.snappy },
  whileTap:   { scale: 0.97, transition: springs.snappy },
};

/* ── BACKDROP ────────────────────────────────────────── */
export const backdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: springs.overlay },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
};

/* ── CARD HOVER ──────────────────────────────────────── */
export const cardHover = {
  rest:  { y: 0, boxShadow: '0 2px 8px -2px rgb(0 0 0 / 0.06)' },
  hover: {
    y: -4,
    boxShadow: '0 16px 32px -8px rgb(0 0 0 / 0.14)',
    transition: springs.smooth,
  },
};

/* ── NOTIFICATION / TOAST SLIDE ─────────────────────── */
export const toastSlide = {
  initial: { opacity: 0, x: 40, scale: 0.95 },
  animate: { opacity: 1, x: 0,  scale: 1, transition: springs.bouncy },
  exit:    { opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.18 } },
};
