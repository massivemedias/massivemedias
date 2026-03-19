export default {
  routes: [
    {
      method: 'POST',
      path: '/artists/sync-prints',
      handler: 'artist.syncPrints',
      config: { auth: false },
    },
  ],
};
