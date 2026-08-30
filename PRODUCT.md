# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Deux profils d'utilisateurs primaires :
- Leaders internes (opérations, transformation, TI) au sein de PME et d'entreprises, qui évaluent l'automatisation de leurs propres processus.
- Consultants en automatisation et fournisseurs RPA/IA qui utilisent VerdiktNow comme outil de diagnostic et de vente auprès de leurs clients.

## Product Purpose

VerdiktNow diagnostique l'aptitude d'un processus métier à l'automatisation, chiffre sa valeur économique (ROI), le priorise dans un portefeuille, et produit une feuille de route et un rapport PDF partageable. Le succès se mesure par la production d'un dossier d'affaires défendable, assez rigoureux pour être présenté à une direction financière ou un comité de gouvernance.

## Positioning

Deux axes que VerdiktNow peut honnêtement revendiquer, qu'un outil freemium générique ne peut pas copier sans effort équivalent :
- Rigueur financière et gouvernance : VAN sur 5 ans, analyse de sensibilité (tornade), scénarios, registre de risques, matrice RACI, checklist de conformité — dérivés automatiquement des réponses, pas du texte générique.
- Rapidité par rapport à un mandat de conseil : un dossier d'affaires défendable en une session, plutôt qu'en semaines d'entretiens et de livrables consultants.

## Operating Context

Un porteur de processus (ou un consultant en son nom) remplit un diagnostic structuré (contexte qualitatif + 30 énoncés pondérés sur 6 leviers), configure les paramètres de ROI, obtient un score de priorisation, une feuille de route en 3 phases, puis exporte ou partage un rapport PDF ou un lien en lecture seule avec les parties prenantes (direction, TI, conformité). Les organisations à plusieurs membres peuvent inviter des collègues (rôles propriétaire/membre/lecteur), collecter un second avis indépendant sur le même diagnostic, et calibrer les constantes financières (heures/ETP, seuil « économie élevée », seuil de priorisation) à l'échelle de l'organisation.

## Capabilities and Constraints

- Diagnostic pondéré à 6 leviers (standardisation, règles, données, volume, faisabilité technique, risque & gouvernance), avec plafonds contextuels déterministes qui corrigent une auto-évaluation trop optimiste — jamais à la hausse.
- Analyse IA optionnelle du contexte qualitatif (Claude, côté serveur, quota mensuel par palier), qui propose des scores de départ et des paramètres de ROI sans jamais inventer de faits absents du contexte.
- Modèle de ROI : économies main-d'œuvre, coûts de mise en œuvre/licence/conduite du changement, facteur de réalisation des économies (poste réduit / heures réaffectées / aucun changement), VAN 5 ans, scénarios, sensibilité.
- Matrice de priorisation Valeur × Aptitude, seuil ajustable par organisation.
- Feuille de route générée (immédiat + 3 phases), suivie comme liste de tâches avec échéances, RACI, registre de risques, checklist de conformité, sélection de fournisseurs indicative.
- Portefeuille multi-processus : totaux agrégés par devise, badges de similarité, avertissement de dépendance entre processus, comparaison côte à côte, import/export CSV.
- Bilingue FR/EN complet (interface, PDF, routage par locale) ; devise CAD/USD découplée de la langue d'affichage.
- Palier gratuit (1 processus) + paliers payants Stripe (Essentiel/Croissance/Entreprise) ; export PDF réservé aux paliers payants.
- Le pipeline PDF (`@react-pdf/renderer`) définit ses couleurs et polices séparément du CSS web (objets `COLOR`/`FONT` codés en dur dans `ReportDocument.tsx`/`SummaryDocument.tsx`) — toute évolution de la palette ou de la typographie web doit être répercutée séparément côté PDF.

## Brand Commitments

Nom : VerdiktNow (anciennement CADRAN — renommé pour la mise en marché après que la recherche de domaine ait révélé plusieurs produits actifs déjà nommés « Cadran »). Élément signature conservé malgré le changement de nom : le cadran semi-circulaire du score d'aptitude — un clin d'œil à l'ancien nom qui reste pertinent, puisque l'élément est bel et bien un cadran. Palette « Feu Vert » (fond gris-vert clair #e9ecea, encre #091315, accent chartreuse vif #d7ff53 en remplissage uniquement), typographie Outfit (titres) + Inter (texte courant) sur le web — direction visuelle adoptée du gabarit ERPSAA (erpsaas.framer.website) sur décision explicite du fondateur, remplaçant l'ancienne identité « instrument de précision ».

## Evidence on Hand

Aucun client réel, témoignage ou donnée de validation marché à ce jour — produit en développement solo, sans preuve de traction à documenter. Un rapport d'exemple statique existe (généré à partir d'un cas fictif) et sert de démonstration sur le site vitrine. Ne rien inventer au-delà de ces faits.

## Product Principles

- La transparence des hypothèses prime sur l'apparence de précision : chaque chiffre affiché explique d'où il vient et à quel point il est incertain.
- Un plafond ou un avertissement dérivé du contexte déclaré corrige toujours vers le bas, jamais vers le haut — aucun mécanisme ne peut flatter artificiellement un score.
- Le produit reste utilisable et honnête au palier gratuit ; les paliers payants ajoutent de la portée (IA, PDF, portefeuille), jamais de l'intégrité de calcul.
- Bilingue par défaut, jamais un français traduit après coup ni un anglais approximatif.

## Accessibility & Inclusion

Aucune exigence spécifique confirmée à ce jour au-delà des standards web usuels (focus visible, contraste, réduction de mouvement déjà en place dans le CSS).
