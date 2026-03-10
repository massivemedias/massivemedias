export default {
  routes: [
    {
      method: 'POST',
      path: '/contact-submissions/submit',
      handler: 'contact-submission.submit',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/contact-submissions/admin',
      handler: 'contact-submission.adminList',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/contact-submissions/:documentId/status',
      handler: 'contact-submission.updateStatus',
      config: {
        auth: false,
      },
    },
  ],
};
