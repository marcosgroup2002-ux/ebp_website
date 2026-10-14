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

## Test de niveau en ligne

Le bouton « Passer le Test de Niveau » mène à la page `/test-de-niveau` du site (`TEST_LEVEL_URL` dans
`src/data/siteContent.js`). Les résultats arrivent dans la page **Tests de niveau** de l'espace admin.

```
Apprenant ──(site : questions sans réponses)──▶ level_test_start / level_test_submit (RPC publiques)
                                                         │ correction côté serveur (table level_test_key)
                                                         ▼
                              level_test_attempts  +  test_results (source = 'site')
                                                         │
                        secrétaire : lit, évalue, contacte, transmet ──▶ PDG : lit les résultats transmis
```

- **Questions** : `src/data/levelTest.js` (généré à partir du formulaire d'origine, **sans aucune réponse**).
- **Clé de correction** : table `level_test_key` (réponses acceptées, niveau CECRL, compétence, points, `actif`).
  Le dépôt GitHub étant public, la clé n'est volontairement **pas versionnée** : elle se modifie directement en base
  (SQL Editor de Supabase). Elle est inaccessible au navigateur (RLS sans politique, aucun droit pour `anon`).
  Exemples :
  ```sql
  -- Activer la partie écoute une fois les bonnes réponses connues (0 = A, 1 = B, 2 = C, 3 = D)
  update level_test_key set correct = '{1}', actif = true where question_id = 'q44';
  -- Accepter deux réponses pour une même question
  update level_test_key set correct = '{0,3}' where question_id = 'q22';
  ```
  Seules les questions `actif = true` sont posées et comptées : le test s'adapte sans redéploiement.
- **Une seule tentative** : par numéro WhatsApp (8 derniers chiffres) **et** par téléphone (identifiant anonyme stocké
  dans le navigateur), garantie par deux index uniques partiels. La secrétaire peut autoriser une reprise
  (« Autoriser un nouveau test » sur un résultat, ou « Débloquer un numéro »). Limite honnête : vider les données du
  navigateur *et* utiliser un autre numéro permet de contourner la règle ; un code SMS serait nécessaire pour l'éviter.
- **Temps** : 45 minutes (le serveur accepte l'envoi jusqu'à 5 minutes après l'échéance et refuse tout envoi
  en moins de 90 secondes). Le site envoie automatiquement le test à 0.
- **Niveau estimé** : un niveau est acquis à partir de 60 % de réussite ; les niveaux de moins de 4 questions sont
  regroupés avec le suivant (`level_test_estimate`). Il reste indicatif tant que la rédaction (correction manuelle)
  n'est pas lue : la secrétaire confirme le « niveau retenu ».
- **Statuts** : `nouveau` → `contacte` → `transmis`. Un résultat transmis au PDG est verrouillé.
- **Protection** : champ piège anti-robot, limite par adresse IP (120 démarrages/heure), disjoncteur global
  (3 000/heure), validation stricte des réponses, texte de rédaction toujours affiché comme du texte.
- **Droits** : secrétaire = lecture/écriture via RPC ; PDG = lecture des résultats `transmis` ; coach = aucun accès.
- **Ancienne chaîne Google Form** : abandonnée. La fonction Edge `receive-test-result` ne renvoie plus que 410.
