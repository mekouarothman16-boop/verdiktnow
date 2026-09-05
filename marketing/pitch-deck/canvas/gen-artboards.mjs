// Génère les 31 artboards .dc.html du deck VerdiktNow à partir d'un jeu
// d'archétypes. Même principe que build.mjs côté PowerPoint : le contenu est
// une donnée, la mise en page est une fonction. Une correction d'archétype se
// répercute donc sur toutes les diapos qui l'utilisent, des deux côtés.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const BG = "#e9ecea";
const SURFACE = "#ffffff";
const INK = "#091315";
const INK_SOFT = "#686464";
const INK_FAINT = "#6d7373";
const LINE = "#d7dbd8";
const ACCENT = "#55631a";
const ACCENT_DEEP = "#3d4712";
const CHARTREUSE = "#d7ff53";
const DARK_PANEL = "#111c1f";
const DARK_LINE = "#2a3538";
const CORAL = "#c45033";
const ON_DARK = "#b9c2bf";
const MUTED_DARK = "#8a9490";

const SHADOW = "0 1px 2px rgba(9,19,21,0.04), 0 6px 20px rgba(9,19,21,0.05)";
const SHADOW_LG = "0 4px 10px rgba(9,19,21,0.05), 0 18px 46px rgba(9,19,21,0.08)";
const HEAD = "Outfit, Inter, sans-serif";
const BODY = "Inter, system-ui, sans-serif";

const FONT_LINK =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap">';

