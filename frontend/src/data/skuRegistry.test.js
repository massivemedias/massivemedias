/**
 * SEC-04 : tests du registre central de SKU (whitelist du checkout public).
 * On importe DIRECTEMENT le module serveur (backend/src/utils/sku-registry.ts,
 * pur, sans dependance Strapi) : c'est le vrai code de production qui est
 * teste, pas un miroir.
 *
 * Run : cd frontend && npm run test
 *
 * Exigences du chantier :
 *   1. chaque famille legitime passe au bon prix (grille de VENTE front)
 *   2. productId inconnu rejete (le coeur de SEC-04)
 *   3. prix menteur force au prix serveur sur chaque famille
 *   4. palier inconnu rejete (fini le fallback prix client)
 */
import { describe, it, expect } from 'vitest'
import {
  resolveSkuPrice,
  getAffichePriceUnit,
  hashIpForLog,
} from '../../../backend/src/utils/sku-registry'
import {
  getArtistStickerPackPrice,
  ARTIST_STICKER_GRID,
  STICKER_GRID,
} from '../../../backend/src/utils/pricing-config'

// ---------- Fixtures CMS (deps injectees, pas de Strapi) ----------

// Paliers reels du product CMS affiche-standard (releve prod 8 juillet 2026).
const AFFICHE_PALIERS = {
  'A4': { 1: 2, 10: 1.5, 25: 1, 50: 0.75, 100: 0.6, 250: 0.5 },
  'A3': { 1: 4, 10: 3, 25: 2, 50: 1.5, 100: 1, 250: 0.75 },
  'A3+': { 1: 6, 10: 4.5, 25: 3.5, 50: 2.5, 100: 1.75, 250: 1.25 },
  'A2': { 1: 15, 10: 12, 25: 10, 50: 8, 100: 6 },
}

const FIXTURE_ARTISTS = [
  {
    slug: 'gallium',
    pricing: {
      studio: { a4: 35, a3: 50 },
      museum: { a4: 30, a3: 60 },
      framePriceByFormat: { a4: 30, a3: 30 },
    },
    prints: [
      { id: 'bardo', fixedTier: 'studio', fixedFormat: 'a4' },
      { id: 'unique-01', unique: true, customPrice: 400 },
      { id: 'solde-01', fixedTier: 'museum', fixedFormat: 'a3', onSale: true, salePercent: 50 },
      { id: 'vendu-01', sold: true },
      { id: 'reserve-01', reservedUntil: new Date(Date.now() + 10 * 60000).toISOString() },
    ],
  },
]

const FIXTURE_PRODUCTS = {
  'affiche-standard': { slug: 'affiche-standard', pricingData: { afficheStandardPaliers: AFFICHE_PALIERS } },
  'sticker-pack-maudite': { slug: 'sticker-pack-maudite', pricingData: { tiers: [
    { qty: 1, label: '1 pack', price: 35 },
    { qty: 5, label: '5 packs', price: 22 },
  ] } },
}

const deps = {
  getArtists: async () => FIXTURE_ARTISTS,
  getProductBySlug: async (slug) => FIXTURE_PRODUCTS[slug] || null,
  log: { warn: () => {}, info: () => {} },
}

const resolve = (item) => resolveSkuPrice(item, deps)

// ---------- 1. Le coeur de SEC-04 : hors registre = REFUS ----------

describe('whitelist : productId hors registre rejete', () => {
  it('productId invente -> refus avec message clair', async () => {
    const r = await resolve({ productId: 'hack-product-9000', quantity: 1, totalPrice: 0.01 })
    expect(r.ok).toBe(false)
    expect(r.family).toBe('inconnu')
    expect(r.reject).toContain('Produit non reconnu')
  })
  it('productId vide ou absent -> refus', async () => {
    expect((await resolve({ quantity: 1 })).ok).toBe(false)
    expect((await resolve({ productId: '', quantity: 1 })).ok).toBe(false)
    expect((await resolve({ productId: 42, quantity: 1 })).ok).toBe(false)
  })
  it('prefixes proches mais invalides -> refus', async () => {
    expect((await resolve({ productId: 'stickers-massive-fake', quantity: 5 })).ok).toBe(false)
    expect((await resolve({ productId: 'stk-massive', quantity: 1 })).ok).toBe(false)
  })
})

