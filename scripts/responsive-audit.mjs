// ============================================================================
// AUDIT RESPONSIVE — détecte les débordements horizontaux sur plusieurs pages
// et plusieurs tailles d'écran, avec capture d'écran automatique en cas de
// problème.
// ============================================================================
// Usage :
//   1. npm run build && npm run preview   (dans un terminal)
//   2. node scripts/responsive-audit.mjs   (dans un autre terminal)
//
// Si Playwright n'a pas encore de navigateur installé :
//   npx playwright install chromium
//
// Le script sort avec un code d'erreur non nul si un débordement est détecté,
// ce qui le rend utilisable dans une CI (GitHub Actions, etc.).

import { chromium } from "playwright";
import fs from "node:fs/promises";

const BASE_URL = process.env.AUDIT_BASE_URL || "http://localhost:4173";
const SCREENSHOT_DIR = "audit-screenshots";

const VIEWPORTS = [
  { name: "320x568", w: 320, h: 700 },
  { name: "375x667", w: 375, h: 700 },
  { name: "390x844", w: 390, h: 844 },
  { name: "768x1024", w: 768, h: 1024 },
  { name: "1024x768", w: 1024, h: 768 },
  { name: "1440x900", w: 1440, h: 900 },
];

const PAGES = ["/", "/a-propos", "/blog", "/contact"];

async function checkPage(page, path, viewport) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(400);
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }));
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const path of PAGES) {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
      const info = await checkPage(page, path, vp);
      results.push({ path, viewport: vp.name, ...info });

      if (info.hasOverflow) {
        await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
        const filename = `${SCREENSHOT_DIR}/BROKEN-${path.replace(/\//g, "_") || "home"}-${vp.name}.png`;
        await page.screenshot({ path: filename, fullPage: true });
        console.log(`✗ Débordement : ${path} @ ${vp.name} (${info.scrollWidth}px > ${info.clientWidth}px) → ${filename}`);
      }
      await page.close();
    }
  }

  await browser.close();

  const broken = results.filter((r) => r.hasOverflow);
  console.log(`\n${results.length - broken.length}/${results.length} vérifications OK.`);

  if (broken.length > 0) {
    console.log(`${broken.length} problème(s) détecté(s). Captures dans ${SCREENSHOT_DIR}/.`);
    process.exit(1);
  }
  console.log("Aucun débordement horizontal détecté. ✓");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
