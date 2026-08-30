# CADRAN — Brief de développement (V1)

Outil-méthode SaaS pour **évaluer et prioriser l'automatisation des processus, un processus à la fois**. Ce document accompagne le prototype `cadran.jsx`, qui reste la **source de vérité** pour le texte exact des questions, les libellés et le design. Le nom « CADRAN » est un placeholder.

---

## 1. Concept

Trois modules complémentaires gravitent autour d'un **processus unique** identifié en haut de l'application :

1. **Aptitude** (diagnostic pondéré) — dans quelle mesure ce processus se prête à l'automatisation.
2. **ROI** — la valeur économique d'automatiser ce processus.
3. **Priorisation** — croisement Valeur × Aptitude → verdict de priorité.

Modèle **freemium** : diagnostic gratuit ; ROI, priorisation et portefeuille en Pro.

---

## 2. Modèles et logique de calcul

Le prototype contient deux fonctions pures — `diagnosticResult()` et `roiResult()` — qui sont le cœur métier à porter tel quel.

### 2.1 Aptitude (diagnostic)

- **Contexte** : 6 questions à réponse libre (description, systèmes, intervenants, irritants, exceptions, contraintes) + analyse IA optionnelle (section 3).
- **5 leviers, 25 énoncés**, échelle 0–4 (0 = pas du tout, 4 = totalement).
- **Double pondération** : chaque énoncé a un poids `w` (0,5–2) dans son levier ; chaque levier a un poids `W` (défaut ci-dessous, ajustable 0–40, normalisé en % à l'affichage).

Poids de leviers par défaut : Standardisation & stabilité 25, Règles & décisions 22, Données & intrants 20, Volume & répétitivité 18, Faisabilité technique 15.

Formules :
- Score d'un levier = `round( Σ(aᵢ·wᵢ) / Σ(4·wᵢ) · 100 )` sur les énoncés répondus.
- Score global (aptitude) = `round( Σ(scoreₗ·Wₗ) / Σ Wₗ )` sur les leviers ayant au moins une réponse.
- Paliers 1–5 : `min(4, floor(overall/20))` → Peu adapté / Adaptation limitée / Candidat modéré / Bon candidat / Candidat idéal.

### 2.2 ROI

Entrées : volume/mois, temps manuel/occurrence (min), coût horaire chargé, taux d'erreur (%), reprise/erreur (min), part automatisable (%), coût de mise en œuvre, licence/an, taux d'actualisation (%).

Formules (annuelles) :
- `occYr = volume × 12`
- `currentH = occYr×minutes/60 + occYr×(errorRate/100)×reworkMin/60`
- `savedH = currentH × autoRate/100`
- `laborSavings = savedH × hourlyCost`
- `netRecurring = laborSavings − licenseCost`
- `fte = savedH / 1600`  *(heures productives/an — constante calibrable)*
- `payback = implCost / (netRecurring/12)` en mois, `null` si netRecurring ≤ 0
- `npv = −implCost + Σ_{y=1..3} netRecurring / (1+discount)^y`
- **Score de valeur (0–100)** — alimente la priorisation :
  - si `netRecurring ≤ 0` → 5
  - sinon `paybackScore = clamp(round(100 − (payback−3)×3.2), 10, 100)`
  - `magnitudeScore = clamp(round(100×netRecurring/120000), 5, 100)` *(120 000 = valeur de référence, calibrable)*
  - `valueScore = round(0.55×paybackScore + 0.45×magnitudeScore)`

Les deux constantes calibrables (1600 h/ETP et 120 000 de référence) devraient être paramétrables au niveau du compte.

### 2.3 Priorisation

Matrice **Valeur (X) × Aptitude (Y)**, seuil à 50 sur chaque axe :
- A ≥ 50 et V ≥ 50 → **Automatiser en priorité**
- A ≥ 50 et V < 50 → **Planifier**
- A < 50 et V ≥ 50 → **Préparer le terrain**
- sinon → **Écarter pour l'instant**

En V1, un point = le processus courant. Le **portefeuille** (plusieurs processus sur la même matrice) est l'extension naturelle une fois la persistance en place.

---

## 3. Fonction IA — analyse du contexte

Le bouton « Analyser le contexte » envoie les réponses libres à un modèle qui renvoie un JSON : `synthese`, `risques[]`, `scores{}` (0–4 par énoncé), `leviers{}` (justification par levier). L'utilisateur peut appliquer ces scores comme point de départ, puis ajuster.

**En production — point critique :** le prototype utilise l'appel intégré aux artefacts (sans clé). Dans le site réel, cet appel doit passer par une **route serveur** (`/api/analyze`) utilisant la clé `ANTHROPIC_API_KEY` côté serveur — **jamais exposée au client**. Prévoir : validation/clamp du JSON retourné, limite de débit par utilisateur, et suivi des coûts (fonction potentiellement réservée au Pro).

---

## 4. Design system (à conserver)

- Palette claire corporate : fond `#FAFAF8`, surfaces blanches, accent spruce `#0C6E5A` / profond `#084A3D` / tint `#EAF3F0`, encres `#10201B` / `#5B655F` / `#9AA19B`, lignes `#EAEBE7`. Couleurs de paliers : coral `#D0654A`, amber `#DCA13A`, olive `#8AA23F`, teal `#3E9B7E`, spruce `#0C6E5A`.
- Typographie : **Hanken Grotesk** (interface) + **IBM Plex Mono** (chiffres, libellés instrument).
- Élément signature : le **cadran semi-circulaire** du score d'aptitude.
- Cartes : coins 12px, ombre douce, hairlines 1px. Curseurs et boutons segmentés déjà stylés dans le prototype.

---

## 5. Stack recommandé

- **Next.js (App Router) + TypeScript**, déploiement Vercel.
- **Tailwind** ou conservation des tokens actuels en CSS-in-JS (au choix de l'équipe ; les tokens sont déjà centralisés dans l'objet `t`).
- **Supabase** : auth, Postgres, RLS, storage.
- **Stripe** : abonnements Pro.
- **SDK Anthropic** côté serveur pour l'analyse IA.

---

## 6. Modèle de données (esquisse)

- `profiles` — lié à l'auth Supabase, plan (`free` / `pro`), constantes calibrables.
- `processes` — `id`, `user_id`, `name`, `currency`, `created_at`, `updated_at`.
- `assessments` — `process_id`, `context` (jsonb), `answers` (jsonb), `weights` (jsonb), `aptitude_score`, `ai_analysis` (jsonb, nullable).
- `roi_inputs` — `process_id`, `inputs` (jsonb), `value_score`, dérivés en cache.

RLS : chaque utilisateur ne voit que ses propres processus.

---

## 7. Périmètre V1 (par phases)

**Phase 1 — MVP fonctionnel**
- Authentification (Supabase).
- Créer / nommer / lister ses processus.
- Module Aptitude complet : contexte, analyse IA (route serveur), 25 énoncés, double pondération, cadran.
- Module ROI complet.
- Module Priorisation (matrice mono-processus).
- Sauvegarde et rechargement d'une évaluation.
- Vue portefeuille : liste des processus évalués + matrice agrégée.
- Export PDF (impression navigateur en V1).

**Phase 2 — Commercialisation**
- Stripe + verrouillage freemium (ROI / priorisation / portefeuille en Pro).
- Export PDF soigné (rendu serveur, marque).
- Constantes calibrables au niveau du compte, affinements UX.

---

## 8. Démarrage dans Claude Code

Apporter ce brief **et** `cadran.jsx` (référence de logique et de design). Prompt de départ suggéré :

> Initialise un projet Next.js (App Router, TypeScript, Tailwind) nommé « cadran ». Mets en place l'authentification Supabase et le schéma de la section 6 du brief avec RLS. Porte la logique de scoring des fonctions `diagnosticResult` et `roiResult` du fichier `cadran.jsx` fourni, sans en changer les formules. Recrée les trois modules (Aptitude, ROI, Priorisation) en conservant le design system. Ajoute une route serveur `/api/analyze` pour l'analyse IA (clé côté serveur uniquement). Commence par la Phase 1 du brief ; on ajoutera Stripe ensuite.

---

*Rappel stratégique évoqué en amont : si la formation/méthode sous-jacente a été développée dans un cadre institutionnel, clarifier la propriété intellectuelle avant toute commercialisation via l'entité privée.*
