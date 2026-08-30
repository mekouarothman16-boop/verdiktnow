import React, { useState, useMemo } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, ReferenceLine, Tooltip, CartesianGrid,
} from "recharts";
import { Gauge, Calculator, LayoutGrid, Printer, Info, ArrowUpRight, SlidersHorizontal, FileText, Sparkles, Loader2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Tokens                                                             */
/* ------------------------------------------------------------------ */
const t = {
  bg: "#FAFAF8", surface: "#FFFFFF", ink: "#10201B", inkSoft: "#5B655F", inkFaint: "#9AA19B",
  line: "#EAEBE7", lineSoft: "#F1F2EE", accent: "#0C6E5A", accentDeep: "#084A3D", accentSoft: "#EAF3F0",
  amber: "#DCA13A", olive: "#8AA23F", coral: "#D0654A",
  sans: "'Hanken Grotesk', system-ui, sans-serif", mono: "'IBM Plex Mono', ui-monospace, monospace",
  shadow: "0 1px 2px rgba(16,32,27,.04), 0 6px 20px rgba(16,32,27,.05)",
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* aptitude tiers (process-level) */
const LEVELS = [
  { n: 1, label: "Peu adapté", color: "#D0654A", note: "Ce processus se prête mal à l'automatisation en l'état." },
  { n: 2, label: "Adaptation limitée", color: "#DCA13A", note: "Automatisation partielle envisageable après préparation." },
  { n: 3, label: "Candidat modéré", color: "#8AA23F", note: "Automatisable moyennant quelques ajustements." },
  { n: 4, label: "Bon candidat", color: "#3E9B7E", note: "Ce processus est bien adapté à l'automatisation." },
  { n: 5, label: "Candidat idéal", color: "#0C6E5A", note: "Ce processus réunit des conditions idéales d'automatisation." },
];

/* process-level automatability levers */
const DIMENSIONS = [
  {
    id: "std", label: "Standardisation & stabilité", short: "Standard.", weight: 25,
    reco: "Stabilisez et documentez ce processus avant de l'automatiser : un déroulement variable se prête mal à l'automatisation.",
    questions: [
      { text: "Ce processus est documenté et suit un déroulement stable.", w: 2 },
      { text: "Les étapes sont exécutées de façon homogène d'une fois à l'autre.", w: 1.5 },
      { text: "Les exceptions sont rares ou clairement balisées.", w: 1.5 },
      { text: "Le processus évolue peu dans le temps (faible volatilité).", w: 2 },
      { text: "Tous les intervenants suivent la même procédure.", w: 1 },
    ],
  },
  {
    id: "rules", label: "Règles & décisions", short: "Règles", weight: 22,
    reco: "Explicitez les règles de décision : tant que le jugement humain domine, l'automatisation restera partielle.",
    questions: [
      { text: "Les décisions reposent sur des règles explicites, pas sur du jugement.", w: 2 },
      { text: "Les cas de figure possibles sont connus et en nombre fini.", w: 1.5 },
      { text: "Peu d'interventions humaines discrétionnaires sont requises.", w: 2 },
      { text: "Les critères de validation sont formalisés.", w: 1.5 },
      { text: "Les enchaînements de décision sont reproductibles.", w: 1 },
    ],
  },
  {
    id: "data", label: "Données & intrants", short: "Données", weight: 20,
    reco: "Rendez les intrants numériques, structurés et accessibles ; sans données fiables en entrée, l'automatisation reste fragile.",
    questions: [
      { text: "Les intrants du processus sont numériques (non papier).", w: 2 },
      { text: "Les données nécessaires sont accessibles au bon moment.", w: 2 },
      { text: "Les intrants sont structurés et normalisés.", w: 1.5 },
      { text: "La qualité des données en entrée est fiable.", w: 1.5 },
      { text: "Peu de ressaisie manuelle est nécessaire.", w: 1 },
    ],
  },
  {
    id: "vol", label: "Volume & répétitivité", short: "Volume", weight: 18,
    reco: "Le volume ou la répétitivité sont faibles : vérifiez que le gain justifie l'effort, ou regroupez avec des processus voisins.",
    questions: [
      { text: "Le processus se répète fréquemment.", w: 2 },
      { text: "Le volume traité est élevé.", w: 1.5 },
      { text: "Le temps cumulé consacré à ce processus est important.", w: 1.5 },
      { text: "Les tâches sont répétitives et prévisibles.", w: 1.5 },
      { text: "Les pics de charge sont récurrents.", w: 1 },
    ],
  },
  {
    id: "tech", label: "Faisabilité technique", short: "Techno.", weight: 15,
    reco: "Levez les contraintes techniques (intégration, sécurité) et validez la faisabilité avec l'équipe TI avant de vous engager.",
    questions: [
      { text: "Les systèmes impliqués offrent des points d'intégration (API, connecteurs).", w: 2 },
      { text: "Aucun blocage technique majeur n'est anticipé.", w: 1.5 },
      { text: "La sécurité et la conformité permettent l'automatisation.", w: 1.5 },
      { text: "Les outils requis sont disponibles ou accessibles.", w: 1.5 },
      { text: "Le déploiement se ferait sans lourdeur excessive.", w: 1 },
    ],
  },
];

const LIKERT = [
  { v: 0, label: "Pas du tout" }, { v: 1, label: "Peu" }, { v: 2, label: "En partie" },
  { v: 3, label: "En grande partie" }, { v: 4, label: "Totalement" },
];
const CURRENCIES = { CAD: { symbol: "$", locale: "fr-CA" }, MAD: { symbol: "DH", locale: "fr-MA" } };
const HOURS_PER_FTE = 1600;

/* free-text context — qualitative, éclaire l'évaluation et le rapport */
const CONTEXT_QUESTIONS = [
  { id: "desc", label: "Description du processus", placeholder: "Objectif, déclencheur, résultat attendu, étapes principales…", long: true },
  { id: "systems", label: "Systèmes et applications utilisés", placeholder: "Ex. courriel, Excel, système X, portail Y…", long: false },
  { id: "actors", label: "Intervenants et rôles", placeholder: "Qui fait quoi dans le processus…", long: false },
  { id: "pain", label: "Irritants et points de douleur actuels", placeholder: "Ce qui ralentit, coûte du temps ou génère des erreurs…", long: true },
  { id: "exceptions", label: "Exceptions et cas particuliers fréquents", placeholder: "Les variantes qui sortent du cas standard…", long: true },
  { id: "constraints", label: "Contraintes (réglementaires, sécurité, conformité)", placeholder: "Règles à respecter, données sensibles, obligations légales…", long: true },
];

/* ------------------------------------------------------------------ */
/*  Pure scoring (shared by all modules)                               */
/* ------------------------------------------------------------------ */
function diagnosticResult(answers, weights) {
  const dimScores = DIMENSIONS.map((d) => {
    let num = 0, den = 0, cnt = 0;
    d.questions.forEach((q, i) => {
      const a = answers[`${d.id}-${i}`];
      if (a !== undefined) { num += a * q.w; den += 4 * q.w; cnt++; }
    });
    return { ...d, score: den ? Math.round((num / den) * 100) : 0, answered: cnt };
  });
  const totalW = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  let num = 0, den = 0;
  dimScores.forEach((d) => { if (d.answered > 0) { num += d.score * weights[d.id]; den += weights[d.id]; } });
  const overall = den ? Math.round(num / den) : 0;
  const answeredCount = dimScores.reduce((s, d) => s + d.answered, 0);
  const level = LEVELS[Math.min(4, Math.floor(overall / 20))] || LEVELS[0];
  return { dimScores, overall, level, answeredCount, totalW };
}

function roiResult(inputs) {
  const occYr = inputs.volume * 12;
  const currentH = (occYr * inputs.minutes) / 60 + (occYr * (inputs.errorRate / 100) * inputs.reworkMin) / 60;
  const currentCost = currentH * inputs.hourlyCost;
  const savedH = currentH * (inputs.autoRate / 100);
  const laborSavings = savedH * inputs.hourlyCost;
  const netRecurring = laborSavings - inputs.licenseCost;
  const fte = savedH / HOURS_PER_FTE;
  const monthlyNet = netRecurring / 12;
  const payback = monthlyNet > 0 ? inputs.implCost / monthlyNet : null;
  const d = inputs.discount / 100;
  let npv = -inputs.implCost;
  for (let y = 1; y <= 3; y++) npv += netRecurring / Math.pow(1 + d, y);
  const cash = [];
  for (let m = 0; m <= 36; m += 3) cash.push({ m, cum: Math.round(-inputs.implCost + monthlyNet * m) });
  // value score (0-100): blend of payback efficiency + savings magnitude
  const paybackScore = (netRecurring <= 0 || payback == null) ? 5 : clamp(Math.round(100 - (payback - 3) * 3.2), 10, 100);
  const magnitudeScore = clamp(Math.round((100 * netRecurring) / 120000), 5, 100);
  const valueScore = netRecurring <= 0 ? 5 : Math.round(0.55 * paybackScore + 0.45 * magnitudeScore);
  return { currentH, currentCost, savedH, laborSavings, netRecurring, fte, payback, npv, cash, valueScore };
}

/* ------------------------------------------------------------------ */
/*  Shared UI                                                          */
/* ------------------------------------------------------------------ */
function Eyebrow({ children, style }) {
  return <div style={{ fontFamily: t.mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: t.inkFaint, fontWeight: 500, ...style }}>{children}</div>;
}
function Card({ children, style, className }) {
  return <div className={className} style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 12, boxShadow: t.shadow, ...style }}>{children}</div>;
}
function Hero({ eyebrow, title, sub }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
        <span style={{ width: 22, height: 2, background: t.accent, borderRadius: 2 }} />
        <Eyebrow>{eyebrow}</Eyebrow>
      </div>
      <h1 style={{ fontFamily: t.sans, fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", color: t.ink, margin: "0 0 8px", lineHeight: 1.1 }}>{title}</h1>
      <p style={{ color: t.inkSoft, fontSize: 15, lineHeight: 1.6, maxWidth: 580, margin: 0 }}>{sub}</p>
    </div>
  );
}
function GaugeArc({ score, level, caption }) {
  const path = "M18 104 A 92 92 0 0 1 202 104";
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg viewBox="0 0 220 116" style={{ width: "100%", display: "block" }}>
        <path d={path} fill="none" stroke={t.lineSoft} strokeWidth={15} strokeLinecap="round" />
        <path d={path} fill="none" stroke={level.color} strokeWidth={15} strokeLinecap="round" pathLength={100} strokeDasharray={100} strokeDashoffset={100 - score} style={{ transition: "stroke-dashoffset .6s cubic-bezier(.22,1,.36,1), stroke .3s ease" }} />
        <text x="18" y="114" fontFamily={t.mono} fontSize="10" fill={t.inkFaint} textAnchor="middle">0</text>
        <text x="202" y="114" fontFamily={t.mono} fontSize="10" fill={t.inkFaint} textAnchor="middle">100</text>
      </svg>
      <div style={{ position: "absolute", top: "42%", left: 0, right: 0, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 3 }}>
          <span style={{ fontFamily: t.mono, fontSize: 44, fontWeight: 600, color: t.ink, lineHeight: 1 }}>{score}</span>
          <span style={{ fontFamily: t.mono, fontSize: 15, color: t.inkFaint }}>/100</span>
        </div>
        {caption && <div style={{ fontSize: 10.5, color: t.inkFaint, marginTop: 2 }}>{caption}</div>}
      </div>
    </div>
  );
}

