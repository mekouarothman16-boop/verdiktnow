/** Le SVG ne fait pas de retour à la ligne automatique : un nom de processus long doit donc être
 * raccourci et/ou réduit en taille pour rester lisible dans la largeur disponible du graphique.
 * Le nom complet reste consultable via l'infobulle native <title>. */
function truncateName(name: string, max = 26): string {
  return name.length > max ? `${name.slice(0, max - 1).trimEnd()}…` : name;
}

function fitFontSize(name: string): number {
  if (name.length > 28) return 8.5;
  if (name.length > 18) return 9.5;
  return 11;
}

export function Matrix({
  V,
  A,
  name,
  show,
  labels,
  threshold = 50,
}: {
  V: number;
  A: number;
  name: string;
  show: boolean;
  labels: {
    quadrantAutomate: string;
    quadrantPlan: string;
    quadrantPrepare: string;
    quadrantSetAside: string;
    axisValue: string;
    axisAptitude: string;
    defaultProcessName: string;
  };
  /** Seuil de priorisation de l'organisation (0-100, défaut 50) — même valeur des deux côtés
   * de la matrice, cohérente avec le verdict textuel calculé ailleurs. */
  threshold?: number;
}) {
  const P = { x0: 46, y0: 14, x1: 344, y1: 306 };
  const w = P.x1 - P.x0, h = P.y1 - P.y0;
  const mx = P.x0 + (threshold / 100) * w, my = P.y1 - (threshold / 100) * h;
  const px = P.x0 + (V / 100) * w, py = P.y1 - (A / 100) * h;
  const quads = [
    { x: mx, y: P.y0, w: P.x1 - mx, h: my - P.y0, fill: "var(--color-accent)", opacity: 0.07 },
    { x: P.x0, y: P.y0, w: mx - P.x0, h: my - P.y0, fill: "var(--color-olive-tint)", opacity: 0.07 },
    { x: mx, y: my, w: P.x1 - mx, h: P.y1 - my, fill: "var(--color-amber-tint)", opacity: 0.08 },
    { x: P.x0, y: my, w: mx - P.x0, h: P.y1 - my, fill: "var(--color-coral-tint)", opacity: 0.07 },
  ];
  const lblFill = "var(--color-ink-faint)";
  return (
    <svg viewBox="0 0 360 340" className="w-full block">
      {quads.map((q, i) => (
        <rect key={i} x={q.x} y={q.y} width={q.w} height={q.h} fill={q.fill} fillOpacity={q.opacity} />
      ))}
      <rect x={P.x0} y={P.y0} width={w} height={h} fill="none" stroke="var(--color-line)" />
      <line x1={mx} y1={P.y0} x2={mx} y2={P.y1} stroke="var(--color-line)" strokeDasharray="3 3" />
      <line x1={P.x0} y1={my} x2={P.x1} y2={my} stroke="var(--color-line)" strokeDasharray="3 3" />
      <text x={mx + 6} y={P.y0 + 16} fontFamily="var(--font-mono)" fontSize={9.5} fill="var(--color-accent-deep)">
        {labels.quadrantAutomate}
      </text>
      <text x={P.x0 + 6} y={P.y0 + 16} fontFamily="var(--font-mono)" fontSize={9.5} fill={lblFill}>
        {labels.quadrantPlan}
      </text>
      <text x={mx + 6} y={P.y1 - 8} fontFamily="var(--font-mono)" fontSize={9.5} fill={lblFill}>
        {labels.quadrantPrepare}
      </text>
      <text x={P.x0 + 6} y={P.y1 - 8} fontFamily="var(--font-mono)" fontSize={9.5} fill={lblFill}>
        {labels.quadrantSetAside}
      </text>
      <text x={P.x0 + w / 2} y={332} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={11} fill="var(--color-ink-soft)">
        {labels.axisValue}
      </text>
      <text
        x={14}
        y={P.y0 + h / 2}
        textAnchor="middle"
        transform={`rotate(-90 14 ${P.y0 + h / 2})`}
        fontFamily="var(--font-mono)"
        fontSize={11}
        fill="var(--color-ink-soft)"
      >
        {labels.axisAptitude}
      </text>
      {show && (
        <g style={{ transition: "all .5s cubic-bezier(.22,1,.36,1)" }}>
          <circle cx={px} cy={py} r={12} fill="var(--color-accent)" fillOpacity={0.16} />
          <circle cx={px} cy={py} r={6} fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth={2} />
          <text
            x={Math.min(Math.max(px, P.x0 + 60), P.x1 - 60)}
            y={py - 14}
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontSize={fitFontSize(name || labels.defaultProcessName)}
            fontWeight={600}
            fill="var(--color-ink)"
          >
            {truncateName(name || labels.defaultProcessName)}
            <title>{name || labels.defaultProcessName}</title>
          </text>
        </g>
      )}
    </svg>
  );
}
