import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const IN_DIR = join(__dirname, "out");
const OUT_DIR = join(__dirname, "cropped");
mkdirSync(OUT_DIR, { recursive: true });

// { file: [top, bottom] } offsets in source pixels (2880x1800 sauf mention contraire)
const jobs = [
  { file: "02-contexte-milieu.png", top: 0, bottom: 1800 },
  { file: "04-aptitude-score.png", top: 980, bottom: 1800 },
  { file: "06-aptitude-leviers.png", top: 130, bottom: 1150 },
  { file: "08-roi-ajuste.png", top: 340, bottom: 1180 },
  { file: "10-priorisation.png", top: 370, bottom: 1800 },
  { file: "11-feuille-de-route.png", top: 545, bottom: 1180 },
  { file: "12-feuille-de-route-tableau.png", top: 580, bottom: 1450 },
];

for (const { file, top, bottom } of jobs) {
  const src = join(IN_DIR, file);
  const dstName = file.replace(/\.png$/, ".jpg");
  const dst = join(OUT_DIR, dstName);
  const img = sharp(src);
  const meta = await img.metadata();
  const height = Math.min(bottom, meta.height) - top;
  // JPEG plutôt que PNG : deux des captures PNG précédentes s'affichaient vides dans
  // PowerPoint malgré des métadonnées normales (bug de décodage propre à ces fichiers,
  // confirmé par un test isolé) ; le JPEG évite ce risque et est amplement suffisant
  // pour des captures d'interface.
  await img
    .extract({ left: 0, top, width: meta.width, height })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
    .toFile(dst);
  console.log(`cropped ${dstName}: ${meta.width}x${height}`);
}
