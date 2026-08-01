/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
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
          border: '#a7f3d0',
          500:  '#10b981',
          600:  '#059669',
        },
        warning: {
          bg:   '#fffbeb',
          text: '#92400e',
          border: '#fde68a',
          500:  '#f59e0b',
        },
        error: {
          bg:   '#fef2f2',
          text: '#991b1b',
          border: '#fecaca',
          500:  '#ef4444',
          600:  '#dc2626',
        },
        info: {
          bg:   '#eff6ff',
          text: '#1e40af',
          border: '#bfdbfe',
          500:  '#3b82f6',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'sm':   '0.5rem',
        'md':   '0.75rem',
        'lg':   '1rem',
        'xl':   '1.25rem',
        '2xl':  '1.5rem',
      },
      boxShadow: {
        'card':      '0 2px 8px -2px rgb(0 0 0 / 0.06), 0 0 0 1px rgb(0 0 0 / 0.04)',
        'card-hover':'0 8px 24px -4px rgb(0 0 0 / 0.12), 0 0 0 1px rgba(245,158,11,0.25)',
      },
    },
  },
  plugins: [],
};
