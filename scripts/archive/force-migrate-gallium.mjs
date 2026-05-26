#!/usr/bin/env node
/**
 * force-migrate-gallium.mjs (11 mai 2026)
 *
 * MIGRATION CHIRURGICALE Gallium :
 *   1. Read artists.js -> extract Gallium prints array (id + paths + titles)
 *   2. Pour chaque print : download depuis Cloudflare -> sharp.trim(threshold:15)
 *      -> save dans frontend/public/images/artists/gallium/posters-trimmed/
 *   3. Output rapport console : avant -> apres + % rogne
 *   4. Generate /tmp/gallium-trimmed-prints.json avec les nouveaux paths
 *      pour le step suivant (update Strapi)
 *
 * Usage : node scripts/force-migrate-gallium.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const ARTISTS_JS = path.join(ROOT, 'frontend/src/data/artists.js');
const OUT_DIR = path.join(ROOT, 'frontend/public/images/artists/gallium/posters-trimmed');
const OUT_THUMBS = path.join(ROOT, 'frontend/public/images/artists/gallium/posters-trimmed/thumbs');
const TRIMMED_JSON = '/tmp/gallium-trimmed-prints.json';
const THRESHOLD = 15;

// === STEP 1 : extract Gallium prints from artists.js ===
console.log('[1/4] Lecture de artists.js + extraction prints Gallium...');
const src = fs.readFileSync(ARTISTS_JS, 'utf8');
const printRegex = /\{\s*id:\s*'(gallium-\d+)'[^}]*?titleFr:\s*'([^']+)'[^}]*?fullImage:\s*img\('([^']+)'\)/g;
const prints = [];
let m;
while ((m = printRegex.exec(src)) !== null) {
  const [, id, titleFr, localPath] = m;
  prints.push({
    id,
    titleFr,
    localPath, // ex: /images/artists/gallium/posters/wheel-of-time-20x20.webp
    sourceUrl: `https://massivemedias.com${localPath}`,
  });
}
console.log(`     -> ${prints.length} prints Gallium extraits`);
if (prints.length === 0) {
  console.error('FATAL : aucun print extrait, regex ne matche pas. Aborting.');
  process.exit(1);
}

// === STEP 2 : ensure output directory ===
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(OUT_THUMBS, { recursive: true });
console.log(`[2/4] Output dirs ready : ${OUT_DIR} + thumbs/`);

// === STEP 3 : download + trim chaque image ===
console.log(`[3/4] Trim sharp threshold=${THRESHOLD} ...`);
console.log('');
const results = [];
for (let i = 0; i < prints.length; i++) {
  const p = prints[i];
  const filename = path.basename(p.localPath); // ex: wheel-of-time-20x20.webp
  const outPath = path.join(OUT_DIR, filename);
  const thumbPath = path.join(OUT_THUMBS, filename);

  process.stdout.write(`  [${i + 1}/${prints.length}] ${p.id} "${p.titleFr}"... `);
  try {
    const dlRes = await fetch(p.sourceUrl);
    if (!dlRes.ok) {
      console.log(`SKIP (download HTTP ${dlRes.status})`);
      results.push({ ...p, error: `download_${dlRes.status}` });
      continue;
    }
    const buf = Buffer.from(await dlRes.arrayBuffer());
    const before = await sharp(buf).metadata();
    const trimmed = await sharp(buf).trim({ threshold: THRESHOLD }).webp({ quality: 90 }).toBuffer();
    const after = await sharp(trimmed).metadata();

    // Sauvegarde full + thumb
    fs.writeFileSync(outPath, trimmed);
    await sharp(trimmed).resize({ width: 800, withoutEnlargement: true }).webp({ quality: 75 }).toFile(thumbPath);

    const cutX = (before.width || 0) - (after.width || 0);
    const cutY = (before.height || 0) - (after.height || 0);
    const cutPct = before.width
      ? Math.round(((before.width * before.height - after.width * after.height) / (before.width * before.height)) * 100)
      : 0;
    const beforeSize = `${before.width}x${before.height}`;
    const afterSize = `${after.width}x${after.height}`;
    const isSquare = Math.abs((after.width || 1) / (after.height || 1) - 1) <= 0.05;
    const squareTag = isSquare ? ' [CARRÉ ✓]' : '';

    if (cutX === 0 && cutY === 0) {
      console.log(`PAS DE BORDURE (${beforeSize})`);
    } else {
      console.log(`${beforeSize} -> ${afterSize} (rogné ${cutPct}%, x:${cutX} y:${cutY})${squareTag}`);
    }

    const newPath = `/images/artists/gallium/posters-trimmed/${filename}`;
    const newThumb = `/images/artists/gallium/posters-trimmed/thumbs/${filename}`;
    results.push({
      id: p.id,
      titleFr: p.titleFr,
      oldLocalPath: p.localPath,
      newLocalPath: newPath,
      newThumbPath: newThumb,
      sizeBefore: beforeSize,
      sizeAfter: afterSize,
      trimmedPct: cutPct,
      isSquare,
      sourceUrl: p.sourceUrl,
    });
  } catch (err) {
    console.log(`ERROR ${err.message}`);
    results.push({ ...p, error: err.message });
  }
}

// === STEP 4 : write JSON for next step ===
fs.writeFileSync(TRIMMED_JSON, JSON.stringify(results, null, 2));
console.log('');
console.log(`[4/4] JSON ecrit : ${TRIMMED_JSON}`);

// === RAPPORT ===
const ok = results.filter((r) => !r.error);
const errs = results.filter((r) => r.error);
const squares = ok.filter((r) => r.isSquare);
const trimmed = ok.filter((r) => r.trimmedPct > 0);

console.log('\n=== RAPPORT ===');
console.log(`Total prints traites : ${results.length}`);
console.log(`OK                   : ${ok.length}`);
console.log(`Avec rognage         : ${trimmed.length}`);
console.log(`Carres apres trim    : ${squares.length}`);
console.log(`Erreurs              : ${errs.length}`);
if (errs.length) {
  console.log('Details erreurs :');
  errs.forEach((e) => console.log(`  ${e.id} : ${e.error}`));
}
console.log('');
console.log('Prochain step : update Strapi avec les nouveaux paths.');
