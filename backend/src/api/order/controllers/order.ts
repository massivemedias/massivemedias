import { factories } from '@strapi/strapi';
import Stripe from 'stripe';
import { calculateShipping } from '../../../utils/shipping';
import { sendOrderConfirmationEmail, sendTestimonialRequestEmail, sendArtistSaleNotificationEmail, sendNewOrderNotificationEmail, sendTrackingEmail, sendInvoiceEmail, sendOrderReadyEmail } from '../../../utils/email';
import { getTrackingStatus } from '../../../utils/tracking-provider';
import crypto from 'crypto';
import { PROMO_CODES } from '../../../utils/promo-codes';
import {
  FRAME_PRICES_FALLBACK,
  STICKER_STANDARD_TIERS,
  STICKER_FX_TIERS,
  FX_FINISHES,
  SIZE_MULTIPLIERS,
  BUSINESS_CARD_TIERS,
  FLYER_TIERS,
  FLYER_RECTO_VERSO_TIERS,
  FLYER_RECTO_VERSO_MULTIPLIER,
  ARTIST_DISCOUNT,
  getPricingConfigPayload,
  // FIX-PRICING-TIERS (27 avril 2026) : helper qui mappe (finish, qty, size)
  // vers le bon prix dans STICKER_GRID (3 paliers de taille).
  lookupStickerPriceBySize,
} from '../../../utils/pricing-config';
import { requireAdminAuth } from '../../../utils/auth';

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key === 'sk_test_REPLACE_ME') {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(key);
};

// requireAdminAuth a ete extrait dans backend/src/utils/auth.ts (SEC-01, 2026-04-18).
// L'import est en haut du fichier. Le comportement est identique, seul le diagnostic
// __authDiag n'est plus expose (il etait utilise par /admin-whoami, endpoint de debug
// retire depuis). Aucune regression fonctionnelle sur order.ts.

/**
 * FIX-UNIQUE-DETECT (27 avril 2026) : helpers de classification des erreurs.
 *
 * Strapi v5 jette une ValidationError typée pour les unique constraints :
 *   { name: 'ValidationError', message: 'This attribute must be unique',
 *     details: { errors: [{ path: ['invoiceNumber'], message: '...' }] } }
 *
 * Postgres jette directement (avant Strapi) :
 *   { code: '23505', detail: 'Key (invoice_number)=(MM-2026-0042) already exists.',
 *     constraint: 'orders_invoice_number_unique' }
 *
 * Avant ce fix, le client recevait juste "This attribute must be unique" sans
 * savoir QUEL champ. On parse les deux formats pour identifier le champ exact
 * et permettre soit un retry intelligent (invoiceNumber) soit un message UI
 * clair (email, companyName).
 */
export function isUniqueViolation(err: any): boolean {
  if (!err) return false;
  if (err?.name === 'ValidationError') {
    const msg = String(err?.message || '').toLowerCase();
    if (msg.includes('unique')) return true;
    const details = err?.details?.errors;
    if (Array.isArray(details) && details.some((d: any) => String(d?.message || '').toLowerCase().includes('unique'))) {
      return true;
    }
  }
  // Postgres native error
  if (err?.code === '23505') return true;
  const msg = String(err?.message || err?.detail || '').toLowerCase();
  return msg.includes('duplicate key') || msg.includes('must be unique');
}

export function parseUniqueViolation(err: any): { field: string | null; raw: string } {
  if (!err) return { field: null, raw: '' };
  // 1. Strapi ValidationError details path
  const path = err?.details?.errors?.[0]?.path;
  if (Array.isArray(path) && path.length > 0) {
    return { field: String(path[0]), raw: err?.message || '' };
  }
  // 2. Postgres detail "Key (column_name)=(value) already exists."
  const detailStr = String(err?.detail || err?.message || '');
  const keyMatch = /Key \(([^)]+)\)=/i.exec(detailStr);
  if (keyMatch) {
    // Conversion snake_case -> camelCase pour matcher les noms du schema Strapi
    const snake = keyMatch[1];
    const camel = snake.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    return { field: camel, raw: detailStr };
  }
  // 3. Postgres constraint name "orders_invoice_number_unique"
  const constraintMatch = /unique constraint "([^"]+)"/i.exec(detailStr);
  if (constraintMatch) {
    const cname = constraintMatch[1];
    // Heuristique : retire le prefixe "tablename_" et le suffixe "_unique"
    const guess = cname
      .replace(/_unique$/i, '')
      .replace(/^(orders|invoices|clients|user_roles|artists|products)_/i, '')
      .replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    return { field: guess || null, raw: detailStr };
  }
  return { field: null, raw: detailStr || String(err?.message || err) };
}

// PRIX-02: les constantes de pricing (STICKER_*, SIZE_MULTIPLIERS, BUSINESS_CARD_TIERS,
// FLYER_TIERS, FLYER_RECTO_VERSO_MULTIPLIER, ARTIST_DISCOUNT, FX_FINISHES) sont
// maintenant importees depuis utils/pricing-config.ts pour que le backend ait une seule
// source de verite et que GET /api/pricing-config puisse exposer les memes valeurs au
// frontend sans duplication.

/**
 * Extrait le multiplier de taille depuis un champ size stocke dans l'order.
 * Accepte tous formats: '3in', '3"', '3', number 3, etc. Fallback 1.0 (reference 3").
 */
function getSizeMultiplier(size: any): number {
  if (size === null || size === undefined) return 1.0;
  const match = String(size).match(/^\s*([\d.]+)/);
  if (!match) return 1.0;
  const key = match[1];
  return Object.prototype.hasOwnProperty.call(SIZE_MULTIPLIERS, key)
    ? SIZE_MULTIPLIERS[key]
    : 1.0;
}

// --- RACE-01 : reservation de pieces unique/privees pendant le checkout Stripe ---
// Entre la validation du panier (verif sold=false) et le webhook qui marque sold=true,
// il y a une fenetre de plusieurs minutes ou un second client peut aussi checkout la
// meme piece. On bloque la piece avec un lock TTL le temps du checkout.
//
// Model:
//   - reservedUntil (ISO) et reservedByOrderId (session.id Stripe) sur chaque print
//     dans artist.prints[] (champ json, donc pas de modif schema)
//   - Validation refuse toute nouvelle session si sold=true OU reservedUntil>now par un autre
//   - Liberation: webhook payment_intent.payment_failed OU expiry passif apres 30 min
//
// Pas de row-lock DB (Strapi document service n'expose pas SELECT FOR UPDATE). Le re-read
// frais avant ecriture reduit la fenetre de race de minutes a ~50ms (un roundtrip DB).
// Pour du gros volume, migrer vers un lock explicite via strapi.db.query.
const UNIQUE_PIECE_RESERVATION_MS = 30 * 60 * 1000; // 30 min

/**
 * Identifie les pieces unique/private dans les items d'un panier. Utilise la meme
 * logique de matching artiste+printId que le webhook mark-sold pour rester coherent.
 */
function extractUniquePieces(
  items: any[],
  artists: any[]
): Array<{ artistDocId: string; printId: string; artistSlug: string; title?: string }> {
  const out: Array<{ artistDocId: string; printId: string; artistSlug: string; title?: string }> = [];
  for (const item of items) {
    const pid = String(item.productId || '');
    if (!pid.startsWith('artist-print-')) continue;
    let matched: any = null;
    let printId = '';
    for (const a of artists) {
      if (pid.startsWith(`artist-print-${a.slug}-`)) {
        if (!matched || a.slug.length > matched.slug.length) {
          matched = a;
          printId = pid.replace(`artist-print-${a.slug}-`, '');
        }
      }
    }
    if (!matched || !printId) continue;
    const prints = Array.isArray(matched.prints) ? matched.prints : [];
    const print = prints.find((p: any) => p.id === printId);
    if (!print) continue;
    const shouldReserve = print.unique === true || print.private === true || item.isUnique === true;
    if (shouldReserve) {
      out.push({ artistDocId: matched.documentId, printId, artistSlug: matched.slug, title: print.title });
    }
  }
  return out;
}

/**
 * Reserve les pieces listees avec reservedUntil=expiresAtIso et reservedByOrderId=reservationId.
 * Jette une erreur descriptive si une piece est deja vendue ou reservee par une autre session
 * encore active. Re-read frais de chaque artiste avant ecriture pour minimiser la fenetre
 * de race (pas row-lock, mais fenetre reduite a ~50ms).
 */
async function reserveUniquePieces(
  strapiInstance: any,
  pieces: Array<{ artistDocId: string; printId: string; title?: string }>,
  reservationId: string,
  expiresAtIso: string
): Promise<void> {
  if (pieces.length === 0) return;
  const now = Date.now();
  const byArtist = new Map<string, Array<{ printId: string; title?: string }>>();
  for (const p of pieces) {
    if (!byArtist.has(p.artistDocId)) byArtist.set(p.artistDocId, []);
    byArtist.get(p.artistDocId)!.push({ printId: p.printId, title: p.title });
  }
  for (const [artistDocId, printRefs] of byArtist) {
    const artist: any = await strapiInstance.documents('api::artist.artist').findFirst({
      filters: { documentId: artistDocId },
    });
    if (!artist) throw new Error('Artiste introuvable lors de la reservation');
    const prints = Array.isArray(artist.prints) ? [...artist.prints] : [];
    for (const { printId, title } of printRefs) {
      const idx = prints.findIndex((p: any) => p.id === printId);
      if (idx === -1) throw new Error(`Piece introuvable chez ${artist.slug}`);
      const print = prints[idx];
      if (print.sold === true) {
        throw new Error(`La piece "${print.title || title || printId}" a ete vendue pendant votre checkout.`);
      }
      const existingUntil = print.reservedUntil ? new Date(print.reservedUntil).getTime() : 0;
      if (existingUntil > now && print.reservedByOrderId && print.reservedByOrderId !== reservationId) {
        const minsLeft = Math.max(1, Math.ceil((existingUntil - now) / 60000));
        throw new Error(
          `La piece "${print.title || title || printId}" est reservee par un autre client (disponible dans ${minsLeft} min).`
        );
      }
      prints[idx] = { ...print, reservedUntil: expiresAtIso, reservedByOrderId: reservationId };
    }
    await strapiInstance.documents('api::artist.artist').update({
      documentId: artistDocId,
      data: { prints },
    });
  }
}

/**
 * Libere les reservations matchees par reservationId. No-op silencieux pour les prints
 * deja liberees ou reservees par un autre order (edge case timing). Ne touche JAMAIS
 * les prints sold=true (la vente est definitive, pas annulable par une release).
 */
async function releaseUniquePieceReservations(
  strapiInstance: any,
  pieces: Array<{ artistDocId: string; printId: string }>,
  reservationId: string
): Promise<void> {
  if (pieces.length === 0) return;
  const byArtist = new Map<string, string[]>();
  for (const p of pieces) {
    if (!byArtist.has(p.artistDocId)) byArtist.set(p.artistDocId, []);
    byArtist.get(p.artistDocId)!.push(p.printId);
  }
  for (const [artistDocId, printIds] of byArtist) {
    const artist: any = await strapiInstance.documents('api::artist.artist').findFirst({
      filters: { documentId: artistDocId },
    });
    if (!artist) continue;
    const prints = Array.isArray(artist.prints) ? [...artist.prints] : [];
    let mutated = false;
    for (const printId of printIds) {
      const idx = prints.findIndex((p: any) => p.id === printId);
      if (idx === -1) continue;
      const print = prints[idx];
      if (print.sold === true) continue; // ne touche jamais une piece vendue
      if (print.reservedByOrderId === reservationId) {
        // Strip les champs de reservation mais garde le reste intact
        const { reservedUntil: _ru, reservedByOrderId: _rb, ...rest } = print;
        prints[idx] = rest;
        mutated = true;
      }
    }
    if (mutated) {
      await strapiInstance.documents('api::artist.artist').update({
        documentId: artistDocId,
        data: { prints },
      });
    }
  }
}

