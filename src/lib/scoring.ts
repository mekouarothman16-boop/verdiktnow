/**
 * Core scoring logic. Originally ported from the cadran.jsx prototype
 * (reference/cadran-brief.md §2); extended since with a 6th lever (risk &
 * governance), a maintenance cost term, ROI scenarios, and an automation-approach
 * recommender — see conversation history for rationale.
 */

import type { Locale } from "@/i18n/config";
import { scoring as scoringFr } from "@/i18n/dictionaries/fr/scoring";
import { scoring as scoringEn } from "@/i18n/dictionaries/en/scoring";

/** Dictionnaires de traduction pour cette couche de données — utilisés par les fonctions
 * `getXxx(locale)`/`xxx(..., locale)` ci-dessous. Les exports d'origine (DIMENSIONS, LEVELS,
 * etc.) restent inchangés et continuent de servir les composants qui n'ont pas encore été
 * migrés vers l'API consciente de la langue (voir plan i18n, phase 6). */
function getScoringDict(locale: Locale) {
  return locale === "en" ? scoringEn : scoringFr;
}

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export type LevelInfo = {
  n: number;
  label: string;
  color: string;
  note: string;
};

export const LEVELS: LevelInfo[] = [
  { n: 1, label: "Peu adapté", color: "#C45033", note: "Ce processus se prête mal à l'automatisation en l'état." },
  { n: 2, label: "Adaptation limitée", color: "#9A6C1B", note: "Automatisation partielle envisageable après préparation." },
  { n: 3, label: "Candidat modéré", color: "#6B7D31", note: "Automatisable moyennant quelques ajustements." },
  { n: 4, label: "Bon candidat", color: "#348269", note: "Ce processus est bien adapté à l'automatisation." },
  { n: 5, label: "Candidat idéal", color: "#2861A0", note: "Ce processus réunit des conditions idéales d'automatisation." },
];

const LEVEL_COLORS = LEVELS.map((l) => l.color);

/** Variante consciente de la langue de LEVELS — mêmes n/couleurs, texte localisé. */
export function getLevels(locale: Locale = "fr"): LevelInfo[] {
  return getScoringDict(locale).levels.map((l, i) => ({ n: l.n, label: l.label, color: LEVEL_COLORS[i], note: l.note }));
}

export type Question = { text: string; w: number };
export type Dimension = {
  id: string;
  label: string;
  short: string;
  weight: number;
  reco: string;
  strength: string;
  questions: Question[];
};

export const DIMENSIONS: Dimension[] = [
  {
    id: "std", label: "Standardisation & stabilité", short: "Standard.", weight: 22,
    reco: "Stabilisez et documentez ce processus avant de l'automatiser : un déroulement variable se prête mal à l'automatisation.",
    strength: "Un déroulement stable et documenté est la base la plus sûre pour un automate fiable : peu de cas imprévus à gérer, peu de maintenance corrective à prévoir.",
    questions: [
      { text: "Ce processus est documenté et suit un déroulement stable.", w: 2 },
      { text: "Les étapes sont exécutées de façon homogène d'une fois à l'autre.", w: 1.5 },
      { text: "Les exceptions sont rares ou clairement balisées.", w: 1.5 },
      { text: "Le processus évolue peu dans le temps (faible volatilité).", w: 2 },
      { text: "Tous les intervenants suivent la même procédure.", w: 1 },
    ],
  },
  {
    id: "rules", label: "Règles & décisions", short: "Règles", weight: 20,
    reco: "Explicitez les règles de décision : tant que le jugement humain domine, l'automatisation restera partielle.",
    strength: "Des règles de décision explicites permettent une automatisation directe par moteur de règles, sans dépendre d'un modèle probabiliste pour trancher.",
    questions: [
      { text: "Les décisions reposent sur des règles explicites, pas sur du jugement.", w: 2 },
      { text: "Les cas de figure possibles sont connus et en nombre fini.", w: 1.5 },
      { text: "Peu d'interventions humaines discrétionnaires sont requises.", w: 2 },
      { text: "Les critères de validation sont formalisés.", w: 1.5 },
      { text: "Les enchaînements de décision sont reproductibles.", w: 1 },
    ],
  },
  {
    id: "data", label: "Données & intrants", short: "Données", weight: 18,
    reco: "Rendez les intrants numériques, structurés et accessibles ; sans données fiables en entrée, l'automatisation reste fragile.",
    strength: "Des intrants numériques et structurés réduisent fortement le risque d'échec technique du projet et accélèrent l'intégration.",
    questions: [
      { text: "Les intrants du processus sont numériques (non papier).", w: 2 },
      { text: "Les données nécessaires sont accessibles au bon moment.", w: 2 },
      { text: "Les intrants sont structurés et normalisés.", w: 1.5 },
      { text: "La qualité des données en entrée est fiable.", w: 1.5 },
      { text: "Peu de ressaisie manuelle est nécessaire.", w: 1 },
    ],
  },
  {
    id: "vol", label: "Volume & répétitivité", short: "Volume", weight: 15,
    reco: "Le volume ou la répétitivité sont faibles : vérifiez que le gain justifie l'effort, ou regroupez avec des processus voisins.",
    strength: "Un volume élevé et répétitif maximise le retour sur l'effort d'automatisation : chaque heure investie dans le projet se rentabilise plus vite.",
    questions: [
      { text: "Le processus se répète fréquemment.", w: 2 },
      { text: "Le volume traité est élevé.", w: 1.5 },
      { text: "Le temps cumulé consacré à ce processus est important.", w: 1.5 },
      { text: "Les tâches sont répétitives et prévisibles.", w: 1.5 },
      { text: "Les pics de charge sont récurrents.", w: 1 },
    ],
  },
  {
    id: "tech", label: "Faisabilité technique", short: "Techno.", weight: 13,
    reco: "Levez les contraintes techniques (intégration, sécurité) et validez la faisabilité avec l'équipe TI avant de vous engager.",
    strength: "Des points d'intégration techniques disponibles réduisent le risque et le coût de mise en œuvre : moins de développement sur mesure à prévoir.",
    questions: [
      { text: "Les systèmes impliqués offrent des points d'intégration (API, connecteurs).", w: 2 },
      { text: "Aucun blocage technique majeur n'est anticipé.", w: 1.5 },
      { text: "La sécurité et la conformité permettent l'automatisation.", w: 1.5 },
      { text: "Les outils requis sont disponibles ou accessibles.", w: 1.5 },
      { text: "Une équipe ou un fournisseur capable de déployer l'automatisation est déjà identifié.", w: 1 },
    ],
  },
  {
    id: "risk", label: "Risque & gouvernance", short: "Risque", weight: 12,
    reco: "Impliquez tôt la conformité et la gouvernance : un risque mal maîtrisé peut coûter plus cher que les gains attendus. Prévoyez un pilote encadré avant un déploiement large.",
    strength: "Un risque faible et une gouvernance claire simplifient l'approbation du projet et permettent un déploiement plus large, plus rapidement.",
    questions: [
      { text: "Les données traitées ne sont pas hautement sensibles ou réglementées (RGPD, santé, finances critiques).", w: 2 },
      { text: "L'automatisation de ce processus ne requiert pas d'approbation réglementaire ou d'audit spécifique.", w: 1.5 },
      { text: "Les conséquences d'une erreur automatisée sont limitées et récupérables.", w: 2 },
      { text: "Les parties prenantes (métier, TI, conformité) sont favorables à l'automatisation de ce processus.", w: 1.5 },
      { text: "Il existe une gouvernance ou un point de contact clair pour superviser l'automate.", w: 1 },
    ],
  },
];

const DIMENSION_BASE = DIMENSIONS.map((d) => ({ id: d.id, weight: d.weight, questionWeights: d.questions.map((q) => q.w) }));

/** Variante consciente de la langue de DIMENSIONS — mêmes id/poids, texte localisé. */
export function getDimensions(locale: Locale = "fr"): Dimension[] {
  const dict = getScoringDict(locale).dimensions;
  return DIMENSION_BASE.map((base) => {
    const d = dict[base.id as keyof typeof dict];
    return {
      id: base.id,
      label: d.label,
      short: d.short,
      weight: base.weight,
      reco: d.reco,
      strength: d.strength,
      questions: d.questions.map((text, i) => ({ text, w: base.questionWeights[i] })),
    };
  });
}

export const LIKERT = [
  { v: 0, label: "Pas du tout" },
  { v: 1, label: "Peu" },
  { v: 2, label: "En partie" },
  { v: 3, label: "En grande partie" },
  { v: 4, label: "Totalement" },
] as const;