// ---------- 2. Chaque famille legitime passe au bon prix ----------

describe('familles legitimes : prix serveur exact', () => {
  it('sticker-custom : palier officiel de la grille', async () => {
    const expected = STICKER_GRID.standard.matte[100]
    const r = await resolve({ productId: 'sticker-custom', quantity: 100, size: '2"', finish: 'matte', totalPrice: expected })
    expect(r).toMatchObject({ ok: true, price: expected, family: 'sticker-custom' })
  })
  it('sticker-massive : 2 $ x quantite', async () => {
    const r = await resolve({ productId: 'sticker-massive-adian-fumeuse', quantity: 5, totalPrice: 10 })
    expect(r).toMatchObject({ ok: true, price: 10 })
  })
  it('mystery packs : 8 / 14 / 25 $', async () => {
    expect((await resolve({ productId: 'mystery-pack-5', quantity: 1 })).price).toBe(8)
    expect((await resolve({ productId: 'mystery-pack-10', quantity: 1 })).price).toBe(14)
    expect((await resolve({ productId: 'mystery-pack-20', quantity: 2 })).price).toBe(50)
  })
  it('business-card-standard 250 -> 75 $', async () => {
    const r = await resolve({ productId: 'business-card-standard', quantity: 250 })
    expect(r).toMatchObject({ ok: true, price: 75 })
  })
  it('flyer-a6 : recto 100 -> 70 $, recto-verso 100 -> 91 $', async () => {
    expect((await resolve({ productId: 'flyer-a6', quantity: 100, finish: 'Recto' })).price).toBe(70)
    expect((await resolve({ productId: 'flyer-a6', quantity: 100, finish: 'Recto-verso couleur' })).price).toBe(91)
  })
  it('artist-sticker-pack : paliers exacts de la grille', async () => {
    expect((await resolve({ productId: 'artist-sticker-pack-gallium-1782822698649', quantity: 50 })).price).toBe(85)
    expect((await resolve({ productId: 'artist-sticker-pack-psyqu33n-123', quantity: 10 })).price).toBe(19)
  })
  it('artist-sticker-pack : interpolation entre paliers (30 stickers)', async () => {
    const expected = getArtistStickerPackPrice(30)
    const r = await resolve({ productId: 'artist-sticker-pack-gallium-1', quantity: 30 })
    expect(r.price).toBe(expected)
    // encadre par les paliers 25 (45 $) et 50 (85 $)
    expect(r.price).toBeGreaterThan(ARTIST_STICKER_GRID[25])
    expect(r.price).toBeLessThan(ARTIST_STICKER_GRID[50])
  })
  it('artist-print : base + cadre depuis le CMS', async () => {
    const r = await resolve({ productId: 'artist-print-gallium-bardo', quantity: 1, shape: 'Cadre noir', totalPrice: 65 })
    expect(r).toMatchObject({ ok: true, price: 65, family: 'artist-print' })
  })
  it('artist-print unique : customPrice, quantite forcee a 1', async () => {
    const r = await resolve({ productId: 'artist-print-gallium-unique-01', quantity: 3, totalPrice: 400 })
    expect(r.price).toBe(400)
  })
  it('artist-print en solde : discount applique', async () => {
    // museum a3 60 + cadre 30 = 90, -50% = 45
    const r = await resolve({ productId: 'artist-print-gallium-solde-01', quantity: 1, shape: 'frame', totalPrice: 45 })
    expect(r.price).toBe(45)
  })
  it('affiche-standard : palier CMS x quantite (A4 x 100 -> 60 $)', async () => {
    const r = await resolve({ productId: 'affiche-standard', sku: 'affiche-standard-a4', quantity: 100, totalPrice: 60 })
    expect(r).toMatchObject({ ok: true, price: 60 })
  })
  it('affiche-standard : format a3plus mappe sur la cle CMS A3+', async () => {
    const r = await resolve({ productId: 'affiche-standard', sku: 'affiche-standard-a3plus', quantity: 25 })
    expect(r.price).toBe(3.5 * 25)
  })
  it('fine-art : grille de VENTE front (studio a4 10 $, museum a2 55 $)', async () => {
    expect((await resolve({ productId: 'fine-art-print', sku: 'fine-art-studio-a4', quantity: 1 })).price).toBe(10)
    expect((await resolve({ productId: 'fine-art-print', sku: 'fine-art-museum-a2', quantity: 1 })).price).toBe(55)
  })
  it('fine-art avec cadre : base + frame du format', async () => {
    const r = await resolve({ productId: 'fine-art-print', sku: 'fine-art-museum-a3-frame-black', quantity: 2 })
    expect(r.price).toBe((30 + 30) * 2)
  })
  it('fine-art format carre (sq10 museum 25 $)', async () => {
    const r = await resolve({ productId: 'fine-art-print', sku: 'fine-art-museum-sq10', quantity: 1 })
    expect(r.price).toBe(25)
  })
  it('deposit-flash : 40 $ fixe, quantite ignoree', async () => {
    expect((await resolve({ productId: 'deposit-flash-abc123', quantity: 1 })).price).toBe(40)
    expect((await resolve({ productId: 'deposit-flash-abc123', quantity: 9 })).price).toBe(40)
  })
  it('gift-card : montant du SKU dans les bornes', async () => {
    expect((await resolve({ productId: 'gift-card-25', quantity: 1 })).price).toBe(25)
    expect((await resolve({ productId: 'gift-card-500', quantity: 1 })).price).toBe(500)
  })
  it('sale-stk-massive : 20 $', async () => {
    expect((await resolve({ productId: 'sale-stk-massive', quantity: 1 })).price).toBe(20)
  })
  it('packs boutique : tiers CMS prioritaires (sticker-pack-maudite x5 -> 22 x 5)', async () => {
    const r = await resolve({ productId: 'sticker-pack-maudite-x5', quantity: 1 })
    expect(r.price).toBe(110)
  })
  it('packs boutique : fallback grille par defaut (stk-massive x5 -> 25 x 5)', async () => {
    const r = await resolve({ productId: 'stk-massive-x5', quantity: 1 })
    expect(r.price).toBe(125)
  })
  it('sublimation : palier exact, base sans design', async () => {
    const r = await resolve({ productId: 'sublimation-tshirt', quantity: 5, totalPrice: 135 })
    expect(r.price).toBe(135)
  })
  it('sublimation avec design : base + 125 $ accepte tel quel', async () => {
    const r = await resolve({ productId: 'sublimation-tshirt', quantity: 5, totalPrice: 260 })
    expect(r.price).toBe(260)
  })
  it('sublimation BYOT : blank deduit ((27-12) x 5 = 75 $)', async () => {
    const r = await resolve({ productId: 'sublimation-tshirt-byot', quantity: 5, totalPrice: 75 })
    expect(r.price).toBe(75)
  })
  it('merch : prix plat par type x quantite', async () => {
    expect((await resolve({ productId: 'merch-tshirt-black-XL', quantity: 2 })).price).toBe(44)
    expect((await resolve({ productId: 'merch-hoodie-forest-M', quantity: 1 })).price).toBe(39)
  })
})

