/**
 * Routes des overrides sticker (ADMIN-STICKERS phase 2).
 *
 * `auth: false` au niveau Strapi = pattern maison (cf promo-code) : la garde
 * est faite DANS le controleur via requireAdminAuth, pas par le routeur.
 *   - GET  /sticker-overrides        : PUBLIC (la vitrine fusionne le delta)
 *   - PUT  /sticker-overrides/:slug  : ADMIN  (requireAdminAuth dans upsert)
 *
 * Aucune route DELETE, volontairement : "rien ne meurt", masquer = hidden=true.
 */
export default {
  routes: [
    {
      method: 'GET',
      path: '/sticker-overrides',
      handler: 'sticker-override.listPublic',
      config: { auth: false },
    },
    {
      method: 'PUT',
      path: '/sticker-overrides/:slug',
      handler: 'sticker-override.upsert',
      config: { auth: false },
    },
  ],
};
