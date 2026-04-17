/**
 * Cloudflare Worker - OG Meta Tags pour sous-domaines artistes
 * + Proxy Instagram pour feeds tatoueurs
 * + SEO meta injection pour toutes les pages du site principal
 *
 * Detecte les crawlers (Facebook, Twitter, etc.) sur les sous-domaines artistes
 * et retourne un HTML avec les bons meta OG (image, titre, description).
 * Les vrais users passent normalement vers le SPA.
 *
 * Pour le domaine principal, injecte les meta tags SEO page-specifiques
 * dans le HTML via HTMLRewriter (streaming).
 *
 * Endpoint Instagram: /api/instagram/:handle
 * Retourne les posts publics d'un profil Instagram (cache 1h)
 *
 * Deploiement:
 * 1. Aller sur Cloudflare Dashboard > Workers & Pages > Create
 * 2. Coller ce script
 * 3. Ajouter une route: *.massivemedias.com/*
 */

const SITE_URL = 'https://massivemedias.com';
const DEFAULT_OG_IMAGE = 'https://massivemedias.com/og-image.jpg';
const BACKEND_URL = 'https://massivemedias-api.onrender.com';

// Endpoints legers a pinger pour empecher Render de s'endormir.
// On ping plusieurs endpoints au cas ou l'un timeout - au moins un doit reveiller Render.
const WAKE_ENDPOINTS = [
  '/api/site-content',
  '/api/artists',
];

const TATOUEURS = {
  // Section tatoueurs desactivee - les entrees seront restaurees si la section revient
};

const ARTISTS = {
  'adrift': { name: 'Adrift Vision', taglineFr: 'Art numerique & univers immersifs', taglineEn: 'Digital Art & Immersive Worlds' },
  'maudite-machine': { name: 'Maudite Machine', taglineFr: 'Musique electronique & culture visuelle', taglineEn: 'Electronic Music & Visual Culture' },
  'mok': { name: 'Mok', taglineFr: 'Photographie urbaine & lumiere', taglineEn: 'Urban Photography & Light' },
  'quentin-delobel': { name: 'Quentin Delobel', taglineFr: 'Photographie - lumiere, contrastes & intimite', taglineEn: 'Photography - Light, Contrasts & Intimacy' },
  'no-pixl': { name: 'No Pixl', taglineFr: 'Photographie evenementielle & paysages', taglineEn: 'Event Photography & Landscapes' },
  'cornelia-rose': { name: 'Cornelia Rose', taglineFr: 'Art visionnaire & body painting', taglineEn: 'Visionary Art & Body Painting' },
  'eric-sanchez': { name: 'Eric Sanchez', taglineFr: 'Photographie musicale & portrait', taglineEn: 'Music Photography & Portrait' },
  'psyqu33n': { name: 'Psyqu33n', taglineFr: 'Ombre & lumiere - art visionnaire', taglineEn: 'Shadow & Light - Visionary Art' },
};

// Sous-domaines reserves qui ne doivent PAS rediriger (services internes)
const RESERVED_SUBDOMAINS = new Set(['www', 'api', 'admin', 'mm-admin', 'cms', 'mail', 'dev', 'staging', 'preview']);

// --- SEO Meta par route ---

