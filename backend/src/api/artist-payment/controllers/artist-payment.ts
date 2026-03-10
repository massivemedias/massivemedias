import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::artist-payment.artist-payment', ({ strapi }) => ({

  async listPayments(ctx) {
    const artistSlug = ctx.query.artistSlug as string;

    const filters: any = {};
    if (artistSlug) filters.artistSlug = artistSlug;

    const items = await strapi.documents('api::artist-payment.artist-payment').findMany({
      filters,
      sort: 'date:desc',
    });

    ctx.body = { data: items };
  },

  async createPayment(ctx) {
    const { artistSlug, artistName, amount, method, date, period, notes } = ctx.request.body as any;

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
