export default {
  routes: [
    {
      method: 'GET',
      path: '/inventory-items/low-stock',
      handler: 'inventory-item.lowStock',
      config: {},
    },
    {
      method: 'GET',
      path: '/inventory-items/dashboard',
      handler: 'inventory-item.dashboard',
      config: {},
    },
    {
      method: 'PUT',
      path: '/inventory-items/:documentId/adjust',
      handler: 'inventory-item.adjustStock',
      config: {},
    },
    {
      method: 'POST',
      path: '/inventory-items/import-invoice',
      handler: 'inventory-item.importInvoice',
      config: {},
    },
  ],
};
