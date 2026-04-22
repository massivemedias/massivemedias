export default {
  routes: [
    {
      method: 'GET',
      path: '/billing-settings',
      handler: 'billing-settings.find',
      config: { auth: false },
    },
    {
      method: 'PUT',
      path: '/billing-settings',
      handler: 'billing-settings.update',
      config: { auth: false },
    },
  ],
};
