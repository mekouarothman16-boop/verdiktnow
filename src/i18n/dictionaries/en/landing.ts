import type { landing as fr } from "../fr/landing";

export const landing: typeof fr = {
  hero: {
    badge: "Automation readiness diagnostic",
    titleLine: "Know which process",
    titleHighlight: "to automate first",
    subtitle:
      "CADRAN assesses a process's readiness for automation, quantifies the return on investment, and prioritizes it against the others, one process at a time, with a weighted, transparent method.",
    ctaPricing: "See plans",
    ctaHowItWorks: "See how it works",
    badgeInstall: "No installation",
    badgeSpeed: "In one sitting",
    badgeMethod: "Transparent weighted method",
    cardEyebrow: "Automation readiness",
    cardCaption: "weighted readiness score",
    leverStd: "Standardization & stability",
    leverRules: "Rules & decisions",
    leverData: "Data & inputs",
  },
  stats: {
    eyebrow: "The reality",
    title: "Automation rarely fails because of the tool",
    items: [
      {
        value: "2 %",
        text: "of companies are ready for automation.",
        response: "CADRAN maps you against 6 weighted levers, before the first dollar is spent.",
      },
      {
        value: "61 %",
        text: "say their automation tools are underused, for lack of a clear strategy.",
        response: "CADRAN prioritizes your processes on a Value × Readiness matrix, so you know which one to tackle first.",
      },
      {
        value: "36 %",
        text: "cost reduction for companies that automate with a structured method.",
        response:
          "CADRAN quantifies that potential for your process: net savings, payback period, net present value over 5 years.",
      },
    ],
  },
  promises: {
    eyebrow: "What we owe you",
    title: "The CADRAN promises",
    items: [
      {
        title: "No score without an explanation",
        text: "Every statement, every lever, every weight is visible and adjustable. You'll always know why a score comes out the way it does — never a black box to take on faith.",
      },
      {
        title: "A business case, not a hunch",
        text: "Net savings, payback period, net present value: the decision to automate rests on verifiable numbers, not a gut feeling.",
      },
      {
        title: "A recommendation, not just a score",
        text: "Readiness and value combine into a single matrix: automate first, plan, prepare the ground, or set aside. You know what to do next, not just where you stand.",
      },
      {
        title: "Calibrated to your reality, never fixed",
        text: "Lever weights, priority threshold, what counts as a \"high\" saving: the default benchmarks adjust to your organization, not the other way around.",
      },
    ],
    costIntro: "An automation readiness audit run by an external firm, for a single process and before you've even started automating, typically costs:",
    costVendorLabel: "External automation firm",
    costVendorValue: "$3,000 to $25,000 USD per engagement",
    costCadranLabel: "CADRAN, unlimited diagnostics",
    costCadranValue: "starting at $50 CAD / month",
    costSource: "Typical range observed in the automation consulting market for a readiness audit, small and mid-size businesses.",
  },
  whyDiagnose: {
    eyebrow: "Before you invest",
    title: "Why diagnose before you act",
    intro:
      "Most automation initiatives start with picking a tool, not with assessing the process. An upfront readiness diagnostic changes that order: before committing a budget, a vendor, or team time, it reveals whether the process is truly ready, what needs fixing first, and which one to prioritize if there are several.",
    reasons: [
      {
        title: "Avoid false starts",
        text: "Most failures don't come from the tool, but from a process that wasn't ready for automation.",
        example:
          "A process judged “ready” by eye, where 40% of cases are actually undocumented exceptions. The Rules & Decisions lever catches it before a tool is purchased.",
      },
      {
        title: "Prioritize before committing a budget",
        text: "Facing several candidate processes, they're not all worth the same effort.",
        example:
          "Two processes seem equally urgent: the Value × Readiness matrix decides which to automate first, and which can wait.",
      },
      {
        title: "Justify the decision with numbers",
        text: "A readiness score and a quantified business case convince a leadership team far better than a hunch.",
        example:
          "Not a green light or a red light, but a detailed score of 41/100 across 6 levers — and what it would take to improve it.",
      },
    ],
    signalsLabel: "What the diagnostic detects",
    signals: [
      "Unstable workflow",
      "Unclear decision rules",
      "Unstructured data",
      "Unpredictable volume",
      "Unresolved technical constraints",
      "Governance or risk poorly controlled",
    ],
  },
  howItWorks: {
    eyebrow: "Five modules, one process",
    title: "How it works",
    subtitle:
      "Each module builds on the previous one, starting with context. You assess one process at a time, and leave with a clear decision on what to do next.",
    steps: [
      {
        n: "01",
        title: "Process context",
        text: "Sponsor, systems, pain points, regulatory constraints, documented steps: describe the process in depth before scoring it. The AI can then suggest a starting point for the diagnostic based on this context.",
      },
      {
        n: "02",
        title: "Readiness diagnostic",
        text: "30 statements across 6 weighted levers: standardization, rules, data, volume, technical feasibility, risk. The context you entered in the previous step informs every answer.",
      },
      {
        n: "03",
        title: "ROI calculator",
        text: "Volume, manual time, hourly cost, error rate: the business case recalculates live, with net savings, payback period, and net present value over 5 years.",
      },
      {
        n: "04",
        title: "Prioritization",
        text: "The process is positioned on a Value × Readiness matrix. The quadrant determines the recommendation: automate first, plan, prepare the ground, or set aside.",
      },
      {
        n: "05",
        title: "Roadmap",
        text: "A three-phase action plan is generated automatically, key milestones included (vendor contact, pilot, production go-live). It's then run from a team dashboard — owner, due dates, % progress, blockers — with two Gantt views: an indicative one and one based on your actual dates.",
      },
    ],
  },
  journeyDemo: {
    contextEyebrow: "Process context",
    contextFields: {
      sponsor: "Sponsor",
      sponsorValue: "Marie Tremblay, Finance Department",
      systems: "Systems used",
      systemsValue: "SAP, Excel, email",
      regulations: "Regulatory constraints",
      regulationsValue: "Bill 25, 7 year retention",
    },
    aiSuggestion: "AI suggested starting point for the 30 statements",
    diagnosticEyebrow: "Automation readiness",
    diagnosticCaption: "weighted readiness score",
    diagnosticLevers: {
      std: "Standardization & stability",
      rules: "Rules & decisions",
      data: "Data & inputs",
    },
    roiEyebrow: "Net recurring savings / year",
    roiPayback: "Payback",
    roiPaybackUnit: "months",
    roiNpv: "NPV · 5 years",
    roiCashflow: "Cumulative cash flow · 36 months",
    prioEyebrow: "Value × Readiness matrix",
    prioBadge: "Automate first",
    prioProcessName: "Vendor invoices",
    roadmapEyebrow: "Generated roadmap",
    roadmapRows: {
      immediate: "Immediate actions",
      phase1: "Phase 1 · Scoping & preparation",
      phase2: "Phase 2 · Supervised pilot",
    },
    roadmapCaption: "Assigned to the team, with key milestones and tracked due dates",
    tabs: {
      contexte: "Context",
      diagnostic: "Diagnostic",
      roi: "ROI",
      prio: "Prioritization",
      roadmap: "Roadmap",
    },
  },
  methodology: {
    eyebrow: "No black box",
    title: "How the score is calculated",
    subtitle:
      "The readiness score isn't a subjective estimate. It's a two level weighted average, fully customizable, then corrected if needed by the context you declare: each statement weighs within its lever, each lever weighs within the overall score.",
    weightsCardLabel: "6 levers · default weighting",
    steps: [
      {
        n: "01",
        title: "30 statements, each weighted",
        text: "Within each lever, some statements count more than others. For example, the stability of the workflow weighs more heavily than the number of people who follow it.",
      },
      {
        n: "02",
        title: "6 levers, weighted against each other",
        text: "Standardization, rules, data, volume, technical feasibility, risk: each has a default weight in the overall score, calibrated on what actually determines automation success.",
      },
      {
        n: "03",
        title: "Adjustable to your reality",
        text: "These weights aren't fixed. If risk matters more in your industry, increase its weight: the score recalculates live, and the report appendix documents any deviation from the default values.",
      },
      {
        n: "04",
        title: "Corrected by the declared context",
        text: "Certain context signals (checked regulations, unpredictable volume, sensitive terms detected in free text) automatically cap a lever's score if your self-assessment seems overly favorable. The adjustment is always visible and explained, never hidden in the calculation.",
      },
    ],
  },
  features: {
    eyebrow: "Built for the decision",
    title: "What sets CADRAN apart",
    items: [
      {
        title: "Double weighting",
        text: "Each statement weighs within its lever; each lever weighs within the overall score. Adjust the weights to your reality: the score recalculates live.",
      },
      {
        title: "AI-assisted analysis",
        text: "Describe the process context and let the AI propose a starting point for the 30 statements, with a rationale per lever.",
      },
      {
        title: "Quantified business case",
        text: "Net savings, payback period, 5-year NPV, cumulative cash flow: enough to convince without an extra spreadsheet.",
      },
      {
        title: "Transparent method",
        text: "Every formula is visible and explainable, no black box. You always know why a score comes out the way it does.",
      },
      {
        title: "Built-in project tracking",
        text: "Assign each action to a team member, track key milestones — from first vendor contact to production go-live — and progress in a shared dashboard, with automatic reminders for overdue deadlines.",
      },
      {
        title: "One-click export",
        text: "Generate a report ready to share for the diagnostic or the business case, directly from the browser.",
      },
    ],
  },
  pricing: {
    eyebrow: "Pricing, per organization",
    title: "Simple plans, no limit on processes",
    subtitle:
      "Simple plans, billed per person, with every feature included at every tier: what changes is the price per user based on your team's size. Need to add colleagues in read-only mode? The Viewer seat can be added at any time.",
    sharedFeatures: [
      "Documented process context",
      "Complete readiness diagnostic (30 statements)",
      "Complete ROI calculator",
      "Prioritization module (Value × Readiness matrix)",
      "Team-tracked roadmap",
      "Multi-process portfolio view",
      "Polished business case export",
    ],
    sampleReportLink: "See a sample report",
    recommended: "Recommended",
    monthlyBillingLabel: "Monthly",
    annualBillingLabel: "Annual",
    annualSavingsBadge: "2 months free",
    allFeaturesIncluded: "Every feature included",
    chooseThisTier: "Choose this tier",
    customPricing: "Custom",
    enterpriseCaption: "Every feature, with priority support and terms negotiated based on your number of users and processes to assess.",
    contactUs: "Contact us",
    enterpriseEmailSubject: "CADRAN: Enterprise tier",
    viewerSeatBadge: "Billed per person",
  },
  faq: {
    eyebrow: "Frequently asked questions",
    title: "Still have questions?",
    intro:
      "Answers to the questions we hear most often about CADRAN's method, diagnostic, and pricing.",
    ctaLabel: "See the full help center",
    items: [
      {
        q: "Why run a readiness diagnostic before automating?",
        a: "Most automation failures don't come from the tool, but from a process that wasn't ready. An upfront diagnostic reveals whether the process is truly ready, what needs fixing first, and which one to prioritize if there are several.",
      },
      {
        q: "How does CADRAN work?",
        a: "Five modules that build on one another for a single process: context, readiness diagnostic (30 statements across 6 levers), ROI calculator, prioritization on a Value × Readiness matrix, then an automatically generated roadmap. You leave with a clear decision on what's next.",
      },
      {
        q: "How is the readiness score calculated?",
        a: "It's a two level weighted average — each statement weighs within its lever, each lever weighs within the overall score — fully customizable and corrected if needed by the context you declare. No black box: every calculation is visible and explainable.",
      },
      {
        q: "Could the score be too optimistic?",
        a: "No: as soon as the context you declare reveals a risk (unpredictable volume, no documentation, high variability), the affected lever's score is automatically capped — the diagnostic can't show a high result if the signals say otherwise. You can also invite a colleague to fill out an independent second opinion, and every report displays a reliability level (Low, Medium, or High) telling you exactly how much to trust it.",
      },
      {
        q: "What sets CADRAN apart from other tools?",
        a: "A transparent, weighted method instead of an arbitrary score, AI-assisted analysis to kick off the diagnostic, and a quantified business case (net savings, payback period, 5-year NPV) ready to present to leadership.",
      },
      {
        q: "Is CADRAN affiliated with any particular RPA or AI vendor?",
        a: "No. CADRAN is built as the step you take before contacting an RPA/AI vendor or a consultant, not as a sales channel for one of them — we take no commission or benefit from any vendor mentioned in your report. The generated report is actually designed to be handed to that vendor as-is: it answers most of what they'd ask at a first meeting.",
      },
      {
        q: "How much does CADRAN cost?",
        a: "Simple plans, billed per person, with no limit on processes: context, diagnostic, ROI, and prioritization are complete at every tier. What changes is the price per user based on your team's size.",
      },
      {
        q: "Why was CADRAN created?",
        a: "Five years of watching automations fail for the same avoidable reasons convinced its founder you first need to know if a process is ready, before buying anything at all — hence a score you can always explain, never guess.",
      },
      {
        q: "How do I know which process to automate first?",
        a: "By positioning them all on the same Value × Readiness matrix: the resulting quadrant determines the recommendation — automate first, plan, prepare the ground, or set aside — giving you a common basis to decide between several candidates.",
      },
    ],
  },
  cta: {
    title: "Assess your first process today",
    subtitle: "A complete diagnostic, not a skim: get a defensible readiness score and business case in one sitting, no consulting engagement.",
    button: "Create an account",
  },
  home: {
    accountDeleted: "Your account and data have been permanently deleted.",
    title: "CADRAN — Diagnose Before You Contact an Automation Vendor",
    description:
      "The independent diagnostic to run before calling an RPA/AI vendor or consultant: assess process readiness, quantify ROI, and prioritize — in one sitting, no commitment.",
  },
} as const;
