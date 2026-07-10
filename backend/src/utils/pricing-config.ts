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
//
// PRICING-VOLUME (9 juillet 2026, decision Mika) : 2 paliers volume (1000, 2000)
// pour tuer le plafond a 0,80 $/u au-dela de 500 (2000 x 2.5" fx = 1600 $, hors
// marche). Structure proportionnelle ANCREE MATTE, l'ecart finitions survit
// (holo degresse moins, materiel plus cher) :
//   standard/matte : 1000 = 650 (0,65/u) ; 2000 = 1000 (0,50/u)
//   standard/fx    : 1000 = 800 (0,80/u) ; 2000 = 1300 (0,65/u)
//   intermediate = milieu matte/fx ; medium/large gardent leurs ratios de taille.
// MIROIR EXACT de frontend/src/utils/pricingData.js STICKER_GRID (sinon checkout
// rejette). Verif : matte 2.5" x 2000 = 1000 $ (soumission Groove and Bass).
export const STICKER_GRID: Record<string, Record<string, Record<number, number>>> = {
  standard: { // taille <= 2.5"
    matte:        { 25: 25, 50: 45, 100: 80, 250: 187.50, 500: 350, 1000: 650, 2000: 1000 },
    intermediate: { 25: 27.50, 50: 50, 100: 90, 250: 205, 500: 375, 1000: 725, 2000: 1150 },
    fx:           { 25: 30, 50: 55, 100: 100, 250: 225, 500: 400, 1000: 800, 2000: 1300 },
  },
  medium: {   // taille <= 3.5"
    matte:        { 25: 40, 50: 65, 100: 115, 250: 275, 500: 500, 1000: 930, 2000: 1420 },
    intermediate: { 25: 45, 50: 72.50, 100: 125, 250: 290, 500: 537.50, 1000: 1040, 2000: 1640 },
    fx:           { 25: 50, 50: 80, 100: 135, 250: 305, 500: 575, 1000: 1150, 2000: 1860 },
  },
  large: {    // taille <= 5"
    matte:        { 25: 55, 50: 90, 100: 160, 250: 375, 500: 700, 1000: 1300, 2000: 2000 },
    intermediate: { 25: 60, 50: 97.50, 100: 172.50, 250: 395, 500: 742.50, 1000: 1440, 2000: 2280 },
    fx:           { 25: 65, 50: 105, 100: 185, 250: 415, 500: 785, 1000: 1570, 2000: 2560 },
  },
};

// ALIAS RETRO-COMPAT : pointent sur le palier `standard` (= ancien comportement).
// Tout le code legacy qui faisait STICKER_STANDARD_TIERS[qty] continue de fonctionner.
// Pour le nouveau code, utiliser STICKER_GRID[tier][kind][qty] avec getStickerSizeTier().
export const STICKER_STANDARD_TIERS: Record<number, number> = STICKER_GRID.standard.matte;
export const STICKER_FX_TIERS: Record<number, number> = STICKER_GRID.standard.fx;

// FINITIONS-V2 : 3 groupes (fx / intermediate / matte). Copie EXACTE du front
// (pricingData.js STICKER_FX_FINISHES / INTERMEDIATE_FINISHES). matte-pro, glossy
// et dots sont fancy (fx) ; clear est intermediate ; matte = sans finition.
export const FX_FINISHES = ['holographic', 'broken-glass', 'stars', 'matte-pro', 'glossy', 'dots']
export const INTERMEDIATE_FINISHES = ['clear']

// DO NOT MODIFY THESE PRICES. OFFICIAL 2026 (STICKERS-SHOP-B, 8 juillet 2026).
// Collection de stickers Massive vendue en ligne (page /stickers). Offre
// validee par Mika, dual-source avec le front (pricingData.js).
//   - Unite : 3 $ par design choisi (2 $ -> 3 $ le 8 juillet 2026, decision
//     Mika pre-allumage), MINIMUM 5 stickers unitaires par commande (mix de
//     designs permis, c'est le total unitaire qui compte).
//   - Mystery packs (designs choisis par Massive) : taille -> prix TOTAL.
//     Les packs ne comptent PAS dans le minimum de 5, ils sont autosuffisants.
// SKU : sticker-massive-<slug> (unites, un productId par design) et
// mystery-pack-5 / mystery-pack-10 / mystery-pack-20.
export const STICKER_COLLECTION_UNIT_PRICE = 3
export const STICKER_COLLECTION_MIN_UNITS = 5
export const MYSTERY_PACK_PRICES: Record<number, number> = { 5: 8, 10: 14, 20: 25 }

