/**
 * Tests unitaires pour getArtistStickerPrice (grille DEDIEE artiste, prix unique).
 * Aucun reseau, aucun mock. Run : cd frontend && npm run test
 *
 * Grille (totaux) : 10=19, 25=45, 50=85, 100=150, 250=350, 500=650. Minimum 10.
 * Prix UNIQUE : aucune dependance finition/taille/forme. Interpolation lineaire
 * du prix unitaire entre paliers (meme logique que lookupStickerPriceCustomQty).
 * Separee de STICKER_GRID (les prix clients ne dependent pas de ceci).
 */
import { describe, it, expect } from 'vitest'
import { getArtistStickerPrice, ARTIST_STICKER_GRID } from './artistPricing'

const PALIERS = { 10: 19, 25: 45, 50: 85, 100: 150, 250: 350, 500: 650 }

describe('getArtistStickerPrice - grille artiste dediee', () => {
  describe('prix exacts aux paliers', () => {
    Object.entries(PALIERS).forEach(([q, total]) => {
      it(`${q} -> total ${total}`, () => {
        const r = getArtistStickerPrice(Number(q))
        expect(r.price).toBe(total)
        expect(r.unitPrice).toBe(Math.round((total / Number(q)) * 100) / 100)
      })
    })
  })

  describe('minimum 10', () => {
    it('qty 5 -> null', () => expect(getArtistStickerPrice(5)).toBeNull())
    it('qty 9 -> null', () => expect(getArtistStickerPrice(9)).toBeNull())
    it('qty 10 -> valide (19)', () => expect(getArtistStickerPrice(10).price).toBe(19))
    it('qty 0 -> null', () => expect(getArtistStickerPrice(0)).toBeNull())
    it('qty NaN -> null', () => expect(getArtistStickerPrice(NaN)).toBeNull())
  })

  describe('interpolation entre paliers', () => {
    it('37 entre 25 (1.80/u) et 50 (1.70/u) -> 1.75/u, total 64.75', () => {
      const r = getArtistStickerPrice(37)
      expect(r.unitPrice).toBe(1.75)
      expect(r.price).toBe(64.75)
    })
    it('75 entre 50 (1.70) et 100 (1.50) -> prix/u dans l intervalle', () => {
      const r = getArtistStickerPrice(75)
      expect(r.unitPrice).toBeLessThan(1.70)
      expect(r.unitPrice).toBeGreaterThan(1.50)
    })
  })

  describe('au-dela du dernier palier (cap a 500)', () => {
    it('1000 -> rate du palier 500 (1.30/u), total 1300', () => {
      const r = getArtistStickerPrice(1000)
      expect(r.unitPrice).toBe(1.30)
      expect(r.price).toBe(1300)
    })
  })

  describe('monotonie : prix/u strictement decroissant', () => {
    it('10 > 25 > 50 > 100 > 250 > 500 (par unite)', () => {
      const qs = [10, 25, 50, 100, 250, 500]
      const units = qs.map(q => getArtistStickerPrice(q).unitPrice)
      for (let i = 1; i < units.length; i++) expect(units[i]).toBeLessThan(units[i - 1])
    })
  })

  describe('grille exportee == cible', () => {
    it('ARTIST_STICKER_GRID', () => expect(ARTIST_STICKER_GRID).toEqual(PALIERS))
  })
})
