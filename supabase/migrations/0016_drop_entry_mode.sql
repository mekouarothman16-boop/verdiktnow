-- Retour en arrière sur 0015 : la fonctionnalité "tâche spécifique" a été construite sans
-- validation utilisateur (aucun prospect, aucune inscription au moment de la conception) et est
-- retirée du produit. Cette colonne n'est plus lue par aucun code applicatif.
alter table public.processes drop column if exists entry_mode;
