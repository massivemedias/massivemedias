/**
 * Cloudflare Worker - OG Meta Tags pour sous-domaines artistes
 * + SEO meta injection pour toutes les pages du site principal
 *
 * Detecte les crawlers (Facebook, Twitter, etc.) sur les sous-domaines artistes
 * et retourne un HTML avec les bons meta OG (image, titre, description).
 * Les vrais users passent normalement vers le SPA.
 *
 * Pour le domaine principal, injecte les meta tags SEO page-specifiques
 * dans le HTML via HTMLRewriter (streaming).
 *
 * Deploiement:
 * 1. Aller sur Cloudflare Dashboard > Workers & Pages > Create
 * 2. Coller ce script
 * 3. Ajouter une route: *.massivemedias.com/*
 */

const SITE_URL = 'https://massivemedias.com';
const DEFAULT_OG_IMAGE = 'https://massivemedias.com/og-image.jpg';

// --- Artistes depuis le CMS (Strapi) ---
// Aucune liste hardcodee : la source de verite est la base de donnees.
// Un artiste ajoute dans le CMS devient routable immediatement, sans
// toucher a ce Worker.
const CMS_API = 'https://massivemedias-api.onrender.com/api';
const ARTISTS_CACHE_TTL = 600000; // 10 min
const artistsCache = { data: null, ts: 0 };

// Normalise un slug pour une comparaison tolerante aux tirets :
// 'adrift-vision' et 'adriftvision' deviennent tous deux 'adriftvision'.
function normSlug(s) {
  return String(s || '').toLowerCase().replace(/-/g, '');
}

// Recupere la liste des artistes depuis le CMS, avec cache memoire (TTL
// 10 min, au niveau de l'isolat Worker - meme pattern que le cache IG).
// En cas d'echec CMS : retourne le cache perime s'il existe, sinon [].
// Le sous-domaine continue de fonctionner meme CMS down (le SPA recharge
// les donnees cote client) - seules les meta SEO server-side degradent.
async function getArtists() {
  if (artistsCache.data && Date.now() - artistsCache.ts < ARTISTS_CACHE_TTL) {
    return artistsCache.data;
  }
  let signal;
  try { signal = AbortSignal.timeout(5000); } catch (_) { signal = undefined; }
  try {
    const resp = await fetch(`${CMS_API}/artists?pagination[pageSize]=100`, {
      headers: { Accept: 'application/json' },
      signal,
    });
    if (!resp.ok) throw new Error(`CMS ${resp.status}`);
    const json = await resp.json();
    const list = Array.isArray(json && json.data) ? json.data : [];
    const artists = list
      .filter((a) => a && a.slug)
      .map((a) => ({
        slug: String(a.slug),
        name: a.name || a.slug,
        taglineFr: a.taglineFr || '',
        taglineEn: a.taglineEn || '',
      }));
    if (artists.length > 0) {
      artistsCache.data = artists;
      artistsCache.ts = Date.now();
      return artists;
    }
    return artistsCache.data || [];
  } catch (_) {
    return artistsCache.data || [];
  }
}

// Resout un label de sous-domaine vers un artiste CMS.
// Match exact du slug d'abord, puis match en ignorant les tirets.
function resolveArtist(subdomain, artists) {
  if (!subdomain || !Array.isArray(artists)) return null;
  const sub = String(subdomain).toLowerCase();
  const exact = artists.find((a) => String(a.slug).toLowerCase() === sub);
  if (exact) return exact;
  const n = normSlug(sub);
  return artists.find((a) => normSlug(a.slug) === n) || null;
}

// Sous-domaines reserves qui ne sont JAMAIS traites comme un artiste
// (services internes). Garde aligne avec RESERVED_SUBDOMAINS de frontend/src/App.jsx.
const RESERVED_SUBDOMAINS = new Set(['www', 'api', 'admin', 'mm-admin', 'cms', 'mail', 'dev', 'staging', 'preview', 'm']);

// --- SEO Meta par route ---

