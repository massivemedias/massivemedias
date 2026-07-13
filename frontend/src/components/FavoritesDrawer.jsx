import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Heart, Plus, ShoppingBag } from 'lucide-react'
import FavoriteHeart from './FavoriteHeart'
import { useFavorites } from '../contexts/FavoritesContext'
import { useCart } from '../contexts/CartContext'
import { useArtists } from '../hooks/useArtists'
import { useLang } from '../i18n/LanguageContext'
import { MASSIVE_STICKERS } from '../data/massiveStickers'
import { getCollectionStickerPrice, STICKER_COLLECTION_MIN_UNITS } from '../data/products'
import { thumb } from '../utils/paths'

/**
 * FAV-04 : tiroir lateral des favoris, jumeau visuel du mini-panier (CART-01) -
 * meme voile leger (15% + blur), meme slide 390px desktop / bottom-sheet mobile,
 * meme fermeture (voile / X / Escape). S'ouvre au clic d'un coeur (ajout) et au
 * clic du bouton hero "Mes favoris". PRIORITE PANIER : ne s'affiche jamais
 * par-dessus le tiroir panier (coordonne dans FavoritesContext).
 *
 * IMPORTANT - pourquoi transitions CSS et PAS AnimatePresence : ce tiroir est
 * MONTE EN PERMANENCE, ferme via classe (translate-x-full + opacity 0 +
 * pointer-events none), ouvert via classe (visible). Choix DEFENSIF : l'etat
 * ferme (pointer-events none = zero blocage) est applique IMMEDIATEMENT par la
 * classe, sans dependre qu'une animation JS se termine. Un tiroir base sur
 * AnimatePresence ne se demonte qu'a la fin de l'animation d'exit (pilotee par
 * requestAnimationFrame) ; si l'onglet est en arriere-plan, rAF est throttle,
 * l'exit stalle et le voile plein ecran reste monte -> bloque les clics. Le
 * montage permanent + CSS evite ce piege quel que soit l'etat de l'onglet.
 *
 * Deux groupes : stickers (retirables + ajout panier + pont "ajouter au panier"
 * avec rappel du minimum 5) et prints d'artistes (retirables + cliquables vers
 * l'oeuvre). Le PONT PANIER reste STICKERS SEULEMENT. Monte dans MainLayout.
 */
export default function FavoritesDrawer() {
  const { favorites, favoritesPrints, favDrawerOpen, closeFavDrawer } = useFavorites()
  const { addToCart } = useCart()
  const { artists } = useArtists()
  const { tx } = useLang()
  const navigate = useNavigate()

  // Escape ferme, et on bloque le scroll de fond quand le tiroir est ouvert.
  useEffect(() => {
    if (!favDrawerOpen) return
    const onKey = (e) => { if (e.key === 'Escape') closeFavDrawer() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [favDrawerOpen, closeFavDrawer])

  // Resolution stickers (data locale) + prints (CMS, par print.id stable).
  const favStickers = favorites
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
    <div
      className={`fixed inset-0 z-[60] flex justify-end transition-opacity duration-200 ${favDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      aria-hidden={!favDrawerOpen}
    >
      {/* Voile leger (15% + blur). Clic exterieur = fermeture. */}
      <div className="absolute inset-0 bg-black/[0.15] backdrop-blur-[2px]" onClick={closeFavDrawer} aria-hidden="true" />

      {/* Tiroir : plein ecran mobile (bottom-sheet via ml-auto), 390px desktop.
          Slide par transform CSS (ferme = hors ecran a droite). */}
      <aside
        className={`relative w-full sm:w-[390px] sm:max-w-[92vw] h-full flex flex-col ml-auto transition-transform duration-[250ms] ease-out ${favDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: 'var(--bg-footer)', borderLeft: '1px solid rgba(var(--accent-rgb), 0.3)', boxShadow: '-24px 0 60px rgba(0,0,0,0.5)' }}
        role="dialog"
        aria-label={tx({ fr: 'Mes favoris', en: 'My favorites', es: 'Mis favoritos' })}
        aria-hidden={!favDrawerOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <h3 className="text-white font-heading font-bold text-lg flex items-center gap-2">
            <Heart size={18} fill="currentColor" className="text-accent" />
            {tx({ fr: 'Mes favoris', en: 'My favorites', es: 'Mis favoritos' })} ({total})
          </h3>
          <button
            type="button"
            onClick={closeFavDrawer}
            aria-label={tx({ fr: 'Fermer', en: 'Close', es: 'Cerrar' })}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Corps scrollable : deux groupes */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {total === 0 ? (
            <div className="text-center py-16">
              <Heart size={28} className="mx-auto text-white/40 mb-3" />
              <p className="text-white/55 text-sm">
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
                  <h4 className="text-white/70 text-[11px] font-bold uppercase tracking-wider mb-2.5">
                    {tx({ fr: 'Stickers', en: 'Stickers', es: 'Stickers' })} ({favStickers.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {favStickers.map((s) => (
                      <div key={s.slug} className="relative rounded-lg bg-black/25 p-2 flex flex-col items-center">
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
                  <h4 className="text-white/70 text-[11px] font-bold uppercase tracking-wider mb-2.5">
                    {tx({ fr: 'Prints d\'artistes', en: 'Artist prints', es: 'Prints de artistas' })} ({favPrints.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {favPrints.map(({ print, artistSlug, artistName }) => (
                      <div key={print.id} className="relative rounded-lg bg-black/25 overflow-hidden group">
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
                          <p className="px-1.5 pt-1 text-[10px] text-white font-semibold truncate">{printTitle(print)}</p>
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
          <div className="px-5 py-4 border-t border-white/10 flex-shrink-0">
            {favStickers.length > 0 && (
              <>
                <p className="text-xs text-white/70 mb-2.5 flex items-center gap-1.5">
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
              className="w-full py-3 rounded-full bg-transparent text-white text-sm font-semibold border border-white/20 hover:bg-white/5 transition-colors"
            >
              {tx({ fr: 'Continuer mes achats', en: 'Keep shopping', es: 'Seguir comprando' })}
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
