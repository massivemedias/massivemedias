import { useState, useEffect, useMemo } from 'react'
import { ShoppingCart, Check, Sparkles, Shuffle, RotateCcw, Plus, Minus, AlertCircle, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../../contexts/CartContext'
import { useLang } from '../../i18n/LanguageContext'
import { useUserRole } from '../../contexts/UserRoleContext'
import {
  stickerShapes as defaultShapes, stickerSizes as defaultSizes,
} from '../../data/products'
import { getArtistStickerPrice } from '../../data/artistPricing'
import { formatPrice, money } from '../../utils/formatCurrency'

const MIN_TOTAL = 10 // Minimum d'impression

function ConfiguratorArtistSticker({ artist, selectedSticker, allStickers = [], onThumbnailPreview }) {
  const { tx } = useLang()
  const { addToCart } = useCart()
  const { artistSlug: loggedArtistSlug } = useUserRole()
  const isArtistOwnPrint = loggedArtistSlug && loggedArtistSlug === artist?.slug

  const stickers = allStickers.length > 0 ? allStickers : (artist?.stickers || [])

  const [shape, setShape] = useState('diecut')
  const [size, setSize] = useState('3in')
  const [added, setAdded] = useState(false)
  const [notes, setNotes] = useState('')
  const [previewSticker, setPreviewSticker] = useState(null)
  // Quantite par design choisi : { stickerId: qty }. Le total = somme.
  const [pack, setPack] = useState({})

  // Pre-selectionner le sticker clique
  useEffect(() => {
    if (selectedSticker?.id) {
      setPack(prev => {
        if (Object.keys(prev).length === 0) {
          return { [selectedSticker.id]: 1 }
        }
        if (!prev[selectedSticker.id]) {
          return { ...prev, [selectedSticker.id]: 1 }
        }
        return prev
      })
      setAdded(false)
    }
  }, [selectedSticker?.id])

  // Total de stickers (somme des quantites par design)
  const packSize = useMemo(() => Object.values(pack).reduce((s, q) => s + q, 0), [pack])
  const totalQty = packSize

  // Prix UNIQUE via la grille artiste dediee (sans finition ni taille).
  const priceInfo = totalQty > 0 ? getArtistStickerPrice(totalQty) : null
  const canCheckout = totalQty >= MIN_TOTAL && packSize > 0
  const missing = Math.max(0, MIN_TOTAL - totalQty)

  const updateStickerQty = (id, delta) => {
    setPack(prev => {
      const current = prev[id] || 0
      const next = Math.max(0, current + delta)
      const updated = { ...prev }
      if (next === 0) delete updated[id]
      else updated[id] = next
      return updated
    })
  }

  // PREVIEW (hover desktop / tap mobile / +/-) : bascule les 2 apercus (interne
  // previewSticker + grande preview parent via onThumbnailPreview) sur le design
  // avec lequel l'utilisateur interagit. Sticky : aucun retour au mouseleave.
  const previewDesign = (s) => {
    setPreviewSticker(s)
    onThumbnailPreview?.(s)
  }

  const randomMix = () => {
    if (stickers.length === 0) return
    const newPack = {}
    stickers.forEach(s => { newPack[s.id] = 1 })
    setPack(newPack)
  }

  const resetPack = () => {
    setPack(selectedSticker ? { [selectedSticker.id]: 1 } : {})
  }

  if (!selectedSticker || !artist) return null

  const handleAddToCart = () => {
    if (!priceInfo || !canCheckout) return
    const packDetails = stickers
      .filter(s => pack[s.id] > 0)
      .map(s => ({
        id: s.id,
        title: tx({ fr: s.titleFr, en: s.titleEn, es: s.titleEs || s.titleEn }),
        qty: pack[s.id], // quantite pour ce design
        image: s.image,
      }))

    const shapeLabel = defaultShapes.find(s => s.id === shape)
    const sizeLabel = defaultSizes.find(s => s.id === size)?.label

    try {
      addToCart({
        productId: `artist-sticker-pack-${artist.slug}-${Date.now()}`,
        productName: tx({
          fr: `${artist.name} - ${totalQty} stickers`,
          en: `${artist.name} - ${totalQty} stickers`,
          es: `${artist.name} - ${totalQty} stickers`,
        }),
        shape: tx({ fr: shapeLabel?.labelFr, en: shapeLabel?.labelEn, es: shapeLabel?.labelEn }),
        size: sizeLabel,
        sizeId: size,
        quantity: totalQty,
        unitPrice: priceInfo.unitPrice,
        totalPrice: priceInfo.price,
        image: selectedSticker.image,
        uploadedFiles: [],
        notes,
        packDetails,
        packComposition: { total: totalQty },
        ...(isArtistOwnPrint ? { isArtistOwnPrint: true, artistSlug: artist.slug } : {}),
      })
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch (err) {
      console.error('addToCart error:', err)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header : choix des designs (mix conserve) */}
      <div className="flex items-center justify-between">
        <label className="text-heading font-semibold text-xs uppercase tracking-wider">
          {tx({ fr: 'Choisissez vos stickers', en: 'Pick your stickers', es: 'Elige tus stickers' })}
        </label>
        <div className="flex gap-1.5">
          <button
            onClick={randomMix}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-accent/15 text-accent hover:bg-accent/25 transition-colors"
            title={tx({ fr: 'Un de chaque', en: 'One of each', es: 'Uno de cada' })}
          >
            <Shuffle size={12} />
            {tx({ fr: 'Un de chaque', en: 'One each', es: 'Uno cada' })}
          </button>
          <button
            onClick={resetPack}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 text-grey-muted hover:bg-white/10 transition-colors"
            title={tx({ fr: 'Reinitialiser', en: 'Reset', es: 'Reiniciar' })}
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Apercu du sticker selectionne */}
      {previewSticker && (
        <div className="flex items-center gap-4 p-3 rounded-xl bg-black/20">
          <img src={previewSticker.image} alt="" className="w-28 h-28 object-contain" />
          <div>
            <p className="text-heading font-bold text-sm">{tx({ fr: previewSticker.titleFr, en: previewSticker.titleEn, es: previewSticker.titleEs || previewSticker.titleEn })}</p>
            <p className="text-grey-muted text-xs mt-1">{tx({ fr: 'Cliquez + pour ajouter a la commande', en: 'Click + to add to your order', es: 'Haz clic + para agregar' })}</p>
          </div>
        </div>
      )}

      {/* Liste des stickers avec compteur +/- par design */}
      <div className="space-y-1 max-h-[320px] overflow-y-auto scrollbar-thin pr-1">
        {stickers.map(s => {
          const qty = pack[s.id] || 0
          const title = tx({ fr: s.titleFr, en: s.titleEn, es: s.titleEs || s.titleEn })
          const isSelected = qty > 0
          return (
            <div
              key={s.id}
              onMouseEnter={() => previewDesign(s)}
              onClick={() => previewDesign(s)}
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-all cursor-pointer ${isSelected ? 'bg-accent/10' : 'bg-white/3 hover:bg-white/5'}`}
            >
              <div className="flex-shrink-0">
                <img
                  src={s.image}
                  alt={title}
                  className={`w-14 h-14 rounded-lg object-contain transition-all ${previewSticker?.id === s.id ? 'ring-2 ring-accent' : 'hover:ring-1 hover:ring-white/30'}`}
                />
              </div>
              <span className={`flex-1 text-sm font-medium truncate ${isSelected ? 'text-heading' : 'text-grey-muted'}`}>
                {title}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    updateStickerQty(s.id, -1)
                    previewDesign(s)
                  }}
                  disabled={qty === 0}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-heading bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus size={13} />
                </button>
                <span className={`w-8 text-center text-sm font-bold ${isSelected ? 'text-accent' : 'text-grey-muted'}`}>
                  {qty}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    updateStickerQty(s.id, 1)
                    previewDesign(s)
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-heading bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Total */}
      <div className="p-3 rounded-xl bg-accent/5 text-center">
        <span className="text-sm font-bold text-heading">
          {packSize} {packSize > 1
            ? tx({ fr: 'stickers au total', en: 'stickers total', es: 'stickers en total' })
            : tx({ fr: 'sticker au total', en: 'sticker total', es: 'sticker en total' })}
        </span>
        {packSize === 0 && (
          <span className="text-grey-muted text-xs block mt-1">
            {tx({ fr: 'Cliquez + sur les stickers pour composer votre commande', en: 'Click + on stickers to build your order', es: 'Haz clic + en los stickers para componer tu pedido' })}
          </span>
        )}
      </div>

      {/* Alerte minimum */}
      {packSize > 0 && !canCheckout && (
        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-2">
          <AlertCircle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="text-yellow-400 font-semibold">
              {tx({ fr: `Minimum ${MIN_TOTAL} stickers pour imprimer`, en: `Minimum ${MIN_TOTAL} stickers to print`, es: `Minimo ${MIN_TOTAL} stickers para imprimir` })}
            </p>
            <p className="text-yellow-400/80 mt-0.5">
              {tx({
                fr: `Il manque ${missing} sticker${missing > 1 ? 's' : ''}. Ajoutez-en pour atteindre le minimum.`,
                en: `${missing} more sticker${missing > 1 ? 's' : ''} needed to reach the minimum.`,
                es: `Faltan ${missing} sticker${missing > 1 ? 's' : ''} para alcanzar el minimo.`,
              })}
            </p>
          </div>
        </div>
      )}

      {/* Forme + Taille (aspect production, AUCUN impact sur le prix) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
            {tx({ fr: 'Forme', en: 'Shape', es: 'Forma' })}
          </label>
          <div className="flex flex-col gap-1.5">
            {defaultShapes.map(s => (
              <button
                key={s.id}
                onClick={() => setShape(s.id)}
                className={`flex items-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all border-2 ${shape === s.id
                  ? 'border-accent option-selected'
                  : 'border-transparent hover:border-grey-muted/30 option-default'
                }`}
              >
                <span className={`flex-shrink-0 ${
                  s.id === 'round' ? 'w-3.5 h-3.5 rounded-full border-2 border-current' :
                  s.id === 'square' ? 'w-3.5 h-3.5 rounded-sm border-2 border-current' :
                  s.id === 'rectangle' ? 'w-4 h-3 rounded-sm border-2 border-current' :
                  'w-4 h-3.5 border-2 border-current border-dashed rounded-lg'
                } text-grey-muted`} />
                <span className="text-heading font-semibold text-[11px]">
                  {tx({ fr: s.labelFr, en: s.labelEn, es: s.labelEn })}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
            {tx({ fr: 'Taille', en: 'Size', es: 'Tamano' })}
          </label>
          <div className="flex flex-col gap-1.5">
            {defaultSizes.map(s => (
              <button
                key={s.id}
                onClick={() => setSize(s.id)}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all border-2 ${size === s.id
                  ? 'border-accent text-heading option-selected'
                  : 'border-transparent text-heading hover:border-grey-muted/30 option-default'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="mt-2 flex items-start gap-1 text-[10px] text-grey-muted leading-relaxed">
            <Info size={10} className="text-accent flex-shrink-0 mt-0.5" />
            <span>
              {tx({
                fr: 'Taille indicative pour la production, sans impact sur le prix.',
                en: 'Size for production only, no impact on price.',
                es: 'Tamano para produccion, sin impacto en el precio.',
              })}
            </span>
          </p>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
          {tx({ fr: 'Notes', en: 'Notes', es: 'Notas' })}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder={tx({ fr: 'Instructions speciales, details...', en: 'Special instructions, details...', es: 'Instrucciones especiales, detalles...' })}
          className="w-full rounded-lg border-2 border-grey-muted/20 bg-transparent px-3 py-2.5 text-sm text-heading placeholder:text-grey-muted/50 focus:border-accent focus:outline-none transition-colors resize-none"
        />
      </div>

      {/* Prix */}
      {priceInfo && canCheckout && (
        <div className="p-4 rounded-xl highlight-bordered">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-heading font-bold text-heading">{formatPrice(priceInfo.price)}</span>
            <span className="text-grey-muted text-sm">
              ({money(priceInfo.unitPrice)}$/sticker)
            </span>
          </div>
          <div className="text-grey-muted text-xs mt-1">
            {tx({ fr: `${totalQty} stickers`, en: `${totalQty} stickers`, es: `${totalQty} stickers` })}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
              <Sparkles size={12} />
              {tx({ fr: 'Melange de designs', en: 'Mixed designs', es: 'Mezcla de disenos' })}
            </span>
          </div>
        </div>
      )}

      {/* Ajouter au panier */}
      <button
        onClick={handleAddToCart}
        disabled={!canCheckout}
        className={`btn-primary w-full justify-center text-sm py-3 ${!canCheckout ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {added ? (
          <><Check size={18} className="mr-2" />{tx({ fr: 'Ajoute au panier!', en: 'Added to cart!', es: 'Agregado al carrito!' })}</>
        ) : (
          <><ShoppingCart size={18} className="mr-2" />{
            packSize === 0
              ? tx({ fr: 'Choisissez vos stickers', en: 'Pick your stickers', es: 'Elige tus stickers' })
              : !canCheckout
                ? tx({ fr: `Minimum ${MIN_TOTAL} stickers`, en: `Minimum ${MIN_TOTAL} stickers`, es: `Minimo ${MIN_TOTAL} stickers` })
                : tx({ fr: `Ajouter au panier (${totalQty} stickers)`, en: `Add to cart (${totalQty} stickers)`, es: `Agregar al carrito (${totalQty} stickers)` })
          }</>
        )}
      </button>

      <Link to="/panier" className="btn-outline w-full justify-center text-sm py-2.5">
        {tx({ fr: 'Voir le panier', en: 'View cart', es: 'Ver el carrito' })}
      </Link>

      <p className="text-grey-muted text-xs text-center">
        {tx({
          fr: `Stickers vinyl imprimes par Massive. Minimum ${MIN_TOTAL} par commande.`,
          en: `Vinyl stickers printed by Massive. Minimum ${MIN_TOTAL} per order.`,
          es: `Stickers vinyl impresos por Massive. Minimo ${MIN_TOTAL} por pedido.`,
        })}
      </p>
    </div>
  )
}

export default ConfiguratorArtistSticker
