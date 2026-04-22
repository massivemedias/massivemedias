import { factories } from '@strapi/strapi';
import Stripe from 'stripe';
import crypto from 'crypto';
import { sendPrivatePrintEmail } from '../../../utils/email';
import { requireAdminAuth } from '../../../utils/auth';
import { deleteFromSupabase } from '../../../utils/image-processor';
import { invalidateArtistCache } from '../../../utils/cache-invalidator';

// Stripe lazy getter (identique au pattern d'order.ts)
const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key === 'sk_test_REPLACE_ME') {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(key);
};

// Helper : retrouve une vente privee par son token public.
// Parcourt tous les artistes actifs et renvoie { artist, print } ou null.
// Utilise par GET /token/:token et POST /token/:token/checkout.
async function findPrivateSaleByToken(strapi: any, token: string): Promise<{ artist: any; print: any } | null> {
  if (!token || typeof token !== 'string' || token.length < 8) return null;
  const artists = await strapi.documents('api::artist.artist').findMany({
    filters: { active: true },
    populate: { avatar: true },
  });
  for (const artist of artists) {
    const prints = Array.isArray(artist.prints) ? artist.prints : [];
    for (const p of prints as any[]) {
      if (p?.private && p?.privateToken === token) {
        return { artist, print: p };
      }
    }
  }
  return null;
}

