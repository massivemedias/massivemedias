import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::artist-submission.artist-submission', ({ strapi }) => ({

  async submit(ctx) {
    const {
      nomLegal, nomArtiste, adresse, email, telephone,
      tpsTvq, bio, photoProfilUrl, portfolioUrls,
      contractAccepted, contractVersion,
    } = ctx.request.body as any;

    // Validation
    if (!nomLegal || !email || !telephone || !adresse || !bio) {
      return ctx.badRequest('Champs requis manquants');
    }
    if (!photoProfilUrl) {
      return ctx.badRequest('Photo de profil requise');
    }
    if (!portfolioUrls || !Array.isArray(portfolioUrls) || portfolioUrls.length === 0) {
      return ctx.badRequest('Au moins une oeuvre requise');
    }
    if (portfolioUrls.length > 20) {
      return ctx.badRequest('Maximum 20 oeuvres');
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
          bio,
          photoProfilUrl,
          portfolioUrls,
          contractAccepted: true,
          contractVersion: contractVersion || 'v1',
          status: 'new',
        },
      });

      strapi.log.info(`Nouvelle soumission artiste: ${nomLegal} (${email})`);
      ctx.body = { success: true, id: submission.documentId };
    } catch (err: any) {
      strapi.log.error('Artist submission error:', err);
      return ctx.badRequest('Submission failed');
    }
  },
}));
