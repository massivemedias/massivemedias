export default {
  routes: [
    {
      method: 'POST',
      path: '/tattoo-messages/send',
      handler: 'tattoo-message.send',
      config: { auth: false },
    },
  ],
};
