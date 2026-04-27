// DO NOT MODIFY THESE PRICES. OFFICIAL GRID 2026. NO DYNAMIC MATH FORMULAS ALLOWED HERE WITHOUT EXPLICIT BOSS APPROVAL.
//
// Source unique de verite frontend pour TOUTES les grilles tarifaires. Lookup tables
// inline, zero dependance au CMS Strapi ou au backend Render. Tous les configurateurs
// et helpers doivent lire UNIQUEMENT ces objets.
//
// Toute modification doit :
//   1. Etre validee par le business / proprietaire
//   2. Etre repercutee dans backend/src/utils/pricing-config.ts (meme valeurs)

// =======================================================
// 1. STICKERS (3 paliers de taille : Standard / Medium / Large)
// =======================================================
// FIX-PRICING-TIERS (27 avril 2026) : refonte du pricing sticker pour tenir
// compte de la consommation reelle de matiere selon la taille. Avant : prix
// fixe peu importe la taille -> non rentable sur 4"/5". Maintenant : 3 paliers
// avec une grille dediee chacun.
//
// Mapping taille -> tier :
//   2", 2.5"     -> standard  (palier le moins cher)
//   3", 3.5"     -> medium    (+35% par rapport a standard)
//   4", 5"       -> large     (+85% par rapport a standard)
//
// Pour chaque tier : 2 grilles selon le fini :
//   matte = Matte + Lustre + Die-Cut classique
//   fx    = Holographique + Verre Brise + Etoiles
//
// SSOT cote backend : backend/src/utils/pricing-config.ts -> STICKER_GRID.
// Si vous modifiez les prix ici, modifiez aussi la-bas (sinon le backend
// rejette des commandes legitimes via validation server-side).
export const STICKER_GRID = Object.freeze({
  standard: Object.freeze({
    matte: Object.freeze({ 25: 30, 50: 47.50, 100: 85, 250: 200, 500: 375 }),
    fx:    Object.freeze({ 25: 35, 50: 57.50, 100: 100, 250: 225, 500: 425 }),
  }),
  medium: Object.freeze({
    matte: Object.freeze({ 25: 40, 50: 65, 100: 115, 250: 275, 500: 500 }),
    fx:    Object.freeze({ 25: 50, 50: 80, 100: 135, 250: 305, 500: 575 }),
  }),
  large: Object.freeze({
    matte: Object.freeze({ 25: 55, 50: 90, 100: 160, 250: 375, 500: 700 }),
    fx:    Object.freeze({ 25: 65, 50: 105, 100: 185, 250: 415, 500: 785 }),
  }),
});

// ALIAS RETRO-COMPAT : pointent sur le palier `standard` (= ancien comportement).
// Tout le code legacy qui faisait STICKER_GRID_STANDARD[qty] continue de fonctionner.
// Pour le nouveau code : utiliser STICKER_GRID[tier][kind][qty].
export const STICKER_GRID_STANDARD = STICKER_GRID.standard.matte;
export const STICKER_GRID_FX = STICKER_GRID.standard.fx;

export const STICKER_FX_FINISHES = Object.freeze(['holographic', 'broken-glass', 'stars']);

/**
 * Mapping taille -> tier de prix.
 * Accepte tous les formats : '2', '2in', '2.5', '2.5in', '3"', etc.
 * Fallback 'standard' si parse echoue (tier le moins cher).
 */
export function getStickerSizeTier(size) {
  if (size === null || size === undefined) return 'standard';
  const match = String(size).match(/^\s*([\d.]+)/);
  if (!match) return 'standard';
  const inches = parseFloat(match[1]);
  if (!Number.isFinite(inches)) return 'standard';
  if (inches <= 2.5) return 'standard';
  if (inches <= 3.5) return 'medium';
  return 'large';
}

/**
 * Helper public : retourne la grille (objet { qty: price }) pour une (taille, fini) donnee.
 * Utilise par la page service pour construire les tableaux d'onglets et par le
 * configurateur pour afficher le prix dynamiquement.
 */
