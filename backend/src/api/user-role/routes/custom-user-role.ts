export default {
  routes: [
    {
      method: 'GET',
      path: '/user-roles/list',
      handler: 'user-role.list',
      config: {},
    },
    {
      method: 'GET',
      path: '/user-roles/by-email',
      handler: 'user-role.byEmail',
      config: {},
    },
    {
      method: 'PUT',
      path: '/user-roles/set',
      handler: 'user-role.setRole',
      config: {},
    },
    {
      method: 'DELETE',
      path: '/user-roles/:documentId',
      handler: 'user-role.removeRole',
      config: {},
    },
  ],
};
