/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      /* ── BRAND COLORS ─────────────────────────── */
      colors: {
        brand: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        surface: {
          0:   'var(--surface-0)',
          1:   'var(--surface-1)',
          2:   'var(--surface-2)',
          3:   'var(--surface-3)',
        },
        ink: {
          primary:   'var(--ink-primary)',
          secondary: 'var(--ink-secondary)',
          muted:     'var(--ink-muted)',
          inverse:   'var(--ink-inverse)',
        },
        border: {
          subtle:  'var(--border-subtle)',
          default: 'var(--border-default)',
          strong:  'var(--border-strong)',
        },
        success: {
          bg:   '#ecfdf5',
          text: '#065f46',
          border:'#a7f3d0',
          500:  '#10b981',
          600:  '#059669',
        },
        warning: {
          bg:   '#fffbeb',
          text: '#92400e',
          border:'#fde68a',
          500:  '#f59e0b',
        },
        error: {
          bg:   '#fef2f2',
          text: '#991b1b',
          border:'#fecaca',
          500:  '#ef4444',
          600:  '#dc2626',
        },
        info: {
          bg:   '#eff6ff',
          text: '#1e40af',
          border:'#bfdbfe',
          500:  '#3b82f6',
        },
      },

      /* ── TYPOGRAPHY ───────────────────────────── */
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['3.5rem',   { lineHeight: '1.1',  letterSpacing: '-0.04em', fontWeight: '800' }],
        'display':    ['2.5rem',   { lineHeight: '1.15', letterSpacing: '-0.03em', fontWeight: '800' }],
        'h1':         ['2rem',     { lineHeight: '1.2',  letterSpacing: '-0.025em', fontWeight: '800' }],
        'h2':         ['1.5rem',   { lineHeight: '1.25', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h3':         ['1.25rem',  { lineHeight: '1.3',  letterSpacing: '-0.015em', fontWeight: '700' }],
        'subtitle':   ['1rem',     { lineHeight: '1.5',  letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-lg':    ['1rem',     { lineHeight: '1.6',  letterSpacing: '0', fontWeight: '400' }],
        'body':       ['0.875rem', { lineHeight: '1.6',  letterSpacing: '0', fontWeight: '400' }],
        'caption':    ['0.75rem',  { lineHeight: '1.5',  letterSpacing: '0.01em', fontWeight: '500' }],
        'btn':        ['0.875rem', { lineHeight: '1',    letterSpacing: '-0.01em', fontWeight: '700' }],
        'label':      ['0.6875rem',{ lineHeight: '1',    letterSpacing: '0.06em', fontWeight: '700' }],
      },

      /* ── SPACING ──────────────────────────────── */
      spacing: {
        '4.5': '1.125rem',
        '13':  '3.25rem',
        '15':  '3.75rem',
        '18':  '4.5rem',
        '22':  '5.5rem',
      },

      /* ── BORDER RADIUS ────────────────────────── */
      borderRadius: {
        'sm':   '0.5rem',
        'md':   '0.75rem',
        'lg':   '1rem',
        'xl':   '1.25rem',
        '2xl':  '1.5rem',
        '3xl':  '2rem',
        '4xl':  '2.5rem',
        'full': '9999px',
      },

      /* ── SHADOWS ──────────────────────────────── */
      boxShadow: {
        /* Ambient depth shadows */
        'xs':    '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        'sm':    '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'md':    '0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
        'lg':    '0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        'xl':    '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.05)',
        '2xl':   '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        /* Brand glow */
        'glow-sm':   '0 0 12px -3px rgba(245, 158, 11, 0.35)',
        'glow':      '0 0 24px -4px rgba(245, 158, 11, 0.45)',
        'glow-lg':   '0 0 40px -6px rgba(245, 158, 11, 0.5)',
        /* Inner */
        'inner-sm':  'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'inner-md':  'inset 0 2px 4px 0 rgb(0 0 0 / 0.06)',
        /* Card */
        'card':      '0 2px 8px -2px rgb(0 0 0 / 0.06), 0 0 0 1px rgb(0 0 0 / 0.04)',
        'card-hover':'0 8px 24px -4px rgb(0 0 0 / 0.12), 0 0 0 1px rgba(245,158,11,0.25)',
      },

      /* ── BACKDROP BLUR ────────────────────────── */
      backdropBlur: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
      },

      /* ── ANIMATION ────────────────────────────── */
      transitionTimingFunction: {
        'spring':       'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth':       'cubic-bezier(0.4, 0, 0.2, 1)',
        'out-quart':    'cubic-bezier(0.25, 1, 0.5, 1)',
        'in-out-quart': 'cubic-bezier(0.76, 0, 0.24, 1)',
      },
      transitionDuration: {
        '80':  '80ms',
        '120': '120ms',
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-right': {
          '0%':   { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-ring': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        'skeleton': {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in':    'fade-in 200ms ease-out both',
        'fade-up':    'fade-up 280ms cubic-bezier(0.25, 1, 0.5, 1) both',
        'scale-in':   'scale-in 200ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'slide-right':'slide-right 280ms cubic-bezier(0.25, 1, 0.5, 1) both',
        'float':      'float 3s ease-in-out infinite',
        'shimmer':    'shimmer 2s linear infinite',
        'pulse-ring': 'pulse-ring 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
