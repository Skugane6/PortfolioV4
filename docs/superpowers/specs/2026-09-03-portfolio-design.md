# Portfolio Site — Design Spec

Date: 2026-09-03
Owner: Searan Kuganesan

## 1. Objective

A single-page personal portfolio for Searan Kuganesan, a full-stack/software
engineering new grad (Western University, B.E.Sc. Software Engineering,
graduating 06/2026; SWE intern at Mitsubishi Heavy Industries;
builder of CraftTraq, a live multi-tenant SaaS product). The site must read
as deliberately designed, not template-generated, and must be built entirely
from the real inputs on hand — resume (`skuganesan_resume.pdf`), the
CraftTraq app screenshot (`crafttraq.png`), and the headshot (`hero.jpg`).
No invented metrics, no filler copy.

## 2. Design direction (chosen, not blended)

**Dark, atmospheric minimalism.** Near-black base, one accent color,
generous negative space, understated confidence. Chosen because:

- It's the direction the CraftTraq screenshot itself already commits to —
  dark console background, one bright orange accent, uppercase monospace
  micro-labels (`§ WORKSPACE`, `JOB-89ED`, `CL-01`). Reusing that palette and
  label language ties the portfolio's shell to the flagship case study
  instead of feeling like an unrelated skin wrapped around a screenshot.
- The resume's actual content (production SaaS, fleet-scale data
  infrastructure, ML pipelines) reads as shipped, serious engineering work,
  not a design portfolio — understated confidence fits better than kinetic
  typography or a literal CLI costume.

Rejected directions and why: Terminal/CLI-inspired would overstate the
"pure infra" angle when the resume is full-stack/product-heavy; split-screen
duotone would give a strong identity but one disconnected from anything
specific to Searan or CraftTraq.

## 3. Visual system

- **Color tokens** (defined in a Tailwind theme extension, not
  default-palette classes):
  - `bg-void` `#0a0a0c` (page background), `bg-raised` `#141417` (cards/panels)
  - `ink` `#f5f4f0` (primary text), `ink-dim` `#9a9a9e` (secondary text)
  - `accent` — saturated orange sampled from the CraftTraq screenshot's logo
    mark, used only for borders, active states, small UI marks (non-text or
    large-text use)
  - `accent-text` — a lightened tint of the same hue, contrast-checked to
    ≥4.5:1 against `bg-void` before it's used for any body-sized text
  - One duotone pair (`bg-void` + `accent`) used for the treated headshot
    image only
- **Type scale**: one display/serif or grotesque face for headlines (sizes
  restrained — largest headline caps around ~64–72px desktop, not
  oversized-editorial scale), one monospace face for all metadata: dates,
  section numbers, tags, nav labels, screenshot callouts. System font stack
  fallback defined for both (no external font blocking render).
- **Motion language**: slow, deliberate cubic-bezier easing on scroll
  reveals and section transitions (Framer Motion). No spring bounce, no
  parallax gimmicks beyond the hero particle field.
- Explicitly excluded: Inter/Poppins as the only typeface, purple→blue
  gradients, centered-hero-over-blurred-blob, generic Font Awesome icon
  grids, star-rating testimonial cards, hamburger-only nav.

## 4. Information architecture

Single page, anchor-scrolled, no React Router:

```
#hero        Hero
#work        Featured project — CraftTraq case study
#experience  Experience timeline + secondary projects
#skills      Skills, grouped by how they'd be described to a colleague
#contact     Contact
```

**Navigation**: a slim fixed rail (desktop: vertical, right edge; mobile:
collapses to a slim horizontal bar) listing mono-labeled section numbers
(`01 WORK`, `02 EXPERIENCE`, `03 SKILLS`, `04 CONTACT`) with the active
section highlighted via scroll position (IntersectionObserver). This
replaces the generic "horizontal link list + hamburger" pattern with
something that does real wayfinding work and matches the CraftTraq label
language.

## 5. Section content (all sourced from the resume/screenshot — no invented content)

### Hero
- Name: Searan Kuganesan
- Positioning line (not a job-title restatement): grounded in the actual
  throughline across his work — turning operational chaos (aircraft fleets,
  trade-contractor job sites) into systems people run their business on.
  Final copy is written during implementation and reviewed for voice, e.g.
  along the lines of: *"I build the systems operators run their business
  on — aircraft fleets, trade-contractor crews, whatever's underneath."*
- Visual: ambient particle field (see §7) behind the name; `hero.jpg`
  appears duotone-treated (desaturated, tinted with `accent`/`bg-void`)
  blended into the scene — not a circular avatar.
- One primary action: scroll cue / link to `#work`.

### Featured project — CraftTraq (`#work`)
Real case-study structure, screenshot as first-class content with
mono-labeled callouts (visually consistent with the screenshot's own
`§`/`JOB-XXXX` label style) rather than a caption under an image:

