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
  ],
};
