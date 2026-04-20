"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = [
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
        },
    },
    'strapi::session',
    'strapi::favicon',
    'strapi::public',
];
exports.default = config;
