# What I need from you

Listed in priority order. Everything below has a working placeholder or fallback on the `overhaul/v2` branch, so none of it blocks a preview, but items 1–6 should be settled before this goes to production.

## Decisions and facts (highest priority)

1. **What role you're looking for, and from when.** The site shows "Open to opportunities" with a redline **HOLD: role type and start date** note, because neither the repo nor the résumé says. Set `availability.seeking` and `availability.from` in `src/content/profile.ts` and the HOLD disappears. Example shape: "Full-time software engineering roles, Toronto or remote, from October 2026".
2. **"10 projects shipped".** Kept verbatim as the brief requires. The site shows 4 projects, the résumé lists 3, and your GitHub has 15 public repos. Is 10 the number you want to stand behind? If so, a list (even private) would let the cover link it to proof.
3. **Experience wording differs from your résumé.** I kept the site's wording and changed nothing:
   - Component Tracker: the site says "Led cross-functional requirements gathering…". The résumé says "Engineered full-stack component tracking system…" and mentions D3.js/Chart.js and a RESTful API, which the site omits.
   - Fleet prediction: the site's "10-Year", "CRJ700/900", "retirement, operator-transfer and maintenance-scheduling rules" and "Drove requirements definition" aren't on the résumé. The résumé's "400,000+ monthly records from SQL Server/Oracle … pandas/NumPy ETL" isn't on the site. "50+ operators" is attached to a different bullet on the résumé (ML trend analysis, 6 regional markets).
   - Utilization forecasting: the site says "cut turnaround time by 85%" and tags it "85% faster turnaround". The résumé says "reducing manual processing time by 85%". An 85% time cut is about 6.7× faster, which isn't "85% faster". Which metric and wording is right?
   - Maintenance scheduling: "Designed the Oracle database architecture underneath it" has no antecedent. Suggested: "…underneath the engine…".
   - Résumé bullets not on the site: ML trend analysis with scikit-learn regression (50+ operators, 6 regional markets); pytest/Jest suites at 85% coverage with CI/CD; technical documentation and API specs; mentoring junior interns. Want any of them as callouts? Adding one is one entry in `src/content/experience.ts`, which adds a station and a card.
4. **Employer name.** The text says "Mitsubishi Heavy Industries" (as the résumé does), but the logo is MHI RJ's (MHI RJ Aviation Group, the MHI subsidiary that owns the CRJ programme, with its Toronto office at 6415 Northam Dr, Mississauga). Which entity was your employer of record? One option: "MHI RJ Aviation Group (Mitsubishi Heavy Industries)".
5. **CRJ spec table.** The old block mixed CRJ700 length (32.5 m) with CRJ900 wingspan and height. It's now a two-column table with published figures (CRJ700 32.5 / 23.2 / 7.6 m; CRJ900 36.2 / 24.9 / 7.5 m), with sources in the page notes. The drawing is scaled as a CRJ700. Please confirm, or tell me which variant your work centred on.
6. **Unsourced project numbers, removed from display.** The old project visuals showed Sharpe 1.84, annual return 14.2%, volatility 7.7%, VaR 95 −2.4% (risk dashboard); MLflow run 47, accuracy 94.1%, F1 0.921, precision 0.936, recall 0.908 (text classification); 30 FPS, 9-point calibration, EAR 0.28, latency 18 ms, drift 0.7°, 142 blinks (eye mouse). If any are real results, tell me where they come from and I'll put them back with a source.

## Content that would make the case studies stronger

7. **Problem and outcome for each project.** The detail sheets say what each project is and how it's built (from your résumé), but I didn't invent problems, users or results. One or two sentences each: who it's for, what changed.
8. **Naming and stack differences.** The résumé calls it "Multi-Model Text Classification Pipeline"; the site says "Text Classification Pipeline". The risk dashboard stack lists Vite on the site and Python on the résumé. The Eye Tracking Mouse is on the site but not the résumé. Which should win?
9. **Text Classification Pipeline source.** No public repo is linked. Is there one?
10. **Skill notes not on the résumé.** Stripe "webhooks", Twilio "voice" (the résumé says SMS), Supabase "auth", Google Cloud "Run", Cloudflare "Workers", PostgreSQL "RLS", SQL Server "T-SQL · SSMS", Oracle "PL/SQL", TensorFlow "BERT fine-tuning" (the résumé says BERT *embeddings*), scikit-learn "Ensembles" (the résumé says regression). All kept. Please confirm them. Also, the résumé lists skills the site doesn't: Java, C/C++, Kotlin, C#, SQL, MATLAB, HTML/CSS, Bash, Node, Express, Spring Boot, Django, .NET, MySQL, Selenium, Postman, Jira, Figma, D3.js, Chart.js, and more. Add any?

## Assets

11. **CraftTraq screens.** The showcase uses the two screenshots in `public/` (job board and phone calendar). What would help most: the quote view, an invoice, and the job detail on a phone (PNG, at least 1600 px wide for desktop and 390 × 844 for phone), or a 10–20 second screen recording (MP4, no audio) of a quote turning into a scheduled job. Use the Apex Plumbing demo tenant, not real customer data.
12. **Screenshots for the other three projects**, if you have them: the risk dashboard's frontier chart, an MLflow run page, the eye mouse in use.
13. **`public/crafttraq.png` is still publicly served** (nothing links to it) and shows test jobs named "HELLO", "HELLO 2", "TEST JOB". I didn't delete it (brief: keep your assets). Should it stop being served?

## Keys and settings

14. **Contact form.** Set `RESEND_API_KEY` and `CONTACT_TO` (and optionally `CONTACT_FROM`, a verified Resend sender) in Vercel project settings. Until then, the form opens a prefilled email instead of sending, and says so.
15. **Canonical domain.** I assumed `https://searan.vercel.app` for the canonical URL, sitemap and OG tags. Tell me if there's a custom domain.

## Small things

16. **The cat's name**, if it has one. It's the drawing set's checker.
17. **Phone number.** The résumé lists (647) 854-4416. I didn't put it on the site. Say if you want it there.
18. **GitHub profile bio** still says "fourth-year software engineering student". You graduated 06/2026.
