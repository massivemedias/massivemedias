import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::inventory-item.inventory-item', ({ strapi }) => ({
  async lowStock(ctx) {
    const items = await strapi.documents('api::inventory-item.inventory-item').findMany({
      filters: { active: true },
      populate: ['image', 'product'],
    });

    const lowStockItems = items.filter(
      (item) => item.quantity <= (item.lowStockThreshold || 5)
    );

    ctx.body = { data: lowStockItems };
  },

  async dashboard(ctx) {
    const items = await strapi.documents('api::inventory-item.inventory-item').findMany({
      filters: { active: true },
      populate: ['image', 'product'],
      sort: 'category',
    });

    const summary = {
      total: items.length,
      lowStock: 0,
      outOfStock: 0,
      totalValue: 0,
    };

    const enriched = items.map((item) => {
      const available = (item.quantity || 0) - (item.reserved || 0);
      const threshold = item.lowStockThreshold || 5;
      let status: 'ok' | 'low' | 'out' = 'ok';
      if (available <= 0) {
        status = 'out';
        summary.outOfStock++;
      } else if (available <= threshold) {
        status = 'low';
        summary.lowStock++;
      }

      const value = (item.quantity || 0) * (Number(item.costPrice) || 0);
      summary.totalValue += value;

      return {
        ...item,
        available,
        status,
        value: Math.round(value * 100) / 100,
      };
    });

    summary.totalValue = Math.round(summary.totalValue * 100) / 100;

    ctx.body = { data: enriched, summary };
  },

  async adjustStock(ctx) {
    const { documentId } = ctx.params;
    const { quantity, reserved, notes } = ctx.request.body as any;

    if (quantity === undefined && reserved === undefined) {
      return ctx.badRequest('quantity or reserved is required');
    }

    const item = await strapi.documents('api::inventory-item.inventory-item').findFirst({
      filters: { documentId },
    });

    if (!item) {
      return ctx.notFound('Inventory item not found');
    }

    const updateData: any = {};
    if (quantity !== undefined) updateData.quantity = quantity;
    if (reserved !== undefined) updateData.reserved = reserved;
    if (notes) updateData.notes = notes;

    const updated = await strapi.documents('api::inventory-item.inventory-item').update({
      documentId: item.documentId,
      data: updateData,
      populate: ['image', 'product'],
    });

    ctx.body = { data: updated };
  },
}));
