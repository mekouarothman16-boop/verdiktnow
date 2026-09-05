"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, ChevronDown, Plus, Trash2, BadgeCheck } from "lucide-react";
import clsx from "clsx";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Answers, Context, getDimensions, getLikert, Weights, diagnosticResult } from "@/lib/scoring";
import { deleteSecondOpinion, listSecondOpinions, submitSecondOpinion, type SecondOpinionEntry } from "@/lib/supabase/secondOpinionActions";
import { useLocale, useDictionary } from "@/i18n/LocaleProvider";

export function SecondOpinion({
  processId,
  primaryOverall,
  primaryDimScores,
  weights,
  context,
  readOnly = false,
}: {
  processId: string;
  primaryOverall: number;
  primaryDimScores: Record<string, number>;
  weights: Weights;
  context: Context;
  readOnly?: boolean;
}) {
  const locale = useLocale();
  const { secondOpinion: t } = useDictionary().tool;
  const dimensions = useMemo(() => getDimensions(locale), [locale]);
  const likert = useMemo(() => getLikert(locale), [locale]);
  const [opinions, setOpinions] = useState<SecondOpinionEntry[] | null>(null);
  const [open, setOpen] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [draft, setDraft] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listSecondOpinions(processId).then(setOpinions);
  }, [processId]);

  const mine = opinions?.find((o) => o.isMine) ?? null;
  const totalQ = dimensions.reduce((s, d) => s + d.questions.length, 0);
  const answeredCount = Object.keys(draft).length;
  const converging = (opinions ?? []).some((o) => {
    const d = diagnosticResult(o.answers, weights, context, locale);
    return d.answeredCount >= Math.ceil(totalQ * 0.8) && Math.abs(d.overall - primaryOverall) <= 15;
  });

  const startAnswering = () => {
    setDraft(mine?.answers ?? {});
    setAnswering(true);
    setOpen(true);
  };
  const setVal = (qid: string, v: number) => setDraft((p) => ({ ...p, [qid]: v }));

  const submit = async () => {
    setSubmitting(true);
    const res = await submitSecondOpinion(processId, draft);
    setSubmitting(false);
    if (res.ok) {
      setAnswering(false);
      listSecondOpinions(processId).then(setOpinions);
    }
  };

  const remove = async () => {
    setOpinions((prev) => (prev ?? []).filter((o) => !o.isMine));
    await deleteSecondOpinion(processId);
  };

  if (opinions === null) return null;

  return (
    <Card className="p-5.5">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-2 text-left">
        <Users size={14} className="text-accent" />
        <Eyebrow>{t.eyebrow}</Eyebrow>
        {opinions.length > 0 && (
          <span className="font-mono text-[11px] text-ink-faint">{opinions.length}</span>
        )}
        {converging && (
          <span
            title={t.convergingTooltip}
            className="flex items-center gap-1 font-mono text-[10px] text-accent-deep bg-accent-soft px-1.5 py-0.5 rounded whitespace-nowrap"
          >
            <BadgeCheck size={11} /> {t.convergingBadge}
          </span>
        )}
        <ChevronDown size={15} className={clsx("text-ink-faint transition-transform ml-auto", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-3.5">
          <p className="text-[11.5px] text-ink-faint leading-relaxed mb-3 max-w-[640px]">
            {t.description}
          </p>

          {opinions.length > 0 && (
            <div className="grid gap-2 mb-4">
              {dimensions.map((d) => {
                const primary = primaryDimScores[d.id] ?? 0;
                return (
                  <div key={d.id} className="flex flex-wrap items-center gap-2 py-1">
                    <span className="w-[140px] text-[11.5px] text-ink-soft shrink-0">{d.label}</span>
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-line-soft text-ink-faint">
                      {t.primaryTag.replace("{n}", String(primary))}
                    </span>
                    {opinions.map((o) => {
                      const diagO = diagnosticResult(o.answers, weights, context, locale);
                      const score = diagO.dimScores.find((x) => x.id === d.id)?.score ?? 0;
                      const gap = Math.abs(score - primary);
                      return (
                        <span
                          key={o.respondentId}
                          title={`${o.respondentEmail} : ${score}/100`}
                          className={clsx(
                            "font-mono text-[11px] px-1.5 py-0.5 rounded whitespace-nowrap",
                            gap > 25 ? "bg-coral/10 text-coral" : gap > 10 ? "bg-gold-soft text-gold" : "bg-accent-soft text-accent-deep"
                          )}
                        >
                          {o.respondentEmail.split("@")[0]} {score}
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {!answering && !readOnly && (
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={startAnswering}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-accent hover:underline"
              >
                <Plus size={13} /> {mine ? t.editMineButton : t.answerIndependentlyButton}
              </button>
              {mine && (
                <button onClick={remove} className="flex items-center gap-1.5 text-[12px] text-ink-faint hover:text-coral transition-colors">
                  <Trash2 size={13} /> {t.removeMineButton}
                </button>
              )}
            </div>
          )}

          {answering && (
            <div className="border-t border-line-soft pt-3.5 mt-1">
              <div className="grid gap-4 max-h-[420px] overflow-y-auto pr-1">
                {dimensions.map((d) => (
                  <div key={d.id}>
                    <div className="text-[11.5px] font-semibold text-ink-soft mb-1.5">{d.label}</div>
                    {d.questions.map((q, i) => {
                      const qid = `${d.id}-${i}`;
                      const cur = draft[qid];
                      return (
                        <div key={qid} className="py-1.5">
                          <div className="text-[12px] text-ink mb-1 leading-snug">{q.text}</div>
                          <div className="flex gap-1">
                            {likert.map((o) => (
                              <button
                                key={o.v}
                                onClick={() => setVal(qid, o.v)}
                                title={o.label}
                                className={clsx(
                                  "flex-1 py-1.5 rounded font-mono text-[11px] border transition-colors",
                                  cur === o.v
                                    ? "border-accent bg-accent text-white"
                                    : "border-line text-ink-soft hover:border-accent hover:text-accent"
                                )}
                              >
                                {o.v}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-3.5 pt-3.5 border-t border-line-soft flex-wrap">
                <button
                  onClick={submit}
                  disabled={submitting || answeredCount === 0}
                  className="px-4 py-2.5 rounded-full bg-accent-vivid text-ink text-[13px] font-semibold hover:brightness-95 transition disabled:opacity-60"
                >
                  {submitting ? t.submitting : t.submitButton}
                </button>
                <span className="text-[11px] text-ink-faint">{t.answeredCount.replace("{n}", String(answeredCount)).replace("{total}", String(totalQ))}</span>
                <button onClick={() => setAnswering(false)} className="text-[12px] text-ink-faint hover:text-ink ml-auto">
                  {t.cancelButton}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