// ---------- 3. Prix menteur force au prix serveur ----------

describe('prix menteur : toujours ecrase par le serveur', () => {
  const CASES = [
    [{ productId: 'sticker-massive-x', quantity: 5, totalPrice: 0.01 }, 10],
    [{ productId: 'mystery-pack-20', quantity: 1, totalPrice: 0.01 }, 25],
    [{ productId: 'sticker-custom', quantity: 100, size: '2"', finish: 'matte', totalPrice: 0.01 }, STICKER_GRID.standard.matte[100]],
    [{ productId: 'business-card-premium', quantity: 500, totalPrice: 1 }, 250],
    [{ productId: 'flyer-a6', quantity: 50, finish: 'Recto', totalPrice: 2 }, 40],
    [{ productId: 'artist-sticker-pack-gallium-1', quantity: 100, totalPrice: 3 }, 150],
    [{ productId: 'affiche-standard', sku: 'affiche-standard-a2', quantity: 10, totalPrice: 0.5 }, 120],
    [{ productId: 'fine-art-print', sku: 'fine-art-studio-a3plus', quantity: 1, totalPrice: 0.01 }, 20],
    [{ productId: 'deposit-flash-1', quantity: 1, totalPrice: 0.01 }, 40],
    [{ productId: 'gift-card-100', quantity: 1, totalPrice: 1 }, 100],
    [{ productId: 'sale-stk-massive', quantity: 1, totalPrice: 0.01 }, 20],
    [{ productId: 'stk-psyqu33n-x10', quantity: 1, totalPrice: 5 }, 200],
    [{ productId: 'sublimation-hoodie', quantity: 1, totalPrice: 0.01 }, 50],
    [{ productId: 'merch-longsleeve-black-S', quantity: 1, totalPrice: 0.01 }, 30],
  ]
  for (const [item, expected] of CASES) {
    it(`${item.productId} menteur ${item.totalPrice} $ -> force ${expected} $`, async () => {
      const r = await resolve(item)
      expect(r.ok).toBe(true)
      expect(r.price).toBe(expected)
    })
  }
  it('artist-print menteur -> prix CMS force (35 $ sans cadre)', async () => {
    const r = await resolve({ productId: 'artist-print-gallium-bardo', quantity: 1, totalPrice: 0.01 })
    expect(r).toMatchObject({ ok: true, price: 35 })
  })
})

