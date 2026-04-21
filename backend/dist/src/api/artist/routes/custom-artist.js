"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
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
    ],
};
