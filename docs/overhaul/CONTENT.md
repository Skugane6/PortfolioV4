# Content changes

Every piece of copy that changes, with current text, proposed text and why. The factual base is `audit/content-inventory.md`. The rules:

1. **Every factual claim on the current site survives.** It's reworded only where the change is typographic (case, punctuation), and its wording is kept even where it differs from the résumé. Those differences are flagged in NEEDS-FROM-SEARAN.md instead of being "fixed".
2. **New copy uses your own words.** Case-study text is drawn from the résumé you wrote (`public/skuganesan_resume.pdf`), quoted or tightened without adding claims. Nothing is invented: no users, results, metrics or roles.
3. Chrome that carries no information is cut (DESIGN.md §5). It's listed here only when it contained words.

---

## 1. Hero headline: three options

The facts it may use: B.E.Sc. Software Engineering, Western University, graduated 06/2026. Software Engineering Intern at Mitsubishi Heavy Industries, 05/2024–08/2025, Mississauga. A component tracker supporting 2,000+ aircraft across 100+ operators. CraftTraq, a live multi-tenant SaaS for trade contractors.

| # | Option | Assessment |
|---|---|---|
| A | **I build the systems operators run on.** | Your own line (currently only in the `<noscript>` fallback). "Operators" means both airlines (the tracker served 100+ operators) and the contractors running their business on CraftTraq. Memorable, but it needs its specifics beside it. |
| B | **Software engineer. I built a component tracker for 2,000+ aircraft at Mitsubishi Heavy Industries, and CraftTraq, a live SaaS for trade contractors.** | Most specific. Every clause is a stated fact. Long for a display line. |
| C | **From regional-jet fleet data to trade-contractor job boards, I build the software behind the work.** | Clever, less specific ("the work"), and "job boards" undersells CraftTraq. |

**Implemented: A as the lead, with B's specifics as its second sentence, in one paragraph under the name.**

> **Searan Kuganesan** (h1)
> I build the systems operators run on: a component tracker supporting 2,000+ aircraft across 100+ operators at Mitsubishi Heavy Industries, and CraftTraq, a live SaaS for trade contractors.

Why: specific beats clever, and this version is both. It names the employer, the scale and the live product in the first screen, which the audit found missing (§3.2). It claims nothing the site doesn't already say. It uses "supporting … across 100+ operators", the card's own wording, rather than the résumé's "serving".

---

## 2. Document metadata

| Where | Current | Proposed | Why |
|---|---|---|---|
| `<title>` | Searan Kuganesan · Software Engineer | Searan Kuganesan, software engineer | No middle dot. Same facts. |
| meta description | Searan Kuganesan builds full-stack systems and data platforms, from a fleet-tracking platform at Mitsubishi Heavy Industries to CraftTraq, a live SaaS product for trade contractors. | Software engineer (Western University, B.E.Sc. 2026). Built a component tracker supporting 2,000+ aircraft at Mitsubishi Heavy Industries and CraftTraq, a live SaaS for trade contractors. | The current text invents "a fleet-tracking platform" (audit SEO-05, content D-22). 155 characters. |
| OG / Twitter title | none | Searan Kuganesan, software engineer | New |
| OG description | none | Same as the meta description | New |
| OG image text | none | "Searan Kuganesan · Software engineer" over the airframe drawing, with the sheet title block | New, generated |
| noscript | "I build the systems operators run on…" plus 4 links | The hero paragraph from §1, plus Email, Résumé (PDF), GitHub, LinkedIn, CraftTraq | The résumé was missing from the no-JS fallback |
| JSON-LD Person | none | name; jobTitle "Software Engineer"; alumniOf Western University; sameAs GitHub and LinkedIn; url; email | Facts already on the site |

---

## 3. Sheet 01: cover (hero)

