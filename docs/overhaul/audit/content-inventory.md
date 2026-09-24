# Content inventory: portfolio overhaul audit

Branch `overhaul/v2` @ `410a477`, audited 2026-09-24. Scope: every factual statement the site presents (components, `src/data/*`, `index.html` meta + noscript), the résumé PDF, a résumé ↔ site diff, an aviation fact check, and an asset inventory.

**Rule applied throughout:** nothing here has been changed or resolved. Where the site and a source disagree, both are quoted and the item is flagged for the owner.

Helper scripts (read-only, re-runnable):
- `scripts/audit/content-assets.mjs`: asset sizes, pixel dimensions (sharp) and grep references
- `scripts/audit/content-codestats.mjs`: colour literals, inline styles and comment density (used by `code-content-seo.md`)
- Résumé text was extracted with `pdftotext -enc UTF-8 -layout` (poppler, already on the machine). Nothing was installed into the repo.

---

## 1. Factual statements the site presents

"Visible" means rendered text. "AT only" means screen readers get it but it isn't shown. "Hidden" means `aria-hidden` decoration. "Data only" means the value is in a data file but never rendered.

### 1.1 Identity and positioning

| Category | Exact current text | Source | Notes |
| --- | --- | --- | --- |
| identity | `Searan Kuganesan · Software Engineer` | `index.html:19` (`<title>`) | |
| identity | `SK` (monogram) | `src/components/Hero.tsx:179` | |
| identity | `SEARAN KUGANESAN` | `src/components/Hero.tsx:183` | |
| identity | `SOFTWARE ENGINEER` | `src/components/Hero.tsx:186` | Résumé has no headline title |
| identity | Portrait, alt `Searan Kuganesan` | `src/components/Hero.tsx:231-241` (`src/assets/hero.jpg`) | Graduation-gown headshot |
| identity | `// FULL-STACK & DATA SYSTEMS` | `src/components/Hero.tsx:249` | |
| identity | `I build scalable systems that create real impact.` (h1, four lines) | `src/components/Hero.tsx:29-50, 260-285` | |
| identity | `I design and develop web applications, streamline complex workflows, and turn ideas into reliable, user-focused products.` | `src/components/Hero.tsx:291-292` | |
| identity | `TURNING COMPLEXITY INTO SIMPLE SOLUTIONS →` | `src/components/Hero.tsx:585` | lg+ only |
| identity | `BUILD / SOLVE / IMPROVE / REPEAT` | `src/components/Hero.tsx:536-539` | Hidden, xl+ |
| identity | `Searan Kuganesan builds full-stack systems and data platforms, from a fleet-tracking platform at Mitsubishi Heavy Industries to CraftTraq, a live SaaS product for trade contractors.` | `index.html:22` (meta description) | See CONTENT-07. 181 characters. |
| identity | `<h1>Searan Kuganesan</h1>` / `I build the systems operators run their business on.` | `index.html:32-33` (noscript) | Different tagline from the hero h1 |
| identity | `BUILT BY SEARAN KUGANESAN` | `src/components/Footer.tsx:6` | |

### 1.2 Contact

| Category | Exact current text | Source | Notes |
| --- | --- | --- | --- |
| contact | `searan.kuganesan4@gmail.com` (card text, `Send email` mailto, `Copy address`) | `src/components/Contact.tsx:7, 286-311` | Also `Hero.tsx:98` (icon link) and `index.html:35` (noscript). **3 copies.** |
| contact | `CH 01 · PRIMARY` | `src/components/Contact.tsx:287` | |
| contact | GitHub · `skugane6` · `https://github.com/skugane6` · `CH 02` | `src/components/Contact.tsx:29-35` | Also `Hero.tsx:88`, `index.html:36`. Account login is `Skugane6`. URL resolves (200). |
| contact | LinkedIn · `searan-kuganesan` · `https://linkedin.com/in/searan-kuganesan` · `CH 03` | `src/components/Contact.tsx:36-42` | Also `Hero.tsx:93`, `index.html:37`. Same URL as the résumé. |
| contact | CraftTraq · `crafttraq.com` · `https://crafttraq.com` · `CH 04` | `src/components/Contact.tsx:43-49` | Also `Hero.tsx:82`, `projects.ts:16`, `index.html:38`. Live (200). |
| contact | `§ 04 · CONTACT` / `OPEN CHANNELS · 04 ROUTES` | `src/components/Contact.tsx:258-262` | Route count is derived |
| contact | `DOWNLOAD RÉSUMÉ` → `/skuganesan_resume.pdf` (download) | `src/components/Hero.tsx:320-332` | The only link to the résumé on the site. Not in the noscript fallback. |
| contact | *(phone)*: not on site | n/a | Résumé lists `(647) 854-4416` |

### 1.3 Availability and location

| Category | Exact current text | Source | Notes |
| --- | --- | --- | --- |
| availability | `OPEN TO OPPORTUNITIES` (green dot pill) | `src/components/Hero.tsx:194-207` | sm+ only |
| availability | `OPEN TO WORK · CANADA` | `src/components/Hero.tsx:560` | Below sm only |
| location | `BASED IN CANADA` | `src/components/Hero.tsx:561` | sm+ |
| location | `CYYZ N 43.6777° W 79.6248°` | `src/components/Hero.tsx:566` | Also `BlueprintAnnotations.tsx:41` (datum stamp). **2 copies.** See §5. |
| availability | *(roles sought)*: not stated anywhere on the site or the résumé | n/a | |

### 1.4 Education

| Category | Exact current text | Source | Notes |
| --- | --- | --- | --- |
| education | `Western University` | `src/data/experience.ts:54` | Rendered at `Experience.tsx:1014` |
| education | `B.E.Sc. Software Engineering` | `src/data/experience.ts:55` | Rendered at `Experience.tsx:1014` |
| education | `London, Canada` | `src/data/experience.ts:56` | **Data only**, never rendered |
| education | `06/2026` | `src/data/experience.ts:57` | Rendered at `Experience.tsx:1014` as `B.E.Sc. Software Engineering, Western University · 06/2026` |
| education | Western wordmark + crest image; term `WESTERN UNIVERSITY` | `src/components/Hero.tsx:76-79` | Term is `opacity-0` (AT only) |
| education / hero stat | `2026` / `B.E.SC SOFTWARE ENG` | `src/components/Hero.tsx:81` | Hard-coded; duplicates `education.graduation` |

