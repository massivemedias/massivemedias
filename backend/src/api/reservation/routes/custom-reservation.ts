export default {
  routes: [
    {
      method: 'POST',
      path: '/reservations/submit',
      handler: 'reservation.submit',
      config: { auth: false },
    },
    {
      method: 'PUT',
      path: '/reservations/:documentId/status',
      handler: 'reservation.updateStatus',
      config: { auth: false },
    },
  ],
};
