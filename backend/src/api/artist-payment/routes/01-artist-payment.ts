export default {
  routes: [
    {
      method: 'GET',
      path: '/artist-payments/list',
      handler: 'artist-payment.listPayments',
      config: {},
    },
    {
      method: 'POST',
      path: '/artist-payments/create',
      handler: 'artist-payment.createPayment',
      config: {},
    },
  ],
};
