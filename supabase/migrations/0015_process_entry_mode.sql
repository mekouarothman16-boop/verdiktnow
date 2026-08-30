-- Mode d'entrée choisi à la création : "process" (processus complet, déroulement connu) ou
-- "task" (tâche spécifique isolée, contexte allégé). Même moteur de diagnostic et de calcul
-- dans les deux cas — seul le formulaire de contexte initial s'adapte.
alter table public.processes add column if not exists entry_mode text not null default 'process' check (entry_mode in ('process', 'task'));
