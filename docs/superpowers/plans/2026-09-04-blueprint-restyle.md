# Blueprint Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the portfolio to match the reference design (`Searan Kuganesan Portfolio (standalone) (1).html`) — palette, fonts, layout, and especially a real scroll-driven plane-cutaway opening animation in Experience and a real sliding carousel in Projects — while preserving all existing content and functionality.

**Architecture:** Token-level restyle (CSS variables + Tailwind font/color config) ripples through most components for free since they already use semantic classes. Two components are net-new/rebuilt with real logic: `Experience` (a CSS-custom-property-driven scroll animation, backed by pure/unit-tested math) and `Projects` (a new sliding carousel replacing `FeaturedProject`, backed by real React state instead of the reference's non-functional mock-DOM code).

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Vitest + Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-09-04-blueprint-restyle-design.md`

## Global Constraints

- Dark-only theme — no light palette, no `prefers-color-scheme` branch, no toggle (per `index.css`'s existing header comment).
- All motion must respect `prefers-reduced-motion` (via Framer Motion's `useReducedMotion`/`MotionConfig` where Framer Motion is used; via the Experience section's own `static` mode where it isn't).
- No new runtime dependencies — implement swipe/carousel/observer logic with what's already installed (`framer-motion`, `@testing-library/react`'s `fireEvent`, native `ResizeObserver`/`IntersectionObserver`).
- Section anchor ids after this plan: `hero`, `experience`, `projects`, `skills`, `contact` (in that order) — `NavRail`, `App`, and every internal link must agree on these.
- Fonts: IBM Plex Sans (body), Saira Condensed (display), Newsreader italic (serif accent), JetBrains Mono (mono) — loaded from the existing Google Fonts `<link>` in `index.html`.
- Palette values come from the spec's §4 table verbatim; token *names* in `index.css`/`tailwind.config.js` stay the same except the new `--color-amber` / `amber-signal` token.
- Only one experience entry exists today (`experience[0]`) — no multi-role pager is built.

---

### Task 1: Design tokens — palette, fonts, shared styles

**Files:**
- Modify: `src/styles/index.css`
- Modify: `tailwind.config.js`
- Modify: `index.html`
- Modify: `src/styles/shared.ts`
- Modify: `src/utils/contrast.test.ts`

**Interfaces:**
- Produces: Tailwind color tokens `bg`, `surface`, `ink`, `ink-dim`, `border`, `accent`, `accent-hover`, `accent-text`, `accent-wash`, `navy` (values changed), plus new `amber-signal`. `fontFamily.sans/display/serif/mono` (families changed). `shared.ts` exports `underlineLink`, `cardSurface`, `blueprintGrid`, `chipStamped`, `chipWash`, `btnPrimary` (unchanged names/signatures, `blueprintGrid`'s grid tuned).
- Consumes: nothing new.

This task touches no component logic — `Skills.tsx` and `Contact.tsx` need **no code changes at all**, since they already read colors/fonts through these Tailwind classes; this task's final test run is what proves that.

- [ ] **Step 1: Update the CSS custom properties**

Replace the `:root` block in `src/styles/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Blueprint / technical-manual theme tokens. Dark only, by design — no
   light palette, no prefers-color-scheme branch, no toggle. */
:root {
  color-scheme: dark;

  --color-bg: #0a0d13;
  --color-surface: #12161f;
  --color-ink: #e7ecf3;
  --color-ink-dim: #8b94a3;
  --color-border: #232b3a;

  /* accent: solid fill for buttons/chips/borders. accent-text: the tint used
     for text/links — brightened past the raw accent so it still clears
     4.5:1 against the dark background (see contrast.test.ts). */
  --color-accent: #2f6ad4;
  --color-accent-hover: #4f7ad0;
  --color-accent-text: #5b8ff0;
  --color-accent-wash: rgba(79, 122, 208, 0.14);

  /* Secondary muted accent — reserved for the footer band only. Never used
     anywhere the primary blue would otherwise appear. */
  --color-navy: #2f4a66;

  /* Amber — scoped to the Experience cutaway's status/progress accents only. */
  --color-amber: #f0a02a;
}

body {
  @apply bg-bg font-sans text-ink antialiased;
}

a:focus-visible,
button:focus-visible {
  @apply outline outline-2 outline-offset-2 outline-accent-text;
}
```

- [ ] **Step 2: Update Tailwind's font/color config**

Replace `tailwind.config.js`:

```js
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
        navy: 'var(--color-navy)',
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
```

- [ ] **Step 3: Swap the Google Fonts link**

In `index.html`, replace the existing `<link href="https://fonts.googleapis.com/css2?family=Fraunces...">` line with:

```html
    <link
      href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Saira+Condensed:wght@500;600;700&family=Newsreader:ital,wght@1,400&family=JetBrains+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
```

- [ ] **Step 4: Tune the blueprint grid utility**

In `src/styles/shared.ts`, update `blueprintGrid`'s color to the reference's grid tint (the utility keeps the same name/shape — only the color values inside the string change):

```ts
export const blueprintGrid =
  'pointer-events-none absolute inset-0 ' +
  'bg-[linear-gradient(to_right,rgba(96,128,180,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(96,128,180,0.07)_1px,transparent_1px)] ' +
  'bg-[size:32px_32px]';
```

Leave every other export in `shared.ts` untouched — they already read colors through Tailwind classes that pick up the new token values automatically.

- [ ] **Step 5: Update the contrast test's hex literals**

Replace `src/utils/contrast.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { contrastRatio } from './contrast';

describe('contrastRatio', () => {
  it('returns 1 for identical colors', () => {
    expect(contrastRatio('#f7f8fa', '#f7f8fa')).toBeCloseTo(1, 5);
  });

  it('returns 21 for pure black against pure white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });

  // The site is dark-only — these are the actual tokens from index.css.
  describe('the site palette', () => {
    it('meets WCAG AA (>=4.5) for ink on the page background', () => {
      expect(contrastRatio('#e7ecf3', '#0a0d13')).toBeGreaterThanOrEqual(4.5);
    });

    it('meets WCAG AA (>=4.5) for muted ink-dim text on the page background', () => {
      expect(contrastRatio('#8b94a3', '#0a0d13')).toBeGreaterThanOrEqual(4.5);
    });

    it('meets WCAG AA (>=4.5) for accent text/links on the page background', () => {
      // Deliberately brighter than the raw accent fill (#2f6ad4, which falls
      // short here) — this is the token text/links actually use.
      expect(contrastRatio('#5b8ff0', '#0a0d13')).toBeGreaterThanOrEqual(4.5);
    });

    it('meets WCAG AA (>=4.5) for white button text on the accent fill', () => {
      expect(contrastRatio('#ffffff', '#2f6ad4')).toBeGreaterThanOrEqual(4.5);
    });
  });
});
```

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: PASS — every existing test still passes (Skills/Contact/Footer/Hero/NavRail/Experience/FeaturedProject all still reference the same token/class names, just with new underlying values).

- [ ] **Step 7: Commit**

```bash
git add src/styles/index.css tailwind.config.js index.html src/styles/shared.ts src/utils/contrast.test.ts
git commit -m "Restyle design tokens: reference palette and font stack"
```

---

### Task 2: Recolor NetworkField and its fallback

**Files:**
- Modify: `src/components/networkField/NetworkField.tsx`
- Modify: `src/components/networkField/NetworkFieldFallback.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: no signature changes — `NetworkField` and `NetworkFieldFallback` keep their existing exports/props (none) and `data-testid`s (`network-field-canvas`, `network-field-fallback`).

- [ ] **Step 1: Recolor the 3D network**

In `src/components/networkField/NetworkField.tsx`, update the three hardcoded hex colors:

```tsx
        <lineBasicMaterial color="#2f6ad4" transparent opacity={0.22} depthWrite={false} />
      </lineSegments>

      <Points positions={network.nodePositions} stride={3}>
        <PointMaterial transparent color="#5b8ff0" size={3} sizeAttenuation={false} depthWrite={false} opacity={0.75} />
      </Points>

      {network.hubPositions.length > 0 && (
        <Points positions={network.hubPositions} stride={3}>
          <PointMaterial
            transparent
            color="#bcd4f5"
```

And the packet color:

```tsx
        color="#eaf1ff"
```

(Each is a single hex-literal swap in place — `#2f6fdb`→`#2f6ad4`, `#4c8dff`→`#5b8ff0`, `#8fc4ff`→`#bcd4f5`, `#dceaff`→`#eaf1ff`. No structural changes.)

- [ ] **Step 2: Recolor the static fallback to match**

In `src/components/networkField/NetworkFieldFallback.tsx`, update the edge/node colors:

```tsx
            stroke="#2f6ad4"
```

```tsx
            fill={i % HUB_STRIDE === 0 ? '#bcd4f5' : '#5b8ff0'}
```

- [ ] **Step 3: Run the fallback's test**

Run: `npm test -- NetworkFieldFallback`
Expected: PASS (the test only checks structure/testids, not color values, so this confirms nothing broke).

- [ ] **Step 4: Commit**

```bash
git add src/components/networkField/NetworkField.tsx src/components/networkField/NetworkFieldFallback.tsx
git commit -m "Recolor NetworkField to the reference's blue palette"
```

---

### Task 3: Recompose Hero to the reference's centered layout

**Files:**
- Modify: `src/components/Hero.tsx`

**Interfaces:**
- Consumes: `useCanRender3D` (`src/hooks/useCanRender3D.ts`, unchanged), `NetworkField`/`NetworkFieldFallback` (Task 2), `blueprintGrid`/`btnPrimary`/`underlineLink` (Task 1), `staggerContainer`/`staggerItem` (`./Reveal`, unchanged).
- Produces: `Hero` component, same export, same `id="hero"` section, same `data-testid`s from its children — no test file changes needed (see Step 2).

- [ ] **Step 1: Replace Hero.tsx**

```tsx
import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { useCanRender3D } from '../hooks/useCanRender3D';
import { NetworkFieldFallback } from './networkField/NetworkFieldFallback';
import heroImage from '../assets/hero.jpg';
import { blueprintGrid, btnPrimary, underlineLink } from '../styles/shared';
import { staggerContainer, staggerItem } from './Reveal';

const NetworkField = lazy(() =>
  import('./networkField/NetworkField').then((module) => ({ default: module.NetworkField }))
);

export function Hero() {
  const canRender3D = useCanRender3D();

  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b1322]"
    >
      <div aria-hidden="true" className={blueprintGrid} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_8%,rgba(46,86,158,0.35),rgba(11,19,34,0)_62%)]"
      />
      <div className="absolute inset-0">
        {canRender3D ? (
          <Suspense fallback={<NetworkFieldFallback />}>
            <NetworkField />
          </Suspense>
        ) : (
          <NetworkFieldFallback />
        )}
      </div>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 text-center"
      >
        <motion.img
          variants={staggerItem}
          src={heroImage}
          alt="Searan Kuganesan"
          className="h-24 w-24 rounded-full border border-border object-cover"
        />
        <motion.h1 variants={staggerItem} className="font-display text-display-lg text-ink">
          Searan Kuganesan
        </motion.h1>
        <motion.p variants={staggerItem} className="max-w-xl font-serif text-lg italic text-ink-dim">
          I build the systems operators run their business on.
        </motion.p>
        <motion.div variants={staggerItem} className="flex flex-wrap items-center justify-center gap-6">
          <motion.a
            href="/skuganesan_resume.pdf"
            download
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={btnPrimary}
          >
            ↓ Download Résumé
          </motion.a>
          <a href="#projects" className={`font-mono text-xs tracking-widest text-accent-text ${underlineLink}`}>
            SEE THE WORK
          </a>
        </motion.div>
      </motion.div>
      <div
        aria-hidden="true"
        className="absolute bottom-7 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.2em] text-ink-dim"
      >
        SCROLL
      </div>
    </section>
  );
}
```

Note the "SEE THE WORK" link now points at `#projects` (the new Projects section from Task 10), not `#work` — `FeaturedProject`'s `id="work"` goes away in this restyle.

- [ ] **Step 2: Run Hero's existing test file unmodified**

Run: `npm test -- Hero`
Expected: PASS — `Hero.test.tsx` only asserts on text content, `alt` text, testids, and the résumé link's `href`/`download` attributes, none of which changed, so the existing test file needs no edits.

- [ ] **Step 3: Commit**

```bash
git add src/components/Hero.tsx
git commit -m "Recompose Hero to the reference's centered blueprint layout"
```

---

### Task 4: Update NavRail's section list

**Files:**
- Modify: `src/components/NavRail.tsx`
- Modify: `src/components/NavRail.test.tsx`

**Interfaces:**
- Consumes: `useActiveSection` (unchanged), `underlineLink` (Task 1).
- Produces: `NavRail` component, unchanged export/shape — only the `SECTIONS` data and rendered labels/hrefs change.

- [ ] **Step 1: Update the failing test first**

Replace `src/components/NavRail.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavRail } from './NavRail';

vi.mock('../hooks/useActiveSection', () => ({
  useActiveSection: () => 'experience',
}));

describe('NavRail', () => {
  it('renders all four section links with mono section-number labels', () => {
    render(<NavRail />);
    expect(screen.getByRole('link', { name: '01 EXPERIENCE' })).toHaveAttribute('href', '#experience');
    expect(screen.getByRole('link', { name: '02 PROJECTS' })).toHaveAttribute('href', '#projects');
    expect(screen.getByRole('link', { name: '03 SKILLS' })).toHaveAttribute('href', '#skills');
    expect(screen.getByRole('link', { name: '04 CONTACT' })).toHaveAttribute('href', '#contact');
  });

  it('marks the active section with aria-current', () => {
    render(<NavRail />);
    expect(screen.getByRole('link', { name: '01 EXPERIENCE' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: '02 PROJECTS' })).not.toHaveAttribute('aria-current');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- NavRail`
Expected: FAIL — the current `NavRail.tsx` still renders `01 WORK`/`02 EXPERIENCE`, so `getByRole('link', { name: '01 EXPERIENCE' })` won't match.

- [ ] **Step 3: Update the SECTIONS list**

In `src/components/NavRail.tsx`, replace the `SECTIONS` constant (the rest of the component is unchanged):

```tsx
const SECTIONS = [
  { id: 'experience', label: '01 EXPERIENCE' },
  { id: 'projects', label: '02 PROJECTS' },
  { id: 'skills', label: '03 SKILLS' },
  { id: 'contact', label: '04 CONTACT' },
];
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- NavRail`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/NavRail.tsx src/components/NavRail.test.tsx
git commit -m "Update NavRail section list to Experience/Projects/Skills/Contact"
```

---

### Task 5: Restyle Footer, retire the navy token

**Files:**
- Modify: `src/components/Footer.tsx`
- Modify: `src/styles/index.css`
- Modify: `tailwind.config.js`

**Interfaces:**
- Consumes: `Reveal` (unchanged).
- Produces: `Footer` component, unchanged export/text content (`BUILT BY SEARAN KUGANESAN`).

- [ ] **Step 1: Restyle Footer.tsx**

```tsx
import { Reveal } from './Reveal';

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg px-6 py-8 text-center font-mono text-[10px] tracking-widest text-ink-dim">
      <Reveal>BUILT BY SEARAN KUGANESAN</Reveal>
    </footer>
  );
}
```

- [ ] **Step 2: Remove the now-unused navy token**

In `src/styles/index.css`, delete these two lines from `:root`:

```css
  /* Secondary muted accent — reserved for the footer band only. Never used
     anywhere the primary blue would otherwise appear. */
  --color-navy: #2f4a66;
