import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::inventory-item.inventory-item', ({ strapi }) => ({
  async lowStock(ctx) {
    const items = await strapi.documents('api::inventory-item.inventory-item').findMany({
      filters: { active: true },
      populate: ['image'],
    });

    const lowStockItems = items.filter(
      (item) => item.quantity <= (item.lowStockThreshold || 5)
    );

    ctx.body = { data: lowStockItems };
  },
}));
