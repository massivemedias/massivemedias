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

      // Find or create Client record
      let client = null;
      try {
        const existingClients = await strapi.documents('api::client.client').findMany({
          filters: { email: customerEmail.toLowerCase() },
        });

        if (existingClients.length > 0) {
          client = existingClients[0];
        } else {
          client = await strapi.documents('api::client.client').create({
            data: {
              email: customerEmail.toLowerCase(),
              name: customerName,
              phone: customerPhone || '',
              supabaseUserId: supabaseUserId || '',
              totalSpent: 0,
              orderCount: 0,
            },
          });
        }
      } catch (err) {
        strapi.log.warn('Could not create/find client:', err);
      }

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
          ...(client ? { client: client.documentId } : {}),
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
        const order = orders[0];
        await strapi.documents('api::order.order').update({
          documentId: order.documentId,
          data: { status: 'paid' },
        });
        strapi.log.info(`Order ${order.documentId} marked as paid`);

        // Update client stats
        try {
          const clients = await strapi.documents('api::client.client').findMany({
            filters: { email: order.customerEmail.toLowerCase() },
          });
          if (clients.length > 0) {
            const client = clients[0];
            await strapi.documents('api::client.client').update({
              documentId: client.documentId,
              data: {
                totalSpent: (Number(client.totalSpent) || 0) + (order.total || 0) / 100,
                orderCount: (client.orderCount || 0) + 1,
                lastOrderDate: new Date().toISOString().split('T')[0],
              },
            });
          }
        } catch (err) {
          strapi.log.warn('Could not update client stats:', err);
        }
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

  async clients(ctx) {
    // Read from Client collection (CRM)
    const clients = await strapi.documents('api::client.client').findMany({
      sort: 'totalSpent:desc',
      populate: ['files'],
    });

    ctx.body = { clients, total: clients.length };
  },

  async stats(ctx) {
    // Fetch all non-cancelled orders
    const orders = await strapi.documents('api::order.order').findMany({
      filters: { status: { $ne: 'cancelled' } },
      sort: 'createdAt:desc',
    });

    // Fetch all expenses
    const expenses = await strapi.documents('api::expense.expense').findMany({
      sort: 'date:desc',
    });

    // Revenue calculations (order totals are in cents)
    const paidOrders = orders.filter((o: any) => o.status !== 'pending');
    const totalRevenue = paidOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);

    // Monthly revenue breakdown
    const monthlyRevenue: Record<string, { revenue: number; orders: number }> = {};
    for (const order of paidOrders) {
      const month = (order.createdAt as string).slice(0, 7); // "YYYY-MM"
      if (!monthlyRevenue[month]) {
        monthlyRevenue[month] = { revenue: 0, orders: 0 };
      }
      monthlyRevenue[month].revenue += order.total;
      monthlyRevenue[month].orders += 1;
    }

    // Expense calculations (amounts are in dollars)
    const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0);
    const totalTpsPaid = expenses.reduce((sum: number, e: any) => sum + (parseFloat(e.tpsAmount) || 0), 0);
    const totalTvqPaid = expenses.reduce((sum: number, e: any) => sum + (parseFloat(e.tvqAmount) || 0), 0);

    // Monthly expenses breakdown
    const monthlyExpenses: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};
    for (const expense of expenses) {
      const month = (expense.date as string).slice(0, 7);
      const amount = Number(expense.amount) || 0;
      monthlyExpenses[month] = (monthlyExpenses[month] || 0) + amount;
      expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + amount;
    }

    // Tax calculations (TPS 5%, TVQ 9.975% on revenue in dollars)
    const revenueInDollars = totalRevenue / 100;
    const tpsCollected = revenueInDollars * 0.05;
    const tvqCollected = revenueInDollars * 0.09975;

    // Order status breakdown
    const statusBreakdown: Record<string, number> = {};
    for (const order of orders) {
      statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
    }

    // Top clients
    const clientMap = new Map<string, { email: string; name: string; totalSpent: number; orderCount: number }>();
    for (const order of paidOrders) {
      const key = order.customerEmail.toLowerCase();
      if (clientMap.has(key)) {
        const c = clientMap.get(key)!;
        c.totalSpent += order.total;
        c.orderCount += 1;
      } else {
        clientMap.set(key, {
          email: order.customerEmail,
          name: order.customerName,
          totalSpent: order.total,
          orderCount: 1,
        });
      }
    }
    const topClients = Array.from(clientMap.values()).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);

    ctx.body = {
      revenue: {
        total: totalRevenue,
        totalDollars: revenueInDollars,
        monthly: Object.entries(monthlyRevenue)
          .map(([month, data]) => ({ month, ...data }))
          .sort((a, b) => a.month.localeCompare(b.month)),
      },
      expenses: {
        total: totalExpenses,
        monthly: Object.entries(monthlyExpenses)
          .map(([month, amount]) => ({ month, amount }))
          .sort((a, b) => a.month.localeCompare(b.month)),
        byCategory: expensesByCategory,
      },
      taxes: {
        tpsCollected: Math.round(tpsCollected * 100) / 100,
        tvqCollected: Math.round(tvqCollected * 100) / 100,
        tpsPaid: totalTpsPaid,
        tvqPaid: totalTvqPaid,
        tpsNet: Math.round((tpsCollected - totalTpsPaid) * 100) / 100,
        tvqNet: Math.round((tvqCollected - totalTvqPaid) * 100) / 100,
      },
      profit: {
        gross: Math.round((revenueInDollars - totalExpenses) * 100) / 100,
        net: Math.round((revenueInDollars - totalExpenses - (tpsCollected - totalTpsPaid) - (tvqCollected - totalTvqPaid)) * 100) / 100,
      },
      orderStats: {
        total: orders.length,
        byStatus: statusBreakdown,
        averageValue: paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0,
      },
      topClients,
    };
  },
}));
