// Compresse les photos du site en gardant une qualité visuelle élevée.
// Pour chaque image : une version pleine largeur (max 1920 px) et une version « -960 »
// utilisée sur mobile et pour les vignettes. Les originaux restent dans ebp-photo/.
//
// Usage : node scripts/optimize-images.mjs

import { readdir, stat, rename, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const FOLDERS = ["public/photos", "public/graduation"];
const FULL_WIDTH = 1920;
const SMALL_WIDTH = 960;
const SMALL_SUFFIX = "-960";

async function encode(input, output, width, quality) {
  const tmp = `${output}.tmp`;
  await sharp(input)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true, progressive: true })
    .toFile(tmp);
  if (input === output) await unlink(output);
  await rename(tmp, output);
}

let before = 0;
let after = 0;

for (const folder of FOLDERS) {
  const files = (await readdir(folder)).filter(
    (f) => /\.(jpe?g)$/i.test(f) && !f.includes(`${SMALL_SUFFIX}.`)
  );

  for (const file of files) {
    const full = path.join(folder, file);
    const ext = path.extname(file);
    const small = path.join(folder, `${path.basename(file, ext)}${SMALL_SUFFIX}${ext}`);

    const originalSize = (await stat(full)).size;
    await encode(full, small, SMALL_WIDTH, 76);
    await encode(full, full, FULL_WIDTH, 80);

    const fullSize = (await stat(full)).size;
    const smallSize = (await stat(small)).size;
    before += originalSize;
    after += fullSize;
    console.log(
      `${full}: ${(originalSize / 1024).toFixed(0)} Ko → ${(fullSize / 1024).toFixed(0)} Ko (mobile ${(smallSize / 1024).toFixed(0)} Ko)`
    );
  }
}

console.log(`\nTotal pleine largeur : ${(before / 1048576).toFixed(1)} Mo → ${(after / 1048576).toFixed(1)} Mo`);
