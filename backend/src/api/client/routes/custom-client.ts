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
    {
      method: 'GET',
      path: '/clients/users',
      handler: 'client.listSupabaseUsers',
      config: {
        auth: false,
      },
    },
  ],
};