const ROUTE_META = {
  '/': {
    // SEO-AGGRESSIVE (8 mai 2026) : aligne sur le title homepage de l'app -
    // keywords prioritaires "imprimeur montreal", "stickers", "prints", "fine
    // art" en debut de title pour maximiser le poids SEO local.
    title: 'Imprimeur Montreal | Stickers, Prints & Fine Art | Massive Medias',
    description: 'Service d\'impression sur mesure a Montreal. Specialiste en stickers personnalises, fine art, merch et impressions grand format pour artistes et entreprises. Production locale Mile-End, livraison rapide au Quebec.',
  },
  '/artistes': {
    title: 'Artistes | Massive Medias - Photographes, Peintres & Artistes Visuels',
    description: 'Decouvrez nos artistes partenaires. Photographes, peintres et artistes visuels. Prints, stickers et merch disponibles.',
  },
  '/boutique': {
    title: 'Boutique | Massive Medias - Prints, Stickers & Merch',
    description: 'Achetez des prints fine art, stickers die-cut, t-shirts et hoodies. Impression professionnelle, materiaux premium. Livraison rapide.',
  },
  '/services/prints': {
    title: 'Impression Fine Art Montreal | Massive Medias - Imprimeur Tirages Premium',
    description: "Imprimeur fine art a Montreal. Papier Hahnemuhle, encres pigmentaires 12 couleurs, formats A6 a A2. Tirages photo, affiches, posters. Livraison locale 24-48h. Meilleur imprimeur Montreal.",
  },
  '/services/stickers': {
    title: 'Stickers Personnalises Montreal | Massive Medias - Die-Cut Premium',
    description: 'Stickers die-cut personnalises a Montreal. Vinyle impermeable, finitions holographique, glossy, matte, broken glass. Autocollants premium pour artistes et entreprises.',
  },
  '/services/merch': {
    title: 'Impression Textile Montreal | Massive Medias - T-shirts, Hoodies Personnalises',
    description: 'Impression textile par sublimation a Montreal. T-shirts, hoodies, long sleeves, tote bags personnalises. All-over ou placement. Production locale rapide.',
  },
  '/services/design': {
    title: 'Design Graphique Montreal | Massive Medias - Logos, Branding & Identite Visuelle',
    description: "Graphiste a Montreal. Logos, identite visuelle, flyers evenementiels, pochettes d'album, affiches, cartes d'affaires. Design creatif et moderne. Devis gratuit.",
  },
  '/services/web': {
    title: 'Developpement Web Montreal | Massive Medias - Sites Web, E-commerce & SEO',
    description: 'Developpeur web a Montreal. Sites vitrines, e-commerce, applications React, SEO, webmastering. Performance, design moderne et referencement. Devis gratuit.',
  },
  '/a-propos': {
    title: 'A propos | Massive Medias - Studio Creatif Montreal Mile-End',
    description: 'Massive Medias est un studio de production creative base au Mile-End a Montreal. Notre mission: rendre la creation accessible.',
  },
  '/contact': {
    title: 'Contact | Massive Medias - Demandez un Devis',
    description: 'Contactez Massive Medias pour vos projets d\'impression, design ou web. Studio au Mile-End, Montreal. Reponse rapide garantie.',
  },
  '/boutique/fine-art': {
    title: 'Prints Fine Art Montreal | Massive Medias - Tirages Hahnemuhle',
    description: 'Achetez des tirages fine art sur papier Hahnemuhle a Montreal. Impressions pigmentaires haute qualite, formats A6 a A2. Artistes locaux, editions limitees. Livraison rapide.',
  },
  '/boutique/stickers': {
    title: 'Stickers Personnalises Montreal | Massive Medias - Die-Cut Premium',
    description: 'Stickers personnalises die-cut a Montreal. Vinyle impermeable, finitions holographique, matte, glossy, broken glass. Commande en ligne, livraison rapide.',
  },
  '/boutique/sublimation': {
    title: 'Sublimation Textile Montreal | Massive Medias - T-shirts & Hoodies',
    description: 'Impression sublimation textile a Montreal. T-shirts, hoodies, long sleeves, tote bags personnalises. All-over ou placement. Production locale.',
  },
  '/boutique/design': {
    title: 'Design Graphique Montreal | Massive Medias - Logos & Branding',
    description: 'Services de design graphique a Montreal. Logos, identite visuelle, flyers, affiches evenementiels, pochettes d\'album. Design moderne et creatif.',
  },
  '/boutique/web': {
    title: 'Developpement Web Montreal | Massive Medias - Sites & E-commerce',
    description: 'Developpement web professionnel a Montreal. Sites vitrines, e-commerce, applications React, SEO, webmastering. Performance et design moderne.',
  },
  '/boutique/merch/tshirt': {
    title: 'T-Shirts Personnalises Montreal | Massive Medias - Sublimation',
    description: 'T-shirts personnalises par sublimation a Montreal. Gildan, impression all-over ou placement. Commande en ligne, production locale.',
  },
  '/boutique/merch/hoodie': {
    title: 'Hoodies Personnalises Montreal | Massive Medias - Sublimation',
    description: 'Hoodies personnalises par sublimation a Montreal. Impression all-over ou placement. Qualite premium, production locale.',
  },
  '/boutique/merch/longsleeve': {
    title: 'Long Sleeves Personnalises Montreal | Massive Medias - Sublimation',
    description: 'Long Sleeves personnalises par sublimation a Montreal. Impression all-over ou placement. Production locale, livraison rapide.',
  },
  '/boutique/flyers': {
    title: 'Impression Flyers & Cartes d\'affaires Montreal | Massive Medias - Rapide & Pro',
    description: 'Flyers et cartes d\'affaires a Montreal. Standard 14pt, lamine 16pt, Soft Touch 24pt premium. Recto-verso inclus. A partir de 55$ les 100 cartes. Production locale Mile-End.',
  },
  '/temoignage': {
    title: 'Temoignages Clients | Massive Medias - Avis & Reviews',
    description: 'Avis et temoignages de clients satisfaits de Massive Medias. Impression fine art, stickers, design graphique et developpement web a Montreal.',
  },
};

