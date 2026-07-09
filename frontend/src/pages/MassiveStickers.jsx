import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Sparkles, Plus, Check, Gift, ShoppingCart, X } from 'lucide-react'
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

// STICKERS-UI-01/02 : ordre d'affichage des familles sur la vue d'accueil.
// AJUSTABLE PAR MIKA : reordonner les ids ici suffit (ids = MASSIVE_STICKER_
// CATEGORIES). "Pop-culture" = la categorie personnages.
const FAMILY_ORDER = ['dark', 'animaux', 'psyche', 'asiatique', 'personnages', 'aliens', 'street-art', 'fun']

// STICKERS-UI-02/04 : collage de designs representatifs en eventail sur la
// carte de chaque famille. AJUSTABLE PAR MIKA : 4 slugs par famille (servis
// en micro-thumbs 160px, relancer scripts/generate-mini-thumbs.mjs apres
// tout ajout au catalogue). UI-04 : dragon-firefly et zombie-spider (fonds
// blancs rectangulaires) remplaces par des designs detoures.
const FAMILY_COLLAGES = {
  dark: ['massive-born-to-kill', 'massive-dj-skull', 'massive-skull-kaboom', 'massive-mort'],
  animaux: ['massive-animals-meeting', 'massive-chameleon', 'massive-poisson-rose', 'massive-kapibara'],
  psyche: ['massive-arte-moderno', 'massive-chmp-7', 'massive-fleur-degueu', 'massive-symetrie-asian'],
  asiatique: ['massive-adian-fumeuse', 'massive-asian-muerte', 'massive-samourai-violet', 'massive-geisha1'],
  personnages: ['massive-jade', 'massive-tv-man', 'massive-robot-qui-court', 'massive-punk-rose'],
  aliens: ['massive-alien-hot', 'massive-alien-calote', 'massive-soucoupe', 'massive-savant-vert'],
  'street-art': ['massive-art-de-rue', 'massive-tagueur', 'massive-art-libre', 'massive-fuckyou'],
  fun: ['massive-mais', 'massive-lunette-duck', 'massive-pig-chapeau', 'massive-hotdog'],
}

// Taille des tranches de la grille complete (pagination progressive).
const PAGE_SIZE = 36

