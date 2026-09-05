"use client";

import { LocaleLink } from "@/components/i18n/LocaleLink";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useDictionary } from "@/i18n/LocaleProvider";
import { Gauge, Calculator, LayoutGrid, LucideIcon, FolderKanban, LogIn, FileText, ListChecks } from "lucide-react";
import clsx from "clsx";

export type TabId = "contexte" | "diagnostic" | "roi" | "prio" | "roadmap";

export function AppHeader({
  tab,
  setTab,
  loggedIn = false,
}: {
  tab: TabId;
  setTab: (t: TabId) => void;
  loggedIn?: boolean;
}) {
  const { common: t } = useDictionary();
  const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
    { id: "contexte", label: t.appHeader.tabContext, icon: FileText },
    { id: "diagnostic", label: t.appHeader.tabAptitude, icon: Gauge },
    { id: "roi", label: t.appHeader.tabRoi, icon: Calculator },
    { id: "prio", label: t.appHeader.tabPrio, icon: LayoutGrid },
    { id: "roadmap", label: t.appHeader.tabRoadmap, icon: ListChecks },
  ];
  return (
    <header className="no-print sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur-md px-4 sm:px-8 backdrop-saturate-150">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-10 lg:px-14 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-3">
        <LocaleLink href="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="w-9 h-9 rounded-[10px] bg-ink flex items-center justify-center shrink-0">
            <Gauge size={16} color="var(--color-accent-soft)" />
          </div>
          <div className="hidden sm:block font-display text-[16px] font-extrabold tracking-[0.01em] text-ink">VerdiktNow</div>
        </LocaleLink>
        <nav className="flex gap-0.5 sm:gap-1 bg-bg p-1 rounded-[10px] border border-line overflow-x-auto min-w-0">
          {TABS.map((T) => {
            const on = tab === T.id;
            const Icon = T.icon;
            return (
              <button
                key={T.id}
                onClick={() => setTab(T.id)}
                className={clsx(
                  "flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-[6px] text-[12.5px] sm:text-[13.5px] whitespace-nowrap transition",
                  on ? "bg-surface shadow-card text-ink font-semibold" : "text-ink-soft font-medium hover:text-ink"
                )}
              >
                <Icon size={15} className="shrink-0" />
                <span>{T.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <LocaleLink
            href={loggedIn ? "/processus" : "/connexion"}
            aria-label={loggedIn ? t.appHeader.myPortfolio : t.appHeader.login}
            className="flex items-center gap-1.5 text-[13px] font-medium text-ink-soft hover:text-ink transition-colors"
          >
            {loggedIn ? <FolderKanban size={16} /> : <LogIn size={16} />}
            <span className="hidden sm:inline">{loggedIn ? t.appHeader.myPortfolio : t.appHeader.login}</span>
          </LocaleLink>
        </div>
      </div>
    </header>
  );
}
