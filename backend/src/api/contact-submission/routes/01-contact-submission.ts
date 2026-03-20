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
      config: {},
    },
    {
      method: 'PUT',
      path: '/contact-submissions/:documentId/status',
      handler: 'contact-submission.updateStatus',
      config: {},
    },
    {
      method: 'POST',
      path: '/contact-submissions/:documentId/reply',
      handler: 'contact-submission.reply',
      config: {},
    },
    {
      method: 'DELETE',
      path: '/contact-submissions/:documentId',
      handler: 'contact-submission.deleteSubmission',
      config: {},
    },
  ],
};