- **Problem**: trade contractors (plumbers, electricians, etc.) run jobs
  across paper quotes, group texts, and spreadsheets — no single system
  tracks a job from quote through crew assignment to invoice and payment.
- **Approach / contribution**: end-to-end job lifecycle management —
  shareable client quotes that auto-convert into jobs, drag-and-drop crew
  scheduling, status-tracked job records; invoicing, time tracking, and
  inventory management across 28+ tables with a PDF generation pipeline.
- **A specific decision worth explaining**: immutable task-assignment
  snapshots reconciled against live crew membership — i.e. a job's
  scheduled assignment is preserved as a point-in-time record even as the
  underlying crew roster changes, and reconciled against current
  membership rather than silently drifting.
- **Scope proof**: Stripe (tiered billing), QuickBooks OAuth2 payroll sync,
  Twilio SMS, Supabase Realtime for live job-status updates, delivered as a
  Progressive Web App.
- **Outcome**: live in production at crafttraq.com, multi-tenant SaaS
  platform for trade contractors.
- Tech stack line: React 19, TypeScript, FastAPI, PostgreSQL.
- `crafttraq.png` displayed large (optimized — see §8), with 2–3 short
  mono callouts pointing at specific UI regions (e.g. the kanban columns,
  the crew-assignment avatars).

### Experience (`#experience`)
- **Mitsubishi Heavy Industries** — Software Engineering Intern,
  Mississauga, Canada, 05/2024–08/2025. One concrete "what shipped" line
  plus supporting detail, pulled directly from the resume: full-stack
  component tracking system (React/Flask) serving 2,000+ aircraft across
  100+ operators; fleet prediction platform processing 400,000+ monthly
  records via pandas/NumPy ETL; scikit-learn utilization forecasting across
  50+ operators/6 regional markets; automated monthly reporting that cut
  manual processing time by 85%; Oracle database design; pytest/Jest suites
  at 85% coverage with CI/CD.
- Secondary projects (not the flagship, but real and specific):
  - **Portfolio Risk Dashboard** — React/Vite + Flask, Modern Portfolio
    Theory + Value-at-Risk analysis, yfinance integration,
    NumPy/Pandas/SciPy, recharts visualizations.
  - **Multi-Model Text Classification Pipeline** — BERT + CNN + BiLSTM
    ensemble, MLflow experiment tracking, back-translation/synonym-
    replacement data augmentation.
- Education line (Western University, B.E.Sc. Software Engineering,
  graduating 06/2026) as a compact footer element of this section, not a
  separate anchor.

### Skills (`#skills`)
Grouped by function, as Searan would describe the stack to a colleague —
not a decorative icon grid:
- **Ship it**: React, TypeScript, FastAPI, Flask, PostgreSQL, Tailwind CSS
- **Talk to other systems**: Stripe, Twilio, QuickBooks OAuth2, Supabase
  Realtime, AWS (S3/Lambda/Transcribe), Google Cloud Platform, Cloudflare
- **Move and shape data**: Python, pandas, NumPy, SciPy, scikit-learn,
  TensorFlow/BERT, SQL Server, Oracle, MongoDB
- **Keep it from breaking**: pytest, Jest, CI/CD, Azure DevOps, Docker, Git

### Contact (`#contact`)
Direct, low-friction, real links only: `mailto:` link, GitHub
(github.com/skugane6), LinkedIn (linkedin.com/in/searan-kuganesan), live
CraftTraq link (crafttraq.com). Copy is plain and specific to how he
actually wants to be reached — no "let's work together!" filler with no
follow-through.

## 6. Component breakdown

```
src/
  App.jsx                    — layout shell, section order, reduced-motion/viewport context
  data/
    experience.ts            — typed data: roles, dates, bullets
    projects.ts               — typed data: featured + secondary projects
    skills.ts                 — typed data: grouped skill clusters
  components/
    NavRail.jsx               — fixed section rail, active-section highlight
    Hero.jsx                  — name, positioning line, duotone headshot, mounts <ParticleField>
    ParticleField.jsx         — R3F canvas, lazy-loaded, cursor-parallax points
    ParticleFieldFallback.jsx — static CSS gradient/noise, used on reduced-motion/narrow viewports
    FeaturedProject.jsx       — CraftTraq case study layout + annotated screenshot
    ScreenshotCallout.jsx     — positioned mono-label callout on the screenshot
    Experience.jsx            — timeline + secondary project cards
    Skills.jsx                — grouped skill clusters
    Contact.jsx               — links + copy
    Footer.jsx                — minimal closing line
  hooks/
    useActiveSection.ts       — IntersectionObserver-based active-section tracking for NavRail
    useCanRender3D.ts         — prefers-reduced-motion + viewport-width gate for the 3D canvas
  styles/
    tokens.css or tailwind.config.js theme extension — color/spacing/type scale
```

