/**
 * FIX-FLYER-ES (17 juillet 2026) - garde anti-regression flyers recto-verso.
 *
 * LE BUG : le configurateur envoyait le cote en LABEL traduit ("Doble cara" en
 * ES), et le back detectait le recto-verso via includes('recto-verso') ||
 * includes('double'). "Doble cara" ne matchait ni l'un ni l'autre -> un client
 * espagnol commandant recto-verso etait facture au prix RECTO (sous-facturation).
 *
 * LE FIX : l'ID de cote (item.sideId) voyage jusqu'au checkout, le back le lit
 * en priorite. Repli sur le label (+ 'doble') pour les paniers legacy.
 *
 * Ce test croise le prix front et le prix back pour les 2 cotes x 5 quantites x
 * 3 langues, paniers a jour ET legacy.
 */
import { describe, it, expect } from 'vitest'
import { lookupFlyerPrice } from '../utils/pricingData'
import { resolveSkuPrice } from '../../../backend/src/utils/sku-registry'

const LAB = {
  recto: { fr: 'Recto', en: 'Front only', es: 'Solo frente' },
  'recto-verso': { fr: 'Recto-verso', en: 'Double-sided', es: 'Doble cara' },
}
const QTY = [50, 100, 150, 250, 500]

describe('flyers : le checkout facture le bon cote dans les 3 langues', () => {
  it('la combinaison du bug (recto-verso ES) n est plus sous-facturee', async () => {
    const front = lookupFlyerPrice('recto-verso', 100).price // 91 $
    // panier a jour (sideId)
    const a = await resolveSkuPrice({ productId: 'flyer-a6', finish: 'Doble cara', sideId: 'recto-verso', quantity: 100, totalPrice: front }, {})
    expect(a.price).toBeCloseTo(front, 2)
    // panier legacy (label ES seul, pas de sideId) -> repli 'doble'
    const b = await resolveSkuPrice({ productId: 'flyer-a6', finish: 'Doble cara', quantity: 100, totalPrice: front }, {})
    expect(b.price).toBeCloseTo(front, 2)
    // et surtout : ce n'est PAS le prix recto (70 $)
    expect(a.price).not.toBe(lookupFlyerPrice('recto', 100).price)
  })

  it('front == back sur cote x quantite x langue (a jour ET legacy)', async () => {
    const ecarts = []
    for (const side of ['recto', 'recto-verso']) {
      for (const q of QTY) {
        for (const lang of ['fr', 'en', 'es']) {
          const front = lookupFlyerPrice(side, q).price
          const withId = await resolveSkuPrice({ productId: 'flyer-a6', finish: LAB[side][lang], sideId: side, quantity: q, totalPrice: front }, {})
          const legacy = await resolveSkuPrice({ productId: 'flyer-a6', finish: LAB[side][lang], quantity: q, totalPrice: front }, {})
          if (!withId.ok || Math.abs(withId.price - front) > 0.01) ecarts.push(`sideId ${side} x${q} ${lang}: ${front} != ${withId.price}`)
          if (!legacy.ok || Math.abs(legacy.price - front) > 0.01) ecarts.push(`legacy ${side} x${q} ${lang}: ${front} != ${legacy.price}`)
        }
      }
    }
    expect(ecarts).toEqual([])
  })
})