function shell(inner, { dark = false, page = null } = {}) {
  const footer =
    page === null
      ? ""
      : `<div style="position: absolute; left: 72px; right: 72px; bottom: 40px; display: flex; align-items: center; justify-content: space-between;">
      <div style="font-family: ${HEAD}; font-size: 13px; font-weight: 600;"><span style="color: ${INK};">Verdikt</span><span style="color: ${ACCENT};">Now</span></div>
      <div style="font-family: ${BODY}; font-size: 12px; color: ${INK_FAINT};">${String(page).padStart(2, "0")} / 31</div>
    </div>`;
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  ${FONT_LINK}
  <style>
    body { margin: 0; }
    a { color: ${dark ? CHARTREUSE : ACCENT}; } a:hover { color: ${dark ? "#ffffff" : ACCENT_DEEP}; }
  </style>
</helmet>
<div style="position: relative; width: 1280px; height: 720px; background: ${dark ? INK : BG}; overflow: hidden; font-family: ${BODY};">
${inner}
${footer}
</div>
</x-dc>
</body>
</html>
`;
}

function eyebrow(text, { centered = false } = {}) {
  return `<div style="display: inline-flex; ${centered ? "" : "align-self: flex-start;"} align-items: center; padding: 9px 18px; border-radius: 999px; background: ${SURFACE}; box-shadow: ${SHADOW};">
      <span style="font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: ${INK};">${text}</span>
    </div>`;
}

function header(eb, title, { size = 46, maxWidth = null } = {}) {
  // Une diapo-statistique n'a pas de titre : ne pas émettre un h2 vide, qui
  // ajouterait une gouttière fantôme au-dessus du contenu.
  const heading = title
    ? `\n    <h2 style="margin: 0; ${maxWidth ? `max-width: ${maxWidth}px;` : ""} font-family: ${HEAD}; font-size: ${size}px; line-height: 1.05; font-weight: 600; letter-spacing: -0.025em; color: ${INK}; text-wrap: balance;">${title}</h2>`
    : "";
  return `<div style="display: flex; flex-direction: column; gap: 16px;">
    ${eyebrow(eb)}${heading}
  </div>`;
}

/** Enveloppe standard : en-tête en haut, contenu qui remplit le reste. */
function page(eb, title, body, { size = 46, maxWidth = null, gap = 34 } = {}) {
  return `  <div style="position: absolute; inset: 0; display: flex; flex-direction: column; padding: 56px 72px 84px; gap: ${gap}px;">
    ${header(eb, title, { size, maxWidth })}
    <div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center; min-height: 0;">
${body}
    </div>
  </div>`;
}

// ---------------------------------------------------------------- archétypes

function hero() {
  return `  <svg width="1280" height="720" viewBox="0 0 1280 720" style="position: absolute; top: 0; left: 0;" aria-hidden="true">
    <circle cx="1010" cy="360" r="430" fill="none" stroke="${ACCENT}" stroke-width="1" opacity="0.55"></circle>
    <circle cx="1010" cy="360" r="316" fill="none" stroke="${ACCENT}" stroke-width="1" opacity="0.38"></circle>
    <circle cx="1010" cy="360" r="202" fill="none" stroke="${ACCENT}" stroke-width="1" opacity="0.22"></circle>
  </svg>
  <div style="position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; padding: 56px 72px;">
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="width: 30px; height: 30px; border-radius: 10px; border: 1.5px solid ${CHARTREUSE}; display: flex; align-items: center; justify-content: center;">
        <div style="width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid ${CHARTREUSE};"></div>
      </div>
      <div style="font-family: ${HEAD}; font-size: 20px; font-weight: 600; letter-spacing: -0.01em;"><span style="color: #ffffff;">Verdikt</span><span style="color: ${CHARTREUSE};">Now</span></div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 26px; max-width: 880px;">
      <h1 style="margin: 0; font-family: ${HEAD}; font-size: 82px; line-height: 0.98; font-weight: 600; letter-spacing: -0.035em; color: #ffffff;">Diagnostiquer avant<br><span style="color: ${CHARTREUSE};">d'automatiser.</span></h1>
      <p style="margin: 0; max-width: 620px; font-size: 17px; line-height: 1.6; color: ${ON_DARK};">L'outil qui évalue l'aptitude réelle d'un processus, chiffre son retour et priorise la feuille de route, avant qu'un budget ne soit engagé.</p>
    </div>
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div style="height: 1px; background: ${DARK_LINE};"></div>
      <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 40px;">
        <div style="display: flex; gap: 72px;">
          ${[
            ["76", " / 100", "aptitude"],
            ["54 696 $", "", "économies nettes / an"],
            ["6,6", " mois", "retour sur investissement"],
          ]
            .map(
              ([v, suffix, label]) => `<div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="font-family: ${HEAD}; font-size: 34px; font-weight: 600; letter-spacing: -0.02em; color: ${CHARTREUSE};">${v}${suffix ? `<span style="color: ${MUTED_DARK}; font-size: 20px;">${suffix}</span>` : ""}</div>
            <div style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: ${MUTED_DARK};">${label}</div>
          </div>`,
            )
            .join("\n          ")}
        </div>
        <div style="font-size: 11.5px; line-height: 1.5; color: ${INK_FAINT}; text-align: right; max-width: 210px;">Cas illustratif détaillé plus loin dans cette présentation</div>
      </div>
    </div>
  </div>`;
}

function cta() {
  return `  <svg width="1280" height="720" viewBox="0 0 1280 720" style="position: absolute; top: 0; left: 0;" aria-hidden="true">
    <circle cx="640" cy="620" r="520" fill="none" stroke="${ACCENT}" stroke-width="1" opacity="0.5"></circle>
    <circle cx="640" cy="620" r="380" fill="none" stroke="${ACCENT}" stroke-width="1" opacity="0.3"></circle>
  </svg>
  <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 34px; padding: 56px 72px;">
    <h1 style="margin: 0; max-width: 940px; text-align: center; font-family: ${HEAD}; font-size: 58px; line-height: 1.06; font-weight: 600; letter-spacing: -0.03em; color: #ffffff; text-wrap: balance;">Prêt à savoir si votre processus est <span style="color: ${CHARTREUSE};">prêt&nbsp;?</span></h1>
    <div style="display: inline-flex; align-items: center; padding: 18px 44px; border-radius: 999px; background: ${CHARTREUSE};">
      <span style="font-family: ${HEAD}; font-size: 22px; font-weight: 600; color: ${INK};">verdiktnow.com</span>
    </div>
    <p style="margin: 0; font-size: 15px; color: ${ON_DARK};">Réservez une démo ou lancez votre premier diagnostic.</p>
    <div style="display: flex; gap: 16px; margin-top: 12px;">
      ${["76 / 100 aptitude", "54 696 $ / an", "6,6 mois de retour"]
        .map(
          (p) => `<div style="padding: 12px 26px; border-radius: 999px; background: ${DARK_PANEL}; border: 1px solid ${DARK_LINE}; font-size: 13.5px; font-weight: 600; color: ${CHARTREUSE};">${p}</div>`,
        )
        .join("\n      ")}
    </div>
    <div style="font-family: ${HEAD}; font-size: 15px; font-weight: 600; margin-top: 14px;"><span style="color: #ffffff;">Verdikt</span><span style="color: ${CHARTREUSE};">Now</span></div>
  </div>`;
}

function toc(sections) {
  const rows = sections
    .map(
      (s, i) => `      <div style="display: flex; align-items: center; gap: 22px;">
        <div style="width: 44px; height: 44px; flex-shrink: 0; border-radius: 12px; background: ${SURFACE}; box-shadow: ${SHADOW}; display: flex; align-items: center; justify-content: center; font-family: ${HEAD}; font-size: 13px; font-weight: 600; color: ${ACCENT};">${String(i + 1).padStart(2, "0")}</div>
        <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 3px;">
          <div style="font-family: ${HEAD}; font-size: 20px; font-weight: 600; color: ${INK};">${s.title}</div>
          <div style="font-size: 13px; color: ${INK_SOFT};">${s.description}</div>
        </div>
        <div style="font-size: 13px; color: ${INK_FAINT}; font-variant-numeric: tabular-nums;">${s.range}</div>
      </div>`,
    )
    .join("\n");
  return `    <div style="display: flex; flex-direction: column; gap: 26px;">
${rows}
    </div>`;
}

function statGrid({ stat, description, legend, filled }) {
  const cells = Array.from(
    { length: 100 },
    (_, i) => `<div style="aspect-ratio: 1; border-radius: 4px; background: ${i < filled ? CHARTREUSE : LINE};"></div>`,
  ).join("");
  return `    <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 72px; align-items: center;">
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <div style="font-family: ${HEAD}; font-size: 152px; line-height: 0.86; font-weight: 600; letter-spacing: -0.04em; color: ${ACCENT};">${stat}</div>
        <p style="margin: 0; max-width: 440px; font-size: 22px; line-height: 1.45; color: ${INK};">${description}</p>
        <div style="display: flex; align-items: center; gap: 10px; margin-top: 4px;">
          <div style="width: 14px; height: 14px; border-radius: 4px; background: ${CHARTREUSE};"></div>
          <span style="font-size: 13px; color: ${INK_SOFT};">${legend}</span>
        </div>
      </div>
      <div style="display: flex; justify-content: flex-end;">
        <div style="display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); gap: 9px; width: 342px;">${cells}</div>
      </div>
    </div>`;
}

/** Rangées numérotées. En mode rail, le titre passe à gauche et les rangées
 * deviennent des cartes qui remplissent la hauteur. */
function detailRows(items, { highlight = -1 } = {}) {
  return `    <div style="display: flex; flex-direction: column; gap: 20px;">
${items
  .map((it, i) => {
    const dark = i === highlight;
    return `      <div style="display: flex; gap: 24px; background: ${dark ? INK : SURFACE}; border-radius: 20px; padding: 24px 30px; box-shadow: ${dark ? SHADOW_LG : SHADOW};">
        <div style="font-family: ${HEAD}; font-size: 30px; font-weight: 600; letter-spacing: -0.02em; color: ${dark ? CHARTREUSE : LINE}; line-height: 1; flex-shrink: 0;">${String(i + 1).padStart(2, "0")}</div>
        <div style="display: flex; flex-direction: column; gap: 7px;">
          <div style="font-family: ${HEAD}; font-size: 19px; font-weight: 600; color: ${dark ? "#ffffff" : INK}; line-height: 1.2;">${it.title}</div>
          <div style="font-size: 14px; line-height: 1.55; color: ${dark ? ON_DARK : INK_SOFT};">${it.description}</div>
        </div>
      </div>`;
  })
  .join("\n")}
    </div>`;
}

function railRows(eb, title, items, { highlight = -1 } = {}) {
  return `  <div style="position: absolute; inset: 0; display: flex; flex-direction: column; padding: 56px 72px 84px;">
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 56px; flex-grow: 1;">
      <div style="display: flex; flex-direction: column; justify-content: center; gap: 20px;">
        ${eyebrow(eb)}
        <h2 style="margin: 0; font-family: ${HEAD}; font-size: 42px; line-height: 1.08; font-weight: 600; letter-spacing: -0.025em; color: ${INK}; text-wrap: balance;">${title}</h2>
      </div>
      <div style="grid-column: span 2; display: flex; flex-direction: column; justify-content: center; gap: 22px;">
${items
  .map((it, i) => {
    const dark = i === highlight;
    return `        <div style="display: flex; gap: 24px; background: ${dark ? INK : SURFACE}; border-radius: 20px; padding: 26px 30px; box-shadow: ${dark ? SHADOW_LG : SHADOW};">
          <div style="font-family: ${HEAD}; font-size: 30px; font-weight: 600; letter-spacing: -0.02em; color: ${dark ? CHARTREUSE : LINE}; line-height: 1; flex-shrink: 0;">${String(i + 1).padStart(2, "0")}</div>
          <div style="display: flex; flex-direction: column; gap: 7px;">
            <div style="font-family: ${HEAD}; font-size: 19px; font-weight: 600; color: ${dark ? "#ffffff" : INK}; line-height: 1.2;">${it.title}</div>
            <div style="font-size: 14px; line-height: 1.55; color: ${dark ? ON_DARK : INK_SOFT};">${it.description}</div>
          </div>
        </div>`;
  })
  .join("\n")}
      </div>
    </div>
  </div>`;
}

function bandedCards(cards) {
  return `    <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px; align-items: stretch;">
${cards
  .map((c) => {
    const dark = c.tone === "ink";
    return `      <div style="display: flex; flex-direction: column; background: ${SURFACE}; border-radius: 20px; overflow: hidden; box-shadow: ${SHADOW};">
        <div style="background: ${dark ? INK : CHARTREUSE}; padding: 20px 30px;">
          <div style="font-family: ${HEAD}; font-size: 22px; font-weight: 600; letter-spacing: -0.015em; color: ${dark ? "#ffffff" : INK};">${c.title}</div>
          <div style="font-size: 12.5px; color: ${dark ? MUTED_DARK : ACCENT_DEEP}; margin-top: 3px;">${c.subtitle}</div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 20px; padding: 28px 30px;">
${c.details
  .map(
    (d, j) => `          <div style="display: flex; gap: 16px; align-items: baseline;">
            <span style="font-family: ${HEAD}; font-size: 13px; font-weight: 600; color: ${ACCENT}; min-width: 20px;">${String(j + 1).padStart(2, "0")}</span>
            <span style="font-size: 15px; line-height: 1.5; color: ${INK};">${d}</span>
          </div>`,
  )
  .join("\n")}
        </div>
      </div>`;
  })
  .join("\n")}
    </div>`;
}

function statement(html, sub) {
  return `  <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 30px; padding: 56px 120px 84px;">
    ${eyebrow(sub.eyebrow, { centered: true })}
    <h2 style="margin: 0; max-width: 960px; text-align: center; font-family: ${HEAD}; font-size: 50px; line-height: 1.12; font-weight: 600; letter-spacing: -0.03em; color: ${INK}; text-wrap: balance;">${html}</h2>
    <p style="margin: 0; max-width: 700px; text-align: center; font-size: 16px; line-height: 1.5; color: ${INK_SOFT};">${sub.text}</p>
  </div>`;
}

function cards(items, cols) {
  return `    <div style="display: grid; grid-template-columns: repeat(${cols}, minmax(0, 1fr)); gap: 24px; align-items: stretch;">
${items
  .map(
    (c) => `      <div style="display: flex; flex-direction: column; gap: 12px; background: ${SURFACE}; border-radius: 20px; padding: 26px 28px; box-shadow: ${SHADOW};">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: ${CHARTREUSE}; flex-shrink: 0;"></div>
          <div style="font-family: ${HEAD}; font-size: 18px; font-weight: 600; color: ${INK}; line-height: 1.2;">${c.title}</div>
        </div>
        ${
          c.description
            ? `<div style="font-size: 14px; line-height: 1.55; color: ${INK_SOFT};">${c.description}</div>`
            : `<div style="display: flex; flex-direction: column; gap: 9px;">${c.details
                .map(
                  (d) =>
                    `<div style="display: flex; gap: 10px;"><span style="color: ${LINE}; flex-shrink: 0;">•</span><span style="font-size: 13.5px; line-height: 1.45; color: ${INK_SOFT};">${d}</span></div>`,
                )
                .join("")}</div>`
        }
      </div>`,
  )
  .join("\n")}
    </div>`;
}

function steps(items, cols) {
  const per = Math.ceil(items.length / cols);
  const columns = Array.from({ length: cols }, (_, c) => items.slice(c * per, (c + 1) * per));
  return `    <div style="display: grid; grid-template-columns: repeat(${cols}, minmax(0, 1fr)); gap: 48px;">
${columns
  .map(
    (col, ci) => `      <div style="display: flex; flex-direction: column; gap: 14px;">
${col
  .map(
    (label, i) => `        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 28px; height: 28px; flex-shrink: 0; border-radius: 50%; border: 1.5px solid ${ACCENT}; background: ${SURFACE}; display: flex; align-items: center; justify-content: center; font-family: ${HEAD}; font-size: 12px; font-weight: 600; color: ${ACCENT};">${ci * per + i + 1}</div>
          <span style="font-size: 14.5px; color: ${INK};">${label}</span>
        </div>`,
  )
  .join("\n")}
      </div>`,
  )
  .join("\n")}
    </div>`;
}

function pillsToResult(pills, result, note) {
  return `    <div style="display: flex; flex-direction: column; align-items: center; gap: 22px;">
      <div style="display: flex; gap: 20px;">
${pills
  .map(
    (p) => `        <div style="padding: 18px 34px; border-radius: 999px; background: ${SURFACE}; box-shadow: ${SHADOW}; font-size: 17px; font-weight: 500; color: ${INK};">${p}</div>`,
  )
  .join("\n")}
      </div>
      <svg width="26" height="42" viewBox="0 0 26 42" aria-hidden="true"><path d="M13 0 L13 30 M13 40 L2 26 M13 40 L24 26" stroke="${ACCENT}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"></path></svg>
      <div style="padding: 20px 54px; border-radius: 999px; background: ${CHARTREUSE}; box-shadow: ${SHADOW_LG}; font-family: ${HEAD}; font-size: 24px; font-weight: 600; color: ${INK};">${result}</div>
      <p style="margin: 8px 0 0; max-width: 640px; text-align: center; font-size: 14px; line-height: 1.5; color: ${INK_SOFT};">${note}</p>
    </div>`;
}

function matrixSlide(bullets) {
  const quadrant = (label, bg, strong) =>
    `<div style="background: ${bg}; padding: 16px 18px; display: flex; align-items: ${strong ? "flex-start" : "flex-end"};"><span style="font-size: 13px; font-weight: ${strong ? 600 : 400}; color: ${strong ? ACCENT : INK_SOFT};">${label}</span></div>`;
  return `    <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 56px; align-items: center;">
      <div style="display: flex; flex-direction: column; gap: 18px;">
${bullets
  .map(
    (b) => `        <div style="display: flex; gap: 14px;"><span style="color: ${CHARTREUSE}; font-size: 18px; line-height: 1.2;">▪</span><span style="font-size: 15.5px; line-height: 1.5; color: ${INK};">${b}</span></div>`,
  )
  .join("\n")}
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: ${INK_FAINT};">Aptitude ↑</div>
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(0, 1fr)); height: 300px; border-radius: 16px; overflow: hidden; background: ${SURFACE}; box-shadow: ${SHADOW};">
          ${quadrant("Planifier", SURFACE, false)}
          ${quadrant("Automatiser en priorité", "#f6ffe4", true)}
          ${quadrant("Écarter", SURFACE, false)}
          ${quadrant("Préparer le terrain", SURFACE, false)}
        </div>
        <div style="font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: ${INK_FAINT}; text-align: right;">Valeur →</div>
      </div>
    </div>`;
}

function checklist(items) {
  return `    <div style="display: flex; flex-direction: column; gap: 16px;">
