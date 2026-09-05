"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FileText, Gauge, Calculator, LayoutGrid, ListChecks, Sparkles, Compass } from "lucide-react";
import { GaugeArc } from "@/components/ui/GaugeArc";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Matrix } from "@/components/app/Matrix";
import { getLevels } from "@/lib/scoring";
import { useLocale, useDictionary } from "@/i18n/LocaleProvider";

const SCENE_MS = 4200;
const SCENE_ICONS = [FileText, Gauge, Calculator, LayoutGrid, ListChecks];
// Même rotation de teintes que les étapes de « Comment ça marche » : une scène
// et son étape portent la même couleur, la position dans le parcours se lit
// d'un bloc à l'autre.
const SCENE_TINTS = [
  "bg-tint-lime text-tint-lime-ink",
  "bg-tint-sky text-tint-sky-ink",
  "bg-tint-sand text-tint-sand-ink",
  "bg-tint-clay text-tint-clay-ink",
  "bg-tint-sage text-tint-sage-ink",
];

function useCountUp(target: number, active: boolean, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return value;
}

function ContextScene({ t }: { t: ReturnType<typeof useDictionary>["landing"]["journeyDemo"] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);
  const fields = [
    { label: t.contextFields.sponsor, value: t.contextFields.sponsorValue },
    { label: t.contextFields.systems, value: t.contextFields.systemsValue },
    { label: t.contextFields.regulations, value: t.contextFields.regulationsValue },
  ];
  return (
    <div>
      <Eyebrow>{t.contextEyebrow}</Eyebrow>
      <div className="mt-3 space-y-2.5">
        {fields.map((f, i) => (
          <div
            key={f.label}
            className="border border-line rounded-[12px] p-3 transition-[opacity,transform] ease-out"
            style={{
              opacity: ready ? 1 : 0,
              transform: ready ? "translateY(0)" : "translateY(6px)",
              transitionDuration: "500ms",
              transitionDelay: `${i * 120}ms`,
            }}
          >
            <div className="text-[10.5px] text-ink-faint mb-1">{f.label}</div>
            <div className="text-[12.5px] text-ink font-medium">{f.value}</div>
          </div>
        ))}
      </div>
      <div
        className="mt-4 pt-4 border-t border-line-soft flex items-center gap-2.5 transition-opacity"
        style={{ opacity: ready ? 1 : 0, transitionDuration: "500ms", transitionDelay: "420ms" }}
      >
        <span className="w-7 h-7 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
          <Sparkles size={13} className="text-accent-deep" />
        </span>
        <span className="text-[11.5px] text-ink-soft">{t.aiSuggestion}</span>
      </div>
    </div>
  );
}

