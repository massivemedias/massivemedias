export default {
  routes: [
    {
      method: 'POST',
      path: '/promo-codes/validate',
      handler: 'promo-code.validate',
      config: {
        auth: false,
      },
    },
  ],
};
