import {
  Document, Page, View, Text, StyleSheet, Svg, Path, Rect, Circle, Line, Polyline, Polygon, Image,
} from "@react-pdf/renderer";
import type {
  AdoptionEase, AnalysisResult, Answers, ApproachRecommendation, AssessmentConfidence, Context, Currency, DiagnosticResult,
  PortfolioEntry, PortfolioLeverRow, ProcessActivity, RoiInputs, RoiResult, RoiScenarioId, SensitivityRow,
  ToolInventory, ToolRole, Weights,
} from "@/lib/scoring";
import { DEFAULT_WEIGHTS, DIMENSIONS, getApplicableContextQuestions, getDimensions, getLikert, getRoiScenarios, parseAiSeededAnswers, ROI_HORIZON_YEARS, sponsorDisplay, totalActivityMinutes } from "@/lib/scoring";
import { confidenceLabelDisplay, adoptionLabelDisplay } from "@/lib/scoring";
import type { RaciRow, Roadmap, RiskRegisterEntry, VendorSuggestion } from "@/lib/pdf/roadmap";
import { riskLevelLabel } from "@/lib/pdf/roadmap";
import { registerReportFonts } from "@/lib/pdf/fonts";
import { money, num, statFontSize, truncate } from "@/lib/pdf/format";
import { getDictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/config";

registerReportFonts();

const SANS = "Inter";
const MONO = "JetBrains Mono";

const COLOR = {
  bg: "#E9ECEA",
  surface: "#FFFFFF",
  ink: "#091315",
  inkSoft: "#686464",
  inkFaint: "#6D7373",
  line: "#D7DBD8",
  lineSoft: "#E2E5E2",
  accent: "#55631A",
  accentDeep: "#3D4712",
  accentSoft: "#F2FFD9",
  accentVivid: "#D7FF53",
  gold: "#8A6D2E",
  goldTint: "#C9A227",
  goldSoft: "#F7EFDC",
  coral: "#C45033",
  teal: "#348269",
};

/** Rôles de l'inventaire d'outils, du levier vers l'obstacle — même ordre qu'à l'écran. */
const TOOL_ROLE_DISPLAY_ORDER: (ToolRole | "unknown")[] = ["platform", "connected", "data", "manual", "unknown"];

/** Une couleur par rôle, pour que « moteur déjà en place » et « frein » se distinguent d'un coup d'œil. */
const TOOL_ROLE_COLOR: Record<ToolRole | "unknown", { bg: string; border: string; text: string }> = {
  platform: { bg: COLOR.accentSoft, border: COLOR.accent, text: COLOR.accentDeep },
  connected: { bg: COLOR.surface, border: COLOR.teal, text: COLOR.teal },
  data: { bg: COLOR.goldSoft, border: COLOR.goldTint, text: COLOR.gold },
  manual: { bg: COLOR.surface, border: COLOR.coral, text: COLOR.coral },
  unknown: { bg: COLOR.lineSoft, border: COLOR.line, text: COLOR.inkFaint },
};

const s = StyleSheet.create({
  page: { paddingTop: 34, paddingBottom: 44, paddingHorizontal: 40, fontFamily: SANS, fontWeight: 400, fontSize: 9.5, color: COLOR.ink },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  headerRule: { height: 1, backgroundColor: COLOR.line, marginBottom: 20 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoMark: { width: 20, height: 20, borderRadius: 5, backgroundColor: COLOR.ink, alignItems: "center", justifyContent: "center" },
  logoMarkText: { color: "#FFFFFF", fontSize: 9, fontFamily: MONO, fontWeight: 700 },
  wordmark: { fontFamily: MONO, fontWeight: 700, fontSize: 11.5, letterSpacing: 1.5, color: COLOR.ink },
  headerMeta: { alignItems: "flex-end" },
  headerMetaText: { fontSize: 7.5, color: COLOR.inkFaint, fontFamily: MONO },
  headerSection: { fontSize: 7.5, color: COLOR.accentDeep, fontFamily: MONO, fontWeight: 700, letterSpacing: 0.5 },

  processBlock: { marginBottom: 20 },
  eyebrow: { fontFamily: MONO, fontWeight: 600, fontSize: 8, letterSpacing: 1.5, color: COLOR.inkFaint, marginBottom: 4, textTransform: "uppercase" },
  processName: { fontSize: 20, fontFamily: SANS, fontWeight: 700, color: COLOR.ink, marginBottom: 3 },
  processMeta: { fontSize: 8.5, color: COLOR.inkSoft },

  sectionHeading: { marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontFamily: SANS, fontWeight: 800, color: COLOR.ink, marginBottom: 7 },
  sectionRule: { height: 2.5, width: 34, backgroundColor: COLOR.gold, borderRadius: 2 },
  cardTitle: { fontSize: 9.5, fontFamily: SANS, fontWeight: 700, color: COLOR.ink, marginBottom: 10 },

  card: { borderWidth: 1, borderColor: COLOR.line, borderRadius: 8, padding: 14, backgroundColor: COLOR.surface, marginBottom: 12 },
  row: { flexDirection: "row" },
  colGap: { gap: 12 },

  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, fontSize: 8, fontFamily: SANS, fontWeight: 700, color: "#FFFFFF" },
  badgeSoft: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, fontSize: 7.5, fontFamily: MONO, fontWeight: 700, backgroundColor: COLOR.accentSoft, color: COLOR.accentDeep },

  leverRow: { flexDirection: "row", alignItems: "center", marginBottom: 7, gap: 8 },
  leverLabel: { width: 150, fontSize: 8.5, color: COLOR.inkSoft },
  leverBarTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: COLOR.lineSoft },
  leverBarFill: { height: 6, borderRadius: 3, backgroundColor: COLOR.accent },
  leverScore: { width: 24, textAlign: "right", fontSize: 8.5, fontFamily: MONO, fontWeight: 700, color: COLOR.ink },

  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 4 },
  metricBox: { width: "28%", borderTopWidth: 2, borderTopColor: COLOR.line, paddingTop: 8 },
  metricLabel: { fontSize: 7.5, color: COLOR.inkSoft, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.4 },
  metricValue: { fontSize: 14.5, fontFamily: MONO, fontWeight: 700, color: COLOR.ink },

  table: { borderWidth: 1, borderColor: COLOR.line, borderRadius: 6, overflow: "hidden" },
  tHeadRow: { flexDirection: "row", backgroundColor: COLOR.lineSoft },
  tRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: COLOR.line },
  tCell: { flex: 1, padding: 7, fontSize: 8 },
  tCellHead: { flex: 1, padding: 7, fontSize: 7.5, fontFamily: SANS, fontWeight: 700, color: COLOR.inkSoft, textTransform: "uppercase" },

  bullet: { flexDirection: "row", gap: 5, marginBottom: 3 },
  bulletDot: { fontSize: 8.5, color: COLOR.accent },
  bulletText: { fontSize: 8.5, color: COLOR.inkSoft, flex: 1, lineHeight: 1.4 },

  footer: { position: "absolute", bottom: 20, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: COLOR.inkFaint, fontFamily: MONO },

  coverTop: { flex: 1 },
  coverBrandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  coverWordmark: { fontFamily: MONO, fontWeight: 700, fontSize: 15, letterSpacing: 2.5, color: COLOR.ink },
  coverRule: { height: 3, width: 46, backgroundColor: COLOR.gold, borderRadius: 2, marginTop: 26, marginBottom: 46 },
  coverEyebrow: { fontFamily: MONO, fontWeight: 600, fontSize: 9, letterSpacing: 2, color: COLOR.gold, marginBottom: 14, textTransform: "uppercase" },
  coverTitle: { fontSize: 34, fontFamily: SANS, fontWeight: 800, color: COLOR.ink, lineHeight: 1.15, marginBottom: 18, maxWidth: 440 },
  coverProcessName: { fontSize: 15, fontFamily: SANS, fontWeight: 700, color: COLOR.accentDeep, marginBottom: 28 },

  coverStatRow: { flexDirection: "row", marginBottom: 36, borderTopWidth: 1, borderTopColor: COLOR.line, paddingTop: 16 },
  coverStatBox: { flex: 1, paddingRight: 14 },
  coverStatBoxDivider: { borderLeftWidth: 1, borderLeftColor: COLOR.line, paddingLeft: 18 },
  coverStatLabel: { fontSize: 7.5, fontFamily: MONO, fontWeight: 600, color: COLOR.inkFaint, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 },
  coverStatValue: { fontSize: 23, fontFamily: MONO, fontWeight: 700, color: COLOR.accentDeep },
  coverStatSub: { fontSize: 7.5, color: COLOR.inkFaint, marginTop: 4 },

  coverMetaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 24, marginTop: 6 },
  coverMetaItem: { minWidth: 140 },
  coverMetaLabel: { fontSize: 7.5, fontFamily: MONO, fontWeight: 600, color: COLOR.inkFaint, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 },
  coverMetaValue: { fontSize: 10.5, fontFamily: SANS, color: COLOR.ink },
  coverFooterNote: { fontSize: 7.5, color: COLOR.inkFaint, lineHeight: 1.5, borderTopWidth: 1, borderTopColor: COLOR.line, paddingTop: 12, marginTop: "auto" },

  tocItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: COLOR.line },
  tocIndex: { width: 26, fontSize: 13, fontFamily: MONO, fontWeight: 700, color: COLOR.gold },
  tocLabel: { fontSize: 12.5, color: COLOR.ink, fontFamily: SANS, fontWeight: 700 },
  tocSub: { fontSize: 8.5, color: COLOR.inkFaint, marginTop: 2 },

  kpiHero: { flexDirection: "row", marginBottom: 16, borderTopWidth: 1, borderTopColor: COLOR.line, paddingTop: 14 },
  kpiHeroBox: { flex: 1, paddingRight: 14 },
  kpiHeroBoxDivider: { borderLeftWidth: 1, borderLeftColor: COLOR.line, paddingLeft: 18 },
  kpiHeroLabel: { fontSize: 7.5, color: COLOR.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 },
  kpiHeroValue: { fontSize: 19, fontFamily: MONO, fontWeight: 700, color: COLOR.accentDeep },
  kpiHeroSub: { fontSize: 7.5, color: COLOR.inkFaint, marginTop: 2 },

  strengthDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLOR.teal, marginTop: 3 },
  weaknessDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLOR.coral, marginTop: 3 },

  radarLegendRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLOR.lineSoft },
  radarLegendDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLOR.accent },
  radarLegendLabel: { fontSize: 8.5, color: COLOR.inkSoft, flex: 1 },
  radarLegendScore: { fontSize: 9, fontFamily: MONO, fontWeight: 700, color: COLOR.ink },

  phaseCard: { borderWidth: 1, borderColor: COLOR.line, borderRadius: 8, marginBottom: 10, overflow: "hidden" },
  phaseHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLOR.accentSoft, paddingHorizontal: 14, paddingVertical: 9 },
  phaseTitle: { fontSize: 10.5, fontFamily: SANS, fontWeight: 700, color: COLOR.accentDeep },
  phaseTimeframe: { fontSize: 7.5, fontFamily: MONO, fontWeight: 700, color: COLOR.accentDeep },
  phaseBody: { padding: 14 },

  checklistItem: { flexDirection: "row", gap: 8, alignItems: "flex-start", marginBottom: 6 },
  checklistBox: { width: 10, height: 10, borderRadius: 2, borderWidth: 1.4, borderColor: COLOR.gold, marginTop: 1 },

  annexeBlock: { marginBottom: 10 },
  annexeLabel: { fontSize: 8, fontFamily: MONO, fontWeight: 600, color: COLOR.inkFaint, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 3 },
  annexeValue: { fontSize: 9, color: COLOR.ink, lineHeight: 1.5 },
});

