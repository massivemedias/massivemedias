export default {
  routes: [
    {
      method: 'POST',
      path: '/artist-messages/send',
      handler: 'artist-message.send',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/artist-messages/my-messages',
      handler: 'artist-message.myMessages',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/artist-messages/admin',
      handler: 'artist-message.adminList',
      config: { auth: false },
    },
    {
      method: 'PUT',
      path: '/artist-messages/:documentId/reply',
      handler: 'artist-message.reply',
      config: { auth: false },
    },
    {
      method: 'PUT',
      path: '/artist-messages/:documentId/status',
      handler: 'artist-message.updateStatus',
      config: { auth: false },
    },
  ],
};
