"use strict";
// Google Analytics 4 Reporting bridge (Phase Top 3 oeuvres, 29 avril 2026)
// ------------------------------------------------------------------------
// Lit les statistiques de pageviews GA4 via le Data API. Utilise pour
// alimenter le panneau admin "Top 3 oeuvres" par artiste.
//
// CONFIG SUR RENDER (3 vars d'env requises) :
//   - GA_PROPERTY_ID    : ex "12345678" (numerique seul, sans prefixe)
//   - GA_CLIENT_EMAIL   : email du Service Account Google Cloud
//   - GA_PRIVATE_KEY    : private key PEM (\n litteral remplaces par \\n
//                         dans Render UI - on les desechappe ici)
//
// GRACEFUL FALLBACK : si l'une des 3 vars manque, getGAClient() retourne
// null et l'endpoint qui appelle ce module renvoie un tableau vide
// plutot que de crasher. Le projet tourne identiquement sans GA configure.
Object.defineProperty(exports, "__esModule", { value: true });
exports.topPagesForPrefix = exports.getGAPropertyId = exports.getGAClient = void 0;
const data_1 = require("@google-analytics/data");
let _client = null;
let _initAttempted = false;
function getGAClient() {
    if (_initAttempted)
        return _client;
    _initAttempted = true;
    const propertyId = process.env.GA_PROPERTY_ID;
    const clientEmail = process.env.GA_CLIENT_EMAIL;
    const rawPrivateKey = process.env.GA_PRIVATE_KEY;
    if (!propertyId || !clientEmail || !rawPrivateKey) {
        return null;
    }
    // Render stocke les multilines avec \n litteraux (pas de vraie newline)
    // - on les desechape ici. Si la cle est deja sur plusieurs lignes
    // (cas ou l'admin a colle directement), replace est no-op.
    const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
    try {
        _client = new data_1.BetaAnalyticsDataClient({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
        });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error('[GA4] init failed:', (err === null || err === void 0 ? void 0 : err.message) || err);
        _client = null;
    }
    return _client;
}
exports.getGAClient = getGAClient;
function getGAPropertyId() {
    return process.env.GA_PROPERTY_ID || null;
}
exports.getGAPropertyId = getGAPropertyId;
/**
 * Top N pages-vues qui matchent un prefixe pagePath.
 * Renvoie un tableau de { pagePath, views } trie desc.
 *
 * Si GA n'est pas configure, retourne [] (le caller affichera un etat
 * vide ou un message admin invitant a configurer les vars d'env).
 *
 * Window : par defaut 90 derniers jours - assez large pour avoir des
 * donnees meme sur une plateforme jeune, assez court pour rester
 * pertinent commercialement.
 */
async function topPagesForPrefix(pathPrefix, limit = 3, daysWindow = 90) {
    const client = getGAClient();
    const propertyId = getGAPropertyId();
    if (!client || !propertyId)
        return [];
    const [response] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: `${daysWindow}daysAgo`, endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        dimensionFilter: {
            filter: {
                fieldName: 'pagePath',
                stringFilter: {
                    matchType: 'BEGINS_WITH',
                    value: pathPrefix,
                    caseSensitive: false,
                },
            },
        },
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: limit,
    });
    const rows = (response === null || response === void 0 ? void 0 : response.rows) || [];
    return rows.map((r) => {
        var _a, _b, _c, _d;
        return ({
            pagePath: ((_b = (_a = r.dimensionValues) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) || '',
            views: Number((_d = (_c = r.metricValues) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) || 0,
        });
    });
}
exports.topPagesForPrefix = topPagesForPrefix;