export function getStickerGridForSize(size, finish) {
  const tier = getStickerSizeTier(size);
  const kind = STICKER_FX_FINISHES.includes(finish) ? 'fx' : 'matte';
  return STICKER_GRID[tier][kind];
}

// =======================================================
// 2. FINE ART (prix par format, Studio vs Musee, + cadre)
// =======================================================
// FIX-SQUARE (23 avril 2026) : ajout de 3 formats CARRES (8x8, 10x10, 12x12)
// pour les images 1:1. Le champ `shape: 'square'` est utilise par le
// configurateur pour filtrer la liste quand l'image uploadee est carree.
// Les prix alignes sur les formats rectangulaires equivalents en surface :
//   8x8 (64 in^2)   proche A4 (93 in^2)  -> pricing A4-ish
//   10x10 (100 in^2) proche A3 (187 in^2) -> pricing legerement au-dessus A4
//   12x12 (144 in^2) proche A3+ (247 in^2) -> pricing entre A3 et A3+
export const FINE_ART_GRID = Object.freeze({
  postcard: { studio: 15,   museum: 30,  frame: 20, label: 'A6 (4x6")',     w: 4,   h: 6,   typeName: 'Carte postale', shape: 'rect' },
  a4:       { studio: 20,   museum: 40,  frame: 20, label: 'A4 (8.5x11")',  w: 8.5, h: 11,  typeName: 'Affiche',       shape: 'rect' },
  a3:       { studio: 25,   museum: 55,  frame: 30, label: 'A3 (11x17")',   w: 11,  h: 17,  typeName: 'Affiche',       shape: 'rect' },
  a3plus:   { studio: 35,   museum: 95,  frame: 35, label: 'A3+ (13x19")',  w: 13,  h: 19,  typeName: 'Poster',        shape: 'rect' },
  a2:       { studio: null, museum: 110, frame: 45, label: 'A2 (18x24")',   w: 18,  h: 24,  typeName: 'Grand format',  shape: 'rect' },
  // ----- Formats CARRES (pour images 1:1) -----
  sq8:      { studio: 20,   museum: 40,  frame: 25, label: '8x8"',         w: 8,   h: 8,   typeName: 'Carre',          shape: 'square' },
  sq10:     { studio: 28,   museum: 60,  frame: 30, label: '10x10"',       w: 10,  h: 10,  typeName: 'Carre',          shape: 'square' },
  sq12:     { studio: 38,   museum: 85,  frame: 35, label: '12x12"',       w: 12,  h: 12,  typeName: 'Carre',          shape: 'square' },
});

// =======================================================
// 3. FLYERS & CARTES (prix par qty, Recto vs Recto-Verso)
// =======================================================
export const FLYER_GRID = Object.freeze({
  50:  { recto: 40,  rectoVerso: 52 },
  100: { recto: 70,  rectoVerso: 91 },
  150: { recto: 98,  rectoVerso: 127 },
  250: { recto: 138, rectoVerso: 179 },
  500: { recto: 250, rectoVerso: 325 },
});

// =======================================================
// 4. SUBLIMATION & MERCH (prix unitaires par produit + palier)
// =======================================================
export const SUBLIMATION_UNIT_PRICES = Object.freeze({
  tshirt:     { 1: 30, 5: 27, 10: 25, 25: 23 },
  longsleeve: { 1: 40, 5: 37, 10: 35, 25: 33 },
  hoodie:     { 1: 50, 5: 45, 10: 42, 25: 40 },
  totebag:    { 1: 15, 10: 13, 25: 12, 50: 10 },
  mug:        { 1: 15, 5: 13, 10: 12, 25: 10 },
  tumbler:    { 1: 25, 5: 22, 10: 20, 25: 18 },
  bag:        { 1: 80, 5: 75, 10: 70 },
});

export const SUBLIMATION_DESIGN_FEE = 125;