${items
  .map(
    (it) => `      <div style="display: flex; align-items: center; gap: 18px;">
        <div style="width: 26px; height: 26px; flex-shrink: 0; border-radius: 8px; background: ${it.done ? CHARTREUSE : SURFACE}; border: 1px solid ${it.done ? CHARTREUSE : LINE}; display: flex; align-items: center; justify-content: center;">
          ${it.done ? `<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7.5 L5.5 10.5 L11.5 3.5" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"></path></svg>` : ""}
        </div>
        <span style="font-size: 15.5px; color: ${it.done ? INK_SOFT : INK};">${it.label}</span>
      </div>`,
  )
  .join("\n")}
    </div>`;
}

function docCard(bullets, cardItems) {
  return `    <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 56px; align-items: center;">
      <div style="display: flex; flex-direction: column; gap: 18px;">
${bullets
  .map(
    (b) => `        <div style="display: flex; gap: 14px;"><span style="color: ${CHARTREUSE}; font-size: 18px; line-height: 1.2;">▪</span><span style="font-size: 15.5px; line-height: 1.5; color: ${INK};">${b}</span></div>`,
  )
  .join("\n")}
      </div>
      <div style="background: ${SURFACE}; border-radius: 20px; padding: 30px; box-shadow: ${SHADOW_LG};">
        <div style="display: flex; align-items: center; gap: 14px; padding-bottom: 18px; border-bottom: 1px solid ${LINE};">
          <span style="padding: 6px 14px; border-radius: 999px; background: ${CHARTREUSE}; font-family: ${HEAD}; font-size: 12px; font-weight: 600; color: ${INK};">PDF</span>
          <span style="font-family: ${HEAD}; font-size: 18px; font-weight: 600; color: ${INK};">Rapport VerdiktNow</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 16px; padding-top: 20px;">
