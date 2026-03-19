export default {
  routes: [
    {
      method: 'POST',
      path: '/artists/seed-missing',
      handler: 'artist.seedMissing',
      config: { auth: false },
    },
  ],
};
