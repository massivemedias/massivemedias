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
    {
      method: 'GET',
      path: '/orders/clients',
      handler: 'order.clients',
      config: {},
    },
    {
      method: 'GET',
      path: '/orders/stats',
      handler: 'order.stats',
      config: {},
    },
    {
      method: 'POST',
      path: '/orders/upload',
      handler: 'order.uploadFile',
      config: {},
    },
    {
      method: 'GET',
      path: '/orders/commissions',
      handler: 'order.commissions',
      config: {},
    },
    {
      method: 'GET',
      path: '/orders/admin',
      handler: 'order.adminList',
      config: {},
    },
    {
      method: 'PUT',
      path: '/orders/:documentId/status',
      handler: 'order.updateStatus',
      config: {},
    },
    {
      method: 'PUT',
      path: '/orders/:documentId/notes',
      handler: 'order.updateNotes',
      config: {},
    },
    {
      method: 'PUT',
      path: '/orders/:documentId/tracking',
      handler: 'order.addTracking',
      config: {},
    },
    {
      method: 'DELETE',
      path: '/orders/:documentId',
      handler: 'order.deleteOrder',
      config: {},
    },
  ],
};
