import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  AnalysisResult, buildToolInventory, DIMENSIONS, getApplicableContextQuestions, getDimensions, getProcessCategories,
  getToolRoleMeta, getVolumeVariabilityOptions,
  parseActivities, parseCustomTools, parseSelectedTools, PROCESS_CATEGORIES, REGULATION_TAGS,
  regulationLabels, serializeActivities, serializeCustomTools, serializeSelectedTools, totalActivityMinutes,
  VOLUME_VARIABILITY_OPTIONS, clamp,
} from "@/lib/scoring";
import { createClient, getUserOrg } from "@/lib/supabase/server";
import { getServerLocale } from "@/i18n/serverLocale";
import { getDictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/config";

const MODEL = "claude-haiku-4-5";

const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const requestLog = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (requestLog.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    requestLog.set(key, recent);
    return true;
  }
  recent.push(now);
  requestLog.set(key, recent);
  return false;
}

const scoreProperties: Record<string, { type: "integer"; enum: number[] }> = {};
DIMENSIONS.forEach((d) =>
  d.questions.forEach((_, i) => {
    scoreProperties[`${d.id}-${i}`] = { type: "integer", enum: [0, 1, 2, 3, 4] };
  })
);

const leviersProperties: Record<string, { type: "string" }> = {};
DIMENSIONS.forEach((d) => {
  leviersProperties[d.id] = { type: "string" };
});

const ROI_SUGGESTION_SCHEMA = {
  type: "object",
  properties: {
    volume: { type: "integer" },
    minutes: { type: "integer" },
    hourlyCost: { type: "integer" },
    errorRate: { type: "integer" },
    reworkMin: { type: "integer" },
    note: { type: "string" },
  },
  required: ["volume", "minutes", "hourlyCost", "errorRate", "reworkMin", "note"],
  additionalProperties: false,
} as const;

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    synthese: { type: "string" },
    risques: { type: "array", items: { type: "string" } },
    scores: {
      type: "object",
      properties: scoreProperties,
      required: Object.keys(scoreProperties),
      additionalProperties: false,
    },
    leviers: {
      type: "object",
      properties: leviersProperties,
      required: DIMENSIONS.map((d) => d.id),
      additionalProperties: false,
    },
    roiSuggestion: ROI_SUGGESTION_SCHEMA,
  },
  required: ["synthese", "risques", "scores", "leviers", "roiSuggestion"],
  additionalProperties: false,
} as const;

