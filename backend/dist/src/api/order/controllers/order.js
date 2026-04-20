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
const stripe_1 = __importDefault(require("stripe"));
const shipping_1 = require("../../../utils/shipping");
const email_1 = require("../../../utils/email");
const crypto_1 = __importDefault(require("crypto"));
const promo_codes_1 = require("../../../utils/promo-codes");
const pricing_config_1 = require("../../../utils/pricing-config");
const auth_1 = require("../../../utils/auth");
const getStripe = () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key === 'sk_test_REPLACE_ME') {
        throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    return new stripe_1.default(key);
};
// requireAdminAuth a ete extrait dans backend/src/utils/auth.ts (SEC-01, 2026-04-18).
// L'import est en haut du fichier. Le comportement est identique, seul le diagnostic
// __authDiag n'est plus expose (il etait utilise par /admin-whoami, endpoint de debug
// retire depuis). Aucune regression fonctionnelle sur order.ts.
// PRIX-02: les constantes de pricing (STICKER_*, SIZE_MULTIPLIERS, BUSINESS_CARD_TIERS,
// FLYER_TIERS, FLYER_RECTO_VERSO_MULTIPLIER, ARTIST_DISCOUNT, FX_FINISHES) sont
// maintenant importees depuis utils/pricing-config.ts pour que le backend ait une seule
// source de verite et que GET /api/pricing-config puisse exposer les memes valeurs au
// frontend sans duplication.
/**
 * Extrait le multiplier de taille depuis un champ size stocke dans l'order.
 * Accepte tous formats: '3in', '3"', '3', number 3, etc. Fallback 1.0 (reference 3").
 */
