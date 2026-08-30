# StyleSeed — Design Lock

<!-- Locked design decisions for CADRAN. Documents the already-established system audited
     2026-08-24 — these are existing project choices, not new picks. Change a value here to
     change it project-wide; re-read this before building new marketing/landing UI. -->

- App domain:         B2B SaaS — automation-readiness diagnostic tool
- Surface:             desktop-web (marketing site) — body text ≥15.5px on landing copy
- Page type:           landing / marketing home + product dashboard (two different grammars, see below)
- Output grammar:      `expressive-marketing` for `src/app/[lang]/page.tsx` and other public pages;
                       `enterprise-workbench`-leaning for the authenticated tool (`/processus`, `/outil`)
- Grammar path:        built-in:engine/RULESETS.md
- Brand recipe:        closest maintained analogue is `expressive-brand` (display type, controlled
                       accent, signature composition) for the landing page; not a literal fit —
                       CADRAN's own established system takes precedence over the recipe mapping
- Palette recipe:      n/a — CADRAN uses its own hand-built semantic token set (see below), not a
                       StyleSeed skin
- Mood:                confident · warm-editorial · airy · calm
- Primary action:      `--color-accent` #d6472c (terracotta/burnt-orange) — deliberately NOT the
                       generic AI indigo (#5E6AD2/#4F46E5); passes Golden Rule 14
- Font:                display = Bricolage Grotesque, body = IBM Plex Sans, mono = IBM Plex Mono
                       (see `src/app/[lang]/layout.tsx`) — a chosen, non-default pairing
- Radius personality:  soft — controls/pills `rounded-full`, cards `rounded-xl`(12px)/`rounded-2xl`(16px),
                       icon chips `rounded-[10px]` (unified 2026-08-24, was inconsistently 9px in
                       `Features.tsx`)
- Elevation:           layered soft shadow (`--shadow-card`, `--shadow-card-lg`) — one language,
                       no hard drop-shadows, no mixed border+shadow without reason
- Motion:              `Reveal` component (`src/components/landing/Reveal.tsx`) — fade+rise on
                       scroll-into-view, once, respects `prefers-reduced-motion` (see globals.css)
- Type scale:          desktop-larger (marketing home: h1 48–66px, section h2 36–46px, body
                       15.5–18px); small text (11–13px) reserved for labels/eyebrows/mono badges,
                       not body copy — matches the table's own "labels are exempt" carve-out
- Density:             airy on the marketing site, comfortable in the tool
- Signature moves:     asymmetric hero (real product mockup, not a stock visual), one featured
                       pricing tier (dark card breaks the 3-card row), asymmetric methodology
                       section (real weighted-lever data card + numbered list)

## Audit findings (2026-08-24, self-scored against engine/CRAFT-BASELINE.md + the
`expressive-marketing` grammar's reject list in engine/RULESETS.md)

**Already compliant, left untouched:**
- No generic indigo, no default font, no pure `#000`, no emoji-as-icons.
- Hero, Methodology, Pricing, FAQ already have a clear focal point / asymmetric composition.
- Semantic tokens used consistently; icon chips use one repeated role (category icon per
  section), not naked decoration — a legitimate coherent system, not a "gen-1 AI tell," despite
  superficially resembling the banned icon-chip pattern.

**Fixed:**
- `WhyDiagnose.tsx`: was a flat `sm:grid-cols-3` of 3 equal-weight cards — the literal pattern
  `expressive-marketing` rejects ("equal three-card feature rows"). Changed to one lead card
  (accent-tinted, larger type) + two stacked supporting cards, reusing the same "featured card"
  technique already proven in `Pricing.tsx`'s dark tier card, so no new visual language was
  invented.
- `Features.tsx`: icon-chip size/radius (`w-10 h-10 rounded-[9px]`) unified to match
  `WhyDiagnose.tsx`/`HowItWorks.tsx` (`w-11 h-11 rounded-[10px]`) for one coordinated family.

**Flagged, not applied (would need a separate, explicitly-scoped pass):**
- `Features.tsx`'s 6-item grid is borderless (no card chrome), so it reads as a feature list
  rather than "equal card rows" — left as-is; revisit only if it reads flat once rendered.
- Footer and several badge/caption labels sit at 11–13px, below StyleSeed's desktop-floor
  guidance ("footer text 14–15px, not 11–13px"). Not changed: this spans the whole site (not
  just the homepage) and the small sizes are deliberate quiet/secondary treatment, not obviously
  broken. Revisit only if explicitly requested.

## Full-site pass (2026-08-24, continued) — phases B through G

Extended the audit across the whole app: legal/auth pages, the diagnostic tool core
(ToolShell/Diagnostic/ContextSection), Roi/Prioritisation/ProcessBar, portfolio/account pages,
supporting components, and the PDF report. Method: read each component against
CRAFT-BASELINE.md's golden rules, grep the whole `src/` tree for hardcoded hex/rgba (the
highest-signal, lowest-risk check — a real token violation is unambiguous, unlike a subjective
layout call). Confirmed compliant with no changes: legal/auth, the diagnostic tool core, Roi,
Prioritisation, ProcessBar, and every supporting component (ActivityFeed, AttachmentList,
WeightProfiles, ShareLinkPanel, AssessmentHistory) — all already token-driven, real data, one
primary action, color-as-severity only.

