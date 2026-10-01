# Architecture Production, Sécurité & Supabase EBP

Ce document décrit l'architecture de sécurité et le modèle de données de production pour l'espace d'administration du site **EBP (English for Busy People)**.

---

## 1. Rôles et Périmètres d'Accès

Le système comporte 3 espaces d'accès avec des privilèges strictement définis :

### 1.1 Espace Secrétaire (`secretaire`)
- **Acteur :** Miss Amirath (Secrétaire)
- **Identifiants de production :**
  - Email : `josiasdevweb@gmail.com`
  - Téléphone : `+229 0168897793`
  - Mot de passe : `EbpSec2026!Secr`
- **Mécanisme d'authentification :**
  - Connexion soumise à un déclenchement d'OTP transmis au PDG pour validation.
  - Notification d'audit instantanée enregistrant en arrière-plan : Date, Heure, Adresse IP et Lieu géographique.
- **Fonctionnalités :**
  - Gestion opérationnelle des apprenants pour les centres de **Calavi** et **Cotonou**.
  - Affectation aux 3 cohortes actives : **18.6**, **18.7** et **18.8**.
  - Enregistrement des versements et calcul en temps réel des impayés et relances (J+5, J+10).
  - Gestion de la checklist quotidienne du secrétariat.
  - Chaque création, modification ou suppression génère une trace immuable dans les journaux d'audit.

### 1.2 Espace Coachs (`coach`) - Page Unifiée
- **Acteurs :** 6 Coachs au total (4 sur le centre de Calavi, 2 sur le centre de Cotonou).
- **Identifiant d'accès :**
  - Mot de passe unique partagé : `Mon-cours`
- **Fonctionnalités :**
  - Accès en lecture seule à leur emploi du temps hebdomadaire.
  - Filtres interactifs par centre (Calavi / Cotonou), par cohorte (18.6, 18.7, 18.8) et par coach.
  - Fil d'actualité pour consulter les consignes et communiqués officiels émis par le PDG.
  - **Restriction absolue :** Aucun accès aux données financières ou administratives.

### 1.3 Espace PDG (`pdg`) - Supervision & Analytics
- **Acteur :** Mr Sessou Fernando (PDG)
- **Identifiants de production :**
  - Email : `marcosgroup2002@gmail.com`
  - Téléphone : `+229 0159123494`
  - Mot de passe Maître : `EbpBoss2026#Master`
- **Fonctionnalités :**
  - **Posture 100% contrôle / supervision analytique** (aucune saisie opérationnelle).
  - Validation et approbation en direct des requêtes OTP déclenchées par la secrétaire.
  - Consultation et exportation des **Journaux d'Audit (Audit Logs)** retraçant toutes les actions avec IP et localisation.
  - **Dashboard Analytique en temps réel :**
    - Taux de recouvrement financier (%) et montant des impayés.
    - Suivi des retards critiques J+5 et J+10.
    - Taux de régularité globale des apprenants.
    - Graphiques d'évolution des inscriptions par centre (Calavi vs Cotonou) et par cohorte (18.6, 18.7, 18.8).
  - Module d'émission de communiqués et consignes urgentes pour les coachs.

---

## 2. Déploiement de la Base de Données Supabase

Le schéma complet de production se trouve dans [`docs/schema.sql`](./schema.sql).

### Étapes d'exécution :
1. Connectez-vous à votre console [Supabase](https://supabase.com).
2. Ouvrez votre projet (ex: `https://qkdhidsqyzahesvjpcqo.supabase.co`).
3. Allez dans **SQL Editor → New query**.
4. Collez l'intégralité du contenu de [`docs/schema.sql`](./schema.sql) et cliquez sur **Run**.
5. Récupérez vos clés API dans **Project Settings → API** :
   - URL : `https://qkdhidsqyzahesvjpcqo.supabase.co`
   - Clé publique `anon` / `publishable` : reportez-la dans le fichier `.env.local` sous `VITE_SUPABASE_ANON_KEY`.

---

## 3. Traçabilité et Audit Logs

Chaque action sensible appelle la fonction `logAuditEvent()` dans `src/services/auditService.js` :
- Action exécutée (`CONNEXION_OTP_DEMANDEE`, `CREATION_APPRENANT`, `ENREGISTREMENT_PAIEMENT`, `SUPPRESSION_APPRENANT`, etc.)
- Auteur et rôle
- Horodatage ISO
- Adresse IP et Localisation client
- Détails explicites

Ces données sont stockées dans la table Supabase `audit_logs` ainsi que dans le stockage local persistant pour garantir une disponibilité continue même en cas d'interruption réseau.

---

## 4. Envoi automatique d'OTP par Email et SMS au PDG

Lors de chaque tentative de connexion de la secrétaire Miss Amirath, la fonction `sendOtpNotification()` dans `src/services/authService.js` est automatiquement invoquée :

### 4.1 Spécifications des messages :
- **Email transmis au PDG** :
  - **Destinataire** : `marcosgroup2002@gmail.com`
  - **Sujet** : `[EBP Admin] Code d'autorisation de connexion - Miss Amirath`
  - **Contenu** : Demande d'accès, code OTP à 6 chiffres (valable 10 min), heure, adresse IP et lieu de connexion.
- **SMS transmis au PDG** :
  - **Destinataire** : `+2290159123494`
  - **Texte** : `[EBP Admin] Code OTP pour Miss Amirath : {OTP_CODE}. IP: {IP_ADDRESS}. Valide 10 min.`

### 4.2 Déploiement de la Edge Function Supabase :
La Edge Function prête à l'emploi est disponible dans [`supabase/functions/send-otp-notification/index.ts`](../supabase/functions/send-otp-notification/index.ts).

Pour la déployer dans votre projet Supabase avec les clés API de messagerie :
```bash
# 1. Configurer les secrets de messagerie (ex: Resend pour Email, Termii pour SMS)
supabase secrets set RESEND_API_KEY="votre_cle_resend"
supabase secrets set TERMII_API_KEY="votre_cle_termii"
supabase secrets set SENDER_EMAIL="securite@ebp-benin.com"

# 2. Déployer la fonction
supabase functions deploy send-otp-notification
```
En l'absence de passerelle externe connectée, le système consigne immédiatement les notifications formatées dans la console et dans les journaux d'audit de sécurité, tout en maintenant actif le sas de validation côté PDG et la saisie de l'OTP par la secrétaire.

