import { factories } from '@strapi/strapi';
import { sendNewUserNotificationEmail } from '../../../utils/email';

// Statuts de commande qui comptent comme "paye reellement"
const PAID_STATUSES = ['paid', 'processing', 'shipped', 'delivered'];

/**
 * Reconcilie les clients avec les commandes reellement payees.
 * Auto-cree les clients manquants, met a jour orderCount/totalSpent/lastOrderDate
 * a partir des vraies commandes (evite les desyncs si un webhook a foire).
 */
async function reconcileClientsFromOrders(strapi: any) {
  try {
    const orders = await strapi.documents('api::order.order').findMany({
      filters: { status: { $in: PAID_STATUSES } } as any,
      limit: 10000,
    });
    // Grouper par email
    const byEmail = new Map<string, { email: string; name: string; phone: string; totalSpent: number; orderCount: number; lastOrderDate: string | null; supabaseUserId: string }>();
    for (const o of orders as any[]) {
      const email = (o.customerEmail || '').toLowerCase();
      if (!email) continue;
      const total = (o.total || 0) / 100; // stocke en cents
      const prev = byEmail.get(email);
      const createdAt = o.createdAt || null;
      if (prev) {
        prev.totalSpent += total;
        prev.orderCount += 1;
        if (createdAt && (!prev.lastOrderDate || new Date(createdAt) > new Date(prev.lastOrderDate))) {
          prev.lastOrderDate = createdAt;
        }
        if (!prev.name && o.customerName) prev.name = o.customerName;
        if (!prev.phone && o.customerPhone) prev.phone = o.customerPhone;
        if (!prev.supabaseUserId && o.supabaseUserId) prev.supabaseUserId = o.supabaseUserId;
      } else {
        byEmail.set(email, {
          email,
          name: o.customerName || '',
          phone: o.customerPhone || '',
          totalSpent: total,
          orderCount: 1,
          lastOrderDate: createdAt,
          supabaseUserId: o.supabaseUserId || '',
        });
      }
    }
    // Upsert dans clients
    const existingClients = await strapi.documents('api::client.client').findMany({ limit: 10000 });
    const existingMap = new Map<string, any>();
    for (const c of existingClients as any[]) {
      if (c.email) existingMap.set(c.email.toLowerCase(), c);
    }
    for (const [email, stats] of byEmail) {
      const existing = existingMap.get(email);
      const roundedTotal = Math.round(stats.totalSpent * 100) / 100;
      if (existing) {
        // Update seulement si desync
        const needsUpdate =
          (existing.orderCount || 0) !== stats.orderCount ||
          Math.abs((parseFloat(existing.totalSpent) || 0) - roundedTotal) > 0.01 ||
          existing.lastOrderDate !== stats.lastOrderDate;
        if (needsUpdate) {
          await strapi.documents('api::client.client').update({
            documentId: existing.documentId,
            data: {
              orderCount: stats.orderCount,
              totalSpent: roundedTotal,
              lastOrderDate: stats.lastOrderDate,
              ...(stats.name && !existing.name ? { name: stats.name } : {}),
              ...(stats.phone && !existing.phone ? { phone: stats.phone } : {}),
              ...(stats.supabaseUserId && !existing.supabaseUserId ? { supabaseUserId: stats.supabaseUserId } : {}),
            } as any,
          });
        }
      } else {
        // Auto-creer le client manquant
        await strapi.documents('api::client.client').create({
          data: {
            email,
            name: stats.name || email.split('@')[0],
            phone: stats.phone,
            supabaseUserId: stats.supabaseUserId,
            orderCount: stats.orderCount,
            totalSpent: roundedTotal,
            lastOrderDate: stats.lastOrderDate,
          } as any,
        });
      }
    }
  } catch (err) {
    strapi.log.warn('reconcileClientsFromOrders failed:', err);
  }
}

