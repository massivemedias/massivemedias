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
    // MONEY-BOARD (Phase 5, 28 avril 2026) : KPIs admin (CA mois, a encaisser,
    // leads, commandes actives) avec comparaison MoM. Auth admin via
    // requireAdminAuth dans le controller. Path /admin/stats pour separer
    // visuellement des stats /orders/stats (orientees comptabilite annuelle).
    {
      method: 'GET',
      path: '/admin/stats',
      handler: 'order.adminStats',
      config: {
        auth: false,
      },
    },
    // MINI-CRM (Phase 7C, 29 avril 2026) : fiche "Super Client" - LTV +
    // historique aggreges + generation de code promo Stripe VIP -15%.
    // Auth admin via requireAdminAuth dans les controllers.
    {
      method: 'GET',
      path: '/admin/crm/client',
      handler: 'order.crmClient',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/admin/crm/client/promo',
      handler: 'order.crmCreatePromo',
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
    // KANBAN PRODUCTION (Phase 7A, 28 avril 2026) : sous-statut atelier
    // (files_prep / printing / cutting / packaging) pilote depuis le
    // ProductionBoard drag&drop. Auth admin via requireAdminAuth dans le
    // controller. Independant du status global qui reste 'processing'.
    {
      method: 'PUT',
      path: '/orders/:documentId/production-stage',
      handler: 'order.updateProductionStage',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/orders/:documentId/total',
      handler: 'order.updateTotal',
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
      method: 'GET',
      path: '/orders/:documentId/tracking',
      handler: 'order.trackingStatus',
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
      path: '/orders/manual',
      handler: 'order.manualCreate',
      config: {
        auth: false,
      },
    },
    // One-shot endpoint : reinjection des 3 factures B2B perdues (avril 2026).
    // Protege par requireAdminAuth dans le controller. Idempotent (skip si deja cree).
    {
      method: 'POST',
      path: '/orders/seed-legacy-april2026',
      handler: 'order.seedLegacyApril2026',
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
      method: 'POST',
      path: '/orders/:documentId/send-invoice',
      handler: 'order.sendInvoice',
      config: {
        auth: false,
      },
    },
    // FIX-RECOVERY (27 avril 2026) : regeneration manuelle d'un lien Stripe pour
    // les commandes en pending/draft dont la generation initiale a echoue (Stripe
    // down, race condition, deploy mid-flight). Auth admin via requireAdminAuth
    // dans le controller. Utilise pour debloquer la commande Don Mescal et
    // tout futur cas similaire sans intervention DB.
    {
      method: 'POST',
      path: '/orders/:documentId/regenerate-stripe-link',
      handler: 'order.regenerateStripeLink',
      config: {
        auth: false,
      },
    },
    // FIX-TRACKING-PORTAL (28 avril 2026) : portail public de suivi de commande.
    // Route publique mais verifiee par double cle orderId+email matchant (cf
    // controller trackOrder). Pas de donnees sensibles retournees.
    {
      method: 'GET',
      path: '/orders/track',
      handler: 'order.trackOrder',
      config: {
        auth: false,
      },
    },
    // REORDER (Phase 6, 28 avril 2026) : 1-click reorder depuis le portail
    // public /suivi pour les commandes livrees. Auth = double cle orderId+
    // email + gate status='delivered' + throttle 1/60s/email dans le
    // controller. Cree une nouvelle commande clone en status='pending' que
    // l'admin valide ensuite via le panneau standard.
    {
      method: 'POST',
      path: '/orders/reorder',
      handler: 'order.reorderOrder',
      config: {
        auth: false,
      },
    },
    // UPSELL (Phase 7B, 29 avril 2026) : 1-click upsell sur les commandes
    // pending/draft depuis /suivi. Double cle + gate status + dedupe item
    // dans le controller. Recalcul TPS/TVQ + regen Stripe Payment Link
    // automatique - l'invoice.stripePaymentLink est patch avec le nouveau.
    {
      method: 'POST',
      path: '/orders/upsell',
      handler: 'order.upsellOrder',
      config: {
        auth: false,
      },
    },
    // PORTFOLIO WIZARD (Phase finale, 28 avril 2026) : transforme une
    // commande livree en brouillon de projet portfolio. Multipart upload
    // (1..N images) + auto-fill titre/description depuis les items.
    // Auth admin via requireAdminAuth dans le controller.
    {
      method: 'POST',
      path: '/admin/orders/:id/generate-portfolio',
      handler: 'order.generatePortfolio',
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
    {
      method: 'GET',
      path: '/orders/memory-health',
      handler: 'order.memoryHealth',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/pricing-config',
      handler: 'order.pricingConfig',
      config: {
        auth: false,
      },
    },
    // SEO-01 : sitemap dynamique. Sert au path /api/sitemap.xml par
    // defaut Strapi (prefix api:: auto). Si besoin du path /sitemap.xml
    // sans prefix, Cloudflare Worker reecrit /sitemap.xml -> /api/sitemap.xml.
    {
      method: 'GET',
      path: '/sitemap.xml',
      handler: 'order.sitemap',
      config: {
        auth: false,
      },
    },
  ],
};
// Trigger redeploy 1774828260
// redeploy 1774847336
