"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreController('api::artist.artist', ({ strapi }) => ({
    /**
     * Nettoyer les pieces uniques vendues depuis plus de 7 jours
     * Les retire du tableau prints de l'artiste (l'image reste sur Google Drive)
     */
    async cleanupSoldUniques(ctx) {
        const DAYS = 7;
        const cutoff = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString();
        let cleaned = 0;
        const artists = await strapi.documents('api::artist.artist').findMany({
            filters: { active: true },
        });
        for (const artist of artists) {
            const prints = Array.isArray(artist.prints) ? artist.prints : [];
            const before = prints.length;
            const filtered = prints.filter((p) => {
                if (!p.sold || !p.soldAt)
                    return true; // Pas vendu = garder
                return p.soldAt > cutoff; // Vendu recemment = garder (< 7 jours)
            });
            if (filtered.length < before) {
                const removed = before - filtered.length;
                await strapi.documents('api::artist.artist').update({
                    documentId: artist.documentId,
                    data: { prints: filtered },
                });
                cleaned += removed;
                strapi.log.info(`Cleanup: ${removed} piece(s) unique(s) retiree(s) de ${artist.slug}`);
            }
        }
        ctx.body = { data: { cleaned, message: `${cleaned} piece(s) unique(s) retiree(s)` } };
    },
}));
