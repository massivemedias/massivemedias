/**
 * Tests unitaires pour getFineArtPrice (grille fine-art CLIENT, FINE_ART_GRID).
 * Logique pure : aucun fetch reseau, aucun mock.
 *
 * Run : cd frontend && npm run test
 *
 * Grille recalibree a la baisse (juin 2026). Ancres : Studio A4 = 10,
 * Musee A4 = 20. Le cadre (champ frame) est par-format et reste inchange.
 * getFineArtPrice retourne { price, basePrice, framePrice } ou null
 * (format invalide, ou combinaison tier/format indisponible comme a2 studio).
 */
import { describe, it, expect } from 'vitest'
import { getFineArtPrice } from './products'
import { lookupFineArtPrice, FINE_ART_GRID } from '../utils/pricingData'

// Prix de base attendus SANS cadre, par format et par tier (studio = null
// quand le format n'est pas offert en Studio, ex a2).
const EXPECTED = {
  postcard: { studio: 8,    museum: 15 },
  a4:       { studio: 10,   museum: 20 },
  a3:       { studio: 15,   museum: 30 },
  a3plus:   { studio: 20,   museum: 45 },
  a2:       { studio: null, museum: 55 },
  sq8:      { studio: 10,   museum: 20 },
  sq10:     { studio: 13,   museum: 25 },
  sq12:     { studio: 15,   museum: 30 },
}
const FORMATS = Object.keys(EXPECTED)

describe('getFineArtPrice - grille fine-art client recalibree', () => {
  describe('ancres', () => {
    it('Studio A4 = 10', () => expect(getFineArtPrice('studio', 'a4', false).price).toBe(10))
    it('Musee A4 = 20', () => expect(getFineArtPrice('museum', 'a4', false).price).toBe(20))
  })

  describe('prix de base sans cadre, chaque format', () => {
    FORMATS.forEach((fmt) => {
      const exp = EXPECTED[fmt]
      if (exp.studio == null) {
        it(`${fmt} studio -> null (indisponible)`, () => expect(getFineArtPrice('studio', fmt, false)).toBeNull())
      } else {
        it(`${fmt} studio = ${exp.studio}`, () => expect(getFineArtPrice('studio', fmt, false).price).toBe(exp.studio))
      }
      it(`${fmt} museum = ${exp.museum}`, () => expect(getFineArtPrice('museum', fmt, false).price).toBe(exp.museum))
    })
  })

  describe('hierarchie studio < museum sur chaque format disponible', () => {
    FORMATS.forEach((fmt) => {
      if (EXPECTED[fmt].studio == null) return
      it(`${fmt} : studio < museum`, () => {
        const s = getFineArtPrice('studio', fmt, false).price
        const m = getFineArtPrice('museum', fmt, false).price
        expect(s).toBeLessThan(m)
      })
    })
  })

  describe('A2 : Studio indisponible, Musee = 55', () => {
    it('a2 studio -> null', () => expect(getFineArtPrice('studio', 'a2', false)).toBeNull())
    it('a2 museum = 55', () => expect(getFineArtPrice('museum', 'a2', false).price).toBe(55))
  })

  describe('cas carre', () => {
    it('sq8 studio = 10', () => expect(getFineArtPrice('studio', 'sq8', false).price).toBe(10))
    it('sq10 museum = 25', () => expect(getFineArtPrice('museum', 'sq10', false).price).toBe(25))
  })

  describe('cadre : surcout par-format ajoute au prix de base', () => {
    it('museum a4 + cadre = base 20 + frame(a4) specifique', () => {
      const frameA4 = FINE_ART_GRID.a4.frame
      const r = getFineArtPrice('museum', 'a4', true)
      expect(r.basePrice).toBe(20)
      expect(r.framePrice).toBe(frameA4)
      expect(r.price).toBe(20 + frameA4)
    })
    it('le surcout cadre est specifique au format (a3plus != a4)', () => {
      const r = getFineArtPrice('museum', 'a3plus', true)
      expect(r.framePrice).toBe(FINE_ART_GRID.a3plus.frame)
      expect(r.framePrice).not.toBe(FINE_ART_GRID.a4.frame)
    })
    it('sans cadre, framePrice = 0', () => {
      expect(getFineArtPrice('studio', 'a4', false).framePrice).toBe(0)
    })
  })

  describe('coherence avec le helper lookupFineArtPrice + cas invalides', () => {
    it('lookupFineArtPrice == getFineArtPrice (museum a3 avec cadre)', () => {
      expect(lookupFineArtPrice('museum', 'a3', true)).toEqual(getFineArtPrice('museum', 'a3', true))
    })
    it('format invalide -> null', () => expect(getFineArtPrice('studio', 'zzz', false)).toBeNull())
  })
})
