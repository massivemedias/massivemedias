import { factories } from '@strapi/strapi';
import { hashIpForLog } from '../../../utils/sku-registry';
import { sendContractSignedEmail } from '../../../utils/email';
import { requireAdminAuth } from '../../../utils/auth';

export default factories.createCoreController('api::artist-submission.artist-submission', ({ strapi }) => ({

  async adminList(ctx) {
    // SEC (6 mai 2026) : adminList est admin-only. La route declare auth: false
    // pour bypasser le guard utilisateur Strapi v5, mais on protege ici via
    // requireAdminAuth (ADMIN_API_TOKEN ou Supabase JWT + ADMIN_EMAILS whitelist).
    if (!(await requireAdminAuth(ctx))) return;
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
    if (!(await requireAdminAuth(ctx))) return;
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
    if (!(await requireAdminAuth(ctx))) return;
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

    // --- DURCISSEMENT (AUDIT 22 juillet 2026) --------------------------------
    // Cet endpoint est PUBLIC et le restera : le formulaire vit sur /contact et
    // un vrai candidat n'a pas encore de compte au moment ou il postule.
    // Exiger une authentification casserait toutes les vraies candidatures.
    //
    // Le risque reel : `submit` declenche un courriel signe Massive Medias
    // ENVOYE A UNE ADRESSE FOURNIE PAR LE FORMULAIRE (`to: email`). Sans garde,
    // n'importe qui pouvait s'en servir comme relais. L'echappement HTML est
    // pose cote email.ts ; ici on ferme le volume et la forme.
    const propre = (v: any) => String(v == null ? '' : v).trim();
    const MAX = { nomLegal: 120, nomArtiste: 120, adresse: 300, email: 160, telephone: 40, tpsTvq: 60, bio: 4000 };
    for (const [champ, max] of Object.entries(MAX)) {
      const valeur = propre((ctx.request.body as any)[champ]);
      if (valeur.length > max) {
        return ctx.badRequest(`Champ ${champ} trop long (max ${max} caracteres)`);
      }
    }
    // Adresse de destination du courriel : elle doit ressembler a un courriel.
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(propre(email))) {
      return ctx.badRequest('Adresse courriel invalide');
    }
    // Un portfolio est une liste d'URL, pas un vecteur de volume.
    if (portfolioUrls != null && (!Array.isArray(portfolioUrls) || portfolioUrls.length > 20)) {
      return ctx.badRequest('Portfolio invalide');
    }

    // Limiteur par IP hachee (Loi 25 : jamais d'IP en clair). En memoire, donc
    // remis a zero au redemarrage Render - assume : ca coupe l'abus automatise,
    // pas un attaquant patient. Un throttle persistant existe deja pour les
    // alertes webhook si on veut durcir davantage plus tard.
    const ipHash = hashIpForLog(ctx.request.ip);
    if (ipHash) {
      const maintenant = Date.now();
      const g: any = global as any;
      g.__artistSubmitThrottle = g.__artistSubmitThrottle || new Map<string, number[]>();
      const recentes = (g.__artistSubmitThrottle.get(ipHash) || []).filter((t: number) => maintenant - t < 3600_000);
      if (recentes.length >= 3) {
        strapi.log.warn(`[artist-submission] limite atteinte pour ip=${ipHash}`);
        ctx.status = 429;
        ctx.body = { error: { status: 429, name: 'TooManyRequests', message: 'Trop de candidatures envoyees. Reessaie dans une heure.' } };
        return;
      }
      recentes.push(maintenant);
      g.__artistSubmitThrottle.set(ipHash, recentes);
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
