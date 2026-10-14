-- ============================================================================
-- Test de niveau passé directement sur le site
-- - Questions affichées par le site ; correction faite ICI, côté serveur
-- - La clé de correction (table level_test_key) n'est jamais envoyée au navigateur
--   et n'est volontairement PAS versionnée dans ce dépôt public : elle se charge
--   directement en base (voir docs/backend-integration.md).
-- - Un test par numéro WhatsApp ET par téléphone ; reprise autorisée par la secrétaire.
-- ============================================================================

-- La chaîne Google Form → Edge Function est abandonnée.
drop table if exists public.integration_tokens;

alter table public.test_results drop constraint if exists test_results_source_check;
alter table public.test_results add constraint test_results_source_check
  check (source in ('google_form', 'manuel', 'site'));
alter table public.test_results add column if not exists detail_competences jsonb;

-- Clé de correction ---------------------------------------------------------
create table if not exists public.level_test_key (
  question_id text primary key check (question_id ~ '^q[0-9]{1,3}$'),
  position int not null unique,
  skill text not null check (skill in ('grammaire', 'vocabulaire', 'lecture', 'ecoute')),
  level text not null check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  correct int[] not null default '{}',
  points numeric not null default 1 check (points > 0),
  actif boolean not null default false,
  check (not actif or cardinality(correct) > 0)
);
alter table public.level_test_key enable row level security;
revoke all on public.level_test_key from anon, authenticated;

