/**
 * ADMIN-VISITORS (9 juillet 2026).
 *
 * Public (rate-limite in-memory) :
 *   POST /api/visitor-hits/collect  -> enregistre un pageview {ipHash, path}
 *                                      (appele par navigator.sendBeacon)
 * Admin (requireAdminAuth dans le controller) :
 *   GET  /api/visitor-hits/count?window=1h|3h|24h -> visiteurs uniques
 */
export default {
  routes: [
    {
      method: 'POST',
      path: '/visitor-hits/collect',
      handler: 'visitor-hit.collect',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/visitor-hits/count',
      handler: 'visitor-hit.count',
      config: { auth: false },
    },
  ],
}
