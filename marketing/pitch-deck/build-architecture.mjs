// Deck technique : comment VerdiktNow fonctionne, et ce qui reste à faire
// avant le lancement.
//
//   cd marketing/pitch-deck && node build-architecture.mjs
//
// Vit ici plutôt que dans son propre dossier pour réutiliser le pptxgenjs déjà
// installé et la charte de build.mjs : les deux decks doivent se ressembler.
//
// Chiffres relevés dans le dépôt le 2026-09-05, pas estimés. Si le schéma ou
// les services changent, relever à nouveau avant de rediffuser.

import pptxgen from "pptxgenjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Charte reprise de build.mjs pour que les deux présentations soient de la
// même famille. Couleurs sans dièse : pptxgenjs corrompt le fichier sinon.
const BG = "E9ECEA";
const SURFACE = "FFFFFF";
const INK = "091315";
const INK_SOFT = "686464";
const INK_FAINT = "6D7373";
const LINE = "D7DBD8";
const ACCENT = "55631A";
const ACCENT_DEEP = "3D4712";
const CHARTREUSE = "D7FF53";
const CORAL = "C45033";
const AMBER = "9A6C1B";
const TEAL = "348269";
const T_SKY = "DFEAF2";
const T_SAND = "F7EFDC";
const T_CLAY = "F9E5DD";
const T_SAGE = "DFECE5";
const T_LIME = "F2FFD9";

const HEAD_FONT = "Segoe UI Semibold";
const BODY_FONT = "Segoe UI";

const SLIDE_W = 13.33;
const SLIDE_H = 7.5;
const M = 0.7;

const OUT_DIR = join(homedir(), "OneDrive", "Documents", "Présentation VerdiktNow");
const OUT_FILE = join(OUT_DIR, "VerdiktNow - Architecture technique.pptx");

const pptx = new pptxgen();
pptx.defineLayout({ name: "VN", width: SLIDE_W, height: SLIDE_H });
pptx.layout = "VN";
pptx.author = "VerdiktNow";
pptx.title = "VerdiktNow — Architecture technique";

// pptxgenjs convertit les objets d'options en EMU au premier usage et les
// mute sur place : chaque appel doit recevoir un objet neuf.
const shadow = () => ({ type: "outer", color: "091315", opacity: 0.08, blur: 12, offset: 3, angle: 90 });

function slide({ eyebrow, title, sub }) {
  const s = pptx.addSlide();
  s.background = { color: BG };
  if (eyebrow) {
    s.addShape(pptx.ShapeType.rect, { x: M, y: 0.52, w: 0.3, h: 0.028, fill: { color: ACCENT } });
    s.addText(eyebrow.toUpperCase(), {
      x: M + 0.42, y: 0.38, w: 8, h: 0.3, isTextBox: true, margin: 0,
      fontFace: BODY_FONT, fontSize: 10, bold: true, charSpacing: 2, color: INK_FAINT,
    });
  }
  if (title) {
    s.addText(title, {
      x: M, y: 0.78, w: SLIDE_W - M * 2, h: 0.85, isTextBox: true, margin: 0,
      fontFace: HEAD_FONT, fontSize: 32, color: INK,
    });
  }
  if (sub) {
    s.addText(sub, {
      x: M, y: 1.62, w: 9.6, h: 0.6, isTextBox: true, margin: 0,
      fontFace: BODY_FONT, fontSize: 13, color: INK_SOFT, lineSpacingMultiple: 1.25,
    });
  }
  return s;
}

function card(s, { x, y, w, h, fill = SURFACE, border = LINE }) {
  s.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.14,
    fill: { color: fill }, line: { color: border, width: 1 }, shadow: shadow(),
  });
}

