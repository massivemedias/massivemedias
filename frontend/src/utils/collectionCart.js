// CART-01 (9 juillet 2026) : helpers PARTAGES du panier de la collection
// stickers, reutilises par le mini-panier (tiroir), la page /panier et
// /checkout. Aucune logique de prix : lecture seule des items du panier.
//
// Regle metier (STICKERS-SHOP-B) : minimum 5 stickers UNITAIRES de la
// collection par commande. Les mystery packs ne comptent PAS dans le
// minimum (autosuffisants). Livraison gratuite au Quebec des 30 $ de
// collection (unites + packs).
import {
  STICKER_COLLECTION_UNIT_PRICE,
  STICKER_COLLECTION_MIN_UNITS,
  MYSTERY_PACK_PRICES,
} from '../data/products'

// Un item est-il une unite de la collection (compte dans le minimum) ?
export function isCollectionUnit(item) {
  return String(item?.productId || '').startsWith('sticker-massive-')
}

// Un item est-il un mystery pack de la collection ?
export function isMysteryPack(item) {
  return String(item?.productId || '').startsWith('mystery-pack-')
}

// Nombre d'unites collection dans le panier (packs exclus). Sert au minimum.
export function collectionUnitCount(items) {
  return (items || []).reduce(
    (sum, it) => (isCollectionUnit(it) ? sum + (Number(it?.quantity) || 1) : sum),
    0
  )
}

// Sous-total de la collection (unites + packs) en $, pour le seuil de
// livraison gratuite QC (30 $). Prix officiels forces (miroir serveur).
export function collectionSubtotal(items) {
  let total = 0
  for (const it of items || []) {
    const qty = Number(it?.quantity) || 1
    if (isCollectionUnit(it)) {
      total += STICKER_COLLECTION_UNIT_PRICE * qty
    } else if (isMysteryPack(it)) {
      const size = parseInt(String(it.productId).replace('mystery-pack-', ''), 10)
      total += (MYSTERY_PACK_PRICES[size] || 0) * qty
    }
  }
  return Math.round(total * 100) / 100
}

// Seuil de livraison gratuite au Quebec sur la collection.
export const FREE_SHIPPING_QC_THRESHOLD = 30

// Etat de progression du panier collection : tout ce dont l'UI a besoin.
export function collectionProgress(items) {
  const units = collectionUnitCount(items)
  const subtotal = collectionSubtotal(items)
  const hasCollection = units > 0 || (items || []).some(isMysteryPack)
  // Le minimum ne s'applique que s'il y a des UNITES (1-4 = bloque). Un
  // panier de packs seuls (0 unite) est valide.
  const minMet = units === 0 || units >= STICKER_COLLECTION_MIN_UNITS
  return {
    units,
    subtotal,
    hasCollection,
    minMet,
    minUnits: STICKER_COLLECTION_MIN_UNITS,
    unitsRemaining: Math.max(0, STICKER_COLLECTION_MIN_UNITS - units),
    freeShippingRemaining: Math.max(0, FREE_SHIPPING_QC_THRESHOLD - subtotal),
    freeShippingMet: subtotal >= FREE_SHIPPING_QC_THRESHOLD,
  }
}
