"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
const email_1 = require("../../../utils/email");
const auth_1 = require("../../../utils/auth");
exports.default = strapi_1.factories.createCoreController('api::artist.artist', ({ strapi }) => ({
    /**
     * Nettoyer les pieces uniques vendues depuis plus de 7 jours
     * Les retire du tableau prints de l'artiste (l'image reste sur Google Drive)
     */
    async cleanupSoldUniques(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
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
     * Liste toutes les ventes privees en attente (private: true && !paid).
     * Retourne un tableau plat avec info artiste + print pour affichage
     * dans le panneau admin Commandes.
     *
     * GET /api/artists/private-sales
     */
    async getPrivateSales(ctx) {
        var _a;
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const artists = await strapi.documents('api::artist.artist').findMany({
            filters: { active: true },
            populate: { avatar: true },
        });
        const sales = [];
        for (const artist of artists) {
            const prints = Array.isArray(artist.prints) ? artist.prints : [];
            for (const p of prints) {
                if (!(p === null || p === void 0 ? void 0 : p.private))
                    continue;
                if (p === null || p === void 0 ? void 0 : p.sold)
                    continue; // Deja paye/vendu = retire de la liste attente
                const price = typeof p.customPrice === 'number'
                    ? p.customPrice
                    : (typeof p.price === 'number' ? p.price : null);
                const clientLink = p.privateToken
                    ? `https://massivemedias.com/artistes/${artist.slug}?print=${p.id}&token=${p.privateToken}`
                    : null;
                sales.push({
                    id: p.id,
                    artistSlug: artist.slug,
                    artistName: artist.name,
                    artistAvatar: ((_a = artist.avatar) === null || _a === void 0 ? void 0 : _a.url) || null,
                    title: p.titleFr || p.titleEn || p.title || '',
                    image: p.thumbImage || p.image || p.fullImage || null,
                    clientEmail: p.clientEmail || '',
                    price,
                    fixedFormat: p.fixedFormat || null,
                    fixedTier: p.fixedTier || null,
                    unique: !!p.unique,
                    sold: !!p.sold,
                    createdAt: p.createdAt || null,
                    clientLink,
                });
            }
        }
        // Tri: plus recents en premier (createdAt)
        sales.sort((a, b) => {
            const ta = a.createdAt || '';
            const tb = b.createdAt || '';
            return String(tb).localeCompare(String(ta));
        });
        ctx.body = { data: sales, meta: { total: sales.length } };
    },
    /**
     * Supprime une vente privee en attente (retire le print de l'artiste).
     * L'image reste sur le stockage mais n'apparait plus dans prints[].
     *
     * POST /api/artists-private-sales/delete
     * Body: { artistSlug: string, printId: string }
     */
    async deletePrivateSale(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { artistSlug, printId } = (ctx.request.body || {});
        if (!artistSlug || !printId) {
            return ctx.badRequest('artistSlug et printId sont requis');
        }
        const artists = await strapi.documents('api::artist.artist').findMany({
            filters: { slug: artistSlug },
            status: 'published',
        });
        const artist = artists[0];
        if (!artist)
            return ctx.notFound(`Artiste '${artistSlug}' introuvable`);
        const prints = Array.isArray(artist.prints) ? artist.prints : [];
        const target = prints.find((p) => (p === null || p === void 0 ? void 0 : p.id) === printId);
        if (!target)
            return ctx.notFound(`Print '${printId}' introuvable`);
        if (!target.private)
            return ctx.badRequest(`Print '${printId}' n'est pas une vente privee`);
        const filtered = prints.filter((p) => (p === null || p === void 0 ? void 0 : p.id) !== printId);
        await strapi.documents('api::artist.artist').update({
            documentId: artist.documentId,
            data: { prints: filtered },
            status: 'published',
        });
        strapi.log.info(`Vente privee supprimee: ${artistSlug} / ${printId}`);
        ctx.body = { data: { deleted: true, artistSlug, printId } };
    },
    /**
     * Renvoie le courriel de vente privee au client (et notification admin).
     * Utile pour redeclencher l'envoi si le client a perdu/rate le courriel.
     *
     * POST /api/artists-private-sales/resend
     * Body: { artistSlug: string, printId: string }
     */
    async resendPrivateSaleEmail(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { artistSlug, printId } = (ctx.request.body || {});
        if (!artistSlug || !printId) {
            return ctx.badRequest('artistSlug et printId sont requis');
        }
        const artists = await strapi.documents('api::artist.artist').findMany({
            filters: { slug: artistSlug },
            status: 'published',
        });
        const artist = artists[0];
        if (!artist)
            return ctx.notFound(`Artiste '${artistSlug}' introuvable`);
        const prints = Array.isArray(artist.prints) ? artist.prints : [];
        const p = prints.find((pr) => (pr === null || pr === void 0 ? void 0 : pr.id) === printId);
        if (!p)
            return ctx.notFound(`Print '${printId}' introuvable`);
        if (!p.private)
            return ctx.badRequest(`Print '${printId}' n'est pas une vente privee`);
        if (!p.clientEmail || !p.privateToken) {
            return ctx.badRequest(`Print '${printId}' n'a pas de clientEmail/privateToken`);
        }
        const buyLink = `https://massivemedias.com/artistes/${artist.slug}?print=${p.id}&token=${p.privateToken}`;
        try {
            await (0, email_1.sendPrivatePrintEmail)({
                clientEmail: p.clientEmail,
                artistName: artist.name,
                printTitle: p.titleFr || p.titleEn || 'Oeuvre',
                printImage: p.fullImage || p.image || '',
                buyLink,
                price: typeof p.customPrice === 'number' ? p.customPrice : null,
            });
            strapi.log.info(`Email vente privee renvoye: ${artistSlug} / ${printId} -> ${p.clientEmail}`);
            ctx.body = { data: { sent: true, clientEmail: p.clientEmail } };
        }
        catch (err) {
            strapi.log.warn(`Erreur renvoi email vente privee:`, (err === null || err === void 0 ? void 0 : err.message) || err);
            return ctx.internalServerError(`Envoi du courriel echoue: ${(err === null || err === void 0 ? void 0 : err.message) || 'erreur inconnue'}`);
        }
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
        // TODO SEC-01-FOLLOWUP: assouplir en requireUserAuth + check que l'artiste
        // connecte modifie son propre slug (ownership). Pour l'instant admin only
        // pour eviter tout risque d'ecrasement malveillant des bios/taglines.
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { slug, ...fields } = ctx.request.body;
        if (!slug)
            return ctx.badRequest('slug est requis');
        // Chercher les deux versions (draft + published)
        const drafts = await strapi.documents('api::artist.artist').findMany({
            filters: { slug },
            status: 'draft',
        });
        const published = await strapi.documents('api::artist.artist').findMany({
            filters: { slug },
            status: 'published',
        });
        const existing = drafts[0] || published[0];
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
        // Update le draft ET republie explicitement
        const updated = await strapi.documents('api::artist.artist').update({
            documentId: existing.documentId,
            data,
            status: 'published', // Forcer l'update sur la version publiee
        });
        // Publier en plus pour etre certain que la version visible est a jour
        try {
            await strapi.documents('api::artist.artist').publish({
                documentId: existing.documentId,
            });
        }
        catch (err) {
            strapi.log.warn(`Publish failed for artist ${slug}: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
        }
        // Re-fetch pour confirmer
        const refetched = await strapi.documents('api::artist.artist').findOne({
            documentId: existing.documentId,
        });
        strapi.log.info(`Artist updated by slug: ${slug} -> name="${refetched === null || refetched === void 0 ? void 0 : refetched.name}"`);
        ctx.body = {
            data: refetched || updated,
            debug: {
                draftsFound: drafts.length,
                publishedFound: published.length,
                existingDocumentId: existing.documentId,
                updatedName: updated === null || updated === void 0 ? void 0 : updated.name,
                refetchedName: refetched === null || refetched === void 0 ? void 0 : refetched.name,
            },
        };
    },
}));
