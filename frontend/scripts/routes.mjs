/**
 * routes.mjs - Source unique des routes du site.
 *
 * Consomme par :
 *   - frontend/scripts/prerender.mjs       (snapshot HTML par route)
 *   - frontend/scripts/generate-sitemap.mjs (sitemap.xml)
 *
 * Avant ce refactor, la liste etait dupliquee dans 3 fichiers, ce qui a deja
 * cause une divergence (/news listee dans le sitemap mais absente du router).
 * Centraliser ici garantit que prerender et sitemap sont toujours en phase.
 */

export const SITE_URL = 'https://massivemedias.com';
export const STRAPI_API = 'https://massivemedias-api.onrender.com/api';

/**
 * Routes statiques publiques a indexer.
 *
 * Volontairement EXCLUS (dynamiques, prives, ou redirections) :
 *   /panier, /login, /account, /admin/*, /mm-admin,
 *   /vente-privee/:token, /suivi, /tracking,
 *   /services (Navigate vers /), /tarifs (Navigate), /portfolio (Navigate),
 *   /boutique/stickers (Navigate),
 *   /boutique/merch-tshirt (Navigate), /services/* legacy slugs (Navigate),
 *   /news (n'existe pas dans le router App.jsx).
 */
export const STATIC_ROUTES = [
  '/',
  '/a-propos',
  '/contact',
  // SEO-2026 (voie rapide, GO Mika) : /temoignage RETIRE du sitemap + prerender.
  // C'est une page utilitaire gated par token ; sa version crawlable (sans token)
  // = "lien invalide". Route client conservee (les invites y accedent via leur
  // lien), mais page en noindex (cf. Temoignage.jsx) et hors sitemap.
  // ALLUMAGE STICKERS (8 juillet 2026) : la collection est en vente,
  // la page entre au prerender + sitemap avec le flag STICKERS_SHOP_ENABLED.
  '/stickers',
  // LANCEMENT MINI MASSIVE (15 juillet 2026) : etiquettes enfants, checkout
  // branche (SEC-04), flag ETIQUETTES_ENABLED=true.
  '/etiquettes',
  // Pages services (5)
  '/services/prints',
  '/services/stickers',
  '/services/merch',
  '/services/design',
  '/services/web',
  // Landings SEO locales (7)
  // RESTORE-MILE-END (7 juillet 2026) : mile-end redevient une vraie page
  // (mode zone desservie), coexiste avec plateau-mont-royal.
  '/imprimeur-plateau-mont-royal',
  '/imprimeur-mile-end',
  '/stickers-personnalises-montreal',
  '/print-fine-art-quebec',
  '/sublimation-textile-montreal',
  '/impression-flyers-montreal',
  // SEO-2026 : intention "etiquettes enfants" (Mini Massive vs Colle a moi, rentree)
  '/etiquettes-personnalisees-enfants-montreal',
  // Boutique : SEUL le hub reste au sitemap (SEO-2026 volet 2). Les 8 sous-pages
  // /boutique/* etaient soit des 301 (web/flyers), soit des doublons de /services/*
  // (design/fine-art), soit du merch cache redirige vers l'accueil -> toutes
  // RETIREES du sitemap (un sitemap ne liste que des 200 canoniques). Elles
  // redirigent en 301 via public/_redirects.
  '/boutique',
  // Artistes (index, le detail est ajoute dynamiquement plus bas)
  '/artistes',
];

/**
 * Liste de secours si Strapi est inaccessible au build (cold start Render,
 * timeout reseau, panne). Garantit qu'on ne genere jamais un sitemap vide
 * d'artistes. A re-synchroniser quand on ajoute/supprime un artiste actif.
 */
export const FALLBACK_ARTISTS = [
  'no-pixl',
  'maudite-machine',
  'eric-sanchez',
  'cornelia-rose',
  'mok',
  'quentin-delobel',
  'adriftvision',
  'psyqu33n',
  'gallium',
];

/**
 * Fetch les slugs artistes depuis Strapi. Sur erreur, retombe sur la liste
 * FALLBACK_ARTISTS. Ne throw jamais : le build et le prerender doivent
 * pouvoir continuer meme Strapi down.
 */
export async function fetchArtistSlugs() {
  const url = `${STRAPI_API}/artists?fields[0]=slug&pagination[pageSize]=100`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    // Strapi v4 -> attributes.slug, Strapi v5 -> slug directement. On gere les deux.
    const slugs = (json.data || [])
      .map((a) => a?.attributes?.slug || a?.slug)
      .filter(Boolean);
    if (slugs.length === 0) throw new Error('aucun slug retourne');
    console.log(`[routes] ${slugs.length} artistes fetches depuis Strapi`);
    return slugs;
  } catch (err) {
    console.warn(
      `[routes] fetch Strapi a echoue (${err?.message || err}), fallback sur ${FALLBACK_ARTISTS.length} artistes hardcodes`,
    );
    return FALLBACK_ARTISTS;
  }
}

/**
 * Liste complete des routes a PRE-RENDER.
 * = STATIC_ROUTES + 1 route par artiste actif.
 */
export async function getAllPrerenderRoutes() {
  const artistSlugs = await fetchArtistSlugs();
  return [...STATIC_ROUTES, ...artistSlugs.map((s) => `/artistes/${s}`)];
}

/**
 * Liste complete des routes pour le SITEMAP avec metadata SEO par categorie.
 * Memes routes que le prerender + (priority, changefreq) calcules.
 */
export async function getAllSitemapRoutes() {
  const artistSlugs = await fetchArtistSlugs();
  return [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    ...STATIC_ROUTES.filter((r) => r !== '/').map((loc) => {
      // Landings SEO locales + boutique = priorite haute, change souvent.
      if (
        loc.startsWith('/boutique') ||
        /^\/(imprimeur|stickers|print|sublimation|impression)-/.test(loc)
      ) {
        return { loc, priority: '0.8', changefreq: 'weekly' };
      }
      return { loc, priority: '0.7', changefreq: 'monthly' };
    }),
    ...artistSlugs.map((s) => ({
      loc: `/artistes/${s}`,
      priority: '0.6',
      changefreq: 'monthly',
    })),
  ];
}
