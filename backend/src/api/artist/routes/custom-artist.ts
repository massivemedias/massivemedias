export default {
  routes: [
    {
      method: 'POST',
      path: '/artists/sync-images',
      handler: 'artist.syncImages',
      config: { auth: false },
    },
  ],
};
