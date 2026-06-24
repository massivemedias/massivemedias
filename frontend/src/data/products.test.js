/**
 * Tests unitaires pour getAffichePrice (helper paliers degressifs).
 * Strictement isole : aucun fetch reseau, aucun mock, juste de la logique pure.
 *
 * Run : cd frontend && npm run test
 */
import { describe, it, expect } from 'vitest'
import { getAffichePrice } from './products'

// Fixture : structure attendue de pricingData.afficheStandardPaliers du
// product Strapi `affiche-standard` (synchronisee avec le runbook).
// Grille marche degressive (recalibrage juin 2026). A2 desormais ACTIF
// (etait N/A). A2 250+ : pas de palier 250, donc qty>=250 retombe sur le
// palier 100-249 = 6 (plafond). getAffichePrice n'a pas de mecanisme
// "soumission" par palier (number ou null seulement).
const PALIERS = {
  A4:    { 1: 2,  10: 1.5, 25: 1,   50: 0.75, 100: 0.6,  250: 0.5  },
  A3:    { 1: 4,  10: 3,   25: 2,   50: 1.5,  100: 1,    250: 0.75 },
  'A3+': { 1: 6,  10: 4.5, 25: 3.5, 50: 2.5,  100: 1.75, 250: 1.25 },
  A2:    { 1: 15, 10: 12,  25: 10,  50: 8,    100: 6 },
}