export default factories.createCoreController('api::artist.artist', ({ strapi }) => ({
  /**
   * Nettoyer les pieces uniques vendues depuis plus de 7 jours
   * Les retire du tableau prints de l'artiste (l'image reste sur Google Drive)
   */
  async cleanupSoldUniques(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const DAYS = 7;
    const cutoff = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString();
    let cleaned = 0;

    const artists = await strapi.documents('api::artist.artist').findMany({
      filters: { active: true },
    });

    for (const artist of artists) {
      const prints = Array.isArray(artist.prints) ? artist.prints : [];
      const before = prints.length;
      const filtered = prints.filter((p: any) => {
        if (!p.sold || !p.soldAt) return true; // Pas vendu = garder
        return p.soldAt > cutoff; // Vendu recemment = garder (< 7 jours)
      });

      if (filtered.length < before) {
        const removed = before - filtered.length;
        await strapi.documents('api::artist.artist').update({
          documentId: artist.documentId,
          data: { prints: filtered },
        });
        cleaned += removed;
        strapi.log.info(`Cleanup: ${removed} piece(s) unique(s) retiree(s) de ${artist.slug}`);
      }
    }

    ctx.body = { data: { cleaned, message: `${cleaned} piece(s) unique(s) retiree(s)` } };
  },

  /**
   * Liste toutes les ventes privees en attente (private: true && !paid).
   * Retourne un tableau plat avec info artiste + print pour affichage
   * dans le panneau admin Commandes.
   *
   * GET /api/artists/private-sales
   */
  async getPrivateSales(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const artists = await strapi.documents('api::artist.artist').findMany({
      filters: { active: true },
      populate: { avatar: true },
    });

    const sales: any[] = [];
    for (const artist of artists) {
      const prints = Array.isArray(artist.prints) ? artist.prints : [];
      for (const p of prints as any[]) {
        if (!p?.private) continue;
        if (p?.sold) continue; // Deja paye/vendu = retire de la liste attente

        const price = typeof p.customPrice === 'number'
          ? p.customPrice
          : (typeof p.price === 'number' ? p.price : null);

        // FIX-PRIVATE-SALE (avril 2026) : nouvelle URL dediee /vente-privee/:token
        // qui pointe sur une page client premium (VentePrivee.jsx). La vieille
        // URL /artistes/:slug?print=X&token=Y reste fonctionnelle (ArtisteDetail
        // lit encore ces parametres) mais n'est plus envoyee par email.
        const clientLink = p.privateToken
          ? `https://massivemedias.com/vente-privee/${p.privateToken}`
          : null;

        sales.push({
          id: p.id,
          artistSlug: artist.slug,
          artistName: artist.name,
          artistAvatar: (artist as any).avatar?.url || null,
          title: p.titleFr || p.titleEn || p.title || '',
          image: p.thumbImage || p.image || p.fullImage || null,
          clientEmail: p.clientEmail || '',
          price,
          fixedFormat: p.fixedFormat || null,
          fixedTier: p.fixedTier || null,
          unique: !!p.unique,
          sold: !!p.sold,
          createdAt: p.createdAt || null,
          clientLink,
        });
      }
    }

    // Tri: plus recents en premier (createdAt)
    sales.sort((a, b) => {
      const ta = a.createdAt || '';
      const tb = b.createdAt || '';
      return String(tb).localeCompare(String(ta));
    });

    ctx.body = { data: sales, meta: { total: sales.length } };
  },

  /**
   * Supprime une vente privee en attente (retire le print de l'artiste).
   * L'image reste sur le stockage mais n'apparait plus dans prints[].
   *
   * POST /api/artists-private-sales/delete
   * Body: { artistSlug: string, printId: string }
   */
  async deletePrivateSale(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { artistSlug, printId } = (ctx.request.body || {}) as any;
    if (!artistSlug || !printId) {
      return ctx.badRequest('artistSlug et printId sont requis');
    }

    const artists = await strapi.documents('api::artist.artist').findMany({
      filters: { slug: artistSlug },
      status: 'published',
    });
    const artist = artists[0];
    if (!artist) return ctx.notFound(`Artiste '${artistSlug}' introuvable`);

    const prints = Array.isArray(artist.prints) ? (artist.prints as any[]) : [];
    const target = prints.find((p: any) => p?.id === printId);
    if (!target) return ctx.notFound(`Print '${printId}' introuvable`);
    if (!target.private) return ctx.badRequest(`Print '${printId}' n'est pas une vente privee`);

    const filtered = prints.filter((p: any) => p?.id !== printId);

    await strapi.documents('api::artist.artist').update({
      documentId: artist.documentId,
      data: { prints: filtered },
      status: 'published',
    });

    strapi.log.info(`Vente privee supprimee: ${artistSlug} / ${printId}`);
    ctx.body = { data: { deleted: true, artistSlug, printId } };
  },

  /**
   * Renvoie le courriel de vente privee au client (et notification admin).
   * Utile pour redeclencher l'envoi si le client a perdu/rate le courriel.
   *
   * POST /api/artists-private-sales/resend
   * Body: { artistSlug: string, printId: string }
   */
  async resendPrivateSaleEmail(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { artistSlug, printId } = (ctx.request.body || {}) as any;
    if (!artistSlug || !printId) {
      return ctx.badRequest('artistSlug et printId sont requis');
    }

    const artists = await strapi.documents('api::artist.artist').findMany({
      filters: { slug: artistSlug },
      status: 'published',
    });
    const artist = artists[0];
    if (!artist) return ctx.notFound(`Artiste '${artistSlug}' introuvable`);

    const prints = Array.isArray(artist.prints) ? (artist.prints as any[]) : [];
    const p = prints.find((pr: any) => pr?.id === printId);
    if (!p) return ctx.notFound(`Print '${printId}' introuvable`);
    if (!p.private) return ctx.badRequest(`Print '${printId}' n'est pas une vente privee`);
    if (!p.clientEmail || !p.privateToken) {
      return ctx.badRequest(`Print '${printId}' n'a pas de clientEmail/privateToken`);
    }

    const buyLink = `https://massivemedias.com/vente-privee/${p.privateToken}`;

    try {
      await sendPrivatePrintEmail({
        clientEmail: p.clientEmail,
        artistName: artist.name,
        printTitle: p.titleFr || p.titleEn || 'Oeuvre',
        printImage: p.fullImage || p.image || '',
        buyLink,
        price: typeof p.customPrice === 'number' ? p.customPrice : null,
        basePrice: typeof p.basePrice === 'number'
          ? p.basePrice
          : (typeof p.customPrice === 'number' ? p.customPrice : (typeof p.price === 'number' ? p.price : null)),
        allowCustomPrice: !!p.allowCustomPrice,
      });
      strapi.log.info(`Email vente privee renvoye: ${artistSlug} / ${printId} -> ${p.clientEmail}`);
      ctx.body = { data: { sent: true, clientEmail: p.clientEmail } };
    } catch (err: any) {
      strapi.log.warn(`Erreur renvoi email vente privee:`, err?.message || err);
      return ctx.internalServerError(`Envoi du courriel echoue: ${err?.message || 'erreur inconnue'}`);
    }
  },

  /**
   * GET /api/artists-private-sales/token/:token (PUBLIC)
   * Retourne les infos d'affichage d'une vente privee a partir du token
   * exclusif envoye par email. Pas d'auth : le token EST le secret.
   *
   * Response: { artistName, artistSlug, title, description, image, fullImage,
   *   basePrice, allowCustomPrice, currency, sold, fixedFormat }
   *
   * Note : on ne retourne PAS le clientEmail complet (protection PII).
   */
  async getPrivateSaleByToken(ctx) {
    const { token } = ctx.params;
    const found = await findPrivateSaleByToken(strapi, token);
    if (!found) return ctx.notFound('Vente privee introuvable ou lien expire');
    const { artist, print: p } = found;

    // basePrice : priorite customPrice legacy > basePrice explicite > price artist
    const basePrice = typeof p.basePrice === 'number'
      ? p.basePrice
      : (typeof p.customPrice === 'number' ? p.customPrice : (typeof p.price === 'number' ? p.price : null));

    ctx.body = {
      data: {
        token,
        artistName: artist.name,
        artistSlug: artist.slug,
        artistAvatar: (artist as any).avatar?.url || null,
        title: p.titleFr || p.titleEn || p.title || 'Oeuvre exclusive',
        titleFr: p.titleFr || null,
        titleEn: p.titleEn || null,
        description: p.descriptionFr || p.descriptionEn || p.description || '',
        image: p.fullImage || p.image || p.thumbImage || null,
        thumbImage: p.thumbImage || p.image || null,
        basePrice,
        allowCustomPrice: !!p.allowCustomPrice,
        currency: 'cad',
        sold: !!p.sold,
        fixedFormat: p.fixedFormat || null,
        fixedFrame: p.fixedFrame || null,
      },
    };
  },

  /**
   * POST /api/artists-private-sales/token/:token/checkout (PUBLIC)
   * Cree une session Stripe Checkout pour finaliser l'achat.
   *
   * Body: { amount?: number }
   *   - Si allowCustomPrice=true : le client fournit `amount` en dollars
   *     (valide >= basePrice). Rejet 400 si amount < basePrice.
   *   - Si allowCustomPrice=false : le backend force amount = basePrice,
   *     ignore le body.
   *
   * Response: { sessionUrl, sessionId, amount }
   */
  async createPrivateSaleCheckout(ctx) {
    const { token } = ctx.params;
    const body = (ctx.request.body as any) || {};
    const found = await findPrivateSaleByToken(strapi, token);
    if (!found) return ctx.notFound('Vente privee introuvable ou lien expire');

    const { artist, print: p } = found;
    if (p.sold) return ctx.badRequest('Cette oeuvre a deja ete vendue');

    const basePrice = typeof p.basePrice === 'number'
      ? p.basePrice
      : (typeof p.customPrice === 'number' ? p.customPrice : (typeof p.price === 'number' ? p.price : 0));

    if (!basePrice || basePrice <= 0) {
      return ctx.badRequest('Prix de base invalide pour cette oeuvre');
    }

    // Resolution montant final (dollars)
    let finalAmount: number;
    if (p.allowCustomPrice) {
      const clientAmount = Number(body.amount);
      if (!Number.isFinite(clientAmount) || clientAmount <= 0) {
        return ctx.badRequest('Montant requis pour cette oeuvre (prix libre)');
      }
      if (clientAmount < basePrice) {
        return ctx.badRequest(
          `Le montant minimum pour cette oeuvre est de ${basePrice}$`
        );
      }
      finalAmount = Math.round(clientAmount * 100) / 100;
    } else {
      finalAmount = basePrice;
    }

    const amountCents = Math.round(finalAmount * 100);
    const title = p.titleFr || p.titleEn || p.title || 'Oeuvre exclusive';

    try {
      const stripe = getStripe();
      const baseUrl = process.env.FRONTEND_URL || 'https://massivemedias.com';

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'cad',
            unit_amount: amountCents,
            product_data: {
              name: `${title} - ${artist.name}`,
              description: p.fixedFormat ? `Format ${p.fixedFormat}${p.fixedFrame ? ` / Cadre ${p.fixedFrame}` : ''}` : undefined,
              images: p.fullImage ? [p.fullImage] : undefined,
            },
          },
          quantity: 1,
        }],
        // Customer email prerempli par le token proprio (on ne l'envoie pas au client via API)
        customer_email: p.clientEmail || undefined,
        metadata: {
          type: 'private-sale',
          artistSlug: artist.slug,
          artistId: String((artist as any).id || ''),
          printId: p.id,
          privateSaleToken: token,
          clientEmail: p.clientEmail || '',
        },
        payment_intent_data: {
          metadata: {
            type: 'private-sale',
            artistSlug: artist.slug,
            printId: p.id,
            privateSaleToken: token,
            clientEmail: p.clientEmail || '',
          },
        },
        success_url: `${baseUrl}/vente-privee/${token}?status=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/vente-privee/${token}?status=cancel`,
      });

      strapi.log.info(`[privateSale] Checkout cree: artist=${artist.slug} print=${p.id} amount=${finalAmount}$ session=${session.id}`);
      ctx.body = {
        data: {
          sessionId: session.id,
          sessionUrl: session.url,
          amount: finalAmount,
        },
      };
    } catch (err: any) {
      strapi.log.error('[privateSale] Erreur creation checkout:', err);
      return ctx.internalServerError(err?.message || 'Erreur creation session de paiement');
    }
  },

  /**
   * Met a jour les champs "display" d'un artiste par son slug
   * (name, taglineFr, taglineEn, bioFr, bioEn, bioEs).
   * Utilise pour renommer un artiste sans toucher au slug (qui sert a
   * l'URL, l'auth et les ids de prints).
   *
   * POST /api/artists/update-by-slug
   * Body: { slug: string, name?, taglineFr?, taglineEn?, bioFr?, bioEn?, bioEs? }
   */
  async updateBySlug(ctx) {
    // TODO SEC-01-FOLLOWUP: assouplir en requireUserAuth + check que l'artiste
    // connecte modifie son propre slug (ownership). Pour l'instant admin only
    // pour eviter tout risque d'ecrasement malveillant des bios/taglines.
    if (!(await requireAdminAuth(ctx))) return;
    const { slug, ...fields } = ctx.request.body as any;
    if (!slug) return ctx.badRequest('slug est requis');

    // Chercher les deux versions (draft + published)
    const drafts = await strapi.documents('api::artist.artist').findMany({
      filters: { slug },
      status: 'draft',
    });
    const published = await strapi.documents('api::artist.artist').findMany({
      filters: { slug },
      status: 'published',
    });
    const existing = drafts[0] || published[0];
    if (!existing) return ctx.notFound(`Artiste '${slug}' introuvable`);

    // Seuls les champs display sont modifiables ici. Slug, socials, pricing,
    // prints, stickers, merch ne sont PAS modifiables via cette route.
    const ALLOWED_FIELDS = ['name', 'taglineFr', 'taglineEn', 'bioFr', 'bioEn', 'bioEs'];
    const data: Record<string, any> = {};
    for (const key of ALLOWED_FIELDS) {
      if (fields[key] !== undefined && fields[key] !== null) {
        data[key] = fields[key];
      }
    }
    if (Object.keys(data).length === 0) {
      return ctx.badRequest('Aucun champ a mettre a jour');
    }

    // Update le draft ET republie explicitement
    const updated = await strapi.documents('api::artist.artist').update({
      documentId: existing.documentId,
      data,
      status: 'published', // Forcer l'update sur la version publiee
    });

    // Publier en plus pour etre certain que la version visible est a jour
    try {
      await strapi.documents('api::artist.artist').publish({
        documentId: existing.documentId,
      });
    } catch (err: any) {
      strapi.log.warn(`Publish failed for artist ${slug}: ${err?.message || err}`);
    }

    // Re-fetch pour confirmer
    const refetched = await strapi.documents('api::artist.artist').findOne({
      documentId: existing.documentId,
    });

    strapi.log.info(`Artist updated by slug: ${slug} -> name="${refetched?.name}"`);
    ctx.body = {
      data: refetched || updated,
      debug: {
        draftsFound: drafts.length,
        publishedFound: published.length,
        existingDocumentId: existing.documentId,
        updatedName: updated?.name,
        refetchedName: refetched?.name,
      },
    };
  },

  // ============================================================
  // GOD MODE ADMIN (avril 2026) - Mutations directes sans passer
  // par le systeme de edit-requests. Reserve a l'admin strict.
  // ============================================================

  // GET /admin/artists-list - Liste compacte de tous les artistes avec counts
  async adminListAll(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    try {
      const artists = await strapi.documents('api::artist.artist').findMany({
        sort: { name: 'asc' } as any,
        limit: 200,
      });
      const list = (artists || []).map((a: any) => ({
        documentId: a.documentId,
        slug: a.slug,
        name: a.name,
        email: a.email || '',
        active: a.active,
        commissionRate: a.commissionRate ?? 0.5,
        printsCount: Array.isArray(a.prints) ? a.prints.length : 0,
        stickersCount: Array.isArray(a.stickers) ? a.stickers.length : 0,
        taglineFr: a.taglineFr || '',
        sortOrder: a.sortOrder ?? 0,
      }));
      ctx.body = { data: list };
    } catch (err: any) {
      ctx.throw(500, err.message);
    }
  },

  // GET /admin/artists-detail/:slug - Profil complet + toutes les oeuvres (admin)
  async adminGetDetail(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { slug } = ctx.params;
    if (!slug) return ctx.badRequest('slug requis');
    try {
      const artists = await strapi.documents('api::artist.artist').findMany({
        filters: { slug: { $eq: slug } } as any,
        limit: 1,
      });
      if (!artists || artists.length === 0) return ctx.notFound(`Artiste ${slug} introuvable`);
      const a = artists[0] as any;

      // ============================================================
      // FINANCIALS : agreger les ventes et commissions pour CET artiste
      // (logique inline identique a la route /orders/commissions mais filtree par slug)
      // ============================================================
      const validStatuses = ['paid', 'processing', 'ready', 'shipped', 'delivered'] as const;
      const orders = await strapi.documents('api::order.order').findMany({
        filters: { status: { $in: validStatuses as any } } as any,
        sort: 'createdAt:desc' as any,
        limit: 500,
      });

      const DEFAULT_COSTS: Record<string, any> = {
        studio: { a4: 12, a3: 16, a3plus: 20, a2: 28 },
        museum: { a4: 25, a3: 38, a3plus: 48, a2: 65 },
        frame: 8,
      };
      const STICKER_PROD_COSTS: Record<number, number> = {
        25: 8, 50: 12, 100: 15, 250: 30, 500: 50,
      };
      function getProductionCost(artist: any, item: any): number {
        const pid = item.productId || '';
        if (pid.startsWith('artist-sticker-pack-')) {
          const qty = item.quantity || 100;
          const tiers = Object.keys(STICKER_PROD_COSTS).map(Number).sort((a, b) => a - b);
          let cost = STICKER_PROD_COSTS[100];
          for (const t of tiers) { if (qty >= t) cost = STICKER_PROD_COSTS[t]; }
          return cost;
        }
        const costs = artist.productionCosts || DEFAULT_COSTS;
        const tier = (item.finish || 'studio').toLowerCase().includes('museum') ? 'museum' : 'studio';
        const format = (item.size || 'a4').toLowerCase().replace(/[^a-z0-9]/g, '');
        const tierCosts = costs[tier] || DEFAULT_COSTS[tier];
        let cost = (tierCosts && tierCosts[format]) || 15;
        if (item.withFrame || (item.productName || '').toLowerCase().includes('cadre')) {
          cost += (costs.frame ?? DEFAULT_COSTS.frame);
        }
        return cost;
      }

      const rate = parseFloat(a.commissionRate) || 0.5;
      const relatedOrders: any[] = [];
      let totalSales = 0, totalProduction = 0, totalNetProfit = 0, totalCommission = 0;
      for (const order of (orders || [])) {
        const items: any[] = Array.isArray((order as any).items) ? (order as any).items : [];
        for (const item of items) {
          const pid = item.productId || '';
          if (!(pid.startsWith(`artist-print-${slug}-`) || pid.startsWith(`artist-sticker-pack-${slug}-`))) continue;
          if (item.isArtistOwnPrint) continue;
          const qty = item.quantity || 1;
          const salePrice = item.totalPrice || (item.unitPrice || 0) * qty;
          const prodCost = getProductionCost(a, item) * qty;
          const netProfit = Math.max(0, salePrice - prodCost);
          const commission = Math.round(netProfit * rate * 100) / 100;
          totalSales += salePrice;
          totalProduction += prodCost;
          totalNetProfit += netProfit;
          totalCommission += commission;
          relatedOrders.push({
            orderId: (order as any).documentId,
            orderDate: (order as any).createdAt,
            customerName: (order as any).customerName,
            productName: item.productName || pid,
            size: item.size || '',
            finish: item.finish || '',
            quantity: qty,
            salePrice: Math.round(salePrice * 100) / 100,
            productionCost: Math.round(prodCost * 100) / 100,
            netProfit: Math.round(netProfit * 100) / 100,
            commission,
          });
        }
      }

      // Paiements deja verses a cet artiste
      let payments: any[] = [];
      try {
        payments = await strapi.documents('api::artist-payment.artist-payment' as any).findMany({
          filters: { artistSlug: { $eq: slug } } as any,
          sort: 'date:desc' as any,
        });
      } catch { /* content type peut ne pas exister */ }
      const totalPaid = payments.reduce((s, p: any) => s + (parseFloat(p.amount) || 0), 0);

      const financials = {
        commissionRate: rate,
        totalSales: Math.round(totalSales * 100) / 100,
        totalProduction: Math.round(totalProduction * 100) / 100,
        totalNetProfit: Math.round(totalNetProfit * 100) / 100,
        totalCommission: Math.round(totalCommission * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        balance: Math.round((totalCommission - totalPaid) * 100) / 100,
        orders: relatedOrders,
        payments: (payments || []).map((p: any) => ({
          documentId: p.documentId,
          amount: parseFloat(p.amount) || 0,
          method: p.method,
          date: p.date,
          period: p.period || '',
          notes: p.notes || '',
        })),
      };

      // ============================================================
      // WITHDRAWALS : demandes de retrait PayPal de cet artiste
      // ============================================================
      let withdrawals: any[] = [];
      try {
        const emailToQuery = (a.email || '').toLowerCase().trim();
        if (emailToQuery) {
          withdrawals = await strapi.documents('api::withdrawal-request.withdrawal-request' as any).findMany({
            filters: { email: { $eqi: emailToQuery } } as any,
            sort: 'createdAt:desc' as any,
            limit: 50,
          });
        }
      } catch { /* content type peut ne pas etre sync */ }
      const paypalEmail = withdrawals[0]?.paypalEmail || '';

      // ============================================================
      // STATS : vues totales + par oeuvre. Le champ `views` n'est pas encore
      // tracke en prod (tracking a implementer separement). On expose les
      // compteurs a 0 avec la structure finale pour que l'UI soit prete.
      // Format retourne : { profileViews, itemsViews: [{id, views}] }
      // ============================================================
      const prints = Array.isArray(a.prints) ? a.prints : [];
      const stickers = Array.isArray(a.stickers) ? a.stickers : [];
      const itemsViews = [
        ...prints.map((p: any) => ({ id: p.id, category: 'prints', title: p.titleFr || p.titleEn || p.id, views: Number(p.views) || 0 })),
        ...stickers.map((s: any) => ({ id: s.id, category: 'stickers', title: s.titleFr || s.titleEn || s.id, views: Number(s.views) || 0 })),
      ];
      const stats = {
        profileViews: Number(a.profileViews) || 0,
        itemsViews,
        totalItemViews: itemsViews.reduce((s, it) => s + it.views, 0),
      };

      ctx.body = {
        data: {
          documentId: a.documentId,
          slug: a.slug,
          name: a.name,
          email: a.email || '',
          taglineFr: a.taglineFr || '',
          taglineEn: a.taglineEn || '',
          taglineEs: a.taglineEs || '',
          bioFr: a.bioFr || '',
          bioEn: a.bioEn || '',
          bioEs: a.bioEs || '',
          socials: a.socials || {},
          pricing: a.pricing || null,
          commissionRate: rate,
          active: a.active,
          sortOrder: a.sortOrder ?? 0,
          prints,
          stickers,
          // NOUVEAUX blocs agreges
          financials,
          withdrawals: (withdrawals || []).map((w: any) => ({
            documentId: w.documentId,
            amount: parseFloat(w.amount) || 0,
            paypalEmail: w.paypalEmail,
            status: w.status,
            notes: w.notes || '',
            adminNotes: w.adminNotes || '',
            paypalTransactionId: w.paypalTransactionId || '',
            createdAt: w.createdAt,
            processedAt: w.processedAt || null,
          })),
          paypalEmail,
          stats,
        },
      };
    } catch (err: any) {
      ctx.throw(500, err.message);
    }
  },

  // PUT /admin/artists-profile/:slug - Update profil (bio/tagline/socials/commission/active)
  async adminUpdateProfile(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { slug } = ctx.params;
    if (!slug) return ctx.badRequest('slug requis');
    const body = (ctx.request.body as any) || {};

    // Whitelist stricte : seuls ces champs peuvent etre modifies ici.
    // Les items (prints/stickers) passent par les routes dediees ci-dessous.
    const ALLOWED = ['name', 'email', 'taglineFr', 'taglineEn', 'taglineEs',
      'bioFr', 'bioEn', 'bioEs', 'socials', 'commissionRate', 'active', 'sortOrder'];
    const data: Record<string, any> = {};
    for (const key of ALLOWED) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    if (Object.keys(data).length === 0) {
      return ctx.badRequest('Aucun champ valide a mettre a jour. Champs autorises: ' + ALLOWED.join(', '));
    }
    if (data.commissionRate !== undefined) {
      const cr = Number(data.commissionRate);
      if (!Number.isFinite(cr) || cr < 0 || cr > 1) {
        return ctx.badRequest('commissionRate doit etre un decimal entre 0 et 1 (ex: 0.5 = 50%)');
      }
      data.commissionRate = cr;
    }

    try {
      const artists = await strapi.documents('api::artist.artist').findMany({
        filters: { slug: { $eq: slug } } as any,
        limit: 1,
      });
      if (!artists || artists.length === 0) return ctx.notFound(`Artiste ${slug} introuvable`);
      const existing = artists[0] as any;

      // Merger socials au lieu d'ecraser (preserve avatarUrl)
      if (data.socials && typeof data.socials === 'object') {
        data.socials = { ...(existing.socials || {}), ...data.socials };
      }

      const updated = await strapi.documents('api::artist.artist').update({
        documentId: existing.documentId,
        data,
        status: 'published',
      });

      try {
        await strapi.documents('api::artist.artist').publish({ documentId: existing.documentId });
      } catch (_) { /* non-bloquant */ }

      strapi.log.info(`[god-mode] Artiste ${slug} profil mis a jour: ${Object.keys(data).join(', ')}`);

      // Invalidation cache Cloudflare (best-effort, non-bloquant)
      const cacheResult = await invalidateArtistCache(slug, strapi.log);
      ctx.body = { success: true, data: updated, cacheInvalidation: cacheResult };
    } catch (err: any) {
      strapi.log.error('adminUpdateProfile error:', err);
      ctx.throw(500, err.message);
    }
  },

  // PUT /admin/artists-item/:slug/:itemId - Update une oeuvre (titre/prix) dans prints ou stickers
  // Body: { category: 'prints'|'stickers', titleFr?, titleEn?, titleEs?, customPrice? }
  async adminUpdateItem(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { slug, itemId } = ctx.params;
    if (!slug || !itemId) return ctx.badRequest('slug et itemId requis');
    const body = (ctx.request.body as any) || {};
    const category = body.category === 'stickers' ? 'stickers' : 'prints';

    const ITEM_FIELDS = ['titleFr', 'titleEn', 'titleEs', 'customPrice', 'limited', 'limitedQty', 'onSale', 'salePercent', 'unique', 'noFrame'];
    const patch: Record<string, any> = {};
    for (const k of ITEM_FIELDS) {
      if (body[k] !== undefined) patch[k] = body[k];
    }
    if (Object.keys(patch).length === 0) {
      return ctx.badRequest('Aucun champ valide a mettre a jour sur l\'item. Champs: ' + ITEM_FIELDS.join(', '));
    }
    if (patch.customPrice !== undefined) {
      const p = parseFloat(String(patch.customPrice));
      if (!Number.isFinite(p) || p < 0) {
        return ctx.badRequest('customPrice doit etre un nombre positif');
      }
      patch.customPrice = p;
    }

    try {
      const artists = await strapi.documents('api::artist.artist').findMany({
        filters: { slug: { $eq: slug } } as any,
        limit: 1,
      });
      if (!artists || artists.length === 0) return ctx.notFound(`Artiste ${slug} introuvable`);
      const existing = artists[0] as any;

      const items = Array.isArray(existing[category]) ? [...existing[category]] : [];
      const idx = items.findIndex((it: any) => it?.id === itemId);
      if (idx < 0) return ctx.notFound(`Item ${itemId} introuvable dans ${category} de ${slug}`);

      items[idx] = { ...items[idx], ...patch };

      await strapi.documents('api::artist.artist').update({
        documentId: existing.documentId,
        data: { [category]: items } as any,
        status: 'published',
      });

      strapi.log.info(`[god-mode] ${slug}.${category}[${itemId}] patch: ${Object.keys(patch).join(', ')}`);

      const cacheResult = await invalidateArtistCache(slug, strapi.log);
      ctx.body = { success: true, data: items[idx], cacheInvalidation: cacheResult };
    } catch (err: any) {
      strapi.log.error('adminUpdateItem error:', err);
      ctx.throw(500, err.message);
    }
  },

  /**
   * POST /admin/artists-item/:slug/:itemId/private-sale
   *
   * Activation atomique d'une vente privee sur une oeuvre (print ou sticker).
   * Une seule requete = un seul clic admin :
   *   1. valide clientEmail + basePrice
   *   2. genere un privateToken cryptographique si absent (32 hex chars)
   *   3. patche l'item avec { private: true, clientEmail, basePrice,
   *      allowCustomPrice, privateToken, privateSaleActivatedAt }
   *   4. envoie le courriel tutoriel au client + notif admin (buildPrivatePrintHtml)
   *   5. retourne { token, clientLink, emailSent }
   *
   * Body : { clientEmail: string, basePrice: number, allowCustomPrice?: boolean,
   *          category?: 'prints'|'stickers' (default 'prints') }
   *
   * Idempotence : si l'item a deja un privateToken, on le reutilise (on ne
   * casse pas les liens deja envoyes). Les autres champs sont ecrases par la
   * nouvelle saisie admin. L'email est TOUJOURS renvoye (permet de re-trigger
   * l'envoi sans separate endpoint).
   */
  async activatePrivateSale(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { slug, itemId } = ctx.params;
    const body = (ctx.request.body as any) || {};
    const category = body.category === 'stickers' ? 'stickers' : 'prints';
    const clientEmail = String(body.clientEmail || '').trim().toLowerCase();
    const basePrice = Number(body.basePrice);
    const allowCustomPrice = !!body.allowCustomPrice;

    if (!slug || !itemId) return ctx.badRequest('slug et itemId requis');
    if (!clientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      return ctx.badRequest('clientEmail invalide');
    }
    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      return ctx.badRequest('basePrice doit etre un nombre > 0');
    }

    try {
      const artists = await strapi.documents('api::artist.artist').findMany({
        filters: { slug: { $eq: slug } } as any,
        limit: 1,
      });
      if (!artists || artists.length === 0) return ctx.notFound(`Artiste ${slug} introuvable`);
      const artist = artists[0] as any;

      const items = Array.isArray(artist[category]) ? [...artist[category]] : [];
      const idx = items.findIndex((it: any) => it?.id === itemId);
      if (idx < 0) return ctx.notFound(`Item ${itemId} introuvable dans ${category} de ${slug}`);

      const target = items[idx];
      if (target.sold) return ctx.badRequest('Cette oeuvre a deja ete vendue');

      // Conserve le token existant si deja cree (evite de casser un lien deja envoye).
      // Sinon genere un nouveau token cryptographique (32 hex chars = 16 bytes).
      const privateToken = target.privateToken && typeof target.privateToken === 'string' && target.privateToken.length >= 16
        ? target.privateToken
        : crypto.randomBytes(16).toString('hex');

      items[idx] = {
        ...target,
        private: true,
        clientEmail,
        basePrice,
        allowCustomPrice,
        privateToken,
        privateSaleActivatedAt: target.privateSaleActivatedAt || new Date().toISOString(),
      };

      await strapi.documents('api::artist.artist').update({
        documentId: artist.documentId,
        data: { [category]: items } as any,
        status: 'published',
      });

      strapi.log.info(`[private-sale] Activated ${slug}.${category}[${itemId}] -> ${clientEmail} (base=${basePrice}$, custom=${allowCustomPrice})`);

      const clientLink = `https://massivemedias.com/vente-privee/${privateToken}`;

      // Envoi courriel tutoriel au client + notif admin (non-bloquant : en cas
      // d'echec de l'email, la vente reste activee, l'admin peut re-trigger via
      // le bouton "Renvoyer" dans AdminOrders).
      let emailSent = false;
      try {
        emailSent = await sendPrivatePrintEmail({
          clientEmail,
          artistName: artist.name,
          printTitle: items[idx].titleFr || items[idx].titleEn || items[idx].title || 'Oeuvre',
          printImage: items[idx].fullImage || items[idx].image || '',
          buyLink: clientLink,
          price: null, // on n'utilise plus le champ price historique, on passe par basePrice
          basePrice,
          allowCustomPrice,
        });
      } catch (emailErr: any) {
        strapi.log.warn(`[private-sale] Email envoi echec (vente quand meme activee):`, emailErr?.message);
      }

      // Invalide le cache pour que /vente-privee/:token retourne le nouvel etat tout de suite
      const cacheResult = await invalidateArtistCache(slug, strapi.log);

      ctx.body = {
        success: true,
        data: {
          artistSlug: slug,
          itemId,
          token: privateToken,
          clientLink,
          clientEmail,
          basePrice,
          allowCustomPrice,
          emailSent,
        },
        cacheInvalidation: cacheResult,
      };
    } catch (err: any) {
      strapi.log.error('[private-sale] activatePrivateSale error:', err);
      ctx.throw(500, err?.message || 'Erreur activation vente privee');
    }
  },

  // DELETE /admin/artists-item/:slug/:itemId?category=prints|stickers
  // Hard delete d'une oeuvre + nettoyage des images Supabase associees.
  async adminDeleteItem(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { slug, itemId } = ctx.params;
    if (!slug || !itemId) return ctx.badRequest('slug et itemId requis');
    const category = (ctx.query.category as string) === 'stickers' ? 'stickers' : 'prints';

    try {
      const artists = await strapi.documents('api::artist.artist').findMany({
        filters: { slug: { $eq: slug } } as any,
        limit: 1,
      });
      if (!artists || artists.length === 0) return ctx.notFound(`Artiste ${slug} introuvable`);
      const existing = artists[0] as any;

      const items = Array.isArray(existing[category]) ? [...existing[category]] : [];
      const target = items.find((it: any) => it?.id === itemId);
      if (!target) return ctx.notFound(`Item ${itemId} introuvable dans ${category} de ${slug}`);

      // Nettoyage images Supabase (les images locales /images/... sont preservees).
      // On tente best-effort - les erreurs ne bloquent pas la suppression DB.
      const urlsToClean = [target.image, target.fullImage, target.thumbImage].filter(Boolean);
      for (const url of urlsToClean) {
        if (typeof url === 'string' && url.includes('supabase')) {
          try {
            await deleteFromSupabase(url);
            strapi.log.info(`[god-mode] Image supprimee de Supabase: ${url}`);
          } catch (cleanupErr: any) {
            strapi.log.warn(`[god-mode] Echec nettoyage ${url}: ${cleanupErr?.message}`);
          }
        }
      }

      const filtered = items.filter((it: any) => it?.id !== itemId);

      await strapi.documents('api::artist.artist').update({
        documentId: existing.documentId,
        data: { [category]: filtered } as any,
        status: 'published',
      });

      strapi.log.info(`[god-mode] ${slug}.${category}: item ${itemId} supprime definitivement`);

      const cacheResult = await invalidateArtistCache(slug, strapi.log);
      ctx.body = {
        success: true,
        data: { deletedId: itemId, remainingCount: filtered.length },
        cacheInvalidation: cacheResult,
      };
    } catch (err: any) {
      strapi.log.error('adminDeleteItem error:', err);
      ctx.throw(500, err.message);
    }
  },
}));
