import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::client.client', ({ strapi }) => ({

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
        sort,
        limit: pageSize,
        start: (page - 1) * pageSize,
        populate: { orders: { sort: 'createdAt:desc', limit: 1 } },
      }),
      strapi.documents('api::client.client').findMany({ filters }),
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
      const data = await res.json();
      const users = (data.users || data || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        fullName: u.user_metadata?.full_name || u.user_metadata?.name || null,
        phone: u.phone || null,
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at,
        emailConfirmed: !!u.email_confirmed_at,
        provider: u.app_metadata?.provider || 'email',
      }));
      ctx.body = {
        data: users,
        meta: { page, perPage, total: data.total || users.length },
      };
    } catch (err) {
      strapi.log.error('Supabase users fetch error:', err);
      ctx.status = 500;
      ctx.body = { error: 'Impossible de recuperer les utilisateurs' };
    }
  },
}));