// ---------- 4. Paliers inconnus rejetes (fini le fallback client) ----------

describe('paliers inconnus : rejet explicite', () => {
  it('sticker-custom qty hors grille -> refus (avant : prix client accepte !)', async () => {
    const r = await resolve({ productId: 'sticker-custom', quantity: 37, size: '2"', finish: 'matte', totalPrice: 9999 })
    expect(r.ok).toBe(false)
  })
  it('business-card qty 300 et variante inconnue -> refus', async () => {
    expect((await resolve({ productId: 'business-card-standard', quantity: 300, totalPrice: 1 })).ok).toBe(false)
    expect((await resolve({ productId: 'business-card-gold', quantity: 100, totalPrice: 1 })).ok).toBe(false)
  })
  it('flyer qty 75 -> refus', async () => {
    expect((await resolve({ productId: 'flyer-a6', quantity: 75, finish: 'Recto', totalPrice: 1 })).ok).toBe(false)
  })
  it('mystery-pack-7 -> refus', async () => {
    expect((await resolve({ productId: 'mystery-pack-7', quantity: 1 })).ok).toBe(false)
  })
  it('artist-sticker-pack sous le minimum 10 -> refus', async () => {
    expect((await resolve({ productId: 'artist-sticker-pack-gallium-1', quantity: 5 })).ok).toBe(false)
  })
  it('gift-card hors bornes ou non entiere -> refus', async () => {
    expect((await resolve({ productId: 'gift-card-9', quantity: 1 })).ok).toBe(false)
    expect((await resolve({ productId: 'gift-card-501', quantity: 1 })).ok).toBe(false)
    expect((await resolve({ productId: 'gift-card-abc', quantity: 1 })).ok).toBe(false)
    expect((await resolve({ productId: 'gift-card-49.99', quantity: 1 })).ok).toBe(false)
  })
  it('pack boutique palier inexistant (x3) -> refus', async () => {
    expect((await resolve({ productId: 'stk-massive-x3', quantity: 1 })).ok).toBe(false)
  })
  it('sublimation qty hors palier ou produit inconnu -> refus', async () => {
    expect((await resolve({ productId: 'sublimation-tshirt', quantity: 7, totalPrice: 189 })).ok).toBe(false)
    expect((await resolve({ productId: 'sublimation-cape', quantity: 1, totalPrice: 30 })).ok).toBe(false)
  })
  it('merch type inconnu -> refus', async () => {
    expect((await resolve({ productId: 'merch-cap-black-M', quantity: 1, totalPrice: 15 })).ok).toBe(false)
  })
  it('fine-art sku illisible, format inconnu ou studio indisponible -> refus', async () => {
    expect((await resolve({ productId: 'fine-art-print', sku: 'fine-art-deluxe-a4', quantity: 1 })).ok).toBe(false)
    expect((await resolve({ productId: 'fine-art-print', sku: 'fine-art-studio-a9', quantity: 1 })).ok).toBe(false)
    expect((await resolve({ productId: 'fine-art-print', sku: 'fine-art-studio-a2', quantity: 1 })).ok).toBe(false)
    expect((await resolve({ productId: 'fine-art-print', quantity: 1 })).ok).toBe(false)
  })
  it('affiche-standard format hors mapping -> refus', async () => {
    expect((await resolve({ productId: 'affiche-standard', sku: 'affiche-standard-sq8', quantity: 10 })).ok).toBe(false)
    expect((await resolve({ productId: 'affiche-standard', quantity: 10 })).ok).toBe(false)
  })
})

