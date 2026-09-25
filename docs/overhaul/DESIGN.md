# Design: drawing set, revision C

The design for the overhaul, derived from `AUDIT.md` and the brief. Every decision below was made by me without a check-in, as the brief asks. The questions I'd normally have put to you, and my answers, are logged in §1.

---

## 1. Brainstorm log: questions I'd normally ask, answered from the audit and the brief

| # | Question | Answer | Basis |
|---|---|---|---|
| Q1 | Who is the site for, in order? | (1) Recruiters and hiring managers deciding in 30 seconds whether to read on. (2) Engineers and designers who'll explore and judge the craft. (3) Searan, as the maintainer who edits content without touching components. | Brief, "30 seconds" and "the kind of site designers share" |
| Q2 | What must a recruiter know from the first screen? | Name. Role. The two strongest proofs: the MHI RJ fleet-data internship, and CraftTraq, which is live. Education and date. How to reach him. Links to evidence. | Audit §3.2: today they get name, "software engineer" and Western 2026, and miss the internship |
| Q3 | Commit to the engineering-drawing concept, or propose another? | Commit. Three directions were scored (§2) and the drawing set won on every axis except "novel to aviation fans", where the cockpit direction edges it. | §2 |
| Q4 | Light or dark? | Dark cyanotype only, like the current site. The alternative print process, a white diazo "whiteprint", becomes the print stylesheet instead of a theme toggle, so printing the page produces a whiteprint drawing set. | A theme toggle doubles QA for little gain. Print is a real use (recruiters print). |
| Q5 | 3D wireframe aircraft (react-three-fiber)? | No. A drawing set is orthographic by nature, and the concept is stronger as true line art. 3D costs about 150 KB gzip plus GPU time and threatens the LCP and INP targets. | Audit PERF-01/03/04 |
| Q6 | GSAP or Motion? | **Motion only** (`motion/react`), no GSAP and no Lenis. CSS `position: sticky` handles pinning. `useScroll` + `useTransform` drives scrubbed sequences, and Motion uses hardware-accelerated ScrollTimeline where it can. `layoutId` handles the shared-element dialog. One runtime means one animation owner per element and about 35 KB gzip, where Motion plus GSAP would be about 75 KB. | Brief: "give each element a single animation owner" |
| Q7 | Lenis? | No. Native scrolling is faster, keeps keyboard, find-in-page and assistive scrolling intact, and nothing here needs smoothed input. | Brief: "only if it earns its place" |
| Q8 | What do we do with facts that differ from the résumé? | Keep the site's current wording, which the brief protects, and flag every difference in NEEDS-FROM-SEARAN.md. Where I need new copy (case studies), I use **résumé wording only**, because that's your own text. | Brief truth rule; `audit/content-inventory.md` §3 |
| Q9 | What about the unsourced numbers in the project visuals (Sharpe 1.84, accuracy 94.1%, …)? | Remove them from display, record them in CONTENT.md with their source file, and ask about them in NEEDS. New visualizations use either real computation (the demos) or data labelled *illustrative*. | Brief: "Visualizations that use made-up data must be labeled as illustrative" |
| Q10 | The spec block mixes CRJ700 and CRJ900 figures. Fix or flag? | Both. Publicly sourced aircraft data isn't a claim about you, so the spec becomes a two-column CRJ700/CRJ900 table with published figures and sources (§5.1 of the content inventory). The change is logged in CONTENT.md and listed in NEEDS for sign-off. | Brief truth rule |
| Q11 | Station numbers? | Make them real positions **on the drawing**: inches aft of the nose, measured on the redrawn airframe at the CRJ700's 32.5 m overall length. A drawing note says they're schematic, not manufacturer station data. Stations appear only on the airframe. | Brief: "station numbers that map to real positions on the airframe earn their place" |
| Q12 | What does "Open to opportunities" say? | Nothing in the repo or résumé says what role you want, so the site shows a **HOLD** note. HOLD is the drafting convention for data not yet released, drawn in redline: "Open to opportunities. HOLD: role type and start date." It's one data field to fill in. | Brief: "use a placeholder if you can't find it" |
| Q13 | What happens to the "10 projects shipped" stat? | It stays, as the brief requires, and it's flagged in NEEDS (4 shown, 3 on the résumé, 15 public repos). | Brief example |
| Q14 | Case studies: route or dialog? | Modal `dialog` with a hash deep link (`#projects/crafttraq`), so Back closes it and the link is shareable. The shared-element transition goes from the figure frame to the dialog sheet via Motion `layoutId`. No router. | No framework migration; small surface |
| Q15 | Text-classification demo: real model or simulation? | A **real model trained for this page**. The smallest ready-made transformers.js text classifier I found is 67 MB (DistilBERT SST-2, int8), which is too heavy. I train a small logistic-regression classifier on hashed n-grams from an Apache-2.0 review dataset (Amazon Polarity) in Node, ship its weights as a few hundred KB of JSON, and run it in the browser. The page says plainly that this isn't the project's BERT ensemble, and states its measured held-out accuracy. | Brief: "real small in-browser model if it can be loaded on demand at a reasonable size; otherwise… clearly labeled" |
| Q16 | Eye-tracking demo cost? | MediaPipe Tasks Vision: 11.8 MB of WASM (3.1 MB brotli on the wire) and a 3.8 MB model, about 7 MB downloaded, fetched only after the visitor opts in and grants the camera. The UI states the size, that video stays on the device, and that MediaPipe itself sends Google usage metrics (disclosed before opt-in). If permission is denied or the device can't run it, the simulated demo is the fallback. | Measured by downloading each file |
| Q17 | A contact form? | Yes: "Submit for approval" in the sign-off block. It posts to a Vercel function (`/api/contact`) that sends through Resend when `RESEND_API_KEY` and `CONTACT_TO` are set. Otherwise the function answers 501 and the client opens a prefilled `mailto:`. A honeypot field and length limits guard it. | Brief |
| Q18 | Does the cat get a job? | Yes. On a drawing, the **checker** signs off the drawing after the drafter. The cat is the checker: it naps on the cover's title block, wakes when clicked, walks the title-block rule, and its paw print is the CHECKED signature in the sign-off block. It never covers content and ignores pointer events except on its own sprite. It stays still under reduced motion. It has no name; that's a question in NEEDS. | Brief item 11 |
| Q19 | What happens to logos in Skills? | Parts are drawn in line colour at rest. A brand colour appears only on the one selected part, as a swatch. That removes the "logo wall" and keeps recognition. | Audit VIS-07 |
| Q20 | What can go? | The hero IDE scene and every chip of fake UI chrome, the torch cursor, ghost words, "§ NN ·" eyebrows, middle-dot meta strings, the drifting grids, the stacked glow filters, the blanket `Reveal` fades, the project tabs, "Aviation / Data / Builds / Tomorrow" and "Build / Solve / Improve / Repeat". | §5 chrome audit |

