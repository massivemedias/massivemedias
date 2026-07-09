"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
const ip_hash_1 = require("../../../utils/ip-hash");
const auth_1 = require("../../../utils/auth");
// Rate-limit in-memory du beacon public (pattern __reorderThrottle__ de
// order.ts) : au plus 1 hit enregistre par (ipHash, path) toutes les 30 s.
// Empeche un client de gonfler le compteur ou de spammer la DB. Le Map est
// attache a strapi pour survivre au hot-reload dev, reinitialise au boot.
const THROTTLE_MS = 30000;
const THROTTLE_KEY = '__visitorHitThrottle__';
// Borne dure du nettoyage du Map (evite une croissance memoire infinie).
const THROTTLE_MAX = 20000;
exports.default = strapi_1.factories.createCoreController('api::visitor-hit.visitor-hit', ({ strapi }) => ({
    /**
     * POST /api/visitor-hits/collect  (public, rate-limite)
     * Body : { path }. La vraie IP client (via cf-connecting-ip) est hashee
     * immediatement, jamais stockee en clair. Repond TOUJOURS 204
     * (fire-and-forget cote beacon) : aucune fuite d'info, aucun blocage.
     */
    async collect(ctx) {
        var _a;
        var _b;
        try {
            const salt = process.env.QR_IP_HASH_SALT || '';
            // Vraie IP client via cf-connecting-ip (Cloudflare), PAS ctx.request.ip
            // qui renvoie l'IP interne variable du proxy Render -> comptage faux.
            const ipHash = (0, ip_hash_1.hashIpSalted)((0, ip_hash_1.extractClientIp)(ctx), salt);
            const rawPath = (_a = ctx.request.body) === null || _a === void 0 ? void 0 : _a.path;
            let path = typeof rawPath === 'string' ? rawPath.slice(0, 300) : '';
            // On ne garde que le pathname (pas de query string : pourrait porter
            // des donnees perso, Loi 25). Fallback '/' si illisible.
            try {
                path = new URL(path, 'https://massivemedias.com').pathname;
            }
            catch (_) {
                path = '/';
            }
            if (!ipHash) {
                ctx.status = 204;
                return;
            } // pas de salt -> on ne stocke rien
            const map = ((_b = strapi)[THROTTLE_KEY] || (_b[THROTTLE_KEY] = new Map()));
            const now = Date.now();
            const key = ipHash + '|' + path;
            const last = map.get(key) || 0;
            if (now - last < THROTTLE_MS) {
                ctx.status = 204;
                return;
            }
            map.set(key, now);
            // Nettoyage best-effort si le Map enfle (entrees expirees).
            if (map.size > THROTTLE_MAX) {
                for (const [k, t] of map)
                    if (now - t > THROTTLE_MS)
                        map.delete(k);
            }
            await strapi.documents('api::visitor-hit.visitor-hit').create({
                data: { ipHash, path, hitAt: new Date().toISOString() },
            });
            ctx.status = 204;
        }
        catch (err) {
            // Un pageview rate ne doit jamais casser quoi que ce soit cote client.
            strapi.log.warn(`[visitor-hit] collect ignore: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
            ctx.status = 204;
        }
    },
    /**
     * GET /api/visitor-hits/count?window=1h|3h|24h  (admin)
     * Retourne { window, uniqueVisitors, totalHits, since }. Compte les
     * ipHash DISTINCTS sur la fenetre. requireAdminAuth obligatoire.
     */
    async count(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const windowKey = (0, ip_hash_1.normalizeWindow)(ctx.query.window);
        const now = Date.now();
        const since = new Date(now - ip_hash_1.VISITOR_WINDOWS[windowKey]).toISOString();
        // On ne charge QUE les hits de la fenetre (borne par la purge 48h, donc
        // au pire 24h de donnees ici). Champs minimaux.
        const hits = await strapi.documents('api::visitor-hit.visitor-hit').findMany({
            filters: { hitAt: { $gte: since } },
            fields: ['ipHash', 'hitAt'],
            limit: 100000,
        });
        const uniqueVisitors = (0, ip_hash_1.countDistinctVisitors)(hits, windowKey, now);
        ctx.body = { window: windowKey, uniqueVisitors, totalHits: hits.length, since };
    },
}));
