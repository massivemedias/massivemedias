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

// PRICING-VOLUME (9 juillet 2026, correctif marche FINAL, decision Mika apres
// benchmark StickerYou/StickerApp/Sticker Mule). Paliers volume 1000/2000,
// positionnement premium. Ancres matte (0,55/0,45), fx (0,70/0,60), inter = milieu.
// SEUIL bulk : 999 reste au taux 500 (0,70), le rabais exige d'ATTEINDRE le palier
// (floor, pas d'interpolation au-dela de 500). Interpolation retail conservee < 500.
describe('getStickerPrice - paliers volume 1000/2000 (PRICING-VOLUME final)', () => {
  // ---- Les 4 verifs NOMMEES par Mika ----
  it('VERIF 1 : matte 2.5" x 2000 = 900 $ (0,45/u)', () => {
    expect(getStickerPrice(MATTE, 'die-cut', 2000, STD)).toMatchObject({ tier: 'standard', price: 900, unitPrice: 0.45 })
    expect(getStickerPriceForTotal(MATTE, 'die-cut', 2000, STD).price).toBe(900)
  })
  it('VERIF 2 : matte 2.5" x 1000 = 550 $ (0,55/u)', () => {
    expect(getStickerPrice(MATTE, 'die-cut', 1000, STD)).toMatchObject({ price: 550, unitPrice: 0.55 })
    expect(getStickerPriceForTotal(MATTE, 'die-cut', 1000, STD).price).toBe(550)
  })
  it('VERIF 3 : fx 2.5" x 2000 = 1200 $ (0,60/u)', () => {
    expect(getStickerPrice(FX, 'die-cut', 2000, STD)).toMatchObject({ price: 1200, unitPrice: 0.60 })
  })
  it('VERIF 4 : matte 2.5" x 999 = taux palier 500 (0,70/u), seuil bulk', () => {
    const r = getStickerPriceForTotal(MATTE, 'die-cut', 999, STD)
    expect(r.unitPrice).toBe(0.70)
    expect(r.price).toBe(699.30) // 999 x 0,70 ; PAS le taux bulk 1000
  })

  it('fx 1000 = 700 (0,70/u) ; intermediate = milieu (1000 = 620, 2000 = 1040)', () => {
    expect(getStickerPrice(FX, 'die-cut', 1000, STD)).toMatchObject({ price: 700, unitPrice: 0.70 })
    expect(getStickerPrice('clear', 'die-cut', 1000, STD).price).toBe(620)
    expect(getStickerPrice('clear', 'die-cut', 2000, STD).price).toBe(1040)
  })

  it('degressivite matte : 0,70 (500) > 0,55 (1000) > 0,45 (2000)', () => {
    const u = [500, 1000, 2000].map(q => getStickerPrice(MATTE, 'die-cut', q, STD).unitPrice)
    expect(u).toEqual([0.70, 0.55, 0.45])
    for (let i = 1; i < u.length; i++) expect(u[i]).toBeLessThan(u[i - 1])
  })
  it('degressivite fx : 0,80 (500) > 0,70 (1000) > 0,60 (2000)', () => {
    const u = [500, 1000, 2000].map(q => getStickerPrice(FX, 'die-cut', q, STD).unitPrice)
    expect(u).toEqual([0.80, 0.70, 0.60])
    for (let i = 1; i < u.length; i++) expect(u[i]).toBeLessThan(u[i - 1])
  })
  it('ecart finitions survit au volume : matte < inter < fx a 1000 et 2000', () => {
    for (const q of [1000, 2000]) {
      const m = getStickerPrice(MATTE, 'die-cut', q, STD).unitPrice
      const i = getStickerPrice('clear', 'die-cut', q, STD).unitPrice
      const x = getStickerPrice(FX, 'die-cut', q, STD).unitPrice
      expect(m).toBeLessThan(i)
      expect(i).toBeLessThan(x)
    }
  })
  it('medium/large gardent leurs ratios (aucune valeur inventee)', () => {
    // medium/matte 1000 = standard/matte 1000 (550) x (500/350) = 785,71
    expect(getStickerPrice(MATTE, 'die-cut', 1000, MED).price).toBe(785.71)
    // large/matte 2000 = standard/matte 2000 (900) x (700/350 = 2,0) = 1800
    expect(getStickerPrice(MATTE, 'die-cut', 2000, LRG).price).toBe(1800)
  })

  describe('SEUIL bulk : le rabais exige d atteindre le palier (floor, pas d interpolation)', () => {
    it('999 = taux 500 (0,70/u = 699,30 $)', () => {
      const r = getStickerPriceForTotal(MATTE, 'die-cut', 999, STD)
      expect(r.unitPrice).toBe(0.70)
      expect(r.price).toBe(699.30)
    })
    it('1000 = palier exact (0,55/u = 550 $)', () => {
      expect(getStickerPriceForTotal(MATTE, 'die-cut', 1000, STD).price).toBe(550)
    })
    it('1500 = taux 1000 (0,55/u = 825 $), pas d interpolation', () => {
      const r = getStickerPriceForTotal(MATTE, 'die-cut', 1500, STD)
      expect(r.unitPrice).toBe(0.55)
      expect(r.price).toBe(825)
    })
    it('3000 = plafond au taux 2000 (0,45/u = 1350 $)', () => {
      const r = getStickerPriceForTotal(MATTE, 'die-cut', 3000, STD)
      expect(r.unitPrice).toBe(0.45)
      expect(r.price).toBe(1350)
    })
    it('retail INCHANGE : 60 clear interpole toujours (< seuil 500)', () => {
      const r = getStickerPriceForTotal('clear', 'die-cut', 60, STD)
      expect(r.price).toBe(58.80) // interpolation retail preservee (fix 5 mai)
    })
  })
})