/* ---------------------------------------------------------------- 1. titre */
{
  const s = pptx.addSlide();
  s.background = { color: INK };
  s.addText("Comment VerdiktNow fonctionne", {
    x: M, y: 2.3, w: 10.5, h: 1.5, isTextBox: true, margin: 0,
    fontFace: HEAD_FONT, fontSize: 46, color: "FFFFFF",
  });
  s.addText("Architecture technique, services, et ce qui reste à configurer avant le lancement", {
    x: M, y: 3.85, w: 9, h: 0.7, isTextBox: true, margin: 0,
    fontFace: BODY_FONT, fontSize: 15, color: "C3CBC8", lineSpacingMultiple: 1.3,
  });
  s.addShape(pptx.ShapeType.rect, { x: M, y: 5.05, w: 1.1, h: 0.035, fill: { color: CHARTREUSE } });
  s.addText("Relevé depuis le dépôt le 5 septembre 2026", {
    x: M, y: 5.35, w: 8, h: 0.3, isTextBox: true, margin: 0,
    fontFace: BODY_FONT, fontSize: 11, color: "8E9793",
  });
  s.addNotes("Deck technique destiné au fondateur. Les chiffres sont comptés dans le dépôt, pas estimés.");
}

/* ------------------------------------------------- 2. le système en bref */
{
  const s = slide({
    eyebrow: "Vue d'ensemble",
    title: "Le système en un coup d'œil",
    sub: "Une application Next.js hébergée sur Vercel, une base Postgres chez Supabase, cinq services externes qui font chacun une seule chose.",
  });
  const stats = [
    ["16", "tables"],
    ["27", "migrations"],
    ["57", "politiques d'accès"],
    ["10", "routes API"],
    ["112", "tests"],
    ["2", "langues"],
  ];
  const cw = 1.85, gap = 0.24;
  stats.forEach(([n, label], i) => {
    const x = M + i * (cw + gap);
    card(s, { x, y: 2.65, w: cw, h: 1.5 });
    s.addText(n, {
      x, y: 2.82, w: cw, h: 0.7, isTextBox: true, margin: 0, align: "center",
      fontFace: HEAD_FONT, fontSize: 36, color: ACCENT,
    });
    s.addText(label, {
      x, y: 3.52, w: cw, h: 0.4, isTextBox: true, margin: 0, align: "center",
      fontFace: BODY_FONT, fontSize: 11, color: INK_SOFT,
    });
  });
  s.addText(
    "Le calcul du score, qui est le cœur du produit, ne dépend d'aucun service externe. Il vit entièrement dans le code et il est couvert par les 112 tests.",
    { x: M, y: 4.6, w: 11.9, h: 0.6, isTextBox: true, margin: 0, fontFace: BODY_FONT, fontSize: 13, color: INK_SOFT, lineSpacingMultiple: 1.3 }
  );
}

/* ----------------------------------------------- 3. trajet d'une requête */
{
  const s = slide({
    eyebrow: "Le trajet d'une requête",
    title: "Ce qui se passe entre le clic et l'affichage",
    sub: "Le modèle mental le plus utile : quand une page ne s'affiche pas comme prévu, la question devient « à quelle étape ça a dévié ».",
  });
  const steps = [
    ["1", "Le navigateur demande une adresse", "La requête arrive chez Vercel."],
    ["2", "Le proxy filtre, avant tout le reste", "Mot de passe de pré-lancement, langue, redirection, session."],
    ["3", "Le routeur choisit la page", "[lang] n'accepte que fr et en ; le reste est un vrai 404."],
    ["4", "La page s'assemble sur le serveur", "Elle lit la session et interroge Supabase."],
    ["5", "Postgres décide ce qui est visible", "La base refuse les lignes d'une autre organisation."],
  ];
  const rowH = 0.72, gapY = 0.13;
  steps.forEach(([n, title, desc], i) => {
    const y = 2.5 + i * (rowH + gapY);
    card(s, { x: M, y, w: 11.9, h: rowH });
    s.addShape(pptx.ShapeType.roundRect, {
      x: M + 0.24, y: y + 0.18, w: 0.36, h: 0.36, rectRadius: 0.1,
      fill: { color: T_LIME }, line: { color: LINE, width: 1 },
    });
    s.addText(n, {
      x: M + 0.24, y: y + 0.22, w: 0.36, h: 0.28, isTextBox: true, margin: 0, align: "center",
      fontFace: HEAD_FONT, fontSize: 12, color: ACCENT_DEEP,
    });
    s.addText(title, {
      x: M + 0.78, y: y + 0.13, w: 4.6, h: 0.3, isTextBox: true, margin: 0,
      fontFace: HEAD_FONT, fontSize: 13, color: INK,
    });
    s.addText(desc, {
      x: M + 5.5, y: y + 0.15, w: 6.2, h: 0.42, isTextBox: true, margin: 0,
      fontFace: BODY_FONT, fontSize: 11, color: INK_SOFT, lineSpacingMultiple: 1.2,
    });
  });
  s.addText("Les adresses /api et les fichiers statiques sautent l'étape 2 : un webhook Stripe n'a aucun moyen de fournir un mot de passe.", {
    x: M, y: 6.75, w: 11.9, h: 0.4, isTextBox: true, margin: 0,
    fontFace: BODY_FONT, fontSize: 11, italic: true, color: INK_FAINT,
  });
}

