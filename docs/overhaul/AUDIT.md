# Portfolio audit (before the overhaul)

Audited 2026-09-24 on branch `overhaul/v2` at `410a477`. The code there is identical to `master` and production (`f95235e`). Baseline: local dev and a local production build served by `vite preview`, cross-checked against https://searan.vercel.app. The CSS bundle hash matches production byte for byte. The JS differs only in the lazy-chunk filename.

**How this was measured.** Playwright 1.63 (Chromium) scripts in `scripts/audit/`, `@axe-core/playwright`, Lighthouse 12.8, `rollup-plugin-visualizer`, and CDP traces at 4× CPU throttle. The raw data lives in `docs/overhaul/audit/`: `a11y/`, `perf/`, and `content-inventory.md`. Screenshots are in `docs/overhaul/screenshots/before/`, converted to WebP. Four auditors ran in parallel and all four were stopped by an API session limit before writing their reports. Everything below comes from the raw data they saved plus my own captures and reading of the code. The gaps are listed at the end.

Severity: **critical** blocks a core job (being read, being contacted, being truthful). **High** visibly hurts every visitor. **Medium** hurts some visitors or the maintainer. **Low** is polish.

---

## 1. Executive summary: the ten problems that matter most

| # | Problem | Severity | Evidence |
|---|---|---|---|
| 1 | **Most of the text is too small to read.** At 375 px, 228 of 293 text nodes (78%) render under 12 px and 147 render under 10 px. Twenty-three distinct font sizes are in use. The micro-labels carry real content (dates, stations, stats, card captions). 28–29 text nodes fail 4.5:1 at each width. | critical | `audit/a11y/contrast-summary.json`; `screenshots/before/375/00-hero.webp` |
| 2 | **Some claims on the site aren't backed by the résumé, and some numbers have no source.** Several Experience cards differ from the résumé: added leadership framing, "85% faster turnaround" versus the résumé's "reducing manual processing time by 85%", and "50+ operators" moved onto a different project. The project visuals print metrics nobody has sourced (Sharpe 1.84, accuracy 94.1%, F1 0.921, latency 18 ms, drift 0.7°), and screen readers read them out as data. The CRJ spec pairs CRJ700 length with CRJ900 wingspan and height. | critical | `audit/content-inventory.md` §3 D-07…D-17, §5.1 |
| 3 | **The hero isn't about Searan.** A floating fake IDE (whose Python doesn't parse), a Q1–Q4 "impact" bar chart with no data, a deploy checklist and "Ideas / Code / Products / Impact" panels fill the first screen. It carries 22 infinite CSS animations. The headline "I build scalable systems that create real impact." could belong to anyone. | high | `before/1440/00-hero.webp`; `before/visual/visual-motion.json` (`loops.hero.total: 22`); `content-inventory.md` I-13 |
| 4 | **Mobile first load is slow.** Lighthouse mobile scores 72 locally and 60 in production. LCP is 4.9 s locally and 6.6 s in production, against a 2.0 s target. FCP is 3.7 s. Render-blocking Google Fonts CSS for five families costs about 1.5 s. The LCP element is the hero h1, which runs a CSS rise-in. | high | `audit/perf/lighthouse-summary.json`; `lh-*-mobile-1.extract.json` |
| 5 | **Scrolling Experience at 4× CPU runs at about 17 fps.** p50 frame time is 55 ms, 99% of frames miss 16.7 ms, and 41 long tasks add up to 2.9 s. Style recalculation takes 2.9 s of the 7.8 s scroll, driven by per-frame custom-property writes on a stage full of stacked `drop-shadow` filters, clip-paths, and a `mix-blend-mode: screen` raster. Idle, the main thread is 95–99% busy even at the page bottom, because 32 infinite animations run whether or not they're on screen. | high | `audit/perf/runtime-gpu-x4.json`; traces `perf/trace-experience-*.json.gz` (local only) |
| 6 | **Three of the four projects are hidden behind tabs, and the visuals don't show the work.** The CraftTraq board screenshot is 1902 × 938 but renders at 224 × 111 px on a phone and 451 × 222 at 1440. The phone screenshot renders at 46 × 102 px. The Eye Tracking and Text Classification panels have 158 px and 136 px of dead space above and below their visuals at 1440. | high | `before/visual/visual-measure.json` (`projects`); `before/1440/02-projects.webp`; `before/375/02-projects.webp` |
| 7 | **Keyboard and touch visitors lose features.** There's no skip link. Skill tiles have `tabindex=-1`, so none of the 28 are reachable by keyboard. The Detail A-A inspector is hover-only, hidden below 1280 px, and still reads "No part selected" after a tap on a 1366 px touch screen. Projects' ArrowLeft/Right listener is on `window`: it switches projects while focus sits on the nav rail, and drops focus to `<body>` when the panel remounts. PageDown through Experience never shows callout 04 at 1440, or callout 02 at 375. | high | `audit/a11y/keyboard.json`; `before/visual/visual-measure.json` (`skills`) |
| 8 | **The site doesn't end.** Contact is a link list, and 208 px below it (19–27% of the last screen) is empty. The footer text never becomes visible because its `whileInView` reveal uses a −10% bottom margin, and the footer sits inside that band. There's no revision block, no back-to-top and no source link. | high | `before/visual/bottom-1440.webp`; `visual-measure.json` (`bottom`) |
| 9 | **Much of the chrome doesn't mean anything.** The nav says 01 Home…05 Contact while the headings say § 01 Experience…§ 04 Contact, both on screen at once. Station numbers are reused with different meanings (STA 145 is both "FWD" and "ANALYTICS"). Every section repeats the same 190 px outlined ghost word. Each project gets three numbering schemes. Five different positioning lines appear across the hero, meta tags, noscript and footer. | medium | `content-inventory.md` I-02, I-04, I-07, I-08; `before/1440/exp-075-settled.webp` |
| 10 | **Sharing and SEO are missing.** There's no OG/Twitter image, favicon file set, manifest, sitemap, canonical or Person JSON-LD, and they all 404 in production. The favicon is an inline "§" data-URI. Hashed assets are served with `max-age=0, must-revalidate` rather than `immutable`. There's no `vercel.json`. | medium | `curl` results in §6; `audit/perf/delivery-headers.txt` |

