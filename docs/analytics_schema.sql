-- ============================================================================
-- TABLE ANALYTICS_VISITORS - MESURE AUDIENCE & BOOSTS SPONSORISÉS EBP
-- Solution 100% Gratuite (0 FCFA) - Règle Machine Unique (1 Appareil = 1 Compte)
-- ============================================================================
-- Exécutez ce script dans Supabase Dashboard > SQL Editor > New query > Run

create extension if not exists "uuid-ossp";

create table if not exists public.analytics_visitors (
  id uuid primary key default uuid_generate_v4(),
  visitor_id text not null unique,
  device_type text not null default 'desktop' check (device_type in ('mobile', 'desktop', 'tablet')),
  operating_system text,
  browser text,
  utm_source text default 'direct',
  utm_medium text default 'none',
  utm_campaign text default 'organic',
  utm_term text,
  utm_content text,
  page_path text not null default '/',
  referrer text,
  visits_count integer not null default 1,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Index pour optimiser les performances du tableau de bord Admin
create index if not exists idx_analytics_created on public.analytics_visitors(created_at desc);
create index if not exists idx_analytics_visitor_id on public.analytics_visitors(visitor_id);
create index if not exists idx_analytics_utm_source on public.analytics_visitors(utm_source);
create index if not exists idx_analytics_utm_campaign on public.analytics_visitors(utm_campaign);
create index if not exists idx_analytics_device on public.analytics_visitors(device_type);

-- Activation de la Row Level Security (RLS)
alter table public.analytics_visitors enable row level security;

-- Politique : autoriser les visiteurs (clé anon publique) à insérer leur machine unique
drop policy if exists "Autoriser insertion analytics anonyme" on public.analytics_visitors;
create policy "Autoriser insertion analytics anonyme"
  on public.analytics_visitors
  for insert
  with check (true);

-- Politique : autoriser la mise à jour (pour actualiser visits_count et last_seen)
drop policy if exists "Autoriser mise a jour analytics" on public.analytics_visitors;
create policy "Autoriser mise a jour analytics"
  on public.analytics_visitors
  for update
  using (true)
  with check (true);

-- Politique : autoriser la lecture des métriques pour le tableau de bord
drop policy if exists "Autoriser lecture analytics" on public.analytics_visitors;
create policy "Autoriser lecture analytics"
  on public.analytics_visitors
  for select
  using (true);
