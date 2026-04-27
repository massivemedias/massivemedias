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
exports.getPricingConfigPayload = exports.ARTIST_DISCOUNT = exports.SUBLIMATION_DESIGN_FEE = exports.SUBLIMATION_UNIT_PRICES = exports.FINE_ART_MUSEUM_PRICES = exports.FINE_ART_STUDIO_PRICES = exports.FLYER_RECTO_VERSO_MULTIPLIER = exports.FLYER_RECTO_VERSO_TIERS = exports.FLYER_TIERS = exports.BUSINESS_CARD_TIERS = exports.SIZE_MULTIPLIERS = exports.lookupStickerPriceBySize = exports.getStickerSizeTier = exports.FX_FINISHES = exports.STICKER_FX_TIERS = exports.STICKER_STANDARD_TIERS = exports.STICKER_GRID = exports.FRAME_PRICES_FALLBACK = void 0;
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
// DO NOT MODIFY THESE PRICES. OFFICIAL GRID 2026 v3 (3 paliers de taille).
// FIX-PRICING-TIERS (27 avril 2026) : refonte du systeme de prix sticker pour
// tenir compte de la consommation reelle de matiere selon la taille. Avant :
// prix fixe peu importe la taille -> non rentable sur 4"/5". Maintenant :
// 3 paliers de taille (standard/medium/large) avec une grille dediee chacun.
//
// Mapping taille -> tier :
//   2"   -> standard (la plus petite)
//   2.5" -> standard
//   3"   -> medium  (entre 2.5" et 3.5")
//   3.5" -> medium
//   4"   -> large
//   5"   -> large   (la plus grande)
//
// Majoration calibree :
//   medium = standard x 1.35  (+35%, arrondi a 5$)
//   large  = standard x 1.85  (+85%, arrondi a 5$)
// Memes ratios appliques aux finis FX pour proportionnalite.
exports.STICKER_GRID = {
    standard: {
        matte: { 25: 30, 50: 47.50, 100: 85, 250: 200, 500: 375 },
        fx: { 25: 35, 50: 57.50, 100: 100, 250: 225, 500: 425 },
    },
    medium: {
        matte: { 25: 40, 50: 65, 100: 115, 250: 275, 500: 500 },
        fx: { 25: 50, 50: 80, 100: 135, 250: 305, 500: 575 },
    },
    large: {
        matte: { 25: 55, 50: 90, 100: 160, 250: 375, 500: 700 },
        fx: { 25: 65, 50: 105, 100: 185, 250: 415, 500: 785 },
    },
};
// ALIAS RETRO-COMPAT : pointent sur le palier `standard` (= ancien comportement).
// Tout le code legacy qui faisait STICKER_STANDARD_TIERS[qty] continue de fonctionner.
// Pour le nouveau code, utiliser STICKER_GRID[tier][kind][qty] avec getStickerSizeTier().
exports.STICKER_STANDARD_TIERS = exports.STICKER_GRID.standard.matte;
exports.STICKER_FX_TIERS = exports.STICKER_GRID.standard.fx;
exports.FX_FINISHES = ['holographic', 'broken-glass', 'stars'];
/**
 * Mapping taille (string id ou label) -> tier de prix (standard/medium/large).
 * Accepte tous les formats : '2', '2in', '2.5', '2.5in', '3"', etc. Tolerance
 * volontaire pour ne pas casser sur des items historiques avec des formats
 * variables. Fallback 'standard' si parse echoue (tier le moins cher).
 */
function getStickerSizeTier(size) {
    if (size === null || size === undefined)
        return 'standard';
    const match = String(size).match(/^\s*([\d.]+)/);
    if (!match)
        return 'standard';
    const inches = parseFloat(match[1]);
    if (!Number.isFinite(inches))
        return 'standard';
    if (inches <= 2.5)
        return 'standard';
    if (inches <= 3.5)
        return 'medium';
    return 'large'; // 4" et 5" (et tout > 3.5")
}
exports.getStickerSizeTier = getStickerSizeTier;
/**
 * Lookup officiel du prix sticker selon (finish, qty, size).
 * Retourne null si quantite hors grille.
 */
