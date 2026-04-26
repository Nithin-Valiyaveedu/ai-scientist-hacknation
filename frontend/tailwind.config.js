/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base':    '#F2EDE3',
        'bg-surface': '#FAFAF8',
        'bg-hover':   '#E8E3D8',

        'text-primary':   '#111110',
        'text-secondary': '#4A4A44',
        'text-muted':     '#9A9A94',

        'btn-primary':  '#000000',
        'diff-add':     '#2D7A3A',
        'diff-remove':  '#C0392B',

        // Semantic (retained for InlineEdit / Toast / recharts)
        success:         '#2D7A3A',
        'success-light': '#F0FFF4',
        warning:         '#D97706',
        'warning-light': '#FFFBEB',
        danger:          '#C0392B',
        'danger-light':  '#FFF5F5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        // keep display for any remaining Fraunces usage
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        lg: '8px',
        xl: '10px',
        '2xl': '12px',
        full: '9999px',
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.06em' }],
      },
    },
  },
  plugins: [],
}
