-- ============================================================================
-- Tarifs des formules modifiables par le secrétariat
-- - Les nouvelles inscriptions utilisent le tarif en vigueur
-- - Les apprenants déjà inscrits conservent le total enregistré à leur inscription
-- ============================================================================

create table if not exists public.tarifs (
  option_paiement text primary key check (option_paiement in ('echelonne', 'bloc')),
  montant numeric not null check (montant between 1000 and 2000000),
  updated_at timestamptz not null default now(),
  updated_by text
);

insert into public.tarifs (option_paiement, montant) values ('echelonne', 180000), ('bloc', 150000)
on conflict (option_paiement) do nothing;

alter table public.tarifs enable row level security;
revoke all on public.tarifs from anon, authenticated;
grant select on public.tarifs to authenticated;

create policy "staff lit tarifs" on public.tarifs for select to authenticated
  using (app_role() in ('secretaire', 'pdg'));

create or replace function public.set_tarif(p_option text, p_montant numeric)
returns void language plpgsql security definer set search_path = public as $$
declare v_ancien numeric; v_nom text;
begin
  perform _require_role(array['secretaire']);
  if p_montant is null or p_montant < 1000 or p_montant > 2000000 then
    raise exception 'Le tarif doit être compris entre 1 000 et 2 000 000 F.';
  end if;
  select montant into v_ancien from tarifs where option_paiement = p_option for update;
  if v_ancien is null then raise exception 'Formule inconnue.'; end if;
  if v_ancien = p_montant then return; end if;

  select nom into v_nom from profiles where id = auth.uid();
  update tarifs set montant = p_montant, updated_at = now(), updated_by = v_nom where option_paiement = p_option;

  perform _audit('MODIFICATION_TARIF', format('Tarif %s : %s F → %s F (nouvelles inscriptions uniquement).',
    case p_option when 'bloc' then 'Bloc' else 'Échelonné' end, v_ancien, p_montant));
end $$;

revoke execute on function public.set_tarif(text, numeric) from public, anon;
grant execute on function public.set_tarif(text, numeric) to authenticated;

-- L'inscription lit désormais le tarif en vigueur au lieu d'un montant fixe.
create or replace function public.create_learner(
  p_nom text, p_centre text, p_cohorte text, p_option text,
  p_versement numeric default 0, p_mode text default 'Espèces'
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_total numeric; v_id uuid; v_nom_auteur text;
begin
  perform _require_role(array['secretaire']);
  select montant into v_total from tarifs where option_paiement = p_option;
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

  perform _audit('CREATION_APPRENANT', format('Inscription de %s (Cohorte %s · %s, %s à %s F, versement initial %s F).',
    btrim(p_nom), p_cohorte, p_centre, p_option, v_total, p_versement));
  return v_id;
end $$;