/**
 * Retourne les meta pour un pathname donne.
 * Gere les routes statiques, les pages artistes dynamiques, et null pour les routes inconnues.
 */
function getMetaForPath(pathname) {
  // Normaliser: enlever le trailing slash (sauf pour /)
  const path = pathname === '/' ? '/' : pathname.replace(/\/$/, '');

  // Route statique exacte
  if (ROUTE_META[path]) {
    return {
      ...ROUTE_META[path],
      ogImage: ROUTE_META[path].ogImage || DEFAULT_OG_IMAGE,
      canonicalUrl: `${SITE_URL}${path === '/' ? '' : path}`,
    };
  }

  // Pages artistes dynamiques: /artistes/:slug
  const artistMatch = path.match(/^\/artistes\/([a-z0-9-]+)$/);
  if (artistMatch) {
    const slug = artistMatch[1];
    const artistName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return {
      title: `${artistName} | Massive Medias - Prints & Oeuvres`,
      description: `Decouvrez les oeuvres de ${artistName} sur Massive Medias. Prints fine art disponibles en plusieurs formats.`,
      ogImage: `${SITE_URL}/images/og/og-${slug}.jpg`,
      canonicalUrl: `${SITE_URL}/artistes/${slug}`,
    };
  }

  // Route inconnue - pas d'injection
  return null;
}

// --- HTMLRewriter handlers ---

class TitleRewriter {
  constructor(title) {
    this.title = title;
  }

  element(element) {
    element.setInnerContent(this.title);
  }
}

class MetaRewriter {
  constructor(meta) {
    this.meta = meta;
  }

  element(element) {
    const name = element.getAttribute('name');
    const property = element.getAttribute('property');

    if (name === 'description') {
      element.setAttribute('content', this.meta.description);
    } else if (property === 'og:title') {
      element.setAttribute('content', this.meta.title);
    } else if (property === 'og:description') {
      element.setAttribute('content', this.meta.description);
    } else if (property === 'og:url') {
      element.setAttribute('content', this.meta.canonicalUrl);
    } else if (property === 'og:image') {
      element.setAttribute('content', this.meta.ogImage);
    }
  }
}

class CanonicalRewriter {
  constructor(canonicalUrl) {
    this.canonicalUrl = canonicalUrl;
  }

  element(element) {
    if (element.getAttribute('rel') === 'canonical') {
      element.setAttribute('href', this.canonicalUrl);
      this.found = true;
    }
  }
}

class HeadEndRewriter {
  constructor(meta) {
    this.meta = meta;
  }

  element(element) {
    const tags = [];

    // Injecter les meta manquantes qui n'existaient pas dans le HTML original
    // og:url et canonical sont souvent absents du SPA build
    if (!this.meta._hasOgUrl) {
      tags.push(`<meta property="og:url" content="${this.meta.canonicalUrl}">`);
    }
    if (!this.meta._hasCanonical) {
      tags.push(`<link rel="canonical" href="${this.meta.canonicalUrl}">`);
    }
    if (!this.meta._hasOgImage) {
      tags.push(`<meta property="og:image" content="${this.meta.ogImage}">`);
    }
    if (!this.meta._hasOgTitle) {
      tags.push(`<meta property="og:title" content="${this.meta.title}">`);
    }
    if (!this.meta._hasOgDescription) {
      tags.push(`<meta property="og:description" content="${this.meta.description}">`);
    }
    if (!this.meta._hasDescription) {
      tags.push(`<meta name="description" content="${this.meta.description}">`);
    }

    if (tags.length > 0) {
      element.prepend(tags.join('\n'), { html: true });
    }
  }
}