// ---------- 5. Validations CMS artist-print (deplacees de la boucle 2) ----------

describe('artist-print : regles CMS preservees', () => {
  it('oeuvre vendue -> refus', async () => {
    const r = await resolve({ productId: 'artist-print-gallium-vendu-01', quantity: 1, totalPrice: 35 })
    expect(r.ok).toBe(false)
    expect(r.reject).toContain('vendue')
  })
  it('oeuvre reservee par un autre client -> refus temporaire', async () => {
    const r = await resolve({ productId: 'artist-print-gallium-reserve-01', quantity: 1, totalPrice: 35 })
    expect(r.ok).toBe(false)
    expect(r.reject).toContain('reservee')
  })
  it('print ou artiste introuvable -> refus', async () => {
    expect((await resolve({ productId: 'artist-print-gallium-fantome', quantity: 1 })).ok).toBe(false)
    expect((await resolve({ productId: 'artist-print-inconnu-x', quantity: 1 })).ok).toBe(false)
  })
  it('CMS indisponible (deps absentes) -> refus propre, pas de crash', async () => {
    const r = await resolveSkuPrice({ productId: 'artist-print-gallium-bardo', quantity: 1 }, {})
    expect(r.ok).toBe(false)
  })
})

// ---------- 6. Helpers ----------

describe('getAffichePriceUnit (portage exact du front)', () => {
  it('palier le plus eleve <= qty', () => {
    expect(getAffichePriceUnit('A4', 100, AFFICHE_PALIERS)).toBe(0.6)
    expect(getAffichePriceUnit('A4', 99, AFFICHE_PALIERS)).toBe(0.75)
    expect(getAffichePriceUnit('A2', 500, AFFICHE_PALIERS)).toBe(6)
  })
  it('entrees invalides -> null', () => {
    expect(getAffichePriceUnit('A4', 0, AFFICHE_PALIERS)).toBeNull()
    expect(getAffichePriceUnit('A9', 10, AFFICHE_PALIERS)).toBeNull()
    expect(getAffichePriceUnit('A4', 10, null)).toBeNull()
    expect(getAffichePriceUnit('A4', 2.5, AFFICHE_PALIERS)).toBeNull()
  })
})

describe('hashIpForLog (Loi 25)', () => {
  it('sans salt configure -> chaine vide (jamais d IP en clair)', () => {
    const prev = process.env.QR_IP_HASH_SALT
    delete process.env.QR_IP_HASH_SALT
    expect(hashIpForLog('1.2.3.4')).toBe('')
    if (prev != null) process.env.QR_IP_HASH_SALT = prev
  })
  it('avec salt -> hash 16 hex stable, jamais l IP brute', () => {
    const prev = process.env.QR_IP_HASH_SALT
    process.env.QR_IP_HASH_SALT = 'test-salt'
    const h = hashIpForLog('1.2.3.4')
    expect(h).toMatch(/^[0-9a-f]{16}$/)
    expect(h).not.toContain('1.2.3.4')
    expect(hashIpForLog('1.2.3.4')).toBe(h)
    if (prev != null) process.env.QR_IP_HASH_SALT = prev
    else delete process.env.QR_IP_HASH_SALT
  })
})