### 1.5 Hero statistics

| Category | Exact current text | Source | Notes |
| --- | --- | --- | --- |
| hero stat | `10` / `PROJECTS SHIPPED` | `src/components/Hero.tsx:68-71` | Comment: "this figure is Searan's, not derived". Site shows 4 projects, résumé lists 3. Enforced by `Hero.test.tsx:67`. |
| hero stat | Western mark / `WESTERN UNIVERSITY` | `src/components/Hero.tsx:76-79` | |
| hero stat | `2026` / `B.E.SC SOFTWARE ENG` | `src/components/Hero.tsx:81` | |
| hero stat | `LIVE` / `CRAFTTRAQ SAAS` → crafttraq.com | `src/components/Hero.tsx:82` | Verified live 2026-09-24 |
| hero stat | `STA 000 · HOME` | `src/components/Hero.tsx:447` | Decorative station label |

### 1.6 Experience

| Category | Exact current text | Source | Notes |
| --- | --- | --- | --- |
| experience | `Mitsubishi Heavy Industries` | `src/data/experience.ts:5` → `Experience.tsx:1003` | Printed beside the **MHIRJ** logo (`experience.ts:10`, `Experience.tsx:988-996`) |
| experience | `Software Engineering Intern` | `src/data/experience.ts:6` → `Experience.tsx:1005` | |
| experience | `05/2024 – 08/2025 · Mississauga, Canada` | `src/data/experience.ts:7-9` → `Experience.tsx:982` | Fades out as the survey starts (`opacity: calc(1.15 - var(--sp) * 3)`) |
| experience | Card 01 `STA 145 · FWD` · **Component Tracker** · "Led cross-functional requirements gathering with reliability engineers and analysts to deliver a full-stack Component Tracker application (React, Python/Flask) supporting 2,000+ aircraft across 100+ operators." · tags `React`, `Python / Flask`, `2,000+ aircraft` · caption `Component lifecycle visibility` | `src/data/experience.ts:12-20` | |
| experience | Card 02 `STA 410 · WING BOX` · **Aircraft Utilization Forecasting** · "Managed the end-to-end monthly Aircraft Utilization (AU) forecasting and reporting process, partnering with business and customer-facing teams on deliverables that directly shaped business decisions and customer relationships, and automated reporting to cut turnaround time by 85%." · tag `85% faster turnaround` (amber metric) · caption `Data-driven operational efficiency` | `src/data/experience.ts:21-30` | |
| experience | Card 03 `STA 760 · AFT` · **10-Year Fleet Prediction Model** · "Drove requirements definition and stakeholder alignment, translating evolving retirement, operator-transfer, and maintenance-scheduling rules from reliability and business stakeholders into a system spanning CRJ700/900 fleets and 50+ operators." · tags `CRJ700 / 900`, `50+ operators` · caption `Long-term fleet planning` | `src/data/experience.ts:31-39` | |
| experience | Card 04 `STA 940 · EMPENNAGE` · **Maintenance Scheduling Engine** · "Designed the Oracle database architecture underneath it, indexing and query performance tuning included, then built a scheduling optimization engine coordinating maintenance workflows across 2,000+ entities." · tags `Oracle`, `Query tuning`, `2,000+ entities` · caption `Coordinated maintenance workflows` | `src/data/experience.ts:40-48` | "underneath it" has no antecedent |
| experience | `§ 01 · Experience` / `Side elevation · sheet 01` | `src/components/Experience.tsx:935, 937` | Not a heading element |
| experience | Phase readout `Datum` → `Sta 145 · fwd` … → `Survey complete` → `Departing`, plus `NN%` | `src/components/Experience.tsx:369-387, 945` | UI state |
| experience | `↓ scroll to survey` | `src/components/Experience.tsx:1011` | |

### 1.7 Aircraft and aviation details

| Category | Exact current text | Source | Notes |
| --- | --- | --- | --- |
| aviation | `CRJ700 / 900` / `Regional jet` | `src/components/experience/BlueprintAnnotations.tsx:31-32` → `SpecBlock` (244-248) | Hidden; shown only when `showSpec` |
| aviation | `Length 32.5 m` · `Wingspan 24.9 m` · `Height 7.5 m` | `src/components/experience/BlueprintAnnotations.tsx:33-37` | **Mixed variants**, see §5 |
| aviation | `Overall length 32.5 m (106.6 ft)` (dimension line across the airframe) | `src/components/experience/BlueprintAnnotations.tsx:38, 117-121` | See §5 |
| aviation | `CYYZ  N 43.6777°  W 79.6248°` (datum stamp) | `src/components/experience/BlueprintAnnotations.tsx:41, 128-130` | Code comment (39-40): "the field the fleet this work covered flies out of, and the closest airport to the office" |
| aviation | `Nose section STA 0 – 145` · `Main wing STA 410` · `Aft section STA 760+` | `src/components/experience/BlueprintAnnotations.tsx:43-45` | Decorative; not real CRJ fuselage stations (unverified) |
| aviation | `Flight / Direction` ←; `Aviation / Data / Builds / Tomorrow` | `src/components/experience/BlueprintAnnotations.tsx:209-229` | Hidden, `full` detail only |
| aviation | Image alt `CRJ700/900 x-ray side elevation` (`/crj-xray.png`) | `src/components/Experience.tsx:864-870` | Design docs call the original art a "CRJ-900 side elevation" (`docs/superpowers/plans/2026-09-04-blueprint-restyle.md:799`) |
| aviation | `CRJ700/900 fleets`, tag `CRJ700 / 900` | `src/data/experience.ts:35-36` | Not on résumé |
| aviation | Company logo `/MHIRJ_Logo.png` (reads "MHI RJ") | `src/data/experience.ts:10` | See §5 |

### 1.8 Projects