/* ------------------------------------------------------- 4. les services */
{
  const s = slide({
    eyebrow: "Les six services",
    title: "Qui fait quoi, et ce qui casse sans lui",
  });
  const svc = [
    ["Supabase", T_SAGE, "Base Postgres, authentification, stockage des logos.", "Sans lui : le site bascule en mode vitrine, personne ne se connecte."],
    ["Stripe", T_SAND, "Abonnements et paiements. Quatre événements écoutés.", "Sans lui : les comptes existants marchent, aucun nouvel abonnement."],
    ["API Anthropic", T_SKY, "claude-haiku-4-5 propose un point de départ au diagnostic.", "Sans lui : seule l'analyse assistée tombe. C'est une aide, pas un socle."],
    ["Resend", T_CLAY, "Invitations et récapitulatif hebdomadaire de feuille de route.", "Sans lui : plus aucun courriel ne part."],
    ["Sentry", T_LIME, "Collecte les erreurs, côté navigateur et côté serveur.", "Sans lui : rien ne casse, mais les pannes deviennent invisibles."],
    ["Vercel", "EDEEEC", "Héberge l'application et déclenche la tâche du lundi 13 h UTC.", "Sans lui : il n'y a plus de site. Seule dépendance sans repli."],
  ];
  const cw = 3.8, ch = 2.0, gx = 0.25, gy = 0.24;
  svc.forEach(([name, tint, role, fail], i) => {
    const x = M + (i % 3) * (cw + gx);
    const y = 2.05 + Math.floor(i / 3) * (ch + gy);
    card(s, { x, y, w: cw, h: ch });
    s.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.28, y: y + 0.26, w: 0.9, h: 0.26, rectRadius: 0.12, fill: { color: tint }, line: { color: LINE, width: 1 },
    });
    s.addText(name, {
      x: x + 0.28, y: y + 0.62, w: cw - 0.56, h: 0.32, isTextBox: true, margin: 0,
      fontFace: HEAD_FONT, fontSize: 15, color: INK,
    });
    s.addText(role, {
      x: x + 0.28, y: y + 0.98, w: cw - 0.56, h: 0.5, isTextBox: true, margin: 0,
      fontFace: BODY_FONT, fontSize: 10.5, color: INK_SOFT, lineSpacingMultiple: 1.2,
    });
    s.addText(fail, {
      x: x + 0.28, y: y + 1.5, w: cw - 0.56, h: 0.42, isTextBox: true, margin: 0,
      fontFace: BODY_FONT, fontSize: 10, color: INK_FAINT, lineSpacingMultiple: 1.2,
    });
  });
}

