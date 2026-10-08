# Backend EBP : authentification, rôles et données

## Architecture

- **Authentification** : Supabase Auth (email + mot de passe). Aucun mot de passe, hash ou secret dans le front.
- **Rôles** : colonne `profiles.role` (`secretaire`, `coach`, `pdg`), modifiable uniquement en SQL / dashboard.
  Un nouveau compte reçoit `coach` par défaut (trigger `handle_new_user`).
- **Lectures** : RLS par rôle via la fonction `app_role()`.
- **Écritures** : uniquement via des RPC `SECURITY DEFINER` qui vérifient le rôle et écrivent l'audit
  côté serveur. Aucun `INSERT/UPDATE/DELETE` direct n'est accordé aux rôles `anon` / `authenticated`.
- **Audit** : table `audit_logs`, lisible par le PDG uniquement, non modifiable depuis le client.
  Les connexions sont journalisées par la fonction Edge `auth-notify` avec l'IP réelle (`x-forwarded-for`).

| Rôle        | Lecture                                                       | Écriture (RPC)                                              |
|-------------|---------------------------------------------------------------|-------------------------------------------------------------|
| secretaire  | apprenants, paiements, checklists, plannings, annonces, tarifs | `create_learner`, `record_payment`, `delete_learner`, `set_checklist_item`, `set_tarif` |
| coach       | plannings, annonces                                           | —                                                           |
| pdg         | tout, y compris `audit_logs` et `analytics_visitors`          | `create_announcement`                                       |
| anon        | `blog_posts` publiés                                          | `track_visit` (mesure d'audience, données validées)         |

## Créer les comptes du personnel

1. Supabase Dashboard > Authentication > Users > **Add user** (cocher *Auto Confirm User*), un compte par personne.
2. Attribuer le rôle et le nom affiché :

```sql
update public.profiles set role = 'secretaire', nom = 'Nom affiché' where email = 'adresse@exemple.com';
update public.profiles set role = 'pdg',        nom = 'Nom affiché' where email = 'adresse@exemple.com';
-- les coachs gardent le rôle 'coach' par défaut
```

3. Authentication > Providers > Email : **désactiver « Allow new users to sign up »** pour que personne ne puisse
   créer un compte depuis l'extérieur.

## Fonction Edge `auth-notify`

Appelée par le front juste après une connexion réussie (JWT obligatoire). Elle :
- vérifie le jeton (`auth.getUser`) et le profil ;
- écrit `CONNEXION` dans `audit_logs` avec l'IP vue par le serveur ;
- si le compte est `secretaire`, envoie une alerte email à la direction via Resend.

Secrets à configurer :

```bash
supabase secrets set RESEND_API_KEY=re_xxx PDG_ALERT_EMAIL=direction@exemple.com SENDER_EMAIL=admin@votre-domaine.com ALLOWED_ORIGINS=https://votre-domaine.com
```

## Migrations

Les schémas sont versionnés dans `supabase/migrations/` (aucune commande `DROP TABLE` destructrice).
Appliquer avec `supabase db push`.
