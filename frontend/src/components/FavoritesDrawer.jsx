import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Heart, Plus, ShoppingBag } from 'lucide-react'
import FavoriteHeart from './FavoriteHeart'
import { useFavorites } from '../contexts/FavoritesContext'
import { useCart } from '../contexts/CartContext'
import { useArtists } from '../hooks/useArtists'
import { useLang } from '../i18n/LanguageContext'
import { MASSIVE_STICKERS } from '../data/massiveStickers'
import { isHiddenSticker } from '../data/stickersModeration'
import { getCollectionStickerPrice, STICKER_COLLECTION_MIN_UNITS } from '../data/products'
import { thumb } from '../utils/paths'

/**
 * FAV-04 : tiroir lateral des favoris, jumeau visuel du mini-panier (CART-01).
 * S'ouvre au clic d'un coeur (ajout) et au bouton hero "Mes favoris". PRIORITE
 * PANIER : ne s'affiche jamais par-dessus le tiroir panier (coordonne dans
 * FavoritesContext) ; le tiroir PANIER, lui, reste modal (l'achat merite le
 * focus) et n'est pas touche par ce qui suit.
 *
 * FAV-05 (retours Mika) : en DESKTOP le tiroir devient un PANNEAU COMPAGNON
 * NON-MODAL. Plus de voile bloquant : la page reste interactive, on peut aimer
 * ou retirer d'autres designs pendant qu'il est ouvert et il se met a jour en
 * direct. Fermeture par X et par le bouton hero (toggle) ; le clic-exterieur-
 * ferme disparait en desktop (incompatible avec "cliquer un autre coeur"). Il
 * est aussi REDIMENSIONNABLE : grip sur le bord gauche, drag entre 320px et
 * 50 % du viewport, largeur persistee (localStorage massive-fav-drawer-width),
 * double-clic sur le grip = retour a la largeur par defaut. Les grilles
 * internes sont en auto-fill : plus large = plus de colonnes.
 * MOBILE : inchange (feuille modale plein ecran, voile, clic-voile ferme,
 * scroll de fond bloque). Le mode est choisi par matchMedia 640px (= breakpoint
 * `sm` de Tailwind, celui que le tiroir utilisait deja).
 *
 * IMPORTANT - pourquoi transitions CSS et PAS AnimatePresence : ce tiroir est
 * MONTE EN PERMANENCE, ferme via classe (translate-x-full + pointer-events
 * none), ouvert via classe (visible). Choix DEFENSIF : l'etat ferme (zero
 * blocage) est applique IMMEDIATEMENT par la classe, sans dependre qu'une
 * animation JS se termine. Un tiroir base sur AnimatePresence ne se demonte
 * qu'a la fin de l'animation d'exit (pilotee par requestAnimationFrame) ; si
 * l'onglet est en arriere-plan, rAF est throttle, l'exit stalle et le voile
 * plein ecran reste monte -> bloque les clics. Le montage permanent + CSS
 * evite ce piege quel que soit l'etat de l'onglet.
 *
 * Deux groupes : stickers (retirables + ajout panier + pont "ajouter au panier"
 * avec rappel du minimum 5) et prints d'artistes (retirables + cliquables vers
 * l'oeuvre). Le PONT PANIER reste STICKERS SEULEMENT. Monte dans MainLayout.
 */
const FAV_WIDTH_KEY = 'massive-fav-drawer-width'
const FAV_WIDTH_DEFAULT = 390
const FAV_WIDTH_MIN = 320
// Le breakpoint du mode compagnon = `sm` Tailwind, deja utilise par le tiroir.
const DESKTOP_QUERY = '(min-width: 640px)'

const clampWidth = (w) =>
  Math.min(Math.max(w, FAV_WIDTH_MIN), Math.round(window.innerWidth * 0.5))

