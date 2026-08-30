import type { legal as fr } from "../fr/legal";

export const legal: typeof fr = {
  contentHeader: {
    backHome: "Back to home",
  },
  myTasks: {
    metaTitle: "My tasks · VerdiktNow",
    title: "My tasks",
    subtitle: "Roadmap steps assigned to you, across every process, sorted by deadline.",
    emptyTitle: "No tasks assigned",
    emptyText: "Assign yourself a step from any process's roadmap to see it appear here.",
    overdueBadge: "overdue",
    noDueDate: "No deadline",
    backToPortfolio: "Back to portfolio",
  },
  aide: {
    title: "Help",
    subtitle: "Frequently asked questions about VerdiktNow. Can't find your answer? Write to us directly.",
    metaTitle: "Help · VerdiktNow",
    faq: [
      {
        q: "How does the readiness score work?",
        a: "You answer 30 statements across 6 levers (standardization, rules, data, volume, technical feasibility, risk). Each lever is weighted; the overall score recalculates live as you answer or adjust the weights.",
      },
      {
        q: "Do the score or report guarantee a result?",
        a: "No. These are decision aids based on an individual self-assessment, to be validated with the process's other stakeholders before any budget commitment. Each assessment's reliability is in fact indicated in the report.",
      },
      {
        q: "Is there a free tier?",
        a: "Yes. Your first process is free, no credit card required: context, complete readiness diagnostic, ROI calculator, and prioritization included. PDF export, AI analysis, and a second process require a paid tier. See the Pricing section for available tiers.",
      },
      {
        q: "How does the AI analysis work?",
        a: "On the diagnostic's Context page, the “Analyze with AI” button sends the qualitative information you entered to Anthropic (Claude) to suggest starting scores and risks to watch. Nothing is sent without this explicit action. Every paid tier includes a monthly analysis quota.",
      },
      {
        q: "Can I invite colleagues?",
        a: "Yes, from “My subscription.” You choose their role: Member (full access) or Viewer (read-only, no edits).",
      },
      {
        q: "How do I share a process with someone who doesn't have an account?",
        a: "From the tool, the “Share” button generates a read-only link viewable without an account. You can revoke it at any time.",
      },
      {
        q: "Can I cancel my subscription?",
        a: "Yes, at any time from “My subscription” → “Manage my subscription.” Paid access remains active until the end of the already-paid period.",
      },
      {
        q: "How do I delete my account or export my data?",
        a: "Both are self-service, from “My subscription.” The export produces a JSON file of all your data; deletion is permanent.",
      },
      {
        q: "Is my data visible to other organizations?",
        a: "No. Each organization only sees its own processes, enforced at the database level, not just the interface.",
      },
    ],
    needHelp: "Need more help?",
    needHelpText: "Write to us directly, we reply personally.",
  },
  apropos: {
    metaTitle: "About · VerdiktNow",
    title: "About",
    whoTitle: "Who am I?",
    whoText: "I am VerdiktNow, an automation readiness diagnostic. My job: assess whether a business process is ready to be automated, quantify its economic value, prioritize it against the others, and produce a business case rigorous enough to bring to a finance committee — all in one sitting, not weeks of a consulting engagement.",
    missionTitle: "My mission",
    missionText: "Replace gut feeling with numbers before an automation budget gets committed. Most automation projects fail not because of the tool chosen, but because the process wasn't ready — a problem a score out of 100 and a quantified business case let you see beforehand, not after.",
    valuesTitle: "My values",
    values: [
      {
        title: "Transparency",
        text: "The transparency of assumptions matters more than the appearance of precision. Every number I show explains where it comes from and how uncertain it is.",
      },
      {
        title: "Rigor that protects",
        text: "A cap or a warning derived from your context always corrects downward, never upward. No mechanism can artificially flatter a score.",
      },
      {
        title: "Honest at every tier",
        text: "I stay usable and honest at the free tier. Paid tiers add reach, never calculation integrity.",
      },
      {
        title: "Bilingual by default",
        text: "French and English from day one, never a translation bolted on afterward or approximate English.",
      },
    ],
    historyTitle: "My story",
    historyParagraphs: [
      "I was born from a simple observation: organizations that want to assess their automation readiness have historically had two options, both unsatisfying. Hire a consulting firm, for several thousand dollars and weeks of interviews, for a diagnostic that belongs to someone else once the engagement ends. Or settle for a generic free tool that never pushes the analysis to the quantified business case a finance committee actually requires.",
      "I fill that gap: the rigor of a consulting engagement — explicit weighting, sensitivity analysis, risk register, RACI matrix — without its price tag or its timeline. I'm a young product, built and operated solo, with no funding round or reference client to show off: what I can show you today is the method itself, not a list of logos.",
    ],
  },
  confidentialite: {
    metaTitle: "Privacy Policy · VerdiktNow",
    title: "Privacy Policy",
    lastUpdated: "Last updated:",
    notice:
      "Important notice: this text is a first draft written to honestly cover what VerdiktNow actually does with your data. It is not legal advice: it must be reviewed by a legal professional before it constitutes your official policy.",
    intro:
      "VerdiktNow (“we”) operates a tool for assessing business process automation readiness. This policy explains what data we collect, why, and what your rights are.",
    sections: [
      {
        h2: "1. Data we collect",
        items: [
          "Account: email address and password (managed by our authentication provider, Supabase; we never see your password in plain text).",
          "Content you enter: process names, qualitative descriptions, diagnostic answers, financial parameters, comments, tags — anything you enter into the tool.",
          "Organization: your organization's members (email, role) if you invite colleagues.",
          "Billing: handled entirely by Stripe. We never store your card number, only your subscription identifier.",
          "Technical cookies: only those necessary for your login session. No advertising or third-party tracking cookies.",
        ],
      },
      {
        h2: "2. Why we collect this data",
        p: "Exclusively to operate the service: authenticate your account, save your assessments, calculate your scores and ROI, generate your PDF reports, process payments, and let you collaborate with your organization's members. We do not sell your data and do not use it for advertising purposes.",
      },
      {
        h2: "3. Sharing with third parties",
        p: "We use the following subprocessors to operate the service:",
        items: [
          "Supabase: database hosting and authentication.",
          "Stripe: payment processing and billing.",
          "Anthropic (Claude): only when you click “Analyze with AI,” the context you entered for that process is sent to Anthropic to generate a suggestion of scores and risks. Nothing is sent without this explicit action on your part.",
        ],
        p2: "We do not share your data with any other third party, and do not sell it to anyone.",
      },
      {
        h2: "4. Retention",
        p: "Your data is retained as long as your account is active. If you delete a process, it is erased immediately (unless first archived, in which case it remains recoverable until permanent deletion). If you delete your account, see section 6 below.",
      },
      {
        h2: "5. Security",
        p: "Access to your data is protected by database-level access control (Row Level Security): a member of an organization can only see that organization's processes. Exchanges with the service are encrypted in transit (HTTPS).",
      },
      {
        h2: "6. Your rights",
        p: "You can, at any time and yourself, from the “My subscription” page:",
        items: [
          "Export a copy of all your data in JSON format.",
          "Permanently delete your account and associated data.",
        ],
        p2: "For any other request (correction, question about your data), write to us at",
      },
      {
        h2: "7. Changes",
        p: "If this policy changes significantly, we will notify you by email or with a notice in the application before the changes take effect.",
      },
      {
        h2: "8. Contact",
        p: "Questions? Write to",
      },
    ],
  },
  conditions: {
    metaTitle: "Terms of Use · VerdiktNow",
    title: "Terms of Use",
    lastUpdated: "Last updated:",
    notice:
      "Important notice: this text is a first draft, not legal advice. It must be reviewed by a legal professional, in particular the applicable jurisdiction and the operating legal entity, left to be completed below, before it constitutes your official terms.",
    intro: "By creating an account or using VerdiktNow, you agree to the following terms.",
    sections: [
      {
        h2: "1. The service",
        p: "VerdiktNow is a tool for assessing business process automation readiness: diagnostic, return-on-investment calculation, prioritization, and report generation. The scores, recommendations, and estimates produced are decision aids based on the information you provide: they are neither a guarantee of results nor professional advice (legal, accounting, technical, or financial). You remain responsible for validating any automation decision with your own experts before committing.",
      },
      {
        h2: "2. Your account",
        items: [
          "You are responsible for keeping your login credentials confidential.",
          "You must provide a valid and accurate email address.",
          "An account is tied to an organization; the owner can invite other members and manage their roles.",
        ],
      },
      {
        h2: "3. Your data",
        pBeforeLink: "You retain full ownership of the content you enter (processes, answers, comments). We only use it to provide you the service, as described in our",
        linkText: "privacy policy",
      },
      {
        h2: "4. Subscription and billing",
        items: [
          "A first process is free, no credit card required (context, diagnostic, ROI, and prioritization included; PDF export and AI analysis excluded). A paid subscription is required for any additional process.",
          "Plans are billed monthly via Stripe and can be canceled at any time from the “My subscription” page; paid access remains active until the end of the already-paid period.",
          "We reserve the right to adjust plan pricing, with reasonable notice to existing subscribers.",
        ],
      },
      {
        h2: "5. Acceptable use",
        p: "You agree not to:",
        items: [
          "Use the service for illegal purposes or to store illegal content.",
          "Attempt to circumvent the service's technical limits (quotas, security).",
          "Resell or redistribute access to the service without written authorization.",
        ],
      },
      {
        h2: "6. Limitation of liability",
        p: "VerdiktNow is provided “as is.” To the extent permitted by applicable law, we cannot be held liable for business decisions made based on the assessments produced by the tool, nor for indirect losses arising from the use or inability to use the service.",
      },
      {
        h2: "7. Termination",
        p: "You can delete your account at any time from the “My subscription” page. We may suspend or terminate an account in the event of a clear violation of these terms.",
      },
      {
        h2: "8. Governing law",
        pItalic:
          "[To be completed: jurisdiction and legal entity operating VerdiktNow. This section must be finalized with legal counsel before publication.]",
      },
      {
        h2: "9. Contact",
        p: "Questions about these terms? Write to",
      },
    ],
  },
} as const;
