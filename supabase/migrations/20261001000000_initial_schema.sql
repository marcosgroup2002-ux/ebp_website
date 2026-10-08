-- Schéma initial (historique). Les politiques ouvertes ci-dessous sont remplacées par 20261008000000_security_hardening.sql.
create extension if not exists "uuid-ossp";


create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nom text not null,
  role text not null check (role in ('secretaire', 'coach', 'pdg')),
  email text,
  telephone text,
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nom, role, email, telephone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nom', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'secretaire'),
    new.email,
    new.raw_user_meta_data->>'telephone'
  )
  on conflict (id) do update set
    nom = excluded.nom,
    role = excluded.role,
    email = excluded.email,
    telephone = excluded.telephone;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists apprenants (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  centre text not null check (centre in ('Calavi', 'Cotonou')),
  cohorte text not null check (cohorte in ('18.6', '18.7', '18.8')),
  option_paiement text not null check (option_paiement in ('echelonne', 'bloc')),
  total numeric not null default 180000,
  statut text not null default 'a_jour' check (statut in ('a_jour', 'en_retard', 'suspendu', 'solde')),
  prochaine_echeance date,
  created_at timestamptz default now()
);

create index if not exists idx_apprenants_cohorte on apprenants(cohorte);
create index if not exists idx_apprenants_centre on apprenants(centre);
create index if not exists idx_apprenants_statut on apprenants(statut);

create table if not exists paiements (
  id uuid primary key default uuid_generate_v4(),
  apprenant_id uuid not null references apprenants(id) on delete cascade,
  montant numeric not null check (montant > 0),
  mode text not null check (mode in ('Mobile Money', 'Espèces', 'Virement')),
  date_paiement date not null default current_date,
  enregistre_par text default 'Miss Amirath',
  created_at timestamptz default now()
);

create index if not exists idx_paiements_apprenant on paiements(apprenant_id);
create index if not exists idx_paiements_date on paiements(date_paiement);

create table if not exists checklist_entries (
  id uuid primary key default uuid_generate_v4(),
  checklist text not null default 'secretaire',
  item_index integer not null,
  coche boolean not null default true,
  coche_par text not null default 'Miss Amirath',
  horodatage timestamptz not null default now()
);

create index if not exists idx_checklist_lookup on checklist_entries(checklist, item_index);

create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  action text not null,
  details text not null,
  user_name text not null,
  user_role text not null,
  ip_address text,
  location text,
  created_at timestamptz default now()
);

create index if not exists idx_audit_logs_created on audit_logs(created_at desc);
create index if not exists idx_audit_logs_role on audit_logs(user_role);

create table if not exists otp_requests (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  telephone text,
  code text not null,
  statut text not null default 'pending' check (statut in ('pending', 'approved', 'used', 'expired')),
  ip_address text,
  location text,
  created_at timestamptz default now(),
  expires_at timestamptz not null
);

create index if not exists idx_otp_requests_email on otp_requests(email, statut);

create table if not exists coach_schedules (
  id uuid primary key default uuid_generate_v4(),
  coach_name text not null,
  centre text not null check (centre in ('Calavi', 'Cotonou')),
  cohorte text not null check (cohorte in ('18.6', '18.7', '18.8')),
  jour text not null,
  heure_debut text not null,
  heure_fin text not null,
  matiere text not null,
  salle text not null default 'Salle Principale',
  created_at timestamptz default now()
);

create index if not exists idx_schedules_centre_cohorte on coach_schedules(centre, cohorte);

