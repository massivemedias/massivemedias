import { useState } from 'react';
import { ShoppingCart, Check, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../contexts/CartContext';
import { useLang } from '../../i18n/LanguageContext';
import { useProduct } from '../../hooks/useProducts';
import FileUpload from '../FileUpload';
import {
  stickerFinishes as defaultFinishes, stickerShapes as defaultShapes, stickerSizes as defaultSizes,
  stickerPriceTiers as defaultTiers, getStickerPrice as defaultGetPrice, stickerImages,
} from '../../data/products';

function ConfiguratorStickers({ onFinishChange }) {
  const { lang, tx } = useLang();
  const { addToCart } = useCart();
  const cmsProduct = useProduct('stickers');
  const pd = cmsProduct?.pricingData;

  const stickerFinishes = pd?.finishes || defaultFinishes;
  const stickerShapes = pd?.shapes || defaultShapes;
  const stickerSizes = pd?.sizes || defaultSizes;

  const [finish, setFinish] = useState('matte');
  const [shape, setShape] = useState('round');
  const [size, setSize] = useState('2.5in');
  const [qtyIndex, setQtyIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [notes, setNotes] = useState('');

  const getStickerPrice = pd?.tiers
    ? (f, s, qty) => {
        const isSpecial = f === 'holographic' || f === 'broken-glass' || f === 'stars';
        const tiers = isSpecial ? (pd.tiers.holographic || pd.tiers.standard) : pd.tiers.standard;
        const tier = tiers?.find(t => t.qty === qty);
        return tier ? { qty: tier.qty, price: tier.price, unitPrice: tier.unitPrice } : null;
      }
    : defaultGetPrice;

  const tiers = pd?.tiers?.standard || defaultTiers;
  const currentTier = tiers[qtyIndex] || tiers[0];
  const priceInfo = getStickerPrice(finish, shape, currentTier.qty);

  const finishLabel = stickerFinishes.find(f => f.id === finish);
  const shapeLabel = stickerShapes.find(s => s.id === shape);
  const sizeLabel = stickerSizes.find(s => s.id === size)?.label;

  // Preview image per finish type
  const finishImages = {
    matte: '/images/stickers/finish-matte.webp',
    glossy: '/images/stickers/finish-glossy.webp',
    holographic: '/images/stickers/finish-holographic.webp',
    'broken-glass': '/images/stickers/finish-broken-glass.webp',
    stars: '/images/stickers/finish-stars.webp',
  };
  const previewImage = finishImages[finish] || finishImages.matte;

  const handleAddToCart = () => {
    addToCart({
      productId: 'sticker-custom',
      productName: tx({ fr: 'Sticker Custom', en: 'Custom Sticker', es: 'Sticker Personalizado' }),
      finish: tx({ fr: finishLabel?.labelFr, en: finishLabel?.labelEn, es: finishLabel?.labelEn }),
      shape: tx({ fr: shapeLabel?.labelFr, en: shapeLabel?.labelEn, es: shapeLabel?.labelEn }),
      size: sizeLabel,
      quantity: priceInfo.qty,
      unitPrice: priceInfo.unitPrice,
      totalPrice: priceInfo.price,
      image: stickerImages[0],
      uploadedFiles,
      notes,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleShapeChange = (s) => {
    setShape(s);
    setQtyIndex(0);
  };

  return (
    <>
      {/* Desktop: two-column layout / Mobile: compact stacked */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Preview: horizontal strip on mobile, sidebar on desktop */}
        <div className="flex md:flex-col items-center gap-3 md:gap-0 md:w-56 rounded-xl card-bg-bordered p-3 md:p-4 overflow-hidden md:self-start">
          <AnimatePresence mode="wait">
            <motion.img
              key={finish}
              src={previewImage}
              alt={tx({ fr: finishLabel?.labelFr, en: finishLabel?.labelEn, es: finishLabel?.labelEn })}
              className="w-20 h-20 md:w-full md:h-auto object-contain rounded-lg flex-shrink-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          </AnimatePresence>
          <div className="text-left md:text-center md:mt-3">
            <span className="text-heading text-sm font-semibold">
              {tx({ fr: finishLabel?.labelFr, en: finishLabel?.labelEn, es: finishLabel?.labelEn })}
            </span>
            <span className="block text-grey-muted text-xs mt-0.5">
              {sizeLabel} · {tx({ fr: shapeLabel?.labelFr, en: shapeLabel?.labelEn, es: shapeLabel?.labelEn })}
            </span>
            {(finish === 'holographic' || finish === 'broken-glass' || finish === 'stars') && (
              <span className="block text-grey-muted/60 text-[10px] mt-1.5 italic">
                {tx({ fr: '* Image exageree pour illustrer l\'effet', en: '* Image exaggerated to illustrate the effect', es: '* Imagen exagerada para ilustrar el efecto' })}
              </span>
            )}
          </div>
        </div>

        {/* Right: Selectors */}
        <div className="flex-1 min-w-0 space-y-4 md:space-y-5">
          {/* Finish selector */}
          <div>
            <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
              {tx({ fr: 'Finition', en: 'Finish', es: 'Acabado' })}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:flex md:flex-wrap gap-1.5 md:gap-2">
              {stickerFinishes.map(f => (
                <button
                  key={f.id}
                  onClick={() => { setFinish(f.id); onFinishChange?.(f.id); }}
                  title={['holographic', 'broken-glass', 'stars'].includes(f.id) ? tx({ fr: 'Effet Fx - image exageree pour illustrer', en: 'Fx effect - image exaggerated to illustrate', es: 'Efecto Fx - imagen exagerada para ilustrar' }) : ''}
                  className={`flex flex-col items-center justify-center py-2 px-2 md:min-w-[4.5rem] md:py-2.5 md:px-3 rounded-lg text-xs font-medium transition-all border-2 ${finish === f.id
                    ? 'border-accent option-selected'
                    : 'border-transparent hover:border-grey-muted/30 option-default'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-full mb-1 md:mb-1.5 border ${
                    f.id === 'matte' ? 'bg-gray-400 border-gray-400' :
                    f.id === 'glossy' ? 'bg-white border-gray-300 shadow-sm' :
                    f.id === 'broken-glass' ? 'bg-gradient-to-br from-cyan-200 via-white to-cyan-400 border-cyan-300' :
                    f.id === 'stars' ? 'bg-gradient-to-br from-yellow-200 via-amber-300 to-yellow-400 border-yellow-300' :
                    'bg-gradient-to-br from-pink-300 via-purple-300 to-cyan-300 border-transparent'
                  }`} />
                  <span className="text-heading leading-tight text-center font-semibold text-[11px] md:text-xs">
                    {tx({ fr: f.labelFr.replace('Vinyle ', ''), en: f.labelEn.replace(' Vinyl', ''), es: f.labelEn.replace(' Vinyl', '') })}
                  </span>
                  <span className="text-grey-muted mt-0.5 text-[9px] md:text-[10px] hidden sm:block">
                    {tx({ fr: f.descFr, en: f.descEn, es: f.descEn })}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Forme + Taille + Quantite: 3 cols on mobile, original on desktop */}
          <div className="grid grid-cols-3 gap-3 md:grid-cols-1 md:gap-5">
            {/* Shape selector */}
            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1.5 md:mb-2.5">
                {tx({ fr: 'Forme', en: 'Shape', es: 'Forma' })}
              </label>
              <div className="flex flex-col md:flex-row md:flex-wrap gap-1.5 md:gap-2">
                {stickerShapes.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleShapeChange(s.id)}
                    className={`flex items-center md:flex-col justify-center gap-1.5 md:gap-0 md:min-w-[4.5rem] py-1.5 px-2 md:py-2.5 md:px-3 rounded-lg text-xs font-medium transition-all border-2 ${shape === s.id
                      ? 'border-accent option-selected'
                      : 'border-transparent hover:border-grey-muted/30 option-default'
                    }`}
                  >
                    <span className={`md:mb-1.5 flex-shrink-0 ${
                      s.id === 'round' ? 'w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border-2 border-current' :
                      s.id === 'square' ? 'w-3.5 h-3.5 md:w-4 md:h-4 rounded-sm border-2 border-current' :
                      s.id === 'rectangle' ? 'w-4 h-3 md:w-5 md:h-3.5 rounded-sm border-2 border-current' :
                      'w-4 h-3.5 md:w-5 md:h-4 border-2 border-current border-dashed rounded-lg'
                    } text-grey-muted`} />
                    <span className="text-heading leading-tight text-center font-semibold text-[11px] md:text-xs">
                      {tx({ fr: s.labelFr, en: s.labelEn, es: s.labelEn })}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size selector */}
            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1.5 md:mb-2.5">
                {tx({ fr: 'Taille', en: 'Size', es: 'Tamaño' })}
              </label>
              <div className="flex flex-col md:flex-row md:flex-wrap gap-1.5 md:gap-2">
                {stickerSizes.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSize(s.id)}
                    className={`py-1.5 px-2 md:px-4 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all border-2 ${size === s.id
                      ? 'border-accent text-heading option-selected'
                      : 'border-transparent text-heading hover:border-grey-muted/30 option-default'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity selector */}
            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1.5 md:mb-2.5">
                {tx({ fr: 'Quantité', en: 'Quantity', es: 'Cantidad' })}
              </label>
              <div className="flex flex-col md:flex-row md:flex-wrap gap-1.5 md:gap-2">
                {tiers.map((tier, i) => {
                  const p = getStickerPrice(finish, shape, tier.qty);
                  return (
                    <button
                      key={tier.qty}
                      onClick={() => setQtyIndex(i)}
                      className={`flex items-center md:flex-col justify-between md:justify-center py-1.5 px-2 md:py-2.5 md:px-4 rounded-lg text-xs font-medium transition-all border-2 md:min-w-[5rem] ${qtyIndex === i
                        ? 'border-accent option-selected'
                        : 'border-transparent hover:border-grey-muted/30 option-default'
                      }`}
                    >
                      <span className="text-heading font-bold text-xs md:text-sm">{tier.qty}</span>
                      <span className="text-grey-muted md:mt-0.5 text-[11px]">{p ? `${p.unitPrice.toFixed(2)}$/u` : ''}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* File upload + Notes */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-3 md:gap-4 mb-4 md:mb-5">
        <FileUpload
          files={uploadedFiles}
          onFilesChange={setUploadedFiles}
          label={tx({ fr: 'Votre design', en: 'Your design', es: 'Tu diseño' })}
          compact
        />
        <div>
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
            {tx({ fr: 'Notes / Description', en: 'Notes / Description', es: 'Notas / Descripción' })}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={tx({ fr: 'Décrivez le produit souhaité (couleurs, style, details...)', en: 'Describe the desired product (colors, style, details...)', es: 'Describe el producto deseado (colores, estilo, detalles...)' })}
            className="w-full min-h-[80px] md:min-h-[100px] rounded-lg border-2 border-grey-muted/20 bg-transparent px-3 py-2.5 md:px-4 md:py-3 text-sm text-heading placeholder:text-grey-muted/50 focus:border-accent focus:outline-none transition-colors resize-none"
          />
        </div>
      </div>

      {/* Price display */}
      {priceInfo && (
        <div className="p-4 md:p-5 rounded-xl mb-4 md:mb-5 highlight-bordered">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl md:text-3xl font-heading font-bold text-heading">{priceInfo.price}$</span>
            <span className="text-grey-muted text-xs md:text-sm">
              ({priceInfo.unitPrice.toFixed(2)}$/sticker)
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 md:mt-2">
            {(finish === 'holographic' || finish === 'broken-glass' || finish === 'stars') && (
              <span className="text-accent text-xs font-medium">
                {tx({ fr: 'Effets Speciaux', en: 'Special Effects', es: 'Efectos Especiales' })}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
              <Sparkles size={12} />
              {tx({ fr: 'Design inclus', en: 'Design included', es: 'Diseño incluido' })}
            </span>
          </div>
        </div>
      )}

      {/* Add to cart */}
      <button onClick={handleAddToCart} className="btn-primary w-full justify-center text-sm md:text-base py-3 md:py-3.5 mb-2 md:mb-3">
        {added ? (
          <><Check size={18} className="mr-2" />{tx({ fr: 'Ajouté au panier!', en: 'Added to cart!', es: 'Agregado al carrito!' })}</>
        ) : (
          <><ShoppingCart size={18} className="mr-2" />{tx({ fr: 'Ajouter au panier', en: 'Add to cart', es: 'Agregar al carrito' })}</>
        )}
      </button>

      <Link to="/panier" className="btn-outline w-full justify-center text-sm py-2 md:py-2.5">
        {tx({ fr: 'Voir le panier', en: 'View cart', es: 'Ver el carrito' })}
      </Link>

      <p className="text-grey-muted text-xs mt-2 md:mt-3 text-center">
        {tx({
          fr: 'Nous vous contacterons pour confirmer les détails et organiser le paiement.',
          en: 'We\'ll contact you to confirm details and arrange payment.',
          es: 'Nos comunicaremos contigo para confirmar los detalles y coordinar el pago.',
        })}
      </p>
    </>
  );
}

export default ConfiguratorStickers;
