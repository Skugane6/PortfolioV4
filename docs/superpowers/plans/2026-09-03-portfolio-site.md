# Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Searan Kuganesan's single-page portfolio site — dark atmospheric minimalism direction, ambient particle-field hero, CraftTraq case study, all content sourced from his real resume and app screenshot.

**Architecture:** A Vite + React 18 + TypeScript SPA. Static typed data files (`experience.ts`, `projects.ts`, `skills.ts`) feed presentational section components, assembled by `App.tsx` in one scrollable page with anchor sections (`#hero #work #experience #skills #contact`). The only dynamic behavior is a scroll-driven active-section nav rail and a lazy-loaded R3F particle field in the hero, gated by a reduced-motion/viewport check with a static CSS fallback.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS (custom token theme, no default palette), Framer Motion, @react-three/fiber + @react-three/drei + three, Vitest + @testing-library/react + jsdom, sharp (one-off image optimization script).

**Spec:** `docs/superpowers/specs/2026-09-03-portfolio-design.md`

## Global Constraints

- Single page, anchor-scrolled, no React Router — section ids exactly `hero`, `work`, `experience`, `skills`, `contact`.
- Design tokens are fixed (defined in Task 1, used everywhere, never a default Tailwind color): `void #0a0a0c`, `raised #141417`, `ink #f5f4f0`, `ink-dim #9a9a9e`, `accent #ff5a1f`, `accent-text #ffb27a`.
- `accent-text` must be verified ≥4.5:1 contrast against `void` (WCAG AA) — enforced by an automated test, not eyeballed.
- No Inter/Poppins-as-only-typeface, no purple→blue gradient, no hamburger-only nav, no decorative icon grid for skills, no star-rating testimonial cards, no "Let's work together!" filler copy.
- Every fact (names, dates, metrics, tech stacks) traces back to `skuganesan_resume.pdf` or `crafttraq.png` — no invented content, anywhere.
- The 3D particle field is the only 3D element, lives only in the hero, is `aria-hidden`, is lazy-loaded so it never blocks initial paint, and is replaced by a static CSS fallback (`ParticleFieldFallback`) whenever `prefers-reduced-motion` is set or the viewport is narrower than 768px.
- All real `<img>` elements carry real, descriptive `alt` text. The particle canvas carries no alt text of its own (it's `aria-hidden`; its container has none either since it's decorative).
- `index.html` ships a `<noscript>` block with name, positioning line, and the four contact links in plain HTML.
- Functional components and hooks only — no class components.

---

