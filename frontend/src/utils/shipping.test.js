import { describe, it, expect } from 'vitest';
import { calculateShipping } from './shipping';

// FIX-PRIX-SECURITE : le miroir front doit afficher EXACTEMENT ce que le backend
// facture (backend/src/utils/shipping.ts, branche isCollectionOnly). Ces tests
// verrouillent la parite : Montreal gratuit, collection-only QC gratuit des 30 $
// sinon 4 $, Canada 6 $, panier MIXTE -> paliers poids inchanges.
const item = (productId, quantity = 1) => ({ productId, quantity });

describe('calculateShipping — branche collection (miroir backend)', () => {
  it('Montreal (code postal H) = gratuit', () => {
    expect(calculateShipping('QC', 'H2J 3Z3', [item('sticker-massive-x', 5)]).shippingCost).toBe(0);
  });

  it('collection-only QC < 30 $ = 4 $ (5 stickers x 3 = 15 $)', () => {
    expect(calculateShipping('QC', 'G1A 1A1', [item('sticker-massive-x', 5)]).shippingCost).toBe(4);
  });

  it('collection-only QC >= 30 $ = gratuit (10 stickers x 3 = 30 $)', () => {
    expect(calculateShipping('QC', 'G1A 1A1', [item('sticker-massive-x', 10)]).shippingCost).toBe(0);
  });

  it('mystery pack compte dans le sous-total collection', () => {
    // mystery-pack-20 = 25 $ -> < 30 -> 4 $
    expect(calculateShipping('QC', 'G1A 1A1', [item('mystery-pack-20', 1)]).shippingCost).toBe(4);
    // 2 x mystery-pack-20 = 50 $ -> >= 30 -> gratuit
    expect(calculateShipping('QC', 'G1A 1A1', [item('mystery-pack-20', 2)]).shippingCost).toBe(0);
  });

  it('collection-only hors QC (Canada) = 6 $', () => {
    expect(calculateShipping('ON', 'M5V 1A1', [item('sticker-massive-x', 5)]).shippingCost).toBe(6);
  });

  it('panier MIXTE (collection + print) = paliers poids, PAS le tarif collection', () => {
    const r = calculateShipping('QC', 'G1A 1A1', [item('sticker-massive-x', 5), item('fine-art-print', 1)]);
    expect(r.shippingCost).not.toBe(4);
    expect(r.shippingCost).toBeGreaterThanOrEqual(12); // palier poids QC
  });
});
