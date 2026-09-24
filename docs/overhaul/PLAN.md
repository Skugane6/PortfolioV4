# Portfolio overhaul (drawing set, rev C): implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:subagent-driven-development for the self-contained tasks marked ⧉, and superpowers:executing-plans for the rest. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the portfolio as one coherent engineering drawing set (cover → side elevation → detail drawings → assembly/BOM → approval) that meets the brief's quality bar.

**Architecture:** Vite 5 + React 18 + TypeScript + Tailwind 3 (no framework migration). All content lives in typed modules under `src/content/`, and components read only from there. Motion (`motion/react`, `LazyMotion`) is the single animation runtime. Scroll sequences use CSS `sticky` plus `useScroll`. Heavy demos are code-split and load on opt-in. Git metadata is injected at build time by a small Vite plugin.

**Tech stack:** React 18.3, TypeScript 5.6 strict, Vite 5.4, Tailwind 3.4, motion 13, @mediapipe/tasks-vision (lazy), Vitest + Testing Library, @playwright/test, @axe-core/playwright, ESLint 9 (typescript-eslint, react-hooks, jsx-a11y).

**Spec:** `docs/overhaul/DESIGN.md` (design), `docs/overhaul/CONTENT.md` (copy), `docs/overhaul/AUDIT.md` (problems to fix).

**Execution method (decided, not asked, per the brief):** I implement the tightly coupled UI tasks myself, so shared tokens and components stay consistent. Self-contained tasks (⧉) go to fresh subagents with their own review. After the build, a fresh subagent does a code review and another does a design review from screenshots only.

## Global constraints

