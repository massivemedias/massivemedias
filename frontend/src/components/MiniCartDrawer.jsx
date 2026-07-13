import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingCart, Plus, Minus, Trash2, Truck, Heart } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useFavorites } from '../contexts/FavoritesContext'
import { useLang } from '../i18n/LanguageContext'
import { collectionProgress, isCollectionUnit, isMysteryPack } from '../utils/collectionCart'
import { MASSIVE_STICKERS } from '../data/massiveStickers'
import { getCollectionStickerPrice } from '../data/products'
import { thumb } from '../utils/paths'

/**
 * CART-01 (9 juillet 2026) : mini-panier lateral. S'ouvre a chaque ajout
 * d'un produit de la collection (via CartContext.openCartDrawer). Montre la
 * progression vers le minimum de 5 et vers la livraison gratuite QC (30 $),
 * les quantites modifiables et un bouton Commander grise tant que le minimum
 * n'est pas atteint. Pure UI : lit CartContext, aucune logique de prix.
 *
 * Desktop : tiroir droit 390px. Mobile : bottom-sheet plein ecran (meme
 * contenu, ancre en bas). Monte une fois dans MainLayout.
 */
export default function MiniCartDrawer() {
  const { items, isCartDrawerOpen, closeCartDrawer, updateQuantity, removeFromCart, addToCart } = useCart()
  const { favorites } = useFavorites()
  const { tx } = useLang()
  const navigate = useNavigate()

  // Escape ferme, et on bloque le scroll de fond quand le tiroir est ouvert.
  useEffect(() => {
    if (!isCartDrawerOpen) return
    const onKey = (e) => { if (e.key === 'Escape') closeCartDrawer() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [isCartDrawerOpen, closeCartDrawer])

  const prog = collectionProgress(items)

  // STICKERS-FAV : pont favoris -> vente. Favoris pas encore au panier, proposes
  // en vignettes cliquables pour completer vers le minimum de 5.
  const cartSkus = new Set(items.map((it) => it.sku))
  const favSuggestions = favorites
    .filter((slug) => !cartSkus.has(slug))
    .map((slug) => MASSIVE_STICKERS.find((s) => s.slug === slug))
    .filter(Boolean)
    .slice(0, 8)
  const addFavToCart = (s) => {
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

  const goCheckout = () => {
    if (!prog.minMet) return
    closeCartDrawer()
    navigate('/panier')
  }

  return (
    <AnimatePresence>
      {isCartDrawerOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* UI-10 : voile leger (15% + blur subtil) au lieu du rideau gris
              opaque - la page reste lisible derriere, le tiroir se distingue par
              son ombre portee. Clic exterieur = fermeture (conserve). */}
          <div className="absolute inset-0 bg-black/[0.15] backdrop-blur-[2px]" onClick={closeCartDrawer} aria-hidden="true" />

          {/* Tiroir : plein ecran mobile (bottom-sheet via items-end), 390px desktop */}
          <motion.aside
            className="relative w-full sm:w-[390px] sm:max-w-[92vw] h-full flex flex-col ml-auto"
            style={{ background: 'var(--bg-footer)', borderLeft: '1px solid rgba(var(--accent-rgb), 0.3)', boxShadow: '-24px 0 60px rgba(0,0,0,0.5)' }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            role="dialog"
            aria-label={tx({ fr: 'Ton panier', en: 'Your cart', es: 'Tu carrito' })}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
              <h3 className="text-white font-heading font-bold text-lg flex items-center gap-2">
                <ShoppingCart size={18} />
                {tx({ fr: 'Ton panier', en: 'Your cart', es: 'Tu carrito' })} ({items.length})
              </h3>
              <button
                type="button"
                onClick={closeCartDrawer}
                aria-label={tx({ fr: 'Fermer', en: 'Close', es: 'Cerrar' })}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Progression : minimum + livraison gratuite (si collection presente) */}
            {prog.hasCollection && (
              <div className="px-5 py-4 border-b border-white/10 flex-shrink-0">
                {prog.minMet ? (
                  <p className="text-sm font-semibold text-green-300 flex items-center gap-2">
                    <span className="inline-flex w-5 h-5 rounded-full bg-green-500/20 items-center justify-center text-green-300 text-xs">✓</span>
                    {tx({ fr: 'Minimum atteint !', en: 'Minimum reached!', es: 'Minimo alcanzado!' })}
                  </p>
                ) : (
                  <>
                    <div className="flex justify-between text-xs mb-1.5 text-white/80">
                      <span>{tx({ fr: `${prog.units}/${prog.minUnits} stickers`, en: `${prog.units}/${prog.minUnits} stickers`, es: `${prog.units}/${prog.minUnits} stickers` })}</span>
                      <span>{tx({ fr: `ajoute ${prog.unitsRemaining} de plus`, en: `add ${prog.unitsRemaining} more`, es: `agrega ${prog.unitsRemaining} mas` })}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/12 overflow-hidden">
                      <div className="h-full bg-accent transition-all" style={{ width: `${(prog.units / prog.minUnits) * 100}%` }} />
                    </div>
                  </>
                )}
                <p className="text-xs mt-2.5 flex items-center gap-1.5 text-white/80">
                  <Truck size={13} />
                  {prog.freeShippingMet
                    ? tx({ fr: 'Livraison gratuite au Québec 🎉', en: 'Free shipping in Quebec 🎉', es: 'Envio gratis en Quebec 🎉' })
                    : tx({
                        fr: `Plus que ${prog.freeShippingRemaining} $ pour la livraison gratuite au Québec`,
                        en: `$${prog.freeShippingRemaining} more for free shipping in Quebec`,
                        es: `${prog.freeShippingRemaining} $ mas para envio gratis en Quebec`,
                      })}
                </p>
              </div>
            )}

            {/* Liste des items */}
            <div className="flex-1 overflow-y-auto px-5 py-2">
              {items.length === 0 ? (
                <p className="text-center py-16 text-white/55">
                  {tx({ fr: 'Ton panier est vide.', en: 'Your cart is empty.', es: 'Tu carrito esta vacio.' })}
                </p>
              ) : (
                items.map((it, i) => (
                  <div key={`${it.productId}-${i}`} className="flex items-center gap-3 py-3 border-b border-white/[0.06]">
                    {it.image && (
                      <img
                        src={it.image}
                        alt=""
                        aria-hidden="true"
                        className={`w-13 h-13 object-contain flex-shrink-0 ${isCollectionUnit(it) ? 'sticker-stroke' : ''}`}
                        style={{ width: 52, height: 52 }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{it.productName}</p>
                      <p className="text-xs mt-0.5 text-white/55">
                        {it.unitPrice != null ? `${it.unitPrice} $` : `${it.totalPrice} $`}
                        {isCollectionUnit(it) ? tx({ fr: ' / unité', en: ' / unit', es: ' / unidad' }) : ''}
                      </p>
                    </div>
                    {/* Quantites : modifiables pour les unites collection, packs et
                        merch a quantite fixe montrent juste x N + suppression. */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isCollectionUnit(it) ? (
                        <>
                          <button
                            type="button"
                            aria-label={tx({ fr: 'Retirer un', en: 'Remove one', es: 'Quitar uno' })}
                            onClick={() => (it.quantity <= 1 ? removeFromCart(i) : updateQuantity(i, it.quantity - 1, it.unitPrice))}
                            className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="text-white text-sm font-semibold w-4 text-center">{it.quantity}</span>
                          <button
                            type="button"
                            aria-label={tx({ fr: 'Ajouter un', en: 'Add one', es: 'Agregar uno' })}
                            onClick={() => updateQuantity(i, it.quantity + 1, it.unitPrice)}
                            className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                          >
                            <Plus size={13} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-white text-sm font-semibold">×{it.quantity}</span>
                          <button
                            type="button"
                            aria-label={tx({ fr: 'Retirer', en: 'Remove', es: 'Quitar' })}
                            onClick={() => removeFromCart(i)}
                            className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors ml-1"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer : total + actions */}
            {items.length > 0 && (
              <div className="px-5 py-4 border-t border-white/10 flex-shrink-0">
                {/* STICKERS-FAV : pont favoris -> vente. Minimum pas atteint +
                    favoris hors panier -> vignettes cliquables pour completer. */}
                {!prog.minMet && favSuggestions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-white/70 mb-2 flex items-center gap-1.5">
                      <Heart size={12} className="text-accent" fill="currentColor" />
                      {tx({ fr: 'Complete avec tes favoris', en: 'Complete with your favorites', es: 'Completa con tus favoritos' })}
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {favSuggestions.map((s) => (
                        <button
                          key={s.slug}
                          type="button"
                          onClick={() => addFavToCart(s)}
                          title={tx(s)}
                          aria-label={`${tx({ fr: 'Ajouter', en: 'Add', es: 'Agregar' })} ${tx(s)}`}
                          className="relative shrink-0 w-14 h-14 rounded-lg bg-black/30 p-1 hover:ring-2 hover:ring-accent transition-all group"
                        >
                          <img src={thumb(`/images/stickers-massive/${s.slug}.webp`)} alt="" className="w-full h-full object-contain" />
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus size={10} />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-baseline mb-3.5">
                  <span className="text-sm text-white/80">
                    {tx({ fr: 'Sous-total', en: 'Subtotal', es: 'Subtotal' })}
                  </span>
                  <span className="text-white text-xl font-heading font-bold">{prog.subtotal} $</span>
                </div>
                <button
                  type="button"
                  onClick={goCheckout}
                  disabled={!prog.minMet}
                  className={`w-full py-3.5 rounded-full font-semibold text-sm mb-2.5 transition-all ${
                    prog.minMet
                      ? 'bg-accent text-white hover:brightness-110 cursor-pointer'
                      : 'bg-accent/35 text-white/55 cursor-not-allowed'
                  }`}
                >
                  {prog.minMet
                    ? tx({ fr: 'Commander', en: 'Checkout', es: 'Ordenar' })
                    : tx({
                        fr: `Commander (ajoute ${prog.unitsRemaining} sticker${prog.unitsRemaining > 1 ? 's' : ''})`,
                        en: `Checkout (add ${prog.unitsRemaining} sticker${prog.unitsRemaining > 1 ? 's' : ''})`,
                        es: `Ordenar (agrega ${prog.unitsRemaining} sticker${prog.unitsRemaining > 1 ? 's' : ''})`,
                      })}
                </button>
                <button
                  type="button"
                  onClick={closeCartDrawer}
                  className="w-full py-3 rounded-full bg-transparent text-white text-sm font-semibold border border-white/20 hover:bg-white/5 transition-colors"
                >
                  {tx({ fr: 'Continuer mes achats', en: 'Keep shopping', es: 'Seguir comprando' })}
                </button>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
