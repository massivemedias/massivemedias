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
const getStripe = () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key === 'sk_test_REPLACE_ME') {
        throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    return new stripe_1.default(key);
};
/**
 * Guard for destructive/admin-only endpoints.
 * Accepts EITHER:
 *   - Authorization: Bearer <ADMIN_API_TOKEN>   (service-to-service or trusted admin UI)
 *   - Authorization: Bearer <Supabase JWT>      where the user's email is in ADMIN_EMAILS
 *
 * Returns true if authorized. If not authorized, sets 401 on ctx and returns false -
 * callers MUST check the return value and exit early.
 *
 * CONFIG (on Render env vars):
 *   ADMIN_API_TOKEN: long random string (service token)
 *   ADMIN_EMAILS: comma-separated list of admin emails (defaults to ADMIN_EMAIL)
 */
async function requireAdminAuth(ctx) {
    var _a;
    const authHeader = ctx.request.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
        ctx.status = 401;
        ctx.body = { error: { status: 401, name: 'Unauthorized', message: 'Missing Authorization header' } };
        return false;
    }
    // Option A: service token match
    const adminApiToken = process.env.ADMIN_API_TOKEN;
    if (adminApiToken && adminApiToken.length >= 16 && token === adminApiToken) {
        ctx.state.adminAuthMethod = 'service-token';
        return true;
    }
    // Option B: Supabase JWT + email in ADMIN_EMAILS
    let diag = {
        supabaseUrlPresent: false,
        supabaseKeyPresent: false,
        supabaseError: null,
        jwtEmail: null,
        adminEmailsConfigured: false,
        emailIsAdmin: false,
    };
    try {
        const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_API_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_API_KEY;
        diag.supabaseUrlPresent = !!supabaseUrl;
        diag.supabaseKeyPresent = !!supabaseKey;
        if (supabaseUrl && supabaseKey) {
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { data, error } = await supabase.auth.getUser(token);
            if (error) {
                diag.supabaseError = error.message || String(error);
            }
            else if ((_a = data === null || data === void 0 ? void 0 : data.user) === null || _a === void 0 ? void 0 : _a.email) {
                diag.jwtEmail = data.user.email;
                const adminEmailsRaw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '';
                diag.adminEmailsConfigured = !!adminEmailsRaw.trim();
                const adminEmails = adminEmailsRaw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
                const matchEmail = adminEmails.includes(data.user.email.toLowerCase());
                diag.emailIsAdmin = matchEmail;
                if (matchEmail) {
                    ctx.state.adminAuthMethod = 'supabase-jwt';
                    ctx.state.adminUserEmail = data.user.email;
                    return true;
                }
            }
        }
    }
    catch (e) {
        diag.supabaseError = (e === null || e === void 0 ? void 0 : e.message) || String(e);
        strapi.log.warn('requireAdminAuth: Supabase verification error', e);
    }
    // Expose diagnostic info to caller via ctx.state so /admin-whoami can surface it.
    ctx.state.__authDiag = diag;
    ctx.status = 401;
    ctx.body = { error: { status: 401, name: 'Unauthorized', message: 'Admin authentication required' } };
    strapi.log.warn(`Admin-protected endpoint hit without valid auth: ${ctx.method} ${ctx.url} - diag: ${JSON.stringify(diag)}`);
    return false;
}
// Sticker pricing tiers for server-side validation (tarifs de REFERENCE 3")
const STICKER_STANDARD_TIERS = { 25: 30, 50: 47.50, 100: 85, 250: 200, 500: 375 };
const STICKER_FX_TIERS = { 25: 35, 50: 57.50, 100: 100, 250: 225, 500: 425 };
const FX_FINISHES = ['holographic', 'broken-glass', 'stars'];
const ARTIST_DISCOUNT = 0.25; // Rabais artiste sur ses propres produits
// Size multipliers cote backend - DOIVENT matcher exactement frontend/src/data/products.js
// Sinon le server va rejeter des commandes legitimes ou accepter du under-pricing.
const SIZE_MULTIPLIERS = {
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
function getSizeMultiplier(size) {
    if (size === null || size === undefined)
        return 1.0;
    const match = String(size).match(/^\s*([\d.]+)/);
    if (!match)
        return 1.0;
    const key = match[1];
    return Object.prototype.hasOwnProperty.call(SIZE_MULTIPLIERS, key)
        ? SIZE_MULTIPLIERS[key]
        : 1.0;
}
// Business card pricing tiers for server-side validation
const BUSINESS_CARD_TIERS = {
    'business-card-standard': { 100: 55, 250: 75, 500: 95, 1000: 130 },
    'business-card-lamine': { 100: 70, 250: 95, 500: 120, 1000: 165 },
    'business-card-premium': { 100: 120, 250: 175, 500: 250 },
};
// Flyer pricing tiers for server-side validation
const FLYER_TIERS = { 50: 40, 100: 70, 150: 98, 250: 138, 500: 250 };
const FLYER_RECTO_VERSO_MULTIPLIER = 1.3;
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
                const isFx = FX_FINISHES.some((f) => finishLower.includes(f));
                const tiers = isFx ? STICKER_FX_TIERS : STICKER_STANDARD_TIERS;
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
                const cardTiers = BUSINESS_CARD_TIERS[item.productId];
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
                const tierPrice = FLYER_TIERS[item.quantity];
                if (tierPrice) {
                    // Apply recto-verso multiplier if applicable
                    const isRectoVerso = item.finish && (item.finish.toLowerCase().includes('recto-verso') || item.finish.toLowerCase().includes('double'));
                    validPrice = isRectoVerso ? Math.round(tierPrice * FLYER_RECTO_VERSO_MULTIPLIER) : tierPrice;
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
        // Recalculate server-side with sticker tier validation
        // ET validation des prix des artist-prints (anti-manipulation) + check sold/private token
        // Prix cadre par defaut - DOIT matcher frontend/src/data/products.js (fineArtFramePriceByFormat)
        // sinon le backend rejette des commandes legitimes. A2 = 45$ depuis avril 2026.
        const FRAME_PRICES_FALLBACK = { postcard: 20, a4: 20, a3: 30, a3plus: 35, a2: 45 };
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
                        ? ((_b = (_a = frameMap[format]) !== null && _a !== void 0 ? _a : FRAME_PRICES_FALLBACK[format]) !== null && _b !== void 0 ? _b : 30)
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
                    artistDiscountTotal += Math.round(validPrice * ARTIST_DISCOUNT);
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
        var _a;
        const sig = ctx.request.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
        const requestId = crypto_1.default.randomBytes(4).toString('hex');
        if (!endpointSecret || endpointSecret === 'whsec_REPLACE_ME') {
            strapi.log.warn(`[webhook:${requestId}] Stripe webhook secret not configured`);
            // Alert admin immediately - config broken in prod
            try {
                const { sendWebhookFailureAlert } = await Promise.resolve().then(() => __importStar(require('../../../utils/email')));
                await sendWebhookFailureAlert({
                    reason: 'STRIPE_WEBHOOK_SECRET env var missing or placeholder',
                    requestId,
                });
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
            // Alert admin IMMEDIATELY on EVERY failure.
            // We intentionally do NOT throttle: the process restarts on OOM which would reset an
            // in-memory throttle anyway, AND a handful of duplicate emails is MUCH less harmful than
            // the 4-day silent failure we had in April 2026. If Stripe retry-storms, persistence
            // throttling should be added via the DB, not in-process state.
            try {
                const { sendWebhookFailureAlert } = await Promise.resolve().then(() => __importStar(require('../../../utils/email')));
                await sendWebhookFailureAlert({
                    reason: `Stripe signature verification failed: ${err.message}`,
                    requestId,
                    sigHeader: sig ? sig.substring(0, 80) : '(missing)',
                    bodyPresent: !!ctx.request.body,
                });
                strapi.log.warn(`[webhook:${requestId}] Admin alert email dispatched`);
            }
            catch (alertErr) {
                strapi.log.error(`[webhook:${requestId}] Failed to send admin alert:`, alertErr === null || alertErr === void 0 ? void 0 : alertErr.message);
            }
            return ctx.badRequest(`Webhook Error: ${err.message}`);
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
            // Race fix: if payment_intent.succeeded arrives BEFORE checkout.session.completed,
            // the order may still have its cs_live_ stored in stripePaymentIntentId. Retrieve the
            // payment intent's checkout session id via Stripe API so we can match by either column.
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
            const orFilters = [
                { stripePaymentIntentId: paymentIntent.id },
            ];
            if (checkoutSessionId) {
                orFilters.push({ stripeCheckoutSessionId: checkoutSessionId });
                orFilters.push({ stripePaymentIntentId: checkoutSessionId });
            }
            const orders = await strapi.documents('api::order.order').findMany({
                filters: { $or: orFilters },
            });
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
                // Envoyer email de confirmation
                try {
                    const orderItems = Array.isArray(order.items) ? order.items : [];
                    const orderRef = paymentIntent.id.slice(-8).toUpperCase();
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
                    strapi.log.info(`Email de confirmation envoye a ${order.customerEmail}`);
                }
                catch (emailErr) {
                    strapi.log.warn('Erreur envoi email confirmation (non bloquant):', emailErr);
                }
                // Notifier l'admin de la nouvelle vente
                try {
                    const orderItems2 = Array.isArray(order.items) ? order.items : [];
                    const orderRef2 = paymentIntent.id.slice(-8).toUpperCase();
                    // Collecter tous les fichiers uploades de tous les items
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
                    strapi.log.info(`Notification vente admin envoyee pour commande ${orderRef2}`);
                }
                catch (adminEmailErr) {
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
                }
                catch (err) {
                    strapi.log.warn('Could not update client stats:', err);
                }
                // Decrement inventory stock for each item in the order
                try {
                    const orderItems = Array.isArray(order.items) ? order.items : [];
                    for (const item of orderItems) {
                        const qty = item.quantity || 1;
                        const sku = item.sku || item.slug;
                        if (!sku)
                            continue;
                        const inventoryItems = await strapi.documents('api::inventory-item.inventory-item').findMany({
                            filters: { sku, active: true },
                        });
                        if (inventoryItems.length > 0) {
                            const inv = inventoryItems[0];
                            const newQty = Math.max(0, (inv.quantity || 0) - qty);
                            await strapi.documents('api::inventory-item.inventory-item').update({
                                documentId: inv.documentId,
                                data: { quantity: newQty },
                            });
                            strapi.log.info(`Inventory ${sku}: ${inv.quantity} -> ${newQty} (-${qty})`);
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
                    // Envoyer un email a chaque artiste concerne
                    const shippingAddr = order.shippingAddress;
                    const customerCity = (shippingAddr === null || shippingAddr === void 0 ? void 0 : shippingAddr.city) || '';
                    for (const [slug, items] of Object.entries(artistItemsMap)) {
                        const artist = artistMap[slug];
                        // Email prioritaire: artist.email, sinon fallback user-role.email
                        const artistEmail = (artist === null || artist === void 0 ? void 0 : artist.email) || userRoleEmailBySlug[slug] || null;
                        if (!artistEmail) {
                            strapi.log.warn(`Artiste ${slug}: aucun email trouve (ni CMS ni user-role), notification non envoyee`);
                            continue;
                        }
                        // IMPORTANT: await pour que l'erreur soit visible dans les logs au lieu d'un .catch silencieux
                        try {
                            await (0, email_1.sendArtistSaleNotificationEmail)({
                                artistName: (artist === null || artist === void 0 ? void 0 : artist.name) || slug,
                                artistEmail,
                                items,
                                orderDate: new Date().toISOString(),
                                customerCity,
                            });
                            strapi.log.info(`Notification vente artiste ${slug} envoyee a ${artistEmail}`);
                        }
                        catch (err) {
                            strapi.log.error(`ECHEC notification vente artiste ${slug} (${artistEmail}):`, err);
                        }
                    }
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
                        prints[idx] = { ...print, sold: true, soldAt: new Date().toISOString() };
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
                await strapi.documents('api::order.order').update({
                    documentId: orders[0].documentId,
                    data: { status: 'cancelled' },
                });
                strapi.log.info(`Order ${orders[0].documentId} marked as cancelled (payment failed)`);
            }
        }
        ctx.body = { received: true };
    },
    // POST /orders/admin-create - Creer une commande manuellement (admin)
    async adminCreate(ctx) {
        if (!(await requireAdminAuth(ctx)))
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
        if (!(await requireAdminAuth(ctx)))
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
        if (!(await requireAdminAuth(ctx)))
            return;
        // Read from Client collection (CRM)
        const clients = await strapi.documents('api::client.client').findMany({
            sort: 'totalSpent:desc',
            populate: ['files'],
        });
        ctx.body = { clients, total: clients.length };
    },
    async adminList(ctx) {
        if (!(await requireAdminAuth(ctx)))
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
        if (!(await requireAdminAuth(ctx)))
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
        if (!(await requireAdminAuth(ctx)))
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
        if (!(await requireAdminAuth(ctx)))
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
        if (!(await requireAdminAuth(ctx)))
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
        if (!(await requireAdminAuth(ctx)))
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
        if (!(await requireAdminAuth(ctx)))
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
        if (!(await requireAdminAuth(ctx)))
            return;
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
        const paidOrders = orders.filter((o) => o.status !== 'pending');
        const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        // Monthly revenue breakdown
        const monthlyRevenue = {};
        for (const order of paidOrders) {
            const month = order.createdAt.slice(0, 7); // "YYYY-MM"
            if (!monthlyRevenue[month]) {
                monthlyRevenue[month] = { revenue: 0, orders: 0 };
            }
            monthlyRevenue[month].revenue += order.total;
            monthlyRevenue[month].orders += 1;
        }
        // Expense calculations (amounts are in dollars)
        const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        const totalTpsPaid = expenses.reduce((sum, e) => sum + (parseFloat(e.tpsAmount) || 0), 0);
        const totalTvqPaid = expenses.reduce((sum, e) => sum + (parseFloat(e.tvqAmount) || 0), 0);
        // Monthly expenses breakdown
        const monthlyExpenses = {};
        const expensesByCategory = {};
        for (const expense of expenses) {
            const month = expense.date.slice(0, 7);
            const amount = Number(expense.amount) || 0;
            monthlyExpenses[month] = (monthlyExpenses[month] || 0) + amount;
            expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + amount;
        }
        // Tax calculations (TPS 5%, TVQ 9.975% on revenue in dollars)
        const revenueInDollars = totalRevenue / 100;
        const tpsCollected = revenueInDollars * 0.05;
        const tvqCollected = revenueInDollars * 0.09975;
        // Order status breakdown
        const statusBreakdown = {};
        for (const order of orders) {
            statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
        }
        // Top clients
        const clientMap = new Map();
        for (const order of paidOrders) {
            const key = order.customerEmail.toLowerCase();
            if (clientMap.has(key)) {
                const c = clientMap.get(key);
                c.totalSpent += order.total;
                c.orderCount += 1;
            }
            else {
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
        ctx.body = report;
    },
}));