---

## 2. Three directions, scored

### A. Drawing set (the default, pushed further)

The whole site is one engineering drawing set on cyanotype. **Sheet 01, cover sheet:** your name as the drawing title, a key drawing of the airframe with a detail-reference bubble into sheet 02, the proof items as a list of references, a title block and a revision block. **Sheet 02, side elevation:** the Experience survey, redrawn as line art that plots itself, with station callouts docking on leader lines and an inspection stamp at 100%. **Sheet 03, detail drawings:** every project as a figure, opening into a full detail sheet. **Sheet 04, assembly:** an exploded view of the stack with item balloons, beside a bill of materials. **Sheet 05, approval:** the sign-off block (drawn, checked, approved), where the visitor is the approver. Real drafting conventions carry real information: sheet numbers match the nav, stations are real positions, detail bubbles are links, QTY in the BOM is a real count, and the revision block comes from git.

Signature moments: (1) the airframe plotting itself and the survey stamp; (2) detail-reference bubbles as the link language, so every proof item points to the sheet that shows it; (3) the approval block, where contacting you is signing off the set.

### B. Flight deck

The site as a glass cockpit. The hero is a primary flight display, the nav is a navigation display with the career as a route (CYYZ → …), and skills are an ECAM checklist. B612 throughout, with the avionics colour code (magenta for active, green for normal, amber for caution, cyan for selectable).

