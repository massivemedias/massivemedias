/**
 * Tests unitaires pour getAffichePrice (helper paliers degressifs).
 * Strictement isole : aucun fetch reseau, aucun mock, juste de la logique pure.
 *
 * Run : cd frontend && npm run test
 */
import { describe, it, expect } from 'vitest';
import { getAffichePrice } from './products';

// Fixture : structure attendue de pricingData.afficheStandardPaliers du
// product Strapi `affiche-standard` (synchronisee avec le runbook).
const PALIERS = {
  A4:    { 1: 10, 5: 8,  10: 6,  25: 4, 50: 3, 100: 2.5 },
  A3:    { 1: 15, 5: 12, 10: 8,  25: 5, 50: 4, 100: 3.5 },
  'A3+': { 1: 20, 5: 15, 10: 12, 25: 9, 50: 7, 100: 6   },
};

describe('getAffichePrice', () => {
  describe('qty = 1 sur chaque format', () => {
    it('A4 qty=1 -> 10 (palier 1)', () => {
      expect(getAffichePrice('A4', 1, PALIERS)).toBe(10);
    });
    it('A3 qty=1 -> 15 (palier 1)', () => {
      expect(getAffichePrice('A3', 1, PALIERS)).toBe(15);
    });
    it('A3+ qty=1 -> 20 (palier 1)', () => {
      expect(getAffichePrice('A3+', 1, PALIERS)).toBe(20);
    });
  });

  describe('qty exactement sur un palier', () => {
    it('A4 qty=5 -> 8', () => expect(getAffichePrice('A4', 5, PALIERS)).toBe(8));
    it('A4 qty=10 -> 6', () => expect(getAffichePrice('A4', 10, PALIERS)).toBe(6));
    it('A4 qty=25 -> 4', () => expect(getAffichePrice('A4', 25, PALIERS)).toBe(4));
    it('A4 qty=50 -> 3', () => expect(getAffichePrice('A4', 50, PALIERS)).toBe(3));
    it('A4 qty=100 -> 2.5', () => expect(getAffichePrice('A4', 100, PALIERS)).toBe(2.5));
    it('A3 qty=5 -> 12', () => expect(getAffichePrice('A3', 5, PALIERS)).toBe(12));
    it('A3 qty=25 -> 5', () => expect(getAffichePrice('A3', 25, PALIERS)).toBe(5));
    it('A3+ qty=100 -> 6', () => expect(getAffichePrice('A3+', 100, PALIERS)).toBe(6));
  });

  describe('qty entre paliers -> palier inferieur', () => {
    it('A3 qty=7 -> 12 (palier 5)', () => {
      expect(getAffichePrice('A3', 7, PALIERS)).toBe(12);
    });
    it('A3 qty=17 -> 8 (palier 10)', () => {
      expect(getAffichePrice('A3', 17, PALIERS)).toBe(8);
    });
    it('A3 qty=24 -> 8 (palier 10, juste avant 25)', () => {
      expect(getAffichePrice('A3', 24, PALIERS)).toBe(8);
    });
    it('A3 qty=33 -> 5 (palier 25)', () => {
      expect(getAffichePrice('A3', 33, PALIERS)).toBe(5);
    });
    it('A3 qty=75 -> 4 (palier 50)', () => {
      expect(getAffichePrice('A3', 75, PALIERS)).toBe(4);
    });
    it('A4 qty=2 -> 10 (palier 1)', () => {
      expect(getAffichePrice('A4', 2, PALIERS)).toBe(10);
    });
    it('A4 qty=4 -> 10 (palier 1, juste avant 5)', () => {
      expect(getAffichePrice('A4', 4, PALIERS)).toBe(10);
    });
  });

  describe('qty > 100 -> palier 100', () => {
    it('A4 qty=101 -> 2.5', () => expect(getAffichePrice('A4', 101, PALIERS)).toBe(2.5));
    it('A3 qty=500 -> 3.5', () => expect(getAffichePrice('A3', 500, PALIERS)).toBe(3.5));
    it('A3+ qty=9999 -> 6', () => expect(getAffichePrice('A3+', 9999, PALIERS)).toBe(6));
  });

  describe('qty <= 0 -> null', () => {
    it('qty=0 -> null', () => expect(getAffichePrice('A4', 0, PALIERS)).toBeNull());
    it('qty=-1 -> null', () => expect(getAffichePrice('A4', -1, PALIERS)).toBeNull());
    it('qty=-100 -> null', () => expect(getAffichePrice('A4', -100, PALIERS)).toBeNull());
  });

  describe('qty non-entier ou non-fini -> null', () => {
    it('qty=1.5 -> null', () => expect(getAffichePrice('A4', 1.5, PALIERS)).toBeNull());
    it('qty=NaN -> null', () => expect(getAffichePrice('A4', NaN, PALIERS)).toBeNull());
    it('qty=Infinity -> null', () => expect(getAffichePrice('A4', Infinity, PALIERS)).toBeNull());
    it('qty=-Infinity -> null', () => expect(getAffichePrice('A4', -Infinity, PALIERS)).toBeNull());
    it('qty="10" (string) -> null', () => expect(getAffichePrice('A4', '10', PALIERS)).toBeNull());
  });

  describe('format invalide -> null', () => {
    it('format "A2" (pas dans paliers) -> null', () => {
      expect(getAffichePrice('A2', 10, PALIERS)).toBeNull();
    });
    it('format "" -> null', () => expect(getAffichePrice('', 10, PALIERS)).toBeNull());
    it('format null -> null', () => expect(getAffichePrice(null, 10, PALIERS)).toBeNull());
    it('format undefined -> null', () => expect(getAffichePrice(undefined, 10, PALIERS)).toBeNull());
    it('format nombre -> null', () => expect(getAffichePrice(42, 10, PALIERS)).toBeNull());
    it('format objet -> null', () => expect(getAffichePrice({}, 10, PALIERS)).toBeNull());
  });

  describe('paliers undefined/null/malforme -> null', () => {
    it('paliers omis -> null', () => expect(getAffichePrice('A4', 10)).toBeNull());
    it('paliers null -> null', () => expect(getAffichePrice('A4', 10, null)).toBeNull());
    it('paliers undefined explicite -> null', () => {
      expect(getAffichePrice('A4', 10, undefined)).toBeNull();
    });
    it('paliers vide {} -> null', () => expect(getAffichePrice('A4', 10, {})).toBeNull());
    it('paliers sans le format demande -> null', () => {
      expect(getAffichePrice('A4', 10, { A3: { 1: 15 } })).toBeNull();
    });
    it('paliers = array -> null', () => {
      expect(getAffichePrice('A4', 10, [1, 2, 3])).toBeNull();
    });
    it('paliers = string -> null', () => {
      expect(getAffichePrice('A4', 10, 'paliers')).toBeNull();
    });
    it('paliers[format] non-objet -> null', () => {
      expect(getAffichePrice('A4', 10, { A4: 'not an object' })).toBeNull();
    });
    it('paliers[format] = null -> null', () => {
      expect(getAffichePrice('A4', 10, { A4: null })).toBeNull();
    });
    it('cles palier non-numeriques -> null', () => {
      expect(getAffichePrice('A4', 10, { A4: { foo: 10, bar: 5 } })).toBeNull();
    });
    it('valeurs palier non-nombres -> null', () => {
      expect(getAffichePrice('A4', 10, { A4: { 1: 'abc', 5: 'def' } })).toBeNull();
    });
    it('valeurs palier negatives -> null (toutes filtrees)', () => {
      expect(getAffichePrice('A4', 10, { A4: { 1: -5, 5: -10 } })).toBeNull();
    });
    it('paliers partiellement valides : ignore les invalides', () => {
      // Seul "5":12 est valide. qty=10 -> palier 5 -> 12.
      expect(
        getAffichePrice('A4', 10, { A4: { foo: 5, 5: 12, '-3': 99, NaN: 100 } })
      ).toBe(12);
    });
  });

  describe('paliers a un seul palier (cas limite)', () => {
    it('un seul palier "1":10, qty=1 -> 10', () => {
      expect(getAffichePrice('A4', 1, { A4: { 1: 10 } })).toBe(10);
    });
    it('un seul palier "1":10, qty=500 -> 10', () => {
      expect(getAffichePrice('A4', 500, { A4: { 1: 10 } })).toBe(10);
    });
    it('un seul palier "10":5, qty=5 -> null (qty < plus petit palier)', () => {
      expect(getAffichePrice('A4', 5, { A4: { 10: 5 } })).toBeNull();
    });
  });
});
