/**
 * CART-01 : tests des helpers du panier collection (utils/collectionCart.js).
 * Logique pure, aucun fetch. Regle : minimum 5 unites collection, packs
 * exclus du compte ; livraison gratuite QC des 30 $.
 */
import { describe, it, expect } from 'vitest'
import {
  collectionUnitCount,
  collectionSubtotal,
  collectionProgress,
  isCollectionUnit,
  isMysteryPack,
  FREE_SHIPPING_QC_THRESHOLD,
} from './collectionCart'

const unit = (slug, qty) => ({ productId: `sticker-massive-${slug}`, quantity: qty })
const pack = (size, qty = 1) => ({ productId: `mystery-pack-${size}`, quantity: qty })
const print = () => ({ productId: 'artist-print-gallium-bardo', quantity: 1 })

describe('classification', () => {
  it('reconnait unites, packs, autres', () => {
    expect(isCollectionUnit(unit('dj-skull', 1))).toBe(true)
    expect(isCollectionUnit(pack(5))).toBe(false)
    expect(isMysteryPack(pack(10))).toBe(true)
    expect(isMysteryPack(unit('x', 1))).toBe(false)
    expect(isCollectionUnit(print())).toBe(false)
  })
})

describe('collectionUnitCount (packs exclus)', () => {
  it('somme les quantites des unites, ignore packs et autres', () => {
    expect(collectionUnitCount([unit('a', 2), unit('b', 1), pack(20), print()])).toBe(3)
  })
  it('panier vide ou sans collection -> 0', () => {
    expect(collectionUnitCount([])).toBe(0)
    expect(collectionUnitCount([print()])).toBe(0)
  })
})

describe('collectionSubtotal (unites 3 $ + packs)', () => {
  it('unites a 3 $ + packs a leur prix', () => {
    // 5 unites x 3 = 15, + pack 10 (14) = 29
    expect(collectionSubtotal([unit('a', 5), pack(10)])).toBe(29)
  })
  it('ignore les produits hors collection', () => {
    expect(collectionSubtotal([unit('a', 2), print()])).toBe(6)
  })
})

describe('collectionProgress', () => {
  it('1-4 unites : minimum NON atteint, reste a ajouter', () => {
    const p = collectionProgress([unit('a', 2)])
    expect(p.units).toBe(2)
    expect(p.minMet).toBe(false)
    expect(p.unitsRemaining).toBe(3)
    expect(p.hasCollection).toBe(true)
  })
  it('5 unites : minimum atteint', () => {
    const p = collectionProgress([unit('a', 5)])
    expect(p.minMet).toBe(true)
    expect(p.unitsRemaining).toBe(0)
  })
  it('packs seuls (0 unite) : minimum atteint (packs autosuffisants)', () => {
    const p = collectionProgress([pack(5)])
    expect(p.units).toBe(0)
    expect(p.minMet).toBe(true)
    expect(p.hasCollection).toBe(true)
  })
  it('panier sans collection : hasCollection false, minMet true', () => {
    const p = collectionProgress([print()])
    expect(p.hasCollection).toBe(false)
    expect(p.minMet).toBe(true)
  })
  it('livraison gratuite QC : seuil 30 $', () => {
    expect(FREE_SHIPPING_QC_THRESHOLD).toBe(30)
    const sous = collectionProgress([unit('a', 5)]) // 15 $
    expect(sous.freeShippingMet).toBe(false)
    expect(sous.freeShippingRemaining).toBe(15)
    const atteint = collectionProgress([unit('a', 10)]) // 30 $
    expect(atteint.freeShippingMet).toBe(true)
    expect(atteint.freeShippingRemaining).toBe(0)
  })
})
