#!/usr/bin/env node
/**
 * generate-sitemap.mjs
 *
 * Regenere frontend/public/sitemap.xml a partir de la source unique
 * frontend/scripts/routes.mjs (qui combine STATIC_ROUTES + fetch dynamique
 * des slugs artistes depuis Strapi, avec fallback hardcode).
 *
 * Avant ce refactor, la liste etait dupliquee dans 3 fichiers
 * (l'ancien scripts/generate-sitemap.mjs racine, frontend/scripts/seo-prerender.js
 * obsolete et frontend/scripts/generate-spa-routes.sh obsolete), ce qui avait
 * cree une divergence (/news listee dans le sitemap mais absente du router).
 * Cette version delegue tout a routes.mjs pour rester en sync avec le prerender.
 *
 * Si Strapi est down, routes.mjs retombe sur FALLBACK_ARTISTS et on ecrit
 * un sitemap quand meme : jamais de sortie vide.
 *
 * Usage :
 *   node frontend/scripts/generate-sitemap.mjs
 *   (appele aussi par "prebuild" dans frontend/package.json)
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { SITE_URL, STATIC_ROUTES, getAllSitemapRoutes } from './routes.mjs';

const __filename = fileURLToPath(import.meta.url);
// __filename = .../frontend/scripts/generate-sitemap.mjs
// dirname(..., '..') = .../frontend
const OUTPUT = resolve(dirname(__filename), '..', 'public/sitemap.xml');

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
  const all = await getAllSitemapRoutes();
  const today = new Date().toISOString().slice(0, 10);
  const artistCount = all.length - STATIC_ROUTES.length;

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    `  <!-- Genere automatiquement par frontend/scripts/generate-sitemap.mjs le ${today}. -->`,
    `  <!-- ${all.length} URLs au total (${STATIC_ROUTES.length} statiques + ${artistCount} artistes). -->`,
    `  <!-- Routes : voir frontend/scripts/routes.mjs (source unique). -->`,
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
