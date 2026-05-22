import type { Core } from '@strapi/strapi';

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', '*.supabase.co'],
          'media-src': ["'self'", 'data:', 'blob:', '*.supabase.co'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::compression',
    config: {
      br: false,
    },
  },
  {
    name: 'strapi::cors',
    // SUBDOMAIN-MULTITENANCY (mai 2026) : on remplace le whitelist hardcode
    // des sous-domaines artistes par un check dynamique. Tout origin
    // https://*.massivemedias.com est accepte.
    //
    // Le risque SEC-05 (subdomain takeover via CNAME dangling vers un tiers)
    // ne s'applique plus dans l'archi actuelle : le DNS wildcard pointe vers
    // Cloudflare proxy, qui route via le Worker `artist-proxy` vers pages.dev.
    // Il n'y a aucun CNAME per-artiste vers une plateforme tierce -> impossible
    // de prendre le contrele d'un sous-domaine inactif.
    //
    // Avantage : ajouter un artiste dans le CMS suffit, plus aucune modif
    // de CORS / DNS / Worker requise (le wildcard DNS + Worker font le reste).
    config: {
      origin: (ctx: any) => {
        const o = ctx.get('origin') || '';
        const exact = new Set([
          'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:5174',
          'https://massivemedias.com',
          'https://www.massivemedias.com',
          process.env.RENDER_EXTERNAL_URL || 'https://massivemedias-api.onrender.com',
        ]);
        if (exact.has(o)) return o;
        // Tout sous-domaine de massivemedias.com (multi-tenancy artistes).
        if (/^https:\/\/[a-z0-9-]+\.massivemedias\.com$/i.test(o)) return o;
        return false;
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      includeUnparsed: true, // Required for Stripe webhook signature verification
      jsonLimit: '10mb', // Pour les mockups AI (images base64 dans le body)
      // FIX-MOBILE-UPLOAD (re-applied 5 mai 2026 v2) : sans ces options,
      // les uploads multipart de photos mobile (5-15MB depuis iPhone/Android)
      // hitaient les defaults silencieusement et le client voyait
      // "Server unreachable" sans cause claire.
      //   - formLimit : taille max des form fields URL-encoded (defaut koa
      //     ~56kb -> on monte a 10mb pour couvrir les futurs cas obscurs)
      //   - textLimit : idem pour text/plain
      //   - multipart : explicite a true (defaut Strapi v5 mais pas de
      //     regression future avec ce flag explicite)
      //   - formidable.maxFileSize : 60MB (au-dessus de la limite metier
      //     50MB du handler uploadDirect, qui retourne un 400 propre si
      //     depassee). Photos iPhone HEIC peuvent atteindre 25-40MB.
      formLimit: '10mb',
      textLimit: '10mb',
      multipart: true,
      formidable: {
        maxFileSize: 60 * 1024 * 1024,
      },
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