```

In `tailwind.config.js`, delete this line from `colors`:

```js
        navy: 'var(--color-navy)',
```

- [ ] **Step 3: Run Footer's existing test and the full suite**

Run: `npm test`
Expected: PASS — `Footer.test.tsx` only checks the text content, and no other file references `bg-navy`/`--color-navy` after this change (confirm with a search: `grep -rn "navy" src` should return nothing).

- [ ] **Step 4: Commit**

```bash
git add src/components/Footer.tsx src/styles/index.css tailwind.config.js
git commit -m "Restyle Footer as a mono strip, retire the navy accent token"
```

---

### Task 6: Cutaway progress math (pure functions)

**Files:**
- Create: `src/components/experience/cutawayMath.ts`
- Test: `src/components/experience/cutawayMath.test.ts`

**Interfaces:**
- Produces:
  - `export type CutawayMode = 'scroll' | 'tap' | 'static'`
  - `export function clamp(value: number, min?: number, max?: number): number`
  - `export function smoothstep(x: number): number`
  - `export interface CutawayValues { p: number; pi: number; po: number; pr: number }`
  - `export function computeCutawayValues(rawP: number, mode: CutawayMode): CutawayValues`
  - `export function phaseLabel(p: number): string`
  - `export function progressFromRect(top: number, height: number, viewportHeight: number): number`
- Consumes: nothing (pure module, no imports beyond types).

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { clamp, smoothstep, computeCutawayValues, phaseLabel, progressFromRect } from './cutawayMath';

describe('clamp', () => {
  it('clamps below the minimum', () => {
    expect(clamp(-0.5)).toBe(0);
  });

  it('clamps above the maximum', () => {
    expect(clamp(1.5)).toBe(1);
  });

  it('passes through in-range values', () => {
    expect(clamp(0.42)).toBe(0.42);
  });
});

describe('smoothstep', () => {
  it('maps 0 to 0 and 1 to 1', () => {
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(1)).toBe(1);
  });

  it('maps the midpoint to 0.5', () => {
    expect(smoothstep(0.5)).toBeCloseTo(0.5, 5);
  });
});

describe('computeCutawayValues', () => {
  it('is fully closed at p=0 in scroll mode', () => {
    const values = computeCutawayValues(0, 'scroll');
    expect(values).toEqual({ p: 0, pi: 0, po: 0, pr: 0 });
  });

  it('finishes the intro fade by p=0.13 in scroll mode', () => {
    expect(computeCutawayValues(0.13, 'scroll').pi).toBeCloseTo(1, 5);
  });

  it('fully opens the bay by p=0.55 in scroll mode', () => {
    expect(computeCutawayValues(0.55, 'scroll').po).toBeCloseTo(1, 5);
  });

  it('fully reveals content by p=0.76 in scroll mode', () => {
    expect(computeCutawayValues(0.76, 'scroll').pr).toBeCloseTo(1, 5);
  });

  it('is intro-visible immediately in tap and static modes, regardless of p', () => {
    expect(computeCutawayValues(0, 'tap').pi).toBe(1);
    expect(computeCutawayValues(0, 'static').pi).toBe(1);
  });

  it('clamps an out-of-range raw progress value', () => {
    expect(computeCutawayValues(-1, 'scroll').p).toBe(0);
    expect(computeCutawayValues(2, 'scroll').p).toBe(1);
  });
});

describe('phaseLabel', () => {
  it('reads HULL CLOSED below 0.12', () => {
    expect(phaseLabel(0)).toBe('HULL CLOSED');
    expect(phaseLabel(0.11)).toBe('HULL CLOSED');
  });

  it('reads LATCHES RELEASED between 0.12 and 0.3', () => {
    expect(phaseLabel(0.12)).toBe('LATCHES RELEASED');
    expect(phaseLabel(0.29)).toBe('LATCHES RELEASED');
  });

  it('reads CROWN LIFT · BELLY DROP between 0.3 and 0.55', () => {
    expect(phaseLabel(0.3)).toBe('CROWN LIFT · BELLY DROP');
    expect(phaseLabel(0.54)).toBe('CROWN LIFT · BELLY DROP');
  });

  it('reads BAY 02 EXPOSED between 0.55 and 0.9', () => {
    expect(phaseLabel(0.55)).toBe('BAY 02 EXPOSED');
    expect(phaseLabel(0.89)).toBe('BAY 02 EXPOSED');
  });

  it('reads SEQUENCE COMPLETE at 0.9 and above', () => {
    expect(phaseLabel(0.9)).toBe('SEQUENCE COMPLETE');
    expect(phaseLabel(1)).toBe('SEQUENCE COMPLETE');
  });
});

describe('progressFromRect', () => {
  it('is 0 when the section top is at the viewport top', () => {
    expect(progressFromRect(0, 1000, 800)).toBe(0);
  });

  it('is 1 when the section has scrolled fully past', () => {
    expect(progressFromRect(-200, 1000, 800)).toBe(1);
  });

  it('is 0 when the section is shorter than the viewport (no scroll span)', () => {
    expect(progressFromRect(0, 500, 800)).toBe(0);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- cutawayMath`