/** Variante consciente de la langue de LIKERT. */
export function getLikert(locale: Locale = "fr"): { v: number; label: string }[] {
  return getScoringDict(locale).likert.map((label, i) => ({ v: i, label }));
}

export const CURRENCIES = {
  CAD: { symbol: "$", locale: "fr-CA" },
  USD: { symbol: "$ US", locale: "en-US" },
} as const;
export type Currency = keyof typeof CURRENCIES;

export const HOURS_PER_FTE = 1600;

export type ContextQuestion = { id: string; label: string; placeholder: string; long: boolean; hint: string; section: string };

/** Ordre d'affichage des sections dans le formulaire de contexte — chaque champ y appartient
 * pour que l'utilisateur voie des groupes cohérents plutôt qu'une longue liste plate. */
export const CONTEXT_SECTIONS = [
  "Porteur et échéancier",
  "Le processus",
  "Intervenants et systèmes",
  "Frictions actuelles",
  "Contraintes",
  "Historique",
  "Spécifique à ce type de processus",
] as const;

/** Chaque champ capture UNE seule information — un champ qui mélange plusieurs questions
 * (ex. « nom, titre, direction ») laisse l'utilisateur deviner quoi mettre où. */
export const CONTEXT_QUESTIONS: ContextQuestion[] = [
  { id: "sponsorName", label: "Nom du porteur de projet", placeholder: "Ex. Marie Tremblay", long: false, hint: "Indiquez le nom de la personne qui porte ce projet côté métier — celle capable de trancher et de débloquer les ressources. Exemple : « Marie Tremblay ».", section: "Porteur et échéancier" },
  { id: "sponsorRole", label: "Titre et direction du porteur", placeholder: "Ex. Directrice des opérations", long: false, hint: "Précisez le titre et la direction de cette personne, pour situer son niveau de décision. Exemple : « Directrice des opérations ».", section: "Porteur et échéancier" },
  { id: "timeline", label: "Échéancier souhaité", placeholder: "Ex. pilote d'ici 3 mois, déploiement T3 2026…", long: false, hint: "Précisez le délai souhaité pour un premier résultat concret, même approximatif. Exemple : « Projet pilote d'ici 3 mois, déploiement complet au T3 2026 ».", section: "Porteur et échéancier" },

  { id: "objective", label: "Objectif du processus", placeholder: "Ce que ce processus doit accomplir…", long: true, hint: "Résumez en une phrase ce que ce processus doit accomplir, indépendamment de la façon dont il est exécuté aujourd'hui. Exemple : « Rembourser les frais de déplacement des employés dans un délai de 5 jours ouvrables ».", section: "Le processus" },
  { id: "expectedOutcome", label: "Résultat produit", placeholder: "Ce que le processus livre une fois terminé…", long: false, hint: "Décrivez ce qui est livré à la fin du processus. Exemple : « Un remboursement déposé dans le compte de l'employé, avec confirmation par courriel ».", section: "Le processus" },
  { id: "mainSteps", label: "Grandes étapes (résumé)", placeholder: "Ex. réception, validation, calcul, approbation, paiement…", long: true, hint: "Listez les grandes étapes dans l'ordre, sans entrer dans le détail (vous pourrez le faire plus bas si utile). Exemple : « Réception de la demande, validation des pièces, calcul du montant, approbation, paiement ».", section: "Le processus" },
  { id: "upstream", label: "Ce qui déclenche ce processus", placeholder: "D'où viennent les données ou la demande qui déclenchent ce processus…", long: false, hint: "Précisez d'où viennent les données ou la demande qui déclenchent ce processus. Exemple : « Formulaire rempli par le client sur le site web ».", section: "Le processus" },
  { id: "downstream", label: "Ce qui dépend de son résultat", placeholder: "Qui ou quoi utilise le résultat de ce processus en aval…", long: false, hint: "Précisez qui ou quel système utilise le résultat de ce processus ensuite. Exemple : « Le service de facturation utilise le montant validé pour émettre la facture ».", section: "Le processus" },

  { id: "actors", label: "Intervenants et rôles", placeholder: "Qui fait quoi dans le processus…", long: false, hint: "Décrivez qui intervient et à quel moment dans le processus. Exemple : « L'agent au service à la clientèle reçoit la demande, le superviseur valide au-delà de 500 $ ».", section: "Intervenants et systèmes" },
  { id: "systems", label: "Systèmes et applications utilisés", placeholder: "Ex. courriel, Excel, système X, portail Y…", long: false, hint: "Listez les outils et logiciels utilisés à chaque étape, même les plus simples. Exemple : « Courriel Outlook, Excel pour le suivi, SAP pour la comptabilisation ».", section: "Intervenants et systèmes" },

  { id: "pain", label: "Irritants et points de douleur actuels", placeholder: "Ce qui ralentit, coûte du temps ou génère des erreurs…", long: true, hint: "Nommez ce qui ralentit le travail, coûte du temps ou cause des erreurs aujourd'hui. Exemple : « Saisie manuelle des mêmes données dans 3 systèmes, délais d'approbation de plusieurs jours ».", section: "Frictions actuelles" },
  { id: "exceptions", label: "Exceptions et cas particuliers fréquents", placeholder: "Les variantes qui sortent du cas standard…", long: true, hint: "Décrivez les cas qui sortent du scénario standard et comment ils sont traités. Exemple : « Demande incomplète : renvoyée au client ; montant supérieur à 10 000 $ : approbation du directeur requise ».", section: "Frictions actuelles" },

  { id: "securityConstraints", label: "Exigences de sécurité", placeholder: "Accès, chiffrement, authentification, données sensibles à protéger…", long: true, hint: "Précisez les exigences de sécurité à respecter, distinctes des obligations réglementaires déjà cochées ci-dessus. Exemple : « Authentification à deux facteurs requise, données chiffrées au repos ».", section: "Contraintes" },
  { id: "internalPolicies", label: "Politiques ou normes internes", placeholder: "Règles internes à respecter, hors obligations légales…", long: true, hint: "Décrivez les règles propres à votre organisation qui ne découlent pas d'une obligation légale. Exemple : « Toute automatisation doit être approuvée par le comité de gouvernance des données ».", section: "Contraintes" },

  { id: "priorAttempts", label: "Automatisation déjà tentée ?", placeholder: "Oui/non, et dans quel contexte…", long: false, hint: "Indiquez si ce processus a déjà fait l'objet d'une tentative d'automatisation, même partielle. Exemple : « Un script Excel avait été tenté en 2023 ».", section: "Historique" },
  { id: "priorLessons", label: "Ce qui a fonctionné ou échoué", placeholder: "Si une tentative a eu lieu, qu'est-ce qui a marché ou non…", long: true, hint: "Si une tentative a eu lieu, précisez ce qui a fonctionné ou non, pour éviter de répéter les mêmes erreurs. Exemple : « Abandonné faute de maintenance : personne n'était responsable de mettre à jour le script ».", section: "Historique" },
];

const CONTEXT_QUESTION_SECTION_INDEX: Record<string, number> = Object.fromEntries(
  CONTEXT_QUESTIONS.map((q) => [q.id, CONTEXT_SECTIONS.indexOf(q.section as (typeof CONTEXT_SECTIONS)[number])])
);

/** Variante consciente de la langue de CONTEXT_SECTIONS. */
export function getContextSections(locale: Locale = "fr"): readonly string[] {
  return getScoringDict(locale).contextSections;
}

/** Variante consciente de la langue de CONTEXT_QUESTIONS — mêmes id/long/ordre, texte localisé. */
export function getContextQuestions(locale: Locale = "fr"): ContextQuestion[] {
  const dict = getScoringDict(locale);
  const sections = dict.contextSections;
  return CONTEXT_QUESTIONS.map((q) => {
    const t = dict.contextQuestions[q.id as keyof typeof dict.contextQuestions];
    return {
      id: q.id,
      label: t.label,
      placeholder: t.placeholder,
      long: q.long,
      hint: t.hint,
      section: sections[CONTEXT_QUESTION_SECTION_INDEX[q.id]],
    };
  });
}

/** Une question ciblée par catégorie, en complément des questions génériques — un processus
 * Finance et un processus RH n'ont pas les mêmes angles morts à couvrir. */
