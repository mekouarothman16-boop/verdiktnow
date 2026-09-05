import { redirect } from "next/navigation";
import { Gauge, LogOut, ListChecks, CalendarDays, ArrowLeft } from "lucide-react";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { createClient, getUserOrg, isSupabaseConfigured } from "@/lib/supabase/server";
import { signOut } from "@/lib/supabase/actions";
import { SupabaseSetupNotice } from "@/components/app/SupabaseSetupNotice";
import { getDictionary } from "@/i18n/getDictionary";
import { isLocale, DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import type { Metadata } from "next";
import { buildLanguageAlternates } from "@/i18n/localizePath";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang = isLocale(rawLang) ? rawLang : DEFAULT_LOCALE;
  return {
    title: getDictionary(lang).legal.myTasks.metaTitle,
    alternates: { languages: buildLanguageAlternates("/mes-taches") },
  };
}

type ProcessRef = { name: string; archived_at: string | null };
type TaskRow = { process_id: string; text: string | null; due_date: string | null; processes: ProcessRef | ProcessRef[] | null };

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? v[0] ?? null : v;
}

function formatDueDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-CA" : "fr-CA", { day: "numeric", month: "short" }).format(new Date(`${iso}T00:00:00`));
}

export default async function MyTasksPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang = isLocale(rawLang) ? rawLang : DEFAULT_LOCALE;
  if (!isSupabaseConfigured) return <SupabaseSetupNotice />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/connexion?next=/${lang}/mes-taches`);

  const t = getDictionary(lang).legal.myTasks;
  const { appHeader } = getDictionary(lang).common;
  const org = await getUserOrg(supabase, user.id);
  const todayIso = new Date().toISOString().slice(0, 10);

  let tasks: { processId: string; processName: string; text: string; dueDate: string | null }[] = [];
  if (org) {
    const { data } = await supabase
      .from("roadmap_progress")
      .select("process_id, text, due_date, processes(name, archived_at)")
      .eq("assigned_to", user.id)
      .eq("done", false);

    tasks = (data ?? [] as TaskRow[])
      .map((row) => {
        const proc = one(row.processes);
        if (!proc || proc.archived_at) return null;
        return { processId: row.process_id, processName: proc.name, text: row.text ?? "", dueDate: row.due_date };
      })
      .filter((t): t is NonNullable<typeof t> => !!t)
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0;
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      });
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-line bg-white/90 backdrop-blur-md px-4 sm:px-8">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-10 lg:px-14 py-3.5 flex items-center justify-between">
          <LocaleLink href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-ink flex items-center justify-center">
              <Gauge size={18} color="var(--color-accent-soft)" />
            </div>
            <span className="font-display text-[16px] font-extrabold tracking-[0.01em] text-ink">VerdiktNow</span>
          </LocaleLink>
          <div className="flex items-center gap-4">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <span className="text-[13px] text-ink-soft hidden sm:inline">{user.email}</span>
            <LocaleLink href="/compte" className="text-[13px] text-ink-soft hover:text-ink transition-colors">
              {appHeader.mySubscription}
            </LocaleLink>
            <form action={signOut}>
              <button className="flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink transition-colors">
                <LogOut size={14} /> {appHeader.logout}
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-[820px] mx-auto w-full px-5 sm:px-6 py-10 flex-1">
        <LocaleLink href="/processus" className="flex items-center gap-1.5 text-[12.5px] text-ink-faint hover:text-ink transition-colors mb-5">
          <ArrowLeft size={13} /> {t.backToPortfolio}
        </LocaleLink>
        <h1 className="font-display text-[26px] sm:text-[30px] font-semibold tracking-[0.005em] text-ink mb-2">{t.title}</h1>
        <p className="text-ink-soft text-[14px] leading-relaxed mb-8">{t.subtitle}</p>

        {tasks.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-line bg-surface p-8 text-center">
            <ListChecks size={22} className="text-ink-faint mx-auto mb-3" />
            <div className="font-sans text-[15px] font-semibold text-ink mb-1.5">{t.emptyTitle}</div>
            <p className="text-[13px] text-ink-soft leading-relaxed max-w-[420px] mx-auto">{t.emptyText}</p>
          </div>
        ) : (
          <div className="grid gap-2.5">
            {tasks.map((task, i) => {
              const overdue = !!task.dueDate && task.dueDate < todayIso;
              return (
                <LocaleLink
                  key={`${task.processId}-${i}`}
                  href={`/outil/${task.processId}?tab=roadmap`}
                  className="flex items-center justify-between gap-4 rounded-[16px] border border-line bg-surface p-4 hover:border-accent/40 hover:shadow-card transition"
                >
                  <div className="min-w-0">
                    <div className="text-[13.5px] text-ink leading-relaxed mb-1">{task.text}</div>
                    <div className="text-[11.5px] text-ink-faint font-medium truncate">{task.processName}</div>
                  </div>
                  <div
                    className={
                      task.dueDate
                        ? overdue
                          ? "shrink-0 flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-coral/10 text-coral whitespace-nowrap"
                          : "shrink-0 flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-bg text-ink-faint whitespace-nowrap"
                        : "shrink-0 text-[11px] text-ink-faint whitespace-nowrap"
                    }
                  >
                    {task.dueDate ? (
                      <>
                        <CalendarDays size={11} />
                        {formatDueDate(task.dueDate, lang)}
                        {overdue && ` · ${t.overdueBadge}`}
                      </>
                    ) : (
                      t.noDueDate
                    )}
                  </div>
                </LocaleLink>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
