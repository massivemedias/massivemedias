export default {
  routes: [
    {
      method: 'POST',
      path: '/withdrawal-requests/create',
      handler: 'withdrawal-request.createRequest',
      config: {},
    },
    {
      method: 'GET',
      path: '/withdrawal-requests/my-requests',
      handler: 'withdrawal-request.myRequests',
      config: {},
    },
    {
      method: 'GET',
      path: '/withdrawal-requests/admin',
      handler: 'withdrawal-request.adminList',
      config: {},
    },
    {
      method: 'PUT',
      path: '/withdrawal-requests/:documentId/process',
      handler: 'withdrawal-request.processRequest',
      config: {},
    },
  ],
};