-- Tentatives ----------------------------------------------------------------
create table if not exists public.level_test_attempts (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  contact text not null,
  whatsapp_key text not null,
  device_id text not null,
  ip text,
  active_ids text[] not null,
  status text not null default 'en_cours' check (status in ('en_cours', 'termine', 'autorise_nouveau')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  submitted_at timestamptz,
  result jsonb,
  result_id uuid references public.test_results (id) on delete set null
);
alter table public.level_test_attempts enable row level security;
revoke all on public.level_test_attempts from anon, authenticated;

-- Deux index uniques partiels : même en cas de demandes simultanées, un seul test par numéro et par téléphone.
create unique index if not exists uq_level_attempt_phone on public.level_test_attempts (whatsapp_key)
  where status in ('en_cours', 'termine');
create unique index if not exists uq_level_attempt_device on public.level_test_attempts (device_id)
  where status in ('en_cours', 'termine');
create index if not exists idx_level_attempt_ip on public.level_test_attempts (ip, started_at);
create index if not exists idx_level_attempt_started on public.level_test_attempts (started_at);

-- Niveau estimé (A1 → C2) --------------------------------------------------------
-- Un niveau est acquis à partir de 60 % de réussite. Les niveaux de moins de 4 questions sont regroupés
-- avec le suivant, pour qu'une seule faute d'inattention sur 2 questions ne fasse pas chuter le résultat.
create or replace function public.level_test_estimate(p_levels jsonb)
returns text language plpgsql immutable set search_path = public as $$
declare
  lv text;
  best text := 'Pré-A1';
  ok int;
  total int;
  pool_ok int := 0;
  pool_total int := 0;
  pool_first text := null;
  last_lv text := null;
begin
  foreach lv in array array['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] loop
    ok := coalesce((p_levels -> lv ->> 0)::int, 0);
    total := coalesce((p_levels -> lv ->> 1)::int, 0);
    if total = 0 then continue; end if;
    pool_ok := pool_ok + ok;
    pool_total := pool_total + total;
    pool_first := coalesce(pool_first, lv);
    last_lv := lv;
    if pool_total < 4 then continue; end if;

    if ok::numeric / total >= 0.6 then
      best := lv;
      pool_ok := 0; pool_total := 0; pool_first := null;
    elsif pool_first <> lv and pool_ok::numeric / pool_total >= 0.6 then
      best := pool_first;
      pool_total := 0;
      exit;
    else
      pool_total := 0;
      exit;
    end if;
  end loop;

  if pool_total > 0 and pool_ok::numeric / pool_total >= 0.6 then best := last_lv; end if;
  return best;
end $$;
revoke execute on function public.level_test_estimate(jsonb) from public, anon, authenticated;

-- Démarrage ------------------------------------------------------------------
create or replace function public.level_test_start(p_nom text, p_whatsapp text, p_device_id text, p_hp text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_nom text := btrim(coalesce(p_nom, ''));
  v_digits text := regexp_replace(coalesce(p_whatsapp, ''), '[^0-9]', '', 'g');
  v_key text;
  v_ip text := nullif(btrim(split_part(coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1)), '');
  v_existing public.level_test_attempts%rowtype;
  v_ids text[];
  v_attempt uuid;
  v_duration constant int := 2700;
begin
  if coalesce(p_hp, '') <> '' then return jsonb_build_object('status', 'error', 'code', 'invalid'); end if;
  if char_length(v_nom) not between 2 and 120 then return jsonb_build_object('status', 'error', 'code', 'invalid_name'); end if;
  if char_length(v_digits) not between 8 and 15 then return jsonb_build_object('status', 'error', 'code', 'invalid_phone'); end if;
  if coalesce(p_device_id, '') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return jsonb_build_object('status', 'error', 'code', 'invalid');
  end if;
  v_key := right(v_digits, 8);

  select * into v_existing from public.level_test_attempts
  where status in ('en_cours', 'termine') and (device_id = p_device_id or whatsapp_key = v_key)
  order by (device_id = p_device_id) desc, started_at desc
  limit 1;

  if found then
    if v_existing.device_id = p_device_id then
      if v_existing.status = 'en_cours' and v_existing.expires_at > now() then
        return jsonb_build_object('status', 'resume', 'attempt_id', v_existing.id,
          'seconds_left', ceil(extract(epoch from v_existing.expires_at - now()))::int,
          'active_ids', to_jsonb(v_existing.active_ids), 'nom', v_existing.nom);
      elsif v_existing.status = 'termine' then
        return jsonb_build_object('status', 'already', 'same_device', true, 'attempt_id', v_existing.id);
      end if;
    end if;
    return jsonb_build_object('status', 'already', 'same_device', v_existing.device_id = p_device_id);
  end if;

  if v_ip is not null and (select count(*) from public.level_test_attempts where ip = v_ip and started_at > now() - interval '1 hour') >= 120 then
    return jsonb_build_object('status', 'error', 'code', 'rate_limited');
  end if;
  if (select count(*) from public.level_test_attempts where started_at > now() - interval '1 hour') >= 3000 then
    return jsonb_build_object('status', 'error', 'code', 'rate_limited');
  end if;

  select array_agg(question_id order by position) into v_ids from public.level_test_key where actif;
  if v_ids is null then return jsonb_build_object('status', 'error', 'code', 'unavailable'); end if;

  begin
    insert into public.level_test_attempts (nom, contact, whatsapp_key, device_id, ip, active_ids, expires_at)
    values (v_nom, left(btrim(p_whatsapp), 40), v_key, p_device_id, v_ip, v_ids, now() + make_interval(secs => v_duration))
    returning id into v_attempt;
  exception when unique_violation then
    -- Demande simultanée du même téléphone (double appui, nouvel essai réseau) : on reprend sa propre tentative.
    select * into v_existing from public.level_test_attempts
    where status in ('en_cours', 'termine') and device_id = p_device_id
    order by started_at desc limit 1;
    if found and v_existing.status = 'en_cours' and v_existing.expires_at > now() then
      return jsonb_build_object('status', 'resume', 'attempt_id', v_existing.id,
        'seconds_left', ceil(extract(epoch from v_existing.expires_at - now()))::int,
        'active_ids', to_jsonb(v_existing.active_ids), 'nom', v_existing.nom);
    elsif found and v_existing.status = 'termine' then
      return jsonb_build_object('status', 'already', 'same_device', true, 'attempt_id', v_existing.id);
    end if;
    return jsonb_build_object('status', 'already', 'same_device', false);
  end;

  return jsonb_build_object('status', 'ok', 'attempt_id', v_attempt, 'seconds_left', v_duration, 'active_ids', to_jsonb(v_ids));
end $$;

-- Envoi des réponses et correction ---------------------------------------------
create or replace function public.level_test_submit(p_attempt_id uuid, p_device_id text, p_answers jsonb, p_redaction text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_att public.level_test_attempts%rowtype;
  v_clean jsonb;
  v_score numeric;
  v_max numeric;
  v_levels jsonb;
  v_skills jsonb;
  v_niveau text;
  v_redac text;
  v_result jsonb;
  v_res_id uuid;
begin
  select * into v_att from public.level_test_attempts where id = p_attempt_id for update;
  if not found or v_att.device_id <> coalesce(p_device_id, '') then
    return jsonb_build_object('status', 'error', 'code', 'not_found');
  end if;
  if v_att.status = 'termine' then return v_att.result; end if;
  if v_att.status <> 'en_cours' then return jsonb_build_object('status', 'error', 'code', 'not_allowed'); end if;
  if now() < v_att.started_at + interval '90 seconds' then return jsonb_build_object('status', 'error', 'code', 'too_fast'); end if;
  if now() > v_att.expires_at + interval '5 minutes' then return jsonb_build_object('status', 'error', 'code', 'expired'); end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then p_answers := '{}'::jsonb; end if;
  if (select count(*) from jsonb_object_keys(p_answers)) > 120 then return jsonb_build_object('status', 'error', 'code', 'invalid'); end if;
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) into v_clean
  from jsonb_each(p_answers)
  where key ~ '^q[0-9]{1,3}$' and jsonb_typeof(value) = 'number' and value::text ~ '^[0-3]$';

  with g as (
    select k.level, k.skill, k.points,
           coalesce((v_clean ->> k.question_id)::int = any (k.correct), false) as ok
    from public.level_test_key k
    where k.actif and k.question_id = any (v_att.active_ids)
  ),
  lv as (select level, count(*) filter (where ok) as o, count(*) as t from g group by level),
  sk as (select skill, count(*) filter (where ok) as o, count(*) as t from g group by skill)
  select
    (select coalesce(sum(case when ok then points else 0 end), 0) from g),
    (select coalesce(sum(points), 0) from g),
    (select coalesce(jsonb_object_agg(level, jsonb_build_array(o, t)), '{}'::jsonb) from lv),
    (select coalesce(jsonb_object_agg(skill, jsonb_build_array(o, t)), '{}'::jsonb) from sk)
  into v_score, v_max, v_levels, v_skills;

  v_niveau := public.level_test_estimate(v_levels);
  v_redac := nullif(left(btrim(coalesce(p_redaction, '')), 2000), '');

  insert into public.test_results (external_id, nom, contact, score, score_max, niveau_estime, detail_niveaux, detail_competences, redaction, source, passe_le)
  values ('site-' || v_att.id, v_att.nom, v_att.contact, v_score, v_max, v_niveau, v_levels, v_skills, v_redac, 'site', now())
  returning id into v_res_id;

  v_result := jsonb_build_object('status', 'ok', 'nom', v_att.nom, 'niveau', v_niveau, 'score', v_score, 'score_max', v_max,
    'par_niveau', v_levels, 'par_competence', v_skills, 'redaction_recue', v_redac is not null);

  update public.level_test_attempts set status = 'termine', submitted_at = now(), result = v_result, result_id = v_res_id where id = v_att.id;

  insert into public.audit_logs (action, details, user_name, user_role, ip_address)
  values ('TEST_NIVEAU_RECU', format('Test en ligne terminé : %s (niveau estimé %s, %s/%s).', v_att.nom, v_niveau, v_score, v_max), 'Test en ligne', 'system', v_att.ip);

  return v_result;
end $$;

-- Relecture du résultat depuis le même téléphone ---------------------------------
create or replace function public.level_test_get_result(p_attempt_id uuid, p_device_id text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_result jsonb;
begin
  select result into v_result from public.level_test_attempts
  where id = p_attempt_id and device_id = coalesce(p_device_id, '') and status = 'termine';
  return coalesce(v_result, jsonb_build_object('status', 'error', 'code', 'not_found'));
end $$;

-- Autorisation d'un nouveau test par la secrétaire ------------------------------
create or replace function public.allow_level_retake(p_whatsapp text)
returns int language plpgsql security definer set search_path = public as $$
declare v_key text; v_n int;
begin
  perform _require_role(array['secretaire']);
  v_key := right(regexp_replace(coalesce(p_whatsapp, ''), '[^0-9]', '', 'g'), 8);
  if char_length(v_key) < 8 then raise exception 'Numéro invalide (8 chiffres minimum).'; end if;
  update public.level_test_attempts set status = 'autorise_nouveau'
  where whatsapp_key = v_key and status in ('en_cours', 'termine');
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'Aucun test en cours ou terminé pour ce numéro.'; end if;
  perform _audit('TEST_NIVEAU_REPRISE', format('Nouveau test autorisé pour le numéro finissant par %s.', right(v_key, 4)));
  return v_n;
end $$;

revoke execute on function public.level_test_start(text, text, text, text) from public;
revoke execute on function public.level_test_submit(uuid, text, jsonb, text) from public;
revoke execute on function public.level_test_get_result(uuid, text) from public;
revoke execute on function public.allow_level_retake(text) from public, anon;
grant execute on function public.level_test_start(text, text, text, text) to anon, authenticated;
grant execute on function public.level_test_submit(uuid, text, jsonb, text) to anon, authenticated;
grant execute on function public.level_test_get_result(uuid, text) to anon, authenticated;
grant execute on function public.allow_level_retake(text) to authenticated;
