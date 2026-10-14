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

## Résultats du test de niveau (Google Form → espace secrétariat)

Le bouton « Passer le Test de Niveau » du site ouvre le Google Form « Level Test EBP » (`TEST_LEVEL_URL` dans
`src/data/siteContent.js`). Les réponses arrivent dans la page **Tests de niveau** de l'espace admin.

```
Google Form ──(Apps Script, à l'envoi)──▶ Edge Function receive-test-result ──▶ table test_results
                                                                              │
                              secrétaire : lit, évalue, contacte, transmet ◀──┘
                              PDG        : lit uniquement ce qui lui est transmis
```

- **Jeton** : l'Edge Function exige l'en-tête `x-webhook-token`. Seule l'empreinte SHA-256 est stockée
  (table `integration_tokens`) ; le jeton lui-même se trouve uniquement dans le fichier local
  `ebp-form-webhook.gs.local` (ignoré par Git), à coller dans l'éditeur de scripts du formulaire.
- **Niveau estimé** : calculé côté serveur à partir des étiquettes `(A1)`…`(C2)` des questions ; un niveau est
  validé à partir de 60 % de réussite, en montant de A1 à C2. Il reste indicatif tant que la rédaction (10 points,
  correction manuelle) n'est pas lue : la secrétaire confirme le « niveau retenu ».
- **Statuts** : `nouveau` → `contacte` → `transmis`. Un résultat transmis est verrouillé (ni modification ni suppression).
- **Droits** : secrétaire = lecture/écriture via RPC (`add_test_result`, `review_test_result`,
  `set_test_result_status`, `delete_test_result`) ; PDG = lecture des résultats `transmis` ; coach et anonyme = aucun accès.
- **Renouveler le jeton** : générer 32 octets aléatoires, mettre à jour `integration_tokens.token_hash`
  avec leur SHA-256, puis remplacer `TOKEN` dans le script Google.
- **Contact du candidat** : le formulaire ne demande que le nom. Ajouter une question courte « WhatsApp / email »
  (ou activer « Collecter les adresses e-mail ») pour que la secrétaire puisse rappeler le candidat ; le script la
  reconnaît automatiquement.