function buildPrompt(processName: string, context: Record<string, string>, locale: Locale) {
  const dimensions = getDimensions(locale);
  const qlist = dimensions.map(
    (d) =>
      `## ${d.label} (${d.id})\n` +
      d.questions.map((q, i) => `- ${d.id}-${i} : ${q.text}`).join("\n")
  ).join("\n\n");
  const ctx = getApplicableContextQuestions(context.category, locale).map(
    (q) => `${q.label} : ${(context[q.id] || "").trim() || "-"}`
  ).join("\n");
  const category = getProcessCategories(locale).find((c) => c.id === context.category)?.label;
  const volumeVariability = getVolumeVariabilityOptions(locale).find((o) => o.id === context.volumeVariability)?.label;
  const regulations = regulationLabels(context, locale).join(", ");
  const activities = parseActivities(context);
  const yes = locale === "en" ? "yes" : "oui";
  const no = locale === "en" ? "no" : "non";
  const activitiesText =
    activities.length > 0
      ? (locale === "en"
          ? `\nDocumented steps (${totalActivityMinutes(activities)} min total per occurrence):\n`
          : `\nÉtapes documentées (${totalActivityMinutes(activities)} min au total par occurrence) :\n`) +
        activities.map((a, i) =>
          locale === "en"
            ? `${i + 1}. ${a.label || "-"} (who: ${a.actor || "?"}, system: ${a.system || "?"}, ${a.minutes} min, constant rule: ${a.rulesBased ? yes : no}, digital data: ${a.digitalData ? yes : no}, frequent exceptions: ${a.frequentExceptions ? yes : no})${a.friction ? `, friction: ${a.friction}` : ""}`
            : `${i + 1}. ${a.label || "-"} (qui : ${a.actor || "?"}, système : ${a.system || "?"}, ${a.minutes} min, règle constante : ${a.rulesBased ? yes : no}, données numériques : ${a.digitalData ? yes : no}, exceptions fréquentes : ${a.frequentExceptions ? yes : no})${a.friction ? `, friction : ${a.friction}` : ""}`
        ).join("\n")
      : "";

  // L'inventaire d'outils est un signal direct pour le levier « Faisabilité technique » : un parc
  // qui contient déjà un moteur d'automatisation ne se note pas comme un parc 100 % manuel.
  const inventory = buildToolInventory(context, locale);
  const roleMeta = getToolRoleMeta(locale);
  const toolsText =
    inventory.entries.length > 0
      ? (locale === "en" ? "\nTools already in place:\n" : "\nOutils déjà en place :\n") +
        inventory.entries
          .map((e) => `- ${e.label} [${roleMeta[e.role].tag}]${e.usage ? ` — ${e.usage}` : ""}`)
          .join("\n")
      : "";

  if (locale === "en") {
    return `You are a Lean Six Sigma automation expert. We're assessing a process's readiness for automation. Respond in English.

Process: ${processName || "-"}
${category ? `Category: ${category}\n` : ""}${volumeVariability ? `Volume variability: ${volumeVariability}\n` : ""}${regulations ? `Regulatory constraints: ${regulations}\n` : ""}${ctx}${activitiesText}${toolsText}

Based on this context, propose a STARTING assessment for each statement, from 0 (not at all) to 4 (completely):

${qlist}

If the context is insufficient for a statement, give a cautious estimate. Do not invent any fact absent from the context.

Also propose a cautious estimate of the ROI calculation parameters (roiSuggestion): monthly process volume (volume), manual time per occurrence in minutes (minutes), fully loaded hourly cost of the person performing it in local currency (hourlyCost), current error rate in % (errorRate), rework time per error in minutes (reworkMin). Base this only on explicit clues from the context (mentioned volume, frequency, pain points); if the context gives no clue for a parameter, return a cautious default estimate rather than inventing a precise figure, and explain your assumptions in "note" (1-2 sentences, specifying what is inferred vs. assumed).`;
  }

  return `Tu es un expert Lean Six Sigma en automatisation des processus. On évalue l'aptitude d'un processus à être automatisé. Réponds en français.

Processus : ${processName || "-"}
${category ? `Catégorie : ${category}\n` : ""}${volumeVariability ? `Variabilité du volume : ${volumeVariability}\n` : ""}${regulations ? `Contraintes réglementaires : ${regulations}\n` : ""}${ctx}${activitiesText}${toolsText}

À partir de ce contexte, propose une évaluation de DÉPART pour chaque énoncé, de 0 (pas du tout) à 4 (totalement) :

${qlist}

Si le contexte est insuffisant pour un énoncé, donne une estimation prudente. N'invente aucun fait absent du contexte.

Propose aussi une estimation prudente des paramètres de calcul du ROI (roiSuggestion) : volume mensuel du processus (volume), temps manuel par occurrence en minutes (minutes), coût horaire chargé de la personne qui l'exécute en devise locale (hourlyCost), taux d'erreur actuel en % (errorRate), temps de reprise par erreur en minutes (reworkMin). Base-toi uniquement sur des indices explicites du contexte (volume mentionné, fréquence, irritants) ; si le contexte ne donne aucun indice pour un paramètre, retourne une estimation par défaut prudente plutôt que d'inventer un chiffre précis, et explique tes hypothèses dans "note" (1-2 phrases, en précisant ce qui est déduit vs supposé).`;
}

