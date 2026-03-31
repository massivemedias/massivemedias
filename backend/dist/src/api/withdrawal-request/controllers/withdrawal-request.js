"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreController('api::withdrawal-request.withdrawal-request', ({ strapi }) => ({
    // POST /withdrawal-requests/create - Artiste demande un retrait
    async createRequest(ctx) {
        const { artistSlug, artistName, email, paypalEmail, amount, notes } = ctx.request.body;
        if (!email || !paypalEmail || !amount) {
            ctx.throw(400, 'Email, PayPal email and amount required');
            return;
        }
        if (amount <= 0) {
            ctx.throw(400, 'Amount must be positive');
            return;
        }
        try {
            // Verifier pas de demande pending deja en cours
            const pending = await strapi.documents('api::withdrawal-request.withdrawal-request').findMany({
                filters: {
                    email: { $eqi: email },
                    status: { $in: ['pending', 'processing'] },
                },
                limit: 1,
            });
            if (pending && pending.length > 0) {
                ctx.throw(400, 'You already have a pending withdrawal request');
                return;
            }
            const entry = await strapi.documents('api::withdrawal-request.withdrawal-request').create({
                data: {
                    artistSlug: artistSlug || '',
                    artistName: artistName || '',
                    email: email.toLowerCase().trim(),
                    paypalEmail: paypalEmail.toLowerCase().trim(),
                    amount,
                    notes: notes || '',
                    status: 'pending',
                },
            });
            ctx.body = {
                data: {
                    documentId: entry.documentId,
                    amount: entry.amount,
                    status: entry.status,
                    createdAt: entry.createdAt,
                },
            };
        }
        catch (err) {
            if (err.status === 400)
                throw err;
            ctx.throw(500, err.message);
        }
    },
    // GET /withdrawal-requests/my-requests?email=xxx - Retraits d'un artiste
    async myRequests(ctx) {
        const { email } = ctx.query;
        if (!email) {
            ctx.throw(400, 'Email required');
            return;
        }
        try {
            const entries = await strapi.documents('api::withdrawal-request.withdrawal-request').findMany({
                filters: { email: { $eqi: email } },
                sort: { createdAt: 'desc' },
                limit: 50,
            });
            ctx.body = {
                data: (entries || []).map((e) => ({
                    documentId: e.documentId,
                    amount: e.amount,
                    paypalEmail: e.paypalEmail,
                    status: e.status,
                    notes: e.notes,
                    adminNotes: e.adminNotes,
                    processedAt: e.processedAt,
                    createdAt: e.createdAt,
                })),
            };
        }
        catch (err) {
            ctx.throw(500, err.message);
        }
    },
    // GET /withdrawal-requests/admin - Toutes les demandes (admin)
    async adminList(ctx) {
        try {
            const entries = await strapi.documents('api::withdrawal-request.withdrawal-request').findMany({
                sort: { createdAt: 'desc' },
                limit: 100,
            });
            ctx.body = {
                data: (entries || []).map((e) => ({
                    documentId: e.documentId,
                    artistSlug: e.artistSlug,
                    artistName: e.artistName,
                    email: e.email,
                    paypalEmail: e.paypalEmail,
                    amount: e.amount,
                    status: e.status,
                    notes: e.notes,
                    adminNotes: e.adminNotes,
                    processedAt: e.processedAt,
                    paypalTransactionId: e.paypalTransactionId,
                    createdAt: e.createdAt,
                })),
            };
        }
        catch (err) {
            ctx.throw(500, err.message);
        }
    },
    // PUT /withdrawal-requests/:documentId/process - Admin traite la demande
    async processRequest(ctx) {
        const { documentId } = ctx.params;
        const { status, adminNotes, paypalTransactionId } = ctx.request.body;
        if (!status || !['processing', 'completed', 'rejected'].includes(status)) {
            ctx.throw(400, 'Valid status required (processing, completed, rejected)');
            return;
        }
        try {
            const data = { status };
            if (adminNotes)
                data.adminNotes = adminNotes;
            if (paypalTransactionId)
                data.paypalTransactionId = paypalTransactionId;
            if (status === 'completed' || status === 'rejected') {
                data.processedAt = new Date().toISOString();
            }
            const entry = await strapi.documents('api::withdrawal-request.withdrawal-request').update({
                documentId,
                data,
            });
            const result = entry;
            ctx.body = {
                data: {
                    documentId: result.documentId,
                    status: result.status,
                    processedAt: result.processedAt,
                },
            };
        }
        catch (err) {
            ctx.throw(500, err.message);
        }
    },
}));
