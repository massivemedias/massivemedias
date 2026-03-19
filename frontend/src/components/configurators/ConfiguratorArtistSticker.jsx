import { useState, useEffect } from 'react';
import { ShoppingCart, Check, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useLang } from '../../i18n/LanguageContext';
import { useProduct } from '../../hooks/useProducts';
import {
  stickerFinishes as defaultFinishes, stickerShapes as defaultShapes, stickerSizes as defaultSizes,
  stickerPriceTiers as defaultTiers, getStickerPrice as defaultGetPrice,
} from '../../data/products';

function ConfiguratorArtistSticker({ artist, selectedSticker }) {
  const { lang, tx } = useLang();
  const { addToCart } = useCart();
  const cmsProduct = useProduct('stickers');
  const pd = cmsProduct?.pricingData;

  const stickerFinishes = pd?.finishes || defaultFinishes;
  const stickerShapes = pd?.shapes || defaultShapes;
  const stickerSizes = pd?.sizes || defaultSizes;

  const [finish, setFinish] = useState('matte');
  const [shape, setShape] = useState('diecut');
  const [size, setSize] = useState('3in');
  const [qtyIndex, setQtyIndex] = useState(0);
  const [added, setAdded] = useState(false);
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

  // Reset when sticker changes
  useEffect(() => {
    setAdded(false);
    setFinish('matte');
    setShape('diecut');
    setSize('3in');
    setQtyIndex(0);
    setNotes('');
  }, [selectedSticker?.id]);

  if (!selectedSticker || !artist) return null;

  const stickerTitle = tx({ fr: selectedSticker.titleFr, en: selectedSticker.titleEn, es: selectedSticker.titleEs || selectedSticker.titleEn });

  const handleAddToCart = () => {
    if (!priceInfo) return;
    try {
      addToCart({
        productId: `artist-sticker-${artist.slug}-${selectedSticker.id}`,
        productName: `${artist.name} - ${stickerTitle}`,
        finish: tx({ fr: finishLabel?.labelFr, en: finishLabel?.labelEn, es: finishLabel?.labelEn }),
        shape: tx({ fr: shapeLabel?.labelFr, en: shapeLabel?.labelEn, es: shapeLabel?.labelEn }),
        size: sizeLabel,
        quantity: priceInfo.qty,
        unitPrice: priceInfo.unitPrice,
        totalPrice: priceInfo.price,
        image: selectedSticker.image,
        uploadedFiles: [],
        notes,
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('addToCart error:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Selected sticker info */}
      <div className="p-4 rounded-xl bg-glass flex items-center gap-4">
        <img
          src={selectedSticker.image}
          alt={stickerTitle}
          className="w-16 h-16 rounded-lg object-contain"
        />
        <div>
          <div className="text-heading font-heading font-bold text-sm">{stickerTitle}</div>
          <div className="text-grey-muted text-xs">{artist.name}</div>
        </div>
      </div>

      {/* Finish selector */}
      <div>
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
          {tx({ fr: 'Finition', en: 'Finish', es: 'Acabado' })}
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {stickerFinishes.map(f => (
            <button
              key={f.id}
              onClick={() => setFinish(f.id)}
              className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg text-xs font-medium transition-all border-2 ${finish === f.id
                ? 'border-accent option-selected'
                : 'border-transparent hover:border-grey-muted/30 option-default'
              }`}
            >
              <span className={`w-3.5 h-3.5 rounded-full mb-1 border ${
                f.id === 'matte' ? 'bg-gray-400 border-gray-400' :
                f.id === 'glossy' ? 'bg-white border-gray-300 shadow-sm' :
                f.id === 'broken-glass' ? 'bg-gradient-to-br from-cyan-200 via-white to-cyan-400 border-cyan-300' :
                f.id === 'stars' ? 'bg-gradient-to-br from-yellow-200 via-amber-300 to-yellow-400 border-yellow-300' :
                'bg-gradient-to-br from-pink-300 via-purple-300 to-cyan-300 border-transparent'
              }`} />
              <span className="text-heading leading-tight text-center font-semibold text-[11px]">
                {tx({ fr: f.labelFr.replace('Vinyle ', ''), en: f.labelEn.replace(' Vinyl', ''), es: f.labelEn.replace(' Vinyl', '') })}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Shape + Size: 2 cols */}
      <div className="grid grid-cols-2 gap-4">
        {/* Shape */}
        <div>
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
            {tx({ fr: 'Forme', en: 'Shape', es: 'Forma' })}
          </label>
          <div className="flex flex-col gap-1.5">
            {stickerShapes.map(s => (
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

        {/* Size */}
        <div>
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
            {tx({ fr: 'Taille', en: 'Size', es: 'Tamano' })}
          </label>
          <div className="flex flex-col gap-1.5">
            {stickerSizes.map(s => (
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
        </div>
      </div>

      {/* Quantity selector */}
      <div>
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
          {tx({ fr: 'Quantite', en: 'Quantity', es: 'Cantidad' })}
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {tiers.map((tier, i) => {
            const p = getStickerPrice(finish, shape, tier.qty);
            return (
              <button
                key={tier.qty}
                onClick={() => setQtyIndex(i)}
                className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg text-xs font-medium transition-all border-2 ${qtyIndex === i
                  ? 'border-accent option-selected'
                  : 'border-transparent hover:border-grey-muted/30 option-default'
                }`}
              >
                <span className="text-heading font-bold text-sm">{tier.qty}</span>
                <span className="text-grey-muted text-[10px]">{p ? `${p.unitPrice.toFixed(2)}$/u` : ''}</span>
              </button>
            );
          })}
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

      {/* Price display */}
      {priceInfo && (
        <div className="p-4 rounded-xl highlight-bordered">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-heading font-bold text-heading">{priceInfo.price}$</span>
            <span className="text-grey-muted text-sm">
              ({priceInfo.unitPrice.toFixed(2)}$/sticker)
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            {(finish === 'holographic' || finish === 'broken-glass' || finish === 'stars') && (
              <span className="text-accent text-xs font-medium">
                {tx({ fr: 'Effets Speciaux', en: 'Special Effects', es: 'Efectos Especiales' })}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
              <Sparkles size={12} />
              {tx({ fr: 'Design artiste', en: 'Artist design', es: 'Diseno artista' })}
            </span>
          </div>
        </div>
      )}

      {/* Add to cart */}
      <button onClick={handleAddToCart} className="btn-primary w-full justify-center text-sm py-3">
        {added ? (
          <><Check size={18} className="mr-2" />{tx({ fr: 'Ajoute au panier!', en: 'Added to cart!', es: 'Agregado al carrito!' })}</>
        ) : (
          <><ShoppingCart size={18} className="mr-2" />{tx({ fr: 'Ajouter au panier', en: 'Add to cart', es: 'Agregar al carrito' })}</>
        )}
      </button>

      <Link to="/panier" className="btn-outline w-full justify-center text-sm py-2.5">
        {tx({ fr: 'Voir le panier', en: 'View cart', es: 'Ver el carrito' })}
      </Link>

      <p className="text-grey-muted text-xs text-center">
        {tx({
          fr: 'Stickers vinyl professionnels, imprimés par Massive.',
          en: 'Professional vinyl stickers, printed by Massive.',
          es: 'Stickers vinyl profesionales, impresos por Massive.',
        })}
      </p>
    </div>
  );
}

export default ConfiguratorArtistSticker;
