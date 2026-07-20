/**
 * RABAIS-CLIENT : tests du miroir front (utils/personalDiscount.js).
 *
 * Ce miroir DOIT reproduire computeOrderDiscount du backend
 * (backend/src/utils/pricing-config.ts) - memes bornes, memes arrondis - pour
 * que le total affiche au client == le total facture serveur. La regle
 * "meilleur gagne" (resolvePersonalVsPromo) reproduit le bloc best-wins de
 * createCheckoutSession : rabais perso et promo ne cumulent jamais.
 */
import { describe, it, expect } from 'vitest'
import { computeOrderDiscount, resolvePersonalVsPromo, personalDiscountLabel } from './personalDiscount'

describe('computeOrderDiscount (miroir back)', () => {
  it('pourcentage : 15% de 100 = 15', () => {
    expect(computeOrderDiscount(100, 'percent', 15).discountAmount).toBe(15)
  })
  it('montant fixe : 10 sur 100 = 10', () => {
    expect(computeOrderDiscount(100, 'fixed', 10).discountAmount).toBe(10)
  })
  it('borne % a 100 (pas de rabais > sous-total)', () => {
    expect(computeOrderDiscount(50, 'percent', 150).discountAmount).toBe(50)
  })
  it('borne $ au sous-total (total jamais negatif)', () => {
    expect(computeOrderDiscount(20, 'fixed', 999).discountAmount).toBe(20)
  })
  it('valeur <= 0 ou type invalide => 0', () => {
    expect(computeOrderDiscount(100, 'percent', 0).discountAmount).toBe(0)
    expect(computeOrderDiscount(100, 'bogus', 10).discountAmount).toBe(0)
    expect(computeOrderDiscount(0, 'percent', 15).discountAmount).toBe(0)
  })
  it('arrondi au cent : 15% de 12.75 = 1.91', () => {
    expect(computeOrderDiscount(12.75, 'percent', 15).discountAmount).toBe(1.91)
  })
  it('accepte une valeur string avec virgule', () => {
    expect(computeOrderDiscount(100, 'fixed', '12,50').discountAmount).toBe(12.5)
  })
})

describe('resolvePersonalVsPromo (meilleur gagne)', () => {
  it('perso seul gagne', () => {
    const r = resolvePersonalVsPromo(100, { type: 'percent', value: 15 }, 0)
    expect(r.winner).toBe('personal')
    expect(r.appliedDiscount).toBe(15)
    expect(r.promoDiscount).toBe(0)
  })
  it('promo seul gagne quand pas de rabais perso', () => {
    const r = resolvePersonalVsPromo(100, null, 10)
    expect(r.winner).toBe('promo')
    expect(r.appliedDiscount).toBe(10)
    expect(r.personalDiscount).toBe(0)
  })
  it('le plus avantageux gagne : perso 20% > promo 10%', () => {
    const r = resolvePersonalVsPromo(100, { type: 'percent', value: 20 }, 10)
    expect(r.winner).toBe('personal')
    expect(r.appliedDiscount).toBe(20)
    expect(r.promoDiscount).toBe(0) // jamais cumule
  })
  it('le plus avantageux gagne : promo 30% > perso 10%', () => {
    const r = resolvePersonalVsPromo(100, { type: 'percent', value: 10 }, 30)
    expect(r.winner).toBe('promo')
    expect(r.appliedDiscount).toBe(30)
    expect(r.personalDiscount).toBe(0)
  })
  it('egalite : le rabais perso l emporte', () => {
    const r = resolvePersonalVsPromo(100, { type: 'percent', value: 10 }, 10)
    expect(r.winner).toBe('personal')
  })
  it('aucun rabais => winner null, 0', () => {
    const r = resolvePersonalVsPromo(100, null, 0)
    expect(r.winner).toBeNull()
    expect(r.appliedDiscount).toBe(0)
  })
})

describe('personalDiscountLabel', () => {
  it('percent', () => expect(personalDiscountLabel({ type: 'percent', value: 15 })).toBe('-15 %'))
  it('fixed', () => expect(personalDiscountLabel({ type: 'fixed', value: 10 })).toBe('-10 $'))
  it('null => vide', () => expect(personalDiscountLabel(null)).toBe(''))
})
