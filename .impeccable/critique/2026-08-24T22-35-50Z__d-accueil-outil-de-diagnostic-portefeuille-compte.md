---
target: site complet (accueil, outil de diagnostic, portefeuille, compte)
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-08-24T22-35-50Z
slug: d-accueil-outil-de-diagnostic-portefeuille-compte
---
Method: dual-agent (A: ac9c5791203ccff75 · B: a51e1547f81fdf156)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3.5/4 | Live-recalculating gauge, "17/17 renseignés," roadmap progress bar are excellent; tabs carry no URL state |
| 2 | Match System / Real World | 4/4 | Correct finance/governance vocabulary (VAN, ETP, RACI) throughout |
| 3 | User Control and Freedom | 2/4 | Tool tabs are pure client state — no back/forward, no deep link, refresh loses position |
| 4 | Consistency and Standards | 2.5/4 | Instrument components are consistent, but gold-as-decoration violates the system's own written rule; Feuille de route tab lacks the header pattern the other 4 tabs share |
| 5 | Error Prevention | 3.5/4 | Context-driven score caps ("jamais à la hausse") are a genuinely strong, deliberate mechanism |
| 6 | Recognition Rather Than Recall | 3/4 | Sticky gauge is a strong aid; undercut by a redundant lever-score table and tab-switch scroll loss |
| 7 | Flexibility and Efficiency | 3.5/4 (Operate only; n/a marketing) | Weight-profile save/reuse, CSV import/export, share links present; no starter weight-profile template |
| 8 | Aesthetic and Minimalist Design | 2/4 | Detector confirms 38–59 findings per page (nested cards, tiny text, contrast) plus a confirmed mobile horizontal-overflow break on the tool's densest tab |
| 9 | Error Recovery | 3/4 | Inline help bubbles and coral error banners are semantically correct; not stress-tested against live validation |
| 10 | Help and Documentation | 3.5/4 (Operate only; n/a marketing) | Real, populated Aide/FAQ with a genuine contact email; in-context field help throughout |
| **Total** | | **30/40** | **Good** (elevated by strong Operate-side systems; would drop into Acceptable if the mobile break and the contrast failures below aren't fixed) |

## Design Specificity Verdict

**LLM assessment (Assessment A):** CADRAN is unmistakably authored for its own "precision instrument" concept in its best moments — the sticky semi-circular gauge that stays visible through all 30 Likert statements, the ×2.0/×1.5 weight badges per statement, and the mono-numeral methodology section on the homepage make the metaphor concrete, not decorative. But the marketing surface undercuts its own thesis: DESIGN.md explicitly bans a "halo « premium consumer » beige+laiton" — and that exact pattern (a gold radial-gradient blob behind the hero and CTA, plus a gold dash on every section eyebrow) is present on the two highest-visibility marketing moments, ten times over. The product is most specific exactly where it matters (the diagnostic instrument) and most generic exactly where its own design system was most explicit about what to avoid.

**Deterministic scan (Assessment B):** The static CLI scan (`detect.mjs` against 76 source files) found only 2 hits, both minor and in `globals.css` (a stray 3px border-radius, a stray rgba black not in the documented palette) — source-level token discipline is otherwise clean. Nearly all real signal came from the live-DOM detector pass instead, which measures actual rendered output: 38 findings on the homepage, 15 on the portfolio, 59 on the diagnostic tool's Aptitude tab, 28 on ROI, 31 on account settings — dominated by `low-contrast`, `nested-cards`, `tiny-text`/`undersized-ui-text`, and `line-length`. Two `text-occlusion` findings per page are **false positives**: the "occluded text" is the detector's own diagnostic-label text overlapping itself, not real page content — disregard those specifically.

## Overall Impression

CADRAN's core idea is genuinely well executed where it counts most: the diagnostic tool itself reads as a calibrated instrument, not a form. What's holding the score back are two things that are both fixable in isolation and both undercut the "rigorous, defensible, trustworthy" positioning the product needs for its finance/governance audience — a decorative use of the brand's reserved "paid-tier" gold color that directly contradicts the written design system, and a set of contrast failures (plus one confirmed mobile-breaking layout bug) that are exactly the kind of "we said we'd get this right" details a skeptical CFO or governance reviewer would notice. Neither requires new design thinking — both are enforcement gaps against a design system that already knows the right answer.

## What's Working

1. **Sticky gauge + one-lever-at-a-time accordion on the Aptitude tab** (`Diagnostic.tsx`) — the right-rail gauge stays visible while the left column reveals one lever's ≤5 statements at a time, with weight badges per statement. This is progressive disclosure done right on the product's densest surface, and it directly embodies PRODUCT.md's "transparence des hypothèses" principle instead of just claiming it.
2. **Methodology section on the homepage** (`Methodology.tsx`) — mono percentages, terracotta progress bars, four numbered rationale cards make "no black box" concrete on a marketing page. Rare, and it earns real credibility with the intended decision-maker audience.
3. **Context-driven score caps that only ever correct downward** — confirmed both in the product model (PRODUCT.md) and observed in the UI; a genuinely rare, deliberate error-prevention mechanism baked into the scoring itself, not just the interface.

Both assessments independently landed on the sticky-gauge/accordion pattern as the standout — strong agreement.

## Priority Issues

**[P0] Diagnostic tool breaks on mobile — confirmed 410px horizontal overflow**
*Why it matters:* On a 390px viewport, the Contexte tab's page scrolls ~410px horizontally (`scrollWidth: 801px` vs. `viewport: 390px`, confirmed via `getBoundingClientRect`/`scrollWidth` and screenshot). Two causes stack: the in-tool tab nav renders full-text buttons that span to x≈549, and the Activités step table uses a fixed CSS grid (`1.4fr 1fr 1fr 70px 1.2fr auto`) that never collapses, pushing input labels (e.g. "Approbation selon le se…") off-screen and truncated across all 5 activity rows. This is the product's core task, on the device class a time-pressed consultant is most likely to check it on between meetings.
*Fix:* Collapse the Activités table to a stacked card layout below a breakpoint; compress or wrap the in-tool tab nav on mobile the same way the marketing nav already does correctly.
*Suggested command:* `/impeccable adapt`

**[P1] Contrast failures recur sitewide, including on the brand accent itself**
*Why it matters:* Both assessments independently converged here. `ink-faint` (#8a8f94) — used in `Eyebrow.tsx` on every section label, timestamp, and field hint across every page — measures 2.7–3.3:1 against its usual backgrounds, well under the 4.5:1 WCAG AA floor. More striking: the detector found the brand accent itself (`#d6472c` white-on-accent, used on the weight-multiplier buttons on the Aptitude tab and recurring on `/compte`) at 4.4:1 — a near-miss on the product's own signature color — and gold badge text at 4.0–4.3:1 on pricing copy that communicates a purchasing-relevant fact ("5× plus qu'Essentiel").
*Fix:* Darken `ink-faint` for text use to ≈4.5:1 (keep the lighter value for icons only); nudge the accent-on-white and gold-badge pairings to close the AA gap.
*Suggested command:* `/impeccable audit`

**[P1] Gold used as sitewide marketing decoration, contradicting DESIGN.md's explicit ban**
*Why it matters:* DESIGN.md names this exact pattern and forbids it: "pas de halo « premium consumer » beige+laiton — le laiton est réservé au statut de compte, pas à la décoration." A decorative gold gradient sits behind the Hero and the final CTA, and a gold dash decorates every section eyebrow — ten instances across the homepage and legal pages, on the two highest-visibility marketing moments. The "Croissance" pricing card's gold "5× plus qu'Essentiel" tag is the *correct* use (paid-tier signal), which makes the decorative misuse elsewhere more conspicuous by direct contrast on the same page.
*Fix:* Remove the decorative gold blobs/dashes; reserve gold strictly for paid-tier signals as already done correctly on the pricing card.
*Suggested command:* `/impeccable polish`

**[P2] Diagnostic tool tabs are unrouted client state**
*Why it matters:* Contexte/Aptitude/ROI/Priorisation/Feuille de route switch via local `setTab` state, never touching the URL. No deep link to a specific tab (a consultant can't send a client straight to the ROI view), no back/forward through tabs, and a refresh silently discards tab position — this is also the likely cause of the reproduced scroll-position carryover when switching tabs mid-scroll.
*Fix:* Sync the active tab to a URL search param; reset scroll to top on tab change.
*Suggested command:* `/impeccable harden`

**[P2] Portfolio matrix — CADRAN's signature visual — is invisible in the exact state a new user is in**
*Why it matters:* The Value×Aptitude matrix and ranking table return nothing at all below 2 fully-scored processes, and free-tier orgs get a hard paywall with no preview above that. A first real user, on the free tier with one scored process (the seeded state observed live), never sees any evidence this headline feature — sold prominently on the homepage — exists.
*Fix:* Show a locked/sample-data preview instead of hiding the section outright.
*Suggested command:* `/impeccable onboard`

## Persona Red Flags

**Alex (Power User / automation consultant running many client diagnostics)**
- Can't bookmark or send a colleague a link straight to a client's ROI or Priorisation tab — tab state isn't in the URL.
- Testing the free tier with a prospect, Alex can't show the Value×Aptitude matrix at all — it's either not-yet-computable or hard-paywalled, with zero preview either way.
- "Profils de pondération" shows no saved profile by default — no starter/org-default weighting, so a consultant reusing the same logic across clients redefines it from scratch each time.

**Casey (Distracted Mobile User)** *(added given strong, specific evidence Assessment B confirmed)*
- The hamburger menu button measures 38×38px — below the 44×44px touch-target floor.
- On the diagnostic tool specifically, Casey hits a confirmed 410px-wide horizontal pan just to read the Activités table — form fields and labels are genuinely off-screen, not just visually tight, on the exact task CADRAN promises can be done "in one sitting."
- A floating help-avatar button visually overlaps the "Modifications non enregistrées" status text at this viewport width — a save-state indicator Casey specifically needs when getting interrupted mid-flow.

**Sam (Accessibility-Dependent)**
- Every eyebrow label sitewide fails WCAG AA (2.7–3.3:1) — used dozens of times per page.
- Paid-tier badge text measures as low as 2.42:1 on a purchasing-relevant fact.
- Mobile tab-nav buttons' accessible names weren't cleanly resolvable via the accessibility tree despite visible text labels — inconclusive on its own, worth a direct screen-reader check on the 5-tab nav.

**Jordan (First-Timer)**
- The signup page never mentions the free tier exists, even though the homepage clearly offers it — a first-timer could reasonably conclude payment is mandatory and bounce.
- Right after the homepage's "one sitting, no consultant" promise, Jordan hits the Context tab's 17-field continuous, unchunked scroll — the first real friction point, unprepared-for by the marketing pitch.
- No per-lever progress indicator during the 30-statement diagnostic — only the top-level "ÉTAPE 1–4" tab pattern exists; no local sense of "how much is left" within a lever.

## Minor Observations

- Detector volume by page: homepage 38 findings (mostly `nested-cards` ×14, `line-length` ×8), portfolio 15, diagnostic Aptitude tab 59 (the densest page — `low-contrast` ×23, `undersized-ui-text` ×18), ROI tab 28, account settings 31.
- `numbered-section-labels` (tiny "01"–"04" section numerals) flagged 4× by the detector is plausibly intentional "instrument"-style indexing consistent with CADRAN's own stated aesthetic — a judgment call, not a hard defect.
- The `PROFIL PAR LEVIER` table on the Aptitude tab repeats the same 6 lever scores already shown in the accordion cards above it — pure redundancy on an already-dense tab.
- The Feuille de route tab breaks the eyebrow+H1 header pattern the other four tabs share.
- ROI-tab explainer paragraphs (below each slider) combine `low-contrast` (3.3:1) and long line-length (~94 chars) in the same repeated pattern across all four sliders.
- FAQ answer paragraphs run ~87 chars/line, above comfortable reading width, 8× on one page.
- Portfolio activity log lists near-duplicate "a mis à jour «Traitement des factures»" entries within the same hour, ungrouped — reads as noise rather than a governance audit trail.
- Destructive "Supprimer mon compte" action stays appropriately restrained in color (coral tint, not a jarring red) — correctly following the one-accent-plus-semantic-scale discipline even at the highest-stakes moment.
- Two `text-occlusion` findings per page are detector self-referential artifacts (the detector's own label text overlapping itself) — false positives, already excluded from the counts above.
- Static/source-level scan is otherwise clean: only a stray 3px border-radius and a stray rgba black in `globals.css`, both minor and outside the documented token scale.

## Questions to Consider

1. What if the Context tab became a 3–4 step wizard (mirroring the "ÉTAPE 1 of 4" language already used one level up) instead of one 17-field scroll — would completion rates rise?
2. What if the portfolio matrix showed a grayed-out sample preview instead of vanishing entirely below 2 processes or on the free tier — would that convert more free users into paying ones?
3. What if every gold accent were reserved strictly for paid-tier signals with zero decorative use — would the "single accent" precision-instrument promise feel more credible on the very first homepage glance?
4. What if tab state lived in the URL — would consultants actually start sharing links to a specific ROI or Priorisation view instead of the whole tool?
