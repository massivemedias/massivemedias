/**
 * Cloudflare Worker - OG Meta Tags pour sous-domaines artistes
 * + Proxy Instagram pour feeds tatoueurs
 *
 * Detecte les crawlers (Facebook, Twitter, etc.) sur les sous-domaines artistes
 * et retourne un HTML avec les bons meta OG (image, titre, description).
 * Les vrais users passent normalement vers le SPA.
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

const TATOUEURS = {
  'ginko-ink': { name: 'Ginko Ink', taglineFr: 'Tatouage fineline & botanique', taglineEn: 'Fineline & Botanical Tattoo' },
};

const ARTISTS = {
  'adrift': { name: 'Adrift', taglineFr: 'Art numerique & univers immersifs', taglineEn: 'Digital Art & Immersive Worlds' },
  'maudite-machine': { name: 'Maudite Machine', taglineFr: 'Musique electronique & culture visuelle', taglineEn: 'Electronic Music & Visual Culture' },
  'mok': { name: 'Mok', taglineFr: 'Photographie urbaine & lumiere', taglineEn: 'Urban Photography & Light' },
  'quentin-delobel': { name: 'Quentin Delobel', taglineFr: 'Photographie - lumiere, contrastes & intimite', taglineEn: 'Photography - Light, Contrasts & Intimacy' },
  'no-pixl': { name: 'No Pixl', taglineFr: 'Photographie evenementielle & paysages', taglineEn: 'Event Photography & Landscapes' },
  'psyqu33n': { name: 'Psyqu33n', taglineFr: 'Ombre & lumiere - art visionnaire', taglineEn: 'Shadow & Light - Visionary Art' },
  'cornelia-rose': { name: 'Cornelia Rose', taglineFr: 'Art visionnaire & body painting', taglineEn: 'Visionary Art & Body Painting' },
};

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

    // Everything else: pass through to origin
    url.hostname = 'massivemedias.com';
    return fetch(url.toString(), { headers: request.headers });
  },
};