export const CATEGORY_QUESTIONS: Record<string, ContextQuestion[]> = {
  finance: [
    { id: "cat_finance_controls", label: "Contrôles ou seuils d'approbation existants", placeholder: "Montants, signatures requises, double validation…", long: false, hint: "Décrivez les seuils ou approbations déjà en place pour ce processus financier. Exemple : « Double signature requise au-delà de 5 000 $ ».", section: "Spécifique à ce type de processus" },
  ],
  hr: [
    { id: "cat_hr_sensitive", label: "Décisions RH sensibles impliquées", placeholder: "Embauche, évaluation, congédiement…", long: false, hint: "Précisez si des décisions RH délicates sont impliquées. Exemple : « Le processus inclut une recommandation de congédiement ».", section: "Spécifique à ce type de processus" },
  ],
  customer_service: [
    { id: "cat_cs_channel", label: "Canal de contact principal", placeholder: "Téléphone, courriel, clavardage, portail…", long: false, hint: "Indiquez le canal principal par lequel les clients entrent en contact. Exemple : « Clavardage sur le site web, en heures ouvrables ».", section: "Spécifique à ce type de processus" },
  ],
  procurement: [
    { id: "cat_proc_thresholds", label: "Fournisseurs préférés ou seuils d'approbation", placeholder: "Paliers de montant, fournisseurs approuvés…", long: false, hint: "Précisez les fournisseurs privilégiés ou les seuils d'approbation applicables. Exemple : « Achats de plus de 2 000 $ soumis à 2 soumissions ».", section: "Spécifique à ce type de processus" },
  ],
  sales: [
    { id: "cat_sales_impact", label: "Impact sur une transaction ou un contrat en cours", placeholder: "Prix, conditions, engagement client…", long: false, hint: "Décrivez l'effet possible sur une transaction ou un contrat en cours. Exemple : « Une erreur retarderait la signature d'un contrat client ».", section: "Spécifique à ce type de processus" },
  ],
  it_ops: [
    { id: "cat_itops_criticality", label: "Systèmes critiques en production concernés", placeholder: "Systèmes dont une panne aurait un impact opérationnel…", long: false, hint: "Nommez les systèmes en production dont une panne aurait un impact opérationnel. Exemple : « Le portail client, indisponible même 10 minutes, génère des plaintes ».", section: "Spécifique à ce type de processus" },
  ],
  legal_compliance: [
    { id: "cat_legal_deadline", label: "Délai réglementaire applicable", placeholder: "Échéance légale stricte, pénalité en cas de retard…", long: false, hint: "Précisez le délai légal applicable et la pénalité en cas de retard. Exemple : « Réponse obligatoire sous 30 jours, sinon amende réglementaire ».", section: "Spécifique à ce type de processus" },
  ],
  supply_chain: [
    { id: "cat_supply_partners", label: "Partenaires externes impliqués", placeholder: "Transporteurs, fournisseurs, douanes…", long: false, hint: "Nommez les partenaires externes impliqués dans ce processus. Exemple : « Transporteur X, douanes canadiennes ».", section: "Spécifique à ce type de processus" },
  ],
};

/** Questions génériques + questions spécifiques à la catégorie sélectionnée, si applicable. */
export function getApplicableContextQuestions(category?: string, locale: Locale = "fr"): ContextQuestion[] {
  const extra = category ? getCategoryQuestions(locale)[category] ?? [] : [];
  return [...getContextQuestions(locale), ...extra];
}

/** Variante consciente de la langue de CATEGORY_QUESTIONS — même id/long, texte localisé. */
export function getCategoryQuestions(locale: Locale = "fr"): Record<string, ContextQuestion[]> {
  const dict = getScoringDict(locale);
  const sectionText = dict.categorySpecificSection;
  const out: Record<string, ContextQuestion[]> = {};
  for (const [category, questions] of Object.entries(CATEGORY_QUESTIONS)) {
    const t = dict.categoryQuestions[category as keyof typeof dict.categoryQuestions];
    out[category] = questions.map((q) => ({ id: q.id, label: t.label, placeholder: t.placeholder, long: q.long, hint: t.hint, section: sectionText }));
  }
  return out;
}

/** Nom + titre du porteur de projet combinés en une seule chaîne d'affichage, pour les
 * endroits (rapport PDF, feuille de route) qui n'ont besoin que d'un libellé unique.
 * Pure concaténation de texte saisi par l'utilisateur — rien à traduire ici. */
export function sponsorDisplay(context: Context): string {
  const name = (context.sponsorName || "").trim();
  const role = (context.sponsorRole || "").trim();
  if (name && role) return `${name} (${role})`;
  return name || role;
}

/** Exigences de sécurité + politiques internes combinées — les contraintes réglementaires
 * ont leur propre représentation structurée (tags) et ne sont pas incluses ici. */
export function constraintsSummary(context: Context): string {
  return [context.securityConstraints, context.internalPolicies]
    .map((s) => (s || "").trim())
    .filter(Boolean)
    .join(" ; ");
}

export const REGULATION_TAGS: { id: string; label: string }[] = [
  { id: "rgpd_loi25", label: "RGPD / Loi 25 (données personnelles)" },
  { id: "pci_dss", label: "PCI-DSS (paiement par carte)" },
  { id: "hipaa_sante", label: "Données de santé (HIPAA ou équivalent)" },
  { id: "sox_finance", label: "SOX / finance réglementée" },
  { id: "audit_legal", label: "Piste d'audit légale requise" },
  { id: "other", label: "Autre" },
];

/** Variante consciente de la langue de REGULATION_TAGS. */
export function getRegulationTags(locale: Locale = "fr"): { id: string; label: string }[] {
  const dict = getScoringDict(locale).regulationTags;
  return REGULATION_TAGS.map((r) => ({ id: r.id, label: dict[r.id as keyof typeof dict] }));
}

/** Résout les tags réglementaires sélectionnés en libellés affichables, en remplaçant le
 * tag « other » par le texte libre saisi (ou le libellé générique si ce texte est vide). */
export function regulationLabels(context: Context, locale: Locale = "fr"): string[] {
  const ids = (context.regulations || "").split(";").filter(Boolean);
  const tags = getRegulationTags(locale);
  const otherFallback = getScoringDict(locale).regulationTags.other;
  return ids.map((id) => {
    if (id === "other") return (context.regulationsOther || "").trim() || otherFallback;
    return tags.find((r) => r.id === id)?.label ?? id;
  });
}

/** Processus du portefeuille dont ce processus-ci dépend (ex. reçoit ses données en amont) —
 * ids séparés par un point-virgule dans context.dependsOn, même convention que `regulations`.
 * Signal de séquençage pour le portefeuille : un « gain rapide » qui dépend d'un processus voisin
 * pas encore prêt n'est pas vraiment prêt à automatiser, même si sa propre matrice le suggère. */
export function parseProcessDependencies(context: Context): string[] {
  return (context.dependsOn || "").split(";").filter(Boolean);
}

export function serializeProcessDependencies(ids: string[]): string {
  return Array.from(new Set(ids)).join(";");
}

export const VOLUME_VARIABILITY_OPTIONS: { id: string; label: string }[] = [
  { id: "stable", label: "Stable toute l'année" },
  { id: "saisonnier", label: "Saisonnier, pics prévisibles" },
  { id: "imprevisible", label: "Imprévisible" },
];

/** Variante consciente de la langue de VOLUME_VARIABILITY_OPTIONS. */
export function getVolumeVariabilityOptions(locale: Locale = "fr"): { id: string; label: string }[] {
  const dict = getScoringDict(locale).volumeVariabilityOptions;
  return VOLUME_VARIABILITY_OPTIONS.map((o) => ({ id: o.id, label: dict[o.id as keyof typeof dict] }));
}

/* ------------------------------------------------------------------ *
 * Inventaire des outils déjà en place
 * ------------------------------------------------------------------ */

/** Position d'un outil dans une chaîne automatisée — ce n'est PAS un jugement de qualité de l'outil,
 * mais une réponse à une seule question : « cet outil peut-il porter l'automatisation, s'y brancher,
 * ou la freiner ? ». Un très bon outil peut être un frein s'il n'expose aucune interface. */
export type ToolRole = "platform" | "connected" | "data" | "manual";

/** Ordre de tri des rôles à l'affichage : ce que vous avez déjà pour automatiser d'abord,
 * ce qui bloque en dernier — la lecture la plus utile va du levier vers l'obstacle. */
export const TOOL_ROLE_ORDER: ToolRole[] = ["platform", "connected", "data", "manual"];

export type CatalogTool = { id: string; label: string; role: ToolRole };
export type ToolGroup = { id: string; label: string; tools: CatalogTool[] };

/** Catalogue d'outils courants, groupé par famille. Les libellés ici sont la version française de
 * référence ; `getToolCatalog(locale)` les remplace par la version localisée. Les `role` et les `id`
 * sont non linguistiques et ne changent jamais d'une langue à l'autre. */