create table if not exists annonces (
  id uuid primary key default uuid_generate_v4(),
  titre text not null,
  contenu text not null,
  auteur text not null default 'Mr Sessou Fernando (PDG)',
  priorite text not null default 'normale' check (priorite in ('normale', 'urgente', 'info')),
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table apprenants enable row level security;
alter table paiements enable row level security;
alter table checklist_entries enable row level security;
alter table audit_logs enable row level security;
alter table otp_requests enable row level security;
alter table coach_schedules enable row level security;
alter table annonces enable row level security;

create policy "Accès complet profiles" on profiles for all using (true) with check (true);
create policy "Accès complet apprenants" on apprenants for all using (true) with check (true);
create policy "Accès complet paiements" on paiements for all using (true) with check (true);
create policy "Accès complet checklist_entries" on checklist_entries for all using (true) with check (true);
create policy "Accès complet audit_logs" on audit_logs for all using (true) with check (true);
create policy "Accès complet otp_requests" on otp_requests for all using (true) with check (true);
create policy "Accès complet coach_schedules" on coach_schedules for all using (true) with check (true);
create policy "Accès complet annonces" on annonces for all using (true) with check (true);

insert into coach_schedules (coach_name, centre, cohorte, jour, heure_debut, heure_fin, matiere, salle)
values
  ('Coach Calavi 1 · Oral Fluency', 'Calavi', '18.6', 'Lundi', '18h30', '20h30', 'Fluency & Spoken English Bootcamp', 'Salle A (Calavi)'),
  ('Coach Calavi 1 · Oral Fluency', 'Calavi', '18.7', 'Mercredi', '18h30', '20h30', 'Fluency & Spoken English Bootcamp', 'Salle A (Calavi)'),
  ('Coach Calavi 2 · Business English', 'Calavi', '18.6', 'Mardi', '18h30', '20h30', 'Business Pitching & Negotiation', 'Salle B (Calavi)'),
  ('Coach Calavi 2 · Business English', 'Calavi', '18.8', 'Jeudi', '18h30', '20h30', 'Professional Communication', 'Salle B (Calavi)'),
  ('Coach Calavi 3 · Grammar & Structure', 'Calavi', '18.7', 'Mardi', '18h30', '20h30', 'Mastering English Structures & Syntax', 'Salle C (Calavi)'),
  ('Coach Calavi 3 · Grammar & Structure', 'Calavi', '18.8', 'Vendredi', '18h30', '20h30', 'Syntax & Idiomatic Expressions', 'Salle C (Calavi)'),
  ('Coach Calavi 4 · Pronunciation & Accent', 'Calavi', '18.6', 'Samedi', '09h00', '12h00', 'Phonetics & Accent Reduction Immersion', 'Salle A (Calavi)'),
  ('Coach Calavi 4 · Pronunciation & Accent', 'Calavi', '18.8', 'Samedi', '14h00', '17h00', 'Phonetics & Accent Reduction Immersion', 'Salle B (Calavi)'),
  ('Coach Cotonou 1 · Executive Speaking', 'Cotonou', '18.6', 'Lundi', '19h00', '21h00', 'Executive Speaking & Boardroom Debates', 'Salle VIP Vedoko'),
  ('Coach Cotonou 1 · Executive Speaking', 'Cotonou', '18.7', 'Jeudi', '19h00', '21h00', 'Executive Presentations & Closing', 'Salle VIP Vedoko'),
  ('Coach Cotonou 2 · Writing & Professional Emailing', 'Cotonou', '18.7', 'Mardi', '19h00', '21h00', 'High-Impact Writing & Negotiations', 'Salle Vedoko 2'),
  ('Coach Cotonou 2 · Writing & Professional Emailing', 'Cotonou', '18.8', 'Vendredi', '19h00', '21h00', 'Professional Correspondence & Contracts', 'Salle Vedoko 2');

insert into annonces (titre, contenu, auteur, priorite)
values (
  'Consignes Pédagogiques · Cohortes Actives 18.6, 18.7 et 18.8',
  'Chers coachs de Calavi et Cotonou, veillez à appliquer rigoureusement le pretest et posttest sur chaque module. Aucune session de retard ne sera tolérée sans accord préalable. Les feuilles de présence doivent être clôturées immédiatement après la séance.',
  'Mr Sessou Fernando (PDG)',
  'urgente'
);