describe('getAffichePrice', () => {
  describe('qty = 1 sur chaque format', () => {
    it('A4 qty=1 -> 2', () => expect(getAffichePrice('A4', 1, PALIERS)).toBe(2))
    it('A3 qty=1 -> 4', () => expect(getAffichePrice('A3', 1, PALIERS)).toBe(4))
    it('A3+ qty=1 -> 6', () => expect(getAffichePrice('A3+', 1, PALIERS)).toBe(6))
    it('A2 qty=1 -> 15', () => expect(getAffichePrice('A2', 1, PALIERS)).toBe(15))
  })

  describe('qty exactement sur chaque palier', () => {
    it('A4 qty=10 -> 1.5', () => expect(getAffichePrice('A4', 10, PALIERS)).toBe(1.5))
    it('A4 qty=25 -> 1', () => expect(getAffichePrice('A4', 25, PALIERS)).toBe(1))
    it('A4 qty=50 -> 0.75', () => expect(getAffichePrice('A4', 50, PALIERS)).toBe(0.75))
    it('A4 qty=100 -> 0.6', () => expect(getAffichePrice('A4', 100, PALIERS)).toBe(0.6))
    it('A4 qty=250 -> 0.5', () => expect(getAffichePrice('A4', 250, PALIERS)).toBe(0.5))
    it('A3 qty=10 -> 3', () => expect(getAffichePrice('A3', 10, PALIERS)).toBe(3))
    it('A3 qty=25 -> 2', () => expect(getAffichePrice('A3', 25, PALIERS)).toBe(2))
    it('A3 qty=50 -> 1.5', () => expect(getAffichePrice('A3', 50, PALIERS)).toBe(1.5))
    it('A3 qty=100 -> 1', () => expect(getAffichePrice('A3', 100, PALIERS)).toBe(1))
    it('A3 qty=250 -> 0.75', () => expect(getAffichePrice('A3', 250, PALIERS)).toBe(0.75))
    it('A3+ qty=10 -> 4.5', () => expect(getAffichePrice('A3+', 10, PALIERS)).toBe(4.5))
    it('A3+ qty=25 -> 3.5', () => expect(getAffichePrice('A3+', 25, PALIERS)).toBe(3.5))
    it('A3+ qty=50 -> 2.5', () => expect(getAffichePrice('A3+', 50, PALIERS)).toBe(2.5))
    it('A3+ qty=100 -> 1.75', () => expect(getAffichePrice('A3+', 100, PALIERS)).toBe(1.75))
    it('A3+ qty=250 -> 1.25', () => expect(getAffichePrice('A3+', 250, PALIERS)).toBe(1.25))
    it('A2 qty=10 -> 12', () => expect(getAffichePrice('A2', 10, PALIERS)).toBe(12))
    it('A2 qty=25 -> 10', () => expect(getAffichePrice('A2', 25, PALIERS)).toBe(10))
    it('A2 qty=50 -> 8', () => expect(getAffichePrice('A2', 50, PALIERS)).toBe(8))
    it('A2 qty=100 -> 6', () => expect(getAffichePrice('A2', 100, PALIERS)).toBe(6))
  })

  describe('qty entre paliers -> palier inferieur', () => {
    it('A4 qty=9 -> 2 (palier 1, juste avant 10)', () => expect(getAffichePrice('A4', 9, PALIERS)).toBe(2))
    it('A4 qty=24 -> 1.5 (palier 10)', () => expect(getAffichePrice('A4', 24, PALIERS)).toBe(1.5))
    it('A3 qty=49 -> 2 (palier 25)', () => expect(getAffichePrice('A3', 49, PALIERS)).toBe(2))
    it('A3 qty=99 -> 1.5 (palier 50)', () => expect(getAffichePrice('A3', 99, PALIERS)).toBe(1.5))
    it('A3+ qty=249 -> 1.75 (palier 100, juste avant 250)', () => expect(getAffichePrice('A3+', 249, PALIERS)).toBe(1.75))
    it('A2 qty=15 -> 12 (palier 10)', () => expect(getAffichePrice('A2', 15, PALIERS)).toBe(12))
    it('A2 qty=5 -> 15 (palier 1)', () => expect(getAffichePrice('A2', 5, PALIERS)).toBe(15))
  })

  describe('qty >= 250 -> palier 250 (ou plafond A2)', () => {
    it('A4 qty=1000 -> 0.5', () => expect(getAffichePrice('A4', 1000, PALIERS)).toBe(0.5))
    it('A3 qty=251 -> 0.75', () => expect(getAffichePrice('A3', 251, PALIERS)).toBe(0.75))
    it('A3+ qty=9999 -> 1.25', () => expect(getAffichePrice('A3+', 9999, PALIERS)).toBe(1.25))
    it('A2 qty=250 -> 6 (plafond, pas de palier 250)', () => expect(getAffichePrice('A2', 250, PALIERS)).toBe(6))
    it('A2 qty=9999 -> 6 (plafond)', () => expect(getAffichePrice('A2', 9999, PALIERS)).toBe(6))
  })

  describe('qty <= 0 -> null', () => {
    it('qty=0 -> null', () => expect(getAffichePrice('A4', 0, PALIERS)).toBeNull())
    it('qty=-1 -> null', () => expect(getAffichePrice('A4', -1, PALIERS)).toBeNull())
    it('qty=-100 -> null', () => expect(getAffichePrice('A4', -100, PALIERS)).toBeNull())
  })

  describe('qty non-entier ou non-fini -> null', () => {
    it('qty=1.5 -> null', () => expect(getAffichePrice('A4', 1.5, PALIERS)).toBeNull())
    it('qty=NaN -> null', () => expect(getAffichePrice('A4', NaN, PALIERS)).toBeNull())
    it('qty=Infinity -> null', () => expect(getAffichePrice('A4', Infinity, PALIERS)).toBeNull())
    it('qty=-Infinity -> null', () => expect(getAffichePrice('A4', -Infinity, PALIERS)).toBeNull())
    it('qty="10" (string) -> null', () => expect(getAffichePrice('A4', '10', PALIERS)).toBeNull())
  })

  describe('format invalide -> null', () => {
    it('format "Z9" (absent des paliers) -> null', () => expect(getAffichePrice('Z9', 10, PALIERS)).toBeNull())
    it('format "" -> null', () => expect(getAffichePrice('', 10, PALIERS)).toBeNull())
    it('format null -> null', () => expect(getAffichePrice(null, 10, PALIERS)).toBeNull())
    it('format undefined -> null', () => expect(getAffichePrice(undefined, 10, PALIERS)).toBeNull())
    it('format nombre -> null', () => expect(getAffichePrice(42, 10, PALIERS)).toBeNull())
    it('format objet -> null', () => expect(getAffichePrice({}, 10, PALIERS)).toBeNull())
  })

  describe('paliers undefined/null/malforme -> null', () => {
    it('paliers omis -> null', () => expect(getAffichePrice('A4', 10)).toBeNull())
    it('paliers null -> null', () => expect(getAffichePrice('A4', 10, null)).toBeNull())
    it('paliers undefined explicite -> null', () => expect(getAffichePrice('A4', 10, undefined)).toBeNull())
    it('paliers vide {} -> null', () => expect(getAffichePrice('A4', 10, {})).toBeNull())
    it('paliers sans le format demande -> null', () => expect(getAffichePrice('A4', 10, { A3: { 1: 15 } })).toBeNull())
    it('paliers = array -> null', () => expect(getAffichePrice('A4', 10, [1, 2, 3])).toBeNull())
    it('paliers = string -> null', () => expect(getAffichePrice('A4', 10, 'paliers')).toBeNull())
    it('paliers[format] non-objet -> null', () => expect(getAffichePrice('A4', 10, { A4: 'not an object' })).toBeNull())
    it('paliers[format] = null -> null', () => expect(getAffichePrice('A4', 10, { A4: null })).toBeNull())
    it('cles palier non-numeriques -> null', () => expect(getAffichePrice('A4', 10, { A4: { foo: 10, bar: 5 } })).toBeNull())
    it('valeurs palier non-nombres -> null', () => expect(getAffichePrice('A4', 10, { A4: { 1: 'abc', 5: 'def' } })).toBeNull())
    it('valeurs palier negatives -> null (toutes filtrees)', () => expect(getAffichePrice('A4', 10, { A4: { 1: -5, 5: -10 } })).toBeNull())
    it('paliers partiellement valides : ignore les invalides', () => {
      // Seul "5":12 est valide. qty=10 -> palier 5 -> 12.
      expect(getAffichePrice('A4', 10, { A4: { foo: 5, 5: 12, '-3': 99, NaN: 100 } })).toBe(12)
    })
  })

  describe('paliers a un seul palier (cas limite)', () => {
    it('un seul palier "1":10, qty=1 -> 10', () => expect(getAffichePrice('A4', 1, { A4: { 1: 10 } })).toBe(10))
    it('un seul palier "1":10, qty=500 -> 10', () => expect(getAffichePrice('A4', 500, { A4: { 1: 10 } })).toBe(10))
    it('un seul palier "10":5, qty=5 -> null (qty < plus petit palier)', () => expect(getAffichePrice('A4', 5, { A4: { 10: 5 } })).toBeNull())
  })
})
