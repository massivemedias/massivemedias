/**
 * FIX-CHECKOUT-CUSTOM-QTY (17 juillet 2026) - garde anti-regression du contrat
 * dual-source pour les stickers custom.
 *
 * LE BUG : le configurateur laisse le client saisir une quantite LIBRE >= 25
 * (champ "Personnalisee") et affiche un prix INTERPOLE entre les paliers. Le
 * checkout, lui, ne faisait qu'un lookup STRICT -> toute quantite hors palier
 * (150, 200, 240...) etait rejetee : "Combinaison taille/quantite invalide".
 * En prime, le back lisait la finition comme LABEL traduit ("Holographique")
 * au lieu de l'ID -> il classait toute finition fancy en matte et sous-facturait.
 *
 * CE TEST importe la fonction de prix des DEUX cotes et exige qu'elles donnent
 * le MEME prix pour tout (taille, finition, quantite) que le configurateur
 * offre. Si un jour l'un des deux derive, ce test casse au CI, pas en prod.
 *
 * On importe directement le module backend (meme pattern que skuRegistry.test.js).
 */
import { describe, it, expect } from 'vitest'
import { lookupStickerPriceCustomQty as frontPrice } from '../utils/pricingData'
import { stickerFinishes, stickerSizes } from './products'
import {
  lookupStickerPriceCustomQty as backPrice,
  resolveStickerFinishId,
} from '../../../backend/src/utils/pricing-config'

// Ce que le checkout calcule reellement pour un item panier : il resout l'ID de
// finition (finishId si present, sinon le label), puis interpole.
const backFromCart = (item) =>
  backPrice(resolveStickerFinishId(item.finishId ?? item.finish), item.quantity, item.sizeId ?? item.size)

const SIZE_IDS = stickerSizes.map((s) => s.id)          // 2, 2.5, 3, 3.5, 4, 5
const FINISH_IDS = stickerFinishes.map((f) => f.id)     // matte, clear, holographic, ...
// paliers exacts + quantites custom (dont la 150 reportee) + volume + cap + trop bas
const QTYS = [10, 24, 25, 50, 100, 150, 200, 240, 250, 333, 500, 750, 999, 1000, 1500, 2000, 3000]

describe('stickers custom : le checkout facture ce que le configurateur affiche', () => {
  it('la combinaison exacte du bug (3" x150 Matte laminé) n est plus rejetee', () => {
    const front = frontPrice('matte-pro', 150, '3')
    expect(front).not.toBeNull()
    // panier a jour : finishId present
    expect(backFromCart({ finishId: 'matte-pro', size: '3"', sizeId: '3', quantity: 150 })).toBeCloseTo(front.price, 2)
    // panier legacy : label traduit seul, pas de finishId
    expect(backFromCart({ finish: 'Matte laminé', size: '3"', quantity: 150 })).toBeCloseTo(front.price, 2)
  })

  it('front et back concordent sur TOUTE la matrice taille x finition x quantite', () => {
    const ecarts = []
    for (const size of SIZE_IDS) {
      for (const fid of FINISH_IDS) {
        for (const q of QTYS) {
          const front = frontPrice(fid, q, size)
          const back = backFromCart({ finishId: fid, size, quantity: q })
          if (front == null) {
            // le front n'offre pas cette qty (< 25) -> le back doit refuser aussi
            if (back != null) ecarts.push(`${size} ${fid} x${q}: front=null mais back=${back}`)
          } else if (back == null) {
            ecarts.push(`${size} ${fid} x${q}: REJET back (front ${front.price})`)
          } else if (Math.abs(back - front.price) > 0.01) {
            ecarts.push(`${size} ${fid} x${q}: front ${front.price} != back ${back}`)
          }
        }
      }
    }
    expect(ecarts).toEqual([])
  })

  it('les finitions fancy ne sont plus sous-facturees (bug label vs id)', () => {
    // sur un palier EXACT, une finition fx doit couter le prix fx, pas matte.
    const fx = frontPrice('holographic', 100, '2.5').price   // 100$ (standard/fx)
    const matte = frontPrice('matte', 100, '2.5').price       // 80$  (standard/matte)
    expect(fx).toBeGreaterThan(matte)
    // le back, via le label traduit, doit retomber sur le prix fx (pas matte)
    expect(backFromCart({ finish: 'Holographique', size: '2.5"', quantity: 100 })).toBeCloseTo(fx, 2)
    expect(backFromCart({ finishId: 'holographic', size: '2.5"', sizeId: '2.5', quantity: 100 })).toBeCloseTo(fx, 2)
  })

  it('resolveStickerFinishId mappe les labels FR/EN/ES et les ids vers le bon kind', () => {
    // ids directs
    expect(resolveStickerFinishId('holographic')).toBe('holographic')
    expect(resolveStickerFinishId('clear')).toBe('clear')
    expect(resolveStickerFinishId('matte')).toBe('matte')
    // labels traduits (paniers legacy)
    expect(resolveStickerFinishId('Matte laminé')).toBe('matte-pro')
    expect(resolveStickerFinishId('Verre Brisé')).toBe('broken-glass')
    expect(resolveStickerFinishId('Holográfico')).toBe('holographic')
    expect(resolveStickerFinishId('Standard')).toBe('matte')
    // inconnu -> matte (le moins cher, jamais de sur-facturation)
    expect(resolveStickerFinishId('n importe quoi')).toBe('matte')
    expect(resolveStickerFinishId('')).toBe('matte')
  })

  it('qty < 25 reste refusee des deux cotes (minimum de production)', () => {
    for (const q of [1, 10, 24]) {
      expect(frontPrice('matte', q, '3')).toBeNull()
      expect(backFromCart({ finishId: 'matte', size: '3"', quantity: q })).toBeNull()
    }
  })
})
