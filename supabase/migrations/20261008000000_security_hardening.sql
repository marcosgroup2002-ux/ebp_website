-- ============================================================================
-- Durcissement sécurité EBP
-- - Plus aucun accès direct du rôle anon aux tables (hors blog publié)
-- - Lecture par rôle via RLS (profiles.role), écritures uniquement via RPC
--   SECURITY DEFINER qui vérifient le rôle et journalisent l'audit
-- ============================================================================

-- 1. Révocations ------------------------------------------------------------

do $$ declare r record; begin
  for r in select schemaname, tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

drop table if exists public.otp_requests;

-- 2. Contraintes ------------------------------------------------------------

alter table public.apprenants drop constraint if exists apprenants_cohorte_check;
alter table public.apprenants add constraint apprenants_cohorte_check
  check (cohorte ~ '^[0-9]{1,3}\.[0-9]{1,3}$');
alter table public.apprenants drop constraint if exists apprenants_nom_check;
alter table public.apprenants add constraint apprenants_nom_check
  check (char_length(btrim(nom)) between 2 and 80);

alter table public.audit_logs add column if not exists user_id uuid;

-- 3. Profils et rôles -------------------------------------------------------

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, nom, role, email)
  values (new.id, split_part(new.email, '@', 1), 'coach', new.email)
  on conflict (id) do nothing;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.app_role() returns text
language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() $$;
revoke execute on function public.app_role() from public, anon;
grant execute on function public.app_role() to authenticated;

-- 4. Lectures (RLS) ---------------------------------------------------------

grant select on public.profiles, public.apprenants, public.paiements, public.checklist_entries,
  public.audit_logs, public.coach_schedules, public.annonces, public.analytics_visitors
  to authenticated;
grant select on public.blog_posts to anon, authenticated;

create policy "profil personnel ou pdg" on public.profiles for select to authenticated
  using (id = auth.uid() or app_role() = 'pdg');
create policy "staff lit apprenants" on public.apprenants for select to authenticated
  using (app_role() in ('secretaire', 'pdg'));
create policy "staff lit paiements" on public.paiements for select to authenticated
  using (app_role() in ('secretaire', 'pdg'));
create policy "staff lit checklists" on public.checklist_entries for select to authenticated
  using (app_role() in ('secretaire', 'pdg'));
create policy "pdg lit audit" on public.audit_logs for select to authenticated
  using (app_role() = 'pdg');
create policy "equipe lit plannings" on public.coach_schedules for select to authenticated
  using (app_role() in ('coach', 'secretaire', 'pdg'));
create policy "equipe lit annonces" on public.annonces for select to authenticated
  using (app_role() in ('coach', 'secretaire', 'pdg'));
create policy "pdg lit analytics" on public.analytics_visitors for select to authenticated
  using (app_role() = 'pdg');
create policy "lecture articles publies" on public.blog_posts for select to anon, authenticated
  using (published = true);

-- 5. Audit (interne) --------------------------------------------------------

create or replace function public._audit(p_action text, p_details text)
returns void language plpgsql security definer set search_path = public as $$
declare v_nom text; v_role text;
begin
  select nom, role into v_nom, v_role from profiles where id = auth.uid();
  insert into audit_logs (action, details, user_name, user_role, user_id)
  values (p_action, left(p_details, 1000), coalesce(v_nom, 'inconnu'), coalesce(v_role, 'inconnu'), auth.uid());
end $$;
revoke execute on function public._audit(text, text) from public, anon, authenticated;

create or replace function public._require_role(p_roles text[])
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null or coalesce(app_role(), '') <> all (p_roles) then
    raise exception 'Action non autorisée pour ce rôle.' using errcode = '42501';
  end if;
end $$;
revoke execute on function public._require_role(text[]) from public, anon, authenticated;

-- 6. RPC métier -------------------------------------------------------------