/**
 * Detecte quels meta tags existent deja dans le HTML pour eviter les doublons.
 * On utilise un premier pass HTMLRewriter juste pour scanner.
 */
class MetaDetector {
  constructor(meta) {
    this.meta = meta;
  }

  element(element) {
    const name = element.getAttribute('name');
    const property = element.getAttribute('property');
    const rel = element.getAttribute('rel');

    if (name === 'description') this.meta._hasDescription = true;
    if (property === 'og:title') this.meta._hasOgTitle = true;
    if (property === 'og:description') this.meta._hasOgDescription = true;
    if (property === 'og:url') this.meta._hasOgUrl = true;
    if (property === 'og:image') this.meta._hasOgImage = true;
    if (rel === 'canonical') this.meta._hasCanonical = true;
  }
}

/**
 * Applique HTMLRewriter pour injecter/remplacer les meta tags SEO.
 */
function injectMeta(response, meta) {
  // Flags de detection - on presume que les tags n'existent pas,
  // et les handlers les mettront a true s'ils les trouvent
  meta._hasDescription = false;
  meta._hasOgTitle = false;
  meta._hasOgDescription = false;
  meta._hasOgUrl = false;
  meta._hasOgImage = false;
  meta._hasCanonical = false;

  return new HTMLRewriter()
    // Scanner les meta/link existantes pour detecter ce qui est deja la
    .on('meta', new MetaDetector(meta))
    .on('link', new MetaDetector(meta))
    // Remplacer le titre
    .on('title', new TitleRewriter(meta.title))
    // Remplacer les meta existantes
    .on('meta[name="description"]', new MetaRewriter(meta))
    .on('meta[property="og:title"]', new MetaRewriter(meta))
    .on('meta[property="og:description"]', new MetaRewriter(meta))
    .on('meta[property="og:url"]', new MetaRewriter(meta))
    .on('meta[property="og:image"]', new MetaRewriter(meta))
    // Remplacer le canonical existant
    .on('link[rel="canonical"]', new CanonicalRewriter(meta.canonicalUrl))
    // Injecter les tags manquants a la fin du <head>
    .on('head', new HeadEndRewriter(meta))
    .transform(response);
}

/**
 * Determine si la requete est pour une page HTML (pas un asset statique).
 * FIX-GOOGLEBOT (10 mai 2026) : on ne se base PLUS sur Accept: text/html
 * car certains bots (Googlebot mobile dans certains tests "URL inspection")
 * envoient Accept: *\/* ou pas de header Accept du tout. Resultat : le SPA
 * fallback ne se declenchait pas et Google recevait 404, refusait
 * l'indexation. Maintenant : tout chemin sans extension de fichier statique
 * est considere comme HTML (pattern SPA standard).
 */
function isHtmlRequest(request, url) {
  // Exclure les fichiers statiques par extension - signal clair de "non-HTML"
  const path = url.pathname;
  const staticExtensions = /\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|json|xml|txt|map|mp4|webm|pdf)$/i;
  if (staticExtensions.test(path)) return false;

  // Tout le reste = HTML presume (pattern SPA, Accept header pas fiable
  // selon les User-Agents).
  return true;
}

// User agents des crawlers qui lisent les meta OG
const CRAWLER_PATTERNS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'Slackbot',
  'TelegramBot',
  'WhatsApp',
  'Discordbot',
  'Googlebot',
  'bingbot',
  'Pinterestbot',
];

function isCrawler(userAgent) {
  if (!userAgent) return false;
  return CRAWLER_PATTERNS.some(p => userAgent.includes(p));
}

function getSubdomain(hostname) {
  const match = hostname.match(/^([^.]+)\.massivemedias\.com$/);
  if (match && match[1] !== 'www') return match[1];
  return null;
}

