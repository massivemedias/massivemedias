import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Sparkles, Plus, Check, Gift, ShoppingCart, X, ChevronLeft, ChevronRight, Scissors, Sticker, Heart } from 'lucide-react'
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
import { thumb, img } from '../utils/paths'
import TumblerDesign from '../components/TumblerDesign'
import FavoriteHeart from '../components/FavoriteHeart'
import { useFavorites } from '../contexts/FavoritesContext'
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

// UI-08b : tilt parallax (variante B) des cartes de familles - l'eventail suit
// legerement la souris en 3D. Mettre a false pour couper l'effet (une ligne).
const FAMILY_TILT = true

// UI-10 : 1 carte de famille sur ACCENT_EVERY recoit un accent visuel (fond
// rose + designs centraux plus gros) pour casser la monotonie de la grille.
const ACCENT_EVERY = 4

// UI-10 : bande vitrine "en situation" entre les familles et le catalogue.
// CONSTANTE EXTENSIBLE : chaque objet = une tuile. Pour ajouter un laptop ou une
// vraie photo de pack plus tard, ajouter un objet ici (kind 'product' avec une
// autre image de fond, designW = largeur du sticker pose dessus). Les images de
// fond sont chargees en lazy -> zero cout au premier paint (perf UI-10).
const SHOWCASE = [
  { kind: 'product', img: '/images/mugs/tumbler-white.webp', design: 'massive-adian-fumeuse', productH: '92%', tumbler: true, cap: { fr: 'Sur ta gourde', en: 'On your bottle', es: 'En tu botella' } },
  // STICKERS-UI-11 (13 juillet) : carte TASSE retiree de la bande (decision Mika :
  // sans interet, sera remplacee par de vraies photos). REVERSIBLE : decommenter
  // cette ligne pour la ramener. Le composant mug + l'asset mug-white.webp sont
  // CONSERVES (pas de suppression). Les 3 langues suivent (l'entree porte ses caps).
  // { kind: 'product', img: '/images/mugs/mug-white.webp', design: 'massive-alien-hot', productH: '84%', designW: '52%', cap: { fr: 'Sur ta tasse', en: 'On your mug', es: 'En tu taza' } },
  // FUTUR (Mika) : une VRAIE PHOTO = UNE entree, zero dev. Deposer l'image dans
  // public/images/, decommenter, remplir img + href + cap FR/EN/ES :
  // { kind: 'photo', img: '/images/situations/laptop.webp', href: '/stickers', cap: { fr: 'Sur ton laptop', en: 'On your laptop', es: 'En tu laptop' } },
  { kind: 'pack', slugs: ['massive-dj-skull', 'massive-chameleon', 'massive-fleur-degueu', 'massive-mais', 'massive-jade'], cap: { fr: 'Mystery pack', en: 'Mystery pack', es: 'Mystery pack' } },
]
const PACK_POS = [[-70, -8, -10], [-38, 10, 7], [0, -4, 6], [40, 8, -9], [72, -6, 8]]

// Carte d'un design : partagee entre toutes les grilles. Le clic sur le
// visuel/nom ouvre la fiche produit (UI-02), le bouton +3 $ reste un ajout
// direct au panier.
function StickerCard({ s, justAdded, cartQty, onAdd, onOpen, tx }) {
  // UI-07 : etat SELECTIONNE persistant quand le design est au panier. Bordure
  // rose (ring) + leger fond rose + badge coin "✓ n" -> la carte reste
  // visiblement marquee partout (grille, famille, recherche) tant que l'item
  // est au panier, pas seulement le flash au clic.
  const inCart = cartQty > 0
  return (
    <div
      className={`relative rounded-xl transition-all p-3 flex flex-col items-center group ${
        inCart ? 'bg-accent/10 ring-2 ring-accent' : 'bg-black/20 hover:bg-black/30'
      }`}
    >
      <FavoriteHeart slug={s.slug} className="absolute top-2 right-2 z-20" />
      {inCart && (
        <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-0.5 pl-1 pr-1.5 py-0.5 rounded-full bg-accent text-white text-[10px] font-bold shadow">
          <Check size={10} />
          {cartQty}
        </span>
      )}
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
      {/* CART-01 : feedback persistant. Flash "Ajoute !" au clic, puis retombe
          sur "N au panier" tant que le design est dans le panier (au lieu de
          revenir a "3 $"). Le tiroir montre le detail. */}
      <button
        type="button"
        onClick={() => onAdd(s)}
        className={`mt-2 w-full inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
          justAdded === s.slug || cartQty > 0
            ? 'bg-green-500/20 text-green-400'
            : 'bg-accent text-white hover:brightness-110'
        }`}
      >
        {justAdded === s.slug || cartQty > 0 ? <Check size={12} /> : <Plus size={12} />}
        {justAdded === s.slug
          ? tx({ fr: 'Ajoute !', en: 'Added!', es: 'Agregado!' })
          : cartQty > 0
            ? tx({ fr: `${cartQty} au panier`, en: `${cartQty} in cart`, es: `${cartQty} en carrito` })
            : tx({ fr: `${STICKER_COLLECTION_UNIT_PRICE} $`, en: `$${STICKER_COLLECTION_UNIT_PRICE}`, es: `${STICKER_COLLECTION_UNIT_PRICE} $` })}
      </button>
    </div>
  )
}

