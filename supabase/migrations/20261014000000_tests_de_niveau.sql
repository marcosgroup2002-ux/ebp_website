-- ============================================================================
-- Résultats du test de niveau (Google Form « Level Test EBP »)
-- - Reçus automatiquement via la fonction Edge receive-test-result
-- - Consultés et évalués par la secrétaire, puis transmis au PDG
-- ============================================================================

-- Jeton du webhook : seul l'empreinte SHA-256 est stockée, le jeton n'est jamais dans le dépôt.
create table if not exists public.integration_tokens (
  name text primary key,
  token_hash text not null,
  created_at timestamptz not null default now()
);
alter table public.integration_tokens enable row level security;
revoke all on public.integration_tokens from anon, authenticated;

insert into public.integration_tokens (name, token_hash)
values ('google_form_level_test', '010f7445ff80a53b25d3393ad11a6a5bdb314d340d0c3c24045994487e369d7e')
on conflict (name) do update set token_hash = excluded.token_hash;

create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  nom text not null check (char_length(btrim(nom)) between 2 and 120),
  contact text check (char_length(contact) <= 150),
  score numeric check (score >= 0),
  score_max numeric check (score_max >= 0),
  niveau_estime text check (niveau_estime in ('Pré-A1','A1','A2','B1','B2','C1','C2')),
  niveau_valide text check (niveau_valide in ('Pré-A1','A1','A2','B1','B2','C1','C2')),
  detail_niveaux jsonb,
  redaction text check (char_length(redaction) <= 6000),
  source text not null default 'manuel' check (source in ('google_form','manuel')),
  statut text not null default 'nouveau' check (statut in ('nouveau','contacte','transmis')),
  note text check (char_length(note) <= 1000),
  passe_le timestamptz not null default now(),
  transmis_at timestamptz,
  transmis_par text,
  created_at timestamptz not null default now(),
  constraint test_results_score_coherent check (score is null or score_max is null or score <= score_max)
);
create index if not exists idx_test_results_statut on public.test_results (statut, passe_le desc);

alter table public.test_results enable row level security;
revoke all on public.test_results from anon, authenticated;
grant select on public.test_results to authenticated;

-- La secrétaire voit tout ; le PDG ne voit que ce qui lui a été transmis.
create policy "secretariat et pdg lisent les tests" on public.test_results for select to authenticated
  using (app_role() = 'secretaire' or (app_role() = 'pdg' and statut = 'transmis'));

create or replace function public.add_test_result(
  p_nom text, p_contact text, p_score numeric, p_score_max numeric, p_niveau text, p_note text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  perform _require_role(array['secretaire']);
  if char_length(btrim(coalesce(p_nom, ''))) not between 2 and 120 then raise exception 'Nom invalide (2 à 120 caractères).'; end if;
  if p_score is not null and (p_score < 0 or (p_score_max is not null and p_score > p_score_max)) then
    raise exception 'Le score ne peut pas dépasser le maximum.';
  end if;
  insert into test_results (nom, contact, score, score_max, niveau_estime, niveau_valide, note, source)
  values (btrim(p_nom), nullif(btrim(p_contact), ''), p_score, p_score_max, nullif(p_niveau, ''), nullif(p_niveau, ''), nullif(btrim(p_note), ''), 'manuel')
  returning id into v_id;
  perform _audit('TEST_NIVEAU_AJOUTE', format('Résultat saisi à la main pour %s.', btrim(p_nom)));
  return v_id;
end $$;

create or replace function public.review_test_result(p_id uuid, p_niveau_valide text, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare v_nom text; v_statut text;
begin
  perform _require_role(array['secretaire']);
  select nom, statut into v_nom, v_statut from test_results where id = p_id for update;
  if v_nom is null then raise exception 'Résultat introuvable.'; end if;
  if v_statut = 'transmis' then raise exception 'Ce résultat a déjà été transmis au PDG et ne peut plus être modifié.'; end if;
  update test_results set niveau_valide = nullif(p_niveau_valide, ''), note = nullif(btrim(p_note), '') where id = p_id;
  perform _audit('TEST_NIVEAU_EVALUE', format('Évaluation de %s : niveau retenu %s.', v_nom, coalesce(nullif(p_niveau_valide, ''), 'non défini')));
end $$;

create or replace function public.set_test_result_status(p_id uuid, p_statut text)
returns void language plpgsql security definer set search_path = public as $$
declare v_nom text; v_statut text; v_auteur text;
begin
  perform _require_role(array['secretaire']);
  if p_statut not in ('nouveau', 'contacte', 'transmis') then raise exception 'Statut invalide.'; end if;
  select nom, statut into v_nom, v_statut from test_results where id = p_id for update;
  if v_nom is null then raise exception 'Résultat introuvable.'; end if;
  if v_statut = 'transmis' then raise exception 'Ce résultat a déjà été transmis au PDG.'; end if;
  select nom into v_auteur from profiles where id = auth.uid();
  update test_results set
    statut = p_statut,
    transmis_at = case when p_statut = 'transmis' then now() end,
    transmis_par = case when p_statut = 'transmis' then v_auteur end
  where id = p_id;
  perform _audit(case p_statut when 'transmis' then 'TEST_NIVEAU_TRANSMIS' else 'TEST_NIVEAU_STATUT' end,
    case p_statut when 'transmis' then format('Résultat de %s transmis au PDG.', v_nom)
                  else format('Résultat de %s passé au statut « %s ».', v_nom, p_statut) end);
end $$;

create or replace function public.delete_test_result(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_nom text; v_statut text;
begin
  perform _require_role(array['secretaire']);
  select nom, statut into v_nom, v_statut from test_results where id = p_id for update;
  if v_nom is null then raise exception 'Résultat introuvable.'; end if;
  if v_statut = 'transmis' then raise exception 'Un résultat transmis au PDG ne peut pas être supprimé.'; end if;
  delete from test_results where id = p_id;
  perform _audit('TEST_NIVEAU_SUPPRIME', format('Résultat de %s supprimé.', v_nom));
end $$;

revoke execute on function public.add_test_result(text, text, numeric, numeric, text, text) from public, anon;
revoke execute on function public.review_test_result(uuid, text, text) from public, anon;
revoke execute on function public.set_test_result_status(uuid, text) from public, anon;
revoke execute on function public.delete_test_result(uuid) from public, anon;
grant execute on function public.add_test_result(text, text, numeric, numeric, text, text) to authenticated;
grant execute on function public.review_test_result(uuid, text, text) to authenticated;
grant execute on function public.set_test_result_status(uuid, text) to authenticated;
grant execute on function public.delete_test_result(uuid) to authenticated;
