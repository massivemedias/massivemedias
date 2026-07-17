// =======================================================
// SEC-04 (8 juillet 2026) : registre central des familles de SKU vendables
// au checkout public. WHITELIST STRICTE : tout productId doit correspondre
// a une famille connue avec un prix calculable serveur, sinon la creation
// de session echoue en 400 avec un message clair. Fini le fallback
// "validPrice = item.totalPrice || 0" (prix client accepte tel quel sur
// Stripe LIVE = faille de manipulation de prix).
//
// Les DEUX chemins de checkout (createPaymentIntent et createCheckoutSession
// dans api/order/controllers/order.ts) passent par resolveSkuPrice. Aucune
// divergence de validation entre les deux boucles.
//
// Regle d'or : le prix force serveur = la grille de VENTE affichee par le
// front (le client ne paie JAMAIS plus que ce qu'il voit). Les grilles
// miroir vivent dans pricing-config.ts.
// =======================================================
import crypto from 'crypto'
import {
  lookupStickerPriceCustomQty,
  resolveStickerFinishId,
} from './pricing-config'
import { isHiddenStickerSlug } from './hidden-stickers'
import {
  STICKER_COLLECTION_UNIT_PRICE,
  MYSTERY_PACK_PRICES,
  ETIQUETTE_PACK_PRICES,
  BUSINESS_CARD_TIERS,
  FLYER_TIERS,
  FLYER_RECTO_VERSO_TIERS,
  SUBLIMATION_UNIT_PRICES,
  SUBLIMATION_DESIGN_FEE,
  SUBLIMATION_BLANK_COST,
  SUBLIMATION_BYOT_ALLOWED,
  getArtistStickerPackPrice,
  DEPOSIT_FLASH_PRICE,
  SALE_ITEM_PRICES,
  STICKER_PACK_DEFAULT_TIERS,
  MERCH_PRICES,
  GIFT_CARD_MIN,
  GIFT_CARD_MAX,
  FINE_ART_SALE_GRID,
} from './pricing-config'

export interface CartItemLike {
  productId?: any
  sku?: any
  quantity?: any
  totalPrice?: any
  size?: any
  sizeId?: any
  finish?: any
  finishId?: any
  shape?: any
  bringOwnGarment?: any
}

// Dependances injectees par le controller (cache par requete cote caller).
// Le registre reste un module pur : testable en vitest sans Strapi.
export interface SkuDeps {
  // Artistes actifs (pour artist-print-*). Absent = famille rejetee proprement.
  getArtists?: () => Promise<any[]>
  // Produit CMS par slug (affiche-standard, packs sticker-pack). Doit
  // retourner null si introuvable, throw si le CMS est injoignable.
  getProductBySlug?: (slug: string) => Promise<any | null>
  log?: { info?: (msg: string) => void; warn?: (msg: string) => void }
}

export interface SkuResolution {
  ok: boolean
  // Prix TOTAL force serveur (present quand ok=true).
  price?: number
  // Message de refus FR pret a afficher au client (present quand ok=false).
  reject?: string
  family: string
}

const okRes = (family: string, price: number): SkuResolution => ({
  ok: true,
  family,
  price: Math.round(price * 100) / 100,
})
const rejectRes = (family: string, reject: string): SkuResolution => ({ ok: false, family, reject })

// Quantite panier saine : entier >= 1 (le front envoie deja des entiers,
// on se blinde contre les payloads forges).
function cleanQty(item: CartItemLike): number {
  const q = Math.floor(Number(item?.quantity))
  return Number.isFinite(q) && q >= 1 ? q : 1
}

// Prix UNITAIRE Affiches Standard au palier le plus eleve <= qty.
// Portage exact de getAffichePrice (frontend/src/data/products.js) : memes
// validations, meme selection de palier.
export function getAffichePriceUnit(
  formatKey: string | null,
  qty: number,
  paliers: any,
): number | null {
  if (!paliers || typeof paliers !== 'object' || Array.isArray(paliers)) return null
  if (typeof formatKey !== 'string' || formatKey.length === 0) return null
  if (typeof qty !== 'number' || !Number.isFinite(qty) || !Number.isInteger(qty) || qty <= 0) return null
  const formatPaliers = paliers[formatKey]
  if (!formatPaliers || typeof formatPaliers !== 'object' || Array.isArray(formatPaliers)) return null
  const validPaliers = Object.entries(formatPaliers)
    .map(([k, v]) => [Number(k), v] as [number, any])
    .filter(([k, v]) => Number.isInteger(k) && k > 0 && typeof v === 'number' && Number.isFinite(v) && v > 0)
    .sort((a, b) => a[0] - b[0])
  if (validPaliers.length === 0) return null
  let selectedPrice: number | null = null
  for (const [palier, price] of validPaliers) {
    if (palier <= qty) selectedPrice = price
    else break
  }
  return selectedPrice
}