**Real bugs found and fixed (not subjective calls):**
- `ContextSection.tsx`: the AI-analysis panel background was a hardcoded hex gradient
  (`#F3F9F7,#FFFFFF`, off-palette pale mint) instead of tokens — replaced with
  `var(--color-accent-soft)/var(--color-surface)`.
- `/processus` and `/compte` pages: each had its own hand-rolled header with `color="#fff"`
  hardcoded and a mono wordmark, diverging from the logo treatment used everywhere else
  (`AppHeader.tsx`/`LandingNav.tsx`/`AuthCard.tsx`/`Footer.tsx`: `rounded-md` box,
  `var(--color-accent-soft)` icon, `font-display` wordmark). Unified to match.
- **`Matrix.tsx` + `PortfolioMatrix.tsx`** (Value × Readiness quadrant charts): the
  "Automate first" quadrant used a hardcoded off-palette **blue** (`rgba(40,97,160,...)` =
  `#2861A0`) that matches no token anywhere in the app. Replaced with the accent token, aligning
  with the same 4-color verdict mapping (accent/olive/amber/coral) already used in
  `Prioritisation.tsx`. Verified live via the homepage's JourneyDemo.
- **`src/lib/pdf/ReportDocument.tsx` + `SummaryDocument.tsx` + `reportData.ts`** (the PDF
  report): `COLOR.accent` was the *exact same* `#2861A0` blue — used pervasively (lever bars,
  bullets, badges, quadrant fill, verdict color) throughout the entire 13-page report. The PDF's
  primary brand color did not match the live site's terracotta at all — apparently pre-dates the
  site's rebrand and was never updated. Fixed all three color definitions to the real tokens
  (`accent #d6472c`, `accentDeep #a8371f`, `accentSoft #fdece6`) and regenerated full FR + EN
  PDFs via a throwaway mock-data route (`/api/pdfverify`, deleted after use — bypassed
  auth/DB by stubbing the two Supabase calls `computeReportData` makes) to visually confirm
  every chart/badge/bar now renders in terracotta, not blue. This was confirmed with the user
  before editing given the size (~20+ call sites across 2 large files) and the fact it's a
  shipped, paid-tier deliverable.

**How to apply:** this file only covers the marketing homepage + the fixes above. If asked to
extend the audit further, re-grep for `rgba(` / `#[0-9a-f]{3,6}` across `src/` first — it is by
far the highest-value, lowest-effort check and caught the two most significant bugs (matrix
blue, PDF blue) in this pass.
