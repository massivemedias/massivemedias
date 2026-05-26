#!/usr/bin/env node
/**
 * push-all-artists-strapi.mjs (11 mai 2026)
 *
 * MIGRATION STRAPI : pousse tous les artistes locaux dans le CMS via API.
 * - Upload avatar + heroImage en Media (via /api/upload, stocke sur Supabase)
 * - Synchronise les prints[] avec orientation
 * - Update (PUT) si artiste existe, CREATE (POST) sinon (cas Eric Sanchez)
 *
 * Necessite : STRAPI_TOKEN en env (token admin Strapi).
 * Usage : STRAPI_TOKEN=... node scripts/push-all-artists-strapi.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const PUBLIC_DIR = path.join(ROOT, 'frontend/public');
const ARTISTS_JS = path.join(ROOT, 'frontend/src/data/artists.js');
const ARTISTS_STUB = '/tmp/artists-stubbed-push.mjs';
const TOKEN = process.env.STRAPI_TOKEN;
const API = 'https://massivemedias-api.onrender.com/api';
const SKIP_SLUGS = new Set(['gallium']); // deja migre, ne pas re-uploader

if (!TOKEN) {
  console.error('FATAL : STRAPI_TOKEN env var requis.');
  process.exit(1);
}

// === STEP 1 : load artists.js dynamiquement ===
console.log('[1/4] Load artists.js...');
const src = fs.readFileSync(ARTISTS_JS, 'utf8');
const stubbed = src.replace(
  /^import\s+\{\s*thumb\s*,\s*img\s*\}\s+from\s+'\.\.\/utils\/paths';?$/m,
  `const thumb = (p) => p ? p.replace('images/', 'images/thumbs/') : p;
const img = (p) => p;`
);
fs.writeFileSync(ARTISTS_STUB, stubbed);
const mod = await import(ARTISTS_STUB + `?v=${Date.now()}`);
const artistsData = mod.default;

// === STEP 2 : load remote state ===
console.log('[2/4] Fetch CMS state...');
const remoteResp = await fetch(`${API}/artists?pagination%5BpageSize%5D=50&populate=%2A`, {
  headers: { Authorization: `Bearer ${TOKEN}` },
});
if (!remoteResp.ok) {
  console.error(`FATAL : GET /artists -> ${remoteResp.status}`);
  process.exit(1);
}
const remoteJson = await remoteResp.json();
const remoteBySlug = {};
for (const a of remoteJson.data) remoteBySlug[a.slug] = a;
console.log(`     -> ${remoteJson.data.length} artistes en CMS`);

// === STEP 3 : helpers ===
function resolveLocalFile(localPath) {
  // localPath est typiquement 'X' (apres img() qui passe through) ou un thumb path.
  // On normalise pour pointer vers le fichier full res dans PUBLIC_DIR.
  if (!localPath) return null;
  let p = localPath;
  // Le helper thumb stubbe insere 'thumbs/' apres 'images/'. On retire.
  p = p.replace('/images/thumbs/', '/images/');
  if (p.startsWith('/')) p = p.slice(1);
  const abs = path.join(PUBLIC_DIR, p);
  return fs.existsSync(abs) ? abs : null;
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
  // FormData avec Blob (Node 18+)
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
  return j[0]; // { id, url, ... }
}

function buildPrints(localPrints) {
  return (localPrints || []).map((p) => ({
    id: p.id,
    image: p.image,
    fullImage: p.fullImage || p.image,
    titleFr: p.titleFr || p.title || '',
    titleEn: p.titleEn || p.title || '',
    titleEs: p.titleEs || p.titleEn || '',
    limited: !!p.limited,
    orientation: p.orientation || 'portrait',
    ...(p.unique ? { unique: true } : {}),
    ...(p.private ? { private: true } : {}),
    ...(p.sold ? { sold: true } : {}),
    ...(p.customPrice ? { customPrice: p.customPrice } : {}),
    ...(p.fixedFormat ? { fixedFormat: p.fixedFormat } : {}),
    ...(p.fixedTier ? { fixedTier: p.fixedTier } : {}),
    ...(p.maxFormat ? { maxFormat: p.maxFormat } : {}),
    ...(p.onSale ? { onSale: true, salePercent: p.salePercent } : {}),
  }));
}

// === STEP 4 : process each artist ===
console.log('[3/4] Migration par artiste...');
const targets = Object.keys(artistsData).filter((s) => !SKIP_SLUGS.has(s));
const summary = [];

for (const slug of targets) {
  const local = artistsData[slug];
  const remote = remoteBySlug[slug] || null;
  console.log(`\n  [${slug}] ${local.name} ${remote ? `(existant docId=${remote.documentId})` : '(NEW)'}`);

  // --- Avatar ---
  let avatarId = remote?.avatar?.id || null;
  if (!avatarId && local.avatar) {
    const avatarFile = resolveLocalFile(local.avatar);
    if (avatarFile) {
      try {
        const up = await uploadFile(avatarFile, `${slug}_avatar_${path.basename(avatarFile)}`);
        avatarId = up.id;
        console.log(`     avatar uploade : id=${avatarId} url=${up.url}`);
      } catch (e) {
        console.log(`     avatar UPLOAD FAIL : ${e.message}`);
      }
    } else {
      console.log(`     avatar fichier introuvable (${local.avatar})`);
    }
  } else if (avatarId) {
    console.log(`     avatar deja en CMS (id=${avatarId})`);
  }

  // --- HeroImage ---
  let heroId = remote?.heroImage?.id || null;
  if (!heroId && local.heroImage) {
    const heroFile = resolveLocalFile(local.heroImage);
    if (heroFile) {
      try {
        const up = await uploadFile(heroFile, `${slug}_hero_${path.basename(heroFile)}`);
        heroId = up.id;
        console.log(`     hero uploade : id=${heroId} url=${up.url}`);
      } catch (e) {
        console.log(`     hero UPLOAD FAIL : ${e.message}`);
      }
    } else {
      console.log(`     hero fichier introuvable (${local.heroImage})`);
    }
  } else if (heroId) {
    console.log(`     hero deja en CMS (id=${heroId})`);
  }

  // --- Build payload ---
  const prints = buildPrints(local.prints);
  const payload = {
    data: {
      name: local.name,
      taglineFr: local.tagline?.fr || null,
      taglineEn: local.tagline?.en || null,
      taglineEs: local.tagline?.es || null,
      bioFr: local.bio?.fr || null,
      bioEn: local.bio?.en || null,
      bioEs: local.bio?.es || null,
      socials: local.socials || null,
      pricing: local.pricing || null,
      prints,
      ...(avatarId ? { avatar: avatarId } : {}),
      ...(heroId ? { heroImage: heroId } : {}),
    },
  };

  // --- Update or Create ---
  let url, method;
  if (remote) {
    url = `${API}/artists/${remote.documentId}`;
    method = 'PUT';
  } else {
    payload.data.slug = slug;
    payload.data.active = true;
    url = `${API}/artists`;
    method = 'POST';
  }

  const r = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const txt = await r.text();
    console.log(`     ${method} FAIL HTTP ${r.status} : ${txt.slice(0, 300)}`);
    summary.push({ slug, status: 'fail', detail: `${method} ${r.status}` });
    continue;
  }
  const j = await r.json();
  const newDocId = j?.data?.documentId;
  console.log(`     ${method} OK : docId=${newDocId} | prints=${prints.length}`);
  summary.push({ slug, status: 'ok', docId: newDocId, prints: prints.length, avatar: avatarId, hero: heroId });
}

// === FINAL : verify ===
console.log('\n[4/4] Verification API...');
const verifyResp = await fetch(`${API}/artists?pagination%5BpageSize%5D=50&populate%5B0%5D=avatar&populate%5B1%5D=heroImage`, {
  headers: { Authorization: `Bearer ${TOKEN}` },
});
const verify = await verifyResp.json();
console.log(`     Total artistes CMS : ${verify.data?.length}`);
for (const a of verify.data || []) {
  const hasAvatar = !!a.avatar?.url;
  const hasHero = !!a.heroImage?.url;
  const printsCount = (a.prints || []).length;
  const squareCount = (a.prints || []).filter((p) => p.orientation === 'square').length;
  console.log(`     - ${a.slug.padEnd(20)} prints=${printsCount} (${squareCount} square) avatar=${hasAvatar ? 'OK' : 'MISSING'} hero=${hasHero ? 'OK' : 'MISSING'}`);
}

console.log('\n=== RAPPORT ===');
console.log(`Total artistes traites : ${summary.length}`);
console.log(`OK                     : ${summary.filter((s) => s.status === 'ok').length}`);
console.log(`Fail                   : ${summary.filter((s) => s.status !== 'ok').length}`);