function getSizeMultiplier(size) {
    if (size === null || size === undefined)
        return 1.0;
    const match = String(size).match(/^\s*([\d.]+)/);
    if (!match)
        return 1.0;
    const key = match[1];
    return Object.prototype.hasOwnProperty.call(pricing_config_1.SIZE_MULTIPLIERS, key)
        ? pricing_config_1.SIZE_MULTIPLIERS[key]
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
function extractUniquePieces(items, artists) {
    const out = [];
    for (const item of items) {
        const pid = String(item.productId || '');
        if (!pid.startsWith('artist-print-'))
            continue;
        let matched = null;
        let printId = '';
        for (const a of artists) {
            if (pid.startsWith(`artist-print-${a.slug}-`)) {
                if (!matched || a.slug.length > matched.slug.length) {
                    matched = a;
                    printId = pid.replace(`artist-print-${a.slug}-`, '');
                }
            }
        }
        if (!matched || !printId)
            continue;
        const prints = Array.isArray(matched.prints) ? matched.prints : [];
        const print = prints.find((p) => p.id === printId);
        if (!print)
            continue;
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
async function reserveUniquePieces(strapiInstance, pieces, reservationId, expiresAtIso) {
    if (pieces.length === 0)
        return;
    const now = Date.now();
    const byArtist = new Map();
    for (const p of pieces) {
        if (!byArtist.has(p.artistDocId))
            byArtist.set(p.artistDocId, []);
        byArtist.get(p.artistDocId).push({ printId: p.printId, title: p.title });
    }
    for (const [artistDocId, printRefs] of byArtist) {
        const artist = await strapiInstance.documents('api::artist.artist').findFirst({
            filters: { documentId: artistDocId },
        });
        if (!artist)
            throw new Error('Artiste introuvable lors de la reservation');
        const prints = Array.isArray(artist.prints) ? [...artist.prints] : [];
        for (const { printId, title } of printRefs) {
            const idx = prints.findIndex((p) => p.id === printId);
            if (idx === -1)
                throw new Error(`Piece introuvable chez ${artist.slug}`);
            const print = prints[idx];
            if (print.sold === true) {
                throw new Error(`La piece "${print.title || title || printId}" a ete vendue pendant votre checkout.`);
            }
            const existingUntil = print.reservedUntil ? new Date(print.reservedUntil).getTime() : 0;
            if (existingUntil > now && print.reservedByOrderId && print.reservedByOrderId !== reservationId) {
                const minsLeft = Math.max(1, Math.ceil((existingUntil - now) / 60000));
                throw new Error(`La piece "${print.title || title || printId}" est reservee par un autre client (disponible dans ${minsLeft} min).`);
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
async function releaseUniquePieceReservations(strapiInstance, pieces, reservationId) {
    if (pieces.length === 0)
        return;
    const byArtist = new Map();
    for (const p of pieces) {
        if (!byArtist.has(p.artistDocId))
            byArtist.set(p.artistDocId, []);
        byArtist.get(p.artistDocId).push(p.printId);
    }
    for (const [artistDocId, printIds] of byArtist) {
        const artist = await strapiInstance.documents('api::artist.artist').findFirst({
            filters: { documentId: artistDocId },
        });
        if (!artist)
            continue;
        const prints = Array.isArray(artist.prints) ? [...artist.prints] : [];
        let mutated = false;
        for (const printId of printIds) {
            const idx = prints.findIndex((p) => p.id === printId);
            if (idx === -1)
                continue;
            const print = prints[idx];
            if (print.sold === true)
                continue; // ne touche jamais une piece vendue
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
exports.default = strapi_1.factories.createCoreController('api::order.order', ({ strapi }) => ({
    async uploadFile(ctx) {
        const { request: { files } } = ctx;
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
        const { items, customerEmail, customerName, customerPhone, shippingAddress, shipping: clientShipping, taxes: clientTaxes, orderTotal: clientOrderTotal, promoCode, promoDiscountPercent, designReady, notes, supabaseUserId } = ctx.request.body;
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
                const isFx = pricing_config_1.FX_FINISHES.some((f) => finishLower.includes(f));
                const tiers = isFx ? pricing_config_1.STICKER_FX_TIERS : pricing_config_1.STICKER_STANDARD_TIERS;
                const tierPrice = tiers[item.quantity];
                if (tierPrice) {
                    // item.sizeId est prioritaire (id stable: '3in'), fallback sur item.size (label: '3"')
                    const sizeKey = item.sizeId || item.size;
                    const mult = getSizeMultiplier(sizeKey);
                    validPrice = Math.round(tierPrice * mult * 100) / 100;
                    strapi.log.info(`[sticker-validate] qty=${item.quantity} size=${sizeKey} mult=${mult} tier=${tierPrice}$ -> validated=${validPrice}$`);
                }
                else {
                    strapi.log.warn(`Invalid sticker tier: qty=${item.quantity}, using client price ${item.totalPrice}`);
                }
            }
            // Validate business card pricing against tiers
            if (item.productId && item.productId.startsWith('business-card-')) {
                const cardTiers = pricing_config_1.BUSINESS_CARD_TIERS[item.productId];
                if (cardTiers) {
                    const tierPrice = cardTiers[item.quantity];
                    if (tierPrice) {
                        validPrice = tierPrice;
                    }
                    else {
                        strapi.log.warn(`Invalid business card tier: ${item.productId} qty=${item.quantity}, using client price ${item.totalPrice}`);
                    }
                }
            }
            // Validate flyer pricing against tiers
            if (item.productId === 'flyer-a6') {
                const tierPrice = pricing_config_1.FLYER_TIERS[item.quantity];
                if (tierPrice) {
                    // Apply recto-verso multiplier if applicable
                    const isRectoVerso = item.finish && (item.finish.toLowerCase().includes('recto-verso') || item.finish.toLowerCase().includes('double'));
                    validPrice = isRectoVerso ? Math.round(tierPrice * pricing_config_1.FLYER_RECTO_VERSO_MULTIPLIER) : tierPrice;
                }
                else {
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
            const promo = promo_codes_1.PROMO_CODES[promoCode.toUpperCase().trim()];
            if (promo) {
                promoDiscount = Math.round(subtotal * promo.discountPercent / 100);
                appliedPromoCode = promoCode.toUpperCase().trim();
                subtotal = subtotal - promoDiscount;
            }
        }
        // Recalculate shipping server-side (par poids)
        const province = (shippingAddress === null || shippingAddress === void 0 ? void 0 : shippingAddress.province) || 'QC';
        const postalCode = (shippingAddress === null || shippingAddress === void 0 ? void 0 : shippingAddress.postalCode) || '';
        const { shippingCost, totalWeight } = (0, shipping_1.calculateShipping)(province, postalCode, items);
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
            const itemsSummary = items.map((i) => {
                const parts = [i.productName || 'Produit'];
                if (i.size)
                    parts.push(i.size);
                if (i.finish)
                    parts.push(i.finish);
                if (i.quantity > 1)
                    parts.push(`x${i.quantity}`);
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
                    shippingCity: (shippingAddress === null || shippingAddress === void 0 ? void 0 : shippingAddress.city) || '',
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
                }
                else {
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
            }
            catch (err) {
                strapi.log.warn('Could not create/find client:', err);
            }
            // Build items with file URLs embedded
            const itemsWithFiles = items.map((item) => ({
                ...item,
                uploadedFiles: item.uploadedFiles || [],
            }));
            // Create order in Strapi with status "draft" (not yet paid)
            // Will be updated to "paid" by Stripe webhook when payment succeeds
            const orderData = {
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
        }
        catch (err) {
            strapi.log.error('Stripe createPaymentIntent error:', err);
            return ctx.badRequest(err.message || 'Payment creation failed');
        }
    },
    async createCheckoutSession(ctx) {
        var _a, _b;
        const { items, customerEmail, customerName, customerPhone, shippingAddress, promoCode, designReady, notes, supabaseUserId } = ctx.request.body;
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
        let cachedArtists = null;
        const getArtists = async () => {
            if (cachedArtists === null) {
                cachedArtists = await strapi.documents('api::artist.artist').findMany({ filters: { active: true } });
            }
            return cachedArtists;
        };
        // Verifier le slug artiste du user pour valider isArtistOwnPrint (securite)
        // artistSlug est stocke dans api::user-role. Lookup par supabaseUserId puis email fallback.
        let verifiedUserArtistSlug = null;
        try {
            // Tentative 1: par supabaseUserId
            if (supabaseUserId) {
                const byId = await strapi.documents('api::user-role.user-role').findMany({
                    filters: { supabaseUserId },
                });
                if (byId.length > 0) {
                    verifiedUserArtistSlug = byId[0].artistSlug || null;
                }
            }
            // Tentative 2: par email (fallback si supabaseUserId pas sync)
            if (!verifiedUserArtistSlug && customerEmail) {
                const byEmail = await strapi.documents('api::user-role.user-role').findMany({
                    filters: { email: customerEmail.toLowerCase() },
                });
                if (byEmail.length > 0) {
                    verifiedUserArtistSlug = byEmail[0].artistSlug || null;
                }
            }
        }
        catch (_) { /* ignore */ }
        for (const item of items) {
            let validPrice = item.totalPrice || 0;
            // --- Stickers: validation par tier + size multiplier ---
            if (item.productId === 'sticker-custom' || item.productId === 'sticker-artist') {
                const finishLower = String(item.finish || '').toLowerCase();
                const isFx = pricing_config_1.FX_FINISHES.some((f) => finishLower.includes(f));
                const tiers = isFx ? pricing_config_1.STICKER_FX_TIERS : pricing_config_1.STICKER_STANDARD_TIERS;
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
                    const pid = item.productId;
                    const artists = await getArtists();
                    // Trouver artiste + printId (slug le plus long gagne)
                    let matchedArtist = null;
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
                    const print = prints.find((p) => p.id === printId);
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
                        return ctx.badRequest(`Cette oeuvre est actuellement reservee par un autre client (dispo dans ${minsLeft} min si le paiement echoue).`);
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
                        ? ((_b = (_a = frameMap[format]) !== null && _a !== void 0 ? _a : pricing_config_1.FRAME_PRICES_FALLBACK[format]) !== null && _b !== void 0 ? _b : 30)
                        : 0;
                    // Prix unique: customPrice si defini (pour unique: true)
                    let expectedUnitPrice;
                    if (print.unique === true && typeof print.customPrice === 'number') {
                        expectedUnitPrice = print.customPrice;
                    }
                    else {
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
                    }
                    else {
                        validPrice = item.totalPrice;
                    }
                }
                catch (validationErr) {
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
                    artistDiscountTotal += Math.round(validPrice * pricing_config_1.ARTIST_DISCOUNT);
                }
                else {
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
            const promo = promo_codes_1.PROMO_CODES[promoCode.toUpperCase().trim()];
            if (promo) {
                promoDiscount = Math.round(subtotal * promo.discountPercent / 100);
                appliedPromoCode = promoCode.toUpperCase().trim();
                subtotal = subtotal - promoDiscount;
            }
        }
        const province = (shippingAddress === null || shippingAddress === void 0 ? void 0 : shippingAddress.province) || 'QC';
        const postalCode = (shippingAddress === null || shippingAddress === void 0 ? void 0 : shippingAddress.postalCode) || '';
        const { shippingCost, totalWeight } = (0, shipping_1.calculateShipping)(province, postalCode, items);
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
            const itemsSummary = items.map((i) => {
                const parts = [i.productName || 'Produit'];
                if (i.size)
                    parts.push(i.size);
                if (i.finish)
                    parts.push(i.finish);
                if (i.quantity > 1)
                    parts.push(`x${i.quantity}`);
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
            }
            catch (reserveErr) {
                try {
                    await stripe.checkout.sessions.expire(session.id);
                }
                catch (_) { /* ignore */ }
                strapi.log.warn(`createCheckoutSession: reservation conflict after Stripe, session expired: ${reserveErr === null || reserveErr === void 0 ? void 0 : reserveErr.message}`);
                return ctx.badRequest((reserveErr === null || reserveErr === void 0 ? void 0 : reserveErr.message) || 'Une piece unique du panier est devenue indisponible. Re-essayez.');
            }
            // Create order in Strapi with draft status (not yet paid)
            const itemsWithFiles = items.map((item) => ({
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
            }
            catch (err) {
                strapi.log.warn('Could not create/find client:', err);
            }
            const orderData = {
                // IMPORTANT: stripePaymentIntentId is REQUIRED and UNIQUE. Checkout Sessions created in
                // "payment" mode have no payment_intent until the customer pays. We temporarily store
                // the session.id (cs_live_...) here to satisfy uniqueness, and ALSO in the dedicated
                // stripeCheckoutSessionId column so the webhook can find the order regardless of which
                // event (checkout.session.completed OR payment_intent.succeeded) arrives first.
                stripePaymentIntentId: session.payment_intent || session.id,
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
        }
        catch (err) {
            strapi.log.error('Stripe createCheckoutSession error:', err);
            return ctx.badRequest(err.message || 'Checkout session creation failed');
        }
    },
    async myOrders(ctx) {
        const supabaseUserId = ctx.query.supabaseUserId;
        if (!supabaseUserId) {
            return ctx.badRequest('Missing user ID');
        }
        const orders = await strapi.documents('api::order.order').findMany({
            filters: { supabaseUserId, status: { $ne: 'draft' } },
            sort: 'createdAt:desc',
        });
        ctx.body = orders;
    },
    async handleStripeWebhook(ctx) {
        var _a, _b, _c, _d;
        const sig = ctx.request.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
        const requestId = crypto_1.default.randomBytes(4).toString('hex');
        if (!endpointSecret || endpointSecret === 'whsec_REPLACE_ME') {
            strapi.log.warn(`[webhook:${requestId}] Stripe webhook secret not configured`);
            // Alert admin - config broken en prod. STRIPE-03 : throttle 60min
            // persistant via DB pour eviter le spam si Stripe retry 20x.
            try {
                const { shouldSendThrottledAlert } = await Promise.resolve().then(() => __importStar(require('../../../utils/webhook-alert-throttle')));
                if (await shouldSendThrottledAlert('stripe_webhook_secret_missing', 60)) {
                    const { sendWebhookFailureAlert } = await Promise.resolve().then(() => __importStar(require('../../../utils/email')));
                    await sendWebhookFailureAlert({
                        reason: 'STRIPE_WEBHOOK_SECRET env var missing or placeholder',
                        requestId,
                    });
                }
            }
            catch (_) { /* non-blocking */ }
            return ctx.badRequest('Webhook not configured');
        }
        let event;
        try {
            const stripe = getStripe();
            // Access the raw unparsed body for signature verification
            // Strapi v5 stores raw body via Symbol.for('unparsedBody') when includeUnparsed: true
            const unparsedBody = (_a = ctx.request.body) === null || _a === void 0 ? void 0 : _a[Symbol.for('unparsedBody')];
            const koaRawBody = ctx.request.rawBody;
            const rawBody = unparsedBody || koaRawBody || JSON.stringify(ctx.request.body);
            strapi.log.info(`[webhook:${requestId}] Received - sig: ${sig ? 'present' : 'missing'}, rawBody type: ${typeof rawBody}, length: ${(rawBody === null || rawBody === void 0 ? void 0 : rawBody.length) || 0}, source: ${unparsedBody ? 'unparsed' : koaRawBody ? 'koa' : 'json-stringify'}`);
            event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
            strapi.log.info(`[webhook:${requestId}] Verified OK - event: ${event.type} id: ${event.id}`);
        }
        catch (err) {
            strapi.log.error(`[webhook:${requestId}] SIGNATURE VERIFICATION FAILED:`, err.message);
            // STRIPE-03: alerte admin avec throttle 60min persistant via DB.
            // Ancien comportement "send on EVERY failure" causait 20 emails si
            // Stripe retry un webhook casse 20 fois. Maintenant: 1 email max par
            // heure par type de failure. Le sendCount en DB trace les retries
            // supprimes pour visibilite a posteriori.
            try {
                const { shouldSendThrottledAlert } = await Promise.resolve().then(() => __importStar(require('../../../utils/webhook-alert-throttle')));
                if (await shouldSendThrottledAlert('stripe_signature_failure', 60)) {
                    const { sendWebhookFailureAlert } = await Promise.resolve().then(() => __importStar(require('../../../utils/email')));
                    await sendWebhookFailureAlert({
                        reason: `Stripe signature verification failed: ${err.message}`,
                        requestId,
                        sigHeader: sig ? sig.substring(0, 80) : '(missing)',
                        bodyPresent: !!ctx.request.body,
                    });
                    strapi.log.warn(`[webhook:${requestId}] Admin alert email dispatched`);
                }
                else {
                    strapi.log.warn(`[webhook:${requestId}] Admin alert throttled (already sent within 60min)`);
                }
            }
            catch (alertErr) {
                strapi.log.error(`[webhook:${requestId}] Failed to send admin alert:`, alertErr === null || alertErr === void 0 ? void 0 : alertErr.message);
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
        }
        catch (dupErr) {
            // Unique constraint violation = event deja traite. Log + return 200
            // pour que Stripe arrete son retry loop.
            const msg = String((dupErr === null || dupErr === void 0 ? void 0 : dupErr.message) || '').toLowerCase();
            if (msg.includes('unique') || msg.includes('duplicate') || (dupErr === null || dupErr === void 0 ? void 0 : dupErr.code) === '23505') {
                strapi.log.info(`[webhook:${requestId}] DUPLICATE event ${event.id} (${event.type}) - skipping, returning 200`);
                ctx.body = { received: true, duplicate: true };
                return;
            }
            // Autre erreur DB = on log mais on continue (mieux traiter en double
            // qu'ignorer un event valide a cause d'un probleme DB transient).
            strapi.log.warn(`[webhook:${requestId}] idempotency log insert failed (non-unique): ${dupErr === null || dupErr === void 0 ? void 0 : dupErr.message}`);
        }
        // Pour checkout sessions, recuperer le payment_intent_id et upgrader la colonne
        // stripePaymentIntentId (qui contient peut-etre encore le cs_live_ temporaire).
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
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
                    },
                });
                if (orders.length > 0 && orders[0].status === 'draft') {
                    // Normalize: store the real payment_intent in stripePaymentIntentId AND preserve the
                    // checkout session id in its dedicated column. This makes subsequent searches by either
                    // id deterministic and avoids the cs vs pi race that caused Cindy's order to stuck.
                    await strapi.documents('api::order.order').update({
                        documentId: orders[0].documentId,
                        data: {
                            stripePaymentIntentId: session.payment_intent,
                            stripeCheckoutSessionId: session.id,
                        },
                    });
                    strapi.log.info(`[webhook:${requestId}] checkout.session.completed: order ${orders[0].documentId} payment_intent=${session.payment_intent} session=${session.id}`);
                }
            }
            // Le payment_intent.succeeded va suivre et gerer le reste
            ctx.body = { received: true };
            return;
        }
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            // STRIPE-02: early-return DB lookup avant d'appeler Stripe. Depuis commit
            // 15a34e1, createCheckoutSession stocke stripeCheckoutSessionId ET
            // stripePaymentIntentId des le debut. Donc pour les orders post-avril-2026,
            // un simple findMany sur stripePaymentIntentId trouve l'order sans avoir
            // besoin de sessions.list() cote Stripe (100-300ms economises + rate
            // limit menage + pas de timeout si Stripe API lente).
            let orders = await strapi.documents('api::order.order').findMany({
                filters: { stripePaymentIntentId: paymentIntent.id },
            });
            // Fallback pour les orders pre-avril 2026 (pas de stripeCheckoutSessionId
            // separe, le cs_live_ est dans stripePaymentIntentId). On resout via
            // Stripe seulement dans ce cas.
            if (orders.length === 0) {
                let checkoutSessionId = null;
                try {
                    const stripe = getStripe();
                    const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntent.id, limit: 1 });
                    if (sessions.data.length > 0)
                        checkoutSessionId = sessions.data[0].id;
                }
                catch (lookupErr) {
                    strapi.log.warn(`[webhook:${requestId}] Could not lookup session for ${paymentIntent.id}:`, lookupErr === null || lookupErr === void 0 ? void 0 : lookupErr.message);
                }
                if (checkoutSessionId) {
                    orders = await strapi.documents('api::order.order').findMany({
                        filters: {
                            $or: [
                                { stripeCheckoutSessionId: checkoutSessionId },
                                { stripePaymentIntentId: checkoutSessionId },
                            ],
                        },
                    });
                }
            }
            if (orders.length > 0) {
                const order = orders[0];
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
                    if (existingOrders.length > 0 && existingOrders[0].invoiceNumber) {
                        const lastNum = existingOrders[0].invoiceNumber.replace(prefix, '');
                        seq = (parseInt(lastNum, 10) || 0) + 1;
                    }
                    invoiceNumber = `${prefix}${String(seq).padStart(4, '0')}`;
                }
                catch (invoiceErr) {
                    strapi.log.warn('Erreur generation numero facture:', invoiceErr);
                    invoiceNumber = `MM-${new Date().getFullYear()}-0000`;
                }
                await strapi.documents('api::order.order').update({
                    documentId: order.documentId,
                    data: { status: 'paid', invoiceNumber },
                });
                strapi.log.info(`Order ${order.documentId} marked as paid (${invoiceNumber})`);
                // STRIPE-04: emails admin + client en parallele via Promise.allSettled.
                // Avant: sequential await - si l'un timeout (ex: Resend down 5s), l'autre
                // attend avant de partir, doublant potentiellement le temps total du webhook.
                // Maintenant: parallele + log structure error-level avec orderId+recipient
                // pour qu'on puisse retracer un echec dans les logs Render.
                // TODO STRIPE-04b: persister les echecs dans une table email_retry_queue
                // avec cron horaire. Deferre pour rester dans le scope RACE/perf Vague 2.
                {
                    const orderItems = Array.isArray(order.items) ? order.items : [];
                    const orderRef = paymentIntent.id.slice(-8).toUpperCase();
                    const allUploadedFiles = [];
                    for (const item of orderItems) {
                        if (Array.isArray(item.uploadedFiles)) {
                            for (const f of item.uploadedFiles) {
                                if (f && (f.url || f.name)) {
                                    allUploadedFiles.push({ name: f.name || f.url || 'Fichier', url: f.url || '' });
                                }
                            }
                        }
                    }
                    const itemsForEmail = orderItems.map((item) => ({
                        productName: item.productName || 'Produit',
                        quantity: item.quantity || 1,
                        totalPrice: item.totalPrice || 0,
                        size: item.size || '',
                        finish: item.finish || '',
                    }));
                    const [confirmRes, adminRes] = await Promise.allSettled([
                        (0, email_1.sendOrderConfirmationEmail)({
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
                        (0, email_1.sendNewOrderNotificationEmail)({
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
                    }
                    else {
                        strapi.log.error(`STRIPE-04: ECHEC email confirmation client. ` +
                            `orderId=${order.documentId} orderRef=${orderRef} invoice=${invoiceNumber} ` +
                            `recipient=${order.customerEmail} err=${((_b = confirmRes.reason) === null || _b === void 0 ? void 0 : _b.message) || confirmRes.reason}`);
                    }
                    if (adminRes.status === 'fulfilled') {
                        strapi.log.info(`Notification vente admin envoyee pour commande ${orderRef}`);
                    }
                    else {
                        strapi.log.error(`STRIPE-04: ECHEC notification vente admin. ` +
                            `orderId=${order.documentId} orderRef=${orderRef} invoice=${invoiceNumber} ` +
                            `err=${((_c = adminRes.reason) === null || _c === void 0 ? void 0 : _c.message) || adminRes.reason}`);
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
                }
                catch (err) {
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
                    const knex = strapi.db.connection;
                    const orderItems = Array.isArray(order.items) ? order.items : [];
                    for (const item of orderItems) {
                        const qty = item.quantity || 1;
                        const sku = item.sku || item.slug;
                        if (!sku)
                            continue;
                        const rowsAffected = await knex('inventory_items')
                            .where({ sku, active: true })
                            .andWhere('quantity', '>=', qty)
                            .update({ quantity: knex.raw('quantity - ?', [qty]) });
                        if (rowsAffected > 0) {
                            const row = await knex('inventory_items')
                                .where({ sku, active: true })
                                .first('quantity');
                            strapi.log.info(`Inventory ${sku}: -${qty} -> ${(_d = row === null || row === void 0 ? void 0 : row.quantity) !== null && _d !== void 0 ? _d : '?'} (atomic)`);
                        }
                        else {
                            // Disambiguate: SKU non-tracked (silent skip, comportement avant) vs stock insuffisant (loud)
                            const existing = await knex('inventory_items')
                                .where({ sku, active: true })
                                .first('quantity');
                            if (existing !== undefined) {
                                strapi.log.warn(`RACE-02: inventory insuffisant pour SKU "${sku}" (en stock: ${existing.quantity}, ` +
                                    `demande: ${qty}). Order ${order.documentId} paye mais stock non decremente. ` +
                                    `A traiter manuellement (rupture de stock non detectee lors de l'achat).`);
                            }
                        }
                    }
                }
                catch (err) {
                    strapi.log.warn('Could not update inventory:', err);
                }
                // Notifier les artistes concernes par la vente
                try {
                    const orderItems = Array.isArray(order.items) ? order.items : [];
                    const artistItemsMap = {};
                    // Charger tous les artistes actifs
                    const artists = await strapi.documents('api::artist.artist').findMany({
                        filters: { active: true },
                    });
                    const artistMap = {};
                    for (const a of artists) {
                        artistMap[a.slug] = a;
                    }
                    const slugs = Object.keys(artistMap);
                    // Charger TOUS les user-roles artist pour avoir un fallback email par slug
                    // (le champ artist.email peut etre null dans le CMS, l'email reel est dans user-role)
                    const userRoleEmailBySlug = {};
                    try {
                        const artistRoles = await strapi.documents('api::user-role.user-role').findMany({
                            filters: { role: 'artist' },
                        });
                        for (const ur of artistRoles) {
                            const slug = ur.artistSlug;
                            if (slug && ur.email) {
                                // Premier email trouve pour ce slug (ou le plus recent selon ordre de findMany)
                                if (!userRoleEmailBySlug[slug]) {
                                    userRoleEmailBySlug[slug] = ur.email;
                                }
                            }
                        }
                    }
                    catch (urErr) {
                        strapi.log.warn('Could not load user-roles for artist email fallback:', urErr);
                    }
                    // Grouper les items par artiste
                    for (const item of orderItems) {
                        const pid = item.productId || '';
                        if (!pid.startsWith('artist-print-') && !pid.startsWith('artist-sticker-pack-'))
                            continue;
                        let matchedSlug = null;
                        for (const slug of slugs) {
                            if (pid.startsWith(`artist-print-${slug}-`) || pid.startsWith(`artist-sticker-pack-${slug}-`)) {
                                if (!matchedSlug || slug.length > matchedSlug.length) {
                                    matchedSlug = slug;
                                }
                            }
                        }
                        if (!matchedSlug)
                            continue;
                        if (!artistItemsMap[matchedSlug])
                            artistItemsMap[matchedSlug] = [];
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
                    const shippingAddr = order.shippingAddress;
                    const customerCity = (shippingAddr === null || shippingAddr === void 0 ? void 0 : shippingAddr.city) || '';
                    const artistEntries = Object.entries(artistItemsMap);
                    const artistSendPromises = artistEntries.map(async ([slug, items]) => {
                        const artist = artistMap[slug];
                        const artistEmail = (artist === null || artist === void 0 ? void 0 : artist.email) || userRoleEmailBySlug[slug] || null;
                        if (!artistEmail) {
                            strapi.log.warn(`Artiste ${slug}: aucun email trouve (ni CMS ni user-role), notification non envoyee`);
                            return { slug, skipped: true };
                        }
                        try {
                            await (0, email_1.sendArtistSaleNotificationEmail)({
                                artistName: (artist === null || artist === void 0 ? void 0 : artist.name) || slug,
                                artistEmail,
                                items,
                                orderDate: new Date().toISOString(),
                                customerCity,
                            });
                            strapi.log.info(`Notification vente artiste ${slug} envoyee a ${artistEmail}`);
                            return { slug, sent: true };
                        }
                        catch (err) {
                            strapi.log.error(`STRIPE-04: ECHEC notification vente artiste. ` +
                                `orderId=${order.documentId} artistSlug=${slug} recipient=${artistEmail} ` +
                                `err=${(err === null || err === void 0 ? void 0 : err.message) || err}`);
                            return { slug, error: (err === null || err === void 0 ? void 0 : err.message) || String(err) };
                        }
                    });
                    await Promise.allSettled(artistSendPromises);
                }
                catch (err) {
                    strapi.log.warn('Could not notify artists:', err);
                }
                // Marquer les pieces uniques ET privees comme vendues dans le CMS artiste
                try {
                    const orderItems = Array.isArray(order.items) ? order.items : [];
                    // Charger une fois tous les artistes
                    const allArtists = await strapi.documents('api::artist.artist').findMany({ filters: { active: true } });
                    for (const item of orderItems) {
                        const pid = item.productId || '';
                        if (!pid.startsWith('artist-print-'))
                            continue;
                        // Trouver l'artiste et l'id du print
                        let matchedArtist = null;
                        let printId = '';
                        for (const a of allArtists) {
                            if (pid.startsWith(`artist-print-${a.slug}-`)) {
                                if (!matchedArtist || a.slug.length > matchedArtist.slug.length) {
                                    matchedArtist = a;
                                    printId = pid.replace(`artist-print-${a.slug}-`, '');
                                }
                            }
                        }
                        if (!matchedArtist || !printId)
                            continue;
                        const prints = Array.isArray(matchedArtist.prints) ? [...matchedArtist.prints] : [];
                        const idx = prints.findIndex((p) => p.id === printId);
                        if (idx === -1)
                            continue;
                        const print = prints[idx];
                        // Marquer comme vendu si: unique OU private (piece sur commande)
                        // Les prints non-uniques / non-prives (editions multiples) ne sont pas marques
                        const shouldMarkSold = print.unique === true || print.private === true || item.isUnique === true;
                        if (!shouldMarkSold)
                            continue;
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
                }
                catch (err) {
                    strapi.log.error('Could not mark unique/private pieces as sold:', err);
                }
            }
        }
        if (event.type === 'payment_intent.payment_failed') {
            const paymentIntent = event.data.object;
            const orders = await strapi.documents('api::order.order').findMany({
                filters: { stripePaymentIntentId: paymentIntent.id },
            });
            if (orders.length > 0) {
                const order = orders[0];
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
                }
                catch (err) {
                    strapi.log.warn('Could not release reservations on payment failure:', err);
                }
            }
        }
        ctx.body = { received: true };
    },
    // POST /orders/admin-create - Creer une commande manuellement (admin)
    async adminCreate(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const data = ctx.request.body;
        if (!data.customerName || !data.total) {
            return ctx.badRequest('customerName and total are required');
        }
        try {
            const order = await strapi.documents('api::order.order').create({ data });
            ctx.body = { success: true, data: order };
        }
        catch (err) {
            strapi.log.error('adminCreate error:', err);
            return ctx.badRequest(err.message);
        }
    },
    // GET /orders/by-payment-intent/:paymentIntentId - Recupere infos minimales d'une commande pour CheckoutSuccess
    async getByPaymentIntent(ctx) {
        const { paymentIntentId } = ctx.params;
        if (!paymentIntentId)
            return ctx.badRequest('paymentIntentId required');
        try {
            const order = await strapi.documents('api::order.order').findFirst({
                filters: { stripePaymentIntentId: paymentIntentId },
            });
            if (!order)
                return ctx.notFound('Order not found');
            // Retourner SEULEMENT les infos non-sensibles necessaires au signup
            ctx.body = {
                customerName: order.customerName || '',
                customerEmail: order.customerEmail || '',
                customerPhone: order.customerPhone || '',
                total: order.total || 0,
                invoiceNumber: order.invoiceNumber || null,
                hasUserAccount: !!(order.supabaseUserId && order.supabaseUserId !== ''),
            };
        }
        catch (err) {
            strapi.log.error('getByPaymentIntent error:', err);
            return ctx.badRequest(err.message);
        }
    },
    // POST /orders/link-by-email - Lier les guest orders au nouveau compte par email match
    async linkByEmail(ctx) {
        const { email, supabaseUserId } = ctx.request.body;
        if (!email || !supabaseUserId)
            return ctx.badRequest('email and supabaseUserId required');
        try {
            const orders = await strapi.documents('api::order.order').findMany({
                filters: {
                    customerEmail: email.toLowerCase(),
                    $or: [
                        { supabaseUserId: '' },
                        { supabaseUserId: { $null: true } },
                    ],
                },
            });
            let count = 0;
            for (const order of orders) {
                await strapi.documents('api::order.order').update({
                    documentId: order.documentId,
                    data: { supabaseUserId },
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
                            data: { supabaseUserId },
                        });
                    }
                }
            }
            catch (clientErr) {
                strapi.log.warn('Could not update client supabaseUserId:', clientErr);
            }
            strapi.log.info(`Linked ${count} orders to user ${supabaseUserId} (email: ${email})`);
            ctx.body = { success: true, linkedCount: count };
        }
        catch (err) {
            strapi.log.error('linkByEmail error:', err);
            return ctx.badRequest(err.message);
        }
    },
    // POST /orders/:documentId/resend-emails - Renvoyer TOUS les emails (confirmation client + notification admin)
    async resendAdminNotification(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { documentId } = ctx.params;
        try {
            const order = await strapi.documents('api::order.order').findFirst({
                filters: { documentId },
            });
            if (!order)
                return ctx.notFound('Order not found');
            const orderItems = Array.isArray(order.items) ? order.items : [];
            const orderRef = (order.stripePaymentIntentId || order.documentId || '').slice(-8).toUpperCase();
            const allUploadedFiles = [];
            for (const item of orderItems) {
                if (Array.isArray(item.uploadedFiles)) {
                    for (const f of item.uploadedFiles) {
                        if (f && (f.url || f.name)) {
                            allUploadedFiles.push({ name: f.name || f.url || 'Fichier', url: f.url || '' });
                        }
                    }
                }
            }
            await (0, email_1.sendNewOrderNotificationEmail)({
                orderRef,
                customerName: order.customerName,
                customerEmail: order.customerEmail,
                items: orderItems.map((item) => ({
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
                    if (existingOrders.length > 0 && existingOrders[0].invoiceNumber) {
                        seq = (parseInt(existingOrders[0].invoiceNumber.replace(prefix, ''), 10) || 0) + 1;
                    }
                    const invoiceNumber = `${prefix}${String(seq).padStart(4, '0')}`;
                    await strapi.documents('api::order.order').update({
                        documentId: order.documentId,
                        data: { invoiceNumber },
                    });
                    order.invoiceNumber = invoiceNumber;
                }
                await (0, email_1.sendOrderConfirmationEmail)({
                    customerName: order.customerName,
                    customerEmail: order.customerEmail,
                    orderRef,
                    invoiceNumber: order.invoiceNumber,
                    items: orderItems.map((item) => ({
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
            }
            catch (clientEmailErr) {
                strapi.log.warn('Erreur renvoi email client (non bloquant):', clientEmailErr);
            }
            ctx.body = { success: true, message: 'Notification admin + confirmation client envoyees' };
        }
        catch (err) {
            strapi.log.error('resendAdminNotification error:', err);
            return ctx.badRequest(err.message);
        }
    },
    async clients(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        // Read from Client collection (CRM)
        const clients = await strapi.documents('api::client.client').findMany({
            sort: 'totalSpent:desc',
            populate: ['files'],
        });
        ctx.body = { clients, total: clients.length };
    },
    async adminList(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const page = parseInt(ctx.query.page) || 1;
        const pageSize = parseInt(ctx.query.pageSize) || 25;
        const status = ctx.query.status;
        const search = ctx.query.search;
        const filters = {};
        if (status && status !== 'all') {
            filters.status = status;
        }
        else {
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
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { documentId } = ctx.params;
        const { status: newStatus, invoiceNumber, autoInvoice, sendEmails } = ctx.request.body;
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
        const updateData = { status: newStatus };
        let assignedInvoice = null;
        if (invoiceNumber && typeof invoiceNumber === 'string' && invoiceNumber.trim()) {
            updateData.invoiceNumber = invoiceNumber.trim();
            assignedInvoice = invoiceNumber.trim();
        }
        else if (autoInvoice && newStatus === 'paid' && !order.invoiceNumber) {
            // Auto-generate next sequential MM-YYYY-NNNN
            try {
                const year = new Date().getFullYear();
                const prefix = `MM-${year}-`;
                const existing = await strapi.documents('api::order.order').findMany({
                    filters: { invoiceNumber: { $startsWith: prefix } },
                    sort: { invoiceNumber: 'desc' },
                    limit: 1,
                });
                let seq = 1;
                if (existing.length > 0 && existing[0].invoiceNumber) {
                    const lastNum = existing[0].invoiceNumber.replace(prefix, '');
                    seq = (parseInt(lastNum, 10) || 0) + 1;
                }
                assignedInvoice = `${prefix}${String(seq).padStart(4, '0')}`;
                updateData.invoiceNumber = assignedInvoice;
            }
            catch (e) {
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
                const orderData = updated;
                const orderItems = Array.isArray(orderData.items) ? orderData.items : [];
                const sid = orderData.stripePaymentIntentId || '';
                const orderRef = sid.slice(-8).toUpperCase();
                const allUploadedFiles = [];
                for (const it of orderItems) {
                    if (Array.isArray(it.uploadedFiles)) {
                        for (const f of it.uploadedFiles) {
                            if (f && (f.url || f.name))
                                allUploadedFiles.push({ name: f.name || f.url, url: f.url || '' });
                        }
                    }
                }
                const emailItems = orderItems.map((it) => ({
                    productName: it.productName || 'Produit',
                    quantity: it.quantity || 1,
                    totalPrice: it.totalPrice || 0,
                    size: it.size || '',
                    finish: it.finish || '',
                }));
                await (0, email_1.sendOrderConfirmationEmail)({
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
                await (0, email_1.sendNewOrderNotificationEmail)({
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
            }
            catch (emailErr) {
                strapi.log.warn('[updateStatus] Erreur envoi emails (non bloquant):', emailErr);
            }
        }
        strapi.log.info(`Commande ${documentId} status: ${order.status} -> ${newStatus}`);
        // Quand la commande est livree, envoyer un email de demande de temoignage
        if (newStatus === 'delivered' && order.customerEmail) {
            try {
                const token = crypto_1.default.randomBytes(16).toString('hex');
                const customerName = order.customerName || order.customerEmail.split('@')[0];
                // Creer le temoignage en attente
                const testimonialData = {
                    name: customerName,
                    email: order.customerEmail,
                    textFr: '',
                    token,
                    approved: false,
                    order: { connect: [order.documentId] },
                };
                // Lier au client si existant
                const client = await strapi.documents('api::client.client').findFirst({
                    filters: { email: order.customerEmail },
                });
                if (client) {
                    testimonialData.client = { connect: [client.documentId] };
                }
                await strapi.documents('api::testimonial.testimonial').create({ data: testimonialData });
                const siteUrl = process.env.SITE_URL || 'https://massivemedias.com';
                const link = `${siteUrl}/temoignage?token=${token}`;
                await (0, email_1.sendTestimonialRequestEmail)({
                    customerName,
                    customerEmail: order.customerEmail,
                    testimonialLink: link,
                    orderRef: order.orderRef,
                });
                strapi.log.info(`Email temoignage envoye a ${order.customerEmail} pour commande ${documentId}`);
            }
            catch (err) {
                strapi.log.error('Erreur envoi email temoignage:', err);
                // Ne pas bloquer le changement de status si l'email echoue
            }
        }
        ctx.body = { data: updated };
    },
    async updateNotes(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { documentId } = ctx.params;
        const { notes } = ctx.request.body;
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
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { documentId } = ctx.params;
        const { total, reason } = ctx.request.body;
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
        });
        if (!order)
            return ctx.notFound('Commande introuvable');
        const previousCents = Number(order.total) || 0;
        const previousDollars = (previousCents / 100).toFixed(2);
        const newDollarsFmt = (newTotalCents / 100).toFixed(2);
        // Audit log: timestamp Montreal + admin email si dispo + old/new
        const adminEmail = ctx.state.adminUserEmail || ctx.state.adminAuthMethod || 'admin';
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
            },
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
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { documentId } = ctx.params;
        const { trackingNumber, carrier } = ctx.request.body;
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
        if (order.customerEmail) {
            try {
                await (0, email_1.sendTrackingEmail)({
                    customerName: order.customerName || 'Client',
                    customerEmail: order.customerEmail,
                    orderRef: order.orderRef || documentId.slice(0, 7).toUpperCase(),
                    trackingNumber,
                    carrier: carrier || 'postes-canada',
                });
            }
            catch (err) {
                strapi.log.error('Erreur envoi email suivi:', err);
            }
        }
        ctx.body = { data: updated };
    },
    async deleteOrder(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
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
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        // 1. Fetch all active artists
        const artists = await strapi.documents('api::artist.artist').findMany({
            filters: { active: true },
        });
        const artistMap = {};
        for (const a of artists) {
            artistMap[a.slug] = a;
        }
        const slugs = Object.keys(artistMap);
        // 2. Fetch completed orders
        const validStatuses = ['paid', 'processing', 'shipped', 'delivered'];
        const orders = await strapi.documents('api::order.order').findMany({
            filters: { status: { $in: validStatuses } },
            sort: 'createdAt:desc',
        });
        // Default production costs (fallback)
        const DEFAULT_COSTS = {
            studio: { a4: 12, a3: 16, a3plus: 20, a2: 28 },
            museum: { a4: 25, a3: 38, a3plus: 48, a2: 65 },
            frame: 8,
        };
        // Cout de production des stickers par palier (materiel + encre + temps)
        const STICKER_PROD_COSTS = {
            25: 8, 50: 12, 100: 15, 250: 30, 500: 50,
        };
        function getProductionCost(artist, item) {
            var _a;
            const pid = item.productId || '';
            // Sticker packs: cout par palier de quantite
            if (pid.startsWith('artist-sticker-pack-')) {
                const qty = item.quantity || 100;
                // Trouver le palier le plus proche
                const tiers = Object.keys(STICKER_PROD_COSTS).map(Number).sort((a, b) => a - b);
                let cost = STICKER_PROD_COSTS[100]; // defaut 100 unites
                for (const t of tiers) {
                    if (qty >= t)
                        cost = STICKER_PROD_COSTS[t];
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
                cost += ((_a = costs.frame) !== null && _a !== void 0 ? _a : DEFAULT_COSTS.frame);
            }
            return cost;
        }
        // 3. Parse items, match artist slugs, calculate commissions
        const commissionsByArtist = {};
        for (const order of orders) {
            const items = Array.isArray(order.items) ? order.items : [];
            for (const item of items) {
                const pid = item.productId || '';
                // Match artist prints AND sticker packs
                if (!pid.startsWith('artist-print-') && !pid.startsWith('artist-sticker-pack-'))
                    continue;
                // Skip commission if artist bought their own product
                if (item.isArtistOwnPrint)
                    continue;
                let matchedSlug = null;
                for (const slug of slugs) {
                    if (pid.startsWith(`artist-print-${slug}-`) || pid.startsWith(`artist-sticker-pack-${slug}-`)) {
                        if (!matchedSlug || slug.length > matchedSlug.length) {
                            matchedSlug = slug;
                        }
                    }
                }
                if (!matchedSlug)
                    continue;
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
        let payments = [];
        try {
            payments = await strapi.documents('api::artist-payment.artist-payment').findMany({
                sort: 'date:desc',
            });
        }
        catch {
            // content type might not exist yet
        }
        const paymentsByArtist = {};
        for (const p of payments) {
            const slug = p.artistSlug;
            if (!paymentsByArtist[slug])
                paymentsByArtist[slug] = [];
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
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        // PERF-03: Aggregations SQL au lieu de findMany -> JS. Avant, on chargeait TOUTES
        // les orders + expenses en memoire et iterait en JS. A 10 000+ orders c'etait ~10K
        // objets en heap + CPU iteration. Maintenant 5 GROUP BY renvoient juste les stats
        // dont on a besoin - RAM O(months + categories) au lieu de O(orders + expenses).
        const knex = strapi.db.connection;
        // Query 1: order counts + sums by status (pour orderStats + revenue paid)
        // Considere 'paid' tout ce qui n'est ni 'cancelled' ni 'pending' - meme regle que l'ancien code
        const orderByStatus = await knex('orders')
            .select('status')
            .count({ count: '*' })
            .sum({ total_cents: 'total' })
            .whereNot('status', 'cancelled')
            .groupBy('status');
        const statusBreakdown = {};
        let totalOrders = 0;
        let totalRevenue = 0;
        for (const row of orderByStatus) {
            const count = Number(row.count) || 0;
            const total = Number(row.total_cents) || 0;
            statusBreakdown[row.status] = count;
            totalOrders += count;
            if (row.status !== 'pending')
                totalRevenue += total;
        }
        const paidOrdersCount = totalOrders - (statusBreakdown.pending || 0);
        // Query 2: monthly revenue breakdown (paid only, meme filtre que l'ancien code)
        const monthlyRevenueRows = await knex('orders')
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
        const topClientRows = await knex('orders')
            .select(knex.raw('MAX(customer_email) AS email'), knex.raw('MAX(customer_name) AS name'))
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
        const [expenseTotals] = await knex('expenses')
            .sum({ total: 'amount' })
            .sum({ tps_paid: 'tps_amount' })
            .sum({ tvq_paid: 'tvq_amount' });
        const totalExpenses = Number(expenseTotals === null || expenseTotals === void 0 ? void 0 : expenseTotals.total) || 0;
        const totalTpsPaid = Number(expenseTotals === null || expenseTotals === void 0 ? void 0 : expenseTotals.tps_paid) || 0;
        const totalTvqPaid = Number(expenseTotals === null || expenseTotals === void 0 ? void 0 : expenseTotals.tvq_paid) || 0;
        // Query 5: monthly expenses + by category (un seul GROUP BY month,category)
        const expenseBreakdown = await knex('expenses')
            .select(knex.raw(`TO_CHAR(date, 'YYYY-MM') AS month`), 'category')
            .sum({ amount: 'amount' })
            .groupByRaw(`TO_CHAR(date, 'YYYY-MM'), category`);
        const monthlyExpensesMap = {};
        const expensesByCategory = {};
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
        ctx.body = (0, pricing_config_1.getPricingConfigPayload)();
    },
    /**
     * GET /sitemap.xml
     * SEO-01: sitemap dynamique genere depuis CMS. Inclut les pages fixes
     * + tous les artistes publies (updatedAt -> lastmod). Cache 1h.
     */
    async sitemap(ctx) {
        const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://massivemedias.com';
        const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
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
        let dynamicUrls = [];
        try {
            const artists = await strapi.documents('api::artist.artist').findMany({
                filters: { publishedAt: { $notNull: true } },
                fields: ['slug', 'updatedAt'],
                limit: 200,
            });
            dynamicUrls = artists
                .filter((a) => a.slug)
                .map((a) => ({
                loc: `/artistes/${a.slug}`,
                lastmod: (a.updatedAt ? new Date(a.updatedAt) : new Date()).toISOString().slice(0, 10),
                priority: 0.7,
                changefreq: 'weekly',
            }));
        }
        catch (err) {
            strapi.log.warn(`[sitemap] Could not load artists dynamically: ${err === null || err === void 0 ? void 0 : err.message}`);
            // On continue avec juste les pages statiques plutot que de 500.
        }
        const allUrls = [
            ...staticUrls.map((u) => ({ ...u, lastmod: today })),
            ...dynamicUrls,
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
            .map((u) => `  <url>
    <loc>${escape(SITE_URL + u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority.toFixed(1)}</priority>
  </url>`)
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
        var _a;
        // Security: shared secret via env var
        const authHeader = ctx.request.headers['authorization'] || '';
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        const expected = process.env.RECONCILE_TOKEN;
        if (!expected || expected.length < 16) {
            strapi.log.error('RECONCILE_TOKEN not configured (or too short)');
            return ctx.internalServerError('Reconcile endpoint not configured');
        }
        if (token !== expected) {
            return ctx.unauthorized('Invalid reconcile token');
        }
        const query = ctx.query;
        const targetSessionId = typeof query.sessionId === 'string' ? query.sessionId.trim() : '';
        const hours = Math.max(1, Math.min(720, parseInt(query.hours, 10) || 72));
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        const stripe = getStripe();
        // Find candidate draft orders
        const filters = { status: 'draft' };
        if (targetSessionId) {
            filters.stripePaymentIntentId = targetSessionId;
        }
        else {
            filters.createdAt = { $gte: cutoff.toISOString() };
        }
        const drafts = await strapi.documents('api::order.order').findMany({ filters });
        const report = {
            scanned: drafts.length,
            fixed: [],
            still_unpaid: [],
            errors: [],
        };
        for (const order of drafts) {
            const sid = order.stripePaymentIntentId || '';
            if (!sid) {
                report.errors.push({ id: order.id, email: order.customerEmail, reason: 'no stripe id' });
                continue;
            }
            try {
                let paymentIntentId = null;
                let paymentStatus = null;
                let paidAt = null;
                if (sid.startsWith('cs_')) {
                    const session = await stripe.checkout.sessions.retrieve(sid);
                    paymentStatus = session.payment_status;
                    paymentIntentId = typeof session.payment_intent === 'string'
                        ? session.payment_intent
                        : ((_a = session.payment_intent) === null || _a === void 0 ? void 0 : _a.id) || null;
                    if (session.created)
                        paidAt = new Date(session.created * 1000);
                }
                else if (sid.startsWith('pi_')) {
                    const pi = await stripe.paymentIntents.retrieve(sid);
                    paymentStatus = pi.status === 'succeeded' ? 'paid' : pi.status;
                    paymentIntentId = pi.id;
                    if (pi.created)
                        paidAt = new Date(pi.created * 1000);
                }
                else {
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
                        filters: { invoiceNumber: { $startsWith: prefix } },
                        sort: { invoiceNumber: 'desc' },
                        limit: 1,
                    });
                    let seq = 1;
                    if (existingOrders.length > 0 && existingOrders[0].invoiceNumber) {
                        const lastNum = existingOrders[0].invoiceNumber.replace(prefix, '');
                        seq = (parseInt(lastNum, 10) || 0) + 1;
                    }
                    invoiceNumber = `${prefix}${String(seq).padStart(4, '0')}`;
                }
                catch (invoiceErr) {
                    strapi.log.warn('Erreur generation numero facture (reconcile):', invoiceErr);
                    invoiceNumber = `MM-${new Date().getFullYear()}-0000`;
                }
                await strapi.documents('api::order.order').update({
                    documentId: order.documentId,
                    data: {
                        status: 'paid',
                        invoiceNumber,
                        stripePaymentIntentId: paymentIntentId || sid,
                    },
                });
                strapi.log.info(`[reconcile] Order ${order.documentId} -> paid (${invoiceNumber}) from ${sid}`);
                // Email confirmation client
                try {
                    const orderItems = Array.isArray(order.items) ? order.items : [];
                    const orderRef = (paymentIntentId || sid).slice(-8).toUpperCase();
                    await (0, email_1.sendOrderConfirmationEmail)({
                        customerName: order.customerName,
                        customerEmail: order.customerEmail,
                        orderRef,
                        invoiceNumber,
                        items: orderItems.map((item) => ({
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
                }
                catch (emailErr) {
                    strapi.log.warn('[reconcile] Erreur email confirmation:', emailErr);
                }
                // Notification admin
                try {
                    const orderItems2 = Array.isArray(order.items) ? order.items : [];
                    const orderRef2 = (paymentIntentId || sid).slice(-8).toUpperCase();
                    const allUploadedFiles = [];
                    for (const item of orderItems2) {
                        if (Array.isArray(item.uploadedFiles)) {
                            for (const f of item.uploadedFiles) {
                                if (f && (f.url || f.name)) {
                                    allUploadedFiles.push({ name: f.name || f.url || 'Fichier', url: f.url || '' });
                                }
                            }
                        }
                    }
                    await (0, email_1.sendNewOrderNotificationEmail)({
                        orderRef: orderRef2,
                        customerName: order.customerName,
                        customerEmail: order.customerEmail,
                        items: orderItems2.map((item) => ({
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
                }
                catch (adminEmailErr) {
                    strapi.log.warn('[reconcile] Erreur notification admin:', adminEmailErr);
                }
                // Update client stats
                try {
                    const clients = await strapi.documents('api::client.client').findMany({
                        filters: { email: (order.customerEmail || '').toLowerCase() },
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
                }
                catch (err) {
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
            }
            catch (err) {
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
                },
                limit: 500,
            });
            let cleanupCount = 0;
            for (const draft of oldDrafts) {
                try {
                    await strapi.documents('api::order.order').delete({ documentId: draft.documentId });
                    cleanupCount++;
                }
                catch (delErr) {
                    strapi.log.warn(`[reconcile:cleanup] Could not delete draft ${draft.id}: ${delErr === null || delErr === void 0 ? void 0 : delErr.message}`);
                }
            }
            if (cleanupCount > 0) {
                strapi.log.info(`[reconcile:cleanup] Deleted ${cleanupCount} draft orders older than 7 days`);
            }
            report.cleanedUpDrafts = cleanupCount;
        }
        catch (cleanupErr) {
            strapi.log.error('[reconcile:cleanup] Error:', cleanupErr === null || cleanupErr === void 0 ? void 0 : cleanupErr.message);
            report.cleanedUpDrafts = -1;
        }
        ctx.body = report;
    },
}));
