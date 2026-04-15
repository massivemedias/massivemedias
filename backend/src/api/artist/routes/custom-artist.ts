export default {
  routes: [
    {
      method: 'POST',
      path: '/artists/cleanup-sold-uniques',
      handler: 'artist.cleanupSoldUniques',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/artists/update-by-slug',
      handler: 'artist.updateBySlug',
      config: { auth: false },
    },
    {
      // Attention: /artists/:id est genere automatiquement par Strapi,
      // donc on utilise un path different pour eviter le conflit
      method: 'GET',
      path: '/artists-private-sales',
      handler: 'artist.getPrivateSales',
      config: { auth: false },
    },
  ],
};
