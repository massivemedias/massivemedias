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
    {
      method: 'DELETE',
      path: '/inventory-items/:documentId',
      handler: 'inventory-item.deleteItem',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/inventory-items/create',
      handler: 'inventory-item.createItem',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/inventory-items/import-invoice',
      handler: 'inventory-item.importInvoice',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/inventory-items/sync-outgoing-invoice',
      handler: 'inventory-item.syncOutgoingInvoice',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/inventory-items/reclassify-taxonomy',
      handler: 'inventory-item.reclassifyTaxonomy',
      config: {
        auth: false,
      },
    },
    // Reclassification explicite (liste hardcoded) - avril 2026.
    // Protegee par requireAdminAuth dans le controller. Auto-run egalement
    // au bootstrap pour garantir que les items soient ranges peu importe
    // qui touche au deploy.
    {
      method: 'POST',
      path: '/inventory-items/reclassify-explicit-april2026',
      handler: 'inventory-item.reclassifyExplicitApril2026',
      config: {
        auth: false,
      },
    },
  ],
};