// UI-02/04/10 : carte cliquable d'une famille, collage de 4 designs en eventail.
// UI-10 : l'eventail est OUVERT par defaut (l'ancien etat survol devient le
// repos) -> plus rien cache derriere le hover, le probleme tactile est regle. Le
// nom + le compte sont poses sur le visuel (scrim bas), la carte est plus dense.
// Le survol ajoute un leger sur-ecartement (--hx) + le lift (CSS) + le tilt 3D.
// 1 carte sur ACCENT_EVERY est accentuee (fond rose + designs centraux plus
// gros). Micro-thumbs 160px eager + fetchpriority (les cartes SONT le 1er ecran).
function FamilleCard({ cat, count, tx, onOpen, accent }) {
  const slugs = FAMILY_COLLAGES[cat.id] || []
  // 3 etats par vignette via variables CSS (voir .famcard* dans index.css).
  // UI-10 : REPOS = ouvert ; MEDIAN (tactile/reduced-motion) = meme etat ouvert
  // (--mx = --rx) ; SURVOL = un peu plus ouvert. Indices 1 & 2 = designs
  // centraux (au-dessus, plus gros). 100 % transform -> zero reflow au scroll.
  const REST_X = [-78, -28, 28, 78]
  const REST_R = [-13, -5, 5, 13]
  const HOV_X = [-90, -33, 33, 90]
  const HOV_R = [-16, -7, 7, 16]
  const DELAY = [0, 40, 80, 120]
  // Accent : designs centraux plus gros (effet "design vedette").
  const SIZE = accent ? [80, 116, 116, 80] : [82, 100, 100, 82]
  const ZS = [2, 4, 4, 2]
  // UI-08b : l'eventail (famcard-fan) suit legerement la souris en 3D. rAF pour
  // ne pas spammer le layout, transform uniquement -> zero reflow. Coupe par CSS
  // en reduced-motion et sur tactile : transform:none !important bat l'inline.
  const fanRef = useRef(null)
  const rafRef = useRef(0)
  const tilt = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      if (fanRef.current) fanRef.current.style.transform = `rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg)`
    })
  }
  const untilt = () => {
    cancelAnimationFrame(rafRef.current)
    if (fanRef.current) fanRef.current.style.transform = ''
  }
  return (
    <button
      type="button"
      onClick={() => onOpen(cat.id)}
      onMouseMove={FAMILY_TILT ? tilt : undefined}
      onMouseLeave={FAMILY_TILT ? untilt : undefined}
      className={`famcard rounded-2xl border p-2.5 text-left ${accent ? 'famcard-accent' : 'bg-black/20 border-white/5'}`}
    >
      <div className="famcard-fanwrap relative h-[116px] sm:h-[124px]">
        <div ref={fanRef} className="famcard-fan absolute inset-0">
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
              className="famcard-thumb sticker-stroke absolute object-contain"
              style={{
                width: SIZE[i],
                height: SIZE[i],
                left: '50%',
                top: '50%',
                zIndex: ZS[i],
                '--rx': `${REST_X[i]}px`, '--rr': `${REST_R[i]}deg`,
                '--mx': `${REST_X[i]}px`, '--mr': `${REST_R[i]}deg`,
                '--hx': `${HOV_X[i]}px`, '--hr': `${HOV_R[i]}deg`,
                '--d': `${DELAY[i]}ms`,
              }}
            />
          ))}
        </div>
        {/* UI-10 : nom + compte poses sur le visuel (scrim bas), pointer-events
            none pour que tout le clic aille au bouton parent. */}
        <div className="famcard-label absolute inset-x-0 bottom-0 z-10 px-2.5 pt-6 pb-1.5 flex items-baseline justify-between gap-2 pointer-events-none">
          <h3 className="font-heading font-bold text-[13px] leading-tight text-white">{tx(cat)}</h3>
          <span className="famcard-cta flex-none text-accent text-[11px] font-bold whitespace-nowrap">
            {count} <span className="famcard-arrow">&rarr;</span>
          </span>
        </div>
      </div>
    </button>
  )
}