const ROUTE_META = {
  '/': {
    title: 'Massive Medias | Imprimeur Montreal - Stickers, Prints & Design',
    description: 'Massive Medias - Imprimeur a Montreal. Impression fine art, stickers personnalises die-cut, sublimation textile, design graphique, developpement web et webmastering. Studio creatif au Mile-End. Print Montreal.',
  },
  '/artistes': {
    title: 'Artistes | Massive Medias - Photographes, Peintres & Tatoueurs',
    description: 'Decouvrez nos artistes partenaires. Photographes, peintres, artistes visuels et tatoueurs. Prints, stickers et merch disponibles.',
  },
  '/tatoueurs': {
    title: 'Tatoueurs | Massive Medias - Flashs & Reservations Montreal',
    description: 'Reservez un flash de tatouage unique aupres de nos tatoueurs partenaires a Montreal. Fineline, botanique, blackwork et plus.',
  },
  '/tatoueurs/ginko-ink': {
    title: 'Ginko Ink | Tatoueuse Fineline Montreal - Flashs Disponibles',
    description: 'Myriam Rivest, tatoueuse fineline a Montreal. Flashs botaniques, creatures feeriques et personnages. Reservez votre piece unique.',
    ogImage: 'https://massivemedias.com/images/tatoueurs/ginko-ink/hero.webp',
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
    const artist = ARTISTS[slug];
    const artistName = artist ? artist.name : slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return {
      title: `${artistName} | Massive Medias - Prints & Oeuvres`,
      description: `Decouvrez les oeuvres de ${artistName} sur Massive Medias. Prints fine art disponibles en plusieurs formats.`,
      ogImage: artist ? `${SITE_URL}/images/og/og-${slug}.jpg` : DEFAULT_OG_IMAGE,
      canonicalUrl: `${SITE_URL}/artistes/${slug}`,
    };
  }

  // Pages tatoueurs dynamiques: /tatoueurs/:slug (non listees dans ROUTE_META)
  const tatoueurMatch = path.match(/^\/tatoueurs\/([a-z0-9-]+)$/);
  if (tatoueurMatch) {
    const slug = tatoueurMatch[1];
    const tatoueur = TATOUEURS[slug];
    // Si la route est dans ROUTE_META, on l'a deja gere plus haut
    // Sinon, fallback generique
    const tatoueurName = tatoueur ? tatoueur.name : slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return {
      title: `${tatoueurName} | Massive Medias - Flashs & Reservations`,
      description: `Decouvrez les flashs de ${tatoueurName} sur Massive Medias. Reservez votre piece de tatouage unique a Montreal.`,
      ogImage: DEFAULT_OG_IMAGE,
      canonicalUrl: `${SITE_URL}/tatoueurs/${slug}`,
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
 */
function isHtmlRequest(request, url) {
  // Verifier le Accept header
  const accept = request.headers.get('Accept') || '';
  if (!accept.includes('text/html')) return false;

  // Exclure les fichiers statiques par extension
  const path = url.pathname;
  const staticExtensions = /\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|json|xml|txt|map|mp4|webm|pdf)$/i;
  if (staticExtensions.test(path)) return false;

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

function buildOGPage(slug, artist) {
  const ogImage = `${SITE_URL}/images/og/og-${slug}.jpg`;
  const title = `${artist.name} - ${artist.taglineFr} | Massive`;
  const description = `Decouvrez les oeuvres de ${artist.name} sur Massive. Tirages fine art disponibles en ligne. ${artist.taglineEn}.`;
  const url = `https://${slug}.massivemedias.com`;

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

export default {
  // Cron trigger toutes les 5 minutes (configure dans wrangler.toml)
  // Garde le backend Render reveille pour eviter les cold starts de 30-60s
  // qui font perdre des clients sur les uploads / commandes.
  async scheduled(event, env, ctx) {
    const promises = WAKE_ENDPOINTS.map(async (endpoint) => {
      try {
        const url = `${BACKEND_URL}${endpoint}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'User-Agent': 'Cloudflare-KeepAlive-Bot/1.0 (massivemedias.com)' },
          cf: { cacheTtl: 0, cacheEverything: false },
        });
        return { endpoint, status: response.status, ok: response.ok };
      } catch (err) {
        return { endpoint, error: err.message };
      }
    });
    const results = await Promise.all(promises);
    console.log('[KeepAlive]', new Date().toISOString(), JSON.stringify(results));
  },

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

    // Only intercept crawlers on artist/tatoueur subdomains
    const artistData = ARTISTS[subdomain] || null;
    const tatoueurData = TATOUEURS[subdomain] || null;
    const subdomainData = artistData || tatoueurData;

    if (subdomain && subdomainData && isCrawler(userAgent)) {
      const html = buildOGPage(subdomain, subdomainData);
      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Artist subdomain for real users: redirect to main site artist page
    if (subdomain && artistData) {
      const targetUrl = `${SITE_URL}/artistes/${subdomain}${url.pathname === '/' ? '' : url.pathname}${url.search}`;
      return Response.redirect(targetUrl, 302);
    }

    // Tatoueur subdomain for real users: redirect to main site tatoueur page
    if (subdomain && tatoueurData) {
      const targetUrl = `${SITE_URL}/tatoueurs/${subdomain}${url.pathname === '/' ? '' : url.pathname}${url.search}`;
      return Response.redirect(targetUrl, 302);
    }

    // Fallback: tout sous-domaine non-reserve redirige vers /artistes/:slug
    // Le site principal gere le 404 si l'artiste n'existe pas dans artists.js/CMS
    // Evite le 404 GitHub Pages si un artiste est ajoute sans mise a jour du Worker
    if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
      if (isCrawler(userAgent)) {
        // Crawler sur subdomain inconnu: generer des meta OG generiques
        const artistName = subdomain.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const genericArtist = {
          name: artistName,
          taglineFr: 'Artiste sur Massive Medias',
          taglineEn: 'Artist on Massive Medias',
        };
        const html = buildOGPage(subdomain, genericArtist);
        return new Response(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
      const targetUrl = `${SITE_URL}/artistes/${subdomain}${url.pathname === '/' ? '' : url.pathname}${url.search}`;
      return Response.redirect(targetUrl, 302);
    }

    // --- Main domain: fetch from origin and inject SEO meta ---
    const originUrl = new URL(url.toString());
    originUrl.hostname = 'massivemedias.pages.dev';

    const originResponse = await fetch(originUrl.toString(), {
      headers: request.headers,
    });

    // Only inject meta on HTML pages
    if (isHtmlRequest(request, url)) {
      const meta = getMetaForPath(url.pathname);
      // IMPORTANT: ne JAMAIS cacher le HTML (sinon l'ancien index.html est servi
      // par Cloudflare edge et les nouveaux onglets/features n'apparaissent pas)
      const noCacheHeaders = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      };
      if (meta) {
        const response = new Response(originResponse.body, originResponse);
        Object.entries(noCacheHeaders).forEach(([k, v]) => response.headers.set(k, v));
        return injectMeta(response, meta);
      }
      // HTML sans meta SEO specifique: retourner avec no-cache aussi
      const response = new Response(originResponse.body, originResponse);
      Object.entries(noCacheHeaders).forEach(([k, v]) => response.headers.set(k, v));
      return response;
    }

    return originResponse;
  },
};