// Mapping format SKU (minuscule) -> cle palier CMS (majuscule), miroir de
// FORMAT_ID_TO_PALIER_KEY (ConfiguratorFineArt.jsx).
const AFFICHE_FORMAT_TO_PALIER_KEY: Record<string, string> = {
  a4: 'A4',
  a3: 'A3',
  a3plus: 'A3+',
  a2: 'A2',
}

// Hash IP conforme Loi 25 pour le logging des refus : sha256(ip + salt),
// jamais d'IP en clair. Reutilise le salt existant QR_IP_HASH_SALT (deja
// configure sur Render pour les scans QR) - zero nouveau secret.
export function hashIpForLog(ip: any): string {
  const clean = String(ip || '').trim()
  const salt = process.env.QR_IP_HASH_SALT || ''
  if (!clean || !salt) return ''
  return crypto.createHash('sha256').update(clean + salt).digest('hex').slice(0, 16)
}

/**
 * Resout le prix serveur d'un item du panier public.
 * - { ok: true, price, family } : prix TOTAL force serveur pour cet item.
 * - { ok: false, reject, family } : item refuse, message client FR pret a
 *   afficher (CheckoutForm montre error.message dans son bandeau rouge).
 * Ne trust JAMAIS item.totalPrice, sauf tolerance d'arrondi artist-print
 * (1 cent) heritee de la validation CMS existante.
 */
