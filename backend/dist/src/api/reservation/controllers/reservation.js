"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
const email_1 = require("../../../utils/email");
const auth_1 = require("../../../utils/auth");
exports.default = strapi_1.factories.createCoreController('api::reservation.reservation', ({ strapi }) => ({
    // submit reste public (formulaire client)
    async submit(ctx) {
        const { tatoueurDocumentId, flashDocumentId, clientName, clientEmail, clientPhone, placement, size, messageDuClient, requestedDate, budget, supabaseUserId, } = ctx.request.body;
        if (!clientName || !clientEmail || !tatoueurDocumentId) {
            return ctx.badRequest('clientName, clientEmail et tatoueurDocumentId sont requis');
        }
        // Recuperer le tatoueur pour avoir son email et nom
        const tatoueur = await strapi.documents('api::tatoueur.tatoueur').findFirst({
            filters: { documentId: tatoueurDocumentId },
        });
        if (!tatoueur) {
            return ctx.notFound('Tatoueur introuvable');
        }
        // Recuperer le flash si fourni
        let flash = null;
        if (flashDocumentId) {
            flash = await strapi.documents('api::flash.flash').findFirst({
                filters: { documentId: flashDocumentId },
            });
        }
        try {
            const reservationData = {
                clientName,
                clientEmail,
                clientPhone: clientPhone || '',
                placement: placement || '',
                size: size || '',
                messageDuClient: messageDuClient || '',
                requestedDate: requestedDate || null,
                budget: budget || '',
                status: 'demandee',
                supabaseUserId: supabaseUserId || '',
                tatoueur: tatoueur.id,
            };
            if (flash) {
                reservationData.flash = flash.id;
            }
            const reservation = await strapi.documents('api::reservation.reservation').create({
                data: reservationData,
            });
            // Envoyer email au tatoueur (async, sans bloquer la reponse)
            if (tatoueur.email) {
                (0, email_1.sendReservationNotificationEmail)({
                    tatoueurName: tatoueur.name,
                    tatoueurEmail: tatoueur.email,
                    clientName,
                    clientEmail,
                    flashTitle: (flash === null || flash === void 0 ? void 0 : flash.title) || (flash === null || flash === void 0 ? void 0 : flash.titleFr) || 'Flash personnalise',
                    messageDuClient,
                    requestedDate,
                    placement,
                    size,
                    budget,
                }).catch(err => {
                    strapi.log.warn('Email notification reservation non envoye:', err);
                });
            }
            ctx.body = { success: true, data: reservation };
        }
        catch (err) {
            strapi.log.error('Reservation submit error:', err);
            return ctx.badRequest('Erreur lors de la creation de la reservation');
        }
    },
    async updateStatus(ctx) {
        var _a, _b, _c;
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { documentId } = ctx.params;
        const { status: newStatus, notes, confirmedDate } = ctx.request.body;
        const validStatuses = ['demandee', 'confirmee', 'planifiee', 'realisee', 'annulee'];
        if (!newStatus || !validStatuses.includes(newStatus)) {
            return ctx.badRequest('Status invalide. Valeurs acceptees: ' + validStatuses.join(', '));
        }
        const reservation = await strapi.documents('api::reservation.reservation').findFirst({
            filters: { documentId },
            populate: ['tatoueur', 'flash'],
        });
        if (!reservation) {
            return ctx.notFound('Reservation introuvable');
        }
        const updateData = { status: newStatus };
        if (notes !== undefined)
            updateData.notes = notes;
        if (confirmedDate)
            updateData.confirmedDate = confirmedDate;
        const updated = await strapi.documents('api::reservation.reservation').update({
            documentId: reservation.documentId,
            data: updateData,
        });
        // Si confirmee ou annulee, notifier le client par email
        if (newStatus === 'confirmee' || newStatus === 'annulee') {
            const tatoueurName = ((_a = reservation.tatoueur) === null || _a === void 0 ? void 0 : _a.name) || 'Le tatoueur';
            const flashTitle = ((_b = reservation.flash) === null || _b === void 0 ? void 0 : _b.title) || ((_c = reservation.flash) === null || _c === void 0 ? void 0 : _c.titleFr) || 'votre flash';
            const statusLabel = newStatus === 'confirmee' ? 'confirmee' : 'annulee';
            // On utilise sendTattooMessageEmail en mode notification simple
            const { sendTattooMessageEmail } = require('../../../utils/email');
            sendTattooMessageEmail({
                recipientName: reservation.clientName,
                recipientEmail: reservation.clientEmail,
                senderName: tatoueurName,
                senderType: 'tatoueur',
                messageContent: newStatus === 'confirmee'
                    ? `Ta reservation pour le flash "${flashTitle}" a ete confirmee ! ${tatoueurName} va te contacter pour fixer les details.`
                    : `Ta reservation pour le flash "${flashTitle}" a ete annulee par ${tatoueurName}. N'hesite pas a le recontacter pour plus d'infos.`,
                flashTitle,
                dashboardUrl: 'https://massivemedias.com/tatoueur/dashboard?tab=reservations',
                ctaLabel: 'Voir le message',
            }).catch((err) => {
                strapi.log.warn('Email notification status reservation non envoye:', err);
            });
        }
        strapi.log.info(`Reservation ${documentId} status -> ${newStatus}`);
        ctx.body = { success: true, data: updated };
    },
}));