| Category | Exact current text | Source | Notes |
| --- | --- | --- | --- |
| projects | **CraftTraq** · `01 · FEATURED` · `STA 000 · PRODUCTION` · "Multi-tenant SaaS platform for trade contractors. Quotes convert straight into jobs, crews get scheduled against them, and invoicing, time tracking, and payroll sync follow the same record through." · stack `React 19, TypeScript, FastAPI, PostgreSQL, Stripe, Supabase` · `VISIT LIVE SITE` → crafttraq.com · LIVE | `src/data/projects.ts:8-19` | |
| projects | CraftTraq screenshots: alt "CraftTraq's Field Ops Console: a jobs board for Apex Plumbing with Created, In Progress, Complete, and Approved columns…" and "…week calendar for July 27 to August 2…" | `src/components/projects/CraftTraqVisual.tsx:41, 105` | Demo tenant "Apex Plumbing" |
| projects | **Portfolio Risk Dashboard** · `02 · ALSO BUILT` · `STA 145 · ANALYTICS` · "MPT and Value-at-Risk analytics on live market data, with efficient-frontier optimization." · stack `React, Vite, Flask, MongoDB, NumPy, Pandas, SciPy` · `GITHUB REPO` → github.com/Skugane6/Portfolio-Risk-Dashboard | `src/data/projects.ts:20-33` | Repo resolves (200) |
| projects | Risk visual: `EFFICIENT FRONTIER · VaR 95%`, **`Sharpe 1.84`**, **`ANN. RETURN 14.2%`**, **`VOL 7.7%`**, **`VaR 95 -2.4%`** | `src/components/projects/RiskVisual.tsx:7-11, 30, 33` | **Unsourced numbers**, not `aria-hidden` |
| projects | **Text Classification Pipeline** · `03 · ALSO BUILT` · `STA 410 · ML PIPELINE` · "BERT + CNN/BiLSTM ensemble for text classification, with MLflow tracking and data augmentation." · stack `Python, TensorFlow, BERT, scikit-learn, PostgreSQL, MLflow` · no links | `src/data/projects.ts:34-45` | Résumé name: "Multi-Model Text Classification Pipeline". No public repo on the GitHub account. |
| projects | NLP visual: `ENSEMBLE · BERT + CNN/BiLSTM`, **`MLFLOW RUN 47`**, **`ACCURACY 94.1%`**, **`F1 MACRO 0.921`**, **`PRECISION 0.936`**, **`RECALL 0.908`** | `src/components/projects/NlpVisual.tsx:34-39, 54, 65` | **Unsourced numbers**, not `aria-hidden` |
| projects | **Eye Tracking Mouse** · `04 · ALSO BUILT` · `STA 760 · INPUT SYSTEMS` · "Hands-free cursor control from a webcam. Look to move, blink to click." · stack `Python, OpenCV, MediaPipe, PyAutoGUI, NumPy` · `GITHUB REPO` → github.com/Skugane6/eye-mouse | `src/data/projects.ts:46-57` | Not on the résumé. Repo resolves; last push 2023-08-07. |
| projects | Eye visual: **`GAZE POINTER · 30 FPS`**, **`CALIBRATED · 9-PT`**, `CAM 00 · FACE MESH`, **`EAR 0.28 · BLINK → CLICK`**, `WEBCAM → IRIS LANDMARKS → SMOOTHED GAZE → CURSOR + CLICK`, **`LATENCY 18ms`**, **`DRIFT 0.7°`**, **`BLINKS 142`** | `src/components/projects/EyeVisual.tsx:29-40, 73, 85, 194, 242` | **Unsourced numbers**. The footer stats are not `aria-hidden`. |
| projects | Rail `01 · LIVE`, `02 · BUILD`…; panel `FIG. 01`…; `§ 02 · PROJECTS` | `src/components/Projects.tsx:190, 306, 108` | Three numbering labels per project |

### 1.9 Skills (28 tiles, `§ 03 · SKILLS`, `MATERIALS LIST · 28 ITEMS`)

Source `src/data/skills.ts:28-61`; groups `BUILD SURFACE / INTEGRATIONS / DATA & MODELS / QUALITY & DELIVERY` (`skills.ts:12-15`).

| Name · note | Line | Name · note | Line |
| --- | --- | --- | --- |
| React · Hooks · SPA | 28 | pandas · Wrangling | 45 |
| TypeScript · Strict mode | 29 | NumPy · Vectorised math | 46 |
| Python · Primary language | 30 | SciPy · Stats · optimise | 47 |
| FastAPI · Async REST | 31 | scikit-learn · **Ensembles** | 48 |
| Flask · Services | 32 | TensorFlow · **BERT fine-tuning** | 49 |
| Tailwind · Design tokens | 33 | PostgreSQL · Schema · **RLS** | 50 |
| Stripe · Billing · **webhooks** | 36 | SQL Server · **T-SQL · SSMS** | 51 |
| Twilio · SMS · **voice** | 37 | Oracle · **PL/SQL** | 52 |
| QuickBooks · OAuth2 | 38 | MongoDB · Documents | 53 |
| Supabase · Realtime · **auth** | 39 | pytest · Fixtures | 56 |
| AWS · S3 · Lambda · Transcribe | 40 | Jest · Component tests | 57 |
| Google Cloud · **Run** · storage | 41 | CI/CD · Gated deploys | 58 |
| Cloudflare · DNS · **Workers** | 42 | Azure DevOps · Pipelines · boards | 59 |
| | | Docker · Parity / Git · Trunk · review | 60-61 |

Bold marks specifics that the résumé does not state (see D-16).

### 1.10 Section numbering (flagged in §4)

| Where | Text | Source |
| --- | --- | --- |
| Nav rail | `01 HOME`, `02 EXPERIENCE`, `03 PROJECTS`, `04 SKILLS`, `05 CONTACT` | `src/components/NavRail.tsx:12-18` |
| Section labels | `§ 01 · Experience`, `§ 02 · PROJECTS`, `§ 03 · SKILLS`, `§ 04 · CONTACT` | `Experience.tsx:935`, `Projects.tsx:108`, `Skills.tsx:366`, `Contact.tsx:260` |

### 1.11 Decorative text with no factual claim (for completeness)

All `aria-hidden`: the HeroStage panels `DEPLOY Build/Test/Deploy`, `IDEAS / CODE / PRODUCTS / IMPACT`, `REAL-WORLD IMPACT · USERS · SYSTEMS · UPTIME · SPEED · Q1–Q4 · NOW` (bar chart, no numbers), `SCALABLE SOLUTIONS · Web Applications · Automations · Better Workflows · //// BUILT TO SCALE`, `IDE · 470 × 330`, `RUNTIME OK`, `PLANE 02` (`src/components/hero/HeroStage.tsx:214-406`). Also the mock FastAPI editor `app.py` returning `"Build. Solve. Improve."`, `UVICORN 127.0.0.1:8000`, `PY 3.12`, `LN 11 · COL 2` (`src/components/hero/IdeWindow.tsx:24-66, 223-225`). **The snippet ends with a stray `)` on line 11 (`IdeWindow.tsx:65`), so the Python shown would not parse.**

