/**
 * Tests unitaires pour getStickerPrice (grille stickers, STICKER_GRID).
 * Logique pure : aucun fetch reseau, aucun mock.
 *
 * Run : cd frontend && npm run test
 *
 * Baisse de la taille STANDARD (juin 2026). Forme de stockage = prix TOTAL
 * par palier ; unitPrice = total / qty (arrondi 2 decimales). Medium et Large
 * ne sont PAS modifies : ils servent de cas temoin ici.
 * Mapping taille -> tier : <= 2.5 standard, <= 3.5 medium, sinon large.
 * Finitions : fx = holographic / broken-glass / stars. Tout le reste = matte.
 */
import { describe, it, expect } from 'vitest'
import { getStickerPrice, getStickerPriceForTotal } from './products'

const STD = '2.5'
const MED = '3'
const LRG = '4'
const MATTE = 'matte'
const FX = 'holographic'
const TIERS = [25, 50, 100, 250, 500]

// Cibles taille Standard (apres baisse) : total stocke et prix/u derive.
const STD_MATTE_TOTAL = { 25: 25, 50: 45, 100: 80, 250: 187.50, 500: 350 }
const STD_MATTE_UNIT = { 25: 1.00, 50: 0.90, 100: 0.80, 250: 0.75, 500: 0.70 }
const STD_FX_TOTAL = { 25: 30, 50: 55, 100: 100, 250: 225, 500: 400 }
const STD_FX_UNIT = { 25: 1.20, 50: 1.10, 100: 1.00, 250: 0.90, 500: 0.80 }

describe('getStickerPrice - taille Standard recalibree', () => {
  describe('Matte/Lustre : total + prix/u par palier', () => {
    TIERS.forEach(q => {
      it(`matte ${q} -> total ${STD_MATTE_TOTAL[q]} / ${STD_MATTE_UNIT[q]} par unite`, () => {
        const r = getStickerPrice(MATTE, 'die-cut', q, STD)
        expect(r.tier).toBe('standard')
        expect(r.price).toBe(STD_MATTE_TOTAL[q])
        expect(r.unitPrice).toBe(STD_MATTE_UNIT[q])
      })
    })
  })

  describe('Fx : total + prix/u par palier', () => {
    TIERS.forEach(q => {
      it(`fx ${q} -> total ${STD_FX_TOTAL[q]} / ${STD_FX_UNIT[q]} par unite`, () => {
        const r = getStickerPrice(FX, 'die-cut', q, STD)
        expect(r.tier).toBe('standard')
        expect(r.price).toBe(STD_FX_TOTAL[q])
        expect(r.unitPrice).toBe(STD_FX_UNIT[q])
      })
    })
  })

  describe('degressivite : prix/u strictement decroissant', () => {
    it('matte standard : 25 > 50 > 100 > 250 > 500', () => {
      const u = TIERS.map(q => getStickerPrice(MATTE, 'die-cut', q, STD).unitPrice)
      for (let i = 1; i < u.length; i++) expect(u[i]).toBeLessThan(u[i - 1])
    })
    it('fx standard : 25 > 50 > 100 > 250 > 500', () => {
      const u = TIERS.map(q => getStickerPrice(FX, 'die-cut', q, STD).unitPrice)
      for (let i = 1; i < u.length; i++) expect(u[i]).toBeLessThan(u[i - 1])
    })
  })

  describe('coherence finitions : Fx > Matte au meme palier', () => {
    TIERS.forEach(q => {
      it(`fx ${q} > matte ${q}`, () => {
        const fx = getStickerPrice(FX, 'die-cut', q, STD).unitPrice
        const matte = getStickerPrice(MATTE, 'die-cut', q, STD).unitPrice
        expect(fx).toBeGreaterThan(matte)
      })
    })
  })

  describe('cas temoin : Medium et Large INCHANGES par la baisse', () => {
    it('medium matte 25 -> total 40 (1.60/u)', () => {
      const r = getStickerPrice(MATTE, 'die-cut', 25, MED)
      expect(r.tier).toBe('medium')
      expect(r.price).toBe(40)
      expect(r.unitPrice).toBe(1.60)
    })
    it('medium fx 100 -> total 135 (1.35/u)', () => {
      const r = getStickerPrice(FX, 'die-cut', 100, MED)
      expect(r.price).toBe(135)
      expect(r.unitPrice).toBe(1.35)
    })
    it('large matte 25 -> total 55 (2.20/u)', () => {
      const r = getStickerPrice(MATTE, 'die-cut', 25, LRG)
      expect(r.tier).toBe('large')
      expect(r.price).toBe(55)
      expect(r.unitPrice).toBe(2.20)
    })
    it('large fx 500 -> total 785 (1.57/u)', () => {
      const r = getStickerPrice(FX, 'die-cut', 500, LRG)
      expect(r.price).toBe(785)
      expect(r.unitPrice).toBe(1.57)
    })
  })
})