// UI-10 : bande vitrine "en situation" (repond au "il manque des mockups"). Rend
// SHOWCASE (constante extensible). Tuiles produit -> ouvrent la fiche du design
// pose ; tuile pack -> scroll vers les Mystery Packs. Images de fond en lazy.
function ShowcaseBand({ tx, onOpenDesign }) {
  const goPacks = () => document.getElementById('mystery-packs')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const capBar = (cap) => (
    <span
      className="absolute inset-x-0 bottom-0 px-4 py-3 text-white font-bold text-sm text-left"
      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}
    >
      {tx(cap)} <span className="ml-0.5">&rarr;</span>
    </span>
  )
  const frame = 'relative rounded-2xl overflow-hidden border border-white/[0.08] h-44 sm:h-52 group cursor-pointer transition-transform hover:-translate-y-0.5'
  // UI-10c : fond suivant le THEME. --bg-footer est sombre sur les 11 palettes
  // (les mockups blancs ressortent partout) + halo accent subtil via --accent-rgb.
  // Plus de mauve code en dur.
  const bg = { background: 'radial-gradient(circle at 50% 32%, rgba(var(--accent-rgb), 0.12), var(--bg-footer) 72%)' }
  return (
    <div className="mb-10">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 className="font-heading font-bold text-lg sm:text-xl text-heading">
          {tx({ fr: 'En situation', en: 'In the wild', es: 'En situacion' })}
        </h2>
        <span className="text-grey-muted text-xs">
          {tx({ fr: 'tes stickers, partout', en: 'your stickers, everywhere', es: 'tus stickers, en todas partes' })}
        </span>
      </div>
      {/* STICKERS-UI-11 : bande a 2 cartes (gourde + mystery pack), centree et
          plus large. Le grid s'adapte automatiquement au nombre d'entrees SHOWCASE. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
        {SHOWCASE.map((tile, i) =>
          tile.kind === 'pack' ? (
            <button key={i} type="button" onClick={goPacks} className={frame} style={bg} aria-label={tx(tile.cap)}>
              <div className="absolute inset-0">
                {tile.slugs.map((s, j) => (
                  <img
                    key={s}
                    loading="lazy"
                    decoding="async"
                    src={`/images/thumbs-mini/stickers-massive/${s}.webp`}
                    alt=""
                    aria-hidden="true"
                    className="sticker-stroke absolute object-contain w-[76px] h-[76px] transition-transform duration-300 group-hover:scale-105"
                    style={{ left: `calc(50% + ${PACK_POS[j][0]}px)`, top: `calc(48% + ${PACK_POS[j][1]}px)`, marginLeft: -38, marginTop: -38, transform: `rotate(${PACK_POS[j][2]}deg)`, zIndex: j }}
                  />
                ))}
              </div>
              {capBar(tile.cap)}
            </button>
          ) : tile.kind === 'photo' ? (
            /* STICKERS-UI-11 : carte "vraie photo". Ajouter une photo = UNE entree
               SHOWCASE { kind:'photo', img, href, cap:{fr,en,es} }, zero dev. */
            <a key={i} href={tile.href || undefined} className={frame} style={bg} aria-label={tx(tile.cap)}>
              <img
                loading="lazy"
                decoding="async"
                src={tile.img}
                alt={tx(tile.cap)}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {capBar(tile.cap)}
            </a>
          ) : (
            <button key={i} type="button" onClick={() => onOpenDesign(tile.design)} className={frame} style={bg} aria-label={tx(tile.cap)}>
              <div className="absolute inset-0 flex items-center justify-center pb-7">
                <div className="relative flex items-center justify-center" style={{ height: tile.productH || '76%' }}>
                  <img
                    loading="lazy"
                    decoding="async"
                    src={tile.img}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-[1.04]"
                    style={{ filter: 'drop-shadow(0 12px 26px rgba(0,0,0,0.45))' }}
                  />
                  {tile.tumbler ? (
                    <TumblerDesign design={`/images/thumbs-mini/stickers-massive/${tile.design}.webp`} rotate={-3} />
                  ) : (
                    <div className="absolute" style={{ left: '50%', top: '52%', width: tile.designW, aspectRatio: '1', transform: 'translate(-50%, -50%) rotate(-3deg)' }}>
                      <img
                        loading="lazy"
                        decoding="async"
                        src={`/images/thumbs-mini/stickers-massive/${tile.design}.webp`}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-contain"
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))' }}
                      />
                    </div>
                  )}
                </div>
              </div>
              {capBar(tile.cap)}
            </button>
          )
        )}
      </div>
    </div>
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

