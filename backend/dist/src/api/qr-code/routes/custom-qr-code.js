"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Custom routes for the dynamic QR code tracking system.
 *
 * Admin routes (auth enforced inside each controller via requireAdminAuth):
 *   POST   /api/qr-codes/create         -> create a new dynamic QR
 *   GET    /api/qr-codes/list           -> list with aggregate scan counts
 *   DELETE /api/qr-codes/:documentId    -> delete QR + its scans
 *   GET    /api/qr-codes/:documentId/scans -> drilldown of individual scan events
 *
 * Public route:
 *   GET    /qr/:shortId                 -> 302 redirect + fire-and-forget scan log
 *                                          (this URL is what the QR image encodes)
 */
exports.default = {
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
            method: 'GET',
            path: '/qr/:shortId',
            handler: 'qr-code.redirect',
            config: { auth: false },
        },
    ],
};
