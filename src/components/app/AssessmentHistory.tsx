"use client";

import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";
import { History } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { CURRENCIES, Currency } from "@/lib/scoring";
import { useLocale, useDictionary } from "@/i18n/LocaleProvider";

export type HistoryPoint = {
  id: string;
  aptitude_score: number | null;
  value_score: number | null;
  net_recurring: number | null;
  saved_at: string;
};

export function AssessmentHistory({ history, currency }: { history: HistoryPoint[]; currency: Currency }) {
  const locale = useLocale();
  const { assessmentHistory: t } = useDictionary().tool;
  if (history.length === 0) return null;

  if (history.length === 1) {
    return (
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <History size={14} className="text-accent" />
          <Eyebrow>{t.eyebrow}</Eyebrow>
        </div>
        <p className="text-[12.5px] text-ink-soft">
          {t.singleEntryNote}
        </p>
      </Card>
    );
  }

  const c = CURRENCIES[currency];
  const fmtLocale = locale === "en" ? "en-CA" : "fr-CA";
  const money = (n: number) => new Intl.NumberFormat(fmtLocale, { maximumFractionDigits: 0 }).format(Math.round(n)) + " " + c.symbol;
  const dateFmt = new Intl.DateTimeFormat(fmtLocale, { dateStyle: "short" });

  const data = [...history]
    .sort((a, b) => new Date(a.saved_at).getTime() - new Date(b.saved_at).getTime())
    .map((h) => ({
      date: dateFmt.format(new Date(h.saved_at)),
      aptitude: h.aptitude_score,
      valeur: h.value_score,
      net: h.net_recurring,
    }));

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <History size={14} className="text-accent" />
        <Eyebrow>{t.eyebrow}</Eyebrow>
      </div>
      <p className="text-[12.5px] text-ink-soft mb-4">
        {t.description.replace("{n}", String(history.length))}
      </p>
      <div className="h-[180px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--color-line-soft)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--color-ink-faint)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-line)" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "var(--color-ink-faint)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <Tooltip
              formatter={(v, name) => [v, name === "aptitude" ? t.tooltipAptitude : t.tooltipValue]}
              contentStyle={{
                fontFamily: "var(--font-mono)", fontSize: 12, borderRadius: 8,
                border: "1px solid var(--color-line)", boxShadow: "var(--shadow-card)",
              }}
            />
            <Line type="monotone" dataKey="aptitude" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="valeur" stroke="var(--color-gold-tint)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-5 mt-1 text-[11.5px] text-ink-faint">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-accent)" }} /> {t.legendAptitude}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-gold-tint)" }} /> {t.legendValue}
        </span>
      </div>
      {data.length > 0 && data[data.length - 1].net != null && (
        <p className="text-[11.5px] text-ink-faint mt-3 pt-3 border-t border-line-soft">
          {t.lastNetSavings} <span className="font-mono text-ink-soft">{money(data[data.length - 1].net!)}</span>{t.perYear}.
        </p>
      )}
    </Card>
  );
}
