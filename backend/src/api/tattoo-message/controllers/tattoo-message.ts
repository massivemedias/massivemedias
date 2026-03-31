import { factories } from '@strapi/strapi';
import { sendTattooMessageEmail } from '../../../utils/email';

export default factories.createCoreController('api::tattoo-message.tattoo-message', ({ strapi }) => ({

  async send(ctx) {
    const {
      tatoueurDocumentId,
      tatoueurSlug,
      senderName,
      senderEmail,
      senderType,
      content,
      conversationId,
      flashDocumentId,
      reservationDocumentId,
      supabaseUserId,
    } = ctx.request.body as any;

    if (!senderName || !senderEmail || !content || (!tatoueurDocumentId && !tatoueurSlug)) {
      return ctx.badRequest('senderName, senderEmail, content et tatoueurDocumentId ou tatoueurSlug sont requis');
    }

    const validSenderTypes = ['client', 'tatoueur', 'admin'];
    if (senderType && !validSenderTypes.includes(senderType)) {
      return ctx.badRequest('senderType invalide. Valeurs acceptees: ' + validSenderTypes.join(', '));
    }

    // Recuperer le tatoueur par documentId ou slug
    let tatoueur: any = null;
    if (tatoueurDocumentId) {
      tatoueur = await strapi.documents('api::tatoueur.tatoueur').findFirst({
        filters: { documentId: tatoueurDocumentId },
      }) as any;
    } else if (tatoueurSlug) {
      const results = await strapi.documents('api::tatoueur.tatoueur').findMany({
        filters: { slug: tatoueurSlug } as any,
        limit: 1,
      }) as any;
      tatoueur = results?.[0] || null;
    }

    // Si pas dans le CMS, on cree quand meme le message (tatoueur local)
    // Le message sera visible quand le tatoueur sera cree dans le CMS

    // Recuperer le flash si fourni
    let flash: any = null;
    if (flashDocumentId) {
      flash = await strapi.documents('api::flash.flash').findFirst({
        filters: { documentId: flashDocumentId },
      }) as any;
    }

    // Recuperer la reservation si fournie
    let reservation: any = null;
    if (reservationDocumentId) {
      reservation = await strapi.documents('api::reservation.reservation').findFirst({
        filters: { documentId: reservationDocumentId },
      }) as any;
    }

    try {
      const messageData: any = {
        senderName,
        senderEmail,
        senderType: senderType || 'client',
        content,
        conversationId: conversationId || '',
        status: 'new',
        readByRecipient: false,
        supabaseUserId: supabaseUserId || '',
        tatoueur: tatoueur.id,
      };

      if (flash) {
        messageData.relatedFlash = flash.id;
      }
      if (reservation) {
        messageData.relatedReservation = reservation.id;
      }

      const message = await strapi.documents('api::tattoo-message.tattoo-message').create({
        data: messageData,
      });

      const flashTitle = flash?.title || flash?.titleFr || undefined;
      const actualSenderType = senderType || 'client';

      // Envoyer email de notification (async, sans bloquer)
      if (actualSenderType === 'client' && tatoueur.email) {
        // Client envoie un message -> notifier le tatoueur
        sendTattooMessageEmail({
          recipientName: tatoueur.name,
          recipientEmail: tatoueur.email,
          senderName,
          senderType: 'client',
          messageContent: content,
          flashTitle,
          dashboardUrl: 'https://massivemedias.com/tatoueur/dashboard?tab=messages',
          ctaLabel: 'Repondre',
        }).catch(err => {
          strapi.log.warn('Email notification message tattoo non envoye:', err);
        });
      } else if (actualSenderType === 'tatoueur') {
        // Tatoueur envoie un message -> notifier le client (senderEmail du message precedent = client email)
        // On utilise le conversationId pour retrouver le client, ou on se fie au contexte
        // Le client email doit etre fourni via le body ou retrouve dans la conversation
        const clientEmail = (ctx.request.body as any).recipientEmail;
        const clientName = (ctx.request.body as any).recipientName;

        if (clientEmail) {
          sendTattooMessageEmail({
            recipientName: clientName || 'Client',
            recipientEmail: clientEmail,
            senderName,
            senderType: 'tatoueur',
            messageContent: content,
            flashTitle,
            dashboardUrl: 'https://massivemedias.com/tatoueur/dashboard?tab=messages',
            ctaLabel: 'Voir le message',
          }).catch(err => {
            strapi.log.warn('Email notification message tattoo non envoye:', err);
          });
        }
      }

      ctx.body = { success: true, data: message };
    } catch (err: any) {
      strapi.log.error('Tattoo message send error:', err);
      return ctx.badRequest('Erreur lors de l\'envoi du message');
    }
  },
}));
