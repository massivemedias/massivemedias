/**
 * FIX-PRIX-PRINT (22 juillet 2026) - le checkout facture le CHOIX REEL du client.
 *
 * LE BUG : `sku-registry.ts` lisait `print.fixedTier || 'studio'` et
 * `print.fixedFormat || 'a4'`, des champs de la FICHE CMS. Or 173 des 175 prints
 * en prod n'ont aucun de ces deux champs. Le serveur facturait donc TOUJOURS
 * studio A4, quoi que le client configure. Sur 20 combinaisons, 18 divergeaient :
 *   - musee A4 (le DEFAUT du configurateur) : 30 $ affiches, 35 $ factures
 *     -> viole la regle d'or "le client ne paie jamais plus que ce qu'il voit" ;
 *   - musee A2 + cadre : 165 $ affiches, 55 $ factures -> 110 $ de perte seche.
 *
 * LE PIEGE : l'article du panier ne transporte que des LIBELLES TRADUITS.
 * Facturer sur le libelle casse des qu'on change de langue - exactement le bug
 * qui avait sous-facture la finition fancy des stickers de 20 %. D'ou les IDs
 * machine tierId/formatId, le libelle ne servant que de repli legacy.
 */
import { describe, it, expect } from 'vitest'
import { resolveSkuPrice } from '../../../backend/src/utils/sku-registry'
import { resolveArtistTier, resolveArtistFormat } from '../../../backend/src/utils/pricing-config'

// Grille de l'artiste de test = celle servie par le CMS en prod.
const PRICING = {
  studio: { postcard: 25, a4: 35, a3: 50, a3plus: 65, a2: 85 },
  museum: { postcard: 20, a4: 30, a3: 60, a3plus: 80, a2: 120 },
  framePriceByFormat: { postcard: 20, a4: 20, a3: 30, a3plus: 35, a2: 45 },
}
const ARTISTE = {
  slug: 'testartiste',
  pricing: PRICING,
  // Aucun fixedTier / fixedFormat : c'est le cas de 173 des 175 prints en prod.
  prints: [{ id: 'p1' }, { id: 'fige', fixedTier: 'studio', fixedFormat: 'a3' }],
}
const deps = { getArtists: async () => [ARTISTE] }
const pid = 'artist-print-testartiste-p1'

const achat = (extra) => resolveSkuPrice(
  { productId: pid, quantity: 1, totalPrice: 0, ...extra }, deps,
)

describe('resolveArtistTier / resolveArtistFormat', () => {
  it('accepte les IDs machine', () => {
    expect(resolveArtistTier('museum')).toBe('museum')
    expect(resolveArtistFormat('a3plus')).toBe('a3plus')
  })

  it('resout les libelles TRADUITS des 3 langues (paniers legacy)', () => {
    for (const l of ['Série Musée', 'Museum Series', 'Serie Museo']) {
      expect(resolveArtistTier(l)).toBe('museum')
    }
    for (const l of ['Série Studio', 'Studio Series']) {
      expect(resolveArtistTier(l)).toBe('studio')
    }
    expect(resolveArtistFormat('A3+ (13x19")')).toBe('a3plus')
    expect(resolveArtistFormat('A6 (4x6")')).toBe('postcard')
  })

  it('renvoie null sur l irresoluble, au lieu de deviner', () => {
    // Deviner "studio a4" est PRECISEMENT ce qui a cree le bug.
    expect(resolveArtistTier('n importe quoi')).toBeNull()
    expect(resolveArtistFormat('')).toBeNull()
  })
})

describe('checkout print artiste : 2 series x 3 formats', () => {
  const CAS = [
    ['studio', 'postcard', 25],
    ['studio', 'a4', 35],
    ['studio', 'a3', 50],
    ['museum', 'postcard', 20],
    ['museum', 'a4', 30],   // le defaut du configurateur : 35 $ factures AVANT
    ['museum', 'a3', 60],
  ]

  for (const [tier, format, attendu] of CAS) {
    it(`${tier} ${format} -> ${attendu} $`, async () => {
      const r = await achat({ tierId: tier, formatId: format })
      expect(r.ok).toBe(true)
      expect(r.price).toBe(attendu)
    })
  }

  it('musee A2 + cadre : 165 $ et non 55 $ (la perte de 110 $)', async () => {
    const r = await achat({ tierId: 'museum', formatId: 'a2', shape: 'Cadre noir' })
    expect(r.price).toBe(165) // 120 + 45
  })

  it('le cadre suit le FORMAT choisi, pas A4', async () => {
    const r = await achat({ tierId: 'studio', formatId: 'a3', shape: 'Cadre blanc' })
    expect(r.price).toBe(80) // 50 + 30, et non 35 + 20
  })
})

describe('non-regression et gardes', () => {
  it('un panier LEGACY sans IDs est facture sur son libelle traduit', async () => {
    const r = await achat({ finish: 'Série Musée', size: 'A3 (11x17")' })
    expect(r.ok).toBe(true)
    expect(r.price).toBe(60)
  })

  it('une config illisible est REFUSEE, pas devinee', async () => {
    const r = await achat({ tierId: 'zzz', formatId: 'zzz' })
    expect(r.ok).toBe(false)
    expect(r.reject).toMatch(/configuration/i)
  })

  it('fixedTier/fixedFormat de la fiche priment sur le choix client', async () => {
    // Tirage contraint : il n'existe qu'en studio A3, on ignore le choix envoye.
    const r = await resolveSkuPrice(
      { productId: 'artist-print-testartiste-fige', quantity: 1, tierId: 'museum', formatId: 'a2' },
      deps,
    )
    expect(r.price).toBe(50) // studio a3
  })

  it('un prix absent de la grille est REFUSE, plus facture 0 $', async () => {
    const sansGrille = { slug: 'vide', pricing: null, prints: [{ id: 'p1' }] }
    const r = await resolveSkuPrice(
      { productId: 'artist-print-vide-p1', quantity: 1, tierId: 'museum', formatId: 'a4' },
      { getArtists: async () => [sansGrille] },
    )
    expect(r.ok).toBe(false)
  })

  it('la quantite multiplie bien', async () => {
    const r = await resolveSkuPrice(
      { productId: pid, quantity: 3, tierId: 'studio', formatId: 'a4' }, deps,
    )
    expect(r.price).toBe(105)
  })
})