export const TOOL_CATALOG: ToolGroup[] = [
  {
    id: "automation", label: "Automatisation & intégration", tools: [
      { id: "power_automate", label: "Microsoft Power Automate", role: "platform" },
      { id: "power_apps", label: "Microsoft Power Apps", role: "platform" },
      { id: "copilot_studio", label: "Copilot Studio / agent IA", role: "platform" },
      { id: "zapier", label: "Zapier", role: "platform" },
      { id: "make", label: "Make (Integromat)", role: "platform" },
      { id: "n8n", label: "n8n", role: "platform" },
      { id: "uipath", label: "UiPath", role: "platform" },
    ],
  },
  {
    id: "office", label: "Bureautique & collaboration", tools: [
      { id: "outlook", label: "Outlook / courriel Microsoft", role: "connected" },
      { id: "teams", label: "Microsoft Teams", role: "connected" },
      { id: "sharepoint", label: "SharePoint", role: "connected" },
      { id: "excel", label: "Excel", role: "data" },
      { id: "google_workspace", label: "Google Workspace (Gmail, Docs)", role: "connected" },
      { id: "google_sheets", label: "Google Sheets", role: "data" },
      { id: "slack", label: "Slack", role: "connected" },
    ],
  },
  {
    id: "erp_finance", label: "Gestion, ERP & comptabilité", tools: [
      { id: "sap", label: "SAP", role: "connected" },
      { id: "oracle", label: "Oracle", role: "connected" },
      { id: "dynamics", label: "Microsoft Dynamics 365", role: "connected" },
      { id: "netsuite", label: "NetSuite", role: "connected" },
      { id: "sage", label: "Sage", role: "connected" },
      { id: "quickbooks", label: "QuickBooks", role: "connected" },
      { id: "acomba", label: "Acomba", role: "connected" },
    ],
  },
  {
    id: "crm", label: "CRM & ventes", tools: [
      { id: "salesforce", label: "Salesforce", role: "connected" },
      { id: "hubspot", label: "HubSpot", role: "connected" },
      { id: "zoho", label: "Zoho", role: "connected" },
    ],
  },
  {
    id: "hr", label: "RH & paie", tools: [
      { id: "workday", label: "Workday", role: "connected" },
      { id: "bamboohr", label: "BambooHR", role: "connected" },
      { id: "adp", label: "ADP", role: "connected" },
      { id: "nethris", label: "Nethris / Employeur D", role: "connected" },
    ],
  },
  {
    id: "service_it", label: "Service à la clientèle & TI", tools: [
      { id: "servicenow", label: "ServiceNow", role: "connected" },
      { id: "jira", label: "Jira", role: "connected" },
      { id: "zendesk", label: "Zendesk", role: "connected" },
    ],
  },
  {
    id: "documents", label: "Documents & signature", tools: [
      { id: "docusign", label: "DocuSign", role: "connected" },
      { id: "adobe_sign", label: "Adobe Acrobat Sign", role: "connected" },
      { id: "ged", label: "GED / gestion documentaire (M-Files, Laserfiche)", role: "connected" },
      { id: "ocr", label: "Outil de numérisation / OCR", role: "connected" },
    ],
  },
  {
    id: "data_bi", label: "Données & informatique décisionnelle", tools: [
      { id: "power_bi", label: "Power BI", role: "connected" },
      { id: "tableau", label: "Tableau", role: "connected" },
      { id: "sql_db", label: "Base de données SQL interne", role: "connected" },
    ],
  },
  {
    id: "manual_channels", label: "Supports et canaux manuels", tools: [
      { id: "shared_drive", label: "Disque partagé / dossiers réseau", role: "data" },
      { id: "email_tracking", label: "Courriel utilisé comme système de suivi", role: "manual" },
      { id: "paper", label: "Papier / formulaires imprimés", role: "manual" },
      { id: "scanned_pdf", label: "PDF numérisés (scans, images)", role: "manual" },
      { id: "fax", label: "Télécopieur", role: "manual" },
      { id: "legacy_inhouse", label: "Système maison sans API", role: "manual" },
    ],
  },
];

const TOOL_ROLE_BY_ID: Record<string, ToolRole> = Object.fromEntries(
  TOOL_CATALOG.flatMap((g) => g.tools.map((tool) => [tool.id, tool.role]))
);

/** Variante consciente de la langue de TOOL_CATALOG — mêmes id/rôles/ordre, texte localisé. */
export function getToolCatalog(locale: Locale = "fr"): ToolGroup[] {
  const dict = getScoringDict(locale).toolCatalog;
  return TOOL_CATALOG.map((g) => ({
    id: g.id,
    label: dict.groups[g.id as keyof typeof dict.groups],
    tools: g.tools.map((tool) => ({
      id: tool.id,
      label: dict.tools[tool.id as keyof typeof dict.tools],
      role: tool.role,
    })),
  }));
}

/** Libellé court + explication d'un rôle, pour l'étiquette affichée à côté de chaque outil. */
export function getToolRoleMeta(locale: Locale = "fr"): Record<ToolRole | "unknown", { tag: string; description: string }> {
  return getScoringDict(locale).toolCatalog.roles;
}

/** Outils du catalogue cochés — ids séparés par un point-virgule, même convention que `regulations`. */
export function parseSelectedTools(context: Context): string[] {
  return (context.toolsSelected || "").split(";").filter((id) => id in TOOL_ROLE_BY_ID);
}

export function serializeSelectedTools(ids: string[]): string {
  return Array.from(new Set(ids.filter((id) => id in TOOL_ROLE_BY_ID))).join(";");
}

/** Outil absent du catalogue, documenté à la main. `role` vaut "unknown" tant que l'utilisateur
 * n'a pas répondu à la question d'intégration — on ne devine jamais à sa place. */
export type CustomTool = { id: string; name: string; usage: string; role: ToolRole | "unknown" };

const CUSTOM_TOOL_ROLES: (ToolRole | "unknown")[] = ["platform", "connected", "data", "manual", "unknown"];

/** Même convention de stockage que `activities` : JSON dans le Context, tolérant au JSON corrompu. */
export function parseCustomTools(context: Context): CustomTool[] {
  if (!context.toolsCustom) return [];
  try {
    const raw = JSON.parse(context.toolsCustom);
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((tool): tool is Record<string, unknown> => !!tool && typeof tool === "object" && typeof tool.name === "string")
      .map((tool) => ({
        id: typeof tool.id === "string" ? tool.id : "",
        name: tool.name as string,
        usage: typeof tool.usage === "string" ? tool.usage : "",
        role: CUSTOM_TOOL_ROLES.includes(tool.role as ToolRole) ? (tool.role as ToolRole) : "unknown",
      }));
  } catch {
    return [];
  }
}

/** Ne filtre pas les lignes vides — même convention que serializeActivities : une ligne tout juste
 * ajoutée doit survivre à ce round-trip pour que l'utilisateur puisse la remplir. Le filtrage des
 * lignes réellement vides se fait à la lecture (buildToolInventory) ou à la sauvegarde côté API. */
export function serializeCustomTools(tools: CustomTool[]): string {
  return tools.length > 0 ? JSON.stringify(tools) : "";
}

export type ToolInventoryEntry = {
  id: string;
  label: string;
  role: ToolRole | "unknown";
  /** Renseigné uniquement pour les outils saisis à la main. */
  usage: string;
  custom: boolean;
};

export type ToolInventory = {
  entries: ToolInventoryEntry[];
  counts: Record<ToolRole | "unknown", number>;
  /** Lecture en une phrase de ce que le parc actuel permet — null si rien n'est documenté. */
  verdict: string | null;
};

/** Consolide les outils cochés et les outils saisis à la main en un inventaire unique, trié du
 * levier vers l'obstacle, avec une lecture de ce que ce parc rend possible. C'est le seul endroit
 * qui décide de cette lecture : l'écran, le prompt d'analyse et le rapport PDF la partagent. */
