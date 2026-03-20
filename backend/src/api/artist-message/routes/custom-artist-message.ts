export default {
  routes: [
    {
      method: 'POST',
      path: '/artist-messages/send',
      handler: 'artist-message.send',
      config: {},
    },
    {
      method: 'GET',
      path: '/artist-messages/my-messages',
      handler: 'artist-message.myMessages',
      config: {},
    },
    {
      method: 'GET',
      path: '/artist-messages/admin',
      handler: 'artist-message.adminList',
      config: {},
    },
    {
      method: 'PUT',
      path: '/artist-messages/:documentId/reply',
      handler: 'artist-message.reply',
      config: {},
    },
    {
      method: 'PUT',
      path: '/artist-messages/:documentId/status',
      handler: 'artist-message.updateStatus',
      config: {},
    },
    {
      method: 'DELETE',
      path: '/artist-messages/:documentId',
      handler: 'artist-message.deleteMessage',
      config: {},
    },
  ],
};
