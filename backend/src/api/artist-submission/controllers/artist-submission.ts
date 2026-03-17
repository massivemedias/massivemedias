import { factories } from '@strapi/strapi';
import { sendContractSignedEmail } from '../../../utils/email';

export default factories.createCoreController('api::artist-submission.artist-submission', ({ strapi }) => ({

  async adminList(ctx) {
    const page = parseInt(ctx.query.page as string) || 1;
    const pageSize = parseInt(ctx.query.pageSize as string) || 25;
    const status = ctx.query.status as string;
    const search = ctx.query.search as string;

    const filters: any = {};
    if (status && status !== 'all') filters.status = status;
    if (search) {
      filters.$or = [
        { nomLegal: { $containsi: search } },
        { nomArtiste: { $containsi: search } },
        { email: { $containsi: search } },
      ];
    }

    const [items, allFiltered] = await Promise.all([
      strapi.documents('api::artist-submission.artist-submission').findMany({
        filters,
        sort: 'createdAt:desc',
        limit: pageSize,
        start: (page - 1) * pageSize,
      }),
      strapi.documents('api::artist-submission.artist-submission').findMany({ filters }),
    ]);

    const total = allFiltered.length;
    ctx.body = {
      data: items,
      meta: { page, pageSize, total, pageCount: Math.ceil(total / pageSize) },
    };
  },

  async updateStatus(ctx) {
    const { documentId } = ctx.params;
    const { status: newStatus, notes } = ctx.request.body as any;

    const validStatuses = ['new', 'reviewing', 'accepted', 'rejected', 'archived'];
    if (newStatus && !validStatuses.includes(newStatus)) {
      return ctx.badRequest('Status invalide');
    }

    const item = await strapi.documents('api::artist-submission.artist-submission').findFirst({
      filters: { documentId },
    });
    if (!item) return ctx.notFound('Soumission introuvable');

    const updateData: any = {};
    if (newStatus) updateData.status = newStatus;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await strapi.documents('api::artist-submission.artist-submission').update({
      documentId: item.documentId,
      data: updateData,
    });

    ctx.body = { data: updated };
  },

  async deleteSubmission(ctx) {
    const { documentId } = ctx.params;
    const item = await strapi.documents('api::artist-submission.artist-submission').findFirst({
      filters: { documentId },
    });
    if (!item) return ctx.notFound('Soumission introuvable');

    await strapi.documents('api::artist-submission.artist-submission').delete({
      documentId: item.documentId,
    });

    strapi.log.info(`Soumission artiste supprimee: ${documentId}`);
    ctx.body = { success: true };
  },

  async submit(ctx) {
    const {
      nomLegal, nomArtiste, adresse, email, telephone,
      tpsTvq, bio, photoProfilUrl, portfolioUrls,
      contractAccepted, contractVersion, supabaseUserId,
    } = ctx.request.body as any;

    // Validation - bio, photo et portfolio sont maintenant optionnels
    // (l'artiste les enverra depuis son compte une fois accepte)
    if (!nomLegal || !email || !telephone || !adresse) {
      return ctx.badRequest('Champs requis manquants');
    }
    if (!contractAccepted) {
      return ctx.badRequest('Le contrat doit etre accepte');
    }

    try {
      const submission = await strapi.documents('api::artist-submission.artist-submission').create({
        data: {
          nomLegal,
          nomArtiste: nomArtiste || '',
          adresse,
          email,
          telephone,
          tpsTvq: tpsTvq || '',
          bio: bio || '',
          photoProfilUrl: photoProfilUrl || '',
          portfolioUrls: portfolioUrls || [],
          contractAccepted: true,
          contractVersion: contractVersion || 'v3',
          status: 'new',
        },
      });

      strapi.log.info(`Nouvelle soumission artiste: ${nomLegal} (${email})`);

      // Envoyer les emails de contrat signe (copie artiste + original Massive)
      const signedAt = new Date().toISOString();
      sendContractSignedEmail({
        artistName: nomLegal,
        artistEmail: email,
        nomArtiste: nomArtiste || undefined,
        telephone,
        adresse,
        contractVersion: contractVersion || 'v3',
        signedAt,
      }).catch(err => {
        strapi.log.warn('Email contrat non envoye:', err);
      });

      ctx.body = { success: true, id: submission.documentId };
    } catch (err: any) {
      strapi.log.error('Artist submission error:', err);
      return ctx.badRequest('Submission failed');
    }
  },
}));
