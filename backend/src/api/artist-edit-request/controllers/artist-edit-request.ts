import { factories } from '@strapi/strapi';
import { processArtistImage, deleteFromSupabase } from '../../../utils/image-processor';
import { uploadToGoogleDrive } from '../../../utils/google-drive';

// Types de requetes qui s'appliquent automatiquement (pas besoin d'approbation admin)
const AUTO_APPLY_TYPES = ['update-profile', 'update-bio', 'update-socials', 'update-avatar'];

// Labels humains pour les notifications
const TYPE_LABELS: Record<string, string> = {
  'add-prints': 'Ajout de prints',
  'remove-prints': 'Suppression de prints',
  'add-stickers': 'Ajout de stickers',
  'remove-stickers': 'Suppression de stickers',
  'add-merch': 'Ajout de merch',
  'remove-merch': 'Suppression de merch',
  'update-profile': 'Mise a jour du profil',
  'update-bio': 'Mise a jour de la bio',
  'update-socials': 'Mise a jour des liens sociaux',
  'update-avatar': 'Changement de photo de profil',
};

export default factories.createCoreController('api::artist-edit-request.artist-edit-request', ({ strapi }) => ({

  // POST /artist-edit-requests/create
  async createRequest(ctx) {
    const { artistSlug, artistName, email, requestType, changeData } = ctx.request.body as any;

    if (!email || !requestType || !changeData) {
      ctx.throw(400, 'Email, requestType and changeData required');
      return;
    }

    try {
      // Upload des originaux sur Google Drive (pour les ajouts d'images)
      let enrichedChangeData = { ...changeData };
      if (['add-prints', 'add-stickers', 'add-merch'].includes(requestType) && changeData?.images) {
        const driveResults = [];
        for (const img of changeData.images) {
          if (img.originalUrl) {
            try {
              const driveFile = await uploadToGoogleDrive(
                img.originalUrl,
                img.originalName || 'image',
                artistSlug || 'unknown',
                img.mime
              );
              driveResults.push({
                ...img,
                driveFileId: driveFile.fileId,
                driveViewLink: driveFile.webViewLink,
                driveDownloadLink: driveFile.webContentLink,
                driveFileName: driveFile.fileName,
              });
            } catch (driveErr: any) {
              // Si Google Drive echoue, on continue sans - l'original reste sur Supabase
              driveResults.push({ ...img, driveError: driveErr.message });
            }
          } else {
            driveResults.push(img);
          }
        }
        enrichedChangeData = { ...changeData, images: driveResults };
      }

      // Creer la demande
      const entry = await strapi.documents('api::artist-edit-request.artist-edit-request').create({
        data: {
          artistSlug: artistSlug || '',
          artistName: artistName || '',
          email: email.toLowerCase().trim(),
          requestType,
          changeData: enrichedChangeData,
          status: 'pending',
        },
      });

      // Creer une notification artist-message auto
      const label = TYPE_LABELS[requestType] || requestType;
      const messageData: any = {
        artistSlug: artistSlug || '',
        artistName: artistName || '',
        email: email.toLowerCase().trim(),
        subject: `[Modif] ${label}`,
        message: buildNotificationMessage(requestType, enrichedChangeData, artistName),
        category: 'edit-request',
        status: 'new',
        attachments: {
          editRequestId: entry.documentId,
          requestType,
          changeData: enrichedChangeData,
        },
      };

      const msg = await strapi.documents('api::artist-message.artist-message').create({
        data: messageData,
      });

      // Mettre a jour le linkedMessageId
      await strapi.documents('api::artist-edit-request.artist-edit-request').update({
        documentId: entry.documentId,
        data: { linkedMessageId: msg.documentId },
      });

      // Auto-apply pour les modifications de profil
      if (AUTO_APPLY_TYPES.includes(requestType)) {
        await applyProfileChange(strapi, artistSlug, requestType, changeData);
        await strapi.documents('api::artist-edit-request.artist-edit-request').update({
          documentId: entry.documentId,
          data: { status: 'approved', processedAt: new Date().toISOString() },
        });
      }

      ctx.body = {
        data: {
          documentId: entry.documentId,
          requestType: entry.requestType,
          status: AUTO_APPLY_TYPES.includes(requestType) ? 'approved' : 'pending',
          createdAt: entry.createdAt,
        },
      };
    } catch (err: any) {
      if (err.status === 400) throw err;
      ctx.throw(500, err.message);
    }
  },

  // GET /artist-edit-requests/my-requests?email=xxx
  async myRequests(ctx) {
    const { email } = ctx.query;
    if (!email) {
      ctx.throw(400, 'Email required');
      return;
    }

    try {
      const entries = await strapi.documents('api::artist-edit-request.artist-edit-request').findMany({
        filters: { email: { $eqi: email as string } },
        sort: { createdAt: 'desc' },
        limit: 50,
      });

      ctx.body = {
        data: (entries || []).map((e: any) => ({
          documentId: e.documentId,
          artistSlug: e.artistSlug,
          requestType: e.requestType,
          changeData: e.changeData,
          status: e.status,
          adminNotes: e.adminNotes,
          processedAt: e.processedAt,
          createdAt: e.createdAt,
        })),
      };
    } catch (err: any) {
      ctx.throw(500, err.message);
    }
  },

  // GET /artist-edit-requests/admin
  async adminList(ctx) {
    try {
      const entries = await strapi.documents('api::artist-edit-request.artist-edit-request').findMany({
        sort: { createdAt: 'desc' },
        limit: 100,
      });

      ctx.body = {
        data: (entries || []).map((e: any) => ({
          documentId: e.documentId,
          artistSlug: e.artistSlug,
          artistName: e.artistName,
          email: e.email,
          requestType: e.requestType,
          changeData: e.changeData,
          status: e.status,
          adminNotes: e.adminNotes,
          processedAt: e.processedAt,
          linkedMessageId: e.linkedMessageId,
          createdAt: e.createdAt,
        })),
      };
    } catch (err: any) {
      ctx.throw(500, err.message);
    }
  },

  // PUT /artist-edit-requests/:documentId/approve
  async approve(ctx) {
    const { documentId } = ctx.params;

    try {
      // Recuperer la demande
      const request = await strapi.documents('api::artist-edit-request.artist-edit-request').findOne({
        documentId,
      });

      if (!request) {
        ctx.throw(404, 'Request not found');
        return;
      }

      if (request.status !== 'pending') {
        ctx.throw(400, 'Request already processed');
        return;
      }

      const { artistSlug, requestType, changeData } = request as any;

      // Trouver l'artiste dans le CMS
      const artists = await strapi.documents('api::artist.artist').findMany({
        filters: { slug: { $eq: artistSlug } },
        limit: 1,
      });

      if (!artists || artists.length === 0) {
        ctx.throw(404, `Artist ${artistSlug} not found in CMS`);
        return;
      }

      const artist = artists[0] as any;

      // Appliquer les changements selon le type
      switch (requestType) {
        case 'add-prints':
        case 'add-stickers':
        case 'add-merch': {
          await handleAddImages(strapi, artist, requestType, changeData);
          break;
        }
        case 'remove-prints':
        case 'remove-stickers':
        case 'remove-merch': {
          await handleRemoveImages(strapi, artist, requestType, changeData);
          break;
        }
        default: {
          // Profile types - auto-applied deja dans createRequest
          break;
        }
      }

      // Mettre a jour le statut
      await strapi.documents('api::artist-edit-request.artist-edit-request').update({
        documentId,
        data: { status: 'approved', processedAt: new Date().toISOString() },
      });

      // Mettre a jour le message lie
      if (request.linkedMessageId) {
        await strapi.documents('api::artist-message.artist-message').update({
          documentId: request.linkedMessageId,
          data: { status: 'replied', adminReply: 'Modifications approuvees et appliquees.', repliedAt: new Date().toISOString() },
        });
      }

      ctx.body = { data: { documentId, status: 'approved' } };
    } catch (err: any) {
      if (err.status) throw err;
      ctx.throw(500, err.message);
    }
  },

  // PUT /artist-edit-requests/:documentId/reject
  async reject(ctx) {
    const { documentId } = ctx.params;
    const { adminNotes } = ctx.request.body as any;

    try {
      const request = await strapi.documents('api::artist-edit-request.artist-edit-request').findOne({
        documentId,
      });

      if (!request) {
        ctx.throw(404, 'Request not found');
        return;
      }

      await strapi.documents('api::artist-edit-request.artist-edit-request').update({
        documentId,
        data: {
          status: 'rejected',
          adminNotes: adminNotes || '',
          processedAt: new Date().toISOString(),
        },
      });

      // Nettoyer les fichiers originaux de Supabase (pas besoin de les garder si rejete)
      const changeData = (request as any).changeData;
      const reqType = (request as any).requestType;
      if (['add-prints', 'add-stickers', 'add-merch'].includes(reqType) && changeData?.images) {
        for (const img of changeData.images) {
          if (img.originalUrl) {
            await deleteFromSupabase(img.originalUrl).catch(() => {});
          }
        }
      }

      // Mettre a jour le message lie
      if (request.linkedMessageId) {
        await strapi.documents('api::artist-message.artist-message').update({
          documentId: request.linkedMessageId,
          data: {
            status: 'replied',
            adminReply: adminNotes ? `Modifications refusees: ${adminNotes}` : 'Modifications refusees.',
            repliedAt: new Date().toISOString(),
          },
        });
      }

      ctx.body = { data: { documentId, status: 'rejected' } };
    } catch (err: any) {
      if (err.status) throw err;
      ctx.throw(500, err.message);
    }
  },

  // POST /artist-edit-requests/cleanup-originals
  // Supprime les fichiers originaux des demandes en attente depuis plus de 30 jours
  async cleanupOriginals(ctx) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldPending = await strapi.documents('api::artist-edit-request.artist-edit-request').findMany({
        filters: {
          status: { $eq: 'pending' },
          createdAt: { $lt: thirtyDaysAgo.toISOString() },
          requestType: { $in: ['add-prints', 'add-stickers', 'add-merch'] },
        },
        limit: 100,
      });

      let cleaned = 0;
      for (const request of (oldPending || [])) {
        const images = (request as any).changeData?.images || [];
        for (const img of images) {
          if (img.originalUrl) {
            const deleted = await deleteFromSupabase(img.originalUrl);
            if (deleted) cleaned++;
          }
        }
        // Marquer comme expiree
        await strapi.documents('api::artist-edit-request.artist-edit-request').update({
          documentId: (request as any).documentId,
          data: {
            status: 'rejected',
            adminNotes: 'Expire automatiquement apres 30 jours sans approbation. Fichiers originaux supprimes.',
            processedAt: new Date().toISOString(),
          },
        });
      }

      ctx.body = {
        data: {
          requestsCleaned: (oldPending || []).length,
          filesCleaned: cleaned,
        },
      };
    } catch (err: any) {
      ctx.throw(500, err.message);
    }
  },
}));


// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

function buildNotificationMessage(requestType: string, changeData: any, artistName: string): string {
  const label = TYPE_LABELS[requestType] || requestType;
  const name = artistName || 'Artiste';

  switch (requestType) {
    case 'add-prints':
    case 'add-stickers':
    case 'add-merch': {
      const images = changeData?.images || [];
      const count = images.length;
      let msg = `${name} souhaite ajouter ${count} image(s). Type: ${label}. En attente de validation.\n\n`;
      // Liens de telechargement haute qualite des originaux
      if (images.length > 0) {
        const hasDrive = images.some((img: any) => img.driveViewLink);
        if (hasDrive) {
          msg += `--- ORIGINAUX SAUVEGARDES SUR GOOGLE DRIVE ---\n`;
        } else {
          msg += `--- FICHIERS ORIGINAUX (temporaires sur Supabase) ---\n`;
        }
        images.forEach((img: any, i: number) => {
          const title = img.title || img.titleFr || `Image ${i + 1}`;
          const originalName = img.originalName || '';
          const originalSize = img.originalSize ? `(${(img.originalSize / (1024 * 1024)).toFixed(1)} Mo)` : '';
          msg += `\n${i + 1}. ${title} ${originalSize}`;
          msg += `\n   Fichier: ${originalName}`;
          if (img.driveViewLink) {
            msg += `\n   Google Drive: ${img.driveViewLink}`;
          } else if (img.originalUrl) {
            msg += `\n   Telecharger: ${img.originalUrl}`;
          }
          msg += `\n`;
        });
        if (hasDrive) {
          msg += `\n--- Les originaux sont sur Google Drive (Massive > Projets > Originaux Artistes) ---`;
          msg += `\n--- Tu peux approuver sans risque, les originaux restent sur Drive ---`;
        } else {
          msg += `\n--- IMPORTANT: Telecharge les originaux AVANT d'approuver! ---`;
          msg += `\n--- Les fichiers seront supprimes de Supabase apres approbation ---`;
        }
      }
      return msg;
    }
    case 'remove-prints':
    case 'remove-stickers':
    case 'remove-merch': {
      const ids = changeData?.itemIds || [];
      return `${name} souhaite supprimer ${ids.length} element(s). Type: ${label}. En attente de validation.`;
    }
    case 'update-bio':
      return `${name} a mis a jour sa bio. Applique automatiquement.\n\nNouvelle bio:\n${changeData?.bioFr || '(vide)'}`;
    case 'update-socials': {
      const socials = changeData?.socials || {};
      const links = Object.entries(socials).filter(([, v]) => v).map(([k, v]) => `  ${k}: ${v}`).join('\n');
      return `${name} a mis a jour ses liens sociaux. Applique automatiquement.\n\n${links}`;
    }
    case 'update-avatar':
      return `${name} a change sa photo de profil. Applique automatiquement.\n\nNouvelle photo: ${changeData?.avatarUrl || ''}`;
    case 'update-profile':
      return `${name} a mis a jour son profil. Applique automatiquement.`;
    default:
      return `${name} a fait une demande de modification (${label}).`;
  }
}

