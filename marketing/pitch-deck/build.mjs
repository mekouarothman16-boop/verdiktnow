import PptxGenJS from "pptxgenjs";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOTS_DIR = join(__dirname, "..", "screenshots", "cropped");

// Palette reprise telle quelle du thème clair réel du site (src/app/globals.css) :
// fond gris-vert doux, encre pour le texte, olive foncé comme accent lisible,
// chartreuse réservée aux remplissages (badges, barres, boutons), jamais au texte.
const BG = "E9ECEA";
const SURFACE = "FFFFFF";
const INK = "091315";
const INK_SOFT = "686464";
const INK_FAINT = "6D7373";
const LINE = "D7DBD8";
const LINE_SOFT = "E2E5E2";
const ACCENT = "55631A";
const ACCENT_DEEP = "3D4712";
const CHARTREUSE = "D7FF53";
const OLIVE_TINT = "8AA23F";
const AMBER_TINT = "DCA13A";
const CORAL_TINT = "D0654A";

// pptxgenjs mute les objets d'options en place (conversion en EMU au premier usage) :
// jamais un objet shadow partagé entre plusieurs add*, toujours une instance fraîche.
function cardShadow() {
  return { type: "outer", color: "091315", opacity: 0.12, blur: 8, offset: 3, angle: 90 };
}

const SLIDE_W = 13.33;
const SLIDE_H = 7.5;
const MARGIN = 0.7;

const HEAD_FONT = "Segoe UI Semibold";
const BODY_FONT = "Segoe UI";

const TOTAL_SLIDES = 32;

const DOCUMENTS_DIR = join(os.homedir(), "OneDrive", "Documents");
const OUT_DIR = join(DOCUMENTS_DIR, "Présentation VerdiktNow");
const OUT_FILE = join(OUT_DIR, "VerdiktNow - Présentation.pptx");

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "VERDIKT_WIDE", width: SLIDE_W, height: SLIDE_H });
pptx.layout = "VERDIKT_WIDE";
pptx.author = "VerdiktNow";
pptx.title = "VerdiktNow · Présentation";

let pageNum = 0;

// Structure "sandwich" : fond sombre pour l'ouverture et la clôture, clair pour le
// contenu (recommandation du skill pptx). DARK_INK reprend l'encre du produit lui-même.
const DARK_INK = "091315";
const DARK_PANEL = "111C1F";
const DARK_LINE = "2A3538";

function newSlide({ footer = true, dark = false } = {}) {
  const slide = pptx.addSlide();
  slide.background = { color: dark ? DARK_INK : BG };
  pageNum += 1;
  if (footer) addFooter(slide, dark);
  return slide;
}

function addAccentDot(slide, x, y, size = 0.09) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w: size,
    h: size,
    rectRadius: size / 2,
    fill: { color: CHARTREUSE },
  });
}

function addFooter(slide, dark = false) {
  slide.addText(
    [
      { text: "Verdikt", options: { color: dark ? "FFFFFF" : INK, bold: true } },
      { text: "Now", options: { color: CHARTREUSE, bold: true } },
    ],
    { x: MARGIN, y: SLIDE_H - 0.55, w: 3, h: 0.3, fontFace: BODY_FONT, fontSize: 11, align: "left" },
  );
  slide.addText(`${String(pageNum).padStart(2, "0")} / ${TOTAL_SLIDES}`, {
    x: SLIDE_W - MARGIN - 1.4,
    y: SLIDE_H - 0.55,
    w: 1.4,
    h: 0.3,
    fontFace: BODY_FONT,
    fontSize: 11,
    color: dark ? "8A9490" : INK_FAINT,
    align: "right",
  });
}

function addEyebrow(slide, text, { x = MARGIN, y = 0.6, dark = false } = {}) {
  const w = text.length * 0.105 + 0.4;
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h: 0.36,
    rectRadius: 0.18,
    fill: { color: dark ? DARK_PANEL : SURFACE },
    line: { color: dark ? DARK_LINE : LINE, width: 1 },
  });
  slide.addText(text.toUpperCase(), {
    x,
    y,
    w,
    h: 0.36,
    fontFace: HEAD_FONT,
    fontSize: 11,
    bold: true,
    color: dark ? CHARTREUSE : "000000",
    align: "center",
    valign: "middle",
    charSpacing: 1,
  });
  return w;
}

function addTitle(slide, runsOrText, { x = MARGIN, y = 1.15, w = SLIDE_W - MARGIN * 2, fontSize = 28 } = {}) {
  slide.addText(runsOrText, {
    x,
    y,
    w,
    h: 1.1,
    fontFace: HEAD_FONT,
    fontSize,
    bold: true,
    color: "000000",
    align: "left",
    valign: "top",
    lineSpacingMultiple: 1.08,
  });
}

function addBullets(slide, items, { x = MARGIN, y = 2.5, w = SLIDE_W - MARGIN * 2, fontSize = 17 } = {}) {
  const paras = items.map((text) => ({
    text,
    options: {
      bullet: { code: "25AA", indent: 22 },
      color: INK,
      fontSize,
      fontFace: BODY_FONT,
      breakLine: true,
      paraSpaceAfter: 18,
    },
  }));
  slide.addText(paras, { x, y, w, h: SLIDE_H - y - 0.9, valign: "top", lineSpacingMultiple: 1.2 });
}

function addCards(slide, cards, { y = 2.3, h = 3.6, columns } = {}) {
  const gap = 0.4;
  const n = cards.length;
  const cols = columns || n;
  const rows = Math.ceil(n / cols);
  const w = (SLIDE_W - MARGIN * 2 - gap * (cols - 1)) / cols;
  const rowGap = 0.35;
  cards.forEach((card, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = MARGIN + col * (w + gap);
    const cy = y + row * (h + rowGap);

    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y: cy,
      w,
      h,
      rectRadius: 0.2,
      fill: { color: SURFACE },
      line: { color: SURFACE, width: 1 },
      shadow: cardShadow(),
    });
    // Pastille chartreuse et titre sur la même ligne, titre en encre : le titre
    // porte l'information, la pastille n'est qu'un repère. L'ancienne version
    // mettait le titre en olive sur sa propre ligne, ce qui le noyait.
    addAccentDot(slide, x + 0.29, cy + 0.36, 0.085);
    slide.addText(card.title, {
      x: x + 0.44,
      y: cy + 0.24,
      w: w - 0.73,
      h: 0.34,
      fontFace: HEAD_FONT,
      fontSize: 15,
      bold: true,
      color: "000000",
      valign: "middle",
    });
    if (card.description) {
      slide.addText(card.description, {
        x: x + 0.29,
        y: cy + 0.72,
        w: w - 0.58,
        h: h - 0.95,
        fontFace: BODY_FONT,
        fontSize: 12,
        color: INK_SOFT,
        valign: "top",
        lineSpacingMultiple: 1.35,
      });
    }
    if (card.details) {
      const paras = card.details.map((text) => ({
        text,
        options: {
          bullet: { code: "2022", indent: 14 },
          color: INK_SOFT,
          fontSize: 12.5,
          fontFace: BODY_FONT,
          breakLine: true,
          paraSpaceAfter: 8,
        },
      }));
      slide.addText(paras, {
        x: x + 0.29,
        y: cy + 0.72,
        w: w - 0.58,
        h: h - 0.95,
        valign: "top",
        lineSpacingMultiple: 1.15,
      });
    }
  });
}

function addSteps(slide, steps, { x = MARGIN, y = 2.3, columns = 1, rowH = 0.62, fontSize = 15, colGap = 0.6 } = {}) {
  const colW = (SLIDE_W - MARGIN * 2 - colGap * (columns - 1)) / columns;
  const perCol = Math.ceil(steps.length / columns);
  steps.forEach((label, i) => {
    const col = Math.floor(i / perCol);
    const row = i % perCol;
    const cx = x + col * (colW + colGap);
    const cy = y + row * rowH;
    slide.addShape(pptx.ShapeType.ellipse, {
      x: cx,
      y: cy,
      w: 0.36,
      h: 0.36,
      fill: { color: SURFACE },
      line: { color: ACCENT, width: 1.25 },
      shadow: cardShadow(),
    });
    slide.addText(String(i + 1), {
      x: cx,
      y: cy,
      w: 0.36,
      h: 0.36,
      fontFace: HEAD_FONT,
      fontSize: i + 1 >= 10 ? 10 : 12,
      bold: true,
      color: ACCENT,
      align: "center",
      valign: "middle",
      wrap: false,
    });
    slide.addText(label, {
      x: cx + 0.5,
      y: cy - 0.03,
      w: colW - 0.5,
      h: 0.42,
      fontFace: BODY_FONT,
      fontSize,
      color: INK,
      valign: "middle",
    });
  });
}

function addBigStat(slide, stat, description, { y = 2.1 } = {}) {
  slide.addText(stat, {
    x: 0,
    y,
    w: SLIDE_W,
    h: 2.1,
    fontFace: HEAD_FONT,
    fontSize: 120,
    bold: true,
    color: ACCENT,
    align: "center",
    valign: "middle",
  });
  slide.addText(description, {
    x: SLIDE_W / 2 - 4,
    y: y + 2.05,
    w: 8,
    h: 1,
    fontFace: BODY_FONT,
    fontSize: 19,
    color: INK,
    align: "center",
    valign: "top",
    lineSpacingMultiple: 1.3,
  });
}

