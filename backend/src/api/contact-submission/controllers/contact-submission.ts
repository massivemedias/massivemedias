import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::contact-submission.contact-submission', ({ strapi }) => ({

  async submit(ctx) {
    const { nom, email, telephone, entreprise, service, budget, urgence, message } = ctx.request.body as any;

    if (!nom || !email || !message) {
      return ctx.badRequest('Name, email and message are required');
    }

    try {
      const submission = await strapi.documents('api::contact-submission.contact-submission').create({
        data: {
          nom,
          email,
          telephone: telephone || '',
          entreprise: entreprise || '',
          service: service || '',
          budget: budget || '',
          urgence: urgence || '',
          message,
          status: 'new',
        },
      });

      ctx.body = { success: true, id: submission.documentId };
    } catch (err: any) {
      strapi.log.error('Contact submission error:', err);
      return ctx.badRequest('Submission failed');
    }
  },
}));
