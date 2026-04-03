export default {
  routes: [
    {
      method: 'POST',
      path: '/mockup/generate',
      handler: 'mockup.generate',
      config: { auth: false },
    },
  ],
};
