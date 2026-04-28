"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
const email_1 = require("../../../utils/email");
const auth_1 = require("../../../utils/auth");
exports.default = strapi_1.factories.createCoreController('api::contact-submission.contact-submission', ({ strapi }) => ({
    async adminList(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const page = parseInt(ctx.query.page) || 1;
        const pageSize = parseInt(ctx.query.pageSize) || 25;
        const status = ctx.query.status;
        const search = ctx.query.search;
        const filters = {};
        if (status && status !== 'all')
            filters.status = status;
        if (search) {
            filters.$or = [
                { nom: { $containsi: search } },
                { email: { $containsi: search } },
                { entreprise: { $containsi: search } },
            ];
        }
        const [items, allFiltered] = await Promise.all([
            strapi.documents('api::contact-submission.contact-submission').findMany({
                filters,
                sort: 'createdAt:desc',
                limit: pageSize,
                start: (page - 1) * pageSize,
            }),
            strapi.documents('api::contact-submission.contact-submission').findMany({ filters }),
        ]);
        const total = allFiltered.length;
        ctx.body = {
            data: items,
            meta: { page, pageSize, total, pageCount: Math.ceil(total / pageSize) },
        };
    },
    async updateStatus(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { documentId } = ctx.params;
        const { status: newStatus, notes } = ctx.request.body;
        const validStatuses = ['new', 'read', 'replied', 'archived'];
        if (newStatus && !validStatuses.includes(newStatus)) {
            return ctx.badRequest('Status invalide');
        }
        const item = await strapi.documents('api::contact-submission.contact-submission').findFirst({
            filters: { documentId },
        });
        if (!item)
            return ctx.notFound('Message introuvable');
        const updateData = {};
        if (newStatus)
            updateData.status = newStatus;
        if (notes !== undefined)
            updateData.notes = notes;
        const updated = await strapi.documents('api::contact-submission.contact-submission').update({
            documentId: item.documentId,
            data: updateData,
        });
        ctx.body = { data: updated };
    },
    async reply(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { documentId } = ctx.params;
        const { replyMessage, subject } = ctx.request.body;
        if (!replyMessage) {
            return ctx.badRequest('Le message de reponse est requis');
        }
        const item = await strapi.documents('api::contact-submission.contact-submission').findFirst({
            filters: { documentId },
        });
        if (!item)
            return ctx.notFound('Message introuvable');
        // Envoyer l'email
        const sent = await (0, email_1.sendContactReplyEmail)({
            customerName: item.nom,
            customerEmail: item.email,
            originalMessage: item.message,
            replyMessage,
            subject,
        });
        if (!sent) {
            return ctx.badRequest('Erreur lors de l\'envoi de l\'email');
        }
        // Marquer comme repondu et sauvegarder la reponse dans les notes
        const existingNotes = item.notes || '';
        const timestamp = new Date().toLocaleString('fr-CA');
        const updatedNotes = `${existingNotes}${existingNotes ? '\n---\n' : ''}[Reponse ${timestamp}]\n${replyMessage}`;
        await strapi.documents('api::contact-submission.contact-submission').update({
            documentId: item.documentId,
            data: { status: 'replied', notes: updatedNotes },
        });
        strapi.log.info(`Reponse contact envoyee a ${item.email}`);
        ctx.body = { success: true, notes: updatedNotes };
    },
    async deleteSubmission(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { documentId } = ctx.params;
        const item = await strapi.documents('api::contact-submission.contact-submission').findFirst({
            filters: { documentId },
        });
        if (!item)
            return ctx.notFound('Message introuvable');
        await strapi.documents('api::contact-submission.contact-submission').delete({
            documentId: item.documentId,
        });
        strapi.log.info(`Message contact supprime: ${documentId}`);
        ctx.body = { success: true };
    },
    async submit(ctx) {
        // FIX-PREMIUM-FORM (28 avril 2026) : ajout du champ fileLink (lien Drive/
        // WeTransfer/Dropbox) collecte dans le formulaire de qualification premium.
        const { nom, email, telephone, entreprise, service, budget, urgence, message, fileLink, website } = ctx.request.body;
        // Anti-spam honeypot: si le champ "website" est rempli, c'est un bot
        if (website) {
            ctx.body = { success: true, id: 'ok' }; // fake success
            return;
        }
        if (!nom || !email || !message) {
            return ctx.badRequest('Name, email and message are required');
        }
        // Anti-spam: bloquer les messages avec liens suspects
        const spamPatterns = [/turbojot/i, /sign up for free/i, /give it a try/i, /\$[\d.]+ per submission/i];
        if (spamPatterns.some(p => p.test(message))) {
            ctx.body = { success: true, id: 'ok' }; // fake success
            return;
        }
        // Validation legere du fileLink : si fourni, doit ressembler a une URL.
        // Tolerance pour les variantes (avec ou sans https://, www., etc.) - on
        // ne veut pas rejeter un lien legitime juste a cause du formatage. Si
        // vraiment inutilisable (ex: text non-URL), on stocke quand meme - l'admin
        // peut le voir et le corriger.
        const cleanFileLink = typeof fileLink === 'string' ? fileLink.trim().slice(0, 500) : '';
        try {
            const submission = await strapi.documents('api::contact-submission.contact-submission').create({
                data: {
                    nom,
                    email,
                    telephone: telephone || '',
                    entreprise: entreprise || '',
                    service: service || '',
                    budget: budget || '',
                    urgence: urgence || '',
                    message,
                    fileLink: cleanFileLink,
                    status: 'new',
                },
            });
            // Notifier l'admin par email (avec le nouveau champ fileLink inclus)
            (0, email_1.sendNewContactNotificationEmail)({
                nom, email, telephone, entreprise, service, budget, urgence, message,
                fileLink: cleanFileLink,
            }).catch(err => {
                strapi.log.warn('Email notification contact non envoye:', err);
            });
            // FIX-PREMIUM-FORM : auto-reply au prospect (accuse de reception
            // professionnel + delai 24-48h annonce). Fire-and-forget : si Resend
            // est down ou rate, le user a quand meme sa confirmation UI cote
            // frontend (status='success'). On log juste le warning serveur.
            (0, email_1.sendAutoReplyToProspect)(email, nom).catch(err => {
                strapi.log.warn('Auto-reply prospect non envoye:', err);
            });
            ctx.body = { success: true, id: submission.documentId };
        }
        catch (err) {
            strapi.log.error('Contact submission error:', err);
            return ctx.badRequest('Submission failed');
        }
    },
}));
