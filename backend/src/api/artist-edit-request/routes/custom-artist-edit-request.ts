export default {
  routes: [
    {
      method: 'POST',
      path: '/artist-edit-requests/create',
      handler: 'artist-edit-request.createRequest',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/artist-edit-requests/my-requests',
      handler: 'artist-edit-request.myRequests',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/artist-edit-requests/admin',
      handler: 'artist-edit-request.adminList',
      config: { auth: false },
    },
    {
      method: 'PUT',
      path: '/artist-edit-requests/:documentId/approve',
      handler: 'artist-edit-request.approve',
      config: { auth: false },
    },
    {
      method: 'PUT',
      path: '/artist-edit-requests/:documentId/reject',
      handler: 'artist-edit-request.reject',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/artist-edit-requests/cleanup-originals',
      handler: 'artist-edit-request.cleanupOriginals',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/artist-edit-requests/upload-direct',
      handler: 'artist-edit-request.uploadDirect',
      config: { auth: false },
    },
    // EMERGENCY CLEANUP (11 mai 2026) : route pour supprimer en bulk les
    // edit-requests + artist-messages crees en spam par un retry loop
    // background. Restrictions strictes (artistSlug + email + status +
    // window de creation < 12h max) pour eviter abus. Cf. handler
    // bulkCleanupSpam dans le controller.
    {
      method: 'POST',
      path: '/artist-edit-requests/bulk-cleanup-spam',
      handler: 'artist-edit-request.bulkCleanupSpam',
      config: { auth: false },
    },
  ],
};
