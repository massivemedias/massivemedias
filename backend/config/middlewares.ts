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
    // SEC-05: whitelist explicite des sous-domaines artistes au lieu d'un
    // regex /\.massivemedias\.com$/ qui acceptait n'importe quel sous-domaine
    // (risque si un slug inactif pointe vers un tiers via subdomain takeover).
    // Ajouter un nouvel artiste = ajouter son slug ici ET dans Cloudflare DNS
    // + Worker route. Liste maintenue a la main, source de verite = le code.
    config: {
      origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'https://massivemedias.com',
        'https://www.massivemedias.com',
        'https://psyqu33n.massivemedias.com',
        'https://mok.massivemedias.com',
        'https://ginkoink.massivemedias.com',
        'https://myriamrivest.massivemedias.com',
        'https://derekgrandsaert.massivemedias.com',
        process.env.RENDER_EXTERNAL_URL || 'https://massivemedias-api.onrender.com',
      ],
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