// Cout blank par unite (pour le calcul Bring Your Own Textile)
export const SUBLIMATION_BLANK_COST = Object.freeze({
  tshirt: 12,
  longsleeve: 18,
  hoodie: 28,
  totebag: 6,
  bag: 45,
  mug: 4,
  tumbler: 10,
});

// Produits eligibles BYOT (bring your own textile)
export const SUBLIMATION_BYOT_ALLOWED = Object.freeze(['tshirt', 'longsleeve', 'hoodie', 'totebag']);

// =======================================================
// HELPERS STRICTS (zero dependance externe)
// =======================================================

/**
 * Prix sticker : lookup strict dans STICKER_GRID[tier][kind].
 * FIX-PRICING-TIERS (27 avril 2026) : `size` influence maintenant le prix via
 * 3 paliers (standard/medium/large). Si `size` absent (cas legacy / panier
 * pre-fix), fallback sur tier 'standard' = ancien comportement -> aucune
 * regression sur les anciens items du panier.
 */
export function lookupStickerPrice(finish, qty, size) {
  const grid = getStickerGridForSize(size, finish);
  const price = grid[qty];
  if (price == null) return null;
  const unitPrice = Math.round((price / qty) * 100) / 100;
  const tier = getStickerSizeTier(size);
  return { qty, price, unitPrice, tier };
}

/**
 * Prix fine art : lookup strict dans FINE_ART_GRID.
 * Retourne null si format invalide ou combinaison tier/format indisponible (ex: a2 studio).
 */
export function lookupFineArtPrice(tier, formatId, withFrame) {
  const entry = FINE_ART_GRID[formatId];
  if (!entry) return null;
  const basePrice = tier === 'museum' ? entry.museum : entry.studio;
  if (basePrice == null) return null;
  const framePrice = withFrame ? entry.frame : 0;
  return { price: basePrice + framePrice, basePrice, framePrice };
}

/**
 * Prix flyers : lookup strict dans FLYER_GRID.
 * side = 'recto' | 'recto-verso'. Retourne null si qty hors grille.
 */
export function lookupFlyerPrice(side, qty) {
  const entry = FLYER_GRID[qty];
  if (!entry) return null;
  const price = side === 'recto-verso' ? entry.rectoVerso : entry.recto;
  const unitPrice = Math.round((price / qty) * 100) / 100;
  return { qty, price, unitPrice };
}

/**
 * Prix sublimation : lookup strict dans SUBLIMATION_UNIT_PRICES.
 * Retourne le unit price + total, avec deduction BYOT et ajout du design fee si demande.
 */
export function lookupSublimationPrice(productId, qty, { withDesign = false, byot = false } = {}) {
  const grid = SUBLIMATION_UNIT_PRICES[productId];
  if (!grid) return null;
  const unitPrice = grid[qty];
  if (unitPrice == null) return null;

  const basePrice = unitPrice * qty;
  const blankUnit = SUBLIMATION_BLANK_COST[productId] || 0;
  const byotActive = !!byot && SUBLIMATION_BYOT_ALLOWED.includes(productId);
  const byotDiscount = byotActive ? blankUnit * qty : 0;
  const designPrice = withDesign ? SUBLIMATION_DESIGN_FEE : 0;
  const finalPrice = Math.max(0, basePrice - byotDiscount + designPrice);
  const finalUnit = qty > 0 ? Math.round((finalPrice / qty) * 100) / 100 : unitPrice;

  return {
    qty,
    price: finalPrice,
    basePrice,
    unitPrice: finalUnit,
    catalogUnitPrice: unitPrice,
    designPrice,
    blankCostUnit: blankUnit,
    blankCostTotal: blankUnit * qty,
    printFeeTotal: Math.max(0, basePrice - blankUnit * qty),
    byotActive,
    byotDiscount,
    byotEligible: SUBLIMATION_BYOT_ALLOWED.includes(productId),
  };
}
