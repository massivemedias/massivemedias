"use strict";
// Cache invalidation helper (avril 2026)
//
// Le site public est un SPA React statique servi via GitHub Pages + Cloudflare.
// Les donnees viennent de l'API Strapi en runtime, donc une mutation BDD est
// instantanement visible au prochain refetch frontend. MAIS Cloudflare peut
// cacher la reponse API au niveau Edge (surtout sur endpoints GET sans header
// Cache-Control strict) - ce module propose une purge explicite pour garantir
// que les clients voient le nouveau state dans la minute.
//
// Mode graceful : si CF_API_TOKEN ou CF_ZONE_ID absent, on log l'intention
// et on retourne ok=true pour ne jamais bloquer la mutation DB. La mutation
// est primaire, l'invalidation est un nice-to-have.
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateArtistCache = void 0;
const PUBLIC_ROOT = process.env.PUBLIC_SITE_URL || 'https://massivemedias.com';
function buildArtistUrls(slug) {
    // Pages publiques qui affichent les donnees artiste + endpoints API caches
    return [
        `${PUBLIC_ROOT}/artistes/${slug}`,
        `${PUBLIC_ROOT}/artistes/${slug}/`,
        `${PUBLIC_ROOT}/#/artistes/${slug}`, // hash router fallback
        `${PUBLIC_ROOT}/api/artists?filters[slug][$eq]=${slug}`,
    ];
}
/**
 * Purge Cloudflare Edge cache pour les URLs liees a un artiste.
 * Utilise l'API Cloudflare purge cache :
 *   POST https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/purge_cache
 *   Body: { files: [url1, url2, ...] }
 */
async function purgeCloudflare(urls, log) {
    const token = process.env.CF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
    const zoneId = process.env.CF_ZONE_ID || process.env.CLOUDFLARE_ZONE_ID;
    if (!token || !zoneId) {
        log(`[cache-invalidator] CF_API_TOKEN/CF_ZONE_ID absents - purge skip (noop). URLs qui auraient ete purgees: ${urls.length}`);
        return { ok: true, provider: 'noop', urlsPurged: 0 };
    }
    try {
        const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ files: urls }),
        });
        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            log(`[cache-invalidator] Cloudflare ${res.status}: ${errText.slice(0, 200)}`);
            return { ok: false, provider: 'cloudflare', urlsPurged: 0, error: `HTTP ${res.status}` };
        }
        const data = await res.json();
        if (!(data === null || data === void 0 ? void 0 : data.success)) {
            log(`[cache-invalidator] Cloudflare success=false: ${JSON.stringify((data === null || data === void 0 ? void 0 : data.errors) || []).slice(0, 200)}`);
            return { ok: false, provider: 'cloudflare', urlsPurged: 0, error: 'API error' };
        }
        log(`[cache-invalidator] Cloudflare purge ok : ${urls.length} url(s)`);
        return { ok: true, provider: 'cloudflare', urlsPurged: urls.length };
    }
    catch (err) {
        log(`[cache-invalidator] Cloudflare fetch error: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
        return { ok: false, provider: 'cloudflare', urlsPurged: 0, error: (err === null || err === void 0 ? void 0 : err.message) || 'fetch failed' };
    }
}
/**
 * Point d'entree public : invalide le cache public pour un artiste.
 * Best-effort : toujours retourne, ne throw pas pour ne pas bloquer la mutation DB.
 */
async function invalidateArtistCache(slug, strapiLog) {
    const log = (msg) => {
        if (strapiLog === null || strapiLog === void 0 ? void 0 : strapiLog.info)
            strapiLog.info(msg);
        else
            console.log(msg);
    };
    if (!slug) {
        return { ok: true, provider: 'noop', urlsPurged: 0 };
    }
    const urls = buildArtistUrls(slug);
    const result = await purgeCloudflare(urls, log);
    if (!result.ok && (strapiLog === null || strapiLog === void 0 ? void 0 : strapiLog.warn)) {
        strapiLog.warn(`[cache-invalidator] Purge echouee pour ${slug} (${result.error}) - les clients verront le nouveau state au TTL suivant.`);
    }
    return result;
}
exports.invalidateArtistCache = invalidateArtistCache;
