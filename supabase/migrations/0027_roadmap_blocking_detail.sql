alter table public.roadmap_progress add column if not exists blocking_detail text;
alter table public.roadmap_progress add column if not exists blocking_resolution text;
