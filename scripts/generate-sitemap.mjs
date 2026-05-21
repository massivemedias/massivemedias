#!/usr/bin/env node
/**
 * generate-sitemap.mjs (14 mai 2026)
 *
 * Regenere `frontend/public/sitemap.xml` en combinant :
 *   1. URLs statiques (services, boutique, pages SEO locales, etc.)
 *   2. URLs artistes dynamiques fetchees depuis Strapi (/api/artists)
 *
 * Usage local :
 *   node scripts/generate-sitemap.mjs
 *
 * Usage CI/CD (a integrer dans .github/workflows/deploy.yml AVANT
 *   `npm run build` du frontend) :
 *   - run: node scripts/generate-sitemap.mjs
 *   - run: cd frontend && npm run build
 *
 * Le script utilise l'endpoint REST public Strapi (auth.find seedee
 * dans backend/src/index.ts:74-75). Aucun token requis. Si Strapi est
 * down, le script log un warning et ecrit quand meme le sitemap avec
 * uniquement les URLs statiques + un fallback hardcode des artistes
 * principaux (pour ne jamais publier un sitemap vide).
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '..');
const OUTPUT = resolve(ROOT, 'frontend/public/sitemap.xml');
const SITE_URL = 'https://massivemedias.com';
const STRAPI_API = process.env.STRAPI_API_URL || 'https://massivemedias-api.onrender.com/api';

// ---------------------------------------------------------------------------
// URLs statiques (alignees sur App.jsx + getServicesData.js + Boutique.jsx).
// `priority` 1.0 = home, 0.9 = top pages SEO locales, 0.8 = services/boutique,
// 0.7 = artistes liste, 0.6 = artistes individuels, 0.5 = secondary.
// `changefreq` weekly pour les contenus dynamiques, monthly pour le reste.
// ---------------------------------------------------------------------------
const STATIC_ROUTES = [
  { loc: '/',                                       priority: '1.0', changefreq: 'weekly' },

  // Pages SEO locales (landing pages keyword)
  { loc: '/imprimeur-plateau-mont-royal',           priority: '0.9', changefreq: 'monthly' },
  { loc: '/stickers-personnalises-montreal',        priority: '0.9', changefreq: 'monthly' },
  { loc: '/print-fine-art-quebec',                  priority: '0.9', changefreq: 'monthly' },
  { loc: '/sublimation-textile-montreal',           priority: '0.9', changefreq: 'monthly' },
  { loc: '/impression-flyers-montreal',             priority: '0.9', changefreq: 'monthly' },

  // Corporate
  { loc: '/a-propos',                               priority: '0.7', changefreq: 'monthly' },
  { loc: '/contact',                                priority: '0.7', changefreq: 'monthly' },
  { loc: '/temoignage',                             priority: '0.5', changefreq: 'monthly' },
  { loc: '/news',                                   priority: '0.6', changefreq: 'weekly'  },

  // Services
  { loc: '/services/prints',                        priority: '0.8', changefreq: 'monthly' },
  { loc: '/services/stickers',                      priority: '0.8', changefreq: 'monthly' },
  { loc: '/services/merch',                         priority: '0.8', changefreq: 'monthly' },
  { loc: '/services/design',                        priority: '0.8', changefreq: 'monthly' },
  { loc: '/services/web',                           priority: '0.8', changefreq: 'monthly' },

  // Boutique principale + categories
  { loc: '/boutique',                               priority: '0.8', changefreq: 'weekly'  },
  { loc: '/boutique/fine-art',                      priority: '0.8', changefreq: 'weekly'  },
  { loc: '/boutique/stickers',                      priority: '0.8', changefreq: 'weekly'  },
  { loc: '/boutique/sublimation',                   priority: '0.8', changefreq: 'monthly' },
  { loc: '/boutique/design',                        priority: '0.8', changefreq: 'monthly' },
  { loc: '/boutique/web',                           priority: '0.8', changefreq: 'monthly' },
  { loc: '/boutique/merch/tshirt',                  priority: '0.7', changefreq: 'monthly' },
  { loc: '/boutique/merch/hoodie',                  priority: '0.7', changefreq: 'monthly' },
  { loc: '/boutique/merch/longsleeve',              priority: '0.7', changefreq: 'monthly' },
  { loc: '/boutique/flyers',                        priority: '0.7', changefreq: 'monthly' },

  // Artistes (liste)
  { loc: '/artistes',                               priority: '0.7', changefreq: 'weekly'  },
];

// Fallback hardcode des artistes principaux si Strapi est down (evite un
// sitemap regresse). Mis a jour manuellement si le CMS plante longtemps.
const FALLBACK_ARTISTS = [
  'maudite-machine', 'psyqu33n', 'adrift', 'mok',
  'quentin-delobel', 'no-pixl', 'cornelia-rose', 'eric-sanchez', 'gallium',
];

async function fetchArtistSlugs() {
  try {
    // pageSize: 100 (= maxLimit dans backend/config/api.ts, valide REST v5).
    // PAS limit:-1 qui plante avec maxLimit configure. Cf. fix hotfix
    // useArtists.jsx pour le detail technique.
    const url = `${STRAPI_API}/artists?fields[0]=slug&pagination[pageSize]=100`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const list = Array.isArray(json?.data) ? json.data : [];
    const slugs = list
      .map((a) => (a?.slug ? String(a.slug).trim() : ''))
      .filter(Boolean);
    if (slugs.length === 0) throw new Error('aucun slug retourne');
    console.log(`[generate-sitemap] ${slugs.length} artistes fetches depuis Strapi`);
    return slugs;
  } catch (err) {
    console.warn(`[generate-sitemap] WARN : fetch Strapi echoue (${err.message}). Fallback hardcode ${FALLBACK_ARTISTS.length} artistes.`);
    return FALLBACK_ARTISTS;
  }
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry({ loc, priority = '0.5', changefreq = 'monthly', lastmod }) {
  const lm = lastmod || new Date().toISOString().slice(0, 10);
  return [
    '  <url>',
    `    <loc>${escapeXml(SITE_URL + loc)}</loc>`,
    `    <lastmod>${lm}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n');
}

async function main() {
  const artistSlugs = await fetchArtistSlugs();
  const artistEntries = artistSlugs.map((slug) => ({
    loc: `/artistes/${slug}`,
    priority: '0.6',
    changefreq: 'weekly',
  }));

  const all = [...STATIC_ROUTES, ...artistEntries];
  const today = new Date().toISOString().slice(0, 10);

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    `  <!-- Genere automatiquement par scripts/generate-sitemap.mjs le ${today}. -->`,
    `  <!-- ${all.length} URLs au total (${STATIC_ROUTES.length} statiques + ${artistEntries.length} artistes). -->`,
    ...all.map(urlEntry),
    '</urlset>',
    '',
  ].join('\n');

  writeFileSync(OUTPUT, xml, 'utf8');
  console.log(`[generate-sitemap] OK -> ${OUTPUT} (${all.length} URLs)`);
}

main().catch((err) => {
  console.error('[generate-sitemap] FATAL :', err);
  process.exit(1);
});