| Current | Proposed | Why |
|---|---|---|
| "SK" monogram, "SEARAN KUGANESAN" / "SOFTWARE ENGINEER" lockup | Removed. The name is the h1. | It duplicated the h1's job at 12 px |
| "// FULL-STACK & DATA SYSTEMS" | Cut | Covered by the headline paragraph |
| h1 "I build scalable systems that create real impact." | h1 "Searan Kuganesan", plus the paragraph in §1 | §1 |
| "I design and develop web applications, streamline complex workflows, and turn ideas into reliable, user-focused products." | Cut | Generic. The new paragraph says the same thing with evidence. |
| CTA "SEE MY WORK" | "See the work" (sentence case, links to sheet 02) | Same action, sentence case |
| CTA "DOWNLOAD RÉSUMÉ" | "Résumé (PDF, 68 KB)" | States format and size, the same download |
| Icon links GitHub / LinkedIn / Email | Text links "GitHub", "LinkedIn", "Email" | Recognisable without icons |
| Stat "10 / PROJECTS SHIPPED" | "10 projects shipped" (kept verbatim, flagged) | Brief: flag, don't change (NEEDS #2) |
| Stat "Western mark / WESTERN UNIVERSITY" + "2026 / B.E.SC SOFTWARE ENG" | "B.E.Sc. Software Engineering, Western University, 2026", linked to the education line on sheet 02 | One item. The Western mark remains beside it. |
| Stat "LIVE / CRAFTTRAQ SAAS" → crafttraq.com | "CraftTraq, live", linked to FIG. 1 on sheet 03 (the site link is still one click on) | Brief: "each stat links to its proof" on the page |
| — | New reference: "2,000+ aircraft, 100+ operators", linked to station 145 on sheet 02 | Existing fact, now in the first screen |
| "OPEN TO OPPORTUNITIES" / "OPEN TO WORK · CANADA" | STATUS: "Open to opportunities", with redline **HOLD: role type and start date** | Brief: say what you're looking for, and use a placeholder when unknown (NEEDS #1) |
| "BASED IN CANADA · CYYZ N 43.6777° W 79.6248°" | DATUM "CYYZ, N 43.6777° W 79.6248°" and LOCAL "Toronto" with the live time | Brief: live Toronto time next to CYYZ. The coordinate is kept verbatim (it's the airport's place coordinate, about 0.5 km from the published ARP; content inventory §5.2). |
| "TURNING COMPLEXITY INTO SIMPLE SOLUTIONS →", "BUILD / SOLVE / IMPROVE / REPEAT", "STA 000 · HOME", "SCROLL" | Cut | Encode nothing |
| Hero stage text (IDE code, "DEPLOY Build/Test/Deploy", "REAL-WORLD IMPACT", "IDEAS / CODE / PRODUCTS / IMPACT", "SCALABLE SOLUTIONS…", "RUNTIME OK", "PLANE 02") | Cut | Decorative, with no data behind it. The IDE snippet was invalid Python (I-13). |
| — | Title block: DRAWN "S. Kuganesan"; SHEET "01 of 05"; REV "<git short hash>"; DATE "<last commit date>"; SCALE "NTS" | Real values: git data injected at build time |

---

## 4. Sheet 02: side elevation (Experience)