function SectionHeading({ title }: { title: string }) {
  return (
    <View style={s.sectionHeading} wrap={false} minPresenceAhead={80}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionRule} />
    </View>
  );
}

function Footer({ section, locale = "fr" }: { section: string; locale?: Locale }) {
  const t = getDictionary(locale).pdf.report;
  return (
    <View style={s.footer} fixed>
      <Text>{t.footerLine.replace("{section}", section)}</Text>
      <Text render={({ pageNumber, totalPages }) => t.footerPage.replace("{n}", String(pageNumber)).replace("{total}", String(totalPages))} />
    </View>
  );
}

function Header({ generatedAt, section, orgLogoUrl }: { generatedAt: string; section: string; orgLogoUrl?: string | null }) {
  return (
    <View fixed>
      <View style={s.headerRow}>
        {orgLogoUrl ? (
          <Image src={orgLogoUrl} style={{ height: 20, maxWidth: 110, objectFit: "contain" }} />
        ) : (
          <View style={s.logoRow}>
            <View style={s.logoMark}>
              <Text style={s.logoMarkText}>C</Text>
            </View>
            <Text style={s.wordmark}>CADRAN</Text>
          </View>
        )}
        <View style={s.headerMeta}>
          <Text style={s.headerSection}>{section}</Text>
          <Text style={s.headerMetaText}>{generatedAt}</Text>
        </View>
      </View>
      <View style={s.headerRule} />
    </View>
  );
}

