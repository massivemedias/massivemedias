import { factories } from '@strapi/strapi';
import { sendContactReplyEmail, sendNewContactNotificationEmail, sendAutoReplyToProspect } from '../../../utils/email';
import { requireAdminAuth } from '../../../utils/auth';

export default factories.createCoreController('api::contact-submission.contact-submission', ({ strapi }) => ({

  async adminList(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const page = parseInt(ctx.query.page as string) || 1;
    const pageSize = parseInt(ctx.query.pageSize as string) || 25;
    const status = ctx.query.status as string;
    const search = ctx.query.search as string;

    const filters: any = {};
    if (status && status !== 'all') filters.status = status;
    if (search) {
      filters.$or = [
        { nom: { $containsi: search } },
        { email: { $containsi: search } },
        { entreprise: { $containsi: search } },
      ];
    }

    const [items, allFiltered] = await Promise.all([
      strapi.documents('api::contact-submission.contact-submission').findMany({
        filters,
        sort: 'createdAt:desc',
        limit: pageSize,
        start: (page - 1) * pageSize,
      }),
      strapi.documents('api::contact-submission.contact-submission').findMany({ filters }),
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

    const validStatuses = ['new', 'read', 'replied', 'archived'];
    if (newStatus && !validStatuses.includes(newStatus)) {
      return ctx.badRequest('Status invalide');
    }

    const item = await strapi.documents('api::contact-submission.contact-submission').findFirst({
      filters: { documentId },
    });
    if (!item) return ctx.notFound('Message introuvable');

    const updateData: any = {};
    if (newStatus) updateData.status = newStatus;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await strapi.documents('api::contact-submission.contact-submission').update({
      documentId: item.documentId,
      data: updateData,
    });

    ctx.body = { data: updated };
  },

  async reply(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { documentId } = ctx.params;
    const { replyMessage, subject } = ctx.request.body as any;

    if (!replyMessage) {
      return ctx.badRequest('Le message de reponse est requis');
    }

    const item = await strapi.documents('api::contact-submission.contact-submission').findFirst({
      filters: { documentId },
    }) as any;
    if (!item) return ctx.notFound('Message introuvable');

    // Envoyer l'email
    const sent = await sendContactReplyEmail({
      customerName: item.nom,
      customerEmail: item.email,
      originalMessage: item.message,
      replyMessage,
      subject,
    });

    if (!sent) {
      return ctx.badRequest('Erreur lors de l\'envoi de l\'email');
    }

    // Marquer comme repondu et sauvegarder la reponse dans les notes
    const existingNotes = item.notes || '';
    const timestamp = new Date().toLocaleString('fr-CA');
    const updatedNotes = `${existingNotes}${existingNotes ? '\n---\n' : ''}[Reponse ${timestamp}]\n${replyMessage}`;

    await strapi.documents('api::contact-submission.contact-submission').update({
      documentId: item.documentId,
      data: { status: 'replied', notes: updatedNotes },
    });

    strapi.log.info(`Reponse contact envoyee a ${item.email}`);
    ctx.body = { success: true, notes: updatedNotes };
  },

  async deleteSubmission(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { documentId } = ctx.params;
    const item = await strapi.documents('api::contact-submission.contact-submission').findFirst({
      filters: { documentId },
    });
    if (!item) return ctx.notFound('Message introuvable');

    await strapi.documents('api::contact-submission.contact-submission').delete({
      documentId: item.documentId,
    });

    strapi.log.info(`Message contact supprime: ${documentId}`);
    ctx.body = { success: true };
  },

  async submit(ctx) {
    // FIX-PREMIUM-FORM (28 avril 2026) : ajout du champ fileLink (lien Drive/
    // WeTransfer/Dropbox) collecte dans le formulaire de qualification premium.
    const { nom, email, telephone, entreprise, service, budget, urgence, message, fileLink, website } = ctx.request.body as any;

    // Anti-spam honeypot: si le champ "website" est rempli, c'est un bot
    if (website) {
      ctx.body = { success: true, id: 'ok' }; // fake success
      return;
    }

    if (!nom || !email || !message) {
      return ctx.badRequest('Name, email and message are required');
    }

    // Anti-spam (2026-05-14) : filtre enrichi pour bloquer les bots SEO /
    // guest post / link building qui inondent le formulaire. Tout match
    // -> fake success (status 200 + id placeholder) pour ne pas alerter
    // le bot, mais AUCUNE creation DB et AUCUN auto-reply envoye.
    //
    // 3 niveaux de check :
    //   1. Patterns historiques (turbojot, "give it a try", etc.)
    //   2. Plus de 3 URLs dans le message (signal fort de spam SEO)
    //   3. Mots-cles typiques bots SEO (SEO consultant, backlinks, etc.)
    //
    // Le `nom` et `entreprise` sont scannes aussi pour les patterns 1+3
    // (les spammers mettent souvent leur "company" = "Acme SEO Agency").
    const allText = `${nom || ''} ${entreprise || ''} ${message || ''}`;

    const legacyPatterns = [
      /turbojot/i,
      /sign up for free/i,
      /give it a try/i,
      /\$[\d.]+ per submission/i,
    ];

    const seoSpamPatterns = [
      /\bSEO\s+(consultant|services?|expert|specialist|agency|company|firm|professional)\b/i,
      /\bguest\s+post(s|ing)?\b/i,
      /\b(quality|premium|high[\s-]?quality|do[\s-]?follow|niche|targeted)\s+backlinks?\b/i,
      /\bbacklinks?\s+(service|package|opportunity|opportunities|strategy)\b/i,
      /\blink\s+building\b/i,
      /\bpage\s+(one|1|first)\s+of\s+google\b/i,
      /\b(rank(ing)?|increase\s+traffic)\s+(higher|first|#1|on\s+google)\b/i,
      /\bdomain\s+authority\b/i,
      /\bget\s+more\s+(traffic|customers|leads)\s+from\s+google\b/i,
      /\bwhite[\s-]?hat\s+SEO\b/i,
    ];

    const urlCount = (message.match(/https?:\/\/\S+/gi) || []).length;

    if (
      legacyPatterns.some((p) => p.test(allText)) ||
      seoSpamPatterns.some((p) => p.test(allText)) ||
      urlCount > 3
    ) {
      strapi.log.info(
        `[contact spam] dropped silently from ${email || '(no email)'} ` +
        `(urlCount=${urlCount}, nom="${(nom || '').slice(0, 40)}")`,
      );
      ctx.body = { success: true, id: 'ok' }; // fake success
      return;
    }

    // Validation legere du fileLink : si fourni, on accepte tout (URL ou texte).
    // FIX-FILE-UPLOAD (28 avril 2026) : borne portee a 2000 caracteres pour
    // accommoder le format compose par le frontend (lien manuel + 5 URLs Drive
    // x ~150 chars chaque + en-tetes "[Lien fourni]" / "[Fichiers uploades]").
    // Tolerant > strict : si vraiment inutilisable, l'admin voit le contenu et
    // peut corriger.
    const cleanFileLink = typeof fileLink === 'string' ? fileLink.trim().slice(0, 2000) : '';

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
          fileLink: cleanFileLink,
          status: 'new',
        },
      });

      // Notifier l'admin par email (avec le nouveau champ fileLink inclus)
      sendNewContactNotificationEmail({
        nom, email, telephone, entreprise, service, budget, urgence, message,
        fileLink: cleanFileLink,
      }).catch(err => {
        strapi.log.warn('Email notification contact non envoye:', err);
      });

      // FIX-PREMIUM-FORM : auto-reply au prospect (accuse de reception
      // professionnel + delai 24-48h annonce). Fire-and-forget : si Resend
      // est down ou rate, le user a quand meme sa confirmation UI cote
      // frontend (status='success'). On log juste le warning serveur.
      sendAutoReplyToProspect(email, nom).catch(err => {
        strapi.log.warn('Auto-reply prospect non envoye:', err);
      });

      ctx.body = { success: true, id: submission.documentId };
    } catch (err: any) {
      strapi.log.error('Contact submission error:', err);
      return ctx.badRequest('Submission failed');
    }
  },
}));
