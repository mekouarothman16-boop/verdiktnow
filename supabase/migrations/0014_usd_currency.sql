-- Remplace le MAD par le USD comme deuxième devise supportée (CAD reste la devise par défaut).
-- Convertit d'abord les éventuels processus existants en MAD vers CAD (aucune conversion de taux de
-- change n'est appliquée aux montants ROI déjà saisis) avant de resserrer la contrainte, pour que la
-- migration ne bloque pas sur des données existantes.

update public.processes set currency = 'CAD' where currency = 'MAD';

alter table public.processes drop constraint if exists processes_currency_check;
alter table public.processes add constraint processes_currency_check check (currency in ('CAD', 'USD'));