---

## 2. Résumé text (`public/skuganesan_resume.pdf`)

PDF facts: 1 page, 68,095 bytes, Producer "LibreOffice 24.2", Creator "Writer", CreationDate 2026-08-27, Author metadata "Un-named", no Title metadata. Extracted with `pdftotext -enc UTF-8 -layout`. Symbol-font bullets (U+F0B7) are normalised to `•` and blank-line runs are collapsed. Otherwise verbatim.

```text
                              SEARAN KUGANESAN

(647) 854-4416 | searan.kuganesan4@gmail.com | linkedin.com/in/searan-kuganesan | github.com/skugane6 | searan.vercel.app

EDUCATION

Western University                              London, Canada

B.E.Sc. Software Engineering                    Graduated: 06/2026

• Relevant coursework: Machine learning, Databases, Data Structures, Web Development, Algorithm Design and

Analysis, Computer Architecture, Operating Systems, Computational Complexity, Artificial Intelligence

EXPERIENCE

Mitsubishi Heavy Industries                     05/2024 – 08/2025

Software Engineering Intern                     Mississauga, Canada

• Engineered full-stack component tracking system leveraging React.js frontend and Python/Flask RESTful API
    backend serving 2,000+ aircraft across 100+ operators with interactive D3.js/Chart.js data visualizations

• Engineered fleet prediction platform processing 400,000+ monthly records from SQL Server/Oracle databases
    using pandas/NumPy ETL pipelines with automated exception handling and validation

• Implemented machine learning trend analysis with scikit-learn regression models for utilization forecasting
    across 50+ operators and 6 regional markets with statistical validation

• Generated automated monthly aircraft utilization forecasts and reliability reports through Python data processing
    pipelines with scheduled task automation, reducing manual processing time by 85%

• Designed Oracle database architecture with optimized indexing and query performance tuning and built
    scheduling optimization engine coordinating maintenance workflows across 2,000+ entities

• Developed comprehensive unit and integration test suites using pytest and Jest, achieving 85% code coverage
    and implementing CI/CD pipelines with automated testing to ensure reliability across production deployments

• Created comprehensive technical documentation and API specifications, and mentored junior interns
PROJECTS

CraftTraq – Multi-Tenant SaaS Platform for Trade Contractors | crafttraq.com | React 19, TypeScript,
FastAPI, PostgreSQL

    • Built end-to-end job lifecycle management, from shareable client quotes that auto-convert into jobs to drag-
         and-drop crew scheduling and status-tracked job records, live in production with tiered Stripe billing

    • Engineered scheduling with immutable task-assignment snapshots reconciled against live crew membership
    • Built invoicing, time tracking, and inventory management across 28+ tables with a PDF generation pipeline
    • Integrated Stripe, QuickBooks OAuth2 payroll sync, Twilio SMS, and Supabase Realtime for live job-status

         updates across the Progressive Web App
Portfolio Risk Dashboard | React, Python, Flask, MongoDB, NumPy, Pandas, SciPy

    • Built full-stack financial analytics application using React/Vite and Flask for comprehensive Modern Portfolio
         Theory analysis and Value at Risk calculations with interactive dashboards

    • Engineered Python backend with yfinance API integration and NumPy/Pandas/SciPy libraries for real-time
         market data visualization using recharts with data processing

    • Implemented statistical portfolio optimization algorithms for efficient frontier analysis and risk metrics
Multi-Model Text Classification Pipeline | Python, TensorFlow, BERT, scikit-learn, PostgreSQL, MLflow

    • Built ensemble system combining BERT embeddings with CNN and BiLSTM architectures for categorization
    • Designed experiment tracking with MLflow logging model configurations and hyperparameter combinations
    • Created data augmentation pipeline using back-translation and synonym replacement to expand training set

TECHNICAL SKILLS

Languages: Python, Java, C/C++, Kotlin, C#, TypeScript, SQL, MATLAB, HTML/CSS, Bash
Frameworks: React, Node, Express, Spring Boot, Django, .NET, Flask, FastAPI, Vite, Tailwind CSS
Technologies/Tools: Git, Docker, MySQL, MongoDB, PostgreSQL, Supabase, AWS (S3, Lambda, Transcribe), Google
Cloud Platform, Cloudflare, Stripe, Twilio, Selenium, Postman, Jira, Articulate Storyline, Excel, Figma
Production & Infrastructure: CI/CD, Unit-testing, Stress/Exhaustion Testing, Regression Testing, Git, Azure DevOps
```

---

## 3. Résumé ↔ site discrepancies

"Match" rows are listed too, so it's clear what was checked.

