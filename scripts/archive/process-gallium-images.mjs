#!/usr/bin/env node
/**
 * process-gallium-images.mjs
 *
 * Pipeline d'import des images Gallium depuis le Google Drive local vers
 * le repo frontend, en WebP optimise web. STRICT : ne touche jamais aux
 * fichiers source du Drive (lecture seule).
 *
 * Convention de chemins (compatible avec thumb()/img() de src/utils/paths.js) :
 *   - Full res (1600px max, quality 80) :
 *       frontend/public/images/artists/gallium/posters/<slug>.webp
 *       frontend/public/images/artists/gallium/stickers/<slug>.webp
 *   - Thumbnails (800px max, quality 75) :
 *       frontend/public/images/thumbs/artists/gallium/posters/<slug>.webp
 *       frontend/public/images/thumbs/artists/gallium/stickers/<slug>.webp
 *
 * Skip silencieux : PDF, fichiers non-images.
 * Re-runnable : ecrase les destinations a chaque execution (idempotent).
 *
 * Usage :
 *   node frontend/scripts/process-gallium-images.mjs
 */
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const SRC_BASE = '/Users/mauditemachine/Library/CloudStorage/GoogleDrive-mauditemachine@gmail.com/My Drive/Massive/Projets/Gallium';
// FIX (2 mai 2026) : utiliser fileURLToPath pour decoder les espaces (%20)
// du path quand le repo est sous "Mobile Documents" iCloud.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEST_BASE = path.resolve(__dirname, '../public/images');

const FOLDERS = [
  { src: 'POSTER', kind: 'posters' },
  { src: 'STICKER', kind: 'stickers' },
];

const FULL = { maxWidth: 1600, maxHeight: 1600, quality: 80 };
const THUMB = { maxWidth: 800, maxHeight: 800, quality: 75 };

// Slugify "Fearless 16x20.png" -> "fearless-16x20"
function slugify(name) {
  return name
    .replace(/\.[^.]+$/, '')        // strip extension
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/['"`]/g, '')          // strip quotes
    .replace(/[^a-z0-9]+/g, '-')    // non-alphanumeric -> dash
    .replace(/^-+|-+$/g, '')        // trim dashes
    .replace(/-+/g, '-');
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function processOne(srcPath, fullDest, thumbDest) {
  const buf = await fs.readFile(srcPath);
  // Full res
  await sharp(buf)
    .rotate() // honour EXIF orientation
    .resize({
      width: FULL.maxWidth,
      height: FULL.maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: FULL.quality, effort: 5 })
    .toFile(fullDest);
  // Thumb
  await sharp(buf)
    .rotate()
    .resize({
      width: THUMB.maxWidth,
      height: THUMB.maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: THUMB.quality, effort: 5 })
    .toFile(thumbDest);
}

async function processFolder({ src, kind }) {
  const srcDir = path.join(SRC_BASE, src);
  const fullDir = path.join(DEST_BASE, 'artists', 'gallium', kind);
  const thumbDir = path.join(DEST_BASE, 'thumbs', 'artists', 'gallium', kind);
  await ensureDir(fullDir);
  await ensureDir(thumbDir);

  const entries = await fs.readdir(srcDir);
  const results = [];
  for (const file of entries) {
    if (file.startsWith('.')) continue;
    const ext = path.extname(file).toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.tif', '.tiff', '.webp'].includes(ext)) {
      console.log(`  SKIP ${file} (extension non-image)`);
      continue;
    }
    const slug = slugify(file);
    const srcFile = path.join(srcDir, file);
    const fullDest = path.join(fullDir, `${slug}.webp`);
    const thumbDest = path.join(thumbDir, `${slug}.webp`);
    try {
      await processOne(srcFile, fullDest, thumbDest);
      const stats = await fs.stat(fullDest);
      const tStats = await fs.stat(thumbDest);
      console.log(
        `  OK  ${file.padEnd(50)} -> ${slug}.webp  ` +
        `(full: ${(stats.size / 1024).toFixed(0)}kB | thumb: ${(tStats.size / 1024).toFixed(0)}kB)`
      );
      results.push({ kind, slug, src: file });
    } catch (err) {
      console.error(`  ERR ${file}: ${err.message}`);
    }
  }
  return results;
}

(async () => {
  console.log('Gallium image pipeline');
  console.log(`  Source : ${SRC_BASE}`);
  console.log(`  Dest   : ${DEST_BASE}/artists/gallium/{posters,stickers} + thumbs mirror`);
  console.log('');

  const all = [];
  for (const folder of FOLDERS) {
    console.log(`Processing ${folder.src} -> ${folder.kind}`);
    const r = await processFolder(folder);
    all.push(...r);
    console.log('');
  }

  console.log('---');
  console.log(`Done. ${all.length} images processed.`);
  console.log('Generated slugs (for artists.js) :');
  for (const r of all) {
    console.log(`  [${r.kind}] ${r.slug}`);
  }
})();
