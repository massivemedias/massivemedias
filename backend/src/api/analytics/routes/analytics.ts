export default {
  routes: [
    {
      method: 'GET',
      path: '/analytics/stats',
      handler: 'analytics.getStats',
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};
