-- CADRAN — facturation à la personne de tous les sièges d'une organisation.
-- À exécuter dans l'éditeur SQL de votre projet Supabase.
--
-- Contexte : tous les forfaits payants (Essentiel, Croissance, Entreprise) sont facturés
-- par utilisateur, pas en montant fixe par organisation — le prix par siège baisse aux
-- paliers supérieurs (volume), mais c'est bien un prix à la personne. Le rôle "Spectateur"
-- (viewer, lecture seule, déjà en place depuis 0006) est un siège à part, moins cher, ajouté
-- à la même organisation payante plutôt qu'une organisation distincte.
--
-- Ces deux colonnes mémorisent le nombre de sièges actuellement facturés dans Stripe pour
-- chaque catégorie (éditeurs = owner + member ; spectateurs = viewer), pour que
-- syncSeatBilling() (src/lib/supabase/seatBilling.ts) sache s'il y a un écart à corriger
-- sans avoir à interroger Stripe à chaque chargement de page.

alter table public.organization_billing
  add column if not exists editor_seats_billed integer not null default 0;

alter table public.organization_billing
  add column if not exists viewer_seats_billed integer not null default 0;