/* --------------------------------------------------- 5. base de données */
{
  const s = slide({
    eyebrow: "La base de données",
    title: "Seize tables, groupées par rôle",
    sub: "Le schéma s'est construit en 27 migrations numérotées, jouées dans l'ordre.",
  });
  const fam = [
    ["Identité", "profiles · organizations · organization_members · organization_invites", "Qui est qui. Trois rôles : propriétaire, membre, spectateur."],
    ["Processus", "processes · process_comments · process_attachments · process_share_links", "Les processus évalués, commentaires, pièces jointes, liens de partage."],
    ["Évaluation", "assessments · assessment_history · assessment_second_opinions · roi_inputs · weight_profiles", "Réponses, historique, avis croisés, hypothèses de ROI, pondérations."],
    ["Feuille de route", "roadmap_progress", "Responsable, dates, avancement, blocages, statut."],
    ["Facturation et journal", "organization_billing · ai_usage_events · activity_log", "Palier en cours, compteur d'analyses IA, trace des actions."],
  ];
  const rowH = 0.78, gapY = 0.11;
  fam.forEach(([name, tables, desc], i) => {
    const y = 2.35 + i * (rowH + gapY);
    card(s, { x: M, y, w: 11.9, h: rowH });
    s.addText(name, {
      x: M + 0.28, y: y + 0.14, w: 2.3, h: 0.3, isTextBox: true, margin: 0,
      fontFace: HEAD_FONT, fontSize: 12.5, color: INK,
    });
    s.addText(tables, {
      x: M + 0.28, y: y + 0.44, w: 6.6, h: 0.28, isTextBox: true, margin: 0,
      fontFace: "Consolas", fontSize: 8.5, color: ACCENT,
    });
    s.addText(desc, {
      x: M + 7.1, y: y + 0.2, w: 4.5, h: 0.42, isTextBox: true, margin: 0,
      fontFace: BODY_FONT, fontSize: 10.5, color: INK_SOFT, lineSpacingMultiple: 1.2,
    });
  });
  s.addText("Les 57 politiques d'accès vivent dans Postgres, pas dans le code : une requête mal écrite ne peut pas exposer les données d'une autre organisation.", {
    x: M, y: 6.75, w: 11.9, h: 0.4, isTextBox: true, margin: 0,
    fontFace: BODY_FONT, fontSize: 11, italic: true, color: INK_FAINT,
  });
}

/* ---------------------------------------------------------- 6. le score */
{
  const s = slide({
    eyebrow: "Le calcul du score",
    title: "Six leviers pondérés, et rien de caché",
    sub: "La seule partie du produit qui ne dépend d'aucun service externe.",
  });
  const levers = [
    ["Standardisation & stabilité", 22],
    ["Règles & décisions", 20],
    ["Données & intrants", 18],
    ["Volume & répétitivité", 15],
    ["Faisabilité technique", 13],
    ["Risque & gouvernance", 12],
  ];
  card(s, { x: M, y: 2.5, w: 6.4, h: 3.55 });
  levers.forEach(([name, w], i) => {
    const y = 2.82 + i * 0.55;
    s.addText(name, {
      x: M + 0.32, y, w: 3.9, h: 0.26, isTextBox: true, margin: 0,
      fontFace: BODY_FONT, fontSize: 11, color: INK,
    });
    s.addText(`${w} %`, {
      x: M + 4.9, y, w: 1.2, h: 0.26, isTextBox: true, margin: 0, align: "right",
      fontFace: HEAD_FONT, fontSize: 11, color: ACCENT,
    });
    s.addShape(pptx.ShapeType.roundRect, {
      x: M + 0.32, y: y + 0.3, w: 5.78, h: 0.09, rectRadius: 0.045, fill: { color: "E6E9E6" }, line: { color: "E6E9E6", width: 0 },
    });
    s.addShape(pptx.ShapeType.roundRect, {
      x: M + 0.32, y: y + 0.3, w: 5.78 * (w / 22), h: 0.09, rectRadius: 0.045, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 },
    });
  });

  card(s, { x: M + 6.75, y: 2.5, w: 5.15, h: 3.55 });
  s.addText("Du score au verdict", {
    x: M + 7.05, y: 2.8, w: 4.5, h: 0.32, isTextBox: true, margin: 0,
    fontFace: HEAD_FONT, fontSize: 15, color: INK,
  });
  s.addText(
    [
      { text: "Le score d'aptitude, de 0 à 100, tombe dans l'un des cinq niveaux : peu adapté, adaptation limitée, candidat modéré, bon candidat, candidat idéal.", options: { breakLine: true } },
      { text: "", options: { breakLine: true } },
      { text: "Ce score est ensuite croisé avec un score de valeur, issu du calculateur de ROI, sur une matrice à quatre quadrants : automatiser en priorité, planifier, préparer le terrain, écarter.", options: { breakLine: true } },
      { text: "", options: { breakLine: true } },
      { text: "Du quadrant découle une feuille de route en trois phases, générée automatiquement." },
    ],
    { x: M + 7.05, y: 3.25, w: 4.55, h: 2.6, isTextBox: true, margin: 0, fontFace: BODY_FONT, fontSize: 11, color: INK_SOFT, lineSpacingMultiple: 1.35 }
  );
  s.addText("Les six poids totalisent exactement 100. Chaque organisation peut les ajuster ; le score se recalcule en direct.", {
    x: M, y: 6.35, w: 11.9, h: 0.4, isTextBox: true, margin: 0,
    fontFace: BODY_FONT, fontSize: 11, italic: true, color: INK_FAINT,
  });
}

