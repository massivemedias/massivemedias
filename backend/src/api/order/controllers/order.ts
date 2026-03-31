import { factories } from '@strapi/strapi';
import Stripe from 'stripe';
import { calculateShipping } from '../../../utils/shipping';
import { sendOrderConfirmationEmail, sendTestimonialRequestEmail, sendArtistSaleNotificationEmail, sendNewOrderNotificationEmail, sendTrackingEmail } from '../../../utils/email';
import crypto from 'crypto';

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key === 'sk_test_REPLACE_ME') {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(key);
};

// Sticker pricing tiers for server-side validation
const STICKER_STANDARD_TIERS: Record<number, number> = { 25: 30, 50: 47.50, 100: 85, 250: 200, 500: 375 };
const STICKER_FX_TIERS: Record<number, number> = { 25: 35, 50: 57.50, 100: 100, 250: 225, 500: 425 };
const FX_FINISHES = ['holographic', 'broken-glass', 'stars'];

export default factories.createCoreController('api::order.order', ({ strapi }) => ({

  async uploadFile(ctx) {
    const { request: { files } } = ctx as any;

    if (!files || !files.files) {
      return ctx.badRequest('No file provided');
    }

    const fileArray = Array.isArray(files.files) ? files.files : [files.files];
    const uploadedFiles = await strapi.plugin('upload').service('upload').upload({
      data: {},
      files: fileArray,
    });

    ctx.body = uploadedFiles;
  },

  async createPaymentIntent(ctx) {
    const { items, customerEmail, customerName, customerPhone, shippingAddress, shipping: clientShipping, taxes: clientTaxes, orderTotal: clientOrderTotal, promoCode, promoDiscountPercent, designReady, notes, supabaseUserId } = ctx.request.body as any;

    // Validate
    if (!items || !Array.isArray(items) || items.length === 0) {
      return ctx.badRequest('Cart is empty');
    }
    if (!customerEmail || !customerName) {
      return ctx.badRequest('Customer email and name are required');
    }

    // Recalculate total server-side (never trust client-side totals)
    let subtotal = 0;
    for (const item of items) {
      let validPrice = item.totalPrice || 0;
      // Validate sticker pricing against tiers
      if (item.productId === 'sticker-custom' || item.productId === 'sticker-artist') {
        const tiers = FX_FINISHES.includes(item.finish) ? STICKER_FX_TIERS : STICKER_STANDARD_TIERS;
        const tierPrice = tiers[item.quantity];
        if (tierPrice) {
          validPrice = tierPrice; // Override with server-validated price
        } else {
          strapi.log.warn(`Invalid sticker tier: qty=${item.quantity}, using client price ${item.totalPrice}`);
        }
      }
      subtotal += validPrice;
    }

    // Validate and apply promo code server-side (never trust client discount)
    const PROMO_CODES: Record<string, { discountPercent: number; label: string }> = {
      'MASSIVE6327': { discountPercent: 20, label: 'Promo Massive 20%' },
      'MASSIVE432': { discountPercent: 15, label: 'Promo Massive 15%' },
    };
    let promoDiscount = 0;
    let appliedPromoCode = '';
    if (promoCode && typeof promoCode === 'string') {
      const promo = PROMO_CODES[promoCode.toUpperCase().trim()];
      if (promo) {
        promoDiscount = Math.round(subtotal * promo.discountPercent / 100);
        appliedPromoCode = promoCode.toUpperCase().trim();
        subtotal = subtotal - promoDiscount;
      }
    }

    // Recalculate shipping server-side (par poids)
    const province = shippingAddress?.province || 'QC';
    const postalCode = shippingAddress?.postalCode || '';
    const { shippingCost, totalWeight } = calculateShipping(province, postalCode, items);

    // Recalculate taxes server-side (TPS 5% + TVQ 9.975% for QC)
    const tps = Math.round(subtotal * 0.05 * 100) / 100;
    const tvq = province === 'QC' ? Math.round(subtotal * 0.09975 * 100) / 100 : 0;
    const taxesTotal = Math.round((tps + tvq) * 100) / 100;

    const totalAmount = subtotal + shippingCost + taxesTotal;
    const amountInCents = Math.round(totalAmount * 100);

    if (amountInCents < 50) {
      return ctx.badRequest('Minimum order is $0.50 CAD');
    }

    try {
      const stripe = getStripe();

      // Resume lisible des items pour Stripe
      const itemsSummary = items.map((i: any) => {
        const parts = [i.productName || 'Produit'];
        if (i.size) parts.push(i.size);
        if (i.finish) parts.push(i.finish);
        if (i.quantity > 1) parts.push(`x${i.quantity}`);
        return parts.join(' - ');
      }).join(', ');

      const addrLine = shippingAddress
        ? `${shippingAddress.address || ''}, ${shippingAddress.city || ''}, ${shippingAddress.province || ''} ${shippingAddress.postalCode || ''}`
        : '';

      // Create Stripe PaymentIntent with automatic payment methods
      // (enables Apple Pay, Google Pay, PayPal, cards, etc.)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'cad',
        automatic_payment_methods: { enabled: true },
        description: `${customerName} - ${itemsSummary}`.slice(0, 1000),
        receipt_email: customerEmail,
        metadata: {
          customerName,
          customerEmail,
          customerPhone: customerPhone || '',
          items: itemsSummary.slice(0, 500),
          shippingAddress: addrLine.slice(0, 500),
          shippingProvince: province,
          shippingCity: shippingAddress?.city || '',
          subtotal: subtotal.toFixed(2),
          shipping: shippingCost.toFixed(2),
          tps: tps.toFixed(2),
          tvq: tvq.toFixed(2),
          totalWeight: totalWeight.toString(),
          itemCount: items.length.toString(),
          designReady: designReady !== false ? 'oui' : 'non',
          notes: (notes || '').slice(0, 500),
          supabaseUserId: supabaseUserId || '',
          promoCode: appliedPromoCode || '',
          promoDiscount: promoDiscount > 0 ? promoDiscount.toFixed(2) : '',
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

      // Build items with file URLs embedded
      const itemsWithFiles = items.map((item: any) => ({
        ...item,
        uploadedFiles: item.uploadedFiles || [],
      }));

      // Create order in Strapi with status "draft" (not yet paid)
      // Will be updated to "paid" by Stripe webhook when payment succeeds
      const orderData: any = {
        stripePaymentIntentId: paymentIntent.id,
        customerEmail,
        customerName,
        customerPhone: customerPhone || '',
        supabaseUserId: supabaseUserId || '',
        items: itemsWithFiles,
        subtotal: Math.round(subtotal * 100),
        shipping: Math.round(shippingCost * 100),
        tps: Math.round(tps * 100),
        tvq: Math.round(tvq * 100),
        totalWeight,
        total: amountInCents,
        currency: 'cad',
        status: 'draft',
        designReady: designReady !== false,
        notes: notes || '',
        shippingAddress: shippingAddress || null,
        promoCode: appliedPromoCode || null,
        promoDiscount: promoDiscount > 0 ? Math.round(promoDiscount * 100) : 0,
      };

      // Link client relation using Strapi v5 connect syntax
      if (client) {
        orderData.client = { connect: [{ documentId: client.documentId }] };
      }

      const order = await strapi.documents('api::order.order').create({
        data: orderData,
      });

      // Return client_secret to frontend
      ctx.body = {
        clientSecret: paymentIntent.client_secret,
      };
    } catch (err: any) {
      strapi.log.error('Stripe createPaymentIntent error:', err);
      return ctx.badRequest(err.message || 'Payment creation failed');
    }
  },

  async createCheckoutSession(ctx) {
    const { items, customerEmail, customerName, customerPhone, shippingAddress, promoCode, designReady, notes, supabaseUserId } = ctx.request.body as any;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return ctx.badRequest('Cart is empty');
    }
    if (!customerEmail || !customerName) {
      return ctx.badRequest('Customer email and name are required');
    }

    // Recalculate server-side with sticker tier validation
    let subtotal = 0;
    for (const item of items) {
      let validPrice = item.totalPrice || 0;
      if (item.productId === 'sticker-custom' || item.productId === 'sticker-artist') {
        const tiers = FX_FINISHES.includes(item.finish) ? STICKER_FX_TIERS : STICKER_STANDARD_TIERS;
        const tierPrice = tiers[item.quantity];
        if (tierPrice) validPrice = tierPrice;
      }
      subtotal += validPrice;
    }

    const PROMO_CODES: Record<string, { discountPercent: number; label: string }> = {
      'MASSIVE6327': { discountPercent: 20, label: 'Promo Massive 20%' },
      'MASSIVE432': { discountPercent: 15, label: 'Promo Massive 15%' },
    };
    let promoDiscount = 0;
    let appliedPromoCode = '';
    if (promoCode && typeof promoCode === 'string') {
      const promo = PROMO_CODES[promoCode.toUpperCase().trim()];
      if (promo) {
        promoDiscount = Math.round(subtotal * promo.discountPercent / 100);
        appliedPromoCode = promoCode.toUpperCase().trim();
        subtotal = subtotal - promoDiscount;
      }
    }

    const province = shippingAddress?.province || 'QC';
    const postalCode = shippingAddress?.postalCode || '';
    const { shippingCost, totalWeight } = calculateShipping(province, postalCode, items);

    const tps = Math.round(subtotal * 0.05 * 100) / 100;
    const tvq = province === 'QC' ? Math.round(subtotal * 0.09975 * 100) / 100 : 0;
    const taxesTotal = Math.round((tps + tvq) * 100) / 100;
    const totalAmount = subtotal + shippingCost + taxesTotal;
    const amountInCents = Math.round(totalAmount * 100);

    if (amountInCents < 50) {
      return ctx.badRequest('Minimum order is $0.50 CAD');
    }

    try {
      const stripe = getStripe();

      const itemsSummary = items.map((i: any) => {
        const parts = [i.productName || 'Produit'];
        if (i.size) parts.push(i.size);
        if (i.finish) parts.push(i.finish);
        if (i.quantity > 1) parts.push(`x${i.quantity}`);
        return parts.join(' - ');
      }).join(', ');

      const addrLine = shippingAddress
        ? `${shippingAddress.address || ''}, ${shippingAddress.city || ''}, ${shippingAddress.province || ''} ${shippingAddress.postalCode || ''}`
        : '';

      // Create Stripe Checkout Session (hosted payment page - works with ad blockers)
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: customerEmail,
        line_items: [{
          price_data: {
            currency: 'cad',
            product_data: {
              name: `Commande Massive - ${customerName}`,
              description: itemsSummary.slice(0, 500),
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        }],
        metadata: {
          customerName,
          customerEmail,
          customerPhone: customerPhone || '',
          items: itemsSummary.slice(0, 500),
          shippingAddress: addrLine.slice(0, 500),
          supabaseUserId: supabaseUserId || '',
          promoCode: appliedPromoCode || '',
        },
        success_url: `https://massivemedias.com/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://massivemedias.com/checkout/cancel`,
      });

      // Create order in Strapi with draft status (not yet paid)
      const itemsWithFiles = items.map((item: any) => ({
        ...item,
        uploadedFiles: item.uploadedFiles || [],
      }));

      let client = null;
      try {
        const existingClients = await strapi.documents('api::client.client').findMany({
          filters: { email: customerEmail.toLowerCase() },
        });
        client = existingClients.length > 0 ? existingClients[0] : await strapi.documents('api::client.client').create({
          data: { email: customerEmail.toLowerCase(), name: customerName, phone: customerPhone || '', supabaseUserId: supabaseUserId || '', totalSpent: 0, orderCount: 0 },
        });
      } catch (err) {
        strapi.log.warn('Could not create/find client:', err);
      }

      const orderData: any = {
        stripePaymentIntentId: session.payment_intent as string || session.id,
        customerEmail,
        customerName,
        customerPhone: customerPhone || '',
        supabaseUserId: supabaseUserId || '',
        items: itemsWithFiles,
        subtotal: Math.round(subtotal * 100),
        shipping: Math.round(shippingCost * 100),
        tps: Math.round(tps * 100),
        tvq: Math.round(tvq * 100),
        totalWeight,
        total: amountInCents,
        currency: 'cad',
        status: 'draft',
        designReady: designReady !== false,
        notes: notes || '',
        shippingAddress: shippingAddress || null,
        promoCode: appliedPromoCode || null,
        promoDiscount: promoDiscount > 0 ? Math.round(promoDiscount * 100) : 0,
      };
      if (client) {
        orderData.client = { connect: [{ documentId: client.documentId }] };
      }
      await strapi.documents('api::order.order').create({ data: orderData });

      ctx.body = { url: session.url };
    } catch (err: any) {
      strapi.log.error('Stripe createCheckoutSession error:', err);
      return ctx.badRequest(err.message || 'Checkout session creation failed');
    }
  },

  async myOrders(ctx) {
    const supabaseUserId = ctx.query.supabaseUserId as string;

    if (!supabaseUserId) {
      return ctx.badRequest('Missing user ID');
    }

    const orders = await strapi.documents('api::order.order').findMany({
      filters: { supabaseUserId, status: { $ne: 'draft' as any } },
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
      // Strapi v5 stores raw body via Symbol.for('unparsedBody') when includeUnparsed: true
      const unparsedBody = (ctx.request as any).body?.[Symbol.for('unparsedBody')];
      const koaRawBody = (ctx.request as any).rawBody;
      const rawBody = unparsedBody || koaRawBody || JSON.stringify(ctx.request.body);
      strapi.log.info(`Webhook received - sig: ${sig ? 'present' : 'missing'}, rawBody type: ${typeof rawBody}, length: ${rawBody?.length || 0}, source: ${unparsedBody ? 'unparsed' : koaRawBody ? 'koa' : 'json-stringify'}`);
      event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
      strapi.log.info(`Webhook verified OK - event type: ${event.type}`);
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
        const order = orders[0] as any;
        // Generer le numero de facture sequentiel MM-AAAA-XXXX
        let invoiceNumber = '';
        try {
          const now = new Date();
          const year = now.getFullYear();
          const prefix = `MM-${year}-`;
          const existingOrders = await strapi.documents('api::order.order').findMany({
            filters: { invoiceNumber: { $startsWith: prefix } },
            sort: { invoiceNumber: 'desc' },
            limit: 1,
          });
          let seq = 1;
          if (existingOrders.length > 0 && (existingOrders[0] as any).invoiceNumber) {
            const lastNum = (existingOrders[0] as any).invoiceNumber.replace(prefix, '');
            seq = (parseInt(lastNum, 10) || 0) + 1;
          }
          invoiceNumber = `${prefix}${String(seq).padStart(4, '0')}`;
        } catch (invoiceErr) {
          strapi.log.warn('Erreur generation numero facture:', invoiceErr);
          invoiceNumber = `MM-${new Date().getFullYear()}-0000`;
        }

        await strapi.documents('api::order.order').update({
          documentId: order.documentId,
          data: { status: 'paid', invoiceNumber },
        });
        strapi.log.info(`Order ${order.documentId} marked as paid (${invoiceNumber})`);

        // Envoyer email de confirmation
        try {
          const orderItems: any[] = Array.isArray(order.items) ? order.items : [];
          const orderRef = paymentIntent.id.slice(-8).toUpperCase();
          await sendOrderConfirmationEmail({
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            orderRef,
            invoiceNumber,
            items: orderItems.map((item: any) => ({
              productName: item.productName || 'Produit',
              quantity: item.quantity || 1,
              totalPrice: item.totalPrice || 0,
              size: item.size || '',
              finish: item.finish || '',
            })),
            subtotal: order.subtotal || 0,
            shipping: order.shipping || 0,
            tps: order.tps || 0,
            tvq: order.tvq || 0,
            total: order.total || 0,
            shippingAddress: order.shippingAddress || null,
            promoCode: order.promoCode || undefined,
            promoDiscount: order.promoDiscount || undefined,
            supabaseUserId: order.supabaseUserId || undefined,
          });
          strapi.log.info(`Email de confirmation envoye a ${order.customerEmail}`);
        } catch (emailErr) {
          strapi.log.warn('Erreur envoi email confirmation (non bloquant):', emailErr);
        }

        // Notifier l'admin de la nouvelle vente
        try {
          const orderItems2: any[] = Array.isArray(order.items) ? order.items : [];
          const orderRef2 = paymentIntent.id.slice(-8).toUpperCase();

          // Collecter tous les fichiers uploades de tous les items
          const allUploadedFiles: { name: string; url: string }[] = [];
          for (const item of orderItems2) {
            if (Array.isArray(item.uploadedFiles)) {
              for (const f of item.uploadedFiles) {
                if (f && (f.url || f.name)) {
                  allUploadedFiles.push({ name: f.name || f.url || 'Fichier', url: f.url || '' });
                }
              }
            }
          }

          await sendNewOrderNotificationEmail({
            orderRef: orderRef2,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            items: orderItems2.map((item: any) => ({
              productName: item.productName || 'Produit',
              quantity: item.quantity || 1,
              totalPrice: item.totalPrice || 0,
              size: item.size || '',
              finish: item.finish || '',
            })),
            subtotal: order.subtotal || 0,
            shipping: order.shipping || 0,
            tps: order.tps || 0,
            tvq: order.tvq || 0,
            total: order.total || 0,
            shippingAddress: order.shippingAddress || null,
            uploadedFiles: allUploadedFiles.length > 0 ? allUploadedFiles : undefined,
            notes: order.notes || undefined,
            designReady: order.designReady !== false,
            promoCode: order.promoCode || undefined,
            promoDiscount: order.promoDiscount || undefined,
          });
          strapi.log.info(`Notification vente admin envoyee pour commande ${orderRef2}`);
        } catch (adminEmailErr) {
          strapi.log.warn('Erreur envoi notification vente admin (non bloquant):', adminEmailErr);
        }

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

        // Decrement inventory stock for each item in the order
        try {
          const orderItems: any[] = Array.isArray(order.items) ? order.items : [];
          for (const item of orderItems) {
            const qty = item.quantity || 1;
            const sku = item.sku || item.slug;
            if (!sku) continue;

            const inventoryItems = await strapi.documents('api::inventory-item.inventory-item').findMany({
              filters: { sku, active: true },
            });

            if (inventoryItems.length > 0) {
              const inv = inventoryItems[0];
              const newQty = Math.max(0, (inv.quantity || 0) - qty);
              await strapi.documents('api::inventory-item.inventory-item').update({
                documentId: inv.documentId,
                data: { quantity: newQty },
              });
              strapi.log.info(`Inventory ${sku}: ${inv.quantity} -> ${newQty} (-${qty})`);
            }
          }
        } catch (err) {
          strapi.log.warn('Could not update inventory:', err);
        }

        // Notifier les artistes concernes par la vente
        try {
          const orderItems: any[] = Array.isArray(order.items) ? order.items : [];
          const artistItemsMap: Record<string, any[]> = {};

          // Charger tous les artistes actifs
          const artists = await strapi.documents('api::artist.artist').findMany({
            filters: { active: true },
          });
          const artistMap: Record<string, any> = {};
          for (const a of artists) {
            artistMap[a.slug] = a;
          }
          const slugs = Object.keys(artistMap);

          // Grouper les items par artiste
          for (const item of orderItems) {
            const pid = item.productId || '';
            if (!pid.startsWith('artist-print-')) continue;

            let matchedSlug: string | null = null;
            for (const slug of slugs) {
              if (pid.startsWith(`artist-print-${slug}-`)) {
                if (!matchedSlug || slug.length > matchedSlug.length) {
                  matchedSlug = slug;
                }
              }
            }
            if (!matchedSlug) continue;

            if (!artistItemsMap[matchedSlug]) artistItemsMap[matchedSlug] = [];
            artistItemsMap[matchedSlug].push({
              productName: item.productName || 'Oeuvre',
              size: item.size || '',
              finish: item.finish || '',
              quantity: item.quantity || 1,
            });
          }

          // Envoyer un email a chaque artiste concerne
          const shippingAddr = order.shippingAddress as any;
          const customerCity = shippingAddr?.city || '';

          for (const [slug, items] of Object.entries(artistItemsMap)) {
            const artist = artistMap[slug];
            if (!artist?.email) {
              strapi.log.info(`Artiste ${slug} n'a pas d'email configure, notification non envoyee`);
              continue;
            }
            sendArtistSaleNotificationEmail({
              artistName: artist.name,
              artistEmail: artist.email,
              items,
              orderDate: new Date().toISOString(),
              customerCity,
            }).catch(err => {
              strapi.log.warn(`Notification vente artiste ${slug} non envoyee:`, err);
            });
          }
        } catch (err) {
          strapi.log.warn('Could not notify artists:', err);
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

  // POST /orders/admin-create - Creer une commande manuellement (admin)
  async adminCreate(ctx) {
    const data = ctx.request.body as any;
    if (!data.customerName || !data.total) {
      return ctx.badRequest('customerName and total are required');
    }
    try {
      const order = await strapi.documents('api::order.order').create({ data });
      ctx.body = { success: true, data: order };
    } catch (err: any) {
      strapi.log.error('adminCreate error:', err);
      return ctx.badRequest(err.message);
    }
  },

  async clients(ctx) {
    // Read from Client collection (CRM)
    const clients = await strapi.documents('api::client.client').findMany({
      sort: 'totalSpent:desc',
      populate: ['files'],
    });

    ctx.body = { clients, total: clients.length };
  },

  async adminList(ctx) {
    const page = parseInt(ctx.query.page as string) || 1;
    const pageSize = parseInt(ctx.query.pageSize as string) || 25;
    const status = ctx.query.status as string;
    const search = ctx.query.search as string;

    const filters: any = {};
    if (status && status !== 'all') {
      filters.status = status;
    } else {
      // Exclude draft orders (payment not yet confirmed by Stripe webhook)
      filters.status = { $ne: 'draft' };
    }
    if (search) {
      filters.$or = [
        { customerName: { $containsi: search } },
        { customerEmail: { $containsi: search } },
        { stripePaymentIntentId: { $containsi: search } },
      ];
    }

    const [orders, allFiltered] = await Promise.all([
      strapi.documents('api::order.order').findMany({
        filters,
        sort: 'createdAt:desc',
        limit: pageSize,
        start: (page - 1) * pageSize,
        populate: ['client'],
      }),
      strapi.documents('api::order.order').findMany({
        filters,
      }),
    ]);

    const total = allFiltered.length;

    ctx.body = {
      data: orders,
      meta: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize),
      },
    };
  },

  async updateStatus(ctx) {
    const { documentId } = ctx.params;
    const { status: newStatus } = ctx.request.body as any;

    const validStatuses = ['draft', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!newStatus || !validStatuses.includes(newStatus)) {
      return ctx.badRequest(`Status invalide. Valeurs acceptees: ${validStatuses.join(', ')}`);
    }

    const order = await strapi.documents('api::order.order').findFirst({
      filters: { documentId },
    });

    if (!order) {
      return ctx.notFound('Commande introuvable');
    }

    const updated = await strapi.documents('api::order.order').update({
      documentId: order.documentId,
      data: { status: newStatus },
    });

    strapi.log.info(`Commande ${documentId} status: ${(order as any).status} -> ${newStatus}`);

    // Quand la commande est livree, envoyer un email de demande de temoignage
    if (newStatus === 'delivered' && (order as any).customerEmail) {
      try {
        const token = crypto.randomBytes(16).toString('hex');
        const customerName = (order as any).customerName || (order as any).customerEmail.split('@')[0];

        // Creer le temoignage en attente
        const testimonialData: any = {
          name: customerName,
          email: (order as any).customerEmail,
          textFr: '',
          token,
          approved: false,
          order: { connect: [order.documentId] },
        };

        // Lier au client si existant
        const client = await strapi.documents('api::client.client').findFirst({
          filters: { email: (order as any).customerEmail },
        });
        if (client) {
          testimonialData.client = { connect: [(client as any).documentId] };
        }

        await strapi.documents('api::testimonial.testimonial').create({ data: testimonialData });

        const siteUrl = process.env.SITE_URL || 'https://massivemedias.com';
        const link = `${siteUrl}/temoignage?token=${token}`;

        await sendTestimonialRequestEmail({
          customerName,
          customerEmail: (order as any).customerEmail,
          testimonialLink: link,
          orderRef: (order as any).orderRef,
        });

        strapi.log.info(`Email temoignage envoye a ${(order as any).customerEmail} pour commande ${documentId}`);
      } catch (err) {
        strapi.log.error('Erreur envoi email temoignage:', err);
        // Ne pas bloquer le changement de status si l'email echoue
      }
    }

    ctx.body = { data: updated };
  },

  async updateNotes(ctx) {
    const { documentId } = ctx.params;
    const { notes } = ctx.request.body as any;

    const order = await strapi.documents('api::order.order').findFirst({
      filters: { documentId },
    });

    if (!order) {
      return ctx.notFound('Commande introuvable');
    }

    const updated = await strapi.documents('api::order.order').update({
      documentId: order.documentId,
      data: { notes: notes || '' },
    });

    ctx.body = { data: updated };
  },

  async addTracking(ctx) {
    const { documentId } = ctx.params;
    const { trackingNumber, carrier } = ctx.request.body as any;

    if (!trackingNumber) {
      return ctx.badRequest('Numero de suivi requis');
    }

    const order = await strapi.documents('api::order.order').findFirst({
      filters: { documentId },
    });

    if (!order) {
      return ctx.notFound('Commande introuvable');
    }

    const updated = await strapi.documents('api::order.order').update({
      documentId: order.documentId,
      data: {
        trackingNumber,
        carrier: carrier || 'postes-canada',
        status: 'shipped',
      },
    });

    strapi.log.info(`Commande ${documentId} tracking: ${trackingNumber} (${carrier || 'postes-canada'})`);

    // Envoyer email de suivi au client
    if ((order as any).customerEmail) {
      try {
        await sendTrackingEmail({
          customerName: (order as any).customerName || 'Client',
          customerEmail: (order as any).customerEmail,
          orderRef: (order as any).orderRef || documentId.slice(0, 7).toUpperCase(),
          trackingNumber,
          carrier: carrier || 'postes-canada',
        });
      } catch (err) {
        strapi.log.error('Erreur envoi email suivi:', err);
      }
    }

    ctx.body = { data: updated };
  },

  async deleteOrder(ctx) {
    const { documentId } = ctx.params;

    const order = await strapi.documents('api::order.order').findFirst({
      filters: { documentId },
    });

    if (!order) {
      return ctx.notFound('Commande introuvable');
    }

    await strapi.documents('api::order.order').delete({
      documentId: order.documentId,
    });

    strapi.log.info(`Commande ${documentId} supprimee`);
    ctx.body = { success: true };
  },

  async commissions(ctx) {
    // 1. Fetch all active artists
    const artists = await strapi.documents('api::artist.artist').findMany({
      filters: { active: true },
    });
    const artistMap: Record<string, any> = {};
    for (const a of artists) {
      artistMap[a.slug] = a;
    }
    const slugs = Object.keys(artistMap);

    // 2. Fetch completed orders
    const validStatuses = ['paid', 'processing', 'shipped', 'delivered'] as const;
    const orders = await strapi.documents('api::order.order').findMany({
      filters: { status: { $in: validStatuses as any } },
      sort: 'createdAt:desc',
    });

    // Default production costs (fallback)
    const DEFAULT_COSTS: Record<string, any> = {
      studio: { a4: 12, a3: 16, a3plus: 20, a2: 28 },
      museum: { a4: 25, a3: 38, a3plus: 48, a2: 65 },
      frame: 8,
    };

    function getProductionCost(artist: any, item: any): number {
      const costs = artist.productionCosts || DEFAULT_COSTS;
      const tier = (item.finish || 'studio').toLowerCase().includes('museum') ? 'museum' : 'studio';
      const format = (item.size || 'a4').toLowerCase().replace(/[^a-z0-9]/g, '');
      const tierCosts = costs[tier] || DEFAULT_COSTS[tier];
      let cost = (tierCosts && tierCosts[format]) || 15;
      if (item.withFrame || (item.productName || '').toLowerCase().includes('cadre')) {
        cost += (costs.frame ?? DEFAULT_COSTS.frame);
      }
      return cost;
    }

    // 3. Parse items, match artist slugs, calculate commissions
    const commissionsByArtist: Record<string, any> = {};

    for (const order of orders) {
      const items: any[] = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        const pid = item.productId || '';
        if (!pid.startsWith('artist-print-')) continue;

        let matchedSlug: string | null = null;
        for (const slug of slugs) {
          if (pid.startsWith(`artist-print-${slug}-`)) {
            if (!matchedSlug || slug.length > matchedSlug.length) {
              matchedSlug = slug;
            }
          }
        }
        if (!matchedSlug) continue;

        const artist = artistMap[matchedSlug];
        const rate = parseFloat(artist.commissionRate) || 0.5;
        const salePrice = item.totalPrice || item.unitPrice || 0;
        const prodCost = getProductionCost(artist, item);
        const qty = item.quantity || 1;
        const totalSale = salePrice * qty;
        const totalProd = prodCost * qty;
        const netProfit = Math.max(0, totalSale - totalProd);
        const commission = Math.round(netProfit * rate * 100) / 100;

        if (!commissionsByArtist[matchedSlug]) {
          commissionsByArtist[matchedSlug] = {
            slug: matchedSlug,
            name: artist.name,
            rate,
            totalSales: 0,
            totalProduction: 0,
            totalNetProfit: 0,
            totalCommission: 0,
            totalPaid: 0,
            balance: 0,
            orders: [],
          };
        }

        const c = commissionsByArtist[matchedSlug];
        c.totalSales += totalSale;
        c.totalProduction += totalProd;
        c.totalNetProfit += netProfit;
        c.totalCommission += commission;
        c.orders.push({
          orderId: order.documentId,
          orderDate: order.createdAt,
          customerName: order.customerName,
          productId: pid,
          productName: item.productName || '',
          size: item.size || '',
          finish: item.finish || '',
          quantity: qty,
          salePrice: totalSale,
          productionCost: totalProd,
          netProfit,
          commission,
        });
      }
    }

    // 4. Fetch artist payments
    let payments: any[] = [];
    try {
      payments = await strapi.documents('api::artist-payment.artist-payment').findMany({
        sort: 'date:desc',
      });
    } catch {
      // content type might not exist yet
    }

    const paymentsByArtist: Record<string, any[]> = {};
    for (const p of payments) {
      const slug = p.artistSlug;
      if (!paymentsByArtist[slug]) paymentsByArtist[slug] = [];
      paymentsByArtist[slug].push(p);
      if (commissionsByArtist[slug]) {
        commissionsByArtist[slug].totalPaid += parseFloat(p.amount) || 0;
      }
    }

    // Round and calculate balance
    for (const slug of Object.keys(commissionsByArtist)) {
      const c = commissionsByArtist[slug];
      c.totalSales = Math.round(c.totalSales * 100) / 100;
      c.totalProduction = Math.round(c.totalProduction * 100) / 100;
      c.totalNetProfit = Math.round(c.totalNetProfit * 100) / 100;
      c.totalCommission = Math.round(c.totalCommission * 100) / 100;
      c.totalPaid = Math.round(c.totalPaid * 100) / 100;
      c.balance = Math.round((c.totalCommission - c.totalPaid) * 100) / 100;
      c.payments = paymentsByArtist[slug] || [];
    }

    ctx.body = {
      artists: Object.values(commissionsByArtist),
    };
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