${cardItems
  .map(
    (c) => `          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 22px; height: 22px; flex-shrink: 0; border-radius: 6px; background: ${CHARTREUSE}; display: flex; align-items: center; justify-content: center;"><svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7.5 L5.5 10.5 L11.5 3.5" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>
            <span style="font-size: 14.5px; color: ${INK};">${c}</span>
          </div>`,
  )
  .join("\n")}
        </div>
      </div>
    </div>`;
}

function screenshot(file) {
  return `    <div style="display: flex; justify-content: center;">
      <div style="width: 100%; max-height: 400px; border-radius: 16px; overflow: hidden; background: ${SURFACE}; box-shadow: ${SHADOW_LG};">
        <img src="${file}" alt="" style="display: block; width: 100%; object-fit: cover; object-position: top;">
      </div>
    </div>`;
}

function beforeAfter({ before, after, caption, pills }) {
  return `    <div style="display: flex; flex-direction: column; align-items: center; gap: 26px;">
      <div style="display: flex; align-items: center; gap: 22px;">
        <div style="width: 300px; padding: 26px; border-radius: 16px; background: ${SURFACE}; box-shadow: ${SHADOW}; text-align: center;">
          <div style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${INK_FAINT}; margin-bottom: 10px;">Avant</div>
          <div style="font-family: ${HEAD}; font-size: 26px; font-weight: 600; color: ${INK};">${before}</div>
        </div>
        <svg width="42" height="26" viewBox="0 0 42 26" aria-hidden="true"><path d="M0 13 L30 13 M28 3 L40 13 L28 23" stroke="${ACCENT}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"></path></svg>
        <div style="width: 300px; padding: 26px; border-radius: 16px; background: ${CHARTREUSE}; box-shadow: ${SHADOW_LG}; text-align: center;">
          <div style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${ACCENT_DEEP}; margin-bottom: 10px;">Après</div>
          <div style="font-family: ${HEAD}; font-size: 26px; font-weight: 600; color: ${INK};">${after}</div>
        </div>
      </div>
      <p style="margin: 0; font-size: 14px; color: ${INK_SOFT};">${caption}</p>
      <div style="display: flex; gap: 16px; margin-top: 6px;">
${pills
  .map(
    (p) => `        <div style="padding: 13px 28px; border-radius: 999px; background: ${SURFACE}; box-shadow: ${SHADOW}; font-size: 15px; font-weight: 600; color: ${INK};">${p}</div>`,
  )
  .join("\n")}
      </div>
    </div>`;
}

function compare(left, right) {
  const col = (label, items, ok) =>
    `      <div style="display: flex; flex-direction: column; background: ${SURFACE}; border-radius: 20px; overflow: hidden; box-shadow: ${SHADOW};">
        <div style="padding: 20px 30px; background: ${ok ? INK : "#f7efec"};">
          <div style="font-family: ${HEAD}; font-size: 20px; font-weight: 600; color: ${ok ? "#ffffff" : CORAL};">${label}</div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 20px; padding: 28px 30px;">
