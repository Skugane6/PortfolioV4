/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#0a0a0c',
        raised: '#141417',
        ink: '#f5f4f0',
        'ink-dim': '#9a9a9e',
        accent: '#ff5a1f',
        'accent-text': '#ffb27a',
      },
      fontFamily: {
        display: ['ui-serif', 'Georgia', '"Times New Roman"', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        'display-lg': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-md': ['2.75rem', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
      },
      spacing: {
        section: '8rem',
      },
    },
  },
  plugins: [],
};
