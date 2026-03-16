import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::artist-message.artist-message', ({ strapi }) => ({

  // POST /artist-messages/send - Artiste envoie un message
  async send(ctx) {
    const { artistSlug, artistName, email, subject, message, category, attachments } = ctx.request.body as any;

    if (!email || !subject || !message) {
      ctx.throw(400, 'Email, subject and message required');
      return;
    }

    try {
      const entry = await strapi.documents('api::artist-message.artist-message').create({
        data: {
          artistSlug: artistSlug || '',
          artistName: artistName || '',
          email: email.toLowerCase().trim(),
          subject,
          message,
          category: category || 'other',
          attachments: attachments || null,
          status: 'new',
        },
      });

      ctx.body = {
        data: {
          documentId: entry.documentId,
          subject: entry.subject,
          status: entry.status,
          createdAt: entry.createdAt,
        },
      };
    } catch (err: any) {
      ctx.throw(500, err.message);
    }
  },

  // GET /artist-messages/my-messages?email=xxx - Messages d'un artiste
  async myMessages(ctx) {
    const { email } = ctx.query;
    if (!email) {
      ctx.throw(400, 'Email required');
      return;
    }

    try {
      const entries = await strapi.documents('api::artist-message.artist-message').findMany({
        filters: { email: { $eqi: email as string } },
        sort: { createdAt: 'desc' },
        limit: 50,
      });

      ctx.body = {
        data: (entries || []).map((e: any) => ({
          documentId: e.documentId,
          subject: e.subject,
          message: e.message,
          category: e.category,
          status: e.status,
          attachments: e.attachments,
          adminReply: e.adminReply,
          repliedAt: e.repliedAt,
          createdAt: e.createdAt,
        })),
      };
    } catch (err: any) {
      ctx.throw(500, err.message);
    }
  },

  // GET /artist-messages/admin - Tous les messages (admin)
  async adminList(ctx) {
    try {
      const entries = await strapi.documents('api::artist-message.artist-message').findMany({
        sort: { createdAt: 'desc' },
        limit: 100,
      });

      ctx.body = {
        data: (entries || []).map((e: any) => ({
          documentId: e.documentId,
          artistSlug: e.artistSlug,
          artistName: e.artistName,
          email: e.email,
          subject: e.subject,
          message: e.message,
          category: e.category,
          status: e.status,
          attachments: e.attachments,
          adminReply: e.adminReply,
          repliedAt: e.repliedAt,
          createdAt: e.createdAt,
        })),
      };
    } catch (err: any) {
      ctx.throw(500, err.message);
    }
  },

  // PUT /artist-messages/:documentId/reply - Admin repond
  async reply(ctx) {
    const { documentId } = ctx.params;
    const { adminReply } = ctx.request.body as any;

    if (!adminReply) {
      ctx.throw(400, 'Reply message required');
      return;
    }

    try {
      const entry = await strapi.documents('api::artist-message.artist-message').update({
        documentId,
        data: {
          adminReply,
          repliedAt: new Date().toISOString(),
          status: 'replied',
        },
      });

      ctx.body = { data: { documentId: entry.documentId, status: entry.status } };
    } catch (err: any) {
      ctx.throw(500, err.message);
    }
  },

  // PUT /artist-messages/:documentId/status - Changer le status
  async updateStatus(ctx) {
    const { documentId } = ctx.params;
    const { status } = ctx.request.body as any;

    try {
      await strapi.documents('api::artist-message.artist-message').update({
        documentId,
        data: { status },
      });

      ctx.body = { data: { success: true } };
    } catch (err: any) {
      ctx.throw(500, err.message);
    }
  },
}));
