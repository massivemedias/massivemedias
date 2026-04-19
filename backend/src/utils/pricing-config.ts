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

// --- Prix cadre fine art par format (DOIT matcher products.js fineArtFramePriceByFormat) ---
// A2 = 45$ depuis avril 2026 (fix PRIX-01 du 18 avril). Les anciennes commandes avec
// 40$ ont ete reconciliees manuellement, le prix courant est 45$.
export const FRAME_PRICES_FALLBACK: Record<string, number> = {
  postcard: 20,
  a4: 20,
  a3: 30,
  a3plus: 35,
  a2: 45,
};

// --- Sticker pricing tiers (reference 3") ---
// Multiplier via SIZE_MULTIPLIERS pour 2", 4", 5" etc.
export const STICKER_STANDARD_TIERS: Record<number, number> = {
  25: 30,
  50: 47.50,
  100: 85,
  250: 200,
  500: 375,
};

export const STICKER_FX_TIERS: Record<number, number> = {
  25: 35,
  50: 57.50,
  100: 100,
  250: 225,
  500: 425,
};

export const FX_FINISHES = ['holographic', 'broken-glass', 'stars'];

// --- Size multipliers stickers (DOIT matcher products.js) ---
export const SIZE_MULTIPLIERS: Record<string, number> = {
  '2': 0.8,
  '2.5': 0.9,
  '3': 1.0,
  '4': 1.5,
  '5': 2.0,
};

// --- Business cards ---
export const BUSINESS_CARD_TIERS: Record<string, Record<number, number>> = {
  'business-card-standard': { 100: 55, 250: 75, 500: 95, 1000: 130 },
  'business-card-lamine':   { 100: 70, 250: 95, 500: 120, 1000: 165 },
  'business-card-premium':  { 100: 120, 250: 175, 500: 250 },
};

// --- Flyers ---
export const FLYER_TIERS: Record<number, number> = { 50: 40, 100: 70, 150: 98, 250: 138, 500: 250 };
export const FLYER_RECTO_VERSO_MULTIPLIER = 1.3;

// --- Rabais artiste sur ses propres produits ---
export const ARTIST_DISCOUNT = 0.25;

/**
 * Payload complet retourne par GET /api/pricing-config.
 * Le frontend peut cacher cette reponse et fallback sur ses constantes locales
 * si l'appel fail (backend down, reseau coupe).
 */
export function getPricingConfigPayload() {
  return {
    framePricesByFormat: FRAME_PRICES_FALLBACK,
    stickerTiersStandard: STICKER_STANDARD_TIERS,
    stickerTiersFx: STICKER_FX_TIERS,
    fxFinishes: FX_FINISHES,
    sizeMultipliers: SIZE_MULTIPLIERS,
    businessCardTiers: BUSINESS_CARD_TIERS,
    flyerTiers: FLYER_TIERS,
    flyerRectoVersoMultiplier: FLYER_RECTO_VERSO_MULTIPLIER,
    artistDiscount: ARTIST_DISCOUNT,
    // Metadata pour que le frontend puisse decider de rafraichir ou pas
    _meta: {
      version: '1',
      updatedAt: new Date().toISOString(),
    },
  };
}
