import type { BillingPeriod } from "@/lib/plans";

/** Même pattern visuel que le sélecteur FR/EN (LanguageSwitcher.tsx) — un contrôle segmenté à
 * deux options, pas un interrupteur à bascule : plus lisible pour deux libellés textuels
 * ("Mensuel"/"Annuel") qu'une icône on/off. */
export function BillingPeriodToggle({
  period,
  onChange,
  monthlyLabel,
  annualLabel,
  savingsBadge,
}: {
  period: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
  monthlyLabel: string;
  annualLabel: string;
  savingsBadge?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <div className="inline-flex items-center rounded-full border border-line bg-surface p-0.5">
        {(["monthly", "annual"] as const).map((p) => {
          const active = p === period;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-pressed={active}
              className={
                active
                  ? "px-4 py-1.5 rounded-full bg-ink text-white text-[13px] font-semibold transition"
                  : "px-4 py-1.5 rounded-full text-ink-faint text-[13px] font-semibold hover:text-ink transition-colors"
              }
            >
              {p === "monthly" ? monthlyLabel : annualLabel}
            </button>
          );
        })}
      </div>
      {savingsBadge && (
        <span className="font-mono text-[10.5px] px-2.5 py-1 rounded-full bg-accent-soft text-accent-deep">
          {savingsBadge}
        </span>
      )}
    </div>
  );
}