// FINITIONS-V2 (juin 2026) : 3 groupes de prix. matte = sans finition (id matte),
// clear = intermediate (nouvelle grille), matte-pro/glossy/dots deplaces en fx.
describe('getStickerPrice - finitions v2 (3 groupes, Standard)', () => {
  it('matte (Sans finition) -> grille matte inchangee (25=25, 250=187.50)', () => {
    expect(getStickerPrice('matte', 'die-cut', 25, STD).price).toBe(25)
    expect(getStickerPrice('matte', 'die-cut', 250, STD).price).toBe(187.50)
  })
  it('clear -> grille intermediate (25=27.50, 100=90, 500=375)', () => {
    expect(getStickerPrice('clear', 'die-cut', 25, STD).price).toBe(27.50)
    expect(getStickerPrice('clear', 'die-cut', 100, STD).price).toBe(90)
    expect(getStickerPrice('clear', 'die-cut', 500, STD).price).toBe(375)
  })
  it('matte-pro / glossy / dots / holographic -> grille fx (25=30)', () => {
    for (const f of ['matte-pro', 'glossy', 'dots', 'holographic']) {
      expect(getStickerPrice(f, 'die-cut', 25, STD).price).toBe(30)
    }
  })
  it('ordre strict a chaque palier : matte < intermediate < fx', () => {
    TIERS.forEach(q => {
      const m = getStickerPrice('matte', 'die-cut', q, STD).price
      const i = getStickerPrice('clear', 'die-cut', q, STD).price
      const x = getStickerPrice('holographic', 'die-cut', q, STD).price
      expect(m).toBeLessThan(i)
      expect(i).toBeLessThan(x)
    })
  })
  it('custom qty interpole sur intermediate (clear 60 = total 58.80)', () => {
    const r = getStickerPriceForTotal('clear', 'die-cut', 60, STD)
    expect(r.price).toBe(58.80)
    expect(r.unitPrice).toBeGreaterThan(0.90)
    expect(r.unitPrice).toBeLessThan(1.10)
  })
})

// PRICING-VOLUME (9 juillet 2026, decision Mika) : paliers volume 1000 / 2000
// pour tuer le plafond a 0,80 $/u au-dela de 500 (2000 x 2.5" fx = 1600 $, hors
// marche). Ancres MATTE (0,65 puis 0,50), fx degresse MOINS (0,80 puis 0,65,
// l'holo coute plus cher en matiere) -> l'ecart entre finitions survit.
describe('getStickerPrice - paliers volume 1000/2000 (PRICING-VOLUME)', () => {
  it('matte standard 1000 -> 650 (0,65/u) et 2000 -> 1000 (0,50/u)', () => {
    expect(getStickerPrice(MATTE, 'die-cut', 1000, STD)).toMatchObject({ tier: 'standard', price: 650, unitPrice: 0.65 })
    expect(getStickerPrice(MATTE, 'die-cut', 2000, STD)).toMatchObject({ tier: 'standard', price: 1000, unitPrice: 0.50 })
  })
  it('fx standard 1000 -> 800 (0,80/u) et 2000 -> 1300 (0,65/u)', () => {
    expect(getStickerPrice(FX, 'die-cut', 1000, STD)).toMatchObject({ price: 800, unitPrice: 0.80 })
    expect(getStickerPrice(FX, 'die-cut', 2000, STD)).toMatchObject({ price: 1300, unitPrice: 0.65 })
  })
  it('intermediate (clear) = milieu matte/fx : 1000 -> 725, 2000 -> 1150', () => {
    expect(getStickerPrice('clear', 'die-cut', 1000, STD).price).toBe(725)
    expect(getStickerPrice('clear', 'die-cut', 2000, STD).price).toBe(1150)
  })

  it('VERIF Groove and Bass : matte 2.5" x 2000 = 1000 $ exactement', () => {
    expect(getStickerPrice(MATTE, 'die-cut', 2000, STD).price).toBe(1000)
    expect(getStickerPriceForTotal(MATTE, 'die-cut', 2000, STD).price).toBe(1000)
  })

  it('degressivite matte : 0,70 (500) > 0,65 (1000) > 0,50 (2000)', () => {
    const u = [500, 1000, 2000].map(q => getStickerPrice(MATTE, 'die-cut', q, STD).unitPrice)
    expect(u).toEqual([0.70, 0.65, 0.50])
    for (let i = 1; i < u.length; i++) expect(u[i]).toBeLessThan(u[i - 1])
  })
  it('fx degresse MOINS que matte : plat 0,80 (500->1000) puis 0,65 (2000)', () => {
    const u = [500, 1000, 2000].map(q => getStickerPrice(FX, 'die-cut', q, STD).unitPrice)
    expect(u).toEqual([0.80, 0.80, 0.65])
    expect(u[2]).toBeLessThan(u[1])
  })
  it('ecart finitions survit au volume : fx > matte a 1000 et 2000', () => {
    for (const q of [1000, 2000]) {
      expect(getStickerPrice(FX, 'die-cut', q, STD).unitPrice)
        .toBeGreaterThan(getStickerPrice(MATTE, 'die-cut', q, STD).unitPrice)
    }
  })

  describe('qty custom autour des paliers (999 vs 1000 vs 2000)', () => {
    it('999 interpole 500->1000 (~0,65/u) - PLUS l ancien plafond 0,70', () => {
      const r = getStickerPriceForTotal(MATTE, 'die-cut', 999, STD)
      expect(r.unitPrice).toBeCloseTo(0.65, 2)
      expect(r.price).toBeLessThan(660) // ancien plafond 0,70 -> 999 = 699,30 exclu
    })
    it('1000 = palier exact 650', () => {
      expect(getStickerPriceForTotal(MATTE, 'die-cut', 1000, STD).price).toBe(650)
    })
    it('1500 interpole 1000->2000 (entre 0,50 et 0,65/u)', () => {
      const r = getStickerPriceForTotal(MATTE, 'die-cut', 1500, STD)
      expect(r.unitPrice).toBeGreaterThan(0.50)
      expect(r.unitPrice).toBeLessThan(0.65)
    })
    it('au-dela de 2000 : plafond au taux 2000 (3000 matte = 0,50/u = 1500, PLUS 0,70)', () => {
      const r = getStickerPriceForTotal(MATTE, 'die-cut', 3000, STD)
      expect(r.unitPrice).toBe(0.50) // taux du palier 2000, pas l'ancien 0,70 (=> 2100)
      expect(r.price).toBe(1500)
    })
  })
})
