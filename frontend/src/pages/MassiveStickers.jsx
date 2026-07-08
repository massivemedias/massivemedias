import { useMemo, useState } from 'react'
import { Search, Sparkles, Plus, Check, Gift, ShoppingCart } from 'lucide-react'
import SEO from '../components/SEO'
import { useLang } from '../i18n/LanguageContext'
import { useCart } from '../contexts/CartContext'
import { MASSIVE_STICKERS, MASSIVE_STICKER_CATEGORIES } from '../data/massiveStickers'
import {
  getCollectionStickerPrice,
  getMysteryPackPrice,
  STICKER_COLLECTION_UNIT_PRICE,
  STICKER_COLLECTION_MIN_UNITS,
  MYSTERY_PACK_PRICES,
  stickerImages,
} from '../data/products'
import { normalizeSearchText } from '../utils/clientAccountSearch'
import { thumb } from '../utils/paths'
import { NEW_BADGE_ENABLED } from '../config/stickersShopStatus'

/**
 * MassiveStickers (STICKERS-SHOP-A, 8 juillet 2026) - VITRINE de la
 * collection stickers Massive : 285 designs navigables par categorie, badge
 * "Nouveau", recherche par nom. AUCUN prix, AUCUN achat ce chantier-ci
 * (le commerce arrive au chantier 3B).
 *
 * Accessible uniquement si STICKERS_SHOP_ENABLED (config/stickersShopStatus)
 * est actif : la route et le lien header sont conditionnels au flag.
 *
 * Perf : 285 images -> la grille charge les thumbs 400px en lazy loading,
 * les 800px de /images/stickers-massive/ servent aux futures fiches produit.
 */

const STICKER_DIR = '/images/stickers-massive'

// STICKERS-UI-01 : ordre d'affichage des familles sur la vue d'accueil.
// AJUSTABLE PAR MIKA : reordonner les ids ici suffit (ids = MASSIVE_STICKER_
// CATEGORIES). "Pop-culture" = la categorie personnages.
const FAMILY_ORDER = ['dark', 'animaux', 'psyche', 'asiatique', 'personnages', 'aliens', 'street-art', 'fun']

// Nombre de designs montres par rangee de famille sur la vue d'accueil.
const FAMILY_ROW_SIZE = 10

// Carte d'un design : partagee entre la vue d'accueil (rangees par famille)
// et la vue famille/recherche (grille). `compact` = version rangee
// horizontale scrollable (largeur fixe).
function StickerCard({ s, compact, justAdded, onAdd, tx }) {
  return (
    <div
      className={`relative rounded-xl bg-black/20 hover:bg-black/30 transition-colors p-3 flex flex-col items-center group ${compact ? 'flex-none w-36 sm:w-40' : ''}`}
    >
      {NEW_BADGE_ENABLED && s.nouveau && (
        <span className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-wide">
          <Sparkles size={9} />
          {tx({ fr: 'Nouveau', en: 'New', es: 'Nuevo' })}
        </span>
      )}
      <img
        loading="lazy"
        src={thumb(`${STICKER_DIR}/${s.slug}.webp`)}
        alt={`Sticker ${s.nom} - collection Massive`}
        className="sticker-stroke w-full aspect-square object-contain group-hover:scale-105 transition-transform duration-200"
      />
      <p className="mt-2 text-xs text-grey-muted text-center truncate w-full" title={s.nom}>
        {s.nom}
      </p>
      <button
        type="button"
        onClick={() => onAdd(s)}
        className={`mt-2 w-full inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
          justAdded === s.slug
            ? 'bg-green-500/20 text-green-400'
            : 'bg-accent text-white hover:brightness-110'
        }`}
      >
        {justAdded === s.slug ? <Check size={12} /> : <Plus size={12} />}
        {justAdded === s.slug
          ? tx({ fr: 'Ajoute !', en: 'Added!', es: 'Agregado!' })
          : tx({ fr: `${STICKER_COLLECTION_UNIT_PRICE} $`, en: `$${STICKER_COLLECTION_UNIT_PRICE}`, es: `${STICKER_COLLECTION_UNIT_PRICE} $` })}
      </button>
    </div>
  )
}

