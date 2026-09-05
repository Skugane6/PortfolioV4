# Blueprint restyle — design spec

Date: 2026-09-04
Reference: `Searan Kuganesan Portfolio (standalone) (1).html` (repo root; a design-tool export, not runnable code — used here as a visual/interaction reference only, not committed as source).

## Goal

Restyle the existing React/Vite/Tailwind/Framer-Motion portfolio to match the reference's visual style, layout, interactions, and animations — especially the scroll-driven "plane cutaway" opening animation in the Experience section — while preserving the site's existing content and functionality (real project/experience data, the animated `NetworkField` hero background, responsive `NavRail`, accessibility/reduced-motion handling, and the vitest test suite).

The reference's own Projects carousel is written in a non-functional mock syntax (a design-tool's proprietary templating: `ref={{ }}`, `sc-camel-on-click`, `style-hover`) and its interaction logic (imperative class-based DOM manipulation, `setInterval` tweening, no boundary/a11y handling) does not represent real, working code. That carousel is rebuilt here as proper, complete React.

## Decisions locked in during brainstorming

1. **"The sliding jobs section" = the Projects carousel**, not the Experience section (Experience has exactly one role today, so there is nothing to page between there).
2. **Projects carousel scope**: merge the current `FeaturedProject` (CraftTraq case study) and `Experience`'s "ALSO BUILT" secondary-project grid into one sliding rail, matching the reference's single `§ 02 · PROJECTS` section.
3. **Fonts**: fully adopt the reference's stack — IBM Plex Sans (body), Saira Condensed (display headings), Newsreader italic (hero/tagline accent), JetBrains Mono (labels, unchanged from today).
4. **Hero background**: keep the animated `NetworkField` (existing functionality), recolored to the reference's blues, combined with the reference's blueprint grid + radial glow and the real headshot photo (not the reference's "PHOTO" placeholder box).
5. **Section order**: Hero → Experience → Projects → Skills → Contact → Footer (reference order), vs. today's Hero → FeaturedProject → Experience → Skills → Contact.

## Section order & file map

`App.tsx`:
```
<NavRail />
<main>
  <Hero />
  <Experience />   {/* now: the plane cutaway */}
  <Projects />     {/* new: replaces FeaturedProject */}
  <Skills />
  <Contact />
</main>
<Footer />
```

| File | Change |
|---|---|
| `src/App.tsx` | Reorder sections; import `Projects` instead of `FeaturedProject`. |
| `src/components/FeaturedProject.tsx` + `.test.tsx` | Deleted — content absorbed into `Projects.tsx`. |
| `src/components/Projects.tsx` + `.test.tsx` | **New.** The sliding carousel (see §3). |
| `src/components/Experience.tsx` + `.test.tsx` | Rewritten around the plane-cutaway visual (see §2). Secondary-project grid removed (moved to Projects). Education line kept, relocated. |
| `src/components/Hero.tsx` + `.test.tsx` | Recomposed to the reference's centered layout; `NetworkField` recolored, unmasked (full-bleed). |
| `src/components/NavRail.tsx` + `.test.tsx` | Section list updated to `EXPERIENCE / PROJECTS / SKILLS / CONTACT`; restyled. |
| `src/components/Skills.tsx` + `.test.tsx` | Content/logic unchanged; typography/spacing pass only. |
| `src/components/Contact.tsx` + `.test.tsx` | Content/links unchanged; typography pass only. |
| `src/components/Footer.tsx` + `.test.tsx` | Restyled to the reference's dark mono-strip look; drops the separate navy band. |
| `src/data/projects.ts`, `src/data/experience.ts`, `src/data/types.ts` | Unchanged (already shaped correctly — `Projects.tsx` composes `featuredProject` + `secondaryProjects` locally). |
| `src/styles/index.css`, `tailwind.config.js` | Palette values + font families updated (see §4). |
| `src/styles/shared.ts` | `blueprintGrid` grid size/color tuned; new amber-based utility for the cutaway's status/progress accents. |
| `src/utils/contrast.test.ts` | Hex literals updated to the new palette, ratios re-verified (not just copied). |
| `index.html` | Google Fonts `<link>` swapped to the new families. |
| `src/components/networkField/NetworkField.tsx` | Particle/line colors tuned to the new blues. |

Housekeeping (not part of the visual work, done alongside it): the stray root-level `crafttraq.png` / `hero.jpg` duplicates (already staged, unreferenced by any import) get removed — the real copies live in `public/` and `src/assets/`. The standalone reference HTML stays untracked/local, not added to git.

## 2. Experience — the plane cutaway

### Layout

```
<section id="experience">          <!-- height: 360vh (scroll mode) or 110vh (tap/static) -->
  <div class="sticky top-0 h-screen">   <!-- the pinned stage -->
    <header row>  §01 · EXPERIENCE / CRJ-900 · SIDE ELEVATION / phase readout + progress bar
    <PlaneCutawaySvg />                  <!-- ported reference art -->
    <ContentBay>                         <!-- absolutely positioned over the mid-fuselage gap -->
      role, dates, location, highlights (numbered, staggered by pr)
    </ContentBay>
    <TapButton />                        <!-- only rendered in tap mode -->
    footer row: frame/sheet meta, education line
  </div>
</section>
```

### Progress model

One motion value `p ∈ [0,1]`, owned by a small hook (`useCutawayProgress`, colocated with `Experience.tsx`), computed per mode:

- **scroll**: on scroll/resize (rAF-throttled), `p = clamp(-rect.top / (rect.height - innerHeight), 0, 1)` where `rect` is the outer 360vh section's bounding rect.
- **tap**: `p` eased from 0→1 (open) or 1→0 (close) over ~900ms via `requestAnimationFrame` (cubic in/out), toggled by the "TAP TO OPEN/CLOSE CUTAWAY" button. No `setInterval` (the reference's approach) — a single rAF loop, cancelled on unmount/re-toggle.
- **static**: `p = 1` immediately, no listeners attached.

Mode is chosen once on mount: `prefers-reduced-motion: reduce` → `static`; else `pointer: coarse` or `innerWidth < 768` (reusing the same breakpoint as `useCanRender3D`) → `tap`; else `scroll`. Exposed as a small `useCutawayMode()` hook mirroring `useCanRender3D`'s shape for consistency.

Derived values (same formulas as the reference, computed from `p` each update and written as CSS custom properties on the stage's ref, so the SVG/content transforms stay pure CSS — no per-frame React re-renders):

- `pi = clamp(p / 0.13, 0, 1)` — intro fade/scale of the whole plane.
- `po = smoothstep(clamp((p - 0.13) / 0.42, 0, 1))` where `smoothstep(x) = x*x*(3-2x)` — the opening amount (skin rotation/translation, bay height).
- `pr = clamp((p - 0.48) / 0.28, 0, 1)` — content reveal inside the bay.
- Phase label: `p<0.12` → "HULL CLOSED", `p<0.3` → "LATCHES RELEASED", `p<0.55` → "CROWN LIFT · BELLY DROP", `p<0.9` → "BAY 02 EXPOSED", else "SEQUENCE COMPLETE".
- Progress bar width / `%` readout: `p` directly.

### SVG art

Ported 1:1 from the reference's `<svg viewBox="0 0 1600 420">` (the CRJ-900 side-elevation cutaway: dimension callouts, upper/lower fuselage skins with rivet-line detailing, cargo/avionics bay labels, nose and tail-cone groups). Converted to valid JSX (`stroke-width`→`strokeWidth`, `stop-color`→`stopColor`, `vector-effect`→`vectorEffect`, `text-anchor`→`textAnchor`, inline `transform-origin`/`transform-box` moved into `style` objects). Split into a dedicated file (`src/components/experience/PlaneCutawaySvg.tsx`) so `Experience.tsx` stays readable.

### Content bay

Absolutely positioned over the mid-fuselage gap; height animates via `calc(var(--po) * 101%)`. Renders `experience[0]`: dates, role/company, location, then highlights as a 2-column numbered grid, each item's opacity/translateY staggered by an offset of `pr` (matching the reference's per-item `(pr - n*0.08) * 3.4` pattern) — content is always mounted (visibility via opacity/height, not conditional rendering), so it's present for tests, no-JS, and SEO regardless of scroll position. Content-fits itself into the bay via a small `ResizeObserver`-driven scale (replacing the reference's manual `fit()`), so the numbered list never overflows on short viewports.

The education line moves to a small mono line under the pinned stage (footer row), replacing the reference's unrelated "FRAME STA / SHEET" meta with something equivalent in tone but tied to real content: e.g. `B.E.Sc. Software Engineering · Western University · 06/2026` alongside a `SHEET 01 / REV —` style tag, kept purely decorative/mono.

### Accessibility / reduced motion

- `static` mode fully replaces the animated affordances (hint text becomes "CUTAWAY SHOWN OPEN — REDUCED MOTION", no scroll/tap listeners).
- All motion is driven by CSS custom properties and plain scroll listeners — deliberately outside Framer Motion/`MotionConfig`, since this is a scroll-scrubbed effect rather than an enter/exit transition — but still fully gated on the same `prefers-reduced-motion` signal the rest of the app uses.

## 3. Projects carousel

New `src/components/Projects.tsx`. Section `id="projects"`, header `§ 02 · PROJECTS` with a live `01 / 04` counter and prev/next buttons, matching the reference's header row.

Slides array: `[featuredProject, ...secondaryProjects]` (from `data/projects.ts`, unchanged). Slide 1 renders the full case-study layout currently in `FeaturedProject.tsx` (screenshot, LIVE badge, problem/approach/decision/scope grid, outcome link). Slides 2–4 render the lighter card layout currently in `Experience.tsx`'s "ALSO BUILT" grid (image, tagline, stack chips, optional external link) — same markup, ported as a slide instead of a grid cell.

Implementation (real React, not the reference's imperative DOM code):

- `const [index, setIndex] = useState(0)`, clamped `goTo(i)` helper (`Math.max(0, Math.min(slides.length - 1, i))`).
- Rail: a flex row inside an `overflow-hidden` viewport; `transform: translateX(-index * slideWidth)` with a CSS transition, skipped (instant) under `prefers-reduced-motion` (via the existing `useReducedMotion` from Framer Motion, consistent with `Reveal`/`MotionConfig` elsewhere).
- `slideWidth` measured with a `ResizeObserver` on the viewport element (`useLayoutEffect`), not the reference's manual `alignRail`/window-resize-only approach — keeps it correct across orientation changes and content-driven reflow.
- Prev/Next buttons: `aria-label="Previous project"` / `"Next project"`, `disabled` at `index === 0` / `index === slides.length - 1` (a real completion vs. the reference's inert-but-clickable buttons).
- Chips row below: one button per slide, click calls `goTo(i)`, active chip gets `aria-current="true"` and the accent border/text treatment.
- Keyboard: `ArrowLeft`/`ArrowRight` call `goTo(index ∓ 1)` when the section is within the viewport (bounding-rect check on keydown, matching the reference's scoping so it doesn't hijack arrow keys site-wide).
- Swipe: `pointerdown`/`pointerup` delta on the rail; a drag is treated as a swipe only when horizontal delta exceeds both a fixed threshold (48px) and the vertical delta, so it can't hijack vertical page scrolling on touch.
- `01 / 04` counter wrapped in `aria-live="polite"`.

## 4. Visual system

### Fonts

`index.html`'s Google Fonts `<link>` swapped to load: IBM Plex Sans (400/500/600, italic 400), Saira Condensed (500/600/700), Newsreader (italic 400), JetBrains Mono (400/500, unchanged). `tailwind.config.js`:

```js
fontFamily: {
  sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  display: ['"Saira Condensed"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  serif: ['Newsreader', 'ui-serif', 'Georgia', '"Times New Roman"', 'serif'],
  mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
}
```

### Palette

Token *names* in `index.css` stay the same (minimal churn across components); *values* move to the reference's tones, plus one new token:

```css
--color-bg: #0a0d13;        /* was #0b0e13 */
--color-surface: #12161f;   /* was #151a21 */
--color-ink: #e7ecf3;       /* was #e7eaee */
--color-ink-dim: #8b94a3;   /* unchanged — already close */
--color-border: #232b3a;    /* was #232a35 */

--color-accent: #2f6ad4;        /* was #2563eb */
--color-accent-hover: #4f7ad0;  /* was #3b82f6 */
--color-accent-text: #5b8ff0;   /* was #4c8dff — re-verified for 4.5:1 in contrast.test.ts */
--color-accent-wash: rgba(79, 122, 208, 0.14);

--color-amber: #f0a02a;     /* new — cutaway progress bar, phase hint, bay status pill */
```

Section backgrounds vary per the reference rather than one flat `bg`: Hero `#0b1322`, Experience `#07090d`, Projects/Skills `#12161f` (i.e. `surface`), Contact back to `bg`. These are applied as explicit section `background` values (Tailwind arbitrary values or small utility constants in `shared.ts`), not new tokens, since they're one-off per-section choices in the reference rather than reusable semantic colors.

`--color-navy` (the footer-only accent) is retired — the footer moves to the reference's dark mono-strip look on the base `bg`.

`contrast.test.ts` gets its hex literals updated to match, and every assertion re-run (not assumed) to confirm AA still holds with the new blues.

### Hero

Recomposed to the reference's centered composition: circular headshot (real photo, not a placeholder), centered name (Saira Condensed, large), centered italic tagline (Newsreader), centered CTA row (résumé download + "SEE THE WORK"), "SCROLL" cue pinned to the bottom. `NetworkField` becomes a full-bleed background layer (the current left-side mask is removed) and its particle/line/hub colors are tuned from the current `#2f6fdb`/`#4c8dff`/`#8fc4ff` to the new `#2f6ad4`/`#5b8ff0`/`#8fa2bb` family. Blueprint grid + radial glow follow the reference's exact gradient stops, scaled to the new palette.

### NavRail, Skills, Contact, Footer

- **NavRail**: same responsive shape (desktop vertical rail, mobile bottom bar, active-section dot via `useActiveSection`), section list updated to `01 EXPERIENCE / 02 PROJECTS / 03 SKILLS / 04 CONTACT`, font/color pass only.
- **Skills**: content and grouping logic untouched (reference explicitly marks this "existing section — unchanged"); only the section eyebrow/heading typography and spacing move to the new fonts/tokens.
- **Contact**: same links/data; heading and link-row typography moved to Saira Condensed / new mono treatment.
- **Footer**: same "BUILT BY SEARAN KUGANESAN" copy, restyled as a mono strip on the base dark background instead of the separate navy band.

## Testing

- Existing test files (`Hero`, `Experience`, `NavRail`, `Skills`, `Contact`, `Footer`, `contrast`) updated in place: same assertions style (render + `screen` queries by role/text), updated for new markup/copy/hex values where those change.
- `FeaturedProject.test.tsx` removed; replaced by `Projects.test.tsx` covering: all 4 slide names render, Next/Prev move `index` and update the counter/chips, boundary buttons are `disabled` at the ends, clicking a chip jumps to that slide, `ArrowRight`/`ArrowLeft` navigate when the section is in view.
- New `Experience` coverage for the cutaway: mode selection (`matchMedia` mocked for reduced-motion and coarse-pointer, following the existing `useCanRender3D.test.ts` pattern) resolves to `scroll` / `tap` / `static` correctly; phase-label thresholds; static mode renders fully open with no listeners attached.
- jsdom has no real scroll/`ResizeObserver` layout, so scroll-driven `p` math itself is covered by extracting the pure derivation functions (`computeProgress`, `smoothstep`, phase-label lookup) into a plain, unit-testable module (mirroring how `parallax.ts` is already unit-tested separately from `NetworkField.tsx`), rather than trying to assert on live scroll behavior in component tests.

## Out of scope

- No content changes beyond what's already in `data/*.ts` (copy, project list, experience entries, skills, contact links all stay as-is).
- No multi-role paging in the Experience cutaway (only one role exists; the data shape already supports more if that changes later).
- No light theme / theme toggle (site remains dark-only, per existing `index.css` comment).
