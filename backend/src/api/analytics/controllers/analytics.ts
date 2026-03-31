import { BetaAnalyticsDataClient } from '@google-analytics/data';

let client: BetaAnalyticsDataClient | null = null;

function getClient() {
  if (client) return client;

  const creds = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!creds) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON env var not set');
  }

  const credentials = JSON.parse(creds);
  client = new BetaAnalyticsDataClient({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
    projectId: credentials.project_id,
  });

  return client;
}

const PROPERTY_ID = process.env.GA4_PROPERTY_ID || '525792501';

export default {
  // Stats filtrees pour un artiste specifique (par slug)
  async getArtistStats(ctx) {
    try {
      const analyticsClient = getClient();
      const slug = ctx.params.slug as string;
      if (!slug) {
        ctx.status = 400;
        ctx.body = { error: 'Artist slug is required' };
        return;
      }

      const period = (ctx.query.period as string) || '30';
      const startDate = `${period}daysAgo`;

      // Filtre sur les pages de l'artiste: /artistes/slug et slug.massivemedias.com
      const artistPageFilter: any = {
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
      const overviewRow = overviewRes[0]?.rows?.[0]?.metricValues || [];
      const overview = {
        pageViews: parseInt(overviewRow[0]?.value || '0'),
        activeUsers: parseInt(overviewRow[1]?.value || '0'),
        sessions: parseInt(overviewRow[2]?.value || '0'),
        avgSessionDuration: parseFloat(overviewRow[3]?.value || '0'),
      };

      // Parse daily
      const daily = (dailyRes[0]?.rows || []).map(row => {
        const dateStr = row.dimensionValues?.[0]?.value || '';
        const formatted = dateStr.length === 8
          ? `${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`
          : dateStr;
        return {
          date: formatted,
          pageViews: parseInt(row.metricValues?.[0]?.value || '0'),
          users: parseInt(row.metricValues?.[1]?.value || '0'),
        };
      });

      // Parse sources
      const sources = (sourcesRes[0]?.rows || []).map(row => ({
        source: row.dimensionValues?.[0]?.value || '(direct)',
        sessions: parseInt(row.metricValues?.[0]?.value || '0'),
        users: parseInt(row.metricValues?.[1]?.value || '0'),
      }));

      // Parse pages
      const pages = (pagesRes[0]?.rows || []).map(row => ({
        path: row.dimensionValues?.[0]?.value || '',
        views: parseInt(row.metricValues?.[0]?.value || '0'),
        users: parseInt(row.metricValues?.[1]?.value || '0'),
      }));

      // Parse devices
      const devices = (devicesRes[0]?.rows || []).map(row => ({
        device: row.dimensionValues?.[0]?.value || '',
        users: parseInt(row.metricValues?.[0]?.value || '0'),
      }));

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
    } catch (err) {
      console.error('[Analytics] Artist stats error:', err.message);
      ctx.status = err.message?.includes('not set') ? 503 : 500;
      ctx.body = {
        error: err.message?.includes('not set')
          ? 'Google Analytics not configured.'
          : 'Failed to fetch artist analytics',
      };
    }
  },

  async getStats(ctx) {
    try {
      const analyticsClient = getClient();
      const period = (ctx.query.period as string) || '30';
      const startDate = `${period}daysAgo`;

      // Run all queries in parallel
      const [
        overviewRes,
        pagesRes,
        sourcesRes,
        countriesRes,
        devicesRes,
        dailyRes,
        ageRes,
        browsersRes,
        citiesRes,
        landingPagesRes,
        realtimeRes,
      ] = await Promise.all([
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
      const overviewRow = overviewRes[0]?.rows?.[0]?.metricValues || [];
      const overview = {
        activeUsers: parseInt(overviewRow[0]?.value || '0'),
        sessions: parseInt(overviewRow[1]?.value || '0'),
        pageViews: parseInt(overviewRow[2]?.value || '0'),
        avgSessionDuration: parseFloat(overviewRow[3]?.value || '0'),
        bounceRate: parseFloat(overviewRow[4]?.value || '0'),
        newUsers: parseInt(overviewRow[5]?.value || '0'),
      };

      // Parse pages
      const pages = (pagesRes[0]?.rows || []).map(row => ({
        path: row.dimensionValues?.[0]?.value || '',
        views: parseInt(row.metricValues?.[0]?.value || '0'),
        users: parseInt(row.metricValues?.[1]?.value || '0'),
        avgDuration: parseFloat(row.metricValues?.[2]?.value || '0'),
      }));

      // Parse sources
      const sources = (sourcesRes[0]?.rows || []).map(row => ({
        source: row.dimensionValues?.[0]?.value || '(direct)',
        sessions: parseInt(row.metricValues?.[0]?.value || '0'),
        users: parseInt(row.metricValues?.[1]?.value || '0'),
      }));

      // Parse countries
      const countries = (countriesRes[0]?.rows || []).map(row => ({
        country: row.dimensionValues?.[0]?.value || '',
        users: parseInt(row.metricValues?.[0]?.value || '0'),
        sessions: parseInt(row.metricValues?.[1]?.value || '0'),
      }));

      // Parse devices
      const devices = (devicesRes[0]?.rows || []).map(row => ({
        device: row.dimensionValues?.[0]?.value || '',
        users: parseInt(row.metricValues?.[0]?.value || '0'),
        sessions: parseInt(row.metricValues?.[1]?.value || '0'),
      }));

      // Parse daily data
      const daily = (dailyRes[0]?.rows || []).map(row => {
        const dateStr = row.dimensionValues?.[0]?.value || '';
        const formatted = dateStr.length === 8
          ? `${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`
          : dateStr;
        return {
          date: formatted,
          users: parseInt(row.metricValues?.[0]?.value || '0'),
          sessions: parseInt(row.metricValues?.[1]?.value || '0'),
          pageViews: parseInt(row.metricValues?.[2]?.value || '0'),
        };
      });

      // Parse age
      const ageGroups = (ageRes[0]?.rows || []).map(row => ({
        age: row.dimensionValues?.[0]?.value || '',
        users: parseInt(row.metricValues?.[0]?.value || '0'),
      }));

      // Parse browsers
      const browsers = (browsersRes[0]?.rows || []).map(row => ({
        browser: row.dimensionValues?.[0]?.value || '',
        users: parseInt(row.metricValues?.[0]?.value || '0'),
        sessions: parseInt(row.metricValues?.[1]?.value || '0'),
      }));

      // Parse cities
      const cities = (citiesRes[0]?.rows || []).map(row => ({
        city: row.dimensionValues?.[0]?.value || '',
        users: parseInt(row.metricValues?.[0]?.value || '0'),
        sessions: parseInt(row.metricValues?.[1]?.value || '0'),
      }));

      // Parse landing pages
      const landingPages = (landingPagesRes[0]?.rows || []).map(row => ({
        page: row.dimensionValues?.[0]?.value || '',
        sessions: parseInt(row.metricValues?.[0]?.value || '0'),
        users: parseInt(row.metricValues?.[1]?.value || '0'),
      }));

      // Parse realtime
      const realtimeUsers = realtimeRes
        ? parseInt(realtimeRes[0]?.rows?.[0]?.metricValues?.[0]?.value || '0')
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
    } catch (err) {
      console.error('[Analytics] Error:', err.message);
      ctx.status = err.message?.includes('not set') ? 503 : 500;
      ctx.body = {
        error: err.message?.includes('not set')
          ? 'Google Analytics not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON env var.'
          : 'Failed to fetch analytics data',
      };
    }
  },
};