function MassiveStickers() {
  const { tx } = useLang()
  const { items: cartItems, addToCart } = useCart()
  const [activeCat, setActiveCat] = useState('all')
  const [query, setQuery] = useState('')
  // Feedback visuel apres un ajout (cle = slug du design ou 'pack-N')
  const [justAdded, setJustAdded] = useState('')

  // Compte des stickers UNITAIRES de la collection dans le panier (les
  // mystery packs sont hors compte : autosuffisants pour le minimum de 5).
  const unitCount = useMemo(() =>
    (cartItems || []).reduce((sum, it) =>
      String(it?.productId || '').startsWith('sticker-massive-') ? sum + (Number(it?.quantity) || 1) : sum, 0),
    [cartItems])

  function flashAdded(key) {
    setJustAdded(key)
    setTimeout(() => setJustAdded((k) => (k === key ? '' : k)), 1200)
  }

  function addUnitToCart(s) {
    const info = getCollectionStickerPrice(1)
    addToCart({
      productId: `sticker-massive-${s.slug.replace(/^massive-/, '')}`,
      sku: s.slug,
      productName: tx({ fr: `Sticker ${s.nom}`, en: `Sticker ${s.nom}`, es: `Sticker ${s.nom}` }),
      quantity: 1,
      unitPrice: info.unitPrice,
      totalPrice: info.price,
      image: thumb(`${STICKER_DIR}/${s.slug}.webp`),
    })
    flashAdded(s.slug)
  }

  function addPackToCart(size) {
    const pack = getMysteryPackPrice(size)
    if (!pack) return
    addToCart({
      productId: `mystery-pack-${size}`,
      sku: `mystery-pack-${size}`,
      productName: tx({
        fr: `Mystery Pack ${size} stickers`,
        en: `Mystery Pack ${size} stickers`,
        es: `Mystery Pack ${size} stickers`,
      }),
      quantity: 1,
      unitPrice: pack.price,
      totalPrice: pack.price,
      image: stickerImages[0],
    })
    flashAdded(`pack-${size}`)
  }

  // Recherche active = grille globale (la recherche ignore la famille).
  const isSearching = normalizeSearchText(query).trim().length > 0

  const visibles = useMemo(() => {
    const q = normalizeSearchText(query).trim()
    return MASSIVE_STICKERS.filter((s) => {
      if (q) return normalizeSearchText(s.nom).includes(q)
      if (activeCat !== 'all' && s.cat !== activeCat) return false
      return true
    })
  }, [activeCat, query])

  const countByCat = useMemo(() => {
    const counts = { all: MASSIVE_STICKERS.length }
    for (const s of MASSIVE_STICKERS) counts[s.cat] = (counts[s.cat] || 0) + 1
    return counts
  }, [])

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <SEO
        title={tx({ fr: 'Collection Stickers - Massive', en: 'Sticker Collection - Massive', es: 'Coleccion de Stickers - Massive' })}
        description={tx({
          fr: `La collection de stickers Massive : ${MASSIVE_STICKERS.length} designs originaux crees a Montreal. Skulls, animaux, aliens, manga, street art et plus.`,
          en: `The Massive sticker collection: ${MASSIVE_STICKERS.length} original designs made in Montreal. Skulls, animals, aliens, manga, street art and more.`,
          es: `La coleccion de stickers Massive: ${MASSIVE_STICKERS.length} disenos originales hechos en Montreal.`,
        })}
      />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-3xl sm:text-4xl text-heading mb-3">
            {tx({ fr: 'Collection Stickers', en: 'Sticker Collection', es: 'Coleccion de Stickers' })}
          </h1>
          <p className="text-grey-muted max-w-2xl mx-auto">
            {tx({
              fr: `${MASSIVE_STICKERS.length} designs originaux crees a Montreal. Vinyle die-cut, resistant eau et UV. ${STICKER_COLLECTION_UNIT_PRICE} $ le sticker, minimum ${STICKER_COLLECTION_MIN_UNITS}.`,
              en: `${MASSIVE_STICKERS.length} original designs made in Montreal. Die-cut vinyl, water and UV resistant. $${STICKER_COLLECTION_UNIT_PRICE} per sticker, minimum ${STICKER_COLLECTION_MIN_UNITS}.`,
              es: `${MASSIVE_STICKERS.length} disenos originales hechos en Montreal. Vinilo die-cut, resistente al agua y UV. ${STICKER_COLLECTION_UNIT_PRICE} $ por sticker, minimo ${STICKER_COLLECTION_MIN_UNITS}.`,
            })}
          </p>
        </div>

        {/* Compteur du minimum de 5 stickers unitaires (packs hors compte) */}
        {unitCount > 0 && (
          <div className={`max-w-md mx-auto mb-6 px-4 py-2.5 rounded-full text-sm text-center font-semibold flex items-center justify-center gap-2 ${
            unitCount >= STICKER_COLLECTION_MIN_UNITS
              ? 'bg-green-500/15 text-green-400'
              : 'bg-amber-500/15 text-amber-400'
          }`}>
            <ShoppingCart size={14} />
            {unitCount >= STICKER_COLLECTION_MIN_UNITS
              ? tx({
                  fr: `${unitCount} stickers au panier, minimum atteint !`,
                  en: `${unitCount} stickers in cart, minimum reached!`,
                  es: `${unitCount} stickers en el carrito, minimo alcanzado!`,
                })
              : tx({
                  fr: `${unitCount}/${STICKER_COLLECTION_MIN_UNITS} stickers, ajoute ${STICKER_COLLECTION_MIN_UNITS - unitCount} de plus (minimum ${STICKER_COLLECTION_MIN_UNITS})`,
                  en: `${unitCount}/${STICKER_COLLECTION_MIN_UNITS} stickers, add ${STICKER_COLLECTION_MIN_UNITS - unitCount} more (minimum ${STICKER_COLLECTION_MIN_UNITS})`,
                  es: `${unitCount}/${STICKER_COLLECTION_MIN_UNITS} stickers, agrega ${STICKER_COLLECTION_MIN_UNITS - unitCount} mas (minimo ${STICKER_COLLECTION_MIN_UNITS})`,
                })}
          </div>
        )}

        {/* Mystery Packs : designs choisis par Massive, hors minimum */}
        <div className="max-w-4xl mx-auto mb-10">
          <h2 className="font-heading font-bold text-xl text-heading text-center mb-1 flex items-center justify-center gap-2">
            <Gift size={18} className="text-accent" />
            {tx({ fr: 'Mystery Packs', en: 'Mystery Packs', es: 'Mystery Packs' })}
          </h2>
          <p className="text-grey-muted text-xs text-center mb-4">
            {tx({
              fr: 'Des designs surprises choisis par Massive. Pas de minimum, prets a partir.',
              en: 'Surprise designs picked by Massive. No minimum, ready to go.',
              es: 'Disenos sorpresa elegidos por Massive. Sin minimo.',
            })}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.keys(MYSTERY_PACK_PRICES).map((sizeKey) => {
              const size = Number(sizeKey)
              const pack = getMysteryPackPrice(size)
              const perSticker = (pack.price / size).toFixed(2).replace('.', ',')
              const key = `pack-${size}`
              return (
                <div key={size} className="rounded-xl bg-black/20 hover:bg-black/30 transition-colors p-4 text-center flex flex-col items-center gap-1.5">
                  <p className="font-heading font-bold text-heading">
                    {tx({ fr: `${size} stickers`, en: `${size} stickers`, es: `${size} stickers` })}
                  </p>
                  <p className="text-2xl font-bold text-accent">{pack.price}&nbsp;$</p>
                  <p className="text-[11px] text-grey-muted">
                    {tx({ fr: `${perSticker} $ / sticker`, en: `$${(pack.price / size).toFixed(2)} / sticker`, es: `${perSticker} $ / sticker` })}
                  </p>
                  <button
                    type="button"
                    onClick={() => addPackToCart(size)}
                    className="mt-1.5 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent text-white text-xs font-semibold hover:brightness-110 transition-all"
                  >
                    {justAdded === key ? <Check size={13} /> : <Plus size={13} />}
                    {justAdded === key
                      ? tx({ fr: 'Ajoute !', en: 'Added!', es: 'Agregado!' })
                      : tx({ fr: 'Ajouter au panier', en: 'Add to cart', es: 'Agregar' })}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recherche par nom */}
        <div className="max-w-md mx-auto mb-6 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tx({ fr: 'Chercher un sticker...', en: 'Search a sticker...', es: 'Buscar un sticker...' })}
            className="w-full rounded-full text-sm pl-9 pr-4 py-2.5 outline-none border border-white/10 bg-black/20 text-heading focus:border-accent transition-colors"
          />
        </div>

        {/* STICKERS-UI-01 : trois vues.
            1. Recherche active -> grille globale de resultats (les chips
               disparaissent, la recherche est globale).
            2. Accueil (activeCat='all', pas de recherche) -> les familles en
               premier plan : une section par famille (ordre FAMILY_ORDER),
               rangee horizontale scrollable + "Voir tout (n)".
            3. Vue famille -> chips de navigation + grille complete filtree. */}
        {isSearching ? (
          visibles.length === 0 ? (
            <p className="text-center text-grey-muted py-16">
              {tx({ fr: 'Aucun sticker ne correspond.', en: 'No sticker matches.', es: 'Ningun sticker coincide.' })}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {visibles.map((s) => (
                <StickerCard key={s.slug} s={s} justAdded={justAdded} onAdd={addUnitToCart} tx={tx} />
              ))}
            </div>
          )
        ) : activeCat === 'all' ? (
          <div>
            {FAMILY_ORDER.map((catId) => {
              const cat = MASSIVE_STICKER_CATEGORIES.find((c) => c.id === catId)
              if (!cat) return null
              const designs = MASSIVE_STICKERS.filter((s) => s.cat === catId)
              if (designs.length === 0) return null
              return (
                <section key={catId} className="mb-8">
                  <div className="flex items-baseline justify-between gap-3 mb-3">
                    <h2 className="font-heading font-bold text-lg sm:text-xl text-heading">{tx(cat)}</h2>
                    <button
                      type="button"
                      onClick={() => setActiveCat(catId)}
                      className="flex-none text-accent text-xs sm:text-sm font-semibold hover:brightness-125 transition-all"
                    >
                      {tx({ fr: 'Voir tout', en: 'See all', es: 'Ver todo' })} ({designs.length}) &rarr;
                    </button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                    {designs.slice(0, FAMILY_ROW_SIZE).map((s) => (
                      <StickerCard key={s.slug} s={s} compact justAdded={justAdded} onAdd={addUnitToCart} tx={tx} />
                    ))}
                    {designs.length > FAMILY_ROW_SIZE && (
                      <button
                        type="button"
                        onClick={() => setActiveCat(catId)}
                        className="flex-none w-36 sm:w-40 rounded-xl bg-black/20 hover:bg-black/30 transition-colors flex flex-col items-center justify-center gap-1 text-grey-muted hover:text-heading"
                      >
                        <span className="text-2xl font-bold text-accent">+{designs.length - FAMILY_ROW_SIZE}</span>
                        <span className="text-xs font-semibold">{tx({ fr: 'Voir tout', en: 'See all', es: 'Ver todo' })}</span>
                      </button>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        ) : (
          <div>
            {/* Chips de navigation dans la vue famille */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <button
                type="button"
                onClick={() => setActiveCat('all')}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all bg-black/20 text-grey-muted hover:text-heading"
              >
                &larr; {tx({ fr: 'Toutes les familles', en: 'All families', es: 'Todas las familias' })}
              </button>
              {MASSIVE_STICKER_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCat(c.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeCat === c.id ? 'bg-accent text-white shadow-md' : 'bg-black/20 text-grey-muted hover:text-heading'
                  }`}
                >
                  {tx(c)} ({countByCat[c.id] || 0})
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {visibles.map((s) => (
                <StickerCard key={s.slug} s={s} justAdded={justAdded} onAdd={addUnitToCart} tx={tx} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MassiveStickers