Expected: FAIL with "Cannot find module './cutawayMath'"

- [ ] **Step 3: Implement cutawayMath.ts**

```ts
export type CutawayMode = 'scroll' | 'tap' | 'static';

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

export function smoothstep(x: number): number {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
}

export interface CutawayValues {
  p: number;
  pi: number;
  po: number;
  pr: number;
}

export function computeCutawayValues(rawP: number, mode: CutawayMode): CutawayValues {
  const p = clamp(rawP);
  const po = smoothstep(clamp((p - 0.13) / 0.42));
  const pr = clamp((p - 0.48) / 0.28);
  const pi = mode === 'scroll' ? clamp(p / 0.13) : 1;
  return { p, pi, po, pr };
}

export function phaseLabel(p: number): string {
  if (p < 0.12) return 'HULL CLOSED';
  if (p < 0.3) return 'LATCHES RELEASED';
  if (p < 0.55) return 'CROWN LIFT · BELLY DROP';
  if (p < 0.9) return 'BAY 02 EXPOSED';
  return 'SEQUENCE COMPLETE';
}

export function progressFromRect(top: number, height: number, viewportHeight: number): number {
  const span = height - viewportHeight;
  if (span <= 0) return 0;
  return clamp(-top / span);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- cutawayMath`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/experience/cutawayMath.ts src/components/experience/cutawayMath.test.ts