/* ------------------------------------------- 7. BLOQUANTS avant lancement */
{
  const s = slide({
    eyebrow: "Avant le lancement",
    title: "Ce qui bloque, et qu'il faut régler",
    sub: "Relevé dans la configuration actuelle. Chacun de ces points empêche le produit de fonctionner pour un vrai client payant.",
  });
  const items = [
    [
      "Stripe est en mode test",
      "La clé commence par sk_test_, et les prix configurés sont des prix de test.",
      "Basculer sur les clés live, recréer les prix, régénérer le secret du webhook.",
    ],
    [
      "Le tarif annuel renvoie une erreur",
      "La page affiche un choix mensuel / annuel, mais les deux prix annuels n'existent pas. Le client reçoit un refus 503.",
      "Créer STRIPE_PRICE_ESSENTIEL_ANNUEL et STRIPE_PRICE_CROISSANCE_ANNUEL.",
    ],
    [
      "Le siège Spectateur n'est jamais facturé",
      "Il est vendu 20 $ par personne, mais sans prix configuré la facturation l'ignore en silence, avec une simple ligne de journal.",
      "Créer STRIPE_PRICE_VIEWER_SEAT et sa version annuelle.",
    ],
    [
      "Les courriels partent d'un bac à sable",
      "L'expéditeur onboarding@resend.dev est écrit en dur dans src/lib/email.ts et ne livre qu'à ta propre adresse.",
      "Vérifier un domaine chez Resend, puis changer l'expéditeur dans le code.",
    ],
    [
      "L'adresse publique du site est absente",
      "NEXT_PUBLIC_SITE_URL n'est pas définie : les métadonnées retombent sur localhost:3000.",
      "La définir sur le domaine réel, sinon les aperçus de partage pointent en local.",
    ],
    [
      "Le mot de passe de pré-lancement",
      "Le verrou de proxy.ts reste actif tant que SITE_PASSWORD est défini côté Vercel.",
      "Le retirer au lancement, puis supprimer le code du verrou.",
    ],
  ];
  const cw = 5.8, ch = 1.38, gx = 0.3, gy = 0.18;
  items.forEach(([title, obs, action], i) => {
    const x = M + (i % 2) * (cw + gx);
    const y = 2.42 + Math.floor(i / 2) * (ch + gy);
    card(s, { x, y, w: cw, h: ch, fill: "FDF3F0", border: "EBC9BF" });
    s.addShape(pptx.ShapeType.ellipse, { x: x + 0.3, y: y + 0.26, w: 0.15, h: 0.15, fill: { color: CORAL } });
    s.addText(title, {
      x: x + 0.6, y: y + 0.17, w: cw - 0.9, h: 0.28, isTextBox: true, margin: 0,
      fontFace: HEAD_FONT, fontSize: 12, color: INK,
    });
    s.addText(obs, {
      x: x + 0.6, y: y + 0.49, w: cw - 0.9, h: 0.48, isTextBox: true, margin: 0,
      fontFace: BODY_FONT, fontSize: 9.5, color: INK_SOFT, lineSpacingMultiple: 1.15,
    });
    s.addText(action, {
      x: x + 0.6, y: y + 1.0, w: cw - 0.9, h: 0.3, isTextBox: true, margin: 0,
      fontFace: BODY_FONT, fontSize: 9.5, color: CORAL, lineSpacingMultiple: 1.15,
    });
  });
  s.addNotes("Relevé systématique : 17 variables d'environnement attendues par le code, 5 absentes. Quatre d'entre elles sont des identifiants de prix Stripe lus dynamiquement, invisibles à une recherche simple sur process.env.");
}

