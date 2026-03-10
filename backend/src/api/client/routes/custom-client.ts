export default {
  routes: [
    {
      method: 'GET',
      path: '/clients/admin',
      handler: 'client.adminList',
      config: {
        auth: false,
      },
    },
  ],
};
