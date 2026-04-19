"use strict";
/**
 * PRIX-02: source de verite unique pour le pricing backend.
 *
 * Avant, ces constantes vivaient dans order.ts (declarees top-level + FRAME_PRICES
 * inline dans createCheckoutSession). Maintenant elles vivent ici, une seule fois,
 * et sont exposees via l'endpoint public `GET /api/pricing-config` pour que le
 * frontend puisse les consommer au runtime (avec fallback local au cas ou le
 * backend est down).
 *
 * IMPORTANT: les valeurs DOIVENT matcher `frontend/src/data/products.js`, sinon
 * le backend rejette des commandes legitimes (calcul validPrice serveur strict).
 * La migration complete du frontend vers fetch /api/pricing-config est l'objet
 * du chantier PRIX-02-frontend (Vague 3). En attendant, cette duplication reste
 * mais la source de verite backend est maintenant un seul fichier.
 *
 * Pour modifier un prix:
 *   1. Modifier la valeur ici
 *   2. Modifier la meme valeur dans frontend/src/data/products.js (cf AdminTarifs.jsx)
 *   3. Verifier le contrat API /pricing-config renvoie bien la nouvelle valeur
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPricingConfigPayload = exports.ARTIST_DISCOUNT = exports.FLYER_RECTO_VERSO_MULTIPLIER = exports.FLYER_TIERS = exports.BUSINESS_CARD_TIERS = exports.SIZE_MULTIPLIERS = exports.FX_FINISHES = exports.STICKER_FX_TIERS = exports.STICKER_STANDARD_TIERS = exports.FRAME_PRICES_FALLBACK = void 0;
// --- Prix cadre fine art par format (DOIT matcher products.js fineArtFramePriceByFormat) ---
// A2 = 45$ depuis avril 2026 (fix PRIX-01 du 18 avril). Les anciennes commandes avec
// 40$ ont ete reconciliees manuellement, le prix courant est 45$.
exports.FRAME_PRICES_FALLBACK = {
    postcard: 20,
    a4: 20,
    a3: 30,
    a3plus: 35,
    a2: 45,
};
// --- Sticker pricing tiers (reference 3") ---
// Multiplier via SIZE_MULTIPLIERS pour 2", 4", 5" etc.
exports.STICKER_STANDARD_TIERS = {
    25: 30,
    50: 47.50,
    100: 85,
    250: 200,
    500: 375,
};
exports.STICKER_FX_TIERS = {
    25: 35,
    50: 57.50,
    100: 100,
    250: 225,
    500: 425,
};
exports.FX_FINISHES = ['holographic', 'broken-glass', 'stars'];
// --- Size multipliers stickers (DOIT matcher products.js) ---
exports.SIZE_MULTIPLIERS = {
    '2': 0.8,
    '2.5': 0.9,
    '3': 1.0,
    '4': 1.5,
    '5': 2.0,
};
// --- Business cards ---
exports.BUSINESS_CARD_TIERS = {
    'business-card-standard': { 100: 55, 250: 75, 500: 95, 1000: 130 },
    'business-card-lamine': { 100: 70, 250: 95, 500: 120, 1000: 165 },
    'business-card-premium': { 100: 120, 250: 175, 500: 250 },
};
// --- Flyers ---
exports.FLYER_TIERS = { 50: 40, 100: 70, 150: 98, 250: 138, 500: 250 };
exports.FLYER_RECTO_VERSO_MULTIPLIER = 1.3;
// --- Rabais artiste sur ses propres produits ---
exports.ARTIST_DISCOUNT = 0.25;
/**
 * Payload complet retourne par GET /api/pricing-config.
 * Le frontend peut cacher cette reponse et fallback sur ses constantes locales
 * si l'appel fail (backend down, reseau coupe).
 */
function getPricingConfigPayload() {
    return {
        framePricesByFormat: exports.FRAME_PRICES_FALLBACK,
        stickerTiersStandard: exports.STICKER_STANDARD_TIERS,
        stickerTiersFx: exports.STICKER_FX_TIERS,
        fxFinishes: exports.FX_FINISHES,
        sizeMultipliers: exports.SIZE_MULTIPLIERS,
        businessCardTiers: exports.BUSINESS_CARD_TIERS,
        flyerTiers: exports.FLYER_TIERS,
        flyerRectoVersoMultiplier: exports.FLYER_RECTO_VERSO_MULTIPLIER,
        artistDiscount: exports.ARTIST_DISCOUNT,
        // Metadata pour que le frontend puisse decider de rafraichir ou pas
        _meta: {
            version: '1',
            updatedAt: new Date().toISOString(),
        },
    };
}
exports.getPricingConfigPayload = getPricingConfigPayload;
