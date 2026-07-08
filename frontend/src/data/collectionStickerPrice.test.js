/**
 * Tests unitaires pour les prix de la collection stickers Massive
 * (STICKERS-SHOP-B). Logique pure, aucun fetch, aucun mock.
 *
 * Run : cd frontend && npm run test
 *
 * Offre validee (NON negociable) : unite 2 $ / design, minimum 5 stickers
 * unitaires par commande ; mystery packs 5 -> 8 $, 10 -> 14 $, 20 -> 25 $
 * (les packs ne comptent pas dans le minimum). Miroir exact du backend
 * pricing-config.ts qui force ces prix au checkout.
 */
import { describe, it, expect } from 'vitest'
import {
  getCollectionStickerPrice,
  getMysteryPackPrice,
  STICKER_COLLECTION_UNIT_PRICE,
  STICKER_COLLECTION_MIN_UNITS,
  MYSTERY_PACK_PRICES,
} from './products'

describe('constantes collection (dual-source)', () => {
  it('unite a 2 $, minimum 5', () => {
    expect(STICKER_COLLECTION_UNIT_PRICE).toBe(2)
    expect(STICKER_COLLECTION_MIN_UNITS).toBe(5)
  })
  it('packs exactement 5/10/20 aux prix valides', () => {
    expect(MYSTERY_PACK_PRICES).toEqual({ 5: 8, 10: 14, 20: 25 })
  })
})

describe('getCollectionStickerPrice - unites a 2 $', () => {
  it('1 sticker -> 2 $', () => {
    expect(getCollectionStickerPrice(1)).toEqual({ qty: 1, unitPrice: 2, price: 2 })
  })
  it('5 stickers (le minimum) -> 10 $', () => {
    expect(getCollectionStickerPrice(5).price).toBe(10)
  })
  it('20 stickers -> 40 $', () => {
    expect(getCollectionStickerPrice(20).price).toBe(40)
  })
  it('quantites invalides ramenees a 1 (0, negatif, NaN, undefined)', () => {
    expect(getCollectionStickerPrice(0).qty).toBe(1)
    expect(getCollectionStickerPrice(-3).qty).toBe(1)
    expect(getCollectionStickerPrice('abc').qty).toBe(1)
    expect(getCollectionStickerPrice(undefined).qty).toBe(1)
  })
  it('quantite decimale tronquee vers le bas', () => {
    expect(getCollectionStickerPrice(7.9).qty).toBe(7)
    expect(getCollectionStickerPrice(7.9).price).toBe(14)
  })
})

describe('getMysteryPackPrice - 3 tailles seulement', () => {
  it('pack 5 -> 8 $', () => {
    expect(getMysteryPackPrice(5)).toEqual({ size: 5, price: 8 })
  })
  it('pack 10 -> 14 $', () => {
    expect(getMysteryPackPrice(10)).toEqual({ size: 10, price: 14 })
  })
  it('pack 20 -> 25 $', () => {
    expect(getMysteryPackPrice(20)).toEqual({ size: 20, price: 25 })
  })
  it('tailles inexistantes -> null (7, 15, 0, -5, undefined)', () => {
    expect(getMysteryPackPrice(7)).toBeNull()
    expect(getMysteryPackPrice(15)).toBeNull()
    expect(getMysteryPackPrice(0)).toBeNull()
    expect(getMysteryPackPrice(-5)).toBeNull()
    expect(getMysteryPackPrice(undefined)).toBeNull()
  })
})

describe('invariants metier de l offre', () => {
  it('chaque pack est moins cher que le meme nombre en unites (incitatif mystery)', () => {
    for (const [size, price] of Object.entries(MYSTERY_PACK_PRICES)) {
      const enUnites = getCollectionStickerPrice(Number(size)).price
      expect(price).toBeLessThan(enUnites)
    }
  })
  it('prix par sticker degressif entre les packs (5 > 10 > 20)', () => {
    const perSticker = (size) => MYSTERY_PACK_PRICES[size] / size
    expect(perSticker(10)).toBeLessThan(perSticker(5))
    expect(perSticker(20)).toBeLessThan(perSticker(10))
  })
  it('le minimum en unites (5 x 2 $ = 10 $) depasse le seuil du pack 5 (8 $)', () => {
    expect(getCollectionStickerPrice(STICKER_COLLECTION_MIN_UNITS).price).toBeGreaterThan(MYSTERY_PACK_PRICES[5])
  })
})
