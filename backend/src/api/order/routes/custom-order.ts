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
      method: 'POST',
      path: '/orders/create-checkout-session',
      handler: 'order.createCheckoutSession',
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
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/orders/stats',
      handler: 'order.stats',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/orders/upload',
      handler: 'order.uploadFile',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/orders/commissions',
      handler: 'order.commissions',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/orders/admin',
      handler: 'order.adminList',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/orders/:documentId/status',
      handler: 'order.updateStatus',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/orders/:documentId/notes',
      handler: 'order.updateNotes',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/orders/:documentId/tracking',
      handler: 'order.addTracking',
      config: {
        auth: false,
      },
    },
    {
      method: 'DELETE',
      path: '/orders/:documentId',
      handler: 'order.deleteOrder',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/orders/admin-create',
      handler: 'order.adminCreate',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/orders/:documentId/resend-notification',
      handler: 'order.resendAdminNotification',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/orders/by-payment-intent/:paymentIntentId',
      handler: 'order.getByPaymentIntent',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/orders/link-by-email',
      handler: 'order.linkByEmail',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/orders/reconcile-stripe',
      handler: 'order.reconcileStripe',
      config: {
        auth: false,
      },
    },
  ],
};
// Trigger redeploy 1774828260
// redeploy 1774847336
