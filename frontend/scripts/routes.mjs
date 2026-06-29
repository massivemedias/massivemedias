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
 *   /imprimeur-mile-end (Navigate), /boutique/stickers (Navigate),
 *   /boutique/flyers (Navigate vers /boutique/fine-art), /boutique/merch-tshirt
 *   (Navigate), /services/* legacy slugs (Navigate),
 *   /news (n'existe pas dans le router App.jsx).
 */
export const STATIC_ROUTES = [
  '/',
  '/a-propos',
  '/contact',
  '/temoignage',
  // Pages services (5)
  '/services/prints',
  '/services/stickers',
  '/services/merch',
  '/services/design',
  '/services/web',
  // Landings SEO locales (5)
  '/imprimeur-plateau-mont-royal',
  '/stickers-personnalises-montreal',
  '/print-fine-art-quebec',
  '/sublimation-textile-montreal',
  '/impression-flyers-montreal',
  // Boutique (8)
  '/boutique',
  '/boutique/fine-art',
  '/boutique/sublimation',
  '/boutique/design',
  '/boutique/web',
  '/boutique/merch/tshirt',
  '/boutique/merch/hoodie',
  '/boutique/merch/longsleeve',
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
 * Fetch les artistes (slug + updatedAt) depuis Strapi. Sur erreur, retombe sur
 * FALLBACK_ARTISTS (sans updatedAt). Ne throw jamais : le build et le prerender
 * doivent pouvoir continuer meme Strapi down.
 *
 * Retourne un tableau d'objets { slug, updatedAt }, updatedAt = null si absent.
 */
export async function fetchArtists() {
  const url = `${STRAPI_API}/artists?fields[0]=slug&fields[1]=updatedAt&pagination[pageSize]=100`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    // Strapi v4 -> attributes.X, Strapi v5 -> X directement. On gere les deux.
    const artists = (json.data || [])
      .map((a) => ({
        slug: a?.attributes?.slug || a?.slug,
        updatedAt: a?.attributes?.updatedAt || a?.updatedAt || null,
      }))
      .filter((a) => a.slug);
    if (artists.length === 0) throw new Error('aucun slug retourne');
    console.log(`[routes] ${artists.length} artistes fetches depuis Strapi`);
    return artists;
  } catch (err) {
    // Fallback. On SIGNALE BRUYAMMENT en CI via une annotation GitHub Actions
    // ::warning:: (remonte dans le resume du run) : si Strapi est froid au
    // build et qu'on retombe ici, un artiste recemment ajoute peut manquer du
    // sitemap. Pas d'echec silencieux.
    console.warn(
      `[routes] fetch Strapi a echoue (${err?.message || err}), fallback sur ${FALLBACK_ARTISTS.length} artistes hardcodes`,
    );
    console.log(
      `::warning title=Sitemap fallback Strapi::Strapi inaccessible au build, sitemap genere depuis FALLBACK_ARTISTS (${FALLBACK_ARTISTS.length} artistes). Un artiste recemment ajoute peut manquer du sitemap. Re-deployer quand Strapi repond.`,
    );
    return FALLBACK_ARTISTS.map((slug) => ({ slug, updatedAt: null }));
  }
}

/**
 * Liste complete des routes a PRE-RENDER.
 * = STATIC_ROUTES + 1 route par artiste actif.
 */
export async function getAllPrerenderRoutes() {
  const artists = await fetchArtists();
  return [...STATIC_ROUTES, ...artists.map((a) => `/artistes/${a.slug}`)];
}

/**
 * Liste complete des routes pour le SITEMAP avec metadata SEO par categorie.
 * Memes routes que le prerender + (priority, changefreq, lastmod) calcules.
 */
export async function getAllSitemapRoutes() {
  const artists = await fetchArtists();
  return [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    ...STATIC_ROUTES.filter((r) => r !== '/').map((loc) => {
      // Landings SEO locales = priorite haute, change souvent.
      if (/^\/(imprimeur|stickers|print|sublimation|impression)-/.test(loc)) {
        return { loc, priority: '0.8', changefreq: 'weekly' };
      }
      // /boutique* : priorite BASSE, volontairement SOUS /artistes. La vue
      // prints de /boutique duplique le catalogue /artistes (meme CMS, memes
      // prix, memes images) ; on laisse /artistes primer comme page d'origine.
      if (loc.startsWith('/boutique')) {
        return { loc, priority: '0.5', changefreq: 'weekly' };
      }
      return { loc, priority: '0.7', changefreq: 'monthly' };
    }),
    ...artists.map((a) => ({
      loc: `/artistes/${a.slug}`,
      priority: '0.6',
      changefreq: 'monthly',
      // lastmod reel tire de updatedAt Strapi ; omis si indisponible (fallback)
      // plutot que de mettre une date de build fausse.
      lastmod: a.updatedAt ? String(a.updatedAt).slice(0, 10) : undefined,
    })),
  ];
}