function lookupStickerPriceBySize(finish, qty, size) {
    var _a;
    const tier = getStickerSizeTier(size);
    const kind = exports.FX_FINISHES.includes(finish) ? 'fx' : 'matte';
    const grid = exports.STICKER_GRID[tier][kind];
    return (_a = grid[qty]) !== null && _a !== void 0 ? _a : null;
}
exports.lookupStickerPriceBySize = lookupStickerPriceBySize;
// DEPRECATED (avril 2026, garde pour compat retro)
// Maintenant que les tailles influencent le prix via STICKER_GRID, ces multipliers
// ne servent plus. Conservation a 1.0 pour ne pas casser les eventuels lecteurs
// existants. Les nouveaux consommateurs doivent utiliser getStickerSizeTier().
exports.SIZE_MULTIPLIERS = {
    '2': 1.0,
    '2.5': 1.0,
    '3': 1.0,
    '3.5': 1.0,
    '4': 1.0,
    '5': 1.0,
};
// --- Business cards ---
exports.BUSINESS_CARD_TIERS = {
    'business-card-standard': { 100: 55, 250: 75, 500: 95, 1000: 130 },
    'business-card-lamine': { 100: 70, 250: 95, 500: 120, 1000: 165 },
    'business-card-premium': { 100: 120, 250: 175, 500: 250 },
};
// DO NOT MODIFY THESE PRICES. OFFICIAL GRID 2026. NO DYNAMIC MATH FORMULAS ALLOWED HERE WITHOUT EXPLICIT BOSS APPROVAL.
// Grille officielle Flyers - prix fixe recto et recto-verso (pas un multiplier).
exports.FLYER_TIERS = { 50: 40, 100: 70, 150: 98, 250: 138, 500: 250 };
exports.FLYER_RECTO_VERSO_TIERS = { 50: 52, 100: 91, 150: 127, 250: 179, 500: 325 };
// DEPRECATED (avril 2026): utiliser FLYER_RECTO_VERSO_TIERS a la place.
// Conserve pour ne pas casser d'eventuels consommateurs historiques.
exports.FLYER_RECTO_VERSO_MULTIPLIER = 1.3;
// DO NOT MODIFY THESE PRICES. OFFICIAL GRID 2026.
// Grille officielle Fine Art par format (Studio / Musee).
exports.FINE_ART_STUDIO_PRICES = {
    postcard: 15, a4: 20, a3: 25, a3plus: 35, a2: null,
};
exports.FINE_ART_MUSEUM_PRICES = {
    postcard: 30, a4: 40, a3: 55, a3plus: 95, a2: 110,
};
// DO NOT MODIFY THESE PRICES. OFFICIAL GRID 2026.
// Grille officielle Sublimation - prix unitaires par produit et palier.
exports.SUBLIMATION_UNIT_PRICES = {
    tshirt: { 1: 30, 5: 27, 10: 25, 25: 23 },
    longsleeve: { 1: 40, 5: 37, 10: 35, 25: 33 },
    hoodie: { 1: 50, 5: 45, 10: 42, 25: 40 },
    totebag: { 1: 15, 10: 13, 25: 12, 50: 10 },
    mug: { 1: 15, 5: 13, 10: 12, 25: 10 },
    tumbler: { 1: 25, 5: 22, 10: 20, 25: 18 },
    bag: { 1: 80, 5: 75, 10: 70 },
};
exports.SUBLIMATION_DESIGN_FEE = 125;
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
        // FIX-PRICING-TIERS : nouvelle structure 3D officielle (tier x kind x qty).
        // Les champs stickerTiersStandard/Fx restent expose comme alias = standard
        // pour que les anciens clients (apps mobiles, integrations externes) ne cassent pas.
        stickerGrid: exports.STICKER_GRID,
        stickerTiersStandard: exports.STICKER_STANDARD_TIERS,
        stickerTiersFx: exports.STICKER_FX_TIERS,
        fxFinishes: exports.FX_FINISHES,
        sizeMultipliers: exports.SIZE_MULTIPLIERS,
        businessCardTiers: exports.BUSINESS_CARD_TIERS,
        flyerTiers: exports.FLYER_TIERS,
        flyerRectoVersoTiers: exports.FLYER_RECTO_VERSO_TIERS,
        flyerRectoVersoMultiplier: exports.FLYER_RECTO_VERSO_MULTIPLIER,
        fineArtStudioPrices: exports.FINE_ART_STUDIO_PRICES,
        fineArtMuseumPrices: exports.FINE_ART_MUSEUM_PRICES,
        sublimationUnitPrices: exports.SUBLIMATION_UNIT_PRICES,
        sublimationDesignFee: exports.SUBLIMATION_DESIGN_FEE,
        artistDiscount: exports.ARTIST_DISCOUNT,
        // Metadata pour que le frontend puisse decider de rafraichir ou pas
        _meta: {
            version: '2',
            updatedAt: new Date().toISOString(),
        },
    };
}
exports.getPricingConfigPayload = getPricingConfigPayload;