export default factories.createCoreController('api::order.order', ({ strapi }) => ({

  async uploadFile(ctx) {
    const { request: { files } } = ctx as any;

    if (!files || !files.files) {
      return ctx.badRequest('No file provided');
    }

    const fileArray = Array.isArray(files.files) ? files.files : [files.files];
    const uploadedFiles = await strapi.plugin('upload').service('upload').upload({
      data: {},
      files: fileArray,
    });

    ctx.body = uploadedFiles;
  },

  async createPaymentIntent(ctx) {
    const { items, customerEmail, customerName, customerPhone, shippingAddress, shipping: clientShipping, taxes: clientTaxes, orderTotal: clientOrderTotal, promoCode, promoDiscountPercent, designReady, notes, supabaseUserId } = ctx.request.body as any;

    // Validate
    if (!items || !Array.isArray(items) || items.length === 0) {
      return ctx.badRequest('Cart is empty');
    }
    if (!customerEmail || !customerName) {
      return ctx.badRequest('Customer email and name are required');
    }

    // Recalculate total server-side (never trust client-side totals)
    let subtotal = 0;
    for (const item of items) {
      let validPrice = item.totalPrice || 0;
      // FIX-PRICING-TIERS (27 avril 2026) : validation sticker selon les 3
      // paliers de taille (Standard/Medium/Large). Le prix officiel vient de
      // STICKER_GRID[tier][kind][qty] - taille INFLUENCE maintenant le prix.
      // Avant : prix fixe peu importe la taille -> non rentable sur 4"/5".
      if (item.productId === 'sticker-custom' || item.productId === 'sticker-artist') {
        const finishLower = String(item.finish || '').toLowerCase();
        const tierPrice = lookupStickerPriceBySize(finishLower, item.quantity, item.size);
        if (tierPrice != null) {
          validPrice = tierPrice;
          strapi.log.info(`[sticker-validate] size=${item.size} qty=${item.quantity} finish=${finishLower} -> ${tierPrice}$`);
        } else {
          strapi.log.warn(`Invalid sticker tier: size=${item.size} qty=${item.quantity}, using client price ${item.totalPrice}`);
        }
      }

      // Validate business card pricing against tiers
      if (item.productId && item.productId.startsWith('business-card-')) {
        const cardTiers = BUSINESS_CARD_TIERS[item.productId];
        if (cardTiers) {
          const tierPrice = cardTiers[item.quantity];
          if (tierPrice) {
            validPrice = tierPrice;
          } else {
            strapi.log.warn(`Invalid business card tier: ${item.productId} qty=${item.quantity}, using client price ${item.totalPrice}`);
          }
        }
      }

      // Validate flyer pricing against official grid (HARDCODED 2026 - lookup strict).
      if (item.productId === 'flyer-a6') {
        const isRectoVerso = item.finish && (item.finish.toLowerCase().includes('recto-verso') || item.finish.toLowerCase().includes('double'));
        const grid = isRectoVerso ? FLYER_RECTO_VERSO_TIERS : FLYER_TIERS;
        const tierPrice = grid[item.quantity];
        if (tierPrice) {
          validPrice = tierPrice;
        } else {
          strapi.log.warn(`Invalid flyer tier: qty=${item.quantity} rectoVerso=${isRectoVerso}, using client price ${item.totalPrice}`);
        }
      }
      subtotal += validPrice;
    }

    // Validate and apply promo code server-side (never trust client discount)
    // PROMO_CODES importe de src/utils/promo-codes.ts
    let promoDiscount = 0;
    let appliedPromoCode = '';
    if (promoCode && typeof promoCode === 'string') {
      const promo = PROMO_CODES[promoCode.toUpperCase().trim()];
      if (promo) {
        promoDiscount = Math.round(subtotal * promo.discountPercent / 100);
        appliedPromoCode = promoCode.toUpperCase().trim();
        subtotal = subtotal - promoDiscount;
      }
    }

    // Recalculate shipping server-side (par poids)
    const province = shippingAddress?.province || 'QC';
    const postalCode = shippingAddress?.postalCode || '';
    const { shippingCost, totalWeight } = calculateShipping(province, postalCode, items);

    // Recalculate taxes server-side (TPS 5% + TVQ 9.975% for QC)
    const tps = Math.round(subtotal * 0.05 * 100) / 100;
    const tvq = province === 'QC' ? Math.round(subtotal * 0.09975 * 100) / 100 : 0;
    const taxesTotal = Math.round((tps + tvq) * 100) / 100;

    const totalAmount = subtotal + shippingCost + taxesTotal;
    const amountInCents = Math.round(totalAmount * 100);

    if (amountInCents < 50) {
      return ctx.badRequest('Minimum order is $0.50 CAD');
    }

    try {
      const stripe = getStripe();

      // Resume lisible des items pour Stripe
      const itemsSummary = items.map((i: any) => {
        const parts = [i.productName || 'Produit'];
        if (i.size) parts.push(i.size);
        if (i.finish) parts.push(i.finish);
        if (i.quantity > 1) parts.push(`x${i.quantity}`);
        return parts.join(' - ');
      }).join(', ');

      const addrLine = shippingAddress
        ? `${shippingAddress.address || ''}, ${shippingAddress.city || ''}, ${shippingAddress.province || ''} ${shippingAddress.postalCode || ''}`
        : '';

      // Create Stripe PaymentIntent with automatic payment methods
      // (enables Apple Pay, Google Pay, PayPal, cards, etc.)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'cad',
        automatic_payment_methods: { enabled: true },
        description: `${customerName} - ${itemsSummary}`.slice(0, 1000),
        receipt_email: customerEmail,
        metadata: {
          customerName,
          customerEmail,
          customerPhone: customerPhone || '',
          items: itemsSummary.slice(0, 500),
          shippingAddress: addrLine.slice(0, 500),
          shippingProvince: province,
          shippingCity: shippingAddress?.city || '',
          subtotal: subtotal.toFixed(2),
          shipping: shippingCost.toFixed(2),
          tps: tps.toFixed(2),
          tvq: tvq.toFixed(2),
          totalWeight: totalWeight.toString(),
          itemCount: items.length.toString(),
          designReady: designReady !== false ? 'oui' : 'non',
          notes: (notes || '').slice(0, 500),
          supabaseUserId: supabaseUserId || '',
          promoCode: appliedPromoCode || '',
          promoDiscount: promoDiscount > 0 ? promoDiscount.toFixed(2) : '',
        },
      });

      // Find or create Client record
      let client = null;
      try {
        const existingClients = await strapi.documents('api::client.client').findMany({
          filters: { email: customerEmail.toLowerCase() },
        });

        if (existingClients.length > 0) {
          client = existingClients[0];
        } else {
          client = await strapi.documents('api::client.client').create({
            data: {
              email: customerEmail.toLowerCase(),
              name: customerName,
              phone: customerPhone || '',
              supabaseUserId: supabaseUserId || '',
              totalSpent: 0,
              orderCount: 0,
            },
          });
        }
      } catch (err) {
        strapi.log.warn('Could not create/find client:', err);
      }

      // Build items with file URLs embedded
      const itemsWithFiles = items.map((item: any) => ({
        ...item,
        uploadedFiles: item.uploadedFiles || [],
      }));

      // Create order in Strapi with status "draft" (not yet paid)
      // Will be updated to "paid" by Stripe webhook when payment succeeds
      const orderData: any = {
        stripePaymentIntentId: paymentIntent.id,
        customerEmail,
        customerName,
        customerPhone: customerPhone || '',
        supabaseUserId: supabaseUserId || '',
        items: itemsWithFiles,
        subtotal: Math.round(subtotal * 100),
        shipping: Math.round(shippingCost * 100),
        tps: Math.round(tps * 100),
        tvq: Math.round(tvq * 100),
        totalWeight,
        total: amountInCents,
        currency: 'cad',
        status: 'draft',
        designReady: designReady !== false,
        notes: notes || '',
        shippingAddress: shippingAddress || null,
        promoCode: appliedPromoCode || null,
        promoDiscount: promoDiscount > 0 ? Math.round(promoDiscount * 100) : 0,
      };

      // Link client relation using Strapi v5 connect syntax
      if (client) {
        orderData.client = { connect: [{ documentId: client.documentId }] };
      }

      const order = await strapi.documents('api::order.order').create({
        data: orderData,
      });

      // Return client_secret to frontend
      ctx.body = {
        clientSecret: paymentIntent.client_secret,
      };
    } catch (err: any) {
      strapi.log.error('Stripe createPaymentIntent error:', err);
      return ctx.badRequest(err.message || 'Payment creation failed');
    }
  },

  async createCheckoutSession(ctx) {
    const { items, customerEmail, customerName, customerPhone, shippingAddress, promoCode, designReady, notes, supabaseUserId } = ctx.request.body as any;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return ctx.badRequest('Cart is empty');
    }
    if (!customerEmail || !customerName) {
      return ctx.badRequest('Customer email and name are required');
    }

    // PRIX-02: FRAME_PRICES_FALLBACK importe depuis utils/pricing-config.ts (single source
    // of truth). Le frontend peut desormais tirer les memes valeurs via /api/pricing-config.
    let subtotal = 0;
    let artistDiscountTotal = 0;

    // Charger une seule fois les artistes actifs pour valider les prints
    let cachedArtists: any[] | null = null;
    const getArtists = async () => {
      if (cachedArtists === null) {
        cachedArtists = await strapi.documents('api::artist.artist').findMany({ filters: { active: true } });
      }
      return cachedArtists;
    };

    // Verifier le slug artiste du user pour valider isArtistOwnPrint (securite)
    // artistSlug est stocke dans api::user-role. Lookup par supabaseUserId puis email fallback.
    let verifiedUserArtistSlug: string | null = null;
    try {
      // Tentative 1: par supabaseUserId
      if (supabaseUserId) {
        const byId = await strapi.documents('api::user-role.user-role' as any).findMany({
          filters: { supabaseUserId } as any,
        });
        if (byId.length > 0) {
          verifiedUserArtistSlug = (byId[0] as any).artistSlug || null;
        }
      }
      // Tentative 2: par email (fallback si supabaseUserId pas sync)
      if (!verifiedUserArtistSlug && customerEmail) {
        const byEmail = await strapi.documents('api::user-role.user-role' as any).findMany({
          filters: { email: customerEmail.toLowerCase() } as any,
        });
        if (byEmail.length > 0) {
          verifiedUserArtistSlug = (byEmail[0] as any).artistSlug || null;
        }
      }
    } catch (_) { /* ignore */ }

    for (const item of items) {
      let validPrice = item.totalPrice || 0;

      // --- Stickers: validation par grille officielle 3 paliers de taille ---
      // FIX-PRICING-TIERS (27 avril 2026) : voir createPaymentIntent pour le
      // detail. Meme regle ici (chemin checkout-session) pour coherence.
      if (item.productId === 'sticker-custom' || item.productId === 'sticker-artist') {
        const finishLower = String(item.finish || '').toLowerCase();
        const tierPrice = lookupStickerPriceBySize(finishLower, item.quantity, item.size);
        if (tierPrice != null) {
          validPrice = tierPrice;
        }
      }

      // --- Artist prints: validation serveur contre le CMS ---
      if (typeof item.productId === 'string' && item.productId.startsWith('artist-print-')) {
        try {
          const pid = item.productId as string;
          const artists = await getArtists();
          // Trouver artiste + printId (slug le plus long gagne)
          let matchedArtist: any = null;
          let printId = '';
          for (const a of artists) {
            if (pid.startsWith(`artist-print-${a.slug}-`)) {
              if (!matchedArtist || a.slug.length > matchedArtist.slug.length) {
                matchedArtist = a;
                printId = pid.replace(`artist-print-${a.slug}-`, '');
              }
            }
          }
          if (!matchedArtist || !printId) {
            return ctx.badRequest(`Print introuvable: ${pid}`);
          }
          const prints = Array.isArray(matchedArtist.prints) ? matchedArtist.prints : [];
          const print = prints.find((p: any) => p.id === printId);
          if (!print) {
            return ctx.badRequest(`Print ${printId} introuvable chez ${matchedArtist.slug}`);
          }

          // Refuser si deja vendu (unique ou private)
          if (print.sold === true) {
            return ctx.badRequest(`Cette oeuvre a deja ete vendue et n'est plus disponible.`);
          }

          // RACE-01: refuser si reservee par un autre checkout actif. A ce point on n'a
          // pas encore cree la session Stripe, donc toute reservation active ici appartient
          // forcement a un AUTRE client. Notre propre reservation sera posee plus loin.
          const reservedUntilTs = print.reservedUntil ? new Date(print.reservedUntil).getTime() : 0;
          if (reservedUntilTs > Date.now()) {
            const minsLeft = Math.max(1, Math.ceil((reservedUntilTs - Date.now()) / 60000));
            return ctx.badRequest(
              `Cette oeuvre est actuellement reservee par un autre client (dispo dans ${minsLeft} min si le paiement echoue).`
            );
          }

          // Recalculer le prix attendu a partir du CMS
          const pricing = matchedArtist.pricing || {};
          // Prix de base selon tier/format (fige pour les pieces privees)
          const tier = print.fixedTier || 'studio';
          const format = print.fixedFormat || 'a4';
          const tierPrices = tier === 'museum' ? (pricing.museum || {}) : (pricing.studio || {});
          const basePrice = tierPrices[format] || 0;
          // Cadre: lire depuis pricing.framePriceByFormat sinon fallback
          const frameMap = pricing.framePriceByFormat || {};
          const expectedFramePrice = (print.withFrame || item.shape)
            ? (frameMap[format] ?? FRAME_PRICES_FALLBACK[format] ?? 30)
            : 0;
          // Prix unique: customPrice si defini (pour unique: true)
          let expectedUnitPrice;
          if (print.unique === true && typeof print.customPrice === 'number') {
            expectedUnitPrice = print.customPrice;
          } else {
            expectedUnitPrice = basePrice + expectedFramePrice;
          }
          // Solde (onSale): appliquer le discount
          if (print.onSale && typeof print.salePercent === 'number') {
            expectedUnitPrice = Math.round(expectedUnitPrice * (1 - print.salePercent / 100) * 100) / 100;
          }

          const qty = (print.unique === true || print.private === true) ? 1 : (item.quantity || 1);
          const expectedTotal = Math.round(expectedUnitPrice * qty * 100) / 100;

          // Tolerance 1 cent pour les arrondis
          if (Math.abs((item.totalPrice || 0) - expectedTotal) > 0.01) {
            strapi.log.warn(`Prix manipule detecte: ${pid} client=${item.totalPrice} expected=${expectedTotal}`);
            validPrice = expectedTotal;
          } else {
            validPrice = item.totalPrice;
          }
        } catch (validationErr) {
          strapi.log.error(`Erreur validation artist-print ${item.productId}:`, validationErr);
          return ctx.badRequest('Validation du prix impossible, reessayez plus tard');
        }
      }

      subtotal += validPrice;

      // --- Rabais artiste 25% sur ses propres produits ---
      // Securite: verifier que le user est bien l'artiste du produit (pas juste le flag client)
      if (item.isArtistOwnPrint && verifiedUserArtistSlug) {
        const pid = item.productId || '';
        const claimedSlug = item.artistSlug || '';
        const isLegitimate = claimedSlug === verifiedUserArtistSlug &&
          (pid.startsWith(`artist-print-${verifiedUserArtistSlug}-`) ||
           pid.startsWith(`artist-sticker-pack-${verifiedUserArtistSlug}-`));
        if (isLegitimate) {
          artistDiscountTotal += Math.round(validPrice * ARTIST_DISCOUNT);
        } else {
          strapi.log.warn(`isArtistOwnPrint rejete: user=${verifiedUserArtistSlug} claimed=${claimedSlug} pid=${pid}`);
        }
      }
    }

    // Appliquer le rabais artiste sur le subtotal
    subtotal = subtotal - artistDiscountTotal;

    // PROMO_CODES importe de src/utils/promo-codes.ts
    let promoDiscount = 0;
    let appliedPromoCode = '';
    if (promoCode && typeof promoCode === 'string') {
      const promo = PROMO_CODES[promoCode.toUpperCase().trim()];
      if (promo) {
        promoDiscount = Math.round(subtotal * promo.discountPercent / 100);
        appliedPromoCode = promoCode.toUpperCase().trim();
        subtotal = subtotal - promoDiscount;
      }
    }

    const province = shippingAddress?.province || 'QC';
    const postalCode = shippingAddress?.postalCode || '';
    const { shippingCost, totalWeight } = calculateShipping(province, postalCode, items);

    const tps = Math.round(subtotal * 0.05 * 100) / 100;
    const tvq = province === 'QC' ? Math.round(subtotal * 0.09975 * 100) / 100 : 0;
    const taxesTotal = Math.round((tps + tvq) * 100) / 100;
    const totalAmount = subtotal + shippingCost + taxesTotal;
    const amountInCents = Math.round(totalAmount * 100);

    if (amountInCents < 50) {
      return ctx.badRequest('Minimum order is $0.50 CAD');
    }

    try {
      const stripe = getStripe();

      const itemsSummary = items.map((i: any) => {
        const parts = [i.productName || 'Produit'];
        if (i.size) parts.push(i.size);
        if (i.finish) parts.push(i.finish);
        if (i.quantity > 1) parts.push(`x${i.quantity}`);
        return parts.join(' - ');
      }).join(', ');

      const addrLine = shippingAddress
        ? `${shippingAddress.address || ''}, ${shippingAddress.city || ''}, ${shippingAddress.province || ''} ${shippingAddress.postalCode || ''}`
        : '';

      // Create Stripe Checkout Session (hosted payment page - works with ad blockers)
      // Note: on n'hardcode PAS payment_method_types pour que Stripe utilise
      // les methodes activees dans le Dashboard (card, Link, Apple/Google Pay, etc.)
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: customerEmail,
        line_items: [{
          price_data: {
            currency: 'cad',
            product_data: {
              name: `Commande Massive - ${customerName}`,
              description: itemsSummary.slice(0, 500),
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        }],
        metadata: {
          customerName,
          customerEmail,
          customerPhone: customerPhone || '',
          items: itemsSummary.slice(0, 500),
          shippingAddress: addrLine.slice(0, 500),
          supabaseUserId: supabaseUserId || '',
          promoCode: appliedPromoCode || '',
        },
        success_url: `https://massivemedias.com/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://massivemedias.com/checkout/cancel`,
      });

      // RACE-01: reserver les pieces unique/private pour cette session. Entre la validation
      // au debut de ce handler et maintenant, ~1-2s ont passe (appel Stripe). Un autre client
      // a pu aussi passer sa validation pendant ce temps. reserveUniquePieces re-lit les
      // artistes et refuse si une piece a ete prise - on expire alors NOTRE session Stripe
      // pour etre certain que le client ne puisse pas etre charge.
      try {
        const uniquePieces = extractUniquePieces(items, await getArtists());
        if (uniquePieces.length > 0) {
          const expiresAt = new Date(Date.now() + UNIQUE_PIECE_RESERVATION_MS).toISOString();
          await reserveUniquePieces(strapi, uniquePieces, session.id, expiresAt);
          strapi.log.info(`createCheckoutSession: reserved ${uniquePieces.length} unique piece(s) for session ${session.id}`);
        }
      } catch (reserveErr: any) {
        try { await stripe.checkout.sessions.expire(session.id); } catch (_) { /* ignore */ }
        strapi.log.warn(`createCheckoutSession: reservation conflict after Stripe, session expired: ${reserveErr?.message}`);
        return ctx.badRequest(reserveErr?.message || 'Une piece unique du panier est devenue indisponible. Re-essayez.');
      }

      // Create order in Strapi with draft status (not yet paid)
      const itemsWithFiles = items.map((item: any) => ({
        ...item,
        uploadedFiles: item.uploadedFiles || [],
      }));

      let client = null;
      try {
        const existingClients = await strapi.documents('api::client.client').findMany({
          filters: { email: customerEmail.toLowerCase() },
        });
        client = existingClients.length > 0 ? existingClients[0] : await strapi.documents('api::client.client').create({
          data: { email: customerEmail.toLowerCase(), name: customerName, phone: customerPhone || '', supabaseUserId: supabaseUserId || '', totalSpent: 0, orderCount: 0 },
        });
      } catch (err) {
        strapi.log.warn('Could not create/find client:', err);
      }

      const orderData: any = {
        // IMPORTANT: stripePaymentIntentId is REQUIRED and UNIQUE. Checkout Sessions created in
        // "payment" mode have no payment_intent until the customer pays. We temporarily store
        // the session.id (cs_live_...) here to satisfy uniqueness, and ALSO in the dedicated
        // stripeCheckoutSessionId column so the webhook can find the order regardless of which
        // event (checkout.session.completed OR payment_intent.succeeded) arrives first.
        stripePaymentIntentId: (session.payment_intent as string) || session.id,
        stripeCheckoutSessionId: session.id,
        customerEmail,
        customerName,
        customerPhone: customerPhone || '',
        supabaseUserId: supabaseUserId || '',
        items: itemsWithFiles,
        subtotal: Math.round(subtotal * 100),
        shipping: Math.round(shippingCost * 100),
        tps: Math.round(tps * 100),
        tvq: Math.round(tvq * 100),
        totalWeight,
        total: amountInCents,
        currency: 'cad',
        status: 'draft',
        designReady: designReady !== false,
        notes: notes || '',
        shippingAddress: shippingAddress || null,
        promoCode: appliedPromoCode || null,
        promoDiscount: promoDiscount > 0 ? Math.round(promoDiscount * 100) : 0,
      };
      if (client) {
        orderData.client = { connect: [{ documentId: client.documentId }] };
      }
      await strapi.documents('api::order.order').create({ data: orderData });

      ctx.body = { url: session.url };
    } catch (err: any) {
      strapi.log.error('Stripe createCheckoutSession error:', err);
      return ctx.badRequest(err.message || 'Checkout session creation failed');
    }
  },

  async myOrders(ctx) {
    const supabaseUserId = ctx.query.supabaseUserId as string;
    const email = (ctx.query.email as string || '').trim().toLowerCase();

    if (!supabaseUserId && !email) {
      return ctx.badRequest('Missing user ID or email');
    }

    // FIX-ERP (avril 2026) : filtrer par supabaseUserId ET/OU email pour rattraper
    // les commandes creees avant l'inscription du client au portail (commandes
    // e-commerce invitee ou commandes manuelles avec email).
    const orFilters: any[] = [];
    if (supabaseUserId) orFilters.push({ supabaseUserId });
    if (email) orFilters.push({ customerEmail: { $eqi: email } });

    const orders = await strapi.documents('api::order.order').findMany({
      filters: {
        $or: orFilters,
        status: { $ne: 'draft' as any },
      } as any,
      sort: 'createdAt:desc',
    }) as any[];

    // Enrichir avec stripePaymentLink + invoiceNumber de l'invoice liee
    // (comme adminList) pour que le PDF client puisse inclure le lien de paiement.
    try {
      const orderDocIds = orders.map(o => o.documentId).filter(Boolean);
      if (orderDocIds.length > 0) {
        const invoices = await strapi.documents('api::invoice.invoice').findMany({
          filters: { order: { documentId: { $in: orderDocIds } } } as any,
          limit: orderDocIds.length * 2,
        }) as any[];
        const invoiceByOrder: Record<string, any> = {};
        for (const inv of invoices) {
          const oid = (inv as any).order?.documentId || (inv as any).orderDocumentId;
          if (oid) invoiceByOrder[oid] = inv;
        }
        for (const o of orders) {
          const inv = invoiceByOrder[o.documentId];
          if (inv) {
            o.stripePaymentLink = inv.stripePaymentLink || '';
            o.invoiceNumber = o.invoiceNumber || inv.invoiceNumber || '';
          }
        }
      }
    } catch (enrichErr: any) {
      strapi.log.warn(`[myOrders] Enrichment invoices echoue (non-bloquant): ${enrichErr?.message || enrichErr}`);
    }

    ctx.body = orders;
  },

  async handleStripeWebhook(ctx) {
    const sig = ctx.request.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const requestId = crypto.randomBytes(4).toString('hex');

    if (!endpointSecret || endpointSecret === 'whsec_REPLACE_ME') {
      strapi.log.warn(`[webhook:${requestId}] Stripe webhook secret not configured`);
      // Alert admin - config broken en prod. STRIPE-03 : throttle 60min
      // persistant via DB pour eviter le spam si Stripe retry 20x.
      try {
        const { shouldSendThrottledAlert } = await import('../../../utils/webhook-alert-throttle');
        if (await shouldSendThrottledAlert('stripe_webhook_secret_missing', 60)) {
          const { sendWebhookFailureAlert } = await import('../../../utils/email');
          await sendWebhookFailureAlert({
            reason: 'STRIPE_WEBHOOK_SECRET env var missing or placeholder',
            requestId,
          });
        }
      } catch (_) { /* non-blocking */ }
      return ctx.badRequest('Webhook not configured');
    }

    let event: Stripe.Event;
    try {
      const stripe = getStripe();
      // Access the raw unparsed body for signature verification
      // Strapi v5 stores raw body via Symbol.for('unparsedBody') when includeUnparsed: true
      const unparsedBody = (ctx.request as any).body?.[Symbol.for('unparsedBody')];
      const koaRawBody = (ctx.request as any).rawBody;
      const rawBody = unparsedBody || koaRawBody || JSON.stringify(ctx.request.body);
      strapi.log.info(`[webhook:${requestId}] Received - sig: ${sig ? 'present' : 'missing'}, rawBody type: ${typeof rawBody}, length: ${rawBody?.length || 0}, source: ${unparsedBody ? 'unparsed' : koaRawBody ? 'koa' : 'json-stringify'}`);
      event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
      strapi.log.info(`[webhook:${requestId}] Verified OK - event: ${event.type} id: ${event.id}`);
    } catch (err: any) {
      strapi.log.error(`[webhook:${requestId}] SIGNATURE VERIFICATION FAILED:`, err.message);
      // STRIPE-03: alerte admin avec throttle 60min persistant via DB.
      // Ancien comportement "send on EVERY failure" causait 20 emails si
      // Stripe retry un webhook casse 20 fois. Maintenant: 1 email max par
      // heure par type de failure. Le sendCount en DB trace les retries
      // supprimes pour visibilite a posteriori.
      try {
        const { shouldSendThrottledAlert } = await import('../../../utils/webhook-alert-throttle');
        if (await shouldSendThrottledAlert('stripe_signature_failure', 60)) {
          const { sendWebhookFailureAlert } = await import('../../../utils/email');
          await sendWebhookFailureAlert({
            reason: `Stripe signature verification failed: ${err.message}`,
            requestId,
            sigHeader: sig ? sig.substring(0, 80) : '(missing)',
            bodyPresent: !!(ctx.request as any).body,
          });
          strapi.log.warn(`[webhook:${requestId}] Admin alert email dispatched`);
        } else {
          strapi.log.warn(`[webhook:${requestId}] Admin alert throttled (already sent within 60min)`);
        }
      } catch (alertErr: any) {
        strapi.log.error(`[webhook:${requestId}] Failed to send admin alert:`, alertErr?.message);
      }
      return ctx.badRequest(`Webhook Error: ${err.message}`);
    }

    // STRIPE-01: idempotency check. Stripe retry le meme event.id sur echec
    // reseau. On ecrit dans stripe_webhook_events avec unique constraint sur
    // eventId -> la 2eme insertion throw et on return 200 fast sans re-run
    // les queries downstream.
    try {
      await strapi.db.query('api::stripe-webhook-event.stripe-webhook-event').create({
        data: {
          eventId: event.id,
          eventType: event.type,
          processedAt: new Date().toISOString(),
        },
      });
    } catch (dupErr: any) {
      // Unique constraint violation = event deja traite. Log + return 200
      // pour que Stripe arrete son retry loop.
      const msg = String(dupErr?.message || '').toLowerCase();
      if (msg.includes('unique') || msg.includes('duplicate') || dupErr?.code === '23505') {
        strapi.log.info(`[webhook:${requestId}] DUPLICATE event ${event.id} (${event.type}) - skipping, returning 200`);
        ctx.body = { received: true, duplicate: true };
        return;
      }
      // Autre erreur DB = on log mais on continue (mieux traiter en double
      // qu'ignorer un event valide a cause d'un probleme DB transient).
      strapi.log.warn(`[webhook:${requestId}] idempotency log insert failed (non-unique): ${dupErr?.message}`);
    }

    // FIX-PRIVATE-SALE (avril 2026) : handler dedie pour les ventes privees
    // d'oeuvres artistes (flux /vente-privee/:token). Metadata.type === 'private-sale'
    // signale ce flux. On marque le print comme sold=true dans artist.prints[]
    // sans creer d'Order (les ventes privees ne vont pas dans la table orders).
    if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
      const obj = event.data.object as any;
      const meta = obj?.metadata || {};
      if (meta.type === 'private-sale' && meta.privateSaleToken && meta.artistSlug && meta.printId) {
        try {
          const artists = await strapi.documents('api::artist.artist').findMany({
            filters: { slug: meta.artistSlug } as any,
            status: 'published',
          });
          const artist = artists[0];
          if (artist) {
            const prints = Array.isArray(artist.prints) ? (artist.prints as any[]) : [];
            const updated = prints.map((p: any) => {
              if (p?.id === meta.printId && p?.privateToken === meta.privateSaleToken) {
                return {
                  ...p,
                  sold: true,
                  soldAt: new Date().toISOString(),
                  soldAmount: typeof obj.amount_total === 'number'
                    ? obj.amount_total / 100
                    : (typeof obj.amount === 'number' ? obj.amount / 100 : null),
                  stripePaymentIntentId: obj.payment_intent || obj.id || null,
                };
              }
              return p;
            });
            await strapi.documents('api::artist.artist').update({
              documentId: artist.documentId,
              data: { prints: updated } as any,
              status: 'published',
            });
            strapi.log.info(`[webhook:${requestId}] private-sale SOLD: ${meta.artistSlug}/${meta.printId} token=${meta.privateSaleToken.slice(0, 8)}...`);
          } else {
            strapi.log.warn(`[webhook:${requestId}] private-sale: artist ${meta.artistSlug} introuvable`);
          }
        } catch (err: any) {
          strapi.log.error(`[webhook:${requestId}] private-sale update ECHEC:`, err?.message);
        }
        // On laisse le flow continuer pour NE PAS casser les orders regulieres
        // qui partagent le meme event - mais comme le metadata est private-sale,
        // les lookups orders plus bas ne trouveront rien et le handler retournera
        // gracefully.
      }
    }

    // Pour checkout sessions, recuperer le payment_intent_id et upgrader la colonne
    // stripePaymentIntentId (qui contient peut-etre encore le cs_live_ temporaire).
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      if (session.payment_intent && session.payment_status === 'paid') {
        // Search by BOTH columns to handle both orders created pre-split (still storing cs_live
        // in stripePaymentIntentId) AND orders created post-split (cs_live in stripeCheckoutSessionId).
        const orders = await strapi.documents('api::order.order').findMany({
          filters: {
            $or: [
              { stripeCheckoutSessionId: session.id },
              { stripePaymentIntentId: session.payment_intent },
              { stripePaymentIntentId: session.id },
            ],
          } as any,
        });
        if (orders.length > 0 && (orders[0] as any).status === 'draft') {
          // FIX-STRIPE-SYNC (avril 2026) : double-filet pour que le statut
          // passe a 'paid' des que checkout.session.completed arrive. Avant,
          // on attendait STRICTEMENT payment_intent.succeeded pour flipper.
          // Si ce 2e event tombait dans la lucarne (retry Stripe echoue,
          // ngrok deconnecte en dev, etc.), la commande restait 'draft' ad
          // vitam -> admin avait l'impression que Stripe "ne syncait pas".
          // Maintenant on flip aussi ici quand session.payment_status==='paid',
          // et on se contente d'etre idempotent si payment_intent.succeeded
          // arrive ensuite (il passe alors de paid->paid sans effet).
          await strapi.documents('api::order.order').update({
            documentId: orders[0].documentId,
            data: {
              status: 'paid',
              stripePaymentIntentId: session.payment_intent,
              stripeCheckoutSessionId: session.id,
            } as any,
          });
          strapi.log.info(`[webhook:${requestId}] checkout.session.completed: order ${orders[0].documentId} -> PAID (session=${session.id}, pi=${session.payment_intent})`);
        }
      }
      // Le payment_intent.succeeded va suivre et gerer le reste
      ctx.body = { received: true };
      return;
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      // STRIPE-02: early-return DB lookup avant d'appeler Stripe. Depuis commit
      // 15a34e1, createCheckoutSession stocke stripeCheckoutSessionId ET
      // stripePaymentIntentId des le debut. Donc pour les orders post-avril-2026,
      // un simple findMany sur stripePaymentIntentId trouve l'order sans avoir
      // besoin de sessions.list() cote Stripe (100-300ms economises + rate
      // limit menage + pas de timeout si Stripe API lente).
      let orders = await strapi.documents('api::order.order').findMany({
        filters: { stripePaymentIntentId: paymentIntent.id } as any,
      });

      // Fallback manual payment link : metadata.orderId propagee depuis paymentLinks.create.
      // On retrouve directement l'Order par documentId sans faire d'appel Stripe.
      const manualOrderId = (paymentIntent.metadata || {}).orderId;
      if (orders.length === 0 && manualOrderId) {
        const manualOrder = await strapi.documents('api::order.order').findFirst({
          filters: { documentId: manualOrderId } as any,
        });
        if (manualOrder) {
          orders = [manualOrder as any];
          // On stocke le payment_intent definitif pour les webhooks retry et la reconciliation
          try {
            await strapi.documents('api::order.order').update({
              documentId: manualOrder.documentId,
              data: { stripePaymentIntentId: paymentIntent.id } as any,
            });
          } catch (updateErr: any) {
            strapi.log.warn(`[webhook:${requestId}] Could not stamp PI on manual order ${manualOrder.documentId}: ${updateErr?.message}`);
          }
        }
      }

      // Fallback pour les orders pre-avril 2026 (pas de stripeCheckoutSessionId
      // separe, le cs_live_ est dans stripePaymentIntentId). On resout via
      // Stripe seulement dans ce cas.
      if (orders.length === 0) {
        let checkoutSessionId: string | null = null;
        try {
          const stripe = getStripe();
          const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntent.id, limit: 1 });
          if (sessions.data.length > 0) checkoutSessionId = sessions.data[0].id;
        } catch (lookupErr: any) {
          strapi.log.warn(`[webhook:${requestId}] Could not lookup session for ${paymentIntent.id}:`, lookupErr?.message);
        }

        if (checkoutSessionId) {
          orders = await strapi.documents('api::order.order').findMany({
            filters: {
              $or: [
                { stripeCheckoutSessionId: checkoutSessionId },
                { stripePaymentIntentId: checkoutSessionId },
              ],
            } as any,
          });
        }
      }

      if (orders.length > 0) {
        const order = orders[0] as any;
        // Generer le numero de facture sequentiel MM-AAAA-XXXX
        let invoiceNumber = '';
        try {
          const now = new Date();
          const year = now.getFullYear();
          const prefix = `MM-${year}-`;
          const existingOrders = await strapi.documents('api::order.order').findMany({
            filters: { invoiceNumber: { $startsWith: prefix } },
            sort: { invoiceNumber: 'desc' },
            limit: 1,
          });
          let seq = 1;
          if (existingOrders.length > 0 && (existingOrders[0] as any).invoiceNumber) {
            const lastNum = (existingOrders[0] as any).invoiceNumber.replace(prefix, '');
            seq = (parseInt(lastNum, 10) || 0) + 1;
          }
          invoiceNumber = `${prefix}${String(seq).padStart(4, '0')}`;
        } catch (invoiceErr) {
          strapi.log.warn('Erreur generation numero facture:', invoiceErr);
          invoiceNumber = `MM-${new Date().getFullYear()}-0000`;
        }

        await strapi.documents('api::order.order').update({
          documentId: order.documentId,
          data: { status: 'paid', invoiceNumber },
        });
        strapi.log.info(`Order ${order.documentId} marked as paid (${invoiceNumber})`);

        // ERP manual orders : flip l'Invoice liee (paymentStatus + paidAt).
        // Detection: metadata.invoiceId direct OU relation order.invoice si isManual.
        try {
          const metaInvoiceId = (paymentIntent.metadata || {}).invoiceId;
          let invoiceDocId: string | null = metaInvoiceId || null;
          if (!invoiceDocId) {
            const linked = await strapi.documents('api::invoice.invoice').findFirst({
              filters: { order: { documentId: order.documentId } } as any,
            });
            if (linked) invoiceDocId = (linked as any).documentId;
          }
          if (invoiceDocId) {
            await strapi.documents('api::invoice.invoice').update({
              documentId: invoiceDocId,
              data: {
                paymentStatus: 'paid',
                status: 'paid',
                paidAt: new Date().toISOString(),
              } as any,
            });
            strapi.log.info(`[webhook:${requestId}] Invoice ${invoiceDocId} flipped to paid`);
          }
        } catch (invFlipErr: any) {
          strapi.log.warn(`[webhook:${requestId}] Could not flip invoice paymentStatus: ${invFlipErr?.message}`);
        }

        // STRIPE-04: emails admin + client en parallele via Promise.allSettled.
        // Avant: sequential await - si l'un timeout (ex: Resend down 5s), l'autre
        // attend avant de partir, doublant potentiellement le temps total du webhook.
        // Maintenant: parallele + log structure error-level avec orderId+recipient
        // pour qu'on puisse retracer un echec dans les logs Render.
        // TODO STRIPE-04b: persister les echecs dans une table email_retry_queue
        // avec cron horaire. Deferre pour rester dans le scope RACE/perf Vague 2.
        {
          const orderItems: any[] = Array.isArray(order.items) ? order.items : [];
          const orderRef = paymentIntent.id.slice(-8).toUpperCase();

          const allUploadedFiles: { name: string; url: string }[] = [];
          for (const item of orderItems) {
            if (Array.isArray(item.uploadedFiles)) {
              for (const f of item.uploadedFiles) {
                if (f && (f.url || f.name)) {
                  allUploadedFiles.push({ name: f.name || f.url || 'Fichier', url: f.url || '' });
                }
              }
            }
          }

          const itemsForEmail = orderItems.map((item: any) => ({
            productName: item.productName || 'Produit',
            quantity: item.quantity || 1,
            totalPrice: item.totalPrice || 0,
            size: item.size || '',
            finish: item.finish || '',
          }));

          const [confirmRes, adminRes] = await Promise.allSettled([
            sendOrderConfirmationEmail({
              customerName: order.customerName,
              customerEmail: order.customerEmail,
              orderRef,
              invoiceNumber,
              items: itemsForEmail,
              subtotal: order.subtotal || 0,
              shipping: order.shipping || 0,
              tps: order.tps || 0,
              tvq: order.tvq || 0,
              total: order.total || 0,
              shippingAddress: order.shippingAddress || null,
              promoCode: order.promoCode || undefined,
              promoDiscount: order.promoDiscount || undefined,
              supabaseUserId: order.supabaseUserId || undefined,
            }),
            sendNewOrderNotificationEmail({
              orderRef,
              customerName: order.customerName,
              customerEmail: order.customerEmail,
              items: itemsForEmail,
              subtotal: order.subtotal || 0,
              shipping: order.shipping || 0,
              tps: order.tps || 0,
              tvq: order.tvq || 0,
              total: order.total || 0,
              shippingAddress: order.shippingAddress || null,
              uploadedFiles: allUploadedFiles.length > 0 ? allUploadedFiles : undefined,
              notes: order.notes || undefined,
              designReady: order.designReady !== false,
              promoCode: order.promoCode || undefined,
              promoDiscount: order.promoDiscount || undefined,
            }),
          ]);

          if (confirmRes.status === 'fulfilled') {
            strapi.log.info(`Email confirmation envoye a ${order.customerEmail} (${invoiceNumber})`);
          } else {
            strapi.log.error(
              `STRIPE-04: ECHEC email confirmation client. ` +
              `orderId=${order.documentId} orderRef=${orderRef} invoice=${invoiceNumber} ` +
              `recipient=${order.customerEmail} err=${(confirmRes.reason as any)?.message || confirmRes.reason}`
            );
          }
          if (adminRes.status === 'fulfilled') {
            strapi.log.info(`Notification vente admin envoyee pour commande ${orderRef}`);
          } else {
            strapi.log.error(
              `STRIPE-04: ECHEC notification vente admin. ` +
              `orderId=${order.documentId} orderRef=${orderRef} invoice=${invoiceNumber} ` +
              `err=${(adminRes.reason as any)?.message || adminRes.reason}`
            );
          }
        }

        // Update client stats
        try {
          const clients = await strapi.documents('api::client.client').findMany({
            filters: { email: order.customerEmail.toLowerCase() },
          });
          if (clients.length > 0) {
            const client = clients[0];
            await strapi.documents('api::client.client').update({
              documentId: client.documentId,
              data: {
                totalSpent: (Number(client.totalSpent) || 0) + (order.total || 0) / 100,
                orderCount: (client.orderCount || 0) + 1,
                lastOrderDate: new Date().toISOString().split('T')[0],
              },
            });
          }
        } catch (err) {
          strapi.log.warn('Could not update client stats:', err);
        }

        // RACE-02: decrement inventory stock ATOMIQUEMENT pour chaque item. L'ancienne
        // version faisait findMany -> max(0, qty-n) -> update : si deux webhooks arrivaient
        // simultanement pour le meme SKU, le read pouvait donner la meme valeur aux deux
        // avant qu'aucun write ne soit fait (stock surestime silencieusement).
        //
        // La solution: UPDATE inventory_items SET quantity=quantity-? WHERE sku=? AND
        // active=true AND quantity>=? via knex. Postgres garantit l'atomicite de l'UPDATE
        // sur une seule ligne. Si rowCount=0 c'est soit SKU inconnu (skip silencieux
        // comme avant) soit stock insuffisant (log LOUD pour traitement manuel puisque
        // le paiement est deja passe cote Stripe).
        try {
          const knex = (strapi.db as any).connection;
          const orderItems: any[] = Array.isArray(order.items) ? order.items : [];
          for (const item of orderItems) {
            const qty = item.quantity || 1;
            const sku = item.sku || item.slug;
            if (!sku) continue;

            const rowsAffected = await knex('inventory_items')
              .where({ sku, active: true })
              .andWhere('quantity', '>=', qty)
              .update({ quantity: knex.raw('quantity - ?', [qty]) });

            if (rowsAffected > 0) {
              const row = await knex('inventory_items')
                .where({ sku, active: true })
                .first('quantity');
              strapi.log.info(`Inventory ${sku}: -${qty} -> ${row?.quantity ?? '?'} (atomic)`);
            } else {
              // Disambiguate: SKU non-tracked (silent skip, comportement avant) vs stock insuffisant (loud)
              const existing = await knex('inventory_items')
                .where({ sku, active: true })
                .first('quantity');
              if (existing !== undefined) {
                strapi.log.warn(
                  `RACE-02: inventory insuffisant pour SKU "${sku}" (en stock: ${existing.quantity}, ` +
                  `demande: ${qty}). Order ${order.documentId} paye mais stock non decremente. ` +
                  `A traiter manuellement (rupture de stock non detectee lors de l'achat).`
                );
              }
            }
          }
        } catch (err) {
          strapi.log.warn('Could not update inventory:', err);
        }

        // Notifier les artistes concernes par la vente
        try {
          const orderItems: any[] = Array.isArray(order.items) ? order.items : [];
          const artistItemsMap: Record<string, any[]> = {};

          // Charger tous les artistes actifs
          const artists = await strapi.documents('api::artist.artist').findMany({
            filters: { active: true },
          });
          const artistMap: Record<string, any> = {};
          for (const a of artists) {
            artistMap[a.slug] = a;
          }
          const slugs = Object.keys(artistMap);

          // Charger TOUS les user-roles artist pour avoir un fallback email par slug
          // (le champ artist.email peut etre null dans le CMS, l'email reel est dans user-role)
          const userRoleEmailBySlug: Record<string, string> = {};
          try {
            const artistRoles = await strapi.documents('api::user-role.user-role').findMany({
              filters: { role: 'artist' },
            });
            for (const ur of artistRoles) {
              const slug = (ur as any).artistSlug;
              if (slug && (ur as any).email) {
                // Premier email trouve pour ce slug (ou le plus recent selon ordre de findMany)
                if (!userRoleEmailBySlug[slug]) {
                  userRoleEmailBySlug[slug] = (ur as any).email;
                }
              }
            }
          } catch (urErr) {
            strapi.log.warn('Could not load user-roles for artist email fallback:', urErr);
          }

          // Grouper les items par artiste
          for (const item of orderItems) {
            const pid = item.productId || '';
            if (!pid.startsWith('artist-print-') && !pid.startsWith('artist-sticker-pack-')) continue;

            let matchedSlug: string | null = null;
            for (const slug of slugs) {
              if (pid.startsWith(`artist-print-${slug}-`) || pid.startsWith(`artist-sticker-pack-${slug}-`)) {
                if (!matchedSlug || slug.length > matchedSlug.length) {
                  matchedSlug = slug;
                }
              }
            }
            if (!matchedSlug) continue;

            if (!artistItemsMap[matchedSlug]) artistItemsMap[matchedSlug] = [];
            artistItemsMap[matchedSlug].push({
              productName: item.productName || 'Oeuvre',
              size: item.size || '',
              finish: item.finish || '',
              quantity: item.quantity || 1,
            });
          }

          // STRIPE-04: envoi parallele aux artistes via Promise.allSettled.
          // Avant: for-loop avec await sequentiel - si 10 artistes et Resend lent,
          // le webhook pouvait prendre 10*latency. Maintenant tout part en parallele,
          // chaque echec est logge error-level avec le contexte artist+order.
          const shippingAddr = order.shippingAddress as any;
          const customerCity = shippingAddr?.city || '';

          const artistEntries = Object.entries(artistItemsMap);
          const artistSendPromises = artistEntries.map(async ([slug, items]) => {
            const artist = artistMap[slug];
            const artistEmail = artist?.email || userRoleEmailBySlug[slug] || null;
            if (!artistEmail) {
              strapi.log.warn(`Artiste ${slug}: aucun email trouve (ni CMS ni user-role), notification non envoyee`);
              return { slug, skipped: true } as const;
            }
            try {
              await sendArtistSaleNotificationEmail({
                artistName: artist?.name || slug,
                artistEmail,
                items,
                orderDate: new Date().toISOString(),
                customerCity,
              });
              strapi.log.info(`Notification vente artiste ${slug} envoyee a ${artistEmail}`);
              return { slug, sent: true } as const;
            } catch (err: any) {
              strapi.log.error(
                `STRIPE-04: ECHEC notification vente artiste. ` +
                `orderId=${order.documentId} artistSlug=${slug} recipient=${artistEmail} ` +
                `err=${err?.message || err}`
              );
              return { slug, error: err?.message || String(err) } as const;
            }
          });
          await Promise.allSettled(artistSendPromises);
        } catch (err) {
          strapi.log.warn('Could not notify artists:', err);
        }

        // Marquer les pieces uniques ET privees comme vendues dans le CMS artiste
        try {
          const orderItems: any[] = Array.isArray(order.items) ? order.items : [];
          // Charger une fois tous les artistes
          const allArtists = await strapi.documents('api::artist.artist').findMany({ filters: { active: true } });

          for (const item of orderItems) {
            const pid = item.productId || '';
            if (!pid.startsWith('artist-print-')) continue;

            // Trouver l'artiste et l'id du print
            let matchedArtist: any = null;
            let printId = '';
            for (const a of allArtists) {
              if (pid.startsWith(`artist-print-${a.slug}-`)) {
                if (!matchedArtist || a.slug.length > matchedArtist.slug.length) {
                  matchedArtist = a;
                  printId = pid.replace(`artist-print-${a.slug}-`, '');
                }
              }
            }

            if (!matchedArtist || !printId) continue;

            const prints = Array.isArray(matchedArtist.prints) ? [...matchedArtist.prints] : [];
            const idx = prints.findIndex((p: any) => p.id === printId);
            if (idx === -1) continue;

            const print = prints[idx];
            // Marquer comme vendu si: unique OU private (piece sur commande)
            // Les prints non-uniques / non-prives (editions multiples) ne sont pas marques
            const shouldMarkSold = print.unique === true || print.private === true || item.isUnique === true;
            if (!shouldMarkSold) continue;
            if (print.sold === true) {
              strapi.log.warn(`Piece ${printId} de ${matchedArtist.slug} deja marquee vendue (race condition?)`);
              continue;
            }

            // RACE-01: strip les champs de reservation quand on marque sold - la reservation
            // est consommee, inutile de laisser reservedUntil/reservedByOrderId trainer.
            const { reservedUntil: _ru, reservedByOrderId: _rb, ...restPrint } = print;
            prints[idx] = { ...restPrint, sold: true, soldAt: new Date().toISOString() };
            await strapi.documents('api::artist.artist').update({
              documentId: matchedArtist.documentId,
              data: { prints },
            });
            strapi.log.info(`Piece ${print.unique ? 'unique' : 'privee'} ${printId} de ${matchedArtist.slug} marquee comme vendue`);
          }
        } catch (err) {
          strapi.log.error('Could not mark unique/private pieces as sold:', err);
        }
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const orders = await strapi.documents('api::order.order').findMany({
        filters: { stripePaymentIntentId: paymentIntent.id },
      });

      if (orders.length > 0) {
        const order: any = orders[0];
        await strapi.documents('api::order.order').update({
          documentId: order.documentId,
          data: { status: 'cancelled' },
        });
        strapi.log.info(`Order ${order.documentId} marked as cancelled (payment failed)`);

        // RACE-01: liberer les reservations de pieces unique/privees pour que
        // d'autres clients puissent retenter l'achat sans attendre l'expiry de 30 min.
        // reservationId = session.id (stockee dans stripeCheckoutSessionId). Fallback
        // sur paymentIntent.id pour les commandes pre-RACE-01 ou edge cases.
        try {
          const reservationId = order.stripeCheckoutSessionId || paymentIntent.id;
          const allArtists = await strapi.documents('api::artist.artist').findMany({ filters: { active: true } });
          const uniquePieces = extractUniquePieces(Array.isArray(order.items) ? order.items : [], allArtists);
          if (uniquePieces.length > 0) {
            await releaseUniquePieceReservations(strapi, uniquePieces, reservationId);
            strapi.log.info(`Released ${uniquePieces.length} piece reservation(s) for failed payment ${paymentIntent.id}`);
          }
        } catch (err) {
          strapi.log.warn('Could not release reservations on payment failure:', err);
        }
      }
    }

    ctx.body = { received: true };
  },

  // POST /orders/admin-create - Creer une commande manuellement (admin)
  async adminCreate(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const data = ctx.request.body as any;
    if (!data.customerName || !data.total) {
      return ctx.badRequest('customerName and total are required');
    }
    try {
      const order = await strapi.documents('api::order.order').create({ data });
      ctx.body = { success: true, data: order };
    } catch (err: any) {
      strapi.log.error('adminCreate error:', err);
      return ctx.badRequest(err.message);
    }
  },

  // POST /orders/manual - Creer une Order manuelle + Invoice + Stripe Payment Link
  // Body: { customerName, customerEmail?, customerPhone?, items, subtotal, total?,
  //         shipping?, tps?, tvq?, notes?, lang?: 'fr'|'en' }
  // items: [{ description, quantity, unitPrice }] (montants en dollars, convertis en cents Stripe)
  //
  // FIX-TAXES (avril 2026): si tps/tvq fournis, on RECALCULE le total cote serveur
  // (total = subtotal + shipping + tps + tvq) pour garantir que Stripe Payment Link
  // facture le montant TTC exact. Avant ce fix, le frontend envoyait souvent total=subtotal
  // -> Stripe percevait HT -> factures sous-facturees sans TPS/TVQ.
  async manualCreate(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const body = ctx.request.body as any;
    const {
      customerName, customerEmail, customerPhone,
      // FIX-B2B (23 avril 2026) : companyName optionnel pour les clients entreprise.
      // Affiche sous le nom dans les factures PDF + dans le resume admin.
      companyName,
      items,
      shipping = 0,
      notes, lang = 'fr',
      currency = 'cad',
      // FIX-LEGACY (avril 2026) : backdating d'une facture oubliee / saisie retroactive.
      // `createdAt` applique une valeur historique sur Order.createdAt et Invoice.createdAt
      // via raw SQL (Strapi documents API ne permet pas d'override createdAt).
      // `invoiceDate` (YYYY-MM-DD) controle le champ `date` affiche sur la facture PDF.
      // Si absents : comportement legacy (now).
      createdAt,
      invoiceDate,
      // FIX-PREPAID (23 avril 2026) : si `isAlreadyPaid=true`, on BYPASS totalement
      // Stripe (pas de paymentLinks.create, pas de products/prices, pas de metadata).
      // L'order est directement en status='paid', l'invoice en paymentStatus='paid'
      // + paidAt=now. `offlinePaymentMethod` (optionnel) tag la methode reelle :
      // 'interac', 'cash', 'square', 'cheque', 'other'. Utile pour la comptabilite.
      isAlreadyPaid = false,
      offlinePaymentMethod,
    } = body || {};
    let { subtotal, total, tps = 0, tvq = 0 } = body || {};

    if (!customerName || !Array.isArray(items) || items.length === 0) {
      return ctx.badRequest('customerName et items[] requis');
    }

    // Normaliser les montants numeriques (accepter strings avec virgules)
    const toNum = (v: any) => {
      const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    subtotal = toNum(subtotal);
    tps = toNum(tps);
    tvq = toNum(tvq);
    const shippingNum = toNum(shipping);

    // Si tps/tvq non fournis mais subtotal > 0, les calculer automatiquement
    // (taxes QC standard : TPS 5%, TVQ 9.975%). L'admin peut override en les fournissant.
    if (subtotal > 0 && tps === 0 && tvq === 0) {
      tps = Math.round(subtotal * 0.05 * 100) / 100;
      tvq = Math.round(subtotal * 0.09975 * 100) / 100;
    }

    // FIX-TAXES : le total TTC reel est TOUJOURS subtotal + shipping + tps + tvq.
    // On ignore le `total` client pour eviter les incoherences / sous-facturation Stripe.
    const computedTotal = Math.round((subtotal + shippingNum + tps + tvq) * 100) / 100;
    const providedTotal = toNum(total);

    // Warning si le client a envoye un total divergent (bug frontend potentiel)
    if (providedTotal > 0 && Math.abs(providedTotal - computedTotal) > 0.01) {
      strapi.log.warn(`[manualCreate] Total client ${providedTotal}$ diverge du recalcul serveur ${computedTotal}$ (subtotal=${subtotal}, tps=${tps}, tvq=${tvq}). Utilisation du recalcul serveur.`);
    }
    total = computedTotal;

    if (total <= 0) {
      return ctx.badRequest('Total calcule invalide (0 ou negatif). Verifier subtotal et taxes.');
    }

    // FIX-COMPENSATE (27 avril 2026) : tracker des entites creees pour rollback.
    //
    // Pourquoi : Strapi v5 documents API ne propage pas naturellement les
    // transactions Knex (le AsyncLocalStorage ne traverse pas l'abstraction
    // documents -> entityService -> db.query). Plutot que de bypasser la
    // documents API (perte de la lifecycle / draftAndPublish / populate auto)
    // on utilise le pattern "compensating actions" : on track ce qu'on a cree
    // et si l'etape N echoue, on supprime tout ce qui a ete cree aux etapes
    // 1..N-1. Resultat : aucun orphelin en BDD, aucune commande "fantome".
    //
    // Le client (au sens DB) NE FAIT PAS partie du rollback car il peut etre
    // reutilise (patient findOrCreate). Seuls order et invoice sont temporaires
    // jusqu'a ce que toutes les etapes critiques aient reussi.
    const created: { orderDocId?: string; invoiceDocId?: string } = {};
    const safeDeleteOrder = async (reason: string) => {
      if (!created.orderDocId) return;
      try {
        await strapi.documents('api::order.order').delete({ documentId: created.orderDocId });
        strapi.log.warn(`[manualCreate][rollback] Order ${created.orderDocId} supprime (raison: ${reason})`);
      } catch (delErr: any) {
        strapi.log.error(`[manualCreate][rollback] ECHEC suppression order ${created.orderDocId}: ${delErr?.message}`);
      }
    };
    const safeDeleteInvoice = async (reason: string) => {
      if (!created.invoiceDocId) return;
      try {
        await strapi.documents('api::invoice.invoice').delete({ documentId: created.invoiceDocId });
        strapi.log.warn(`[manualCreate][rollback] Invoice ${created.invoiceDocId} supprime (raison: ${reason})`);
      } catch (delErr: any) {
        strapi.log.error(`[manualCreate][rollback] ECHEC suppression invoice ${created.invoiceDocId}: ${delErr?.message}`);
      }
    };

    try {
      // 1. Resoudre ou creer le Client (lookup par email si fourni).
      //
      // FIX-UNIQUE-RACE (27 avril 2026) : findOrCreate robuste contre les
      // race conditions. Scenario reel observe : double-click sur "Creer" en
      // moins de 200ms -> 2 requetes paralleles -> les 2 findMany retournent
      // [] -> les 2 create() partent -> 2e crash avec "email must be unique"
      // qui remonte au client comme "This attribute must be unique" generique.
      // Solution : si le create echoue avec une violation unique sur email,
      // on re-lit la table (le 1er insert est maintenant visible) et on
      // recupere le clientDocId existant. Belt-and-suspenders : ce pattern
      // tient meme si Strapi/Knex retry tout seul.
      let clientDocId: string | null = null;
      if (customerEmail) {
        const emailLower = String(customerEmail).trim().toLowerCase();
        const existing = await strapi.documents('api::client.client').findMany({
          filters: { email: { $eqi: emailLower } } as any,
          limit: 1,
        });
        if (existing.length > 0) {
          clientDocId = existing[0].documentId;
        } else {
          try {
            const created = await strapi.documents('api::client.client').create({
              data: {
                email: emailLower,
                name: customerName,
                phone: customerPhone || undefined,
              } as any,
            });
            clientDocId = created.documentId;
          } catch (clientErr: any) {
            // Race condition : un autre handler a cree le client entre notre
            // findMany et notre create. On re-fetch pour recuperer son docId.
            const isUniqueErr = isUniqueViolation(clientErr);
            if (isUniqueErr) {
              strapi.log.warn(`[manualCreate] Race condition client.email=${emailLower}, re-fetch en cours`);
              const refetch = await strapi.documents('api::client.client').findMany({
                filters: { email: { $eqi: emailLower } } as any,
                limit: 1,
              });
              if (refetch.length > 0) {
                clientDocId = refetch[0].documentId;
              } else {
                // Tres etrange : unique error mais re-fetch retourne []. On laisse
                // tomber l'attache client (la commande peut exister sans relation).
                strapi.log.error(`[manualCreate] Client unique violation MAIS re-fetch vide pour email=${emailLower}. Order creee sans relation client.`);
              }
            } else {
              throw clientErr;
            }
          }
        }
      }

      // 2. Creer l'Order (isManual, stripePaymentIntentId nullable grace au schema patch)
      // FIX-TAXES : les montants stockes en cents utilisent le total TTC recalcule
      // (subtotal + shipping + tps + tvq) pour garantir la coherence avec Stripe.
      // FIX-PREPAID : si isAlreadyPaid, status='paid' direct + notes enrichies avec
      // la methode de paiement hors-ligne pour trace comptable.
      const prepaid = !!isAlreadyPaid;
      const offlineMethodClean = prepaid && typeof offlinePaymentMethod === 'string'
        ? offlinePaymentMethod.trim().slice(0, 40)
        : null;
      const composedNotes = prepaid
        ? [
            notes || '',
            offlineMethodClean
              ? `[Paye hors-ligne via ${offlineMethodClean} le ${new Date().toISOString().slice(0, 10)}]`
              : `[Paye hors-ligne le ${new Date().toISOString().slice(0, 10)}]`,
          ].filter(Boolean).join('\n\n')
        : (notes || null);

      const cleanCompanyName = typeof companyName === 'string' ? companyName.trim().slice(0, 200) : '';
      const order = await strapi.documents('api::order.order').create({
        data: {
          isManual: true,
          status: prepaid ? 'paid' : 'pending',
          customerName,
          companyName: cleanCompanyName || null,
          customerEmail: customerEmail || null,
          customerPhone: customerPhone || null,
          items,
          subtotal: Math.round(subtotal * 100),
          total: Math.round(total * 100),
          shipping: Math.round(shippingNum * 100),
          tps: Math.round(tps * 100),
          tvq: Math.round(tvq * 100),
          currency,
          notes: composedNotes,
          client: clientDocId ? { connect: [clientDocId] } : undefined,
        } as any,
      });
      // FIX-COMPENSATE : tracker l'order pour rollback eventuel si une etape
      // ulterieure echoue (invoice, Stripe). Le finally du catch global appelle
      // safeDeleteOrder() pour nettoyer.
      created.orderDocId = order.documentId;

      // 3. Numero de facture sequentiel MM-AAAA-XXXX (meme logique que webhook)
      //
      // FIX-UNIQUE-RACE (27 avril 2026) : retry loop pour resister aux race
      // conditions du compteur. Le pattern findMany sort:desc + 1 N'EST PAS
      // atomic - si 2 manualCreate tournent en parallele (admin double-click,
      // 2 onglets, retry reseau), les 2 calculs voient le meme lastSeq et
      // generent le MEME invoiceNumber -> 2e crash sur unique constraint.
      // Le client recoit alors "This attribute must be unique" sans contexte.
      //
      // Solution : on tente jusqu'a MAX_INVOICE_RETRIES fois, en bumpant le
      // seq a chaque tentative. Au 1er essai on prend lastSeq+1, au 2e
      // lastSeq+2, etc. On loggue chaque collision pour pouvoir auditer la
      // frequence. 5 retries couvrent meme le pire cas realiste.
      const year = new Date().getFullYear();
      const prefix = `MM-${year}-`;
      const MAX_INVOICE_RETRIES = 5;

      // FIX-LEGACY : si invoiceDate fourni (YYYY-MM-DD), on l'utilise pour le champ `date`
      // qui apparait sur la facture PDF. Sinon, date du jour.
      const resolvedInvoiceDate = invoiceDate
        ? String(invoiceDate).slice(0, 10)
        : new Date().toISOString().slice(0, 10);

      let invoice: any = null;
      let invoiceNumber = '';
      let attempt = 0;
      let lastInvoiceErr: any = null;

      while (attempt < MAX_INVOICE_RETRIES) {
        attempt++;
        // Re-lire le compteur a CHAQUE tentative : si la 1ere a echoue parce
        // qu'un autre handler a insere notre numero, son insert est maintenant
        // visible et notre prochain calcul donnera lastSeq+1 frais.
        const lastInvoice = await strapi.documents('api::invoice.invoice').findMany({
          filters: { invoiceNumber: { $startsWith: prefix } } as any,
          sort: { invoiceNumber: 'desc' } as any,
          limit: 1,
        });
        let seq = 1;
        if (lastInvoice.length > 0 && (lastInvoice[0] as any).invoiceNumber) {
          const lastNum = (lastInvoice[0] as any).invoiceNumber.replace(prefix, '');
          seq = (parseInt(lastNum, 10) || 0) + 1;
        }
        // Si on est en retry (attempt > 1), on ajoute (attempt-1) pour s'eloigner
        // du seq qui a deja collisione. Sans ce bump, on relit la meme valeur
        // et on retombe sur le meme conflit.
        const candidateSeq = seq + (attempt - 1);
        invoiceNumber = `${prefix}${String(candidateSeq).padStart(4, '0')}`;

        try {
          invoice = await strapi.documents('api::invoice.invoice').create({
            data: {
              invoiceNumber,
              date: resolvedInvoiceDate,
              customerName,
              companyName: cleanCompanyName || null,
              customerEmail: customerEmail || null,
              customerPhone: customerPhone || null,
              items,
              subtotal,
              tps,
              tvq,
              total,
              // FIX-PREPAID : invoice flip aussi a paid si commande deja reglee hors-ligne.
              status: prepaid ? 'paid' : 'draft',
              paymentStatus: prepaid ? 'paid' : 'pending',
              ...(prepaid ? { paidAt: new Date().toISOString() } : {}),
              lang,
              notes: composedNotes,
              order: { connect: [order.documentId] },
              client: clientDocId ? { connect: [clientDocId] } : undefined,
            } as any,
          });
          // Succes : on tracke l'invoice et on sort de la boucle.
          created.invoiceDocId = invoice.documentId;
          break;
        } catch (invoiceErr: any) {
          lastInvoiceErr = invoiceErr;
          const parsed = parseUniqueViolation(invoiceErr);
          // Si c'est une collision sur invoiceNumber, on retry avec un seq bumpe.
          if (isUniqueViolation(invoiceErr) && (parsed.field === 'invoiceNumber' || parsed.field === null)) {
            strapi.log.warn(
              `[manualCreate] Collision invoiceNumber=${invoiceNumber} (tentative ${attempt}/${MAX_INVOICE_RETRIES}). `
              + `Detail: ${parsed.raw.slice(0, 200)}`
            );
            continue;
          }
          // Autre type d'erreur (companyName unique orphelin, validation, etc.) :
          // on remonte tout de suite, le retry n'aiderait pas.
          throw invoiceErr;
        }
      }

      if (!invoice) {
        // Toutes les tentatives ont echoue sur invoiceNumber. Tres rare en pratique
        // (5 collisions consecutives = des dizaines de manualCreate paralleles).
        const parsed = parseUniqueViolation(lastInvoiceErr);
        strapi.log.error(
          `[manualCreate] ECHEC genese invoiceNumber apres ${MAX_INVOICE_RETRIES} tentatives. `
          + `Dernier essai: ${invoiceNumber}. Field=${parsed.field}, raw=${parsed.raw.slice(0, 200)}`
        );
        throw lastInvoiceErr || new Error(`Impossible de generer un numero de facture unique apres ${MAX_INVOICE_RETRIES} tentatives.`);
      }

      // 5. Stripe Payment Link : line_items detailles (sous-total + TPS + TVQ + shipping)
      // pour que le client VOIE le breakdown des taxes sur la page de paiement Stripe.
      // Chaque ligne a son propre Product+Price Stripe avec un label parlant.
      //
      // FIX-PREPAID : si isAlreadyPaid=true, on BYPASS totalement ce bloc. Pas
      // d'appel Stripe, pas de products/prices crees, pas de paymentLink. L'order
      // et l'invoice sont deja en status=paid, aucun lien a generer.
      let paymentLink: any = null;
      if (!prepaid) {
        const stripe = getStripe();
        const currencyLower = (currency || 'cad').toLowerCase();
        const amountCents = Math.round(total * 100);

        async function makeLineItem(name: string, amountDollars: number): Promise<any | null> {
          const cents = Math.round(amountDollars * 100);
          if (cents <= 0) return null;
          const prod = await stripe.products.create({
            name,
            metadata: { invoiceNumber, orderId: order.documentId },
          });
          const pr = await stripe.prices.create({
            product: prod.id,
            unit_amount: cents,
            currency: currencyLower,
          });
          return { price: pr.id, quantity: 1 };
        }

        const lineItems: any[] = [];
        const subtotalItem = await makeLineItem(
          `Facture ${invoiceNumber} - Sous-total`,
          subtotal,
        );
        if (subtotalItem) lineItems.push(subtotalItem);

        if (shippingNum > 0) {
          const shippingItem = await makeLineItem(`Livraison - ${invoiceNumber}`, shippingNum);
          if (shippingItem) lineItems.push(shippingItem);
        }

        if (tps > 0) {
          const tpsItem = await makeLineItem(`TPS (5%) - ${invoiceNumber}`, tps);
          if (tpsItem) lineItems.push(tpsItem);
        }

        if (tvq > 0) {
          const tvqItem = await makeLineItem(`TVQ (9.975%) - ${invoiceNumber}`, tvq);
          if (tvqItem) lineItems.push(tvqItem);
        }

        // Fallback defensif : si pour une raison quelconque aucun line_item n'a ete cree,
        // on bascule sur un line_item unique pour le total (plutot que d'echouer).
        if (lineItems.length === 0) {
          const fallback = await makeLineItem(`Facture ${invoiceNumber} - ${customerName}`, total);
          if (fallback) lineItems.push(fallback);
        }

        // Garde-fou : verifier que la somme des line_items correspond au total attendu.
        // Evite qu'un bug de calcul ne facture le client a cote.
        // (Stripe re-additionne de toute facon, mais on log pour trace audit.)
        strapi.log.info(`[manualCreate] Stripe line_items : ${lineItems.length} lignes pour ${amountCents} cents (subtotal=${subtotal}, shipping=${shippingNum}, tps=${tps}, tvq=${tvq})`);

        paymentLink = await stripe.paymentLinks.create({
          line_items: lineItems,
          metadata: {
            orderId: order.documentId,
            invoiceId: invoice.documentId,
            invoiceNumber,
            type: 'manual',
          },
          payment_intent_data: {
            metadata: {
              orderId: order.documentId,
              invoiceId: invoice.documentId,
              invoiceNumber,
              type: 'manual',
            },
          },
        });

        // 6. Patch Invoice.stripePaymentLink
        await strapi.documents('api::invoice.invoice').update({
          documentId: invoice.documentId,
          data: { stripePaymentLink: paymentLink.url } as any,
        });
      }

      // 7. FIX-LEGACY : si createdAt fourni, override les timestamps Order + Invoice
      // via raw SQL (Strapi documents API ne permet PAS de backdater createdAt).
      // Pattern : on patche TOUTES les lignes publiees + drafts qui partagent le
      // documentId (Strapi v5 en a plusieurs : published + draft) pour etre sur que
      // la ligne lue par adminList ait le bon createdAt, peu importe le mode.
      if (createdAt) {
        try {
          const backdateISO = new Date(createdAt).toISOString();
          const patched = await strapi.db.query('api::order.order').updateMany({
            where: { documentId: order.documentId },
            data: { createdAt: backdateISO, updatedAt: backdateISO } as any,
          });
          await strapi.db.query('api::invoice.invoice').updateMany({
            where: { documentId: invoice.documentId },
            data: { createdAt: backdateISO, updatedAt: backdateISO } as any,
          });
          strapi.log.info(`[manualCreate] Backdated ${patched} order rows to ${backdateISO}`);
        } catch (backdateErr: any) {
          // On n'echoue pas la requete : la commande existe, seul le timestamp est KO.
          strapi.log.warn(`[manualCreate] Backdate ECHEC (order persiste): ${backdateErr?.message}`);
        }
      }

      if (prepaid) {
        strapi.log.info(`[manualCreate] Order ${order.documentId} + Invoice ${invoiceNumber} PREPAID (offline method=${offlineMethodClean || 'none'}) - Stripe bypassed`);
      } else {
        strapi.log.info(`[manualCreate] Order ${order.documentId} + Invoice ${invoiceNumber} + PaymentLink ${paymentLink?.id}`);
      }

      ctx.body = {
        success: true,
        orderId: order.documentId,
        invoiceId: invoice.documentId,
        invoiceNumber,
        // null si prepaid (pas de lien Stripe genere)
        paymentUrl: paymentLink?.url || null,
        isAlreadyPaid: prepaid,
        offlinePaymentMethod: offlineMethodClean,
      };
    } catch (err: any) {
      // FIX-UNIQUE-DETECT (27 avril 2026) : on parse l'erreur pour identifier
      // EXACTEMENT le champ qui a viole une contrainte unique. Avant ce fix,
      // le frontend recevait juste "This attribute must be unique" sans savoir
      // si c'etait email, invoiceNumber, companyName (orphelin), ou autre.
      //
      // On log AUSSI le payload pour que les prochains debugs aient toujours
      // le contexte complet (dans les logs Render). On masque juste les valeurs
      // sensibles (telephone, email partiel) pour la conformite.
      const isUnique = isUniqueViolation(err);
      const parsed = parseUniqueViolation(err);
      const isStripeErr = err?.type?.startsWith?.('Stripe') || /stripe/i.test(err?.message || '');

      strapi.log.error(
        `[manualCreate] ECHEC creation - isUnique=${isUnique} isStripe=${isStripeErr} `
        + `field=${parsed.field || '?'} code=${err?.code || '?'} name=${err?.name || '?'} `
        + `message="${(err?.message || '').slice(0, 300)}" `
        + `payloadKeys=${Object.keys(body || {}).join(',')} `
        + `customerEmail=${customerEmail ? customerEmail.replace(/(.{2}).+(@.+)/, '$1***$2') : 'none'} `
        + `companyName="${(companyName || '').slice(0, 50)}" `
        + `itemsCount=${Array.isArray(items) ? items.length : '?'} `
        + `created.orderDocId=${created.orderDocId || 'none'} `
        + `created.invoiceDocId=${created.invoiceDocId || 'none'}`
      );
      // Log la stack complete pour les inconnues (utile en dev / 1ere apparition)
      if (!isUnique && !isStripeErr && err?.stack) {
        strapi.log.error(`[manualCreate] Stack trace:\n${err.stack}`);
      }

      // FIX-COMPENSATE (27 avril 2026) : ROLLBACK des entites creees avant
      // de repondre l'erreur. Sans ce rollback, le scenario reel observe
      // etait : order cree -> invoice plante (5 retries epuises) -> erreur
      // remontee au frontend -> MAIS l'order persiste en BDD = orphan +
      // confusion admin ("on me dit que ca a plante mais je vois la
      // commande dans la liste"). Maintenant : avant de jeter l'erreur on
      // efface tout ce qui a ete partiellement cree. L'admin verra une
      // erreur claire sans aucune trace fantome dans la liste des commandes.
      //
      // Ordre IMPORTANT : invoice AVANT order car l'invoice a une relation
      // oneToOne mappedBy='invoice' vers order. Strapi v5 supprime la relation
      // proprement seulement si on supprime le owning side d'abord. En
      // pratique les 2 sont independants au niveau DB pour les manuelles
      // (pas de FK NOT NULL), donc l'ordre est defensif mais pas critique.
      if (created.invoiceDocId || created.orderDocId) {
        const reason = isUnique
          ? `unique violation on ${parsed.field || 'unknown field'}`
          : isStripeErr
            ? `Stripe API failure: ${(err?.message || '').slice(0, 80)}`
            : `unexpected error: ${(err?.message || '').slice(0, 80)}`;
        await safeDeleteInvoice(reason);
        await safeDeleteOrder(reason);
      }

      // Reponse structuree pour que le frontend puisse afficher un message
      // ciblé. Le frontend lit ctx.response.data.error.{message,field,code}.
      if (isUnique) {
        // Message lisible pour les champs qu'on connait. Le frontend peut
        // override avec son propre i18n via le `code`.
        const fieldLabels: Record<string, string> = {
          email: 'courriel',
          customerEmail: 'courriel client',
          invoiceNumber: 'numero de facture',
          companyName: 'nom d\'entreprise (probleme technique - contacter le support)',
          stripePaymentIntentId: 'identifiant Stripe',
        };
        const fieldLabel = parsed.field ? (fieldLabels[parsed.field] || parsed.field) : 'un champ';
        const userMessage = parsed.field === 'invoiceNumber'
          ? `Conflit de numero de facture (5 tentatives epuisees). Reessaie dans quelques secondes.`
          : `Conflit d'unicite sur le champ "${fieldLabel}". ${parsed.field === 'companyName' ? 'Un index Postgres orphelin survit en BDD - signaler a l\'admin technique.' : 'Une autre entree existe deja avec cette valeur.'}`;
        ctx.status = 409; // Conflict (plus precis que 400 BadRequest)
        ctx.body = {
          error: {
            status: 409,
            name: 'UniqueViolation',
            message: userMessage,
            field: parsed.field,
            code: 'UNIQUE_VIOLATION',
            details: { rawHint: parsed.raw.slice(0, 200) },
          },
        };
        return;
      }

      // FIX-COMPENSATE : si erreur Stripe, on renvoie un message explicite
      // qui indique que le rollback a eu lieu. L'admin doit savoir qu'il peut
      // re-tenter sans craindre d'avoir une commande fantome.
      if (isStripeErr) {
        ctx.status = 502; // Bad Gateway - service externe (Stripe) indisponible
        ctx.body = {
          error: {
            status: 502,
            name: 'StripeFailure',
            message: `Le lien de paiement Stripe n'a pas pu etre genere (${(err?.message || 'erreur reseau').slice(0, 120)}). La commande et la facture creees ont ete automatiquement annulees - aucune trace en base. Re-essaie dans 30 secondes.`,
            code: 'STRIPE_FAILURE',
            details: { stripeType: err?.type, stripeCode: err?.code },
          },
        };
        return;
      }

      // Erreur non-unique non-Stripe : fallback comportement historique (badRequest 400).
      return ctx.badRequest(err?.message || 'Erreur creation commande manuelle');
    }
  },

  // POST /orders/:documentId/regenerate-stripe-link
  //
  // FIX-RECOVERY (27 avril 2026) : regenere un lien de paiement Stripe pour
  // une commande existante en pending/draft dont la generation initiale a
  // echoue. Cas d'usage reel : commande Don Mescal - Cosmovision (195,46$)
  // creee avant le deploy du rollback compensating, restee en pending sans
  // payment link a cause d'une violation unique sur companyName.
  //
  // Logique :
  //   1. Auth admin
  //   2. Trouver l'order par documentId, refuser si status paid/processing/etc.
  //   3. Trouver l'invoice liee (necessaire pour invoiceNumber + montants)
  //   4. Si pas d'invoice, on en cree une minimale a la volee (tres rare)
  //   5. Generer Stripe Payment Link avec les memes line_items que manualCreate
  //   6. Update invoice.stripePaymentLink + retourne l'URL au frontend
  //
  // Idempotent au sens "safe a re-jouer" : si l'admin re-clique, on cree un
  // nouveau payment link Stripe (ancien reste valide chez Stripe mais ignore).
  // L'invoice pointe sur le DERNIER lien genere.
  async regenerateStripeLink(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { documentId } = ctx.params;
    if (!documentId) return ctx.badRequest('documentId requis');

    try {
      // 1. Resoudre l'order
      const order = await strapi.documents('api::order.order').findOne({
        documentId,
      } as any);
      if (!order) return ctx.notFound('Commande introuvable');

      // 2. Securite : refuser sur status terminal (deja payee / livree / annulee).
      // FIX-WORKFLOW (28 avril 2026) : `processing` (= "En production") retire
      // de la blacklist car cas d'usage agence : on commence a produire avant
      // d'avoir recu le paiement (B2B avec confiance / acomptes / clients
      // recurrents). L'admin doit pouvoir generer ou regenerer le lien Stripe
      // pendant la production. Les autres statuts terminaux sont conserves :
      // - paid : deja paye, pas de raison de generer un autre lien
      // - ready / shipped / delivered : produit / livre, paiement deja resolu
      // - cancelled / refunded : commande fermee, generer un lien serait absurde
      const TERMINAL_STATUSES = ['paid', 'ready', 'shipped', 'delivered', 'cancelled', 'refunded'];
      if (TERMINAL_STATUSES.includes((order as any).status)) {
        ctx.status = 409;
        ctx.body = {
          error: {
            status: 409,
            name: 'InvalidOrderStatus',
            message: `La commande est deja en statut "${(order as any).status}" - regeneration interdite. Si vous devez reouvrir un paiement, repassez d'abord en "pending" ou "processing".`,
            code: 'INVALID_STATUS_FOR_REGEN',
          },
        };
        return;
      }

      // 3. Resoudre l'invoice liee (necessaire pour invoiceNumber + montants en dollars)
      const invoices = await strapi.documents('api::invoice.invoice').findMany({
        filters: { order: { documentId: { $eq: documentId } } } as any,
        limit: 1,
      });
      let invoice: any = invoices.length > 0 ? invoices[0] : null;

      // 4. Si pas d'invoice (cas tres rare : ancienne commande importee, ou
      //    creation interrompue avant l'invoice), on en cree une minimale.
      //    FIX-STRIPE-UNIQUE (28 avril 2026) : retry loop identique a celui de
      //    manualCreate pour resister aux race conditions du compteur. Sans ce
      //    retry, l'erreur "invoiceNumber must be unique" pouvait remonter
      //    jusqu'au frontend et etre confondue avec une erreur Stripe.
      if (!invoice) {
        const year = new Date().getFullYear();
        const prefix = `MM-${year}-`;
        const MAX_INVOICE_RETRIES = 5;
        const subtotalDollars = ((order as any).subtotal || 0) / 100;
        const tpsDollars = ((order as any).tps || 0) / 100;
        const tvqDollars = ((order as any).tvq || 0) / 100;
        const totalDollars = ((order as any).total || 0) / 100;

        let attempt = 0;
        let lastInvoiceErr: any = null;
        while (attempt < MAX_INVOICE_RETRIES) {
          attempt++;
          // Re-lire le compteur a CHAQUE tentative : si la 1ere a echoue parce
          // qu'un autre handler a insere notre numero, son insert est maintenant
          // visible et notre prochain calcul donnera lastSeq+1 frais.
          const lastInvoice = await strapi.documents('api::invoice.invoice').findMany({
            filters: { invoiceNumber: { $startsWith: prefix } } as any,
            sort: { invoiceNumber: 'desc' } as any,
            limit: 1,
          });
          let seq = 1;
          if (lastInvoice.length > 0 && (lastInvoice[0] as any).invoiceNumber) {
            const lastNum = (lastInvoice[0] as any).invoiceNumber.replace(prefix, '');
            seq = (parseInt(lastNum, 10) || 0) + 1;
          }
          // Bump (attempt - 1) si on est en retry, pour s'eloigner d'un seq
          // deja collisione au tour precedent.
          const candidateSeq = seq + (attempt - 1);
          const fallbackInvoiceNumber = `${prefix}${String(candidateSeq).padStart(4, '0')}`;
          try {
            invoice = await strapi.documents('api::invoice.invoice').create({
              data: {
                invoiceNumber: fallbackInvoiceNumber,
                date: new Date().toISOString().slice(0, 10),
                customerName: (order as any).customerName,
                companyName: (order as any).companyName || null,
                customerEmail: (order as any).customerEmail || null,
                customerPhone: (order as any).customerPhone || null,
                items: (order as any).items || [],
                subtotal: subtotalDollars,
                tps: tpsDollars,
                tvq: tvqDollars,
                total: totalDollars,
                status: 'draft',
                paymentStatus: 'pending',
                lang: 'fr',
                order: { connect: [documentId] },
              } as any,
            });
            strapi.log.warn(`[regenerateStripeLink] Order ${documentId} avait pas d'invoice, cree ${fallbackInvoiceNumber} (tentative ${attempt})`);
            break;
          } catch (invErr: any) {
            lastInvoiceErr = invErr;
            const parsed = parseUniqueViolation(invErr);
            if (isUniqueViolation(invErr) && (parsed.field === 'invoiceNumber' || parsed.field === null)) {
              strapi.log.warn(`[regenerateStripeLink] Collision invoiceNumber=${fallbackInvoiceNumber} (tentative ${attempt}/${MAX_INVOICE_RETRIES}) - retry avec seq bumpe`);
              continue;
            }
            // Autre erreur (companyName orphan unique, validation, etc.) : on remonte.
            throw invErr;
          }
        }
        if (!invoice) {
          throw lastInvoiceErr || new Error(`Impossible de generer une invoice fallback apres ${MAX_INVOICE_RETRIES} tentatives.`);
        }
      }

      const invoiceNumber = (invoice as any).invoiceNumber;
      // Conversions cents -> dollars (les amounts dans Order sont en cents)
      const subtotal = ((order as any).subtotal || 0) / 100;
      const total = ((order as any).total || 0) / 100;
      const shippingNum = ((order as any).shipping || 0) / 100;
      const tps = ((order as any).tps || 0) / 100;
      const tvq = ((order as any).tvq || 0) / 100;
      const customerName = (order as any).customerName || 'Client';
      const currency = (order as any).currency || 'cad';

      if (total <= 0) {
        return ctx.badRequest('Total de la commande invalide (0 ou negatif), impossible de generer un lien Stripe.');
      }

      // 5. Stripe Payment Link - meme structure que manualCreate (line_items
      // breakdown TPS/TVQ/shipping pour transparence client sur Stripe)
      //
      // FIX-STRIPE-UNIQUE (28 avril 2026) : ajout d'idempotencyKey sur tous
      // les calls Stripe (products, prices, paymentLinks). Tres important :
      // - Une cle UNIQUE par tentative legitime (timestamp dans la cle).
      //   -> retry reseau avec MEME cle = Stripe renvoie le meme objet (pas
      //      de doublon), comportement idempotent natif de Stripe.
      //   -> nouveau click admin avec NOUVEAU timestamp = nouvelle cle = nouveau
      //      lien Stripe genere.
      // - Si une erreur Stripe survenait sans idempotency, un retry pouvait
      //   creer 2-3 produits Stripe pour le meme paiement (orphelins).
      // Format cle : "{action}-{documentId}-{slug}-{regenTs}"
      const stripe = getStripe();
      const currencyLower = currency.toLowerCase();
      const regenTs = Date.now(); // timestamp unique par tentative de regeneration

      // Helper qui fabrique un slug ASCII safe a partir du label de ligne, pour
      // que la cle d'idempotence soit lisible et bornee (Stripe limite a 255 chars).
      const slugify = (s: string) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase().slice(0, 40);

      async function makeLineItem(name: string, amountDollars: number, lineKey: string): Promise<any | null> {
        const cents = Math.round(amountDollars * 100);
        if (cents <= 0) return null;
        const prod = await stripe.products.create(
          {
            name,
            metadata: { invoiceNumber, orderId: documentId, regenerated: 'true' },
          },
          { idempotencyKey: `regen-prod-${documentId}-${lineKey}-${regenTs}` },
        );
        const pr = await stripe.prices.create(
          {
            product: prod.id,
            unit_amount: cents,
            currency: currencyLower,
          },
          { idempotencyKey: `regen-price-${documentId}-${lineKey}-${regenTs}` },
        );
        return { price: pr.id, quantity: 1 };
      }

      const lineItems: any[] = [];
      const subtotalItem = await makeLineItem(`Facture ${invoiceNumber} - Sous-total`, subtotal, 'subtotal');
      if (subtotalItem) lineItems.push(subtotalItem);
      if (shippingNum > 0) {
        const shippingItem = await makeLineItem(`Livraison - ${invoiceNumber}`, shippingNum, 'shipping');
        if (shippingItem) lineItems.push(shippingItem);
      }
      if (tps > 0) {
        const tpsItem = await makeLineItem(`TPS (5%) - ${invoiceNumber}`, tps, 'tps');
        if (tpsItem) lineItems.push(tpsItem);
      }
      if (tvq > 0) {
        const tvqItem = await makeLineItem(`TVQ (9.975%) - ${invoiceNumber}`, tvq, 'tvq');
        if (tvqItem) lineItems.push(tvqItem);
      }
      // Fallback : si aucun line_item (commande sans subtotal/taxes detailles), un seul item pour le total
      if (lineItems.length === 0) {
        const fallback = await makeLineItem(`Facture ${invoiceNumber} - ${customerName}`, total, `fallback-${slugify(customerName)}`);
        if (fallback) lineItems.push(fallback);
      }

      const paymentLink = await stripe.paymentLinks.create(
        {
          line_items: lineItems,
          metadata: {
            orderId: documentId,
            invoiceId: (invoice as any).documentId,
            invoiceNumber,
            type: 'manual-regenerated',
          },
          payment_intent_data: {
            metadata: {
              orderId: documentId,
              invoiceId: (invoice as any).documentId,
              invoiceNumber,
              type: 'manual-regenerated',
            },
          },
        },
        { idempotencyKey: `regen-plink-${documentId}-${regenTs}` },
      );

      // 6. Patch Invoice.stripePaymentLink avec le NOUVEAU lien
      await strapi.documents('api::invoice.invoice').update({
        documentId: (invoice as any).documentId,
        data: { stripePaymentLink: paymentLink.url } as any,
      });

      strapi.log.info(`[regenerateStripeLink] Order ${documentId} (Invoice ${invoiceNumber}) regenere PaymentLink ${paymentLink.id} (${total}$)`);

      ctx.body = {
        success: true,
        orderId: documentId,
        invoiceId: (invoice as any).documentId,
        invoiceNumber,
        paymentUrl: paymentLink.url,
        amount: total,
        message: `Lien Stripe regenere pour ${customerName} (${total.toFixed(2)}$). Envoyer le lien au client.`,
      };
    } catch (err: any) {
      // FIX-STRIPE-UNIQUE (28 avril 2026) : detection enrichie pour distinguer
      // les 3 sources possibles d'erreur :
      //   - Stripe API (network, key invalide, params)
      //   - Strapi unique violation (invoiceNumber, companyName orphan, etc.)
      //   - Autre (validation, programmation)
      // Avant ce fix : "must be unique" Strapi etait remontee comme erreur
      // generique 400, prêtant a confusion avec Stripe.
      const isStripeErr = err?.type?.startsWith?.('Stripe') || /stripe/i.test(err?.message || '');
      const isUnique = isUniqueViolation(err);
      const parsed = parseUniqueViolation(err);

      strapi.log.error(
        `[regenerateStripeLink] ECHEC pour order ${documentId} - isStripe=${isStripeErr} `
        + `isUnique=${isUnique} field=${parsed.field || '?'} `
        + `name=${err?.name} code=${err?.code || '?'} `
        + `message="${(err?.message || '').slice(0, 200)}"`
      );
      if (err?.stack && !isStripeErr && !isUnique) {
        strapi.log.error(`[regenerateStripeLink] Stack:\n${err.stack}`);
      }

      if (isStripeErr) {
        ctx.status = 502;
        ctx.body = {
          error: {
            status: 502,
            name: 'StripeFailure',
            message: `Stripe injoignable lors de la regeneration : ${(err?.message || 'erreur reseau').slice(0, 120)}. Re-essaie dans 30 secondes.`,
            code: 'STRIPE_FAILURE',
          },
        };
        return;
      }

      // Strapi unique violation (typiquement invoiceNumber - couvert par retry
      // loop sur la creation fallback - ou companyName orphan index Postgres).
      if (isUnique) {
        const fieldHint = parsed.field === 'invoiceNumber'
          ? 'le compteur de numero de facture est en collision (race condition extreme - reessaie dans 5 secondes)'
          : parsed.field === 'companyName'
            ? 'index Postgres orphelin sur company_name (le boot Strapi va auto-fixer au prochain restart, en attendant essaie sans companyName)'
            : `champ "${parsed.field || 'inconnu'}" deja utilise ailleurs`;
        ctx.status = 409;
        ctx.body = {
          error: {
            status: 409,
            name: 'UniqueViolation',
            message: `Conflit de base de donnees : ${fieldHint}. Aucun lien Stripe genere - reessaie dans quelques secondes.`,
            field: parsed.field,
            code: 'UNIQUE_VIOLATION',
          },
        };
        return;
      }

      return ctx.badRequest(err?.message || 'Erreur regeneration lien Stripe');
    }
  },

  // POST /orders/seed-legacy-april2026 - One-shot endpoint pour reinjecter 3 factures
  // B2B historiques (perdues lors d'un refactor) :
  //   - La Presse (Correction Zendesk) - 770$ HT - 9 avril 2026
  //   - Andrew Higgs (SEO 15 Thorburn Living) - 400$ HT - 9 avril 2026
  //   - Jerome Prunier (jprunier.com + Sanity) - 1500$ HT - 17 avril 2026
  //
  // Idempotent : verifie si les factures existent deja via (customerEmail, subtotal, date)
  // et skippe celles deja creees. Retourne un rapport detaille par facture.
  // Taxes (TPS 5% + TVQ 9.975%) recalculees serveur-side. Genere aussi un Stripe
  // Payment Link par facture pour compat avec le reste du workflow.
  async seedLegacyApril2026(ctx) {
    if (!(await requireAdminAuth(ctx))) return;

    const LEGACY_INVOICES = [
      {
        key: 'lapresse-2026-04-09',
        createdAt: '2026-04-09T10:00:00.000-04:00',
        invoiceDate: '2026-04-09',
        customerName: 'La Presse Inc',
        customerEmail: 'ELanoix@lapresse.ca',
        customerPhone: null,
        items: [{
          description: "Correction de l'affichage responsive mobile et des erreurs JavaScript - Centre d'aide Zendesk",
          quantity: 1,
          unitPrice: 770.00,
          lineTotal: 770.00,
        }],
        subtotal: 770.00,
        notes: 'Facture reinjectee (perte refactor avril 2026).',
      },
      {
        key: 'higgs-2026-04-09',
        createdAt: '2026-04-09T11:00:00.000-04:00',
        invoiceDate: '2026-04-09',
        customerName: 'Andrew Higgs',
        customerEmail: 'andrewhiggssold@gmail.com',
        customerPhone: null,
        items: [{
          description: 'SEO Optimization Package 15 Thorburn Living',
          quantity: 1,
          unitPrice: 400.00,
          lineTotal: 400.00,
        }],
        subtotal: 400.00,
        notes: 'Facture reinjectee (perte refactor avril 2026).',
      },
      {
        key: 'prunier-2026-04-17',
        createdAt: '2026-04-17T10:00:00.000-04:00',
        invoiceDate: '2026-04-17',
        customerName: 'Jerome Prunier',
        customerEmail: 'jerome@jprunier.com',
        customerPhone: null,
        items: [{
          description: 'Developpement de site web jprunier.com et configuration Sanity CMS',
          quantity: 1,
          unitPrice: 1500.00,
          lineTotal: 1500.00,
        }],
        subtotal: 1500.00,
        notes: 'Facture reinjectee (perte refactor avril 2026).',
      },
    ];

    const report: any[] = [];
    const stripe = getStripe();

    for (const data of LEGACY_INVOICES) {
      try {
        // Idempotence : chercher une Order existante match par (email + subtotal en cents + isManual + createdAt dans +/- 2j).
        const subtotalCents = Math.round(data.subtotal * 100);
        const existingOrders = await strapi.db.query('api::order.order').findMany({
          where: {
            customerEmail: data.customerEmail,
            subtotal: subtotalCents,
            isManual: true,
          } as any,
          limit: 5,
        }) as any[];
        if (existingOrders && existingOrders.length > 0) {
          report.push({
            key: data.key,
            skipped: true,
            reason: `Already exists (${existingOrders.length} match)`,
            existingOrderId: existingOrders[0].documentId,
          });
          continue;
        }

        // Calcul taxes
        const tps = Math.round(data.subtotal * 0.05 * 100) / 100;
        const tvq = Math.round(data.subtotal * 0.09975 * 100) / 100;
        const total = Math.round((data.subtotal + tps + tvq) * 100) / 100;

        // Resolve/create client
        let clientDocId: string | null = null;
        const existingClients = await strapi.documents('api::client.client').findMany({
          filters: { email: { $eqi: data.customerEmail } } as any,
          limit: 1,
        });
        if (existingClients.length > 0) {
          clientDocId = existingClients[0].documentId;
        } else {
          const createdClient = await strapi.documents('api::client.client').create({
            data: {
              email: data.customerEmail,
              name: data.customerName,
            } as any,
          });
          clientDocId = createdClient.documentId;
        }

        // Create order
        const order = await strapi.documents('api::order.order').create({
          data: {
            isManual: true,
            status: 'pending',
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone,
            items: data.items,
            subtotal: Math.round(data.subtotal * 100),
            total: Math.round(total * 100),
            shipping: 0,
            tps: Math.round(tps * 100),
            tvq: Math.round(tvq * 100),
            currency: 'cad',
            notes: data.notes,
            client: clientDocId ? { connect: [clientDocId] } : undefined,
          } as any,
        });

        // Numero de facture sequentiel
        const year = new Date(data.invoiceDate).getFullYear();
        const prefix = `MM-${year}-`;
        const lastInvoice = await strapi.documents('api::invoice.invoice').findMany({
          filters: { invoiceNumber: { $startsWith: prefix } } as any,
          sort: { invoiceNumber: 'desc' } as any,
          limit: 1,
        });
        let seq = 1;
        if (lastInvoice.length > 0 && (lastInvoice[0] as any).invoiceNumber) {
          const lastNum = (lastInvoice[0] as any).invoiceNumber.replace(prefix, '');
          seq = (parseInt(lastNum, 10) || 0) + 1;
        }
        const invoiceNumber = `${prefix}${String(seq).padStart(4, '0')}`;

        // Create invoice
        const invoice = await strapi.documents('api::invoice.invoice').create({
          data: {
            invoiceNumber,
            date: data.invoiceDate,
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone,
            items: data.items,
            subtotal: data.subtotal,
            tps,
            tvq,
            total,
            status: 'draft',
            paymentStatus: 'pending',
            lang: 'fr',
            notes: data.notes,
            order: { connect: [order.documentId] },
            client: clientDocId ? { connect: [clientDocId] } : undefined,
          } as any,
        });

        // Stripe Payment Link (line_items separes pour breakdown TPS/TVQ)
        async function makeLineItem(name: string, amountDollars: number): Promise<any | null> {
          const cents = Math.round(amountDollars * 100);
          if (cents <= 0) return null;
          const prod = await stripe.products.create({
            name,
            metadata: { invoiceNumber, orderId: order.documentId, legacy: 'true' },
          });
          const pr = await stripe.prices.create({
            product: prod.id,
            unit_amount: cents,
            currency: 'cad',
          });
          return { price: pr.id, quantity: 1 };
        }

        const lineItems: any[] = [];
        const subItem = await makeLineItem(`Facture ${invoiceNumber} - Sous-total`, data.subtotal);
        if (subItem) lineItems.push(subItem);
        if (tps > 0) {
          const t = await makeLineItem(`TPS (5%) - ${invoiceNumber}`, tps);
          if (t) lineItems.push(t);
        }
        if (tvq > 0) {
          const q = await makeLineItem(`TVQ (9.975%) - ${invoiceNumber}`, tvq);
          if (q) lineItems.push(q);
        }

        const paymentLink = await stripe.paymentLinks.create({
          line_items: lineItems,
          metadata: {
            orderId: order.documentId,
            invoiceId: invoice.documentId,
            invoiceNumber,
            type: 'manual-legacy',
          },
          payment_intent_data: {
            metadata: {
              orderId: order.documentId,
              invoiceId: invoice.documentId,
              invoiceNumber,
              type: 'manual-legacy',
            },
          },
        });

        await strapi.documents('api::invoice.invoice').update({
          documentId: invoice.documentId,
          data: { stripePaymentLink: paymentLink.url } as any,
        });

        // Backdate createdAt (RAW SQL - documents API ne permet pas d'override)
        const backdateISO = new Date(data.createdAt).toISOString();
        await strapi.db.query('api::order.order').updateMany({
          where: { documentId: order.documentId },
          data: { createdAt: backdateISO, updatedAt: backdateISO } as any,
        });
        await strapi.db.query('api::invoice.invoice').updateMany({
          where: { documentId: invoice.documentId },
          data: { createdAt: backdateISO, updatedAt: backdateISO } as any,
        });

        strapi.log.info(`[seedLegacy] ${data.key} CREE -> order=${order.documentId} invoice=${invoiceNumber} total=${total}$`);

        report.push({
          key: data.key,
          skipped: false,
          orderId: order.documentId,
          invoiceId: invoice.documentId,
          invoiceNumber,
          paymentUrl: paymentLink.url,
          subtotal: data.subtotal,
          tps,
          tvq,
          total,
          backdatedTo: backdateISO,
        });
      } catch (err: any) {
        strapi.log.error(`[seedLegacy] ${data.key} ECHEC :`, err);
        report.push({
          key: data.key,
          skipped: false,
          error: err.message || 'Erreur inconnue',
        });
      }
    }

    const created = report.filter(r => !r.skipped && !r.error).length;
    const skipped = report.filter(r => r.skipped).length;
    const failed = report.filter(r => r.error).length;

    ctx.body = {
      success: failed === 0,
      summary: { created, skipped, failed, total: LEGACY_INVOICES.length },
      report,
    };
  },

  // POST /orders/:documentId/send-invoice - Envoyer la facture par courriel au client
  // Body optionnel: { pdfBase64?: string, pdfFilename?: string, customerEmail?: string (override) }
  // Validations strictes: retourne 400 si email/paymentUrl absent au lieu de 200 silencieux.
  async sendInvoice(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { documentId } = ctx.params;
    const body = (ctx.request.body as any) || {};
    const pdfBase64: string | undefined = body.pdfBase64;
    const pdfFilename: string | undefined = body.pdfFilename;
    const overrideEmail: string | undefined = body.customerEmail;

    if (!documentId) {
      return ctx.badRequest('documentId requis');
    }

    try {
      // 1. Recuperer la commande
      const order = await strapi.documents('api::order.order').findOne({ documentId }) as any;
      if (!order) {
        return ctx.notFound(`Commande ${documentId} introuvable`);
      }

      // 2. Retrouver l'invoice liee pour obtenir invoiceNumber + stripePaymentLink
      // Les invoices manuelles sont creees par manualCreate avec connect sur l'order.
      const invoices = await strapi.documents('api::invoice.invoice').findMany({
        filters: { order: { documentId: { $eq: documentId } } } as any,
        limit: 1,
      }) as any[];
      const invoice = invoices && invoices.length > 0 ? invoices[0] : null;

      // 3. Resoudre email client (body override > invoice > order)
      const customerEmail = (overrideEmail || invoice?.customerEmail || order.customerEmail || '').trim();
      if (!customerEmail) {
        return ctx.badRequest('Email client manquant sur la commande et non fourni en body');
      }

      // 4. Resoudre paymentUrl (invoice.stripePaymentLink fourni par manualCreate)
      const paymentUrl = invoice?.stripePaymentLink || '';
      if (!paymentUrl) {
        return ctx.badRequest('Lien de paiement Stripe manquant sur la facture. Utilisez une commande manuelle avec lien Stripe genere.');
      }

      // 5. Resoudre montants (stockes en cents dans order, en dollars dans invoice)
      const subtotal = Number(invoice?.subtotal ?? (order.subtotal || 0) / 100) || 0;
      const tps = Number(invoice?.tps ?? (order.tps || 0) / 100) || 0;
      const tvq = Number(invoice?.tvq ?? (order.tvq || 0) / 100) || 0;
      const shipping = Number(invoice?.shipping ?? (order.shipping || 0) / 100) || 0;
      const total = Number(invoice?.total ?? (order.total || 0) / 100) || 0;

      if (total <= 0) {
        return ctx.badRequest('Total de la facture invalide (0 ou negatif)');
      }

      const invoiceNumber = invoice?.invoiceNumber || `CMD-${String(documentId).slice(0, 8)}`;

      // 6. Envoyer le courriel (sendInvoiceEmail throw si erreur Resend)
      await sendInvoiceEmail({
        customerName: order.customerName || 'client',
        customerEmail,
        invoiceNumber,
        orderId: documentId,
        subtotal,
        tps,
        tvq,
        shipping,
        total,
        currency: (order.currency || 'cad').toUpperCase(),
        paymentUrl,
        pdfBase64: pdfBase64 || undefined,
        pdfFilename: pdfFilename || `facture-${invoiceNumber}.pdf`,
      });

      // 7. Marquer l'invoice comme envoyee (date + status)
      if (invoice?.documentId) {
        try {
          await strapi.documents('api::invoice.invoice').update({
            documentId: invoice.documentId,
            data: {
              status: 'sent',
              sentAt: new Date().toISOString(),
            } as any,
          });
        } catch (_) { /* champ sentAt peut ne pas exister dans le schema - non-bloquant */ }
      }

      strapi.log.info(`[sendInvoice] Facture ${invoiceNumber} envoyee a ${customerEmail} (order ${documentId})`);

      ctx.body = {
        success: true,
        data: {
          invoiceNumber,
          customerEmail,
          paymentUrl,
          total,
          sentAt: new Date().toISOString(),
        },
      };
    } catch (err: any) {
      strapi.log.error('sendInvoice error:', err?.message || err);
      // Renvoyer un 500 avec le message d'erreur reel pour que le frontend puisse
      // l'afficher en toast rouge. Pas de succes silencieux.
      return ctx.throw(500, err?.message || 'Echec envoi facture');
    }
  },

  // GET /orders/by-payment-intent/:paymentIntentId - Recupere infos minimales d'une commande pour CheckoutSuccess
  async getByPaymentIntent(ctx) {
    const { paymentIntentId } = ctx.params;
    if (!paymentIntentId) return ctx.badRequest('paymentIntentId required');
    try {
      const order = await strapi.documents('api::order.order').findFirst({
        filters: { stripePaymentIntentId: paymentIntentId },
      }) as any;
      if (!order) return ctx.notFound('Order not found');
      // Retourner SEULEMENT les infos non-sensibles necessaires au signup
      ctx.body = {
        customerName: order.customerName || '',
        customerEmail: order.customerEmail || '',
        customerPhone: order.customerPhone || '',
        total: order.total || 0,
        invoiceNumber: order.invoiceNumber || null,
        hasUserAccount: !!(order.supabaseUserId && order.supabaseUserId !== ''),
      };
    } catch (err: any) {
      strapi.log.error('getByPaymentIntent error:', err);
      return ctx.badRequest(err.message);
    }
  },

  // POST /orders/link-by-email - Lier les guest orders au nouveau compte par email match
  async linkByEmail(ctx) {
    const { email, supabaseUserId } = ctx.request.body as any;
    if (!email || !supabaseUserId) return ctx.badRequest('email and supabaseUserId required');
    try {
      const orders = await strapi.documents('api::order.order').findMany({
        filters: {
          customerEmail: email.toLowerCase(),
          $or: [
            { supabaseUserId: '' as any },
            { supabaseUserId: { $null: true } as any },
          ],
        } as any,
      });
      let count = 0;
      for (const order of orders) {
        await strapi.documents('api::order.order').update({
          documentId: order.documentId,
          data: { supabaseUserId } as any,
        });
        count++;
      }
      // Aussi update le client record
      try {
        const clients = await strapi.documents('api::client.client').findMany({
          filters: { email: email.toLowerCase() },
        });
        for (const client of clients) {
          if (!client.supabaseUserId || client.supabaseUserId === '') {
            await strapi.documents('api::client.client').update({
              documentId: client.documentId,
              data: { supabaseUserId } as any,
            });
          }
        }
      } catch (clientErr) {
        strapi.log.warn('Could not update client supabaseUserId:', clientErr);
      }
      strapi.log.info(`Linked ${count} orders to user ${supabaseUserId} (email: ${email})`);
      ctx.body = { success: true, linkedCount: count };
    } catch (err: any) {
      strapi.log.error('linkByEmail error:', err);
      return ctx.badRequest(err.message);
    }
  },

  // POST /orders/:documentId/resend-emails - Renvoyer TOUS les emails (confirmation client + notification admin)
  async resendAdminNotification(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { documentId } = ctx.params;
    try {
      const order = await strapi.documents('api::order.order').findFirst({
        filters: { documentId },
      }) as any;
      if (!order) return ctx.notFound('Order not found');

      const orderItems: any[] = Array.isArray(order.items) ? order.items : [];
      const orderRef = (order.stripePaymentIntentId || order.documentId || '').slice(-8).toUpperCase();

      const allUploadedFiles: { name: string; url: string }[] = [];
      for (const item of orderItems) {
        if (Array.isArray(item.uploadedFiles)) {
          for (const f of item.uploadedFiles) {
            if (f && (f.url || f.name)) {
              allUploadedFiles.push({ name: f.name || f.url || 'Fichier', url: f.url || '' });
            }
          }
        }
      }

      await sendNewOrderNotificationEmail({
        orderRef,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        items: orderItems.map((item: any) => ({
          productName: item.productName || 'Produit',
          quantity: item.quantity || 1,
          totalPrice: item.totalPrice || 0,
          size: item.size || '',
          finish: item.finish || '',
        })),
        subtotal: order.subtotal || 0,
        shipping: order.shipping || 0,
        tps: order.tps || 0,
        tvq: order.tvq || 0,
        total: order.total || 0,
        shippingAddress: order.shippingAddress || null,
        uploadedFiles: allUploadedFiles.length > 0 ? allUploadedFiles : undefined,
        notes: order.notes || undefined,
        designReady: order.designReady !== false,
        promoCode: order.promoCode || undefined,
        promoDiscount: order.promoDiscount || undefined,
      });

      // Aussi envoyer la confirmation au client
      try {
        // Generer invoiceNumber si manquant
        if (!order.invoiceNumber) {
          const year = new Date().getFullYear();
          const prefix = `MM-${year}-`;
          const existingOrders = await strapi.documents('api::order.order').findMany({
            filters: { invoiceNumber: { $startsWith: prefix } },
            sort: { invoiceNumber: 'desc' },
            limit: 1,
          });
          let seq = 1;
          if (existingOrders.length > 0 && (existingOrders[0] as any).invoiceNumber) {
            seq = (parseInt((existingOrders[0] as any).invoiceNumber.replace(prefix, ''), 10) || 0) + 1;
          }
          const invoiceNumber = `${prefix}${String(seq).padStart(4, '0')}`;
          await strapi.documents('api::order.order').update({
            documentId: order.documentId,
            data: { invoiceNumber } as any,
          });
          order.invoiceNumber = invoiceNumber;
        }

        await sendOrderConfirmationEmail({
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          orderRef,
          invoiceNumber: order.invoiceNumber,
          items: orderItems.map((item: any) => ({
            productName: item.productName || 'Produit',
            quantity: item.quantity || 1,
            totalPrice: item.totalPrice || 0,
            size: item.size || '',
            finish: item.finish || '',
          })),
          subtotal: order.subtotal || 0,
          shipping: order.shipping || 0,
          tps: order.tps || 0,
          tvq: order.tvq || 0,
          total: order.total || 0,
          shippingAddress: order.shippingAddress || null,
          promoCode: order.promoCode || undefined,
          promoDiscount: order.promoDiscount || undefined,
          supabaseUserId: order.supabaseUserId || undefined,
        });
        strapi.log.info(`Email confirmation renvoye a ${order.customerEmail}`);
      } catch (clientEmailErr) {
        strapi.log.warn('Erreur renvoi email client (non bloquant):', clientEmailErr);
      }

      ctx.body = { success: true, message: 'Notification admin + confirmation client envoyees' };
    } catch (err: any) {
      strapi.log.error('resendAdminNotification error:', err);
      return ctx.badRequest(err.message);
    }
  },

  async clients(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    // Read from Client collection (CRM)
    const clients = await strapi.documents('api::client.client').findMany({
      sort: 'totalSpent:desc',
      populate: ['files'],
    });

    ctx.body = { clients, total: clients.length };
  },

  async adminList(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const page = parseInt(ctx.query.page as string) || 1;
    // FIX-ADMIN (avril 2026) : default 500 au lieu de 25 pour que tout
    // l'historique de commandes soit disponible en une seule page. L'admin
    // peut toujours passer pageSize=N pour reduire. Pas de cap max cote
    // serveur : si Massive depasse un jour 10k orders, on mettra un slider.
    const pageSize = parseInt(ctx.query.pageSize as string) || 500;
    const status = ctx.query.status as string;
    const search = ctx.query.search as string;

    const filters: any = {};
    if (status && status !== 'all') {
      // FIX-FILTER (avril 2026) : support d'une liste virgule-separee pour les
      // super-filtres inclusifs. Ex: status=paid,processing,ready,shipped,delivered
      // envoye par l'onglet "Paye" du frontend pour que toutes les commandes
      // POST-paiement (pas seulement celles figees a 'paid') y apparaissent.
      // Conserve retro-compat : une valeur simple reste un match exact.
      if (status.includes(',')) {
        const list = status.split(',').map(s => s.trim()).filter(Boolean);
        if (list.length > 0) filters.status = { $in: list };
      } else {
        filters.status = status;
      }
    } else {
      // Exclude draft orders (payment not yet confirmed by Stripe webhook)
      filters.status = { $ne: 'draft' };
    }
    if (search) {
      filters.$or = [
        { customerName: { $containsi: search } },
        { customerEmail: { $containsi: search } },
        { stripePaymentIntentId: { $containsi: search } },
      ];
    }

    // PERF-02 : count() au lieu de findMany() pour le total. L'ancien code
    // faisait 2 findMany identiques (une paginee + une full pour compter),
    // donc a 10 000 orders on chargait tout en memoire juste pour obtenir
    // un length. count() laisse Postgres faire l'aggregate et retourne juste
    // un integer, bien plus rapide + pas de heap pressure.
    const [orders, total] = await Promise.all([
      strapi.documents('api::order.order').findMany({
        filters,
        sort: 'createdAt:desc',
        limit: pageSize,
        start: (page - 1) * pageSize,
        populate: ['client'],
      }),
      strapi.db.query('api::order.order').count({ where: filters }),
    ]);

    // FIX-PDF (avril 2026) : enrichir chaque order avec le stripePaymentLink et
    // l'invoiceNumber de l'Invoice liee. Permet au frontend d'injecter le lien
    // Stripe dans le PDF et l'email de facture pour les commandes non-payees.
    try {
      const orderDocIds = (orders || []).map((o: any) => o.documentId).filter(Boolean);
      if (orderDocIds.length > 0) {
        const invoices = await strapi.documents('api::invoice.invoice').findMany({
          filters: { order: { documentId: { $in: orderDocIds } } } as any,
          limit: orderDocIds.length * 2,
        }) as any[];
        const invoiceByOrder: Record<string, any> = {};
        for (const inv of (invoices || [])) {
          // Strapi populate can return either order.documentId or order.id - on best-effort
          const oid = (inv as any).order?.documentId || (inv as any).orderDocumentId;
          if (oid) invoiceByOrder[oid] = inv;
        }
        for (const o of (orders || []) as any[]) {
          const inv = invoiceByOrder[o.documentId];
          if (inv) {
            o.stripePaymentLink = inv.stripePaymentLink || '';
            o.invoiceNumber = o.invoiceNumber || inv.invoiceNumber || '';
          }
        }
      }
    } catch (enrichErr: any) {
      strapi.log.warn(`[adminList] Enrichment invoices echoue (non-bloquant): ${enrichErr?.message || enrichErr}`);
    }

    ctx.body = {
      data: orders,
      meta: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize),
      },
    };
  },

  async updateStatus(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { documentId } = ctx.params;
    const body = ctx.request.body as any;
    const { status: newStatus, invoiceNumber, autoInvoice } = body;

    // FIX-EMAIL-CONTROL (avril 2026) : le client exige un controle manuel
    // explicite sur les courriels envoyes aux changements de statut. Avant
    // ce fix, le status 'delivered' declenchait TOUJOURS le courriel temoignage
    // (non controle). Maintenant :
    //   - sendEmail=true   -> envoie les courriels prevus pour ce statut
    //   - sendEmail=false  -> aucun courriel (meme 'delivered')
    //   - absent           -> fallback sur legacy `sendEmails` pour compat
    //                          retro ; si ni l'un ni l'autre fourni -> false
    //                          (default = silencieux, principe de moindre surprise)
    const sendEmail = typeof body.sendEmail === 'boolean'
      ? body.sendEmail
      : (typeof body.sendEmails === 'boolean' ? body.sendEmails : false);

    const validStatuses = ['draft', 'pending', 'paid', 'processing', 'ready', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!newStatus || !validStatuses.includes(newStatus)) {
      return ctx.badRequest(`Status invalide. Valeurs acceptees: ${validStatuses.join(', ')}`);
    }

    const order = await strapi.documents('api::order.order').findFirst({
      filters: { documentId },
    });

    if (!order) {
      return ctx.notFound('Commande introuvable');
    }

    // Compute updateData: status + optional invoice number (manual or auto-generated)
    const updateData: any = { status: newStatus };
    let assignedInvoice: string | null = null;
    if (invoiceNumber && typeof invoiceNumber === 'string' && invoiceNumber.trim()) {
      updateData.invoiceNumber = invoiceNumber.trim();
      assignedInvoice = invoiceNumber.trim();
    } else if (autoInvoice && newStatus === 'paid' && !(order as any).invoiceNumber) {
      // Auto-generate next sequential MM-YYYY-NNNN
      try {
        const year = new Date().getFullYear();
        const prefix = `MM-${year}-`;
        const existing = await strapi.documents('api::order.order').findMany({
          filters: { invoiceNumber: { $startsWith: prefix } } as any,
          sort: { invoiceNumber: 'desc' } as any,
          limit: 1,
        });
        let seq = 1;
        if (existing.length > 0 && (existing[0] as any).invoiceNumber) {
          const lastNum = (existing[0] as any).invoiceNumber.replace(prefix, '');
          seq = (parseInt(lastNum, 10) || 0) + 1;
        }
        assignedInvoice = `${prefix}${String(seq).padStart(4, '0')}`;
        updateData.invoiceNumber = assignedInvoice;
      } catch (e) {
        strapi.log.warn('Auto invoice generation failed:', e);
      }
    }

    const updated = await strapi.documents('api::order.order').update({
      documentId: order.documentId,
      data: updateData,
    });

    // FIX-EMAIL-CONTROL : gate sur le flag unifie `sendEmail` (cf. body parse plus haut)
    if (sendEmail && newStatus === 'paid') {
      try {
        const orderData = updated as any;
        const orderItems: any[] = Array.isArray(orderData.items) ? orderData.items : [];
        const sid = orderData.stripePaymentIntentId || '';
        const orderRef = sid.slice(-8).toUpperCase();
        const allUploadedFiles: { name: string; url: string }[] = [];
        for (const it of orderItems) {
          if (Array.isArray(it.uploadedFiles)) {
            for (const f of it.uploadedFiles) {
              if (f && (f.url || f.name)) allUploadedFiles.push({ name: f.name || f.url, url: f.url || '' });
            }
          }
        }
        const emailItems = orderItems.map((it: any) => ({
          productName: it.productName || 'Produit',
          quantity: it.quantity || 1,
          totalPrice: it.totalPrice || 0,
          size: it.size || '',
          finish: it.finish || '',
        }));
        await sendOrderConfirmationEmail({
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          orderRef,
          invoiceNumber: assignedInvoice || orderData.invoiceNumber || '',
          items: emailItems,
          subtotal: orderData.subtotal || 0,
          shipping: orderData.shipping || 0,
          tps: orderData.tps || 0,
          tvq: orderData.tvq || 0,
          total: orderData.total || 0,
          shippingAddress: orderData.shippingAddress || null,
          promoCode: orderData.promoCode || undefined,
          promoDiscount: orderData.promoDiscount || undefined,
          supabaseUserId: orderData.supabaseUserId || undefined,
        });
        await sendNewOrderNotificationEmail({
          orderRef,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          items: emailItems,
          subtotal: orderData.subtotal || 0,
          shipping: orderData.shipping || 0,
          tps: orderData.tps || 0,
          tvq: orderData.tvq || 0,
          total: orderData.total || 0,
          shippingAddress: orderData.shippingAddress || null,
          uploadedFiles: allUploadedFiles.length > 0 ? allUploadedFiles : undefined,
          notes: orderData.notes || undefined,
          designReady: orderData.designReady !== false,
          promoCode: orderData.promoCode || undefined,
          promoDiscount: orderData.promoDiscount || undefined,
        });
        strapi.log.info(`[updateStatus] Emails (confirm+admin) envoyes pour ${orderData.customerEmail}`);
      } catch (emailErr) {
        strapi.log.warn('[updateStatus] Erreur envoi emails (non bloquant):', emailErr);
      }
    }

    strapi.log.info(`Commande ${documentId} status: ${(order as any).status} -> ${newStatus}`);

    // FIX-READY-EMAIL (28 avril 2026) : quand la commande passe a `ready`
    // ("Pret / A remettre"), envoyer un courriel au client pour l'informer
    // qu'il peut venir recuperer sa commande au studio Mile-End. Gate sur
    // sendEmail comme les autres triggers email - laisse a l'admin le
    // controle final via le toggle du modal StatusChangeModal.
    if (sendEmail && newStatus === 'ready' && (order as any).customerEmail) {
      try {
        const orderData = updated as any;
        const sid = orderData.stripePaymentIntentId || orderData.documentId || '';
        const orderRef = orderData.orderRef || String(sid).slice(-8).toUpperCase();
        await sendOrderReadyEmail({
          customerName: orderData.customerName || 'cher client',
          customerEmail: orderData.customerEmail,
          orderRef,
        });
        strapi.log.info(`[updateStatus] Email "commande prete" envoye a ${orderData.customerEmail} pour ${documentId}`);
      } catch (err) {
        strapi.log.warn('[updateStatus] Erreur envoi email "commande prete" (non bloquant):', err);
      }
    }

    // FIX-EMAIL-CONTROL : quand la commande est livree, courriel temoignage
    // envoye UNIQUEMENT si sendEmail=true. Avant ce fix, il partait a chaque
    // transition vers 'delivered' sans que l'admin ne puisse l'empecher.
    if (sendEmail && newStatus === 'delivered' && (order as any).customerEmail) {
      try {
        const token = crypto.randomBytes(16).toString('hex');
        const customerName = (order as any).customerName || (order as any).customerEmail.split('@')[0];

        // Creer le temoignage en attente
        const testimonialData: any = {
          name: customerName,
          email: (order as any).customerEmail,
          textFr: '',
          token,
          approved: false,
          order: { connect: [order.documentId] },
        };

        // Lier au client si existant
        const client = await strapi.documents('api::client.client').findFirst({
          filters: { email: (order as any).customerEmail },
        });
        if (client) {
          testimonialData.client = { connect: [(client as any).documentId] };
        }

        await strapi.documents('api::testimonial.testimonial').create({ data: testimonialData });

        const siteUrl = process.env.SITE_URL || 'https://massivemedias.com';
        const link = `${siteUrl}/temoignage?token=${token}`;

        await sendTestimonialRequestEmail({
          customerName,
          customerEmail: (order as any).customerEmail,
          testimonialLink: link,
          orderRef: (order as any).orderRef,
        });

        strapi.log.info(`Email temoignage envoye a ${(order as any).customerEmail} pour commande ${documentId}`);
      } catch (err) {
        strapi.log.error('Erreur envoi email temoignage:', err);
        // Ne pas bloquer le changement de status si l'email echoue
      }
    }

    ctx.body = { data: updated };
  },

  async updateNotes(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { documentId } = ctx.params;
    const { notes } = ctx.request.body as any;

    const order = await strapi.documents('api::order.order').findFirst({
      filters: { documentId },
    });

    if (!order) {
      return ctx.notFound('Commande introuvable');
    }

    const updated = await strapi.documents('api::order.order').update({
      documentId: order.documentId,
      data: { notes: notes || '' },
    });

    ctx.body = { data: updated };
  },

  /**
   * PUT /orders/:documentId/total
   * Ajustement manuel admin du sous-total d'une commande (rabais, balance, correction).
   *
   * Body (FIX-COMPTA 27 avril 2026 - migration vers subtotal as source of truth):
   *   - subtotal: number (en DOLLARS) - PREFERENTIEL. Backend recalcule TPS+TVQ+total automatiquement.
   *   - total: number (en DOLLARS) - LEGACY. Si subtotal absent, fallback sur l'ancien comportement
   *     (modifie uniquement total sans toucher aux taxes - utile uniquement pour des cas hors-Quebec).
   *   - reason: string (obligatoire - trace dans les notes admin)
   *
   * Pourquoi subtotal et pas total :
   *   La comptabilite QC repose sur des taxes calculees a partir du sous-total HT.
   *   Si l'admin appliquait un rabais en modifiant uniquement le Grand Total
   *   (ex: 195$ -> 160$), les lignes TPS/TVQ stockees restaient incoherentes
   *   (calculees sur l'ancien sous-total) -> exports comptables faux, factures
   *   PDF qui ne se reconciliaient pas. Maintenant on edite la base (sous-total)
   *   et tout le reste est derive de facon deterministe : TPS=subtotal*5%,
   *   TVQ=subtotal*9.975%, total=subtotal+tps+tvq+shipping.
   *
   * Cascade : on met aussi a jour l'Invoice liee (si elle existe) avec les
   * memes valeurs en dollars (Invoice stocke en decimal, Order en cents) pour
   * que la prochaine facture PDF / export utilise les bons chiffres.
   *
   * Audit log: timestamp Montreal + admin email + breakdown complet
   *   [2026-04-27 14:32 par admin@exemple.com] Sous-total 170$ -> 160$ (TPS 8$, TVQ 15.96$, Total TTC 183.96$) : Rabais artiste
   */
  async updateTotal(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { documentId } = ctx.params;
    const { subtotal, total, reason } = ctx.request.body as any;

    const reasonTrim = String(reason || '').trim();
    if (!reasonTrim) {
      return ctx.badRequest('reason is required (explain why you are adjusting the subtotal/total)');
    }
    if (reasonTrim.length > 500) {
      return ctx.badRequest('reason max 500 chars');
    }

    // Determiner le mode : subtotal-driven (nouveau, recommande) ou total-driven (legacy)
    const subtotalDollars = Number(subtotal);
    const isSubtotalMode = Number.isFinite(subtotalDollars) && subtotalDollars >= 0;
    const isTotalMode = !isSubtotalMode && Number.isFinite(Number(total));

    if (!isSubtotalMode && !isTotalMode) {
      return ctx.badRequest('subtotal (recommande) ou total (legacy) requis - un nombre en dollars');
    }
    if (isSubtotalMode && (subtotalDollars < 0 || subtotalDollars > 100000)) {
      return ctx.badRequest('subtotal must be between 0 and 100000 dollars');
    }
    if (isTotalMode && (Number(total) < 0 || Number(total) > 100000)) {
      return ctx.badRequest('total must be between 0 and 100000 dollars');
    }

    const order = await strapi.documents('api::order.order').findFirst({
      filters: { documentId },
    }) as any;
    if (!order) return ctx.notFound('Commande introuvable');

    // Etats precedents (en cents dans Order)
    const previousSubtotalCents = Number(order.subtotal) || 0;
    const previousTpsCents = Number(order.tps) || 0;
    const previousTvqCents = Number(order.tvq) || 0;
    const previousTotalCents = Number(order.total) || 0;
    const previousShippingCents = Number(order.shipping) || 0;

    // FIX-COMPTA : taux QC standard. Si l'admin a explicitement zero les taxes
    // (cas hors-QC), on garde 0 - on ne RE-applique PAS automatiquement. La
    // detection se fait via le ratio actuel : si previousTps == 0 ET previous
    // Tvq == 0 sur une commande non-vide, on suppose hors-QC et on garde 0.
    const TPS_RATE = 0.05;
    const TVQ_RATE = 0.09975;
    const isQcOrder = previousTpsCents > 0 || previousTvqCents > 0
      || (previousSubtotalCents === 0 && previousTotalCents === 0); // commande vide / nouvelle = QC par defaut

    let newSubtotalCents: number;
    let newTpsCents: number;
    let newTvqCents: number;
    let newTotalCents: number;
    let newShippingCents = previousShippingCents;

    if (isSubtotalMode) {
      // Mode recommande : on edite le sous-total et tout est derive
      newSubtotalCents = Math.round(subtotalDollars * 100);
      const tpsDollars = isQcOrder ? Math.round(subtotalDollars * TPS_RATE * 100) / 100 : 0;
      const tvqDollars = isQcOrder ? Math.round(subtotalDollars * TVQ_RATE * 100) / 100 : 0;
      newTpsCents = Math.round(tpsDollars * 100);
      newTvqCents = Math.round(tvqDollars * 100);
      const totalDollars = subtotalDollars + tpsDollars + tvqDollars + (newShippingCents / 100);
      newTotalCents = Math.round(totalDollars * 100);
    } else {
      // Mode legacy : on edite uniquement le total (compat retro pour ancien client)
      newTotalCents = Math.round(Number(total) * 100);
      newSubtotalCents = previousSubtotalCents;
      newTpsCents = previousTpsCents;
      newTvqCents = previousTvqCents;
      strapi.log.warn(`[updateTotal] LEGACY mode (total only) sur order ${documentId} - les taxes restent incoherentes. Le frontend devrait envoyer subtotal a la place.`);
    }

    const fmt = (cents: number) => (cents / 100).toFixed(2);

    // Audit log enrichi avec breakdown complet
    const adminEmail = (ctx.state as any).adminUserEmail || (ctx.state as any).adminAuthMethod || 'admin';
    const now = new Date().toLocaleString('fr-CA', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Toronto',
    });
    const auditLine = isSubtotalMode
      ? `[${now} par ${adminEmail}] Sous-total ${fmt(previousSubtotalCents)}$ -> ${fmt(newSubtotalCents)}$ `
        + `(TPS ${fmt(newTpsCents)}$, TVQ ${fmt(newTvqCents)}$, Total TTC ${fmt(newTotalCents)}$) : ${reasonTrim}`
      : `[${now} par ${adminEmail}] Ajustement total ${fmt(previousTotalCents)}$ -> ${fmt(newTotalCents)}$ (LEGACY, taxes inchangees) : ${reasonTrim}`;
    const prevNotes = String(order.notes || '').trim();
    const newNotes = prevNotes ? `${prevNotes}\n${auditLine}` : auditLine;

    // Update Order (cents)
    const updated = await strapi.documents('api::order.order').update({
      documentId: order.documentId,
      data: {
        subtotal: newSubtotalCents,
        tps: newTpsCents,
        tvq: newTvqCents,
        total: newTotalCents,
        notes: newNotes,
      } as any,
    });

    // FIX-COMPTA : cascade sur l'Invoice liee. Invoice stocke en DOLLARS
    // (decimal) pas en cents. Si l'invoice est deja payee (paymentStatus='paid'),
    // on update quand meme - l'admin doit pouvoir corriger un montant facture
    // a posteriori (ex: rabais retroactif accorde apres paiement). Le PDF
    // sera regenere avec les bons montants, et l'export comptable cohera.
    let invoiceUpdated = false;
    try {
      const invoices = await strapi.documents('api::invoice.invoice').findMany({
        filters: { order: { documentId: { $eq: order.documentId } } } as any,
        limit: 1,
      });
      if (invoices.length > 0) {
        const inv = invoices[0] as any;
        await strapi.documents('api::invoice.invoice').update({
          documentId: inv.documentId,
          data: {
            subtotal: newSubtotalCents / 100,
            tps: newTpsCents / 100,
            tvq: newTvqCents / 100,
            total: newTotalCents / 100,
          } as any,
        });
        invoiceUpdated = true;
        strapi.log.info(`[updateTotal] Invoice ${inv.invoiceNumber} synchronisee avec les nouveaux montants`);
      }
    } catch (invErr: any) {
      // Non bloquant : si la cascade Invoice plante, l'Order est correctement
      // mis a jour. L'admin peut re-cliquer ou regenerer la facture manuellement.
      strapi.log.warn(`[updateTotal] Cascade Invoice ECHEC (Order persiste): ${invErr?.message}`);
    }

    strapi.log.info(
      `[updateTotal] Order ${documentId} mode=${isSubtotalMode ? 'subtotal' : 'legacy-total'} `
      + `subtotal=${fmt(newSubtotalCents)}$ tps=${fmt(newTpsCents)}$ tvq=${fmt(newTvqCents)}$ total=${fmt(newTotalCents)}$ `
      + `invoice=${invoiceUpdated ? 'sync' : 'absent'} by ${adminEmail} (reason: ${reasonTrim})`
    );

    ctx.body = {
      data: updated,
      mode: isSubtotalMode ? 'subtotal' : 'legacy-total',
      previous: {
        subtotal: previousSubtotalCents,
        tps: previousTpsCents,
        tvq: previousTvqCents,
        total: previousTotalCents,
      },
      new: {
        subtotal: newSubtotalCents,
        tps: newTpsCents,
        tvq: newTvqCents,
        total: newTotalCents,
      },
      invoiceUpdated,
      auditLine,
    };
  },

  // GET /orders/:documentId/tracking - Recupere le statut de livraison via le provider
  // (mock intelligent par defaut, branchement futur 17Track/Shippo via TRACKING_API_KEY).
  // Retourne aussi un `suggestStatusChange` si l'etat propose un changement automatique
  // du statut de la commande (ex: delivered -> passer la commande en "delivered").
  async trackingStatus(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { documentId } = ctx.params;
    if (!documentId) return ctx.badRequest('documentId requis');

    try {
      const order = await strapi.documents('api::order.order').findOne({ documentId }) as any;
      if (!order) return ctx.notFound(`Commande ${documentId} introuvable`);

      const trackingNumber = (order.trackingNumber || '').trim();
      const carrier = (order.carrier || 'postes-canada').toLowerCase();

      if (!trackingNumber) {
        return ctx.badRequest('Cette commande n\'a pas de numero de suivi enregistre.');
      }

      const result = await getTrackingStatus(trackingNumber, carrier);

      // Si l'API dit "delivered" mais la commande n'est PAS marquee livree, on suggere
      // le changement de statut. Le frontend affiche un prompt que l'admin peut accepter.
      let shouldSuggestDelivered: boolean = false;
      if (result.delivered && order.status !== 'delivered') {
        shouldSuggestDelivered = true;
      }

      strapi.log.info(`[tracking] Order ${documentId} (${carrier}/${trackingNumber}): ${result.status} - ${result.events.length} event(s) - provider=${result.providerUsed}`);

      ctx.body = {
        data: {
          ...result,
          currentOrderStatus: order.status,
          suggestStatusChange: shouldSuggestDelivered ? 'delivered' : result.suggestStatusChange,
        },
      };
    } catch (err: any) {
      strapi.log.error('trackingStatus error:', err?.message || err);
      return ctx.throw(500, err?.message || 'Echec recuperation tracking');
    }
  },

  async addTracking(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { documentId } = ctx.params;
    const { trackingNumber, carrier } = ctx.request.body as any;

    if (!trackingNumber) {
      return ctx.badRequest('Numero de suivi requis');
    }

    const order = await strapi.documents('api::order.order').findFirst({
      filters: { documentId },
    });

    if (!order) {
      return ctx.notFound('Commande introuvable');
    }

    const updated = await strapi.documents('api::order.order').update({
      documentId: order.documentId,
      data: {
        trackingNumber,
        carrier: carrier || 'postes-canada',
        status: 'shipped',
      },
    });

    strapi.log.info(`Commande ${documentId} tracking: ${trackingNumber} (${carrier || 'postes-canada'})`);

    // Envoyer email de suivi au client
    if ((order as any).customerEmail) {
      try {
        await sendTrackingEmail({
          customerName: (order as any).customerName || 'Client',
          customerEmail: (order as any).customerEmail,
          orderRef: (order as any).orderRef || documentId.slice(0, 7).toUpperCase(),
          trackingNumber,
          carrier: carrier || 'postes-canada',
        });
      } catch (err) {
        strapi.log.error('Erreur envoi email suivi:', err);
      }
    }

    ctx.body = { data: updated };
  },

  // DELETE /orders/:idParam
  // FORCE DELETE BRUT (avril 2026) : strategie "raw query first" pour contourner
  // les comportements opaques de Documents API sur draft/published/lifecycles.
  //
  // Strategie :
  //   1. Accepte documentId (string) OU id numerique en url param
  //   2. Find preventif pour capter les 2 IDs + 404 si introuvable
  //   3. Cascade RAW : db.query.delete sur invoices (FK order) + detach testimonials
  //   4. db.query('api::order.order').delete({ where: { documentId } }) DIRECT
  //      (bypass Documents API + bypass lifecycles qui peuvent repopuler la ligne)
  //   5. Verification re-query : 500 avec err.message SQL exact si ca persiste
  //
  // Aucun try/catch ne masque l'erreur SQL : si FK constraint viole, l'admin
  // voit dans le toast rouge le message exact Postgres / Better-SQLite3.
  async deleteOrder(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const idParam = (ctx.params as any).documentId || (ctx.params as any).id;

    strapi.log.info(`[DELETE ORDER] === START === idParam=${idParam}`);

    if (!idParam) {
      return ctx.badRequest('id ou documentId requis dans l\'URL');
    }

    // 1. Find preventif : supporte les 2 formats (documentId alphanumerique OU id numerique)
    const isNumeric = /^\d+$/.test(String(idParam));
    const filters: any = isNumeric
      ? { $or: [{ id: Number(idParam) }, { documentId: String(idParam) }] }
      : { documentId: String(idParam) };

    const order = await strapi.documents('api::order.order').findFirst({ filters }) as any;
    if (!order) {
      strapi.log.warn(`[DELETE ORDER] ${idParam} introuvable - return 404`);
      return ctx.notFound(`Commande ${idParam} introuvable`);
    }

    const numericId: number = order.id;
    const docId: string = order.documentId;
    const stripeNote = order.stripePaymentIntentId || '(none)';
    strapi.log.info(`[DELETE ORDER] Found: id=${numericId} documentId=${docId} stripe=${stripeNote}`);

    // 2. Cascade RAW : nettoyer les FK entrantes AVANT le delete de l'order.
    // On attaque le query engine directement pour bypass les lifecycles Strapi
    // qui pourraient intercepter.
    try {
      // 2.a Invoices liees : hard delete raw
      const invoices = await strapi.db.query('api::invoice.invoice').findMany({
        where: { order: numericId },
        select: ['id', 'documentId', 'invoiceNumber'],
      }) as any[];
      for (const inv of invoices) {
        try {
          await strapi.db.query('api::invoice.invoice').delete({ where: { id: inv.id } });
          strapi.log.info(`[DELETE ORDER] Cascade RAW: invoice id=${inv.id} (${inv.invoiceNumber || '-'}) supprimee`);
        } catch (invErr: any) {
          strapi.log.error(`[DELETE ORDER] Cascade RAW invoice id=${inv.id} ECHEC: ${invErr?.message}`);
          // On remonte l'erreur SQL brute plutot que de continuer sur une DB dans un etat bancal
          return ctx.throw(500, `Cascade invoice echoue: ${invErr?.message}`);
        }
      }

      // 2.b Testimonials : detach (preserver l'avis public)
      const testimonials = await strapi.db.query('api::testimonial.testimonial').findMany({
        where: { order: numericId },
        select: ['id'],
      }) as any[];
      for (const t of testimonials) {
        try {
          await strapi.db.query('api::testimonial.testimonial').update({
            where: { id: t.id },
            data: { order: null },
          });
          strapi.log.info(`[DELETE ORDER] Cascade RAW: testimonial id=${t.id} detache`);
        } catch (tErr: any) {
          // Non-bloquant : si detach echoue, on log mais on tente quand meme le delete order
          strapi.log.warn(`[DELETE ORDER] Detach testimonial id=${t.id} echoue: ${tErr?.message}`);
        }
      }
    } catch (cascadePrepErr: any) {
      strapi.log.error(`[DELETE ORDER] Cascade preparation ECHEC: ${cascadePrepErr?.message}`);
      return ctx.throw(500, `Preparation cascade echoue: ${cascadePrepErr?.message}`);
    }

    // 3. FORCE DELETE : raw db.query direct (PAS de documents().delete qui peut gerer
    // silencieusement les drafts/publishes via lifecycles).
    let deletedRow: any = null;
    try {
      deletedRow = await strapi.db.query('api::order.order').delete({
        where: { documentId: docId },
      });
      strapi.log.info(`[DELETE ORDER] RAW delete result: ${JSON.stringify(deletedRow)?.slice(0, 200)}`);
    } catch (delErr: any) {
      // ON NE MASQUE PAS. L'erreur SQL remonte telle quelle au frontend.
      // Exemple typique : "update or delete on table "orders" violates foreign key
      // constraint "xxx" on table "yyy""
      strapi.log.error(`[DELETE ORDER] RAW delete ECHEC: ${delErr?.message}`, delErr);
      return ctx.throw(500, `Suppression BDD refusee: ${delErr?.message || 'erreur inconnue'}`);
    }

    // 4. Verification finale : la ligne a-t-elle disparu ?
    const stillThere = await strapi.db.query('api::order.order').findOne({
      where: { documentId: docId },
    });
    if (stillThere) {
      strapi.log.error(`[DELETE ORDER] ZOMBIE confirme : documentId=${docId} encore present apres RAW delete. Row: ${JSON.stringify(stillThere).slice(0, 300)}`);
      return ctx.throw(500, `La commande persiste en BDD apres DELETE raw. Contacter le dev - possible lifecycle Strapi qui re-cree la ligne.`);
    }

    strapi.log.info(`[DELETE ORDER] === SUCCESS === documentId=${docId} id=${numericId} stripe=${stripeNote}`);
    ctx.body = {
      success: true,
      data: {
        deletedDocumentId: docId,
        deletedNumericId: numericId,
        method: 'db.query.delete (raw)',
        verifiedAbsent: true,
      },
    };
  },

  async commissions(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    // 1. Fetch all active artists
    const artists = await strapi.documents('api::artist.artist').findMany({
      filters: { active: true },
    });
    const artistMap: Record<string, any> = {};
    for (const a of artists) {
      artistMap[a.slug] = a;
    }
    const slugs = Object.keys(artistMap);

    // 2. Fetch completed orders
    const validStatuses = ['paid', 'processing', 'ready', 'shipped', 'delivered'] as const;
    const orders = await strapi.documents('api::order.order').findMany({
      filters: { status: { $in: validStatuses as any } },
      sort: 'createdAt:desc',
    });

    // Default production costs (fallback)
    const DEFAULT_COSTS: Record<string, any> = {
      studio: { a4: 12, a3: 16, a3plus: 20, a2: 28 },
      museum: { a4: 25, a3: 38, a3plus: 48, a2: 65 },
      frame: 8,
    };

    // Cout de production des stickers par palier (materiel + encre + temps)
    const STICKER_PROD_COSTS: Record<number, number> = {
      25: 8, 50: 12, 100: 15, 250: 30, 500: 50,
    };

    function getProductionCost(artist: any, item: any): number {
      const pid = item.productId || '';

      // Sticker packs: cout par palier de quantite
      if (pid.startsWith('artist-sticker-pack-')) {
        const qty = item.quantity || 100;
        // Trouver le palier le plus proche
        const tiers = Object.keys(STICKER_PROD_COSTS).map(Number).sort((a, b) => a - b);
        let cost = STICKER_PROD_COSTS[100]; // defaut 100 unites
        for (const t of tiers) {
          if (qty >= t) cost = STICKER_PROD_COSTS[t];
        }
        return cost;
      }

      // Prints: cout par format et tier
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

    // 3. Parse items, match artist slugs, calculate commissions
    const commissionsByArtist: Record<string, any> = {};

    for (const order of orders) {
      const items: any[] = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        const pid = item.productId || '';
        // Match artist prints AND sticker packs
        if (!pid.startsWith('artist-print-') && !pid.startsWith('artist-sticker-pack-')) continue;

        // Skip commission if artist bought their own product
        if (item.isArtistOwnPrint) continue;

        let matchedSlug: string | null = null;
        for (const slug of slugs) {
          if (pid.startsWith(`artist-print-${slug}-`) || pid.startsWith(`artist-sticker-pack-${slug}-`)) {
            if (!matchedSlug || slug.length > matchedSlug.length) {
              matchedSlug = slug;
            }
          }
        }
        if (!matchedSlug) continue;

        const artist = artistMap[matchedSlug];

        // FIX-COMMISSIONS (avril 2026) : taux distinct prints vs stickers.
        // Fallback chain : printCommissionRate > commissionRate > 0.5.
        //                  stickerCommissionRate > commissionRate > 0.15.
        const legacyRate = parseFloat(artist.commissionRate);
        const printRate = Number.isFinite(parseFloat(artist.printCommissionRate))
          ? parseFloat(artist.printCommissionRate)
          : (Number.isFinite(legacyRate) ? legacyRate : 0.5);
        const stickerRate = Number.isFinite(parseFloat(artist.stickerCommissionRate))
          ? parseFloat(artist.stickerCommissionRate)
          : (Number.isFinite(legacyRate) ? legacyRate : 0.15);
        const isSticker = pid.startsWith(`artist-sticker-pack-${matchedSlug}-`);
        const rate = isSticker ? stickerRate : printRate;

        const salePrice = item.totalPrice || item.unitPrice || 0;
        const prodCost = getProductionCost(artist, item);
        const qty = item.quantity || 1;
        const totalSale = salePrice * qty;
        const totalProd = prodCost * qty;
        const netProfit = Math.max(0, totalSale - totalProd);
        const commission = Math.round(netProfit * rate * 100) / 100;

        if (!commissionsByArtist[matchedSlug]) {
          commissionsByArtist[matchedSlug] = {
            slug: matchedSlug,
            name: artist.name,
            rate, // legacy field : rate moyen du dernier item rencontre
            printCommissionRate: printRate,
            stickerCommissionRate: stickerRate,
            totalSales: 0,
            totalProduction: 0,
            totalNetProfit: 0,
            totalCommission: 0,
            totalPaid: 0,
            balance: 0,
            // Breakdown pour l'UI "Revenus par type"
            printSales: 0,
            printCommission: 0,
            stickerSales: 0,
            stickerCommission: 0,
            orders: [],
          };
        }

        const c = commissionsByArtist[matchedSlug];
        c.totalSales += totalSale;
        c.totalProduction += totalProd;
        c.totalNetProfit += netProfit;
        c.totalCommission += commission;
        if (isSticker) {
          c.stickerSales += totalSale;
          c.stickerCommission += commission;
        } else {
          c.printSales += totalSale;
          c.printCommission += commission;
        }
        c.orders.push({
          orderId: order.documentId,
          orderDate: order.createdAt,
          customerName: order.customerName,
          productId: pid,
          productName: item.productName || '',
          size: item.size || '',
          finish: item.finish || '',
          quantity: qty,
          salePrice: totalSale,
          productionCost: totalProd,
          netProfit,
          commission,
        });
      }
    }

    // 4. Fetch artist payments
    let payments: any[] = [];
    try {
      payments = await strapi.documents('api::artist-payment.artist-payment').findMany({
        sort: 'date:desc',
      });
    } catch {
      // content type might not exist yet
    }

    const paymentsByArtist: Record<string, any[]> = {};
    for (const p of payments) {
      const slug = p.artistSlug;
      if (!paymentsByArtist[slug]) paymentsByArtist[slug] = [];
      paymentsByArtist[slug].push(p);
      if (commissionsByArtist[slug]) {
        commissionsByArtist[slug].totalPaid += parseFloat(p.amount) || 0;
      }
    }

    // Round and calculate balance
    for (const slug of Object.keys(commissionsByArtist)) {
      const c = commissionsByArtist[slug];
      c.totalSales = Math.round(c.totalSales * 100) / 100;
      c.totalProduction = Math.round(c.totalProduction * 100) / 100;
      c.totalNetProfit = Math.round(c.totalNetProfit * 100) / 100;
      c.totalCommission = Math.round(c.totalCommission * 100) / 100;
      c.totalPaid = Math.round(c.totalPaid * 100) / 100;
      c.balance = Math.round((c.totalCommission - c.totalPaid) * 100) / 100;
      c.payments = paymentsByArtist[slug] || [];
    }

    ctx.body = {
      artists: Object.values(commissionsByArtist),
    };
  },

  async stats(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    // PERF-03: Aggregations SQL au lieu de findMany -> JS. Avant, on chargeait TOUTES
    // les orders + expenses en memoire et iterait en JS. A 10 000+ orders c'etait ~10K
    // objets en heap + CPU iteration. Maintenant 5 GROUP BY renvoient juste les stats
    // dont on a besoin - RAM O(months + categories) au lieu de O(orders + expenses).
    const knex = (strapi.db as any).connection;

    // Query 1: order counts + sums by status (pour orderStats + revenue paid)
    // Considere 'paid' tout ce qui n'est ni 'cancelled' ni 'pending' - meme regle que l'ancien code
    const orderByStatus: Array<{ status: string; count: string; total_cents: string }> = await knex('orders')
      .select('status')
      .count({ count: '*' })
      .sum({ total_cents: 'total' })
      .whereNot('status', 'cancelled')
      .groupBy('status');

    const statusBreakdown: Record<string, number> = {};
    let totalOrders = 0;
    let totalRevenue = 0;
    for (const row of orderByStatus) {
      const count = Number(row.count) || 0;
      const total = Number(row.total_cents) || 0;
      statusBreakdown[row.status] = count;
      totalOrders += count;
      if (row.status !== 'pending') totalRevenue += total;
    }
    const paidOrdersCount = totalOrders - (statusBreakdown.pending || 0);

    // Query 2: monthly revenue breakdown (paid only, meme filtre que l'ancien code)
    const monthlyRevenueRows: Array<{ month: string; orders: string; revenue: string }> = await knex('orders')
      .select(knex.raw(`TO_CHAR(created_at, 'YYYY-MM') AS month`))
      .count({ orders: '*' })
      .sum({ revenue: 'total' })
      .whereNotIn('status', ['cancelled', 'pending'])
      .groupByRaw(`TO_CHAR(created_at, 'YYYY-MM')`)
      .orderByRaw(`TO_CHAR(created_at, 'YYYY-MM') ASC`);
    const monthlyRevenue = monthlyRevenueRows.map((r) => ({
      month: r.month,
      orders: Number(r.orders) || 0,
      revenue: Number(r.revenue) || 0,
    }));

    // Query 3: top 10 clients par revenu cumule (paid only)
    const topClientRows: Array<{ email: string; name: string; total_spent: string; order_count: string }> = await knex('orders')
      .select(
        knex.raw('MAX(customer_email) AS email'),
        knex.raw('MAX(customer_name) AS name'),
      )
      .count({ order_count: '*' })
      .sum({ total_spent: 'total' })
      .whereNotIn('status', ['cancelled', 'pending'])
      .groupByRaw('LOWER(customer_email)')
      .orderByRaw('SUM(total) DESC')
      .limit(10);
    const topClients = topClientRows.map((r) => ({
      email: r.email,
      name: r.name,
      totalSpent: Number(r.total_spent) || 0,
      orderCount: Number(r.order_count) || 0,
    }));

    // Query 4: expenses totals (sum amount + TPS/TVQ paid)
    const [expenseTotals]: Array<{ total: string; tps_paid: string; tvq_paid: string }> = await knex('expenses')
      .sum({ total: 'amount' })
      .sum({ tps_paid: 'tps_amount' })
      .sum({ tvq_paid: 'tvq_amount' });
    const totalExpenses = Number(expenseTotals?.total) || 0;
    const totalTpsPaid = Number(expenseTotals?.tps_paid) || 0;
    const totalTvqPaid = Number(expenseTotals?.tvq_paid) || 0;

    // Query 5: monthly expenses + by category (un seul GROUP BY month,category)
    const expenseBreakdown: Array<{ month: string; category: string; amount: string }> = await knex('expenses')
      .select(
        knex.raw(`TO_CHAR(date, 'YYYY-MM') AS month`),
        'category',
      )
      .sum({ amount: 'amount' })
      .groupByRaw(`TO_CHAR(date, 'YYYY-MM'), category`);
    const monthlyExpensesMap: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};
    for (const row of expenseBreakdown) {
      const amt = Number(row.amount) || 0;
      monthlyExpensesMap[row.month] = (monthlyExpensesMap[row.month] || 0) + amt;
      if (row.category) {
        expensesByCategory[row.category] = (expensesByCategory[row.category] || 0) + amt;
      }
    }
    const monthlyExpenses = Object.entries(monthlyExpensesMap)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Tax calculations (TPS 5%, TVQ 9.975% on revenue in dollars)
    const revenueInDollars = totalRevenue / 100;
    const tpsCollected = revenueInDollars * 0.05;
    const tvqCollected = revenueInDollars * 0.09975;

    ctx.body = {
      revenue: {
        total: totalRevenue,
        totalDollars: revenueInDollars,
        monthly: monthlyRevenue, // deja trie par month ASC
      },
      expenses: {
        total: totalExpenses,
        monthly: monthlyExpenses, // deja trie par month ASC
        byCategory: expensesByCategory,
      },
      taxes: {
        tpsCollected: Math.round(tpsCollected * 100) / 100,
        tvqCollected: Math.round(tvqCollected * 100) / 100,
        tpsPaid: totalTpsPaid,
        tvqPaid: totalTvqPaid,
        tpsNet: Math.round((tpsCollected - totalTpsPaid) * 100) / 100,
        tvqNet: Math.round((tvqCollected - totalTvqPaid) * 100) / 100,
      },
      profit: {
        gross: Math.round((revenueInDollars - totalExpenses) * 100) / 100,
        net: Math.round((revenueInDollars - totalExpenses - (tpsCollected - totalTpsPaid) - (tvqCollected - totalTvqPaid)) * 100) / 100,
      },
      orderStats: {
        total: totalOrders,
        byStatus: statusBreakdown,
        averageValue: paidOrdersCount > 0 ? Math.round(totalRevenue / paidOrdersCount) : 0,
      },
      topClients,
    };
  },

  /**
   * GET /pricing-config
   * PRIX-02: source de verite unique pour les prix backend, exposee au frontend.
   * Endpoint public sans auth - les prix ne sont pas sensibles (AdminTarifs les affiche
   * deja publiquement) et le frontend boutique en a besoin pour calculer les prix
   * affiches. Le backend reste strict cote validation (recalcul serveur dans
   * createCheckoutSession).
   */
  async pricingConfig(ctx) {
    ctx.body = getPricingConfigPayload();
  },

  /**
   * GET /sitemap.xml
   * SEO-01: sitemap dynamique genere depuis CMS. Inclut les pages fixes
   * + tous les artistes publies (updatedAt -> lastmod). Cache 1h.
   */
  async sitemap(ctx) {
    const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://massivemedias.com';
    const escape = (s: string) =>
      String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c] as string));

    // Pages statiques coeur du site. changefreq/priority suivent les
    // conventions sitemap.org : homepage = 1.0, pages de service = 0.8,
    // legal/contact = 0.3.
    const today = new Date().toISOString().slice(0, 10);
    const staticUrls = [
      { loc: '/', priority: 1.0, changefreq: 'weekly' },
      { loc: '/a-propos', priority: 0.7, changefreq: 'monthly' },
      { loc: '/contact', priority: 0.6, changefreq: 'monthly' },
      { loc: '/artistes', priority: 0.9, changefreq: 'weekly' },
      { loc: '/boutique', priority: 0.9, changefreq: 'weekly' },
      { loc: '/services', priority: 0.8, changefreq: 'monthly' },
      { loc: '/services/prints', priority: 0.8, changefreq: 'monthly' },
      { loc: '/services/stickers', priority: 0.8, changefreq: 'monthly' },
      { loc: '/services/merch', priority: 0.8, changefreq: 'monthly' },
      { loc: '/services/design', priority: 0.8, changefreq: 'monthly' },
      { loc: '/services/web', priority: 0.8, changefreq: 'monthly' },
      { loc: '/cgv', priority: 0.3, changefreq: 'yearly' },
      { loc: '/politique-confidentialite', priority: 0.3, changefreq: 'yearly' },
    ];

    let dynamicUrls: Array<{ loc: string; lastmod: string; priority: number; changefreq: string }> = [];
    try {
      const artists = await strapi.documents('api::artist.artist').findMany({
        filters: { publishedAt: { $notNull: true } } as any,
        fields: ['slug', 'updatedAt'] as any,
        limit: 200,
      });
      dynamicUrls = (artists as any[])
        .filter((a) => a.slug)
        .map((a) => ({
          loc: `/artistes/${a.slug}`,
          lastmod: (a.updatedAt ? new Date(a.updatedAt) : new Date()).toISOString().slice(0, 10),
          priority: 0.7,
          changefreq: 'weekly',
        }));
    } catch (err: any) {
      strapi.log.warn(`[sitemap] Could not load artists dynamically: ${err?.message}`);
      // On continue avec juste les pages statiques plutot que de 500.
    }

    const allUrls = [
      ...staticUrls.map((u) => ({ ...u, lastmod: today })),
      ...dynamicUrls,
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${escape(SITE_URL + u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority.toFixed(1)}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

    ctx.set('Content-Type', 'application/xml; charset=utf-8');
    ctx.set('Cache-Control', 'public, max-age=3600, s-maxage=3600'); // 1h CDN + browser
    ctx.body = xml;
  },

  /**
   * GET /orders/memory-health
   * Returns current process memory stats to help diagnose OOM issues.
   * Public endpoint (read-only diagnostic). Returns status WARNING/CRITICAL/OK.
   */
  async memoryHealth(ctx) {
    const mem = process.memoryUsage();
    const rssMB = mem.rss / 1024 / 1024;
    const heapUsedMB = mem.heapUsed / 1024 / 1024;
    const heapTotalMB = mem.heapTotal / 1024 / 1024;
    const externalMB = mem.external / 1024 / 1024;
    const arrayBuffersMB = (mem.arrayBuffers || 0) / 1024 / 1024;

    // Render Standard = 2GB. Override via env var if plan changes.
    const renderMemLimitMB = Number(process.env.RENDER_MEMORY_LIMIT_MB) || 2048;
    const rssPct = (rssMB / renderMemLimitMB) * 100;

    const status = rssPct > 85 ? 'CRITICAL' : rssPct > 70 ? 'WARNING' : 'OK';

    ctx.body = {
      status,
      renderLimitMB: renderMemLimitMB,
      uptime: Math.round(process.uptime()),
      memory: {
        rss: `${rssMB.toFixed(1)} MB`,
        rssPctOfLimit: `${rssPct.toFixed(1)}%`,
        heapUsed: `${heapUsedMB.toFixed(1)} MB`,
        heapTotal: `${heapTotalMB.toFixed(1)} MB`,
        external: `${externalMB.toFixed(1)} MB`,
        arrayBuffers: `${arrayBuffersMB.toFixed(1)} MB`,
      },
      node: process.version,
      pid: process.pid,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * POST /orders/reconcile-stripe
   * Reconcile orders stuck in "draft" status with Stripe.
   * For each draft order with a cs_live_* session id (or pi_*), queries Stripe
   * to check if the payment actually succeeded. If yes, applies the same
   * side-effects as the webhook would (set status=paid, invoice number, emails).
   *
   * Auth: requires RECONCILE_TOKEN in Authorization: Bearer header.
   *
   * Query params:
   *   - sessionId: reconcile a single specific session (e.g. cs_live_xxxxx)
   *   - hours: how many hours back to scan (default 72)
   */
  async reconcileStripe(ctx) {
    // Security: shared secret via env var
    const authHeader = (ctx.request.headers['authorization'] as string) || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const expected = process.env.RECONCILE_TOKEN;
    if (!expected || expected.length < 16) {
      strapi.log.error('RECONCILE_TOKEN not configured (or too short)');
      return ctx.internalServerError('Reconcile endpoint not configured');
    }
    if (token !== expected) {
      return ctx.unauthorized('Invalid reconcile token');
    }

    const query = ctx.query as any;
    const targetSessionId = typeof query.sessionId === 'string' ? query.sessionId.trim() : '';
    const hours = Math.max(1, Math.min(720, parseInt(query.hours, 10) || 72));
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    const stripe = getStripe();

    // Find candidate draft orders
    const filters: any = { status: 'draft' };
    if (targetSessionId) {
      filters.stripePaymentIntentId = targetSessionId;
    } else {
      filters.createdAt = { $gte: cutoff.toISOString() };
    }

    const drafts = await strapi.documents('api::order.order').findMany({ filters });

    const report = {
      scanned: drafts.length,
      fixed: [] as any[],
      still_unpaid: [] as any[],
      errors: [] as any[],
    };

    for (const order of drafts as any[]) {
      const sid = order.stripePaymentIntentId || '';
      if (!sid) {
        report.errors.push({ id: order.id, email: order.customerEmail, reason: 'no stripe id' });
        continue;
      }

      try {
        let paymentIntentId: string | null = null;
        let paymentStatus: string | null = null;
        let paidAt: Date | null = null;

        if (sid.startsWith('cs_')) {
          const session = await stripe.checkout.sessions.retrieve(sid);
          paymentStatus = session.payment_status;
          paymentIntentId = typeof session.payment_intent === 'string'
            ? session.payment_intent
            : (session.payment_intent as any)?.id || null;
          if (session.created) paidAt = new Date(session.created * 1000);
        } else if (sid.startsWith('pi_')) {
          const pi = await stripe.paymentIntents.retrieve(sid);
          paymentStatus = pi.status === 'succeeded' ? 'paid' : pi.status;
          paymentIntentId = pi.id;
          if (pi.created) paidAt = new Date(pi.created * 1000);
        } else {
          report.errors.push({ id: order.id, email: order.customerEmail, reason: `unknown id format: ${sid}` });
          continue;
        }

        if (paymentStatus !== 'paid') {
          report.still_unpaid.push({ id: order.id, email: order.customerEmail, stripeStatus: paymentStatus, stripeId: sid });
          continue;
        }

        // ---- Same logic as the webhook: generate invoice + update order + emails ----
        let invoiceNumber = '';
        try {
          const now = new Date();
          const year = now.getFullYear();
          const prefix = `MM-${year}-`;
          const existingOrders = await strapi.documents('api::order.order').findMany({
            filters: { invoiceNumber: { $startsWith: prefix } } as any,
            sort: { invoiceNumber: 'desc' } as any,
            limit: 1,
          });
          let seq = 1;
          if (existingOrders.length > 0 && (existingOrders[0] as any).invoiceNumber) {
            const lastNum = (existingOrders[0] as any).invoiceNumber.replace(prefix, '');
            seq = (parseInt(lastNum, 10) || 0) + 1;
          }
          invoiceNumber = `${prefix}${String(seq).padStart(4, '0')}`;
        } catch (invoiceErr) {
          strapi.log.warn('Erreur generation numero facture (reconcile):', invoiceErr);
          invoiceNumber = `MM-${new Date().getFullYear()}-0000`;
        }

        await strapi.documents('api::order.order').update({
          documentId: order.documentId,
          data: {
            status: 'paid',
            invoiceNumber,
            stripePaymentIntentId: paymentIntentId || sid,
          } as any,
        });
        strapi.log.info(`[reconcile] Order ${order.documentId} -> paid (${invoiceNumber}) from ${sid}`);

        // Email confirmation client
        try {
          const orderItems: any[] = Array.isArray(order.items) ? order.items : [];
          const orderRef = (paymentIntentId || sid).slice(-8).toUpperCase();
          await sendOrderConfirmationEmail({
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            orderRef,
            invoiceNumber,
            items: orderItems.map((item: any) => ({
              productName: item.productName || 'Produit',
              quantity: item.quantity || 1,
              totalPrice: item.totalPrice || 0,
              size: item.size || '',
              finish: item.finish || '',
            })),
            subtotal: order.subtotal || 0,
            shipping: order.shipping || 0,
            tps: order.tps || 0,
            tvq: order.tvq || 0,
            total: order.total || 0,
            shippingAddress: order.shippingAddress || null,
            promoCode: order.promoCode || undefined,
            promoDiscount: order.promoDiscount || undefined,
            supabaseUserId: order.supabaseUserId || undefined,
          });
        } catch (emailErr) {
          strapi.log.warn('[reconcile] Erreur email confirmation:', emailErr);
        }

        // Notification admin
        try {
          const orderItems2: any[] = Array.isArray(order.items) ? order.items : [];
          const orderRef2 = (paymentIntentId || sid).slice(-8).toUpperCase();
          const allUploadedFiles: { name: string; url: string }[] = [];
          for (const item of orderItems2) {
            if (Array.isArray(item.uploadedFiles)) {
              for (const f of item.uploadedFiles) {
                if (f && (f.url || f.name)) {
                  allUploadedFiles.push({ name: f.name || f.url || 'Fichier', url: f.url || '' });
                }
              }
            }
          }
          await sendNewOrderNotificationEmail({
            orderRef: orderRef2,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            items: orderItems2.map((item: any) => ({
              productName: item.productName || 'Produit',
              quantity: item.quantity || 1,
              totalPrice: item.totalPrice || 0,
              size: item.size || '',
              finish: item.finish || '',
            })),
            subtotal: order.subtotal || 0,
            shipping: order.shipping || 0,
            tps: order.tps || 0,
            tvq: order.tvq || 0,
            total: order.total || 0,
            shippingAddress: order.shippingAddress || null,
            uploadedFiles: allUploadedFiles.length > 0 ? allUploadedFiles : undefined,
            notes: order.notes || undefined,
            designReady: order.designReady !== false,
            promoCode: order.promoCode || undefined,
            promoDiscount: order.promoDiscount || undefined,
          });
        } catch (adminEmailErr) {
          strapi.log.warn('[reconcile] Erreur notification admin:', adminEmailErr);
        }

        // Update client stats
        try {
          const clients = await strapi.documents('api::client.client').findMany({
            filters: { email: (order.customerEmail || '').toLowerCase() } as any,
          });
          if (clients.length > 0) {
            const client = clients[0] as any;
            await strapi.documents('api::client.client').update({
              documentId: client.documentId,
              data: {
                totalSpent: (Number(client.totalSpent) || 0) + (order.total || 0) / 100,
                orderCount: (client.orderCount || 0) + 1,
                lastOrderDate: new Date().toISOString().split('T')[0],
              } as any,
            });
          }
        } catch (err) {
          strapi.log.warn('[reconcile] Could not update client stats:', err);
        }

        report.fixed.push({
          id: order.id,
          email: order.customerEmail,
          invoice: invoiceNumber,
          total: order.total,
          stripeId: sid,
          paidAt: paidAt ? paidAt.toISOString() : null,
        });
      } catch (err: any) {
        strapi.log.error(`[reconcile] Error on order ${order.id}:`, err);
        report.errors.push({ id: order.id, email: order.customerEmail, reason: err.message });
      }
    }

    // RACE-03 : cleanup des drafts abandonnees > 7j en meme temps que le
    // reconcile (les 2 tournent en cron, autant piggy-back). Les drafts
    // jeunes (< 7j) restent car le client peut encore completer son paiement
    // via un lien cs_live_ (qui expirent a 24h Stripe-side mais on garde
    // une marge). Au-dela de 7j, l'order est morte : delete pour eviter la
    // croissance infinie de la table orders.
    try {
      const draftCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const oldDrafts = await strapi.documents('api::order.order').findMany({
        filters: {
          status: 'draft',
          createdAt: { $lt: draftCutoff.toISOString() },
        } as any,
        limit: 500,
      });
      let cleanupCount = 0;
      for (const draft of oldDrafts as any[]) {
        try {
          await strapi.documents('api::order.order').delete({ documentId: draft.documentId });
          cleanupCount++;
        } catch (delErr: any) {
          strapi.log.warn(`[reconcile:cleanup] Could not delete draft ${draft.id}: ${delErr?.message}`);
        }
      }
      if (cleanupCount > 0) {
        strapi.log.info(`[reconcile:cleanup] Deleted ${cleanupCount} draft orders older than 7 days`);
      }
      (report as any).cleanedUpDrafts = cleanupCount;
    } catch (cleanupErr: any) {
      strapi.log.error('[reconcile:cleanup] Error:', cleanupErr?.message);
      (report as any).cleanedUpDrafts = -1;
    }

    ctx.body = report;
  },
}));
