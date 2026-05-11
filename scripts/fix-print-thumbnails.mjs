#!/usr/bin/env node
/**
 * fix-print-thumbnails.mjs (11 mai 2026)
 *
 * Apres push-all-artists-strapi : les `image` des prints en CMS pointent vers
 * /images/thumbs/artists/<slug>/posters-trimmed/<file> qui N'EXISTE PAS
 * localement (les thumbs ont ete generes par migrate-all-artists.mjs dans
 * /images/artists/<slug>/posters-trimmed/THUMBS/<file>). Resultat : grille
 * de prints sur page artiste = 404 sur toutes les miniatures.
 *
 * Ce script :
 *   1. Fetch CMS state (artistes + prints actuels)
 *   2. Pour chaque artiste != gallium et chaque print :
 *      a. Trouve le thumb local au path *correct* (.../posters-trimmed/thumbs/X)
 *      b. Upload sur Supabase via /api/upload
 *      c. Replace print.image par l'URL Supabase publique retournee
 *   3. PUT /api/artists/<docId> avec le tableau prints[] updated
 *
 * Usage : STRAPI_TOKEN=... node scripts/fix-print-thumbnails.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const PUBLIC_DIR = path.join(ROOT, 'frontend/public');
const TOKEN = process.env.STRAPI_TOKEN;
const API = 'https://massivemedias-api.onrender.com/api';
const SKIP_SLUGS = new Set(['gallium']); // deja correct

if (!TOKEN) {
  console.error('FATAL : STRAPI_TOKEN env var requis.');
  process.exit(1);
}

// === STEP 1 : fetch CMS state ===
console.log('[1/4] Fetch CMS state...');
const r0 = await fetch(`${API}/artists?pagination%5BpageSize%5D=50&populate=%2A`, {
  headers: { Authorization: `Bearer ${TOKEN}` },
});
if (!r0.ok) {
  console.error(`FATAL : GET /artists -> ${r0.status}`);
  process.exit(1);
}
const cmsResp = await r0.json();
const artists = cmsResp.data || [];
console.log(`     -> ${artists.length} artistes en CMS`);

// === STEP 2 : helpers ===
function resolveThumbLocal(imagePathFromCMS, artistSlug) {
  // imagePathFromCMS ressemble a "/images/thumbs/artists/adrift/posters-trimmed/Adrift5.webp"
  // (mauvais path). Le VRAI thumb local est :
  //   /images/artists/adrift/posters-trimmed/thumbs/Adrift5.webp
  // On extrait le basename et reconstruit.
  if (!imagePathFromCMS) return null;
  const filename = path.basename(imagePathFromCMS);
  const candidate = path.join(PUBLIC_DIR, 'images/artists', artistSlug, 'posters-trimmed/thumbs', filename);
  if (fs.existsSync(candidate)) return candidate;
  // Fallback : peut-etre que le path en CMS est deja un URL Supabase (deja
  // fixe) ou un autre format. On essaie quelques heuristiques.
  const altCandidate = path.join(PUBLIC_DIR, 'images/artists', artistSlug, 'posters-trimmed', filename);
  if (fs.existsSync(altCandidate)) return altCandidate;
  return null;
}

async function uploadFile(filePath, customName) {
  const buf = fs.readFileSync(filePath);
  const filename = customName || path.basename(filePath);
  const ext = path.extname(filename).toLowerCase();
  const mime = ext === '.png' ? 'image/png'
    : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
    : ext === '.webp' ? 'image/webp'
    : 'application/octet-stream';
  const fd = new FormData();
  fd.append('files', new Blob([buf], { type: mime }), filename);
  const r = await fetch(`${API}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: fd,
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`upload ${filename} -> HTTP ${r.status} : ${txt.slice(0, 200)}`);
  }
  const j = await r.json();
  return j[0];
}

// === STEP 3 : process each artist ===
console.log('[2/4] Migration miniatures vers Supabase...');
const summary = [];

for (const artist of artists) {
  const slug = artist.slug;
  if (SKIP_SLUGS.has(slug)) {
    console.log(`\n  [${slug}] SKIP (deja OK)`);
    continue;
  }
  const prints = artist.prints || [];
  console.log(`\n  [${slug}] ${artist.name} - ${prints.length} prints`);
  let uploaded = 0;
  let kept = 0;
  let missing = 0;
  const newPrints = [];

  for (const p of prints) {
    // Si l'URL est deja une URL Supabase, ne rien refaire.
    if (typeof p.image === 'string' && p.image.startsWith('http')) {
      kept++;
      newPrints.push(p);
      continue;
    }
    const localThumb = resolveThumbLocal(p.image, slug);
    if (!localThumb) {
      console.log(`     [${p.id}] MISSING thumb local (image=${p.image})`);
      missing++;
      newPrints.push(p); // garde l'ancien path (au moins le 404 reste pareil, pas pire)
      continue;
    }
    try {
      const upName = `${slug}_print_${p.id}_${path.basename(localThumb)}`;
      const up = await uploadFile(localThumb, upName);
      uploaded++;
      newPrints.push({ ...p, image: up.url });
      if (uploaded === 1 || uploaded % 5 === 0) {
        console.log(`     [${p.id}] uploaded -> ${up.url.substring(0, 80)}...`);
      }
    } catch (e) {
      console.log(`     [${p.id}] UPLOAD FAIL : ${e.message}`);
      newPrints.push(p);
    }
  }

  // PUT artist avec nouveaux prints[]
  const payload = { data: { prints: newPrints } };
  const r1 = await fetch(`${API}/artists/${artist.documentId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!r1.ok) {
    const txt = await r1.text();
    console.log(`     PUT FAIL HTTP ${r1.status} : ${txt.slice(0, 200)}`);
    summary.push({ slug, status: 'fail_put', uploaded, kept, missing });
    continue;
  }
  console.log(`     PUT OK : uploaded=${uploaded} kept=${kept} missing=${missing}`);
  summary.push({ slug, status: 'ok', uploaded, kept, missing });
}

// === STEP 4 : verification ===
console.log('\n[3/4] Verification finale...');
const r2 = await fetch(`${API}/artists?pagination%5BpageSize%5D=50&populate=%2A`, {
  headers: { Authorization: `Bearer ${TOKEN}` },
});
const verify = await r2.json();
console.log(`     ${verify.data?.length} artistes en CMS apres update :`);
for (const a of verify.data || []) {
  const prints = a.prints || [];
  const supabaseCount = prints.filter((p) => typeof p.image === 'string' && p.image.startsWith('http')).length;
  console.log(`     - ${a.slug.padEnd(20)} prints=${prints.length} | image=Supabase URL : ${supabaseCount}/${prints.length}`);
}

console.log('\n=== RAPPORT ===');
console.log('Slug                 | status | uploaded | kept | missing');
for (const s of summary) {
  console.log(`  ${s.slug.padEnd(20)} | ${s.status.padEnd(6)} | ${String(s.uploaded || 0).padStart(8)} | ${String(s.kept || 0).padStart(4)} | ${String(s.missing || 0).padStart(7)}`);
}
