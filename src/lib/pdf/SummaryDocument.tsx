import { Document, Page, View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import { confidenceLabelDisplay, type AssessmentConfidence, type Currency, type DiagnosticResult, type RoiResult } from "@/lib/scoring";
import type { Roadmap, RiskRegisterEntry } from "@/lib/pdf/roadmap";
import { registerReportFonts } from "@/lib/pdf/fonts";
import { money, num, statFontSize } from "@/lib/pdf/format";
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
};

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: SANS, fontSize: 9.5, color: COLOR.ink },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  wordmark: { fontFamily: MONO, fontWeight: 700, fontSize: 11.5, letterSpacing: 1.5, color: COLOR.ink },
  headerMeta: { fontSize: 7.5, color: COLOR.inkFaint, fontFamily: MONO },
  headerRule: { height: 1, backgroundColor: COLOR.line, marginBottom: 22 },
  eyebrow: { fontFamily: MONO, fontWeight: 600, fontSize: 8, letterSpacing: 1.5, color: COLOR.inkFaint, marginBottom: 4, textTransform: "uppercase" },
  processName: { fontSize: 24, fontFamily: SANS, fontWeight: 800, color: COLOR.ink, marginBottom: 18, lineHeight: 1.2 },
  verdictCard: { borderRadius: 8, overflow: "hidden", marginBottom: 18 },
  verdictBar: { height: 4 },
  verdictBody: { padding: 16, backgroundColor: COLOR.surface, borderWidth: 1, borderColor: COLOR.line, borderTopWidth: 0 },
  verdictTitle: { fontSize: 16, fontFamily: SANS, fontWeight: 800, color: COLOR.ink, marginBottom: 5 },
  verdictText: { fontSize: 9.5, color: COLOR.inkSoft, lineHeight: 1.5 },
  kpiRow: { flexDirection: "row", marginBottom: 18, borderTopWidth: 1, borderTopColor: COLOR.line, paddingTop: 14 },
  kpiBox: { flex: 1, paddingRight: 12 },
  kpiBoxDivider: { borderLeftWidth: 1, borderLeftColor: COLOR.line, paddingLeft: 16 },
  kpiLabel: { fontSize: 7.5, color: COLOR.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 },
  kpiValue: { fontSize: 18.5, fontFamily: MONO, fontWeight: 700, color: COLOR.accentDeep },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 10.5, fontFamily: SANS, fontWeight: 700, color: COLOR.ink, marginBottom: 8 },
  riskBox: { borderLeftWidth: 3, borderLeftColor: COLOR.gold, backgroundColor: COLOR.bg, borderRadius: 4, padding: 12, marginBottom: 18 },
  riskLabel: { fontFamily: MONO, fontWeight: 700, fontSize: 7.5, letterSpacing: 0.6, textTransform: "uppercase", color: COLOR.gold, marginBottom: 4 },
  riskText: { fontSize: 9.5, fontWeight: 600, color: COLOR.ink, marginBottom: 3, lineHeight: 1.4 },
  riskMitigation: { fontSize: 8.5, color: COLOR.inkSoft, lineHeight: 1.4 },
  checklistItem: { flexDirection: "row", gap: 8, alignItems: "flex-start", marginBottom: 6 },
  checklistBox: { width: 10, height: 10, borderRadius: 2, borderWidth: 1.4, borderColor: COLOR.gold, marginTop: 1 },
  checklistText: { fontSize: 9, color: COLOR.ink, flex: 1, lineHeight: 1.4 },
  footer: { position: "absolute", bottom: 26, left: 40, right: 40, fontSize: 7.5, color: COLOR.inkFaint, lineHeight: 1.4, borderTopWidth: 1, borderTopColor: COLOR.line, paddingTop: 10 },
});

