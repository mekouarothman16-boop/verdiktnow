import { LocaleLink } from "@/components/i18n/LocaleLink";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { getDictionary } from "@/i18n/getDictionary";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/config";
import { Gauge, Plus, LogOut, AlertTriangle } from "lucide-react";
import { createClient, getUserOrg, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { createProcess } from "@/lib/supabase/processActions";
import { signOut } from "@/lib/supabase/actions";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SupabaseSetupNotice } from "@/components/app/SupabaseSetupNotice";
import { PortfolioMatrix } from "@/components/app/PortfolioMatrix";
import { PortfolioRanking } from "@/components/app/PortfolioRanking";
import { ProGate } from "@/components/app/ProGate";
import { ProcessGrid, type ProcessCardData } from "@/components/app/ProcessGrid";
import { ImportCsvButton } from "@/components/app/ImportCsvButton";
import { ActivityFeed, type ActivityEntry } from "@/components/app/ActivityFeed";
import type { ActivityLogRow } from "@/lib/supabase/types";
import {
  Answers, CURRENCIES, DEFAULT_ROI_INPUTS, DIMENSIONS, getProcessCategories, parseProcessDependencies, roiResult,
  type Context, type Currency, type RoiInputs,
} from "@/lib/scoring";

type Row = {
  id: string;
  name: string;
  currency: string;
  updated_at: string;
  archived_at: string | null;
  tags: string[] | null;
  assessments:
    | { aptitude_score: number | null; context: Context | null; answers: Answers | null }
    | { aptitude_score: number | null; context: Context | null; answers: Answers | null }[]
    | null;
  roi_inputs:
    | { value_score: number | null; inputs: RoiInputs | null }
    | { value_score: number | null; inputs: RoiInputs | null }[]
    | null;
};

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? v[0] ?? null : v;
}

const STOPWORDS = new Set(["dans", "avec", "pour", "cette", "toutes", "tous", "leurs", "notre", "votre", "depuis", "chaque", "comme"]);

function keywords(text?: string | null): Set<string> {
  if (!text) return new Set();
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-zàâäéèêëïîôöùûüç0-9]+/)
      .filter((w) => w.length >= 4 && !STOPWORDS.has(w))
  );
}

function overlaps(a: Set<string>, b: Set<string>): boolean {
  for (const w of a) if (b.has(w)) return true;
  return false;
}

/** Recoupe deux processus par catégorie déclarée + mots-clés partagés (systèmes, intervenants) — un signal de portefeuille, pas une garantie. */
function findSimilar(processes: { id: string; name: string; category: string; kw: Set<string> }[]) {
  const map = new Map<string, string[]>();
  for (const p of processes) {
    if (!p.category) continue;
    const matches = processes
      .filter((o) => o.id !== p.id && o.category === p.category && overlaps(p.kw, o.kw))
      .map((o) => o.name);
    if (matches.length > 0) map.set(p.id, matches);
  }
  return map;
}