export function buildToolInventory(context: Context, locale: Locale = "fr"): ToolInventory {
  const catalog = getToolCatalog(locale);
  const labelById = new Map(catalog.flatMap((g) => g.tools.map((tool) => [tool.id, tool.label] as const)));
  const selected = parseSelectedTools(context);

  const entries: ToolInventoryEntry[] = [
    ...selected.map((id) => ({
      id,
      label: labelById.get(id) ?? id,
      role: TOOL_ROLE_BY_ID[id] as ToolRole | "unknown",
      usage: "",
      custom: false,
    })),
    ...parseCustomTools(context)
      .filter((tool) => tool.name.trim())
      .map((tool) => ({
        id: tool.id,
        label: tool.name.trim(),
        role: tool.role,
        usage: tool.usage.trim(),
        custom: true,
      })),
  ];

  const rank = (role: ToolRole | "unknown") => {
    const i = TOOL_ROLE_ORDER.indexOf(role as ToolRole);
    return i === -1 ? TOOL_ROLE_ORDER.length : i;
  };
  entries.sort((a, b) => rank(a.role) - rank(b.role));

  const counts: Record<ToolRole | "unknown", number> = { platform: 0, connected: 0, data: 0, manual: 0, unknown: 0 };
  entries.forEach((e) => { counts[e.role] += 1; });

  const t = getScoringDict(locale).toolCatalog.verdicts;
  let verdict: string | null = null;
  if (entries.length > 0) {
    if (counts.platform > 0) {
      verdict = counts.platform === 1 ? t.hasPlatformSingular : t.hasPlatformPlural.replace("{n}", String(counts.platform));
    } else if (counts.connected > 0) {
      verdict = counts.connected === 1
        ? t.noPlatformButConnectedSingular
        : t.noPlatformButConnectedPlural.replace("{n}", String(counts.connected));
    } else {
      verdict = t.noPlatformNoApi;
    }
    if (counts.manual > 0) {
      verdict += " " + (counts.manual === 1 ? t.manualBrakeSingular : t.manualBrakePlural.replace("{n}", String(counts.manual)));
    }
  }

  return { entries, counts, verdict };
}

export type Answers = Record<string, number>;
export type Weights = Record<string, number>;
export type Context = Record<string, string>;

export type ProcessActivity = {
  id: string;
  label: string;
  actor: string;
  system: string;
  minutes: number;
  friction: string;
  /** Signaux factuels et observables (pas un jugement "est-ce automatisable ?") — l'utilisateur
   * décrit ce qu'il constate, l'outil en déduit l'automatisabilité, même principe que les leviers. */
  rulesBased: boolean;
  digitalData: boolean;
  frequentExceptions: boolean;
};

/** Le détail des étapes est optionnel : stocké comme JSON dans context.activities pour éviter
 * une colonne dédiée — cohérent avec les étiquettes/réglementations déjà stockées en texte délimité
 * dans ce même objet Context. Retourne toujours un tableau valide, même sur JSON corrompu, et
 * complète les champs manquants (données sauvegardées avant l'ajout de rulesBased/digitalData). */
export function parseActivities(context: Context): ProcessActivity[] {
  if (!context.activities) return [];
  try {
    const raw = JSON.parse(context.activities);
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((a): a is Record<string, unknown> => !!a && typeof a === "object" && typeof a.label === "string")
      .map((a) => ({
        id: typeof a.id === "string" ? a.id : "",
        label: a.label as string,
        actor: typeof a.actor === "string" ? a.actor : "",
        system: typeof a.system === "string" ? a.system : "",
        minutes: typeof a.minutes === "number" ? a.minutes : 0,
        friction: typeof a.friction === "string" ? a.friction : "",
        rulesBased: !!a.rulesBased,
        digitalData: !!a.digitalData,
        frequentExceptions: !!a.frequentExceptions,
      }));
  } catch {
    return [];
  }
}

export function serializeActivities(activities: ProcessActivity[]): string {
  return activities.length > 0 ? JSON.stringify(activities) : "";
}

export function totalActivityMinutes(activities: ProcessActivity[]): number {
  return activities.reduce((sum, a) => sum + (Number.isFinite(a.minutes) ? a.minutes : 0), 0);
}

export type QuickWin = { activityId: string; label: string; minutes: number; hasFrequentExceptions: boolean };

export type QuickWinsSummary = {
  items: QuickWin[];
  /** Libellés des outils "platform" déjà cochés dans l'inventaire (Power Automate, Zapier, Make…) —
   * ce sont les seuls outils qui permettent de construire soi-même une automatisation, sans
   * fournisseur externe. Vide si aucun n'est déclaré. */
  platformTools: string[];
};

/** Repère les étapes qui n'ont pas besoin d'un fournisseur d'automatisation pour progresser : même
 * signal que le tag "automatisable" de la liste d'étapes (règle stable + données numériques), mis en
 * regard de l'inventaire d'outils pour savoir si l'organisation peut déjà construire ça elle-même
 * (outil "platform" en place) ou si un outil simple suffit avant d'envisager un fournisseur. Les
 * exceptions fréquentes ne disqualifient pas l'étape : elles sont signalées comme réserve, pas comme
 * un frein absolu. */
export function getQuickWins(activities: ProcessActivity[], context: Context, locale: Locale = "fr"): QuickWinsSummary {
  const items = activities
    .filter((a) => a.label.trim() && a.rulesBased && a.digitalData)
    .map((a) => ({ activityId: a.id, label: a.label.trim(), minutes: a.minutes, hasFrequentExceptions: a.frequentExceptions }));
  const inventory = buildToolInventory(context, locale);
  const platformTools = inventory.entries.filter((e) => e.role === "platform").map((e) => e.label);
  return { items, platformTools };
}

/** Association optionnelle pièce jointe → étape documentée (chemin du fichier → id de l'étape),
 * stockée comme JSON dans context.attachmentLinks — même principe que context.activities. */
export function parseAttachmentLinks(context: Context): Record<string, string> {
  if (!context.attachmentLinks) return {};
  try {
    const raw = JSON.parse(context.attachmentLinks);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const out: Record<string, string> = {};
    for (const [path, activityId] of Object.entries(raw)) {
      if (typeof activityId === "string" && activityId) out[path] = activityId;
    }
    return out;
  } catch {
    return {};
  }
}

export function serializeAttachmentLinks(links: Record<string, string>): string {
  const cleaned = Object.fromEntries(Object.entries(links).filter(([, v]) => v));
  return Object.keys(cleaned).length > 0 ? JSON.stringify(cleaned) : "";
}

/** Instantané des valeurs suggérées par l'IA au moment où elles ont été appliquées (qid → valeur),
 * stocké comme JSON dans context.aiSeededAnswers. Comparé en direct à la réponse actuelle : tant
 * que les deux valeurs correspondent, la réponse reste « suggérée, non révisée par un humain » —
 * dès que l'utilisateur la modifie, la comparaison échoue naturellement et l'étiquette disparaît. */