/**
 * Mapping taille (string id ou label) -> tier de prix (standard/medium/large).
 * Accepte tous les formats : '2', '2in', '2.5', '2.5in', '3"', etc. Tolerance
 * volontaire pour ne pas casser sur des items historiques avec des formats
 * variables. Fallback 'standard' si parse echoue (tier le moins cher).
 */
export function getStickerSizeTier(size: any): 'standard' | 'medium' | 'large' {
  if (size === null || size === undefined) return 'standard';
  const match = String(size).match(/^\s*([\d.]+)/);
  if (!match) return 'standard';
  const inches = parseFloat(match[1]);
  if (!Number.isFinite(inches)) return 'standard';
  if (inches <= 2.5) return 'standard';
  if (inches <= 3.5) return 'medium';
  return 'large'; // 4" et 5" (et tout > 3.5")
}

/**
 * Lookup officiel du prix sticker selon (finish, qty, size).
 * Retourne null si quantite hors grille.
 */
export function lookupStickerPriceBySize(finish: string, qty: number, size: any): number | null {
  const tier = getStickerSizeTier(size);
  // kind 3-voies : intermediate (Clear) sinon fx (fancy) sinon matte (sans finition, defaut).
  const kind = INTERMEDIATE_FINISHES.includes(finish)
    ? 'intermediate'
    : FX_FINISHES.includes(finish)
      ? 'fx'
      : 'matte'
  const grid = STICKER_GRID[tier][kind];
  return grid[qty] ?? null;
}

