import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "out");
mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await context.newPage();
page.setDefaultTimeout(15000);

async function shot(name, opts = {}) {
  await page.screenshot({ path: join(OUT_DIR, name), ...opts });
  console.log("captured", name);
}

await page.goto("http://localhost:3000/fr/outil", { waitUntil: "networkidle" });

// --- Contexte ---
await page.locator("input").first().fill("Traitement des factures fournisseurs");

const selects = page.locator("select");
await selects.nth(0).selectOption("finance");
await selects.nth(1).selectOption("stable");

await page.getByRole("button", { name: "Piste d'audit légale requise" }).click();

await page.getByPlaceholder("Ex. Marie Tremblay").fill("Isabelle Roy");
await page.getByPlaceholder("Ex. Directrice des opérations").fill("Directrice des finances");
await page.getByPlaceholder("Ex. pilote d'ici 3 mois, déploiement T3 2026…").fill(
  "Pilote d'ici 3 mois, déploiement complet d'ici 6 mois",
);

await page.getByPlaceholder("Ce que ce processus doit accomplir…").fill(
  "Valider et payer les factures fournisseurs de façon fiable, en réduisant les délais et les erreurs de saisie",
);
await page.getByPlaceholder("Ce que le processus livre une fois terminé…").fill(
  "Une facture validée, imputée et payée dans le système comptable, avec une piste d'audit complète",
);
await page.getByPlaceholder("Ex. réception, validation, calcul, approbation, paiement…").fill(
  "Réception, tri et classification, vérification de conformité, rapprochement bon de commande, rapprochement bon de réception, détection des écarts, escalade, imputation comptable, vérification des taxes, approbation niveau 1, approbation niveau 2, saisie dans l'ERP, programmation du paiement, rapprochement bancaire, archivage",
);
await page.getByPlaceholder("D'où viennent les données ou la demande qui déclenchent ce processus…").fill(
  "Réception d'une facture par courriel ou déposée sur le portail fournisseur",
);
await page.getByPlaceholder("Qui ou quoi utilise le résultat de ce processus en aval…").fill(
  "L'équipe de trésorerie, les fournisseurs en attente de paiement, et l'audit de fin d'année",
);
await page.getByPlaceholder("Qui fait quoi dans le processus…").fill(
  "Commis comptable (saisie et rapprochement), superviseur (approbation niveau 1), directrice des finances (approbation niveau 2 et porteure de projet)",
);
await page.getByPlaceholder("Ex. courriel, Excel, système X, portail Y…").fill(
  "Courriel, portail fournisseur, ERP, système bancaire",
);
await page.getByPlaceholder("Ce qui ralentit, coûte du temps ou génère des erreurs…").fill(
  "Retards de paiement récurrents, erreurs de saisie découvertes des semaines plus tard, équipe qui passe plus de temps à chasser des validations qu'à faire de la finance",
);
await page.getByPlaceholder("Les variantes qui sortent du cas standard…").fill(
  "Factures en devise étrangère, écarts entre le bon de commande et la facture, fournisseurs sans bon de commande",
);
await page.getByPlaceholder("Accès, chiffrement, authentification, données sensibles à protéger…").fill(
  "Accès restreint aux données bancaires et aux coordonnées de paiement des fournisseurs",
);
await page.getByPlaceholder("Règles internes à respecter, hors obligations légales…").fill(
  "Deux paliers d'approbation obligatoires selon un seuil monétaire, TPS et TVQ à valider sur chaque facture",
);
await page.getByPlaceholder("Oui/non, et dans quel contexte…").fill(
  "Non, aucune tentative d'automatisation à ce jour, le processus est entièrement manuel",
);

await page.evaluate(() => window.scrollTo(0, 0));
await shot("01-contexte-haut.png");

await page.getByText("INTERVENANTS ET SYSTÈMES").scrollIntoViewIfNeeded();
await shot("02-contexte-milieu.png");

// --- Aptitude (diagnostic) : découverte de la structure ---
await page.getByRole("button", { name: "Aptitude", exact: true }).click();
await page.waitForTimeout(1500);
await page.evaluate(() => window.scrollTo(0, 0));
await shot("03-aptitude-decouverte.png");

const leverRatings = [
  ["Standard.", "3"],
  ["Règles", "3"],
  ["Données", "3"],
  ["Volume", "4"],
  ["Techno.", "3"],
  ["Risque", "2"],
];

for (const [chip, rating] of leverRatings) {
  await page.getByRole("button", { name: chip, exact: true }).click();
  await page.waitForTimeout(400);
  const buttons = await page.getByRole("button", { name: rating, exact: true }).all();
  for (const btn of buttons) {
    await btn.click();
    await page.waitForTimeout(80);
  }
  console.log(`levier ${chip}: ${buttons.length} énoncés notés à ${rating}`);
}

await page.evaluate(() => window.scrollTo(0, 0));
await shot("04-aptitude-score.png");

// Capture rapprochée du cadran de score (pour usage isolé dans le PPT)
const gaugeLabel = page.getByText("APTITUDE À L'AUTOMATISATION");
let node = gaugeLabel;
let box = null;
for (let i = 0; i < 6 && !box; i++) {
  node = node.locator("xpath=..");
  const b = await node.boundingBox().catch(() => null);
  if (b && b.width > 300 && b.height > 300) box = b;
}
if (box) {
  await page.screenshot({
    path: join(OUT_DIR, "05-gauge-seul.png"),
    clip: { x: box.x - 8, y: box.y - 8, width: box.width + 16, height: box.height + 16 },
  });
  console.log("captured 05-gauge-seul.png", box);
} else {
  console.log("gauge bounding box not found");
}

await page.getByText("PONDÉRATION DES LEVIERS").scrollIntoViewIfNeeded();
await shot("06-aptitude-leviers.png");

// --- ROI ---
await page.getByRole("button", { name: "ROI", exact: true }).click();
await page.waitForTimeout(1000);
await page.evaluate(() => window.scrollTo(0, 0));
await shot("07-roi-decouverte.png");

const volumeInput = page.locator("input").filter({ hasText: "" }).first();
// Le champ "Volume" est le premier input numérique du calculateur.
const numberInputs = page.locator('main input[type="number"], main input[inputmode="numeric"], main input[inputmode="decimal"]');
const nInputs = await numberInputs.count();
console.log("champs numériques ROI trouvés:", nInputs);
if (nInputs > 0) {
  await numberInputs.first().fill("600");
  await numberInputs.first().blur();
  await page.waitForTimeout(600);
}
await shot("08-roi-ajuste.png");

await page.mouse.wheel(0, 900);
await shot("09-roi-scenarios.png");

// --- Priorisation ---
await page.evaluate(() => window.scrollTo(0, 0));
await page.getByRole("button", { name: "Priorisation", exact: true }).click();
await page.waitForTimeout(1200);
await shot("10-priorisation.png");

// --- Feuille de route ---
await page.getByRole("button", { name: "Feuille de route", exact: true }).click();
await page.waitForTimeout(1200);
await shot("11-feuille-de-route.png");

await page.mouse.wheel(0, 900);
await shot("12-feuille-de-route-tableau.png");

await browser.close();