function buildOGPage(subdomain, artist) {
  // artist peut etre null (sous-domaine sans correspondance CMS) : on
  // genere alors des meta generiques derivees du label de sous-domaine.
  artist = artist || {
    slug: subdomain,
    name: subdomain.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    taglineFr: 'Artiste sur Massive Medias',
    taglineEn: 'Artist on Massive Medias',
  };
  const ogImage = `${SITE_URL}/images/og/og-${artist.slug}.jpg`;
  const title = `${artist.name} - ${artist.taglineFr} | Massive`;
  const description = `Decouvrez les oeuvres de ${artist.name} sur Massive. Tirages fine art disponibles en ligne. ${artist.taglineEn}.`;
  const url = `https://${subdomain}.massivemedias.com`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="description" content="${description}">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Massive">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${artist.name} - Massive">
  <meta property="og:locale" content="fr_CA">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${ogImage}">

  <!-- Redirect human users (shouldn't reach here, but just in case) -->
  <meta http-equiv="refresh" content="0;url=${url}">
</head>
<body>
  <p>Redirecting to <a href="${url}">${artist.name} on Massive</a>...</p>
</body>
</html>`;
}

// --- Instagram Proxy ---

// Cache en memoire (Worker-level, reset a chaque deploy)
const igCache = new Map();
const IG_CACHE_TTL = 3600000; // 1 heure

async function fetchInstagramPosts(handle) {
  // Verifier le cache
  const cached = igCache.get(handle);
  if (cached && Date.now() - cached.ts < IG_CACHE_TTL) {
    return cached.data;
  }

  try {
    // Approche 1: Fetch la page publique Instagram et extraire les donnees
    const resp = await fetch(`https://www.instagram.com/${handle}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Mode': 'navigate',
      },
    });

    if (!resp.ok) {
      throw new Error(`Instagram returned ${resp.status}`);
    }

    const html = await resp.text();

    // Extraire les URLs d'images depuis le HTML
    const posts = [];

    // Methode 1: chercher les donnees JSON dans les scripts
    const scriptMatches = html.matchAll(/"display_url"\s*:\s*"([^"]+)"/g);
    for (const m of scriptMatches) {
      const url = m[1].replace(/\\u0026/g, '&');
      if (!posts.find(p => p.image === url)) {
        posts.push({ image: url, id: posts.length.toString() });
      }
      if (posts.length >= 12) break;
    }

    // Methode 2: chercher les meta og:image si pas assez de resultats
    if (posts.length === 0) {
      const ogMatch = html.match(/property="og:image"\s+content="([^"]+)"/);
      if (ogMatch) {
        posts.push({ image: ogMatch[1], id: '0' });
      }
    }

    // Methode 3: chercher les thumbnails dans le JSON embed
    if (posts.length === 0) {
      const thumbMatches = html.matchAll(/src="(https:\/\/[^"]*cdninstagram[^"]*(?:jpg|webp)[^"]*)"/g);
      for (const m of thumbMatches) {
        const url = m[1];
        if (url.includes('150x150') || url.includes('profile')) continue;
        if (!posts.find(p => p.image === url)) {
          posts.push({ image: url, id: posts.length.toString() });
        }
        if (posts.length >= 12) break;
      }
    }

    const result = {
      handle,
      posts,
      profileUrl: `https://instagram.com/${handle}`,
      fetchedAt: new Date().toISOString(),
    };

    igCache.set(handle, { data: result, ts: Date.now() });
    return result;
  } catch (err) {
    // Si on a un cache expire, le retourner quand meme
    if (cached) return cached.data;

    return {
      handle,
      posts: [],
      profileUrl: `https://instagram.com/${handle}`,
      error: err.message,
      fetchedAt: new Date().toISOString(),
    };
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=3600',
  };
}

// Meta SEO pour une page artiste servie sur son sous-domaine.
// Option B : canonical -> massivemedias.com/artistes/<slug> pour
// consolider le referencement (pas de contenu duplique entre le
// sous-domaine et la page /artistes/ deja indexee).
function buildArtistMeta(artist) {
  const slug = artist.slug;
  const tagline = artist.taglineFr || 'Prints fine art disponibles en ligne.';
  return {
    title: `${artist.name} | Massive Medias - Prints & Oeuvres`,
    description: `Decouvrez les oeuvres de ${artist.name} sur Massive Medias. ${tagline}`,
    ogImage: `${SITE_URL}/images/og/og-${slug}.jpg`,
    canonicalUrl: `${SITE_URL}/artistes/${slug}`,
  };
}