/* --------------------------------------------- 8. À VÉRIFIER avant lancement */
{
  const s = slide({
    eyebrow: "Avant le lancement",
    title: "Ce qui reste à vérifier",
    sub: "Ces points ne se lisent pas depuis le dépôt : ils dépendent de l'état des services et des tableaux de bord.",
  });
  const items = [
    ["Les 27 migrations sont-elles appliquées ?", "Vérifier qu'aucune ne manque sur la base de production."],
    ["Le crédit de l'API Anthropic", "Un appel a déjà échoué pour solde insuffisant. L'analyse assistée s'arrête sans lui."],
    ["Le webhook Stripe vise-t-il le domaine réel ?", "Une URL restée en tunnel de test n'activera aucun abonnement."],
    ["CRON_SECRET est-il défini côté Vercel ?", "Sans lui, le récapitulatif du lundi est refusé."],
    ["Les réglages du tableau de bord Supabase", "Confirmation de courriel, redirection après connexion, expiration des liens."],
    ["Les douze variables présentes sont-elles dans Vercel ?", "Elles sont configurées en local ; la production est un environnement distinct."],
    ["Aucun robots.txt ni sitemap", "Rien n'indique aux moteurs quoi explorer. À créer avant l'ouverture au public."],
    ["Le contact entreprise est un Gmail personnel", "mekouarothman16@gmail.com s'affiche publiquement sur la page des forfaits."],
  ];
  const cw = 5.8, ch = 1.0, gx = 0.3, gy = 0.16;
  items.forEach(([title, desc], i) => {
    const x = M + (i % 2) * (cw + gx);
    const y = 2.4 + Math.floor(i / 2) * (ch + gy);
    card(s, { x, y, w: cw, h: ch, fill: "FCF7EC", border: "E5D5B6" });
    s.addShape(pptx.ShapeType.ellipse, { x: x + 0.3, y: y + 0.24, w: 0.15, h: 0.15, fill: { color: AMBER } });
    s.addText(title, {
      x: x + 0.6, y: y + 0.16, w: cw - 0.9, h: 0.3, isTextBox: true, margin: 0,
      fontFace: HEAD_FONT, fontSize: 11.5, color: INK,
    });
    s.addText(desc, {
      x: x + 0.6, y: y + 0.5, w: cw - 0.9, h: 0.4, isTextBox: true, margin: 0,
      fontFace: BODY_FONT, fontSize: 9.5, color: INK_SOFT, lineSpacingMultiple: 1.15,
    });
  });
}

