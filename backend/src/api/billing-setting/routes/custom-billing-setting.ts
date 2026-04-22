export default {
  routes: [
    {
      method: 'GET',
      path: '/billing-settings',
      handler: 'billing-setting.find',
      config: { auth: false },
    },
    {
      method: 'PUT',
      path: '/billing-settings',
      handler: 'billing-setting.update',
      config: { auth: false },
    },
  ],
};
