"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, ReferenceLine, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";
import { Info, ArrowUpRight, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionHero } from "@/components/ui/SectionHero";
import { Field } from "@/components/ui/Field";
import { Slider } from "@/components/ui/Slider";
import { CURRENCIES, Currency, ROI_HORIZON_YEARS, SAVINGS_REALIZATION_FACTORS, SavingsRealization, getRoiScenarios, RoiInputs, roiResult, roiScenarios, suggestedAutoRate } from "@/lib/scoring";
import { useLocale, useDictionary } from "@/i18n/LocaleProvider";

export function Roi({
  inputs,
  setInputs,
  currency,
  setCurrency,
  processName,
  aptitudeOverall,
  aptitudeAnswered,
  readOnly = false,
  hoursPerFte,
  magnitudeRef,
}: {
  inputs: RoiInputs;
  setInputs: React.Dispatch<React.SetStateAction<RoiInputs>>;
  currency: Currency;
  setCurrency: (v: Currency) => void;
  processName: string;
  aptitudeOverall: number;
  aptitudeAnswered: boolean;
  readOnly?: boolean;
  hoursPerFte?: number;
  magnitudeRef?: number;
}) {
  const locale = useLocale();
  const { roi: t, processBar: pt } = useDictionary().tool;
  const roiScenariosList = useMemo(() => getRoiScenarios(locale), [locale]);
  const c = CURRENCIES[currency];
  const set = <K extends keyof RoiInputs>(k: K, v: RoiInputs[K]) => setInputs((p) => ({ ...p, [k]: v }));
  const r = useMemo(() => roiResult(inputs, hoursPerFte, magnitudeRef), [inputs, hoursPerFte, magnitudeRef]);
  const scenarios = useMemo(() => roiScenarios(inputs, hoursPerFte, magnitudeRef), [inputs, hoursPerFte, magnitudeRef]);
  const fmtLocale = locale === "en" ? "en-CA" : "fr-CA";
  const money = (n: number) => new Intl.NumberFormat(fmtLocale, { maximumFractionDigits: 0 }).format(Math.round(n)) + " " + c.symbol;
  const num = (n: number, d = 0) => new Intl.NumberFormat(fmtLocale, { maximumFractionDigits: d }).format(n);
  const mini = [
    { k: t.miniPaybackLabel, v: r.payback ? `${num(r.payback, 1)} ${t.miniPaybackUnit}` : "-" },
    { k: t.miniNpvLabel.replace("{years}", String(ROI_HORIZON_YEARS)), v: money(r.npv) },
    { k: t.miniHoursLabel, v: `${num(r.savedH)} ${t.miniHoursUnit}` },
    { k: t.miniFteLabel, v: num(r.fte, 2) },
  ];

  const suggested = suggestedAutoRate(aptitudeOverall);
  const tooOptimistic = aptitudeAnswered && inputs.autoRate > suggested + 15;

  return (
    <>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <SectionHero
          eyebrow={t.eyebrow}
          title={t.title}
          sub={t.sub}
        />
        <div className="no-print flex items-center gap-2 shrink-0">
          <span className="text-xs text-ink-faint">{pt.currencyLabel}</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            disabled={readOnly}
            className="border border-line rounded-[12px] px-2.5 py-2 font-mono text-[13px] text-ink bg-surface outline-none cursor-pointer focus:border-accent transition-colors disabled:text-ink-faint disabled:cursor-not-allowed"
          >
            <option value="CAD">CAD $</option>
            <option value="USD">USD $</option>
          </select>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-7 items-start">
        <Card className="no-print p-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t.fieldVolume} unit={t.unitPerMonth} value={inputs.volume} onChange={(v) => set("volume", v)} disabled={readOnly} />
            <Field label={t.fieldMinutes} unit={t.unitMin} value={inputs.minutes} onChange={(v) => set("minutes", v)} disabled={readOnly} />
            <Field label={t.fieldHourlyCost} unit={t.unitPerHour.replace("{symbol}", c.symbol)} value={inputs.hourlyCost} onChange={(v) => set("hourlyCost", v)} disabled={readOnly} />
            <Field label={t.fieldErrorRate} unit={t.unitPercent} value={inputs.errorRate} onChange={(v) => set("errorRate", v)} disabled={readOnly} />
            <Field label={t.fieldRework} unit={t.unitMin} value={inputs.reworkMin} onChange={(v) => set("reworkMin", v)} disabled={readOnly} />
            <div />
            <Field
              label={t.fieldImplCost}
              unit={c.symbol}
              value={inputs.implCost}
              onChange={(v) => set("implCost", v)}
              step={500}
              disabled={readOnly}
              hint={t.fieldImplCostHint}
            />
            <Field
              label={t.fieldLicenseCost}
              unit={c.symbol}
              value={inputs.licenseCost}
              onChange={(v) => set("licenseCost", v)}
              step={100}
              disabled={readOnly}
              hint={t.fieldLicenseCostHint}
            />
            <Field
              label={t.fieldChangeMgmtCost}
              unit={c.symbol}
              value={inputs.changeMgmtCost}
              onChange={(v) => set("changeMgmtCost", v)}
              step={500}
              disabled={readOnly}
              hint={t.fieldChangeMgmtCostHint}
            />
          </div>
          <p className="text-[11.5px] text-ink-faint mt-2.5 leading-snug">
            {t.costNote}
          </p>
          <div className="mt-5.5 grid gap-5 pt-5 border-t border-line-soft">
            <div>
              <Slider label={t.autoRateSlider} value={inputs.autoRate} onChange={(v) => set("autoRate", v)} disabled={readOnly} />
              {aptitudeAnswered ? (
                <div
                  className={clsx(
                    "flex items-start gap-1.5 mt-2 text-[11.5px] leading-snug",
                    tooOptimistic ? "text-coral" : "text-ink-faint"
                  )}
                >
                  {tooOptimistic && <AlertTriangle size={13} className="shrink-0 mt-0.5" />}
                  <span>
                    {t.autoRateEstimate.replace("{overall}", String(aptitudeOverall)).replace("{suggested}", String(suggested))}
                    {tooOptimistic && t.autoRateTooOptimistic}
                  </span>
                </div>
              ) : (
                <p className="text-[11.5px] text-ink-faint mt-2">
                  {t.autoRateNoData}
                </p>
              )}
            </div>
            <div>
              <span className="text-[12.5px] text-ink-soft block mb-1.5">{t.realizationLabel}</span>
              <div className="flex flex-wrap gap-2">
                {(["reduction", "reallocation", "none"] as const).map((opt) => {
                  const on = inputs.savingsRealization === opt;
                  const optLabel = { reduction: t.realizationReduction, reallocation: t.realizationReallocation, none: t.realizationNone }[opt];
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => !readOnly && set("savingsRealization", opt)}
                      disabled={readOnly}
                      className={
                        on
                          ? "px-3 py-1.5 rounded-full border border-accent bg-accent-soft text-accent-deep text-[12px] font-medium transition-colors disabled:cursor-not-allowed"
                          : "px-3 py-1.5 rounded-full border border-line text-ink-soft text-[12px] font-medium hover:border-accent hover:text-accent transition-colors disabled:cursor-not-allowed"
                      }
                    >
                      {optLabel}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11.5px] text-ink-faint mt-2 leading-snug">
                {{ reduction: t.realizationNoteReduction, reallocation: t.realizationNoteReallocation, none: t.realizationNoteNone }[inputs.savingsRealization]}
              </p>
            </div>
            <div>
              <Slider label={t.maintenanceSlider} value={inputs.maintenancePct} onChange={(v) => set("maintenancePct", v)} min={0} max={40} disabled={readOnly} />
              <p className="text-[11.5px] text-ink-faint mt-2 leading-snug">
                {t.maintenanceNote}
              </p>
            </div>
            <div>
              <Slider label={t.discountSlider} value={inputs.discount} onChange={(v) => set("discount", v)} min={0} max={15} disabled={readOnly} />
              <p className="text-[11.5px] text-ink-faint mt-2 leading-snug">
                {t.discountNote}
              </p>
            </div>
          </div>
        </Card>

        <div className="lg:sticky lg:top-[92px] grid gap-3.5">
          <Card className="p-6">
            <div className="flex justify-between items-baseline mb-1">
              <Eyebrow>{t.netSavingsEyebrow}</Eyebrow>
              <span className="font-mono text-xs text-ink-faint">{processName || t.defaultProcessName}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[40px] font-semibold text-accent-deep tracking-[-0.01em]">
                {money(r.netRecurring)}
              </span>
              {r.netRecurring > 0 && <ArrowUpRight size={22} className="text-accent" />}
            </div>
            <div className="grid grid-cols-2 gap-px mt-4.5 bg-line border border-line rounded-[10px] overflow-hidden">
              {mini.map((m) => (
                <div key={m.k} className="bg-surface px-4 py-3.5">
                  <div className="text-[11.5px] text-ink-soft">{m.k}</div>
                  <div className="font-mono text-[19px] font-semibold text-ink mt-0.5">{m.v}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 items-start mt-3.5 text-[11.5px] text-ink-faint leading-relaxed">
              <Info size={13} className="shrink-0 mt-0.5" />
              <span>
                {t.currentCostLabel}{" "}
                <b className="text-ink-soft font-mono">{money(r.currentCost)}{t.perYear}</b> ({num(r.currentH)} h). {t.maintenanceEstimatedLabel}{" "}
                <b className="text-ink-soft font-mono">{money(r.maintenanceCost)}{t.perYear}</b>. {t.totalUpfrontLabel}{" "}
                <b className="text-ink-soft font-mono">{money(r.totalUpfrontCost)}</b>. {t.valueScoreLabel}{" "}
                <b className="text-accent-deep font-mono">{r.valueScore}/100</b> {t.feedsIntoPrioritization}
              </span>
            </div>
            <div className="flex gap-1.5 items-start mt-2 text-[11px] text-ink-faint leading-snug">
              <Info size={12} className="shrink-0 mt-0.5" />
              <span>
                {t.realizationSummary
                  .replace("{gross}", money(r.laborSavings))
                  .replace("{pct}", String(Math.round(SAVINGS_REALIZATION_FACTORS[inputs.savingsRealization] * 100)))}
              </span>
            </div>
          </Card>

          <Card className="p-5.5">
            <Eyebrow className="mb-3">{t.scenarioRangeEyebrow}</Eyebrow>
            <div className="grid grid-cols-3 gap-px bg-line border border-line rounded-[10px] overflow-hidden">
              {roiScenariosList.map((s) => (
                <div key={s.id} className={clsx("px-3 py-3", s.id === "likely" ? "bg-accent-soft" : "bg-surface")}>
                  <div className="text-[11px] text-ink-soft">{s.label}</div>
                  <div
                    className={clsx(
                      "font-mono text-[14.5px] font-semibold mt-0.5",
                      s.id === "likely" ? "text-accent-deep" : "text-ink"
                    )}
                  >
                    {money(scenarios[s.id].netRecurring)}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-ink-faint mt-2.5 leading-snug">
              {t.scenarioNote}
            </p>
          </Card>

          <Card className="p-5.5">
            <div className="flex justify-between items-center mb-1">
              <Eyebrow>{t.cashflowEyebrow.replace("{months}", String(ROI_HORIZON_YEARS * 12))}</Eyebrow>
              {r.payback && (
                <span className="font-mono text-[11px] text-accent-deep bg-accent-soft px-2 py-0.5 rounded-full font-semibold">
                  {t.paybackThreshold.replace("{n}", num(r.payback, 1))}
                </span>
              )}
            </div>
            <div className="h-[168px] mt-2 -mx-1.5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={r.cash} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="cad-g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-line-soft)" vertical={false} />
                  <XAxis
                    dataKey="m"
                    tick={{ fill: "var(--color-ink-faint)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-line)" }}
                    tickFormatter={(v) => v + "m"}
                  />
                  <YAxis
                    tick={{ fill: "var(--color-ink-faint)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                    tickLine={false}
                    axisLine={false}
                    width={46}
                    tickFormatter={(v) => (Math.abs(v) >= 1000 ? Math.round(v / 1000) + "k" : v)}
                  />
                  <ReferenceLine y={0} stroke="var(--color-ink-faint)" strokeDasharray="3 3" />
                  <Tooltip
                    formatter={(v) => [money(Number(v)), t.tooltipCumulative]}
                    labelFormatter={(m) => t.tooltipMonth.replace("{m}", String(m))}
                    contentStyle={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid var(--color-line)",
                      boxShadow: "var(--shadow-card)",
                    }}
                  />
                  <Area type="monotone" dataKey="cum" stroke="var(--color-accent)" strokeWidth={2.5} fill="url(#cad-g)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