Signature moments: (1) an ND route map as navigation; (2) a PFD-style hero where the attitude indicator tracks the cursor; (3) contact as "file flight plan".

### C. Maintenance records

The site as an aircraft technical log. Experience highlights are signed task cards with work-order numbers and ATA chapters. Projects are modification records. Contact is a certificate of release to service. Light "paper" ground, carbon-blue type, stamp red.

Signature moments: (1) task cards stamped as you scroll; (2) a logbook that fills with entries; (3) the release certificate.

### Scores (1–5, higher is better)

| Criterion | A. Drawing set | B. Flight deck | C. Maintenance records |
|---|---|---|---|
| Continues what already works (the Experience airframe, stations, spec block) | **5** | 2: stations and elevations have no place in a PFD | 3: the airframe becomes a clip-art header |
| Truth to your experience (office-side fleet-data and maintenance engineering, not piloting) | **5** | 2: a cockpit implies flying | **5** |
| Recruiter's first 30 seconds | **4**: a title block is a natural summary | 2: avionics colour codes mean nothing to a recruiter | 4 |
| Engineer and designer delight | **5** | 4 | 3 |
| Distance from generated defaults | **4**: blueprint-on-dark is familiar, but real conventions carrying data are not | 3: HUD sci-fi is the current site's drift | 2: cream paper plus stamp red is the most common AI-generated look |
| Performance risk | **4**: line art is cheap | 3: live instruments want per-frame updates | **5** |
| Accessibility risk | **4** | 2: saturated magenta/green/amber on black, colour-coded meaning | **4** |
| **Total** | **31** | 18 | 26 |