// Le canevas de référence est en 1280x720 px, soit exactement 96 px par pouce
// sur une diapo 13,33 x 7,5 : toute coordonnée px du canevas se divise par 96.
const PX = 1 / 96;

/** Statistique géante accompagnée d'une grille de 100 carrés dont N sont
 * remplis : rend le pourcentage tangible et occupe la moitié droite, qui
 * restait vide quand le chiffre était seul et centré. */
function addStatWithGrid(slide, stat, description, legend, { filled = 2 } = {}) {
  slide.addText(stat, {
    x: MARGIN,
    y: 2.3,
    w: 5.2,
    h: 1.7,
    fontFace: HEAD_FONT,
    fontSize: 110,
    bold: true,
    color: ACCENT,
    align: "left",
    valign: "middle",
  });
  slide.addText(description, {
    x: MARGIN,
    y: 4.2,
    w: 4.7,
    h: 1.1,
    fontFace: BODY_FONT,
    fontSize: 16.5,
    color: INK,
    align: "left",
    valign: "top",
    lineSpacingMultiple: 1.25,
  });

  const cell = 26.1 * PX;
  const gap = 9 * PX;
  const gridW = 10 * cell + 9 * gap;
  const gridX = SLIDE_W - MARGIN - gridW;
  const gridY = 2.24;

  slide.addShape(pptx.ShapeType.roundRect, {
    x: MARGIN,
    y: 5.52,
    w: 0.15,
    h: 0.15,
    rectRadius: 0.04,
    fill: { color: CHARTREUSE },
  });
  slide.addText(legend, {
    x: MARGIN + 0.28,
    y: 5.47,
    w: 4,
    h: 0.25,
    fontFace: BODY_FONT,
    fontSize: 10,
    color: INK_SOFT,
    valign: "middle",
  });

  for (let i = 0; i < 100; i += 1) {
    const col = i % 10;
    const row = Math.floor(i / 10);
    slide.addShape(pptx.ShapeType.roundRect, {
      x: gridX + col * (cell + gap),
      y: gridY + row * (cell + gap),
      w: cell,
      h: cell,
      rectRadius: 0.045,
      fill: { color: i < filled ? CHARTREUSE : LINE },
    });
  }
}

/** Cartes à bandeau d'en-tête plein : le nom de la catégorie vit dans un
 * bandeau coloré plutôt qu'en simple titre, et les points deviennent des
 * entrées numérotées. Les deux cartes se distinguent enfin l'une de l'autre. */
function addBandedCards(slide, cards, { y = 2.5, h = 3.7 } = {}) {
  const gap = 28 * PX;
  const w = (SLIDE_W - MARGIN * 2 - gap) / 2;
  const radius = 20 * PX;
  const bandH = 0.9;

  cards.forEach((card, i) => {
    const x = MARGIN + i * (w + gap);
    const dark = card.tone === "ink";
    const bandFill = dark ? DARK_INK : CHARTREUSE;

    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w,
      h,
      rectRadius: radius,
      fill: { color: SURFACE },
      line: { color: LINE, width: 1 },
      shadow: cardShadow(),
    });

    // Bandeau : un roundRect puis un rectangle qui en carre le bas, pour
    // n'arrondir que les deux coins supérieurs.
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w,
      h: bandH,
      rectRadius: radius,
      fill: { color: bandFill },
      line: { color: bandFill, width: 1 },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x,
      y: y + bandH / 2,
      w,
      h: bandH / 2,
      fill: { color: bandFill },
      line: { color: bandFill, width: 1 },
    });

    slide.addText(card.title, {
      x: x + 0.31,
      y: y + 0.17,
      w: w - 0.62,
      h: 0.36,
      fontFace: HEAD_FONT,
      fontSize: 16.5,
      bold: true,
      color: dark ? "FFFFFF" : "000000",
      valign: "middle",
    });
    if (card.subtitle) {
      slide.addText(card.subtitle, {
        x: x + 0.31,
        y: y + 0.53,
        w: w - 0.62,
        h: 0.26,
        fontFace: BODY_FONT,
        fontSize: 9.5,
        color: dark ? "8A9490" : ACCENT_DEEP,
        valign: "middle",
      });
    }

    const rowH = 0.55;
    const bodyY = y + bandH + 0.25;
    card.details.forEach((text, j) => {
      const ry = bodyY + j * rowH;
      slide.addText(String(j + 1).padStart(2, "0"), {
        x: x + 0.31,
        y: ry,
        w: 0.42,
        h: 0.28,
        fontFace: HEAD_FONT,
        fontSize: 9.75,
        bold: true,
        color: ACCENT,
        valign: "top",
        wrap: false,
      });
      slide.addText(text, {
        x: x + 0.71,
        y: ry - 0.03,
        w: w - 1.02,
        h: 0.52,
        fontFace: BODY_FONT,
        fontSize: 11.25,
        color: INK,
        valign: "top",
        lineSpacingMultiple: 1.2,
      });
    });
  });
}

function addStatement(slide, runsOrText, sub) {
  slide.addText(runsOrText, {
    x: 1.2,
    y: 2.5,
    w: SLIDE_W - 2.4,
    h: 2,
    fontFace: HEAD_FONT,
    fontSize: 34,
    bold: true,
    color: INK,
    align: "center",
    valign: "middle",
    lineSpacingMultiple: 1.1,
  });
  if (sub) {
    slide.addText(sub, {
      x: 1.8,
      y: 4.55,
      w: SLIDE_W - 3.6,
      h: 0.8,
      fontFace: BODY_FONT,
      fontSize: 15,
      color: INK_SOFT,
      align: "center",
      valign: "top",
    });
  }
}

function addMatrix(slide, points, { x = SLIDE_W - 6.6, y = 1.7, w = 5.6, h = 4.5 } = {}) {
  const midX = x + w / 2;
  const midY = y + h / 2;

  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.05,
    fill: { color: SURFACE },
    line: { color: LINE, width: 1.25 },
    shadow: cardShadow(),
  });

  slide.addText("APTITUDE ↑", {
    x,
    y: y - 0.32,
    w,
    h: 0.3,
    fontFace: HEAD_FONT,
    fontSize: 10,
    bold: true,
    color: INK_FAINT,
    charSpacing: 1,
  });

  // Mêmes teintes et la même logique que src/components/app/Matrix.tsx : le quadrant
  // "Automatiser en priorité" ressort en chartreuse, les trois autres restent neutres.
  slide.addShape(pptx.ShapeType.rect, { x: midX, y, w: w / 2, h: h / 2, fill: { color: CHARTREUSE, transparency: 82 } });
  slide.addShape(pptx.ShapeType.line, { x: midX, y, w: 0, h, line: { color: LINE, width: 1, dashType: "dash" } });
  slide.addShape(pptx.ShapeType.line, { x, y: midY, w, h: 0, line: { color: LINE, width: 1, dashType: "dash" } });

  slide.addText("Automatiser en priorité", {
    x: midX + 0.15,
    y: y + 0.1,
    w: w / 2 - 0.3,
    h: 0.5,
    fontFace: HEAD_FONT,
    fontSize: 11,
    bold: true,
    color: ACCENT_DEEP,
  });
  slide.addText("Planifier", {
    x: x + 0.15,
    y: y + 0.1,
    w: w / 2 - 0.3,
    h: 0.4,
    fontFace: HEAD_FONT,
    fontSize: 11,
    bold: true,
    color: INK_FAINT,
  });
  slide.addText("Préparer le terrain", {
    x: midX + 0.15,
    y: y + h - 0.38,
    w: w / 2 - 0.3,
    h: 0.4,
    fontFace: HEAD_FONT,
    fontSize: 11,
    bold: true,
    color: INK_FAINT,
  });
  slide.addText("Écarter", {
    x: x + 0.15,
    y: y + h - 0.38,
    w: w / 2 - 0.3,
    h: 0.4,
    fontFace: HEAD_FONT,
    fontSize: 11,
    bold: true,
    color: INK_FAINT,
  });
  slide.addText("VALEUR →", {
    x,
    y: y + h + 0.06,
    w,
    h: 0.3,
    fontFace: HEAD_FONT,
    fontSize: 10,
    bold: true,
    color: INK_FAINT,
    align: "right",
    charSpacing: 1,
  });

  points.forEach((p) => {
    const px = x + (p.leftPct / 100) * w;
    const py = y + (p.topPct / 100) * h;
    const r = p.hero ? 0.12 : 0.075;
    slide.addShape(pptx.ShapeType.ellipse, {
      x: px - r,
      y: py - r,
      w: r * 2,
      h: r * 2,
      fill: { color: p.hero ? CHARTREUSE : ACCENT },
      line: { color: SURFACE, width: 1.5 },
    });
    slide.addText(p.label, {
      x: px - 1.15,
      y: py - r - 0.4,
      w: 2.3,
      h: 0.35,
      fontFace: p.hero ? HEAD_FONT : BODY_FONT,
      fontSize: p.hero ? 12 : 10,
      bold: !!p.hero,
      color: p.hero ? INK : INK_FAINT,
      align: "center",
    });
  });
}