git commit -m "Add pure progress math for the Experience cutaway"
```

---

### Task 7: Cutaway mode detection hook

**Files:**
- Create: `src/components/experience/useCutawayMode.ts`
- Test: `src/components/experience/useCutawayMode.test.ts`

**Interfaces:**
- Consumes: `CutawayMode` (Task 6, `./cutawayMath`).
- Produces: `export const CUTAWAY_TAP_BREAKPOINT = 768`, `export function computeCutawayMode(): CutawayMode`, `export function useCutawayMode(): CutawayMode`.

This mirrors the existing `useCanRender3D`/`computeCanRender3D` pattern (`src/hooks/useCanRender3D.ts`) — mode is resolved once (reference behavior: it's decided in `componentDidMount` and never revisited), so the hook has no effect/listener, just a `useState` seeded from the pure function.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeCutawayMode } from './useCutawayMode';

function mockMatchMedia({ reduced = false, coarse = false }: { reduced?: boolean; coarse?: boolean }) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('reduced-motion') ? reduced : query.includes('pointer: coarse') ? coarse : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe('computeCutawayMode', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1440 });
  });

  it('returns static when the user prefers reduced motion', () => {
    mockMatchMedia({ reduced: true });
    expect(computeCutawayMode()).toBe('static');
  });

  it('returns tap on a coarse pointer even at a wide viewport', () => {
    mockMatchMedia({ coarse: true });
    expect(computeCutawayMode()).toBe('tap');
  });

  it('returns tap on a narrow viewport even with a fine pointer', () => {
    mockMatchMedia({});
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    expect(computeCutawayMode()).toBe('tap');
  });

  it('returns scroll on a wide viewport with a fine pointer and no reduced-motion preference', () => {
    mockMatchMedia({});
    expect(computeCutawayMode()).toBe('scroll');
  });

  it('prefers static over tap when both reduced-motion and coarse pointer are set', () => {
    mockMatchMedia({ reduced: true, coarse: true });
    expect(computeCutawayMode()).toBe('static');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- useCutawayMode`
Expected: FAIL with "Cannot find module './useCutawayMode'"

- [ ] **Step 3: Implement useCutawayMode.ts**

```ts
import { useState } from 'react';
import type { CutawayMode } from './cutawayMath';

export const CUTAWAY_TAP_BREAKPOINT = 768;

export function computeCutawayMode(): CutawayMode {
  if (typeof window === 'undefined') return 'static';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return 'static';
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.innerWidth < CUTAWAY_TAP_BREAKPOINT;
  return coarse || narrow ? 'tap' : 'scroll';
}

export function useCutawayMode(): CutawayMode {
  const [mode] = useState<CutawayMode>(computeCutawayMode);
  return mode;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- useCutawayMode`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/experience/useCutawayMode.ts src/components/experience/useCutawayMode.test.ts
git commit -m "Add cutaway interaction-mode detection (scroll/tap/static)"
```

---

### Task 8: Plane cutaway SVG art

**Files:**
- Create: `src/components/experience/PlaneCutawaySvg.tsx`
- Test: `src/components/experience/PlaneCutawaySvg.test.tsx`

**Interfaces:**
- Consumes: nothing (pure presentational component, no props). Reads `var(--amber)`, `var(--pi)`, `var(--po)`, `var(--detail)` CSS custom properties from its nearest ancestor (set by `Experience.tsx` in Task 9) — falls back to each `var(...)`'s declared default (`0`/`1`) when rendered standalone, e.g. in this task's own test.
- Produces: `export function PlaneCutawaySvg(): JSX.Element` — a CRJ-900 side-elevation cutaway, ported 1:1 from the reference's `<svg viewBox="0 0 1600 420">`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlaneCutawaySvg } from './PlaneCutawaySvg';

describe('PlaneCutawaySvg', () => {
  it('renders the cargo and avionics bay labels', () => {
    render(<PlaneCutawaySvg />);
    expect(screen.getByText('CARGO')).toBeInTheDocument();
    expect(screen.getByText('AVIONICS')).toBeInTheDocument();
  });

  it('renders the wingspan dimension callout', () => {
    render(<PlaneCutawaySvg />);
    expect(screen.getByText('36.40 m')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- PlaneCutawaySvg`
Expected: FAIL with "Cannot find module './PlaneCutawaySvg'"

- [ ] **Step 3: Implement PlaneCutawaySvg.tsx**