// Proxy une requete vers Cloudflare Pages (origine du SPA) et, sur les
// pages HTML, injecte les meta SEO fournies. Partage par le domaine
// principal et les sous-domaines artistes : aucune redirection visible,
// l'URL reste celle demandee par le visiteur.
async function proxyAndInject(request, url, meta) {
  const originUrl = new URL(url.toString());
  originUrl.hostname = 'massivemedias.pages.dev';

  let originResponse = await fetch(originUrl.toString(), {
    headers: request.headers,
  });

  // SPA-FALLBACK : Cloudflare Pages ignore les regles _redirects
  // "/* /index.html 200" sur un fetch interne depuis un Worker. Sans ce
  // fallback, /boutique/web, /artistes/mok, etc. renvoient 404 a Google.
  // Fix : sur une 404 d'une requete HTML, on re-fetch /index.html en 200 ;
  // le React Router prend le relais cote client. Les vrais 404 (assets
  // manquants) gardent leur 404 (ils ne matchent pas isHtmlRequest).
  if (originResponse.status === 404 && isHtmlRequest(request, url)) {
    const fallback = await fetch('https://massivemedias.pages.dev/index.html', {
      headers: request.headers,
    });
    if (fallback.ok) {
      originResponse = new Response(fallback.body, {
        status: 200,
        headers: fallback.headers,
      });
    }
  }

  // Injection meta uniquement sur les pages HTML.
  if (isHtmlRequest(request, url)) {
    // Ne JAMAIS cacher le HTML (sinon l'edge Cloudflare sert un vieil
    // index.html et les nouvelles features n'apparaissent pas).
    const noCacheHeaders = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
    const response = new Response(originResponse.body, originResponse);
    Object.entries(noCacheHeaders).forEach(([k, v]) => response.headers.set(k, v));

    if (!meta) return response;

    // Skip l'injection HTMLRewriter si le snapshot est deja prerendered
    // (marqueur <meta name="x-prerendered"> ecrit par
    // frontend/scripts/prerender.mjs apres vite build). Le snapshot contient
    // deja les vraies meta SEO de la page (title, description, canonical, OG,
    // generes par react-helmet-async cote browser au build). Les ecraser avec
    // une version generique calculee a la volee regresserait l'indexation.
    const bodyText = await response.text();
    if (bodyText.includes('name="x-prerendered"')) {
      return new Response(bodyText, {
        status: response.status,
        headers: response.headers,
      });
    }
    return injectMeta(
      new Response(bodyText, {
        status: response.status,
        headers: response.headers,
      }),
      meta,
    );
  }

  return originResponse;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';
    const subdomain = getSubdomain(url.hostname);

    // --- Instagram API endpoint ---
    if (url.pathname.startsWith('/api/instagram/')) {
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders() });
      }

      const handle = url.pathname.replace('/api/instagram/', '').replace(/\/$/, '');
      if (!handle || handle.length < 2) {
        return new Response(JSON.stringify({ error: 'Handle requis' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        });
      }

      const data = await fetchInstagramPosts(handle);
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    // --- Sous-domaine artiste ---
    // Tout sous-domaine non-reserve est traite comme un artiste. La liste
    // vient du CMS (getArtists), jamais d'une map hardcodee : un artiste
    // ajoute en base est routable sans toucher a ce Worker.
    if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
      // Assets (.js/.css/.png...) : proxy direct, pas besoin du CMS.
      if (!isHtmlRequest(request, url)) {
        return proxyAndInject(request, url, null);
      }
      // Page HTML : on resout l'artiste depuis le CMS (tolerant aux tirets,
      // donc 'adriftvision' trouve le slug 'adrift-vision').
      const artists = await getArtists();
      const artist = resolveArtist(subdomain, artists);

      // Crawler : page OG dediee (meta propres pour Facebook, Twitter...).
      if (isCrawler(userAgent)) {
        return new Response(buildOGPage(subdomain, artist), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      // Vrai utilisateur : on PROXY le SPA sur le sous-domaine lui-meme,
      // SANS redirection visible. L'URL reste <slug>.massivemedias.com ;
      // le frontend (getSubdomainSlug dans App.jsx) detecte le sous-domaine
      // et rend la page artiste. Le canonical pointe vers la page
      // /artistes/ (option B SEO : consolidation, pas de duplicate content).
      const meta = artist ? buildArtistMeta(artist) : null;
      return proxyAndInject(request, url, meta);
    }

    // --- Domaine principal : proxy + injection des meta SEO par route ---
    return proxyAndInject(request, url, getMetaForPath(url.pathname));
  },
};
