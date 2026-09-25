/** @type {import('tailwindcss').Config} */
const rgb = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // Replaces Tailwind's palette outright: the six drafting materials are the
    // only colours the site may use (DESIGN.md §4.1).
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      cyanotype: rgb('cyanotype'),
      blueprint: rgb('blueprint'),
      faded: rgb('faded'),
      construction: rgb('construction'),
      redline: rgb('redline'),
      checker: rgb('checker'),
    },
    fontFamily: {
      sans: ['var(--font-sans)'],
      mono: ['var(--font-mono)'],
    },
    // The type scale (§4.2). Nothing smaller than `label` exists.
    fontSize: {
      label: ['13px', { lineHeight: '1.25' }],
      data: ['14px', { lineHeight: '1.3' }],
      small: ['15px', { lineHeight: '1.45' }],
      body: ['17px', { lineHeight: '1.55' }],
      lead: ['clamp(19px, 1.6vw, 22px)', { lineHeight: '1.45' }],
      heading: ['24px', { lineHeight: '1.15' }],
      'data-lg': ['clamp(24px, 2.4vw, 34px)', { lineHeight: '1' }],
      title: ['clamp(30px, 3.6vw, 48px)', { lineHeight: '1.02' }],
      display: ['clamp(56px, 9.2vw, 168px)', { lineHeight: '0.9' }],
    },
    borderRadius: {
      none: '0',
      full: '9999px',
      device: '28px',
    },
    extend: {
      transitionTimingFunction: {
        pen: 'var(--ease-pen)',
        settle: 'var(--ease-settle)',
        exit: 'var(--ease-exit)',
      },
      transitionDuration: {
        press: 'var(--dur-press)',
        quick: 'var(--dur-quick)',
        base: 'var(--dur-base)',
        sheet: 'var(--dur-sheet)',
      },
      maxWidth: {
        measure: '68ch',
        sheet: '1280px',
      },
    },
  },
  plugins: [],
};