async function applyProfileChange(strapi: any, artistSlug: string, requestType: string, changeData: any) {
  if (!artistSlug) return;

  const artists = await strapi.documents('api::artist.artist').findMany({
    filters: { slug: { $eq: artistSlug } },
    limit: 1,
  });

  if (!artists || artists.length === 0) return;

  const artist = artists[0] as any;
  const updateData: any = {};

  switch (requestType) {
    case 'update-bio':
      if (changeData.bioFr !== undefined) updateData.bioFr = changeData.bioFr;
      if (changeData.bioEn !== undefined) updateData.bioEn = changeData.bioEn;
      if (changeData.bioEs !== undefined) updateData.bioEs = changeData.bioEs;
      if (changeData.taglineFr !== undefined) updateData.taglineFr = changeData.taglineFr;
      if (changeData.taglineEn !== undefined) updateData.taglineEn = changeData.taglineEn;
      if (changeData.taglineEs !== undefined) updateData.taglineEs = changeData.taglineEs;
      break;
    case 'update-socials':
      if (changeData.socials) {
        // Merger avec les socials existants pour ne pas ecraser avatarUrl
        const existingSocials = artist.socials || {};
        updateData.socials = { ...existingSocials, ...changeData.socials };
      }
      break;
    case 'update-avatar':
      // L'avatar est une URL Supabase - on la stocke dans socials.avatarUrl
      if (changeData.avatarUrl) {
        const socials = artist.socials || {};
        socials.avatarUrl = changeData.avatarUrl;
        updateData.socials = socials;
      }
      break;
    case 'update-profile':
      if (changeData.name) updateData.name = changeData.name;
      if (changeData.taglineFr !== undefined) updateData.taglineFr = changeData.taglineFr;
      break;
  }

  if (Object.keys(updateData).length > 0) {
    await strapi.documents('api::artist.artist').update({
      documentId: artist.documentId,
      data: updateData,
      status: 'published',
    });
  }
}