function addChecklist(slide, items, { x = MARGIN, y = 2.3, rowH = 0.58, fontSize = 16, w = 8 } = {}) {
  items.forEach((item, i) => {
    const ry = y + i * rowH;
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y: ry,
      w: 0.32,
      h: 0.32,
      rectRadius: 0.06,
      fill: { color: item.done ? CHARTREUSE : SURFACE },
      line: { color: item.done ? CHARTREUSE : LINE, width: 1.25 },
    });
    if (item.done) {
      slide.addText("✓", {
        x,
        y: ry - 0.02,
        w: 0.32,
        h: 0.32,
        fontFace: BODY_FONT,
        fontSize: 14,
        bold: true,
        color: INK,
        align: "center",
        valign: "middle",
      });
    }
    slide.addText(item.label, {
      x: x + 0.5,
      y: ry - 0.05,
      w,
      h: 0.42,
      fontFace: BODY_FONT,
      fontSize,
      color: item.done ? INK_FAINT : INK,
      valign: "middle",
    });
  });
}

function addCompare(slide, { leftLabel, leftItems, rightLabel, rightItems, y = 2.2, h = 4.3 } = {}) {
  const colW = (SLIDE_W - MARGIN * 2 - 0.6) / 2;
  const cols = [
    { x: MARGIN, label: leftLabel, items: leftItems, color: CORAL_TINT, mark: "✗" },
    { x: MARGIN + colW + 0.6, label: rightLabel, items: rightItems, color: ACCENT, mark: "✓" },
  ];
  const bandH = 0.62;
  const radius = 0.2;
  cols.forEach(({ x, label, items, color, mark }, ci) => {
    const bandFill = ci === 0 ? "F7EFEC" : DARK_INK;
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: colW,
      h,
      rectRadius: radius,
      fill: { color: SURFACE },
      line: { color: SURFACE, width: 1 },
      shadow: cardShadow(),
    });
    // Bandeau d'en-tête, comme sur les cartes « Pour qui » : le label ne flotte
    // plus dans le blanc, il est porté par un aplat qui oppose les deux colonnes.
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: colW,
      h: bandH,
      rectRadius: radius,
      fill: { color: bandFill },
      line: { color: bandFill, width: 1 },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x,
      y: y + bandH / 2,
      w: colW,
      h: bandH / 2,
      fill: { color: bandFill },
      line: { color: bandFill, width: 1 },
    });
    slide.addText(label, {
      x: x + 0.32,
      y,
      w: colW - 0.64,
      h: bandH,
      fontFace: HEAD_FONT,
      fontSize: 16,
      bold: true,
      color: ci === 0 ? CORAL_TINT : "FFFFFF",
      valign: "middle",
    });
    items.forEach((text, i) => {
      const ry = y + bandH + 0.36 + i * 0.85;
      slide.addText(mark, {
        x: x + 0.35,
        y: ry,
        w: 0.4,
        h: 0.4,
        fontFace: BODY_FONT,
        fontSize: 15,
        bold: true,
        color,
        valign: "top",
      });
      slide.addText(text, {
        x: x + 0.8,
        y: ry - 0.02,
        w: colW - 1.15,
        h: 0.75,
        fontFace: BODY_FONT,
        fontSize: 13.5,
        color: INK,
        valign: "top",
        lineSpacingMultiple: 1.25,
      });
    });
  });
}

function addPills(slide, labels, { y = 2.6, fontSize = 18 } = {}) {
  const pillH = 0.7;
  const widths = labels.map((l) => l.length * 0.13 + 0.6);
  const gap = 0.35;
  const totalW = widths.reduce((a, b) => a + b, 0) + gap * (labels.length - 1);
  let cx = (SLIDE_W - totalW) / 2;
  labels.forEach((label, i) => {
    const w = widths[i];
    slide.addShape(pptx.ShapeType.roundRect, {
      x: cx,
      y,
      w,
      h: pillH,
      rectRadius: 0.35,
      fill: { color: SURFACE },
      line: { color: LINE, width: 1 },
      shadow: cardShadow(),
    });
    slide.addText(label, {
      x: cx,
      y,
      w,
      h: pillH,
      fontFace: HEAD_FONT,
      fontSize,
      bold: true,
      color: INK,
      align: "center",
      valign: "middle",
    });
    cx += w + gap;
  });
  return { totalW, y, pillH };
}

function addLeverBars(slide, levers, { x = MARGIN, y = 2.3, w = 8.4, rowH = 0.6 } = {}) {
  levers.forEach((lv, i) => {
    const ry = y + i * rowH;
    slide.addText(lv.label, {
      x,
      y: ry,
      w: 3.1,
      h: 0.36,
      fontFace: BODY_FONT,
      fontSize: 13.5,
      color: INK,
      valign: "middle",
    });
    const barX = x + 3.2;
    const barW = w - 3.2 - 0.55;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: barX,
      y: ry + 0.09,
      w: barW,
      h: 0.18,
      rectRadius: 0.09,
      fill: { color: LINE_SOFT },
      line: { color: LINE, width: 0.75 },
    });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: barX,
      y: ry + 0.09,
      w: Math.max(barW * (lv.score / 100), 0.18),
      h: 0.18,
      rectRadius: 0.09,
      fill: { color: CHARTREUSE },
    });
    slide.addText(String(lv.score), {
      x: x + w - 0.55,
      y: ry,
      w: 0.55,
      h: 0.36,
      fontFace: HEAD_FONT,
      fontSize: 12.5,
      bold: true,
      color: ACCENT,
      align: "right",
      valign: "middle",
    });
  });
}

/** Rail : l'eyebrow et le titre passent dans une colonne de gauche verticalement
 * centrée, les rangées numérotées deviennent des cartes qui occupent la pleine
 * hauteur à droite. Remplace l'ancien empilement aligné en haut, qui laissait
 * la moitié basse de la diapo vide. Une carte peut être mise en encre pour
 * créer un point d'appui au milieu de la liste. */
function addRailRows(slide, eyebrowText, title, items, { highlight = -1 } = {}) {
  const railW = 3.55;
  const gap = 0.58;
  const colX = MARGIN + railW + gap;
  const colW = SLIDE_W - MARGIN * 2 - railW - gap;

  // Le rail se centre sur le même axe que la pile de cartes (3,9") pour que
  // les deux colonnes se répondent, quel que soit le nombre de rangées.
  const ebW = Math.max(1.15, eyebrowText.length * 0.093 + 0.42);
  const ebY = 2.6;
  slide.addShape(pptx.ShapeType.roundRect, {
    x: MARGIN,
    y: ebY,
    w: ebW,
    h: 0.36,
    rectRadius: 0.18,
    fill: { color: SURFACE },
    shadow: cardShadow(),
  });
  slide.addText(eyebrowText.toUpperCase(), {
    x: MARGIN,
    y: ebY,
    w: ebW,
    h: 0.36,
    fontFace: HEAD_FONT,
    fontSize: 11,
    bold: true,
    color: "000000",
    align: "center",
    valign: "middle",
    charSpacing: 1,
  });
  slide.addText(title, {
    x: MARGIN,
    y: ebY + 0.54,
    w: railW,
    h: 1.9,
    fontFace: HEAD_FONT,
    fontSize: 25,
    bold: true,
    color: "000000",
    valign: "top",
    lineSpacingMultiple: 1.06,
  });

  const rowH = 1.12;
  const rowGap = 0.22;
  const total = items.length * rowH + (items.length - 1) * rowGap;
  let ry = 3.55 - total / 2 + 0.35;
  items.forEach((item, i) => {
    const dark = i === highlight;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: colX,
      y: ry,
      w: colW,
      h: rowH,
      rectRadius: 0.2,
      fill: { color: dark ? DARK_INK : SURFACE },
      line: { color: dark ? DARK_INK : LINE, width: 1 },
      shadow: cardShadow(),
    });
    slide.addText(String(i + 1).padStart(2, "0"), {
      x: colX + 0.3,
      y: ry + 0.22,
      w: 0.55,
      h: 0.4,
      fontFace: HEAD_FONT,
      fontSize: 22,
      bold: true,
      color: dark ? CHARTREUSE : LINE,
      valign: "top",
      wrap: false,
    });
    slide.addText(item.title, {
      x: colX + 0.95,
      y: ry + 0.2,
      w: colW - 1.25,
      h: 0.32,
      fontFace: HEAD_FONT,
      fontSize: 14.5,
      bold: true,
      color: dark ? "FFFFFF" : "000000",
      valign: "top",
    });
    slide.addText(item.description, {
      x: colX + 0.95,
      y: ry + 0.55,
      w: colW - 1.25,
      h: 0.5,
      fontFace: BODY_FONT,
      fontSize: 11,
      color: dark ? "B9C2BF" : INK_SOFT,
      valign: "top",
      lineSpacingMultiple: 1.25,
    });
    ry += rowH + rowGap;
  });
}

function addDetailRows(slide, items, { x = MARGIN, y = 2.3, w = SLIDE_W - MARGIN * 2, rowH = 1.05 } = {}) {
  items.forEach((item, i) => {
    const ry = y + i * rowH;
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y: ry,
      w: 0.44,
      h: 0.44,
      rectRadius: 0.1,
      fill: { color: SURFACE },
      line: { color: ACCENT, width: 1.25 },
      shadow: cardShadow(),
    });
    slide.addText(String(i + 1), {
      x,
      y: ry,
      w: 0.44,
      h: 0.44,
      fontFace: HEAD_FONT,
      fontSize: 15,
      bold: true,
      color: ACCENT,
      align: "center",
      valign: "middle",
    });
    slide.addText(item.title, {
      x: x + 0.68,
      y: ry - 0.04,
      w: w - 0.68,
      h: 0.4,
      fontFace: HEAD_FONT,
      fontSize: 15.5,
      bold: true,
      color: INK,
      valign: "top",
    });
    slide.addText(item.description, {
      x: x + 0.68,
      y: ry + 0.36,
      w: w - 0.68,
      h: rowH - 0.4,
      fontFace: BODY_FONT,
      fontSize: 13,
      color: INK_SOFT,
      valign: "top",
      lineSpacingMultiple: 1.25,
    });
  });
}