// DEPRECATED (avril 2026, garde pour compat retro)
// Maintenant que les tailles influencent le prix via STICKER_GRID, ces multipliers
// ne servent plus. Conservation a 1.0 pour ne pas casser les eventuels lecteurs
// existants. Les nouveaux consommateurs doivent utiliser getStickerSizeTier().
export const SIZE_MULTIPLIERS: Record<string, number> = {
  '2': 1.0,
  '2.5': 1.0,
  '3': 1.0,
  '3.5': 1.0,
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

// =======================================================
// SEC-04 (8 juillet 2026) : grilles miroir pour le registre de SKU
// (backend/src/utils/sku-registry.ts). Chaque famille de productId vendue
// au public DOIT avoir un prix calculable serveur. MIROIRS EXACTS des
// grilles de VENTE affichees par le front (utils/pricingData.js et
// data/artistPricing.js). DO NOT MODIFY WITHOUT UPDATING THE FRONT.
// =======================================================

// Packs stickers d'artiste (ConfiguratorArtistSticker, minimum 10 stickers).
// Miroir de frontend/src/data/artistPricing.js ARTIST_STICKER_GRID.
export const ARTIST_STICKER_GRID: Record<number, number> = { 10: 19, 25: 45, 50: 85, 100: 150, 250: 350, 500: 650 }

// Prix TOTAL d'un pack sticker artiste pour une quantite >= 10.
// Interpolation lineaire du prix unitaire entre les 2 paliers encadrants,
// cap au rate du dernier palier au-dela de 500. Sous 10 : null (minimum
// d'impression). Miroir exact de getArtistStickerPrice (artistPricing.js).
export function getArtistStickerPackPrice(qty: any): number | null {
  const q = parseInt(String(qty == null ? '' : qty).replace(/[^0-9]/g, ''), 10)
  if (!Number.isFinite(q) || q < 10) return null
  const grid = ARTIST_STICKER_GRID
  const tiers = Object.keys(grid).map(Number).sort((a, b) => a - b)
  if (grid[q] != null) return grid[q]
  const maxQty = tiers[tiers.length - 1]
  if (q >= maxQty) {
    const maxUnit = Math.round((grid[maxQty] / maxQty) * 100) / 100
    return Math.round(q * maxUnit * 100) / 100
  }
  let lowQty = tiers[0]
  let highQty = tiers[1]
  for (let i = 0; i < tiers.length - 1; i++) {
    if (q >= tiers[i] && q < tiers[i + 1]) { lowQty = tiers[i]; highQty = tiers[i + 1]; break }
  }
  const lowUnit = grid[lowQty] / lowQty
  const highUnit = grid[highQty] / highQty
  const factor = (q - lowQty) / (highQty - lowQty)
  const unitPrice = Math.round((lowUnit + factor * (highUnit - lowUnit)) * 100) / 100
  return Math.round(q * unitPrice * 100) / 100
}

// Depot de reservation flash tattoo (ReservationForm, montant fixe).
export const DEPOSIT_FLASH_PRICE = 40

// Produits en solde de la page Artistes : ids litteraux -> prix.
// Miroir de defaultSaleItems (frontend/src/pages/Shop.jsx).
export const SALE_ITEM_PRICES: Record<string, number> = { 'sale-stk-massive': 20 }

// Packs stickers boutique (page Artistes) : prix PAR PACK selon le nombre
// de packs commandes. Fallback quand le produit CMS (category sticker-pack)
// n'a pas de pricingData.tiers. Miroir de defaultStickerPricingTiers (Shop.jsx).
export const STICKER_PACK_DEFAULT_TIERS: Record<number, number> = { 1: 35, 5: 25, 10: 20, 25: 15 }

// Merch fini (MerchDetail, actuellement derriere MERCH_HIDDEN) : prix plat
// par type, identique pour toutes les tailles. Miroir de merchData.js.
export const MERCH_PRICES: Record<string, number> = { tshirt: 22, hoodie: 39, longsleeve: 30 }

// Sublimation BYOT : cout du blank deduit quand le client apporte son
// textile. Miroir de SUBLIMATION_BLANK_COST / SUBLIMATION_BYOT_ALLOWED
// (frontend/src/utils/pricingData.js).
export const SUBLIMATION_BLANK_COST: Record<string, number> = {
  tshirt: 12, longsleeve: 18, hoodie: 28, totebag: 6, bag: 45, mug: 4, tumbler: 10,
}
export const SUBLIMATION_BYOT_ALLOWED: string[] = ['tshirt', 'longsleeve', 'hoodie', 'totebag']

// Cartes cadeaux : montant libre encode dans le SKU (gift-card-<n>), borne
// serveur. Entiers seulement.
export const GIFT_CARD_MIN = 10
export const GIFT_CARD_MAX = 500

// Grille de VENTE Fine Art affichee par le front (miroir de pricingData.js
// FINE_ART_GRID : base Studio/Musee + prix du cadre par format, y compris
// les formats carres). DISTINCTE de FINE_ART_STUDIO/MUSEUM_PRICES ci-dessus
// (divergence connue, resolution reportee a PRIX-02 Vague 3, ne PAS unifier
// ici) : le registre SEC-04 valide contre ce que le client VOIT a l'ecran,
// jamais plus cher.
export const FINE_ART_SALE_GRID: Record<string, { studio: number | null; museum: number; frame: number }> = {
  postcard: { studio: 8, museum: 15, frame: 20 },
  a4:       { studio: 10, museum: 20, frame: 20 },
  a3:       { studio: 15, museum: 30, frame: 30 },
  a3plus:   { studio: 20, museum: 45, frame: 35 },
  a2:       { studio: null, museum: 55, frame: 45 },
  sq8:      { studio: 10, museum: 20, frame: 25 },
  sq10:     { studio: 13, museum: 25, frame: 30 },
  sq12:     { studio: 15, museum: 30, frame: 35 },
}

// NOTE Affiches Standard : PAS de grille fallback ici. Les paliers vivent
// UNIQUEMENT dans le CMS (product slug affiche-standard, champ
// pricingData.afficheStandardPaliers, cles de format en MAJUSCULES A4/A3/
// A3+/A2), exactement comme au front (pas de paliers CMS = pas de prix
// affiche = pas d'achat). Si le CMS est indisponible au moment du checkout,
// le registre REJETTE l'item plutot que de deviner un prix.

/**
 * Payload complet retourne par GET /api/pricing-config.
 * Le frontend peut cacher cette reponse et fallback sur ses constantes locales
 * si l'appel fail (backend down, reseau coupe).
 */
export function getPricingConfigPayload() {
  return {
    framePricesByFormat: FRAME_PRICES_FALLBACK,
    // FIX-PRICING-TIERS : nouvelle structure 3D officielle (tier x kind x qty).
    // Les champs stickerTiersStandard/Fx restent expose comme alias = standard
    // pour que les anciens clients (apps mobiles, integrations externes) ne cassent pas.
    stickerGrid: STICKER_GRID,
    stickerTiersStandard: STICKER_STANDARD_TIERS,
    stickerTiersFx: STICKER_FX_TIERS,
    // STICKERS-SHOP-B : collection Massive (unites 2 $ + mystery packs).
    stickerCollectionUnitPrice: STICKER_COLLECTION_UNIT_PRICE,
    stickerCollectionMinUnits: STICKER_COLLECTION_MIN_UNITS,
    mysteryPackPrices: MYSTERY_PACK_PRICES,
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
