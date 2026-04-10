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
    /**
     * Met a jour les champs "display" d'un artiste par son slug
     * (name, taglineFr, taglineEn, bioFr, bioEn, bioEs).
     * Utilise pour renommer un artiste sans toucher au slug (qui sert a
     * l'URL, l'auth et les ids de prints).
     *
     * POST /api/artists/update-by-slug
     * Body: { slug: string, name?, taglineFr?, taglineEn?, bioFr?, bioEn?, bioEs? }
     */
    async updateBySlug(ctx) {
        const { slug, ...fields } = ctx.request.body;
        if (!slug)
            return ctx.badRequest('slug est requis');
        const existing = await strapi.documents('api::artist.artist').findFirst({
            filters: { slug },
        });
        if (!existing)
            return ctx.notFound(`Artiste '${slug}' introuvable`);
        // Seuls les champs display sont modifiables ici. Slug, socials, pricing,
        // prints, stickers, merch ne sont PAS modifiables via cette route.
        const ALLOWED_FIELDS = ['name', 'taglineFr', 'taglineEn', 'bioFr', 'bioEn', 'bioEs'];
        const data = {};
        for (const key of ALLOWED_FIELDS) {
            if (fields[key] !== undefined && fields[key] !== null) {
                data[key] = fields[key];
            }
        }
        if (Object.keys(data).length === 0) {
            return ctx.badRequest('Aucun champ a mettre a jour');
        }
        // Update le draft
        const updated = await strapi.documents('api::artist.artist').update({
            documentId: existing.documentId,
            data,
        });
        // Republier pour que la version publiee (visible via GET public) soit mise a jour
        // (artist a draftAndPublish: true, sans republier on update seulement le draft)
        try {
            await strapi.documents('api::artist.artist').publish({
                documentId: existing.documentId,
            });
        }
        catch (err) {
            strapi.log.warn(`Publish failed for artist ${slug}: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
        }
        strapi.log.info(`Artist updated by slug: ${slug} -> ${JSON.stringify(data)}`);
        ctx.body = { data: updated };
    },
}));