// Vraie capture d'écran de l'outil (localhost:3000), pas une maquette : cadrée dans une
// carte flottante, dimensionnée pour préserver son ratio d'origine dans une zone donnée.
function addScreenshot(slide, file, pxW, pxH, { boxX = MARGIN, boxY = 1.9, boxW = SLIDE_W - MARGIN * 2, boxH = 5.15 } = {}) {
  const ratio = pxW / pxH;
  const boxRatio = boxW / boxH;
  let w, h;
  if (ratio > boxRatio) {
    w = boxW;
    h = boxW / ratio;
  } else {
    h = boxH;
    w = boxH * ratio;
  }
  const x = boxX + (boxW - w) / 2;
  const y = boxY + (boxH - h) / 2;
  slide.addShape(pptx.ShapeType.roundRect, {
    x: x - 0.05,
    y: y - 0.05,
    w: w + 0.1,
    h: h + 0.1,
    rectRadius: 0.05,
    fill: { color: SURFACE },
    line: { color: LINE, width: 1 },
    shadow: cardShadow(),
  });
  slide.addImage({ path: join(SHOTS_DIR, file), x, y, w, h });
}

// ---------------------------------------------------------------------------
// Contenu
// ---------------------------------------------------------------------------

// S1 · Titre
// Composition ancrée à gauche plutôt que centrée : le titre respire, et les
// trois preuves du cas illustratif deviennent de vrais blocs chiffrés posés
// sur une ligne de base, au lieu de pastilles flottantes.
{
  const slide = newSlide({ footer: false, dark: true });

  // Motif : arcs concentriques décalés à droite, écho du cadran d'aptitude.
  [[6.9, 1.25, 78], [5.1, 1, 86], [3.3, 1, 92]].forEach(([r, width, transparency]) => {
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 10.52 - r,
      y: 3.75 - r,
      w: r * 2,
      h: r * 2,
      fill: { type: "none" },
      line: { color: CHARTREUSE, width, transparency },
    });
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: MARGIN,
    y: 0.58,
    w: 0.31,
    h: 0.31,
    rectRadius: 0.1,
    fill: { color: DARK_INK },
    line: { color: CHARTREUSE, width: 1.25 },
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: MARGIN + 0.105,
    y: 0.685,
    w: 0.1,
    h: 0.1,
    fill: { color: DARK_INK },
    line: { color: CHARTREUSE, width: 1.25 },
  });
  slide.addText(
    [
      { text: "Verdikt", options: { color: "FFFFFF", bold: true } },
      { text: "Now", options: { color: CHARTREUSE, bold: true } },
    ],
    { x: MARGIN + 0.44, y: 0.55, w: 3, h: 0.38, fontFace: HEAD_FONT, fontSize: 15, valign: "middle" },
  );

  slide.addText(
    [
      { text: "Diagnostiquer avant", options: { color: "FFFFFF", breakLine: true } },
      { text: "d'automatiser.", options: { color: CHARTREUSE } },
    ],
    {
      x: MARGIN,
      y: 2.15,
      w: 9.2,
      h: 1.9,
      fontFace: HEAD_FONT,
      fontSize: 60,
      bold: true,
      align: "left",
      lineSpacingMultiple: 0.98,
    },
  );
  slide.addText(
    "L'outil qui évalue l'aptitude réelle d'un processus, chiffre son retour et priorise la feuille de route, avant qu'un budget ne soit engagé.",
    {
      x: MARGIN,
      y: 4.2,
      w: 6.5,
      h: 0.9,
      fontFace: BODY_FONT,
      fontSize: 13.5,
      color: "B9C2BF",
      align: "left",
      valign: "top",
      lineSpacingMultiple: 1.4,
    },
  );

  slide.addShape(pptx.ShapeType.line, {
    x: MARGIN,
    y: 5.5,
    w: SLIDE_W - MARGIN * 2,
    h: 0,
    line: { color: DARK_LINE, width: 1 },
  });

  // Bande de preuve : les vrais résultats du cas illustratif présenté plus loin.
  const proof = [
    { value: "76", suffix: " / 100", label: "aptitude" },
    { value: "54 696 $", suffix: "", label: "économies nettes / an" },
    { value: "6,6", suffix: " mois", label: "retour sur investissement" },
  ];
  let px = MARGIN;
  proof.forEach((p) => {
    const runs = [{ text: p.value, options: { color: CHARTREUSE, fontSize: 26, bold: true } }];
    if (p.suffix) runs.push({ text: p.suffix, options: { color: "8A9490", fontSize: 15, bold: true } });
    slide.addText(runs, {
      x: px,
      y: 5.72,
      w: 3.1,
      h: 0.45,
      fontFace: HEAD_FONT,
      align: "left",
      valign: "middle",
    });
    slide.addText(p.label.toUpperCase(), {
      x: px,
      y: 6.18,
      w: 3.1,
      h: 0.26,
      fontFace: BODY_FONT,
      fontSize: 9,
      color: "8A9490",
      charSpacing: 0.8,
      valign: "middle",
    });
    px += 3.5;
  });
  slide.addText("Cas illustratif détaillé plus loin dans cette présentation", {
    x: SLIDE_W - MARGIN - 2.3,
    y: 5.85,
    w: 2.3,
    h: 0.6,
    fontFace: BODY_FONT,
    fontSize: 9.5,
    color: "6D7373",
    align: "right",
    valign: "middle",
    lineSpacingMultiple: 1.3,
  });
}

// S2 · Sommaire
{
  const slide = newSlide();
  addEyebrow(slide, "Sommaire");
  addTitle(slide, "Quinze minutes, puis tout le détail");

  const sections = [
    { title: "Le problème", description: "Pourquoi la plupart des projets d'automatisation partent mal.", range: "03 – 06" },
    { title: "La méthode", description: "Comment VerdiktNow note un processus, et pourquoi le score se tient.", range: "07 – 09" },
    { title: "Le cas illustratif", description: "Un vrai processus diagnostiqué dans l'outil, du score au plan d'action.", range: "10 – 15" },
    { title: "Le modèle d'affaires", description: "Un abonnement par utilisateur, sans limite de processus.", range: "16" },
    { title: "L'annexe", description: "La méthode en détail, le cas au complet et l'état du produit.", range: "18 – 32" },
  ];

  const rowH = 0.74;
  const startY = 2.15;
  sections.forEach((section, i) => {
    const y = startY + i * rowH;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: MARGIN,
      y,
      w: 0.44,
      h: 0.44,
      rectRadius: 0.1,
      fill: { color: SURFACE },
      line: { color: LINE, width: 1 },
      shadow: cardShadow(),
    });
    slide.addText(String(i + 1).padStart(2, "0"), {
      x: MARGIN,
      y,
      w: 0.44,
      h: 0.44,
      fontFace: HEAD_FONT,
      fontSize: 12,
      bold: true,
      color: ACCENT,
      align: "center",
      valign: "middle",
    });
    slide.addText(section.title, {
      x: MARGIN + 0.68,
      y: y - 0.04,
      w: 5.2,
      h: 0.36,
      fontFace: HEAD_FONT,
      fontSize: 16,
      bold: true,
      color: INK,
      valign: "middle",
    });
    slide.addText(section.description, {
      x: MARGIN + 0.68,
      y: y + 0.29,
      w: 8.2,
      h: 0.36,
      fontFace: BODY_FONT,
      fontSize: 12,
      color: INK_SOFT,
      valign: "top",
    });
    slide.addText(section.range, {
      x: SLIDE_W - MARGIN - 1.3,
      y,
      w: 1.3,
      h: 0.44,
      fontFace: BODY_FONT,
      fontSize: 12,
      color: INK_FAINT,
      align: "right",
      valign: "middle",
    });
  });
}

// S3 · Le constat
{
  const slide = newSlide();
  addEyebrow(slide, "Le constat");
  addStatWithGrid(
    slide,
    "2 %",
    "seulement des entreprises sont réellement prêtes à automatiser un processus.",
    "2 organisations sur 100",
  );
}

// S3 · Pourquoi les projets échouent
{
  const slide = newSlide();
  addRailRows(slide, "Le problème", "Pourquoi tant de projets d'automatisation échouent", [
    {
      title: "L'ordre est inversé",
      description: "Le choix d'un outil précède l'évaluation du processus, jamais l'inverse.",
    },
    {
      title: "Aucune mesure objective",
      description: "L'aptitude réelle d'un processus n'est jamais évaluée avant d'engager un budget.",
    },
    {
      title: "Le retour reste une intuition",
      description: "Sans chiffre défendable, difficile de justifier la priorité devant une direction.",
    },
    {
      title: "La priorisation se fait à l'oreille",
      description: "Sans méthode commune, le processus le plus visible l'emporte, pas le plus prêt.",
    },
  ]);
}