export default factories.createCoreController('api::client.client', ({ strapi }) => ({

  async findAll(ctx) {
    // Auto-reconcile avec les vraies commandes avant de retourner (auto-cree les clients manquants, corrige les desyncs)
    await reconcileClientsFromOrders(strapi);
    const sort = ((ctx.query.sort as string) || 'createdAt:desc') as any;
    const pageSize = parseInt((ctx.query as any)?.pagination?.pageSize || '100');
    const clients = await strapi.documents('api::client.client').findMany({ sort, limit: pageSize });
    ctx.body = { data: clients };
  },

  async updateOne(ctx) {
    const { documentId } = ctx.params;
    const { data } = ctx.request.body as any;
    if (!data) return ctx.badRequest('data is required');
    const client = await strapi.documents('api::client.client').update({ documentId, data });
    ctx.body = { data: client };
  },

  async deleteOne(ctx) {
    const { documentId } = ctx.params;
    await strapi.documents('api::client.client').delete({ documentId });
    ctx.body = { success: true };
  },

  async adminList(ctx) {
    // Auto-reconcile avec les vraies commandes avant de retourner
    await reconcileClientsFromOrders(strapi);

    const page = parseInt(ctx.query.page as string) || 1;
    const pageSize = parseInt(ctx.query.pageSize as string) || 25;
    const search = ctx.query.search as string;
    const sort = (ctx.query.sort as string) || 'lastOrderDate:desc';

    const filters: any = {};
    if (search) {
      filters.$or = [
        { name: { $containsi: search } },
        { email: { $containsi: search } },
        { company: { $containsi: search } },
      ];
    }

    const [items, allFiltered] = await Promise.all([
      strapi.documents('api::client.client').findMany({
        filters,
        sort: sort as any,
        limit: pageSize,
        start: (page - 1) * pageSize,
        populate: ['orders'] as any,
      }),
      strapi.documents('api::client.client').findMany({ filters } as any),
    ]);

    // Enrichir chaque client avec l'adresse du dernier order
    const enriched = items.map((c: any) => {
      const lastOrder = c.orders?.[0];
      return {
        ...c,
        lastShippingAddress: lastOrder?.shippingAddress || null,
        lastCustomerPhone: lastOrder?.customerPhone || c.phone || null,
        orders: undefined, // ne pas envoyer le raw orders au frontend
      };
    });

    const total = allFiltered.length;
    ctx.body = {
      data: enriched,
      meta: { page, pageSize, total, pageCount: Math.ceil(total / pageSize) },
    };
  },

  // Liste les utilisateurs inscrits via Supabase Auth
  async listSupabaseUsers(ctx) {
    const supabaseUrl = process.env.SUPABASE_API_URL;
    const supabaseKey = process.env.SUPABASE_API_KEY; // service_role key
    if (!supabaseUrl || !supabaseKey) {
      ctx.status = 500;
      ctx.body = { error: 'Supabase non configure' };
      return;
    }

    const page = parseInt(ctx.query.page as string) || 1;
    const perPage = parseInt(ctx.query.perPage as string) || 50;

    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
      });
      if (!res.ok) {
        ctx.status = res.status;
        ctx.body = { error: 'Erreur Supabase Auth' };
        return;
      }
      const data: any = await res.json();
      const users = (data.users || data || []).map((u: any) => {
        const meta = u.user_metadata || {};
        const profileAddress = meta.address ? {
          address: meta.address,
          city: meta.city || '',
          province: meta.province || '',
          postalCode: meta.postal_code || '',
          country: meta.country || '',
        } : null;
        return {
          id: u.id,
          email: u.email,
          fullName: meta.full_name || meta.name || null,
          phone: u.phone || meta.phone || null,
          createdAt: u.created_at,
          lastSignIn: u.last_sign_in_at,
          emailConfirmed: !!u.email_confirmed_at,
          provider: u.app_metadata?.provider || 'email',
          referredBy: meta.referred_by || null,
          contractSigned: meta.contractSigned || false,
          contractSignedAt: meta.contractSignedAt || null,
          contractVersion: meta.contractVersion || null,
          nomArtiste: meta.nomArtiste || null,
          profileAddress,
        };
      });
      ctx.body = {
        data: users,
        meta: { page, perPage, total: (data as any).total || users.length },
      };
    } catch (err) {
      strapi.log.error('Supabase users fetch error:', err);
      ctx.status = 500;
      ctx.body = { error: 'Impossible de recuperer les utilisateurs' };
    }
  },

  // Notification de nouvelle inscription + linking auto des guest orders
  async notifySignup(ctx) {
    const { name, email, provider, supabaseUserId } = ctx.request.body as any;
    if (!email) {
      ctx.status = 400;
      ctx.body = { error: 'Email requis' };
      return;
    }

    sendNewUserNotificationEmail(name || '', email, provider || 'email').catch(err => {
      strapi.log.warn('Email notification inscription non envoye:', err);
    });

    // Linker les guest orders avec cet email au nouveau supabaseUserId
    let linkedCount = 0;
    if (supabaseUserId) {
      try {
        const orders = await strapi.documents('api::order.order').findMany({
          filters: {
            customerEmail: email.toLowerCase(),
            $or: [
              { supabaseUserId: '' as any },
              { supabaseUserId: { $null: true } as any },
            ],
          } as any,
        });
        for (const order of orders) {
          await strapi.documents('api::order.order').update({
            documentId: order.documentId,
            data: { supabaseUserId } as any,
          });
          linkedCount++;
        }
        // Aussi update le client record
        const clients = await strapi.documents('api::client.client').findMany({
          filters: { email: email.toLowerCase() },
        });
        for (const client of clients) {
          if (!client.supabaseUserId || client.supabaseUserId === '') {
            await strapi.documents('api::client.client').update({
              documentId: client.documentId,
              data: { supabaseUserId } as any,
            });
          }
        }
        if (linkedCount > 0) {
          strapi.log.info(`Auto-linked ${linkedCount} guest orders to new user ${supabaseUserId} (${email})`);
        }
      } catch (linkErr) {
        strapi.log.warn('Erreur linking guest orders:', linkErr);
      }
    }

    ctx.body = { success: true, linkedCount };
  },

  // Supprimer un utilisateur Supabase
  async deleteSupabaseUser(ctx) {
    const supabaseUrl = process.env.SUPABASE_API_URL;
    const supabaseKey = process.env.SUPABASE_API_KEY;
    if (!supabaseUrl || !supabaseKey) {
      ctx.status = 500;
      ctx.body = { error: 'Supabase non configure' };
      return;
    }

    const { id } = ctx.params;
    if (!id) {
      ctx.status = 400;
      ctx.body = { error: 'User ID requis' };
      return;
    }

    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
      });
      if (!res.ok) {
        ctx.status = res.status;
        ctx.body = { error: 'Erreur suppression utilisateur' };
        return;
      }
      ctx.body = { success: true };
    } catch (err) {
      strapi.log.error('Supabase user delete error:', err);
      ctx.status = 500;
      ctx.body = { error: 'Impossible de supprimer l\'utilisateur' };
    }
  },
}));
