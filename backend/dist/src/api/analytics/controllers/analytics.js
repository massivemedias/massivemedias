"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_1 = require("@google-analytics/data");
let client = null;
function getClient() {
    if (client)
        return client;
    const creds = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!creds) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON env var not set');
    }
    const credentials = JSON.parse(creds);
    client = new data_1.BetaAnalyticsDataClient({
        credentials: {
            client_email: credentials.client_email,
            private_key: credentials.private_key,
        },
        projectId: credentials.project_id,
    });
    return client;
}
const PROPERTY_ID = process.env.GA4_PROPERTY_ID || '525792501';
exports.default = {
    // Stats filtrees pour un artiste specifique (par slug)
    async getArtistStats(ctx) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        try {
            const analyticsClient = getClient();
            const slug = ctx.params.slug;
            if (!slug) {
                ctx.status = 400;
                ctx.body = { error: 'Artist slug is required' };
                return;
            }
            const period = ctx.query.period || '30';
            const startDate = `${period}daysAgo`;
            // Filtre sur les pages de l'artiste: /artistes/slug et slug.massivemedias.com
            const artistPageFilter = {
                orGroup: {
                    expressions: [
                        {
                            filter: {
                                fieldName: 'pagePath',
                                stringFilter: { matchType: 'CONTAINS', value: `/artistes/${slug}` },
                            },
                        },
                        {
                            filter: {
                                fieldName: 'hostName',
                                stringFilter: { matchType: 'CONTAINS', value: `${slug}.massivemedias.com` },
                            },
                        },
                    ],
                },
            };
            const [overviewRes, dailyRes, sourcesRes, pagesRes, devicesRes] = await Promise.all([
                // Overview pour les pages de l'artiste
                analyticsClient.runReport({
                    property: `properties/${PROPERTY_ID}`,
                    dateRanges: [{ startDate, endDate: 'today' }],
                    metrics: [
                        { name: 'screenPageViews' },
                        { name: 'activeUsers' },
                        { name: 'sessions' },
                        { name: 'averageSessionDuration' },
                    ],
                    dimensionFilter: artistPageFilter,
                }),
                // Vues par jour
                analyticsClient.runReport({
                    property: `properties/${PROPERTY_ID}`,
                    dateRanges: [{ startDate, endDate: 'today' }],
                    dimensions: [{ name: 'date' }],
                    metrics: [
                        { name: 'screenPageViews' },
                        { name: 'activeUsers' },
                    ],
                    dimensionFilter: artistPageFilter,
                    orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
                }),
                // Sources de trafic vers les pages de l'artiste
                analyticsClient.runReport({
                    property: `properties/${PROPERTY_ID}`,
                    dateRanges: [{ startDate, endDate: 'today' }],
                    dimensions: [{ name: 'sessionSource' }],
                    metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
                    dimensionFilter: artistPageFilter,
                    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
                    limit: 10,
                }),
                // Pages les plus vues (sous-pages artiste, prints, etc.)
                analyticsClient.runReport({
                    property: `properties/${PROPERTY_ID}`,
                    dateRanges: [{ startDate, endDate: 'today' }],
                    dimensions: [{ name: 'pagePath' }],
                    metrics: [
                        { name: 'screenPageViews' },
                        { name: 'activeUsers' },
                    ],
                    dimensionFilter: artistPageFilter,
                    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
                    limit: 15,
                }),
                // Appareils
                analyticsClient.runReport({
                    property: `properties/${PROPERTY_ID}`,
                    dateRanges: [{ startDate, endDate: 'today' }],
                    dimensions: [{ name: 'deviceCategory' }],
                    metrics: [{ name: 'activeUsers' }],
                    dimensionFilter: artistPageFilter,
                    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
                }),
            ]);
            // Parse overview
            const overviewRow = ((_c = (_b = (_a = overviewRes[0]) === null || _a === void 0 ? void 0 : _a.rows) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.metricValues) || [];
            const overview = {
                pageViews: parseInt(((_d = overviewRow[0]) === null || _d === void 0 ? void 0 : _d.value) || '0'),
                activeUsers: parseInt(((_e = overviewRow[1]) === null || _e === void 0 ? void 0 : _e.value) || '0'),
                sessions: parseInt(((_f = overviewRow[2]) === null || _f === void 0 ? void 0 : _f.value) || '0'),
                avgSessionDuration: parseFloat(((_g = overviewRow[3]) === null || _g === void 0 ? void 0 : _g.value) || '0'),
            };
            // Parse daily
            const daily = (((_h = dailyRes[0]) === null || _h === void 0 ? void 0 : _h.rows) || []).map(row => {
                var _a, _b, _c, _d, _e, _f;
                const dateStr = ((_b = (_a = row.dimensionValues) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) || '';
                const formatted = dateStr.length === 8
                    ? `${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`
                    : dateStr;
                return {
                    date: formatted,
                    pageViews: parseInt(((_d = (_c = row.metricValues) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) || '0'),
                    users: parseInt(((_f = (_e = row.metricValues) === null || _e === void 0 ? void 0 : _e[1]) === null || _f === void 0 ? void 0 : _f.value) || '0'),
                };
            });
            // Parse sources
            const sources = (((_j = sourcesRes[0]) === null || _j === void 0 ? void 0 : _j.rows) || []).map(row => {
                var _a, _b, _c, _d, _e, _f;
                return ({
                    source: ((_b = (_a = row.dimensionValues) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) || '(direct)',
                    sessions: parseInt(((_d = (_c = row.metricValues) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) || '0'),
                    users: parseInt(((_f = (_e = row.metricValues) === null || _e === void 0 ? void 0 : _e[1]) === null || _f === void 0 ? void 0 : _f.value) || '0'),
                });
            });
            // Parse pages
            const pages = (((_k = pagesRes[0]) === null || _k === void 0 ? void 0 : _k.rows) || []).map(row => {
                var _a, _b, _c, _d, _e, _f;
                return ({
                    path: ((_b = (_a = row.dimensionValues) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) || '',
                    views: parseInt(((_d = (_c = row.metricValues) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) || '0'),
                    users: parseInt(((_f = (_e = row.metricValues) === null || _e === void 0 ? void 0 : _e[1]) === null || _f === void 0 ? void 0 : _f.value) || '0'),
                });
            });
            // Parse devices
            const devices = (((_l = devicesRes[0]) === null || _l === void 0 ? void 0 : _l.rows) || []).map(row => {
                var _a, _b, _c, _d;
                return ({
                    device: ((_b = (_a = row.dimensionValues) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) || '',
                    users: parseInt(((_d = (_c = row.metricValues) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) || '0'),
                });
            });
            ctx.body = {
                data: {
                    overview,
                    daily,
                    sources,
                    pages,
                    devices,
                    period: parseInt(period),
                    slug,
                },
            };
        }
        catch (err) {
            console.error('[Analytics] Artist stats error:', err.message);
            ctx.status = ((_m = err.message) === null || _m === void 0 ? void 0 : _m.includes('not set')) ? 503 : 500;
            ctx.body = {
                error: ((_o = err.message) === null || _o === void 0 ? void 0 : _o.includes('not set'))
                    ? 'Google Analytics not configured.'
                    : 'Failed to fetch artist analytics',
            };
        }
    },
    async getStats(ctx) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
        try {
            const analyticsClient = getClient();
            const period = ctx.query.period || '30';
            const startDate = `${period}daysAgo`;
            // Run all queries in parallel
            const [overviewRes, pagesRes, sourcesRes, countriesRes, devicesRes, dailyRes, ageRes, browsersRes, citiesRes, landingPagesRes, realtimeRes,] = await Promise.all([
                // Overview metrics
                analyticsClient.runReport({
                    property: `properties/${PROPERTY_ID}`,
                    dateRanges: [{ startDate, endDate: 'today' }],
                    metrics: [
                        { name: 'activeUsers' },
                        { name: 'sessions' },
                        { name: 'screenPageViews' },
                        { name: 'averageSessionDuration' },
                        { name: 'bounceRate' },
                        { name: 'newUsers' },
                    ],
                }),
                // Top pages
                analyticsClient.runReport({
                    property: `properties/${PROPERTY_ID}`,
                    dateRanges: [{ startDate, endDate: 'today' }],
                    dimensions: [{ name: 'pagePath' }],
                    metrics: [
                        { name: 'screenPageViews' },
                        { name: 'activeUsers' },
                        { name: 'averageSessionDuration' },
                    ],
                    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
                    limit: 15,
                }),
                // Traffic sources
                analyticsClient.runReport({
                    property: `properties/${PROPERTY_ID}`,
                    dateRanges: [{ startDate, endDate: 'today' }],
                    dimensions: [{ name: 'sessionSource' }],
                    metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
                    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
                    limit: 10,
                }),
                // Countries
                analyticsClient.runReport({
                    property: `properties/${PROPERTY_ID}`,
                    dateRanges: [{ startDate, endDate: 'today' }],
                    dimensions: [{ name: 'country' }],
                    metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
                    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
                    limit: 10,
                }),
                // Devices
                analyticsClient.runReport({
                    property: `properties/${PROPERTY_ID}`,
                    dateRanges: [{ startDate, endDate: 'today' }],
                    dimensions: [{ name: 'deviceCategory' }],
                    metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
                    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
                }),
                // Daily visitors (for chart)
                analyticsClient.runReport({
                    property: `properties/${PROPERTY_ID}`,
                    dateRanges: [{ startDate, endDate: 'today' }],
                    dimensions: [{ name: 'date' }],
                    metrics: [
                        { name: 'activeUsers' },
                        { name: 'sessions' },
                        { name: 'screenPageViews' },
                    ],
                    orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
                }),
                // Age groups
                analyticsClient.runReport({
                    property: `properties/${PROPERTY_ID}`,
                    dateRanges: [{ startDate, endDate: 'today' }],
                    dimensions: [{ name: 'userAgeBracket' }],
                    metrics: [{ name: 'activeUsers' }],
                    orderBys: [{ dimension: { dimensionName: 'userAgeBracket' }, desc: false }],
                }),
                // Browsers
                analyticsClient.runReport({
                    property: `properties/${PROPERTY_ID}`,
                    dateRanges: [{ startDate, endDate: 'today' }],
                    dimensions: [{ name: 'browser' }],
                    metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
                    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
                    limit: 10,
                }),
                // Cities
                analyticsClient.runReport({
                    property: `properties/${PROPERTY_ID}`,
                    dateRanges: [{ startDate, endDate: 'today' }],
                    dimensions: [{ name: 'city' }],
                    metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
                    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
                    limit: 15,
                }),
                // Landing pages (first page visited)
                analyticsClient.runReport({
                    property: `properties/${PROPERTY_ID}`,
                    dateRanges: [{ startDate, endDate: 'today' }],
                    dimensions: [{ name: 'landingPagePlusQueryString' }],
                    metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
                    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
                    limit: 10,
                }),
                // Realtime - active users now
                analyticsClient.runRealtimeReport({
                    property: `properties/${PROPERTY_ID}`,
                    metrics: [{ name: 'activeUsers' }],
                }).catch(() => null), // Realtime may fail silently
            ]);
            // Parse overview
            const overviewRow = ((_c = (_b = (_a = overviewRes[0]) === null || _a === void 0 ? void 0 : _a.rows) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.metricValues) || [];
            const overview = {
                activeUsers: parseInt(((_d = overviewRow[0]) === null || _d === void 0 ? void 0 : _d.value) || '0'),
                sessions: parseInt(((_e = overviewRow[1]) === null || _e === void 0 ? void 0 : _e.value) || '0'),
                pageViews: parseInt(((_f = overviewRow[2]) === null || _f === void 0 ? void 0 : _f.value) || '0'),
                avgSessionDuration: parseFloat(((_g = overviewRow[3]) === null || _g === void 0 ? void 0 : _g.value) || '0'),
                bounceRate: parseFloat(((_h = overviewRow[4]) === null || _h === void 0 ? void 0 : _h.value) || '0'),
                newUsers: parseInt(((_j = overviewRow[5]) === null || _j === void 0 ? void 0 : _j.value) || '0'),
            };
            // Parse pages
            const pages = (((_k = pagesRes[0]) === null || _k === void 0 ? void 0 : _k.rows) || []).map(row => {
                var _a, _b, _c, _d, _e, _f, _g, _h;
                return ({
                    path: ((_b = (_a = row.dimensionValues) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) || '',
                    views: parseInt(((_d = (_c = row.metricValues) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) || '0'),
                    users: parseInt(((_f = (_e = row.metricValues) === null || _e === void 0 ? void 0 : _e[1]) === null || _f === void 0 ? void 0 : _f.value) || '0'),
                    avgDuration: parseFloat(((_h = (_g = row.metricValues) === null || _g === void 0 ? void 0 : _g[2]) === null || _h === void 0 ? void 0 : _h.value) || '0'),
                });
            });
            // Parse sources
            const sources = (((_l = sourcesRes[0]) === null || _l === void 0 ? void 0 : _l.rows) || []).map(row => {
                var _a, _b, _c, _d, _e, _f;
                return ({
                    source: ((_b = (_a = row.dimensionValues) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) || '(direct)',
                    sessions: parseInt(((_d = (_c = row.metricValues) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) || '0'),
                    users: parseInt(((_f = (_e = row.metricValues) === null || _e === void 0 ? void 0 : _e[1]) === null || _f === void 0 ? void 0 : _f.value) || '0'),
                });
            });
            // Parse countries
            const countries = (((_m = countriesRes[0]) === null || _m === void 0 ? void 0 : _m.rows) || []).map(row => {
                var _a, _b, _c, _d, _e, _f;
                return ({
                    country: ((_b = (_a = row.dimensionValues) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) || '',
                    users: parseInt(((_d = (_c = row.metricValues) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) || '0'),
                    sessions: parseInt(((_f = (_e = row.metricValues) === null || _e === void 0 ? void 0 : _e[1]) === null || _f === void 0 ? void 0 : _f.value) || '0'),
                });
            });
            // Parse devices
            const devices = (((_o = devicesRes[0]) === null || _o === void 0 ? void 0 : _o.rows) || []).map(row => {
                var _a, _b, _c, _d, _e, _f;
                return ({
                    device: ((_b = (_a = row.dimensionValues) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) || '',
                    users: parseInt(((_d = (_c = row.metricValues) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) || '0'),
                    sessions: parseInt(((_f = (_e = row.metricValues) === null || _e === void 0 ? void 0 : _e[1]) === null || _f === void 0 ? void 0 : _f.value) || '0'),
                });
            });
            // Parse daily data
            const daily = (((_p = dailyRes[0]) === null || _p === void 0 ? void 0 : _p.rows) || []).map(row => {
                var _a, _b, _c, _d, _e, _f, _g, _h;
                const dateStr = ((_b = (_a = row.dimensionValues) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) || '';
                const formatted = dateStr.length === 8
                    ? `${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`
                    : dateStr;
                return {
                    date: formatted,
                    users: parseInt(((_d = (_c = row.metricValues) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) || '0'),
                    sessions: parseInt(((_f = (_e = row.metricValues) === null || _e === void 0 ? void 0 : _e[1]) === null || _f === void 0 ? void 0 : _f.value) || '0'),
                    pageViews: parseInt(((_h = (_g = row.metricValues) === null || _g === void 0 ? void 0 : _g[2]) === null || _h === void 0 ? void 0 : _h.value) || '0'),
                };
            });
            // Parse age
            const ageGroups = (((_q = ageRes[0]) === null || _q === void 0 ? void 0 : _q.rows) || []).map(row => {
                var _a, _b, _c, _d;
                return ({
                    age: ((_b = (_a = row.dimensionValues) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) || '',
                    users: parseInt(((_d = (_c = row.metricValues) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) || '0'),
                });
            });
            // Parse browsers
            const browsers = (((_r = browsersRes[0]) === null || _r === void 0 ? void 0 : _r.rows) || []).map(row => {
                var _a, _b, _c, _d, _e, _f;
                return ({
                    browser: ((_b = (_a = row.dimensionValues) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) || '',
                    users: parseInt(((_d = (_c = row.metricValues) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) || '0'),
                    sessions: parseInt(((_f = (_e = row.metricValues) === null || _e === void 0 ? void 0 : _e[1]) === null || _f === void 0 ? void 0 : _f.value) || '0'),
                });
            });
            // Parse cities
            const cities = (((_s = citiesRes[0]) === null || _s === void 0 ? void 0 : _s.rows) || []).map(row => {
                var _a, _b, _c, _d, _e, _f;
                return ({
                    city: ((_b = (_a = row.dimensionValues) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) || '',
                    users: parseInt(((_d = (_c = row.metricValues) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) || '0'),
                    sessions: parseInt(((_f = (_e = row.metricValues) === null || _e === void 0 ? void 0 : _e[1]) === null || _f === void 0 ? void 0 : _f.value) || '0'),
                });
            });
            // Parse landing pages
            const landingPages = (((_t = landingPagesRes[0]) === null || _t === void 0 ? void 0 : _t.rows) || []).map(row => {
                var _a, _b, _c, _d, _e, _f;
                return ({
                    page: ((_b = (_a = row.dimensionValues) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) || '',
                    sessions: parseInt(((_d = (_c = row.metricValues) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) || '0'),
                    users: parseInt(((_f = (_e = row.metricValues) === null || _e === void 0 ? void 0 : _e[1]) === null || _f === void 0 ? void 0 : _f.value) || '0'),
                });
            });
            // Parse realtime
            const realtimeUsers = realtimeRes
                ? parseInt(((_y = (_x = (_w = (_v = (_u = realtimeRes[0]) === null || _u === void 0 ? void 0 : _u.rows) === null || _v === void 0 ? void 0 : _v[0]) === null || _w === void 0 ? void 0 : _w.metricValues) === null || _x === void 0 ? void 0 : _x[0]) === null || _y === void 0 ? void 0 : _y.value) || '0')
                : null;
            ctx.body = {
                data: {
                    overview,
                    pages,
                    sources,
                    countries,
                    devices,
                    daily,
                    ageGroups,
                    browsers,
                    cities,
                    landingPages,
                    realtimeUsers,
                    period: parseInt(period),
                },
            };
        }
        catch (err) {
            console.error('[Analytics] Error:', err.message);
            ctx.status = ((_z = err.message) === null || _z === void 0 ? void 0 : _z.includes('not set')) ? 503 : 500;
            ctx.body = {
                error: ((_0 = err.message) === null || _0 === void 0 ? void 0 : _0.includes('not set'))
                    ? 'Google Analytics not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON env var.'
                    : 'Failed to fetch analytics data',
            };
        }
    },
};
