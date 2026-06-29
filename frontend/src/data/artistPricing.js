/**
 * artistPricing.js (11 mai 2026)
 *
 * Helpers + constantes de tarification pour les prints artiste.
 * Extrait du legacy `artists.js` lors de la migration full-CMS Strapi
 * (commit "feat(core): nuke artists.js permanently"). Les donnees artistes
 * sont desormais 100% en CMS via `useArtists()`, mais les helpers de
 * pricing (formats, prix de cadre, calcul du prix final) restent
 * cote frontend car ils ne changent jamais et sont synchrones.
 */

/**
 * Prix d'un cadre par format (en CAD). CADRE-FORFAIT (chantier musee-only) :
 * 30 CAD forfait pour les formats encadrables (A6/A4/A3/A3+), toutes couleurs
 * (noir ou blanc, sans impact prix). A2 conserve sa valeur (pas de cadre propose).
 * Le pricing CMS de chaque artiste peut overrider via `pricing.framePriceByFormat`.
 */
export const framePriceByFormat = { postcard: 30, a4: 30, a3: 30, a3plus: 30, a2: 45 };

/**
 * Artist print pricing - returns final client price (production + artist margin included).
 *
 * Le prix du cadre est calcule en priorite depuis le pricing par artiste
 * (pricing.framePriceByFormat[format]), avec fallback sur la constante
 * globale framePriceByFormat, puis 30 CAD en dernier recours.
 */
export function getArtistPrintPrice(pricing, tier, format, withFrame) {
  const prices = tier === 'museum' ? pricing.museum : pricing.studio;
  const base = prices[format];
  if (base == null) return null;
  const artistFramePrices = pricing?.framePriceByFormat || {};
  const framePrice = withFrame
    ? (artistFramePrices[format] ?? framePriceByFormat[format] ?? 30)
    : 0;
  return { price: base + framePrice, basePrice: base, framePrice };
}

/**
 * 2 tiers de production : Studio (papier mat 200gsm) ou Musee (papier archival 290gsm).
 */
export const artistPrinterTiers = [
  { id: 'studio', labelFr: 'Série Studio', labelEn: 'Studio Series', labelEs: 'Serie Studio', desc: '' },
  { id: 'museum', labelFr: 'Série Musée', labelEn: 'Museum Series', labelEs: 'Serie Museo', desc: '' },
];

/**
 * Formats dispo pour les prints. `rank` sert au tri et a la comparaison
 * avec `maxFormat` d'un print (un print avec maxFormat='a3' grisera
 * a3plus / a2 qui ont un rank superieur).
 */
export const artistFormats = [
  { id: 'postcard', label: 'A6 (4x6")', short: 'A6', descFr: 'Format A6', descEn: 'A6 format', rank: -1, w: 4, h: 6 },
  { id: 'a4', label: 'A4 (8.5x11")', short: 'A4', descFr: 'Format Lettre', descEn: 'Letter format', rank: 0, w: 8.5, h: 11 },
  { id: 'a3', label: 'A3 (11x17")', short: 'A3', descFr: 'Format Tabloide', descEn: 'Tabloid format', rank: 1, w: 11, h: 17 },
  { id: 'a3plus', label: 'A3+ (13x19")', short: 'A3+', descFr: 'Format Poster', descEn: 'Poster format', rank: 2, w: 13, h: 19 },
  { id: 'a2', label: 'A2 (18x24")', short: 'A2', descFr: 'Grand Poster', descEn: 'Large Poster', rank: 3, w: 18, h: 24 },
];

/**
 * Verifie si un format est disponible pour un print selon `maxFormat`.
 * - pas de maxFormat -> tous les formats dispos
 * - maxFormat:'a3' -> a4, a3 dispos ; a3plus, a2 grises
 */
export function isFormatAvailable(formatId, maxFormat) {
  if (!maxFormat) return true;
  const fmt = artistFormats.find((f) => f.id === formatId);
  const max = artistFormats.find((f) => f.id === maxFormat);
  if (!fmt || !max) return true;
  return fmt.rank <= max.rank;
}

// ARTIST-STICKER (refonte stickers artiste) : grille de prix DEDIEE aux stickers
// d'artistes, SEPAREE de STICKER_GRID (les prix clients de /services/stickers
// n'en dependent pas). Prix UNIQUE : aucune dependance finition, taille ou forme.
// Totaux par palier ; minimum 10. SSOT, ne pas dupliquer ailleurs.
export const ARTIST_STICKER_GRID = { 10: 19, 25: 45, 50: 85, 100: 150, 250: 350, 500: 650 }

/**
 * Prix sticker artiste pour une quantite (>= 10). Interpolation lineaire du prix
 * unitaire entre les 2 paliers encadrants, calquee sur lookupStickerPriceCustomQty
 * (utils/pricingData.js) mais SANS finition ni taille. Au-dela de 500 : rate du
 * dernier palier. Sous 10 : null (minimum d'impression).
 * Retourne { qty, price, unitPrice } (arrondis a 2 decimales).
 */
export function getArtistStickerPrice(qty) {
  const q = parseInt(String(qty == null ? '' : qty).replace(/[^0-9]/g, ''), 10)
  if (!Number.isFinite(q) || q < 10) return null
  const grid = ARTIST_STICKER_GRID
  const tiers = Object.keys(grid).map(Number).sort((a, b) => a - b)
  if (grid[q] != null) {
    const unitPrice = Math.round((grid[q] / q) * 100) / 100
    return { qty: q, price: grid[q], unitPrice, exact: true }
  }
  const maxQty = tiers[tiers.length - 1]
  if (q >= maxQty) {
    const maxUnit = Math.round((grid[maxQty] / maxQty) * 100) / 100
    return { qty: q, price: Math.round(q * maxUnit * 100) / 100, unitPrice: maxUnit, capped: true }
  }
  let lowQty = tiers[0]
  let highQty = tiers[1]
  for (let i = 0; i < tiers.length - 1; i++) {
    if (q >= tiers[i] && q < tiers[i + 1]) {
      lowQty = tiers[i]
      highQty = tiers[i + 1]
      break
    }
  }
  const lowUnit = grid[lowQty] / lowQty
  const highUnit = grid[highQty] / highQty
  const factor = (q - lowQty) / (highQty - lowQty)
  const unitPrice = Math.round((lowUnit + factor * (highUnit - lowUnit)) * 100) / 100
  return { qty: q, price: Math.round(q * unitPrice * 100) / 100, unitPrice, interpolated: true }
}

/**
 * SHIM (11 mai 2026) : export default vide. Les anciens composants qui
 * faisaient `import artistsData from '../data/artists'` continuent de
 * compiler avec `artistsData = {}`. Les usages typiques (`artistsData[slug]
 * || null`, `Object.values(artistsData)`) se comportent gracieusement avec
 * un objet vide. Les composants critiques (Home, Artistes, AdminTarifs,
 * AdminUtilisateurs) ont ete migres vers useArtists() pour lire le CMS
 * Strapi directement - ils n'utilisent plus ce shim.
 *
 * Ce shim sera supprime quand tous les composants auront ete refactors
 * pour passer par useArtists() ou des appels API directs.
 */
export default {};