---

## 2. Your eleven observations, verified

| # | Observation | Verdict | Evidence and measurement |
|---|---|---|---|
| 1 | Nav numbering (01 Home…05 Contact) doesn't match the headings (§ 01 Experience…§ 04 Contact) | **Confirmed** | Both are visible together: the rail reads `• 02 EXPERIENCE` beside the HUD's `§ 01 · Experience` in `before/1440/exp-075-settled.webp`. Sources are `NavRail.tsx:12-18` and the four section labels. |
| 2 | Hero copy is generic and uses the one-accent-phrase trick | **Confirmed** | "scalable" and "systems" are the only words set in `#5b95ef` (`Hero.tsx:35,44`). The sentence names no domain, employer or product. The noscript fallback already has a more specific line: "I build the systems operators run their business on." |
| 3 | Tiny, wide-tracked mono labels in dim blue everywhere; likely fail contrast and unreadable on phones | **Confirmed, and worse than expected on size. Contrast is mostly borderline rather than failing.** | At 375: 124 of 183 text elements are JetBrains Mono. The most common sizes are 9 px (41 elements) and 8.5 px (28). 26% are letter-spaced, up to 0.28 em. Most labels were already moved onto the `annotation` tokens (4.6–5.5:1), so the failures (28 at 375, 29 at 1440) cluster in the project mock UIs (#4a6b7a on #081218, 3.3:1), the FIG/station title block (3.9–4.2:1), the Skills tally and the Detail A-A panel. The bigger problem is size: an 8 px letter-spaced label at 4.6:1 passes the ratio and still can't be read on a phone. |
| 4 | Ghost words collide with the heading rules and repeat in every section | **Confirmed** | `before/1440/02-projects.webp`: "PROJECTS" strokes run through the dashed flight line and the tab row. `before/visual/bottom-1440.webp`: "CONTACT" sits behind the label and rules. At 375 the Projects ghost word is cut off at both edges (`before/375/02-projects.webp`). The same device appears four times: Experience, Projects, Skills, Contact. |
| 5 | Survey tops out at 91%; cards are dense paragraphs; the aircraft is a raster; mobile behaviour | **Confirmed on all four points** | Readout at the last settled stage: 91% at 1440 and 1920, 87% at 375–1024 (`before/log.json`). It only reads 100% as the stage is carried away during departure, so the survey never visibly completes. The cards run 33–47 words of 13 px body text each. The aircraft is `public/crj-xray.png`: 2108 × 424 RGBA, 947 KB, drawn with `mix-blend-mode: screen`. Lighthouse flags it as the site's largest image (897 KiB WebP savings). On mobile the airframe shrinks to a 330 × 66 px strip, one card shows at a time, and the section needs 430vh of scrolling for four cards (`before/375/exp-050-settled.webp`). |
| 6 | Tabs hide three projects; CraftTraq screenshot too small; Eye Tracking panel has a dead zone | **Confirmed** | See summary item 6 for the measurements. At 375 the project's name sits 950 px below the tab that selects it (`visual-motion.json` `tab-switch-375.nameOffset`), so tapping a tab changes content off screen. |
| 7 | Detail A-A empty until hover; schedule bars don't connect to the tiles; empty band below the grid | **Confirmed** | The panel exists only at xl and above. On a 1366 touch screen a tap leaves "NO PART SELECTED" (`visual-measure.json` `skills.1366`). The four coloured group bars have no matching mark on the tiles, so they don't work as a legend. There's 96–135 px of empty space below the grid at every width. |
| 8 | Contact has no footer, no ending moment and empty space underneath | **Confirmed, plus a bug** | A footer element exists, but its text stays invisible (see summary item 8). `emptyFromContentToPageEnd` is 176–208 px at every width. |
| 9 | Right nav rail overlaps content at mid widths | **Confirmed at 1024** | At 1024 the rail (157 × 186 px) covers the Projects tabs 02 and 04, the right edge of the CraftTraq panel, the email card and the GitHub card (`before/visual/navrail-1024-contact.webp`). No overlap at 1280 or 1440, which reserve a 160–184 px gutter for the rail. |
| 10 | Three type voices: system or drift? | **Drift: there are actually five.** | Computed families in use: JetBrains Mono (the default voice), IBM Plex Sans (body and headline), Saira Condensed (company and project titles, 2 elements), Space Grotesk (ghost words only), and Newsreader (loaded but used nowhere). Five families come from a render-blocking Google Fonts request (127 KB of fonts at load). |
| 11 | The pixel cat is a deliberate personality touch | **Confirmed, and it sometimes covers the main CTA** | At 375 it perched on the hero paragraph and **the "See my work" button** in all six runs (`before/visual/cat-375-run*.webp`, `visual-measure.json` `cat.375`). At 1440, after being clicked, it hopped onto the "10" stat. It's clickable, so it takes clicks aimed at whatever it covers. It lives only in the hero. Its chunk is 135 KB gzip of base64 sprites (six skins), and its 10 fps `setInterval` shows up as long-animation-frame blocking while Experience scrolls. Keep it and give it a bigger role, but it needs rules about where it can sit. |

---

## 3. Findings by dimension

### 3.1 Concept coherence

| ID | Sev | Finding | Evidence | Fix |
|---|---|---|---|---|
| VIS-01 | high | The drawing concept is fully committed only in Experience. The hero is a generic dev-portfolio scene, Projects is a SaaS card-and-tab kit with rounded 26 px panels, Skills is a logo grid, and Contact is a link list. | `before/1440/*.webp` | Make the whole site one drawing set: a cover sheet, sheets with title blocks, and a sign-off. Take the Experience language to every section. |
| VIS-02 | medium | Station numbers are decorative and reused with different meanings across sections. None are real stations on the drawn airframe. | `content-inventory.md` I-04, §5.4 | Derive stations from the drawing: inches aft of the nose datum at the drawn aircraft's published length. Keep STA numbers on the airframe only. Other sections get their own drawing conventions (sheet numbers, item numbers, zones). |
| VIS-03 | medium | Drafting furniture that says nothing: "Aviation / Data / Builds / Tomorrow", "BUILD / SOLVE / IMPROVE / REPEAT", "TURNING COMPLEXITY INTO SIMPLE SOLUTIONS →", "PLANE 02", "IDE · 470 × 330", ghost words, three hatch patterns per card. | `BlueprintAnnotations.tsx:223-229`, `Hero.tsx:536-539,585`, `HeroStage.tsx` | Cut them. Every mark on the new sheets encodes something. |
| VIS-04 | low | The Experience cards' glow borders (four stacked `drop-shadow`s plus a white rim gradient) read as sci-fi HUD, not drafting. They're also the main paint cost. | `HudCard.tsx`; perf traces | Use line weight instead of glow: object lines, leader lines, a title strip. |

### 3.2 A recruiter's first 30 seconds

- **375, first screen** (`before/375/00-hero.webp`). Visible: the name as 12 px letter-spaced mono, a photo, a generic headline, two CTAs, three icons, and a stats grid ("10 projects shipped", Western, 2026, "LIVE CraftTraq"). Missing: the MHI RJ internship, the kind of work, the kind of role being sought, the location. The strongest proof (a CRJ fleet platform for 2,000+ aircraft) is four screens down.
- **1440, first screen** (`before/1440/00-hero.webp`). The same, with the fake IDE taking half the screen. "Open to opportunities" doesn't say for what.
- **Verdict:** in 30 seconds a recruiter learns the name, "software engineer", Western 2026, and that some SaaS is live. They don't learn about the aviation internship, which is the most distinctive fact, or what role Searan wants.

| ID | Sev | Finding | Fix |
|---|---|---|---|
| UX-01 | high | The hero skips the two things a recruiter looks for first: recent experience and the role wanted. | Put the MHI RJ internship and CraftTraq in the hero sentence. Make availability state the role type (a HOLD placeholder until confirmed). Link each proof item to its evidence. |
| UX-02 | medium | The name renders as 12 px mono in a corner lockup. The h1 is a slogan. | Make the name the h1, with role and specifics directly under it. |

### 3.3 Visual hierarchy, typography and colour

| ID | Sev | Finding | Evidence | Fix |
|---|---|---|---|---|
| VIS-05 | critical | 23 distinct font sizes from 8 px to 74 px. 78% of text nodes are under 12 px at 375. Letter-spaced all-caps mono is the default voice for everything that isn't a headline. | `visual-measure.json` `fonts`; `contrast-summary.json` | A modular type scale with a 13 px floor for labels and 16 px for body, used sparingly. |
| VIS-06 | high | Five families, one of them unused. The mono does work a proportional face would do better (sentences, names). | §2 item 10 | Two families at most: one proportional family with a width axis for display and text, one monospace for data readouts only. Self-hosted and subset. |
| VIS-07 | medium | Colour is generic dark-mode navy (#0a0d13) with an unrelated bright blue (#2f6ad4/#5b8ff0), amber, green, purple and 28 brand colours. There are ten or more hand-picked label blues, which the `annotation` tokens partly consolidated. | `index.css:7-43`; Skills tally hues | A palette drawn from real drafting materials, with one redline accent that means "annotation/revision". Brand colours only where a logo appears. |
| VIS-08 | medium | Projects uses rounded 20–26 px panels with soft shadows and a "sheen" line: the SaaS-card kit. That contradicts the drawing concept. | `Projects.tsx:241-255` | Square sheet frames. Radius only where a physical object has one (a device frame). |
| VIS-09 | low | Every section re-declares its own drifting grid and corner radial glows. | `Projects.tsx:83-104`, `Skills.tsx:34-67`, `Contact.tsx:237-253` | One sheet ground, defined once. |

### 3.4 Layout rhythm and spacing

Measured empty vertical bands per section (`visual-measure.json` `bands`):

| Width | Hero | Experience (per pinned screen) | Projects | Skills | Contact |
|---|---|---|---|---|---|
| 375 | 97 px | 435 px (airframe band to card) | 377 px | 897 px (mostly tile gaps) | 192 px |
| 768 | 414 px | 673 px | 438 px | 559 px | 296 px |
| 1024 | 0 | 446 px | 471 px | 591 px | 328 px |

| ID | Sev | Finding | Fix |
|---|---|---|---|
| VIS-10 | medium | 768 is a stretched phone layout: 296 px of empty hero under the CTAs and a 506 px band in Experience. | Design tablet as its own layout: two columns where content allows, and a stepped airframe. |
| VIS-11 | medium | Sections alternate `bg` and `surface` with hard edges (`before/visual/bottom-1440.webp` shows the Skills/Contact seam), which reads as unrelated slabs. | One continuous sheet ground, with sections divided by drawn sheet borders. |

### 3.5 Motion

| ID | Sev | Finding | Evidence | Fix |
|---|---|---|---|---|
| MOT-01 | high | 32 infinite animations on the page: 22 in the hero, 7 in Projects, a drifting grid in each of Projects, Skills and Contact, and a pulsing scroll cue. None pause offscreen. | `visual-motion.json` `loops`; `runtime-gpu-x4.json` (`contact-idle` busy 99%) | At most one ambient moment per section, and it pauses offscreen. No loops without a reason. |
| MOT-02 | high | Experience combines a per-frame rAF loop, custom-property writes on the stage (which restyles every descendant), springs, a canvas wake, and a custom scroll-snap that moves the page after 200 ms of stillness. The snap fights keyboard and assistive scrolling, and PageDown skips a callout. | `Experience.tsx:405-514`; `keyboard.json` | Drive the sequence with one owner (GSAP ScrollTrigger scrub, or Motion `useScroll`) that writes transforms and opacity to a few elements. No custom snap. Every callout gets a real focus stop. |
| MOT-03 | medium | Generic fade-and-rise entrance on every section (`Reveal`) plus a staggered rise on every Skills tile and Contact card. | `Reveal.tsx`; `Skills.tsx:13-16` | Remove the blanket reveals. Keep entrances only where they tell the visitor something. |
| MOT-04 | low | Tab switch replays seven CSS entrance animations on remount (about 1.3 s for the chart to finish drawing), and the change happens 950 px below the tapped tab on mobile. | `before/visual/motion-tab-switch-375-sheet.webp` | Show all projects at once. Animate the response to an action, such as opening a case study. |

### 3.6 Interaction affordances

| ID | Sev | Finding | Fix |
|---|---|---|---|
| UX-03 | high | The Skills inspector is hover-only. The tiles can't be focused. Touch users never see the inspector below 1280, and it doesn't respond to a tap at 1366. | The BOM rows are buttons. Tap, click and focus all select. Selected is a real state with a useful default. |
| UX-04 | medium | The cursor "torch" (a 360 px glow with a revealed grid) follows every fine pointer, runs a second compositing layer over the whole page, and hides nothing useful. | Replace it with a drafting crosshair that encodes coordinates, or remove it. Fine pointers only. Off under reduced motion. |
| UX-05 | medium | The cat covers the hero CTA on mobile and is clickable (§2 item 11). | Restrict it to walkable rules or empty zones, set `pointer-events: none` except on its own hit area, and keep it off content. |
| UX-06 | low | Hero stats aren't linked to their proof except "LIVE", which goes off-site to crafttraq.com instead of the project on this page. | Link each stat to its evidence on the page. |

### 3.7 Copy

| ID | Sev | Finding | Fix |
|---|---|---|---|
| COPY-01 | high | Five positioning lines compete (`content-inventory.md` I-07). None names the domain. | One positioning line, specific and true, reused in the hero, meta and OG image. |
| COPY-02 | medium | Card copy has drifted from the résumé in wording and in metric meaning (D-07…D-10). "85% faster turnaround" isn't what "cut … time by 85%" means. | Keep the current wording (the brief says every fact must survive). Flag each difference to the owner. Add a short impact line per card taken word for word from the existing text. |
| COPY-03 | low | "Designed the Oracle database architecture underneath it" has no antecedent (I-10). | Flag it. Proposed wording goes in CONTENT.md. |
| COPY-04 | low | "→" appended to text, "//" prefixes, and middle-dot meta strings throughout. | Drop them where they don't carry meaning. |

### 3.8 Mobile and tablet

| ID | Sev | Finding | Fix |
|---|---|---|---|
| MOB-01 | high | Experience on a phone is the desktop pin shrunk down: a 66 px airframe, one card at a time, 430vh of scrolling (`before/375/exp-*.webp`). | Design a vertical sequence for phones: the airframe turned 90° as a spine, with stations stepping down it and cards in normal flow. |
| MOB-02 | medium | The bottom nav bar uses 9 px labels and covers the last 60 px of every screen. | Keep a bottom bar on phones, with 12–13 px labels and a sheet counter. It has to stay out of the way of content. |
| MOB-03 | medium | Project tabs change content far below the tapped control (§3.5 MOT-04). | Show all projects. No tabs. |

### 3.9 Accessibility (WCAG 2.2 AA)

axe (WCAG 2.0/2.1/2.2 A+AA) was run at 375 and 1440 in eight states each (`audit/a11y/axe-*.json`).

| ID | Sev | Finding | Evidence | Fix |
|---|---|---|---|---|
| A11Y-01 | high | `definition-list` and `dlitem` (serious): the hero stats `<dl>` wraps each `dt`/`dd` pair in `<div>`/`<a>`, so it's invalid. Lighthouse accessibility scores 90 on every run because of this. | `axe-summary.json` | Valid markup: `div > dt + dd` inside `dl` with no anchors in between, or a list of links. |
| A11Y-02 | high | Text size and contrast (§2 item 3). 28–29 failures per width, mostly under 10 px. | `contrast-summary.json` | 13 px label floor. Every text colour at 4.5:1 or better on its real ground, checked by a unit test. |
| A11Y-03 | high | No skip link. The first five tab stops are the nav rail on every page. | `keyboard.json` | A skip link styled as a drawing note. |
| A11Y-04 | high | Skill tiles can't be focused. The inspector is mouse-only. | `keyboard.json` `skills.tabbableInSkills: 0` | Real buttons (§3.6 UX-03). |
| A11Y-05 | high | The Projects selector is buttons with `aria-current`, not a tablist. ArrowLeft/Right are captured on `window` and change the project while focus is elsewhere. Focus is lost to `<body>` when the panel remounts. | `keyboard.json` `projects.arrowTests` | No tabs in the new design. Every project is a heading plus a link that opens its case study in a `dialog` with a focus trap and focus returned on close. |
| A11Y-06 | medium | PageDown and Space move through Experience in steps that skip a callout: 04 never shows at 1440, 02 never shows at 375. The custom snap then moves the page. | `keyboard.json` `experience.PageDown.maxAlphaPerCallout` | Callouts as focusable items in normal DOM order, with the drawing reacting to focus. No scroll snap. |
| A11Y-07 | medium | `heading-order` (moderate): the card h3s come before any h2. The Experience label "§ 01 · Experience" is a `div`, so the section has no heading. | `axe-summary.json` | One h1, an h2 per sheet, an h3 per item. |
| A11Y-08 | medium | Meaningful information is inside `aria-hidden` subtrees: the CRJ spec block, the station notes, the overall-length dimension. Meanwhile the unsourced mock metrics are *not* hidden and get read out as data. | `BlueprintAnnotations.tsx`; `RiskVisual.tsx`, `NlpVisual.tsx`, `EyeVisual.tsx` | Expose real data (spec table, stations) as text. Hide or label illustrative visuals. |
| A11Y-09 | low | Focus rings are a generic 2 px blue outline, present on all 21 stops (`keyboard/*-focus-*.webp`). | | Focus drawn in the site's own language: a drafting bracket or registration corners, at 3:1 or better. |
| A11Y-10 | low | Reduced motion is handled reasonably (no snap, cards shown, readout reaches 100% in `reduced-motion/log.json`), but it still needs 430vh of scrolling for four cards. Framer Motion logs a console warning under reduce. | `before/reduced-motion/1440/exp-075-settled.webp` | Design a static layout for reduced motion. |

### 3.10 Performance

| Metric | Local mobile (median of 3) | Local desktop (median of 3) | Prod mobile | Prod desktop | Target (mobile) |
|---|---|---|---|---|---|
| Performance | 72 | 98 | 60 | 97 | ≥ 90 |
| Accessibility | 90 | 90 | 90 | 90 | 100 |
| Best practices | 100 | 100 | 100 | 100 | ≥ 95 |
| SEO | 100 | 100 | 100 | 100 | 100 |
| FCP | 3.65 s | 0.86 s | 3.74 s | 0.96 s | |
| LCP | 4.86 s | 1.01 s | 6.58 s | 1.03 s | ≤ 2.0 s |
| TBT | 173 ms | 0 ms | 284 ms | 0 ms | INP ≤ 200 ms |
| CLS | 0 | 0.001 | 0 | 0.001 | ≤ 0.05 |

Weight at load (1440, local build): 17 requests, 1.54 MB transferred. JS: 137 KB initial plus 136 KB lazy (oneko), both gzip. CSS: 11.6 KB, including the 1.8 KB Google Fonts CSS. Fonts: 127 KB for five faces. Images: 1.12 MB, of which `crj-xray.png` is 948 KB. The rest of this section's source data is `audit/perf/weight-local.json` and `bundle-breakdown.json`.

Main bundle composition (share of the unminified module sizes in the treemap): framer-motion about 47%, react-dom about 18%, skill-icon SVG path data about 6%, app code about 25%.

| ID | Sev | Finding | Fix |
|---|---|---|---|
| PERF-01 | high | Render-blocking Google Fonts for five families costs about 1.5 s of FCP/LCP on mobile. | Self-host two families, subset and preload them, with `font-display: swap`. |
| PERF-02 | high | A 948 KB PNG is the Experience centrepiece. | Redraw it as SVG line art (a few KB). |
| PERF-03 | high | Experience scroll runs at 16.8 fps and "rest" at 17.4 fps (4× CPU). Style recalc is 2.87 s of a 7.8 s scroll. There are 41 long tasks. | Write transforms and opacity only, to a few elements. No filters on moving layers. One animation owner. |
| PERF-04 | high | Idle main-thread load is 95% in the hero and 99% at Contact, from infinite animations and the cat's 10 fps interval. | Pause everything offscreen. Keep ambient loops rare. The cat sleeps when its section is offscreen. |
| PERF-05 | medium | framer-motion 11 in full (about 100 KB gzip of the 137 KB initial) for work CSS could mostly do. | Move to `motion` 13 via `motion/react`, use `LazyMotion` with `m` components, and load heavier features only where needed. |
| PERF-06 | medium | The oneko chunk is 135 KB gzip because six skins are inlined as base64. Only `tuxedo` is used. | Ship one sprite sheet as a real image file, around 10 KB. |
| PERF-07 | medium | Hashed `/assets/*` served with `max-age=0, must-revalidate`. | `vercel.json` headers: `public, max-age=31536000, immutable` for `/assets/*` and fonts. |
| PERF-08 | low | The hero headline (the LCP element) runs a 0.9 s opacity rise-in, which delays LCP. | Render LCP text at full opacity. The intro may not hide it. |

Not measured before the auditors stopped: INP from Event Timing (TBT stands in for it above), and the 375 runtime profile. The 1440 profile already fails badly, so the mobile one can only be worse.

### 3.11 SEO and shareability

| ID | Sev | Finding | Evidence | Fix |
|---|---|---|---|---|
| SEO-01 | medium | No OG or Twitter tags, no OG image. A link preview shows the title and description only. | `index.html` | Generated OG image in the site's style, 1200 × 630, plus the tags. |
| SEO-02 | medium | Favicon is an inline data-URI "§". `/favicon.ico`, `/apple-touch-icon.png` and the manifest all 404. | `curl` (§6) | A full favicon set drawn from the site mark. |
| SEO-03 | medium | No `sitemap.xml`, and `robots.txt` has no `Sitemap:` line. No canonical. | `curl`; `public/robots.txt` | Add them. |
| SEO-04 | low | No Person JSON-LD. | `index.html` | Add Person with `sameAs` (GitHub, LinkedIn), `alumniOf` Western, `worksFor`/`hasOccupation` as factual. |
| SEO-05 | low | The meta description invents "a fleet-tracking platform", which matches nothing on the résumé (D-22). | `index.html:22` | Rewrite from real facts. |

### 3.12 Code and maintainability

| ID | Sev | Finding | Evidence | Fix |
|---|---|---|---|---|
| CODE-01 | medium | Content is split between data files and components: hero stats, socials, headline, contact channels, the aircraft spec, nav sections and meta all live in JSX. Email appears three times. | `content-inventory.md` §1 | One typed `src/content/` module the components read from. |
| CODE-02 | medium | Very large components: `Experience.tsx` is 1,021 lines and `Hero.tsx` is 609. Comment density is extreme, with multi-paragraph histories of past fixes in the code. That helps archaeology and hurts reading. | `wc -l` | Smaller units, short comments that explain *why*, and history kept in git. |
| CODE-03 | medium | Dead or unused code and assets: `IdeWindow.tsx`, and in `shared.ts` `cardSurface`, `blueprintGrid`, `chipStamped`, `chipWash` and `btnPrimary` (only `underlineLink` is imported). `Western.png`, `crafttraq.webp`, the three `placeholder-*.svg` files and root `check.png` are unreferenced. The oneko debug controls ship in the lazy chunk. | grep | Remove the dead code. Keep your assets (brief) but stop serving unreferenced ones where that's safe, and flag the rest. |
| CODE-04 | low | No ESLint config. `tsc` strict is on. Tests are closely tied to markup and copy (e.g. `Hero.test.tsx` asserts "10"). | `package.json` | Add ESLint (typescript-eslint, react-hooks, jsx-a11y). Rewrite the markup tests against the new structure and keep the pure-logic tests. |
| CODE-05 | low | 400+ inline colour literals bypass the tokens. | `scripts/audit/content-codestats.mjs` | Tokens only. |

---

## 4. Keep list: what works and must survive

1. **The Experience concept.** Four real role highlights pinned to stations on an airframe, revealed in sequence, with leader lines, a survey progress readout and a CRJ spec block. It's the site's identity. Upgrade it; don't replace it.
2. **Every factual claim**, exactly as currently worded, including the ones flagged for review (`content-inventory.md` §1). Nothing is removed or reworded without being logged in CONTENT.md, and any claim that has drifted from the résumé goes to NEEDS-FROM-SEARAN.md rather than being "fixed".
3. **The drafting vocabulary that carries meaning:** station callouts, the overall-length dimension line, the datum (CYYZ, which fits the Mississauga role), the spec block, "Side elevation · Sheet 01", "Materials list", "Detail A-A", "FIG." numbering, and flight direction. Each gets a real job in the new system.
4. **The pixel cat.** A deliberate personality touch with sensible upstream care (it avoids text and never follows the cursor). Keep the sprite and the idea, and fix its placement.
5. **Your assets:** headshot, résumé PDF, MHI RJ logo, Western mark, and the CraftTraq board and calendar screenshots.
6. **The quality instincts already in the code:** `svh` units for mobile heroes, 44 px touch targets on the nav, the `aria-live` copy confirmation, email kept visible and selectable beside the copy button, the reduced-motion branches, and data files with types. The rebuild keeps all of these.
7. **The CraftTraq positioning** as the live, in-production proof, and the direct links to real repos.
8. **No-JS fallback** in `index.html`. It's the only place with a specific positioning line ("I build the systems operators run their business on").

---

## 5. Gaps in this audit

- The accessibility, performance, visual and code auditors all stopped at an API session limit before writing their reports. Their raw data (axe, contrast, keyboard, Lighthouse ×8, runtime traces, weight, bundle, visual measurements, motion sheets) was saved and is summarised above. Not completed:
  - **Touch emulation** with Playwright device profiles (swipe, bottom-nav taps). The touch findings above come from measurements made with `hasTouch` and from reading the code.
  - **Event Timing INP** under throttle (TBT stands in above).
  - **The mobile runtime profile** (the desktop profile at 4× CPU is reported).
  - **The code-review write-up.** Its findings are folded into §3.12 from the saved codestats script and my own reading.
- The dev server was stopped once by the host because memory was low. Nothing was lost; it will be restarted for the build phase.

## 6. Link and meta status (production, 2026-09-24)

| URL | Status |
|---|---|
| github.com/skugane6 | 200 |
| linkedin.com/in/searan-kuganesan | 200 (with a browser user agent) |
| crafttraq.com | 200 |
| github.com/Skugane6/Portfolio-Risk-Dashboard | 200 |
| github.com/Skugane6/eye-mouse | 200 |
| /skuganesan_resume.pdf | 200, application/pdf |
| /sitemap.xml, /favicon.ico, /og.png | 404 |
| /does-not-exist | 404, plain text (no designed 404) |