| # | Topic | Résumé says | Site says | Status |
| --- | --- | --- | --- | --- |
| D-01 | Name, email, LinkedIn, GitHub | as above | same values | **Match** |
| D-02 | Portfolio URL | `searan.vercel.app` | Production is `https://searan.vercel.app` | **Match** |
| D-03 | Phone | `(647) 854-4416` | not shown | Résumé only (may be intentional) |
| D-04 | Employer | `Mitsubishi Heavy Industries` | `Mitsubishi Heavy Industries` in text, **MHIRJ** logo beside it | Text matches. Logo names a different entity (see §5.3). |
| D-05 | Title and dates | `Software Engineering Intern`, `05/2024 – 08/2025`, `Mississauga, Canada` | same | **Match** |
| D-06 | Education | `Western University`, `London, Canada`, `B.E.Sc. Software Engineering`, `Graduated: 06/2026`, relevant coursework | School, program and `06/2026` shown. `London, Canada` is data only. No "Graduated". No coursework. | Partial |
| D-07 | Component tracker | "**Engineered** full-stack component tracking system leveraging React.js frontend and Python/Flask **RESTful API** backend serving 2,000+ aircraft across 100+ operators with interactive **D3.js/Chart.js** data visualizations" | "**Led cross-functional requirements gathering with reliability engineers and analysts** to deliver a full-stack Component Tracker application (React, Python/Flask) supporting 2,000+ aircraft across 100+ operators." | Numbers match. **Leadership/requirements framing isn't on the résumé.** D3.js/Chart.js and REST API are dropped. |
| D-08 | Fleet prediction | "Engineered fleet prediction platform processing **400,000+ monthly records** from **SQL Server/Oracle** databases using **pandas/NumPy ETL pipelines** with automated exception handling and validation" | "**10-Year** Fleet Prediction Model: **Drove requirements definition and stakeholder alignment**, translating evolving **retirement, operator-transfer, and maintenance-scheduling rules** … into a system spanning **CRJ700/900 fleets** and **50+ operators**." | **Mismatch.** "10-year", CRJ700/900, the rule types and "drove requirements" are not on the résumé. The résumé ties "50+ operators" to a different bullet (D-09). The 400k-record ETL is missing from the site. |
| D-09 | ML trend analysis | "Implemented machine learning trend analysis with **scikit-learn regression models** for utilization forecasting across **50+ operators and 6 regional markets** with statistical validation" | Not on the site. "50+ operators" was moved to the fleet model card. "scikit-learn · Ensembles" appears in Skills. | **Missing / reattributed** |
| D-10 | Utilization reporting | "Generated automated monthly aircraft utilization forecasts **and reliability reports** … reducing **manual processing time by 85%**" | "**Managed the end-to-end** monthly Aircraft Utilization (AU) forecasting and reporting process, **partnering with business and customer-facing teams** on deliverables that **directly shaped business decisions and customer relationships**, and automated reporting to cut **turnaround time by 85%**." Tag: "**85% faster turnaround**" | **Mismatch.** The metric measures a different thing (manual processing time vs turnaround). "85% faster" isn't the same as an 85% reduction. The management and partnership claims aren't on the résumé. |
| D-11 | Oracle / scheduling engine | "Designed Oracle database architecture with optimized indexing and query performance tuning and built scheduling optimization engine coordinating maintenance workflows across 2,000+ entities" | Same content ("…underneath it…") | **Match** (wording issue only) |
| D-12 | Testing | "unit and integration test suites using pytest and Jest, achieving **85% code coverage** and implementing **CI/CD pipelines**" | Only Skills tiles (pytest, Jest, CI/CD). Coverage figure absent. | **Missing** |
| D-13 | Docs and mentoring | "Created comprehensive technical documentation and API specifications, and **mentored junior interns**" | absent | **Missing** |
| D-14 | CraftTraq | Stack `React 19, TypeScript, FastAPI, PostgreSQL`. Bullets: shareable quotes auto-convert to jobs, drag-and-drop crew scheduling, status-tracked records, "live in production with **tiered Stripe billing**", "**immutable task-assignment snapshots** reconciled against live crew membership", "invoicing, time tracking, and **inventory management across 28+ tables** with a **PDF generation pipeline**", "Stripe, **QuickBooks OAuth2 payroll sync, Twilio SMS, and Supabase Realtime** … across the **Progressive Web App**" | Stack adds `Stripe, Supabase`. Tagline covers quotes→jobs, crew scheduling, invoicing, time tracking, payroll sync. | Consistent but thin. Most specifics are **missing** (bold). |
| D-15 | Portfolio Risk Dashboard | Stack `React, Python, Flask, MongoDB, NumPy, Pandas, SciPy`. React/Vite + Flask, MPT + VaR, **yfinance**, **recharts**, efficient frontier. | Stack `React, **Vite**, Flask, …` (drops **Python**). Visual prints `Sharpe 1.84`, `ANN. RETURN 14.2%`, `VOL 7.7%`, `VaR 95 -2.4%`. | Stack differs slightly. **The visual's numbers are not on the résumé.** |
| D-16 | Text classification | Name "**Multi-Model** Text Classification Pipeline". "BERT **embeddings** with CNN and BiLSTM", MLflow configs/hyperparameters, **back-translation and synonym replacement**. | Name "Text Classification Pipeline". Visual prints `ACCURACY 94.1%`, `F1 MACRO 0.921`, `PRECISION 0.936`, `RECALL 0.908`, `MLFLOW RUN 47`. Skills note "TensorFlow · BERT **fine-tuning**". | Name shortened. **Metrics not on the résumé.** "Fine-tuning" vs "embeddings" differ. |
| D-17 | Eye Tracking Mouse | absent | Full project card and GitHub link. Visual prints `30 FPS`, `9-PT`, `LATENCY 18ms`, `DRIFT 0.7°`, `BLINKS 142`, `EAR 0.28`. | Site only. Metrics unsourced. |
| D-18 | Project count | 3 projects | 4 projects shown. Hero says `10 PROJECTS SHIPPED`. | **Unverifiable** |
| D-19 | Skills on the résumé but not the site | Languages: **Java, C/C++, Kotlin, C#, SQL, MATLAB, HTML/CSS, Bash**. Frameworks: **Node, Express, Spring Boot, Django, .NET, Vite**. Tools: **MySQL, Selenium, Postman, Jira, Articulate Storyline, Excel, Figma**. Infra: **Unit-testing, Stress/Exhaustion Testing, Regression Testing**. From bullets: **D3.js, Chart.js, yfinance, recharts**. (MLflow and BERT appear only in a project stack.) | none of these are Skills tiles | Missing |
| D-20 | Skill specifics on the site but not the résumé | n/a | Stripe "webhooks", Twilio "voice" (résumé: Twilio **SMS**), Supabase "auth", Google Cloud "Run", Cloudflare "Workers", PostgreSQL "RLS", SQL Server "T-SQL · SSMS", Oracle "PL/SQL", TensorFlow "BERT fine-tuning", scikit-learn "Ensembles" (résumé: **regression**) | Owner to confirm |
| D-21 | Roles sought / availability | **Nothing** (no objective, no availability, no role type) | `OPEN TO OPPORTUNITIES`, `OPEN TO WORK · CANADA`, `BASED IN CANADA`. No role type stated. | Site only |
| D-22 | Meta description | "component tracking system", "fleet prediction platform" | "a **fleet-tracking platform** at Mitsubishi Heavy Industries" | **Mismatch.** No such single item exists. |

### 3.1 Résumé facts not yet on the site (verbatim quotes)

