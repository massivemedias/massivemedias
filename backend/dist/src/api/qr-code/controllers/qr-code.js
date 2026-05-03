"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
const crypto_1 = __importDefault(require("crypto"));
const geoip_lite_1 = __importDefault(require("geoip-lite"));
const auth_1 = require("../../../utils/auth");
/**
 * Resolves an IPv4/IPv6 address to { city, country } using the bundled
 * geoip-lite MaxMind GeoLite2 database. Returns empty strings if the IP is
 * private/loopback (e.g. ::1, 127.0.0.1) or not found in the dataset.
 *
 * Why geoip-lite : zero external API calls (latency-free, no rate limits,
 * no GDPR concern around shipping IPs to 3rd parties), runs entirely in
 * the same Render container that handles the request.
 */
function resolveGeo(ip) {
    if (!ip)
        return { city: '', country: '' };
    // Strip IPv6-mapped IPv4 prefix (::ffff:1.2.3.4 -> 1.2.3.4)
    const clean = ip.replace(/^::ffff:/, '').trim();
    // Filter local/private networks - geoip-lite would just return null but we
    // skip the lookup cost.
    if (clean === '::1' || clean.startsWith('127.') || clean.startsWith('10.') || clean.startsWith('192.168.') || clean.startsWith('169.254.')) {
        return { city: '', country: '' };
    }
    try {
        const lookup = geoip_lite_1.default.lookup(clean);
        if (!lookup)
            return { city: '', country: '' };
        return {
            city: (lookup.city || '').slice(0, 120),
            country: (lookup.country || '').slice(0, 4), // ISO 3166-1 alpha-2
        };
    }
    catch {
        return { city: '', country: '' };
    }
}
/**
 * Lightweight User-Agent device classifier. We don't need a full UA parser
 * (ua-parser-js etc.) for the scope of "mobile vs desktop vs tablet" buckets
 * in the dashboard - regexes on a few well-known tokens are enough and avoid
 * shipping a 200kB dependency for a single field.
 */
function classifyDevice(ua) {
    if (!ua)
        return 'unknown';
    const u = ua.toLowerCase();
    if (/ipad|tablet|kindle|silk|playbook/.test(u))
        return 'tablet';
    if (/mobi|iphone|android|phone|windows phone|blackberry/.test(u))
        return 'mobile';
    if (/bot|crawler|spider|slurp|httpclient|axios|curl|wget|postman/.test(u))
        return 'bot';
    return 'desktop';
}
/**
 * Generates a URL-safe short id for the trackable QR redirect endpoint.
 * Uses crypto.randomBytes for unpredictability (prevents enumeration of existing QR codes)
 * and a base62 alphabet so the id is short, case-sensitive, and URL-safe without encoding.
 * Default length = 8 chars = 62^8 = ~218 trillion combinations. Collision probability
 * is astronomically low for this use case.
 */
const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'; // no 0/O/1/l/I for readability
function generateShortId(length = 8) {
    const bytes = crypto_1.default.randomBytes(length);
    let out = '';
    for (let i = 0; i < length; i++) {
        out += ID_ALPHABET[bytes[i] % ID_ALPHABET.length];
    }
    return out;
}
/**
 * Minimal URL validator. We accept only http/https schemes to avoid generating QR codes
 * that encode javascript:, data:, file: or other schemes that could be abused for XSS or
 * phishing when the user/admin clicks through our redirect endpoint.
 */
