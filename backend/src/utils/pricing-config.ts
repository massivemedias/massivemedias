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

// DO NOT MODIFY THESE PRICES. OFFICIAL GRID. NO DYNAMIC MATH FORMULAS ALLOWED HERE WITHOUT EXPLICIT BOSS APPROVAL.
// Grille officielle Standard (Matte / Lustre / Die-Cut) - prix fixe par palier.
export const STICKER_STANDARD_TIERS: Record<number, number> = {
  25: 30,
  50: 47.50,
  100: 85,
  250: 200,
  500: 375,
};

// DO NOT MODIFY THESE PRICES. OFFICIAL GRID. NO DYNAMIC MATH FORMULAS ALLOWED HERE WITHOUT EXPLICIT BOSS APPROVAL.
// Grille officielle FX (Holographique / Broken Glass / Stars) - prix fixe par palier.
export const STICKER_FX_TIERS: Record<number, number> = {
  25: 35,
  50: 57.50,
  100: 100,
  250: 225,
  500: 425,
};

export const FX_FINISHES = ['holographic', 'broken-glass', 'stars'];

// DEPRECATED (avril 2026): la grille officielle impose un prix fixe par palier.
// La taille n'impacte plus le prix. Valeurs forcees a 1.0 pour ne rien casser
// chez les consommateurs existants (GET /api/pricing-config, admin UI).
export const SIZE_MULTIPLIERS: Record<string, number> = {
  '2': 1.0,
  '2.5': 1.0,
  '3': 1.0,
  '4': 1.0,
  '5': 1.0,
};

// --- Business cards ---
export const BUSINESS_CARD_TIERS: Record<string, Record<number, number>> = {
  'business-card-standard': { 100: 55, 250: 75, 500: 95, 1000: 130 },
  'business-card-lamine':   { 100: 70, 250: 95, 500: 120, 1000: 165 },
  'business-card-premium':  { 100: 120, 250: 175, 500: 250 },
};

// DO NOT MODIFY THESE PRICES. OFFICIAL GRID 2026. NO DYNAMIC MATH FORMULAS ALLOWED HERE WITHOUT EXPLICIT BOSS APPROVAL.
// Grille officielle Flyers - prix fixe recto et recto-verso (pas un multiplier).
export const FLYER_TIERS: Record<number, number> = { 50: 40, 100: 70, 150: 98, 250: 138, 500: 250 };
export const FLYER_RECTO_VERSO_TIERS: Record<number, number> = { 50: 52, 100: 91, 150: 127, 250: 179, 500: 325 };

// DEPRECATED (avril 2026): utiliser FLYER_RECTO_VERSO_TIERS a la place.
// Conserve pour ne pas casser d'eventuels consommateurs historiques.
export const FLYER_RECTO_VERSO_MULTIPLIER = 1.3;

// DO NOT MODIFY THESE PRICES. OFFICIAL GRID 2026.
// Grille officielle Fine Art par format (Studio / Musee).
export const FINE_ART_STUDIO_PRICES: Record<string, number | null> = {
  postcard: 15, a4: 20, a3: 25, a3plus: 35, a2: null,
};
export const FINE_ART_MUSEUM_PRICES: Record<string, number> = {
  postcard: 30, a4: 40, a3: 55, a3plus: 95, a2: 110,
};

// DO NOT MODIFY THESE PRICES. OFFICIAL GRID 2026.
// Grille officielle Sublimation - prix unitaires par produit et palier.
export const SUBLIMATION_UNIT_PRICES: Record<string, Record<number, number>> = {
  tshirt:     { 1: 30, 5: 27, 10: 25, 25: 23 },
  longsleeve: { 1: 40, 5: 37, 10: 35, 25: 33 },
  hoodie:     { 1: 50, 5: 45, 10: 42, 25: 40 },
  totebag:    { 1: 15, 10: 13, 25: 12, 50: 10 },
  mug:        { 1: 15, 5: 13, 10: 12, 25: 10 },
  tumbler:    { 1: 25, 5: 22, 10: 20, 25: 18 },
  bag:        { 1: 80, 5: 75, 10: 70 },
};
export const SUBLIMATION_DESIGN_FEE = 125;

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
    flyerRectoVersoTiers: FLYER_RECTO_VERSO_TIERS,
    flyerRectoVersoMultiplier: FLYER_RECTO_VERSO_MULTIPLIER,
    fineArtStudioPrices: FINE_ART_STUDIO_PRICES,
    fineArtMuseumPrices: FINE_ART_MUSEUM_PRICES,
    sublimationUnitPrices: SUBLIMATION_UNIT_PRICES,
    sublimationDesignFee: SUBLIMATION_DESIGN_FEE,
    artistDiscount: ARTIST_DISCOUNT,
    // Metadata pour que le frontend puisse decider de rafraichir ou pas
    _meta: {
      version: '2',
      updatedAt: new Date().toISOString(),
    },
  };
}