export function parseAiSeededAnswers(context: Context): Record<string, number> {
  if (!context.aiSeededAnswers) return {};
  try {
    const raw = JSON.parse(context.aiSeededAnswers);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const out: Record<string, number> = {};
    for (const [qid, v] of Object.entries(raw)) {
      if (typeof v === "number") out[qid] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function serializeAiSeededAnswers(seeded: Record<string, number>): string {
  return Object.keys(seeded).length > 0 ? JSON.stringify(seeded) : "";
}

export type DimensionScore = Dimension & {
  score: number;
  rawScore: number;
  answered: number;
  adjustment: { delta: number; reason: string } | null;
};

export type DiagnosticResult = {
  dimScores: DimensionScore[];
  overall: number;
  level: LevelInfo;
  answeredCount: number;
  totalW: number;
};

type ContextCap = { dimId: string; capAt: number; reason: string };

/**
 * Plafonds déterministes sur le score d'un levier, dérivés du contexte déclaré : cases à cocher,
 * sélecteurs, ET une recherche de termes sensibles dans le texte libre (liste fixe, aucune IA).
 * Un plafond ne fait que corriger une auto-évaluation trop favorable ; il ne peut jamais faire
 * monter un score. Chaque plafond garde sa raison exacte, toujours visible — rien n'est deviné
 * ni caché dans le calcul. C'est le lien concret entre le contexte déclaré et le score d'aptitude.
 */
function contextCaps(context: Context, locale: Locale = "fr"): ContextCap[] {
  const dict = getScoringDict(locale).contextCaps;
  const caps: ContextCap[] = [];
  const regulations = regulationLabels(context, locale);
  if (regulations.length > 0) {
    caps.push({
      dimId: "risk",
      capAt: 70,
      reason: dict.regulationsDeclared.replace("{list}", regulations.join(", ")),
    });
  }
  const freeText = [context.objective, context.mainSteps, context.securityConstraints, context.internalPolicies, context.pain, context.exceptions]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const sensitiveHit = SENSITIVE_CONTEXT_TERMS.find((t) => freeText.includes(t));
  if (sensitiveHit) {
    caps.push({
      dimId: "risk",
      capAt: 70,
      reason: dict.sensitiveTerm.replace("{term}", sensitiveHit),
    });
  }
  if (context.volumeVariability === "imprevisible") {
    caps.push({ dimId: "vol", capAt: 60, reason: dict.volumeUnpredictable });
  }
  const activities = parseActivities(context).filter((a) => a.label.trim());
  if (activities.length > 0) {
    const ruleBasedCount = activities.filter((a) => a.rulesBased).length;
    if (ruleBasedCount / activities.length < 0.5) {
      caps.push({
        dimId: "rules",
        capAt: 60,
        reason: dict.rulesNotConstant.replace("{n}", String(ruleBasedCount)).replace("{total}", String(activities.length)),
      });
    }
    const digitalDataCount = activities.filter((a) => a.digitalData).length;
    if (digitalDataCount / activities.length < 0.5) {
      caps.push({
        dimId: "data",
        capAt: 60,
        reason: dict.dataNotDigital.replace("{n}", String(digitalDataCount)).replace("{total}", String(activities.length)),
      });
    }
    const exceptionCount = activities.filter((a) => a.frequentExceptions).length;
    if (exceptionCount / activities.length >= 0.5) {
      caps.push({
        dimId: "std",
        capAt: 60,
        reason: dict.frequentExceptions.replace("{n}", String(exceptionCount)).replace("{total}", String(activities.length)),
      });
    }
  }
  return caps;
}

export function diagnosticResult(answers: Answers, weights: Weights, context: Context = {}, locale: Locale = "fr"): DiagnosticResult {
  const caps = contextCaps(context, locale);
  const dimensions = getDimensions(locale);
  const dimScores: DimensionScore[] = dimensions.map((d) => {
    let num = 0, den = 0, cnt = 0;
    d.questions.forEach((q, i) => {
      const a = answers[`${d.id}-${i}`];
      if (a !== undefined) { num += a * q.w; den += 4 * q.w; cnt++; }
    });
    const rawScore = den ? Math.round((num / den) * 100) : 0;
    const applicable = cnt > 0 ? caps.filter((c) => c.dimId === d.id && rawScore > c.capAt) : [];
    const cap = applicable.length > 0 ? applicable.reduce((min, c) => (c.capAt < min.capAt ? c : min)) : undefined;
    const score = cap ? cap.capAt : rawScore;
    const adjustment = cap ? { delta: score - rawScore, reason: cap.reason } : null;
    return { ...d, score, rawScore, answered: cnt, adjustment };
  });
  const totalW = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  let num = 0, den = 0;
  dimScores.forEach((d) => { if (d.answered > 0) { num += d.score * weights[d.id]; den += weights[d.id]; } });
  const overall = den ? Math.round(num / den) : 0;
  const answeredCount = dimScores.reduce((s, d) => s + d.answered, 0);
  const levels = getLevels(locale);
  const level = levels[Math.min(4, Math.floor(overall / 20))] ?? levels[0];
  return { dimScores, overall, level, answeredCount, totalW };
}

/** Taux d'automatisation réaliste dérivé du score d'aptitude — un plafond, pas une garantie. */
export function suggestedAutoRate(aptitudeOverall: number): number {
  return clamp(Math.round(aptitudeOverall * 0.9), 5, 95);
}

export type ApproachId = "process_first" | "rpa" | "idp" | "agentic" | "hybrid";

export type ApproachRecommendation = {
  id: ApproachId;
  label: string;
  description: string;
  rationale: string[];
  criteria: string;
  caution: string | null;
};

// Détection de termes dans le texte libre saisi par l'utilisateur, qui peut être rédigé dans
// n'importe quelle langue indépendamment de la langue de l'interface — liste volontairement
// bilingue plutôt que conditionnée par la locale d'affichage.
const SENSITIVE_CONTEXT_TERMS = [
  "santé", "médical", "dossier patient", "rgpd", "loi 25", "données personnelles",
  "carte de crédit", "bancaire", "financier", "financière", "sin", "nas",
  "assurance sociale", "biométrique", "casier judiciaire", "mineur", "enfant",
  "immigration", "juridique", "conformité réglementaire",
  "health", "medical", "patient record", "gdpr", "bill 25", "personal data",
  "credit card", "banking", "financial", "ssn", "social insurance",
  "biometric", "criminal record", "minor", "child", "legal", "regulatory compliance",
];

const LOW_INTEGRATION_SYSTEM_TERMS = ["excel", "courriel", "email", "papier", "formulaire papier", "fax", "paper", "paper form"];
const HIGH_INTEGRATION_SYSTEM_TERMS = ["api", "erp", "crm", "connecteur", "connector", "intégration", "integration", "webhook", "sap", "salesforce", "dynamics"];

/** Rattache une justification concrète (outils nommés) à l'approche déjà choisie sur la base des scores. */
function systemsRationale(approachId: ApproachId, context?: Context, locale: Locale = "fr"): string | null {
  const systems = context?.systems?.trim();
  if (!systems) return null;
  const text = systems.toLowerCase();
  const low = LOW_INTEGRATION_SYSTEM_TERMS.some((t) => text.includes(t));
  const high = HIGH_INTEGRATION_SYSTEM_TERMS.some((t) => text.includes(t));
  const dict = getScoringDict(locale).systemsRationale;
  if (approachId === "idp" && low) {
    return dict.idp.replace("{systems}", systems);
  }
  if (approachId === "rpa" && high) {
    return dict.rpa.replace("{systems}", systems);
  }
  return null;
}

/**
 * Recommande un type d'automatisation à partir de la FORME du profil de leviers,
 * pas seulement de la moyenne globale — deux processus au même score global peuvent
 * appeler des approches très différentes (RPA vs IA agentique).
 */
export function recommendApproach(diag: DiagnosticResult, context?: Context, locale: Locale = "fr"): ApproachRecommendation | null {
  const { dimScores, overall, answeredCount } = diag;
  if (answeredCount === 0) return null;
  const dict = getScoringDict(locale);

  const score = (id: string) => dimScores.find((d) => d.id === id)?.score ?? 0;
  const std = score("std"), rules = score("rules"), data = score("data"), tech = score("tech"), risk = score("risk");
  const riskDim = dimScores.find((d) => d.id === "risk");
  const riskAnswered = (riskDim?.answered ?? 0) > 0;
  const caution =
    riskAnswered && risk < 40
      ? dict.cautionLowRisk.replace("{risk}", String(risk))
      : riskDim?.adjustment
      ? dict.cautionCapped.replace("{reason}", riskDim.adjustment.reason).replace("{risk}", String(risk))
      : null;

  let rec: ApproachRecommendation;

  if (overall < 35) {
    rec = {
      id: "process_first",
      label: dict.approach.processFirst.label,
      description: dict.approach.processFirst.description,
      rationale: [dict.approach.processFirst.rationale.replace("{overall}", String(overall))],
      criteria: dict.approach.processFirst.criteria,
      caution,
    };
  } else if (rules >= 55 && std >= 55 && data >= 55) {
    rec = {
      id: "rpa",
      label: dict.approach.rpa.label,
      description: dict.approach.rpa.description,
      rationale: [
        dict.approach.rpa.rationale1.replace("{rules}", String(rules)),
        dict.approach.rpa.rationale2.replace("{std}", String(std)),
        dict.approach.rpa.rationale3.replace("{data}", String(data)),
      ],
      criteria: dict.approach.rpa.criteria,
      caution,
    };
  } else if (data < 55 && std >= 45 && tech >= 45) {
    rec = {
      id: "idp",
      label: dict.approach.idp.label,
      description: dict.approach.idp.description,
      rationale: [
        dict.approach.idp.rationale1.replace("{data}", String(data)),
        dict.approach.idp.rationale2.replace("{std}", String(std)),
      ],
      criteria: dict.approach.idp.criteria,
      caution,
    };
  } else if (rules < 55 && data >= 45 && tech >= 45) {
    rec = {
      id: "agentic",
      label: dict.approach.agentic.label,
      description: dict.approach.agentic.description,
      rationale: [
        dict.approach.agentic.rationale1.replace("{rules}", String(rules)),
        dict.approach.agentic.rationale2.replace("{data}", String(data)),
      ],
      criteria: dict.approach.agentic.criteria,
      caution,
    };
  } else {
    rec = {
      id: "hybrid",
      label: dict.approach.hybrid.label,
      description: dict.approach.hybrid.description,
      rationale: [
        dict.approach.hybrid.rationale1.replace("{rules}", String(rules)),
        dict.approach.hybrid.rationale2.replace("{data}", String(data)),
        dict.approach.hybrid.rationale3.replace("{std}", String(std)),
      ],
      criteria: dict.approach.hybrid.criteria,
      caution,
    };
  }

  const sysNote = systemsRationale(rec.id, context, locale);
  if (sysNote) rec.rationale = [...rec.rationale, sysNote];
  return rec;
}

/** Libellés des champs de contexte qui ont changé depuis la dernière sauvegarde — signal de dérive à réévaluer. */
export function contextDiff(current: Context, previous: Context, locale: Locale = "fr"): string[] {
  const questions = getContextQuestions(locale);
  const diffs = questions.filter(
    (q) => (current[q.id] || "").trim() !== (previous[q.id] || "").trim()
  ).map((q) => q.label);
  if ((current.category || "") !== (previous.category || "")) diffs.unshift(getScoringDict(locale).categoryLabel);
  return diffs;
}

export type AssessmentConfidence = { label: "Faible" | "Moyenne" | "Élevée"; reasons: string[] };

/** Traduit le label toujours-français de AssessmentConfidence pour l'affichage, sans changer
 * la valeur sémantique comparée ailleurs via `===`. */
export function confidenceLabelDisplay(label: AssessmentConfidence["label"], locale: Locale = "fr"): string {
  const dict = getScoringDict(locale).confidence;
  return { Faible: dict.labelFaible, Moyenne: dict.labelMoyenne, Élevée: dict.labelElevee }[label];
}

/**
 * Signal de rigueur méthodologique de l'évaluation, pas un score de qualité du processus.
 * Plafonné à "Moyenne" sans triangulation : une auto-évaluation individuelle seule ne peut
 * pas prétendre à "Élevée". Un deuxième avis indépendant et convergent (écart ≤ 15 pts sur
 * un diagnostic ≥ 80% répondu) est la seule chose qui permet d'y accéder.
 */
export function assessmentConfidence(
  diag: DiagnosticResult,
  context: Context,
  answers: Answers,
  aiUsed: boolean,
  secondOpinions: { answeredCount: number; overall: number }[] = [],
  locale: Locale = "fr"
): AssessmentConfidence {
  // `label` reste toujours en français : c'est un identifiant sémantique comparé ailleurs
  // (ex. `confidence.label === "Élevée"`), pas seulement un texte affiché. Seul `reasons`
  // (liste affichée telle quelle) est traduit — voir la note équivalente sur adoptionEase.
  const dict = getScoringDict(locale).confidence;
  const questions = getContextQuestions(locale);
  const totalQ = DIMENSIONS.reduce((s, d) => s + d.questions.length, 0);
  const diagComplete = diag.answeredCount >= totalQ;
  const contextFilled = questions.filter((q) => (context[q.id] || "").trim()).length;
  const detailedThreshold = Math.ceil(questions.length * 0.45);
  const moderateThreshold = Math.ceil(questions.length * 0.35);
  const stepsDocumented = parseActivities(context).some((a) => a.label.trim());
  const aiSeeded = parseAiSeededAnswers(context);
  const unconfirmedAiCount = Object.keys(aiSeeded).filter((qid) => aiSeeded[qid] === answers[qid]).length;
  const convergingOpinion = secondOpinions.find(
    (o) => o.answeredCount >= Math.ceil(totalQ * 0.8) && Math.abs(o.overall - diag.overall) <= 15
  );

  const contextStatus = contextFilled >= detailedThreshold ? dict.contextDetailed : contextFilled > 0 ? dict.contextPartial : dict.contextNone;

  const reasons = [
    diagComplete ? dict.diagCompleteYes : dict.diagCompletePartial.replace("{n}", String(diag.answeredCount)),
    dict.contextLine.replace("{status}", contextStatus).replace("{n}", String(contextFilled)).replace("{total}", String(questions.length)),
    stepsDocumented ? dict.stepsYes : dict.stepsNo,
    aiUsed ? dict.aiYes : dict.aiNo,
    ...(unconfirmedAiCount > 0 ? [dict.unconfirmedAi.replace("{n}", String(unconfirmedAiCount))] : []),
    secondOpinions.length > 0
      ? dict.secondOpinions.replace("{n}", String(secondOpinions.length)).replace("{converging}", convergingOpinion ? dict.convergingSuffix : "")
      : dict.singleRespondent,
  ];

  const baseEligible = diagComplete && contextFilled >= moderateThreshold && stepsDocumented && unconfirmedAiCount === 0;
  const label: AssessmentConfidence["label"] = baseEligible && convergingOpinion ? "Élevée" : baseEligible ? "Moyenne" : "Faible";
  return { label, reasons };
}

export type AdoptionEase = { label: "Faible" | "Modérée" | "Élevée"; reasons: string[] };

/** Traduit le label toujours-français de AdoptionEase pour l'affichage, sans changer la valeur
 * sémantique comparée ailleurs via `===`. */
export function adoptionLabelDisplay(label: AdoptionEase["label"], locale: Locale = "fr"): string {
  const dict = getScoringDict(locale).adoption;
  return { Faible: dict.labelFaible, Modérée: dict.labelModeree, Élevée: dict.labelElevee }[label];
}

/**
 * Estime la facilité d'adoption par les utilisateurs finaux — distincte de l'aptitude
 * technique à automatiser. Dérivée de signaux déjà connus (standardisation, risque,
 * exceptions, nombre d'intervenants), pas d'une nouvelle saisie.
 */
export function adoptionEase(diag: DiagnosticResult, context: Context, approach: ApproachRecommendation | null, locale: Locale = "fr"): AdoptionEase {
  // `label` reste toujours en français (identifiant sémantique) — même note que assessmentConfidence.
  const dict = getScoringDict(locale).adoption;
  if (diag.answeredCount === 0) return { label: "Faible", reasons: [dict.incomplete] };

  const score = (id: string) => diag.dimScores.find((d) => d.id === id)?.score ?? 0;
  const std = score("std");
  const risk = score("risk");
  const actorCount = (context.actors || "").split(/[,;]/).map((s) => s.trim()).filter(Boolean).length;
  const hasExceptions = !!context.exceptions?.trim();

  let points = 0;
  const reasons: string[] = [];

  if (std >= 60) {
    points++;
    reasons.push(dict.stdHighYes);
  } else {
    reasons.push(dict.stdHighNo);
  }

  if (risk >= 60) {
    points++;
    reasons.push(dict.riskLowYes);
  } else {
    reasons.push(dict.riskLowNo);
  }

  if (!hasExceptions) {
    points++;
  } else {
    reasons.push(dict.exceptionsFrequent);
  }

  if (actorCount > 0 && actorCount <= 3) {
    points++;
  } else if (actorCount > 3) {
    reasons.push(dict.manyActors.replace("{n}", String(actorCount)));
  }

  if (approach?.id === "agentic") {
    reasons.push(dict.agenticNote);
  }

  const label: AdoptionEase["label"] = points >= 3 ? "Élevée" : points >= 2 ? "Modérée" : "Faible";
  return { label, reasons: reasons.slice(0, 4) };
}

export type SavingsRealization = "reduction" | "reallocation" | "none";

/**
 * Combien des heures libérées se traduisent réellement en dollars économisés — pas juste en
 * capacité libérée. Une heure libérée ne devient un dollar économisé que si le poste est réduit
 * ou si cette heure est redéployée vers un travail qui génère de la valeur ; sinon, c'est de la
 * capacité libérée, pas une économie. Les facteurs ne sont pas mesurés empiriquement — ce sont des
 * repères prudents, à ajuster une fois l'issue réelle connue.
 */
export const SAVINGS_REALIZATION_FACTORS: Record<SavingsRealization, number> = {
  reduction: 1,
  reallocation: 0.5,
  none: 0.15,
};

export type RoiInputs = {
  volume: number;
  minutes: number;
  hourlyCost: number;
  errorRate: number;
  reworkMin: number;
  autoRate: number;
  implCost: number;
  licenseCost: number;
  maintenancePct: number;
  changeMgmtCost: number;
  discount: number;
  savingsRealization: SavingsRealization;
};

/** Estimation IA d'un sous-ensemble de RoiInputs à partir du contexte qualitatif — un point de départ, pas une mesure. */
export type RoiSuggestion = {
  volume: number;
  minutes: number;
  hourlyCost: number;
  errorRate: number;
  reworkMin: number;
  note: string;
};

export type AnalysisResult = {
  synthese: string;
  risques: string[];
  scores: Record<string, number>;
  leviers: Record<string, string>;
  roiSuggestion: RoiSuggestion | null;
};

/** Un processus du portefeuille de l'organisation, pour le classement comparatif dans le rapport PDF. */
export type PortfolioEntry = { id: string; name: string; A: number; V: number };

/** Profil détaillé par levier d'un processus du portefeuille, pour la carte de chaleur comparative. */
export type PortfolioLeverRow = { id: string; name: string; scores: Record<string, number> };

export type RoiResult = {
  currentH: number;
  currentCost: number;
  normalCost: number;
  reworkCost: number;
  savedH: number;
  laborSavings: number;
  realizedSavings: number;
  maintenanceCost: number;
  netRecurring: number;
  totalUpfrontCost: number;
  fte: number;
  payback: number | null;
  npv: number;
  cash: { m: number; cum: number }[];
  valueScore: number;
};

/** Horizon standard d'analyse du ROI (VAN, trésorerie cumulée) — 5 ans, usage courant en évaluation de projet. */
export const ROI_HORIZON_YEARS = 5;

/**
 * `hoursPerFte`/`magnitudeRef` sont calibrables par organisation (organizations.constants) —
 * une PME et une entreprise n'ont pas le même repère pour juger si une économie est « élevée ».
 * Les valeurs par défaut (HOURS_PER_FTE, 120 000) s'appliquent hors contexte d'organisation
 * (page vitrine, rapport d'exemple).
 */
export function roiResult(inputs: RoiInputs, hoursPerFte: number = HOURS_PER_FTE, magnitudeRef: number = 120000): RoiResult {
  const occYr = inputs.volume * 12;
  const normalH = (occYr * inputs.minutes) / 60;
  const reworkH = (occYr * (inputs.errorRate / 100) * inputs.reworkMin) / 60;
  const currentH = normalH + reworkH;
  const normalCost = normalH * inputs.hourlyCost;
  const reworkCost = reworkH * inputs.hourlyCost;
  const currentCost = currentH * inputs.hourlyCost;
  const savedH = currentH * (inputs.autoRate / 100);
  const laborSavings = savedH * inputs.hourlyCost;
  const realizationFactor = SAVINGS_REALIZATION_FACTORS[inputs.savingsRealization ?? "reallocation"];
  const realizedSavings = laborSavings * realizationFactor;
  const maintenanceCost = inputs.implCost * ((inputs.maintenancePct ?? 0) / 100);
  const netRecurring = realizedSavings - inputs.licenseCost - maintenanceCost;
  // Formation et conduite du changement : coût unique à l'adoption, distinct de la maintenance récurrente.
  const totalUpfrontCost = inputs.implCost + (inputs.changeMgmtCost ?? 0);
  const fte = savedH / hoursPerFte;
  const monthlyNet = netRecurring / 12;
  const payback = monthlyNet > 0 ? totalUpfrontCost / monthlyNet : null;
  const d = inputs.discount / 100;
  let npv = -totalUpfrontCost;
  for (let y = 1; y <= ROI_HORIZON_YEARS; y++) npv += netRecurring / Math.pow(1 + d, y);
  const cash: { m: number; cum: number }[] = [];
  for (let m = 0; m <= ROI_HORIZON_YEARS * 12; m += 3) cash.push({ m, cum: Math.round(-totalUpfrontCost + monthlyNet * m) });
  const paybackScore = (netRecurring <= 0 || payback == null) ? 5 : clamp(Math.round(100 - (payback - 3) * 3.2), 10, 100);
  const magnitudeScore = clamp(Math.round((100 * netRecurring) / magnitudeRef), 5, 100);
  const valueScore = netRecurring <= 0 ? 5 : Math.round(0.55 * paybackScore + 0.45 * magnitudeScore);
  return { currentH, currentCost, normalCost, reworkCost, savedH, laborSavings, realizedSavings, maintenanceCost, netRecurring, totalUpfrontCost, fte, payback, npv, cash, valueScore };
}

export type PrioritizationQuadrant = "automate" | "plan" | "prepare" | "setAside";

/** Quadrant de la matrice Valeur × Aptitude pour un point (aptitude, valeur) donné, par rapport
 * au seuil de priorisation de l'organisation — même règle des deux côtés de la matrice visuelle
 * (Matrix.tsx) et du verdict textuel (Prioritisation.tsx) : un seul endroit qui décide de la
 * frontière, pour que le dessin et le texte ne puissent jamais diverger. */
export function prioritizationQuadrant(aptitude: number, value: number, threshold = 50): PrioritizationQuadrant {
  if (aptitude >= threshold && value >= threshold) return "automate";
  if (aptitude >= threshold && value < threshold) return "plan";
  if (aptitude < threshold && value >= threshold) return "prepare";
  return "setAside";
}

export type RoiScenarioId = "conservative" | "likely" | "optimistic";

export const ROI_SCENARIOS: { id: RoiScenarioId; label: string; factor: number }[] = [
  { id: "conservative", label: "Prudent", factor: 0.7 },
  { id: "likely", label: "Probable", factor: 1 },
  { id: "optimistic", label: "Optimiste", factor: 1.2 },
];

/** Variante consciente de la langue de ROI_SCENARIOS. */
export function getRoiScenarios(locale: Locale = "fr"): { id: RoiScenarioId; label: string; factor: number }[] {
  const dict = getScoringDict(locale).roiScenarios;
  return ROI_SCENARIOS.map((s) => ({ id: s.id, label: dict[s.id], factor: s.factor }));
}

/** Rejoue le ROI en faisant varier le taux d'automatisable — l'hypothèse la plus incertaine. */
export function roiScenarios(
  inputs: RoiInputs,
  hoursPerFte: number = HOURS_PER_FTE,
  magnitudeRef: number = 120000
): Record<RoiScenarioId, RoiResult> {
  return Object.fromEntries(
    ROI_SCENARIOS.map((s) => [
      s.id,
      roiResult({ ...inputs, autoRate: clamp(Math.round(inputs.autoRate * s.factor), 0, 100) }, hoursPerFte, magnitudeRef),
    ])
  ) as Record<RoiScenarioId, RoiResult>;
}

export type SensitivityRow = { key: string; label: string; low: number; high: number; range: number };

type NumericRoiInputKey = Exclude<keyof RoiInputs, "savingsRealization">;

const SENSITIVITY_VARS: { key: NumericRoiInputKey; label: string }[] = [
  { key: "volume", label: "Volume" },
  { key: "minutes", label: "Temps manuel" },
  { key: "hourlyCost", label: "Coût horaire" },
  { key: "errorRate", label: "Taux d'erreur" },
  { key: "autoRate", label: "Part automatisable" },
  { key: "implCost", label: "Mise en œuvre" },
];

/**
 * Analyse de sensibilité (tornado) : fait varier chaque hypothèse de ±20% indépendamment des autres
 * et mesure l'effet sur les économies nettes récurrentes. Trié par amplitude d'impact décroissante —
 * l'hypothèse à valider en priorité apparaît en premier.
 */
export function roiSensitivity(inputs: RoiInputs, deltaPct = 20, locale: Locale = "fr"): SensitivityRow[] {
  const dict = getScoringDict(locale).sensitivityVars;
  const vars = SENSITIVITY_VARS.map((v) => ({ key: v.key, label: dict[v.key as keyof typeof dict] }));
  const rows = vars.map(({ key, label }) => {
    const base = inputs[key];
    const low = roiResult({ ...inputs, [key]: base * (1 - deltaPct / 100) }).netRecurring;
    const high = roiResult({ ...inputs, [key]: base * (1 + deltaPct / 100) }).netRecurring;
    return {
      key,
      label,
      low: Math.min(low, high),
      high: Math.max(low, high),
      range: Math.abs(high - low),
    };
  });
  return rows.sort((a, b) => b.range - a.range);
}

export const DEFAULT_WEIGHTS: Weights = Object.fromEntries(DIMENSIONS.map((d) => [d.id, d.weight]));

export const DEFAULT_ROI_INPUTS: RoiInputs = {
  volume: 400, minutes: 25, hourlyCost: 55, errorRate: 8, reworkMin: 20,
  autoRate: 70, implCost: 25000, licenseCost: 3000, maintenancePct: 15, changeMgmtCost: 5000, discount: 8,
  savingsRealization: "reallocation",
};

export const PROCESS_CATEGORIES = [
  { id: "finance", label: "Finance & comptabilité" },
  { id: "hr", label: "Ressources humaines" },
  { id: "customer_service", label: "Service à la clientèle" },
  { id: "procurement", label: "Achats & approvisionnement" },
  { id: "sales", label: "Ventes & CRM" },
  { id: "it_ops", label: "TI & opérations" },
  { id: "legal_compliance", label: "Juridique & conformité" },
  { id: "supply_chain", label: "Chaîne logistique" },
  { id: "other", label: "Autre" },
] as const;
export type ProcessCategoryId = (typeof PROCESS_CATEGORIES)[number]["id"];

/** Variante consciente de la langue de PROCESS_CATEGORIES. */
export function getProcessCategories(locale: Locale = "fr"): { id: ProcessCategoryId; label: string }[] {
  const dict = getScoringDict(locale).processCategories;
  return PROCESS_CATEGORIES.map((c) => ({ id: c.id, label: dict[c.id as keyof typeof dict] }));
}