// S4 · Pour qui
{
  const slide = newSlide();
  addEyebrow(slide, "Pour qui");
  addTitle(slide, "Deux publics, une même question");
  addBandedCards(slide, [
    {
      title: "Porteurs de processus",
      subtitle: "Ceux qui vivent le processus au quotidien",
      tone: "chartreuse",
      details: [
        "Savoir si le processus qu'on connaît le mieux mérite d'être automatisé",
        "Bâtir un dossier chiffré, défendable devant une direction",
        "Suivre l'exécution du projet dans le même outil",
        "Réévaluer le processus dès que le contexte change",
      ],
    },
    {
      title: "Consultants et intégrateurs",
      subtitle: "Ceux qui le diagnostiquent pour un client",
      tone: "ink",
      details: [
        "Qualifier un processus client en quelques minutes",
        "Livrer une méthodologie professionnelle et reproductible",
        "Se différencier avec un rapport clé en main",
        "Standardiser l'approche d'un mandat à l'autre",
      ],
    },
  ], { y: 2.5, h: 3.7 });
}

// S5 · La question
{
  const slide = newSlide();
  addEyebrow(slide, "La question", { x: SLIDE_W / 2 - 0.65 });
  addStatement(
    slide,
    [
      { text: "Ce processus est-il vraiment ", options: {} },
      { text: "prêt", options: { color: ACCENT } },
      { text: " à être automatisé ?", options: {} },
    ],
    "VerdiktNow existe pour y répondre avec des données, pas avec une intuition.",
  );
}

// S6 · Vue d'ensemble : comment les 5 étapes se relient
// Lecture en 3 paliers, de haut en bas : plus simple à suivre qu'une rangée unique
// avec des arcs croisés au-dessus et en dessous.
{
  const slide = newSlide();
  addEyebrow(slide, "La méthode");
  addTitle(slide, "Cinq étapes, pas cinq silos");

  const midX = SLIDE_W / 2;

  function node(label, num, { x, y, w, h, hero = false, subtitle = null }) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w,
      h,
      rectRadius: 0.12,
      fill: { color: hero ? CHARTREUSE : SURFACE },
      line: { color: LINE, width: 1 },
      shadow: cardShadow(),
    });
    const badgeSize = 0.36;
    // Un sous-titre pousse le numéro et le titre vers le haut de la carte pour
    // lui faire de la place — sans ça, "ajusté par le contexte" retombe sur
    // les connecteurs entre les rangées, l'espace le plus étroit du schéma.
    const badgeY = subtitle ? y + 0.15 : y + h / 2 - badgeSize / 2;
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.22,
      y: badgeY,
      w: badgeSize,
      h: badgeSize,
      fill: { color: hero ? DARK_INK : "FFFFFF" },
      line: { color: hero ? DARK_INK : ACCENT, width: 1.25 },
    });
    slide.addText(String(num), {
      x: x + 0.22,
      y: badgeY,
      w: badgeSize,
      h: badgeSize,
      fontFace: HEAD_FONT,
      fontSize: 13,
      bold: true,
      color: hero ? CHARTREUSE : ACCENT,
      align: "center",
      valign: "middle",
    });
    slide.addText(label, {
      x: x + 0.66,
      y: subtitle ? y + 0.11 : y,
      w: w - 0.86,
      h: subtitle ? 0.34 : h,
      fontFace: HEAD_FONT,
      fontSize: subtitle ? 14 : 15,
      bold: true,
      color: hero ? DARK_INK : "000000",
      align: "left",
      valign: "middle",
    });
    if (subtitle) {
      slide.addText(subtitle, {
        x: x + 0.66,
        y: y + 0.47,
        w: w - 0.86,
        h: 0.26,
        fontFace: BODY_FONT,
        fontSize: 9.5,
        color: hero ? DARK_INK : INK_FAINT,
        align: "left",
        valign: "top",
      });
    }
    return { cx: x + w / 2, top: y, bottom: y + h, left: x, right: x + w, midY: y + h / 2 };
  }

  function dot(x, y, color) {
    slide.addShape(pptx.ShapeType.ellipse, { x: x - 0.05, y: y - 0.05, w: 0.1, h: 0.1, fill: { color } });
  }

  function vArrow(x, yTop, yBottom, color = ACCENT) {
    slide.addShape(pptx.ShapeType.line, { x, y: yTop, w: 0, h: yBottom - yTop, line: { color, width: 1.5 } });
    dot(x, yBottom, color);
  }

  // Palier 1 : la chaîne principale, gauche à droite.
  const t1Y = 2.2;
  const t1H = 0.85;
  const t1W = 2.7;
  const t1Gap = 0.5;
  const t1TotalW = 3 * t1W + 2 * t1Gap;
  const t1X0 = midX - t1TotalW / 2;
  const contexte = node("Contexte", 1, { x: t1X0, y: t1Y, w: t1W, h: t1H });
  const diagnostic = node("Diagnostic", 2, {
    x: t1X0 + t1W + t1Gap,
    y: t1Y,
    w: t1W,
    h: t1H,
    subtitle: "ajusté par le contexte",
  });
  const roi = node("ROI", 3, {
    x: t1X0 + 2 * (t1W + t1Gap),
    y: t1Y,
    w: t1W,
    h: t1H,
    subtitle: "calcul indépendant",
  });
  [
    [contexte, diagnostic],
    [diagnostic, roi],
  ].forEach(([a, b]) => {
    slide.addShape(pptx.ShapeType.rightArrow, {
      x: a.right + 0.06,
      y: t1Y + t1H / 2 - 0.08,
      w: t1Gap - 0.12,
      h: 0.16,
      fill: { color: ACCENT },
    });
  });

  // Repère : ce que combine la priorisation, juste avant qu'elle n'apparaisse.
  const tagY = t1Y + t1H + 0.55;
  const mergeY = t1Y + t1H + 0.28;
  vArrow(diagnostic.cx, diagnostic.bottom, tagY - 0.05);
  // ROI rejoint la même colonne que Diagnostic en équerre, puis descend avec elle.
  slide.addShape(pptx.ShapeType.line, {
    x: roi.cx,
    y: roi.bottom,
    w: 0,
    h: mergeY - roi.bottom,
    line: { color: ACCENT, width: 1.5 },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: diagnostic.cx,
    y: mergeY,
    w: roi.cx - diagnostic.cx,
    h: 0,
    line: { color: ACCENT, width: 1.5 },
  });
  // Ce que chaque ligne transporte vers la pastille non numérotée. Le rapport
  // de chacune au contexte est déjà expliqué dans les cartes Diagnostic et
  // ROI ci-dessus — ces étiquettes n'ont qu'un seul travail : nommer la ligne.
  const mergeLabelY = diagnostic.bottom + (mergeY - diagnostic.bottom) / 2 - 0.1;
  slide.addText("aptitude", {
    x: diagnostic.cx - 1.1,
    y: mergeLabelY,
    w: 1.0,
    h: 0.2,
    fontFace: BODY_FONT,
    fontSize: 10.5,
    bold: true,
    color: ACCENT,
    align: "right",
    valign: "middle",
  });
  slide.addText("valeur", {
    x: roi.cx + 0.1,
    y: mergeLabelY,
    w: 1.0,
    h: 0.2,
    fontFace: BODY_FONT,
    fontSize: 10.5,
    bold: true,
    color: ACCENT,
    align: "left",
    valign: "middle",
  });
  const tagW = 3.0;
  const tagH = 0.4;
  const tagX = midX - tagW / 2;
  slide.addShape(pptx.ShapeType.roundRect, {
    x: tagX,
    y: tagY,
    w: tagW,
    h: tagH,
    rectRadius: 0.2,
    fill: { color: DARK_INK },
  });
  slide.addText("aptitude + valeur", {
    x: tagX,
    y: tagY,
    w: tagW,
    h: tagH,
    fontFace: HEAD_FONT,
    fontSize: 12.5,
    bold: true,
    color: CHARTREUSE,
    align: "center",
    valign: "middle",
  });

  // Palier 2 : priorisation, seule, au centre — elle reçoit les deux entrées d'en haut.
  const t2Y = tagY + tagH + 0.4;
  const t2H = 0.85;
  const t2W = 3.6;
  const priorisation = node("Priorisation", 4, { x: midX - t2W / 2, y: t2Y, w: t2W, h: t2H });
  vArrow(midX, tagY + tagH, t2Y);

  // Palier 3 : feuille de route, aboutissement du parcours.
  const t3Y = t2Y + t2H + 0.55;
  const t3H = 0.85;
  const t3W = 3.0;
  const feuilleDeRoute = node("Feuille de route", 5, { x: midX - t3W / 2, y: t3Y, w: t3W, h: t3H, hero: true });
  vArrow(midX, priorisation.bottom, t3Y);

  // Boucle : la feuille de route réévalue le contexte. Chemin en équerre sur la gauche,
  // séparé du reste du diagramme pour rester lisible.
  const loopX = t1X0 - 0.55;
  slide.addShape(pptx.ShapeType.line, {
    x: loopX,
    y: contexte.midY,
    w: contexte.left - loopX,
    h: 0,
    line: { color: CORAL_TINT, width: 1.5, endArrowType: "triangle" },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: loopX,
    y: contexte.midY,
    w: 0,
    h: feuilleDeRoute.midY - contexte.midY,
    line: { color: CORAL_TINT, width: 1.5 },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: loopX,
    y: feuilleDeRoute.midY,
    w: feuilleDeRoute.left - loopX,
    h: 0,
    line: { color: CORAL_TINT, width: 1.5 },
  });
  slide.addText("réévalue le contexte", {
    x: loopX,
    y: feuilleDeRoute.midY + 0.12,
    w: feuilleDeRoute.left - loopX,
    h: 0.3,
    fontFace: BODY_FONT,
    fontSize: 11,
    bold: true,
    color: CORAL_TINT,
    align: "center",
    valign: "middle",
  });
}

