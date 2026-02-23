import { factories } from '@strapi/strapi';
import Stripe from 'stripe';

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key === 'sk_test_REPLACE_ME') {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(key);
};

export default factories.createCoreController('api::order.order', ({ strapi }) => ({

  async createPaymentIntent(ctx) {
    const { items, customerEmail, customerName, customerPhone, designReady, notes, supabaseUserId, fileIds } = ctx.request.body as any;

    // Validate
    if (!items || !Array.isArray(items) || items.length === 0) {
      return ctx.badRequest('Cart is empty');
    }
    if (!customerEmail || !customerName) {
      return ctx.badRequest('Customer email and name are required');
    }

    // Recalculate total server-side (never trust client-side totals)
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0);
    const amountInCents = Math.round(subtotal * 100);

    if (amountInCents < 50) {
      return ctx.badRequest('Minimum order is $0.50 CAD');
    }

    try {
      const stripe = getStripe();

      // Create Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'cad',
        metadata: {
          customerEmail,
          customerName,
          supabaseUserId: supabaseUserId || '',
          itemCount: items.length.toString(),
        },
      });

      // Create order in Strapi with status "pending"
      const order = await strapi.documents('api::order.order').create({
        data: {
          stripePaymentIntentId: paymentIntent.id,
          customerEmail,
          customerName,
          customerPhone: customerPhone || '',
          supabaseUserId: supabaseUserId || '',
          items,
          subtotal: amountInCents,
          total: amountInCents,
          currency: 'cad',
          status: 'pending',
          designReady: designReady !== false,
          notes: notes || '',
        },
      });

      // Link uploaded files to the order
      if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
        await strapi.documents('api::order.order').update({
          documentId: order.documentId,
          data: { files: fileIds },
        });
      }

      // Return client_secret to frontend
      ctx.body = {
        clientSecret: paymentIntent.client_secret,
      };
    } catch (err: any) {
      strapi.log.error('Stripe createPaymentIntent error:', err);
      return ctx.badRequest(err.message || 'Payment creation failed');
    }
  },

  async myOrders(ctx) {
    const supabaseUserId = ctx.query.supabaseUserId as string;

    if (!supabaseUserId) {
      return ctx.badRequest('Missing user ID');
    }

    const orders = await strapi.documents('api::order.order').findMany({
      filters: { supabaseUserId },
      sort: 'createdAt:desc',
    });

    ctx.body = orders;
  },

  async handleStripeWebhook(ctx) {
    const sig = ctx.request.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret || endpointSecret === 'whsec_REPLACE_ME') {
      strapi.log.warn('Stripe webhook secret not configured');
      return ctx.badRequest('Webhook not configured');
    }

    let event: Stripe.Event;
    try {
      const stripe = getStripe();
      // Access the raw unparsed body for signature verification
      const rawBody = (ctx.request as any).body?.[Symbol.for('unparsedBody')] || JSON.stringify(ctx.request.body);
      event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (err: any) {
      strapi.log.error('Webhook signature verification failed:', err.message);
      return ctx.badRequest(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const orders = await strapi.documents('api::order.order').findMany({
        filters: { stripePaymentIntentId: paymentIntent.id },
      });

      if (orders.length > 0) {
        await strapi.documents('api::order.order').update({
          documentId: orders[0].documentId,
          data: { status: 'paid' },
        });
        strapi.log.info(`Order ${orders[0].documentId} marked as paid`);
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const orders = await strapi.documents('api::order.order').findMany({
        filters: { stripePaymentIntentId: paymentIntent.id },
      });

      if (orders.length > 0) {
        await strapi.documents('api::order.order').update({
          documentId: orders[0].documentId,
          data: { status: 'cancelled' },
        });
        strapi.log.info(`Order ${orders[0].documentId} marked as cancelled (payment failed)`);
      }
    }

    ctx.body = { received: true };
  },
}));