- "(647) 854-4416"
- "Graduated: 06/2026"
- "Relevant coursework: Machine learning, Databases, Data Structures, Web Development, Algorithm Design and Analysis, Computer Architecture, Operating Systems, Computational Complexity, Artificial Intelligence"
- "interactive D3.js/Chart.js data visualizations" and "Python/Flask RESTful API backend"
- "fleet prediction platform processing 400,000+ monthly records from SQL Server/Oracle databases using pandas/NumPy ETL pipelines with automated exception handling and validation"
- "machine learning trend analysis with scikit-learn regression models for utilization forecasting across 50+ operators and 6 regional markets with statistical validation"
- "automated monthly aircraft utilization forecasts and reliability reports … reducing manual processing time by 85%"
- "unit and integration test suites using pytest and Jest, achieving 85% code coverage and implementing CI/CD pipelines with automated testing"
- "Created comprehensive technical documentation and API specifications, and mentored junior interns"
- CraftTraq: "live in production with tiered Stripe billing"; "immutable task-assignment snapshots reconciled against live crew membership"; "invoicing, time tracking, and inventory management across 28+ tables with a PDF generation pipeline"; "QuickBooks OAuth2 payroll sync, Twilio SMS, and Supabase Realtime for live job-status updates across the Progressive Web App"; "drag-and-drop crew scheduling"
- Risk dashboard: "yfinance API integration", "market data visualization using recharts"
- Text classification: "Multi-Model", "back-translation and synonym replacement", "MLflow logging model configurations and hyperparameter combinations"
- Skills: "Java, C/C++, Kotlin, C#, … SQL, MATLAB, HTML/CSS, Bash"; "Node, Express, Spring Boot, Django, .NET, … Vite"; "MySQL, … Selenium, Postman, Jira, Articulate Storyline, Excel, Figma"; "Unit-testing, Stress/Exhaustion Testing, Regression Testing"

---

## 4. Inconsistencies within the site (flagged, not resolved)

| # | Inconsistency | Evidence |
| --- | --- | --- |
| I-01 | Hero `10 PROJECTS SHIPPED` vs 4 projects shown (3 on the résumé, 15 public GitHub repos, several of them coursework or old portfolios) | `Hero.tsx:71`; `projects.ts`; GitHub API `public_repos: 15` |
| I-02 | Nav numbering `01 HOME … 05 CONTACT` vs section labels `§ 01 · Experience … § 04 · CONTACT`. Both are on screen together: the rail shows `• 02 EXPERIENCE` next to the HUD's `§ 01 · Experience`. | `NavRail.tsx:13-17`; `Experience.tsx:935`; `Projects.tsx:108`; `Skills.tsx:366`; `Contact.tsx:260`; screenshot `docs/overhaul/screenshots/before/1440/exp-075-settled.png` |
| I-03 | Experience card order vs placement. Cards are numbered 01–04 fore-to-aft (STA 145 → 940), but the wide layout puts them at 01 top-left, **04 top-right**, 02 bottom-left, 03 bottom-right. Reading left-to-right, top-to-bottom gives 01, 04, 02, 03. | `Experience.tsx:148-160, 215-239`; screenshot as above |
| I-04 | Station numbers are reused with different meanings. STA 000 = hero "HOME" and CraftTraq "PRODUCTION". STA 145 = Component Tracker "FWD" and Risk Dashboard "ANALYTICS". STA 410 = AU forecasting "WING BOX" and Text Classification "ML PIPELINE". STA 760 = Fleet model "AFT" and Eye Mouse "INPUT SYSTEMS". The sheet note "Nose section STA 0 – 145" ends the nose at the station card 01 calls "FWD". None are real CRJ station numbers. | `experience.ts:13,22,32,41`; `projects.ts:11,23,37,49`; `Hero.tsx:447`; `BlueprintAnnotations.tsx:43-45` |
| I-05 | Employer text `Mitsubishi Heavy Industries` printed next to the **MHIRJ** logo | `experience.ts:5,10`; `Experience.tsx:988-1003` |
| I-06 | Aircraft spec mixes variants under one heading: CRJ700 length with CRJ900 wingspan and height | `BlueprintAnnotations.tsx:31-38`, §5.1 |
| I-07 | Five different positioning lines: h1 "I build scalable systems that create real impact.", eyebrow "FULL-STACK & DATA SYSTEMS", meta "builds full-stack systems and data platforms…", noscript "I build the systems operators run their business on.", footer "TURNING COMPLEXITY INTO SIMPLE SOLUTIONS" | `Hero.tsx:29-50, 249, 585`; `index.html:22, 33` |
| I-08 | Three numbering schemes per project: rail `01 · LIVE`/`02 · BUILD`, panel tag `01 · FEATURED`/`02 · ALSO BUILT`, figure `FIG. 01` | `Projects.tsx:190, 306`; `projects.ts:10,22,36,48` |
| I-09 | `85% faster turnaround` (tag) vs "cut turnaround time by 85%" (same card) vs résumé "reducing manual processing time by 85%". An 85% time cut is about 6.7× faster, not "85% faster". | `experience.ts:25-26` |
| I-10 | "Designed the Oracle database architecture **underneath it**" has no antecedent on a standalone card | `experience.ts:44` |
| I-11 | The dates line (`05/2024 – 08/2025 · Mississauga, Canada`) fades out as soon as the survey starts, so the role has no dates on screen while its achievements are | `Experience.tsx:979-983` |
| I-12 | GitHub URL casing: `github.com/skugane6` (Hero, Contact, noscript) vs `github.com/Skugane6/…` (projects). All resolve (200). Cosmetic only. | `Hero.tsx:88`; `Contact.tsx:33`; `projects.ts:29,53` |
| I-13 | The mock IDE code ends with a stray `)` (line 11), which is invalid Python on a software engineer's hero | `IdeWindow.tsx:64-65`; visible in `before/1440/00-hero.png` |
| I-14 | Graduation year is hard-coded twice (`Hero.tsx:81` "2026" and `experience.ts:57` "06/2026"). Consistent today, but they can drift. | as cited |
| I-15 | Hero coordinates plus "BASED IN CANADA" imply a Toronto-Pearson location. The résumé states no current city. External: the GitHub profile says "Toronto, Canada" and its bio still reads "fourth-year software engineering student", which is stale against "Graduated: 06/2026". | `Hero.tsx:561-566`; `api.github.com/users/skugane6` |
| I-16 | Numeric "results" in the project visuals (§1.8) have no source, and they read to screen readers as data | `RiskVisual.tsx`, `NlpVisual.tsx`, `EyeVisual.tsx` |
| I-17 | Screenshot hygiene. The live calendar screenshot shows overnight task blocks ("4am–8am", "8:30pm–12am", "12am–4am"). The unreferenced `/crafttraq.png` (still publicly served) shows test jobs "HELLO", "HELLO 2", "TEST JOB". | `public/crafttraq-calendar.png`; `public/crafttraq.png` |

