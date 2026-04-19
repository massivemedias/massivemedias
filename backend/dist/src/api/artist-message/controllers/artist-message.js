"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
const auth_1 = require("../../../utils/auth");
exports.default = strapi_1.factories.createCoreController('api::artist-message.artist-message', ({ strapi }) => ({
    // POST /artist-messages/send - Artiste connecte envoie un message a l'admin
    async send(ctx) {
        if (!(await (0, auth_1.requireUserAuth)(ctx)))
            return;
        const { artistSlug, artistName, email, subject, message, category, attachments } = ctx.request.body;
        if (email && !(0, auth_1.assertOwnershipOrAdmin)(ctx, email))
            return;
        if (!email || !subject || !message) {
            ctx.throw(400, 'Email, subject and message required');
            return;
        }
        try {
            const entry = await strapi.documents('api::artist-message.artist-message').create({
                data: {
                    artistSlug: artistSlug || '',
                    artistName: artistName || '',
                    email: email.toLowerCase().trim(),
                    subject,
                    message,
                    category: category || 'other',
                    attachments: attachments || null,
                    status: 'new',
                },
            });
            ctx.body = {
                data: {
                    documentId: entry.documentId,
                    subject: entry.subject,
                    status: entry.status,
                    createdAt: entry.createdAt,
                },
            };
        }
        catch (err) {
            ctx.throw(500, err.message);
        }
    },
    // POST /artist-messages/send-public - Public envoie un message a un artiste
    async sendPublic(ctx) {
        const { artistSlug, artistName, senderName, senderEmail, message } = ctx.request.body;
        if (!senderEmail || !senderName || !message || !artistSlug) {
            ctx.throw(400, 'artistSlug, senderName, senderEmail and message required');
            return;
        }
        try {
            const conversationId = `pub-${artistSlug}-${Date.now()}`;
            const entry = await strapi.documents('api::artist-message.artist-message').create({
                data: {
                    artistSlug,
                    artistName: artistName || '',
                    email: senderEmail.toLowerCase().trim(),
                    senderName,
                    senderEmail: senderEmail.toLowerCase().trim(),
                    senderType: 'public',
                    subject: `Message de ${senderName}`,
                    message,
                    category: 'question',
                    status: 'new',
                    conversationId,
                },
            });
            ctx.body = { data: { documentId: entry.documentId, conversationId } };
        }
        catch (err) {
            ctx.throw(500, err.message);
        }
    },
    // PUT /artist-messages/:documentId/artist-reply - Artiste repond a un message public
    async artistReply(ctx) {
        if (!(await (0, auth_1.requireUserAuth)(ctx)))
            return;
        const { documentId } = ctx.params;
        const { artistReply } = ctx.request.body;
        if (!artistReply) {
            ctx.throw(400, 'Reply message required');
            return;
        }
        try {
            const entry = await strapi.documents('api::artist-message.artist-message').update({
                documentId,
                data: {
                    artistReply,
                    artistRepliedAt: new Date().toISOString(),
                    status: 'replied',
                },
            });
            ctx.body = { data: { documentId: entry.documentId, status: entry.status } };
        }
        catch (err) {
            ctx.throw(500, err.message);
        }
    },
    // GET /artist-messages/inbox?artistSlug=xxx - Messages recus par un artiste (du public)
    async inbox(ctx) {
        if (!(await (0, auth_1.requireUserAuth)(ctx)))
            return;
        const { artistSlug } = ctx.query;
        if (!artistSlug) {
            ctx.throw(400, 'artistSlug required');
            return;
        }
        try {
            const entries = await strapi.documents('api::artist-message.artist-message').findMany({
                filters: { artistSlug: artistSlug, senderType: 'public' },
                sort: { createdAt: 'desc' },
                limit: 50,
            });
            ctx.body = {
                data: (entries || []).map((e) => ({
                    documentId: e.documentId,
                    senderName: e.senderName,
                    senderEmail: e.senderEmail,
                    subject: e.subject,
                    message: e.message,
                    status: e.status,
                    artistReply: e.artistReply,
                    artistRepliedAt: e.artistRepliedAt,
                    conversationId: e.conversationId,
                    createdAt: e.createdAt,
                })),
            };
        }
        catch (err) {
            ctx.throw(500, err.message);
        }
    },
    // GET /artist-messages/my-messages?email=xxx - Messages d'un artiste (envoyes par l'artiste)
    async myMessages(ctx) {
        if (!(await (0, auth_1.requireUserAuth)(ctx)))
            return;
        const { email } = ctx.query;
        if (!email) {
            ctx.throw(400, 'Email required');
            return;
        }
        try {
            const entries = await strapi.documents('api::artist-message.artist-message').findMany({
                filters: { email: { $eqi: email } },
                sort: { createdAt: 'desc' },
                limit: 50,
            });
            ctx.body = {
                data: (entries || []).map((e) => ({
                    documentId: e.documentId,
                    subject: e.subject,
                    message: e.message,
                    category: e.category,
                    status: e.status,
                    attachments: e.attachments,
                    adminReply: e.adminReply,
                    repliedAt: e.repliedAt,
                    senderName: e.senderName,
                    senderEmail: e.senderEmail,
                    senderType: e.senderType,
                    artistReply: e.artistReply,
                    artistRepliedAt: e.artistRepliedAt,
                    conversationId: e.conversationId,
                    createdAt: e.createdAt,
                })),
            };
        }
        catch (err) {
            ctx.throw(500, err.message);
        }
    },
    // GET /artist-messages/admin - Tous les messages (admin)
    async adminList(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        try {
            const entries = await strapi.documents('api::artist-message.artist-message').findMany({
                sort: { createdAt: 'desc' },
                limit: 100,
            });
            ctx.body = {
                data: (entries || []).map((e) => ({
                    documentId: e.documentId,
                    artistSlug: e.artistSlug,
                    artistName: e.artistName,
                    email: e.email,
                    subject: e.subject,
                    message: e.message,
                    category: e.category,
                    status: e.status,
                    attachments: e.attachments,
                    adminReply: e.adminReply,
                    repliedAt: e.repliedAt,
                    createdAt: e.createdAt,
                })),
            };
        }
        catch (err) {
            ctx.throw(500, err.message);
        }
    },
    // PUT /artist-messages/:documentId/reply - Admin repond
    async reply(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { documentId } = ctx.params;
        const { adminReply } = ctx.request.body;
        if (!adminReply) {
            ctx.throw(400, 'Reply message required');
            return;
        }
        try {
            const entry = await strapi.documents('api::artist-message.artist-message').update({
                documentId,
                data: {
                    adminReply,
                    repliedAt: new Date().toISOString(),
                    status: 'replied',
                },
            });
            ctx.body = { data: { documentId: entry.documentId, status: entry.status } };
        }
        catch (err) {
            ctx.throw(500, err.message);
        }
    },
    // PUT /artist-messages/:documentId/status - Changer le status
    async updateStatus(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { documentId } = ctx.params;
        const { status } = ctx.request.body;
        try {
            await strapi.documents('api::artist-message.artist-message').update({
                documentId,
                data: { status },
            });
            ctx.body = { data: { success: true } };
        }
        catch (err) {
            ctx.throw(500, err.message);
        }
    },
    // DELETE /artist-messages/:documentId - Supprimer un message
    async deleteMessage(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { documentId } = ctx.params;
        try {
            await strapi.documents('api::artist-message.artist-message').delete({ documentId });
            ctx.body = { data: { success: true } };
        }
        catch (err) {
            ctx.throw(500, err.message);
        }
    },
}));
