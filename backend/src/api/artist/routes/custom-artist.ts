export default {
  routes: [
    {
      method: 'POST',
      path: '/artists/cleanup-sold-uniques',
      handler: 'artist.cleanupSoldUniques',
      config: { auth: false },
    },
  ],
};
