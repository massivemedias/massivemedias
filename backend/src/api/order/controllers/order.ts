import { factories } from '@strapi/strapi';
import Stripe from 'stripe';
import { calculateShipping } from '../../../utils/shipping';
import { sendOrderConfirmationEmail, sendTestimonialRequestEmail, sendArtistSaleNotificationEmail, sendNewOrderNotificationEmail, sendTrackingEmail } from '../../../utils/email';
import crypto from 'crypto';
import { PROMO_CODES } from '../../../utils/promo-codes';
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

// Sticker pricing tiers for server-side validation (tarifs de REFERENCE 3")
const STICKER_STANDARD_TIERS: Record<number, number> = { 25: 30, 50: 47.50, 100: 85, 250: 200, 500: 375 };
const STICKER_FX_TIERS: Record<number, number> = { 25: 35, 50: 57.50, 100: 100, 250: 225, 500: 425 };
const FX_FINISHES = ['holographic', 'broken-glass', 'stars'];
const ARTIST_DISCOUNT = 0.25; // Rabais artiste sur ses propres produits

// Size multipliers cote backend - DOIVENT matcher exactement frontend/src/data/products.js
// Sinon le server va rejeter des commandes legitimes ou accepter du under-pricing.
const SIZE_MULTIPLIERS: Record<string, number> = {
  '2': 0.8,
  '2.5': 0.9,
  '3': 1.0,
  '4': 1.5,
  '5': 2.0,
};

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

// Business card pricing tiers for server-side validation
const BUSINESS_CARD_TIERS: Record<string, Record<number, number>> = {
  'business-card-standard': { 100: 55, 250: 75, 500: 95, 1000: 130 },
  'business-card-lamine':   { 100: 70, 250: 95, 500: 120, 1000: 165 },
  'business-card-premium':  { 100: 120, 250: 175, 500: 250 },
};