function isSafeHttpUrl(u) {
    try {
        const parsed = new URL(u);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    }
    catch {
        return false;
    }
}
// requireAdminAuth importe depuis ../../../utils/auth (SEC-01, 2026-04-18).
exports.default = strapi_1.factories.createCoreController('api::qr-code.qr-code', ({ strapi }) => ({
    /**
     * POST /api/qr-codes
     * Creates a new dynamic QR code.
     * Body: { destinationUrl: string, title?: string }
     * Returns: { id, shortId, destinationUrl, trackingUrl, title, createdAt }
     * trackingUrl is what the frontend should encode visually in the QR image.
     */
    async createDynamic(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { destinationUrl, title } = (ctx.request.body || {});
        if (!destinationUrl || typeof destinationUrl !== 'string') {
            return ctx.badRequest('destinationUrl is required');
        }
        const trimmed = destinationUrl.trim();
        if (!isSafeHttpUrl(trimmed)) {
            return ctx.badRequest('destinationUrl must be a valid http(s) URL');
        }
        // Generate a unique shortId. In the (virtually impossible) case of a collision,
        // retry up to 5 times with progressively longer ids.
        let shortId = '';
        let attempts = 0;
        while (attempts < 5) {
            const candidate = generateShortId(8 + attempts);
            const existing = await strapi.documents('api::qr-code.qr-code').findMany({
                filters: { shortId: candidate },
                limit: 1,
            });
            if (existing.length === 0) {
                shortId = candidate;
                break;
            }
            attempts++;
        }
        if (!shortId) {
            return ctx.internalServerError('Could not generate unique short id');
        }
        const createdByEmail = ctx.state.adminUserEmail || null;
        const entity = await strapi.documents('api::qr-code.qr-code').create({
            data: {
                shortId,
                destinationUrl: trimmed,
                title: (title && typeof title === 'string') ? title.trim().slice(0, 200) : '',
                createdByEmail,
                active: true,
            },
        });
        // Strapi v5 preficxe automatiquement toutes les routes custom par /api/.
        // La route est definie en path:'/qr/:shortId' dans custom-qr-code.ts, ce qui
        // donne en realite /api/qr/:shortId une fois mountee. La trackingUrl qu'on
        // encode dans le QR doit donc inclure /api/ pour pointer sur le bon endpoint.
        const trackingBase = process.env.QR_TRACKING_BASE_URL
            || process.env.PUBLIC_API_URL
            || 'https://massivemedias-api.onrender.com';
        const normalizedBase = trackingBase.replace(/\/$/, '').replace(/\/api$/, '');
        const trackingUrl = `${normalizedBase}/api/qr/${shortId}`;
        ctx.body = {
            id: entity.id,
            documentId: entity.documentId,
            shortId,
            destinationUrl: trimmed,
            trackingUrl,
            title: entity.title || '',
            createdAt: entity.createdAt,
            scansCount: 0,
        };
    },
    /**
     * GET /api/qr-codes/list
     * Returns the admin list of QR codes with aggregate scan counts.
     * Sorted by most-recent first. No pagination yet (low volume expected).
     */
    async listWithScans(ctx) {
        var _a;
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const codes = await strapi.documents('api::qr-code.qr-code').findMany({
            sort: { createdAt: 'desc' },
            limit: 500,
        });
        // PERF-01 : aggregate en une seule query au lieu du N+1 precedent. On
        // fetch TOUS les scans en une fois avec le qrCode relation populate (pour
        // connaitre le documentId parent), puis on group-by en memoire. Ancien
        // code lancait 1 query par QR code -> explosait a 500 QR codes ou plus.
        // ANALYTICS (3 mai 2026) : on inclut aussi city/userAgent pour calculer
        // le top-city et le device dominant par QR sans 2eme requete.
        const allScans = await strapi.db.query('api::qr-scan.qr-scan').findMany({
            populate: ['qrCode'],
            select: ['scannedAt', 'city', 'userAgent'],
        });
        const scansByQrCodeId = new Map();
        for (const scan of allScans) {
            const qrCodeId = (_a = scan.qrCode) === null || _a === void 0 ? void 0 : _a.id;
            if (!qrCodeId)
                continue;
            const existing = scansByQrCodeId.get(qrCodeId) || {
                count: 0, lastScannedAt: null, cityCounts: {}, deviceCounts: {},
            };
            existing.count++;
            if (!existing.lastScannedAt || scan.scannedAt > existing.lastScannedAt) {
                existing.lastScannedAt = scan.scannedAt;
            }
            const city = scan.city || 'Inconnu';
            existing.cityCounts[city] = (existing.cityCounts[city] || 0) + 1;
            const device = classifyDevice(scan.userAgent || '');
            existing.deviceCounts[device] = (existing.deviceCounts[device] || 0) + 1;
            scansByQrCodeId.set(qrCodeId, existing);
        }
        // Helper : top entry d'un Record<string, number>.
        const topOf = (counts) => {
            const entries = Object.entries(counts);
            if (entries.length === 0)
                return null;
            entries.sort((a, b) => b[1] - a[1]);
            return { name: entries[0][0], count: entries[0][1] };
        };
        const result = codes.map((c) => {
            const agg = scansByQrCodeId.get(c.id) || {
                count: 0, lastScannedAt: null, cityCounts: {}, deviceCounts: {},
            };
            return {
                id: c.id,
                documentId: c.documentId,
                shortId: c.shortId,
                destinationUrl: c.destinationUrl,
                title: c.title || '',
                createdByEmail: c.createdByEmail || null,
                createdAt: c.createdAt,
                active: c.active !== false,
                scansCount: agg.count,
                lastScannedAt: agg.lastScannedAt,
                topCity: topOf(agg.cityCounts),
                topDevice: topOf(agg.deviceCounts),
            };
        });
        ctx.body = { data: result, total: result.length };
    },
    /**
     * DELETE /api/qr-codes/:documentId
     * Deletes a QR code (and cascades to scans via Strapi relation cleanup).
     */
    async deleteQr(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { documentId } = ctx.params;
        const entity = await strapi.documents('api::qr-code.qr-code').findFirst({
            filters: { documentId },
        });
        if (!entity)
            return ctx.notFound('QR code not found');
        // Delete all associated scans first (Strapi cascading behavior is not always reliable).
        const scans = await strapi.documents('api::qr-scan.qr-scan').findMany({
            filters: { qrCode: { documentId } },
            limit: 100000,
        });
        for (const s of scans) {
            try {
                await strapi.documents('api::qr-scan.qr-scan').delete({ documentId: s.documentId });
            }
            catch (e) { /* continue */ }
        }
        await strapi.documents('api::qr-code.qr-code').delete({ documentId });
        ctx.body = { success: true, deletedScans: scans.length };
    },
    /**
     * GET /qr/:shortId
     * PUBLIC endpoint. Logs the scan and 302-redirects to the destination URL.
     *
     * Design choices:
     * - 302 (not 301) so browsers don't cache the redirect - we need every scan logged.
     * - Cache-Control: no-store for the same reason.
     * - Scan logging is BEST-EFFORT: if the insert fails we still redirect the user.
     *   It's better to let the scan through than to break the UX because our DB hiccuped.
     * - We don't wait for the insert to finish (fire-and-forget) to keep the redirect
     *   instant. The insert typically completes in < 50ms anyway.
     */
    async redirect(ctx) {
        var _a, _b;
        const { shortId } = ctx.params;
        if (!shortId || typeof shortId !== 'string') {
            ctx.status = 400;
            ctx.body = 'Invalid QR code';
            return;
        }
        const entity = await strapi.documents('api::qr-code.qr-code').findFirst({
            filters: { shortId },
        });
        if (!entity || entity.active === false) {
            ctx.status = 404;
            ctx.body = 'QR code not found or disabled';
            return;
        }
        // Best-effort scan logging. Does not block the redirect.
        const ipAddress = ctx.request.headers['cf-connecting-ip']
            || ((_b = (_a = ctx.request.headers['x-forwarded-for']) === null || _a === void 0 ? void 0 : _a.split(',')[0]) === null || _b === void 0 ? void 0 : _b.trim())
            || ctx.ip
            || '';
        const userAgent = String(ctx.request.headers['user-agent'] || '').slice(0, 500);
        const referer = String(ctx.request.headers['referer'] || '').slice(0, 500);
        // GEOIP (3 mai 2026) : enrichissement local via geoip-lite (MaxMind
        // GeoLite2). Aucune API externe -> pas de latence ajoutee, pas de
        // rate-limit, pas de probleme GDPR cote IP shipping.
        const { city, country } = resolveGeo(ipAddress);
        // Fire-and-forget - do NOT await, do NOT let it block the redirect.
        strapi.documents('api::qr-scan.qr-scan').create({
            data: {
                scannedAt: new Date(),
                ipAddress: ipAddress.slice(0, 64),
                userAgent,
                referer,
                city,
                country,
                qrCode: entity.documentId,
            },
        }).catch((err) => {
            strapi.log.warn(`QR scan log failed for ${shortId}:`, (err === null || err === void 0 ? void 0 : err.message) || err);
        });
        // 302 redirect to destination
        ctx.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        ctx.status = 302;
        ctx.redirect(entity.destinationUrl);
    },
    /**
     * GET /api/qr-codes/:documentId/scans
     * Returns the raw scan list for a given QR code (for drilldown in the admin UI).
     */
    async listScans(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { documentId } = ctx.params;
        const qr = await strapi.documents('api::qr-code.qr-code').findFirst({
            filters: { documentId },
        });
        if (!qr)
            return ctx.notFound('QR code not found');
        const scans = await strapi.documents('api::qr-scan.qr-scan').findMany({
            filters: { qrCode: { documentId } },
            sort: { scannedAt: 'desc' },
            limit: 1000,
        });
        // ANALYTICS (3 mai 2026) : aggregation par ville + appareil pour la
        // section "Mes QR" du dashboard. Calcule en memoire (limite 1000 scans
        // par QR couvre largement les besoins courants ; au-dela on pourra
        // passer en SQL group-by).
        const byCity = {};
        const byCountry = {};
        const byDevice = { mobile: 0, desktop: 0, tablet: 0, bot: 0, unknown: 0 };
        let lastScannedAt = null;
        const enrichedScans = scans.map((s) => {
            const city = s.city || 'Inconnu';
            const country = s.country || 'XX';
            const device = classifyDevice(s.userAgent || '');
            byCity[city] = (byCity[city] || 0) + 1;
            byCountry[country] = (byCountry[country] || 0) + 1;
            byDevice[device] = (byDevice[device] || 0) + 1;
            if (!lastScannedAt || s.scannedAt > lastScannedAt)
                lastScannedAt = s.scannedAt;
            return {
                scannedAt: s.scannedAt,
                ipAddress: s.ipAddress,
                userAgent: s.userAgent,
                referer: s.referer,
                city: s.city || '',
                country: s.country || '',
                device,
            };
        });
        ctx.body = {
            qrCode: { shortId: qr.shortId, destinationUrl: qr.destinationUrl },
            scans: enrichedScans,
            total: scans.length,
            analytics: {
                total: scans.length,
                lastScannedAt,
                byCity,
                byCountry,
                byDevice,
            },
        };
    },
}));
