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
    config: {
      origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'https://massivemedias.com',
        'https://www.massivemedias.com',
        /\.massivemedias\.com$/,
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
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