${items
  .map(
    (t) => `          <div style="display: flex; gap: 14px; align-items: flex-start;">
            <svg width="18" height="18" viewBox="0 0 18 18" style="flex-shrink: 0; margin-top: 2px;" aria-hidden="true">${
              ok
                ? `<path d="M3.5 9.5 L7 13 L14.5 5" stroke="${ACCENT}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"></path>`
                : `<path d="M4.5 4.5 L13.5 13.5 M13.5 4.5 L4.5 13.5" stroke="${CORAL}" stroke-width="2" fill="none" stroke-linecap="round"></path>`
            }</svg>
            <span style="font-size: 15px; line-height: 1.5; color: ${INK};">${t}</span>
          </div>`,
  )
  .join("\n")}
        </div>
      </div>`;
  return `    <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px; align-items: stretch;">
${col(left.label, left.items, false)}
${col(right.label, right.items, true)}
    </div>`;
}

function pricing(tiers, note) {
  return `    <div style="display: flex; flex-direction: column; gap: 26px;">
      <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; align-items: stretch;">
${tiers
  .map((t) => {
    const hero = !!t.hero;
    return `        <div style="display: flex; flex-direction: column; gap: 16px; background: ${hero ? INK : SURFACE}; border-radius: 20px; padding: 30px 28px; box-shadow: ${hero ? SHADOW_LG : SHADOW};">
          <div style="font-family: ${HEAD}; font-size: 15px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: ${hero ? CHARTREUSE : ACCENT};">${t.name}</div>
          <div style="font-family: ${HEAD}; font-size: 42px; font-weight: 600; letter-spacing: -0.02em; line-height: 1; color: ${hero ? "#ffffff" : INK};">${t.price}</div>
          <div style="font-size: 12.5px; color: ${hero ? MUTED_DARK : INK_FAINT};">${t.unit}</div>
          <div style="height: 1px; background: ${hero ? DARK_LINE : LINE}; margin: 4px 0;"></div>
          <div style="font-size: 13.5px; line-height: 1.5; color: ${hero ? ON_DARK : INK_SOFT};">${t.note}</div>
        </div>`;
  })
  .join("\n")}
      </div>
      <p style="margin: 0; text-align: center; font-size: 13px; line-height: 1.5; color: ${INK_FAINT};">${note}</p>
    </div>`;
}

function bulletList(items) {
  return `    <div style="display: flex; flex-direction: column; gap: 24px;">