/* ------------------------------------------------ 9. ce qui est déjà prêt */
{
  const s = slide({
    eyebrow: "Avant le lancement",
    title: "Ce qui est déjà en place",
    sub: "Pour équilibrer la lecture : ces points sont vérifiés et ne demandent aucune action.",
  });
  const done = [
    ["Les 57 politiques d'accès", "La base refuse elle-même les lignes d'une autre organisation."],
    ["112 tests sur le calcul du score", "Onze fichiers, tous au vert."],
    ["Sentry est configuré", "Organisation, projet et jeton présents : les traces sont envoyées."],
    ["Le rapport exemple est protégé", "Sorti des fichiers publics, servi après contrôle du palier."],
    ["Le site est bilingue de bout en bout", "Dictionnaires typés : une clé oubliée casse la compilation."],
    ["Zéro échec de contraste", "Vérifié sur la page d'accueil, dans les deux langues."],
  ];
  const cw = 5.8, ch = 1.05, gx = 0.3, gy = 0.2;
  done.forEach(([title, desc], i) => {
    const x = M + (i % 2) * (cw + gx);
    const y = 2.5 + Math.floor(i / 2) * (ch + gy);
    card(s, { x, y, w: cw, h: ch, fill: "F0F6F3", border: "C9DFD6" });
    s.addShape(pptx.ShapeType.ellipse, { x: x + 0.3, y: y + 0.24, w: 0.16, h: 0.16, fill: { color: TEAL } });
    s.addText(title, {
      x: x + 0.62, y: y + 0.16, w: cw - 0.95, h: 0.3, isTextBox: true, margin: 0,
      fontFace: HEAD_FONT, fontSize: 12, color: INK,
    });
    s.addText(desc, {
      x: x + 0.62, y: y + 0.5, w: cw - 0.95, h: 0.38, isTextBox: true, margin: 0,
      fontFace: BODY_FONT, fontSize: 10, color: INK_SOFT, lineSpacingMultiple: 1.2,
    });
  });
}

/* --------------------------------------------------- 10. où regarder */
{
  const s = slide({
    eyebrow: "Pour s'y retrouver",
    title: "Où regarder quand quelque chose cloche",
  });
  const rows = [
    ["Une page redirige mal, ou la langue est fausse", "src/proxy.ts"],
    ["Un score paraît faux", "src/lib/scoring.ts, puis les tests à côté"],
    ["Un utilisateur ne voit pas ses données", "les politiques dans supabase/migrations/"],
    ["Un abonnement ne s'active pas", "src/app/api/stripe/webhook/route.ts"],
    ["Le PDF ne se génère pas", "src/lib/pdf/ReportDocument.tsx"],
    ["Une couleur ou un rayon détonne", "DESIGN.md, qui fait autorité"],
  ];
  const rowH = 0.66, gapY = 0.1;
  rows.forEach(([symptom, file], i) => {
    const y = 2.15 + i * (rowH + gapY);
    card(s, { x: M, y, w: 11.9, h: rowH });
    s.addText(symptom, {
      x: M + 0.3, y: y + 0.2, w: 6, h: 0.3, isTextBox: true, margin: 0,
      fontFace: BODY_FONT, fontSize: 12, color: INK,
    });
    s.addText(file, {
      x: M + 6.5, y: y + 0.21, w: 5.1, h: 0.3, isTextBox: true, margin: 0,
      fontFace: "Consolas", fontSize: 10.5, color: ACCENT,
    });
  });
}

/* ------------------------------------------------------------ 11. clôture */
{
  const s = pptx.addSlide();
  s.background = { color: CHARTREUSE };
  s.addText("Six bloquants, huit vérifications", {
    x: M, y: 2.7, w: 10.5, h: 1, isTextBox: true, margin: 0,
    fontFace: HEAD_FONT, fontSize: 40, color: INK,
  });
  s.addText("Cinq des six bloquants se règlent en créant des identifiants de prix ou en changeant une variable. Seul l'expéditeur des courriels demande une modification du code.", {
    x: M, y: 3.9, w: 8.5, h: 0.8, isTextBox: true, margin: 0,
    fontFace: BODY_FONT, fontSize: 14, color: "414D19", lineSpacingMultiple: 1.35,
  });
}

mkdirSync(OUT_DIR, { recursive: true });
await pptx.writeFile({ fileName: OUT_FILE });
console.log("écrit :", OUT_FILE);
