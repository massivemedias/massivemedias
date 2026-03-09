import type { Core } from '@strapi/strapi';

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::compression',
    config: {
      br: false,
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin(ctx) {
        const allowedFixed = [
          'http://localhost:3000',
          'http://localhost:5173',
          'https://massivemedias.com',
          'https://www.massivemedias.com',
          process.env.RENDER_EXTERNAL_URL || '',
        ].filter(Boolean);

        const requestOrigin = ctx.request?.header?.origin || '';
        if (allowedFixed.includes(requestOrigin)) return requestOrigin;
        if (/^https:\/\/[a-z0-9-]+\.massivemedias\.com$/.test(requestOrigin)) return requestOrigin;
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
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
