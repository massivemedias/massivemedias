/**
 * FIX-SKU-SLUG-INCONNU (21 juillet 2026) - un slug sticker inexistant n'est plus achetable.
 *
 * SONDE PROD qui a revele le trou : `sticker-massive-slug-qui-nexiste-pas` envoye
 * a /orders/create-checkout-session a renvoye HTTP 200 avec une VRAIE session
 * Stripe LIVE. Le registre SKU validait la FAMILLE et le masquage, jamais que le
 * slug corresponde a un design reel.
 *
 * Deux consequences, la seconde etant la grave :
 *   1. des commandes pour des designs inexistants (production impossible) ;
 *   2. un design EXCLU POUR RAISON D'IP (neverPublish.js) n'est pas au catalogue,
 *      donc jamais masque explicitement : son slug passait le checkout. C'est
 *      exactement le risque IP + Stripe que neverPublish est cense fermer.
 *
 * Ce test verrouille les 2 choses :
 *   1. le miroir backend == les slugs du catalogue front (sinon un design reel
 *      devient invendable, ou un slug fantome reste vendable) ;
 *   2. resolveSkuPrice refuse un slug inconnu et accepte un slug reel.
 */
import { describe, it, expect } from 'vitest'
import { MASSIVE_STICKERS } from './massiveStickers'
import { HIDDEN_STICKERS } from './stickersModeration'
import { resolveSkuPrice } from '../../../backend/src/utils/sku-registry'
import { STICKER_CATALOG_SLUGS, isKnownStickerSlug } from '../../../backend/src/utils/sticker-catalog'

const pidOf = (slug) => `sticker-massive-${slug.replace(/^massive-/, '')}`

describe('miroir backend du catalogue sticker', () => {
  it('contient exactement les slugs du catalogue front', () => {
    const front = new Set(MASSIVE_STICKERS.map((s) => s.slug))
    expect(STICKER_CATALOG_SLUGS.size).toBe(front.size)
    const manquants = [...front].filter((s) => !STICKER_CATALOG_SLUGS.has(s))
    const enTrop = [...STICKER_CATALOG_SLUGS].filter((s) => !front.has(s))
    expect({ manquants, enTrop }).toEqual({ manquants: [], enTrop: [] })
  })

  it('reconnait un slug reel et rejette un slug fabrique', () => {
    expect(isKnownStickerSlug(MASSIVE_STICKERS[0].slug)).toBe(true)
    expect(isKnownStickerSlug('massive-slug-qui-nexiste-pas')).toBe(false)
    expect(isKnownStickerSlug('massive-')).toBe(false)
  })
})

describe('resolveSkuPrice, slug sticker inconnu', () => {
  it('REFUSE le slug exact de la sonde prod', async () => {
    const r = await resolveSkuPrice({ productId: 'sticker-massive-slug-qui-nexiste-pas', quantity: 5 })
    expect(r.ok).toBe(false)
  })

  it('refuse un slug fabrique meme avec une grosse quantite', async () => {
    const r = await resolveSkuPrice({ productId: 'sticker-massive-mario-kart', quantity: 50 })
    expect(r.ok).toBe(false)
  })

  it('accepte toujours un design reel et visible, au bon prix', async () => {
    const visible = MASSIVE_STICKERS.find((s) => !HIDDEN_STICKERS.has(s.slug))
    const r = await resolveSkuPrice({ productId: pidOf(visible.slug), quantity: 5 })
    expect(r.ok).toBe(true)
    expect(r.price).toBe(15) // 5 x 3 $
  })

  it('refuse toujours un design masque (non-regression C5)', async () => {
    const masque = [...HIDDEN_STICKERS][0]
    const r = await resolveSkuPrice({ productId: pidOf(masque), quantity: 5 })
    expect(r.ok).toBe(false)
  })

  it('ne donne pas de moyen de distinguer inconnu et masque', async () => {
    const masque = [...HIDDEN_STICKERS][0]
    const a = await resolveSkuPrice({ productId: pidOf(masque), quantity: 5 })
    const b = await resolveSkuPrice({ productId: 'sticker-massive-rien-du-tout', quantity: 5 })
    expect(a.reason).toBe(b.reason)
  })
})
