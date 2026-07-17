export default {
  routes: [
    {
      // Lecture publique du cache local. Pas d'auth : que des donnees publiques
      // (id/permalink/image proxifiee/legende/date). C'est CE que le frontend lit.
      method: 'GET',
      path: '/instagram-posts/latest',
      handler: 'instagram-post.latest',
      config: { auth: false },
    },
    {
      // Declenchement manuel de la sync (dashboard admin). requireAdminAuth
      // applique dans le controller.
      method: 'POST',
      path: '/instagram-posts/sync-now',
      handler: 'instagram-post.syncNow',
      config: { auth: false },
    },
  ],
};