${items
  .map(
    (b) => `      <div style="display: flex; gap: 16px; align-items: flex-start;">
        <span style="color: ${CHARTREUSE}; font-size: 20px; line-height: 1.1;">▪</span>
        <span style="font-size: 17px; line-height: 1.5; color: ${INK};">${b}</span>
      </div>`,
  )
  .join("\n")}
    </div>`;
}

// ------------------------------------------------------------------ contenu

const SLIDES = [
  { file: "Main", title: "01 · Titre", build: () => shell(hero(), { dark: true }) },
  {
    file: "Sommaire",
    title: "02 · Sommaire",
    build: () =>
      shell(
        page(
          "Sommaire",
          "Cinq sections, un seul fil conducteur",
          toc([
            { title: "Le problème", description: "Pourquoi la plupart des projets d'automatisation partent mal.", range: "03 – 06" },
            { title: "La méthode", description: "Les cinq étapes du diagnostic VerdiktNow, de bout en bout.", range: "07 – 15" },
            { title: "Cas illustratif", description: "Un vrai processus, diagnostiqué dans l'outil, du contexte au plan d'action.", range: "16 – 25" },
            { title: "VerdiktNow aujourd'hui", description: "Ce qui le distingue, le marché, le modèle d'affaires et l'état du produit.", range: "26 – 29" },
            { title: "La suite", description: "Ce qui vient après le lancement.", range: "30 – 31" },
          ]),
        ),
        { page: 2 },
      ),
  },
  {
    file: "Constat",
    title: "03 · Le constat",
    build: () =>
      shell(
        page("Le constat", "", statGrid({ stat: "2 %", description: "seulement des entreprises sont réellement prêtes à automatiser un processus.", legend: "2 organisations sur 100", filled: 2 }), { gap: 0 }),
        { page: 3 },
      ),
  },
  {
    file: "Probleme",
    title: "04 · Le problème",
    build: () =>
      shell(
        railRows("Le problème", "Pourquoi tant de projets d'automatisation échouent", [
          { title: "L'ordre est inversé", description: "Le choix d'un outil précède l'évaluation du processus, jamais l'inverse." },
          { title: "Aucune mesure objective", description: "L'aptitude réelle d'un processus n'est jamais évaluée avant d'engager un budget." },
          { title: "Le retour reste une intuition", description: "Sans chiffre défendable, difficile de justifier la priorité devant une direction." },
          { title: "La priorisation se fait à l'oreille", description: "Sans méthode commune, le processus le plus visible l'emporte, pas le plus prêt." },
        ]),
        { page: 4 },
      ),
  },
  {
    file: "PourQui",
    title: "05 · Pour qui",
    build: () =>
      shell(
        page(
          "Pour qui",
          "Deux publics, une même question",
          bandedCards([
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
          ]),
        ),
        { page: 5 },
      ),
  },
  {
    file: "Question",
    title: "06 · La question",
    build: () =>
      shell(
        statement(`Ce processus est-il vraiment <span style="color: ${ACCENT};">prêt</span> à être automatisé&nbsp;?`, {
          eyebrow: "La question",
          text: "VerdiktNow existe pour y répondre avec des données, pas avec une intuition.",
        }),
        { page: 6 },
      ),
  },
  { file: "Methode", title: "07 · La méthode", build: () => shell(METHODE_BODY, { page: 7 }) },
  {
    file: "Contexte",
    title: "08 · Étape 1 · Contexte",
    build: () =>
      shell(
        page(
          "Étape 1 · Contexte",
          "Comprendre le processus avant de le noter",
          cards(
            [
              { title: "Porteur de projet", details: ["Qui connaît le processus de bout en bout", "Qui valide les décisions et les exceptions", "Qui devient responsable une fois automatisé"] },
              { title: "Systèmes impliqués", details: ["Les outils et plateformes traversés", "Où vivent les données sources", "Les intégrations déjà en place"] },
              { title: "Contraintes et irritants", details: ["Exigences réglementaires ou de conformité", "Ce qui ralentit déjà l'équipe aujourd'hui", "Les exceptions gérées manuellement"] },
              { title: "Volume et fréquence", details: ["Combien de fois le processus s'exécute", "À quelle cadence il revient", "Combien de personnes y consacrent du temps"] },
            ],
            2,
          ),
        ),
        { page: 8 },
      ),
  },
  {
    file: "Leviers",
    title: "09 · Étape 2 · Diagnostic",
    build: () =>
      shell(
        page(
          "Étape 2 · Diagnostic",
          "Six leviers pondérés",
          cards(
            [
              { title: "Standardisation", description: "Le processus suit-il toujours les mêmes étapes ?" },
              { title: "Règles de décision", description: "Les décisions reposent-elles sur des critères clairs ?" },
              { title: "Données", description: "Les données nécessaires sont-elles fiables et accessibles ?" },
              { title: "Volume", description: "Le volume traité justifie-t-il l'investissement ?" },
              { title: "Faisabilité technique", description: "Les systèmes en place permettent-ils l'automatisation ?" },
              { title: "Risque", description: "Quelles sont les conséquences d'une erreur non détectée ?" },
            ],
            3,
          ),
        ),
        { page: 9 },
      ),
  },
  {
    file: "Transparence",
    title: "10 · Transparence",
    build: () =>
      shell(
        railRows("Transparence", "Comment le score est calculé", [
          { title: "Chaque énoncé pèse dans son levier", description: "Dans le diagnostic, chaque affirmation contribue à son levier avec un poids explicite." },
          { title: "Chaque levier pèse dans le score global", description: "Les six leviers se combinent selon une pondération transparente, jamais une boîte noire." },
          { title: "Les pondérations sont ajustables", description: "Adaptez-les à ce qui compte vraiment pour votre organisation, le score se recalcule en direct." },
        ]),
        { page: 10 },
      ),
  },
  {
    file: "Regle",
    title: "11 · La règle",
    build: () =>
      shell(
        statement(`Le contexte peut corriger un score vers le <span style="color: ${ACCENT};">bas.</span> Jamais vers le haut.`, {
          eyebrow: "La règle",
          text: "Aucun mécanisme ne peut flatter artificiellement un résultat.",
        }),
        { page: 11 },
      ),
  },
  {
    file: "Roi",
    title: "12 · Étape 3 · ROI",
    build: () =>
      shell(
        page(
          "Étape 3 · ROI",
          "Chiffrer avant d'investir",
          pillsToResult(["Temps investi", "Taux horaire", "Volume traité"], "ROI chiffré", "Un calcul basé sur les données réelles de votre organisation, pas une moyenne sectorielle."),
        ),
        { page: 12 },
      ),
  },
  {
    file: "Priorisation",
    title: "13 · Étape 4 · Priorisation",
    build: () =>
      shell(
        page(
          "Étape 4 · Priorisation",
          "Aptitude et valeur, sur un même graphique",
          matrixSlide([
            "Chaque processus diagnostiqué se positionne automatiquement.",
            "Les meilleurs candidats ressortent d'un coup d'œil.",
            "Les quatre quadrants guident l'action à prendre.",
            "Prioriser devient une lecture de données, pas une opinion.",
          ]),
          { maxWidth: 620 },
        ),
        { page: 13 },
      ),
  },
  {
    file: "FeuilleDeRoute",
    title: "14 · Étape 5 · Feuille de route",
    build: () =>
      shell(
        page(
          "Étape 5 · Feuille de route",
          "Un plan d'action, pas juste un score",
          checklist([
            { label: "Confirmer le porteur de projet", done: true },
            { label: "Valider le périmètre", done: true },
            { label: "Documenter les exceptions", done: false },
            { label: "Désigner l'opérateur", done: false },
            { label: "Aligner l'échéancier avec les parties prenantes", done: false },
            { label: "Suivre les gains", done: false },
            { label: "Partager le rapport avec la direction", done: false },
          ]),
        ),
        { page: 14 },
      ),
  },
  {
    file: "Livrable",
    title: "15 · Le livrable",
    build: () =>
      shell(
        page(
          "Le livrable",
          "Un rapport PDF exportable",
          docCard(
            [
              "Contexte, diagnostic, ROI, priorisation et feuille de route réunis.",
              "Prêt à être partagé avec une direction ou un comité.",
              "Le même document, du premier diagnostic jusqu'à l'exécution.",
              "Un format professionnel, cohérent d'un processus à l'autre.",
            ],
            ["Contexte du processus", "Diagnostic et score d'aptitude", "Calculateur de ROI", "Matrice de priorisation", "Feuille de route"],
          ),
          { maxWidth: 620 },
        ),
        { page: 15 },
      ),
  },
  {
    file: "QuinzeEtapes",
    title: "16 · Cas · 15 étapes",
    build: () =>
      shell(
        page(
          "Cas illustratif",
          "Un processus de traitement de factures, en 15 étapes",
          steps(
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
            2,
          ),
        ),
        { page: 16 },
      ),
  },
  {
    file: "Complexe",
    title: "17 · Cas · Complexité",
    build: () =>
      shell(
        page(
          "Cas illustratif",
          "Pourquoi ce processus est complexe",
          cards(
            [
              { title: "Quatre systèmes", description: "Courriel, portail fournisseur, ERP et système bancaire, traversés à chaque facture." },
              { title: "Deux paliers d'approbation", description: "Un seuil monétaire qui détermine si une deuxième signature est requise." },
              { title: "Multidevises et taxes", description: "TPS, TVQ et retenues à vérifier selon le fournisseur et sa provenance." },
              { title: "Volume élevé", description: "Environ 600 factures par mois, en continu, sans pic saisonnier notable." },
            ],
            2,
          ),
        ),
        { page: 17 },
      ),
  },
  { file: "CasContexte", title: "18 · Cas · Contexte", build: () => shell(page("Cas illustratif · Contexte", "Ce qui a été documenté, dans l'outil", screenshot("contexte.jpg")), { page: 18 }) },
  {
    file: "CasDiagnostic",
    title: "19 · Cas · Diagnostic",
    build: () => shell(page("Cas illustratif · Diagnostic", `Un score de <span style="color: ${ACCENT};">76 sur 100</span>`, screenshot("diagnostic.jpg")), { page: 19 }),
  },
  { file: "CasLeviers", title: "20 · Cas · Leviers", build: () => shell(page("Cas illustratif · Diagnostic", "Détail par levier, pondérations ajustables", screenshot("leviers.jpg")), { page: 20 }) },
  {
    file: "CasRoi",
    title: "21 · Cas · ROI",
    build: () => shell(page("Cas illustratif · ROI", `<span style="color: ${ACCENT};">54 696 $</span> d'économies nettes par année`, screenshot("roi.jpg")), { page: 21 }),
  },
  { file: "CasPriorisation", title: "22 · Cas · Priorisation", build: () => shell(page("Cas illustratif · Priorisation", "Pourquoi ce processus est passé en premier", screenshot("priorisation.jpg")), { page: 22 }) },
  { file: "CasGantt", title: "23 · Cas · Feuille de route", build: () => shell(page("Cas illustratif · Feuille de route", "Le plan généré pour ce processus, en 24 étapes", screenshot("gantt.jpg")), { page: 23 }) },
  { file: "CasTableau", title: "24 · Cas · Tableau de suivi", build: () => shell(page("Cas illustratif · Feuille de route", "Un tableau de suivi, pas juste un aperçu", screenshot("tableau.jpg")), { page: 24 }) },
  {
    file: "Resultat",
    title: "25 · Cas · Résultat",
    build: () =>
      shell(
        page(
          "Cas illustratif · Résultat",
          "Un résultat qui se mesure",
          beforeAfter({
            before: "Plusieurs jours",
            after: "Quelques heures",
            caption: "Délai de traitement complet d'une facture",
            pills: ["76 / 100 aptitude", "54 696 $ / an", "6,6 mois de retour"],
          }),
        ),
        { page: 25 },
      ),
  },
  {
    file: "Chiffrier",
    title: "26 · Pourquoi pas un chiffrier",
    build: () =>
      shell(
        page(
          "Pourquoi pas...",
          "Un chiffrier ou l'instinct ne suffisent plus",
          compare(
            {
              label: "Approche improvisée",
              items: ["Pas de méthode reproductible d'un processus à l'autre.", "Aucune traçabilité du raisonnement derrière une décision.", "Devient obsolète dès que le contexte change."],
            },
            {
              label: "VerdiktNow",
              items: ["Méthodologie pondérée et cohérente, appliquée à chaque processus.", "Chaque score est justifiable, énoncé par énoncé.", "Reste à jour au fil de l'avancement du projet."],
            },
          ),
        ),
        { page: 26 },
      ),
  },
  {
    file: "Opportunite",
    title: "27 · L'opportunité",
    build: () =>
      shell(
        railRows(
          "L'opportunité",
          "Un marché mal desservi, une discipline qui manque",
          [
            { title: "L'automatisation est déjà à l'agenda", description: "RPA, IA, workflows : presque toute organisation moyenne à grande évalue aujourd'hui un projet d'automatisation." },
            { title: "Mais 2 % seulement sont réellement prêtes", description: "La majorité des initiatives échouent ou stagnent faute d'une évaluation rigoureuse avant l'investissement." },
            { title: "Un besoin structurel, pas une mode", description: "La même question se pose avant chaque nouveau processus : VerdiktNow y répond une fois, de façon reproductible." },
          ],
          { highlight: 1 },
        ),
        { page: 27 },
      ),
  },
  {
    file: "Modele",
    title: "28 · Modèle d'affaires",
    build: () =>
      shell(
        page(
          "Modèle d'affaires",
          "Un abonnement par utilisateur, simple à comprendre",
          pricing(
            [
              { name: "Essentiel", price: "50 $", unit: "CAD / mois / utilisateur", note: "Pour démarrer, 1 à 5 utilisateurs" },
              { name: "Croissance", price: "40 $", unit: "CAD / mois / utilisateur", note: "Pour une équipe active, 6 à 20 utilisateurs", hero: true },
              { name: "Entreprise", price: "Sur mesure", unit: "", note: "Prix négocié, support prioritaire" },
            ],
            "Facturation annuelle : deux mois offerts. Siège Spectateur en lecture seule à 20 $ CAD / mois pour étendre la visibilité sans ajouter d'utilisateurs actifs.",
          ),
        ),
        { page: 28 },
      ),
  },
  {
    file: "OuEnEst",
    title: "29 · Où en est VerdiktNow",
    build: () =>
      shell(
        page(
          "Où en est VerdiktNow",
          "Le produit est prêt. Le marché reste à conquérir.",
          checklist([
            { label: "Diagnostic pondéré sur 6 leviers, fonctionnel", done: true },
            { label: "Calculateur de ROI en temps réel, fonctionnel", done: true },
            { label: "Matrice de priorisation, fonctionnelle", done: true },
            { label: "Feuille de route et gestion de projet, fonctionnelles", done: true },
            { label: "Rapport PDF exportable, fonctionnel", done: true },
            { label: "Produit en phase pré-lancement, prêt pour les premiers clients pilotes", done: false },
          ]),
        ),
        { page: 29 },
      ),
  },
  {
    file: "Suite",
    title: "30 · La suite",
    build: () =>
      shell(
        page(
          "La suite",
          "Lancer, apprendre, itérer",
          bulletList([
            "Recruter les premiers clients pilotes pour valider le produit en conditions réelles.",
            "Affiner la méthodologie de diagnostic à partir de cas réels.",
            "Étendre la portée : davantage de leviers sectoriels, davantage d'intégrations.",
            "La feuille de route s'ajuste à mesure que de nouveaux processus et secteurs sont diagnostiqués.",
          ]),
        ),
        { page: 30 },
      ),
  },
  { file: "Cta", title: "31 · Appel à l'action", build: () => shell(cta(), { dark: true }) },
];

