import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::admin-note.admin-note' as any, ({ strapi }) => ({

  async list(ctx) {
    const search = ctx.query.search as string;

    const filters: any = {};
    if (search) {
      filters.$or = [
        { title: { $containsi: search } },
        { body: { $containsi: search } },
      ];
    }

    const items = await (strapi.documents as any)('api::admin-note.admin-note').findMany({
      filters,
      sort: 'updatedAt:desc',
    });

    ctx.body = { data: items };
  },

  async createNote(ctx) {
    const { title, body, color, pinned } = ctx.request.body as any;

    const note = await (strapi.documents as any)('api::admin-note.admin-note').create({
      data: {
        title: title || '',
        body: body || '',
        color: color || '',
        pinned: pinned || false,
      },
    });

    ctx.body = { data: note };
  },

  async updateNote(ctx) {
    const { documentId } = ctx.params;
    const bodyData = ctx.request.body as any;

    const item = await (strapi.documents as any)('api::admin-note.admin-note').findFirst({
      filters: { documentId },
    });
    if (!item) return ctx.notFound('Note introuvable');

    const updateData: any = {};
    if (bodyData.title !== undefined) updateData.title = bodyData.title;
    if (bodyData.body !== undefined) updateData.body = bodyData.body;
    if (bodyData.color !== undefined) updateData.color = bodyData.color;
    if (bodyData.pinned !== undefined) updateData.pinned = bodyData.pinned;

    const updated = await (strapi.documents as any)('api::admin-note.admin-note').update({
      documentId: item.documentId,
      data: updateData,
    });

    ctx.body = { data: updated };
  },

  async deleteNote(ctx) {
    const { documentId } = ctx.params;

    const item = await (strapi.documents as any)('api::admin-note.admin-note').findFirst({
      filters: { documentId },
    });
    if (!item) return ctx.notFound('Note introuvable');

    await (strapi.documents as any)('api::admin-note.admin-note').delete({
      documentId: item.documentId,
    });

    ctx.body = { success: true };
  },
}));
