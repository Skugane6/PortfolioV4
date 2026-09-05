/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        ink: 'var(--color-ink)',
        'ink-dim': 'var(--color-ink-dim)',
        border: 'var(--color-border)',
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'accent-text': 'var(--color-accent-text)',
        'accent-wash': 'var(--color-accent-wash)',
        'amber-signal': 'var(--color-amber)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Saira Condensed"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'ui-serif', 'Georgia', '"Times New Roman"', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        'display-lg': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-md': ['2.75rem', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
      },
      spacing: {
        section: '8rem',
      },
      boxShadow: {
        'accent-lift': '0 4px 14px rgba(47, 106, 212, 0.35)',
        'card-glow': '0 0 0 1px rgba(91, 143, 240, 0.25), 0 16px 40px -12px rgba(91, 143, 240, 0.3)',
      },
    },
  },
  plugins: [],
};