function ContextSection({ context, setContext, setAnswers, processName }) {
  const set = (id, v) => setContext((p) => ({ ...p, [id]: v }));
  const filled = CONTEXT_QUESTIONS.filter((q) => (context[q.id] || "").trim()).length;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const analyze = async () => {
    setLoading(true); setError(null); setAnalysis(null);
    const qlist = DIMENSIONS.map((d) => `## ${d.label} (${d.id})\n` + d.questions.map((q, i) => `- ${d.id}-${i} : ${q.text}`).join("\n")).join("\n\n");
    const ctx = CONTEXT_QUESTIONS.map((q) => `${q.label} : ${(context[q.id] || "").trim() || "—"}`).join("\n");
    const prompt = `Tu es un expert Lean Six Sigma en automatisation des processus. On évalue l'aptitude d'un processus à être automatisé.

Processus : ${processName || "—"}
${ctx}

À partir de ce contexte, propose une évaluation de DÉPART pour chaque énoncé, de 0 (pas du tout) à 4 (totalement) :

${qlist}

Réponds UNIQUEMENT avec un JSON valide, sans texte ni balises Markdown autour, de la forme exacte :
{"synthese":"2 à 3 phrases sur l'aptitude globale","risques":["risque 1","risque 2","risque 3"],"scores":{"std-0":3,"std-1":2, ... un entier 0-4 pour CHAQUE identifiant d'énoncé listé},"leviers":{"std":"justification courte","rules":"...","data":"...","vol":"...","tech":"..."}}
Si le contexte est insuffisant pour un énoncé, donne une estimation prudente. N'invente aucun fait absent du contexte.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      const txt = (data.content || []).filter((i) => i.type === "text").map((i) => i.text).join("");
      const parsed = JSON.parse(txt.replace(/```json|```/g, "").trim());
      setAnalysis(parsed);
    } catch (e) {
      setError("L'analyse a échoué. Réessayez dans un instant.");
    } finally { setLoading(false); }
  };

  const applyScores = () => {
    if (!analysis || !analysis.scores) return;
    const clean = {};
    DIMENSIONS.forEach((d) => d.questions.forEach((_, i) => {
      const k = `${d.id}-${i}`, v = analysis.scores[k];
      if (typeof v === "number") clean[k] = clamp(Math.round(v), 0, 4);
    }));
    setAnswers((prev) => ({ ...prev, ...clean }));
  };

  const leverPreview = analysis && analysis.scores ? DIMENSIONS.map((d) => {
    const vals = d.questions.map((_, i) => analysis.scores[`${d.id}-${i}`]).filter((v) => typeof v === "number");
    const avg = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length / 4) * 100) : null;
    return { id: d.id, label: d.label, avg, comment: analysis.leviers ? analysis.leviers[d.id] : null };
  }) : [];

  return (
    <Card style={{ padding: 24, marginBottom: 24 }}>
      <div className="print-header" style={{ display: "none", marginBottom: 10 }}><Eyebrow>CADRAN · Contexte du processus</Eyebrow></div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FileText size={14} color={t.accent} /><Eyebrow>Contexte du processus</Eyebrow>
        </div>
        <span style={{ fontFamily: t.mono, fontSize: 11, color: t.inkFaint }}>{filled}/{CONTEXT_QUESTIONS.length} renseignés</span>
      </div>
      <p style={{ fontSize: 12.5, color: t.inkSoft, margin: "6px 0 18px", lineHeight: 1.5, maxWidth: 640 }}>
        Décrivez le processus avant de le noter. Ces éléments qualitatifs éclairent votre évaluation des leviers et accompagnent le rapport exporté.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {CONTEXT_QUESTIONS.map((q) => (
          <label key={q.id} style={{ display: "block", gridColumn: q.long ? "1 / -1" : "auto" }}>
            <span style={{ fontSize: 12.5, color: t.inkSoft, display: "block", marginBottom: 6 }}>{q.label}</span>
            <textarea value={context[q.id] || ""} onChange={(e) => set(q.id, e.target.value)} placeholder={q.placeholder} rows={q.long ? 3 : 2} className="cad-input"
              style={{ width: "100%", border: `1px solid ${t.line}`, borderRadius: 8, padding: "10px 11px", fontFamily: t.sans, fontSize: 13.5, color: t.ink, outline: "none", resize: "vertical", lineHeight: 1.5, background: t.surface }} />
          </label>
        ))}
      </div>

      <div className="no-print" style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${t.lineSoft}`, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <button className="cad-btn" onClick={analyze} disabled={loading || filled === 0}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 8, cursor: (loading || filled === 0) ? "not-allowed" : "pointer", border: `1px solid ${(loading || filled === 0) ? t.line : t.accent}`, background: (loading || filled === 0) ? t.lineSoft : t.accentSoft, color: (loading || filled === 0) ? t.inkFaint : t.accentDeep, fontFamily: t.sans, fontSize: 13.5, fontWeight: 600 }}>
          {loading ? <Loader2 size={15} className="cad-spin" /> : <Sparkles size={15} />}
          {loading ? "Analyse en cours…" : "Analyser le contexte avec l'IA"}
        </button>
        {filled === 0 && <span style={{ fontSize: 11.5, color: t.inkFaint }}>Renseignez au moins un champ.</span>}
      </div>
      {error && <div style={{ marginTop: 12, fontSize: 12.5, color: t.coral }} className="no-print">{error}</div>}

      {analysis && (
        <div className="no-print" style={{ marginTop: 16, border: `1px solid ${t.accentSoft}`, background: "linear-gradient(180deg,#F3F9F7,#FFFFFF)", borderRadius: 10, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Sparkles size={14} color={t.accent} /><Eyebrow>Lecture assistée par IA</Eyebrow>
            <span style={{ marginLeft: "auto", fontFamily: t.mono, fontSize: 10, color: t.inkFaint }}>suggestion · à valider</span>
          </div>
          {analysis.synthese && <p style={{ fontSize: 13.5, color: t.ink, lineHeight: 1.6, margin: "0 0 14px" }}>{analysis.synthese}</p>}
          {Array.isArray(analysis.risques) && analysis.risques.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: t.inkSoft, marginBottom: 6 }}>Risques à surveiller</div>
              {analysis.risques.map((rk, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "3px 0" }}>
                  <span style={{ width: 5, height: 5, borderRadius: 5, background: t.amber, marginTop: 6, flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, color: t.inkSoft, lineHeight: 1.5 }}>{rk}</span>
                </div>
              ))}
            </div>
          )}
          {leverPreview.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: t.inkSoft, marginBottom: 8 }}>Scores de départ suggérés</div>
              {leverPreview.map((l) => (
                <div key={l.id} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "7px 0", borderTop: `1px solid ${t.lineSoft}` }}>
                  <span style={{ fontFamily: t.mono, fontSize: 12, color: t.accentDeep, background: "#fff", border: `1px solid ${t.line}`, borderRadius: 5, padding: "1px 7px", minWidth: 40, textAlign: "center" }}>{l.avg != null ? l.avg : "—"}</span>
                  <div><span style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{l.label}</span>{l.comment && <span style={{ fontSize: 12.5, color: t.inkSoft, lineHeight: 1.5 }}> — {l.comment}</span>}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <button className="cad-btn" onClick={applyScores} style={{ padding: "10px 16px", borderRadius: 8, cursor: "pointer", border: "none", background: t.ink, color: "#fff", fontFamily: t.sans, fontSize: 13.5, fontWeight: 600 }}>
              Appliquer comme point de départ
            </button>
            <span style={{ fontSize: 11, color: t.inkFaint }}>Vous pourrez ajuster chaque réponse ensuite.</span>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Module 1 — Diagnostic d'aptitude                                   */
/* ------------------------------------------------------------------ */
function Diagnostic({ answers, setAnswers, weights, setWeights, context, setContext, processName }) {
  const { dimScores, overall, level, answeredCount, totalW } = diagnosticResult(answers, weights);
  const totalQ = DIMENSIONS.reduce((s, d) => s + d.questions.length, 0);
  const weakest = [...dimScores].filter((d) => d.answered > 0).sort((a, b) => a.score - b.score).slice(0, 3);
  const complete = answeredCount === totalQ;
  const setVal = (qid, v) => setAnswers((p) => ({ ...p, [qid]: v }));
  const pct = (id) => Math.round((weights[id] / totalW) * 100);
  const radarData = dimScores.map((d) => ({ dimension: d.short, score: d.score }));

  return (
    <>
      <Hero eyebrow="Aptitude d'un processus · 25 énoncés pondérés" title="Diagnostic d'aptitude"
        sub="Évaluez dans quelle mesure ce processus se prête à l'automatisation. Chaque énoncé et chaque levier sont pondérés ; le score d'aptitude s'y adapte." />

      <ContextSection context={context} setContext={setContext} setAnswers={setAnswers} processName={processName} />

      <div className="cad-split" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,0.9fr)", gap: 30, alignItems: "start" }}>
        <div className="no-print">
          <Card style={{ padding: "14px 18px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Info size={13} color={t.inkFaint} />
              <span style={{ fontSize: 12.5, color: t.inkSoft }}>Notez votre degré d'accord avec chaque énoncé :</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {LIKERT.map((o) => (
                <div key={o.v} style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 9px", borderRadius: 7, background: t.bg, border: `1px solid ${t.line}` }}>
                  <span style={{ fontFamily: t.mono, fontSize: 12, fontWeight: 600, color: t.accent }}>{o.v}</span>
                  <span style={{ fontSize: 12, color: t.inkSoft }}>{o.label}</span>
                </div>
              ))}
            </div>
          </Card>

          {DIMENSIONS.map((d, di) => (
            <Card key={d.id} style={{ padding: "20px 22px", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 4 }}>
                <span style={{ fontFamily: t.mono, fontSize: 12, color: t.accent, fontWeight: 600 }}>{String(di + 1).padStart(2, "0")}</span>
                <span style={{ fontFamily: t.sans, fontSize: 16, fontWeight: 600, color: t.ink }}>{d.label}</span>
                <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: t.mono, fontSize: 10.5, color: t.accentDeep, background: t.accentSoft, padding: "2px 7px", borderRadius: 5 }}>poids {pct(d.id)}%</span>
                  <span style={{ fontFamily: t.mono, fontSize: 12, color: t.inkFaint }}>{dimScores[di].score || 0}</span>
                </span>
              </div>
              {d.questions.map((q, i) => {
                const qid = `${d.id}-${i}`, cur = answers[qid];
                return (
                  <div key={qid} style={{ padding: "12px 0 6px", borderTop: `1px solid ${t.lineSoft}` }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 9 }}>
                      <span style={{ fontSize: 14, color: t.ink, lineHeight: 1.45, flex: 1 }}>{q.text}</span>
                      <span title="Poids de l'énoncé dans le levier" style={{ fontFamily: t.mono, fontSize: 10.5, color: t.inkFaint, whiteSpace: "nowrap" }}>×{q.w.toFixed(1)}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {LIKERT.map((o) => {
                        const on = cur === o.v;
                        return <button key={o.v} onClick={() => setVal(qid, o.v)} title={o.label} className="cad-seg" style={{ flex: 1, padding: "9px 4px", borderRadius: 7, cursor: "pointer", border: `1px solid ${on ? t.accent : t.line}`, background: on ? t.accent : t.surface, color: on ? "#fff" : t.inkSoft, fontFamily: t.mono, fontSize: 12, fontWeight: 500, transition: "all .13s ease" }}>{o.v}</button>;
                      })}
                    </div>
                  </div>
                );
              })}
            </Card>
          ))}
        </div>

        <div style={{ position: "sticky", top: 18, display: "grid", gap: 14 }}>
          <Card style={{ padding: 24 }}>
            <div className="print-header" style={{ display: "none", marginBottom: 14 }}><Eyebrow>CADRAN · Aptitude à l'automatisation</Eyebrow></div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <Eyebrow>Aptitude à l'automatisation</Eyebrow>
              <span style={{ padding: "4px 11px", borderRadius: 20, background: level.color, color: "#fff", fontFamily: t.mono, fontSize: 12, fontWeight: 600 }}>Niveau {level.n} · {level.label}</span>
            </div>
            <GaugeArc score={overall} level={level} caption="score d'aptitude pondéré" />
            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              {LEVELS.map((l) => (
                <div key={l.n} style={{ flex: 1 }}>
                  <div style={{ height: 5, borderRadius: 3, background: l.n <= level.n ? l.color : t.lineSoft, transition: "background .3s" }} />
                  <div style={{ fontFamily: t.mono, fontSize: 8.5, textAlign: "center", marginTop: 5, color: l.n === level.n ? t.ink : t.inkFaint, fontWeight: l.n === level.n ? 600 : 400 }}>{l.n}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12.5, color: t.inkSoft, marginTop: 12, lineHeight: 1.5, textAlign: "center" }}>{level.note}</p>
          </Card>

          <Card style={{ padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <SlidersHorizontal size={14} color={t.accent} /><Eyebrow>Pondération des leviers</Eyebrow>
            </div>
            <p style={{ fontSize: 12, color: t.inkSoft, margin: "6px 0 14px", lineHeight: 1.5 }}>Ajustez l'importance relative de chaque levier selon votre contexte. Le score d'aptitude se recalcule en direct.</p>
            {DIMENSIONS.map((d) => (
              <div key={d.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, color: t.inkSoft }}>{d.label}</span>
                  <span style={{ fontFamily: t.mono, fontSize: 12.5, color: t.accentDeep, fontWeight: 600 }}>{pct(d.id)}%</span>
                </div>
                <input type="range" min={0} max={40} value={weights[d.id]} className="cad-range" style={{ width: "100%" }} onChange={(e) => setWeights((p) => ({ ...p, [d.id]: parseFloat(e.target.value) }))} />
              </div>
            ))}
            <button className="cad-btn" onClick={() => setWeights(Object.fromEntries(DIMENSIONS.map((d) => [d.id, d.weight])))} style={{ marginTop: 4, fontFamily: t.mono, fontSize: 11, color: t.inkSoft, background: "transparent", border: `1px solid ${t.line}`, borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>Réinitialiser les poids par défaut</button>
          </Card>

          <Card style={{ padding: 22 }}>
            <Eyebrow style={{ marginBottom: 6 }}>Profil par levier</Eyebrow>
            <div style={{ height: 200, margin: "0 -10px 8px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="74%">
                  <PolarGrid stroke={t.line} />
                  <PolarAngleAxis dataKey="dimension" tick={{ fill: t.inkSoft, fontSize: 10.5, fontFamily: t.mono }} />
                  <Radar dataKey="score" stroke={t.accent} fill={t.accent} fillOpacity={0.16} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {dimScores.map((d) => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "5px 0" }}>
                <span style={{ width: 150, fontSize: 12, color: t.inkSoft }}>{d.label} <span style={{ fontFamily: t.mono, fontSize: 10, color: t.inkFaint }}>{pct(d.id)}%</span></span>
                <div style={{ flex: 1, height: 6, background: t.lineSoft, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${d.score}%`, height: "100%", background: t.accent, borderRadius: 3, transition: "width .4s cubic-bezier(.22,1,.36,1)" }} />
                </div>
                <span style={{ width: 26, textAlign: "right", fontFamily: t.mono, fontSize: 12.5, color: t.ink }}>{d.score}</span>
              </div>
            ))}
          </Card>

          <Card style={{ padding: 22 }}>
            <Eyebrow>Freins prioritaires</Eyebrow>
            {weakest.length === 0 ? <p style={{ fontSize: 13, color: t.inkSoft, marginTop: 10 }}>Répondez à quelques énoncés pour identifier les freins.</p> : (
              <div style={{ marginTop: 12 }}>
                {weakest.map((d, i) => (
                  <div key={d.id} style={{ display: "flex", gap: 12, padding: "12px 0", borderTop: i ? `1px solid ${t.lineSoft}` : "none" }}>
                    <span style={{ fontFamily: t.mono, fontSize: 12, color: t.accentDeep, background: t.accentSoft, borderRadius: 6, padding: "3px 8px", height: "fit-content", fontWeight: 600 }}>{d.score}</span>
                    <div><div style={{ fontSize: 13.5, fontWeight: 600, color: t.ink, marginBottom: 3 }}>{d.label}</div><div style={{ fontSize: 12.5, color: t.inkSoft, lineHeight: 1.55 }}>{d.reco}</div></div>
                  </div>
                ))}
              </div>
            )}
            <button className="no-print cad-btn" onClick={() => window.print()} style={{ marginTop: 16, width: "100%", padding: "12px", borderRadius: 8, cursor: "pointer", border: "none", background: complete ? t.ink : t.lineSoft, color: complete ? "#fff" : t.inkFaint, fontFamily: t.sans, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Printer size={15} /> Exporter le rapport (PDF)</button>
            {!complete && <div style={{ fontSize: 11, color: t.inkFaint, textAlign: "center", marginTop: 8 }}>{answeredCount}/{totalQ} énoncés complétés</div>}
          </Card>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Module 2 — ROI                                                     */
/* ------------------------------------------------------------------ */
function Field({ label, unit, value, onChange, step = 1 }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ fontSize: 12.5, color: t.inkSoft, display: "block", marginBottom: 6 }}>{label}</span>
      <div className="cad-fieldwrap" style={{ display: "flex", alignItems: "center", border: `1px solid ${t.line}`, borderRadius: 8, overflow: "hidden", background: t.surface }}>
        <input type="number" value={value} step={step} min={0} onChange={(e) => onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))} className="cad-input" style={{ flex: 1, border: "none", outline: "none", padding: "10px 11px", fontFamily: t.mono, fontSize: 14, color: t.ink, width: "100%", background: "transparent" }} />
        {unit && <span style={{ padding: "0 11px", fontFamily: t.mono, fontSize: 12, color: t.inkFaint, borderLeft: `1px solid ${t.lineSoft}`, whiteSpace: "nowrap" }}>{unit}</span>}
      </div>
    </label>
  );
}
function Slider({ label, value, onChange, min = 0, max = 100 }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 12.5, color: t.inkSoft }}>{label}</span>
        <span style={{ fontFamily: t.mono, fontSize: 13, color: t.accentDeep, fontWeight: 600 }}>{value}%</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="cad-range" style={{ width: "100%" }} />
    </label>
  );
}
function Roi({ inputs, setInputs, currency, setCurrency, processName }) {
  const c = CURRENCIES[currency];
  const set = (k, v) => setInputs((p) => ({ ...p, [k]: v }));
  const r = useMemo(() => roiResult(inputs), [inputs]);
  const money = (n) => new Intl.NumberFormat(c.locale, { maximumFractionDigits: 0 }).format(Math.round(n)) + " " + c.symbol;
  const num = (n, d = 0) => new Intl.NumberFormat(c.locale, { maximumFractionDigits: d }).format(n);
  const mini = [
    { k: "Retour sur invest.", v: r.payback ? num(r.payback, 1) + " mois" : "—" },
    { k: "VAN · 3 ans", v: money(r.npv) },
    { k: "Heures / an", v: num(r.savedH) + " h" },
    { k: "ETP libérés", v: num(r.fte, 2) },
  ];
  return (
    <>
      <Hero eyebrow="Valeur du processus" title="Calculateur de ROI"
        sub="Chiffrez le gain d'automatiser ce processus. Ajustez les paramètres — le dossier d'affaires se recalcule en direct." />
      <div className="cad-split" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 30, alignItems: "start" }}>
        <Card className="no-print" style={{ padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
            <Field label="Volume" unit="/ mois" value={inputs.volume} onChange={(v) => set("volume", v)} />
            <Field label="Temps manuel / occ." unit="min" value={inputs.minutes} onChange={(v) => set("minutes", v)} />
            <Field label="Coût horaire chargé" unit={c.symbol + "/h"} value={inputs.hourlyCost} onChange={(v) => set("hourlyCost", v)} />
            <Field label="Taux d'erreur actuel" unit="%" value={inputs.errorRate} onChange={(v) => set("errorRate", v)} />
            <Field label="Reprise / erreur" unit="min" value={inputs.reworkMin} onChange={(v) => set("reworkMin", v)} />
            <div />
            <Field label="Mise en œuvre" unit={c.symbol} value={inputs.implCost} onChange={(v) => set("implCost", v)} step={500} />
            <Field label="Licence / an" unit={c.symbol} value={inputs.licenseCost} onChange={(v) => set("licenseCost", v)} step={100} />
          </div>
          <div style={{ marginTop: 22, display: "grid", gap: 20, paddingTop: 20, borderTop: `1px solid ${t.lineSoft}` }}>
            <Slider label="Part du temps automatisable" value={inputs.autoRate} onChange={(v) => set("autoRate", v)} />
            <Slider label="Taux d'actualisation (VAN)" value={inputs.discount} onChange={(v) => set("discount", v)} min={0} max={15} />
          </div>
        </Card>

        <div style={{ position: "sticky", top: 18, display: "grid", gap: 14 }}>
          <Card style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <Eyebrow>Économies nettes récurrentes / an</Eyebrow>
              <span style={{ fontFamily: t.mono, fontSize: 12, color: t.inkFaint }}>{processName || "Processus"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontFamily: t.mono, fontSize: 40, fontWeight: 600, color: t.accentDeep, letterSpacing: "-0.01em" }}>{money(r.netRecurring)}</span>
              {r.netRecurring > 0 && <ArrowUpRight size={22} color={t.accent} />}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, marginTop: 18, background: t.line, border: `1px solid ${t.line}`, borderRadius: 10, overflow: "hidden" }}>
              {mini.map((m) => (
                <div key={m.k} style={{ background: t.surface, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11.5, color: t.inkSoft }}>{m.k}</div>
                  <div style={{ fontFamily: t.mono, fontSize: 19, fontWeight: 600, color: t.ink, marginTop: 3 }}>{m.v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 7, alignItems: "flex-start", marginTop: 14, fontSize: 11.5, color: t.inkFaint, lineHeight: 1.55 }}>
              <Info size={13} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Coût actuel du processus : <b style={{ color: t.inkSoft, fontFamily: t.mono }}>{money(r.currentCost)}/an</b> ({num(r.currentH)} h). Score de valeur : <b style={{ color: t.accentDeep, fontFamily: t.mono }}>{r.valueScore}/100</b> (alimente la priorisation).</span>
            </div>
          </Card>
          <Card style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <Eyebrow>Trésorerie cumulée · 36 mois</Eyebrow>
              {r.payback && <span style={{ fontFamily: t.mono, fontSize: 11, color: t.accentDeep, background: t.accentSoft, padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>seuil ≈ {num(r.payback, 1)} mois</span>}
            </div>
            <div style={{ height: 168, margin: "8px -6px 0" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={r.cash} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
                  <defs><linearGradient id="cad-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.accent} stopOpacity={0.22} /><stop offset="100%" stopColor={t.accent} stopOpacity={0.02} /></linearGradient></defs>
                  <CartesianGrid stroke={t.lineSoft} vertical={false} />
                  <XAxis dataKey="m" tick={{ fill: t.inkFaint, fontSize: 10, fontFamily: t.mono }} tickLine={false} axisLine={{ stroke: t.line }} tickFormatter={(v) => v + "m"} />
                  <YAxis tick={{ fill: t.inkFaint, fontSize: 10, fontFamily: t.mono }} tickLine={false} axisLine={false} width={46} tickFormatter={(v) => (Math.abs(v) >= 1000 ? Math.round(v / 1000) + "k" : v)} />
                  <ReferenceLine y={0} stroke={t.inkFaint} strokeDasharray="3 3" />
                  <Tooltip formatter={(v) => [money(v), "Cumul"]} labelFormatter={(m) => "Mois " + m} contentStyle={{ fontFamily: t.mono, fontSize: 12, borderRadius: 8, border: `1px solid ${t.line}`, boxShadow: t.shadow }} />
                  <Area type="monotone" dataKey="cum" stroke={t.accent} strokeWidth={2.5} fill="url(#cad-g)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <button className="no-print cad-btn" onClick={() => window.print()} style={{ marginTop: 14, width: "100%", padding: "12px", borderRadius: 8, cursor: "pointer", border: "none", background: t.ink, color: "#fff", fontFamily: t.sans, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Printer size={15} /> Exporter le dossier d'affaires (PDF)</button>
          </Card>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Module 3 — Priorisation (Valeur × Aptitude)                        */
/* ------------------------------------------------------------------ */
function Matrix({ V, A, name, show }) {
  const P = { x0: 46, y0: 14, x1: 344, y1: 306 };
  const w = P.x1 - P.x0, h = P.y1 - P.y0, mx = P.x0 + w / 2, my = P.y0 + h / 2;
  const px = P.x0 + (V / 100) * w, py = P.y1 - (A / 100) * h;
  const quads = [
    { x: mx, y: P.y0, w: w / 2, h: h / 2, fill: "rgba(12,110,90,.07)" },   // TR value+ apt+
    { x: P.x0, y: P.y0, w: w / 2, h: h / 2, fill: "rgba(138,162,63,.07)" },// TL value- apt+
    { x: mx, y: my, w: w / 2, h: h / 2, fill: "rgba(220,161,58,.08)" },    // BR value+ apt-
    { x: P.x0, y: my, w: w / 2, h: h / 2, fill: "rgba(208,101,74,.07)" },  // BL value- apt-
  ];
  const lbl = { fontFamily: t.mono, fontSize: 9.5, fill: t.inkFaint };
  return (
    <svg viewBox="0 0 360 340" style={{ width: "100%", display: "block" }}>
      {quads.map((q, i) => <rect key={i} x={q.x} y={q.y} width={q.w} height={q.h} fill={q.fill} />)}
      <rect x={P.x0} y={P.y0} width={w} height={h} fill="none" stroke={t.line} />
      <line x1={mx} y1={P.y0} x2={mx} y2={P.y1} stroke={t.line} strokeDasharray="3 3" />
      <line x1={P.x0} y1={my} x2={P.x1} y2={my} stroke={t.line} strokeDasharray="3 3" />
      {/* quadrant captions */}
      <text x={mx + 6} y={P.y0 + 16} style={lbl} fill={t.accentDeep}>Automatiser en priorité</text>
      <text x={P.x0 + 6} y={P.y0 + 16} style={lbl}>Planifier</text>
      <text x={mx + 6} y={P.y1 - 8} style={lbl}>Préparer le terrain</text>
      <text x={P.x0 + 6} y={P.y1 - 8} style={lbl}>Écarter</text>
      {/* axes */}
      <text x={P.x0 + w / 2} y={332} textAnchor="middle" style={{ ...lbl, fontSize: 11, fill: t.inkSoft }}>Valeur →</text>
      <text x={14} y={P.y0 + h / 2} textAnchor="middle" transform={`rotate(-90 14 ${P.y0 + h / 2})`} style={{ ...lbl, fontSize: 11, fill: t.inkSoft }}>Aptitude →</text>
      {/* point */}
      {show && (
        <g style={{ transition: "all .5s cubic-bezier(.22,1,.36,1)" }}>
          <circle cx={px} cy={py} r={12} fill="rgba(12,110,90,.16)" />
          <circle cx={px} cy={py} r={6} fill={t.accent} stroke="#fff" strokeWidth={2} />
          <text x={px} y={py - 14} textAnchor="middle" style={{ fontFamily: t.sans, fontSize: 11, fontWeight: 600, fill: t.ink }}>{name || "Processus"}</text>
        </g>
      )}
    </svg>
  );
}

function Prioritisation({ answers, weights, roiInputs, currency, processName, goTo }) {
  const diag = diagnosticResult(answers, weights);
  const roi = roiResult(roiInputs);
  const c = CURRENCIES[currency];
  const money = (n) => new Intl.NumberFormat(c.locale, { maximumFractionDigits: 0 }).format(Math.round(n)) + " " + c.symbol;
  const A = diag.overall, V = roi.valueScore;
  const ready = diag.answeredCount > 0;

  const verdict = A >= 50 && V >= 50
    ? { title: "Automatiser en priorité", color: t.accent, text: "Forte valeur et bonne aptitude : c'est un gain rapide. Ce processus devrait figurer en tête de votre feuille de route." }
    : A >= 50 && V < 50
      ? { title: "Planifier", color: t.olive, text: "Aptitude élevée mais valeur plus modeste : automatisable sans difficulté, à programmer quand la capacité le permet." }
      : A < 50 && V >= 50
        ? { title: "Préparer le terrain", color: t.amber, text: "Valeur attrayante mais aptitude insuffisante : investissez d'abord dans la préparation (données, règles, standardisation) avant d'automatiser." }
        : { title: "Écarter pour l'instant", color: t.coral, text: "Valeur et aptitude faibles : l'automatisation n'est pas justifiée en l'état. Réévaluez après amélioration du processus." };

  const comp = [
    { k: "Aptitude", v: A + "/100", sub: diag.level.label, onClick: () => goTo("diagnostic") },
    { k: "Valeur", v: V + "/100", sub: "dérivé du ROI", onClick: () => goTo("roi") },
    { k: "Économies nettes / an", v: money(roi.netRecurring), sub: null },
    { k: "Récupération", v: roi.payback ? roi.payback.toFixed(1) + " mois" : "—", sub: null },
  ];

  return (
    <>
      <Hero eyebrow="Décision · Valeur × Aptitude" title="Priorisation"
        sub="Ce processus est positionné selon sa valeur économique (ROI) et son aptitude à l'automatisation (diagnostic). Le quadrant détermine la recommandation." />
      <div className="cad-split" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,0.85fr)", gap: 30, alignItems: "start" }}>
        <Card style={{ padding: 24 }}>
          <Eyebrow style={{ marginBottom: 10 }}>Matrice de priorisation</Eyebrow>
          <Matrix V={V} A={A} name={processName} show={ready} />
          {!ready && <p style={{ fontSize: 12.5, color: t.inkSoft, textAlign: "center", marginTop: 4 }}>Complétez le diagnostic pour positionner le processus sur l'axe d'aptitude.</p>}
        </Card>

        <div style={{ position: "sticky", top: 18, display: "grid", gap: 14 }}>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ height: 5, background: verdict.color }} />
            <div style={{ padding: 22 }}>
              <Eyebrow>Recommandation</Eyebrow>
              <div style={{ fontFamily: t.sans, fontSize: 22, fontWeight: 700, color: t.ink, margin: "8px 0 8px", letterSpacing: "-0.01em" }}>{verdict.title}</div>
              <p style={{ fontSize: 13.5, color: t.inkSoft, lineHeight: 1.6, margin: 0 }}>{verdict.text}</p>
            </div>
          </Card>

          <Card style={{ padding: 20 }}>
            <Eyebrow style={{ marginBottom: 12 }}>Composantes du score</Eyebrow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: t.line, border: `1px solid ${t.line}`, borderRadius: 10, overflow: "hidden" }}>
              {comp.map((m) => (
                <div key={m.k} onClick={m.onClick} className={m.onClick ? "cad-clickable" : ""} style={{ background: t.surface, padding: "13px 15px", cursor: m.onClick ? "pointer" : "default" }}>
                  <div style={{ fontSize: 11.5, color: t.inkSoft }}>{m.k}</div>
                  <div style={{ fontFamily: t.mono, fontSize: 18, fontWeight: 600, color: t.ink, marginTop: 3 }}>{m.v}</div>
                  {m.sub && <div style={{ fontFamily: t.mono, fontSize: 10, color: t.inkFaint, marginTop: 2 }}>{m.sub}</div>}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 7, alignItems: "flex-start", marginTop: 14, fontSize: 11.5, color: t.inkFaint, lineHeight: 1.55 }}>
              <Info size={13} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Évaluez chaque processus séparément pour bâtir votre portefeuille. La sauvegarde et la vue portefeuille multi-processus viendront avec le backend.</span>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Shell                                                              */
/* ------------------------------------------------------------------ */
const TABS = [
  { id: "diagnostic", label: "Aptitude", icon: Gauge, plan: "Gratuit" },
  { id: "roi", label: "ROI", icon: Calculator, plan: "Pro" },
  { id: "prio", label: "Priorisation", icon: LayoutGrid, plan: "Pro" },
];

export default function App() {
  const [tab, setTab] = useState("diagnostic");
  const [processName, setProcessName] = useState("Traitement des demandes");
  const [answers, setAnswers] = useState({});
  const [context, setContext] = useState({});
  const [weights, setWeights] = useState(Object.fromEntries(DIMENSIONS.map((d) => [d.id, d.weight])));
  const [currency, setCurrency] = useState("CAD");
  const [roi, setRoi] = useState({ volume: 400, minutes: 25, hourlyCost: 55, errorRate: 8, reworkMin: 20, autoRate: 70, implCost: 25000, licenseCost: 3000, discount: 8 });

  return (
    <div style={{ background: t.bg, minHeight: "100vh", fontFamily: t.sans, color: t.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        .cad-input:focus, .cad-seg:focus-visible, .cad-btn:focus-visible { outline: 2px solid ${t.accent}; outline-offset: 1px; }
        .cad-fieldwrap:focus-within { border-color: ${t.accent}; }
        .cad-seg:hover { border-color: ${t.accent} !important; color: ${t.accent}; }
        .cad-btn:hover { filter: brightness(1.1); }
        .cad-spin { animation: cad-spin 1s linear infinite; }
        @keyframes cad-spin { to { transform: rotate(360deg); } }
        .cad-clickable:hover { background: ${t.accentSoft} !important; }
        .cad-range { -webkit-appearance: none; appearance: none; height: 5px; border-radius: 3px; background: ${t.lineSoft}; outline: none; }
        .cad-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 17px; height: 17px; border-radius: 50%; background: ${t.accent}; cursor: pointer; border: 3px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.18); }
        .cad-range::-moz-range-thumb { width: 17px; height: 17px; border-radius: 50%; background: ${t.accent}; cursor: pointer; border: 3px solid #fff; }
        @media (max-width: 900px) { .cad-split { grid-template-columns: 1fr !important; } .cad-split > div:last-child { position: static !important; } }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
        @media print { .no-print { display: none !important; } .print-header { display: block !important; } body { background: #fff; } .cad-split { grid-template-columns: 1fr !important; } }
      `}</style>

      <header className="no-print" style={{ position: "sticky", top: 0, zIndex: 10, borderBottom: `1px solid ${t.line}`, background: "rgba(255,255,255,.86)", backdropFilter: "saturate(180%) blur(10px)" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "14px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: t.ink, display: "flex", alignItems: "center", justifyContent: "center" }}><Gauge size={18} color="#fff" /></div>
            <div>
              <div style={{ fontFamily: t.mono, fontSize: 15, fontWeight: 600, letterSpacing: "0.06em", color: t.ink }}>CADRAN</div>
              <div style={{ fontSize: 10.5, color: t.inkFaint, letterSpacing: "0.03em" }}>Aptitude · ROI · Priorisation par processus</div>
            </div>
          </div>
          <nav style={{ display: "flex", gap: 4, background: t.bg, padding: 4, borderRadius: 10, border: `1px solid ${t.line}` }}>
            {TABS.map((T) => {
              const on = tab === T.id; const Icon = T.icon;
              return (
                <button key={T.id} onClick={() => setTab(T.id)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 7, border: "none", cursor: "pointer", background: on ? t.surface : "transparent", boxShadow: on ? t.shadow : "none", color: on ? t.ink : t.inkSoft, fontFamily: t.sans, fontSize: 13.5, fontWeight: on ? 600 : 500, transition: "all .15s ease" }}>
                  <Icon size={15} /><span>{T.label}</span>
                  <span style={{ fontFamily: t.mono, fontSize: 9, padding: "2px 6px", borderRadius: 5, background: T.plan === "Pro" ? t.accentSoft : t.lineSoft, color: T.plan === "Pro" ? t.accentDeep : t.inkFaint, letterSpacing: "0.03em" }}>{T.plan}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* process bar */}
      <div className="no-print" style={{ borderBottom: `1px solid ${t.line}`, background: t.surface }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "12px 26px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <Eyebrow>Processus évalué</Eyebrow>
          <input value={processName} onChange={(e) => setProcessName(e.target.value)} className="cad-input"
            style={{ flex: 1, minWidth: 220, border: `1px solid ${t.line}`, borderRadius: 8, padding: "9px 12px", fontFamily: t.sans, fontSize: 15, fontWeight: 600, color: t.ink, outline: "none", background: t.bg }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: t.inkFaint }}>Devise</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="cad-input" style={{ border: `1px solid ${t.line}`, borderRadius: 8, padding: "9px 10px", fontFamily: t.mono, fontSize: 13, color: t.ink, background: t.surface, outline: "none", cursor: "pointer" }}>
              <option value="CAD">CAD $</option><option value="MAD">MAD DH</option>
            </select>
          </div>
          <span style={{ width: "100%", fontSize: 11.5, color: t.inkFaint, lineHeight: 1.4 }}>Le diagnostic, le ROI et la priorisation portent tous sur ce même processus.</span>
        </div>
      </div>

      <main style={{ maxWidth: 1160, margin: "0 auto", padding: "36px 26px 64px" }}>
        {tab === "diagnostic" && <Diagnostic answers={answers} setAnswers={setAnswers} weights={weights} setWeights={setWeights} context={context} setContext={setContext} processName={processName} />}
        {tab === "roi" && <Roi inputs={roi} setInputs={setRoi} currency={currency} setCurrency={setCurrency} processName={processName} />}
        {tab === "prio" && <Prioritisation answers={answers} weights={weights} roiInputs={roi} currency={currency} processName={processName} goTo={setTab} />}
      </main>

      <footer className="no-print" style={{ maxWidth: 1160, margin: "0 auto", padding: "0 26px 44px" }}>
        <div style={{ borderTop: `1px solid ${t.line}`, paddingTop: 18, fontSize: 11.5, color: t.inkFaint, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span>CADRAN — maquette de démonstration · le nom est un placeholder</span>
          <span style={{ fontFamily: t.mono }}>Évaluation par processus · Diagnostic gratuit</span>
        </div>
      </footer>
    </div>
  );
}