create or replace function public.create_learner(
  p_nom text, p_centre text, p_cohorte text, p_option text,
  p_versement numeric default 0, p_mode text default 'Espèces'
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_total numeric; v_id uuid; v_nom_auteur text;
begin
  perform _require_role(array['secretaire']);
  v_total := case p_option when 'bloc' then 150000 when 'echelonne' then 180000 end;
  if v_total is null then raise exception 'Formule de paiement invalide.'; end if;
  p_versement := coalesce(p_versement, 0);
  if p_versement < 0 or p_versement > v_total then
    raise exception 'Le versement initial doit être compris entre 0 et % F.', v_total;
  end if;

  insert into apprenants (nom, centre, cohorte, option_paiement, total, statut, prochaine_echeance)
  values (
    btrim(p_nom), p_centre, btrim(p_cohorte), p_option, v_total,
    case when p_versement >= v_total then 'solde' else 'a_jour' end,
    case when p_versement >= v_total then null
         else (date_trunc('month', current_date) + interval '1 month')::date end
  ) returning id into v_id;

  select nom into v_nom_auteur from profiles where id = auth.uid();
  if p_versement > 0 then
    insert into paiements (apprenant_id, montant, mode, date_paiement, enregistre_par)
    values (v_id, p_versement, p_mode, current_date, v_nom_auteur);
  end if;

  perform _audit('CREATION_APPRENANT', format('Inscription de %s (Cohorte %s · %s, %s, versement initial %s F).',
    btrim(p_nom), p_cohorte, p_centre, p_option, p_versement));
  return v_id;
end $$;

create or replace function public.record_payment(
  p_apprenant uuid, p_montant numeric, p_mode text, p_date date
) returns void language plpgsql security definer set search_path = public as $$
declare v_total numeric; v_paye numeric; v_nom text; v_nom_auteur text;
begin
  perform _require_role(array['secretaire']);
  select total, nom into v_total, v_nom from apprenants where id = p_apprenant for update;
  if v_total is null then raise exception 'Apprenant introuvable.'; end if;
  select coalesce(sum(montant), 0) into v_paye from paiements where apprenant_id = p_apprenant;
  if p_montant is null or p_montant <= 0 then raise exception 'Le montant doit être positif.'; end if;
  if v_paye + p_montant > v_total then
    raise exception 'Montant trop élevé : il reste % F à payer.', v_total - v_paye;
  end if;
  if p_date is null or p_date > current_date + 1 then raise exception 'Date de paiement invalide.'; end if;

  select nom into v_nom_auteur from profiles where id = auth.uid();
  insert into paiements (apprenant_id, montant, mode, date_paiement, enregistre_par)
  values (p_apprenant, p_montant, p_mode, p_date, v_nom_auteur);

  if v_paye + p_montant >= v_total then
    update apprenants set statut = 'solde', prochaine_echeance = null where id = p_apprenant;
  end if;

  perform _audit('ENREGISTREMENT_PAIEMENT', format('Versement de %s F (%s) enregistré pour %s.', p_montant, p_mode, v_nom));
end $$;

create or replace function public.delete_learner(p_apprenant uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_nom text;
begin
  perform _require_role(array['secretaire']);
  delete from apprenants where id = p_apprenant returning nom into v_nom;
  if v_nom is null then raise exception 'Apprenant introuvable.'; end if;
  perform _audit('SUPPRESSION_APPRENANT', format('Suppression du dossier de %s et de ses paiements.', v_nom));
end $$;

create or replace function public.set_checklist_item(
  p_checklist text, p_index integer, p_checked boolean, p_label text default null
) returns void language plpgsql security definer set search_path = public as $$
declare v_nom text;
begin
  perform _require_role(array['secretaire']);
  if p_index is null or p_index < 0 or p_index > 100 then raise exception 'Élément de checklist invalide.'; end if;
  delete from checklist_entries where checklist = p_checklist and item_index = p_index;
  if p_checked then
    select nom into v_nom from profiles where id = auth.uid();
    insert into checklist_entries (checklist, item_index, coche, coche_par) values (p_checklist, p_index, true, v_nom);
  end if;
  perform _audit(case when p_checked then 'CHECKLIST_VALIDEE' else 'CHECKLIST_ANNULEE' end,
    format('%s de l''élément "%s".', case when p_checked then 'Validation' else 'Annulation' end,
      coalesce(left(p_label, 200), 'Tâche #' || (p_index + 1))));
end $$;

create or replace function public.create_announcement(p_titre text, p_contenu text, p_priorite text default 'normale')
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_nom text;
begin
  perform _require_role(array['pdg']);
  if char_length(btrim(coalesce(p_titre, ''))) not between 3 and 150 then raise exception 'Titre invalide (3 à 150 caractères).'; end if;
  if char_length(btrim(coalesce(p_contenu, ''))) not between 3 and 3000 then raise exception 'Contenu invalide (3 à 3000 caractères).'; end if;
  select nom into v_nom from profiles where id = auth.uid();
  insert into annonces (titre, contenu, auteur, priorite)
  values (btrim(p_titre), btrim(p_contenu), v_nom, p_priorite) returning id into v_id;
  perform _audit('PUBLICATION_ANNONCE', format('Communiqué publié : "%s" (priorité %s).', btrim(p_titre), p_priorite));
  return v_id;
end $$;

create or replace function public.log_logout()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  perform _audit('DECONNEXION', 'Fermeture de session.');
end $$;

-- 7. Mesure d'audience (seul point d'écriture public) -----------------------

create or replace function public.track_visit(
  p_visitor_id text, p_device_type text, p_operating_system text, p_browser text,
  p_utm_source text, p_utm_medium text, p_utm_campaign text, p_utm_term text,
  p_utm_content text, p_page_path text, p_referrer text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_visitor_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'visitor_id invalide';
  end if;
  insert into analytics_visitors as a (
    visitor_id, device_type, operating_system, browser, utm_source, utm_medium,
    utm_campaign, utm_term, utm_content, page_path, referrer
  ) values (
    p_visitor_id,
    case when p_device_type in ('mobile', 'desktop', 'tablet') then p_device_type else 'desktop' end,
    left(p_operating_system, 40), left(p_browser, 40),
    lower(left(coalesce(nullif(p_utm_source, ''), 'direct'), 100)),
    lower(left(coalesce(nullif(p_utm_medium, ''), 'none'), 100)),
    lower(left(coalesce(nullif(p_utm_campaign, ''), 'organic'), 100)),
    left(p_utm_term, 100), left(p_utm_content, 100),
    left(coalesce(nullif(p_page_path, ''), '/'), 300),
    left(coalesce(nullif(p_referrer, ''), 'direct'), 500)
  )
  on conflict (visitor_id) do update set
    visits_count = a.visits_count + 1,
    last_seen = now(),
    page_path = excluded.page_path;
end $$;

-- 8. Droits d'exécution -----------------------------------------------------

revoke execute on function public.create_learner(text, text, text, text, numeric, text) from public, anon;
revoke execute on function public.record_payment(uuid, numeric, text, date) from public, anon;
revoke execute on function public.delete_learner(uuid) from public, anon;
revoke execute on function public.set_checklist_item(text, integer, boolean, text) from public, anon;
revoke execute on function public.create_announcement(text, text, text) from public, anon;
revoke execute on function public.log_logout() from public, anon;
grant execute on function public.create_learner(text, text, text, text, numeric, text) to authenticated;
grant execute on function public.record_payment(uuid, numeric, text, date) to authenticated;
grant execute on function public.delete_learner(uuid) to authenticated;
grant execute on function public.set_checklist_item(text, integer, boolean, text) to authenticated;
grant execute on function public.create_announcement(text, text, text) to authenticated;
grant execute on function public.log_logout() to authenticated;

revoke execute on function public.track_visit(text, text, text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.track_visit(text, text, text, text, text, text, text, text, text, text, text) to anon, authenticated;
