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

import { BetaAnalyticsDataClient } from '@google-analytics/data';

let _client: BetaAnalyticsDataClient | null = null;
let _initAttempted = false;

export function getGAClient(): BetaAnalyticsDataClient | null {
  if (_initAttempted) return _client;
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
    _client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
    });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[GA4] init failed:', err?.message || err);
    _client = null;
  }
  return _client;
}

export function getGAPropertyId(): string | null {
  return process.env.GA_PROPERTY_ID || null;
}

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
export async function topPagesForPrefix(
  pathPrefix: string,
  limit = 3,
  daysWindow = 90,
): Promise<Array<{ pagePath: string; views: number }>> {
  const client = getGAClient();
  const propertyId = getGAPropertyId();
  if (!client || !propertyId) return [];

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
    limit: limit as any,
  });

  const rows = response?.rows || [];
  return rows.map((r) => ({
    pagePath: r.dimensionValues?.[0]?.value || '',
    views: Number(r.metricValues?.[0]?.value) || 0,
  }));
}