// S8 · Étape 2 : 6 leviers
{
  const slide = newSlide();
  addEyebrow(slide, "Étape 2 · Diagnostic");
  addTitle(slide, "Six leviers pondérés");
  addCards(
    slide,
    [
      { title: "Standardisation", description: "Le processus suit-il toujours les mêmes étapes ?" },
      { title: "Règles de décision", description: "Les décisions reposent-elles sur des critères clairs ?" },
      { title: "Données", description: "Les données nécessaires sont-elles fiables et accessibles ?" },
      { title: "Volume", description: "Le volume traité justifie-t-il l'investissement ?" },
      { title: "Faisabilité technique", description: "Les systèmes en place permettent-ils l'automatisation ?" },
      { title: "Risque", description: "Quelles sont les conséquences d'une erreur non détectée ?" },
    ],
    { y: 2.2, h: 2.05, columns: 3 },
  );
}

// S10 · La règle du contexte
{
  const slide = newSlide();
  addEyebrow(slide, "La règle", { x: SLIDE_W / 2 - 0.5 });
  addStatement(
    slide,
    [
      { text: "Le contexte peut corriger un score vers le ", options: {} },
      { text: "bas.", options: { color: ACCENT } },
      { text: " Jamais vers le haut.", options: {} },
    ],
    "Aucun mécanisme ne peut flatter artificiellement un résultat.",
  );
}

// S18 · Cas illustratif : diagnostic (vraie capture d'écran, score réellement calculé)
{
  const slide = newSlide();
  addEyebrow(slide, "Cas illustratif · Diagnostic");
  addTitle(slide, [
    { text: "Un score de ", options: {} },
    { text: "76 sur 100", options: { color: ACCENT } },
  ]);
  addScreenshot(slide, "04-aptitude-score.jpg", 2880, 820);
}

// S20 · Cas illustratif : ROI (vraie capture d'écran, calculée en direct)
{
  const slide = newSlide();
  addEyebrow(slide, "Cas illustratif · ROI");
  addTitle(slide, [
    { text: "54 696 $ ", options: { color: ACCENT } },
    { text: "d'économies nettes par année", options: {} },
  ]);
  addScreenshot(slide, "08-roi-ajuste.jpg", 2880, 840);
}

// S21 · Cas illustratif : priorisation (vraie capture d'écran)
{
  const slide = newSlide();
  addEyebrow(slide, "Cas illustratif · Priorisation");
  addTitle(slide, "Pourquoi ce processus est passé en premier");
  addScreenshot(slide, "10-priorisation.jpg", 2880, 1430);
}

// S22 · Cas illustratif : feuille de route (vraie capture d'écran, 24 étapes générées)
{
  const slide = newSlide();
  addEyebrow(slide, "Cas illustratif · Feuille de route");
  addTitle(slide, "Le plan généré pour ce processus, en 24 étapes");
  addScreenshot(slide, "11-feuille-de-route.jpg", 2880, 635);
}

// S23 · Cas illustratif : feuille de route, le tableau de suivi (vraie capture d'écran)
{
  const slide = newSlide();
  addEyebrow(slide, "Cas illustratif · Feuille de route");
  addTitle(slide, "Un tableau de suivi, pas juste un aperçu");
  addScreenshot(slide, "12-feuille-de-route-tableau.jpg", 2880, 870);
}

// S24 · Cas illustratif : résultat
{
  const slide = newSlide();
  addEyebrow(slide, "Cas illustratif · Résultat");
  addTitle(slide, "Un résultat qui se mesure");

  const boxW = 3.0;
  const boxH = 1.5;
  const gapX = 0.7;
  const startX = SLIDE_W / 2 - boxW - gapX / 2;
  const boxY = 2.5;

  slide.addShape(pptx.ShapeType.roundRect, {
    x: startX,
    y: boxY,
    w: boxW,
    h: boxH,
    rectRadius: 0.14,
    fill: { color: SURFACE },
    line: { color: LINE, width: 1 },
    shadow: cardShadow(),
  });
  slide.addText("AVANT", {
    x: startX,
    y: boxY + 0.2,
    w: boxW,
    h: 0.3,
    fontFace: HEAD_FONT,
    fontSize: 11,
    bold: true,
    color: INK_FAINT,
    align: "center",
    charSpacing: 1,
  });
  slide.addText("Plusieurs jours", {
    x: startX,
    y: boxY + 0.55,
    w: boxW,
    h: 0.7,
    fontFace: HEAD_FONT,
    fontSize: 20,
    bold: true,
    color: INK,
    align: "center",
  });

  slide.addShape(pptx.ShapeType.rightArrow, {
    x: startX + boxW + 0.1,
    y: boxY + boxH / 2 - 0.2,
    w: gapX - 0.2,
    h: 0.4,
    fill: { color: CHARTREUSE },
  });

  const rightX = startX + boxW + gapX;
  slide.addShape(pptx.ShapeType.roundRect, {
    x: rightX,
    y: boxY,
    w: boxW,
    h: boxH,
    rectRadius: 0.14,
    fill: { color: CHARTREUSE },
    shadow: cardShadow(),
  });
  slide.addText("APRÈS", {
    x: rightX,
    y: boxY + 0.2,
    w: boxW,
    h: 0.3,
    fontFace: HEAD_FONT,
    fontSize: 11,
    bold: true,
    color: INK,
    align: "center",
    charSpacing: 1,
  });
  slide.addText("Quelques heures", {
    x: rightX,
    y: boxY + 0.55,
    w: boxW,
    h: 0.7,
    fontFace: HEAD_FONT,
    fontSize: 20,
    bold: true,
    color: INK,
    align: "center",
  });

  slide.addText("Délai de traitement complet d'une facture", {
    x: SLIDE_W / 2 - 3,
    y: boxY + boxH + 0.25,
    w: 6,
    h: 0.4,
    fontFace: BODY_FONT,
    fontSize: 13,
    color: INK_SOFT,
    align: "center",
  });

  addPills(slide, ["76 / 100 aptitude", "54 696 $ / an", "6,6 mois de retour"], { y: boxY + boxH + 0.85, fontSize: 15 });
}

// S29 · Modèle d'affaires
{
  const slide = newSlide();
  addEyebrow(slide, "Modèle d'affaires");
  addTitle(slide, "Un abonnement par utilisateur, simple à comprendre");

  const tiers = [
    { name: "Essentiel", price: "50 $", unit: "CAD / mois / utilisateur", note: "Pour démarrer, 1 à 5 utilisateurs" },
    { name: "Croissance", price: "40 $", unit: "CAD / mois / utilisateur", note: "Pour une équipe active, 6 à 20 utilisateurs", hero: true },
    { name: "Entreprise", price: "Sur mesure", unit: "", note: "Prix négocié, support prioritaire" },
  ];
  const gap = 0.4;
  const cardW = (SLIDE_W - MARGIN * 2 - gap * 2) / 3;
  const cardY = 2.4;
  const cardH = 3.1;
  tiers.forEach((tier, i) => {
    const x = MARGIN + i * (cardW + gap);
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y: cardY,
      w: cardW,
      h: cardH,
      rectRadius: 0.12,
      fill: { color: tier.hero ? DARK_INK : SURFACE },
      line: { color: LINE, width: 1 },
      shadow: cardShadow(),
    });
    slide.addText(tier.name, {
      x: x + 0.3,
      y: cardY + 0.3,
      w: cardW - 0.6,
      h: 0.4,
      fontFace: HEAD_FONT,
      fontSize: 15,
      bold: true,
      color: tier.hero ? CHARTREUSE : ACCENT,
    });
    slide.addText(tier.price, {
      x: x + 0.3,
      y: cardY + 0.8,
      w: cardW - 0.6,
      h: 0.7,
      fontFace: HEAD_FONT,
      fontSize: 30,
      bold: true,
      color: tier.hero ? "FFFFFF" : "000000",
    });
    if (tier.unit) {
      slide.addText(tier.unit, {
        x: x + 0.3,
        y: cardY + 1.48,
        w: cardW - 0.6,
        h: 0.5,
        fontFace: BODY_FONT,
        fontSize: 11.5,
        color: tier.hero ? "B9C2BF" : INK_FAINT,
        lineSpacingMultiple: 1.2,
      });
    }
    slide.addShape(pptx.ShapeType.line, {
      x: x + 0.3,
      y: cardY + 2.15,
      w: cardW - 0.6,
      h: 0,
      line: { color: tier.hero ? DARK_LINE : LINE, width: 1 },
    });
    slide.addText(tier.note, {
      x: x + 0.3,
      y: cardY + 2.3,
      w: cardW - 0.6,
      h: 0.7,
      fontFace: BODY_FONT,
      fontSize: 12.5,
      color: tier.hero ? "B9C2BF" : INK_SOFT,
      lineSpacingMultiple: 1.25,
    });
  });
  slide.addText(
    "Facturation annuelle : deux mois offerts. Siège Spectateur en lecture seule à 20 $ CAD / mois pour étendre la visibilité sans ajouter d'utilisateurs actifs.",
    {
      x: MARGIN,
      y: cardY + cardH + 0.3,
      w: SLIDE_W - MARGIN * 2,
      h: 0.5,
      fontFace: BODY_FONT,
      fontSize: 12.5,
      color: INK_FAINT,
      align: "center",
    },
  );
}

