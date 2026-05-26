#!/usr/bin/env node
/**
 * migrate-all-artists.mjs (11 mai 2026)
 *
 * MIGRATION GLOBALE des artistes restants (tous SAUF gallium qui est deja fait).
 *
 * Pour chaque artiste :
 *   1. Charger artists.js dynamiquement (apres stub des helpers paths)
 *   2. Pour chaque print :
 *      a. Lire l'image source locale (depuis frontend/public/<path>)
 *      b. sharp().trim({ threshold: 15 }) pour enlever bordures blanches
 *      c. sharp().metadata() apres trim -> calculer orientation
 *         ('square' si |ratio-1| <= 0.05, 'landscape' si w/h > 1.1, sinon 'portrait')
 *      d. Sauvegarder dans frontend/public/images/artists/<slug>/posters-trimmed/<file>
 *      e. Generer thumb 800px dans posters-trimmed/thumbs/
 *   3. Output JSON ready-to-push + patch direct dans artists.js :
 *      - Replace paths -> /images/artists/<slug>/posters-trimmed/<file>
 *      - Inject orientation: 'X' dans chaque print literal
 *
 * Le user (frontend) verra immediatement le fix car ArtisteDetail.jsx lit
 * `selectedPrint?.orientation || 'portrait'` qui pickera la nouvelle value.
 *
 * Usage : node scripts/migrate-all-artists.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const PUBLIC_DIR = path.join(ROOT, 'frontend/public');
const ARTISTS_JS = path.join(ROOT, 'frontend/src/data/artists.js');
const ARTISTS_STUB = path.join(ROOT, '/tmp/artists-stubbed.mjs');
const OUTPUT_JSON = '/tmp/all-artists-trimmed.json';
const THRESHOLD = 15;
const SKIP_SLUGS = new Set(['gallium']); // deja migre

// === STEP 1 : load artists.js dynamiquement (stub des helpers paths) ===
console.log('[1/5] Stub + load artists.js...');
const src = fs.readFileSync(ARTISTS_JS, 'utf8');
// Replace l'import des helpers paths par des stubs locaux.
const stubbed = src.replace(
  /^import\s+\{\s*thumb\s*,\s*img\s*\}\s+from\s+'\.\.\/utils\/paths';?$/m,
  `const thumb = (p) => p ? p.replace('images/', 'images/thumbs/') : p;
const img = (p) => p;`
);
fs.mkdirSync(path.dirname(ARTISTS_STUB), { recursive: true });
fs.writeFileSync(ARTISTS_STUB, stubbed);
const mod = await import(ARTISTS_STUB + `?v=${Date.now()}`);
const artistsData = mod.default;
const allSlugs = Object.keys(artistsData);
const targetSlugs = allSlugs.filter((s) => !SKIP_SLUGS.has(s));
console.log(`     -> ${allSlugs.length} artistes total, ${targetSlugs.length} a migrer (skip: ${[...SKIP_SLUGS].join(', ')})`);

// === STEP 2 : ensure output dirs ===
console.log('[2/5] Preparation dossiers output...');
for (const slug of targetSlugs) {
  fs.mkdirSync(path.join(PUBLIC_DIR, 'images/artists', slug, 'posters-trimmed'), { recursive: true });
  fs.mkdirSync(path.join(PUBLIC_DIR, 'images/artists', slug, 'posters-trimmed/thumbs'), { recursive: true });
}

// === STEP 3 : compute orientation utility ===
function computeOrientation(w, h) {
  if (!w || !h) return 'portrait';
  const ratio = w / h;
  if (Math.abs(ratio - 1) <= 0.05) return 'square';
  if (ratio >= 1.1) return 'landscape';
  return 'portrait';
}

// === STEP 4 : trim + orientation pour chaque print de chaque artiste ===
console.log(`[3/5] Trim sharp threshold=${THRESHOLD} sur tous les artistes...`);
const allResults = {};
const allPatches = []; // {oldPath, newPath, orientation} pour patch text plus tard

for (const slug of targetSlugs) {
  const a = artistsData[slug];
  if (!a?.prints?.length) {
    console.log(`  [${slug}] SKIP (aucun print)`);
    continue;
  }
  console.log(`\n  [${slug}] ${a.name} - ${a.prints.length} prints :`);
  const artistResults = [];

  for (const print of a.prints) {
    // p.fullImage est la full res ; p.image est le thumb. On part de fullImage
    // si dispo, sinon on derive le full path depuis le thumb.
    let srcPath = print.fullImage || print.image;
    if (!srcPath) {
      console.log(`    SKIP ${print.id} (pas de path)`);
      continue;
    }
    // Normaliser : s'assurer qu'on a un chemin /images/ sans le thumbs/.
    if (srcPath.includes('/images/thumbs/')) {
      srcPath = srcPath.replace('/images/thumbs/', '/images/');
    }
    // Strip leading slash pour resolve dans PUBLIC_DIR.
    const relPath = srcPath.startsWith('/') ? srcPath.slice(1) : srcPath;
    const absPath = path.join(PUBLIC_DIR, relPath);

    if (!fs.existsSync(absPath)) {
      console.log(`    [${print.id}] SKIP : fichier introuvable (${relPath})`);
      artistResults.push({ id: print.id, error: 'file_not_found', srcPath: relPath });
      continue;
    }

    const filename = path.basename(absPath);
    const outFull = path.join(PUBLIC_DIR, 'images/artists', slug, 'posters-trimmed', filename);
    const outThumb = path.join(PUBLIC_DIR, 'images/artists', slug, 'posters-trimmed/thumbs', filename);
    const newLocalPath = `/images/artists/${slug}/posters-trimmed/${filename}`;

    try {
      const before = await sharp(absPath).metadata();
      const trimmedBuf = await sharp(absPath).trim({ threshold: THRESHOLD }).webp({ quality: 90 }).toBuffer();
      const after = await sharp(trimmedBuf).metadata();
      fs.writeFileSync(outFull, trimmedBuf);
      await sharp(trimmedBuf).resize({ width: 800, withoutEnlargement: true }).webp({ quality: 75 }).toFile(outThumb);

      const orientation = computeOrientation(after.width, after.height);
      const cutPct = before.width && after.width
        ? Math.round(((before.width * before.height - after.width * after.height) / (before.width * before.height)) * 100)
        : 0;
      const sizeBefore = `${before.width}x${before.height}`;
      const sizeAfter = `${after.width}x${after.height}`;
      const orientationTag = orientation === 'square' ? ' [CARRE]' : orientation === 'landscape' ? ' [LANDSCAPE]' : '';

      console.log(`    [${print.id}] ${sizeBefore} -> ${sizeAfter} (-${cutPct}%) ${orientation}${orientationTag}`);

      artistResults.push({
        id: print.id,
        titleFr: print.titleFr,
        oldLocalPath: srcPath,
        newLocalPath,
        sizeBefore, sizeAfter, cutPct, orientation,
      });

      // Pour le patch du texte artists.js, on tracke chaque path remplace.
      // On remplacera srcPath (et son thumb equivalent) par newLocalPath
      // (et thumb correspondant) dans le source.
      allPatches.push({
        printId: print.id,
        artistSlug: slug,
        oldFullPath: srcPath,
        newFullPath: newLocalPath,
        orientation,
      });
    } catch (err) {
      console.log(`    [${print.id}] ERROR ${err.message}`);
      artistResults.push({ id: print.id, error: err.message });
    }
  }

  allResults[slug] = artistResults;
}

// === STEP 5 : output JSON + patch artists.js ===
fs.writeFileSync(OUTPUT_JSON, JSON.stringify(allResults, null, 2));
console.log(`\n[4/5] JSON output : ${OUTPUT_JSON}`);

console.log('[5/5] Patch artists.js avec orientation + nouveaux paths...');
let newSrc = src;
let patchCount = 0;

for (const p of allPatches) {
  // 1. Replace le path full dans le source texte. Le path peut apparaitre
  //    soit comme `img('/images/X')` soit comme `thumb('/images/X')`.
  //    On remplace les DEUX usages (image: thumb, fullImage: img) en une passe.
  const oldEscaped = p.oldFullPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`'${oldEscaped}'`, 'g');
  if (newSrc.match(re)) {
    newSrc = newSrc.replace(re, `'${p.newFullPath}'`);
  }

  // 2. Injecter orientation: 'X' dans le print literal correspondant. Le print
  //    literal commence par `{ id: 'p.printId', ...` et se termine par `}`.
  //    On cherche la 1re occurrence non-deja-orientation-marquee.
  //    Pattern : "{ id: 'PRINT_ID'..." (jusqu'au prochain '}')
  const printIdEscaped = p.printId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Regex non-greedy pour trouver le bloc print.
  const blockRe = new RegExp(`(\\{\\s*id:\\s*'${printIdEscaped}'[^}]*?)(\\s*\\})`, 'g');
  let injectedThisPrint = false;
  newSrc = newSrc.replace(blockRe, (match, head, tail) => {
    if (injectedThisPrint) return match; // ne le faire qu'une fois
    if (/orientation\s*:/.test(head)) {
      // deja marque -> remplacer la valeur
      const replaced = head.replace(/orientation\s*:\s*'[^']*'/, `orientation: '${p.orientation}'`);
      injectedThisPrint = true;
      return replaced + tail;
    }
    injectedThisPrint = true;
    // Append " orientation: 'X'" avant le }, en gardant le trailing comma proper.
    const trimmed = head.replace(/,\s*$/, ''); // strip trailing comma s'il y en a
    return `${trimmed}, orientation: '${p.orientation}'${tail}`;
  });

  patchCount++;
}

fs.writeFileSync(ARTISTS_JS, newSrc);
console.log(`     -> ${patchCount} prints patches dans artists.js`);

// === RAPPORT ===
console.log('\n=== RAPPORT MIGRATION GLOBALE ===');
const totalTried = Object.values(allResults).reduce((acc, arr) => acc + arr.length, 0);
const totalOK = Object.values(allResults).reduce((acc, arr) => acc + arr.filter(r => !r.error).length, 0);
const totalErr = totalTried - totalOK;
const totalSquare = Object.values(allResults).reduce((acc, arr) => acc + arr.filter(r => r.orientation === 'square').length, 0);
const totalLandscape = Object.values(allResults).reduce((acc, arr) => acc + arr.filter(r => r.orientation === 'landscape').length, 0);
const totalPortrait = totalOK - totalSquare - totalLandscape;
console.log(`Total prints tentes : ${totalTried}`);
console.log(`OK                  : ${totalOK}`);
console.log(`  - portrait        : ${totalPortrait}`);
console.log(`  - landscape       : ${totalLandscape}`);
console.log(`  - square          : ${totalSquare}`);
console.log(`Erreurs / skip      : ${totalErr}`);
console.log('');
console.log('Par artiste :');
for (const slug of targetSlugs) {
  const r = allResults[slug] || [];
  const ok = r.filter(x => !x.error).length;
  console.log(`  - ${slug.padEnd(20)} ${ok}/${r.length} OK`);
}
console.log('');
console.log('PROCHAINE ETAPE : git status pour voir les nouveaux fichiers, puis commit + push.');
