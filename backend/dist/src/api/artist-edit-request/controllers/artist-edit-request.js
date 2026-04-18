"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
const crypto_1 = __importDefault(require("crypto"));
const image_processor_1 = require("../../../utils/image-processor");
const email_1 = require("../../../utils/email");
// Import dynamique pour eviter crash si googleapis pas installe ou env vars manquantes
async function tryUploadToGoogleDrive(fileUrl, fileName, artistSlug, mimeType) {
    try {
        const { uploadToGoogleDrive } = await Promise.resolve().then(() => __importStar(require('../../../utils/google-drive')));
        return await uploadToGoogleDrive(fileUrl, fileName, artistSlug, mimeType);
    }
    catch (err) {
        return { error: err.message || 'Google Drive upload failed' };
    }
}
async function tryUploadBufferToGoogleDrive(buffer, fileName, artistSlug, mimeType) {
    try {
        const { uploadBufferToGoogleDrive } = await Promise.resolve().then(() => __importStar(require('../../../utils/google-drive')));
        return await uploadBufferToGoogleDrive(buffer, fileName, artistSlug, mimeType);
    }
    catch (err) {
        return { error: err.message || 'Google Drive upload failed' };
    }
}
// Types de requetes qui s'appliquent automatiquement (pas besoin d'approbation admin)
const AUTO_APPLY_TYPES = ['update-profile', 'update-bio', 'update-socials', 'update-avatar', 'rename-item'];
// Labels humains pour les notifications
const TYPE_LABELS = {
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
    'rename-item': 'Renommage d\'un item',
    'mark-unique': 'Piece unique - prix personnalise',
    'unmark-unique': 'Retrait du statut piece unique',
};
exports.default = strapi_1.factories.createCoreController('api::artist-edit-request.artist-edit-request', ({ strapi }) => ({
    // POST /artist-edit-requests/create
    async createRequest(ctx) {
        const { artistSlug, artistName, email, requestType, changeData } = ctx.request.body;
        if (!email || !requestType || !changeData) {
            ctx.throw(400, 'Email, requestType and changeData required');
            return;
        }
        try {
            // Upload des originaux sur Google Drive (pour les ajouts d'images)
            let enrichedChangeData = { ...changeData };
            if (['add-prints', 'add-stickers', 'add-merch'].includes(requestType) && (changeData === null || changeData === void 0 ? void 0 : changeData.images)) {
                const driveResults = [];
                for (const img of changeData.images) {
                    if (img.originalUrl) {
                        const driveResult = await tryUploadToGoogleDrive(img.originalUrl, img.originalName || 'image', artistSlug || 'unknown', img.mime);
                        if (driveResult && !('error' in driveResult)) {
                            driveResults.push({
                                ...img,
                                driveFileId: driveResult.fileId,
                                driveViewLink: driveResult.webViewLink,
                                driveDownloadLink: driveResult.webContentLink,
                                driveFileName: driveResult.fileName,
                            });
                        }
                        else {
                            driveResults.push({ ...img, driveError: (driveResult === null || driveResult === void 0 ? void 0 : driveResult.error) || 'Unknown error' });
                        }
                    }
                    else {
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
            const messageData = {
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
            // Envoyer email notification a l'admin pour les demandes qui necessitent une approbation
            if (!AUTO_APPLY_TYPES.includes(requestType)) {
                try {
                    const { Resend } = require('resend');
                    const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
                    if (resend) {
                        const notifMessage = buildNotificationMessage(requestType, enrichedChangeData, artistName || artistSlug);
                        await resend.emails.send({
                            from: 'Massive Medias <noreply@massivemedias.com>',
                            to: process.env.ADMIN_EMAIL || 'massivemedias@gmail.com',
                            replyTo: email || 'massivemedias@gmail.com',
                            subject: `[Demande artiste] ${TYPE_LABELS[requestType] || requestType} - ${artistName || artistSlug}`,
                            html: `<div style="font-family:-apple-system,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;color:#222;border:1px solid #eee;border-radius:8px;">
                <h2 style="color:#222;margin:0 0 16px;font-size:16px;font-weight:600;">Demande de modification artiste</h2>
                <p style="color:#666;font-size:14px;margin:8px 0;">Artiste: <strong style="color:#222;">${artistName || artistSlug}</strong> (${email})</p>
                <p style="color:#666;font-size:14px;margin:8px 0;">Type: <strong style="color:#FF0098;">${TYPE_LABELS[requestType] || requestType}</strong></p>
                <div style="background:#f7f7f7;padding:16px;border-radius:6px;border-left:3px solid #FF0098;margin:16px 0;">
                  <p style="color:#333;font-size:14px;white-space:pre-wrap;margin:0;line-height:1.6;">${notifMessage}</p>
                </div>
                <p style="color:#666;font-size:13px;margin:16px 0 12px;">Connectez-vous au panneau admin pour approuver ou rejeter cette demande.</p>
                <a href="https://massivemedias.com/admin/messages" style="display:inline-block;background:#222;color:#ffffff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;">Voir dans l'admin</a>
              </div>`,
                        });
                        strapi.log.info(`Email notification admin envoye pour ${requestType} de ${artistName}`);
                    }
                }
                catch (emailErr) {
                    strapi.log.warn('Email notification admin non envoye:', emailErr);
                }
            }
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
        }
        catch (err) {
            if (err.status === 400)
                throw err;
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
                filters: { email: { $eqi: email } },
                sort: { createdAt: 'desc' },
                limit: 50,
            });
            ctx.body = {
                data: (entries || []).map((e) => ({
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
        }
        catch (err) {
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
                data: (entries || []).map((e) => ({
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
        }
        catch (err) {
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
            const { artistSlug, requestType, changeData } = request;
            // Trouver l'artiste dans le CMS
            const artists = await strapi.documents('api::artist.artist').findMany({
                filters: { slug: { $eq: artistSlug } },
                limit: 1,
            });
            if (!artists || artists.length === 0) {
                ctx.throw(404, `Artist ${artistSlug} not found in CMS`);
                return;
            }
            const artist = artists[0];
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
                case 'mark-unique': {
                    await handleMarkUnique(strapi, artist, changeData);
                    break;
                }
                case 'unmark-unique': {
                    await handleUnmarkUnique(strapi, artist, changeData);
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
        }
        catch (err) {
            if (err.status)
                throw err;
            ctx.throw(500, err.message);
        }
    },
    // PUT /artist-edit-requests/:documentId/reject
    async reject(ctx) {
        const { documentId } = ctx.params;
        const { adminNotes } = ctx.request.body;
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
            const changeData = request.changeData;
            const reqType = request.requestType;
            if (['add-prints', 'add-stickers', 'add-merch'].includes(reqType) && (changeData === null || changeData === void 0 ? void 0 : changeData.images)) {
                for (const img of changeData.images) {
                    if (img.originalUrl) {
                        await (0, image_processor_1.deleteFromSupabase)(img.originalUrl).catch(() => { });
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
        }
        catch (err) {
            if (err.status)
                throw err;
            ctx.throw(500, err.message);
        }
    },
    // POST /artist-edit-requests/cleanup-originals
    // Supprime les fichiers originaux des demandes en attente depuis plus de 30 jours
    async cleanupOriginals(ctx) {
        var _a;
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
                const images = ((_a = request.changeData) === null || _a === void 0 ? void 0 : _a.images) || [];
                for (const img of images) {
                    if (img.originalUrl) {
                        const deleted = await (0, image_processor_1.deleteFromSupabase)(img.originalUrl);
                        if (deleted)
                            cleaned++;
                    }
                }
                // Marquer comme expiree
                await strapi.documents('api::artist-edit-request.artist-edit-request').update({
                    documentId: request.documentId,
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
        }
        catch (err) {
            ctx.throw(500, err.message);
        }
    },
    // POST /artist-edit-requests/sync-images - One-shot fix: sync CMS prints with local image paths
    async syncImages(ctx) {
        const LOCAL_PRINTS = {
            'mok': [
                { id: 'mok-001', titleFr: 'Metro Montreal', titleEn: 'Montreal Metro', image: '/images/thumbs/prints/Mok1.webp', fullImage: '/images/prints/Mok1.webp', limited: false },
            ],
            'quentin-delobel': Array.from({ length: 20 }, (_, i) => ({
                id: `qd-${String(i + 1).padStart(3, '0')}`, titleFr: `Photo ${i + 1}`, titleEn: `Photo ${i + 1}`,
                image: `/images/thumbs/prints/QuentinDelobel${i + 1}.webp`, fullImage: `/images/prints/QuentinDelobel${i + 1}.webp`, limited: false,
            })),
            'psyqu33n': [
                { id: 'psyqu33n-001', titleFr: "Accepter ses parts d'ombres et de lumiere", image: '/images/thumbs/prints/Psyqu33n1.webp', fullImage: '/images/prints/Psyqu33n1.webp', limited: false },
                { id: 'psyqu33n-002', titleFr: 'Croire en quelque chose de plus grand', image: '/images/thumbs/prints/Psyqu33n2.webp', fullImage: '/images/prints/Psyqu33n2.webp', limited: false },
                { id: 'psyqu33n-003', titleFr: "L'archetype de la reine", image: '/images/thumbs/prints/Psyqu33n3.webp', fullImage: '/images/prints/Psyqu33n3.webp', limited: false },
                { id: 'psyqu33n-004', titleFr: 'La douleur derriere le masque', image: '/images/thumbs/prints/Psyqu33n4.webp', fullImage: '/images/prints/Psyqu33n4.webp', limited: false },
                { id: 'psyqu33n-005', titleFr: 'La purge', image: '/images/thumbs/prints/Psyqu33n5.webp', fullImage: '/images/prints/Psyqu33n5.webp', limited: false },
                { id: 'psyqu33n-006', titleFr: 'Le masque de la femme forte', image: '/images/thumbs/prints/Psyqu33n6.webp', fullImage: '/images/prints/Psyqu33n6.webp', limited: false },
                { id: 'psyqu33n-007', titleFr: 'Le Vampire', image: '/images/thumbs/prints/Psyqu33n7.webp', fullImage: '/images/prints/Psyqu33n7.webp', limited: false },
                { id: 'psyqu33n-008', titleFr: 'Nefertiti', image: '/images/thumbs/prints/Psyqu33n8.webp', fullImage: '/images/prints/Psyqu33n8.webp', limited: false },
                { id: 'psyqu33n-009', titleFr: 'Rabbit', image: '/images/thumbs/prints/Psyqu33n9.webp', fullImage: '/images/prints/Psyqu33n9.webp', limited: false },
                { id: 'psyqu33n-010', titleFr: 'Renard', image: '/images/thumbs/prints/Psyqu33n10.webp', fullImage: '/images/prints/Psyqu33n10.webp', limited: false },
                { id: 'psyqu33n-011', titleFr: 'The Rebirth', image: '/images/thumbs/prints/Psyqu33n11.webp', fullImage: '/images/prints/Psyqu33n11.webp', limited: false },
                { id: 'psyqu33n-012', titleFr: 'Trouver le divin en soi', image: '/images/thumbs/prints/Psyqu33n12.webp', fullImage: '/images/prints/Psyqu33n12.webp', limited: false },
                { id: 'psyqu33n-013', titleFr: 'Trusting the Process', image: '/images/thumbs/prints/Psyqu33n13.webp', fullImage: '/images/prints/Psyqu33n13.webp', limited: false },
            ],
            'no-pixl': Array.from({ length: 16 }, (_, i) => {
                const n = i + 1;
                const titles = {
                    1: ['Red Room', 'Red Room'], 2: ['Blue Beams', 'Blue Beams'], 4: ['Behind the Decks', 'Behind the Decks'],
                    5: ['Hands Up', 'Hands Up'], 6: ['Laser V', 'Laser V'], 7: ['Backstage', 'Backstage'],
                    8: ['Holy Priest', 'Holy Priest'], 9: ['Holy Priest II', 'Holy Priest II'], 10: ['Holy Priest III', 'Holy Priest III'],
                    11: ['Baie Eternite', 'Eternity Bay'], 12: ['Cap Gaspe', 'Cape Gaspe'], 13: ['Horizon', 'Horizon'],
                    14: ['Rocher Perce', 'Perce Rock'], 15: ['Falaises', 'Cliffs'], 16: ['Plongeurs', 'Divers'],
                };
                const ids = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
                const id = ids[i];
                if (!id)
                    return null;
                const t = titles[id] || [`Print ${id}`, `Print ${id}`];
                return { id: `nopixl-${String(id).padStart(3, '0')}`, titleFr: t[0], titleEn: t[1], image: `/images/thumbs/prints/NoPixl${id}.webp`, fullImage: `/images/prints/NoPixl${id}.webp`, limited: false };
            }).filter(Boolean),
            'cornelia-rose': (() => {
                const titles = ['Cornelia Rose Art', 'Chrystaline Nectar', 'Cosmic Compass', 'Liongate', 'Owl Eyes', 'The Bear', 'Sans titre I', 'Sans titre II', 'Sans titre III', 'Sans titre IV', 'Sans titre V', 'Sans titre VI', 'Sans titre VII'];
                return titles.map((t, i) => ({ id: `cr-${String(i + 1).padStart(3, '0')}`, titleFr: t, titleEn: t, image: `/images/thumbs/prints/CorneliaRose${i + 1}.webp`, fullImage: `/images/prints/CorneliaRose${i + 1}.webp`, limited: false }));
            })(),
            'adrift': (() => {
                const nums = [1, 2, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
                return nums.map((n, i) => ({ id: `adrift-${String(i + 1).padStart(3, '0')}`, titleFr: `Print ${i + 1}`, titleEn: `Print ${i + 1}`, image: `/images/thumbs/prints/Adrift${n}.webp`, fullImage: `/images/prints/Adrift${n}.webp`, limited: false }));
            })(),
            'maudite-machine': [
                { id: 'gemini-002', titleFr: 'Affiche 1', titleEn: 'Poster 1', image: '/images/thumbs/prints/Gemini2.webp', fullImage: '/images/prints/Gemini2.webp', limited: false, unique: true, fixedFormat: 'a2', fixedTier: 'studio', noFrame: true },
                { id: 'gemini-004', titleFr: 'Affiche 2', titleEn: 'Poster 2', image: '/images/thumbs/prints/Gemini4.webp', fullImage: '/images/prints/Gemini4.webp', limited: false, unique: true, fixedFormat: 'a2', fixedTier: 'studio', noFrame: true },
            ],
        };
        const results = [];
        try {
            const artists = await strapi.documents('api::artist.artist').findMany({ limit: 100 });
            for (const artist of (artists || [])) {
                const slug = artist.slug;
                const localPrints = LOCAL_PRINTS[slug];
                if (!localPrints) {
                    results.push({ slug, action: 'skip' });
                    continue;
                }
                const cmsPrints = Array.isArray(artist.prints) ? [...artist.prints] : [];
                const localById = {};
                for (const lp of localPrints)
                    localById[lp.id] = lp;
                const newPrints = [];
                const changes = [];
                for (const cp of cmsPrints) {
                    const hasImg = cp.image && String(cp.image).trim();
                    const isSupa = hasImg && String(cp.image).includes('supabase');
                    if (isSupa) {
                        newPrints.push(cp);
                        changes.push(`KEEP: ${cp.id}`);
                    }
                    else if (localById[cp.id]) {
                        const l = localById[cp.id];
                        const u = { ...cp, image: l.image, fullImage: l.fullImage };
                        for (const k of ['unique', 'fixedFormat', 'fixedTier', 'noFrame', 'limited']) {
                            if (l[k] !== undefined)
                                u[k] = l[k];
                        }
                        newPrints.push(u);
                        changes.push(`FIX: ${cp.id}`);
                    }
                    else {
                        changes.push(`REMOVE: ${cp.id}`);
                    }
                }
                const cmsIds = new Set(cmsPrints.map((p) => p.id));
                for (const lp of localPrints) {
                    if (!cmsIds.has(lp.id)) {
                        newPrints.push(lp);
                        changes.push(`ADD: ${lp.id}`);
                    }
                }
                if (changes.length === 0) {
                    results.push({ slug, action: 'ok' });
                    continue;
                }
                await strapi.documents('api::artist.artist').update({
                    documentId: artist.documentId, data: { prints: newPrints }, status: 'published',
                });
                results.push({ slug, action: 'updated', prints: newPrints.length, changes });
            }
            ctx.body = { success: true, results };
        }
        catch (err) {
            ctx.throw(500, err.message);
        }
    },
    // POST /artist-edit-requests/upload-direct - Upload fichier direct vers Google Drive + conversion WebP
    async uploadDirect(ctx) {
        const fs = require('fs');
        const path = require('path');
        const os = require('os');
        // Track filepaths for guaranteed cleanup in the outer finally.
        // Even if any step throws (sharp crash, supabase timeout, drive API down, OOM), these
        // files MUST be removed to avoid filling Render's ephemeral disk (which would in turn
        // cause secondary crashes).
        let filepath = null;
        let tmpWebp = null;
        try {
            const files = ctx.request.files;
            const { artistSlug, clientEmail, cartId, orderId } = ctx.request.body;
            strapi.log.info(`uploadDirect called - artistSlug: ${artistSlug || '(none)'}, clientEmail: ${clientEmail || '(none)'}, cartId: ${cartId || '(none)'}, orderId: ${orderId || '(none)'}, hasFiles: ${!!files}`);
            if (!files || !files.file) {
                return ctx.badRequest('No file provided');
            }
            // NOMENCLATURE DOSSIER GOOGLE DRIVE (regle metier lead tech):
            //   1. artistSlug (legacy override, utilise par l'admin artist-edit)
            //   2. Si orderId fourni: "{email or Guest} - order-{orderId}"
            //   3. Si clientEmail fourni: "{email} - cart-{cartId}"
            //   4. Si cartId seul: "Guest_Cart_{cartId}"
            //   5. Fallback hard rejet si aucun contexte (evite le vrac 'client-uploads' legacy)
            let driveFolderName;
            if (artistSlug && typeof artistSlug === 'string' && artistSlug.trim()) {
                // Mode legacy admin: pas de changement, on utilise le slug directement
                driveFolderName = artistSlug.trim();
            }
            else if (orderId) {
                const emailPart = clientEmail && typeof clientEmail === 'string' ? clientEmail.trim().toLowerCase() : 'Guest';
                driveFolderName = `${emailPart} - order-${String(orderId).trim()}`;
            }
            else if (clientEmail && typeof clientEmail === 'string' && clientEmail.trim()) {
                const cartPart = cartId && typeof cartId === 'string' ? cartId.trim() : 'unknown';
                driveFolderName = `${clientEmail.trim().toLowerCase()} - cart-${cartPart}`;
            }
            else if (cartId && typeof cartId === 'string' && cartId.trim()) {
                driveFolderName = `Guest_Cart_${cartId.trim()}`;
            }
            else {
                return ctx.badRequest('Upload context missing: provide artistSlug OR clientEmail OR orderId OR cartId');
            }
            strapi.log.info(`uploadDirect -> Drive folder resolved: "${driveFolderName}"`);
            const file = Array.isArray(files.file) ? files.file[0] : files.file;
            filepath = file.filepath || file.path;
            const fileName = file.originalFilename || file.name || 'upload';
            const mimeType = file.mimetype || file.type || 'application/octet-stream';
            const fileSize = Number(file.size) || 0;
            strapi.log.info(`uploadDirect file: ${fileName}, filepath: ${filepath}, size: ${(fileSize / (1024 * 1024)).toFixed(1)} MB, mime: ${mimeType}`);
            // Hard limit to protect the instance from OOM and disk saturation: 50MB per file
            const MAX_FILE_SIZE = 50 * 1024 * 1024;
            if (fileSize > MAX_FILE_SIZE) {
                return ctx.badRequest(`Fichier trop volumineux (${(fileSize / (1024 * 1024)).toFixed(1)} MB). Maximum: 50 MB. Contactez-nous pour les gros fichiers.`);
            }
            const memBefore = process.memoryUsage().rss / 1024 / 1024;
            tmpWebp = path.join(os.tmpdir(), `upload-${Date.now()}-${Math.random().toString(36).slice(2)}.webp`);
            // 1. Convert to WebP (streaming disk to disk, no big buffer in RAM)
            let webpUrl = '';
            let webpSizeBytes = 0;
            try {
                const sharp = require('sharp');
                const webpInfo = await sharp(filepath, { limitInputPixels: 100000000 })
                    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toFile(tmpWebp);
                webpSizeBytes = webpInfo.size;
                const { createClient } = require('@supabase/supabase-js');
                const supabaseUrl2 = process.env.SUPABASE_URL || process.env.SUPABASE_API_URL;
                const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_API_KEY;
                if (supabaseUrl2 && supabaseKey) {
                    const supabase = createClient(supabaseUrl2, supabaseKey);
                    const timestamp = Date.now();
                    const baseName = fileName.replace(/\.[^.]+$/, '');
                    const safeName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
                    // Pour Supabase (URLs publiques), on normalise le folder en slug ASCII
                    // pour eviter des URLs avec caracteres encodes type %40 et des blocages CDN.
                    const supabaseFolderSlug = driveFolderName
                        .replace(/[^a-zA-Z0-9._-]/g, '_')
                        .replace(/_+/g, '_')
                        .slice(0, 80);
                    const webpPath = `client-submissions/${supabaseFolderSlug}/${timestamp}-${safeName}.webp`;
                    // Read WebP from disk as a Buffer for Supabase. WebP is much smaller than the
                    // original file so the RAM impact is negligible (typically < 200KB).
                    const webpBuffer = fs.readFileSync(tmpWebp);
                    const { data } = await supabase.storage.from('order-files').upload(webpPath, webpBuffer, {
                        contentType: 'image/webp',
                        upsert: false,
                    });
                    if (data === null || data === void 0 ? void 0 : data.path) {
                        const { data: urlData } = supabase.storage.from('order-files').getPublicUrl(data.path);
                        webpUrl = (urlData === null || urlData === void 0 ? void 0 : urlData.publicUrl) || '';
                    }
                    strapi.log.info(`WebP created: ${webpPath} (${(webpSizeBytes / 1024).toFixed(0)} KB from ${(fileSize / (1024 * 1024)).toFixed(1)} MB original)`);
                }
                else {
                    strapi.log.warn('Supabase env vars missing - skipping WebP upload');
                }
            }
            catch (webpErr) {
                strapi.log.warn('WebP conversion failed (non-blocking):', (webpErr === null || webpErr === void 0 ? void 0 : webpErr.message) || webpErr);
            }
            // NOTE: tmpWebp cleanup happens in the OUTER finally below.
            // 2. Upload original to Google Drive using STREAM (no buffer in RAM).
            // Pass fileSize explicitly so Drive's resumable upload can pre-allocate and use
            // the correct Content-Length header - required by Drive for large files, and
            // significantly more reliable than letting it auto-detect from the stream.
            let driveResult = {};
            try {
                const { uploadStreamToGoogleDrive } = await Promise.resolve().then(() => __importStar(require('../../../utils/google-drive'))).catch(() => ({ uploadStreamToGoogleDrive: null }));
                if (typeof uploadStreamToGoogleDrive === 'function') {
                    const readStream = fs.createReadStream(filepath);
                    // On passe driveFolderName (pas artistSlug) pour que le fichier aille
                    // dans le dossier specifique au client/commande, pas en vrac a la racine.
                    driveResult = await uploadStreamToGoogleDrive(readStream, fileName, driveFolderName, mimeType, fileSize);
                }
                else {
                    const fileBuffer = fs.readFileSync(filepath);
                    driveResult = await tryUploadBufferToGoogleDrive(fileBuffer, fileName, driveFolderName, mimeType);
                }
            }
            catch (driveErr) {
                strapi.log.error('Google Drive upload error:', (driveErr === null || driveErr === void 0 ? void 0 : driveErr.message) || driveErr);
                driveResult = { error: (driveErr === null || driveErr === void 0 ? void 0 : driveErr.message) || 'Drive upload failed' };
            }
            // NOTE: filepath cleanup happens in the OUTER finally below.
            const memAfter = process.memoryUsage().rss / 1024 / 1024;
            strapi.log.info(`uploadDirect memory: before=${memBefore.toFixed(0)}MB, after=${memAfter.toFixed(0)}MB, delta=${(memAfter - memBefore).toFixed(0)}MB`);
            ctx.body = {
                success: true,
                file: {
                    name: fileName,
                    size: fileSize,
                    mime: mimeType,
                    url: webpUrl,
                    driveFileId: driveResult.fileId || null,
                    driveUrl: driveResult.webViewLink || null,
                },
            };
        }
        catch (err) {
            strapi.log.error('uploadDirect FATAL error:', (err === null || err === void 0 ? void 0 : err.message) || err, (err === null || err === void 0 ? void 0 : err.stack) || '');
            ctx.throw(500, (err === null || err === void 0 ? void 0 : err.message) || 'Upload failed');
        }
        finally {
            // GUARANTEED cleanup of both temp files, no matter what happened above.
            // These fs.unlinkSync calls are wrapped in try/catch because the files may not
            // exist (e.g. validation rejected before creating tmpWebp, or formidable already
            // cleaned up on its own). We never want a cleanup failure to mask the real error.
            if (filepath) {
                try {
                    fs.unlinkSync(filepath);
                }
                catch (_) { /* ignore */ }
            }
            if (tmpWebp) {
                try {
                    fs.unlinkSync(tmpWebp);
                }
                catch (_) { /* ignore */ }
            }
        }
    },
}));
// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
function buildNotificationMessage(requestType, changeData, artistName) {
    const label = TYPE_LABELS[requestType] || requestType;
    const name = artistName || 'Artiste';
    switch (requestType) {
        case 'add-prints':
        case 'add-stickers':
        case 'add-merch': {
            const images = (changeData === null || changeData === void 0 ? void 0 : changeData.images) || [];
            const count = images.length;
            let msg = `${name} souhaite ajouter ${count} image(s). Type: ${label}. En attente de validation.\n\n`;
            // Liens de telechargement haute qualite des originaux
            if (images.length > 0) {
                const hasDrive = images.some((img) => img.driveViewLink);
                if (hasDrive) {
                    msg += `--- ORIGINAUX SAUVEGARDES SUR GOOGLE DRIVE ---\n`;
                }
                else {
                    msg += `--- FICHIERS ORIGINAUX (temporaires sur Supabase) ---\n`;
                }
                images.forEach((img, i) => {
                    const title = img.title || img.titleFr || `Image ${i + 1}`;
                    const originalName = img.originalName || '';
                    const originalSize = img.originalSize ? `(${(img.originalSize / (1024 * 1024)).toFixed(1)} Mo)` : '';
                    msg += `\n${i + 1}. ${title} ${originalSize}`;
                    msg += `\n   Fichier: ${originalName}`;
                    if (img.driveViewLink) {
                        msg += `\n   Google Drive: ${img.driveViewLink}`;
                    }
                    else if (img.originalUrl) {
                        msg += `\n   Telecharger: ${img.originalUrl}`;
                    }
                    msg += `\n`;
                });
                if (hasDrive) {
                    msg += `\n--- Les originaux sont sur Google Drive (Massive > Projets > Originaux Artistes) ---`;
                    msg += `\n--- Tu peux approuver sans risque, les originaux restent sur Drive ---`;
                }
                else {
                    msg += `\n--- IMPORTANT: Telecharge les originaux AVANT d'approuver! ---`;
                    msg += `\n--- Les fichiers seront supprimes de Supabase apres approbation ---`;
                }
            }
            return msg;
        }
        case 'remove-prints':
        case 'remove-stickers':
        case 'remove-merch': {
            const ids = (changeData === null || changeData === void 0 ? void 0 : changeData.itemIds) || [];
            return `${name} souhaite supprimer ${ids.length} element(s). Type: ${label}. En attente de validation.`;
        }
        case 'update-bio':
            return `${name} a mis a jour sa bio. Applique automatiquement.\n\nNouvelle bio:\n${(changeData === null || changeData === void 0 ? void 0 : changeData.bioFr) || '(vide)'}`;
        case 'update-socials': {
            const socials = (changeData === null || changeData === void 0 ? void 0 : changeData.socials) || {};
            const links = Object.entries(socials).filter(([, v]) => v).map(([k, v]) => `  ${k}: ${v}`).join('\n');
            return `${name} a mis a jour ses liens sociaux. Applique automatiquement.\n\n${links}`;
        }
        case 'update-avatar':
            return `${name} a change sa photo de profil. Applique automatiquement.\n\nNouvelle photo: ${(changeData === null || changeData === void 0 ? void 0 : changeData.avatarUrl) || ''}`;
        case 'update-profile':
            return `${name} a mis a jour son profil. Applique automatiquement.`;
        case 'mark-unique': {
            const itemTitle = (changeData === null || changeData === void 0 ? void 0 : changeData.itemTitle) || (changeData === null || changeData === void 0 ? void 0 : changeData.itemId) || '';
            const pt = (changeData === null || changeData === void 0 ? void 0 : changeData.printType) || 'unique';
            if (pt === 'unique') {
                return `${name} souhaite designer "${itemTitle}" comme PIECE UNIQUE au prix de ${(changeData === null || changeData === void 0 ? void 0 : changeData.customPrice) || 0}$ (format ${((changeData === null || changeData === void 0 ? void 0 : changeData.fixedFormat) || 'a4').toUpperCase()}). En attente de validation.`;
            }
            if (pt === 'limited') {
                return `${name} souhaite designer "${itemTitle}" en EDITION LIMITEE (${(changeData === null || changeData === void 0 ? void 0 : changeData.limitedQty) || 50} exemplaires). En attente de validation.`;
            }
            if (pt === 'private') {
                return `${name} souhaite designer "${itemTitle}" comme PIECE PRIVEE pour le client ${(changeData === null || changeData === void 0 ? void 0 : changeData.clientEmail) || '?'} au prix de ${(changeData === null || changeData === void 0 ? void 0 : changeData.customPrice) || 0}$ (format ${((changeData === null || changeData === void 0 ? void 0 : changeData.fixedFormat) || 'a4').toUpperCase()}). Un email sera envoye au client apres approbation. En attente de validation.`;
            }
            if (pt === 'sale') {
                return `${name} souhaite mettre "${itemTitle}" en SOLDE (-${(changeData === null || changeData === void 0 ? void 0 : changeData.salePercent) || 20}%). En attente de validation.`;
            }
            return `${name} souhaite modifier le type de "${itemTitle}". En attente de validation.`;
        }
        case 'unmark-unique': {
            const itemTitle2 = (changeData === null || changeData === void 0 ? void 0 : changeData.itemTitle) || (changeData === null || changeData === void 0 ? void 0 : changeData.itemId) || '';
            return `${name} souhaite remettre "${itemTitle2}" en standard (retirer le statut special). En attente de validation.`;
        }
        default:
            return `${name} a fait une demande de modification (${label}).`;
    }
}
async function applyProfileChange(strapi, artistSlug, requestType, changeData) {
    if (!artistSlug)
        return;
    const artists = await strapi.documents('api::artist.artist').findMany({
        filters: { slug: { $eq: artistSlug } },
        limit: 1,
    });
    if (!artists || artists.length === 0)
        return;
    const artist = artists[0];
    const updateData = {};
    switch (requestType) {
        case 'update-bio':
            if (changeData.bioFr !== undefined)
                updateData.bioFr = changeData.bioFr;
            if (changeData.bioEn !== undefined)
                updateData.bioEn = changeData.bioEn;
            if (changeData.bioEs !== undefined)
                updateData.bioEs = changeData.bioEs;
            if (changeData.taglineFr !== undefined)
                updateData.taglineFr = changeData.taglineFr;
            if (changeData.taglineEn !== undefined)
                updateData.taglineEn = changeData.taglineEn;
            if (changeData.taglineEs !== undefined)
                updateData.taglineEs = changeData.taglineEs;
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
            if (changeData.name)
                updateData.name = changeData.name;
            if (changeData.taglineFr !== undefined)
                updateData.taglineFr = changeData.taglineFr;
            break;
        case 'rename-item': {
            const { itemId, newTitle, field } = changeData;
            if (!itemId || !newTitle)
                break;
            const fieldName = field === 'stickers' ? 'stickers' : field === 'merch' ? 'merch' : 'prints';
            const items = Array.isArray(artist[fieldName]) ? [...artist[fieldName]] : [];
            const idx = items.findIndex((it) => it.id === itemId);
            if (idx >= 0) {
                items[idx] = { ...items[idx], titleFr: newTitle, titleEn: newTitle };
                updateData[fieldName] = items;
            }
            break;
        }
    }
    if (Object.keys(updateData).length > 0) {
        await strapi.documents('api::artist.artist').update({
            documentId: artist.documentId,
            data: updateData,
            status: 'published',
        });
    }
}
async function handleAddImages(strapi, artist, requestType, changeData) {
    const images = (changeData === null || changeData === void 0 ? void 0 : changeData.images) || [];
    if (images.length === 0)
        return;
    // Determiner quel champ JSON mettre a jour
    const isStickers = requestType === 'add-stickers';
    const isMerch = requestType === 'add-merch';
    const fieldName = isStickers ? 'stickers' : isMerch ? 'merch' : 'prints';
    const currentItems = Array.isArray(artist[fieldName]) ? [...artist[fieldName]] : [];
    // Generer un ID base pour les nouvelles images
    const existingIds = currentItems.map((p) => p.id).filter(Boolean);
    let nextNum = 1;
    existingIds.forEach((id) => {
        const match = id.match(/-(\d+)$/);
        if (match)
            nextNum = Math.max(nextNum, parseInt(match[1]) + 1);
    });
    for (const img of images) {
        const imageId = `${artist.slug}-${String(nextNum).padStart(3, '0')}`;
        nextNum++;
        // Traiter l'image avec Sharp (WebP + thumbnail)
        const { fullUrl, thumbUrl } = await (0, image_processor_1.processArtistImage)(img.originalUrl, artist.slug, imageId);
        // Supprimer le fichier original de Supabase (nettoyage - seuls les WebP restent)
        if (img.originalUrl) {
            await (0, image_processor_1.deleteFromSupabase)(img.originalUrl).catch(() => { });
        }
        const newItem = {
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
            // Config commune (format, tier, cadre) pour unique/limited/private
            if (img.fixedFormat)
                newItem.fixedFormat = img.fixedFormat;
            if (img.fixedTier)
                newItem.fixedTier = img.fixedTier;
            if (img.frameOption && img.frameOption !== 'none') {
                newItem.withFrame = true;
                newItem.frameColor = img.frameOption; // 'black' ou 'white'
            }
            else if (img.noFrame !== undefined) {
                newItem.noFrame = img.noFrame;
            }
            if (img.customPrice)
                newItem.customPrice = parseFloat(img.customPrice);
            // Edition limitee
            if (img.limitedEdition) {
                newItem.limitedEdition = true;
                newItem.limitedQty = parseInt(img.limitedQty) || 50;
            }
            // Privee (visible seulement par un client specifique)
            if (img.private && img.clientEmail) {
                newItem.private = true;
                newItem.clientEmail = img.clientEmail.toLowerCase();
                // Generer un token unique pour le lien d'achat
                newItem.privateToken = crypto_1.default.randomBytes(16).toString('hex');
            }
        }
        currentItems.push(newItem);
    }
    await strapi.documents('api::artist.artist').update({
        documentId: artist.documentId,
        data: { [fieldName]: currentItems },
        status: 'published',
    });
    // Envoyer un email au client pour les pieces privees
    for (const item of currentItems) {
        if (item.private && item.clientEmail && item.privateToken) {
            const buyLink = `https://massivemedias.com/artistes/${artist.slug}?print=${item.id}&token=${item.privateToken}`;
            try {
                await (0, email_1.sendPrivatePrintEmail)({
                    clientEmail: item.clientEmail,
                    artistName: artist.name,
                    printTitle: item.titleFr || item.titleEn || 'Oeuvre',
                    printImage: item.fullImage || item.image || '',
                    buyLink,
                    price: item.customPrice || null,
                });
                strapi.log.info(`Email piece privee envoye a ${item.clientEmail} pour ${item.id}`);
            }
            catch (emailErr) {
                strapi.log.warn(`Email piece privee non envoye a ${item.clientEmail}:`, emailErr);
            }
        }
    }
}
async function handleMarkUnique(strapi, artist, changeData) {
    const { itemId, customPrice, fixedFormat, fixedTier, category } = changeData || {};
    if (!itemId)
        return;
    const fieldName = category === 'stickers' ? 'stickers' : category === 'merch' ? 'merch' : 'prints';
    const items = Array.isArray(artist[fieldName]) ? [...artist[fieldName]] : [];
    const idx = items.findIndex((it) => it.id === itemId);
    if (idx < 0)
        return;
    const printType = changeData.printType || 'unique';
    // Nettoyer les anciens flags
    const { unique: _u, customPrice: _cp, fixedFormat: _ff, fixedTier: _ft, noFrame: _nf, limitedEdition: _le, limitedQty: _lq, private: _p, clientEmail: _ce, privateToken: _pt, onSale: _os, salePercent: _sp, sold: _so, soldAt: _sa, ...cleanItem } = items[idx];
    // Appliquer le nouveau type
    switch (printType) {
        case 'unique':
            items[idx] = { ...cleanItem, unique: true, customPrice: parseFloat(customPrice) || 0,
                fixedFormat: fixedFormat || 'a4', fixedTier: fixedTier || 'studio', noFrame: true };
            break;
        case 'limited':
            items[idx] = { ...cleanItem, limitedEdition: true, limitedQty: changeData.limitedQty || 50 };
            break;
        case 'private':
            items[idx] = { ...cleanItem, private: true, unique: true,
                clientEmail: (changeData.clientEmail || '').toLowerCase(),
                privateToken: crypto_1.default.randomBytes(16).toString('hex'),
                customPrice: parseFloat(customPrice) || 0,
                fixedFormat: fixedFormat || 'a4', fixedTier: fixedTier || 'studio', noFrame: true };
            break;
        case 'sale':
            items[idx] = { ...cleanItem, onSale: true, salePercent: changeData.salePercent || 20 };
            break;
        default: // standard
            items[idx] = cleanItem;
    }
    await strapi.documents('api::artist.artist').update({
        documentId: artist.documentId,
        data: { [fieldName]: items },
        status: 'published',
    });
    // Envoyer email au client pour les pieces privees
    if (printType === 'private' && items[idx].clientEmail && items[idx].privateToken) {
        const buyLink = `https://massivemedias.com/artistes/${artist.slug}?print=${items[idx].id}&token=${items[idx].privateToken}`;
        try {
            await (0, email_1.sendPrivatePrintEmail)({
                clientEmail: items[idx].clientEmail,
                artistName: artist.name,
                printTitle: items[idx].titleFr || items[idx].titleEn || 'Oeuvre',
                printImage: items[idx].fullImage || items[idx].image || '',
                buyLink,
                price: items[idx].customPrice || null,
            });
            strapi.log.info(`Email piece privee envoye a ${items[idx].clientEmail}`);
        }
        catch (emailErr) {
            strapi.log.warn(`Email piece privee non envoye:`, emailErr);
        }
    }
}
async function handleUnmarkUnique(strapi, artist, changeData) {
    // handleMarkUnique gere aussi le type 'standard' (nettoyage)
    // On redirige vers handleMarkUnique avec printType standard
    await handleMarkUnique(strapi, artist, { ...changeData, printType: 'standard', customPrice: 0 });
}
async function handleRemoveImages(strapi, artist, requestType, changeData) {
    const itemIds = (changeData === null || changeData === void 0 ? void 0 : changeData.itemIds) || [];
    if (itemIds.length === 0)
        return;
    const isStickers = requestType === 'remove-stickers';
    const isMerch = requestType === 'remove-merch';
    const fieldName = isStickers ? 'stickers' : isMerch ? 'merch' : 'prints';
    const currentItems = Array.isArray(artist[fieldName]) ? [...artist[fieldName]] : [];
    const filtered = currentItems.filter((item) => !itemIds.includes(item.id));
    await strapi.documents('api::artist.artist').update({
        documentId: artist.documentId,
        data: { [fieldName]: filtered },
        status: 'published',
    });
}