## Task 1: Project scaffold, design tokens, contrast utility

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`, `src/App.test.tsx`
- Create: `src/styles/index.css`
- Create: `src/utils/contrast.ts`, `src/utils/contrast.test.ts`
- Create: `src/test/setup.ts`
- Create: `.gitignore`
- Move: `hero.jpg` → `src/assets/hero.jpg`
- Move: `crafttraq.png` → `public/crafttraq.png`

**Interfaces:**
- Produces: Tailwind theme tokens `void`, `raised`, `ink`, `ink-dim`, `accent`, `accent-text` (colors), `font-display`/`font-mono` (font families), `text-display-lg`/`text-display-md` (font sizes), `py-section` (spacing) — every later component styles with these.
- Produces: `contrastRatio(hexA: string, hexB: string): number` from `src/utils/contrast.ts`.
- Produces: `export function App()` from `src/App.tsx` (placeholder body in this task; replaced in Task 13).

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "portfolio",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "@react-three/drei": "^9.114.0",
    "@react-three/fiber": "^8.17.0",
    "framer-motion": "^11.11.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "three": "^0.169.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/three": "^0.169.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "jsdom": "^25.0.0",
    "postcss": "^8.4.0",
    "sharp": "^0.33.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json` and `tsconfig.node.json`**

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["@testing-library/jest-dom/vitest"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 3: Write `vite.config.ts`**

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

- [ ] **Step 4: Write `tailwind.config.js`**

```js
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
```

- [ ] **Step 5: Write `postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: Write `src/styles/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

body {
  @apply bg-void text-ink antialiased;
}

a:focus-visible,
button:focus-visible {
  @apply outline outline-2 outline-offset-2 outline-accent-text;
}
```

- [ ] **Step 7: Write `index.html`** (includes the required `<noscript>` fallback)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Searan Kuganesan — Software Engineer</title>
    <meta
      name="description"
      content="Searan Kuganesan builds full-stack systems and data platforms — from a fleet-tracking platform at Mitsubishi Heavy Industries to CraftTraq, a live SaaS product for trade contractors."
    />
  </head>
  <body>
    <noscript>
      <div style="padding:2rem;font-family:ui-monospace,monospace;background:#0a0a0c;color:#f5f4f0;min-height:100vh;">
        <h1>Searan Kuganesan</h1>
        <p>I build the systems operators run their business on — aircraft fleets, trade-contractor crews, whatever's underneath.</p>
        <p>
          <a href="mailto:searan.kuganesan4@gmail.com" style="color:#ffb27a;">Email</a> ·
          <a href="https://github.com/skugane6" style="color:#ffb27a;">GitHub</a> ·
          <a href="https://linkedin.com/in/searan-kuganesan" style="color:#ffb27a;">LinkedIn</a> ·
          <a href="https://crafttraq.com" style="color:#ffb27a;">CraftTraq</a>
        </p>
      </div>
    </noscript>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Write `.gitignore`**

```
node_modules
dist
.DS_Store
*.tsbuildinfo
/vite.config.js
/vite.config.d.ts
```

(The last three entries cover build artifacts `tsc -b`'s composite `tsconfig.node.json` project emits next to `vite.config.ts` — they showed up as untracked cruft the first time `npm run build` ran and needed to be ignored.)

- [ ] **Step 9: Move the image assets into the project structure**

```bash
mkdir -p src/assets public
git mv hero.jpg src/assets/hero.jpg
git mv crafttraq.png public/crafttraq.png
```

- [ ] **Step 10: Write `src/utils/contrast.ts`**

```ts
export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const value = parseInt(clean, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((channel) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(hexA: string, hexB: string): number {
  const luminanceA = relativeLuminance(hexToRgb(hexA));
  const luminanceB = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
}
```

- [ ] **Step 11: Write the failing contrast test — `src/utils/contrast.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { contrastRatio } from './contrast';

describe('contrastRatio', () => {
  it('returns 1 for identical colors', () => {
    expect(contrastRatio('#0a0a0c', '#0a0a0c')).toBeCloseTo(1, 5);
  });

  it('returns 21 for pure black against pure white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });

  it('meets WCAG AA (>=4.5) for accent-text on the void background', () => {
    expect(contrastRatio('#ffb27a', '#0a0a0c')).toBeGreaterThanOrEqual(4.5);
  });

  it('meets WCAG AA (>=4.5) for primary ink on the void background', () => {
    expect(contrastRatio('#f5f4f0', '#0a0a0c')).toBeGreaterThanOrEqual(4.5);
  });
});
```

This test can't fail yet since `contrast.ts` already exists from Step 10 — that's fine here because Step 10/11 together establish the token contract; every later token change in this codebase must keep this test green.

- [ ] **Step 12: Write `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Without vitest's `globals: true`, @testing-library/react's automatic
// afterEach(cleanup) never registers, so DOM from one test leaks into the
// next within the same file. Register it explicitly, once, for every test.
afterEach(cleanup);

class DefaultIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

if (!('IntersectionObserver' in globalThis)) {
  // jsdom has no runtime IntersectionObserver (the DOM lib types declare it, but nothing
  // implements it here) — this is a minimal test-env stub.
  globalThis.IntersectionObserver = DefaultIntersectionObserver;
}

if (!window.matchMedia) {
  // jsdom has no matchMedia; framer-motion's useReducedMotion and useCanRender3D both
  // call it. Default to "no preference" so components render their normal (non-reduced)
  // branch in tests unless a specific test overrides window.matchMedia itself.
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
```

- [ ] **Step 13: Write the placeholder `src/App.tsx`**

```tsx
export function App() {
  return <div className="min-h-screen bg-void px-6 py-section text-ink">Portfolio scaffold OK</div>;
}
```

- [ ] **Step 14: Write `src/App.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App scaffold', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('Portfolio scaffold OK')).toBeInTheDocument();
  });
});
```

- [ ] **Step 15: Write `src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 16: Install dependencies**

```bash
npm install
```

- [ ] **Step 17: Run the test suite and verify it passes**

Run: `npm test`
Expected: both `App scaffold` and `contrastRatio` test files pass (5 tests total).

- [ ] **Step 18: Verify the production build succeeds**

Run: `npm run build`
Expected: exits 0, `dist/` is created.

- [ ] **Step 19: Commit**

```bash
git add -A
git commit -m "Scaffold Vite/React/TS project with design tokens and contrast check

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018qfxsQrxufX2kszSwYk3aH"
```

---

## Task 2: Data layer

**Files:**
- Create: `src/data/types.ts`, `src/data/experience.ts`, `src/data/projects.ts`, `src/data/skills.ts`
- Create: `src/data/experience.test.ts`, `src/data/projects.test.ts`, `src/data/skills.test.ts`

**Interfaces:**
- Consumes: none.
- Produces: types `ExperienceEntry`, `Education`, `ProjectEntry`, `FeaturedCaseStudy`, `ScreenshotCallout` (data shape, not the component), `SkillGroup` from `src/data/types.ts`; values `experience: ExperienceEntry[]`, `education: Education` from `experience.ts`; `featuredProject: FeaturedCaseStudy`, `secondaryProjects: ProjectEntry[]` from `projects.ts`; `skillGroups: SkillGroup[]` from `skills.ts`. Every later section component imports directly from these three data files.

- [ ] **Step 1: Write `src/data/types.ts`**

```ts
export interface ExperienceEntry {
  company: string;
  role: string;
  location: string;
  start: string;
  end: string;
  highlights: string[];
}

export interface Education {
  school: string;
  program: string;
  location: string;
  graduation: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  tagline: string;
  stack: string[];
  featured: boolean;
}

export interface ScreenshotCalloutData {
  label: string;
  top: string;
  left: string;
}

export interface FeaturedCaseStudy extends ProjectEntry {
  problem: string;
  approach: string[];
  decision: { title: string; body: string };
  scope: string[];
  outcome: string;
  screenshot: { src: string; webp: string; alt: string };
  callouts: ScreenshotCalloutData[];
}

export interface SkillGroup {
  id: string;
  title: string;
  skills: string[];
}
```

- [ ] **Step 2: Write the failing test — `src/data/experience.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { experience, education } from './experience';

describe('experience data', () => {
  it('contains the Mitsubishi Heavy Industries role with real dates', () => {
    const role = experience.find((entry) => entry.company === 'Mitsubishi Heavy Industries');
    expect(role).toBeDefined();
    expect(role?.role).toBe('Software Engineering Intern');
    expect(role?.start).toBe('05/2024');
    expect(role?.end).toBe('08/2025');
    expect(role?.highlights.length).toBeGreaterThan(0);
  });

  it('states the education record from the resume', () => {
    expect(education.school).toBe('Western University');
    expect(education.program).toBe('B.E.Sc. Software Engineering');
    expect(education.graduation).toBe('06/2026');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/data/experience.test.ts`
Expected: FAIL — `./experience` has no exported member `experience`.

- [ ] **Step 4: Write `src/data/experience.ts`**

```ts
import type { ExperienceEntry, Education } from './types';

export const experience: ExperienceEntry[] = [
  {
    company: 'Mitsubishi Heavy Industries',
    role: 'Software Engineering Intern',
    location: 'Mississauga, Canada',
    start: '05/2024',
    end: '08/2025',
    highlights: [
      'Engineered a full-stack component tracking system (React frontend, Python/Flask REST API) serving 2,000+ aircraft across 100+ operators with D3.js/Chart.js visualizations.',
      'Built a fleet prediction platform processing 400,000+ monthly records from SQL Server/Oracle via pandas/NumPy ETL pipelines with automated exception handling.',
      'Implemented scikit-learn regression models for utilization forecasting across 50+ operators and 6 regional markets.',
      'Automated monthly aircraft utilization and reliability reporting, cutting manual processing time by 85%.',
      'Designed the Oracle database architecture and a scheduling optimization engine coordinating maintenance workflows across 2,000+ entities.',
      'Built pytest/Jest test suites at 85% coverage with CI/CD pipelines for production deployments.',
    ],
  },
];

export const education: Education = {
  school: 'Western University',
  program: 'B.E.Sc. Software Engineering',
  location: 'London, Canada',
  graduation: '06/2026',
};
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/data/experience.test.ts`
Expected: PASS

- [ ] **Step 6: Write the failing test — `src/data/projects.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { featuredProject, secondaryProjects } from './projects';

describe('projects data', () => {
  it('describes CraftTraq as the featured case study with its real stack', () => {
    expect(featuredProject.name).toBe('CraftTraq');
    expect(featuredProject.featured).toBe(true);
    expect(featuredProject.stack).toEqual(['React 19', 'TypeScript', 'FastAPI', 'PostgreSQL']);
    expect(featuredProject.screenshot.src).toBe('/crafttraq.png');
    expect(featuredProject.screenshot.webp).toBe('/crafttraq.webp');
    expect(featuredProject.callouts.length).toBeGreaterThan(0);
  });

  it('lists the two secondary projects from the resume', () => {
    const names = secondaryProjects.map((project) => project.name);
    expect(names).toEqual(['Portfolio Risk Dashboard', 'Multi-Model Text Classification Pipeline']);
    secondaryProjects.forEach((project) => expect(project.featured).toBe(false));
  });
});
```

- [ ] **Step 7: Run the test to verify it fails**

Run: `npx vitest run src/data/projects.test.ts`
Expected: FAIL — module `./projects` not found.

- [ ] **Step 8: Write `src/data/projects.ts`**

```ts
import type { FeaturedCaseStudy, ProjectEntry } from './types';

export const featuredProject: FeaturedCaseStudy = {
  id: 'crafttraq',
  name: 'CraftTraq',
  tagline: 'Multi-tenant SaaS platform for trade contractors',
  stack: ['React 19', 'TypeScript', 'FastAPI', 'PostgreSQL'],
  featured: true,
  problem:
    'Trade contractors run jobs across paper quotes, group texts, and spreadsheets — nothing tracks a single job from quote through crew assignment to invoice and payment.',
  approach: [
    'Built end-to-end job lifecycle management: shareable client quotes that auto-convert into jobs, drag-and-drop crew scheduling, and status-tracked job records.',
    'Built invoicing, time tracking, and inventory management across 28+ tables with a PDF generation pipeline.',
  ],
  decision: {
    title: 'Immutable task-assignment snapshots',
    body:
      "A job's scheduled crew assignment is preserved as a point-in-time snapshot even as the crew roster changes later, then reconciled against live crew membership — so a schedule never silently drifts out of sync with who's actually on the crew.",
  },
  scope: [
    'Tiered Stripe billing',
    'QuickBooks OAuth2 payroll sync',
    'Twilio SMS notifications',
    'Supabase Realtime for live job-status updates',
    'Delivered as a Progressive Web App',
  ],
  outcome: 'Live in production at crafttraq.com.',
  screenshot: {
    src: '/crafttraq.png',
    webp: '/crafttraq.webp',
    alt: "CraftTraq's Field Ops Console showing a job board with columns for Created, In Progress, Complete, and Approved jobs, each card listing a job ID, title, client, and assigned crew initials.",
  },
  callouts: [
    { label: 'STATUS-TRACKED JOB RECORDS', top: '18%', left: '46%' },
    { label: 'CREW AVATARS', top: '32%', left: '78%' },
    { label: 'OVERDUE FLAGGING', top: '58%', left: '20%' },
  ],
};

export const secondaryProjects: ProjectEntry[] = [
  {
    id: 'portfolio-risk-dashboard',
    name: 'Portfolio Risk Dashboard',
    tagline:
      'Full-stack financial analytics app for Modern Portfolio Theory and Value-at-Risk analysis, with a Flask backend pulling live market data via yfinance and NumPy/Pandas/SciPy for efficient-frontier and risk-metric calculations.',
    stack: ['React', 'Vite', 'Flask', 'MongoDB', 'NumPy', 'Pandas', 'SciPy'],
    featured: false,
  },
  {
    id: 'text-classification-pipeline',
    name: 'Multi-Model Text Classification Pipeline',
    tagline:
      'Ensemble system combining BERT embeddings with CNN and BiLSTM architectures, MLflow experiment tracking, and a back-translation/synonym-replacement data augmentation pipeline.',
    stack: ['Python', 'TensorFlow', 'BERT', 'scikit-learn', 'PostgreSQL', 'MLflow'],
    featured: false,
  },
];
```

- [ ] **Step 9: Run the test to verify it passes**

Run: `npx vitest run src/data/projects.test.ts`
Expected: PASS

- [ ] **Step 10: Write the failing test — `src/data/skills.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { skillGroups } from './skills';

describe('skills data', () => {
  it('groups skills the way a colleague would hear them described, not as a flat list', () => {
    const titles = skillGroups.map((group) => group.title);
    expect(titles).toEqual([
      'Ship it',
      'Talk to other systems',
      'Move and shape data',
      'Keep it from breaking',
    ]);
  });

  it('includes React and PostgreSQL under Ship it', () => {
    const shipIt = skillGroups.find((group) => group.id === 'ship-it');
    expect(shipIt?.skills).toContain('React');
    expect(shipIt?.skills).toContain('PostgreSQL');
  });
});
```

- [ ] **Step 11: Run the test to verify it fails**

Run: `npx vitest run src/data/skills.test.ts`
Expected: FAIL — module `./skills` not found.

- [ ] **Step 12: Write `src/data/skills.ts`**

```ts
import type { SkillGroup } from './types';

export const skillGroups: SkillGroup[] = [
  {
    id: 'ship-it',
    title: 'Ship it',
    skills: ['React', 'TypeScript', 'FastAPI', 'Flask', 'PostgreSQL', 'Tailwind CSS'],
  },
  {
    id: 'talk-to-other-systems',
    title: 'Talk to other systems',
    skills: [
      'Stripe',
      'Twilio',
      'QuickBooks OAuth2',
      'Supabase Realtime',
      'AWS (S3, Lambda, Transcribe)',
      'Google Cloud Platform',
      'Cloudflare',
    ],
  },
  {
    id: 'move-and-shape-data',
    title: 'Move and shape data',
    skills: [
      'Python',
      'pandas',
      'NumPy',
      'SciPy',
      'scikit-learn',
      'TensorFlow / BERT',
      'SQL Server',
      'Oracle',
      'MongoDB',
    ],
  },
  {
    id: 'keep-it-from-breaking',
    title: 'Keep it from breaking',
    skills: ['pytest', 'Jest', 'CI/CD', 'Azure DevOps', 'Docker', 'Git'],
  },
];
```

- [ ] **Step 13: Run the test to verify it passes**

Run: `npx vitest run src/data/skills.test.ts`
Expected: PASS

- [ ] **Step 14: Run the full suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 15: Commit**

```bash
git add src/data
git commit -m "Add typed content data layer from resume and CraftTraq screenshot

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018qfxsQrxufX2kszSwYk3aH"
```

---

## Task 3: `useCanRender3D` hook

**Files:**
- Create: `src/hooks/useCanRender3D.ts`, `src/hooks/useCanRender3D.test.ts`

**Interfaces:**
- Consumes: none.
- Produces: `computeCanRender3D(): boolean`, `MOBILE_BREAKPOINT: number`, `useCanRender3D(): boolean` — `Hero.tsx` (Task 7) calls `useCanRender3D()` to decide whether to mount the R3F canvas or the static fallback.

- [ ] **Step 1: Write the failing test — `src/hooks/useCanRender3D.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeCanRender3D } from './useCanRender3D';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe('computeCanRender3D', () => {
  beforeEach(() => {
    mockMatchMedia(false);
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1440 });
  });

  it('returns true on a wide viewport with no reduced-motion preference', () => {
    expect(computeCanRender3D()).toBe(true);
  });

  it('returns false when prefers-reduced-motion is set', () => {
    mockMatchMedia(true);
    expect(computeCanRender3D()).toBe(false);
  });

  it('returns false on a narrow (mobile) viewport', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    expect(computeCanRender3D()).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/hooks/useCanRender3D.test.ts`
Expected: FAIL — module `./useCanRender3D` not found.

- [ ] **Step 3: Write `src/hooks/useCanRender3D.ts`**

```ts
import { useEffect, useState } from 'react';

export const MOBILE_BREAKPOINT = 768;

export function computeCanRender3D(): boolean {
  if (typeof window === 'undefined') return false;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isNarrowViewport = window.innerWidth < MOBILE_BREAKPOINT;
  return !prefersReducedMotion && !isNarrowViewport;
}

export function useCanRender3D(): boolean {
  const [canRender, setCanRender] = useState<boolean>(computeCanRender3D);

  useEffect(() => {
    const update = () => setCanRender(computeCanRender3D());
    window.addEventListener('resize', update);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    media.addEventListener('change', update);
    return () => {
      window.removeEventListener('resize', update);
      media.removeEventListener('change', update);
    };
  }, []);

  return canRender;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/hooks/useCanRender3D.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useCanRender3D.ts src/hooks/useCanRender3D.test.ts
git commit -m "Add useCanRender3D reduced-motion/viewport gate for the hero canvas

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018qfxsQrxufX2kszSwYk3aH"
```

---

## Task 4: `useActiveSection` hook

**Files:**
- Create: `src/hooks/useActiveSection.ts`, `src/hooks/useActiveSection.test.tsx`

**Interfaces:**
- Consumes: `IntersectionObserver` (browser global; stubbed in tests).
- Produces: `useActiveSection(sectionIds: string[]): string` — `NavRail.tsx` (Task 5) calls this with `['work', 'experience', 'skills', 'contact']` to highlight the active link.

- [ ] **Step 1: Write the failing test — `src/hooks/useActiveSection.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useActiveSection } from './useActiveSection';

let observedCallback: IntersectionObserverCallback;

class CapturingIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  constructor(callback: IntersectionObserverCallback) {
    observedCallback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

function TestHost({ ids }: { ids: string[] }) {
  const active = useActiveSection(ids);
  return <div data-testid="active">{active}</div>;
}

describe('useActiveSection', () => {
  beforeEach(() => {
    // @ts-expect-error test double
    global.IntersectionObserver = CapturingIntersectionObserver;
    document.body.innerHTML = '<div id="hero"></div><div id="work"></div>';
  });

  it('defaults to the first section id', () => {
    render(<TestHost ids={['hero', 'work']} />);
    expect(screen.getByTestId('active').textContent).toBe('hero');
  });

  it('updates to the topmost intersecting section', () => {
    render(<TestHost ids={['hero', 'work']} />);
    act(() => {
      observedCallback(
        [
          {
            isIntersecting: true,
            boundingClientRect: { top: 50 } as DOMRectReadOnly,
            target: document.getElementById('work') as Element,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      );
    });
    expect(screen.getByTestId('active').textContent).toBe('work');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/hooks/useActiveSection.test.tsx`
Expected: FAIL — module `./useActiveSection` not found.

- [ ] **Step 3: Write `src/hooks/useActiveSection.ts`**

```ts
import { useEffect, useState } from 'react';

export function useActiveSection(sectionIds: string[]): string {
  const [activeId, setActiveId] = useState<string>(sectionIds[0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b
        );
        setActiveId(topMost.target.id);
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sectionIds]);

  return activeId;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/hooks/useActiveSection.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useActiveSection.ts src/hooks/useActiveSection.test.tsx
git commit -m "Add useActiveSection scroll-tracking hook for the nav rail

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018qfxsQrxufX2kszSwYk3aH"
```

---

## Task 5: `NavRail` component

**Files:**
- Create: `src/components/NavRail.tsx`, `src/components/NavRail.test.tsx`

**Interfaces:**
- Consumes: `useActiveSection(sectionIds: string[]): string` from Task 4.
- Produces: `export function NavRail()` — mounted by `App.tsx` in Task 13.

- [ ] **Step 1: Write the failing test — `src/components/NavRail.test.tsx`**

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
    expect(screen.getByRole('link', { name: '01 WORK' })).toHaveAttribute('href', '#work');
    expect(screen.getByRole('link', { name: '02 EXPERIENCE' })).toHaveAttribute('href', '#experience');
    expect(screen.getByRole('link', { name: '03 SKILLS' })).toHaveAttribute('href', '#skills');
    expect(screen.getByRole('link', { name: '04 CONTACT' })).toHaveAttribute('href', '#contact');
  });

  it('marks the active section with aria-current', () => {
    render(<NavRail />);
    expect(screen.getByRole('link', { name: '02 EXPERIENCE' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: '01 WORK' })).not.toHaveAttribute('aria-current');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/NavRail.test.tsx`
Expected: FAIL — module `./NavRail` not found.

- [ ] **Step 3: Write `src/components/NavRail.tsx`**

```tsx
import { useActiveSection } from '../hooks/useActiveSection';

const SECTIONS = [
  { id: 'work', label: '01 WORK' },
  { id: 'experience', label: '02 EXPERIENCE' },
  { id: 'skills', label: '03 SKILLS' },
  { id: 'contact', label: '04 CONTACT' },
];

export function NavRail() {
  const activeId = useActiveSection(SECTIONS.map((section) => section.id));

  return (
    <nav
      aria-label="Section navigation"
      className="fixed right-6 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-4 font-mono text-xs tracking-widest md:flex"
    >
      {SECTIONS.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          aria-current={activeId === section.id ? 'true' : undefined}
          className={
            activeId === section.id
              ? 'text-accent-text transition-colors'
              : 'text-ink-dim transition-colors hover:text-ink'
          }
        >
          {section.label}
        </a>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/NavRail.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/NavRail.tsx src/components/NavRail.test.tsx
git commit -m "Add NavRail section navigation component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018qfxsQrxufX2kszSwYk3aH"
```

---

## Task 6: Particle field — parallax helper, static fallback, and 3D canvas

**Files:**
- Create: `src/components/particleField/parallax.ts`, `src/components/particleField/parallax.test.ts`
- Create: `src/components/particleField/ParticleFieldFallback.tsx`, `src/components/particleField/ParticleFieldFallback.test.tsx`
- Create: `src/components/particleField/ParticleField.tsx`

**Interfaces:**
- Consumes: `three`, `@react-three/fiber`, `@react-three/drei` (Steps 5+).
- Produces: `computeParallaxOffset(pointer: {x:number;y:number}, factor?: number): {x:number;y:number}`; `export function ParticleFieldFallback()` (rendered with `data-testid="particle-field-fallback"`); `export function ParticleField()` (rendered with `data-testid="particle-field-canvas"`) — both consumed by `Hero.tsx` in Task 7.

- [ ] **Step 1: Write the failing test — `src/components/particleField/parallax.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { computeParallaxOffset } from './parallax';

describe('computeParallaxOffset', () => {
  it('scales pointer position by the given factor', () => {
    expect(computeParallaxOffset({ x: 0.5, y: -0.5 }, 0.6)).toEqual({ x: 0.3, y: -0.3 });
  });

  it('clamps pointer values outside [-1, 1] before scaling', () => {
    expect(computeParallaxOffset({ x: 2, y: -2 }, 0.5)).toEqual({ x: 0.5, y: -0.5 });
  });

  it('defaults the factor to 0.6', () => {
    expect(computeParallaxOffset({ x: 1, y: 1 })).toEqual({ x: 0.6, y: 0.6 });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/particleField/parallax.test.ts`
Expected: FAIL — module `./parallax` not found.

- [ ] **Step 3: Write `src/components/particleField/parallax.ts`**

```ts
export interface Vec2 {
  x: number;
  y: number;
}

export function computeParallaxOffset(pointer: Vec2, factor = 0.6): Vec2 {
  const clampedX = Math.max(-1, Math.min(1, pointer.x));
  const clampedY = Math.max(-1, Math.min(1, pointer.y));
  return { x: clampedX * factor, y: clampedY * factor };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/particleField/parallax.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing test — `src/components/particleField/ParticleFieldFallback.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ParticleFieldFallback } from './ParticleFieldFallback';

describe('ParticleFieldFallback', () => {
  it('renders a decorative, aria-hidden element', () => {
    render(<ParticleFieldFallback />);
    const el = screen.getByTestId('particle-field-fallback');
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx vitest run src/components/particleField/ParticleFieldFallback.test.tsx`
Expected: FAIL — module `./ParticleFieldFallback` not found.

- [ ] **Step 7: Write `src/components/particleField/ParticleFieldFallback.tsx`**

```tsx
export function ParticleFieldFallback() {
  return (
    <div
      aria-hidden="true"
      data-testid="particle-field-fallback"
      className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,90,31,0.14),transparent_60%)]"
    />
  );
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npx vitest run src/components/particleField/ParticleFieldFallback.test.tsx`
Expected: PASS

- [ ] **Step 9: Write `src/components/particleField/ParticleField.tsx`**

No automated test for this file: it renders a WebGL `<canvas>` via `@react-three/fiber`, and jsdom (this project's test environment) has no WebGL context, so this component is verified manually in Task 14 instead. Its only testable logic (the parallax math) already has coverage from Step 1-4.

```tsx
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { computeParallaxOffset } from './parallax';

const PARTICLE_COUNT = 1200;

function generatePositions(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
  }
  return positions;
}

function DriftingPoints() {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useRef(generatePositions(PARTICLE_COUNT));

  useFrame((state) => {
    const offset = computeParallaxOffset({ x: state.pointer.x, y: state.pointer.y }, 0.4);
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0006;
      pointsRef.current.position.x = THREE.MathUtils.lerp(pointsRef.current.position.x, offset.x, 0.02);
      pointsRef.current.position.y = THREE.MathUtils.lerp(pointsRef.current.position.y, offset.y, 0.02);
    }
  });

  return (
    <Points ref={pointsRef} positions={positions.current} stride={3}>
      <PointMaterial transparent color="#ff5a1f" size={0.02} sizeAttenuation depthWrite={false} opacity={0.6} />
    </Points>
  );
}

export function ParticleField() {
  return (
    <Canvas
      data-testid="particle-field-canvas"
      camera={{ position: [0, 0, 3], fov: 60 }}
      gl={{ antialias: false, alpha: true }}
    >
      <DriftingPoints />
    </Canvas>
  );
}
```

- [ ] **Step 10: Install the three.js/R3F dependencies if not already present and confirm the project still builds**

Run: `npm install` (dependencies were already declared in Task 1's `package.json`; this confirms they resolved)
Run: `npm run build`
Expected: exits 0.

- [ ] **Step 11: Run the full test suite**

Run: `npm test`
Expected: all tests pass (ParticleField itself has no test file, by design — see Step 9).

- [ ] **Step 12: Commit**

```bash
git add src/components/particleField
git commit -m "Add hero particle field: parallax math, canvas, and static fallback

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018qfxsQrxufX2kszSwYk3aH"
```

---

## Task 7: `Hero` component

**Files:**
- Create: `src/components/Hero.tsx`, `src/components/Hero.test.tsx`

**Interfaces:**
- Consumes: `useCanRender3D(): boolean` (Task 3); `ParticleFieldFallback` (Task 6); `ParticleField` (Task 6, lazy-loaded); `src/assets/hero.jpg` (Task 1).
- Produces: `export function Hero()`, rendered as `<section id="hero">` — mounted by `App.tsx` in Task 13.

- [ ] **Step 1: Write the failing test — `src/components/Hero.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from './Hero';
import { useCanRender3D } from '../hooks/useCanRender3D';

vi.mock('../hooks/useCanRender3D', () => ({ useCanRender3D: vi.fn() }));
vi.mock('./particleField/ParticleField', () => ({
  ParticleField: () => <div data-testid="particle-field-canvas" />,
}));

describe('Hero', () => {
  it('renders the name and positioning line', () => {
    vi.mocked(useCanRender3D).mockReturnValue(false);
    render(<Hero />);
    expect(screen.getByText('Searan Kuganesan')).toBeInTheDocument();
    expect(
      screen.getByText(/I build the systems operators run their business on/)
    ).toBeInTheDocument();
  });

  it('renders the static fallback when 3D is disabled', () => {
    vi.mocked(useCanRender3D).mockReturnValue(false);
    render(<Hero />);
    expect(screen.getByTestId('particle-field-fallback')).toBeInTheDocument();
  });

  it('renders the particle canvas when 3D is enabled', async () => {
    vi.mocked(useCanRender3D).mockReturnValue(true);
    render(<Hero />);
    expect(await screen.findByTestId('particle-field-canvas')).toBeInTheDocument();
  });

  it('gives the headshot real alt text', () => {
    vi.mocked(useCanRender3D).mockReturnValue(false);
    render(<Hero />);
    expect(screen.getByAltText('Searan Kuganesan')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/Hero.test.tsx`
Expected: FAIL — module `./Hero` not found.

- [ ] **Step 3: Write `src/components/Hero.tsx`**

```tsx
import { Suspense, lazy } from 'react';
import { useCanRender3D } from '../hooks/useCanRender3D';
import { ParticleFieldFallback } from './particleField/ParticleFieldFallback';
import heroImage from '../assets/hero.jpg';

const ParticleField = lazy(() =>
  import('./particleField/ParticleField').then((module) => ({ default: module.ParticleField }))
);

export function Hero() {
  const canRender3D = useCanRender3D();

  return (
    <section id="hero" className="relative flex min-h-screen items-center overflow-hidden bg-void">
      <div className="absolute inset-0">
        {canRender3D ? (
          <Suspense fallback={<ParticleFieldFallback />}>
            <ParticleField />
          </Suspense>
        ) : (
          <ParticleFieldFallback />
        )}
      </div>
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col gap-6 px-6">
        <img
          src={heroImage}
          alt="Searan Kuganesan"
          className="h-24 w-24 object-cover [filter:grayscale(1)_sepia(1)_hue-rotate(-20deg)_saturate(3.5)_brightness(0.8)]"
        />
        <h1 className="font-display text-display-lg text-ink">Searan Kuganesan</h1>
        <p className="max-w-xl text-lg text-ink-dim">
          I build the systems operators run their business on — aircraft fleets, trade-contractor
          crews, whatever&apos;s underneath.
        </p>
        <a href="#work" className="font-mono text-xs tracking-widest text-accent-text hover:text-ink">
          ↓ SEE THE WORK
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/Hero.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Hero.tsx src/components/Hero.test.tsx
git commit -m "Add Hero section with lazy particle field and reduced-motion fallback

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018qfxsQrxufX2kszSwYk3aH"
```

---

## Task 8: CraftTraq case study — WebP asset, `ScreenshotCallout`, `FeaturedProject`

**Files:**
- Create: `scripts/generate-webp.mjs`
- Create: `public/crafttraq.webp` (generated)
- Create: `src/components/ScreenshotCallout.tsx`, `src/components/ScreenshotCallout.test.tsx`
- Create: `src/components/FeaturedProject.tsx`, `src/components/FeaturedProject.test.tsx`

**Interfaces:**
- Consumes: `featuredProject: FeaturedCaseStudy` from `src/data/projects.ts` (Task 2).
- Produces: `export function ScreenshotCallout({label, top, left}: {label:string; top:string; left:string})`; `export function FeaturedProject()` rendered as `<section id="work">` — mounted by `App.tsx` in Task 13.

- [ ] **Step 1: Write `scripts/generate-webp.mjs`**

```js
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const input = path.join(__dirname, '..', 'public', 'crafttraq.png');
const output = path.join(__dirname, '..', 'public', 'crafttraq.webp');

await sharp(input).webp({ quality: 82 }).toFile(output);
console.log(`Wrote ${output}`);
```

- [ ] **Step 2: Run it and verify the WebP is smaller than the source PNG**

```bash
node scripts/generate-webp.mjs
ls -la public/crafttraq.png public/crafttraq.webp
```

Expected: `public/crafttraq.webp` exists and its byte size is smaller than `public/crafttraq.png`.

- [ ] **Step 3: Write the failing test — `src/components/ScreenshotCallout.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScreenshotCallout } from './ScreenshotCallout';

describe('ScreenshotCallout', () => {
  it('renders its label positioned at the given coordinates', () => {
    render(<ScreenshotCallout label="CREW AVATARS" top="32%" left="78%" />);
    const el = screen.getByText('CREW AVATARS');
    expect(el).toHaveStyle({ top: '32%', left: '78%' });
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx vitest run src/components/ScreenshotCallout.test.tsx`
Expected: FAIL — module `./ScreenshotCallout` not found.

- [ ] **Step 5: Write `src/components/ScreenshotCallout.tsx`**

```tsx
interface ScreenshotCalloutProps {
  label: string;
  top: string;
  left: string;
}

export function ScreenshotCallout({ label, top, left }: ScreenshotCalloutProps) {
  return (
    <span
      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-sm border border-accent/40 bg-void/80 px-2 py-1 font-mono text-[10px] tracking-widest text-accent-text"
      style={{ top, left }}
    >
      {label}
    </span>
  );
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run src/components/ScreenshotCallout.test.tsx`
Expected: PASS

- [ ] **Step 7: Write the failing test — `src/components/FeaturedProject.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeaturedProject } from './FeaturedProject';
import { featuredProject } from '../data/projects';

describe('FeaturedProject', () => {
  it('renders the project name and problem statement from data', () => {
    render(<FeaturedProject />);
    expect(screen.getByText(featuredProject.name)).toBeInTheDocument();
    expect(screen.getByText(featuredProject.problem)).toBeInTheDocument();
  });

  it('renders the screenshot with real alt text, lazy loading, and a webp source', () => {
    render(<FeaturedProject />);
    const img = screen.getByAltText(featuredProject.screenshot.alt);
    expect(img).toHaveAttribute('src', featuredProject.screenshot.src);
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('renders one callout per data entry', () => {
    render(<FeaturedProject />);
    featuredProject.callouts.forEach((callout) => {
      expect(screen.getByText(callout.label)).toBeInTheDocument();
    });
  });

  it('renders the immutable-snapshot engineering decision', () => {
    render(<FeaturedProject />);
    expect(screen.getByText(featuredProject.decision.body)).toBeInTheDocument();
  });
});
```

- [ ] **Step 8: Run the test to verify it fails**

Run: `npx vitest run src/components/FeaturedProject.test.tsx`
Expected: FAIL — module `./FeaturedProject` not found.

- [ ] **Step 9: Write `src/components/FeaturedProject.tsx`**

```tsx
import { featuredProject } from '../data/projects';
import { ScreenshotCallout } from './ScreenshotCallout';

export function FeaturedProject() {
  const project = featuredProject;

  return (
    <section id="work" className="bg-raised px-6 py-section">
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-xs tracking-widest text-accent-text">§ 01 — FEATURED WORK</p>
        <h2 className="mt-4 font-display text-display-md text-ink">{project.name}</h2>
        <p className="mt-2 max-w-2xl text-ink-dim">{project.tagline}</p>

        <div className="relative mt-10 overflow-hidden rounded-md border border-white/10">
          <picture>
            <source srcSet={project.screenshot.webp} type="image/webp" />
            <img src={project.screenshot.src} alt={project.screenshot.alt} loading="lazy" className="w-full" />
          </picture>
          {project.callouts.map((callout) => (
            <ScreenshotCallout key={callout.label} {...callout} />
          ))}
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-2">
          <div>
            <h3 className="font-mono text-xs tracking-widest text-ink-dim">PROBLEM</h3>
            <p className="mt-2 text-ink">{project.problem}</p>
          </div>
          <div>
            <h3 className="font-mono text-xs tracking-widest text-ink-dim">APPROACH</h3>
            <ul className="mt-2 space-y-2 text-ink">
              {project.approach.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-mono text-xs tracking-widest text-ink-dim">
              {project.decision.title.toUpperCase()}
            </h3>
            <p className="mt-2 text-ink">{project.decision.body}</p>
          </div>
          <div>
            <h3 className="font-mono text-xs tracking-widest text-ink-dim">SCOPE</h3>
            <ul className="mt-2 space-y-1 text-ink-dim">
              {project.scope.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-10 font-mono text-xs tracking-widest text-accent-text">{project.outcome}</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 10: Run the test to verify it passes**

Run: `npx vitest run src/components/FeaturedProject.test.tsx`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add scripts/generate-webp.mjs public/crafttraq.webp src/components/ScreenshotCallout.tsx src/components/ScreenshotCallout.test.tsx src/components/FeaturedProject.tsx src/components/FeaturedProject.test.tsx
git commit -m "Add CraftTraq case study section with optimized screenshot and callouts

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018qfxsQrxufX2kszSwYk3aH"
```

---

## Task 9: `Experience` component

**Files:**
- Create: `src/components/Experience.tsx`, `src/components/Experience.test.tsx`

**Interfaces:**
- Consumes: `experience`, `education` from `src/data/experience.ts`; `secondaryProjects` from `src/data/projects.ts` (Task 2).
- Produces: `export function Experience()` rendered as `<section id="experience">` — mounted by `App.tsx` in Task 13.

- [ ] **Step 1: Write the failing test — `src/components/Experience.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Experience } from './Experience';
import { experience, education } from '../data/experience';
import { secondaryProjects } from '../data/projects';

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

  it('renders every secondary project title', () => {
    render(<Experience />);
    secondaryProjects.forEach((project) => {
      expect(screen.getByText(project.name)).toBeInTheDocument();
    });
  });

  it('renders the education line', () => {
    render(<Experience />);
    expect(
      screen.getByText(`${education.program}, ${education.school} — ${education.graduation}`)
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/Experience.test.tsx`
Expected: FAIL — module `./Experience` not found.

- [ ] **Step 3: Write `src/components/Experience.tsx`**

```tsx
import { experience, education } from '../data/experience';
import { secondaryProjects } from '../data/projects';

export function Experience() {
  return (
    <section id="experience" className="bg-void px-6 py-section">
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-xs tracking-widest text-accent-text">§ 02 — EXPERIENCE</p>

        <div className="mt-8 space-y-10">
          {experience.map((role) => (
            <article key={role.company} className="border-l border-white/10 pl-6">
              <p className="font-mono text-xs tracking-widest text-ink-dim">
                {role.start} – {role.end}
              </p>
              <h3 className="mt-1 font-display text-2xl text-ink">
                {role.role} · {role.company}
              </h3>
              <p className="text-sm text-ink-dim">{role.location}</p>
              <ul className="mt-4 space-y-2 text-ink">
                {role.highlights.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-16">
          <p className="font-mono text-xs tracking-widest text-ink-dim">ALSO BUILT</p>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {secondaryProjects.map((project) => (
              <div key={project.id} className="rounded-md border border-white/10 p-5">
                <h4 className="font-display text-lg text-ink">{project.name}</h4>
                <p className="mt-2 text-sm text-ink-dim">{project.tagline}</p>
                <p className="mt-3 font-mono text-[10px] tracking-widest text-ink-dim">
                  {project.stack.join(' · ')}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-12 font-mono text-xs tracking-widest text-ink-dim">
          {education.program}, {education.school} — {education.graduation}
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/Experience.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Experience.tsx src/components/Experience.test.tsx
git commit -m "Add Experience timeline with secondary projects and education line

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018qfxsQrxufX2kszSwYk3aH"
```

---

## Task 10: `Skills` component

**Files:**
- Create: `src/components/Skills.tsx`, `src/components/Skills.test.tsx`

**Interfaces:**
- Consumes: `skillGroups: SkillGroup[]` from `src/data/skills.ts` (Task 2).
- Produces: `export function Skills()` rendered as `<section id="skills">` — mounted by `App.tsx` in Task 13.

- [ ] **Step 1: Write the failing test — `src/components/Skills.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skills } from './Skills';
import { skillGroups } from '../data/skills';

describe('Skills', () => {
  it('renders every group heading', () => {
    render(<Skills />);
    skillGroups.forEach((group) => {
      expect(screen.getByText(group.title)).toBeInTheDocument();
    });
  });

  it('renders every skill tag', () => {
    render(<Skills />);
    skillGroups.forEach((group) => {
      group.skills.forEach((skill) => {
        expect(screen.getByText(skill)).toBeInTheDocument();
      });
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/Skills.test.tsx`
Expected: FAIL — module `./Skills` not found.

- [ ] **Step 3: Write `src/components/Skills.tsx`**

```tsx
import { skillGroups } from '../data/skills';

export function Skills() {
  return (
    <section id="skills" className="bg-raised px-6 py-section">
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-xs tracking-widest text-accent-text">§ 03 — SKILLS</p>
        <div className="mt-8 grid gap-10 md:grid-cols-2">
          {skillGroups.map((group) => (
            <div key={group.id}>
              <h3 className="font-display text-xl text-ink">{group.title}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-sm border border-white/10 px-2 py-1 font-mono text-xs text-ink-dim"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/Skills.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Skills.tsx src/components/Skills.test.tsx
git commit -m "Add Skills section grouped by function, not an icon grid

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018qfxsQrxufX2kszSwYk3aH"
```

---

## Task 11: `Contact` and `Footer` components

**Files:**
- Create: `src/components/Contact.tsx`, `src/components/Contact.test.tsx`
- Create: `src/components/Footer.tsx`, `src/components/Footer.test.tsx`

**Interfaces:**
- Consumes: none (real links are hard-coded from the resume header — email, GitHub, LinkedIn, and the CraftTraq site).
- Produces: `export function Contact()` rendered as `<section id="contact">`; `export function Footer()` — both mounted by `App.tsx` in Task 13.

- [ ] **Step 1: Write the failing test — `src/components/Contact.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Contact } from './Contact';

describe('Contact', () => {
  it('renders a mailto link to the real email address', () => {
    render(<Contact />);
    expect(screen.getByRole('link', { name: 'EMAIL' })).toHaveAttribute(
      'href',
      'mailto:searan.kuganesan4@gmail.com'
    );
  });

  it('renders real GitHub, LinkedIn, and CraftTraq links', () => {
    render(<Contact />);
    expect(screen.getByRole('link', { name: 'GITHUB' })).toHaveAttribute('href', 'https://github.com/skugane6');
    expect(screen.getByRole('link', { name: 'LINKEDIN' })).toHaveAttribute(
      'href',
      'https://linkedin.com/in/searan-kuganesan'
    );
    expect(screen.getByRole('link', { name: 'CRAFTTRAQ' })).toHaveAttribute('href', 'https://crafttraq.com');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/Contact.test.tsx`
Expected: FAIL — module `./Contact` not found.

- [ ] **Step 3: Write `src/components/Contact.tsx`**

```tsx
const EMAIL = 'searan.kuganesan4@gmail.com';

const LINKS = [
  { label: 'Email', href: `mailto:${EMAIL}` },
  { label: 'GitHub', href: 'https://github.com/skugane6' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/searan-kuganesan' },
  { label: 'CraftTraq', href: 'https://crafttraq.com' },
];

export function Contact() {
  return (
    <section id="contact" className="bg-void px-6 py-section">
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-xs tracking-widest text-accent-text">§ 04 — CONTACT</p>
        <h2 className="mt-4 font-display text-display-md text-ink">
          Email is the fastest way to reach me. I read everything that comes in.
        </h2>
        <div className="mt-8 flex flex-wrap gap-6 font-mono text-sm tracking-widest">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-ink-dim hover:text-accent-text"
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
            >
              {link.label.toUpperCase()}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/Contact.test.tsx`
Expected: PASS

- [ ] **Step 5: Write the failing test — `src/components/Footer.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders the closing line', () => {
    render(<Footer />);
    expect(screen.getByText('BUILT BY SEARAN KUGANESAN')).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx vitest run src/components/Footer.test.tsx`
Expected: FAIL — module `./Footer` not found.

- [ ] **Step 7: Write `src/components/Footer.tsx`**

```tsx
export function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 py-8 text-center font-mono text-[10px] tracking-widest text-ink-dim">
      BUILT BY SEARAN KUGANESAN
    </footer>
  );
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npx vitest run src/components/Footer.test.tsx`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/components/Contact.tsx src/components/Contact.test.tsx src/components/Footer.tsx src/components/Footer.test.tsx
git commit -m "Add Contact and Footer components with real, direct links

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018qfxsQrxufX2kszSwYk3aH"
```

---

## Task 12: Scroll-reveal motion

**Files:**
- Create: `src/components/Reveal.tsx`, `src/components/Reveal.test.tsx`
- Modify: `src/components/FeaturedProject.tsx`, `src/components/Experience.tsx`, `src/components/Skills.tsx`, `src/components/Contact.tsx`

**Interfaces:**
- Consumes: `framer-motion` (`motion`, `useReducedMotion`).
- Produces: `export function Reveal({children}: {children: ReactNode})` — wraps the content of the four sections below in a slow fade/slide-up that plays once as it scrolls into view, and does nothing (renders children with no animation) when `prefers-reduced-motion` is set.

- [ ] **Step 1: Write the failing test — `src/components/Reveal.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Reveal } from './Reveal';

describe('Reveal', () => {
  it('renders its children', () => {
    render(
      <Reveal>
        <p>Hello</p>
      </Reveal>
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/Reveal.test.tsx`
Expected: FAIL — module `./Reveal` not found.

- [ ] **Step 3: Write `src/components/Reveal.tsx`**

```tsx
import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

export function Reveal({ children }: { children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 24 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/Reveal.test.tsx`
Expected: PASS

- [ ] **Step 5: Wrap `FeaturedProject`'s content in `Reveal` — modify `src/components/FeaturedProject.tsx`**

```tsx
import { featuredProject } from '../data/projects';
import { ScreenshotCallout } from './ScreenshotCallout';
import { Reveal } from './Reveal';

export function FeaturedProject() {
  const project = featuredProject;

  return (
    <section id="work" className="bg-raised px-6 py-section">
      <Reveal>
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-xs tracking-widest text-accent-text">§ 01 — FEATURED WORK</p>
          <h2 className="mt-4 font-display text-display-md text-ink">{project.name}</h2>
          <p className="mt-2 max-w-2xl text-ink-dim">{project.tagline}</p>

          <div className="relative mt-10 overflow-hidden rounded-md border border-white/10">
            <picture>
              <source srcSet={project.screenshot.webp} type="image/webp" />
              <img src={project.screenshot.src} alt={project.screenshot.alt} loading="lazy" className="w-full" />
            </picture>
            {project.callouts.map((callout) => (
              <ScreenshotCallout key={callout.label} {...callout} />
            ))}
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-2">
            <div>
              <h3 className="font-mono text-xs tracking-widest text-ink-dim">PROBLEM</h3>
              <p className="mt-2 text-ink">{project.problem}</p>
            </div>
            <div>
              <h3 className="font-mono text-xs tracking-widest text-ink-dim">APPROACH</h3>
              <ul className="mt-2 space-y-2 text-ink">
                {project.approach.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-xs tracking-widest text-ink-dim">
                {project.decision.title.toUpperCase()}
              </h3>
              <p className="mt-2 text-ink">{project.decision.body}</p>
            </div>
            <div>
              <h3 className="font-mono text-xs tracking-widest text-ink-dim">SCOPE</h3>
              <ul className="mt-2 space-y-1 text-ink-dim">
                {project.scope.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-10 font-mono text-xs tracking-widest text-accent-text">{project.outcome}</p>
        </div>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 6: Run `FeaturedProject`'s test to verify it still passes**

Run: `npx vitest run src/components/FeaturedProject.test.tsx`
Expected: PASS (Reveal renders its children unconditionally, so all existing assertions still hold).

- [ ] **Step 7: Wrap `Experience`'s content in `Reveal` — modify `src/components/Experience.tsx`**

```tsx
import { experience, education } from '../data/experience';
import { secondaryProjects } from '../data/projects';
import { Reveal } from './Reveal';

export function Experience() {
  return (
    <section id="experience" className="bg-void px-6 py-section">
      <Reveal>
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-xs tracking-widest text-accent-text">§ 02 — EXPERIENCE</p>

          <div className="mt-8 space-y-10">
            {experience.map((role) => (
              <article key={role.company} className="border-l border-white/10 pl-6">
                <p className="font-mono text-xs tracking-widest text-ink-dim">
                  {role.start} – {role.end}
                </p>
                <h3 className="mt-1 font-display text-2xl text-ink">
                  {role.role} · {role.company}
                </h3>
                <p className="text-sm text-ink-dim">{role.location}</p>
                <ul className="mt-4 space-y-2 text-ink">
                  {role.highlights.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="mt-16">
            <p className="font-mono text-xs tracking-widest text-ink-dim">ALSO BUILT</p>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              {secondaryProjects.map((project) => (
                <div key={project.id} className="rounded-md border border-white/10 p-5">
                  <h4 className="font-display text-lg text-ink">{project.name}</h4>
                  <p className="mt-2 text-sm text-ink-dim">{project.tagline}</p>
                  <p className="mt-3 font-mono text-[10px] tracking-widest text-ink-dim">
                    {project.stack.join(' · ')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-12 font-mono text-xs tracking-widest text-ink-dim">
            {education.program}, {education.school} — {education.graduation}
          </p>
        </div>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 8: Run `Experience`'s test to verify it still passes**

Run: `npx vitest run src/components/Experience.test.tsx`
Expected: PASS

- [ ] **Step 9: Wrap `Skills`'s content in `Reveal` — modify `src/components/Skills.tsx`**

```tsx
import { skillGroups } from '../data/skills';
import { Reveal } from './Reveal';

export function Skills() {
  return (
    <section id="skills" className="bg-raised px-6 py-section">
      <Reveal>
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-xs tracking-widest text-accent-text">§ 03 — SKILLS</p>
          <div className="mt-8 grid gap-10 md:grid-cols-2">
            {skillGroups.map((group) => (
              <div key={group.id}>
                <h3 className="font-display text-xl text-ink">{group.title}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-sm border border-white/10 px-2 py-1 font-mono text-xs text-ink-dim"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 10: Run `Skills`'s test to verify it still passes**

Run: `npx vitest run src/components/Skills.test.tsx`
Expected: PASS

- [ ] **Step 11: Wrap `Contact`'s content in `Reveal` — modify `src/components/Contact.tsx`**

```tsx
import { Reveal } from './Reveal';

const EMAIL = 'searan.kuganesan4@gmail.com';

const LINKS = [
  { label: 'Email', href: `mailto:${EMAIL}` },
  { label: 'GitHub', href: 'https://github.com/skugane6' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/searan-kuganesan' },
  { label: 'CraftTraq', href: 'https://crafttraq.com' },
];

export function Contact() {
  return (
    <section id="contact" className="bg-void px-6 py-section">
      <Reveal>
        <div className="mx-auto max-w-2xl">
          <p className="font-mono text-xs tracking-widest text-accent-text">§ 04 — CONTACT</p>
          <h2 className="mt-4 font-display text-display-md text-ink">
            Email is the fastest way to reach me. I read everything that comes in.
          </h2>
          <div className="mt-8 flex flex-wrap gap-6 font-mono text-sm tracking-widest">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-ink-dim hover:text-accent-text"
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
              >
                {link.label.toUpperCase()}
              </a>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 12: Run `Contact`'s test to verify it still passes**

Run: `npx vitest run src/components/Contact.test.tsx`
Expected: PASS

- [ ] **Step 13: Run the full suite and build**

Run: `npm test`
Run: `npm run build`
Expected: all tests pass, build exits 0.

- [ ] **Step 14: Commit**

```bash
git add src/components/Reveal.tsx src/components/Reveal.test.tsx src/components/FeaturedProject.tsx src/components/Experience.tsx src/components/Skills.tsx src/components/Contact.tsx
git commit -m "Add Framer Motion scroll-reveal wrapper, respecting prefers-reduced-motion

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018qfxsQrxufX2kszSwYk3aH"
```

---

## Task 13: App assembly

**Files:**
- Modify: `src/App.tsx` (replace the Task 1 placeholder)
- Modify: `src/App.test.tsx` (replace the Task 1 smoke test)

**Interfaces:**
- Consumes: `NavRail` (Task 5), `Hero` (Task 7), `FeaturedProject` (Task 8), `Experience` (Task 9), `Skills` (Task 10), `Contact`/`Footer` (Task 11).
- Produces: `export function App()` — the full assembled page, mounted by `src/main.tsx` (Task 1, unchanged).

- [ ] **Step 1: Write the failing test — replace `src/App.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { App } from './App';

vi.mock('./hooks/useCanRender3D', () => ({ useCanRender3D: () => false }));

describe('App', () => {
  it('renders every section in order with the correct anchor ids', () => {
    const { container } = render(<App />);
    const ids = Array.from(container.querySelectorAll('section')).map((el) => el.id);
    expect(ids).toEqual(['hero', 'work', 'experience', 'skills', 'contact']);
  });

  it('renders the nav rail', () => {
    const { container } = render(<App />);
    expect(container.querySelector('nav[aria-label="Section navigation"]')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL — `App` still renders the Task 1 placeholder text/markup, no `<section>` elements exist yet.

- [ ] **Step 3: Replace `src/App.tsx`**

```tsx
import { NavRail } from './components/NavRail';
import { Hero } from './components/Hero';
import { FeaturedProject } from './components/FeaturedProject';
import { Experience } from './components/Experience';
import { Skills } from './components/Skills';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

export function App() {
  return (
    <div className="bg-void">
      <NavRail />
      <main>
        <Hero />
        <FeaturedProject />
        <Experience />
        <Skills />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: every test file across the project passes.

- [ ] **Step 6: Verify the production build succeeds**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "Assemble full page from all sections

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018qfxsQrxufX2kszSwYk3aH"
```

---

## Task 14: Final verification and polish

**Files:** none created; this task verifies the assembled site against the spec's non-negotiables.

**Interfaces:** none — this task runs commands and performs manual checks, no new exports.

- [ ] **Step 1: Run the full automated suite one more time**

Run: `npm test`
Expected: all tests pass, including the `contrastRatio` AA checks from Task 1.

- [ ] **Step 2: Build and preview the production bundle**

```bash
npm run build
npm run preview -- --port 4173 &
```

- [ ] **Step 3: Manual desktop pass**

With the preview server running, open `http://localhost:4173` in a browser and confirm:
- The particle field renders behind the hero name and parallaxes gently with the cursor, then eases out when scrolling to `#work`.
- The nav rail on the right highlights `01 WORK` / `02 EXPERIENCE` / `03 SKILLS` / `04 CONTACT` as you scroll past each section.
- The CraftTraq screenshot renders with its callouts positioned over the correct UI regions.
- No console errors in devtools.
- In devtools' Performance panel, record ~5 seconds of moving the cursor across the hero: no long frames flagged (frame time should stay comfortably under the 16ms/frame budget the particle field was designed for — see spec §7).

- [ ] **Step 4: Manual mobile-width / reduced-motion pass**

- Resize the browser to a mobile width (< 768px) and reload: confirm the hero shows the static gradient fallback, not the canvas (no WebGL context created — check devtools' Network/Memory or simply confirm no `<canvas>` element exists in the DOM at this width).
- In devtools, emulate `prefers-reduced-motion: reduce` and reload at desktop width: confirm the same static fallback renders instead of the canvas.

- [ ] **Step 5: Keyboard-only pass**

Tab through the page from the top: confirm every nav-rail link and every contact link receives a visible focus ring (the `accent-text` outline defined in Task 1's `index.css`), in a logical order, with no keyboard trap.

- [ ] **Step 6: No-JS pass**

In devtools, disable JavaScript and reload: confirm the `<noscript>` block from `index.html` renders the name, positioning line, and all four contact links as real, clickable HTML.

- [ ] **Step 7: Lighthouse mobile-emulation run**

```bash
npx lighthouse http://localhost:4173 --preset=desktop --output=json --output-path=./lighthouse-desktop.json --chrome-flags="--headless"
npx lighthouse http://localhost:4173 --output=json --output-path=./lighthouse-mobile.json --chrome-flags="--headless"
```

Expected: the mobile report's `audits["largest-contentful-paint"].numericValue` is under 2500 (ms); note the performance/accessibility category scores. Delete both JSON reports afterward (`rm lighthouse-desktop.json lighthouse-mobile.json`) — they're a one-time check, not build artifacts.

- [ ] **Step 8: Stop the preview server**

```bash
kill %1
```

- [ ] **Step 9: Record the outcome**

If every check in Steps 3-7 passes, the site is done. If any check fails (e.g. LCP over budget, a missing focus state, the canvas still mounting on mobile), fix it in the relevant component from the earlier task it belongs to, re-run that component's test file plus `npm run build`, and repeat Steps 3-7 before considering this task complete.

- [ ] **Step 10: Final commit (only if Step 9 required fixes)**

```bash
git add -A
git commit -m "Fix issues found in final verification pass

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018qfxsQrxufX2kszSwYk3aH"
```