export async function POST(request: NextRequest) {
  const locale = await getServerLocale();
  const t = getDictionary(locale).errors.api.analyze;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: t.notConfigured }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: t.rateLimited }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: t.loginRequired }, { status: 401 });
  }

  const org = await getUserOrg(supabase, user.id);
  if (!org) {
    return NextResponse.json({ error: t.orgNotFound }, { status: 404 });
  }
  if (org.aiQuota != null && org.aiUsedThisMonth >= org.aiQuota) {
    return NextResponse.json({ error: t.quotaReached.replace("{quota}", String(org.aiQuota)) }, { status: 429 });
  }

  let body: { processName?: string; context?: Record<string, string> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: t.invalidRequest }, { status: 400 });
  }

  const processName = typeof body.processName === "string" ? body.processName.slice(0, 200) : "";
  const context: Record<string, string> = {};
  if (body.context && typeof body.context === "object") {
    const cat = body.context.category;
    if (typeof cat === "string" && PROCESS_CATEGORIES.some((c) => c.id === cat)) {
      context.category = cat;
    }
    for (const q of getApplicableContextQuestions(context.category, locale)) {
      const v = body.context[q.id];
      if (typeof v === "string") context[q.id] = v.slice(0, 4000);
    }
    const vol = body.context.volumeVariability;
    if (typeof vol === "string" && VOLUME_VARIABILITY_OPTIONS.some((o) => o.id === vol)) {
      context.volumeVariability = vol;
    }
    const regs = body.context.regulations;
    if (typeof regs === "string") {
      const valid = regs.split(";").filter((id) => REGULATION_TAGS.some((r) => r.id === id));
      if (valid.length > 0) context.regulations = valid.join(";");
      if (valid.includes("other") && typeof body.context.regulationsOther === "string") {
        context.regulationsOther = body.context.regulationsOther.slice(0, 200);
      }
    }
    const activitiesSerialized = serializeActivities(parseActivities(body.context as Record<string, string>));
    if (activitiesSerialized) context.activities = activitiesSerialized;
    const toolsSelected = serializeSelectedTools(parseSelectedTools(body.context as Record<string, string>));
    if (toolsSelected) context.toolsSelected = toolsSelected;
    const toolsCustom = serializeCustomTools(
      parseCustomTools(body.context as Record<string, string>).map((tool) => ({
        ...tool,
        name: tool.name.slice(0, 120),
        usage: tool.usage.slice(0, 300),
      }))
    );
    if (toolsCustom) context.toolsCustom = toolsCustom;
  }

  const filled = getApplicableContextQuestions(context.category, locale).some((q) => (context[q.id] || "").trim());
  if (!filled) {
    return NextResponse.json({ error: t.fillOneField }, { status: 400 });
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: buildPrompt(processName, context, locale) }],
      output_config: { format: { type: "json_schema", schema: ANALYSIS_SCHEMA } },
    } as Anthropic.MessageCreateParamsNonStreaming);

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: t.refused }, { status: 422 });
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: t.emptyResponse }, { status: 502 });
    }

    const parsed = JSON.parse(textBlock.text) as AnalysisResult;

    const cleanScores: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed.scores || {})) {
      if (k in scoreProperties && typeof v === "number") {
        cleanScores[k] = Math.max(0, Math.min(4, Math.round(v)));
      }
    }

    const rs = parsed.roiSuggestion;
    const roiSuggestion =
      rs && typeof rs === "object"
        ? {
            volume: clamp(Math.round(Number(rs.volume) || 0), 1, 100000),
            minutes: clamp(Math.round(Number(rs.minutes) || 0), 1, 600),
            hourlyCost: clamp(Math.round(Number(rs.hourlyCost) || 0), 10, 500),
            errorRate: clamp(Math.round(Number(rs.errorRate) || 0), 0, 100),
            reworkMin: clamp(Math.round(Number(rs.reworkMin) || 0), 0, 600),
            note: typeof rs.note === "string" ? rs.note.slice(0, 300) : "",
          }
        : null;

    const result: AnalysisResult = {
      synthese: typeof parsed.synthese === "string" ? parsed.synthese.slice(0, 1000) : "",
      risques: Array.isArray(parsed.risques) ? parsed.risques.slice(0, 8).map((r) => String(r).slice(0, 300)) : [],
      scores: cleanScores,
      leviers: Object.fromEntries(
        DIMENSIONS.map((d) => [d.id, typeof parsed.leviers?.[d.id] === "string" ? parsed.leviers[d.id].slice(0, 400) : ""])
      ),
      roiSuggestion,
    };

    await supabase.from("ai_usage_events").insert({ organization_id: org.organizationId });

    return NextResponse.json(result);
  } catch (err) {
    console.error("analyze route error", err);
    return NextResponse.json({ error: t.failed }, { status: 500 });
  }
}
