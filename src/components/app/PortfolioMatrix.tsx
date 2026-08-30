type Point = { id: string; name: string; A: number; V: number };

export function PortfolioMatrix({
  points,
  labels,
  threshold = 50,
  warnings = {},
}: {
  points: Point[];
  labels: {
    quadrantAutomate: string;
    quadrantPlan: string;
    quadrantPrepare: string;
    quadrantSetAside: string;
    axisValue: string;
    axisAptitude: string;
  };
  /** Seuil de priorisation de l'organisation (0-100, défaut 50). */
  threshold?: number;
  /** id de processus -> noms des dépendances pas encore prêtes (diagnostic incomplet, score sous le
   * seuil, ou archivées) — affiché comme avertissement sur le point, pas comme blocage. */
  warnings?: Record<string, string[]>;
}) {
  const P = { x0: 56, y0: 14, x1: 744, y1: 306 };
  const w = P.x1 - P.x0, h = P.y1 - P.y0;
  const mx = P.x0 + (threshold / 100) * w, my = P.y1 - (threshold / 100) * h;
  const quads = [
    { x: mx, y: P.y0, w: P.x1 - mx, h: my - P.y0, fill: "var(--color-accent)", opacity: 0.07 },
    { x: P.x0, y: P.y0, w: mx - P.x0, h: my - P.y0, fill: "var(--color-olive-tint)", opacity: 0.07 },
    { x: mx, y: my, w: P.x1 - mx, h: P.y1 - my, fill: "var(--color-amber-tint)", opacity: 0.08 },
    { x: P.x0, y: my, w: mx - P.x0, h: P.y1 - my, fill: "var(--color-coral-tint)", opacity: 0.07 },
  ];
  const lblFill = "var(--color-ink-faint)";

  return (
    <svg viewBox="0 0 800 340" className="w-full block">
      {quads.map((q, i) => (
        <rect key={i} x={q.x} y={q.y} width={q.w} height={q.h} fill={q.fill} fillOpacity={q.opacity} />
      ))}
      <rect x={P.x0} y={P.y0} width={w} height={h} fill="none" stroke="var(--color-line)" />
      <line x1={mx} y1={P.y0} x2={mx} y2={P.y1} stroke="var(--color-line)" strokeDasharray="3 3" />
      <line x1={P.x0} y1={my} x2={P.x1} y2={my} stroke="var(--color-line)" strokeDasharray="3 3" />
      <text x={mx + 8} y={P.y0 + 16} fontFamily="var(--font-mono)" fontSize={10} fill="var(--color-accent-deep)">
        {labels.quadrantAutomate}
      </text>
      <text x={P.x0 + 8} y={P.y0 + 16} fontFamily="var(--font-mono)" fontSize={10} fill={lblFill}>
        {labels.quadrantPlan}
      </text>
      <text x={mx + 8} y={P.y1 - 8} fontFamily="var(--font-mono)" fontSize={10} fill={lblFill}>
        {labels.quadrantPrepare}
      </text>
      <text x={P.x0 + 8} y={P.y1 - 8} fontFamily="var(--font-mono)" fontSize={10} fill={lblFill}>
        {labels.quadrantSetAside}
      </text>
      <text x={P.x0 + w / 2} y={332} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={11} fill="var(--color-ink-soft)">
        {labels.axisValue}
      </text>
      <text
        x={20}
        y={P.y0 + h / 2}
        textAnchor="middle"
        transform={`rotate(-90 20 ${P.y0 + h / 2})`}
        fontFamily="var(--font-mono)"
        fontSize={11}
        fill="var(--color-ink-soft)"
      >
        {labels.axisAptitude}
      </text>
      {points.map((p) => {
        const px = P.x0 + (p.V / 100) * w;
        const py = P.y1 - (p.A / 100) * h;
        const label = p.name.length > 22 ? p.name.slice(0, 21) + "…" : p.name;
        const labelX = Math.min(Math.max(px, P.x0 + 60), P.x1 - 60);
        const blockedBy = warnings[p.id];
        return (
          <g key={p.id}>
            <circle cx={px} cy={py} r={10} fill="var(--color-accent)" fillOpacity={0.14} />
            <circle cx={px} cy={py} r={5} fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth={1.5} />
            {blockedBy && blockedBy.length > 0 && (
              <g>
                <circle cx={px + 8} cy={py - 8} r={6} fill="var(--color-amber)" stroke="var(--color-surface)" strokeWidth={1.5} />
                <text x={px + 8} y={py - 5} textAnchor="middle" fontFamily="var(--font-sans)" fontSize={8.5} fontWeight={700} fill="white">
                  !
                </text>
                <title>{blockedBy.join(", ")}</title>
              </g>
            )}
            <text x={labelX} y={py - 12} textAnchor="middle" fontFamily="var(--font-sans)" fontSize={10.5} fontWeight={600} fill="var(--color-ink)">
              {label}
              <title>{p.name}</title>
            </text>
          </g>
        );
      })}
    </svg>
  );
}