// UI-02/06 : fiche produit en modale, pattern Redbubble. UI-06 : visuel
// agrandi (image 800px), modale large, navigation entre designs par fleches
// (gauche/droite + clavier) en boucle sur la liste courante.
function StickerFiche({ s, catLabel, justAdded, cartQty, onAdd, onClose, onPrev, onNext, tx }) {
  const [vue, setVue] = useState('design')
  const designUrl = img(`${STICKER_DIR}/${s.slug}.webp`) // 800px (UI-06)
  const thumbUrl = thumb(`${STICKER_DIR}/${s.slug}.webp`) // 400px : vignette du switch
  // Chaque design ouvert repart sur la vue "design".
  useEffect(() => { setVue('design') }, [s.slug])
  // Clavier : Escape ferme, fleches gauche/droite naviguent (UI-06).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onPrev?.()
      else if (e.key === 'ArrowRight') onNext?.()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose, onPrev, onNext])
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl border border-white/10 p-5 sm:p-7 relative"
        style={{ backgroundColor: 'var(--bg-body)' }}
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
        <div className="grid md:grid-cols-[1.5fr_1fr] gap-6 md:gap-8">
          <div>
            <div className="rounded-2xl bg-black/25 h-80 sm:h-[26rem] md:h-[30rem] flex items-center justify-center relative overflow-hidden">
              {/* UI-06 : navigation entre designs (boucle sur la liste courante) */}
              {onPrev && (
                <button
                  type="button"
                  onClick={onPrev}
                  aria-label={tx({ fr: 'Design précédent', en: 'Previous design', es: 'Diseno anterior' })}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/45 hover:bg-accent text-white transition-colors"
                >
                  <ChevronLeft size={22} />
                </button>
              )}
              {onNext && (
                <button
                  type="button"
                  onClick={onNext}
                  aria-label={tx({ fr: 'Design suivant', en: 'Next design', es: 'Diseno siguiente' })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/45 hover:bg-accent text-white transition-colors"
                >
                  <ChevronRight size={22} />
                </button>
              )}
              {vue === 'design' ? (
                <img
                  src={designUrl}
                  alt={`Sticker ${tx(s)}`}
                  className="sticker-stroke max-h-[90%] max-w-[88%] object-contain"
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
                  <TumblerDesign design={designUrl} />
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
                <img src={thumbUrl} alt="" className="w-9 h-9 object-contain" />
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
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-heading font-bold text-2xl text-heading">{tx(s)}</h2>
              <FavoriteHeart slug={s.slug} size={20} className="shrink-0 !w-10 !h-10 mt-0.5" />
            </div>
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
            {/* CART-01/UI-07 : feedback persistant identique aux cartes. Flash
                "Ajoute !" au clic, puis retombe sur "N au panier" (vert) tant
                que le design est au panier - au lieu de revenir a "3 $". Le
                bouton reste cliquable pour ajouter une unite de plus. */}
            <button
              type="button"
              onClick={() => onAdd(s)}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold text-sm transition-all ${
                justAdded === s.slug || cartQty > 0 ? 'bg-green-500/20 text-green-400' : 'bg-accent text-white hover:brightness-110'
              }`}
            >
              {justAdded === s.slug || cartQty > 0 ? <Check size={16} /> : <ShoppingCart size={16} />}
              {justAdded === s.slug
                ? tx({ fr: 'Ajoute au panier !', en: 'Added to cart!', es: 'Agregado al carrito!' })
                : cartQty > 0
                  ? tx({ fr: `${cartQty} au panier`, en: `${cartQty} in cart`, es: `${cartQty} en el carrito` })
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
function InfiniteGrid({ items, justAdded, cartQtyBySlug, onAdd, onOpen, tx }) {
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
          <StickerCard key={s.slug} s={s} justAdded={justAdded} cartQty={cartQtyBySlug[s.slug] || 0} onAdd={onAdd} onOpen={onOpen} tx={tx} />
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

// UI-07 : widget flottant, RACCOURCI VISUEL vers le tiroir panier (CART-01).
// Remplace l'ancien bandeau texte "N/5 stickers". Sticky en haut de /stickers,
// visible seulement quand le panier contient des unites de la collection.
// Vignettes rondes des designs ajoutes + progression vers le minimum de 5
// (emplacements vides en pointille), compteur discret ; clic = ouvre le tiroir
// (le detail complet). Mobile : version compacte (vignettes reduites, sous-
// texte masque), jamais intrusive.
function CollectionWidget({ items, onOpen, tx }) {
  const collectionItems = (items || []).filter((it) =>
    String(it?.productId || '').startsWith('sticker-massive-')
  )
  const unitCount = collectionItems.reduce((sum, it) => sum + (Number(it?.quantity) || 1), 0)
  if (unitCount === 0) return null

  const MIN = STICKER_COLLECTION_MIN_UNITS
  const minMet = unitCount >= MIN

  // Vignettes affichees + emplacements pointilles :
  // - Progression (< 5) : une vignette par UNITE (repetee selon la quantite),
  //   completee a 5 slots par des pointilles -> la rangee se remplit vers le min.
  // - Minimum atteint (>= 5) : les DESIGNS distincts (max 5, surplus en "+n"),
  //   sans pointille (la progression n'a plus lieu d'etre).
  let thumbs = []
  let dotted = 0
  let extra = 0
  if (!minMet) {
    const unitThumbs = []
    for (const it of collectionItems) {
      const q = Number(it?.quantity) || 1
      for (let i = 0; i < q; i++) unitThumbs.push(it.image)
    }
    thumbs = unitThumbs.slice(0, MIN)
    dotted = Math.max(0, MIN - thumbs.length)
  } else {
    const distinct = collectionItems.map((it) => it.image)
    if (distinct.length > MIN) {
      thumbs = distinct.slice(0, MIN - 1)
      extra = distinct.length - (MIN - 1)
    } else {
      thumbs = distinct
    }
  }

  return (
    <div className="fixed top-[64px] sm:top-[72px] left-1/2 -translate-x-1/2 z-40 px-2">
      <button
        type="button"
        onClick={onOpen}
        aria-label={tx({
          fr: `${unitCount} sticker${unitCount > 1 ? 's' : ''} au panier, ouvrir le panier`,
          en: `${unitCount} sticker${unitCount > 1 ? 's' : ''} in cart, open cart`,
          es: `${unitCount} sticker${unitCount > 1 ? 's' : ''} en el carrito, abrir el carrito`,
        })}
        className="flex items-center gap-2 sm:gap-3 rounded-full border border-accent/35 shadow-xl pl-2.5 pr-3 sm:pl-3.5 sm:pr-4 py-1.5 sm:py-2 hover:brightness-110 transition-all"
        style={{ background: 'var(--bg-footer)' }}
      >
        <div className="flex items-center pl-1.5 sm:pl-2">
          {thumbs.map((src, i) => (
            <div
              key={i}
              className="-ml-1.5 sm:-ml-2 w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-accent/50 bg-black/30 overflow-hidden flex items-center justify-center"
            >
              <img src={src} alt="" aria-hidden="true" className="sticker-stroke w-full h-full object-contain" />
            </div>
          ))}
          {extra > 0 && (
            <div className="-ml-1.5 sm:-ml-2 w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-accent/50 bg-black/50 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold">
              +{extra}
            </div>
          )}
          {Array.from({ length: dotted }).map((_, i) => (
            <div
              key={`d${i}`}
              className="-ml-1.5 sm:-ml-2 w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-dashed border-white/25"
              aria-hidden="true"
            />
          ))}
        </div>
        <div className="flex flex-col items-start leading-tight">
          <span className={`flex items-center gap-1 font-bold text-[13px] sm:text-[15px] ${minMet ? 'text-green-400' : 'text-white'}`}>
            {minMet && <Check size={13} />}
            {minMet ? unitCount : `${unitCount}/${MIN}`}
          </span>
          {!minMet && (
            <span className="hidden sm:block text-[11px] text-white/80">
              {tx({
                fr: `ajoute ${MIN - unitCount} de plus`,
                en: `add ${MIN - unitCount} more`,
                es: `agrega ${MIN - unitCount} mas`,
              })}
            </span>
          )}
        </div>
        <ShoppingCart size={16} className="text-white flex-shrink-0" />
      </button>
    </div>
  )
}

function MassiveStickers() {
  const { tx } = useLang()
  const { items: cartItems, addToCart, openCartDrawer } = useCart()
  const { favorites } = useFavorites()
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

  // STICKERS-HERO-PERF (PERF-01) : le design vedette est choisi AVANT le paint
  // par le mini-script inline de index.html (window.__HERO_IDX__ + <link preload>
  // de CETTE image, avant le bundle). On lit le MEME index ici -> le hero affiche
  // exactement l'image prechargee : une seule image, chargee tot, ZERO swap.
  // Initial null + garde prerender -> le HTML prerendu ne contient PAS d'image
  // hero (pas de mismatch d'hydratation, aucun chargement gaspille) ; le client
  // la pose au mount depuis l'index prechoisi. Random par visite conserve.
  const [heroSticker, setHeroSticker] = useState(null)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.__MASSIVE_PRERENDER__) return
    const pool = (typeof window !== 'undefined' && window.__HERO_POOL__) || null
    const idx = (typeof window !== 'undefined' && typeof window.__HERO_IDX__ === 'number') ? window.__HERO_IDX__ : 0
    const slug = pool ? pool[idx] : null
    const design = (slug && MASSIVE_STICKERS.find((s) => s.slug === slug)) || MASSIVE_STICKERS[0]
    setHeroSticker(design)
  }, [])

  // CART-01 : quantite au panier par slug de design, pour le feedback
  // persistant "N au panier" sur le bouton de chaque carte. Le productId est
  // `sticker-massive-<slug sans prefixe massive->` ; on remonte au slug du
  // manifest (`massive-<...>`) pour matcher s.slug.
  const cartQtyBySlug = useMemo(() => {
    const map = {}
    for (const it of cartItems || []) {
      const pid = String(it?.productId || '')
      if (!pid.startsWith('sticker-massive-')) continue
      const slug = 'massive-' + pid.replace('sticker-massive-', '')
      map[slug] = (map[slug] || 0) + (Number(it?.quantity) || 1)
    }
    return map
  }, [cartItems])

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

  const favSet = useMemo(() => new Set(favorites), [favorites])
  const visibles = useMemo(() => {
    const q = normalizeSearchText(query).trim()
    return MASSIVE_STICKERS.filter((s) => {
      // STICKERS-FAV : le filtre favoris est un filtre DUR (s'applique meme
      // pendant une recherche -> la recherche est scopee aux favoris).
      if (activeCat === 'favoris' && !favSet.has(s.slug)) return false
      // STICKERS-NAMES : la recherche matche les TROIS langues, peu importe
      // l'interface active (chercher "skull" trouve les designs en interface FR).
      if (q) return [s.fr, s.en, s.es].some((n) => normalizeSearchText(n).includes(q))
      if (activeCat !== 'all' && activeCat !== 'favoris' && s.cat !== activeCat) return false
      return true
    })
  }, [activeCat, query, favSet])

  // STICKERS-FAV : si on retire son dernier favori en etant sur la vue favoris,
  // revenir a l'accueil (le chip disparait aussi sous 1 favori).
  useEffect(() => {
    if (activeCat === 'favoris' && favorites.length === 0) setActiveCat('all')
  }, [favorites.length, activeCat])

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

      {/* UI-07 : widget flottant (fixed), raccourci vers le tiroir panier */}
      <CollectionWidget items={cartItems} onOpen={openCartDrawer} tx={tx} />

      <div className="max-w-7xl mx-auto">
        {/* STICKERS-HERO : hero facon pages services (ServiceDetail) - breadcrumb,
            titre + icone, tagline, ligne specs, rangee CTA, et sticker vedette
            ALEATOIRE a droite. Remplace l'ancien bloc titre centre. Le sticker
            est tire au hasard parmi les 270 au runtime client (stable au
            prerender via heroSticker), cliquable vers sa fiche. */}
        <section className="relative overflow-hidden rounded-3xl mb-10">
          <div className="absolute inset-0 hero-aurora" aria-hidden="true" />
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 px-6 sm:px-10 py-9 sm:py-11">
            {/* Colonne texte */}
            <div className="lg:flex-[1.35] w-full text-center lg:text-left">
              {/* Breadcrumb */}
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-3 text-sm">
                <Link to="/" className="text-grey-muted hover:text-accent transition-colors">
                  {tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' })}
                </Link>
                <span className="text-grey-muted">/</span>
                <span className="text-accent font-semibold">
                  {tx({ fr: 'Collection Stickers', en: 'Sticker Collection', es: 'Coleccion de Stickers' })}
                </span>
              </div>
              {/* Titre + icone */}
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-3">
                <span className="p-2.5 rounded-xl icon-bg-blur flex-shrink-0">
                  <Sticker size={26} className="text-accent" />
                </span>
                <h1 className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl text-heading leading-[1.05]">
                  {tx({ fr: 'Collection Stickers Massive', en: 'Massive Sticker Collection', es: 'Coleccion de Stickers Massive' })}
                </h1>
              </div>
              {/* Tagline #1 (choix Mika) */}
              <p className="text-base md:text-lg text-grey-light mb-3 max-w-xl mx-auto lg:mx-0">
                {tx({
                  fr: "Les chaînes d'usine, c'est pour la paperasse. Ici, on colle pour la culture.",
                  en: 'Assembly lines are for paperwork. Here, we stick for the culture.',
                  es: 'Las líneas de montaje son para el papeleo. Aquí, pegamos por la cultura.',
                })}
              </p>
              {/* Ligne specs : reprend l'info de l'ancien sous-titre (SEO + shopper).
                  MICRO-FIX 12 juillet : texte raccourci + lg:whitespace-nowrap pour
                  tenir sur UNE ligne au desktop (evite le "5" orphelin). Sur mobile le
                  wrap reste permis, mais le prix et "minimum X" sont insecables (nbsp
                   ) -> jamais un chiffre seul sur une ligne. */}
              <p className="text-sm text-grey-muted mb-6 max-w-xl mx-auto lg:mx-0 lg:whitespace-nowrap lg:text-[13px]">
                {tx({
                  fr: `${MASSIVE_STICKERS.length} designs créés à Montréal · vinyle die-cut, résistant eau et UV · ${STICKER_COLLECTION_UNIT_PRICE}\u00A0$, minimum\u00A0${STICKER_COLLECTION_MIN_UNITS}`,
                  en: `${MASSIVE_STICKERS.length} designs made in Montreal · die-cut vinyl, water & UV proof · $${STICKER_COLLECTION_UNIT_PRICE}, minimum\u00A0${STICKER_COLLECTION_MIN_UNITS}`,
                  es: `${MASSIVE_STICKERS.length} diseños hechos en Montreal · vinilo die-cut, resistente al agua y UV · ${STICKER_COLLECTION_UNIT_PRICE}\u00A0$, mínimo\u00A0${STICKER_COLLECTION_MIN_UNITS}`,
                })}
              </p>
              {/* Rangee CTA : (a) explorer la collection (scroll) + (b) custom (service) */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <button
                  type="button"
                  onClick={() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="btn-primary justify-center"
                >
                  <Sparkles size={18} className="mr-2" />
                  {tx({ fr: 'Explorer la collection', en: 'Explore the collection', es: 'Explorar la coleccion' })}
                </button>
                <Link to="/services/stickers" className="btn-outline justify-center">
                  <Scissors size={16} className="mr-2" />
                  {tx({ fr: 'Créer mes stickers custom', en: 'Create custom stickers', es: 'Crear stickers custom' })}
                </Link>
              </div>
            </div>
            {/* Colonne visuelle : sticker vedette (design prechoisi + precharge
                par le script inline, cf. heroSticker). Rendu SEULEMENT une fois
                l'index lu au mount -> pas d'image hero dans le HTML prerendu ; le
                min-h reserve la place (zero CLS). Cliquable vers la fiche. */}
            <div className="lg:flex-1 flex flex-col items-center justify-center min-h-[300px]">
              {heroSticker && (
                <button
                  type="button"
                  onClick={() => setFicheSlug(heroSticker.slug)}
                  className="group flex flex-col items-center"
                  aria-label={tx({ fr: `Voir le sticker ${heroSticker.fr}`, en: `View the ${heroSticker.en} sticker`, es: `Ver el sticker ${heroSticker.es}` })}
                >
                  <span
                    className="inline-block transition-transform duration-300 group-hover:-translate-y-1"
                    style={{ transform: 'rotate(-4deg)', filter: 'drop-shadow(0 22px 45px rgba(0,0,0,0.5))' }}
                  >
                    {/* Image deja prechargee (script inline, fetchpriority high) ->
                        paint immediat au mount. Die-cut aux ratios varies : borne
                        par max-w ET max-h (w/h auto) pour une taille homogene. */}
                    <img
                      src={img(`${STICKER_DIR}/${heroSticker.slug}.webp`)}
                      alt={tx(heroSticker)}
                      decoding="async"
                      className="sticker-stroke w-auto h-auto max-w-[230px] sm:max-w-[260px] max-h-[260px] sm:max-h-[300px] object-contain"
                    />
                  </span>
                  <span className="text-grey-light text-sm mt-5 group-hover:text-accent transition-colors">
                    {tx(heroSticker)}
                  </span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* UI-07 : le widget flottant (rendu plus bas, fixed) remplace l'ancien
            bandeau texte de progression - juge pas assez design. */}

        {/* Mystery Packs : designs choisis par Massive, hors minimum.
            UI-10 : id ancre pour le scroll depuis la tuile pack de la bande vitrine. */}
        <div id="mystery-packs" className="max-w-4xl mx-auto mb-10 scroll-mt-24">
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

        {/* ARCHI-03 : bandeau "stickers custom" RETIRE (STICKERS-HERO, choix
            Mika). Le message custom est desormais porte par le CTA "Créer mes
            stickers custom" du hero, au-dessus de la ligne de flottaison -
            garder les deux dupliquait le message. Le nav "Services" y mene aussi. */}

        {/* Recherche par nom. STICKERS-HERO : ancre "collection" ciblee par le
            CTA "Explorer la collection" du hero (scroll doux sous le header). */}
        <div id="collection" className="max-w-md mx-auto mb-6 relative scroll-mt-24">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tx({ fr: 'Chercher un sticker...', en: 'Search a sticker...', es: 'Buscar un sticker...' })}
            className="w-full rounded-full text-sm pl-9 pr-4 py-2.5 outline-none border border-white/10 bg-black/20 text-heading focus:border-accent transition-colors"
          />
        </div>

        {/* STICKERS-FAV : chip "Mes favoris", visible des 1 favori, a cote des
            familles. Toggle entre la vue favoris et l'accueil. */}
        {favorites.length > 0 && (
          <div className="flex justify-center mb-6">
            <button
              type="button"
              onClick={() => { setQuery(''); setActiveCat(activeCat === 'favoris' ? 'all' : 'favoris') }}
              aria-pressed={activeCat === 'favoris'}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeCat === 'favoris'
                  ? 'bg-accent text-white shadow-md'
                  : 'text-accent ring-1 ring-accent/40 bg-[rgba(var(--accent-rgb),0.12)] hover:bg-[rgba(var(--accent-rgb),0.2)]'
              }`}
            >
              <Heart size={13} fill="currentColor" />
              {tx({ fr: 'Mes favoris', en: 'My favorites', es: 'Mis favoritos' })} ({favorites.length})
            </button>
          </div>
        )}

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
              cartQtyBySlug={cartQtyBySlug}
              justAdded={justAdded}
              onAdd={addUnitToCart}
              onOpen={(d) => setFicheSlug(d.slug)}
              tx={tx}
            />
          )
        ) : activeCat === 'all' ? (
          <div>
            {/* Cartes de familles UI-04/10 : eventails ouverts, 1 sur ACCENT_EVERY
                accentuee. gap-y plus large pour laisser deborder les stickers. */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 sm:gap-x-4 gap-y-6 mb-9">
              {FAMILY_ORDER.map((catId, i) => {
                const cat = MASSIVE_STICKER_CATEGORIES.find((c) => c.id === catId)
                if (!cat || !countByCat[catId]) return null
                return (
                  <FamilleCard key={catId} cat={cat} count={countByCat[catId]} tx={tx} onOpen={setActiveCat} accent={i % ACCENT_EVERY === 2} />
                )
              })}
            </div>

            {/* UI-10 : bande vitrine "en situation" entre familles et catalogue */}
            <ShowcaseBand tx={tx} onOpenDesign={(slug) => setFicheSlug(slug)} />

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
              cartQtyBySlug={cartQtyBySlug}
              justAdded={justAdded}
              onAdd={addUnitToCart}
              onOpen={(d) => setFicheSlug(d.slug)}
              tx={tx}
            />
          </div>
        ) : activeCat === 'favoris' ? (
          <div>
            {/* STICKERS-FAV : vue favoris. Le chip "Mes favoris" ci-dessus (actif)
                sert de titre + toggle retour. */}
            {visibles.length === 0 ? (
              <p className="text-center text-grey-muted py-16">
                {tx({ fr: 'Aucun favori pour l\'instant. Touche le coeur sur un design.', en: 'No favorites yet. Tap the heart on a design.', es: 'Aun no hay favoritos. Toca el corazon en un diseno.' })}
              </p>
            ) : (
              <InfiniteGrid
                key="favoris"
                items={visibles}
                cartQtyBySlug={cartQtyBySlug}
                justAdded={justAdded}
                onAdd={addUnitToCart}
                onOpen={(d) => setFicheSlug(d.slug)}
                tx={tx}
              />
            )}
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
              cartQtyBySlug={cartQtyBySlug}
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
        // UI-06 : navigation fleches en BOUCLE sur la liste actuellement
        // affichee (recherche/famille -> visibles ; accueil -> catalogue).
        const navList = (isSearching || activeCat !== 'all') ? visibles : catalogue
        const go = (dir) => {
          const idx = navList.findIndex((d) => d.slug === ficheSlug)
          if (idx < 0) return
          const target = navList[(idx + dir + navList.length) % navList.length]
          if (target) setFicheSlug(target.slug)
        }
        const canNav = navList.length > 1
        return (
          <StickerFiche
            s={s}
            catLabel={cat ? tx(cat) : ''}
            justAdded={justAdded}
            cartQty={cartQtyBySlug[s.slug] || 0}
            onAdd={addUnitToCart}
            onClose={() => setFicheSlug(null)}
            onPrev={canNav ? () => go(-1) : undefined}
            onNext={canNav ? () => go(1) : undefined}
            tx={tx}
          />
        )
      })()}
    </div>
  )
}

export default MassiveStickers
