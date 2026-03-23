"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreController('api::artist-payment.artist-payment', ({ strapi }) => ({
    async listPayments(ctx) {
        const artistSlug = ctx.query.artistSlug;
        const filters = {};
        if (artistSlug)
            filters.artistSlug = artistSlug;
        const items = await strapi.documents('api::artist-payment.artist-payment').findMany({
            filters,
            sort: 'date:desc',
        });
        ctx.body = { data: items };
    },
    async createPayment(ctx) {
        const { artistSlug, artistName, amount, method, date, period, notes } = ctx.request.body;
        if (!artistSlug || !artistName || !amount || !date) {
            return ctx.badRequest('artistSlug, artistName, amount et date sont requis');
        }
        const validMethods = ['interac', 'cash', 'cheque', 'other'];
        if (method && !validMethods.includes(method)) {
            return ctx.badRequest('Methode de paiement invalide');
        }
        const payment = await strapi.documents('api::artist-payment.artist-payment').create({
            data: {
                artistSlug,
                artistName,
                amount: parseFloat(amount),
                method: method || 'interac',
                date,
                period: period || '',
                notes: notes || '',
            },
        });
        ctx.body = { data: payment };
    },
}));