// S32 · Appel à l'action
{
  const slide = newSlide({ footer: false, dark: true });

  // Même motif qu'à l'ouverture : referme la présentation en boucle visuelle.
  slide.addShape(pptx.ShapeType.ellipse, {
    x: SLIDE_W / 2 - 6.4,
    y: 2.0,
    w: 12.8,
    h: 12.8,
    fill: { type: "none" },
    line: { color: CHARTREUSE, width: 1.25, transparency: 78 },
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: SLIDE_W / 2 - 5.2,
    y: 0.8,
    w: 10.4,
    h: 10.4,
    fill: { type: "none" },
    line: { color: CHARTREUSE, width: 1, transparency: 88 },
  });

  slide.addText(
    [
      { text: "Prêt à savoir si votre processus est ", options: { color: "FFFFFF" } },
      // Espace insécable avant le « ? » : sans elle le point d'interrogation
      // se retrouvait seul sur sa propre ligne.
      { text: "prêt ?", options: { color: CHARTREUSE } },
    ],
    {
      x: 1.0,
      y: 2.15,
      w: SLIDE_W - 2.0,
      h: 1.7,
      fontFace: HEAD_FONT,
      fontSize: 42,
      bold: true,
      align: "center",
      valign: "middle",
      lineSpacingMultiple: 1.1,
    },
  );
  slide.addShape(pptx.ShapeType.roundRect, {
    x: SLIDE_W / 2 - 2.3,
    y: 3.85,
    w: 4.6,
    h: 0.95,
    rectRadius: 0.475,
    fill: { color: CHARTREUSE },
    shadow: cardShadow(),
  });
  slide.addText("verdiktnow.com", {
    x: SLIDE_W / 2 - 2.3,
    y: 3.85,
    w: 4.6,
    h: 0.95,
    fontFace: HEAD_FONT,
    fontSize: 23,
    bold: true,
    color: DARK_INK,
    align: "center",
    valign: "middle",
  });
  slide.addText("Réservez une démo ou lancez votre premier diagnostic.", {
    x: 2.3,
    y: 5.1,
    w: SLIDE_W - 4.6,
    h: 0.5,
    fontFace: BODY_FONT,
    fontSize: 15,
    color: "B9C2BF",
    align: "center",
  });

  const proof = ["76 / 100 aptitude", "54 696 $ / an", "6,6 mois de retour"];
  const pillGap = 0.3;
  const pillWidths = proof.map((t) => t.length * 0.1 + 0.5);
  const totalProofW = pillWidths.reduce((a, b) => a + b, 0) + pillGap * (proof.length - 1);
  let px = (SLIDE_W - totalProofW) / 2;
  const py = 6.0;
  proof.forEach((label, i) => {
    const w = pillWidths[i];
    slide.addShape(pptx.ShapeType.roundRect, {
      x: px,
      y: py,
      w,
      h: 0.46,
      rectRadius: 0.23,
      fill: { color: DARK_PANEL },
      line: { color: DARK_LINE, width: 1 },
    });
    slide.addText(label, {
      x: px,
      y: py,
      w,
      h: 0.46,
      fontFace: HEAD_FONT,
      fontSize: 11.5,
      bold: true,
      color: CHARTREUSE,
      align: "center",
      valign: "middle",
    });
    px += w + pillGap;
  });

  slide.addText(
    [
      { text: "Verdikt", options: { color: "FFFFFF", bold: true } },
      { text: "Now", options: { color: CHARTREUSE, bold: true } },
    ],
    { x: SLIDE_W / 2 - 2, y: 6.85, w: 4, h: 0.4, fontFace: HEAD_FONT, fontSize: 13, align: "center" },
  );
}

// Séparateur · Annexe
// Ferme le récit présentable et ouvre la matière de référence : le noyau se
// présente à l'oral, tout ce qui suit répond aux questions ou se lit à tête
// reposée.
{
  const slide = newSlide();
  addEyebrow(slide, "Annexe");
  addTitle(slide, "Pour aller plus loin");
  slide.addText(
    "Le récit s'arrête ici. Les pages suivantes détaillent la méthode, le cas illustratif au complet et l'état du produit, pour les questions ou pour une lecture à tête reposée.",
    {
      x: MARGIN,
      y: 2.2,
      w: 7.4,
      h: 0.9,
      fontFace: BODY_FONT,
      fontSize: 15,
      color: INK_SOFT,
      valign: "top",
      lineSpacingMultiple: 1.35,
    },
  );

  const groups = [
    { title: "La méthode en détail", items: ["Étape 1 · Contexte", "Comment le score est calculé", "Étape 3 · ROI", "Étape 4 · Priorisation", "Étape 5 · Feuille de route", "Le rapport PDF exportable"] },
    { title: "Le cas illustratif au complet", items: ["Les 15 étapes du processus", "Pourquoi ce processus est complexe", "Le contexte documenté", "Le détail par levier"] },
    { title: "VerdiktNow aujourd'hui", items: ["Pourquoi pas un chiffrier", "L'opportunité", "Où en est le produit", "La suite"] },
  ];
  const colW = (SLIDE_W - MARGIN * 2 - 0.6) / 3;
  groups.forEach((g, i) => {
    const x = MARGIN + i * (colW + 0.3);
    slide.addText(g.title, {
      x,
      y: 3.45,
      w: colW,
      h: 0.34,
      fontFace: HEAD_FONT,
      fontSize: 13,
      bold: true,
      color: "000000",
      valign: "top",
    });
    slide.addShape(pptx.ShapeType.line, {
      x,
      y: 3.88,
      w: colW - 0.2,
      h: 0,
      line: { color: LINE, width: 1 },
    });
    g.items.forEach((item, j) => {
      slide.addText(item, {
        x,
        y: 4.02 + j * 0.34,
        w: colW - 0.2,
        h: 0.32,
        fontFace: BODY_FONT,
        fontSize: 11.5,
        color: INK_SOFT,
        valign: "top",
      });
    });
  });
}

// S7 · Étape 1 : Contexte
{
  const slide = newSlide();
  addEyebrow(slide, "Étape 1 · Contexte");
  addTitle(slide, "Comprendre le processus avant de le noter", { fontSize: 26 });
  addCards(
    slide,
    [
      {
        title: "Porteur de projet",
        details: [
          "Qui connaît le processus de bout en bout",
          "Qui valide les décisions et les exceptions",
          "Qui devient responsable une fois automatisé",
        ],
      },
      {
        title: "Systèmes impliqués",
        details: ["Les outils et plateformes traversés", "Où vivent les données sources", "Les intégrations déjà en place"],
      },
      {
        title: "Contraintes et irritants",
        details: [
          "Exigences réglementaires ou de conformité",
          "Ce qui ralentit déjà l'équipe aujourd'hui",
          "Les exceptions gérées manuellement",
        ],
      },
      {
        title: "Volume et fréquence",
        details: ["Combien de fois le processus s'exécute", "À quelle cadence il revient", "Combien de personnes y consacrent du temps"],
      },
    ],
    { y: 2.15, h: 2.05, columns: 2 },
  );
}

// S9 · Comment le score est calculé
{
  const slide = newSlide();
  addRailRows(slide, "Transparence", "Comment le score est calculé", [
    {
      title: "Chaque énoncé pèse dans son levier",
      description: "Dans le diagnostic, chaque affirmation contribue à son levier avec un poids explicite.",
    },
    {
      title: "Chaque levier pèse dans le score global",
      description: "Les six leviers se combinent selon une pondération transparente, jamais une boîte noire.",
    },
    {
      title: "Les pondérations sont ajustables",
      description: "Adaptez-les à ce qui compte vraiment pour votre organisation, le score se recalcule en direct.",
    },
  ]);
}

// S11 · Étape 3 : ROI
{
  const slide = newSlide();
  addEyebrow(slide, "Étape 3 · ROI");
  addTitle(slide, "Chiffrer avant d'investir");
  addPills(slide, ["Temps investi", "Taux horaire", "Volume traité"], { y: 2.7 });
  slide.addShape(pptx.ShapeType.rightArrow, {
    x: SLIDE_W / 2 - 0.25,
    y: 3.65,
    w: 0.5,
    h: 0.4,
    fill: { color: CHARTREUSE },
    rotate: 90,
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: SLIDE_W / 2 - 1.6,
    y: 4.3,
    w: 3.2,
    h: 0.75,
    rectRadius: 0.37,
    fill: { color: CHARTREUSE },
  });
  slide.addText("ROI chiffré", {
    x: SLIDE_W / 2 - 1.6,
    y: 4.3,
    w: 3.2,
    h: 0.75,
    fontFace: HEAD_FONT,
    fontSize: 19,
    bold: true,
    color: INK,
    align: "center",
    valign: "middle",
  });
  slide.addText("Un calcul basé sur les données réelles de votre organisation, pas une moyenne sectorielle.", {
    x: 2.3,
    y: 5.4,
    w: SLIDE_W - 4.6,
    h: 0.6,
    fontFace: BODY_FONT,
    fontSize: 14,
    color: INK_SOFT,
    align: "center",
  });
}

// S12 · Étape 4 : Priorisation
{
  const slide = newSlide();
  addEyebrow(slide, "Étape 4 · Priorisation");
  addTitle(slide, "Aptitude et valeur, sur un même graphique", { w: 5.8 });
  addBullets(
    slide,
    [
      "Chaque processus diagnostiqué se positionne automatiquement.",
      "Les meilleurs candidats ressortent d'un coup d'œil.",
      "Les quatre quadrants guident l'action à prendre.",
      "Prioriser devient une lecture de données, pas une opinion.",
    ],
    { w: 5.4, y: 2.5, fontSize: 14.5 },
  );
  addMatrix(slide, []);
}