export async function resolveSkuPrice(item: CartItemLike, deps: SkuDeps = {}): Promise<SkuResolution> {
  const pid = typeof item?.productId === 'string' ? item.productId : ''
  const qty = cleanQty(item)

  if (!pid) {
    return rejectRes('inconnu', 'Un article du panier n\'a pas d\'identifiant de produit. Vide ton panier et recommence.')
  }

  // --- Stickers custom / artiste : grille officielle 3 paliers de taille.
  // SEC-04 : palier inconnu = REJET (avant : fallback prix client + warn).
  //
  // FIX-CHECKOUT-CUSTOM-QTY (17 juillet 2026) : le configurateur laisse le client
  // saisir une quantite LIBRE >= 25 et affiche un prix INTERPOLE entre paliers
  // (lookupStickerPriceCustomQty). Le back ne faisait qu'un lookup STRICT, donc
  // toute quantite hors palier (150, 200, 240...) etait rejetee. On appelle
  // maintenant le MEME miroir d'interpolation que le front.
  //
  // La finition doit etre resolue en ID (matte/clear/holographic/...), PAS lue
  // comme label : le prix depend du KIND, que le front calcule depuis l'ID.
  // item.finishId (paniers a jour) prime ; sinon on retombe sur le label traduit
  // via resolveStickerFinishId (paniers legacy).
  if (pid === 'sticker-custom' || pid === 'sticker-artist') {
    const finishId = resolveStickerFinishId(item.finishId ?? item.finish)
    const sizeForPrice = item.sizeId ?? item.size
    const tierPrice = lookupStickerPriceCustomQty(finishId, item.quantity, sizeForPrice)
    if (tierPrice == null) {
      return rejectRes('sticker-custom', `Combinaison taille/quantite invalide pour les stickers (taille: ${item.size || '?'}, quantite: ${item.quantity || '?'}). Choisis un palier du configurateur.`)
    }
    return okRes('sticker-custom', tierPrice)
  }

  // --- Collection Massive (STICKERS-SHOP-B) : 3 $ / design.
  if (pid.startsWith('sticker-massive-')) {
    // C5 (AUDIT-ENDPOINTS) : un design MASQUE (HIDDEN_STICKERS, NSFW/retrait)
    // n'est plus achetable. Le masquage etait UI-only cote front ; un favori
    // enregistre avant le masquage, ou un panier force, passait quand meme le
    // checkout. On refuse ici, source de verite serveur (miroir hidden-stickers.ts).
    const slug = pid.slice('sticker-massive-'.length)
    if (isHiddenStickerSlug(slug)) {
      return rejectRes('sticker-massive', `Ce design n'est plus disponible a la vente.`)
    }
    return okRes('sticker-massive', qty * STICKER_COLLECTION_UNIT_PRICE)
  }

  // --- Mystery packs : 3 tailles fixes, taille inconnue rejetee.
  if (pid.startsWith('mystery-pack-')) {
    const packSize = parseInt(pid.replace('mystery-pack-', ''), 10)
    const packPrice = MYSTERY_PACK_PRICES[packSize]
    if (packPrice == null) {
      return rejectRes('mystery-pack', `Mystery pack invalide: ${pid}`)
    }
    return okRes('mystery-pack', packPrice * qty)
  }

  // --- Mini Massive (etiquettes enfants) : 3 packs a prix fixe. La config
  // (design, prenom, police, coins...) voyage dans item.* mais NE change PAS le
  // prix : seul le pack compte. Pack inconnu rejete.
  if (pid.startsWith('etiquette-pack-')) {
    const packId = pid.slice('etiquette-pack-'.length)
    const packPrice = ETIQUETTE_PACK_PRICES[packId]
    if (packPrice == null) {
      return rejectRes('etiquette-pack', `Pack etiquette invalide: ${pid}`)
    }
    return okRes('etiquette-pack', packPrice * qty)
  }

  // --- Cartes d'affaires : paliers stricts par variante.
  if (pid.startsWith('business-card-')) {
    const cardTiers = BUSINESS_CARD_TIERS[pid]
    const tierPrice = cardTiers ? cardTiers[qty] : null
    if (tierPrice == null) {
      return rejectRes('business-card', `Palier cartes d'affaires invalide (${pid}, quantite ${qty}). Quantites valides: 100, 250, 500${pid.endsWith('premium') ? '' : ', 1000'}.`)
    }
    return okRes('business-card', tierPrice)
  }

  // --- Flyers A6 : grille stricte recto / recto-verso.
  if (pid === 'flyer-a6') {
    const finishLower = String(item.finish || '').toLowerCase()
    const isRectoVerso = finishLower.includes('recto-verso') || finishLower.includes('double')
    const grid = isRectoVerso ? FLYER_RECTO_VERSO_TIERS : FLYER_TIERS
    const tierPrice = grid[qty]
    if (tierPrice == null) {
      return rejectRes('flyer', `Quantite de flyers invalide (${qty}). Quantites valides: 50, 100, 150, 250, 500.`)
    }
    return okRes('flyer', tierPrice)
  }

  // --- Packs stickers d'artiste (configurateur) : grille + interpolation,
  // minimum 10. Le timestamp du SKU n'influence pas le prix (grille unique).
  if (pid.startsWith('artist-sticker-pack-')) {
    const price = getArtistStickerPackPrice(qty)
    if (price == null) {
      return rejectRes('artist-sticker-pack', `Minimum 10 stickers par pack d'artiste (quantite recue: ${qty}).`)
    }
    return okRes('artist-sticker-pack', price)
  }

  // --- Prints d'artiste : validation CMS complete (deplacee de la boucle
  // createCheckoutSession, comportement identique, maintenant appliquee aux
  // DEUX chemins de checkout).
  if (pid.startsWith('artist-print-')) {
    if (!deps.getArtists) {
      return rejectRes('artist-print', 'Validation du prix impossible, reessayez plus tard')
    }
    try {
      const artists = await deps.getArtists()
      let matchedArtist: any = null
      let printId = ''
      for (const a of artists) {
        if (pid.startsWith(`artist-print-${a.slug}-`)) {
          if (!matchedArtist || a.slug.length > matchedArtist.slug.length) {
            matchedArtist = a
            printId = pid.replace(`artist-print-${a.slug}-`, '')
          }
        }
      }
      if (!matchedArtist || !printId) {
        return rejectRes('artist-print', `Print introuvable: ${pid}`)
      }
      const prints = Array.isArray(matchedArtist.prints) ? matchedArtist.prints : []
      const print = prints.find((p: any) => p.id === printId)
      if (!print) {
        return rejectRes('artist-print', `Print ${printId} introuvable chez ${matchedArtist.slug}`)
      }
      if (print.sold === true) {
        return rejectRes('artist-print', `Cette oeuvre a deja ete vendue et n'est plus disponible.`)
      }
      // RACE-01 : reservee par un autre checkout actif = refus temporaire.
      const reservedUntilTs = print.reservedUntil ? new Date(print.reservedUntil).getTime() : 0
      if (reservedUntilTs > Date.now()) {
        const minsLeft = Math.max(1, Math.ceil((reservedUntilTs - Date.now()) / 60000))
        return rejectRes('artist-print', `Cette oeuvre est actuellement reservee par un autre client (dispo dans ${minsLeft} min si le paiement echoue).`)
      }
      const pricing = matchedArtist.pricing || {}
      const tier = print.fixedTier || 'studio'
      const format = print.fixedFormat || 'a4'
      const tierPrices = tier === 'museum' ? (pricing.museum || {}) : (pricing.studio || {})
      const basePrice = tierPrices[format] || 0
      const frameMap = pricing.framePriceByFormat || {}
      const expectedFramePrice = (print.withFrame || item.shape)
        ? (frameMap[format] ?? FINE_ART_SALE_GRID[format]?.frame ?? 30)
        : 0
      let expectedUnitPrice: number
      if (print.unique === true && typeof print.customPrice === 'number') {
        expectedUnitPrice = print.customPrice
      } else {
        expectedUnitPrice = basePrice + expectedFramePrice
      }
      if (print.onSale && typeof print.salePercent === 'number') {
        expectedUnitPrice = Math.round(expectedUnitPrice * (1 - print.salePercent / 100) * 100) / 100
      }
      const effQty = (print.unique === true || print.private === true) ? 1 : qty
      const expectedTotal = Math.round(expectedUnitPrice * effQty * 100) / 100
      // Tolerance 1 cent pour les arrondis client (comportement herite).
      if (Math.abs((Number(item.totalPrice) || 0) - expectedTotal) > 0.01) {
        deps.log?.warn?.(`Prix manipule detecte: ${pid} client=${item.totalPrice} expected=${expectedTotal}`)
        return okRes('artist-print', expectedTotal)
      }
      return okRes('artist-print', Number(item.totalPrice))
    } catch (_) {
      return rejectRes('artist-print', 'Validation du prix impossible, reessayez plus tard')
    }
  }

  // --- Affiches Standard (volume B2B) : paliers CMS uniquement, format
  // encode dans le SKU (affiche-standard-<format>).
  if (pid === 'affiche-standard') {
    const sku = typeof item.sku === 'string' ? item.sku : ''
    const format = sku.startsWith('affiche-standard-') ? sku.replace('affiche-standard-', '') : ''
    const palierKey = AFFICHE_FORMAT_TO_PALIER_KEY[format.toLowerCase()]
    if (!palierKey) {
      return rejectRes('affiche-standard', `Format d'affiche invalide (${format || 'absent'}). Formats valides: A4, A3, A3+, A2.`)
    }
    if (!deps.getProductBySlug) {
      return rejectRes('affiche-standard', 'Validation du prix impossible, reessayez plus tard')
    }
    try {
      const product = await deps.getProductBySlug('affiche-standard')
      const paliers = product?.pricingData?.afficheStandardPaliers || null
      const unit = getAffichePriceUnit(palierKey, qty, paliers)
      if (unit == null) {
        return rejectRes('affiche-standard', `Quantite invalide pour les Affiches Standard (${qty} x ${palierKey}).`)
      }
      return okRes('affiche-standard', unit * qty)
    } catch (_) {
      return rejectRes('affiche-standard', 'Validation du prix impossible, reessayez plus tard')
    }
  }

  // --- Fine Art (Studio / Musee) : grille de vente par format, cadre inclus
  // selon le SKU fine-art-<tier>-<format>[-frame-<color>].
  if (pid === 'fine-art-print') {
    const sku = typeof item.sku === 'string' ? item.sku : ''
    const m = sku.match(/^fine-art-(studio|museum)-([a-z0-9+]+?)(-frame-(black|white))?$/)
    if (!m) {
      return rejectRes('fine-art', 'Configuration Fine Art illisible. Repasse par le configurateur.')
    }
    const tier = m[1] as 'studio' | 'museum'
    const format = m[2]
    const withFrame = !!m[3]
    const entry = FINE_ART_SALE_GRID[format]
    if (!entry) {
      return rejectRes('fine-art', `Format Fine Art invalide: ${format}.`)
    }
    const base = tier === 'studio' ? entry.studio : entry.museum
    if (base == null) {
      return rejectRes('fine-art', `Le format ${format} n'est pas disponible en Serie Studio.`)
    }
    const unit = base + (withFrame ? entry.frame : 0)
    return okRes('fine-art', unit * qty)
  }

  // --- Depot de reservation flash tattoo : montant fixe, quantite forcee 1.
  if (pid.startsWith('deposit-flash-')) {
    return okRes('deposit-flash', DEPOSIT_FLASH_PRICE)
  }

  // --- Cartes cadeaux : montant libre ENTIER encode dans le SKU, borne.
  if (pid.startsWith('gift-card-')) {
    const amountStr = pid.replace('gift-card-', '')
    const amount = /^\d+$/.test(amountStr) ? parseInt(amountStr, 10) : NaN
    if (!Number.isInteger(amount) || amount < GIFT_CARD_MIN || amount > GIFT_CARD_MAX) {
      return rejectRes('gift-card', `Montant de carte cadeau invalide (${amountStr}). Entre ${GIFT_CARD_MIN} $ et ${GIFT_CARD_MAX} $, en dollars entiers.`)
    }
    return okRes('gift-card', amount * qty)
  }

  // --- Produits en solde (ids litteraux).
  if (SALE_ITEM_PRICES[pid] != null) {
    return okRes('sale-item', SALE_ITEM_PRICES[pid] * qty)
  }

  // --- Packs stickers boutique : <slug>-x<nPacks>. Prix par pack depuis le
  // CMS (product category sticker-pack, pricingData.tiers) sinon grille
  // par defaut. Palier exact requis.
  {
    const m = pid.match(/^((?:stk|sticker-pack)-[a-z0-9-]+?)-x(\d+)$/)
    if (m) {
      const packSlug = m[1]
      const nPacks = parseInt(m[2], 10)
      let perPack: number | null = null
      if (deps.getProductBySlug) {
        try {
          const product = await deps.getProductBySlug(packSlug)
          const tiers = product?.pricingData?.tiers
          if (Array.isArray(tiers)) {
            const t = tiers.find((x: any) => Number(x?.qty) === nPacks && typeof x?.price === 'number')
            if (t) perPack = t.price
          }
        } catch (_) {
          return rejectRes('sticker-pack-boutique', 'Validation du prix impossible, reessayez plus tard')
        }
      }
      if (perPack == null) perPack = STICKER_PACK_DEFAULT_TIERS[nPacks] ?? null
      if (perPack == null) {
        return rejectRes('sticker-pack-boutique', `Palier de packs invalide (${nPacks}). Paliers valides: 1, 5, 10, 25.`)
      }
      return okRes('sticker-pack-boutique', perPack * nPacks * qty)
    }
  }

  // --- Sublimation : palier de quantite exact, BYOT via SKU ou flag,
  // design fee optionnel valide par ENSEMBLE de prix serveur legitimes
  // (le choix "avec design" n'a pas de champ dedie dans l'item : on accepte
  // base ou base+fee, tout autre montant est force a base).
  if (pid.startsWith('sublimation-')) {
    const byotFromSku = pid.endsWith('-byot')
    const product = pid.replace(/^sublimation-/, '').replace(/-byot$/, '')
    const grid = SUBLIMATION_UNIT_PRICES[product]
    if (!grid) {
      return rejectRes('sublimation', `Produit sublimation inconnu: ${product}.`)
    }
    const unitPrice = grid[qty]
    if (unitPrice == null) {
      const paliers = Object.keys(grid).join(', ')
      return rejectRes('sublimation', `Quantite invalide pour ${product} (${qty}). Paliers valides: ${paliers}.`)
    }
    const byot = (byotFromSku || !!item.bringOwnGarment) && SUBLIMATION_BYOT_ALLOWED.includes(product)
    const blankUnit = SUBLIMATION_BLANK_COST[product] || 0
    const base = Math.max(0, unitPrice * qty - (byot ? blankUnit * qty : 0))
    const withDesign = base + SUBLIMATION_DESIGN_FEE
    const clientTotal = Number(item.totalPrice) || 0
    if (Math.abs(clientTotal - withDesign) <= 0.01) return okRes('sublimation', withDesign)
    return okRes('sublimation', base)
  }

  // --- Merch fini : prix plat par type (merch-<type>-<color>-<size>).
  if (pid.startsWith('merch-')) {
    const type = pid.split('-')[1] || ''
    const unit = MERCH_PRICES[type]
    if (unit == null) {
      return rejectRes('merch', `Produit merch inconnu: ${type || pid}.`)
    }
    return okRes('merch', unit * qty)
  }

  // --- Hors registre : REFUS. C'est le coeur de SEC-04.
  return rejectRes('inconnu', `Produit non reconnu: ${pid}. Vide ton panier et recommence, ou ecris-nous si le probleme persiste.`)
}
