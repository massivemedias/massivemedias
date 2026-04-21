"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
const email_1 = require("../../../utils/email");
const auth_1 = require("../../../utils/auth");
const image_processor_1 = require("../../../utils/image-processor");
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
    // ============================================================
    // GOD MODE ADMIN (avril 2026) - Mutations directes sans passer
    // par le systeme de edit-requests. Reserve a l'admin strict.
    // ============================================================
    // GET /admin/artists-list - Liste compacte de tous les artistes avec counts
    async adminListAll(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        try {
            const artists = await strapi.documents('api::artist.artist').findMany({
                sort: { name: 'asc' },
                limit: 200,
            });
            const list = (artists || []).map((a) => {
                var _a, _b;
                return ({
                    documentId: a.documentId,
                    slug: a.slug,
                    name: a.name,
                    email: a.email || '',
                    active: a.active,
                    commissionRate: (_a = a.commissionRate) !== null && _a !== void 0 ? _a : 0.5,
                    printsCount: Array.isArray(a.prints) ? a.prints.length : 0,
                    stickersCount: Array.isArray(a.stickers) ? a.stickers.length : 0,
                    taglineFr: a.taglineFr || '',
                    sortOrder: (_b = a.sortOrder) !== null && _b !== void 0 ? _b : 0,
                });
            });
            ctx.body = { data: list };
        }
        catch (err) {
            ctx.throw(500, err.message);
        }
    },
    // GET /admin/artists-detail/:slug - Profil complet + toutes les oeuvres (admin)
    async adminGetDetail(ctx) {
        var _a, _b;
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { slug } = ctx.params;
        if (!slug)
            return ctx.badRequest('slug requis');
        try {
            const artists = await strapi.documents('api::artist.artist').findMany({
                filters: { slug: { $eq: slug } },
                limit: 1,
            });
            if (!artists || artists.length === 0)
                return ctx.notFound(`Artiste ${slug} introuvable`);
            const a = artists[0];
            ctx.body = {
                data: {
                    documentId: a.documentId,
                    slug: a.slug,
                    name: a.name,
                    email: a.email || '',
                    taglineFr: a.taglineFr || '',
                    taglineEn: a.taglineEn || '',
                    taglineEs: a.taglineEs || '',
                    bioFr: a.bioFr || '',
                    bioEn: a.bioEn || '',
                    bioEs: a.bioEs || '',
                    socials: a.socials || {},
                    pricing: a.pricing || null,
                    commissionRate: (_a = a.commissionRate) !== null && _a !== void 0 ? _a : 0.5,
                    active: a.active,
                    sortOrder: (_b = a.sortOrder) !== null && _b !== void 0 ? _b : 0,
                    prints: Array.isArray(a.prints) ? a.prints : [],
                    stickers: Array.isArray(a.stickers) ? a.stickers : [],
                },
            };
        }
        catch (err) {
            ctx.throw(500, err.message);
        }
    },
    // PUT /admin/artists-profile/:slug - Update profil (bio/tagline/socials/commission/active)
    async adminUpdateProfile(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { slug } = ctx.params;
        if (!slug)
            return ctx.badRequest('slug requis');
        const body = ctx.request.body || {};
        // Whitelist stricte : seuls ces champs peuvent etre modifies ici.
        // Les items (prints/stickers) passent par les routes dediees ci-dessous.
        const ALLOWED = ['name', 'email', 'taglineFr', 'taglineEn', 'taglineEs',
            'bioFr', 'bioEn', 'bioEs', 'socials', 'commissionRate', 'active', 'sortOrder'];
        const data = {};
        for (const key of ALLOWED) {
            if (body[key] !== undefined)
                data[key] = body[key];
        }
        if (Object.keys(data).length === 0) {
            return ctx.badRequest('Aucun champ valide a mettre a jour. Champs autorises: ' + ALLOWED.join(', '));
        }
        if (data.commissionRate !== undefined) {
            const cr = Number(data.commissionRate);
            if (!Number.isFinite(cr) || cr < 0 || cr > 1) {
                return ctx.badRequest('commissionRate doit etre un decimal entre 0 et 1 (ex: 0.5 = 50%)');
            }
            data.commissionRate = cr;
        }
        try {
            const artists = await strapi.documents('api::artist.artist').findMany({
                filters: { slug: { $eq: slug } },
                limit: 1,
            });
            if (!artists || artists.length === 0)
                return ctx.notFound(`Artiste ${slug} introuvable`);
            const existing = artists[0];
            // Merger socials au lieu d'ecraser (preserve avatarUrl)
            if (data.socials && typeof data.socials === 'object') {
                data.socials = { ...(existing.socials || {}), ...data.socials };
            }
            const updated = await strapi.documents('api::artist.artist').update({
                documentId: existing.documentId,
                data,
                status: 'published',
            });
            try {
                await strapi.documents('api::artist.artist').publish({ documentId: existing.documentId });
            }
            catch (_) { /* non-bloquant */ }
            strapi.log.info(`[god-mode] Artiste ${slug} profil mis a jour: ${Object.keys(data).join(', ')}`);
            ctx.body = { success: true, data: updated };
        }
        catch (err) {
            strapi.log.error('adminUpdateProfile error:', err);
            ctx.throw(500, err.message);
        }
    },
    // PUT /admin/artists-item/:slug/:itemId - Update une oeuvre (titre/prix) dans prints ou stickers
    // Body: { category: 'prints'|'stickers', titleFr?, titleEn?, titleEs?, customPrice? }
    async adminUpdateItem(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { slug, itemId } = ctx.params;
        if (!slug || !itemId)
            return ctx.badRequest('slug et itemId requis');
        const body = ctx.request.body || {};
        const category = body.category === 'stickers' ? 'stickers' : 'prints';
        const ITEM_FIELDS = ['titleFr', 'titleEn', 'titleEs', 'customPrice', 'limited', 'limitedQty', 'onSale', 'salePercent', 'unique', 'noFrame'];
        const patch = {};
        for (const k of ITEM_FIELDS) {
            if (body[k] !== undefined)
                patch[k] = body[k];
        }
        if (Object.keys(patch).length === 0) {
            return ctx.badRequest('Aucun champ valide a mettre a jour sur l\'item. Champs: ' + ITEM_FIELDS.join(', '));
        }
        if (patch.customPrice !== undefined) {
            const p = parseFloat(String(patch.customPrice));
            if (!Number.isFinite(p) || p < 0) {
                return ctx.badRequest('customPrice doit etre un nombre positif');
            }
            patch.customPrice = p;
        }
        try {
            const artists = await strapi.documents('api::artist.artist').findMany({
                filters: { slug: { $eq: slug } },
                limit: 1,
            });
            if (!artists || artists.length === 0)
                return ctx.notFound(`Artiste ${slug} introuvable`);
            const existing = artists[0];
            const items = Array.isArray(existing[category]) ? [...existing[category]] : [];
            const idx = items.findIndex((it) => (it === null || it === void 0 ? void 0 : it.id) === itemId);
            if (idx < 0)
                return ctx.notFound(`Item ${itemId} introuvable dans ${category} de ${slug}`);
            items[idx] = { ...items[idx], ...patch };
            await strapi.documents('api::artist.artist').update({
                documentId: existing.documentId,
                data: { [category]: items },
                status: 'published',
            });
            strapi.log.info(`[god-mode] ${slug}.${category}[${itemId}] patch: ${Object.keys(patch).join(', ')}`);
            ctx.body = { success: true, data: items[idx] };
        }
        catch (err) {
            strapi.log.error('adminUpdateItem error:', err);
            ctx.throw(500, err.message);
        }
    },
    // DELETE /admin/artists-item/:slug/:itemId?category=prints|stickers
    // Hard delete d'une oeuvre + nettoyage des images Supabase associees.
    async adminDeleteItem(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { slug, itemId } = ctx.params;
        if (!slug || !itemId)
            return ctx.badRequest('slug et itemId requis');
        const category = ctx.query.category === 'stickers' ? 'stickers' : 'prints';
        try {
            const artists = await strapi.documents('api::artist.artist').findMany({
                filters: { slug: { $eq: slug } },
                limit: 1,
            });
            if (!artists || artists.length === 0)
                return ctx.notFound(`Artiste ${slug} introuvable`);
            const existing = artists[0];
            const items = Array.isArray(existing[category]) ? [...existing[category]] : [];
            const target = items.find((it) => (it === null || it === void 0 ? void 0 : it.id) === itemId);
            if (!target)
                return ctx.notFound(`Item ${itemId} introuvable dans ${category} de ${slug}`);
            // Nettoyage images Supabase (les images locales /images/... sont preservees).
            // On tente best-effort - les erreurs ne bloquent pas la suppression DB.
            const urlsToClean = [target.image, target.fullImage, target.thumbImage].filter(Boolean);
            for (const url of urlsToClean) {
                if (typeof url === 'string' && url.includes('supabase')) {
                    try {
                        await (0, image_processor_1.deleteFromSupabase)(url);
                        strapi.log.info(`[god-mode] Image supprimee de Supabase: ${url}`);
                    }
                    catch (cleanupErr) {
                        strapi.log.warn(`[god-mode] Echec nettoyage ${url}: ${cleanupErr === null || cleanupErr === void 0 ? void 0 : cleanupErr.message}`);
                    }
                }
            }
            const filtered = items.filter((it) => (it === null || it === void 0 ? void 0 : it.id) !== itemId);
            await strapi.documents('api::artist.artist').update({
                documentId: existing.documentId,
                data: { [category]: filtered },
                status: 'published',
            });
            strapi.log.info(`[god-mode] ${slug}.${category}: item ${itemId} supprime definitivement`);
            ctx.body = { success: true, data: { deletedId: itemId, remainingCount: filtered.length } };
        }
        catch (err) {
            strapi.log.error('adminDeleteItem error:', err);
            ctx.throw(500, err.message);
        }
    },
}));
