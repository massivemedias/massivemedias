export default {
  routes: [
    {
      method: 'POST',
      path: '/orders/create-payment-intent',
      handler: 'order.createPaymentIntent',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/orders/my-orders',
      handler: 'order.myOrders',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/webhooks/stripe',
      handler: 'order.handleStripeWebhook',
      config: {
        auth: false,
      },
    },
  ],
};