// Flyer pricing tiers for server-side validation
const FLYER_TIERS: Record<number, number> = { 50: 40, 100: 70, 150: 98, 250: 138, 500: 250 };
const FLYER_RECTO_VERSO_MULTIPLIER = 1.3;

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
      // Validate sticker pricing against tiers (tarif 3" de reference) + size multiplier
      if (item.productId === 'sticker-custom' || item.productId === 'sticker-artist') {
        const finishLower = String(item.finish || '').toLowerCase();
        const isFx = FX_FINISHES.some((f) => finishLower.includes(f));
        const tiers = isFx ? STICKER_FX_TIERS : STICKER_STANDARD_TIERS;
        const tierPrice = tiers[item.quantity];
        if (tierPrice) {
          // item.sizeId est prioritaire (id stable: '3in'), fallback sur item.size (label: '3"')
          const sizeKey = item.sizeId || item.size;
          const mult = getSizeMultiplier(sizeKey);
          validPrice = Math.round(tierPrice * mult * 100) / 100;
          strapi.log.info(`[sticker-validate] qty=${item.quantity} size=${sizeKey} mult=${mult} tier=${tierPrice}$ -> validated=${validPrice}$`);
        } else {
          strapi.log.warn(`Invalid sticker tier: qty=${item.quantity}, using client price ${item.totalPrice}`);
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

      // Validate flyer pricing against tiers
      if (item.productId === 'flyer-a6') {
        const tierPrice = FLYER_TIERS[item.quantity];
        if (tierPrice) {
          // Apply recto-verso multiplier if applicable
          const isRectoVerso = item.finish && (item.finish.toLowerCase().includes('recto-verso') || item.finish.toLowerCase().includes('double'));
          validPrice = isRectoVerso ? Math.round(tierPrice * FLYER_RECTO_VERSO_MULTIPLIER) : tierPrice;
        } else {
          strapi.log.warn(`Invalid flyer tier: qty=${item.quantity}, using client price ${item.totalPrice}`);
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

    // Recalculate server-side with sticker tier validation
    // ET validation des prix des artist-prints (anti-manipulation) + check sold/private token
    // Prix cadre par defaut - DOIT matcher frontend/src/data/products.js (fineArtFramePriceByFormat)
    // sinon le backend rejette des commandes legitimes. A2 = 45$ depuis avril 2026.
    const FRAME_PRICES_FALLBACK: Record<string, number> = { postcard: 20, a4: 20, a3: 30, a3plus: 35, a2: 45 };
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

      // --- Stickers: validation par tier + size multiplier ---
      if (item.productId === 'sticker-custom' || item.productId === 'sticker-artist') {
        const finishLower = String(item.finish || '').toLowerCase();
        const isFx = FX_FINISHES.some((f) => finishLower.includes(f));
        const tiers = isFx ? STICKER_FX_TIERS : STICKER_STANDARD_TIERS;
        const tierPrice = tiers[item.quantity];
        if (tierPrice) {
          const sizeKey = item.sizeId || item.size;
          const mult = getSizeMultiplier(sizeKey);
          validPrice = Math.round(tierPrice * mult * 100) / 100;
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

    if (!supabaseUserId) {
      return ctx.badRequest('Missing user ID');
    }

    const orders = await strapi.documents('api::order.order').findMany({
      filters: { supabaseUserId, status: { $ne: 'draft' as any } },
      sort: 'createdAt:desc',
    });

    ctx.body = orders;
  },

  async handleStripeWebhook(ctx) {
    const sig = ctx.request.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const requestId = crypto.randomBytes(4).toString('hex');

    if (!endpointSecret || endpointSecret === 'whsec_REPLACE_ME') {
      strapi.log.warn(`[webhook:${requestId}] Stripe webhook secret not configured`);
      // Alert admin immediately - config broken in prod
      try {
        const { sendWebhookFailureAlert } = await import('../../../utils/email');
        await sendWebhookFailureAlert({
          reason: 'STRIPE_WEBHOOK_SECRET env var missing or placeholder',
          requestId,
        });
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
      // Alert admin IMMEDIATELY on EVERY failure.
      // We intentionally do NOT throttle: the process restarts on OOM which would reset an
      // in-memory throttle anyway, AND a handful of duplicate emails is MUCH less harmful than
      // the 4-day silent failure we had in April 2026. If Stripe retry-storms, persistence
      // throttling should be added via the DB, not in-process state.
      try {
        const { sendWebhookFailureAlert } = await import('../../../utils/email');
        await sendWebhookFailureAlert({
          reason: `Stripe signature verification failed: ${err.message}`,
          requestId,
          sigHeader: sig ? sig.substring(0, 80) : '(missing)',
          bodyPresent: !!(ctx.request as any).body,
        });
        strapi.log.warn(`[webhook:${requestId}] Admin alert email dispatched`);
      } catch (alertErr: any) {
        strapi.log.error(`[webhook:${requestId}] Failed to send admin alert:`, alertErr?.message);
      }
      return ctx.badRequest(`Webhook Error: ${err.message}`);
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
          // Normalize: store the real payment_intent in stripePaymentIntentId AND preserve the
          // checkout session id in its dedicated column. This makes subsequent searches by either
          // id deterministic and avoids the cs vs pi race that caused Cindy's order to stuck.
          await strapi.documents('api::order.order').update({
            documentId: orders[0].documentId,
            data: {
              stripePaymentIntentId: session.payment_intent,
              stripeCheckoutSessionId: session.id,
            } as any,
          });
          strapi.log.info(`[webhook:${requestId}] checkout.session.completed: order ${orders[0].documentId} payment_intent=${session.payment_intent} session=${session.id}`);
        }
      }
      // Le payment_intent.succeeded va suivre et gerer le reste
      ctx.body = { received: true };
      return;
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      // Race fix: if payment_intent.succeeded arrives BEFORE checkout.session.completed,
      // the order may still have its cs_live_ stored in stripePaymentIntentId. Retrieve the
      // payment intent's checkout session id via Stripe API so we can match by either column.
      let checkoutSessionId: string | null = null;
      try {
        const stripe = getStripe();
        const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntent.id, limit: 1 });
        if (sessions.data.length > 0) checkoutSessionId = sessions.data[0].id;
      } catch (lookupErr: any) {
        strapi.log.warn(`[webhook:${requestId}] Could not lookup session for ${paymentIntent.id}:`, lookupErr?.message);
      }

      const orFilters: any[] = [
        { stripePaymentIntentId: paymentIntent.id },
      ];
      if (checkoutSessionId) {
        orFilters.push({ stripeCheckoutSessionId: checkoutSessionId });
        orFilters.push({ stripePaymentIntentId: checkoutSessionId });
      }
      const orders = await strapi.documents('api::order.order').findMany({
        filters: { $or: orFilters } as any,
      });

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

        // Envoyer email de confirmation
        try {
          const orderItems: any[] = Array.isArray(order.items) ? order.items : [];
          const orderRef = paymentIntent.id.slice(-8).toUpperCase();
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
          strapi.log.info(`Email de confirmation envoye a ${order.customerEmail}`);
        } catch (emailErr) {
          strapi.log.warn('Erreur envoi email confirmation (non bloquant):', emailErr);
        }

        // Notifier l'admin de la nouvelle vente
        try {
          const orderItems2: any[] = Array.isArray(order.items) ? order.items : [];
          const orderRef2 = paymentIntent.id.slice(-8).toUpperCase();

          // Collecter tous les fichiers uploades de tous les items
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
          strapi.log.info(`Notification vente admin envoyee pour commande ${orderRef2}`);
        } catch (adminEmailErr) {
          strapi.log.warn('Erreur envoi notification vente admin (non bloquant):', adminEmailErr);
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

          // Envoyer un email a chaque artiste concerne
          const shippingAddr = order.shippingAddress as any;
          const customerCity = shippingAddr?.city || '';

          for (const [slug, items] of Object.entries(artistItemsMap)) {
            const artist = artistMap[slug];
            // Email prioritaire: artist.email, sinon fallback user-role.email
            const artistEmail = artist?.email || userRoleEmailBySlug[slug] || null;
            if (!artistEmail) {
              strapi.log.warn(`Artiste ${slug}: aucun email trouve (ni CMS ni user-role), notification non envoyee`);
              continue;
            }
            // IMPORTANT: await pour que l'erreur soit visible dans les logs au lieu d'un .catch silencieux
            try {
              await sendArtistSaleNotificationEmail({
                artistName: artist?.name || slug,
                artistEmail,
                items,
                orderDate: new Date().toISOString(),
                customerCity,
              });
              strapi.log.info(`Notification vente artiste ${slug} envoyee a ${artistEmail}`);
            } catch (err) {
              strapi.log.error(`ECHEC notification vente artiste ${slug} (${artistEmail}):`, err);
            }
          }
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
    const pageSize = parseInt(ctx.query.pageSize as string) || 25;
    const status = ctx.query.status as string;
    const search = ctx.query.search as string;

    const filters: any = {};
    if (status && status !== 'all') {
      filters.status = status;
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

    const [orders, allFiltered] = await Promise.all([
      strapi.documents('api::order.order').findMany({
        filters,
        sort: 'createdAt:desc',
        limit: pageSize,
        start: (page - 1) * pageSize,
        populate: ['client'],
      }),
      strapi.documents('api::order.order').findMany({
        filters,
      }),
    ]);

    const total = allFiltered.length;

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
    const { status: newStatus, invoiceNumber, autoInvoice, sendEmails } = ctx.request.body as any;

    const validStatuses = ['draft', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
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

    // Optional: trigger confirmation + admin notification emails when flipping to paid
    if (sendEmails && newStatus === 'paid') {
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

    // Quand la commande est livree, envoyer un email de demande de temoignage
    if (newStatus === 'delivered' && (order as any).customerEmail) {
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
   * Ajustement manuel admin du total d'une commande (rabais, balance, correction).
   *
   * Body:
   *   - total: number (en DOLLARS, sera converti en cents en DB)
   *   - reason: string (obligatoire - trace dans les notes admin)
   *
   * Append une ligne d'audit dans le champ notes:
   *   [2026-04-18 12:34 par admin@exemple.com] Ajustement 68.99$ -> 100.60$ : Ajout balance 31.61$
   *
   * Le total Stripe original n'est PAS touche (garde trace du paiement reel).
   * On modifie uniquement le champ `total` qui sert a l'affichage et aux factures.
   */
  async updateTotal(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { documentId } = ctx.params;
    const { total, reason } = ctx.request.body as any;

    // Validation stricte: total en dollars, positif, raisonnable (max 100k$)
    const newTotalDollars = Number(total);
    if (!Number.isFinite(newTotalDollars) || newTotalDollars < 0 || newTotalDollars > 100000) {
      return ctx.badRequest('total must be a positive number in dollars (max 100000)');
    }
    const newTotalCents = Math.round(newTotalDollars * 100);

    const reasonTrim = String(reason || '').trim();
    if (!reasonTrim) {
      return ctx.badRequest('reason is required (explain why you are adjusting the total)');
    }
    if (reasonTrim.length > 500) {
      return ctx.badRequest('reason max 500 chars');
    }

    const order = await strapi.documents('api::order.order').findFirst({
      filters: { documentId },
    }) as any;

    if (!order) return ctx.notFound('Commande introuvable');

    const previousCents = Number(order.total) || 0;
    const previousDollars = (previousCents / 100).toFixed(2);
    const newDollarsFmt = (newTotalCents / 100).toFixed(2);

    // Audit log: timestamp Montreal + admin email si dispo + old/new
    const adminEmail = (ctx.state as any).adminUserEmail || (ctx.state as any).adminAuthMethod || 'admin';
    const now = new Date().toLocaleString('fr-CA', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Toronto',
    });
    const auditLine = `[${now} par ${adminEmail}] Ajustement total ${previousDollars}$ -> ${newDollarsFmt}$ : ${reasonTrim}`;
    const prevNotes = String(order.notes || '').trim();
    const newNotes = prevNotes ? `${prevNotes}\n${auditLine}` : auditLine;

    const updated = await strapi.documents('api::order.order').update({
      documentId: order.documentId,
      data: {
        total: newTotalCents,
        notes: newNotes,
      } as any,
    });

    strapi.log.info(`[updateTotal] Order ${documentId}: ${previousDollars}$ -> ${newDollarsFmt}$ by ${adminEmail} (reason: ${reasonTrim})`);

    ctx.body = {
      data: updated,
      previousTotal: previousCents,
      newTotal: newTotalCents,
      auditLine,
    };
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

  async deleteOrder(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { documentId } = ctx.params;

    const order = await strapi.documents('api::order.order').findFirst({
      filters: { documentId },
    });

    if (!order) {
      return ctx.notFound('Commande introuvable');
    }

    await strapi.documents('api::order.order').delete({
      documentId: order.documentId,
    });

    strapi.log.info(`Commande ${documentId} supprimee`);
    ctx.body = { success: true };
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
    const validStatuses = ['paid', 'processing', 'shipped', 'delivered'] as const;
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
        const rate = parseFloat(artist.commissionRate) || 0.5;
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
            rate,
            totalSales: 0,
            totalProduction: 0,
            totalNetProfit: 0,
            totalCommission: 0,
            totalPaid: 0,
            balance: 0,
            orders: [],
          };
        }

        const c = commissionsByArtist[matchedSlug];
        c.totalSales += totalSale;
        c.totalProduction += totalProd;
        c.totalNetProfit += netProfit;
        c.totalCommission += commission;
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
    // Fetch all non-cancelled orders
    const orders = await strapi.documents('api::order.order').findMany({
      filters: { status: { $ne: 'cancelled' } },
      sort: 'createdAt:desc',
    });

    // Fetch all expenses
    const expenses = await strapi.documents('api::expense.expense').findMany({
      sort: 'date:desc',
    });

    // Revenue calculations (order totals are in cents)
    const paidOrders = orders.filter((o: any) => o.status !== 'pending');
    const totalRevenue = paidOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);

    // Monthly revenue breakdown
    const monthlyRevenue: Record<string, { revenue: number; orders: number }> = {};
    for (const order of paidOrders) {
      const month = (order.createdAt as string).slice(0, 7); // "YYYY-MM"
      if (!monthlyRevenue[month]) {
        monthlyRevenue[month] = { revenue: 0, orders: 0 };
      }
      monthlyRevenue[month].revenue += order.total;
      monthlyRevenue[month].orders += 1;
    }

    // Expense calculations (amounts are in dollars)
    const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0);
    const totalTpsPaid = expenses.reduce((sum: number, e: any) => sum + (parseFloat(e.tpsAmount) || 0), 0);
    const totalTvqPaid = expenses.reduce((sum: number, e: any) => sum + (parseFloat(e.tvqAmount) || 0), 0);

    // Monthly expenses breakdown
    const monthlyExpenses: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};
    for (const expense of expenses) {
      const month = (expense.date as string).slice(0, 7);
      const amount = Number(expense.amount) || 0;
      monthlyExpenses[month] = (monthlyExpenses[month] || 0) + amount;
      expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + amount;
    }

    // Tax calculations (TPS 5%, TVQ 9.975% on revenue in dollars)
    const revenueInDollars = totalRevenue / 100;
    const tpsCollected = revenueInDollars * 0.05;
    const tvqCollected = revenueInDollars * 0.09975;

    // Order status breakdown
    const statusBreakdown: Record<string, number> = {};
    for (const order of orders) {
      statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
    }

    // Top clients
    const clientMap = new Map<string, { email: string; name: string; totalSpent: number; orderCount: number }>();
    for (const order of paidOrders) {
      const key = order.customerEmail.toLowerCase();
      if (clientMap.has(key)) {
        const c = clientMap.get(key)!;
        c.totalSpent += order.total;
        c.orderCount += 1;
      } else {
        clientMap.set(key, {
          email: order.customerEmail,
          name: order.customerName,
          totalSpent: order.total,
          orderCount: 1,
        });
      }
    }
    const topClients = Array.from(clientMap.values()).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);

    ctx.body = {
      revenue: {
        total: totalRevenue,
        totalDollars: revenueInDollars,
        monthly: Object.entries(monthlyRevenue)
          .map(([month, data]) => ({ month, ...data }))
          .sort((a, b) => a.month.localeCompare(b.month)),
      },
      expenses: {
        total: totalExpenses,
        monthly: Object.entries(monthlyExpenses)
          .map(([month, amount]) => ({ month, amount }))
          .sort((a, b) => a.month.localeCompare(b.month)),
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
        total: orders.length,
        byStatus: statusBreakdown,
        averageValue: paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0,
      },
      topClients,
    };
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

    ctx.body = report;
  },
}));