**Chosen: A, the drawing set.** B is the more novel idea on paper, but it misrepresents the work (you built fleet-data and maintenance systems; you didn't fly the aircraft) and repeats the HUD drift the audit calls out. C is honest and legible, but its visual language is the most common generated style, and it demotes the airframe. From C, direction A borrows the **inspection stamp** (survey complete) and the idea of a **signed-off record** (the approval block). From B it borrows **B612 Mono**, which Airbus commissioned for legibility on cockpit screens. That's the right tool for 13 px data labels, and it ties the lettering to aviation without dressing the page as a cockpit.

---

## 3. The idea, in one paragraph

A drawing set is a document engineers trust because every mark on it means something. The site should earn that trust the same way. Nothing on the page is decoration pretending to be data: a station number is a real position, a sheet number matches the index, a dimension measures what it points at, a revision is a real commit, QTY is a real count, and a HOLD means information isn't released yet. The costume risk is managed by restraint: one ground colour, line weight instead of glow, two typefaces, and ambient motion only where a drawing is being plotted.

---

## 4. Design system

### 4.1 Colour: drafting materials

| Token | Hex | Material | Use | Contrast on ground |
|---|---|---|---|---|
| `--cyanotype` | `#0f2a4c` | Prussian-blue cyanotype print ground | Page ground. Also the opaque fill behind text on the drawing. | n/a |
| `--blueprint` | `#eef3fa` | The white paper showing through where lines were drawn | Text, object lines, the name | 12.9:1 |
| `--faded` | `#a9c1e0` | Faded, lighter-exposed linework | Secondary text, labels, thin lines, dimension text | 7.8:1 (passes AA at 13 px) |
| `--construction` | `#5f86bd` | Construction lines, faint pencil | Non-text lines only: grid, borders, hidden lines, dividers | 3.9:1 (meets 3:1 for graphics; **never used for text**) |
| `--redline` | `#ff8c7a` | Red markup pencil | Revisions, HOLD notes, selection, the primary action, the stamp | 6.4:1 |
| `--checker` | `#ffd23f` | Checker's yellow highlighter, used to mark items as verified | Focus indicator, "verified / links to proof" highlight | 10.0:1 |

Opacity variants of these colours are the only other colours allowed, and they are never used for text. Brand colours appear once: as the swatch of the currently selected BOM part. Contrast is enforced by a unit test (`src/design/contrast.test.ts`) that fails if any text token drops below 4.5:1 on `--cyanotype`.

Rules: **red means markup** (something changed, pending or chosen), and **yellow means checked** (keyboard focus, or "this is verified; follow it"). Neither appears as decoration.

### 4.2 Type

Two families, self-hosted, subset to Latin, `font-display: swap` with metric-matched fallbacks to keep CLS near zero:

- **Archivo** (Omnibus-Type, SIL OFL), a variable font with width 62–125 and weight 100–900. Instanced to **width 62–100 and weight 400–700** (about 55 KB woff2). One family gives two voices: condensed (width 68–75) for drawing titles and the name, which echoes the condensed gothic lettering of title blocks, and normal width (100) for reading text.
- **B612 Mono** (Airbus / Intactile, SIL OFL), 400 and 700 (about 19 KB each). **Data only**: stations, dimensions, coordinates, times, sheet numbers, item numbers, quantities. It's never used for sentences or buttons, so mono stays a signal ("this is a measured value").

Rejected: IBM Plex and JetBrains Mono (the current and default pairing; the UI/UX Pro Max lookup also returned it, which is the problem), Space Grotesk and Saira Condensed (drift), and Inter (default).

Scale (px). Based on the classic typographic scale, floors at 13 for labels and 16 for body.

| Token | Size / line-height | Face | Use |
|---|---|---|---|
| `display` | clamp(56, 9.2vw, 168) / 0.9 | Archivo width 68, 700 | The name (h1) |
| `title` | clamp(30, 3.6vw, 48) / 1.02 | Archivo width 72, 650 | Sheet titles (h2) |
| `heading` | 24 / 1.15 | Archivo width 85, 600 | Item titles (h3) |
| `lead` | clamp(19, 1.6vw, 22) / 1.45 | Archivo 100, 400 | Standfirst, the positioning line |
| `body` | 17 / 1.55 | Archivo 100, 400 | Reading text, measure under 68ch |
| `small` | 15 / 1.45 | Archivo 100, 400 | Secondary text, captions |
| `data` | 14 / 1.3 | B612 Mono 400 | Values: stations, coordinates, times |
| `label` | 13 / 1.25 | Archivo width 85, 500 | Field labels in title blocks and tables |
| `data-lg` | clamp(24, 2.4vw, 34) / 1 | B612 Mono 700 | Proof figures (2,000+, 100+) |

**Case rule:** uppercase belongs to the drawing, sentence case belongs to the reader. Lettering *on* the drawing (station tags, title-block field names, zone letters, the stamp) may be uppercase, as ASME Y14.2 lettering is, at 13 px or larger with tracking of 0.04em or less. Everything a visitor reads or clicks (headings, prose, buttons, nav) is sentence case. No wide-tracked eyebrows.

### 4.3 Line weights (ASME Y14.2, mapped to screen)

All strokes use `vector-effect: non-scaling-stroke`, so weights hold at every drawing scale.

| Token | Weight | Style | Drawing meaning | Site use |
|---|---|---|---|---|
| `--line-object` | 2 px | solid, `--blueprint` | Visible edges of the object | Airframe outline, sheet border, frames of figures and dialogs |
| `--line-thin` | 1 px | solid, `--faded` | Dimension, extension and leader lines; detail features | Leaders to callouts, dimension lines, windows and doors, table rules |
| `--line-hidden` | 1 px | dash 6/4, `--construction` | Features behind the visible surface | Cabin floor and wing box on the airframe. On cards: "details collapsed". |
| `--line-center` | 1 px | dash 18/4/4/4, `--construction` | Axes of symmetry and datums | Fuselage datum line. The survey progress rule. |
| `--line-grid` | 1 px | solid, `--construction` at 16% | Construction grid | Sheet ground grid (static) |
| `--line-cut` | 2 px | dash 12/4, `--redline` | Cutting plane: "this is the section being shown" | Selection outline (the selected BOM row, the active station) |

Focus is its own convention: a 2 px `--checker` outline offset 3 px, with registration corners on larger targets. Yellow means checked.

### 4.4 Space, grid, radii, elevation

- **Spacing** (4 px base): 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Section rhythm: 96 px between sheets on desktop, 64 on mobile.
- **Grid:** 12 columns, max content width 1280 px. Gutters: 16 px below 640, 24 px from 640. The sheet frame is inset from the viewport by 8 px on phones, 16 px on tablets and 24 px on desktop.
- **The sheet frame:** one continuous pair of vertical border lines runs the length of the page. Each sheet ends in a horizontal sheet break with its **title block** at the right (sheet no., title, revision, date, scale). From 1024 px, zone letters (A…) run down the left border and zone numbers (1…8) across the top of each sheet. Zones are real: the cursor readout reports them, and they reset per sheet like a real set.
- **Radii:** 0, except where a physical object is round: the device frame around CraftTraq screenshots (phone corners), and circles that mean something (detail-reference bubbles, BOM item balloons, the stamp ring).
- **Elevation:** no shadows. Hierarchy comes from line weight and from opaque `--cyanotype` fills that mask the grid under text. Dialogs get a 2 px object-line frame over a 70% `--cyanotype` scrim.

### 4.5 Motion

**Tokens**

| Token | Value | Use |
|---|---|---|
| `dur-press` | 80 ms | Press feedback |
| `dur-quick` | 160 ms | Hover and focus state changes |
| `dur-base` | 240 ms | Component state changes (select, expand) |
| `dur-sheet` | 480 ms | Dialog open, shared-element transitions |
| `dur-plot` | 900 ms | A line being plotted (intro, stamp) |
| `ease-pen` | cubic-bezier(0.65, 0, 0.35, 1) | Plotting a line: the pen accelerates, then settles |
| `ease-settle` | cubic-bezier(0.2, 0.8, 0.2, 1) | Things arriving |
| `ease-exit` | cubic-bezier(0.4, 0, 1, 1) | Things leaving (exit is about 30% faster than enter) |
| `spring-ui` | stiffness 420, damping 34 | Gestures and layout (dialog, selection marker) |
| `stagger` | 40 ms | Sequenced lines within one plot |

**Principles**

1. **Motion is plotting.** Lines draw on with `ease-pen`. Text is never faded or slid in: it's there, or it's revealed by its line. The LCP element is never animated.
2. **One ambient moment per sheet**, and it's scroll-linked or first-visit only. Cover: the plot-in intro (under 1.1 s, once per session, skippable, text already visible). Experience: the survey. Projects: CraftTraq screens panning with scroll. Skills: the exploded view separating. Contact: the checker walking to sign.
3. **Responses are immediate and show what changed:** 80–240 ms, from the control to the thing it affected (a selected part's balloon, the station a card belongs to).
4. **Nothing loops without a live reason.** The only recurring updates are the clock (once a minute) and the demo loops the visitor has started.
5. **Offscreen is paused:** every rAF loop, camera stream and scroll handler gates on an IntersectionObserver or on Motion's in-view.
6. **Reduced motion is a designed static state, not a broken animated one:** drawings appear fully plotted, the survey shows the finished sheet with every callout, the dialog cross-fades, the cat sits still, and nothing is pinned.
7. **One owner per element.** Motion owns transforms and opacity. CSS owns colour and state transitions. Nothing is animated by both.

---

## 5. Chrome audit: every mark earns its place

| Current chrome | Verdict | Replacement or reason |
|---|---|---|
| "§ 01 · Experience" eyebrows | Cut | The sheet title block carries sheet number and title, and matches the nav. |
| Nav "01 Home … 05 Contact" | Keep, fixed | Becomes the **sheet index**. Numbers match the title blocks: 01 Cover, 02 Experience, 03 Projects, 04 Skills, 05 Contact. |
| Outlined ghost words | Cut | Decoration colliding with rules (audit #4). |
| STA numbers on projects and hero | Cut | Stations belong to the airframe only. |
| STA numbers on the airframe | Keep, made real | Measured positions on the drawing (Q11). |
| "Side elevation · Sheet 01" | Keep, corrected | Now "Sheet 02 · Side elevation" in the title block. |
| CRJ spec block (aria-hidden) | Keep, fixed | Two-column table, real `<table>`, exposed to screen readers, with sources. |
| Overall-length dimension | Keep | Measures the drawn airframe. It's the scale reference for the live SCALE readout. |
| CYYZ coordinates | Keep | The datum of the set. It sits on the cover next to live Toronto time, where it says where you are. |
| "Flight direction" note | Keep | Arrow on sheet 02, 13 px. |
| "Aviation / Data / Builds / Tomorrow", "Build / Solve / Improve / Repeat", "Turning complexity into simple solutions →" | Cut | Encode nothing. |
| Hero IDE, deploy checklist, Q1–Q4 chart, "Ideas / Code / Products / Impact", "Scalable solutions" | Cut | Generic and untrue (no data). |
| FIG. numbers | Keep | One numbering per project (FIG. 1–4), matching its detail sheet. The "01 · LIVE", "01 · FEATURED" and "STA 000" labels go. |
| "Materials list · 28 items" | Keep, upgraded | A real BOM with item numbers and QTY derived from where each part is used. |
| "Detail A-A" inspector | Keep, fixed | The BOM's detail panel, with a useful default (most-used parts) and tap, click and focus support. |
| Schedule bars | Replaced | The four groups become filters with counts, tied to the exploded-view plates. |
| Hatch marks, corner brackets on every chip, offset outlines, glow rims | Cut | Line weight replaces glow. Registration corners appear only as the focus style. |
| "CH 01 · PRIMARY" channel numbers | Cut | Channels aren't a sequence. |
| "Open to opportunities" pill with green dot | Keep, changed | In the title block's STATUS field, with the HOLD note until the role type is supplied. |
| Middle-dot meta strings | Cut, except in data rows | Real separators inside tables only. |
| "↗" / "→" appended to link text | Cut | External links get an accessible "(opens in new tab)" and a small drawn arrow glyph only on external links, where the direction means "leaves the set". |
| Footer "Built by…" | Replaced | Revision block (git), source link, back to top (the cover). |

---

## 6. Sheet specifications

### Sheet 01: cover (hero)

Job: who, what, proof, contact, in one screen.

```
Desktop (1440)
┌─ zone numbers 1 … 8 ───────────────────────────────────────────────────────┐
│A  Portfolio · drawing set                             [ index ▸ sheets ]   │
│   SEARAN KUGANESAN (display, condensed)                                    │
│B  I build the systems operators run on: a component tracker for 2,000+    │
│   aircraft at Mitsubishi Heavy Industries, and CraftTraq, a live SaaS…     │
│C  [Contact me] [Résumé (PDF)]  GitHub · LinkedIn                           │
│   ┌ key drawing: airframe (small) ─────────────────── (A/02) bubble ┐      │
│D  └──────────────────────────────────────────────────────────────────┘     │
│   References:  2,000+ aircraft (02)  CraftTraq live (03)  Western '26 (04*) │
│E  ┌ title block ─────────────────────────────────────────────────────────┐ │
│   │ DRAWN S. Kuganesan │ STATUS Open to… HOLD │ DATUM CYYZ N43.6777 W79.62…│ │
│   │ LOCAL 14:32 Toronto │ SHEET 01/05 │ REV 1a2b3c · 2026-09-24 │ 🐾 cat  │ │
│   └──────────────────────────────────────────────────────────────────────┘ │
```

Mobile: the name, the positioning line, two buttons, the proof references as a two-column list, the key drawing full width, and the title block stacked into two columns. No zone markers.

The proof references are links styled as detail-reference bubbles (circle split by a rule: item on top, sheet number below). Each points to the sheet that proves it.

### Sheet 02: side elevation (Experience)

Job: show what you did at MHI RJ, anchored to the aircraft it was about.

- **Desktop (≥1024 and height ≥700):** the sheet sticks for (N+1) × 70vh. Scroll progress 0–0.18 plots the airframe (object lines, then thin lines, then hidden lines). Each callout docks in its own window: its station tick lights, a leader draws from the station to the card, and the card's frame plots. At 1.0 the **SURVEY COMPLETE** stamp lands (redline ring, date of your last day there, 08/2025). Cards sit in one row under the airframe, ordered fore to aft, so reading order, station order and numbering all agree (fixes audit I-03).
- Each card shows **title, one impact line** (verbatim from its tags or description) and a "Details" disclosure that opens the full existing paragraph and tags. Hover or focus on a card lights its station. Hover or focus on a station tick (a button) lights its card.
- **Tablet and phone:** no pin. The airframe sticks at the top of the sheet (full width). The cards flow below in normal scroll, and the card crossing the centre of the viewport lights its station. The leader is a vertical line from the station down into the card stack.
- **Reduced motion:** static sheet, fully plotted, all cards shown, stamp present, no sticky.
- Data-driven: the component takes `{ drawing, callouts: [{ stationIn, zone, … }] }`. Adding a highlight adds a station and a card. A role without a drawing renders as a plain sheet of cards.

### Sheet 03: detail drawings (Projects)

Job: show all four projects at a glance, and let people go deep.

```
Desktop
┌ FIG. 1 CraftTraq (live) ─────────────────────┐┌ FIG. 2 Portfolio risk ┐
│  device frames: board (desktop) + phone      ││  interactive frontier  │
│  (pan with scroll)                           ││  (illustrative data)   │
│  Multi-tenant SaaS… [Open detail ⊕] [Site]   │├ FIG. 3 Text classif.  ┤
└──────────────────────────────────────────────┘│  type a sentence ▸     │
                                                ├ FIG. 4 Eye tracking   ┤
                                                │  [Try it with camera]  │
                                                └───────────────────────┘
```

- **Detail sheet** (dialog): problem, approach, architecture diagram (drawn in the site's line conventions, showing only components named in your own text), outcome (only stated facts), stack, and links. The demo appears here in full.
- **Demos** load nothing until opted in:
  - **Risk:** efficient frontier over three illustrative assets. Drag the weights and the portfolio point, return, volatility and parametric 95% VaR update. Labelled "Illustrative data, not market data".
  - **Text classification:** type a sentence and watch it pass through clean → tokenize → features → model → label. A real in-browser logistic-regression model trained for this page, labelled as such, with its measured accuracy.
  - **Eye tracking:** opt in, grant the camera, and a reticle follows your gaze; a blink clicks a target. Processing stays on your device. Denied or unsupported falls back to the simulated demo.

### Sheet 04: assembly and bill of materials (Skills)

Job: show what you work with, and prove where you used it.

- **Exploded view** (left or top): four isometric plates, one per group, stacked. Scroll separates them into an exploded view. Each plate carries its parts as item balloons.
- **BOM table** (right or below): ITEM · PART · NOTE · QTY. QTY counts the places a part is used, derived from experience tags and descriptions, project stacks and résumé-backed case-study text (never typed by hand). Group filters with counts sit above the table.
- **Detail panel:** selecting a row (click, tap, Enter) shows the part, its note, and "Used in", with links to the exact experience card or project. Default state: "Most used", the top five parts by QTY. Phone: the detail opens inline under the row.

### Sheet 05: approval (Contact)

Job: make contact the ending.

```
┌ Approval ─────────────────────────────────────────────────────────────┐
│ DRAWN   S. Kuganesan        2026-09-24   (signature: typed name)      │
│ CHECKED [cat paw stamp]                                               │
│ APPROVED  ▢ you:  [Name] [Email] [Message]  [Submit for approval]      │
│           or searan.kuganesan4@gmail.com [Copy] · Résumé · GitHub · In │
│ STATUS  Open to opportunities · HOLD role type · Toronto 14:32        │
└───────────────────────────────────────────────────────────────────────┘
Revision block (footer): REV · DATE · DESCRIPTION (last 3 commits) · build hash · source · Back to cover
```

On a successful send (or a copy of the email) the APPROVED cell gets a redline stamp, "APPROVED · thank you". A failed send says what failed and offers `mailto:`.

### Global

- **Sheet index (nav).** From 1024 px, a fixed right rail with sheet numbers joined by a centre line, the current sheet filled, and scroll progress drawn along the line. Labels are always visible from 1280 px, and show on hover or focus between 1024 and 1279. Content reserves the rail's width, so nothing sits under it (audit #9). Below 1024, a bottom **title strip** shows "02 / 05 Experience" plus an Index button that opens the sheet list; 13 px or larger, 48 px tall, clear of the home indicator.
- **Command palette** (Ctrl/⌘ K, plus an Index button in the strip): jump to a sheet, copy email, download résumé, open GitHub, LinkedIn or CraftTraq, toggle motion, wake the cat.
- **Drafting crosshair** (fine pointers, motion allowed): a small cross at the pointer with a readout of zone and sheet-relative coordinates in millimetres (CSS mm). It snaps its brackets to interactive targets. The native cursor stays visible. It can be turned off from the palette and is off by default under reduced motion.
- **Intro:** first visit per session only. The sheet border, zone ticks and key-drawing lines plot in over about 900 ms while the text is already visible. Any key, click or scroll finishes it instantly.
- **Console:** a short note for developers: the stack, the source link, and a hint about the Konami code.
- **Skip link:** "Skip to content", drawn as a note tag.
- **404:** Vercel's plain 404 is replaced by a "sheet not found" page drawn in the same language.
- **Print:** a whiteprint stylesheet (blue lines on white, no nav, all details expanded).

---

## 7. Dependencies

| Package | Change | Why |
|---|---|---|
| `motion` | Replaces `framer-motion` | Same author, current package (`motion/react`). `LazyMotion` + `m` cuts the initial cost from about 100 KB to about 35 KB gzip. |
| Font packages (`@fontsource…`) | **Not used** | Fonts are instanced and subset with fontTools (`scripts/build-fonts.py`) and committed as woff2, which is smaller than any npm font package. |
| `@mediapipe/tasks-vision` | Add, loaded only on opt-in | Face Landmarker for the eye-tracking demo. WASM and model come from the official CDNs at runtime. |
| `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y` | Add (dev) | The brief requires lint to pass. The a11y rules catch regressions. |
| `playwright`, `@axe-core/playwright`, `lighthouse`, `rollup-plugin-visualizer` | Added (dev) in Phase 0 | Audit and verification. |
| `gsap`, `lenis`, `three`/`@react-three/fiber`, `cmdk`, a router | **Not added** | See Q5–Q7 and Q14. The palette is about 150 lines on a native `<dialog>`. |

## 8. Ideas considered and dropped

- **Flight-route nav** (waypoints CYYZ → …): it mixes a second metaphor into the set. The sheet index does the same job in-concept.
- **Auto-scrolling device screens:** a loop without a live reason. The screens pan with page scroll instead, which is scroll-linked and stops when you stop.
- **Blueprint grid bending around the cursor:** decoration, and it conflicts with "the grid is a real construction grid".
- **Theme toggle:** replaced by the print whiteprint (Q4).

## 9. Self-review against generated defaults

Checked against frontend-design's list of tells:

- *Near-black ground with one bright accent*: the ground is a saturated Prussian blue from a real process, and the two accents carry fixed meanings (red = markup, yellow = checked). **Kept, deliberately.**
- *Tracked all-caps mono eyebrows*: removed. Uppercase only on drawing lettering, tracking of 0.04em or less, mono for values only.
- *Middle-dot meta strings, "→" suffixes*: removed.
- *One accented phrase in the headline*: removed. The headline is the name, and the positioning line is plain.
- *Hairline broadsheet layout with zero radius*: zero radius is kept because drawings have no rounded boxes. The layout isn't a broadsheet: it's sheets with title blocks and drawings, a different structure.
- *Numbered markers used as decoration*: every number is a real index (sheet, figure, item, station).

What I changed after this review: I dropped a planned "01 / 02 / 03" step numbering on the case-study sections (problem, approach, outcome), since they aren't a sequence the reader steps through. They're headings.