// Carte d'un design : partagee entre toutes les grilles. Le clic sur le
// visuel/nom ouvre la fiche produit (UI-02), le bouton +3 $ reste un ajout
// direct au panier.
function StickerCard({ s, justAdded, onAdd, onOpen, tx }) {
  return (
    <div
      className="relative rounded-xl bg-black/20 hover:bg-black/30 transition-colors p-3 flex flex-col items-center group"
    >
      {NEW_BADGE_ENABLED && s.nouveau && (
        <span className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-wide">
          <Sparkles size={9} />
          {tx({ fr: 'Nouveau', en: 'New', es: 'Nuevo' })}
        </span>
      )}
      <button
        type="button"
        onClick={() => onOpen(s)}
        className="w-full cursor-pointer"
        aria-label={`${tx(s)} - ${tx({ fr: 'voir la fiche', en: 'view details', es: 'ver ficha' })}`}
      >
        <LazyImg
          src={thumb(`${STICKER_DIR}/${s.slug}.webp`)}
          alt={`Sticker ${tx(s)} - collection Massive`}
          className="sticker-stroke w-full aspect-square object-contain group-hover:scale-105 transition-transform duration-200"
        />
        <p className="mt-2 text-xs text-grey-muted text-center truncate w-full" title={tx(s)}>
          {tx(s)}
        </p>
      </button>
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

// UI-02/04 : carte cliquable d'une famille, collage de 4 designs en eventail.
// UI-04 perf : micro-thumbs 160px (au lieu des 400px affiches a ~80px),
// chargement eager + fetchpriority high (les cartes SONT le premier ecran).
function FamilleCard({ cat, count, tx, onOpen }) {
  const slugs = FAMILY_COLLAGES[cat.id] || []
  const ROTS = [-9, 5, -5, 8]
  const OFFS = [-57, -19, 19, 57]
  const ZS = [1, 3, 4, 2]
  return (
    <button
      type="button"
      onClick={() => onOpen(cat.id)}
      className="rounded-2xl bg-black/20 hover:bg-black/30 border border-white/5 hover:border-accent/40 transition-all p-3 text-left group"
    >
      <div className="relative h-20 sm:h-24 flex items-center justify-center overflow-hidden">
        {slugs.map((slug, i) => (
          <img
            key={slug}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            width="80"
            height="80"
            src={`/images/thumbs-mini/stickers-massive/${slug}.webp`}
            alt=""
            aria-hidden="true"
            className="sticker-stroke absolute object-contain group-hover:scale-105 transition-transform duration-200"
            style={{
              width: i === 2 ? 80 : 64,
              height: i === 2 ? 80 : 64,
              left: `calc(50% + ${OFFS[i]}px - ${(i === 2 ? 80 : 64) / 2}px)`,
              top: '50%',
              marginTop: i === 2 ? -40 : -32,
              transform: `rotate(${ROTS[i]}deg)`,
              zIndex: ZS[i],
            }}
          />
        ))}
      </div>
      <div className="flex items-baseline justify-between gap-2 mt-2.5">
        <h3 className="font-heading font-bold text-[13.5px] leading-tight text-heading">{tx(cat)}</h3>
        <span className="flex-none text-accent text-[11px] font-semibold">
          {count} &rarr;
        </span>
      </div>
    </button>
  )
}

// UI-04 : image de grille en lazy loading NATIF du navigateur.
//
// Le premier jet utilisait un IntersectionObserver custom qui gatait le
// `src` (undefined tant que hors viewport). Verifie en preview ET en Chrome
// reel : quand l'onglet n'est PAS au premier plan (visibilityState hidden),
// les callbacks IntersectionObserver sont suspendus par le navigateur ->
// AUCUNE image de grille ne chargeait jamais. Les images `loading="eager"`
// (collages), elles, chargeaient normalement. Un src gate par IO est donc
// un risque reel de page vide, en plus d'etre invérifiable dans un onglet
// de fond.
//
// `loading="lazy"` natif : le navigateur charge le proche-viewport, gere le
// retour de visibilite tout seul, src TOUJOURS present (jamais de page
// vide). width/height explicites -> zero CLS. decoding async -> decodage
// hors du main thread.
function LazyImg({ src, alt, className, title }) {
  return (
    <img
      loading="lazy"
      decoding="async"
      width="400"
      height="400"
      src={src}
      alt={alt}
      title={title}
      className={className}
    />
  )
}

// UI-02 : fiche produit en modale, pattern Redbubble simplifie. Grand visuel
// switchable (design seul / mockup gourde), zero option de configuration.
function StickerFiche({ s, catLabel, justAdded, onAdd, onClose, tx }) {
  const [vue, setVue] = useState('design')
  const designUrl = thumb(`${STICKER_DIR}/${s.slug}.webp`)
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-white/10 p-5 sm:p-7 relative"
        style={{ backgroundColor: 'var(--bg-body, #3D0079)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={tx({ fr: 'Fermer', en: 'Close', es: 'Cerrar' })}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-heading transition-colors"
        >
          <X size={16} />
        </button>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="rounded-2xl bg-black/25 h-72 sm:h-80 flex items-center justify-center relative overflow-hidden">
              {vue === 'design' ? (
                <img
                  src={designUrl}
                  alt={`Sticker ${tx(s)}`}
                  className="sticker-stroke max-h-[85%] max-w-[85%] object-contain"
                />
              ) : (
                /* Mockup gourde : le design colle sur le tumbler blanc du
                   repo (photo produit sublimation). Ancre centree sur le
                   cylindre, rotation legere + ombrage cylindrique masque a
                   l'alpha du design (pattern mockup adaptatif v2 simplifie). */
                <div className="relative h-[92%]">
                  <img
                    src="/images/mugs/tumbler-white.webp"
                    alt={tx({ fr: 'Gourde avec le sticker', en: 'Bottle with the sticker', es: 'Botella con el sticker' })}
                    className="h-full w-auto object-contain"
                  />
                  <div className="absolute" style={{ left: '50%', top: '52%', width: '58%', aspectRatio: '1', transform: 'translate(-50%, -50%)' }}>
                    <img
                      src={designUrl}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-contain"
                      style={{ transform: 'rotate(-2deg)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))' }}
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(90deg, rgba(0,0,0,0.16), rgba(255,255,255,0.06) 28%, transparent 45%, transparent 60%, rgba(0,0,0,0.18) 96%)',
                        WebkitMaskImage: `url(${designUrl})`,
                        WebkitMaskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskImage: `url(${designUrl})`,
                        maskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        maskPosition: 'center',
                        transform: 'rotate(-2deg)',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            {/* Switch par vignettes, pattern Redbubble */}
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => setVue('design')}
                aria-label={tx({ fr: 'Voir le design', en: 'View the design', es: 'Ver el diseno' })}
                className={`w-14 h-14 rounded-lg bg-black/25 flex items-center justify-center border-2 transition-colors ${vue === 'design' ? 'border-accent' : 'border-white/10 hover:border-white/30'}`}
              >
                <img src={designUrl} alt="" className="w-9 h-9 object-contain" />
              </button>
              <button
                type="button"
                onClick={() => setVue('gourde')}
                aria-label={tx({ fr: 'Voir sur une gourde', en: 'View on a bottle', es: 'Ver en una botella' })}
                className={`w-14 h-14 rounded-lg bg-black/25 flex items-center justify-center border-2 transition-colors ${vue === 'gourde' ? 'border-accent' : 'border-white/10 hover:border-white/30'}`}
              >
                <img src="/images/mugs/tumbler-white.webp" alt="" className="h-10 object-contain" />
              </button>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="font-heading font-bold text-2xl text-heading">{tx(s)}</h2>
            <p className="text-grey-muted text-sm mt-1">{catLabel}</p>
            <p className="text-accent font-heading font-bold text-3xl mt-4">
              {tx({ fr: `${STICKER_COLLECTION_UNIT_PRICE} $`, en: `$${STICKER_COLLECTION_UNIT_PRICE}`, es: `${STICKER_COLLECTION_UNIT_PRICE} $` })}
            </p>
            <p className="text-grey-muted text-xs mt-3 mb-5">
              {tx({
                fr: `Vinyle die-cut, resistant eau et UV. Minimum ${STICKER_COLLECTION_MIN_UNITS} stickers de la collection par commande.`,
                en: `Die-cut vinyl, water and UV resistant. Minimum ${STICKER_COLLECTION_MIN_UNITS} collection stickers per order.`,
                es: `Vinilo die-cut, resistente al agua y UV. Minimo ${STICKER_COLLECTION_MIN_UNITS} stickers de la coleccion por pedido.`,
              })}
            </p>
            <button
              type="button"
              onClick={() => onAdd(s)}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold text-sm transition-all ${
                justAdded === s.slug ? 'bg-green-500/20 text-green-400' : 'bg-accent text-white hover:brightness-110'
              }`}
            >
              {justAdded === s.slug ? <Check size={16} /> : <ShoppingCart size={16} />}
              {justAdded === s.slug
                ? tx({ fr: 'Ajoute au panier !', en: 'Added to cart!', es: 'Agregado al carrito!' })
                : tx({ fr: `Ajouter au panier - ${STICKER_COLLECTION_UNIT_PRICE} $`, en: `Add to cart - $${STICKER_COLLECTION_UNIT_PRICE}`, es: `Agregar al carrito - ${STICKER_COLLECTION_UNIT_PRICE} $` })}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// UI-05 : grille a SCROLL INFINI. Affiche `items` par tranches de PAGE_SIZE ;
// une sentinelle en fin de grille, observee par un IntersectionObserver a
// rootMargin 700px, charge la tranche suivante AVANT que l'utilisateur
// atteigne le bas (scroll fluide, pas de trou). Reutilise pour les 3 grilles
// (catalogue accueil, vue famille, resultats de recherche).
//
// FILET (lecon UI-04 : un IO ne fire pas en onglet cache) : le bouton "Voir
// plus" reste rendu tant qu'il reste des elements. En usage normal le scroll
// infini charge avant qu'on le voie ; si l'IO est indisponible ou ne fire
// pas, le bouton reste cliquable -> jamais de grille bloquee.
//
// RESET : le parent passe une `key` (activeCat + query) ; un changement de
// filtre/recherche remonte le composant et remet count a PAGE_SIZE.
function InfiniteGrid({ items, justAdded, onAdd, onOpen, tx }) {
  const [count, setCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef(null)
  // Guard anti double-chargement : bloque les fire multiples de l'IO entre
  // le setCount et le re-render (relache une fois la tranche montee).
  const loadingRef = useRef(false)
  const hasMore = count < items.length

  const loadMore = () => {
    if (loadingRef.current) return
    loadingRef.current = true
    setCount((c) => Math.min(c + PAGE_SIZE, items.length))
  }
  // Relache le guard apres chaque changement de count (nouvelle tranche montee).
  useEffect(() => { loadingRef.current = false }, [count])

  // (Re)observe la sentinelle tant qu'il reste des elements. useEffect +
  // useRef (pas de ref-callback) : robuste aux re-renders, comme le lazy
  // corrige en UI-04. Cleanup deconnecte l'ancien observer.
  useEffect(() => {
    if (!hasMore) return
    const el = sentinelRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '700px' }
    )
    io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, count, items.length])

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {items.slice(0, count).map((s) => (
          <StickerCard key={s.slug} s={s} justAdded={justAdded} onAdd={onAdd} onOpen={onOpen} tx={tx} />
        ))}
      </div>
      {hasMore && (
        <>
          {/* Sentinelle : declenche le chargement auto ~700px avant le bas */}
          <div ref={sentinelRef} aria-hidden="true" className="h-px" />
          {/* Filet : bouton toujours rendu, cliquable si l'IO ne fire pas */}
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={loadMore}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-black/25 border border-white/10 hover:border-accent/50 text-heading text-sm font-semibold transition-all"
            >
              {tx({ fr: 'Voir plus', en: 'See more', es: 'Ver mas' })} ({items.length - count})
            </button>
          </div>
        </>
      )}
    </>
  )
}

function MassiveStickers() {
  const { tx } = useLang()
  const { items: cartItems, addToCart } = useCart()
  const [activeCat, setActiveCat] = useState('all')
  const [query, setQuery] = useState('')
  // Feedback visuel apres un ajout (cle = slug du design ou 'pack-N')
  const [justAdded, setJustAdded] = useState('')
  // UI-02 : fiche produit ouverte (slug). La pagination vit desormais dans
  // InfiniteGrid (UI-05), reset par sa `key` a chaque changement de contexte.
  const [ficheSlug, setFicheSlug] = useState(null)
  // UI-02 : ordre aleatoire de la grille complete, calcule APRES le mount
  // (Fisher-Yates). Le rendu initial (et donc le HTML prerendu) garde l'ordre
  // stable du manifest : le shuffle n'arrive qu'au runtime client, pas
  // pendant l'hydratation.
  const [ordreAleatoire, setOrdreAleatoire] = useState(null)
  useEffect(() => {
    // STICKERS-NAMES : pas de shuffle pendant le prerender (flag pose par
    // scripts/prerender.mjs). Le HTML capture garde l'ordre stable du
    // manifest pour le SEO et des builds reproductibles ; les visiteurs
    // reels n'ont jamais ce flag et recoivent l'ordre aleatoire.
    if (typeof window !== 'undefined' && window.__MASSIVE_PRERENDER__) return
    const arr = [...MASSIVE_STICKERS]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    setOrdreAleatoire(arr)
  }, [])
  const catalogue = ordreAleatoire || MASSIVE_STICKERS

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
      productName: tx({ fr: `Sticker ${s.fr}`, en: `Sticker ${s.en}`, es: `Sticker ${s.es}` }),
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
      // STICKERS-NAMES : la recherche matche les TROIS langues, peu importe
      // l'interface active (chercher "skull" trouve les designs en interface FR).
      if (q) return [s.fr, s.en, s.es].some((n) => normalizeSearchText(n).includes(q))
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
            {tx({ fr: 'Collection Stickers Massive', en: 'Massive Sticker Collection', es: 'Coleccion de Stickers Massive' })}
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

        {/* STICKERS-UI-02 : trois vues.
            1. Recherche active -> grille globale de resultats.
            2. Accueil -> cartes de familles (collages en eventail) PUIS la
               grille complete du catalogue en ordre aleatoire (shuffle client
               apres mount, prerender stable), paginee par tranches.
            3. Vue famille -> chips de navigation + grille complete filtree. */}
        {isSearching ? (
          visibles.length === 0 ? (
            <p className="text-center text-grey-muted py-16">
              {tx({ fr: 'Aucun sticker ne correspond.', en: 'No sticker matches.', es: 'Ningun sticker coincide.' })}
            </p>
          ) : (
            <InfiniteGrid
              key={`search|${query}`}
              items={visibles}
              justAdded={justAdded}
              onAdd={addUnitToCart}
              onOpen={(d) => setFicheSlug(d.slug)}
              tx={tx}
            />
          )
        ) : activeCat === 'all' ? (
          <div>
            {/* Cartes de familles UI-04 : 4 colonnes desktop / 2 mobile, compactes */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
              {FAMILY_ORDER.map((catId) => {
                const cat = MASSIVE_STICKER_CATEGORIES.find((c) => c.id === catId)
                if (!cat || !countByCat[catId]) return null
                return (
                  <FamilleCard key={catId} cat={cat} count={countByCat[catId]} tx={tx} onOpen={setActiveCat} />
                )
              })}
            </div>

            {/* Grille complete du catalogue, ordre aleatoire a chaque visite */}
            <div className="flex items-baseline justify-between gap-3 mb-4">
              <h2 className="font-heading font-bold text-lg sm:text-xl text-heading">
                {tx({ fr: 'Tout le catalogue', en: 'The whole catalog', es: 'Todo el catalogo' })}
              </h2>
              <span className="text-grey-muted text-xs">
                {tx({ fr: `${catalogue.length} designs, ordre aleatoire`, en: `${catalogue.length} designs, random order`, es: `${catalogue.length} disenos, orden aleatorio` })}
              </span>
            </div>
            <InfiniteGrid
              key="catalogue-all"
              items={catalogue}
              justAdded={justAdded}
              onAdd={addUnitToCart}
              onOpen={(d) => setFicheSlug(d.slug)}
              tx={tx}
            />
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
            <InfiniteGrid
              key={`famille|${activeCat}`}
              items={visibles}
              justAdded={justAdded}
              onAdd={addUnitToCart}
              onOpen={(d) => setFicheSlug(d.slug)}
              tx={tx}
            />
          </div>
        )}
      </div>

      {/* UI-02 : fiche produit en modale */}
      {ficheSlug && (() => {
        const s = MASSIVE_STICKERS.find((d) => d.slug === ficheSlug)
        if (!s) return null
        const cat = MASSIVE_STICKER_CATEGORIES.find((c) => c.id === s.cat)
        return (
          <StickerFiche
            s={s}
            catLabel={cat ? tx(cat) : ''}
            justAdded={justAdded}
            onAdd={addUnitToCart}
            onClose={() => setFicheSlug(null)}
            tx={tx}
          />
        )
      })()}
    </div>
  )
}

export default MassiveStickers