export default async function ProcessusPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { lang: rawLang } = await params;
  const lang = isLocale(rawLang) ? rawLang : DEFAULT_LOCALE;
  const { common: t, tool } = getDictionary(lang);
  const { portfolioPage: p } = tool;
  if (!isSupabaseConfigured) return <SupabaseSetupNotice />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const org = await getUserOrg(supabase, user?.id);

  // Aucun forfait gratuit : une organisation sans abonnement payant actif ne voit que ce
  // mur de paiement, jamais le tableau de bord — pas de processus à créer tant qu'un forfait
  // n'est pas choisi. Ressort tôt, avant toute requête supplémentaire sur les processus.
  if (org && org.plan === "free") {
    return (
      <div className="flex-1 flex flex-col">
        <header className="border-b border-line bg-white/90 backdrop-blur-md">
          <div className="max-w-[1160px] mx-auto px-5 sm:px-6 py-3.5 flex items-center justify-between">
            <LocaleLink href="/" className="flex items-center gap-2.5">
              <div className="w-[34px] h-[34px] rounded-md bg-ink flex items-center justify-center">
                <Gauge size={18} color="var(--color-accent-soft)" />
              </div>
              <span className="font-display text-[16px] font-extrabold tracking-[0.01em] text-ink">CADRAN</span>
            </LocaleLink>
            <div className="flex items-center gap-4">
              <LanguageSwitcher className="hidden sm:inline-flex" />
              <span className="text-[13px] text-ink-soft hidden sm:inline">{user?.email}</span>
              <form action={signOut}>
                <button className="flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink transition-colors">
                  <LogOut size={14} /> {t.appHeader.logout}
                </button>
              </form>
            </div>
          </div>
        </header>
        <main className="max-w-[1160px] mx-auto w-full px-5 sm:px-6 py-16 flex-1 flex items-center justify-center">
          <ProGate loggedIn={!!user} title={p.paywallTitle} description={p.paywallDescription} />
        </main>
      </div>
    );
  }

  const { data } = await supabase
    .from("processes")
    .select("id, name, currency, updated_at, archived_at, tags, assessments(aptitude_score, context, answers), roi_inputs(value_score, inputs)")
    .order("updated_at", { ascending: false });

  const processes = (data ?? []) as unknown as Row[];
  const activeProcesses = processes.filter((p) => !p.archived_at);
  const readOnly = org?.role === "viewer";
  const totalQuestions = DIMENSIONS.reduce((s, d) => s + d.questions.length, 0);

  // Regroupé par devise : additionner CAD et USD directement serait faux. Les archivés sont exclus des stats agrégées.
  const totalsByCurrency = new Map<string, number>();
  for (const p of activeProcesses) {
    const inputs = one(p.roi_inputs)?.inputs;
    if (!inputs) continue;
    const net = roiResult({ ...DEFAULT_ROI_INPUTS, ...inputs }, org?.hoursPerFte, org?.magnitudeRef).netRecurring;
    totalsByCurrency.set(p.currency, (totalsByCurrency.get(p.currency) ?? 0) + net);
  }
  const portfolioTotals = Array.from(totalsByCurrency.entries()).filter(([, v]) => v !== 0);

  const similar = findSimilar(
    activeProcesses.map((p) => {
      const ctx = one(p.assessments)?.context;
      return {
        id: p.id,
        name: p.name,
        category: ctx?.category?.trim() ?? "",
        kw: new Set([...keywords(ctx?.systems), ...keywords(ctx?.actors)]),
      };
    })
  );

  const completedScores = activeProcesses
    .map((p) => {
      const assessment = one(p.assessments);
      const answered = assessment?.answers ? Object.keys(assessment.answers).length : 0;
      return answered >= totalQuestions ? assessment?.aptitude_score ?? null : null;
    })
    .filter((s): s is number => s != null);
  const maturityScore = completedScores.length > 0
    ? Math.round(completedScores.reduce((a, b) => a + b, 0) / completedScores.length)
    : null;

  const processCategories = getProcessCategories(lang);
  const cardData: ProcessCardData[] = processes.map((p) => {
    const assessment = one(p.assessments);
    const roiRow = one(p.roi_inputs);
    const categoryId = assessment?.context?.category?.trim();
    return {
      id: p.id,
      name: p.name,
      currency: p.currency,
      updatedAt: p.updated_at,
      archivedAt: p.archived_at,
      tags: p.tags ?? [],
      score: assessment?.aptitude_score ?? null,
      valueScore: roiRow?.value_score ?? null,
      categoryLabel: processCategories.find((c) => c.id === categoryId)?.label ?? null,
      answeredCount: assessment?.answers ? Object.keys(assessment.answers).length : 0,
      totalQuestions,
      similar: similar.get(p.id) ?? [],
    };
  });

  // Échéances de feuille de route dépassées, groupées par processus (exclut les archivés) —
  // visibilité de portefeuille sur un signal qui n'était sinon consultable qu'en ouvrant chaque
  // processus un par un. RLS (can_access_process) scope déjà les lignes à l'organisation.
  const overdueByProcess = new Map<string, { name: string; count: number }>();
  if (org) {
    const todayIso = new Date().toISOString().slice(0, 10);
    const { data: overdueRows } = await supabase
      .from("roadmap_progress")
      .select("process_id, due_date, processes(name, archived_at)")
      .eq("done", false)
      .lt("due_date", todayIso);

    for (const row of (overdueRows ?? []) as unknown as {
      process_id: string;
      processes: { name: string; archived_at: string | null } | { name: string; archived_at: string | null }[] | null;
    }[]) {
      const proc = one(row.processes);
      if (!proc || proc.archived_at) continue;
      const existing = overdueByProcess.get(row.process_id);
      overdueByProcess.set(row.process_id, { name: proc.name, count: (existing?.count ?? 0) + 1 });
    }
  }
  const overdueTotal = Array.from(overdueByProcess.values()).reduce((s, v) => s + v.count, 0);

  let activity: ActivityEntry[] = [];
  if (org) {
    const { data: logRows } = await supabase
      .from("activity_log")
      .select("id, actor_id, action, detail, created_at")
      .eq("organization_id", org.organizationId)
      .order("created_at", { ascending: false })
      .limit(15);

    if (logRows && logRows.length > 0) {
      const emailByUserId = new Map<string, string>();
      if (isSupabaseAdminConfigured) {
        const admin = createAdminClient();
        const uniqueActorIds = Array.from(
          new Set((logRows as ActivityLogRow[]).map((l) => l.actor_id).filter((id): id is string => !!id))
        );
        await Promise.all(
          uniqueActorIds.map(async (actorId) => {
            const { data } = await admin.auth.admin.getUserById(actorId);
            emailByUserId.set(actorId, data.user?.email ?? actorId);
          })
        );
      }
      activity = (logRows as ActivityLogRow[]).map((l) => ({
        id: l.id,
        actorEmail: l.actor_id === user?.id ? p.youLabel : l.actor_id ? emailByUserId.get(l.actor_id) ?? l.actor_id : p.someoneLabel,
        action: l.action,
        detail: l.detail,
        createdAt: l.created_at,
      }));
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-line bg-white/90 backdrop-blur-md">
        <div className="max-w-[1160px] mx-auto px-5 sm:px-6 py-3.5 flex items-center justify-between">
          <LocaleLink href="/" className="flex items-center gap-2.5">
            <div className="w-[34px] h-[34px] rounded-md bg-ink flex items-center justify-center">
              <Gauge size={18} color="var(--color-accent-soft)" />
            </div>
            <span className="font-display text-[16px] font-extrabold tracking-[0.01em] text-ink">CADRAN</span>
          </LocaleLink>
          <div className="flex items-center gap-4">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <span className="text-[13px] text-ink-soft hidden sm:inline">{user?.email}</span>
            <LocaleLink href="/mes-taches" className="text-[13px] text-ink-soft hover:text-ink transition-colors">
              {t.appHeader.myTasks}
            </LocaleLink>
            <LocaleLink href="/compte" className="text-[13px] text-ink-soft hover:text-ink transition-colors">
              {t.appHeader.mySubscription}
            </LocaleLink>
            <form action={signOut}>
              <button className="flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink transition-colors">
                <LogOut size={14} /> {t.appHeader.logout}
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-[1160px] mx-auto w-full px-5 sm:px-6 py-10 flex-1">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <Eyebrow>{p.eyebrow}</Eyebrow>
            <h1 className="font-display text-[28px] font-extrabold text-ink mt-1.5 tracking-[-0.01em]">{p.title}</h1>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-2.5">
              <ImportCsvButton />
              <form action={createProcess}>
                <button className="flex items-center gap-2 px-4.5 py-2.5 rounded-lg bg-accent-vivid text-ink text-[13.5px] font-semibold hover:brightness-95 transition">
                  <Plus size={16} /> {p.newProcessButton}
                </button>
              </form>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-coral/10 border border-coral/20 text-[13px] text-coral">
            {error}
          </div>
        )}

        {overdueTotal > 0 && (
          <div className="mb-6 px-4.5 py-3.5 rounded-lg bg-coral/10 border border-coral/20 flex items-start gap-2.5">
            <AlertTriangle size={15} className="text-coral shrink-0 mt-0.5" />
            <div className="text-[13px] leading-relaxed">
              <span className="font-semibold text-coral">
                {(overdueTotal > 1 ? p.overdueSummaryPlural : p.overdueSummarySingular).replace("{n}", String(overdueTotal))}
              </span>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                {Array.from(overdueByProcess.entries()).map(([id, v]) => (
                  <LocaleLink key={id} href={`/outil/${id}`} className="text-ink-soft hover:text-ink hover:underline">
                    {v.name} <span className="text-ink-faint font-mono">({v.count})</span>
                  </LocaleLink>
                ))}
              </div>
            </div>
          </div>
        )}

        {processes.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-ink-soft text-[14.5px] mb-5">
              {p.emptyStateText}
            </p>
            {!readOnly && (
              <form action={createProcess} className="inline-block">
                <button className="flex items-center gap-2 px-5 py-3 rounded-lg bg-accent-vivid text-ink text-[14px] font-semibold hover:brightness-95 transition">
                  <Plus size={16} /> {p.emptyStateButton}
                </button>
              </form>
            )}
          </Card>
        ) : (
          <>
            {org && (portfolioTotals.length > 0 || maturityScore != null) && (
              <Card className="p-5 mb-6 flex flex-wrap items-center gap-x-10 gap-y-3">
                {portfolioTotals.length > 0 && (
                  <div>
                    <Eyebrow className="mb-1.5">{p.totalValueEyebrow}</Eyebrow>
                    <div className="flex flex-wrap gap-x-6 gap-y-1">
                      {portfolioTotals.map(([cur, total]) => (
                        <span key={cur} className="font-mono text-[20px] font-semibold text-accent-deep">
                          {new Intl.NumberFormat(lang === "en" ? "en-CA" : "fr-CA", { maximumFractionDigits: 0 }).format(Math.round(total))}{" "}
                          {CURRENCIES[cur as Currency]?.symbol ?? cur}
                          <span className="text-[12px] text-ink-faint font-sans font-normal">{p.perYear}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {maturityScore != null && (
                  <div>
                    <Eyebrow className="mb-1.5">{p.maturityEyebrow}</Eyebrow>
                    <span className="font-mono text-[20px] font-semibold text-ink">
                      {maturityScore}<span className="text-[12px] text-ink-faint font-sans font-normal">/100</span>
                    </span>
                    <span className="text-[11.5px] text-ink-faint ml-2">
                      {p.maturityAverageOf.replace("{n}", String(completedScores.length))}
                    </span>
                  </div>
                )}
              </Card>
            )}
            <ActivityFeed entries={activity} />
            {(() => {
              const points = activeProcesses
                .map((p) => {
                  const A = one(p.assessments)?.aptitude_score;
                  const V = one(p.roi_inputs)?.value_score;
                  return A != null && V != null ? { id: p.id, name: p.name, A, V } : null;
                })
                .filter((p): p is { id: string; name: string; A: number; V: number } => p !== null);
              if (points.length < 2) {
                const samplePoints = [
                  { id: "sample-1", name: p.sampleProcess1, A: 78, V: 82 },
                  { id: "sample-2", name: p.sampleProcess2, A: 45, V: 65 },
                  { id: "sample-3", name: p.sampleProcess3, A: 30, V: 35 },
                  { id: "sample-4", name: p.sampleProcess4, A: 70, V: 20 },
                ];
                return (
                  <Card className="p-6 mb-6">
                    <div className="flex items-center gap-2 mb-2.5">
                      <Eyebrow>{p.matrixEyebrow}</Eyebrow>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-line-soft text-ink-faint uppercase tracking-wide">
                        {p.samplePreviewBadge}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-ink-faint mb-4 max-w-[520px]">{p.samplePreviewNotice}</p>
                    <div className="opacity-55 pointer-events-none select-none">
                      <PortfolioMatrix
                        points={samplePoints}
                        labels={{
                          quadrantAutomate: tool.portfolioMatrix.quadrantAutomate,
                          quadrantPlan: tool.portfolioMatrix.quadrantPlan,
                          quadrantPrepare: tool.portfolioMatrix.quadrantPrepare,
                          quadrantSetAside: tool.portfolioMatrix.quadrantSetAside,
                          axisValue: tool.portfolioMatrix.axisValue,
                          axisAptitude: tool.portfolioMatrix.axisAptitude,
                        }}
                        threshold={org?.priorityThreshold ?? 50}
                      />
                    </div>
                  </Card>
                );
              }

              // Un processus dont la dépendance déclarée n'est ni prête (diagnostic incomplet ou
              // score sous le seuil) ni encore disponible (archivée/supprimée) reçoit un avertissement
              // visuel sur son point — la matrice seule ne peut pas voir qu'un « gain rapide » dépend
              // d'un voisin pas encore automatisable.
              const dependencyWarnings: Record<string, string[]> = {};
              const threshold = org?.priorityThreshold ?? 50;
              for (const proc of activeProcesses) {
                const deps = parseProcessDependencies(one(proc.assessments)?.context ?? {});
                if (deps.length === 0) continue;
                const blocking: string[] = [];
                for (const depId of deps) {
                  const dep = processes.find((d) => d.id === depId);
                  if (!dep || dep.archived_at) {
                    if (dep) blocking.push(dep.name);
                    continue;
                  }
                  const depAssessment = one(dep.assessments);
                  const answered = depAssessment?.answers ? Object.keys(depAssessment.answers).length : 0;
                  const depScore = answered >= totalQuestions ? depAssessment?.aptitude_score ?? null : null;
                  if (depScore == null || depScore < threshold) blocking.push(dep.name);
                }
                if (blocking.length > 0) dependencyWarnings[proc.id] = blocking;
              }
              if (!org) {
                return (
                  <div className="mb-6">
                    <ProGate
                      loggedIn={!!user}
                      title={p.proGateTitle}
                      description={p.proGateDescription}
                    />
                  </div>
                );
              }
              return (
                <>
                  <Card className="p-6 mb-6">
                    <Eyebrow className="mb-2.5">{p.matrixEyebrow}</Eyebrow>
                    <PortfolioMatrix
                      points={points}
                      labels={{
                        quadrantAutomate: tool.portfolioMatrix.quadrantAutomate,
                        quadrantPlan: tool.portfolioMatrix.quadrantPlan,
                        quadrantPrepare: tool.portfolioMatrix.quadrantPrepare,
                        quadrantSetAside: tool.portfolioMatrix.quadrantSetAside,
                        axisValue: tool.portfolioMatrix.axisValue,
                        axisAptitude: tool.portfolioMatrix.axisAptitude,
                      }}
                      threshold={org?.priorityThreshold ?? 50}
                      warnings={dependencyWarnings}
                    />
                  </Card>
                  <Card className="p-6 mb-6">
                    <PortfolioRanking points={points} />
                  </Card>
                </>
              );
            })()}
            <ProcessGrid processes={cardData} readOnly={readOnly} />
          </>
        )}
      </main>
    </div>
  );
}