function DiagnosticScene({ t }: { t: ReturnType<typeof useDictionary>["landing"]["journeyDemo"] }) {
  const locale = useLocale();
  const level = getLevels(locale)[3];
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);
  const score = useCountUp(78, ready, 1100);
  const levers = [
    { label: t.diagnosticLevers.std, v: 82 },
    { label: t.diagnosticLevers.rules, v: 74 },
    { label: t.diagnosticLevers.data, v: 69 },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Eyebrow>{t.diagnosticEyebrow}</Eyebrow>
        <span
          className="px-2.5 py-1 rounded-full text-white font-mono text-[11px] font-semibold transition-opacity duration-500"
          style={{ background: level.color, opacity: ready ? 1 : 0 }}
        >
          {level.label}
        </span>
      </div>
      <GaugeArc score={score} level={level} caption={t.diagnosticCaption} />
      <div className="mt-4 pt-4 border-t border-line-soft space-y-2.5">
        {levers.map((r, i) => (
          <div key={r.label} className="flex items-center gap-3">
            <span className="text-[11.5px] text-ink-soft flex-1">{r.label}</span>
            <div className="w-20 h-1.5 bg-line-soft rounded-full overflow-hidden">
              <div
                className="h-full w-full bg-accent rounded-full origin-left transition-transform ease-out"
                style={{
                  transform: `scaleX(${ready ? r.v / 100 : 0})`,
                  transitionDuration: "900ms",
                  transitionDelay: `${150 + i * 120}ms`,
                }}
              />
            </div>
            <span className="font-mono text-[11px] text-ink w-6 text-right">{ready ? r.v : 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoiScene({ t }: { t: ReturnType<typeof useDictionary>["landing"]["journeyDemo"] }) {
  const locale = useLocale();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);
  const net = useCountUp(62400, ready, 1000);
  const npv = useCountUp(148900, ready, 1000);
  const payback = useCountUp(52, ready, 800);
  const money = (n: number) => new Intl.NumberFormat(locale === "en" ? "en-CA" : "fr-CA", { maximumFractionDigits: 0 }).format(n) + " $";

  return (
    <div>
      <Eyebrow>{t.roiEyebrow}</Eyebrow>
      <div className="font-mono text-[34px] font-bold text-accent-deep mt-1 mb-5 tabular-nums">
        {money(net)}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-line rounded-[12px] p-3">
          <div className="text-[10.5px] text-ink-faint mb-1">{t.roiPayback}</div>
          <div className="font-mono text-[17px] font-semibold text-ink tabular-nums">
            {(payback / 10).toFixed(1)} {t.roiPaybackUnit}
          </div>
        </div>
        <div className="border border-line rounded-[12px] p-3">
          <div className="text-[10.5px] text-ink-faint mb-1">{t.roiNpv}</div>
          <div className="font-mono text-[17px] font-semibold text-ink tabular-nums">{money(npv)}</div>
        </div>
      </div>
      <div className="mt-5 pt-4 border-t border-line-soft">
        <svg viewBox="0 0 320 70" className="w-full block">
          <line x1="0" y1="52" x2="320" y2="52" stroke="var(--color-line)" strokeDasharray="3 3" />
          <polyline
            points="0,66 60,58 120,44 180,26 240,12 320,2"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={2.5}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={100}
            strokeDashoffset={ready ? 0 : 100}
            style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1) .15s" }}
          />
        </svg>
        <div className="text-[10.5px] text-ink-faint text-center -mt-1">{t.roiCashflow}</div>
      </div>
    </div>
  );
}

function PrioScene({ t }: { t: ReturnType<typeof useDictionary>["landing"]["journeyDemo"] }) {
  const { portfolioMatrix: matrixLabels } = useDictionary().tool;
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 200);
    return () => clearTimeout(t);
  }, []);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Eyebrow>{t.prioEyebrow}</Eyebrow>
        <span
          className="px-2.5 py-1 rounded-full text-white font-mono text-[11px] font-semibold transition-opacity duration-500"
          style={{ background: "var(--color-accent)", opacity: ready ? 1 : 0 }}
        >
          {t.prioBadge}
        </span>
      </div>
      <Matrix A={ready ? 78 : 50} V={ready ? 82 : 50} name={t.prioProcessName} show={ready} labels={matrixLabels} />
    </div>
  );
}

