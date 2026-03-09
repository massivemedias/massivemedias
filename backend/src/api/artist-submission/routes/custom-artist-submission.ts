export default {
  routes: [
    {
      method: 'POST',
      path: '/artist-submissions/submit',
      handler: 'artist-submission.submit',
      config: {
        auth: false,
      },
    },
  ],
};