| Current | Proposed | Why |
|---|---|---|
| "§ 01 · Experience" / "Side elevation · sheet 01" | Title "Experience", with a title-block row "Sheet 02 · Side elevation · CRJ700 series" | Numbering now matches the index (audit #1) |
| "05/2024 – 08/2025 · Mississauga, Canada" (faded out once the survey started) | Always visible under the company name | Dates are content (I-11) |
| "Mitsubishi Heavy Industries" beside the MHI RJ logo | Unchanged: "Mitsubishi Heavy Industries" with the MHI RJ logo | Text and logo name related but different entities. Flagged (NEEDS #4). |
| "Software Engineering Intern" | Unchanged | |
| "B.E.Sc. Software Engineering, Western University · 06/2026" | "B.E.Sc. Software Engineering, Western University. Graduated 06/2026." (moves to the sheet's notes block) | Résumé wording "Graduated: 06/2026". The anchor target for the cover reference. |
| Station tags "STA 145 · FWD", "STA 410 · WING BOX", "STA 760 · AFT", "STA 940 · EMPENNAGE" | "STA 145 · Fwd fuselage", "STA 616 · Wing box", "STA 942 · Aft fuselage / engine", "STA 1116 · Empennage" | Stations are now measured on the drawing (inches aft of the nose at 32.5 m overall). The zone names are kept. Drawing note: "Stations measured on this drawing from the nose, in inches, at the CRJ700's 32.5 m length. Schematic, not manufacturer station data." |
| Card titles | Unchanged | |
| Card descriptions (four paragraphs) | **Unchanged**, shown under "Details" | Every word survives. Résumé differences flagged (NEEDS #3). |
| Card tags | Unchanged | |
| Card captions ("Component lifecycle visibility", …) | Unchanged, shown first inside each card's Details | Kept verbatim. Moved behind the disclosure so the card front is title plus impact line, which fits a 1024 × 768 laptop. |
| — | New **impact line** per card, taken verbatim from the card's own text: 01 "2,000+ aircraft across 100+ operators"; 02 "Reporting automated, turnaround time cut by 85%"; 03 "CRJ700/900 fleets, 50+ operators"; 04 "Maintenance workflows across 2,000+ entities" | Brief: a scannable impact line with the full detail on expand. Wording comes from the existing description sentences (02 paraphrases "automated reporting to cut turnaround time by 85%" without changing its meaning; see NEEDS #3 on the 85% metric). |
| "Designed the Oracle database architecture underneath it, …" | Unchanged. Suggested fix in NEEDS: "Designed the Oracle database architecture underneath the engine, …" | "it" has no antecedent (I-10). Not changed without your OK. |
| Phase readout "Datum → Sta 145 · fwd → … → Survey complete → Departing" + "NN%" | "Survey 0–100%" readout. At 100%, the stamp "SURVEY COMPLETE · 08/2025" | It reaches 100% and completes (audit #5). 08/2025 is your end date. |
| "↓ scroll to survey" | Cut. The survey progress rule is the affordance. | The arrow and imperative were chrome. |
| "Overall length 32.5 m (106.6 ft)" | Unchanged | Correct for the CRJ700, and 106.6 ft is the right rounding of 32.5 m |
| "CYYZ N 43.6777° W 79.6248°" (datum stamp) | Moves to the cover's DATUM field | One copy |
| "Nose section STA 0 – 145", "Main wing STA 410", "Aft section STA 760+" | Cut | Replaced by the four real station tags |
| Spec "CRJ700 / 900 · Regional jet · Length 32.5 m · Wingspan 24.9 m · Height 7.5 m" | Table with two columns. **CRJ700:** length 32.5 m, wingspan 23.2 m, height 7.6 m. **CRJ900:** length 36.2 m, wingspan 24.9 m, height 7.5 m. Caption: "Published figures; sources in the page notes." | The current block mixes the two variants (content inventory §5.1). Sources: SkyWest CRJ700 fact sheet, and Wikipedia citing Bombardier's airport planning manual. Flagged (NEEDS #5). |
| "Flight / Direction" | "Flight direction" with arrow | Sentence case |
| "Aviation / Data / Builds / Tomorrow" | Cut | Encodes nothing |
| Image alt "CRJ700/900 x-ray side elevation" | SVG title "Side elevation of a CRJ700-series regional jet, drawn as line art, with four stations marked" | Describes the drawing |

---

## 5. Sheet 03: detail drawings (Projects)

The names and taglines are unchanged. Removed: "01 · FEATURED", "02 · ALSO BUILT", "STA 000 · PRODUCTION", "STA 145 · ANALYTICS" and the other station labels, plus "01 · LIVE" / "02 · BUILD". Each project has one number now: **FIG. 1–4**.

**Unsourced numbers removed from display** (kept here and in NEEDS #6 so nothing is lost):

| Visual | Removed text | Source |
|---|---|---|
| RiskVisual | "Sharpe 1.84", "ANN. RETURN 14.2%", "VOL 7.7%", "VaR 95 -2.4%" | `src/components/projects/RiskVisual.tsx:7-11, 30, 33` |
| NlpVisual | "MLFLOW RUN 47", "ACCURACY 94.1%", "F1 MACRO 0.921", "PRECISION 0.936", "RECALL 0.908" | `src/components/projects/NlpVisual.tsx:34-39, 54, 65` |
| EyeVisual | "GAZE POINTER · 30 FPS", "CALIBRATED · 9-PT", "EAR 0.28", "LATENCY 18ms", "DRIFT 0.7°", "BLINKS 142" | `src/components/projects/EyeVisual.tsx:29-40, 73, 85, 194, 242` |

Detail-sheet headings: **What it does · How it's built · Architecture · Where it stands · Stack · Links**. I chose these over "Problem / Outcome" because the source text states what was built, not problems or outcomes. Making those up would break rule 2. NEEDS #7 asks for them.

### FIG. 1 CraftTraq

- **Tagline** (unchanged): "Multi-tenant SaaS platform for trade contractors. Quotes convert straight into jobs, crews get scheduled against them, and invoicing, time tracking, and payroll sync follow the same record through."
- **How it's built** (résumé, verbatim bullets tightened only by removing "Built"/"Engineered" openers):
  - End-to-end job lifecycle management: shareable client quotes that auto-convert into jobs, drag-and-drop crew scheduling, and status-tracked job records.
  - Scheduling with immutable task-assignment snapshots, reconciled against live crew membership.
  - Invoicing, time tracking and inventory management across 28+ tables, with a PDF generation pipeline.
  - Stripe, QuickBooks OAuth2 payroll sync, Twilio SMS, and Supabase Realtime for live job-status updates across the Progressive Web App.
- **Where it stands:** "Live in production with tiered Stripe billing." (résumé)
- **Stack** (site, unchanged): React 19, TypeScript, FastAPI, PostgreSQL, Stripe, Supabase.
- **Architecture diagram:** only the components named above: PWA (React 19, TypeScript) → FastAPI → PostgreSQL (Supabase), with Supabase Realtime back to the PWA, and Stripe, QuickBooks (OAuth2) and Twilio as integrations of the API, plus the PDF generation pipeline.
- **Links:** "crafttraq.com" (the existing "VISIT LIVE SITE", now sentence case: "Visit crafttraq.com").
- **Screens:** the existing board and calendar screenshots, with their existing alt text.

### FIG. 2 Portfolio Risk Dashboard

- **Tagline** (unchanged): "MPT and Value-at-Risk analytics on live market data, with efficient-frontier optimization."
- **How it's built** (résumé): a full-stack financial analytics application using React/Vite and Flask for Modern Portfolio Theory analysis and Value at Risk calculations with interactive dashboards. A Python backend with yfinance API integration and NumPy/Pandas/SciPy for market data, visualized with recharts. Statistical portfolio optimization algorithms for efficient-frontier analysis and risk metrics.
- **Stack** (site, unchanged): React, Vite, Flask, MongoDB, NumPy, Pandas, SciPy. (The résumé lists Python rather than Vite; flagged in NEEDS #8.)
- **Demo:** "Illustrative data, not market data. Three made-up assets with fixed expected returns, volatilities and correlations." The figures shown are computed live from those made-up inputs.
- **Links:** "Source on GitHub".

### FIG. 3 Text Classification Pipeline

- **Name** (unchanged): "Text Classification Pipeline". The résumé calls it "Multi-Model Text Classification Pipeline" (NEEDS #8).
- **Tagline** (unchanged): "BERT + CNN/BiLSTM ensemble for text classification, with MLflow tracking and data augmentation."
- **How it's built** (résumé): an ensemble combining BERT embeddings with CNN and BiLSTM architectures for categorization. Experiment tracking with MLflow, logging model configurations and hyperparameter combinations. A data augmentation pipeline using back-translation and synonym replacement to expand the training set.
- **Stack** (unchanged): Python, TensorFlow, BERT, scikit-learn, PostgreSQL, MLflow.
- **Demo disclosure** (new): "This demo runs a small logistic-regression model trained for this page on public product reviews (Amazon Polarity, Apache-2.0), entirely in your browser. It shows the same pipeline stages, not the project's BERT ensemble. Held-out accuracy: 90.0% on 5,000 reviews." (Measured by scripts/train-classifier.mjs on the shipped model file; the page reads it from public/models/text-classifier.json, never hard-coded.) Example sentences in the demo are labelled as made-up reviews.
- **Links:** none (no public repo; NEEDS #9).

### FIG. 4 Eye Tracking Mouse

- **Tagline** (unchanged): "Hands-free cursor control from a webcam. Look to move, blink to click."
- **How it's built** (from the stated stack only): Python with OpenCV and MediaPipe for face and iris landmarks, NumPy for smoothing, and PyAutoGUI to move and click the system cursor.
- **Demo disclosure** (new): "Runs Google's MediaPipe Face Landmarker in your browser. The video never leaves your device. About 16 MB downloads the first time you start it." Fallback: "Camera unavailable, so this is a simulation of the same pipeline."
- **Links:** "Source on GitHub".

---

## 6. Sheet 04: assembly and bill of materials (Skills)

| Current | Proposed | Why |
|---|---|---|
| "§ 03 · SKILLS" / "MATERIALS LIST · 28 ITEMS" | Title "Skills", title-block row "Sheet 04 · Assembly and bill of materials · 28 parts" | Numbering matches the index |
| Group labels "BUILD SURFACE", "INTEGRATIONS", "DATA & MODELS", "QUALITY & DELIVERY" and captions | Same words in sentence case: "Build surface: what the product is written in", "Integrations: what it plugs into", "Data and models: what it computes", "Quality and delivery: what keeps it honest" | Your wording |
| 28 part names and notes | Unchanged | Specifics not on the résumé flagged in NEEDS #10 |
| "DETAIL · A–A" / "NO PART SELECTED" / "Hover any tile for its detail" | Panel "Detail A": default "Most used", the top five parts by QTY. Selected state shows the part, note, and "Used in" links. | Default state is useful (audit #7) |
| RUN / FINISH (hex) / ITEM rows | RUN (group), ITEM (number), QTY (derived count) | A hex value isn't information for a reader |
| — | QTY column, derived | Counted from experience tags and descriptions, project stacks and case-study text. Never typed by hand. |

---

## 7. Sheet 05: approval (Contact)

| Current | Proposed | Why |
|---|---|---|
| "§ 04 · CONTACT" / "OPEN CHANNELS · 04 ROUTES" | Title "Contact", title-block row "Sheet 05 · Approval" | |
| "CH 01 · PRIMARY", "CH 02"… | Cut | Not a sequence |
| Email card "Send email" / "Copy address" / "Copied" | "Email me" / "Copy address" / "Copied to clipboard" (plus the announced live region) | Sentence case. The confirmation names the action. |
| — | Form "Submit for approval": Name, Email, Message. Success: "Sent. Approved: I'll reply from searan.kuganesan4@gmail.com." Not configured or error: "Couldn't send from here. Your email app will open with the message filled in." | Brief. States what happens and the fix. |
| Channel cards GitHub "skugane6", LinkedIn "searan-kuganesan", CraftTraq "crafttraq.com" | Unchanged handles, as rows in the approval block | |
| — | DRAWN "S. Kuganesan"; CHECKED: the cat's paw stamp; APPROVED: "You"; STATUS as on the cover | The sign-off (DESIGN.md) |
| Footer "BUILT BY SEARAN KUGANESAN" | Revision block: REV · DATE · DESCRIPTION for the last three commits, the build hash, "Source on GitHub" (github.com/Skugane6/PortfolioV4, public), and "Back to cover". "Designed and built by Searan Kuganesan" stays. | Brief: a real footer |

---

## 8. Navigation and UI strings

| Current | Proposed |
|---|---|
| "01 HOME", "02 EXPERIENCE", "03 PROJECTS", "04 SKILLS", "05 CONTACT" | "01 Cover", "02 Experience", "03 Projects", "04 Skills", "05 Contact" (a nav landmark labelled "Sheet index") |
| — | Skip link: "Skip to content" |
| — | Palette placeholder: "Jump to a sheet or run a command". Empty state: "No matches. Try 'email' or 'résumé'." |
| — | 404: "Sheet not found. This drawing set has five sheets." with "Back to the cover" |
