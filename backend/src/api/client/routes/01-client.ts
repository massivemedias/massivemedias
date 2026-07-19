export default {
  routes: [
    // STICKERS-FAV : favoris de l'utilisateur connecte (user-self, garde par
    // requireUserAuth dans le handler). Places avant /clients/:documentId.
    {
      method: 'GET',
      path: '/clients/me/favoris',
      handler: 'client.getMyFavoris',
      config: { auth: false },
    },
    {
      method: 'PUT',
      path: '/clients/me/favoris',
      handler: 'client.updateMyFavoris',
      config: { auth: false },
    },
    // RABAIS-CLIENT : rabais personnel du user connecte (user-self, garde par
    // requireUserAuth dans le handler). AVANT /clients/:documentId sinon "me"
    // serait capture comme documentId.
    {
      method: 'GET',
      path: '/clients/me/discount',
      handler: 'client.getMyDiscount',
      config: { auth: false },
    },
    // RABAIS-CLIENT (admin) : upsert du rabais personnel par email. AVANT
    // /clients/:documentId. Garde requireAdminAuth dans le handler.
    {
      method: 'PUT',
      path: '/clients/admin/discount',
      handler: 'client.adminSetDiscount',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/clients',
      handler: 'client.findAll',
      config: { auth: false },
    },
    {
      method: 'PUT',
      path: '/clients/:documentId',
      handler: 'client.updateOne',
      config: { auth: false },
    },
    {
      method: 'DELETE',
      path: '/clients/:documentId',
      handler: 'client.deleteOne',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/clients/admin',
      handler: 'client.adminList',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/clients/users',
      handler: 'client.listSupabaseUsers',
      config: {
        auth: false,
      },
    },
    {
      method: 'DELETE',
      path: '/clients/users/:id',
      handler: 'client.deleteSupabaseUser',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/clients/notify-signup',
      handler: 'client.notifySignup',
      config: {
        auth: false,
      },
    },
  ],
};