- Branch `overhaul/v2`. Small logical commits. Never commit to or merge into `master`. No force-push. No production deploy. Pushing the branch for a Vercel preview is allowed.
- Truth: no invented facts. Every current factual claim survives (CONTENT.md). Illustrative data is labelled "Illustrative data".
- Keep your assets in `public/` and `src/assets/`. Delete none of them.
- Colours: only the six tokens in DESIGN.md §4.1 and their alpha variants. Text colours at 4.5:1 or better on `#0f2a4c`, enforced by a unit test.
- Type: Archivo (width 62–100, weight 400–700) and B612 Mono (400/700) only. Self-hosted woff2. No functional text under 13 px (the brief's floor is 12; DESIGN.md sets 13). Body at 16 px or more.
- Uppercase only for drawing lettering, with tracking of 0.04em or less.
- Motion: transforms and opacity only. One owner per element. Offscreen work paused. Reduced motion gets a designed static state.
- Performance budget: initial JS ≤ 200 KB gzip (target 170). Lighthouse mobile perf ≥ 90, a11y 100, best practices ≥ 95, SEO 100. LCP ≤ 2.0 s (mobile throttled). CLS ≤ 0.05. INP ≤ 200 ms.
- `npm run lint`, `npm run typecheck`, `npm test` and `npx playwright test` pass at every commit from Task 1 on.

## Review focus

The input classes the spec implies but a happy-path test wouldn't catch, most likely first. Each has a test in its owning task.

1. **Keyboard focus lands on something invisible.** A focused Experience card, BOM row or palette item mid-animation must be fully opaque and on screen. Test in Task 4 (`e2e/experience.spec.ts › focus reveals card`) and Task 8.
2. **Resize across the pin breakpoint mid-scroll** (1280 → 900 wide, 900 → 640 tall) must leave no stuck opacity or transform, and the page must stay scrollable. Test in Task 4 (`resize mid-survey`).
3. **Deep link and Back** (`/#projects/crafttraq`): the dialog opens on load, Back closes it, focus returns to the figure, and Escape works. Test in Task 5.
4. **Demo failure paths:** camera denied or unavailable, model or WASM fetch failure (offline), clipboard API missing (insecure context). Each shows a plain message and a fallback. Tests in Tasks 6, 7, 10 (`page.route` aborts, permission denied).
5. **Short and odd viewports** (844 × 390 landscape phone, 1366 × 640 laptop, 1920 × 1080): no clipped text, no content under the nav, no horizontal scroll. Test in Task 13 (`e2e/layout.spec.ts` checks `scrollWidth <= innerWidth` and nav/content rect intersections).

---

## File structure

```
src/
  main.tsx, App.tsx                 app shell composition only
  content/                          ← all editable content (typed)
    types.ts                        Profile, Role, Callout, Project, CaseStudy, Skill, …
    profile.ts                      identity, positioning, contact, availability, datum, education
    experience.ts                   roles → callouts (stationIn, zone, title, caption, impact, …)
    projects.ts                     FIG entries + case studies + demo kind + screens
    skills.ts                       parts + groups (existing data, kept)
    aircraft.ts                     drawing constants, spec table rows, sources
    sheets.ts                       the sheet index (id, number, title, drawingTitle)
  lib/
    stations.ts   stationFromX(x), xFromStation(in), DRAWING constants
    usage.ts      deriveUsage(skills, roles, projects) → Map<skillName, UsageRef[]>
    time.ts       formatZoneTime(date, tz) → "14:32"
    scale.ts      drawingScale(renderedPx) → 1:N (CSS inches)
    contrast.ts   (moved from utils) WCAG contrast
    motion.ts     tokens: durations, easings, springs; useReducedMotionPref()
    buildInfo.ts  typed access to the injected build info
  design/
    tokens.css    CSS custom properties (colour, type, line, space, motion)
    base.css      resets, focus style, sheet grid ground, print whiteprint
    contrast.test.ts
  components/
    shell/        SheetFrame, TitleBlock, SheetIndex, TitleStrip, SkipLink, CommandPalette, Crosshair, Intro, consoleNote.ts
    drawing/      Airframe.tsx (+ airframeGeometry.ts), DetailBubble, Dimension, Stamp
    cover/        Cover.tsx, ProofRefs.tsx, LocalTime.tsx
    experience/   Experience.tsx, SurveyStage.tsx, CalloutCard.tsx, SpecTable.tsx, useSurvey.ts
    projects/     Projects.tsx, Figure.tsx, CaseStudyDialog.tsx, ArchitectureDiagram.tsx, DeviceFrames.tsx
    demos/        RiskDemo.tsx (+ risk.ts), TextDemo.tsx (+ classifier.ts), EyeDemo.tsx (+ gaze.ts), SimulatedGaze.tsx
    skills/       Skills.tsx, ExplodedView.tsx, BomTable.tsx, PartDetail.tsx
    contact/      Contact.tsx, ApprovalForm.tsx, CopyEmail.tsx, RevisionBlock.tsx
    companion/    Pet.tsx (oneko wrapper, one skin)
  oneko/          vendored (kept, trimmed to one skin)
public/
  fonts/          archivo-var.woff2, b612mono-400.woff2, b612mono-700.woff2
  models/         text-classifier.json (≈300 KB, lazy)
  og.png, favicon.ico, favicon.svg, apple-touch-icon.png, icon-192.png, icon-512.png, site.webmanifest, sitemap.xml, robots.txt, 404.html
api/contact.ts                      Vercel function (Resend, falls back to 501)
vercel.json                         cache headers, 404
scripts/
  build-fonts.py, train-classifier.mjs, generate-og.mjs, generate-icons.mjs
e2e/                                @playwright/test specs (one per task)
```

---

### Task 1: Foundation: tooling, tokens, fonts, content module, shell

**Files:** create `src/design/*`, `src/content/*`, `src/lib/{stations,time,scale,contrast,motion,buildInfo}.ts`, `src/components/shell/{SheetFrame,TitleBlock,SheetIndex,TitleStrip,SkipLink}.tsx`, `scripts/build-fonts.py`, `public/fonts/*`, `eslint.config.js`, `playwright.config.ts`, `e2e/shell.spec.ts`. Modify `package.json`, `vite.config.ts` (build-info plugin), `tailwind.config.js`, `index.html` (preloads, no Google Fonts), `src/App.tsx`.

**Interfaces produced:**
- `SheetFrame({ id, sheet: SheetMeta, children, titleBlockExtra? })`: renders `<section id aria-labelledby>`, the border and zone ticks, and the sheet's `TitleBlock` at its foot.
- `TitleBlock({ rows: TitleBlockRow[] })` where `TitleBlockRow = { label: string; value: ReactNode; wide?: boolean }`.
- `sheets: SheetMeta[]` where `SheetMeta = { id: 'cover'|'experience'|'projects'|'skills'|'contact'; number: 1..5; title: string; drawingTitle: string }`.
- `buildInfo: { hash: string; date: string; revisions: { hash: string; date: string; subject: string }[] }`.

- [ ] **Step 1:** install `motion`, `@playwright/test`, `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `globals`. Add scripts `lint`, `typecheck` (`tsc -b --noEmit`), `e2e`.
- [ ] **Step 2:** write the failing test `src/design/contrast.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../lib/contrast';
import { palette, textTokens } from './palette';

describe('palette', () => {
  it.each(textTokens)('%s clears 4.5:1 on the cyanotype ground', (token) => {
    expect(contrastRatio(palette[token], palette.cyanotype)).toBeGreaterThanOrEqual(4.5);
  });
  it('construction lines clear 3:1 for non-text graphics', () => {
    expect(contrastRatio(palette.construction, palette.cyanotype)).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 3:** implement `src/design/palette.ts` (the six hexes from DESIGN.md §4.1; `textTokens = ['blueprint','faded','redline','checker']`) and `tokens.css`. Run `npx vitest run src/design`. Expected: PASS.
- [ ] **Step 4:** write the failing `src/lib/stations.test.ts`:

```ts
import { stationFromX, xFromStation, DRAWING } from './stations';
it('nose is station 0 and the far tail is the full length in inches', () => {
  expect(stationFromX(DRAWING.noseX)).toBe(0);
  expect(stationFromX(DRAWING.tailX)).toBe(Math.round(DRAWING.lengthM * 39.3701));
});
it('round-trips', () => { expect(Math.round(xFromStation(stationFromX(1020)))).toBe(1020); });
it('the four callout stations', () => {
  expect([240, 1015, 1551, 1836].map(stationFromX)).toEqual([145, 616, 942, 1116]);
});
```

Implement `stations.ts` with `DRAWING = { noseX: 2, tailX: 2106, lengthM: 32.51 }`, `stationFromX = x => Math.round((x - noseX) / (tailX - noseX) * lengthM * 39.3701)`. PASS.
- [ ] **Step 5:** `scripts/build-fonts.py` instances Archivo to width 62–100 and weight 400–700, subsets Latin plus the punctuation in use, and writes woff2. B612 Mono 400/700 is copied as woff2. `@font-face` rules in `tokens.css` with `font-display: swap`, plus metric-override fallbacks (`size-adjust`, `ascent-override`) computed by the script and printed for pasting. Preload the Archivo and B612 Mono 400 files in `index.html`.
- [ ] **Step 6:** content module. Move the data from `src/data/*` into `src/content/*` with the new fields (CONTENT.md). Write the failing `src/content/content.test.ts` asserting: 4 callouts with stations `[145,616,942,1116]` in ascending order; every project has a `fig` 1–4, unique; no text field is empty; `profile.email === 'searan.kuganesan4@gmail.com'`; the hero stat "10 projects shipped" is present verbatim. Implement the data. PASS.
- [ ] **Step 7:** build-info Vite plugin. A virtual module `virtual:build-info` reads `git log -3 --format=%h%x1f%cI%x1f%s`, falling back to `VERCEL_GIT_COMMIT_SHA` and then to `'dev'`.
- [ ] **Step 8:** shell components and `App.tsx`. The five sheets render as stubs inside `SheetFrame`, plus `SheetIndex`, `TitleStrip` and `SkipLink`. Old section components stay importable but unused.
- [ ] **Step 9:** write `e2e/shell.spec.ts`: (a) the skip link is the first tab stop and moves focus to `#main`; (b) the index has 5 links with numbers 01–05 matching each sheet's title block text; (c) clicking "04 Skills" scrolls `#skills` into view and marks it `aria-current`; (d) no console errors; (e) axe on the shell reports 0 violations. Run `npx playwright test e2e/shell.spec.ts`. Expected: PASS.
- [ ] **Step 10:** commit, e.g. `Lay the drawing-set foundation: tokens, fonts, content module, sheet shell`.

**Acceptance:** fonts load from `/fonts/` (network shows no googleapis). Lint, typecheck and unit tests pass. The shell e2e passes at 375 and 1440.

### Task 2: The airframe drawing

**Files:** `src/components/drawing/{airframeGeometry.ts,Airframe.tsx,DetailBubble.tsx,Dimension.tsx,Stamp.tsx}`, `src/components/drawing/Airframe.test.tsx`.

**Interfaces:** `Airframe({ progress?: MotionValue<number>|number; stations?: { id; x; active?: boolean }[]; onStationFocus?; detail: 'key'|'full'; title: string })`. Parts are grouped `object | thin | hidden | center | panel`, each a `<path pathLength=1>` so plotting is `pathLength` 0→1. `STATION_X: Record<calloutId, number>`.

- [ ] Test: render with `detail="full"` and assert an `<svg role="img">` with a `<title>` and 4 station buttons with accessible names "Station 145, fwd fuselage" and so on. Assert that `progress=0` renders `pathLength` 0 on object paths and `progress=1` renders 1.
- [ ] Implement from the traced geometry in the design spike: fin meets the T-tail, smooth dorsal fillet, `vector-effect: non-scaling-stroke`.
- [ ] Playwright visual check: `e2e/drawing.spec.ts` renders `/?fixture=airframe` (dev-only fixture route) at 1440 and saves `docs/overhaul/screenshots/after/fixtures/airframe.png`. Assert the SVG's bounding box aspect ratio is within 1% of the viewBox.
- [ ] Commit.

### Task 3: Sheet 01, the cover

**Files:** `src/components/cover/{Cover,ProofRefs,LocalTime}.tsx`, `src/lib/time.test.ts`, `e2e/cover.spec.ts`.

- [ ] Unit test `formatZoneTime(new Date('2026-09-24T18:32:00Z'), 'America/Toronto') === '14:32'`. Implement with `Intl.DateTimeFormat`. The minute tick aligns to minute boundaries (one `setTimeout` chain, paused when the tab is hidden).
- [ ] Implement per DESIGN.md §6: h1 name, positioning paragraph (CONTENT.md §1), actions, proof references as `DetailBubble` links to `#experience-sta-145`, `#fig-1`, `#education`. Key drawing (`Airframe detail="key"`). Title block with DRAWN / STATUS (HOLD) / DATUM / LOCAL / SHEET / REV / DATE / SCALE NTS.
- [ ] e2e: at 375 and 1440, the h1 is the LCP candidate and visible without animation (opacity 1 at `domcontentloaded`); every proof link's target exists; the résumé link returns 200 with `application/pdf`; the STATUS field contains "HOLD" while `availability.seeking` is null; `LOCAL` matches `/^\d{2}:\d{2}$/`; axe reports 0 violations.
- [ ] Commit.

### Task 4: Sheet 02, the side elevation (Experience)

**Files:** `src/components/experience/{Experience,SurveyStage,CalloutCard,SpecTable,useSurvey}.tsx`, `e2e/experience.spec.ts`.

**Interfaces:** `useSurvey(ref, callouts.length) → { progress: MotionValue<number>; mode: 'pinned'|'flow'|'static'; activeIndex: number }`. Mode `pinned` needs width ≥ 1024 **and** height ≥ 700 **and** motion allowed. `flow` covers smaller or shorter viewports. `static` is reduced motion.

- [ ] Unit test for the pure `surveyPhases(p, n)`: the plot occupies [0, 0.18]; callout *i* docks in `[0.18 + i*w, 0.18 + (i+1)*w)` with `w = 0.72/n`; the stamp lands at ≥ 0.96. `surveyPhases(1, 4).stamp === 1`. `surveyPhases(0.5, 4).docked` is `[1,1,0.x,0]`, i.e. monotonic.
- [ ] Implement pinned mode: section height `(n + 2) * 70vh`, a sticky stage, the airframe plotting by `pathLength`, cards in one row ordered fore to aft, leaders from station to card, a readout 0–100%, and the stamp "SURVEY COMPLETE · 08/2025".
- [ ] Implement flow mode: the airframe is sticky at the top of the sheet, cards flow in normal scroll, and an IntersectionObserver sets `activeIndex` to light a station.
- [ ] Static mode: fully plotted, all cards and the stamp shown.
- [ ] Linked highlighting: a card's hover or focus sets the active station, and a station button's focus or click scrolls to and highlights its card.
- [ ] Card: title, caption (subtitle), impact line, and a "Details" disclosure (`<button aria-expanded>`) with the description and tags.
- [ ] SpecTable: a real `<table>` with a caption and sources as footnotes.
- [ ] e2e (the review-focus tests): **focus reveals card**: tab to each card in pinned mode; its computed opacity is 1 and its rect is inside the viewport. **Survey completes**: scroll to the section end; the readout is "100%" and the stamp is visible. **Resize mid-survey**: at 50% progress, resize 1440→900 wide and back; no element keeps opacity < 1 in static regions, and `document.scrollingElement.scrollHeight` is recomputed. **Reduced motion**: all four cards are visible at their natural position without scrolling the pin. Screenshots at 0/25/50/75/100% at 1440 and 375 go to `screenshots/after/`.
- [ ] Commit.

### Task 5: Sheet 03, detail drawings (Projects) and the case-study dialog

**Files:** `src/components/projects/{Projects,Figure,CaseStudyDialog,ArchitectureDiagram,DeviceFrames}.tsx`, `e2e/projects.spec.ts`.

- [ ] All four figures are visible. FIG. 1 spans two columns from 1024 px. `DeviceFrames` shows the board and phone screenshots (`<picture>`, WebP, explicit width and height, `loading="lazy"`), panning with scroll via `useScroll` (static under reduce).
- [ ] `CaseStudyDialog` uses native `<dialog>` with `showModal()`, so focus trap and Escape are native. `layoutId` goes from the figure frame to the dialog frame. Hash sync: `#projects/<id>` opens it; closing does `history.back()` when opened by push, or replaces the hash when opened from a deep link. Focus returns to the invoking button.
- [ ] `ArchitectureDiagram` takes `{ nodes, edges }` from the content and draws boxes and leader-style arrows in line tokens. Every node label appears verbatim in the case-study text or stack (enforced by a unit test).
- [ ] e2e: all 4 figure headings are visible at 1440 without interaction. Open each dialog by click, and by deep link `/#projects/crafttraq` on load. Back closes it and focus returns. Escape closes it. axe inside the open dialog reports 0 violations. No unsourced metric strings (the regex list from CONTENT.md §5) appear in the DOM.
- [ ] Commit.

### Task 6 ⧉: Risk demo (illustrative)

**Files:** `src/components/demos/{risk.ts,risk.test.ts,RiskDemo.tsx}`.

- [ ] Tests for `portfolioStats(weights, mu, cov) → { ret, vol, var95 }`: weights summing to 1; `var95 = -(ret - 1.645*vol)` for a 1-day horizon; `frontier(mu, cov, 60)` points are non-dominated (return increases with volatility along the upper branch).
- [ ] UI: three sliders (weights re-normalised) with keyboard steps of 5%, an SVG chart (frontier curve, random-portfolio cloud as construction dots, current point in redline), and readouts. The "Illustrative data, not market data" label is always visible.
- [ ] e2e: pressing ArrowRight on slider 1 changes the readout text, and the label is present.
- [ ] Commit.

### Task 7 ⧉: Text classifier (trained for the page) and demo

**Files:** `scripts/train-classifier.mjs`, `public/models/text-classifier.json`, `src/components/demos/{classifier.ts,classifier.test.ts,TextDemo.tsx}`.

- [ ] Script: download N=30k balanced rows of `fancyzhx/amazon_polarity` (Apache-2.0) from the HF datasets-server rows API, with a cached local copy in `$TEMP`. Lowercase and tokenize, unigrams plus bigrams hashed into 2^18 buckets, prune to the top 12k features by document frequency, train L2 logistic regression with SGD for 5 epochs, evaluate on a 5k held-out split, and write `{ vocab: string[], weights: number[], bias, accuracy, n_train, n_test, dataset, license }` quantised to 3 decimals. The JSON must be ≤ 400 KB.
- [ ] `classifier.ts`: `tokenize(s)`, `features(tokens)`, `predict(model, s) → { label, p, tokens, contributions: {term, weight}[] }`. Tests: a positive sentence scores > 0.5, a negative one < 0.5 (from a fixture model); tokenization strips punctuation; contributions sum to the logit minus bias.
- [ ] UI: an input field and the stages drawn as a pipeline (clean → tokens → features (top contributions) → model → label with probability). The disclosure from CONTENT.md §5 includes the measured accuracy read from the JSON. The model loads on first focus of the input.
- [ ] e2e: route-abort the model URL → message "Couldn't load the model. Check your connection and try again." plus a Retry button. The happy path types "great quality, works perfectly" → label Positive.
- [ ] Commit.

### Task 8 ⧉: Eye-tracking demo (opt-in) and simulated fallback

**Files:** `src/components/demos/{EyeDemo,SimulatedGaze,gaze.ts,gaze.test.ts}.tsx`.

- [ ] `gaze.ts`: `irisRatio(landmarks) → {x,y}` from iris centres (468, 473) relative to the eye corners (33/133, 362/263) and lids (159/145, 386/374); `smooth(prev, next, alpha)`; `isBlink(blendshapes, threshold=0.5)` from `eyeBlinkLeft`/`eyeBlinkRight`, debounced 250 ms. Tests with synthetic landmark fixtures.
- [ ] `EyeDemo`: a start button stating the ~16 MB download and on-device processing. `getUserMedia` → dynamic `import('@mediapipe/tasks-vision')` → `FaceLandmarker.createFromOptions` (WASM from the jsDelivr path pinned to the installed version; model `face_landmarker.task` float16 v1). A 5-point calibration (look at each corner and the centre), then a reticle over a 3×3 target grid; a blink selects the highlighted target. Stop releases the camera tracks. It pauses when offscreen or the dialog closes.
- [ ] Failure paths: `NotAllowedError` → "Camera permission was denied, so here's a simulation of the same pipeline." `NotFoundError` or WASM failure → the same with the reason. Both mount `SimulatedGaze`.
- [ ] e2e: with no permission granted (Playwright default), clicking start shows the denial message and the simulation. The camera is never requested before the click (`page.on('console')` shows no getUserMedia; the network has no mediapipe requests before the click).
- [ ] Commit.

### Task 9: Sheet 04, assembly and BOM (Skills)

**Files:** `src/lib/usage.ts`, `src/lib/usage.test.ts`, `src/components/skills/{Skills,ExplodedView,BomTable,PartDetail}.tsx`, `e2e/skills.spec.ts`.

- [ ] Test `deriveUsage`: "React" is used by callout "Component Tracker" (tag "React") and projects CraftTraq ("React 19") and Portfolio Risk Dashboard ("React"). "Oracle" is used by "Maintenance Scheduling Engine". "Docker" has QTY 0, which is allowed and shown as "—". Matching is case-insensitive on whole words, with aliases (`'Python / Flask' → ['Python','Flask']`, `'React 19' → 'React'`, `'Pandas' → 'pandas'`, `'CRJ700 / 900'` matches nothing).
- [ ] `BomTable`: a real `<table>`; each row's part name is a `<button aria-pressed>`; group filter buttons with counts; sortable by ITEM or QTY. `PartDetail` has the default "Most used" (top 5 by QTY) and a selected state with "Used in" links (`#exp-card-<id>`, `#fig-<n>`).
- [ ] `ExplodedView`: four isometric plates, one per group, with balloons (item numbers). Scroll-linked separation in `useScroll` (static exploded under reduce). Hovering or focusing a plate filters; selecting a row highlights its balloon with the cut line.
- [ ] e2e: keyboard Tab into the table, Enter on "Oracle" → the detail shows "Maintenance Scheduling Engine", and following the link focuses that card on sheet 02. A tap works at 375 with `hasTouch`. The default state is not empty.
- [ ] Commit.

### Task 10: Sheet 05, approval (Contact) and footer

**Files:** `src/components/contact/{Contact,ApprovalForm,CopyEmail,RevisionBlock}.tsx`, `api/contact.ts`, `e2e/contact.spec.ts`.

- [ ] `api/contact.ts` (Node runtime): validates `{name ≤ 100, email RFC-ish ≤ 254, message 1–4000, company (honeypot) empty}`, posts to `https://api.resend.com/emails` with `RESEND_API_KEY`, `CONTACT_TO`, and `CONTACT_FROM` (default `onboarding@resend.dev`), and returns `{ok:true}`. Missing keys → 501 `{ok:false, reason:'not-configured'}`. Validation failure → 400 with the field.
- [ ] `ApprovalForm`: native labels and inline errors (`aria-describedby`). On 501 or network error it opens a prefilled `mailto:` and shows the fallback copy. Success stamps APPROVED.
- [ ] `CopyEmail`: copies with a confirmation "Copied to clipboard" (announced). With no clipboard API it selects the address text and says "Press Ctrl+C to copy".
- [ ] `RevisionBlock`: the last 3 revisions from `buildInfo`, the build hash, "Source on GitHub", and "Back to cover".
- [ ] e2e: copy with clipboard permissions granted → the clipboard equals the email. `page.route('/api/contact', 501)` → the mailto fallback message appears. Empty message → inline error and focus moves to the field. Reduced motion shows the final stamp without animation.
- [ ] Commit.

### Task 11: Global interactions

**Files:** `src/components/shell/{CommandPalette,Crosshair,Intro,consoleNote}.ts(x)`, `src/components/companion/Pet.tsx`, `src/oneko/lib/oneko/skin-sheets.json` (trimmed), `e2e/global.spec.ts`.

- [ ] CommandPalette: a `<dialog>` with a combobox + listbox pattern (`aria-activedescendant`). Opens with Ctrl/⌘K and "/" and the index button. Commands per DESIGN.md. Fuzzy match on title and keywords. Closes with Escape and restores focus.
- [ ] Crosshair: `(pointer: fine)` and motion allowed only. `pointer-events: none`. Writes transforms in a rAF only while the pointer moves. Readout is zone plus mm. Snap brackets hug `a, button, [role=option]` bounds. The toggle state is kept in localStorage (try/catch).
- [ ] Intro: first visit per `sessionStorage`, ≤ 1.1 s, finishes on any input. The h1 is never hidden.
- [ ] Pet: one skin, roam area = the cover title block's top rule, `pointer-events: none` except on the sprite, hidden when the cover is offscreen, static under reduce. The CHECKED stamp is in the approval block. "Wake the cat" is in the palette.
- [ ] consoleNote: one `console.info` group once per load.
- [ ] e2e: Ctrl+K opens, typing "resume" plus Enter triggers the résumé download event, Escape restores focus. At 375 the cat's rect doesn't intersect any `a, button, h1, p` rect. The crosshair is absent with `hasTouch` and under reduced motion.
- [ ] Commit.

### Task 12: Shareability and delivery

**Files:** `index.html`, `public/{og.png,favicon.ico,favicon.svg,apple-touch-icon.png,icon-192.png,icon-512.png,site.webmanifest,sitemap.xml,robots.txt,404.html}`, `scripts/{generate-og,generate-icons}.mjs`, `vercel.json`, `e2e/meta.spec.ts`.

- [ ] Meta per CONTENT.md §2, canonical `https://searan.vercel.app/`, Person JSON-LD.
- [ ] `generate-og.mjs` renders an HTML template (fonts plus the airframe SVG plus the title block) with Playwright to a 1200 × 630 PNG. `generate-icons.mjs` rasterises `favicon.svg` with sharp and writes the ICO with a small encoder that embeds PNG.
- [ ] `vercel.json`: `Cache-Control: public, max-age=31536000, immutable` for `/assets/(.*)` and `/fonts/(.*)`; the 404 page.
- [ ] e2e: every meta tag is present; og.png is 1200 × 630; JSON-LD parses and has `@type: Person`; `/sitemap.xml` and `/robots.txt` return 200 from `vite preview`.
- [ ] Commit.

### Task 13: Cleanup and hardening

- [ ] Remove old components and styles (`Hero`, `hero/*`, the old `Experience` and `experience/*`, `Projects` and its visuals, `SectionHeading`, `Reveal`, `Cursor`, `NavRail`, `Footer`, `styles/shared.ts`, and `src/data` after the move), their tests, and `framer-motion`. Your assets stay.
- [ ] `e2e/layout.spec.ts` (review focus 5): at 375×812, 390×844, 844×390, 768×1024, 1024×768, 1366×640, 1440×900 and 1920×1080, `scrollWidth ≤ innerWidth`, no `h1,h2,h3,p,a,button` rect intersects the fixed nav rect, and no text under 13 px (computed).
- [ ] Bundle check: `vite build`, then a script asserting initial JS gzip ≤ 200 KB and printing the chunk list.
- [ ] Commit.

### Task 14: Verification pass

- [ ] Screenshots: `node scripts/audit/capture.mjs <preview> docs/overhaul/screenshots/after --widths=375,768,1024,1440,1920` plus `--reduced`, then `to-webp`.
- [ ] axe at 375 and 1440 across all states: 0 violations. Lighthouse mobile ×3 and desktop ×3 against `vite preview`: meet the budget. Runtime trace at 4× CPU through Experience: p95 frame ≤ 33 ms, no long task over 100 ms from scroll handlers. Keyboard-only walkthrough and touch emulation (iPhone 13, iPad Pro 11 landscape). Slow 4G plus 4× CPU LCP.
- [ ] Every link resolves (status table).

### Tasks 15–16: Polish passes

- [ ] Pass 1: critique the screenshots as a design director (alignment, optical spacing, rag, easing, loading, empty and error states, hover, focus, active) and fix.
- [ ] Pass 2: same, then remove one accessory.

### Task 17: Reviews

- [ ] A fresh subagent reviews the code (superpowers:requesting-code-review); fixes applied through superpowers:receiving-code-review.
- [ ] A separate fresh subagent reviews the design from `screenshots/after` only; fixes applied.

### Task 18: Report and handoff

- [ ] `docs/overhaul/REPORT.md`: before and after side by side, a metrics table, what changed and why, and known limitations. Update `NEEDS-FROM-SEARAN.md`.
- [ ] Push `overhaul/v2` and record the Vercel preview URL if the Git integration builds previews.

---

## Self-review

- **Spec coverage:** every DESIGN.md §6 item maps to Tasks 3–11. §4 tokens map to Task 1. Shareability maps to Task 12. The brief's quality bar maps to Tasks 13–14. The audit's top 10: #1 → Tasks 1 and 13 (floors, layout spec); #2 → Tasks 1, 5 and 6 (content tests, unsourced-metric regex); #3 → Task 3; #4 → Tasks 1, 3 and 12; #5 → Tasks 2, 4 and 11; #6 → Task 5; #7 → Tasks 4, 9 and 11; #8 → Task 10; #9 → Tasks 1 and 3–10; #10 → Task 12.
- **Placeholders:** none. The measured classifier accuracy is produced by Task 7's script and read at runtime, not typed.
- **Type consistency:** `SheetMeta`, `buildInfo`, `stationFromX`, `useSurvey`, `deriveUsage` and `UsageRef` are named the same wherever they appear.
- **Review focus:** each of the five lines has a test in its owning task (4, 4, 5, 6/7/10, 13).
