/**
 * Custom routes for the dynamic QR code tracking system.
 *
 * Admin routes (auth enforced inside each controller via requireAdminAuth):
 *   POST   /api/qr-codes/create         -> create a new dynamic QR
 *   GET    /api/qr-codes/list           -> list with aggregate scan counts
 *   PUT    /api/qr-codes/:documentId    -> update title/destination/active/clientEmail
 *   DELETE /api/qr-codes/:documentId    -> delete QR + its scans
 *   GET    /api/qr-codes/:documentId/scans -> drilldown of individual scan events
 *   POST   /api/qr-codes/:documentId/send-report -> email the stats report to the client
 *
 * Public route:
 *   GET    /qr/:shortId                 -> 302 redirect + fire-and-forget scan log
 *                                          (this URL is what the QR image encodes)
 */
export default {
  routes: [
    {
      method: 'POST',
      path: '/qr-codes/create',
      handler: 'qr-code.createDynamic',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/qr-codes/list',
      handler: 'qr-code.listWithScans',
      config: { auth: false },
    },
    {
      method: 'PUT',
      path: '/qr-codes/:documentId',
      handler: 'qr-code.updateQr',
      config: { auth: false },
    },
    {
      method: 'DELETE',
      path: '/qr-codes/:documentId',
      handler: 'qr-code.deleteQr',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/qr-codes/:documentId/scans',
      handler: 'qr-code.listScans',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/qr-codes/:documentId/send-report',
      handler: 'qr-code.sendReport',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/qr/:shortId',
      handler: 'qr-code.redirect',
      config: { auth: false },
    },
  ],
};
