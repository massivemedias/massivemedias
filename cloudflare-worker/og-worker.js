/**
 * Cloudflare Worker - OG Meta Tags pour sous-domaines artistes
 *
 * Detecte les crawlers (Facebook, Twitter, etc.) sur les sous-domaines artistes
 * et retourne un HTML avec les bons meta OG (image, titre, description).
 * Les vrais users passent normalement vers le SPA.
 *
 * Deploiement:
 * 1. Aller sur Cloudflare Dashboard > Workers & Pages > Create
 * 2. Coller ce script
 * 3. Ajouter une route: *.massivemedias.com/*
 */

const SITE_URL = 'https://massivemedias.com';

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

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';
    const subdomain = getSubdomain(url.hostname);

    // Only intercept crawlers on artist subdomains
    if (subdomain && ARTISTS[subdomain] && isCrawler(userAgent)) {
      const html = buildOGPage(subdomain, ARTISTS[subdomain]);
      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Everyone else: pass through to origin
    return fetch(request);
  },
};
