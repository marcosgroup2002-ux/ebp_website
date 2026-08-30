# Brancher un vrai backend

Le dashboard fonctionne aujourd'hui sur des données en mémoire
(`src/data/adminData.js`), lues et écrites via deux fichiers de service :

- `src/services/paymentsService.js`
- `src/services/checklistsService.js`

**C'est volontaire.** Ces deux fichiers sont la seule couche qui touche aux
données. Les composants (`PaymentsView`, `ChecklistsView`, les modales...)
n'accèdent jamais directement à `adminData.js` pour écrire : ils appellent
toujours une fonction de service. Résultat : brancher un vrai backend veut
dire réécrire le **corps** de ces fonctions, pas les composants qui les
appellent. Chaque fonction de `paymentsService.js` est déjà écrite comme une
fonction `async`, comme si elle appelait une vraie API.

Deux chemins possibles, comme demandé dans le brief. Aucun des deux n'est
branché : les deux demandent des identifiants (Google Cloud ou Supabase) que
seul EBP peut créer.

---

## Option immédiate : Google Sheets API

Le plus rapide à mettre en place, cohérent avec les habitudes actuelles de
l'équipe (Playbook 3.2 : "Accéder au tableau de suivi des paiements ici").

### 1. Créer le Web App (Google Apps Script)

Dans le Google Sheet qui sert de base de données : **Extensions → Apps
Script**, puis coller ce code dans `Code.gs` :

```javascript
// Code.gs : à coller dans l'éditeur Apps Script du Google Sheet
const SHEET_NAME = "Paiements";

function doGet(e) {
  if (!isAuthorized(e)) return jsonResponse({ error: "unauthorized" });
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const rows = data.map((row) =>
    Object.fromEntries(headers.map((h, i) => [h, row[i]]))
  );
  return jsonResponse(rows);
}

function doPost(e) {
  if (!isAuthorized(e)) return jsonResponse({ error: "unauthorized" });
  const payload = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  sheet.appendRow([
    payload.id,
    payload.name,
    payload.cohort,
    payload.option,
    payload.total,
    payload.paid,
    payload.nextDueDate,
    payload.status,
  ]);
  return jsonResponse({ ok: true });
}

// Authentification minimale : une clé partagée, stockée dans les propriétés
// du script (jamais en dur dans le code). Suffisant pour décourager un accès
// non autorisé, pas pour protéger des données sensibles à grande échelle.
function isAuthorized(e) {
  const key =
    (e.parameter && e.parameter.apiKey) ||
    (e.postData && JSON.parse(e.postData.contents).apiKey);
  return key === PropertiesService.getScriptProperties().getProperty("API_KEY");
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
```

Puis : **Paramètres du projet → Propriétés du script**, ajouter `API_KEY`
avec une valeur secrète générée. Enfin **Déployer → Nouveau déploiement →
Application Web**, accès "Tout le monde" (l'API_KEY fait office de
protection), et copier l'URL du déploiement.

### 2. Brancher le frontend

Dans `src/services/paymentsService.js`, remplacer le corps de
`fetchLearners` et `recordPayment` par de vrais appels `fetch` vers cette
URL, avec l'API_KEY passée en paramètre. Les signatures des fonctions ne
changent pas : seuls les composants n'ont rien à modifier.

### 3. Sauvegarde automatique

Un Web App Apps Script n'a pas de sauvegarde intégrée. Ce script Node,
lancé périodiquement, télécharge l'état du Sheet en JSON horodaté :

```javascript
// scripts/backup-sheet.mjs
import fs from "node:fs/promises";

const WEB_APP_URL = process.env.EBP_SHEET_WEBAPP_URL;
const API_KEY = process.env.EBP_SHEET_API_KEY;

async function backup() {
  const res = await fetch(`${WEB_APP_URL}?apiKey=${API_KEY}`);
  if (!res.ok) throw new Error(`Échec de récupération du Sheet : ${res.status}`);
  const data = await res.json();

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  await fs.mkdir("backups", { recursive: true });
  await fs.writeFile(`backups/paiements-${stamp}.json`, JSON.stringify(data, null, 2));
  console.log(`Sauvegarde écrite : backups/paiements-${stamp}.json (${data.length} lignes)`);
}

backup().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Et un déclenchement quotidien via GitHub Actions
(`.github/workflows/backup.yml`) :

```yaml
name: Sauvegarde quotidienne du Sheet EBP
on:
  schedule:
    - cron: "0 2 * * *" # 02h00 UTC chaque jour
  workflow_dispatch: {}
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: node scripts/backup-sheet.mjs
        env:
          EBP_SHEET_WEBAPP_URL: ${{ secrets.EBP_SHEET_WEBAPP_URL }}
          EBP_SHEET_API_KEY: ${{ secrets.EBP_SHEET_API_KEY }}
      - uses: actions/upload-artifact@v4
        with:
          name: backup-${{ github.run_id }}
          path: backups/
```

**Limite honnête de cette option** : Apps Script n'offre pas de vrais rôles
utilisateurs ni de Row Level Security. L'authentification par rôle
(Secrétaire / Formateur / Manager / Promoteur) demandée dans le brief n'est
réalisable proprement qu'avec l'option Supabase ci-dessous.

---

## Option recommandée : Supabase

Le schéma complet, prêt à coller dans l'éditeur SQL de Supabase, est dans
[`docs/schema.sql`](./schema.sql) : tables `profiles`, `apprenants`,
`paiements`, `checklist_entries`, `alertes_manager`, avec des politiques RLS
qui appliquent déjà les 4 rôles du Playbook.

### Étapes

1. Créer un projet sur [supabase.com](https://supabase.com).
2. Coller `docs/schema.sql` dans **SQL Editor → New query**, exécuter.
3. Activer l'authentification par email (**Authentication → Providers**).
4. `npm install @supabase/supabase-js`
5. Créer `src/lib/supabaseClient.js` :

```javascript
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

6. Remplacer le corps des fonctions dans `paymentsService.js` /
   `checklistsService.js` par des appels `supabase.from(...)`. Exemple pour
   `recordPayment` :

```javascript
export async function recordPayment(learnerId, payment) {
  const { data, error } = await supabase
    .from("paiements")
    .insert({
      apprenant_id: learnerId,
      montant: payment.amount,
      mode: payment.mode,
      date_paiement: payment.date,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
```

7. Remplacer `AdminGate` (mot de passe unique en dur) par
   `supabase.auth.signInWithPassword()`, et lire le rôle depuis la table
   `profiles` une fois connecté : ce qui remplace aussi le sélecteur
   d'identité de démonstration dans `AdminGate.jsx`.

C'est le chemin qui satisfait vraiment "authentification par rôles avec
gestion fine des accès" : la Row Level Security de `schema.sql` s'applique
au niveau de la base de données elle-même, pas seulement dans le code
frontend (qui peut toujours être contourné par un utilisateur curieux).

---

## Résumé des points de bascule

| Aujourd'hui | À remplacer par |
| --- | --- |
| `SAMPLE_LEARNERS` (`src/data/adminData.js`) | Table `apprenants` |
| `learner.history` en mémoire | Table `paiements` |
| État React local des checklists | Table `checklist_entries` |
| Mot de passe unique + sélecteur d'identité (`AdminGate.jsx`) | `supabase.auth` + table `profiles` |
| `src/services/paymentsService.js` | Mêmes signatures, corps branché sur Sheets ou Supabase |
| `src/services/checklistsService.js` | Idem |