async function handleAddImages(strapi: any, artist: any, requestType: string, changeData: any) {
  const images = changeData?.images || [];
  if (images.length === 0) return;

  // Determiner quel champ JSON mettre a jour
  const isStickers = requestType === 'add-stickers';
  const isMerch = requestType === 'add-merch';
  const fieldName = isStickers ? 'stickers' : isMerch ? 'merch' : 'prints';

  const currentItems = Array.isArray(artist[fieldName]) ? [...artist[fieldName]] : [];

  // Generer un ID base pour les nouvelles images
  const existingIds = currentItems.map((p: any) => p.id).filter(Boolean);
  let nextNum = 1;
  existingIds.forEach((id: string) => {
    const match = id.match(/-(\d+)$/);
    if (match) nextNum = Math.max(nextNum, parseInt(match[1]) + 1);
  });

  for (const img of images) {
    const imageId = `${artist.slug}-${String(nextNum).padStart(3, '0')}`;
    nextNum++;

    // Traiter l'image avec Sharp (WebP + thumbnail)
    const { fullUrl, thumbUrl } = await processArtistImage(
      img.originalUrl,
      artist.slug,
      imageId
    );

    // Supprimer le fichier original de Supabase (nettoyage - seuls les WebP restent)
    if (img.originalUrl) {
      await deleteFromSupabase(img.originalUrl).catch(() => {});
    }

    const newItem: any = {
      id: imageId,
      titleFr: img.title || img.titleFr || '',
      titleEn: img.titleEn || '',
      titleEs: img.titleEs || '',
      image: thumbUrl,
      fullImage: fullUrl,
    };

    // Proprietes specifiques aux prints
    if (!isStickers && !isMerch) {
      newItem.limited = img.limited || false;
      newItem.unique = img.unique || false;
    }

    currentItems.push(newItem);
  }

  await strapi.documents('api::artist.artist').update({
    documentId: artist.documentId,
    data: { [fieldName]: currentItems },
    status: 'published',
  });
}

async function handleRemoveImages(strapi: any, artist: any, requestType: string, changeData: any) {
  const itemIds = changeData?.itemIds || [];
  if (itemIds.length === 0) return;

  const isStickers = requestType === 'remove-stickers';
  const isMerch = requestType === 'remove-merch';
  const fieldName = isStickers ? 'stickers' : isMerch ? 'merch' : 'prints';

  const currentItems = Array.isArray(artist[fieldName]) ? [...artist[fieldName]] : [];
  const filtered = currentItems.filter((item: any) => !itemIds.includes(item.id));

  await strapi.documents('api::artist.artist').update({
    documentId: artist.documentId,
    data: { [fieldName]: filtered },
    status: 'published',
  });
}