```tsx
// CRJ-900 side-elevation cutaway, ported from the design reference.
// Purely presentational: every dynamic bit is a CSS custom property
// (--pi intro, --po opening amount, --detail rivet-line toggle, --amber
// accent color) set by the caller (Experience.tsx) on an ancestor element.
export function PlaneCutawaySvg() {
  return (
    <svg
      viewBox="0 0 1600 420"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="skinUp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d4a5c" />
          <stop offset="55%" stopColor="#232c3a" />
          <stop offset="100%" stopColor="#161d28" />
        </linearGradient>
        <linearGradient id="skinDn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b222e" />
          <stop offset="45%" stopColor="#2a3341" />
          <stop offset="100%" stopColor="#38445a" />
        </linearGradient>
      </defs>

      <g style={{ opacity: 'calc(var(--pi, 0) - var(--po, 0) * 1.6)' }} stroke="#3f4d61" strokeWidth={1} fill="none">
        <path d="M 62 96 H 1580" strokeDasharray="6 6" />
        <path d="M 62 88 V 104 M 1580 88 V 104" />
        <text
          x={820}
          y={84}
          fill="#7e8da0"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, letterSpacing: '.14em' }}
          textAnchor="middle"
          stroke="none"
        >
          36.40 m
        </text>
        <path d="M 40 168 H 20 M 40 258 H 20 M 26 168 V 258" strokeDasharray="4 5" />
      </g>

      <g
        strokeLinecap="round"
        fill="none"
        vectorEffect="non-scaling-stroke"
        style={{
          transform: 'scaleY(calc(1 + var(--po, 0) * 10))',
          transformOrigin: '800px 210px',
          transformBox: 'view-box',
          opacity: 'calc(var(--po, 0) * 1.3)',
        }}
      >
        <path
          d="M 348 190 V 230 M 394 188 V 232 M 440 188 V 232 M 486 188 V 232 M 532 188 V 232 M 578 188 V 232 M 624 188 V 232 M 670 188 V 232 M 716 188 V 232 M 762 188 V 232 M 808 188 V 232 M 854 188 V 232 M 900 188 V 232 M 946 188 V 232 M 992 188 V 232 M 1038 188 V 232 M 1084 188 V 232 M 1126 190 V 230"
          stroke="#48586e"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        <path d="M 340 222 H 1132" stroke="#5c6f88" strokeWidth={1} strokeDasharray="14 8" vectorEffect="non-scaling-stroke" />
        <path d="M 340 198 H 1132" stroke="#3b4859" strokeWidth={1} strokeDasharray="3 7" vectorEffect="non-scaling-stroke" />
      </g>

      {/* Lower fuselage — cargo bay */}
      <g
        style={{
          transform: 'translateY(calc(var(--po, 0) * 212px)) rotate(calc(var(--po, 0) * 1.1deg))',
          transformOrigin: '1160px 240px',
          transformBox: 'view-box',
        }}
      >
        <path
          d="M 330 210 L 330 258 C 520 265, 900 265, 1140 258 C 1240 251, 1300 234, 1342 214 L 1342 210 Z"
          fill="url(#skinDn)"
          stroke="#66768e"
          strokeWidth={1.4}
        />
        <path d="M 640 256 C 730 272, 880 276, 1010 259 Z" fill="#2b3441" stroke="#66768e" strokeWidth={1} opacity={0.9} />
        <path
          d="M 672 260 C 760 272, 890 268, 1010 250 L 1058 240 C 962 250, 830 258, 718 257 Z"
          fill="#212a37"
          stroke="#6b7c94"
          strokeWidth={1.2}
        />
        <path d="M 1054 241 L 1076 228 L 1080 235 L 1060 247 Z" fill="#28313f" stroke="#7b8ca6" strokeWidth={1} />
        <path d="M 736 264 C 830 270, 920 265, 1006 252" fill="none" stroke="#4d5b70" strokeWidth={1} opacity={0.8} />
        <path d="M 706 262 L 682 288 L 712 288 L 734 264 Z" fill="#1b2330" stroke="#5d6c82" strokeWidth={1.1} />
        <path d="M 812 265 L 790 288 L 818 288 L 840 266 Z" fill="#1b2330" stroke="#5d6c82" strokeWidth={1.1} />
        <g style={{ opacity: 'calc(var(--detail, 1) * 1)' }}>
          <path d="M 348 244 H 1120" stroke="#7b8ca6" strokeWidth={1.6} strokeDasharray="1.5 11" opacity={0.5} />
          <path d="M 352 226 H 1116" stroke="#7b8ca6" strokeWidth={1.6} strokeDasharray="1.5 11" opacity={0.32} />
          <path
            d="M 420 214 V 258 M 560 214 V 260 M 700 214 V 262 M 840 214 V 262 M 980 214 V 260 M 1090 214 V 256"
            stroke="#4d5b70"
            strokeWidth={1}
            opacity={0.7}
          />
        </g>
        <rect x={1010} y={228} width={96} height={26} rx={2} fill="none" stroke="var(--amber)" strokeWidth={1.1} opacity={0.8} />
        <text
          x={1058}
          y={246}
          fill="var(--amber)"
          textAnchor="middle"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.1em' }}
        >
          CARGO
        </text>
      </g>

      {/* Upper fuselage — avionics bay */}
      <g
        style={{
          transform: 'translateY(calc(var(--po, 0) * -212px)) rotate(calc(var(--po, 0) * -1.3deg))',
          transformOrigin: '1160px 180px',
          transformBox: 'view-box',
        }}
      >
        <path
          d="M 330 210 L 330 168 C 520 161, 900 161, 1140 166 C 1232 171, 1300 184, 1342 206 L 1342 210 Z"
          fill="url(#skinUp)"
          stroke="#7b8ca6"
          strokeWidth={1.4}
        />
        <path d="M 690 158 L 700 138 L 706 138 L 704 158 Z" fill="#28313f" stroke="#8698b0" strokeWidth={1} />
        <path d="M 468 160 L 476 150 L 480 160 Z" fill="#28313f" stroke="#8698b0" strokeWidth={1} />
        <path d="M 372 184 H 1108" stroke="#0d1420" strokeWidth={11} strokeDasharray="10 26" strokeLinecap="round" />
        <path d="M 372 184 H 1108" stroke="#8fa2bb" strokeWidth={13} strokeDasharray="0.8 35.2" strokeLinecap="round" opacity={0.45} />
        <g style={{ opacity: 'calc(var(--detail, 1) * 1)' }}>
          <path d="M 348 172 H 1120" stroke="#9fb0c8" strokeWidth={1.6} strokeDasharray="1.5 11" opacity={0.55} />
          <path d="M 352 200 H 1116" stroke="#9fb0c8" strokeWidth={1.6} strokeDasharray="1.5 11" opacity={0.3} />
          <path
            d="M 420 166 V 208 M 560 164 V 208 M 700 163 V 208 M 840 163 V 208 M 980 164 V 208 M 1090 167 V 208"
            stroke="#55647a"
            strokeWidth={1}
            opacity={0.7}
          />
        </g>
        <rect x={342} y={166} width={34} height={44} rx={3} fill="none" stroke="#a3b4cc" strokeWidth={1.2} opacity={0.85} />
        <rect x={1082} y={168} width={30} height={40} rx={3} fill="none" stroke="#8090a8" strokeWidth={1.1} opacity={0.6} />
        <rect x={470} y={174} width={96} height={24} rx={2} fill="none" stroke="var(--amber)" strokeWidth={1.1} opacity={0.8} />
        <text
          x={518}
          y={190}
          fill="var(--amber)"
          textAnchor="middle"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.1em' }}
        >
          AVIONICS
        </text>
      </g>

      {/* Nose */}
      <g>
        <path
          d="M 58 230 C 76 206, 118 182, 186 171 L 332 166 L 332 264 L 214 261 C 132 255, 82 243, 58 230 Z"
          fill="url(#skinUp)"
          stroke="#7b8ca6"
          strokeWidth={1.4}
        />
        <path d="M 126 184 C 112 202, 110 238, 124 252" fill="none" stroke="#8fa2bb" strokeWidth={1.1} opacity={0.8} />
        <path d="M 146 183 C 172 175, 200 171, 226 170" fill="none" stroke="#9fb0c8" strokeWidth={1} opacity={0.55} />
        <path d="M 166 186 L 216 180 L 222 199 L 172 203 Z" fill="#0e1523" stroke="#a3b4cc" strokeWidth={1.1} />
        <path d="M 146 192 L 163 187 L 168 203 L 148 205 Z" fill="#0e1523" stroke="#a3b4cc" strokeWidth={1} />
        <path d="M 228 179 L 252 177 L 254 194 L 230 196 Z" fill="#101826" stroke="#8fa2bb" strokeWidth={1} opacity={0.9} />
        <path d="M 158 249 L 208 251 L 208 262 L 158 260 Z" fill="none" stroke="#6b7c94" strokeWidth={1} strokeDasharray="5 4" />
        <path d="M 104 214 L 86 210 M 104 233 L 84 234" stroke="#9fb0c8" strokeWidth={1.4} strokeLinecap="round" />
        <path d="M 112 216 H 300" stroke="#9fb0c8" strokeWidth={1.5} strokeDasharray="1.5 11" opacity="calc(var(--detail, 1) * .45)" />
        <path d="M 252 168 V 259 M 292 167 V 260" stroke="#55647a" strokeWidth={1} opacity={0.55} />
      </g>

      {/* Tail */}
      <g>
        <path
          d="M 1342 204 C 1404 196, 1464 178, 1520 158 L 1558 144 L 1564 155 L 1524 172 C 1462 200, 1398 214, 1342 214 Z"
          fill="url(#skinUp)"
          stroke="#7b8ca6"
          strokeWidth={1.3}
        />
        <path d="M 1558 144 L 1576 139 C 1582 141, 1582 150, 1576 152 L 1564 155 Z" fill="#151b26" stroke="#8698b0" strokeWidth={1} />
        <path
          d="M 1390 205 C 1420 190, 1442 168, 1456 146 L 1476 151 C 1458 178, 1428 200, 1398 211 Z"
          fill="#1f2734"
          stroke="#7b8ca6"
          strokeWidth={1}
        />
        <path d="M 1412 201 L 1506 52 L 1556 50 L 1502 203 Z" fill="#1e2532" stroke="#8698b0" strokeWidth={1.3} />
        <path d="M 1486 201 L 1542 54" fill="none" stroke="#6b7c94" strokeWidth={1} strokeDasharray="6 5" />
        <path d="M 1442 142 L 1524 140 M 1462 100 L 1536 98" stroke="#55647a" strokeWidth={1} opacity={0.6} />
        <path
          d="M 1462 56 L 1548 41 C 1562 39, 1568 43, 1560 48 L 1470 67 Z"
          fill="#232c3a"
          stroke="#8698b0"
          strokeWidth={1.2}
        />
        <path d="M 1504 50 L 1552 43" stroke="#6b7c94" strokeWidth={1} strokeDasharray="6 5" opacity={0.8} />
        <rect x={1492} y={38} width={66} height={22} rx={11} fill="#28313f" stroke="#8698b0" strokeWidth={1.1} />
        <path d="M 1396 213 L 1416 238 L 1444 238 L 1426 209 Z" fill="#212a37" stroke="#7b8ca6" strokeWidth={1} />
        <path
          d="M 1214 152 C 1214 133, 1236 124, 1264 124 L 1348 126 C 1372 128, 1384 139, 1384 154 C 1384 170, 1370 181, 1346 182 L 1258 182 C 1232 182, 1214 171, 1214 152 Z"
          fill="#28313f"
          stroke="#8698b0"
          strokeWidth={1.3}
        />
        <path d="M 1219 141 C 1228 130, 1245 125, 1264 124" fill="none" stroke="#b4c4d8" strokeWidth={1.4} />
        <path
          d="M 1264 124 L 1259 182 M 1312 126 L 1310 182 M 1338 127 L 1336 181"
          stroke="#6b7c94"
          strokeWidth={1}
          opacity={0.85}
        />
        <path d="M 1384 143 L 1412 148 L 1412 161 L 1384 166 Z" fill="#161d28" stroke="#8698b0" strokeWidth={1} />
        <path d="M 1280 182 L 1302 208 L 1342 208 L 1348 182 Z" fill="#242d3b" stroke="#7b8ca6" strokeWidth={1.1} />
      </g>
    </svg>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- PlaneCutawaySvg`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/experience/PlaneCutawaySvg.tsx src/components/experience/PlaneCutawaySvg.test.tsx