// Le diagramme reste écrit à la main : ses connecteurs sont des coordonnées
// exactes, pas une grille, et c'est la diapo dont la lisibilité compte le plus.
const METHODE_BODY = `  <svg width="1280" height="720" viewBox="0 0 1280 720" style="position: absolute; top: 0; left: 0; pointer-events: none;" aria-hidden="true">
    <defs>
      <marker id="ar-o" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${ACCENT}"></path></marker>
      <marker id="ar-c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${CORAL}"></path></marker>
    </defs>
    <path d="M 420 274 L 512 274" stroke="${ACCENT}" stroke-width="1.75" fill="none" marker-end="url(#ar-o)"></path>
    <path d="M 760 274 L 852 274" stroke="${ACCENT}" stroke-width="1.75" fill="none" marker-end="url(#ar-o)"></path>
    <path d="M 980 312 L 980 346 L 640 346" stroke="${ACCENT}" stroke-width="1.75" fill="none" stroke-linejoin="round"></path>
    <path d="M 640 312 L 640 358" stroke="${ACCENT}" stroke-width="1.75" fill="none" marker-end="url(#ar-o)"></path>
    <circle cx="640" cy="346" r="4" fill="${ACCENT}"></circle>
    <path d="M 640 402 L 640 426" stroke="${ACCENT}" stroke-width="1.75" fill="none" marker-end="url(#ar-o)"></path>
    <path d="M 640 508 L 640 532" stroke="${ACCENT}" stroke-width="1.75" fill="none" marker-end="url(#ar-o)"></path>
    <path d="M 490 576 L 120 576 L 120 274 L 172 274" stroke="${CORAL}" stroke-width="1.75" fill="none" stroke-linejoin="round" marker-end="url(#ar-c)"></path>
  </svg>
  <div style="position: absolute; inset: 0; padding: 56px 72px;">${header("La méthode", "Cinq étapes, pas cinq silos")}</div>
  ${[
    ["Contexte", 1, 180, 240, null],
    ["Diagnostic", 2, 520, 240, "ajusté par le contexte"],
    ["ROI", 3, 860, 240, "calcul indépendant"],
  ]
    .map(
      ([label, n, x, w, sub]) => `<div style="position: absolute; left: ${x}px; top: 236px; width: ${w}px; height: 76px; background: ${SURFACE}; border: 1px solid ${LINE}; border-radius: 16px; box-shadow: ${SHADOW}; display: flex; align-items: center; gap: 14px; padding: 0 22px;">
    <div style="width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid ${ACCENT}; display: flex; align-items: center; justify-content: center; font-family: ${HEAD}; font-size: 14px; font-weight: 600; color: ${ACCENT}; flex-shrink: 0;">${n}</div>
    <div style="display: flex; flex-direction: column; gap: 2px;">
      <div style="font-family: ${HEAD}; font-size: 19px; font-weight: 600; color: ${INK}; line-height: 1.1;">${label}</div>
      ${sub ? `<div style="font-size: 11.5px; color: ${INK_FAINT};">${sub}</div>` : ""}
    </div>
  </div>`,
    )
    .join("\n  ")}
  <div style="position: absolute; left: 496px; top: 322px; width: 138px; text-align: right; font-size: 12.5px; font-weight: 600; color: ${ACCENT};">aptitude</div>
  <div style="position: absolute; left: 992px; top: 322px; width: 138px; text-align: left; font-size: 12.5px; font-weight: 600; color: ${ACCENT};">valeur</div>
  <div style="position: absolute; left: 530px; top: 364px; width: 220px; height: 38px; background: ${INK}; border-radius: 999px; display: flex; align-items: center; justify-content: center;"><span style="font-size: 13.5px; font-weight: 600; color: ${CHARTREUSE};">aptitude + valeur</span></div>
  <div style="position: absolute; left: 490px; top: 432px; width: 300px; height: 76px; background: ${SURFACE}; border: 1px solid ${LINE}; border-radius: 16px; box-shadow: ${SHADOW}; display: flex; align-items: center; gap: 14px; padding: 0 22px;">
    <div style="width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid ${ACCENT}; display: flex; align-items: center; justify-content: center; font-family: ${HEAD}; font-size: 14px; font-weight: 600; color: ${ACCENT}; flex-shrink: 0;">4</div>
    <div style="font-family: ${HEAD}; font-size: 19px; font-weight: 600; color: ${INK};">Priorisation</div>
  </div>
  <div style="position: absolute; left: 490px; top: 538px; width: 300px; height: 76px; background: ${CHARTREUSE}; border-radius: 16px; box-shadow: ${SHADOW_LG}; display: flex; align-items: center; gap: 14px; padding: 0 22px;">
    <div style="width: 30px; height: 30px; border-radius: 50%; background: ${INK}; display: flex; align-items: center; justify-content: center; font-family: ${HEAD}; font-size: 14px; font-weight: 600; color: ${CHARTREUSE}; flex-shrink: 0;">5</div>
    <div style="font-family: ${HEAD}; font-size: 19px; font-weight: 600; color: ${INK};">Feuille de route</div>
  </div>
  <div style="position: absolute; left: 148px; top: 586px; width: 320px; text-align: center; font-size: 12.5px; font-weight: 600; color: ${CORAL};">réévalue le contexte</div>`;

