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
      }),
      strapi.documents('api::client.client').findMany({ filters }),
    ]);

    const total = allFiltered.length;
    ctx.body = {
      data: items,
      meta: { page, pageSize, total, pageCount: Math.ceil(total / pageSize) },
    };
  },
}));