git commit -m "Port the CRJ-900 cutaway SVG art from the design reference"
```

---

### Task 9: Rewrite Experience around the plane cutaway

**Files:**
- Modify: `src/components/Experience.tsx`
- Modify: `src/components/Experience.test.tsx`

**Interfaces:**
- Consumes: `experience`, `education` (`../data/experience`, unchanged), `computeCutawayValues`/`phaseLabel`/`progressFromRect` (Task 6), `useCutawayMode` (Task 7), `PlaneCutawaySvg` (Task 8).
- Produces: `Experience` component, unchanged export name, `id="experience"` section. No longer renders `secondaryProjects` (moved to `Projects` in Task 10).

- [ ] **Step 1: Write the failing test first**

Replace `src/components/Experience.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Experience } from './Experience';
import { experience, education } from '../data/experience';

describe('Experience', () => {
  it('renders the Mitsubishi role with its dates', () => {
    render(<Experience />);
    expect(screen.getByText(`${experience[0].role} · ${experience[0].company}`)).toBeInTheDocument();
    expect(screen.getByText(`${experience[0].start} – ${experience[0].end}`)).toBeInTheDocument();
  });

  it('renders every highlight bullet for the role', () => {
    render(<Experience />);
    experience[0].highlights.forEach((line) => {
      expect(screen.getByText(line)).toBeInTheDocument();
    });
  });

  it('renders the education line', () => {
    render(<Experience />);
    expect(
      screen.getByText(`${education.program}, ${education.school} · ${education.graduation}`)
    ).toBeInTheDocument();
  });

  it('renders the initial cutaway phase and progress readout', () => {
    render(<Experience />);
    expect(screen.getByText('HULL CLOSED')).toBeInTheDocument();
    expect(screen.getByText('00%')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- Experience`
Expected: FAIL — the current `Experience.tsx` still renders `secondaryProjects` and the old bullet-list markup, and has no phase/progress readout, so several of these queries won't match.

- [ ] **Step 3: Implement the new Experience.tsx**

```tsx
import { useEffect, useRef, useState } from 'react';
import { experience, education } from '../data/experience';
import { PlaneCutawaySvg } from './experience/PlaneCutawaySvg';
import { useCutawayMode } from './experience/useCutawayMode';
import { computeCutawayValues, phaseLabel, progressFromRect } from './experience/cutawayMath';

const role = experience[0];

export function Experience() {
  const mode = useCutawayMode();
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const [open, setOpen] = useState(mode === 'static');
  const [readout, setReadout] = useState(0);
  const [phase, setPhase] = useState(() => phaseLabel(mode === 'static' ? 1 : 0));

  const applyP = (rawP: number) => {
    const el = trackRef.current;
    if (!el) return;
    const { p, pi, po, pr } = computeCutawayValues(rawP, mode);
    el.style.setProperty('--pi', pi.toFixed(4));
    el.style.setProperty('--po', po.toFixed(4));
    el.style.setProperty('--pr', pr.toFixed(4));
    const nextReadout = Math.round(p * 100);
    setReadout((prev) => (prev === nextReadout ? prev : nextReadout));
    const nextPhase = phaseLabel(p);
    setPhase((prev) => (prev === nextPhase ? prev : nextPhase));
  };

  useEffect(() => {
    if (mode !== 'scroll') {
      applyP(mode === 'static' ? 1 : 0);
      return;
    }
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const el = trackRef.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          applyP(progressFromRect(rect.top, rect.height, window.innerHeight));
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  const onTap = () => {
    if (mode === 'static') return;
    const from = open ? 1 : 0;
    const to = open ? 0 : 1;
    setOpen(!open);
    const start = performance.now();
    const duration = 900;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      applyP(from + (to - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const trackHeight = mode === 'scroll' ? '360vh' : '110vh';
  const hint =
    mode === 'static'
      ? 'CUTAWAY SHOWN OPEN — REDUCED MOTION'
      : mode === 'tap'
        ? open
          ? 'TAP TO CLOSE'
          : 'TAP TO OPEN'
        : 'SCROLL TO OPEN';

  return (
    <section id="experience" className="relative bg-[#07090d]" style={{ height: trackHeight }}>
      <div ref={trackRef} className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(96,128,180,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(96,128,180,0.05)_1px,transparent_1px)] bg-[length:48px_48px]"
        />

        <div className="absolute left-8 right-8 top-8 flex items-start justify-between gap-5 font-mono text-[10px] tracking-widest text-ink-dim">
          <div>
            <div className="text-accent-text">§ 01 · EXPERIENCE</div>
            <div className="mt-2">CRJ-900 · SIDE ELEVATION · CUTAWAY SEQUENCE</div>
            <div className="mt-2 animate-pulse text-amber-signal">{hint}</div>
          </div>
          <div className="text-right">
            <div>{phase}</div>
            <div className="mt-2 flex items-center justify-end gap-2.5">
              <div className="h-0.5 w-[120px] overflow-hidden bg-border">
                <div
                  className="h-full origin-left bg-amber-signal"
                  style={{ transform: `scaleX(${readout / 100})` }}
                />
              </div>
              <span className="inline-block w-9 text-right">{String(readout).padStart(2, '0')}%</span>
            </div>
          </div>
        </div>

        <div className="relative w-[min(1560px,96vw)]">
          <div
            className="relative w-full"
            style={{
              aspectRatio: '1600 / 420',
              containerType: 'size',
              transform: 'scale(calc(0.955 + var(--pi, 0) * 0.045))',
              opacity: 'calc(0.15 + var(--pi, 0) * 0.85)',
            }}
          >
            <PlaneCutawaySvg />

            <div
              className="absolute overflow-hidden"
              style={{
                left: '20.8%',
                right: '29.2%',
                top: '50%',
                transform: 'translateY(-50%)',
                height: 'calc(var(--po, 0) * 101%)',
                background: 'linear-gradient(180deg, rgba(9,13,20,0.94), rgba(11,17,27,0.97))',
                borderTop: '1px solid rgba(120,140,170,0.22)',
                borderBottom: '1px solid rgba(120,140,170,0.22)',
              }}
            >
              <div style={{ padding: '5cqh 3cqw', opacity: 'calc(var(--pr, 0) * 1.4)' }}>
                <div className="flex items-baseline justify-between gap-4 border-b border-[rgba(120,140,170,0.16)] pb-[2.5cqh] font-mono text-[clamp(9px,4cqh,14px)] tracking-widest text-ink-dim">
                  <span>STA 210 · CABIN BAY 02 · EXPERIENCE</span>
                  <span className="text-amber-signal">● OPEN</span>
                </div>
                <div className="mt-[2cqh] flex flex-wrap items-baseline gap-x-[2cqw] gap-y-[1.5cqh]">
                  <div className="font-mono text-[clamp(9px,4.2cqh,14px)] tracking-widest text-ink-dim">
                    {role.start} – {role.end}
                  </div>
                  <div className="font-display text-[clamp(14px,8cqh,26px)] font-semibold text-ink">
                    {role.role} · {role.company}
                  </div>
                  <div className="font-mono text-[clamp(8px,3.6cqh,13px)] tracking-widest text-ink-dim">
                    {role.location.toUpperCase()}
                  </div>
                </div>
                <div className="mt-[3cqh] grid grid-cols-2 gap-x-[3cqw] gap-y-[1.6cqh] text-[clamp(10px,4.2cqh,15px)] leading-snug text-ink">
                  {role.highlights.map((line, i) => (
                    <div
                      key={line}
                      className="flex gap-2.5"
                      style={{
                        opacity: `calc((var(--pr, 0) - ${(i * 0.08).toFixed(2)}) * 3.4)`,
                        transform: 'translateY(calc((1 - var(--pr, 0)) * 12px))',
                      }}
                    >
                      <span className="pt-0.5 font-mono text-[clamp(8px,3.4cqh,12px)] text-accent-text">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {mode === 'tap' && (
            <button
              type="button"
              onClick={onTap}
              className="mx-auto mt-6 block rounded border border-amber-signal px-5 py-3 font-mono text-[11px] tracking-widest text-amber-signal"
            >
              {open ? 'TAP TO CLOSE CUTAWAY' : 'TAP TO OPEN CUTAWAY'}
            </button>
          )}
        </div>

        <div className="absolute bottom-8 left-8 right-8 flex justify-between font-mono text-[9px] tracking-widest text-ink-dim">
          <span>
            {education.program}, {education.school} · {education.graduation}
          </span>
          <span>SHEET 01 / REV —</span>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- Experience`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Experience.tsx src/components/Experience.test.tsx
git commit -m "Rebuild Experience around a real scroll-driven plane cutaway"
```

---

### Task 10: Build the Projects carousel, retire FeaturedProject

**Files:**
- Create: `src/components/Projects.tsx`
- Create: `src/components/Projects.test.tsx`
- Delete: `src/components/FeaturedProject.tsx`
- Delete: `src/components/FeaturedProject.test.tsx`
- Modify: `src/test/setup.ts`

**Interfaces:**
- Consumes: `featuredProject`, `secondaryProjects` (`../data/projects`, unchanged), `FeaturedCaseStudy`, `ProjectEntry` (`../data/types`, unchanged), `cardSurface`, `chipStamped` (`../styles/shared`, Task 1), `Reveal` (unchanged), `useReducedMotion` (`framer-motion`, already a dependency).
- Produces: `export function Projects(): JSX.Element`, `id="projects"` section.

- [ ] **Step 1: Add a ResizeObserver stub to the test setup**

`Projects` measures its rail with `ResizeObserver`, which jsdom doesn't implement. Append to `src/test/setup.ts` (same pattern as the existing `IntersectionObserver` stub already in that file):

```ts
class DefaultResizeObserver implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!('ResizeObserver' in globalThis)) {
  // jsdom has no runtime ResizeObserver either — same rationale as the
  // IntersectionObserver stub above.
  globalThis.ResizeObserver = DefaultResizeObserver;
}
```

- [ ] **Step 2: Write the failing tests**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Projects } from './Projects';
import { featuredProject, secondaryProjects } from '../data/projects';

describe('Projects', () => {
  it('renders every slide name', () => {
    render(<Projects />);
    expect(screen.getByText(featuredProject.name)).toBeInTheDocument();
    secondaryProjects.forEach((project) => {
      expect(screen.getByText(project.name)).toBeInTheDocument();
    });
  });

  it('starts on the featured slide with Previous disabled and Next enabled', () => {
    render(<Projects />);
    expect(screen.getByRole('button', { name: 'Previous project' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next project' })).not.toBeDisabled();
    expect(screen.getByText('01 / 04')).toBeInTheDocument();
  });

  it('renders the CraftTraq case study details on the featured slide', () => {
    render(<Projects />);
    expect(screen.getByText(featuredProject.problem)).toBeInTheDocument();
    expect(screen.getByText(featuredProject.decision.body)).toBeInTheDocument();
  });

  it('moves to the next slide and updates the counter and active chip', () => {
    render(<Projects />);
    fireEvent.click(screen.getByRole('button', { name: 'Next project' }));
    expect(screen.getByText('02 / 04')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /02 PORTFOLIO RISK DASHBOARD/ })).toHaveAttribute(
      'aria-current',
      'true'
    );
  });

  it('jumps to a slide when its chip is clicked, and disables Next at the last slide', () => {
    render(<Projects />);
    fireEvent.click(screen.getByRole('button', { name: /04 EYE-MOUSE/ }));
    expect(screen.getByText('04 / 04')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next project' })).toBeDisabled();
  });

  it('navigates with the right arrow key while the section is in view', () => {
    render(<Projects />);
    const rect: DOMRect = {
      top: 100,
      bottom: 700,
      left: 0,
      right: 0,
      width: 0,
      height: 600,
      x: 0,
      y: 100,
      toJSON: () => ({}),
    };
    Element.prototype.getBoundingClientRect = () => rect;
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('02 / 04')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- Projects`
Expected: FAIL with "Cannot find module './Projects'"

- [ ] **Step 4: Implement Projects.tsx**

```tsx
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { useReducedMotion } from 'framer-motion';
import { featuredProject, secondaryProjects } from '../data/projects';
import { Reveal } from './Reveal';
import { cardSurface, chipStamped } from '../styles/shared';
import type { FeaturedCaseStudy, ProjectEntry } from '../data/types';

type Slide = FeaturedCaseStudy | ProjectEntry;

const slides: Slide[] = [featuredProject, ...secondaryProjects];

function isFeatured(slide: Slide): slide is FeaturedCaseStudy {
  return slide.id === featuredProject.id;
}

export function Projects() {
  const [index, setIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const dragX = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();

  const goTo = (next: number) => {
    setIndex(Math.max(0, Math.min(slides.length - 1, next)));
  };

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setSlideWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.bottom < window.innerHeight * 0.35 || rect.top > window.innerHeight * 0.65) return;
      e.preventDefault();
      goTo(index + (e.key === 'ArrowRight' ? 1 : -1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dragX.current = e.clientX;
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (dragX.current === null) return;
    const dx = e.clientX - dragX.current;
    dragX.current = null;
    if (Math.abs(dx) > 48) goTo(index + (dx < 0 ? 1 : -1));
  };

  return (
    <section id="projects" ref={sectionRef} className="bg-surface px-6 py-section">
      <Reveal>
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-mono text-xs tracking-widest text-accent-text">§ 02 · PROJECTS</p>
              <h2 className="mt-3 font-display text-display-md text-ink">Four builds, one flight line.</h2>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px] tracking-widest text-ink-dim">
              <span aria-live="polite">
                {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </span>
              <button
                type="button"
                aria-label="Previous project"
                disabled={index === 0}
                onClick={() => goTo(index - 1)}
                className="h-8 w-9 rounded border border-border text-ink-dim transition-colors hover:border-accent-text hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
              >
                ←
              </button>
              <button
                type="button"
                aria-label="Next project"
                disabled={index === slides.length - 1}
                onClick={() => goTo(index + 1)}
                className="h-8 w-9 rounded border border-border text-ink-dim transition-colors hover:border-accent-text hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
              >
                →
              </button>
            </div>
          </div>

          <div
            ref={viewportRef}
            className="mt-10 overflow-hidden"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
          >
            <div
              className="flex items-start gap-6"
              style={{
                transform: `translateX(-${index * slideWidth}px)`,
                transition: reduceMotion ? 'none' : 'transform 0.6s cubic-bezier(.22,.61,.36,1)',
              }}
            >
              {slides.map((slide, i) => (
                <article
                  key={slide.id}
                  style={{ flex: slideWidth ? `0 0 ${slideWidth}px` : '0 0 100%' }}
                  className={`${cardSurface} p-6 transition-opacity duration-300 ${
                    i === index ? 'opacity-100' : 'opacity-30'
                  }`}
                >
                  {isFeatured(slide) ? (
                    <>
                      <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3 font-mono text-[10px] tracking-widest text-ink-dim">
                        <span>01 · FEATURED BUILD</span>
                        <span className={chipStamped}>Live</span>
                      </div>
                      <h3 className="mt-5 font-display text-3xl text-ink">{slide.name}</h3>
                      <p className="mt-1 text-sm text-ink-dim">{slide.tagline}</p>
                      <picture>
                        <source srcSet={slide.screenshot.webp} type="image/webp" />
                        <img
                          src={slide.screenshot.src}
                          alt={slide.screenshot.alt}
                          loading="lazy"
                          className="mt-6 w-full rounded-lg border border-border"
                        />
                      </picture>
                      <div className="mt-6 grid gap-6 md:grid-cols-2">
                        <div>
                          <h4 className="font-mono text-[10px] tracking-widest text-ink-dim">PROBLEM</h4>
                          <p className="mt-2 text-sm text-ink">{slide.problem}</p>
                        </div>
                        <div>
                          <h4 className="font-mono text-[10px] tracking-widest text-ink-dim">APPROACH</h4>
                          <ul className="mt-2 space-y-2 text-sm text-ink">
                            {slide.approach.map((line) => (
                              <li key={line}>{line}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-mono text-[10px] tracking-widest text-ink-dim">
                            {slide.decision.title.toUpperCase()}
                          </h4>
                          <p className="mt-2 text-sm text-ink">{slide.decision.body}</p>
                        </div>
                        <div>
                          <h4 className="font-mono text-[10px] tracking-widest text-ink-dim">SCOPE</h4>
                          <ul className="mt-2 space-y-1 text-sm text-ink-dim">
                            {slide.scope.map((line) => (
                              <li key={line}>{line}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <p className="mt-6 font-mono text-xs tracking-widest text-accent-text">{slide.outcome}</p>
                    </>
                  ) : (
                    <>
                      <div className="border-b border-border pb-3 font-mono text-[10px] tracking-widest text-ink-dim">
                        {String(i + 1).padStart(2, '0')} · ALSO BUILT
                      </div>
                      <h3 className="mt-5 font-display text-2xl text-ink">{slide.name}</h3>
                      <p className="mt-1 max-w-[56ch] text-sm leading-relaxed text-ink-dim">{slide.tagline}</p>
                      {slide.image && (
                        <img
                          src={slide.image}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          className="mt-6 aspect-[21/9] w-full rounded-lg border border-border object-cover"
                        />
                      )}
                      <div className="mt-6 flex flex-wrap gap-2 font-mono text-[10.5px] tracking-wide text-accent-text">
                        {slide.stack.map((tech) => (
                          <span key={tech} className="rounded border border-border px-2.5 py-1">
                            {tech}
                          </span>
                        ))}
                      </div>
                      {slide.href && (
                        <a
                          href={slide.href}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-6 inline-block font-mono text-xs tracking-widest text-accent-text"
                        >
                          View on GitHub ↗
                        </a>
                      )}
                    </>
                  )}
                </article>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2.5 font-mono text-[10.5px] tracking-wide">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-current={i === index ? 'true' : undefined}
                onClick={() => goTo(i)}
                className={`rounded border px-3 py-1.5 transition-colors ${
                  i === index ? 'border-accent-text text-ink' : 'border-border text-ink-dim'
                }`}
              >
                {String(i + 1).padStart(2, '0')} {slide.name.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- Projects`
Expected: PASS

- [ ] **Step 6: Delete FeaturedProject**

```bash
git rm src/components/FeaturedProject.tsx src/components/FeaturedProject.test.tsx
```

- [ ] **Step 7: Commit**

```bash
git add src/components/Projects.tsx src/components/Projects.test.tsx src/test/setup.ts
git commit -m "Add sliding Projects carousel, retire FeaturedProject"
```

---

### Task 11: Reorder App sections

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `NavRail` (Task 4), `Hero` (Task 3), `Experience` (Task 9), `Projects` (Task 10), `Skills`/`Contact`/`Footer` (unchanged), `MotionConfig` (`framer-motion`, unchanged).
- Produces: `App` component, unchanged export.

- [ ] **Step 1: Update the failing test first**

Replace `src/App.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { App } from './App';

vi.mock('./hooks/useCanRender3D', () => ({ useCanRender3D: () => false }));

describe('App', () => {
  it('renders every section in order with the correct anchor ids', () => {
    const { container } = render(<App />);
    const ids = Array.from(container.querySelectorAll('section')).map((el) => el.id);
    expect(ids).toEqual(['hero', 'experience', 'projects', 'skills', 'contact']);
  });

  it('renders the nav rail', () => {
    const { container } = render(<App />);
    expect(container.querySelector('nav[aria-label="Section navigation"]')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- App.test`
Expected: FAIL — the current `App.tsx` still renders `['hero', 'work', 'experience', 'skills', 'contact']`.

- [ ] **Step 3: Reorder App.tsx**

```tsx
import { MotionConfig } from 'framer-motion';
import { NavRail } from './components/NavRail';
import { Hero } from './components/Hero';
import { Experience } from './components/Experience';
import { Projects } from './components/Projects';
import { Skills } from './components/Skills';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

export function App() {
  return (
    // reducedMotion="user" is the global safety net: every motion.* element
    // below automatically drops its x/y/scale/rotate animation (keeping
    // opacity fades) for anyone with prefers-reduced-motion set.
    <MotionConfig reducedMotion="user">
      <div className="bg-bg">
        <NavRail />
        <main>
          <Hero />
          <Experience />
          <Projects />
          <Skills />
          <Contact />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- App.test`
Expected: PASS

- [ ] **Step 5: Run the entire suite**

Run: `npm test`
Expected: PASS — every test file in the project, confirming the full restyle is internally consistent.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "Reorder sections: Hero, Experience, Projects, Skills, Contact"
```

---

### Task 12: Repo cleanup

**Files:**
- Delete: `crafttraq.png` (repo root)
- Delete: `hero.jpg` (repo root)
- Modify: `.gitignore`

**Interfaces:** none — this task touches no source.

These two root-level files are stray duplicates from an earlier `git add .` (the real copies the app actually imports/serves live at `public/crafttraq.png` / `public/crafttraq.webp` and `src/assets/hero.jpg`) — nothing in `src` imports a root-level path, so removing them changes no behavior.

- [ ] **Step 1: Confirm nothing references the root-level copies**

Run: `grep -rn "\"/hero.jpg\"\|'/hero.jpg'\|\"/crafttraq.png\"\|'/crafttraq.png'" src index.html`
Expected: no matches outside `public/`-relative paths already used by `src/data/projects.ts` (`/crafttraq.png` there resolves to `public/crafttraq.png` at build time, not the root-level duplicate).

- [ ] **Step 2: Remove the stray duplicates**

```bash
git rm crafttraq.png hero.jpg
```

- [ ] **Step 3: Keep the standalone design reference out of version control**

Append to `.gitignore`:

```
Searan Kuganesan Portfolio (standalone)*.html
```

- [ ] **Step 4: Run the full suite one last time**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .gitignore
git commit -m "Clean up stray duplicate assets, ignore the standalone design reference"
```