Data flows one direction: static typed data files → section components. No
backend, no fetches — this is a static personal site.

## 7. 3D element — ambient particle field (the one job it does)

- Purpose: set mood in the hero, nothing else. It does not serve as
  navigation and does not appear anywhere else on the page.
- Implementation: `@react-three/fiber` + `drei`, a sparse `Points` field
  (roughly 800–1500 points depending on viewport, tuned during build to
  stay under the 16ms/frame budget), rendered with a simple additive
  points material — no post-processing passes.
- Interaction: pointer position is lerped into a small camera/points offset
  for a subtle parallax; on scroll past the hero, the field eases out
  (opacity/camera easing) rather than persisting behind other sections.
- Loading: the canvas is lazy-loaded (`React.lazy` + `Suspense`); a
  lightweight CSS gradient placeholder renders immediately so the hero text
  is interactive and readable before the canvas mounts. The 3D asset never
  blocks LCP.
- **Mobile/low-end fallback (mandatory, not optional)**: `useCanRender3D`
  checks `prefers-reduced-motion` and viewport width. If reduced motion is
  requested, or the viewport is a mobile width, the canvas is not mounted
  at all — `ParticleFieldFallback` (a static layered CSS gradient in the
  same palette) renders instead. This is a real swap, not a lower-fidelity
  3D scene, to guarantee battery/perf on the devices most likely to be
  affected.
- Accessibility: the canvas/container is `aria-hidden`; the hero's meaning
  (name + positioning line) is fully conveyed by real DOM text with no
  dependency on the canvas.

## 8. Assets & performance

- `hero.jpg` (400×400, ~30KB) — small enough to use directly for the
  duotone treatment; duotone effect applied via CSS blend mode
  (`mix-blend-mode`/CSS filter) over the raw image, not a pre-baked export,
  so the treatment stays crisp and themeable.
- `crafttraq.png` (1898×935, ~195KB) — converted to WebP with a
  reasonably-sized fallback during implementation (it's below-the-fold, not
  the LCP candidate, but still shouldn't ship untouched at full weight);
  `loading="lazy"` on the `<img>`.
- No external web fonts that block first paint; if a display face is
  pulled in, it's loaded with `font-display: swap` and a system fallback
  stack defined in the token file so text is never invisible while
  loading.
- Target: LCP < 2.5s on mobile emulation with the 3D canvas deferred.

## 9. Accessibility

- Full keyboard navigation through `NavRail` and all links; visible focus
  states styled to match the accent system (not the browser default outline
  removed with nothing in its place).
- `accent-text` contrast-checked to WCAG AA (≥4.5:1) against `bg-void`
  before use on any body text; the more saturated `accent` is reserved for
  borders/large-scale marks where the AA text threshold doesn't apply.
- All real `<img>` elements get real alt text (the headshot, the CraftTraq
  screenshot with a description of what it shows). The 3D canvas is
  `aria-hidden` with its meaning fully covered by adjacent real text.
- Site remains legible with JavaScript disabled/failed to load: since this
  is a plain Vite CSR build (no SSG/SSR — out of scope for a static
  personal site of this size), `index.html` ships a `<noscript>` block with
  the core content in plain HTML — name, positioning line, and the direct
  contact links (email/GitHub/LinkedIn/CraftTraq) — so a visitor without JS
  still gets the essential information and a way to reach out, even though
  the full interactive experience requires JS.

## 10. Tech stack

Vite + React 18 (functional components/hooks only), Tailwind CSS with a
custom token file (no default palette), Framer Motion for DOM
animation/scroll reveals, @react-three/fiber + drei for the hero particle
field only, no React Router (single page, anchor sections), static build
output suitable for Vercel.

## 11. Testing / verification plan

- Manual pass through all sections at desktop and mobile widths (including
  the 3D → static fallback swap at the mobile breakpoint and under
  `prefers-reduced-motion`).
- Keyboard-only pass: tab through nav rail and every link, confirm visible
  focus states.
- Contrast check on `accent-text`-on-`bg-void` and `ink`/`ink-dim`-on-
  `bg-void` combinations.
- Lighthouse mobile-emulation run against the production build (`vite
  build` + preview) checking LCP, and a general performance/accessibility
  score check.
- Confirm no console errors, confirm the particle field stays smooth
  (no dropped-frame stutter) by eye during interaction.

## 12. Out of scope

- CMS/backend, blog, multi-page routing, contact form (per spec, direct
  mailto/links instead), analytics (not requested), automated deployment
  (build is made deploy-ready; the actual deploy/domain decision is
  Searan's to trigger).