function RoadmapScene({ t }: { t: ReturnType<typeof useDictionary>["landing"]["journeyDemo"] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(timer);
  }, []);
  const rows = [
    { label: t.roadmapRows.immediate, widthPct: 12, gold: true },
    { label: t.roadmapRows.phase1, widthPct: 32, gold: false },
    { label: t.roadmapRows.phase2, widthPct: 58, gold: false },
  ];
  return (
    <div>
      <Eyebrow>{t.roadmapEyebrow}</Eyebrow>
      <div className="mt-4 space-y-3.5">
        {rows.map((r, i) => (
          <div key={r.label}>
            <div className="text-[11px] text-ink-soft mb-1.5">{r.label}</div>
            <div className="h-2.5 bg-line-soft rounded-full overflow-hidden">
              <div
                className={"h-full rounded-full origin-left " + (r.gold ? "bg-gold-tint" : "bg-accent")}
                style={{
                  width: `${r.widthPct}%`,
                  transform: `scaleX(${ready ? 1 : 0})`,
                  transitionProperty: "transform",
                  transitionDuration: "700ms",
                  transitionTimingFunction: "cubic-bezier(.22,1,.36,1)",
                  transitionDelay: `${150 + i * 140}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div
        className="mt-5 pt-4 border-t border-line-soft flex items-center gap-2.5 transition-opacity"
        style={{ opacity: ready ? 1 : 0, transitionDuration: "500ms", transitionDelay: "520ms" }}
      >
        <span className="w-7 h-7 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
          <Compass size={13} className="text-accent-deep" />
        </span>
        <span className="text-[11.5px] text-ink-soft">{t.roadmapCaption}</span>
      </div>
    </div>
  );
}

export function JourneyDemo() {
  const { landing } = useDictionary();
  const t = landing.journeyDemo;
  const SCENES = [
    { id: "contexte", label: t.tabs.contexte },
    { id: "diagnostic", label: t.tabs.diagnostic },
    { id: "roi", label: t.tabs.roi },
    { id: "prio", label: t.tabs.prio },
    { id: "roadmap", label: t.tabs.roadmap },
  ] as const;

  const [phase, setPhase] = useState(0);
  const [tick, setTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Un carrousel qui avance tout seul est pénible pour qui a demandé moins de
  // mouvement : sous prefers-reduced-motion, la démo attend le clic.
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    timerRef.current = setInterval(() => {
      setPhase((p) => (p + 1) % SCENES.length);
      setTick((t) => t + 1);
    }, SCENE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [SCENES.length, reduced]);

  const goTo = (i: number) => {
    setPhase(i);
    setTick((t) => t + 1);
    if (timerRef.current) clearInterval(timerRef.current);
    if (reduced) return;
    timerRef.current = setInterval(() => {
      setPhase((p) => (p + 1) % SCENES.length);
      setTick((t) => t + 1);
    }, SCENE_MS);
  };

  return (
    // Fenêtre produit à deux colonnes : le parcours à gauche, la scène à
    // droite. La scène garde la largeur pour laquelle elle a été dessinée,
    // c'est la fenêtre qui gagne en présence, pas le contenu qui s'étire.
    <div className="relative mx-auto max-w-[980px]">
      <div className="absolute -inset-3 sm:-inset-5 rounded-[32px] bg-gradient-to-br from-accent-soft to-transparent -z-10" />
      <div className="bg-surface border border-line rounded-[24px] shadow-card-lg overflow-hidden grid lg:grid-cols-[276px_1fr]">
        <nav
          aria-label={t.tabs.contexte}
          className="border-b lg:border-b-0 lg:border-r border-line-soft p-4 sm:p-5 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible"
        >
          {SCENES.map((s, i) => {
            const Icon = SCENE_ICONS[i];
            const active = phase === i;
            return (
              <button
                key={s.id}
                onClick={() => goTo(i)}
                aria-current={active ? "step" : undefined}
                className={
                  "relative shrink-0 lg:w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[13px] font-semibold text-left transition overflow-hidden whitespace-nowrap " +
                  (active ? "bg-bg text-ink" : "text-ink-faint hover:text-ink-soft")
                }
              >
                <span
                  className={`w-8 h-8 shrink-0 rounded-[10px] border border-ink/10 flex items-center justify-center transition ${
                    active ? SCENE_TINTS[i] : "bg-bg text-ink-faint"
                  }`}
                >
                  <Icon size={15} />
                </span>
                <span className="hidden lg:block flex-1">{s.label}</span>
                <span className="lg:hidden">{active ? s.label : ""}</span>
                {/* La barre dit combien de temps il reste avant que la démo
                    passe seule à l'étape suivante. Elle disparaît quand
                    l'avance automatique est coupée, où elle mentirait. */}
                {active && !reduced && (
                  <motion.span
                    key={tick}
                    aria-hidden
                    className="absolute left-0 bottom-0 h-0.5 w-full bg-accent origin-left"
                    initial={{ transform: "scaleX(0)" }}
                    animate={{ transform: "scaleX(1)" }}
                    transition={{ duration: SCENE_MS / 1000, ease: "linear" }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="relative min-h-[340px] p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={tick}
              className="mx-auto max-w-[420px]"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {phase === 0 && <ContextScene t={t} />}
              {phase === 1 && <DiagnosticScene t={t} />}
              {phase === 2 && <RoiScene t={t} />}
              {phase === 3 && <PrioScene t={t} />}
              {phase === 4 && <RoadmapScene t={t} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
