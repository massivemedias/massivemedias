/**
 * C5 (AUDIT-ENDPOINTS, 17 juillet 2026) - un design MASQUE n'est plus achetable.
 *
 * HIDDEN_STICKERS masque des designs cote front (UI). Le masquage etait UI-only :
 * le SKU sticker-massive-<slug> resolvait toujours son prix au checkout, donc un
 * design masque restait ACHETABLE (favori enregistre avant le masquage, panier
 * force). Le back a maintenant un MIROIR (hidden-stickers.ts) et refuse au checkout.
 *
 * Ce test verrouille les 2 choses :
 *   1. le miroir backend == la liste front (sinon un design masque au front reste
 *      vendable, ou un design visible est refuse a tort) ;
 *   2. resolveSkuPrice refuse un slug masque et accepte un slug visible.
 */
import { describe, it, expect } from 'vitest'
import { HIDDEN_STICKERS } from './stickersModeration'
import { MASSIVE_STICKERS } from './massiveStickers'
import { resolveSkuPrice } from '../../../backend/src/utils/sku-registry'
import { HIDDEN_STICKER_SLUGS, isHiddenStickerSlug } from '../../../backend/src/utils/hidden-stickers'

describe('HIDDEN stickers : dual-source front/back + blocage checkout', () => {
  it('le miroir backend est identique a HIDDEN_STICKERS du front', () => {
    const front = [...HIDDEN_STICKERS].sort()
    const back = [...HIDDEN_STICKER_SLUGS].sort()
    expect(back).toEqual(front)
  })

  it('resolveSkuPrice REFUSE un design masque au checkout', async () => {
    const hidden = [...HIDDEN_STICKERS][0]
    const res = await resolveSkuPrice({ productId: `sticker-massive-${hidden}`, quantity: 5, totalPrice: 15 }, {})
    expect(res.ok).toBe(false)
    expect(res.reject).toMatch(/plus disponible/i)
  })

  it('resolveSkuPrice ACCEPTE un design visible (non masque)', async () => {
    const visible = MASSIVE_STICKERS.find((s) => !isHiddenStickerSlug(s.slug))
    const res = await resolveSkuPrice({ productId: `sticker-massive-${visible.slug}`, quantity: 5, totalPrice: 15 }, {})
    expect(res.ok).toBe(true)
    expect(res.price).toBe(15) // 5 x 3 $
  })

  it('tous les slugs masques existent au catalogue (pas de typo qui rend le masque inoperant)', () => {
    const catalogue = new Set(MASSIVE_STICKERS.map((s) => s.slug))
    const fantomes = [...HIDDEN_STICKERS].filter((s) => !catalogue.has(s))
    expect(fantomes).toEqual([])
  })
})
