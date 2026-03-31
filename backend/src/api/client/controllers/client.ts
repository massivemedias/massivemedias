import { factories } from '@strapi/strapi';
import { sendNewUserNotificationEmail } from '../../../utils/email';

export default factories.createCoreController('api::client.client', ({ strapi }) => ({

  async findAll(ctx) {
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
        populate: { orders: { sort: 'createdAt:desc', limit: 1 } } as any,
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

  // Notification de nouvelle inscription
  async notifySignup(ctx) {
    const { name, email, provider } = ctx.request.body as any;
    if (!email) {
      ctx.status = 400;
      ctx.body = { error: 'Email requis' };
      return;
    }

    sendNewUserNotificationEmail(name || '', email, provider || 'email').catch(err => {
      strapi.log.warn('Email notification inscription non envoye:', err);
    });

    ctx.body = { success: true };
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