// ------------------------------------------------------------------- sortie

mkdirSync(__dirname, { recursive: true });

const PAGES = [
  { id: "page-1", name: "Ouverture", range: [1, 2] },
  { id: "page-2", name: "Le problème", range: [3, 6] },
  { id: "page-3", name: "La méthode", range: [7, 15] },
  { id: "page-4", name: "Cas illustratif", range: [16, 25] },
  { id: "page-5", name: "Aujourd'hui & suite", range: [26, 31] },
];

const artboards = [];
SLIDES.forEach((s, i) => {
  const n = i + 1;
  writeFileSync(join(__dirname, `${s.file}.dc.html`), s.build(), "utf8");
  const pg = PAGES.find((p) => n >= p.range[0] && n <= p.range[1]);
  const idxInPage = n - pg.range[0];
  const col = idxInPage % 3;
  const row = Math.floor(idxInPage / 3);
  artboards.push({ file: `${s.file}.dc.html`, x: col * 1400, y: row * 880, w: 1280, h: 720, title: s.title, page: pg.id });
});

writeFileSync(
  join(__dirname, "canvas.json"),
  JSON.stringify(
    {
      artboards,
      pages: PAGES.map((p) => ({ id: p.id, name: p.name })),
      launch: { view: "canvas", page: "page-1" },
    },
    null,
    2,
  ),
  "utf8",
);

console.log(`${SLIDES.length} artboards + canvas.json écrits`);
