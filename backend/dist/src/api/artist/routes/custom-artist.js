"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        // MISSION TOP 3 GA4 (29 avril 2026) : top 3 oeuvres d'un artiste
        // d'apres GA4 (90 derniers jours, trafic interne deja exclu cote
        // frontend via setAnalyticsIdentity). Auth admin via requireAdminAuth.
        {
            method: 'GET',
            path: '/admin/artists/:id/top-artworks',
            handler: 'artist.adminTopArtworks',
            config: { auth: false },
        },
        {
            method: 'POST',
            path: '/artists/cleanup-sold-uniques',
            handler: 'artist.cleanupSoldUniques',
            config: { auth: false },
        },
        {
            method: 'POST',
            path: '/artists/update-by-slug',
            handler: 'artist.updateBySlug',
            config: { auth: false },
        },
        {
            // Attention: /artists/:id est genere automatiquement par Strapi,
            // donc on utilise un path different pour eviter le conflit
            method: 'GET',
            path: '/artists-private-sales',
            handler: 'artist.getPrivateSales',
            config: { auth: false },
        },
        {
            method: 'POST',
            path: '/artists-private-sales/delete',
            handler: 'artist.deletePrivateSale',
            config: { auth: false },
        },
        {
            method: 'POST',
            path: '/artists-private-sales/resend',
            handler: 'artist.resendPrivateSaleEmail',
            config: { auth: false },
        },
        // ---- Flux public "vente privee" (token exclusif, pas d'auth) ----
        // Le token dans l'URL EST le secret. Le backend valide qu'il existe
        // et retourne uniquement les champs d'affichage (pas le clientEmail complet).
        {
            method: 'GET',
            path: '/artists-private-sales/token/:token',
            handler: 'artist.getPrivateSaleByToken',
            config: { auth: false },
        },
        // Creation de la session Stripe Checkout avec montant dynamique.
        // Body : { amount?: number } - optionnel si allowCustomPrice=false.
        {
            method: 'POST',
            path: '/artists-private-sales/token/:token/checkout',
            handler: 'artist.createPrivateSaleCheckout',
            config: { auth: false },
        },
        // ---- GOD MODE admin (bypass edit-request) - avril 2026 ----
        // Toutes ces routes verifient requireAdminAuth en interne avant toute mutation.
        {
            method: 'GET',
            path: '/admin/artists-list',
            handler: 'artist.adminListAll',
            config: { auth: false },
        },
        {
            method: 'GET',
            path: '/admin/artists-detail/:slug',
            handler: 'artist.adminGetDetail',
            config: { auth: false },
        },
        {
            method: 'PUT',
            path: '/admin/artists-profile/:slug',
            handler: 'artist.adminUpdateProfile',
            config: { auth: false },
        },
        {
            method: 'PUT',
            path: '/admin/artists-item/:slug/:itemId',
            handler: 'artist.adminUpdateItem',
            config: { auth: false },
        },
        {
            method: 'DELETE',
            path: '/admin/artists-item/:slug/:itemId',
            handler: 'artist.adminDeleteItem',
            config: { auth: false },
        },
        // Activation one-shot d'une vente privee depuis l'UI admin (AdminArtistManager)
        // Protegee par requireAdminAuth dans le controller. Envoie le courriel au client.
        {
            method: 'POST',
            path: '/admin/artists-item/:slug/:itemId/private-sale',
            handler: 'artist.activatePrivateSale',
            config: { auth: false },
        },
    ],
};