export function SummaryDocument({
  processName,
  currency,
  generatedAt,
  diag,
  roi,
  verdict,
  confidence,
  roadmap,
  riskRegister,
  aptitudeScore,
  valueScore,
  orgLogoUrl,
  locale = "fr",
}: {
  processName: string;
  currency: Currency;
  generatedAt: string;
  diag: DiagnosticResult;
  roi: RoiResult;
  verdict: { title: string; text: string; color: string } | null;
  confidence: AssessmentConfidence;
  roadmap: Roadmap;
  riskRegister: RiskRegisterEntry[];
  aptitudeScore: number;
  valueScore: number;
  orgLogoUrl?: string | null;
  locale?: Locale;
}) {
  const ready = diag.answeredCount > 0;
  const t = getDictionary(locale).pdf.summary;
  const displayName = processName || getDictionary(locale).pdf.untitledProcess;
  // Déjà trié du plus sévère au moins sévère par buildRiskRegister() (probabilité × impact) —
  // le premier est donc le risque le plus important à signaler sur un résumé d'une page.
  const topRisk = riskRegister[0] ?? null;

  return (
    <Document title={t.documentTitle.replace("{name}", processName)}>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          {orgLogoUrl ? (
            <Image src={orgLogoUrl} style={{ height: 18, maxWidth: 100, objectFit: "contain" }} />
          ) : (
            <Text style={s.wordmark}>VerdiktNow</Text>
          )}
          <Text style={s.headerMeta}>{t.headerMeta.replace("{date}", generatedAt)}</Text>
        </View>
        <View style={s.headerRule} />

        <Text style={s.eyebrow}>{t.eyebrow}</Text>
        <Text style={s.processName}>{displayName}</Text>

        {verdict ? (
          <View style={s.verdictCard}>
            <View style={[s.verdictBar, { backgroundColor: verdict.color }]} />
            <View style={s.verdictBody}>
              <Text style={s.verdictTitle}>{verdict.title}</Text>
              <Text style={s.verdictText}>{verdict.text}</Text>
            </View>
          </View>
        ) : (
          <View style={[s.verdictCard, s.verdictBody, { borderTopWidth: 1 }]}>
            <Text style={s.verdictText}>{t.verdictMissing}</Text>
          </View>
        )}

        <View style={s.kpiRow}>
          <View style={s.kpiBox}>
            <Text style={s.kpiLabel}>{t.kpiAptitude}</Text>
            <Text style={s.kpiValue}>{ready ? `${aptitudeScore}/100` : "-"}</Text>
          </View>
          <View style={[s.kpiBox, s.kpiBoxDivider]}>
            <Text style={s.kpiLabel}>{t.kpiValue}</Text>
            <Text style={s.kpiValue}>{valueScore}/100</Text>
          </View>
          <View style={[s.kpiBox, s.kpiBoxDivider]}>
            <Text style={s.kpiLabel}>{t.kpiNetSavings}</Text>
            <Text style={[s.kpiValue, { fontSize: statFontSize(money(roi.netRecurring, currency, locale), 18.5) }]}>
              {money(roi.netRecurring, currency, locale)}
            </Text>
          </View>
          <View style={[s.kpiBox, s.kpiBoxDivider]}>
            <Text style={s.kpiLabel}>{t.kpiPayback}</Text>
            <Text style={s.kpiValue}>{roi.payback ? t.paybackMonths.replace("{n}", num(roi.payback, 1, locale)) : "-"}</Text>
          </View>
        </View>

        {topRisk && (
          <View style={s.riskBox}>
            <Text style={s.riskLabel}>{t.topRiskLabel}</Text>
            <Text style={s.riskText}>{topRisk.risk}</Text>
            <Text style={s.riskMitigation}>{t.topRiskMitigation.replace("{mitigation}", topRisk.mitigation)}</Text>
          </View>
        )}

        <View style={s.section}>
          <Text style={s.sectionTitle}>{t.nextStepsTitle}</Text>
          {roadmap.immediate.map((item, i) => (
            <View key={i} style={s.checklistItem}>
              <View style={s.checklistBox} />
              <Text style={s.checklistText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <Text style={{ fontSize: 7.5, color: COLOR.inkFaint, lineHeight: 1.4 }}>
          {t.reliabilityLine
            .replace("{label}", confidenceLabelDisplay(confidence.label, locale))
            .replace("{reasons}", confidence.reasons.join(" · "))}
        </Text>

        <View style={s.footer}>
          <Text>{t.footerNote}</Text>
        </View>
      </Page>
    </Document>
  );
}