export default function FavoritesDrawer() {
  const { favorites, favoritesPrints, favDrawerOpen, closeFavDrawer } = useFavorites()
  const { addToCart } = useCart()
  const { artists } = useArtists()
  const { tx } = useLang()
  const navigate = useNavigate()

  // Mode compagnon (desktop) vs feuille modale (mobile), vivant au resize.
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches,
  )
  // FAV-05b : hauteur reelle du header (py-2 + contenu = variable). En desktop
  // le panneau compagnon commence SOUS la barre de nav : le menu reste visible
  // et cliquable tiroir ouvert (la navigation continue). Mesuree, pas devinee.
  const [headerH, setHeaderH] = useState(0)
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY)
    const onChange = () => {
      setIsDesktop(mq.matches)
      setHeaderH(document.querySelector('header')?.getBoundingClientRect().height || 0)
    }
    onChange()
    mq.addEventListener('change', onChange)
    // Filet DEFENSIF : dans un onglet en arriere-plan, Chrome differe les
    // evenements matchMedia 'change' (meme famille que le throttle rAF, cf.
    // lecon FAV-04). Le resize de window, lui, arrive -> on re-lit mq.matches.
    // setState a valeur identique = no-op React, ca ne coute rien.
    window.addEventListener('resize', onChange)
    return () => { mq.removeEventListener('change', onChange); window.removeEventListener('resize', onChange) }
  }, [])

  // Largeur du panneau (desktop) : persistee, clampee a l'application (le
  // viewport d'aujourd'hui n'est pas celui d'hier).
  const [width, setWidth] = useState(() => {
    if (typeof window === 'undefined') return FAV_WIDTH_DEFAULT
    const saved = parseInt(localStorage.getItem(FAV_WIDTH_KEY) || '', 10)
    return Number.isFinite(saved) ? saved : FAV_WIDTH_DEFAULT
  })
  const [dragging, setDragging] = useState(false)

  const startDrag = useCallback((e) => {
    e.preventDefault()
    setDragging(true)
    const onMove = (ev) => setWidth(clampWidth(window.innerWidth - ev.clientX))
    const onUp = (ev) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      setDragging(false)
      const w = clampWidth(window.innerWidth - ev.clientX)
      setWidth(w)
      try { localStorage.setItem(FAV_WIDTH_KEY, String(w)) } catch { /* prive */ }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [])

  const resetWidth = useCallback(() => {
    setWidth(FAV_WIDTH_DEFAULT)
    try { localStorage.removeItem(FAV_WIDTH_KEY) } catch { /* prive */ }
  }, [])

  // Pendant le drag : curseur global + pas de selection de texte (sinon le
  // drag surligne la page), et la transition du panneau est coupee (suivi 1:1).
  useEffect(() => {
    if (!dragging) return
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    return () => { document.body.style.cursor = ''; document.body.style.userSelect = '' }
  }, [dragging])

  // Escape ferme (les deux modes). Le scroll de fond n'est bloque qu'en MOBILE :
  // en desktop le panneau est un compagnon, la page doit rester utilisable.
  useEffect(() => {
    if (!favDrawerOpen) return
    const onKey = (e) => { if (e.key === 'Escape') closeFavDrawer() }
    document.addEventListener('keydown', onKey)
    if (!isDesktop) document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [favDrawerOpen, closeFavDrawer, isDesktop])

  // Resolution stickers (data locale) + prints (CMS, par print.id stable).
  const favStickers = favorites
    // C5 : un design masque (HIDDEN) ne doit plus reapparaitre chez qui l'avait
    // mis en favori avant le masquage (ni etre rajoutable au panier).
    .filter((slug) => !isHiddenSticker(slug))
    .map((slug) => MASSIVE_STICKERS.find((s) => s.slug === slug))
    .filter(Boolean)
  const printLookup = {}
  Object.values(artists || {}).forEach((a) => {
    (a?.prints || []).forEach((p) => {
      if (p && p.id) printLookup[p.id] = { print: p, artistSlug: a.slug, artistName: a.name }
    })
  })
  const favPrints = (favoritesPrints || [])
    .map((id) => printLookup[id])
    .filter(Boolean)
  const total = favStickers.length + favPrints.length
  const printTitle = (p) => tx({ fr: p.titleFr, en: p.titleEn, es: p.titleEs || p.titleEn })

  // Pont panier (stickers seulement). addToCart ouvre le tiroir panier -> la
  // coordination (FavoritesContext) ferme ce tiroir favoris (priorite panier).
  const addOne = (s) => {
    const info = getCollectionStickerPrice(1)
    addToCart({
      productId: `sticker-massive-${s.slug.replace(/^massive-/, '')}`,
      sku: s.slug,
      productName: tx({ fr: `Sticker ${s.fr}`, en: `Sticker ${s.en}`, es: `Sticker ${s.es}` }),
      quantity: 1,
      unitPrice: info.unitPrice,
      totalPrice: info.price,
      image: thumb(`/images/stickers-massive/${s.slug}.webp`),
    })
  }
  const addAllStickers = () => { favStickers.forEach(addOne) }
  const goPrint = (artistSlug, id) => { closeFavDrawer(); navigate(`/artistes/${artistSlug}?print=${id}`) }

  return (
    // FAV-05 : le wrapper est TOUJOURS transparent aux clics (pointer-events
    // none) ; seuls le voile (mobile) et le panneau reactivent les leurs quand
    // ouverts. C'est ce qui rend la page interactive sous le panneau desktop :
    // les coeurs de la grille restent cliquables, le tiroir se met a jour en
    // direct.
    // FAV-05b : en DESKTOP le panneau vit SOUS le header (top = hauteur mesuree
    // du header, z-40 < z-50 du header) -> le menu reste visible ET cliquable
    // tiroir ouvert. En MOBILE, feuille modale plein ecran au-dessus de tout
    // (z-60), comme le tiroir PANIER - qui lui reste volontairement modal et
    // couvre le header (l'achat merite le focus, statue FAV-05b).
    <div
      className={`fixed inset-x-0 bottom-0 flex justify-end pointer-events-none ${isDesktop ? 'z-40' : 'z-[60]'}`}
      style={{ top: isDesktop ? headerH : 0 }}
      aria-hidden={!favDrawerOpen}
    >
      {/* Voile leger (15% + blur) : MOBILE SEULEMENT (feuille modale). En
          desktop il n'existe plus - le clic-exterieur-ferme disparait avec lui
          (incompatible avec "aimer un autre design tiroir ouvert"). */}
      {!isDesktop && (
        <div
          className={`absolute inset-0 bg-black/[0.15] backdrop-blur-[2px] transition-opacity duration-200 ${favDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`}
          onClick={closeFavDrawer}
          aria-hidden="true"
        />
      )}

      {/* Panneau : plein ecran mobile, largeur reglable desktop (drag du grip).
          Slide par transform CSS (ferme = hors ecran a droite). La transition
          est coupee pendant le drag pour un suivi 1:1 du pointeur. */}
      <aside
        className={`relative w-full h-full flex flex-col ml-auto ${dragging ? '' : 'transition-transform duration-[250ms] ease-out'} ${favDrawerOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full'}`}
        style={{
          width: isDesktop && typeof window !== 'undefined' ? `${clampWidth(width)}px` : undefined,
          // FAV-05b : plus de --bg-footer (quasi noir, meme mal que #103/#105) ni
          // de lisere accent. Surface = LE composite exact des cartes du site :
          // fond de page + voile bg-glass par-dessus -> opaque, suit les 11
          // palettes. Les textes du tiroir passent aux jetons de theme (regle
          // #103 : surface qui suit le theme = jetons, jamais de blanc en dur).
          backgroundColor: 'var(--bg-body)',
          backgroundImage: 'linear-gradient(var(--bg-glass), var(--bg-glass))',
          boxShadow: '-16px 0 44px rgba(0,0,0,0.25)',
        }}
        role="dialog"
        aria-modal={!isDesktop || undefined}
        aria-label={tx({ fr: 'Mes favoris', en: 'My favorites', es: 'Mis favoritos' })}
        aria-hidden={!favDrawerOpen}
      >
        {/* FAV-05 : grip de redimensionnement (desktop). Drag = largeur entre
            320px et 50 % du viewport ; double-clic = retour a 390px. */}
        {isDesktop && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label={tx({ fr: 'Redimensionner le panneau (double-clic : reinitialiser)', en: 'Resize the panel (double-click: reset)', es: 'Redimensionar el panel (doble clic: restablecer)' })}
            onPointerDown={startDrag}
            onDoubleClick={resetWidth}
            className="absolute left-0 top-0 h-full w-2.5 -ml-1 cursor-col-resize z-10 group/grip"
          >
            {/* FAV-05b : INVISIBLE au repos (le curseur col-resize suffit).
                Feedback subtil au survol et pendant le drag seulement, en jeton
                de theme - jamais de bordure permanente. */}
            <div
              className={`absolute left-[3px] top-1/2 -translate-y-1/2 h-14 w-1 rounded-full transition-opacity ${dragging ? 'opacity-100' : 'opacity-0 group-hover/grip:opacity-100'}`}
              style={{ background: 'var(--outline-border)' }}
            />
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--table-border)' }}>
          <h3 className="text-heading font-heading font-bold text-lg flex items-center gap-2">
            <Heart size={18} fill="currentColor" className="text-accent" />
            {tx({ fr: 'Mes favoris', en: 'My favorites', es: 'Mis favoritos' })} ({total})
          </h3>
          <button
            type="button"
            onClick={closeFavDrawer}
            aria-label={tx({ fr: 'Fermer', en: 'Close', es: 'Cerrar' })}
            className="p-2 rounded-full bg-glass-alt text-heading hover:brightness-125 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Corps scrollable : deux groupes */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {total === 0 ? (
            <div className="text-center py-16">
              <Heart size={28} className="mx-auto text-grey-muted mb-3" />
              <p className="text-grey-light text-sm">
                {tx({
                  fr: 'Aucun favori pour l\'instant. Touche le coeur sur un design ou une oeuvre.',
                  en: 'No favorites yet. Tap the heart on a design or artwork.',
                  es: 'Aun no hay favoritos. Toca el corazon en un diseno u obra.',
                })}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Groupe STICKERS */}
              {favStickers.length > 0 && (
                <section>
                  <h4 className="text-grey-light text-[11px] font-bold uppercase tracking-wider mb-2.5">
                    {tx({ fr: 'Stickers', en: 'Stickers', es: 'Stickers' })} ({favStickers.length})
                  </h4>
                  {/* FAV-05 : auto-fill -> le nombre de colonnes suit la largeur
                      du panneau (~3 a 390px, davantage une fois elargi). */}
                  <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}>
                    {favStickers.map((s) => (
                      <div key={s.slug} className="relative rounded-lg bg-glass-alt p-2 flex flex-col items-center">
                        <FavoriteHeart slug={s.slug} size={13} className="absolute top-1 right-1 z-10" />
                        <img
                          src={thumb(`/images/stickers-massive/${s.slug}.webp`)}
                          alt={tx(s)}
                          loading="lazy"
                          className="sticker-stroke w-full aspect-square object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => addOne(s)}
                          aria-label={`${tx({ fr: 'Ajouter au panier', en: 'Add to cart', es: 'Agregar al carrito' })} ${tx(s)}`}
                          className="mt-1.5 w-full inline-flex items-center justify-center gap-0.5 py-1 rounded-full text-[10px] font-semibold bg-accent text-white hover:brightness-110 transition-all"
                        >
                          <Plus size={10} />
                          {tx({ fr: 'Panier', en: 'Cart', es: 'Carrito' })}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Groupe PRINTS (cliquables vers l'oeuvre, PAS de panier ici) */}
              {favPrints.length > 0 && (
                <section>
                  <h4 className="text-grey-light text-[11px] font-bold uppercase tracking-wider mb-2.5">
                    {tx({ fr: 'Prints d\'artistes', en: 'Artist prints', es: 'Prints de artistas' })} ({favPrints.length})
                  </h4>
                  <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))' }}>
                    {favPrints.map(({ print, artistSlug, artistName }) => (
                      <div key={print.id} className="relative rounded-lg bg-glass-alt overflow-hidden group">
                        <FavoriteHeart space="prints" slug={print.id} size={13} className="absolute top-1 right-1 z-10" />
                        <button
                          type="button"
                          onClick={() => goPrint(artistSlug, print.id)}
                          className="block w-full text-left"
                        >
                          <img
                            src={print.image}
                            alt={printTitle(print)}
                            loading="lazy"
                            className="w-full aspect-[4/5] object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <p className="px-1.5 pt-1 text-[10px] text-heading font-semibold truncate">{printTitle(print)}</p>
                          <p className="px-1.5 pb-1.5 text-[9px] text-accent truncate">{artistName}</p>
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Footer : pont panier (stickers) + rappel minimum 5 + continuer */}
        {total > 0 && (
          <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid var(--table-border)' }}>
            {favStickers.length > 0 && (
              <>
                <p className="text-xs text-grey-light mb-2.5 flex items-center gap-1.5">
                  <ShoppingBag size={12} className="text-accent" />
                  {tx({
                    fr: `Minimum ${STICKER_COLLECTION_MIN_UNITS} stickers par commande (collection).`,
                    en: `Minimum ${STICKER_COLLECTION_MIN_UNITS} stickers per order (collection).`,
                    es: `Minimo ${STICKER_COLLECTION_MIN_UNITS} stickers por pedido (coleccion).`,
                  })}
                </p>
                <button
                  type="button"
                  onClick={addAllStickers}
                  className="w-full py-3 rounded-full font-semibold text-sm bg-accent text-white hover:brightness-110 transition-all mb-2.5"
                >
                  {tx({
                    fr: `Ajouter mes favoris au panier (${favStickers.length})`,
                    en: `Add my favorites to cart (${favStickers.length})`,
                    es: `Agregar mis favoritos al carrito (${favStickers.length})`,
                  })}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={closeFavDrawer}
              className="btn-outline w-full justify-center text-sm"
            >
              {tx({ fr: 'Continuer mes achats', en: 'Keep shopping', es: 'Seguir comprando' })}
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