function GaugeSvg({ score, color }: { score: number; color: string }) {
  const path = "M18 104 A 92 92 0 0 1 202 104";
  const scale = 190 / 220;
  const gcx = 110, gcy = 104, gr = 92;
  const angleAt = (t: number) => 180 + 180 * t;
  const ticks = [0.25, 0.5, 0.75].map((t) => ({
    t,
    inner: polar(gcx, gcy, gr - 9, angleAt(t)),
    outer: polar(gcx, gcy, gr + 9, angleAt(t)),
    label: polar(gcx, gcy, gr + 20, angleAt(t)),
  }));
  return (
    <View style={{ width: 190, height: 122, position: "relative" }}>
      <Svg width={190} height={114} viewBox="0 0 220 132">
        <Path d={path} stroke={COLOR.lineSoft} strokeWidth={15} strokeLinecap="round" fill="none" />
        <Path
          d={path}
          stroke={color}
          strokeWidth={15}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${Math.max((score / 100) * 296, 0.01)} 296`}
        />
        {ticks.map((tk) => (
          <Line key={tk.t} x1={tk.inner.x} y1={tk.inner.y} x2={tk.outer.x} y2={tk.outer.y} stroke="#fff" strokeWidth={1.5} />
        ))}
      </Svg>
      <Text style={{ position: "absolute", top: 64 * scale, left: 0, width: 190, textAlign: "center", fontSize: 30, fontFamily: MONO, fontWeight: 700, color: COLOR.ink }}>
        {score}
      </Text>
      <Text style={{ position: "absolute", top: 106 * scale, left: 18 * scale - 8, width: 16, textAlign: "center", fontSize: 8, color: COLOR.inkFaint }}>0</Text>
      <Text style={{ position: "absolute", top: 106 * scale, left: 202 * scale - 8, width: 16, textAlign: "center", fontSize: 8, color: COLOR.inkFaint }}>100</Text>
      {ticks.map((tk) => (
        <Text
          key={tk.t}
          style={{
            position: "absolute", top: tk.label.y * scale - 5, left: tk.label.x * scale - 8, width: 16,
            textAlign: "center", fontSize: 7, color: COLOR.inkFaint,
          }}
        >
          {tk.t * 100}
        </Text>
      ))}
    </View>
  );
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function RadarSvg({ dims }: { dims: { label: string; short: string; score: number }[] }) {
  const n = dims.length;
  const cx = 140, cy = 122, R = 68;
  const angleFor = (i: number) => -90 + i * (360 / n);
  const ring = (frac: number) =>
    dims.map((_, i) => { const p = polar(cx, cy, R * frac, angleFor(i)); return `${p.x},${p.y}`; }).join(" ");
  const dataPts = dims.map((d, i) => { const p = polar(cx, cy, R * (d.score / 100), angleFor(i)); return `${p.x},${p.y}`; }).join(" ");

  return (
    <View style={{ width: 280, height: 250, position: "relative" }}>
      <Svg width={280} height={244} viewBox="0 0 280 244">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <Polygon key={f} points={ring(f)} stroke={COLOR.line} strokeWidth={0.75} fill="none" />
        ))}
        {dims.map((_, i) => {
          const p = polar(cx, cy, R, angleFor(i));
          return <Line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={COLOR.line} strokeWidth={0.75} />;
        })}
        <Polygon points={dataPts} stroke={COLOR.accent} strokeWidth={1.8} fill={COLOR.accent} fillOpacity={0.16} />
        {dims.map((d, i) => {
          const p = polar(cx, cy, R * (d.score / 100), angleFor(i));
          return <Circle key={i} cx={p.x} cy={p.y} r={2.6} fill={COLOR.accent} stroke="#fff" strokeWidth={1} />;
        })}
      </Svg>
      {dims.map((d, i) => {
        const p = polar(cx, cy, R * 1.32, angleFor(i));
        return (
          <View key={i} style={{ position: "absolute", top: p.y - 14, left: p.x - 38, width: 76, alignItems: "center" }}>
            <Text style={{ fontSize: 7.5, color: COLOR.inkSoft, textAlign: "center" }}>{d.short}</Text>
            <Text style={{ fontSize: 9, fontFamily: MONO, fontWeight: 700, color: COLOR.ink, textAlign: "center" }}>{d.score}</Text>
          </View>
        );
      })}
    </View>
  );
}

function MatrixSvg({
  A,
  V,
  name,
  labels,
  threshold = 50,
}: {
  A: number;
  V: number;
  name: string;
  labels: { axisAptitude: string; axisValue: string; defaultProcessName: string };
  threshold?: number;
}) {
  const P = { x0: 40, y0: 10, x1: 300, y1: 220 };
  const w = P.x1 - P.x0, h = P.y1 - P.y0;
  const mx = P.x0 + (threshold / 100) * w, my = P.y1 - (threshold / 100) * h;
  const px = P.x0 + (V / 100) * w, py = P.y1 - (A / 100) * h;
  const labelW = 120;
  return (
    <View style={{ width: 310, height: 244, position: "relative" }}>
      <Svg width={310} height={230} viewBox="0 0 310 230">
        <Rect x={mx} y={P.y0} width={P.x1 - mx} height={my - P.y0} fill={COLOR.accent} fillOpacity={0.07} />
        <Rect x={P.x0} y={P.y0} width={mx - P.x0} height={my - P.y0} fill="#8AA23F" fillOpacity={0.06} />
        <Rect x={mx} y={my} width={P.x1 - mx} height={P.y1 - my} fill="#DCA13A" fillOpacity={0.07} />
        <Rect x={P.x0} y={my} width={mx - P.x0} height={P.y1 - my} fill={COLOR.coral} fillOpacity={0.06} />
        <Rect x={P.x0} y={P.y0} width={w} height={h} stroke={COLOR.line} fill="none" />
        <Line x1={mx} y1={P.y0} x2={mx} y2={P.y1} stroke={COLOR.line} strokeDasharray="2 2" />
        <Line x1={P.x0} y1={my} x2={P.x1} y2={my} stroke={COLOR.line} strokeDasharray="2 2" />
        <Circle cx={px} cy={py} r={5} fill={COLOR.accent} stroke="#fff" strokeWidth={1.5} />
      </Svg>
      <Text
        style={{
          position: "absolute", top: py - 22, left: px - labelW / 2, width: labelW,
          textAlign: "center", fontSize: 8, fontFamily: SANS, fontWeight: 700, color: COLOR.ink,
        }}
      >
        {name || labels.defaultProcessName}
      </Text>
      {[0, 50, 100].map((v) => (
        <Text
          key={`x-${v}`}
          style={{
            position: "absolute", top: P.y1 + 4, left: (P.x0 + (v / 100) * w) - 10, width: 20,
            textAlign: "center", fontSize: 7, color: COLOR.inkFaint,
          }}
        >
          {v}
        </Text>
      ))}
      {[0, 50, 100].map((v) => (
        <Text
          key={`y-${v}`}
          style={{
            position: "absolute", top: (P.y1 - (v / 100) * h) - 4, left: 4, width: 28,
            textAlign: "right", fontSize: 7, color: COLOR.inkFaint,
          }}
        >
          {v}
        </Text>
      ))}
      <Text style={{ position: "absolute", top: 0, left: 0, width: 90, fontSize: 7, color: COLOR.inkFaint }}>
        {labels.axisAptitude}
      </Text>
      <Text style={{ position: "absolute", top: 232, left: 0, width: 310, textAlign: "center", fontSize: 8, color: COLOR.inkSoft }}>
        {labels.axisValue}
      </Text>
    </View>
  );
}

function ValueBridgeSvg({
  laborSavings,
  realizedSavings,
  licenseCost,
  maintenanceCost,
  netRecurring,
  currency,
  locale = "fr",
}: {
  laborSavings: number;
  realizedSavings: number;
  licenseCost: number;
  maintenanceCost: number;
  netRecurring: number;
  currency: Currency;
  locale?: Locale;
}) {
  const t = getDictionary(locale).pdf.report;
  const steps = [
    { label: t.valueBridgeLaborSavings, from: 0, to: laborSavings, total: false },
    { label: t.valueBridgeRealization, from: laborSavings, to: realizedSavings, total: false },
    { label: t.valueBridgeLicense, from: realizedSavings, to: realizedSavings - licenseCost, total: false },
    { label: t.valueBridgeMaintenance, from: realizedSavings - licenseCost, to: netRecurring, total: false },
    { label: t.valueBridgeNetSavings, from: 0, to: netRecurring, total: true },
  ];
  const values = steps.flatMap((st) => [st.from, st.to]);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 470, chartH = 120, padTop = 18, padBottom = 24;
  const h = chartH + padTop + padBottom;
  const yOf = (v: number) => padTop + chartH - ((v - min) / range) * chartH;
  const baseline = yOf(0);
  // barW/gap sized so steps.length bars (5, since "Réalisation" was added) stay within w=470:
  // 22 (left offset) + steps.length*barW + (steps.length-1)*gap must leave room for the centered
  // value/label text boxes (barW+16 / barW+28 wide) without their right edge crossing w.
  const barW = 70, gap = 20;
  const xOf = (i: number) => 22 + i * (barW + gap);

  return (
    <View style={{ width: w, height: h, position: "relative" }}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Line x1={10} y1={baseline} x2={w - 10} y2={baseline} stroke={COLOR.line} strokeWidth={1} />
        {steps.slice(0, -1).map((st, i) => {
          const x1 = xOf(i) + barW;
          const x2 = xOf(i + 1);
          const y = yOf(st.to);
          return <Line key={`c${i}`} x1={x1} y1={y} x2={x2} y2={y} stroke={COLOR.inkFaint} strokeWidth={0.75} strokeDasharray="2 2" />;
        })}
        {steps.map((st, i) => {
          const x = xOf(i);
          const yTop = yOf(Math.max(st.from, st.to));
          const yBottom = yOf(Math.min(st.from, st.to));
          const rising = st.to >= st.from;
          const color = st.total ? COLOR.accentDeep : rising ? COLOR.teal : COLOR.coral;
          return <Rect key={i} x={x} y={yTop} width={barW} height={Math.max(yBottom - yTop, 2)} rx={3} fill={color} />;
        })}
      </Svg>
      {steps.flatMap((st, i) => {
        const x = xOf(i);
        const valueTop = yOf(Math.max(st.from, st.to)) - 12;
        return [
          <Text
            key={`v${i}`}
            style={{
              position: "absolute", top: valueTop, left: x - 8, width: barW + 16, textAlign: "center",
              fontSize: 7.5, fontFamily: MONO, fontWeight: 700, color: COLOR.ink,
            }}
          >
            {money(st.total ? st.to : st.to - st.from, currency, locale)}
          </Text>,
          <Text
            key={`l${i}`}
            style={{
              position: "absolute", top: h - 20, left: x - 14, width: barW + 28, textAlign: "center",
              fontSize: 7, color: COLOR.inkSoft,
            }}
          >
            {st.label}
          </Text>,
        ];
      })}
    </View>
  );
}

function TornadoSvg({ rows, baseline, currency, locale = "fr" }: { rows: SensitivityRow[]; baseline: number; currency: Currency; locale?: Locale }) {
  // padR must leave room for the "high" value label (58pt wide, 4pt gap) drawn to the right
  // of the bar's right edge — 10pt left it overflowing past w whenever a row's high value
  // was near the dataset max (i.e. reliably, for at least one row).
  const w = 470, rowH = 30, padL = 130, padR = 70, plotW = w - padL - padR;
  const all = rows.flatMap((r) => [r.low, r.high]).concat([baseline]);
  const min = Math.min(...all), max = Math.max(...all);
  const range = max - min || 1;
  const x = (v: number) => padL + ((v - min) / range) * plotW;
  const h = rows.length * rowH + 6;
  return (
    <View style={{ width: w, height: h, position: "relative" }}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Line x1={x(baseline)} y1={0} x2={x(baseline)} y2={h} stroke={COLOR.inkFaint} strokeDasharray="2 2" strokeWidth={1} />
        {rows.map((r, i) => {
          const y = i * rowH + rowH / 2;
          const bx1 = Math.min(x(r.low), x(r.high));
          const bx2 = Math.max(x(r.low), x(r.high));
          return (
            <Rect
              key={r.key}
              x={bx1}
              y={y - 6}
              width={Math.max(bx2 - bx1, 1)}
              height={12}
              rx={3}
              fill={COLOR.accent}
              fillOpacity={0.16}
              stroke={COLOR.accent}
              strokeWidth={1}
            />
          );
        })}
      </Svg>
      {rows.flatMap((r, i) => {
        const y = i * rowH + rowH / 2;
        const bx1 = Math.min(x(r.low), x(r.high));
        const bx2 = Math.max(x(r.low), x(r.high));
        const lowIsLeft = x(r.low) <= x(r.high);
        return [
          <Text
            key={`${r.key}-label`}
            style={{ position: "absolute", top: y - 5, left: 0, width: padL - 10, fontSize: 8, color: COLOR.inkSoft }}
          >
            {r.label}
          </Text>,
          <Text
            key={`${r.key}-low`}
            style={{
              position: "absolute", top: y - 5, left: bx1 - 62, width: 58, textAlign: "right",
              fontSize: 7, fontFamily: MONO, color: COLOR.inkFaint,
            }}
          >
            {money(lowIsLeft ? r.low : r.high, currency, locale)}
          </Text>,
          <Text
            key={`${r.key}-high`}
            style={{
              position: "absolute", top: y - 5, left: bx2 + 4, width: 58, textAlign: "left",
              fontSize: 7, fontFamily: MONO, color: COLOR.inkFaint,
            }}
          >
            {money(lowIsLeft ? r.high : r.low, currency, locale)}
          </Text>,
        ];
      })}
    </View>
  );
}

/** Contrepartie statique du Gantt dynamique de l'outil web (RoadmapGantt.tsx) — même axe en
 * semaines depuis "aujourd'hui" (ici: la date de génération du rapport), mêmes 4 rangées
 * (immédiat + 3 phases), mais sans barre de progression ni jalons datés : le pipeline PDF ne
 * lit jamais roadmap_progress, ce document est un instantané du plan, pas un suivi vivant. */
function RoadmapGanttSvg({
  rows,
  paybackMonths = null,
  locale = "fr",
}: {
  rows: { label: string; timeframe: string; startWeek: number; durationWeeks: number; isImmediate: boolean }[];
  /** Délai de récupération de l'investissement, en mois — même convention que le Gantt web
   * (RoadmapGantt.tsx) : 1 mois = 4 semaines, aucun repère si null (économies nettes non positives). */
  paybackMonths?: number | null;
  locale?: Locale;
}) {
  const t = getDictionary(locale).pdf.report;
  const w = 470, labelW = 112, rowH = 27, topPad = 16, bottomPad = 16;
  const trackW = w - labelW;
  const h = topPad + rows.length * rowH + bottomPad;
  const totalWeeks = Math.max(40, ...rows.map((r) => r.startWeek + r.durationWeeks));
  const monthCount = Math.floor(totalWeeks / 4);
  const xOf = (week: number) => labelW + (week / totalWeeks) * trackW;
  const todayX = xOf(0);
  const paybackWeek = paybackMonths != null ? paybackMonths * 4 : null;
  const paybackX = paybackWeek != null ? xOf(Math.min(paybackWeek, totalWeeks)) : null;

  return (
    <View style={{ width: w, height: h, position: "relative" }}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* Un repère tous les 2 mois : une grille au mois près serait illisible sur 362pt de large. */}
        {Array.from({ length: Math.floor(monthCount / 2) + 1 }).map((_, i) => (
          <Line
            key={i}
            x1={xOf(i * 8)} y1={topPad - 4} x2={xOf(i * 8)} y2={h - bottomPad}
            stroke={COLOR.lineSoft} strokeWidth={0.75}
          />
        ))}
        <Line x1={todayX} y1={topPad - 8} x2={todayX} y2={h - bottomPad} stroke={COLOR.accent} strokeWidth={1.25} />
        <Path d={`M ${todayX - 4} ${topPad - 8} L ${todayX + 4} ${topPad - 8} L ${todayX} ${topPad - 1} Z`} fill={COLOR.accent} />
        {paybackX != null && (
          <Line x1={paybackX} y1={topPad - 4} x2={paybackX} y2={h - bottomPad} stroke={COLOR.teal} strokeWidth={1} strokeDasharray="3,2" />
        )}
        {rows.map((row, i) => {
          const y = topPad + i * rowH;
          const x1 = xOf(row.startWeek);
          const x2 = xOf(row.startWeek + row.durationWeeks);
          return (
            <Rect
              key={i}
              x={x1} y={y + 5} width={Math.max(x2 - x1, 5)} height={rowH - 11} rx={2.5}
              fill={row.isImmediate ? COLOR.goldSoft : COLOR.accentSoft}
              stroke={row.isImmediate ? COLOR.goldTint : COLOR.accent}
              strokeWidth={1}
            />
          );
        })}
      </Svg>
      <Text
        style={{
          position: "absolute", top: 1, left: todayX - 30, width: 60, textAlign: "center",
          fontSize: 6.5, fontFamily: MONO, fontWeight: 700, color: COLOR.accentDeep,
        }}
      >
        {t.roadmapGanttToday}
      </Text>
      {paybackX != null && (
        <Text
          style={{
            position: "absolute", top: 1, left: paybackX - 30, width: 60, textAlign: "center",
            fontSize: 6.5, fontFamily: MONO, fontWeight: 700, color: COLOR.teal,
          }}
        >
          {t.roadmapGanttPayback}
        </Text>
      )}
      {rows.map((row, i) => {
        const y = topPad + i * rowH;
        return (
          <Text
            key={`lbl-${i}`}
            style={{
              position: "absolute", top: y + 8, left: 0, width: labelW - 8,
              fontSize: 7, fontFamily: SANS, fontWeight: 600, color: COLOR.ink, lineHeight: 1.25,
            }}
          >
            {truncate(row.label, 30)}
          </Text>
        );
      })}
      {rows.map((row, i) => {
        const y = topPad + i * rowH;
        const x2 = xOf(row.startWeek + row.durationWeeks);
        if (!row.timeframe) return null;
        return (
          <Text
            key={`tf-${i}`}
            style={{ position: "absolute", top: y + 8, left: Math.min(x2 + 5, w - 60), width: 58, fontSize: 6.5, color: COLOR.inkFaint }}
          >
            {row.timeframe}
          </Text>
        );
      })}
      {Array.from({ length: Math.floor(monthCount / 2) }).map((_, i) => {
        const month = (i + 1) * 2;
        return (
          <Text
            key={`m-${i}`}
            style={{
              position: "absolute", top: h - bottomPad + 3, left: xOf(month * 4) - 18, width: 36, textAlign: "center",
              fontSize: 6.5, fontFamily: MONO, color: COLOR.inkFaint,
            }}
          >
            {t.roadmapGanttMonth.replace("{n}", String(month))}
          </Text>
        );
      })}
    </View>
  );
}

function buildToc(t: ReturnType<typeof getDictionary>["pdf"]["report"]) {
  return [
    { n: "01", label: t.sectionSynthese, sub: t.tocSub01 },
    { n: "02", label: t.sectionDiagnostic, sub: t.tocSub02 },
    { n: "03", label: t.sectionRoi, sub: t.tocSub03 },
    { n: "04", label: t.sectionPriorisation, sub: t.tocSub04 },
    { n: "05", label: t.sectionGouvernance, sub: t.tocSub05 },
    { n: "06", label: t.sectionFeuilleDeRoute, sub: t.tocSub06 },
    { n: "07", label: t.sectionAnnexe, sub: t.tocSub07 },
  ];
}

export function ReportDocument({
  processName,
  currency,
  categoryLabel,
  generatedAt,
  context,
  answers,
  weights,
  diag,
  approach,
  roi,
  roiInputs,
  scenarios,
  sensitivity,
  confidence,
  adoption,
  verdict,
  aptitudeScore,
  valueScore,
  priorityThreshold = 50,
  roadmap,
  riskRegister,
  raci,
  compliance,
  security = [],
  vendorShortlist = [],
  vendorQuestions = [],
  toolInventory = null,
  toolRoleMeta = null,
  activities = [],
  aiAnalysis,
  portfolio = [],
  portfolioTotalValue,
  portfolioLevers = [],
  currentProcessId,
  orgLogoUrl,
  locale = "fr",
}: {
  processName: string;
  currency: Currency;
  categoryLabel: string | null;
  generatedAt: string;
  orgLogoUrl?: string | null;
  context: Context;
  answers: Answers;
  weights: Weights;
  diag: DiagnosticResult;
  approach: ApproachRecommendation | null;
  roi: RoiResult;
  roiInputs: RoiInputs;
  scenarios: Record<RoiScenarioId, RoiResult>;
  sensitivity: SensitivityRow[];
  confidence: AssessmentConfidence;
  adoption?: AdoptionEase;
  verdict: { title: string; text: string; color: string } | null;
  aptitudeScore: number;
  valueScore: number;
  priorityThreshold?: number;
  roadmap: Roadmap;
  riskRegister: RiskRegisterEntry[];
  raci: RaciRow[];
  compliance: string[];
  security?: string[];
  vendorShortlist?: VendorSuggestion[];
  vendorQuestions?: string[];
  toolInventory?: ToolInventory | null;
  toolRoleMeta?: Record<ToolRole | "unknown", { tag: string; description: string }> | null;
  activities?: ProcessActivity[];
  aiAnalysis?: AnalysisResult | null;
  portfolio?: PortfolioEntry[];
  portfolioTotalValue?: number;
  portfolioLevers?: PortfolioLeverRow[];
  currentProcessId?: string | null;
  locale?: Locale;
}) {
  const t = getDictionary(locale).pdf.report;
  const prioT = getDictionary(locale).tool.prioritisation;
  const reportDimensions = getDimensions(locale);
  const TOC = buildToc(t);
  const matrixLabels = { axisAptitude: t.matrixAxisAptitude, axisValue: t.matrixAxisValue, defaultProcessName: t.matrixDefaultProcessName };
  const displayProcessName = processName || getDictionary(locale).pdf.untitledProcess;
  const ready = diag.answeredCount > 0;
  const answered = diag.dimScores.filter((d) => d.answered > 0);
  const strengths = [...answered].filter((d) => d.score >= 65).sort((a, b) => b.score - a.score);
  const weaknesses = [...answered].filter((d) => d.score < 65).sort((a, b) => a.score - b.score);
  const topWeak = weaknesses[0];
  const topStrong = strengths[0];
  const totalW = diag.totalW;
  const weightsCustomized = diag.dimScores.some((d) => weights[d.id] !== DEFAULT_WEIGHTS[d.id]);
  const fallbackRisks =
    !aiAnalysis?.risques?.length && weaknesses.length > 0
      ? weaknesses.slice(0, 3).map((d) => `${d.label} (${d.score}/100) : ${d.reco}`)
      : [];
  const highRisks = riskRegister.filter((r) => r.probability === "Élevée" || r.impact === "Élevée").length;

  const diagnosticTitle = !ready
    ? t.diagnosticTitleIncomplete
    : topWeak && topWeak.score < 60
    ? t.diagnosticTitleWeak.replace("{score}", String(aptitudeScore)).replace("{label}", topWeak.label).replace("{leverScore}", String(topWeak.score))
    : topStrong
    ? t.diagnosticTitleStrong.replace("{score}", String(aptitudeScore)).replace("{label}", topStrong.label).replace("{leverScore}", String(topStrong.score))
    : t.diagnosticTitleNeutral.replace("{score}", String(aptitudeScore));

  const roiTitle =
    roi.netRecurring > 0
      ? t.roiTitlePositive
          .replace("{amount}", money(roi.netRecurring, currency, locale))
          .replace("{payback}", roi.payback ? t.roiTitlePaybackSuffix.replace("{n}", num(roi.payback, 1, locale)) : "")
      : t.roiTitleNegative;

  const governanceTitle =
    riskRegister.length === 0
      ? t.governanceTitleNone
      : highRisks > 0
      ? (highRisks > 1 ? t.governanceTitleHighPlural : t.governanceTitleHighSingular).replace("{n}", String(highRisks))
      : (riskRegister.length > 1 ? t.governanceTitleOtherPlural : t.governanceTitleOtherSingular).replace("{n}", String(riskRegister.length));

  const roadmapTitle = (roadmap.immediate.length > 1 ? t.roadmapTitlePlural : t.roadmapTitleSingular)
    .replace("{phases}", String(roadmap.phases.length))
    .replace("{n}", String(roadmap.immediate.length));
  const portfolioRank = currentProcessId ? portfolio.findIndex((p) => p.id === currentProcessId) + 1 : 0;

  const cashPoints = roi.cash;
  const inactionPoints = cashPoints.map((p) => ({ m: p.m, cum: -(roi.currentCost / 12) * p.m }));
  const cashMax = Math.max(
    ...cashPoints.map((p) => Math.abs(p.cum)),
    ...inactionPoints.map((p) => Math.abs(p.cum)),
    1
  );
  const chartW = 470, chartH = 90, chartPad = 10;
  const toPolyline = (pts: { m: number; cum: number }[]) =>
    pts
      .map((p, i) => {
        const x = chartPad + (i / (pts.length - 1)) * (chartW - chartPad * 2);
        const y = chartH / 2 - (p.cum / cashMax) * (chartH / 2 - chartPad);
        return `${x},${y}`;
      })
      .join(" ");
  const cashPolyPoints = toPolyline(cashPoints);
  const inactionPolyPoints = toPolyline(inactionPoints);
  const gapAt36 = cashPoints[cashPoints.length - 1].cum - inactionPoints[inactionPoints.length - 1].cum;

  const contextEntries = getApplicableContextQuestions(context.category, locale).filter((q) => (context[q.id] || "").trim());
  const aiSeededAnswers = parseAiSeededAnswers(context);

  const financialAssumptions: [string, string][] = [
    [t.annexeVolume, num(roiInputs.volume, 0, locale)],
    [t.annexeManualTime, t.annexeMinutes.replace("{n}", String(roiInputs.minutes))],
    [t.annexeHourlyCost, money(roiInputs.hourlyCost, currency, locale)],
    [t.annexeErrorRate, t.annexePercent.replace("{n}", String(roiInputs.errorRate))],
    [t.annexeRework, t.annexeMinutes.replace("{n}", String(roiInputs.reworkMin))],
    [t.annexeAutoRate, t.annexePercent.replace("{n}", String(roiInputs.autoRate))],
    [t.annexeImplCost, money(roiInputs.implCost, currency, locale)],
    [t.annexeLicenseCost, money(roiInputs.licenseCost, currency, locale)],
    [t.annexeMaintenancePct, t.annexePercent.replace("{n}", String(roiInputs.maintenancePct))],
    [t.annexeChangeMgmt, money(roiInputs.changeMgmtCost, currency, locale)],
    [t.annexeDiscount, t.annexePercent.replace("{n}", String(roiInputs.discount))],
  ];
  const contextAdjustments = diag.dimScores.filter((d) => d.adjustment);

  return (
    <Document title={t.documentTitle.replace("{name}", processName)}>
      {/* PAGE 0 — Couverture */}
      <Page size="A4" style={s.page}>
        <View style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <View style={s.coverTop}>
            {orgLogoUrl ? (
              <Image src={orgLogoUrl} style={{ height: 32, maxWidth: 170, objectFit: "contain" }} />
            ) : (
              <View style={s.coverBrandRow}>
                <View style={s.logoMark}>
                  <Text style={s.logoMarkText}>C</Text>
                </View>
                <Text style={s.coverWordmark}>CADRAN</Text>
              </View>
            )}
            <View style={s.coverRule} />

            <Text style={s.coverEyebrow}>{t.coverEyebrow}</Text>
            <Text style={s.coverTitle}>{displayProcessName}</Text>
            <Text style={s.coverProcessName}>{t.coverSubtitle}</Text>

            <View style={s.coverStatRow}>
              <View style={s.coverStatBox}>
                <Text style={s.coverStatLabel}>{t.coverStatAptitude}</Text>
                <Text style={s.coverStatValue}>{ready ? `${aptitudeScore}/100` : "-"}</Text>
                <Text style={s.coverStatSub}>{ready ? diag.level.label : t.coverStatIncomplete}</Text>
              </View>
              <View style={[s.coverStatBox, s.coverStatBoxDivider]}>
                <Text style={s.coverStatLabel}>{t.coverStatValue}</Text>
                <Text style={s.coverStatValue}>{valueScore}/100</Text>
                <Text style={s.coverStatSub}>{t.coverStatValueSub}</Text>
              </View>
              <View style={[s.coverStatBox, s.coverStatBoxDivider]}>
                <Text style={s.coverStatLabel}>{t.coverStatNetSavings}</Text>
                <Text style={[s.coverStatValue, { fontSize: statFontSize(money(roi.netRecurring, currency, locale), 23) }]}>
                  {money(roi.netRecurring, currency, locale)}
                </Text>
                <Text style={s.coverStatSub}>{t.coverStatNetSavingsSub}</Text>
              </View>
            </View>

            <View style={s.coverMetaGrid}>
              <View style={s.coverMetaItem}>
                <Text style={s.coverMetaLabel}>{t.coverStatusLabel}</Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 7, height: 7, borderRadius: 3.5, marginRight: 5,
                      backgroundColor: ready && verdict ? verdict.color : COLOR.line,
                    }}
                  />
                  <Text style={[s.coverMetaValue, { fontWeight: 700 }]}>
                    {ready && verdict ? verdict.title : t.coverStatusIncomplete}
                  </Text>
                </View>
              </View>
              <View style={s.coverMetaItem}>
                <Text style={s.coverMetaLabel}>{t.coverCategory}</Text>
                <Text style={s.coverMetaValue}>{categoryLabel || t.coverCategoryNone}</Text>
              </View>
              <View style={s.coverMetaItem}>
                <Text style={s.coverMetaLabel}>{t.coverPreparedFor}</Text>
                <Text style={s.coverMetaValue}>{sponsorDisplay(context) || t.coverPreparedForNone}</Text>
              </View>
              <View style={s.coverMetaItem}>
                <Text style={s.coverMetaLabel}>{t.coverTimeline}</Text>
                <Text style={s.coverMetaValue}>{context.timeline?.trim() || t.coverTimelineNone}</Text>
              </View>
              <View style={s.coverMetaItem}>
                <Text style={s.coverMetaLabel}>{t.coverGeneratedOn}</Text>
                <Text style={s.coverMetaValue}>{generatedAt}</Text>
              </View>
              <View style={s.coverMetaItem}>
                <Text style={s.coverMetaLabel}>{t.coverCurrency}</Text>
                <Text style={s.coverMetaValue}>{currency}</Text>
              </View>
              <View style={s.coverMetaItem}>
                <Text style={s.coverMetaLabel}>{t.coverConfidence}</Text>
                <Text style={s.coverMetaValue}>{confidenceLabelDisplay(confidence.label, locale)}</Text>
              </View>
            </View>
          </View>

          <Text style={s.coverFooterNote}>
            {t.coverFooterNote}
          </Text>
        </View>
      </Page>

      {/* PAGE 1 — Sommaire */}
      <Page size="A4" style={s.page}>
        <Header generatedAt={generatedAt} orgLogoUrl={orgLogoUrl} section={t.sectionSommaire} />
        <SectionHeading title={t.sectionSommaire} />
        <Text style={{ fontSize: 8.5, color: COLOR.inkSoft, lineHeight: 1.5, marginBottom: 16 }}>
          {t.tocIntro.replace("{name}", processName || t.tocDefaultProcess)}
        </Text>
        {TOC.map((item) => (
          <View key={item.n} style={s.tocItem}>
            <Text style={s.tocIndex}>{item.n}</Text>
            <View>
              <Text style={s.tocLabel}>{item.label}</Text>
              <Text style={s.tocSub}>{item.sub}</Text>
            </View>
          </View>
        ))}
        <Footer section={t.sectionSommaire} locale={locale} />
      </Page>

      {/* PAGE 2 — Synthèse exécutive */}
      <Page size="A4" style={s.page}>
        <Header generatedAt={generatedAt} orgLogoUrl={orgLogoUrl} section={t.sectionSynthese} />
        <SectionHeading title={t.sectionSynthese} />

        {verdict && (
          <Text style={{ fontSize: 12.5, fontFamily: SANS, fontWeight: 700, color: COLOR.ink, lineHeight: 1.4, marginBottom: 14 }}>
            {t.execTitleLine
              .replace("{verdict}", verdict.title)
              .replace("{amount}", money(roi.netRecurring, currency, locale))
              .replace("{payback}", roi.payback ? t.execPaybackSuffix.replace("{n}", num(roi.payback, 1, locale)) : "")}
          </Text>
        )}

        {verdict ? (
          <View style={[s.card, { padding: 0, overflow: "hidden" }]} wrap={false}>
            <View style={{ height: 4, backgroundColor: verdict.color }} />
            <View style={{ padding: 14 }}>
              <Text style={s.eyebrow}>{t.execGlobalRecommendation}</Text>
              <Text style={{ fontSize: 17, fontFamily: SANS, fontWeight: 800, color: COLOR.ink, marginTop: 4, marginBottom: 5 }}>
                {verdict.title}
              </Text>
              <Text style={{ fontSize: 9.5, color: COLOR.inkSoft, lineHeight: 1.5 }}>{verdict.text}</Text>
              <Text style={{ fontSize: 7.5, color: COLOR.inkFaint, lineHeight: 1.4, marginTop: 8 }}>
                {t.execSelfAssessNote}
              </Text>
              <Text style={{ fontSize: 7.5, color: COLOR.inkFaint, lineHeight: 1.4, marginTop: 4 }}>
                {t.execReliabilityLine.replace("{label}", confidenceLabelDisplay(confidence.label, locale)).replace("{reasons}", confidence.reasons.join(" · "))}
              </Text>
              {adoption && (
                <Text style={{ fontSize: 7.5, color: COLOR.inkFaint, lineHeight: 1.4, marginTop: 4 }}>
                  {t.execAdoptionLine.replace("{label}", adoptionLabelDisplay(adoption.label, locale)).replace("{reasons}", adoption.reasons.join(" · "))}
                </Text>
              )}
            </View>
          </View>
        ) : (
          <View style={s.card} wrap={false}>
            <Text style={{ fontSize: 9, color: COLOR.inkSoft, lineHeight: 1.5 }}>
              {t.execIncompleteNote}
            </Text>
          </View>
        )}

        {aiAnalysis && aiAnalysis.risques.length > 0 ? (
          <View style={s.card} wrap={false}>
            <Text style={s.cardTitle}>{t.execAiRisksTitle}</Text>
            {aiAnalysis.risques.map((rk, i) => (
              <Text key={i} style={{ fontSize: 8.5, color: COLOR.inkSoft, lineHeight: 1.5, marginTop: i ? 3 : 0 }}>
                {"• "}{rk}
              </Text>
            ))}
            <Text style={{ fontSize: 7.5, color: COLOR.inkFaint, lineHeight: 1.4, marginTop: 6 }}>
              {t.execAiRisksNote}
            </Text>
          </View>
        ) : (
          fallbackRisks.length > 0 && (
            <View style={s.card} wrap={false}>
              <Text style={s.cardTitle}>{t.execFallbackRisksTitle}</Text>
              {fallbackRisks.map((rk, i) => (
                <Text key={i} style={{ fontSize: 8.5, color: COLOR.inkSoft, lineHeight: 1.5, marginTop: i ? 3 : 0 }}>
                  {"• "}{rk}
                </Text>
              ))}
              <Text style={{ fontSize: 7.5, color: COLOR.inkFaint, lineHeight: 1.4, marginTop: 6 }}>
                {t.execFallbackRisksNote}
              </Text>
            </View>
          )
        )}

        <View style={s.kpiHero}>
          <View style={s.kpiHeroBox}>
            <Text style={s.kpiHeroLabel}>{t.execKpiAptitude}</Text>
            <Text style={s.kpiHeroValue}>{ready ? `${aptitudeScore}/100` : "-"}</Text>
            <Text style={s.kpiHeroSub}>{ready ? diag.level.label : t.coverStatIncomplete}</Text>
          </View>
          <View style={[s.kpiHeroBox, s.kpiHeroBoxDivider]}>
            <Text style={s.kpiHeroLabel}>{t.execKpiValueRoi}</Text>
            <Text style={s.kpiHeroValue}>{valueScore}/100</Text>
            <Text style={s.kpiHeroSub}>{t.execKpiValueRoiSub}</Text>
          </View>
          <View style={[s.kpiHeroBox, s.kpiHeroBoxDivider]}>
            <Text style={s.kpiHeroLabel}>{t.execKpiNetSavings}</Text>
            <Text style={[s.kpiHeroValue, { fontSize: statFontSize(money(roi.netRecurring, currency, locale), 19) }]}>
              {money(roi.netRecurring, currency, locale)}
            </Text>
            <Text style={s.kpiHeroSub}>{t.execKpiNetSavingsSub}</Text>
          </View>
          <View style={[s.kpiHeroBox, s.kpiHeroBoxDivider]}>
            <Text style={s.kpiHeroLabel}>{t.execKpiPayback}</Text>
            <Text style={s.kpiHeroValue}>{roi.payback ? t.paybackMonths.replace("{n}", num(roi.payback, 1, locale)) : "-"}</Text>
            <Text style={s.kpiHeroSub}>{t.execKpiPaybackSub}</Text>
          </View>
        </View>

        <View style={s.card} wrap={false}>
          <Text style={s.cardTitle}>{t.execKeyPointsTitle}</Text>
          {approach && (
            <View style={s.bullet}>
              <Text style={s.bulletDot}>·</Text>
              <Text style={s.bulletText}>
                {t.execApproachRecommended} <Text style={{ fontFamily: SANS, fontWeight: 700, color: COLOR.ink }}>{approach.label}</Text>.
              </Text>
            </View>
          )}
          {topStrong && (
            <View style={s.bullet}>
              <Text style={s.bulletDot}>·</Text>
              <Text style={s.bulletText}>
                {t.execTopStrength.replace("{label}", topStrong.label).replace("{score}", String(topStrong.score))}
              </Text>
            </View>
          )}
          {topWeak && (
            <View style={s.bullet}>
              <Text style={s.bulletDot}>·</Text>
              <Text style={s.bulletText}>
                {t.execTopWeakness.replace("{label}", topWeak.label).replace("{score}", String(topWeak.score))}
              </Text>
            </View>
          )}
          <View style={s.bullet}>
            <Text style={s.bulletDot}>·</Text>
            <Text style={s.bulletText}>
              {roi.netRecurring > 0
                ? t.execNpvPositive.replace("{years}", String(ROI_HORIZON_YEARS)).replace("{amount}", money(roi.npv, currency, locale))
                : t.execNpvNegative}
            </Text>
          </View>
          {approach?.caution && (
            <View style={s.bullet}>
              <Text style={[s.bulletDot, { color: COLOR.coral }]}>·</Text>
              <Text style={[s.bulletText, { color: COLOR.coral }]}>{approach.caution}</Text>
            </View>
          )}
          <Text style={{ fontSize: 8.5, color: COLOR.inkSoft, marginTop: 8, lineHeight: 1.4 }}>
            {t.execSeeNext}
          </Text>
        </View>

        <Footer section={t.sectionSynthese} locale={locale} />
      </Page>

      {/* PAGE 3 — Diagnostic d'aptitude */}
      <Page size="A4" style={s.page}>
        <Header generatedAt={generatedAt} orgLogoUrl={orgLogoUrl} section={t.sectionDiagnostic} />
        <SectionHeading title={diagnosticTitle} />

        {ready ? (
          <View style={s.card} wrap={false}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <GaugeSvg score={aptitudeScore} color={diag.level.color} />
              <View style={{ flex: 1 }}>
                <View style={[s.badge, { backgroundColor: diag.level.color, alignSelf: "flex-start", marginBottom: 8 }]}>
                  <Text>{t.diagLevelBadge.replace("{n}", String(diag.level.n)).replace("{label}", diag.level.label)}</Text>
                </View>
                <Text style={{ fontSize: 9, color: COLOR.inkSoft, lineHeight: 1.5 }}>{diag.level.note}</Text>
                <Text style={{ fontSize: 8, color: COLOR.inkFaint, marginTop: 6 }}>
                  {t.diagStatementsAnswered.replace("{n}", String(diag.answeredCount))}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={s.card} wrap={false}>
            <Text style={{ fontSize: 9, color: COLOR.inkSoft }}>{t.diagIncomplete}</Text>
          </View>
        )}

        <View style={s.card} wrap={false}>
          <Text style={s.cardTitle}>{t.diagLeverProfileTitle}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <RadarSvg dims={diag.dimScores.map((d) => ({ label: d.label, short: d.short, score: d.score }))} />
            <View style={{ flex: 1 }}>
              {diag.dimScores.map((d) => (
                <View key={d.id} style={s.radarLegendRow}>
                  <View style={s.radarLegendDot} />
                  <Text style={s.radarLegendLabel}>{d.label} ({Math.round((weights[d.id] / totalW) * 100)}%)</Text>
                  <Text style={s.radarLegendScore}>{d.score}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={s.card} wrap={false}>
          <Text style={s.cardTitle}>{t.diagStrengthsTitle}</Text>
          {strengths.length === 0 ? (
            <Text style={{ fontSize: 8.5, color: COLOR.inkFaint }}>{t.diagStrengthsEmpty}</Text>
          ) : (
            strengths.map((d) => (
              <View key={d.id} style={{ flexDirection: "row", gap: 6, marginBottom: 7 }}>
                <View style={s.strengthDot} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 8.5, fontFamily: SANS, fontWeight: 700, color: COLOR.ink }}>{d.label} · {d.score}/100</Text>
                  <Text style={{ fontSize: 7.5, color: COLOR.inkSoft, lineHeight: 1.35, marginTop: 1 }}>{d.strength}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={s.card} wrap={false}>
          <Text style={s.cardTitle}>{t.diagWeaknessesTitle}</Text>
          {weaknesses.length === 0 ? (
            <Text style={{ fontSize: 8.5, color: COLOR.inkFaint }}>{t.diagWeaknessesEmpty}</Text>
          ) : (
            weaknesses.map((d) => (
              <View key={d.id} style={{ flexDirection: "row", gap: 6, marginBottom: 7 }}>
                <View style={s.weaknessDot} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 8.5, fontFamily: SANS, fontWeight: 700, color: COLOR.ink }}>{d.label} · {d.score}/100</Text>
                  <Text style={{ fontSize: 7.5, color: COLOR.inkSoft, lineHeight: 1.35, marginTop: 1 }}>{d.reco}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {approach && (
          <View style={[s.card, { borderColor: COLOR.accentSoft, backgroundColor: COLOR.accentSoft }]} wrap={false}>
            <Text style={s.eyebrow}>{t.diagApproachTitle}</Text>
            <Text style={{ fontSize: 11, fontFamily: SANS, fontWeight: 700, color: COLOR.ink, marginTop: 2, marginBottom: 4 }}>
              {approach.label}
            </Text>
            <Text style={{ fontSize: 8.5, color: COLOR.inkSoft, lineHeight: 1.4, marginBottom: 6 }}>
              {approach.description}
            </Text>
            {approach.rationale.map((r, i) => (
              <View key={i} style={s.bullet}>
                <Text style={s.bulletDot}>·</Text>
                <Text style={s.bulletText}>{r}</Text>
              </View>
            ))}
            <View style={{ backgroundColor: COLOR.surface, borderRadius: 6, padding: 9, marginTop: 8 }}>
              <Text style={{ fontSize: 7, fontFamily: SANS, fontWeight: 700, color: COLOR.accentDeep, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {t.diagApproachCriteriaLabel}
              </Text>
              <Text style={{ fontSize: 8, color: COLOR.inkSoft, lineHeight: 1.45 }}>
                {approach.criteria}
              </Text>
            </View>
            {approach.caution && (
              <Text style={{ fontSize: 8, color: COLOR.coral, marginTop: 6, lineHeight: 1.4 }}>
                {approach.caution}
              </Text>
            )}
          </View>
        )}

        {approach && approach.id !== "process_first" && (
          <View style={s.card} wrap={false}>
            <Text style={s.cardTitle}>{t.diagFlowTitle}</Text>
            <View style={{ flexDirection: "row", alignItems: "stretch", gap: 6 }}>
              <View style={{ flex: 1, borderWidth: 1, borderColor: COLOR.line, borderRadius: 8, padding: 9 }}>
                <Text style={{ fontSize: 7, color: COLOR.inkFaint, marginBottom: 3 }}>{t.diagFlowSourceSystems}</Text>
                <Text style={{ fontSize: 8, color: COLOR.ink, lineHeight: 1.3 }}>
                  {context.systems?.trim() ? truncate(context.systems, 140) : t.diagFlowNotSpecified}
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: COLOR.inkFaint, alignSelf: "center" }}>&#8594;</Text>
              <View style={{ flex: 1, borderWidth: 1, borderColor: COLOR.accent, borderRadius: 8, padding: 9, backgroundColor: COLOR.accentSoft }}>
                <Text style={{ fontSize: 7, color: COLOR.accentDeep, marginBottom: 3 }}>{t.diagFlowAutomation}</Text>
                <Text style={{ fontSize: 8, fontFamily: SANS, fontWeight: 700, color: COLOR.accentDeep, lineHeight: 1.3 }}>
                  {approach.label}
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: COLOR.inkFaint, alignSelf: "center" }}>&#8594;</Text>
              <View style={{ flex: 1, borderWidth: 1, borderColor: COLOR.line, borderRadius: 8, padding: 9 }}>
                <Text style={{ fontSize: 7, color: COLOR.inkFaint, marginBottom: 3 }}>{t.diagFlowResult}</Text>
                <Text style={{ fontSize: 8, color: COLOR.ink, lineHeight: 1.3 }}>
                  {t.diagFlowResultText}
                </Text>
              </View>
            </View>
          </View>
        )}

        {activities.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>{t.diagStepsTitle}</Text>
            <View style={s.table}>
              <View style={s.tHeadRow} wrap={false}>
                <Text style={[s.tCellHead, { flex: 1.5 }]}>{t.diagStepsColStep}</Text>
                <Text style={s.tCellHead}>{t.diagStepsColWho}</Text>
                <Text style={s.tCellHead}>{t.diagStepsColSystem}</Text>
                <Text style={s.tCellHead}>{t.diagStepsColMin}</Text>
                <Text style={s.tCellHead}>{t.diagStepsColAuto}</Text>
                <Text style={[s.tCellHead, { flex: 1.4 }]}>{t.diagStepsColFriction}</Text>
              </View>
              {activities.map((a, i) => {
                const automatable = a.rulesBased && a.digitalData;
                const partial = a.rulesBased !== a.digitalData;
                return (
                  <View key={a.id || i} style={s.tRow} wrap={false}>
                    <Text style={[s.tCell, { flex: 1.5, fontFamily: SANS, fontWeight: 700 }]}>{a.label || "-"}</Text>
                    <Text style={[s.tCell, { fontSize: 7.5 }]}>{a.actor || "-"}</Text>
                    <Text style={[s.tCell, { fontSize: 7.5 }]}>{a.system || "-"}</Text>
                    <Text style={[s.tCell, { fontSize: 7.5 }]}>{a.minutes}</Text>
                    <Text style={[s.tCell, { fontSize: 7.5, color: automatable ? COLOR.accent : partial ? COLOR.gold : COLOR.inkFaint }]}>
                      {automatable ? t.diagStepsAutoYes : partial ? t.diagStepsAutoPartial : t.diagStepsAutoNo}
                    </Text>
                    <Text style={[s.tCell, { flex: 1.4, fontSize: 7.5, color: a.friction ? COLOR.coral : COLOR.inkFaint }]}>
                      {a.friction || "-"}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text style={{ fontSize: 7.5, color: COLOR.inkFaint, marginTop: 6, lineHeight: 1.4 }}>
              {t.diagStepsTotal.replace("{n}", String(totalActivityMinutes(activities)))}
            </Text>
          </View>
        )}

        {toolInventory && toolRoleMeta && toolInventory.entries.length > 0 && (
          <View style={s.card} wrap={false}>
            <Text style={s.cardTitle}>{t.diagToolInventoryTitle}</Text>
            <Text style={{ fontSize: 8, color: COLOR.inkSoft, lineHeight: 1.45, marginBottom: 7 }}>
              {t.diagToolInventoryIntro}
            </Text>
            {TOOL_ROLE_DISPLAY_ORDER.filter((role) => toolInventory.entries.some((e) => e.role === role)).map((role) => {
              const entries = toolInventory.entries.filter((e) => e.role === role);
              const c = TOOL_ROLE_COLOR[role];
              return (
                <View key={role} style={{ flexDirection: "row", marginBottom: 6 }} wrap={false}>
                  <View
                    style={{
                      backgroundColor: c.bg, borderWidth: 1, borderColor: c.border, borderRadius: 3,
                      paddingHorizontal: 4, paddingVertical: 2, marginRight: 7, marginTop: 1, width: 76,
                    }}
                  >
                    <Text style={{ fontFamily: MONO, fontSize: 6, color: c.text, textAlign: "center" }}>
                      {toolRoleMeta[role].tag}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 8.5, fontFamily: SANS, fontWeight: 700, color: COLOR.ink, lineHeight: 1.35 }}>
                      {entries.map((e) => (e.usage ? `${e.label} (${e.usage})` : e.label)).join(" · ")}
                    </Text>
                    <Text style={{ fontSize: 7.5, color: COLOR.inkSoft, lineHeight: 1.35, marginTop: 1 }}>
                      {toolRoleMeta[role].description}
                    </Text>
                  </View>
                </View>
              );
            })}
            {toolInventory.verdict && (
              <View style={{ backgroundColor: COLOR.accentSoft, borderRadius: 6, padding: 8, marginTop: 4 }}>
                <Text style={{ fontSize: 8, color: COLOR.accentDeep, lineHeight: 1.45 }}>{toolInventory.verdict}</Text>
              </View>
            )}
          </View>
        )}

        {vendorShortlist.length > 0 && (
          <View style={s.card} wrap={false}>
            <Text style={s.cardTitle}>{t.diagVendorShortlistTitle}</Text>
            {vendorShortlist.map((v, i) => (
              <View key={i} style={{ paddingVertical: 5, borderTopWidth: i ? 1 : 0, borderTopColor: COLOR.lineSoft }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 8.5, fontFamily: SANS, fontWeight: 700, color: COLOR.ink }}>{v.name}</Text>
                  <Text style={{ fontSize: 8, color: COLOR.inkSoft }}>{v.tier}</Text>
                </View>
                {v.matchNote && (
                  <Text style={{ fontSize: 7.5, color: COLOR.accentDeep, marginTop: 2, lineHeight: 1.3 }}>{v.matchNote}</Text>
                )}
                {v.ecosystem && (
                  <Text style={{ fontSize: 7.5, color: COLOR.inkSoft, marginTop: 2, lineHeight: 1.3 }}>
                    <Text style={{ fontFamily: SANS, fontWeight: 700 }}>{t.diagVendorEcosystemLabel} </Text>
                    {v.ecosystem}
                  </Text>
                )}
                {v.limits && (
                  <Text style={{ fontSize: 7.5, color: COLOR.inkFaint, marginTop: 2, lineHeight: 1.3 }}>
                    <Text style={{ fontFamily: SANS, fontWeight: 700 }}>{t.diagVendorLimitsLabel} </Text>
                    {v.limits}
                  </Text>
                )}
              </View>
            ))}
            <Text style={{ fontSize: 7.5, color: COLOR.inkFaint, marginTop: 8, lineHeight: 1.4 }}>
              {t.diagVendorShortlistNote}
            </Text>
          </View>
        )}

        {vendorQuestions.length > 0 && (
          <View style={s.card} wrap={false}>
            <Text style={s.cardTitle}>{t.diagVendorQuestionsTitle}</Text>
            {vendorQuestions.map((q, i) => (
              <View key={i} style={s.checklistItem}>
                <View style={s.checklistBox} />
                <Text style={{ fontSize: 8.5, color: COLOR.ink, flex: 1, lineHeight: 1.4 }}>{q}</Text>
              </View>
            ))}
          </View>
        )}

        {(vendorShortlist.length > 0 || vendorQuestions.length > 0) && (
          <Text style={{ fontSize: 7.5, fontFamily: SANS, fontWeight: 600, color: COLOR.accent, marginTop: 2, lineHeight: 1.4 }}>
            {t.diagVendorHandoffNote}
          </Text>
        )}

        <Footer section={t.sectionDiagnostic} locale={locale} />
      </Page>

      {/* PAGE 4 — ROI */}
      <Page size="A4" style={s.page}>
        <Header generatedAt={generatedAt} orgLogoUrl={orgLogoUrl} section={t.sectionRoi} />
        <SectionHeading title={roiTitle} />

        <View style={s.card} wrap={false}>
          <Text style={s.eyebrow}>{t.roiNetSavingsTitle}</Text>
          <Text style={{ fontSize: 22, fontFamily: MONO, fontWeight: 700, color: COLOR.accentDeep, marginTop: 4, marginBottom: 10 }}>
            {money(roi.netRecurring, currency, locale)}
          </Text>
          <View style={s.metricGrid}>
            <View style={s.metricBox}>
              <Text style={s.metricLabel}>{t.roiMetricPayback}</Text>
              <Text style={s.metricValue}>{roi.payback ? t.roiMetricPaybackValue.replace("{n}", num(roi.payback, 1, locale)) : "-"}</Text>
            </View>
            <View style={s.metricBox}>
              <Text style={s.metricLabel}>{t.roiMetricNpv.replace("{years}", String(ROI_HORIZON_YEARS))}</Text>
              <Text style={s.metricValue}>{money(roi.npv, currency, locale)}</Text>
            </View>
            <View style={s.metricBox}>
              <Text style={s.metricLabel}>{t.roiMetricHours}</Text>
              <Text style={s.metricValue}>{t.roiMetricHoursValue.replace("{n}", num(roi.savedH, 0, locale))}</Text>
            </View>
            <View style={s.metricBox}>
              <Text style={s.metricLabel}>{t.roiMetricFte}</Text>
              <Text style={s.metricValue}>{num(roi.fte, 2, locale)}</Text>
            </View>
            <View style={s.metricBox}>
              <Text style={s.metricLabel}>{t.roiMetricCurrentCost}</Text>
              <Text style={s.metricValue}>{money(roi.currentCost, currency, locale)}</Text>
            </View>
            <View style={s.metricBox}>
              <Text style={s.metricLabel}>{t.roiMetricValueScore}</Text>
              <Text style={s.metricValue}>{roi.valueScore}/100</Text>
            </View>
          </View>
          <Text style={{ fontSize: 7.5, color: COLOR.inkFaint, marginTop: 8, lineHeight: 1.4 }}>
            {t.roiCostBreakdown
              .replace("{normal}", money(roi.normalCost, currency, locale))
              .replace("{rework}", money(roi.reworkCost, currency, locale))
              .replace("{rate}", String(roiInputs.errorRate))}
          </Text>
        </View>

        <View style={s.card} wrap={false}>
          <Text style={s.cardTitle}>{t.roiBridgeTitle}</Text>
          <ValueBridgeSvg
            laborSavings={roi.laborSavings}
            realizedSavings={roi.realizedSavings}
            licenseCost={roiInputs.licenseCost}
            maintenanceCost={roi.maintenanceCost}
            netRecurring={roi.netRecurring}
            currency={currency}
            locale={locale}
          />
          <Text style={{ fontSize: 7.5, color: COLOR.inkFaint, marginTop: 4, lineHeight: 1.4 }}>
            {t.roiBridgeNote}
          </Text>
        </View>

        <View style={s.card} wrap={false}>
          <Text style={s.cardTitle}>{t.roiCashflowTitle.replace("{months}", String(ROI_HORIZON_YEARS * 12))}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View style={{ width: 12, height: 2.5, backgroundColor: COLOR.accent, borderRadius: 1 }} />
              <Text style={{ fontSize: 7.5, color: COLOR.inkSoft }}>{t.roiCashflowAutomate}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View style={{ width: 12, height: 2.5, backgroundColor: COLOR.coral, borderRadius: 1 }} />
              <Text style={{ fontSize: 7.5, color: COLOR.inkSoft }}>{t.roiCashflowInaction}</Text>
            </View>
          </View>
          <Svg width={chartW} height={chartH + 4} viewBox={`0 0 ${chartW} ${chartH}`}>
            <Line x1={chartPad} y1={chartH / 2} x2={chartW - chartPad} y2={chartH / 2} stroke={COLOR.line} strokeDasharray="2 2" />
            <Polyline points={inactionPolyPoints} stroke={COLOR.coral} strokeWidth={1.5} strokeDasharray="3 2" fill="none" />
            <Polyline points={cashPolyPoints} stroke={COLOR.accent} strokeWidth={1.8} fill="none" />
          </Svg>
          <Text style={{ fontSize: 7.5, color: COLOR.inkFaint, marginTop: 4, lineHeight: 1.4 }}>
            {(() => {
              const [before, after] = t.roiCashflowNote
                .replace("{months}", String(ROI_HORIZON_YEARS * 12))
                .replace("{threshold}", roi.payback ? t.roiCashflowThresholdReached.replace("{n}", num(roi.payback, 1, locale)) : t.roiCashflowThresholdNotReached)
                .replace("{years}", String(ROI_HORIZON_YEARS))
                .split("{amount}");
              return (
                <>
                  {before}
                  <Text style={{ fontFamily: MONO, fontWeight: 700, color: COLOR.ink }}>{money(gapAt36, currency, locale)}</Text>
                  {after}
                </>
              );
            })()}
          </Text>
        </View>

        <View style={s.card} wrap={false}>
          <Text style={s.cardTitle}>{t.roiScenariosTitle}</Text>
          <View style={s.table}>
            <View style={s.tHeadRow} wrap={false}>
              {getRoiScenarios(locale).map((sc) => (
                <Text key={sc.id} style={s.tCellHead}>{sc.label}</Text>
              ))}
            </View>
            <View style={s.tRow} wrap={false}>
              {getRoiScenarios(locale).map((sc) => (
                <Text key={sc.id} style={[s.tCell, { fontFamily: MONO, fontWeight: 700 }]}>
                  {money(scenarios[sc.id].netRecurring, currency, locale)}
                </Text>
              ))}
            </View>
          </View>
          <Text style={{ fontSize: 7.5, color: COLOR.inkFaint, marginTop: 6, lineHeight: 1.4 }}>
            {t.roiScenariosNote}
          </Text>
        </View>

        <View style={s.card} wrap={false}>
          <Text style={s.cardTitle}>{t.roiSensitivityTitle}</Text>
          <TornadoSvg rows={sensitivity} baseline={roi.netRecurring} currency={currency} locale={locale} />
          <Text style={{ fontSize: 7.5, color: COLOR.inkFaint, marginTop: 4, lineHeight: 1.4 }}>
            {t.roiSensitivityNote.replace("{amount}", money(roi.netRecurring, currency, locale))}
          </Text>
        </View>

        <View style={s.card} wrap={false}>
          <Text style={s.cardTitle}>{t.roiAssumptionsTitle}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {financialAssumptions.map(([label, value]) => (
              <View key={label} style={{ width: "31%" }}>
                <Text style={{ fontSize: 7.5, color: COLOR.inkSoft }}>{label}</Text>
                <Text style={{ fontSize: 9, fontFamily: MONO, fontWeight: 700, color: COLOR.ink }}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        <Footer section={t.sectionRoi} locale={locale} />
      </Page>

      {/* PAGE 5 — Priorisation */}
      {verdict && (
        <Page size="A4" style={s.page}>
          <Header generatedAt={generatedAt} orgLogoUrl={orgLogoUrl} section={t.sectionPriorisation} />
          <SectionHeading title={t.prioPageTitle.replace("{verdict}", verdict.title)} />

          <View style={[s.card, { padding: 0, overflow: "hidden" }]} wrap={false}>
            <View style={{ height: 4, backgroundColor: verdict.color }} />
            <View style={{ padding: 14 }}>
              <Text style={s.eyebrow}>{t.prioRecommendationEyebrow}</Text>
              <Text style={{ fontSize: 15, fontFamily: SANS, fontWeight: 800, color: COLOR.ink, marginTop: 4, marginBottom: 5 }}>
                {verdict.title}
              </Text>
              <Text style={{ fontSize: 9, color: COLOR.inkSoft, lineHeight: 1.5 }}>{verdict.text}</Text>
            </View>
          </View>

          <View style={s.card} wrap={false}>
            <Text style={s.cardTitle}>{t.prioMatrixTitle}</Text>
            <MatrixSvg A={aptitudeScore} V={valueScore} name={processName} labels={matrixLabels} threshold={priorityThreshold} />
          </View>

          <View style={s.metricGrid}>
            <View style={s.metricBox}>
              <Text style={s.metricLabel}>{t.prioMetricAptitude}</Text>
              <Text style={s.metricValue}>{aptitudeScore}/100</Text>
            </View>
            <View style={s.metricBox}>
              <Text style={s.metricLabel}>{t.prioMetricValue}</Text>
              <Text style={s.metricValue}>{valueScore}/100</Text>
            </View>
            <View style={s.metricBox}>
              <Text style={s.metricLabel}>{t.prioMetricNetSavings}</Text>
              <Text style={s.metricValue}>{money(roi.netRecurring, currency, locale)}</Text>
            </View>
          </View>

          <View style={s.card} wrap={false}>
            <Text style={s.cardTitle}>{t.prioQuadrantsTitle}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {[
                { title: prioT.verdictAutomateTitle, text: prioT.verdictAutomateText, color: COLOR.accent },
                { title: prioT.verdictPlanTitle, text: prioT.verdictPlanText, color: "#6B7D31" },
                { title: prioT.verdictPrepareTitle, text: prioT.verdictPrepareText, color: "#9A6C1B" },
                { title: prioT.verdictSetAsideTitle, text: prioT.verdictSetAsideText, color: COLOR.coral },
              ].map((q) => (
                <View key={q.title} style={{ width: "48%", borderLeftWidth: 2.5, borderLeftColor: q.color, paddingLeft: 8 }}>
                  <Text style={{ fontSize: 8, fontFamily: SANS, fontWeight: 700, color: COLOR.ink }}>{q.title}</Text>
                  <Text style={{ fontSize: 7.5, color: COLOR.inkSoft, lineHeight: 1.35, marginTop: 1 }}>{q.text}</Text>
                </View>
              ))}
            </View>
          </View>

          {portfolio.length > 1 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>
                {t.prioPortfolioTitle}
                {portfolioRank > 0 ? t.prioPortfolioRank.replace("{rank}", String(portfolioRank)).replace("{total}", String(portfolio.length)) : ""}
              </Text>
              <View style={s.table}>
                <View style={s.tHeadRow} wrap={false}>
                  <Text style={[s.tCellHead, { flex: 2 }]}>{t.prioColProcess}</Text>
                  <Text style={s.tCellHead}>{t.prioColAptitude}</Text>
                  <Text style={s.tCellHead}>{t.prioColValue}</Text>
                </View>
                {portfolio.slice(0, 8).map((p) => {
                  const isCurrent = p.id === currentProcessId;
                  return (
                    <View key={p.id} style={[s.tRow, isCurrent ? { backgroundColor: COLOR.accentSoft } : {}]} wrap={false}>
                      <Text style={[s.tCell, { flex: 2, fontFamily: SANS, fontWeight: isCurrent ? 700 : 400 }]}>
                        {p.name}{isCurrent ? t.prioCurrentReportSuffix : ""}
                      </Text>
                      <Text style={[s.tCell, { fontFamily: MONO }]}>{p.A}/100</Text>
                      <Text style={[s.tCell, { fontFamily: MONO }]}>{p.V}/100</Text>
                    </View>
                  );
                })}
              </View>
              <Text style={{ fontSize: 7.5, color: COLOR.inkFaint, marginTop: 6, lineHeight: 1.4 }}>
                {t.prioPortfolioNote}
              </Text>
              {portfolioTotalValue != null && (
                <Text style={{ fontSize: 9, fontFamily: SANS, fontWeight: 700, color: COLOR.accentDeep, marginTop: 8 }}>
                  {t.prioPortfolioTotalValue.replace("{amount}", money(portfolioTotalValue, currency, locale))}
                </Text>
              )}
            </View>
          )}

          {portfolioLevers.length > 1 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>{t.prioHeatmapTitle}</Text>
              <View style={s.table}>
                <View style={s.tHeadRow} wrap={false}>
                  <Text style={[s.tCellHead, { flex: 1.6 }]}>{t.prioColProcess}</Text>
                  {reportDimensions.map((d) => (
                    <Text key={d.id} style={s.tCellHead}>{d.short}</Text>
                  ))}
                </View>
                {portfolioLevers.slice(0, 8).map((p) => {
                  const isCurrent = p.id === currentProcessId;
                  return (
                    <View key={p.id} style={[s.tRow, isCurrent ? { backgroundColor: COLOR.accentSoft } : {}]} wrap={false}>
                      <Text style={[s.tCell, { flex: 1.6, fontFamily: SANS, fontWeight: isCurrent ? 700 : 400 }]}>
                        {p.name}
                      </Text>
                      {reportDimensions.map((d) => {
                        const v = p.scores[d.id];
                        const color = v == null ? COLOR.inkFaint : v >= 65 ? COLOR.teal : v >= 40 ? COLOR.gold : COLOR.coral;
                        return (
                          <Text key={d.id} style={[s.tCell, { fontFamily: MONO, fontWeight: 700, color }]}>
                            {v ?? "-"}
                          </Text>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
              <Text style={{ fontSize: 7.5, color: COLOR.inkFaint, marginTop: 6, lineHeight: 1.4 }}>
                {t.prioHeatmapNote}
              </Text>
            </View>
          )}

          <Footer section={t.sectionPriorisation} locale={locale} />
        </Page>
      )}

      {/* PAGE 5b — Gouvernance & risques */}
      <Page size="A4" style={s.page}>
        <Header generatedAt={generatedAt} orgLogoUrl={orgLogoUrl} section={t.sectionGouvernance} />
        <SectionHeading title={governanceTitle} />
        <Text style={{ fontSize: 8.5, color: COLOR.inkSoft, lineHeight: 1.5, marginBottom: 12 }}>
          {t.govIntro}
        </Text>

        <View style={s.card} wrap={false}>
          <Text style={s.cardTitle}>{t.govRiskRegisterTitle}</Text>
          {riskRegister.length === 0 ? (
            <Text style={{ fontSize: 8.5, color: COLOR.inkFaint }}>{t.govRiskRegisterEmpty}</Text>
          ) : (
            <View style={s.table}>
              <View style={s.tHeadRow} wrap={false}>
                <Text style={[s.tCellHead, { flex: 2.4 }]}>{t.govColRisk}</Text>
                <Text style={s.tCellHead}>{t.govColProbability}</Text>
                <Text style={s.tCellHead}>{t.govColImpact}</Text>
                <Text style={[s.tCellHead, { flex: 1.2 }]}>{t.govColOwner}</Text>
              </View>
              {riskRegister.map((r, i) => {
                const levelColor = (lvl: string) => (lvl === "Élevée" ? COLOR.coral : lvl === "Moyenne" ? COLOR.gold : COLOR.inkSoft);
                return (
                  <View key={i} style={s.tRow} wrap={false}>
                    <View style={{ flex: 2.4, padding: 7 }}>
                      <Text style={{ fontSize: 8, fontFamily: SANS, fontWeight: 700, color: COLOR.ink }}>{r.risk}</Text>
                      <Text style={{ fontSize: 7, color: COLOR.inkSoft, marginTop: 2, lineHeight: 1.3 }}>{r.mitigation}</Text>
                    </View>
                    <Text style={[s.tCell, { fontFamily: SANS, fontWeight: 700, color: levelColor(r.probability) }]}>{riskLevelLabel(r.probability, locale)}</Text>
                    <Text style={[s.tCell, { fontFamily: SANS, fontWeight: 700, color: levelColor(r.impact) }]}>{riskLevelLabel(r.impact, locale)}</Text>
                    <Text style={[s.tCell, { flex: 1.2 }]}>{r.owner}</Text>
                  </View>
                );
              })}
            </View>
          )}
          <Text style={{ fontSize: 7.5, color: COLOR.inkFaint, marginTop: 6, lineHeight: 1.4 }}>
            {t.govRiskNote}
          </Text>
        </View>

        <View style={s.card} wrap={false}>
          <Text style={s.cardTitle}>{t.govRaciTitle}</Text>
          <View style={s.table}>
            <View style={s.tHeadRow} wrap={false}>
              <Text style={[s.tCellHead, { flex: 1.6 }]}>{t.govColActivity}</Text>
              <Text style={s.tCellHead}>R</Text>
              <Text style={s.tCellHead}>A</Text>
              <Text style={s.tCellHead}>C</Text>
              <Text style={s.tCellHead}>I</Text>
            </View>
            {raci.map((row, i) => (
              <View key={i} style={s.tRow} wrap={false}>
                <Text style={[s.tCell, { flex: 1.6, fontFamily: SANS, fontWeight: 700 }]}>{row.activity}</Text>
                <Text style={[s.tCell, { fontSize: 7.5 }]}>{row.responsible}</Text>
                <Text style={[s.tCell, { fontSize: 7.5 }]}>{row.accountable}</Text>
                <Text style={[s.tCell, { fontSize: 7.5 }]}>{row.consulted}</Text>
                <Text style={[s.tCell, { fontSize: 7.5 }]}>{row.informed}</Text>
              </View>
            ))}
          </View>
          <Text style={{ fontSize: 7.5, color: COLOR.inkFaint, marginTop: 6, lineHeight: 1.4 }}>
            {t.govRaciNote}
          </Text>
        </View>

        <View style={s.card} wrap={false}>
          <Text style={s.cardTitle}>{t.govComplianceTitle}</Text>
          {compliance.map((item, i) => (
            <View key={i} style={s.checklistItem}>
              <View style={s.checklistBox} />
              <Text style={{ fontSize: 8.5, color: COLOR.ink, flex: 1, lineHeight: 1.4 }}>{item}</Text>
            </View>
          ))}
          <Text style={{ fontSize: 7.5, color: COLOR.inkFaint, marginTop: 8, lineHeight: 1.4 }}>
            {t.govComplianceNote}
          </Text>
        </View>

        {security.length > 0 && (
          <View style={s.card} wrap={false}>
            <Text style={s.cardTitle}>{t.govSecurityTitle}</Text>
            {security.map((item, i) => (
              <View key={i} style={s.checklistItem}>
                <View style={s.checklistBox} />
                <Text style={{ fontSize: 8.5, color: COLOR.ink, flex: 1, lineHeight: 1.4 }}>{item}</Text>
              </View>
            ))}
            <Text style={{ fontSize: 7.5, color: COLOR.inkFaint, marginTop: 8, lineHeight: 1.4 }}>
              {t.govSecurityNote}
            </Text>
          </View>
        )}

        <Footer section={t.sectionGouvernance} locale={locale} />
      </Page>

      {/* PAGE 6 — Feuille de route */}
      <Page size="A4" style={s.page}>
        <Header generatedAt={generatedAt} orgLogoUrl={orgLogoUrl} section={t.sectionFeuilleDeRoute} />
        <SectionHeading title={roadmapTitle} />
        <Text style={{ fontSize: 8.5, color: COLOR.inkSoft, lineHeight: 1.5, marginBottom: 12 }}>
          {t.roadmapIntro}
        </Text>

        <View style={s.card} wrap={false}>
          <Text style={s.cardTitle}>{t.roadmapGanttTitle}</Text>
          <RoadmapGanttSvg
            locale={locale}
            paybackMonths={roi.payback}
            rows={[
              { label: t.roadmapImmediateTitle, timeframe: "", startWeek: 0, durationWeeks: roadmap.immediateDurationWeeks, isImmediate: true },
              ...roadmap.phases.map((phase, i) => ({
                label: t.roadmapPhaseLabel.replace("{n}", String(i + 1)).replace("{title}", phase.title),
                timeframe: phase.timeframe,
                startWeek: phase.startWeek,
                durationWeeks: phase.durationWeeks,
                isImmediate: false,
              })),
            ]}
          />
          <Text style={{ fontSize: 7.5, color: COLOR.inkFaint, marginTop: 6, lineHeight: 1.4 }}>
            {t.roadmapGanttNote}
          </Text>
        </View>

        <View style={[s.card, { backgroundColor: COLOR.goldSoft, borderColor: COLOR.goldTint }]} wrap={false}>
          <Text style={[s.eyebrow, { color: COLOR.gold }]}>{t.roadmapImmediateTitle}</Text>
          {roadmap.immediate.map((item, i) => (
            <View key={i} style={s.checklistItem}>
              <View style={s.checklistBox} />
              <Text style={{ fontSize: 8.5, color: COLOR.ink, flex: 1, lineHeight: 1.4 }}>{item.text}</Text>
            </View>
          ))}
        </View>

        {roadmap.phases.map((phase, i) => (
          <View key={i} style={s.phaseCard}>
            <View style={s.phaseHeader}>
              <Text style={s.phaseTitle}>{t.roadmapPhaseLabel.replace("{n}", String(i + 1)).replace("{title}", phase.title)}</Text>
              <Text style={s.phaseTimeframe}>{phase.timeframe}</Text>
            </View>
            <View style={s.phaseBody}>
              {phase.items.map((item, j) => (
                <View key={j} style={s.bullet}>
                  <Text style={s.bulletDot}>·</Text>
                  <Text style={s.bulletText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <Footer section={t.sectionFeuilleDeRoute} locale={locale} />
      </Page>

      {/* PAGE 7 — Annexe */}
      <Page size="A4" style={s.page}>
        <Header generatedAt={generatedAt} orgLogoUrl={orgLogoUrl} section={t.sectionAnnexe} />
        <SectionHeading title={t.sectionAnnexe} />

        <View style={s.card} wrap={false}>
          <Text style={s.cardTitle}>{t.annexeContextTitle}</Text>
          {contextEntries.length === 0 ? (
            <Text style={{ fontSize: 8.5, color: COLOR.inkFaint }}>{t.annexeContextEmpty}</Text>
          ) : (
            contextEntries.map((q) => (
              <View key={q.id} style={s.annexeBlock}>
                <Text style={s.annexeLabel}>{q.label}</Text>
                <Text style={s.annexeValue}>{context[q.id]}</Text>
              </View>
            ))
          )}
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>{t.annexeAnswersTitle}</Text>
          {!ready ? (
            <Text style={{ fontSize: 8.5, color: COLOR.inkFaint }}>{t.annexeAnswersIncomplete}</Text>
          ) : (
            diag.dimScores.map((d) => (
              <View key={d.id} style={{ marginBottom: 10 }} wrap={false}>
                <Text style={{ fontSize: 8.5, fontFamily: SANS, fontWeight: 700, color: COLOR.ink, marginBottom: 3 }}>
                  {d.label} · {d.score}/100
                </Text>
                {d.questions.map((q, i) => {
                  const qid = `${d.id}-${i}`;
                  const v = answers[qid];
                  const likertLabel = v !== undefined ? getLikert(locale).find((l) => l.v === v)?.label : null;
                  const seeded = v !== undefined && aiSeededAnswers[qid] === v;
                  return (
                    <View
                      key={i}
                      style={{ flexDirection: "row", gap: 8, paddingVertical: 3, borderTopWidth: 1, borderTopColor: COLOR.lineSoft }}
                      wrap={false}
                    >
                      <Text style={{ fontSize: 7.5, color: COLOR.inkSoft, flex: 1, lineHeight: 1.35 }}>{q.text}</Text>
                      {seeded && (
                        <Text style={{ fontSize: 6.5, fontFamily: MONO, fontWeight: 700, color: COLOR.accent, width: 22, textAlign: "right" }}>
                          {t.annexeAiSuggestedBadge}
                        </Text>
                      )}
                      <Text style={{ fontSize: 7.5, fontFamily: MONO, fontWeight: 700, color: v !== undefined ? COLOR.ink : COLOR.inkFaint, width: 90, textAlign: "right" }}>
                        {v !== undefined ? t.annexeAnswerValue.replace("{v}", String(v)).replace("{label}", String(likertLabel)) : t.annexeNotAnswered}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))
          )}
          {Object.keys(aiSeededAnswers).length > 0 && (
            <Text style={{ fontSize: 7, color: COLOR.inkFaint, marginTop: 6, lineHeight: 1.4 }}>
              {t.annexeAiSuggestedNote}
            </Text>
          )}
        </View>

        <View style={s.card} wrap={false}>
          <Text style={s.cardTitle}>{t.annexeSourcesTitle}</Text>
          <Text style={{ fontSize: 8.5, color: COLOR.inkSoft, lineHeight: 1.5, marginBottom: 6 }}>
            {t.annexeMethodology}
          </Text>
          {weightsCustomized && (
            <Text style={{ fontSize: 8, color: COLOR.gold, lineHeight: 1.5, marginBottom: 6, fontFamily: SANS, fontWeight: 600 }}>
              {t.annexeCustomWeights.replace(
                "{weights}",
                diag.dimScores.map((d) => `${d.short} ${Math.round((weights[d.id] / totalW) * 100)}%`).join(" · ")
              )}
            </Text>
          )}
          <Text style={{ fontSize: 8.5, color: COLOR.inkSoft, lineHeight: 1.5, marginBottom: 6 }}>
            {t.annexeApproachNote}
          </Text>
          <Text style={{ fontSize: 8.5, color: COLOR.inkSoft, lineHeight: 1.5, marginBottom: 10 }}>
            {t.annexeValueScoreNote}
          </Text>

          <Text style={[s.annexeLabel, { marginTop: 4 }]}>{t.annexeAdjustmentsTitle}</Text>
          {contextAdjustments.length === 0 ? (
            <Text style={{ fontSize: 8, color: COLOR.inkFaint, marginBottom: 10 }}>
              {t.annexeAdjustmentsEmpty}
            </Text>
          ) : (
            <View style={{ marginBottom: 10 }}>
              {contextAdjustments.map((d) => (
                <View key={d.id} style={{ paddingVertical: 4, borderTopWidth: 1, borderTopColor: COLOR.lineSoft }}>
                  <Text style={{ fontSize: 8, fontFamily: SANS, fontWeight: 700, color: COLOR.ink }}>
                    {t.annexeAdjustmentLine.replace("{label}", d.label).replace("{raw}", String(d.rawScore)).replace("{score}", String(d.score))}
                  </Text>
                  <Text style={{ fontSize: 7.5, color: COLOR.inkSoft, marginTop: 1, lineHeight: 1.35 }}>
                    {d.adjustment?.reason}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Text style={s.annexeLabel}>{t.annexeFinancialAssumptionsTitle}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
            {financialAssumptions.map(([label, value]) => (
              <View key={label} style={{ width: "31%" }}>
                <Text style={{ fontSize: 7.5, color: COLOR.inkSoft }}>{label}</Text>
                <Text style={{ fontSize: 9, fontFamily: MONO, fontWeight: 700, color: COLOR.ink }}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[s.card, { backgroundColor: COLOR.lineSoft }]} wrap={false}>
          <Text style={{ fontSize: 7.5, color: COLOR.inkFaint, lineHeight: 1.5 }}>
            {t.annexeConfidentialityNotice}
          </Text>
        </View>

        <Footer section={t.sectionAnnexe} locale={locale} />
      </Page>
    </Document>
  );
}
