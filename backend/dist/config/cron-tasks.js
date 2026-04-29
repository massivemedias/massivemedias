"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Strapi cron tasks configuration.
 *
 * Active via `cron.enabled = true` dans config/server.ts. Chaque tache
 * recoit `{ strapi }` et tourne dans le contexte Strapi (acces aux
 * documents API, services, db, log, etc).
 *
 * MONEY RETRIEVER (Phase 7, 28 avril 2026) :
 *   - Tache `paymentReminder` : tous les jours a 9h00 Montreal, relance
 *     les commandes pending depuis > 4 jours dont la relance n'a pas
 *     encore ete envoyee. Un seul envoi par commande (flag
 *     paymentReminderSent flippe a true apres succes Resend).
 */
const email_1 = require("../src/utils/email");
const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;
exports.default = {
    /**
     * paymentReminder : relance amicale automatique sur les commandes pending.
     *
     * Schedule : 0 9 * * *  (tous les jours a 9h00 America/Toronto).
     * Pourquoi 9h ? On evite les push de nuit qui finissent en spam et on
     * frappe pile a l'arrivee au bureau du client - moment ou il regarde
     * sa boite et est en mode "decisions".
     *
     * Logique :
     *   1. SELECT orders WHERE status IN ('pending', 'draft')
     *      AND created_at < now - 4j AND (payment_reminder_sent != true).
     *   2. Pour chaque match : populate l'invoice liee pour recuperer
     *      stripePaymentLink + invoiceNumber.
     *   3. Skip si paymentLink absent (logue un warning admin).
     *   4. Sinon : sendPaymentReminderEmail() puis flip paymentReminderSent
     *      a true. Si l'email echoue, on n'updatera PAS le flag pour
     *      retenter au prochain cycle.
     *
     * Anti-spam : limite hard a 50 relances par execution (au cas ou un
     * batch enorme de commandes pending traine, on evite de saturer Resend
     * d'un coup et on se laisse plusieurs jours pour vider la file).
     */
    paymentReminder: {
        task: async ({ strapi }) => {
            const startedAt = Date.now();
            const cutoff = new Date(startedAt - FOUR_DAYS_MS);
            strapi.log.info(`[CRON][paymentReminder] Start - cutoff=${cutoff.toISOString()}`);
            try {
                const candidates = await strapi.documents('api::order.order').findMany({
                    filters: {
                        status: { $in: ['pending', 'draft'] },
                        createdAt: { $lt: cutoff.toISOString() },
                        $or: [
                            { paymentReminderSent: { $eq: false } },
                            { paymentReminderSent: { $null: true } },
                        ],
                    },
                    populate: ['invoice'],
                    limit: 50,
                });
                strapi.log.info(`[CRON][paymentReminder] ${candidates.length} candidate(s) to remind`);
                let sent = 0;
                let skipped = 0;
                let failed = 0;
                for (const order of candidates) {
                    const o = order;
                    const orderRef = (String(o.stripePaymentIntentId || '').slice(-8) ||
                        String(o.documentId || '').slice(-8)).toUpperCase();
                    const invoice = o.invoice;
                    const paymentLink = (invoice === null || invoice === void 0 ? void 0 : invoice.stripePaymentLink) || '';
                    if (!o.customerEmail) {
                        strapi.log.warn(`[CRON][paymentReminder] skip ${orderRef} - no customerEmail`);
                        skipped++;
                        continue;
                    }
                    if (!paymentLink) {
                        strapi.log.warn(`[CRON][paymentReminder] skip ${orderRef} - no Stripe payment link on invoice`);
                        skipped++;
                        continue;
                    }
                    // total est en centimes en DB - on convertit en dollars pour l'affichage email.
                    const totalDollars = (Number(o.total) || 0) / 100;
                    try {
                        const ok = await (0, email_1.sendPaymentReminderEmail)(o.customerEmail, o.customerName || '', orderRef, totalDollars, paymentLink);
                        if (!ok) {
                            strapi.log.warn(`[CRON][paymentReminder] sendPaymentReminderEmail returned false for ${orderRef}`);
                            failed++;
                            continue;
                        }
                        // Flip le flag UNIQUEMENT apres succes Resend - sinon on
                        // retentera au prochain cycle.
                        await strapi.documents('api::order.order').update({
                            documentId: o.documentId,
                            data: { paymentReminderSent: true },
                        });
                        console.log(`[CRON] Relance envoyee pour la commande ${orderRef}`);
                        sent++;
                    }
                    catch (err) {
                        failed++;
                        strapi.log.error(`[CRON][paymentReminder] echec envoi pour ${orderRef}: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
                    }
                }
                const elapsedMs = Date.now() - startedAt;
                strapi.log.info(`[CRON][paymentReminder] Done in ${elapsedMs}ms - sent=${sent} skipped=${skipped} failed=${failed}`);
            }
            catch (err) {
                strapi.log.error(`[CRON][paymentReminder] FATAL: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
            }
        },
        options: {
            // Tous les jours a 9h00 (heure Montreal, gere automatiquement EST/EDT).
            rule: '0 9 * * *',
            tz: 'America/Toronto',
        },
    },
};