---

## 5. Aviation fact check

### 5.1 CRJ700 / CRJ900 dimensions

| Site value (heading "CRJ700 / 900") | CRJ700 (published) | CRJ900 (published) | Verdict |
| --- | --- | --- | --- |
| Length **32.5 m** (overall-length dimension: "32.5 m (106.6 ft)") | **32.51 m / 106 ft 8 in** (SkyWest CRJ700 fact sheet). **32.3 m / 106 ft 1 in** (Wikipedia, citing Bombardier's airport planning manual). | **36.2 m / 118 ft 11 in** | Right for the **CRJ700** only, and 3.7 m short for a CRJ900. The feet figure is truncated: 32.5 m = 106.63 ft and 106 ft 8 in = 106.67 ft, so it rounds to **106.7**. |
| Wingspan **24.9 m** | **23.2 m / 76 ft 3 in** | **24.9 m / 81 ft 7 in** | Right for the **CRJ900** only. 1.7 m too wide for a CRJ700. |
| Height **7.5 m** | **7.57–7.6 m / 24 ft 10 in** | **7.5 m / 24 ft 7 in** | Exact for the CRJ900. About 0.1 m low for the CRJ700 (approximate). |
| "Regional jet" | yes | yes | Accurate |

**Conclusion:** no single aircraft has the set shown. It pairs CRJ700 length with CRJ900 wingspan and height. The owner should choose: (a) one variant (CRJ700: 32.5 / 23.2 / 7.6 m; CRJ900: 36.2 / 24.9 / 7.5 m), or (b) two columns. The "Overall length" dimension line spans the drawing itself. The original art was described as a CRJ-900 (`docs/superpowers/specs/2026-09-04-blueprint-restyle-design.md:62, 93`), so if the drawing is a 900, "32.5 m" mislabels it. The current PNG (`public/crj-xray.png`, one over-wing exit and about 20 cabin windows) can't be pinned to a variant by eye.

Sources:
- SkyWest, *Fact Sheet for CRJ700*: 106 ft 8 in (32.51 m), 76 ft 3 in (23.20 m), 24 ft 10 in (7.57 m). https://files-skywest-com.s3.us-west-2.amazonaws.com/public/Uploads/Documents/Operations/FactSheet-CRJ700-UA2.pdf
- Wikipedia, *Bombardier CRJ* (spec table): CRJ700 106 ft 1 in (32.3 m), 76 ft 3 in (23.2 m), 24 ft 10 in (7.6 m); CRJ900 118 ft 11 in (36.2 m), 81 ft 7 in (24.9 m), 24 ft 7 in (7.5 m). https://en.wikipedia.org/wiki/Bombardier_CRJ
- Wikipedia, *Bombardier CRJ700 series*: CRJ900 height 7.5 m (24 ft 7 in). https://en.wikipedia.org/wiki/Bombardier_CRJ700_series
- FlyRadius, *Bombardier CRJ900 specifications*: 118 ft 11 in / 36.2 m, 81 ft 7 in / 24.9 m, 24 ft 7 in / 7.5 m. https://www.flyradius.com/bombardier-crj900/specifications
- MHIRJ CRJ900 factsheet (Scribd mirror, same figures per search result): https://www.scribd.com/document/648395986/MHIRJ-CRJ900-Factsheet-En-V1-web

### 5.2 Toronto Pearson, CYYZ, `N 43.6777° W 79.6248°`

- **ICAO code:** CYYZ is correct for Toronto Pearson International Airport. The airport is "primarily located in Mississauga, Ontario", which is consistent with the role location.
- **Published airport reference point (ARP):** 43°40′34″N 079°37′50″W = **43.67611°N, 79.63056°W** (Wikipedia). SkyVector gives N43°40.57′ W79°37.83′ and OpenAIP gives 43°40′37.2″N 79°37′51.6″W.
- **Site point:** 43.6777, −79.6248 is a widely used "place" coordinate for the airport (search engines map it to 6301 Silver Dart Dr, the terminal area). It is about **0.49–0.51 km** east-northeast of the published ARP (haversine, computed locally). It lands on the airfield but isn't the ARP.
- **Verdict:** approximate but defensible as a location flourish. It is not the official reference point. If it should read as survey-grade, use the ARP. The code-comment rationale (`BlueprintAnnotations.tsx:39-40`: "the field the fleet this work covered flies out of") can't be verified: the tracker covers "2,000+ aircraft across 100+ operators". "Closest airport to the office" is plausible, because MHIRJ's Toronto office (6415 Northam Dr, Mississauga) is beside Pearson.

Sources: https://en.wikipedia.org/wiki/Toronto_Pearson_International_Airport · https://skyvector.com/airport/CYYZ/Toronto-Lester-B-Pearson-International-Airport · https://www.openaip.net/data/airports/62614731ed4452e4a0781f0b

### 5.3 "MHI RJ" (logo) vs "Mitsubishi Heavy Industries" (printed)

- `public/MHIRJ_Logo.png` reads **"MHI RJ"**, the mark of **MHI RJ Aviation Group (MHIRJ)**. MHIRJ was created on **1 June 2020**, when Mitsubishi Heavy Industries, Ltd. closed its acquisition of the CRJ Series Program from Bombardier. The MHI press release gives the short form "MHIRJ" and "Headquartered in Montréal, Canada". MHI's North America network page lists "MHI RJ Aviation ULC HQ, 3655 Avenue des Grandes Tourelles, Suite 110, Boisbriand, Quebec" and "**MHI RJ Aviation ULC Toronto office, 6415 Northam Drive, Mississauga, Ontario**".
- The same page lists a *different* MHI subsidiary in Mississauga: **MHI Canada Aerospace, Inc. (MHICA)**, 6390 Northwest Drive.
- **Verdict:** both names are real. "Mitsubishi Heavy Industries" is the **parent company**. "MHI RJ" is the **subsidiary** whose logo the site shows, and whose Mississauga office matches the stated role location. The résumé also prints the parent name. It isn't wrong, but text and logo disagree, and two MHI entities exist in Mississauga. **The owner should confirm the legal employer (for example, the entity on the offer letter) and pick one presentation**, e.g. "MHI RJ Aviation Group (Mitsubishi Heavy Industries)". Nothing was changed.

Sources: https://www.mhi.com/news/mhi-rj-aviation-groupmhi-rj-aviation-group-launches-mitsubishi-heavy-industries-ltd.html · https://www.mhi.com/network/area/north_america.html · https://en.wikipedia.org/wiki/Bombardier_CRJ700_series (ownership: "MHI RJ Aviation Group, a Montreal-based company"; deal closed 1 June 2020). mhirj.com returned HTTP 403 to automated fetch.

### 5.4 Other aviation labels

- The fuselage stations (`STA 0 – 145`, `STA 410`, `STA 760+`, `STA 940 · EMPENNAGE`) are **decorative**. They were not checked against CRJ structural station data and shouldn't be presented as real stations.
- The CRJ700 and CRJ900 are both CRJ700-series regional jets. "CRJ700 / 900" as a family label is accurate.

---

## 6. Asset inventory

Output of `node scripts/audit/content-assets.mjs`, plus what each asset depicts (each image was viewed) and production status. **Keep** marks the categories the owner said must be kept: résumé, headshot, logos, screenshots.

| File | Bytes | Pixels | Depicts | Referenced from | Prod | Keep? |
| --- | ---: | --- | --- | --- | --- | --- |
| `src/assets/hero.jpg` | 30,672 | 400×400 JPEG | Headshot: owner in graduation gown with orange/purple hood, blue studio backdrop | `Hero.tsx:1` (bundled as `/assets/hero-*.jpg`) | bundled | **Keep (headshot)** |
| `public/skuganesan_resume.pdf` | 68,095 | 1-page PDF | Résumé (§2) | `Hero.tsx:321`; `Hero.test.tsx:37` | 200 | **Keep (résumé)** |
| `public/MHIRJ_Logo.png` | 4,395 | 613×270 RGBA | "MHI RJ" logo, navy + grey on transparent | `experience.ts:10` (CSS-inverted to white at `Experience.tsx:995`) | 200 | **Keep (logo)** |
| `public/western-mark.png` | 25,503 | 1025×243 RGBA | Western "Western + crest" lockup, white on transparent (generated from `Western2.png`) | `Hero.tsx:77`; `Hero.test.tsx:49`; `scripts/generate-western-mark.mjs:19` | 200 | **Keep (logo)** |
| `public/Western2.png` | 68,567 | 1200×632 RGBA | Western horizontal lockup, white on purple plate | `scripts/generate-western-mark.mjs:18` only (source asset) | 200 (unreferenced by the page) | **Keep (logo, source)**. Could move out of `public/`. |
| `public/Western.png` | 33,439 | 160×170 RGBA | Western stacked crest + wordmark, purple on transparent | **none** | 200 | **Keep (logo)**. Unused. |
| `public/mini_logo.png` | 96,164 | 512×512 RGBA | CraftTraq clipboard "T" mark, orange outline | `scripts/generate-skill-icons.mjs:78` only (source for the Contact CraftTraq mark) | 200 (unreferenced by the page) | **Keep (logo, source)**. 96 KB for a 512 px icon. |
| `public/crafttraq-board.png` | 202,252 | 1902×938 RGBA | CraftTraq "Field Ops Console" job board, Apex Plumbing demo tenant, 19 jobs | `CraftTraqVisual.tsx:40`; `Projects.test.tsx:73`; `generate-webp.mjs:10` | 200 | **Keep (screenshot)** |
| `public/crafttraq-board.webp` | 87,024 | 1902×938 | WebP of the above | `CraftTraqVisual.tsx:38` | 200 | **Keep (screenshot)** |
| `public/crafttraq-calendar.png` | 76,354 | 375×835 RGBA | CraftTraq mobile week calendar, Jul 27 – Aug 2 2026 | `CraftTraqVisual.tsx:104`; `Projects.test.tsx:74`; `generate-webp.mjs:10` | 200 | **Keep (screenshot)** |
| `public/crafttraq-calendar.webp` | 26,720 | 375×835 | WebP of the above | `CraftTraqVisual.tsx:102` | 200 | **Keep (screenshot)** |
| `public/crafttraq.png` | 195,610 | 1898×935 RGBA | **Older** job-board screenshot with test cards "HELLO", "HELLO 2", "TEST JOB", 23 jobs | `generate-webp.mjs:10` only | 200 | **Keep (screenshot)**, but it is unreferenced and publicly served. Owner to decide. |
| `public/crafttraq.webp` | 84,542 | 1898×935 | WebP of the above | **none** | 200 | Keep (screenshot). Unused. |
| `public/crj-xray.png` | 947,631 | 2108×424 RGBA | Blue "x-ray" side elevation of a CRJ-family jet, nose left | `Experience.tsx:866` | 200 | Not in a keep category. It is the Experience centrepiece and the largest asset. |
| `public/placeholder-eye.svg` | 904 | 400×240 | Teal eye outline, "PREVIEW · SCREENSHOT SOON" | **none** | 200 | Unused placeholder (not a keep category) |
| `public/placeholder-risk.svg` | 1,099 | 400×240 | Teal line chart, "PREVIEW · SCREENSHOT SOON" | **none** | 200 | Unused placeholder |
| `public/placeholder-text.svg` | 1,270 | 400×240 | Teal node graph, "PREVIEW · SCREENSHOT SOON" | **none** | 200 | Unused placeholder |
| `public/robots.txt` | 25 | n/a | `User-agent: * / Allow: /` (no `Sitemap:` line) | served at root | 200 | n/a |

Also tracked outside `public/`: `check.png` (repo root, 723,637 bytes). It's an old hero screenshot (pre-portrait layout, "OPERATOR" photo panel) and nothing references it.

Missing assets for shareability (all 404 in production): `/favicon.ico`, `/favicon.svg`, `/apple-touch-icon.png`, `/site.webmanifest`, `/manifest.json`, `/og.png`, `/og-image.png`, `/sitemap.xml`. See `code-content-seo.md` SEO-01…SEO-06.
