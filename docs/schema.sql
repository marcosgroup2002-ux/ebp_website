-- ============================================================================
-- SCHÉMA SUPABASE : EBP Admin
-- ============================================================================
-- À exécuter dans l'éditeur SQL de Supabase (Project > SQL Editor > New query).
-- Reprend les tables demandées (Apprenants, Paiements, Checklists,
-- Utilisateurs) + les politiques RLS par rôle (Secrétaire, Formateur,
-- Manager, Promoteur).
--
-- Approche : `profiles` étend la table `auth.users` fournie par Supabase Auth
-- (c'est le pattern standard documenté par Supabase pour stocker un rôle par
-- utilisateur) plutôt qu'une table `utilisateurs` séparée.

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- PROFILS (= "Utilisateurs" avec rôle), liés aux comptes Supabase Auth
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nom text not null,
  role text not null check (role in ('secretaire', 'formateur', 'manager', 'promoteur')),
  created_at timestamptz default now()
);

-- Crée automatiquement un profil vide à la création d'un compte ; à compléter
-- ensuite (nom, rôle) depuis un écran d'administration.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nom, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'nom', new.email), 'secretaire');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- APPRENANTS
-- ----------------------------------------------------------------------------
create table apprenants (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  cohorte text not null,
  option_paiement text not null check (option_paiement in ('echelonne', 'bloc')),
  total numeric not null,
  statut text not null default 'a_jour' check (statut in ('a_jour', 'en_retard', 'suspendu', 'solde')),
  prochaine_echeance date,
  created_at timestamptz default now()
);

create index idx_apprenants_cohorte on apprenants(cohorte);

-- ----------------------------------------------------------------------------
-- PAIEMENTS (historique des versements, Playbook 3.2 / 3.4)
-- ----------------------------------------------------------------------------
create table paiements (
  id uuid primary key default uuid_generate_v4(),
  apprenant_id uuid not null references apprenants(id) on delete cascade,
  montant numeric not null check (montant > 0),
  mode text not null check (mode in ('Mobile Money', 'Espèces', 'Virement')),
  date_paiement date not null default current_date,
  enregistre_par uuid references profiles(id),
  created_at timestamptz default now()
);

create index idx_paiements_apprenant on paiements(apprenant_id);

-- ----------------------------------------------------------------------------
-- CHECKLISTS (Playbook 3.7, 5.7, 7.2) : une ligne par item coché
-- ----------------------------------------------------------------------------
create table checklist_entries (
  id uuid primary key default uuid_generate_v4(),
  checklist text not null check (checklist in ('secretaire', 'onboarding', 'formateur_avant', 'formateur_apres')),
  item_index integer not null,
  apprenant_id uuid references apprenants(id),
  utilisateur_id uuid not null references profiles(id),
  coche boolean not null default true,
  horodatage timestamptz not null default now()
);

create index idx_checklist_entries_checklist on checklist_entries(checklist, item_index);

-- ----------------------------------------------------------------------------
-- ALERTES MANAGER (signalement "apprenant en difficulté", Playbook 5.7)
-- ----------------------------------------------------------------------------
create table alertes_manager (
  id uuid primary key default uuid_generate_v4(),
  apprenant_id uuid references apprenants(id),
  note text,
  signale_par uuid references profiles(id),
  resolu boolean default false,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- ARTICLES DE BLOG (blog_posts)
-- ----------------------------------------------------------------------------
create table blog_posts (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  excerpt text,
  category text not null default 'Méthode',
  read_time text not null default '5 min',
  date text not null default to_char(current_date, 'DD TMMonth YYYY'),
  sections jsonb not null default '[]'::jsonb,
  cover_image text,
  published boolean not null default true,
  author_id uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_blog_posts_slug on blog_posts(slug);
create index idx_blog_posts_published on blog_posts(published);
create index idx_blog_posts_category on blog_posts(category);

-- ============================================================================
-- ROW LEVEL SECURITY : accès par rôle
-- ============================================================================
alter table profiles enable row level security;
alter table apprenants enable row level security;
alter table paiements enable row level security;
alter table checklist_entries enable row level security;
alter table alertes_manager enable row level security;
alter table blog_posts enable row level security;

-- Chacun peut lire son propre profil
create policy "Lecture de son propre profil"
  on profiles for select
  using (auth.uid() = id);

-- Secrétaire, Manager, Promoteur : accès complet aux apprenants
create policy "Secrétaire/Manager/Promoteur gèrent les apprenants"
  on apprenants for all
  using (exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role in ('secretaire', 'manager', 'promoteur')
  ));

-- Formateur : lecture seule sur les apprenants
create policy "Formateur lit les apprenants"
  on apprenants for select
  using (exists (
    select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'formateur'
  ));

-- Secrétaire, Manager, Promoteur : accès complet aux paiements
create policy "Secrétaire/Manager/Promoteur gèrent les paiements"
  on paiements for all
  using (exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role in ('secretaire', 'manager', 'promoteur')
  ));

-- Checklists : tout utilisateur connecté peut cocher (insert) en son propre nom
create policy "Un utilisateur coche en son propre nom"
  on checklist_entries for insert
  with check (auth.uid() = utilisateur_id);

-- Checklists : lecture ouverte à toute l'équipe connectée (traçabilité/audit)
create policy "Équipe connectée lit les checklists"
  on checklist_entries for select
  using (auth.role() = 'authenticated');

-- Alertes Manager : formateur peut créer une alerte
create policy "Formateur crée une alerte"
  on alertes_manager for insert
  with check (exists (
    select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'formateur'
  ));

-- Alertes Manager : Manager et Promoteur peuvent lire/traiter les alertes
create policy "Manager/Promoteur gèrent les alertes"
  on alertes_manager for select
  using (exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role in ('manager', 'promoteur')
  ));

create policy "Manager/Promoteur mettent à jour les alertes"
  on alertes_manager for update
  using (exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role in ('manager', 'promoteur')
  ));

-- Blog : lecture publique pour les articles publiés
create policy "Tout le monde peut lire les articles publiés"
  on blog_posts for select
  using (published = true);

-- Blog : l'équipe admin (manager, promoteur, secrétaire) gère les articles
create policy "Équipe admin gère les articles de blog"
  on blog_posts for all
  using (exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role in ('manager', 'promoteur', 'secretaire')
  ));

