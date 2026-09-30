// ============================================================================
// PRÉ-RENDU DES BALISES OG/META PAR PAGE (hook post-build)
// ============================================================================
// Le site est un SPA 100% rendu côté client (pas de SSR). <Seo /> pose bien
// un <title>/<meta> propre à chaque page via le support natif de React 19
// pour ces balises (voir src/components/Seo.jsx) — ça fonctionne pour les
// visiteurs et pour les robots qui exécutent du JS (Googlebot). Mais les
// robots qui n'exécutent PAS de JS — WhatsApp, Facebook, LinkedIn, Twitter/X,
// Slack — ne lisent que le HTML brut renvoyé par le serveur : ils ne
// verraient donc toujours que le <head> statique d'index.html, c'est-à-dire
// le titre et l'image génériques de la home, même en partageant le lien d'un
// article de blog précis.
//
// Ce script tourne après `vite build` (hook "postbuild" dans package.json,
// donc automatiquement via `npm run build`) : il démarre un serveur
// `vite preview` local, ouvre chaque route dans un navigateur headless
// (Playwright, déjà utilisé par scripts/responsive-audit.mjs — aucune
// dépendance ajoutée), laisse React poser les balises définitives, puis
// sauvegarde le HTML obtenu comme fichier statique à la route
// correspondante dans dist/ (ex. dist/blog/mon-slug/index.html).
//
// Résultat : n'importe quel robot, avec ou sans JS, voit le bon
// titre/description/image OG pour CHAQUE page publique. Les routes non
// pré-rendues ici (tout /admin/*) gardent le SPA shell d'index.html et
// continuent de fonctionner via le rewrite catch-all de vercel.json — elles
// n'ont pas besoin d'OG (noindex, jamais partagées) et le gate d'accès reste
// entièrement côté client comme avant.
//
// Bonus : le HTML sauvegardé contient aussi le rendu déjà exécuté par React,
// donc un visiteur humain voit le contenu affiché immédiatement au premier
// paint. React reprend la main normalement ensuite (createRoot() réaffiche
// par-dessus, ce n'est pas de l'hydration) : aucun risque de mismatch.
//
// Si Playwright n'a pas encore de navigateur installé :
//   npx playwright install chromium

import { preview } from "vite";
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BLOG_POSTS } from "../src/data/blogPosts.js";

const ROOT_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT_DIR, "dist");
const PORT = 4174; // différent de celui de `npm run preview` / responsive-audit.mjs

const STATIC_ROUTES = ["/", "/a-propos", "/blog", "/contact"];
const BLOG_ROUTES = BLOG_POSTS.map((p) => `/blog/${p.slug}`);
const ROUTES = [...STATIC_ROUTES, ...BLOG_ROUTES];

async function main() {
  const distIndex = path.join(DIST_DIR, "index.html");
  try {
    await fs.access(distIndex);
  } catch {
    console.error(`Introuvable : ${distIndex}. Lance \`vite build\` avant ce script.`);
    process.exit(1);
  }

  const server = await preview({
    root: ROOT_DIR,
    preview: { port: PORT, strictPort: true, host: "127.0.0.1" },
  });
  const base = server.resolvedUrls.local[0].replace(/\/$/, "");

  const browser = await chromium.launch({ headless: true });
  let ok = 0;

  try {
    for (const route of ROUTES) {
      const page = await browser.newPage();
      try {
        await page.goto(`${base}${route}`, { waitUntil: "networkidle", timeout: 15000 });
        // Attend que <Seo /> ait posé ses balises définitives (og:title
        // n'existe dans le head qu'une fois qu'une page l'a rendu).
        await page.waitForFunction(() => document.querySelector('meta[property="og:title"]') !== null, {
          timeout: 5000,
        });
        const html = "<!doctype html>\n" + (await page.content());

        const outPath = route === "/" ? distIndex : path.join(DIST_DIR, route.slice(1), "index.html");
        await fs.mkdir(path.dirname(outPath), { recursive: true });
        await fs.writeFile(outPath, html, "utf-8");
        console.log(`✓ ${route} → ${path.relative(DIST_DIR, outPath)}`);
        ok += 1;
      } catch (err) {
        console.error(`✗ Échec du pré-rendu pour ${route} :`, err.message);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.httpServer.close(resolve));
  }

  console.log(`\n${ok}/${ROUTES.length} pages pré-rendues avec leurs balises OG/meta.`);
  if (ok !== ROUTES.length) process.exit(1);
}

main().catch((err) => {
  console.error("Échec du pré-rendu OG :", err);
  process.exit(1);
});
