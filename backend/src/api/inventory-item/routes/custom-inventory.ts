export default {
  routes: [
    {
      method: 'GET',
      path: '/inventory-items/low-stock',
      handler: 'inventory-item.lowStock',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/inventory-items/dashboard',
      handler: 'inventory-item.dashboard',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/inventory-items/:documentId/adjust',
      handler: 'inventory-item.adjustStock',
      config: {
        auth: false,
      },
    },
  ],
};