// S13 · Étape 5 : Feuille de route
{
  const slide = newSlide();
  addEyebrow(slide, "Étape 5 · Feuille de route");
  addTitle(slide, "Un plan d'action, pas juste un score");
  addChecklist(slide, [
    { label: "Confirmer le porteur de projet", done: true },
    { label: "Valider le périmètre", done: true },
    { label: "Documenter les exceptions", done: false },
    { label: "Désigner l'opérateur", done: false },
    { label: "Aligner l'échéancier avec les parties prenantes", done: false },
    { label: "Suivre les gains", done: false },
    { label: "Partager le rapport avec la direction", done: false },
  ]);
}

// S14 · Le rapport PDF
{
  const slide = newSlide();
  addEyebrow(slide, "Le livrable");
  addTitle(slide, "Un rapport PDF exportable", { w: 5.6 });
  addBullets(
    slide,
    [
      "Contexte, diagnostic, ROI, priorisation et feuille de route réunis.",
      "Prêt à être partagé avec une direction ou un comité.",
      "Le même document, du premier diagnostic jusqu'à l'exécution.",
      "Un format professionnel, cohérent d'un processus à l'autre.",
    ],
    { w: 5.4, y: 2.5, fontSize: 15 },
  );

  const cardX = SLIDE_W - 6.1;
  const cardY = 1.9;
  const cardW = 5.4;
  const cardH = 4.6;
  slide.addShape(pptx.ShapeType.roundRect, {
    x: cardX,
    y: cardY,
    w: cardW,
    h: cardH,
    rectRadius: 0.12,
    fill: { color: SURFACE },
    line: { color: LINE, width: 1 },
    shadow: cardShadow(),
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: cardX + 0.35,
    y: cardY + 0.35,
    w: 0.8,
    h: 0.34,
    rectRadius: 0.17,
    fill: { color: CHARTREUSE },
  });
  slide.addText("PDF", {
    x: cardX + 0.35,
    y: cardY + 0.35,
    w: 0.8,
    h: 0.34,
    fontFace: HEAD_FONT,
    fontSize: 12,
    bold: true,
    color: INK,
    align: "center",
    valign: "middle",
  });
  slide.addText("Rapport VerdiktNow", {
    x: cardX + 1.3,
    y: cardY + 0.35,
    w: cardW - 1.6,
    h: 0.34,
    fontFace: HEAD_FONT,
    fontSize: 15,
    bold: true,
    color: INK,
    valign: "middle",
  });
  slide.addShape(pptx.ShapeType.line, {
    x: cardX + 0.35,
    y: cardY + 0.95,
    w: cardW - 0.7,
    h: 0,
    line: { color: LINE, width: 1 },
  });

  const sections = [
    "Contexte du processus",
    "Diagnostic et score d'aptitude",
    "Calculateur de ROI",
    "Matrice de priorisation",
    "Feuille de route",
  ];
  sections.forEach((label, i) => {
    const ry = cardY + 1.25 + i * 0.62;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: cardX + 0.35,
      y: ry,
      w: 0.28,
      h: 0.28,
      rectRadius: 0.06,
      fill: { color: CHARTREUSE },
    });
    slide.addText("✓", {
      x: cardX + 0.35,
      y: ry - 0.02,
      w: 0.28,
      h: 0.28,
      fontFace: BODY_FONT,
      fontSize: 12,
      bold: true,
      color: INK,
      align: "center",
      valign: "middle",
    });
    slide.addText(label, {
      x: cardX + 0.78,
      y: ry - 0.04,
      w: cardW - 1.1,
      h: 0.36,
      fontFace: BODY_FONT,
      fontSize: 13.5,
      color: INK,
      valign: "middle",
    });
  });
}

// S15 · Cas illustratif : présentation du processus (15 étapes)
{
  const slide = newSlide();
  addEyebrow(slide, "Cas illustratif");
  addTitle(slide, "Un processus de traitement de factures, en 15 étapes");
  addSteps(
    slide,
    [
      "Réception de la facture",
      "Tri et classification",
      "Vérification de conformité du format",
      "Rapprochement avec le bon de commande",
      "Rapprochement avec le bon de réception",
      "Détection des écarts",
      "Escalade des écarts",
      "Imputation comptable",
      "Vérification des taxes",
      "Approbation niveau 1",
      "Approbation niveau 2",
      "Saisie dans le système comptable",
      "Programmation du paiement",
      "Rapprochement bancaire",
      "Archivage et conformité",
    ],
    { y: 2.15, columns: 2, rowH: 0.5, fontSize: 13 },
  );
}

// S16 · Cas illustratif : pourquoi ce processus est complexe
{
  const slide = newSlide();
  addEyebrow(slide, "Cas illustratif");
  addTitle(slide, "Pourquoi ce processus est complexe");
  addCards(
    slide,
    [
      { title: "Quatre systèmes", description: "Courriel, portail fournisseur, ERP et système bancaire, traversés à chaque facture." },
      { title: "Deux paliers d'approbation", description: "Un seuil monétaire qui détermine si une deuxième signature est requise." },
      { title: "Multidevises et taxes", description: "TPS, TVQ et retenues à vérifier selon le fournisseur et sa provenance." },
      { title: "Volume élevé", description: "Environ 600 factures par mois, en continu, sans pic saisonnier notable." },
    ],
    { y: 2.15, h: 2.05, columns: 2 },
  );
}

// S17 · Cas illustratif : contexte (vraie capture d'écran de l'outil)
{
  const slide = newSlide();
  addEyebrow(slide, "Cas illustratif · Contexte");
  addTitle(slide, "Ce qui a été documenté, dans l'outil");
  addScreenshot(slide, "02-contexte-milieu.jpg", 2880, 1800);
}

// S19 · Cas illustratif : diagnostic détaillé (vraie capture d'écran)
{
  const slide = newSlide();
  addEyebrow(slide, "Cas illustratif · Diagnostic");
  addTitle(slide, "Détail par levier, pondérations ajustables");
  addScreenshot(slide, "06-aptitude-leviers.jpg", 2880, 1020);
}

// S25 · Pourquoi pas un chiffrier
{
  const slide = newSlide();
  addEyebrow(slide, "Pourquoi pas...");
  addTitle(slide, "Un chiffrier ou l'instinct ne suffisent plus");
  addCompare(slide, {
    leftLabel: "Approche improvisée",
    leftItems: [
      "Pas de méthode reproductible d'un processus à l'autre.",
      "Aucune traçabilité du raisonnement derrière une décision.",
      "Devient obsolète dès que le contexte change.",
    ],
    rightLabel: "VerdiktNow",
    rightItems: [
      "Méthodologie pondérée et cohérente, appliquée à chaque processus.",
      "Chaque score est justifiable, énoncé par énoncé.",
      "Reste à jour au fil de l'avancement du projet.",
    ],
  });
}

// Les deux anciennes diapos « Cas d'usage » (une par public) répétaient
// presque mot pour mot les cartes de la diapo « Pour qui » : leurs seules
// puces inédites y ont été fusionnées plutôt que gardées sur deux diapos
// de listes à puces à moitié vides.

// S26 · L'opportunité
{
  const slide = newSlide();
  addRailRows(
    slide,
    "L'opportunité",
    "Un marché mal desservi, une discipline qui manque",
    [
      {
        title: "L'automatisation est déjà à l'agenda",
        description: "RPA, IA, workflows : presque toute organisation moyenne à grande évalue aujourd'hui un projet d'automatisation.",
      },
      {
        title: "Personne n'outille la décision d'y aller",
        description: "Le marché vend des plateformes d'automatisation, pas le diagnostic qui dit lesquels de vos processus les méritent.",
      },
      {
        title: "Un besoin structurel, pas une mode",
        description: "La même question se pose avant chaque nouveau processus : VerdiktNow y répond une fois, de façon reproductible.",
      },
    ],
    { highlight: 1 },
  );
}

// S30 · Où en est VerdiktNow
{
  const slide = newSlide();
  addEyebrow(slide, "Où en est VerdiktNow");
  addTitle(slide, "Le produit est prêt. Le marché reste à conquérir.");
  addChecklist(slide, [
    { label: "Diagnostic pondéré sur 6 leviers, fonctionnel", done: true },
    { label: "Calculateur de ROI en temps réel, fonctionnel", done: true },
    { label: "Matrice de priorisation, fonctionnelle", done: true },
    { label: "Feuille de route et gestion de projet, fonctionnelles", done: true },
    { label: "Rapport PDF exportable, fonctionnel", done: true },
    { label: "Produit en phase pré-lancement, prêt pour les premiers clients pilotes", done: false },
  ]);
}

// S31 · La suite
{
  const slide = newSlide();
  addEyebrow(slide, "La suite");
  addTitle(slide, "Lancer, apprendre, itérer");
  addBullets(slide, [
    "Recruter les premiers clients pilotes pour valider le produit en conditions réelles.",
    "Affiner la méthodologie de diagnostic à partir de cas réels.",
    "Étendre la portée : davantage de leviers sectoriels, davantage d'intégrations.",
    "La feuille de route s'ajuste à mesure que de nouveaux processus et secteurs sont diagnostiqués.",
  ]);
}

mkdirSync(OUT_DIR, { recursive: true });
await pptx.writeFile({ fileName: OUT_FILE });
console.log(`OK: ${OUT_FILE} · ${pageNum} diapositives`);
