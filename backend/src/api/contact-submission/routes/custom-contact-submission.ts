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
  ],
};
