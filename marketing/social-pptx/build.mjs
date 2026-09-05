import PptxGenJS from "pptxgenjs";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(__dirname, "manifest.json"), "utf-8"));

const DOCUMENTS_DIR = join(os.homedir(), "OneDrive", "Documents");

const INK = "091315";
const CHARTREUSE = "D7FF53";
const WHITE = "FFFFFF";
const MUTED = "9BA6A3";

const SLIDE_W = 13.33;
const SLIDE_H = 7.5;
const MARGIN = 0.55;
const GAP = 0.4;

for (const [category, cfg] of Object.entries(manifest)) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "VERDIKT_WIDE", width: SLIDE_W, height: SLIDE_H });
  pptx.layout = "VERDIKT_WIDE";
  pptx.author = "VerdiktNow";
  pptx.title = cfg.deckTitle;

  // "1:1" (carré, LinkedIn) ou "4:5" (portrait, Instagram) — dicte la largeur de l'image
  // pour une hauteur fixe, et donc où commence la colonne de texte à sa droite.
  const [aw, ah] = (cfg.imageAspect || "1:1").split(":").map(Number);
  const imgH = 5.6;
  const imgW = imgH * (aw / ah);
  const textX = MARGIN + imgW + GAP;
  const textW = SLIDE_W - textX - MARGIN;

  for (const post of cfg.posts) {
    const slide = pptx.addSlide();
    slide.background = { color: INK };

    const imagePath = join(__dirname, post.image);
    if (!existsSync(imagePath)) {
      throw new Error(`Image introuvable pour ${post.id}: ${imagePath}`);
    }

    slide.addImage({
      path: imagePath,
      x: MARGIN,
      y: (SLIDE_H - imgH) / 2,
      w: imgW,
      h: imgH,
    });

    slide.addText(post.label.toUpperCase(), {
      x: textX,
      y: 0.55,
      w: textW,
      h: 0.4,
      fontFace: "Segoe UI Semibold",
      fontSize: 12,
      bold: true,
      color: CHARTREUSE,
      charSpacing: 2,
      align: "left",
    });

    slide.addText(post.text, {
      x: textX,
      y: 1.05,
      w: textW,
      h: 6.0,
      fontFace: "Segoe UI",
      fontSize: 13,
      color: WHITE,
      align: "left",
      valign: "top",
      lineSpacingMultiple: 1.3,
      paraSpaceAfter: 8,
      autoFit: true,
    });

    slide.addText("VerdiktNow", {
      x: textX,
      y: 7.1,
      w: textW,
      h: 0.3,
      fontFace: "Segoe UI",
      fontSize: 10,
      color: MUTED,
      align: "left",
    });
  }

  const outDir = join(DOCUMENTS_DIR, cfg.outputFolder);
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, cfg.outputFile);
  await pptx.writeFile({ fileName: outPath });
  console.log(`OK (${category}): ${outPath} — ${cfg.posts.length} diapositive(s)`);
}
