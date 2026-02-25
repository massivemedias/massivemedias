import { useState } from 'react';
import { ShoppingCart, Check, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useLang } from '../../i18n/LanguageContext';
import FileUpload from '../FileUpload';
import {
  stickerFinishes, stickerShapes, stickerSizes,
  stickerPriceTiers, getStickerPrice, stickerImages,
} from '../../data/products';

function ConfiguratorStickers() {
  const { lang } = useLang();
  const { addToCart } = useCart();

  const [finish, setFinish] = useState('matte');
  const [shape, setShape] = useState('round');
  const [size, setSize] = useState('2.5in');
  const [qtyIndex, setQtyIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const tiers = stickerPriceTiers;
  const currentTier = tiers[qtyIndex] || tiers[0];
  const priceInfo = getStickerPrice(finish, shape, currentTier.qty);

  const finishLabel = stickerFinishes.find(f => f.id === finish);
  const shapeLabel = stickerShapes.find(s => s.id === shape);
  const sizeLabel = stickerSizes.find(s => s.id === size)?.label;

  const handleAddToCart = () => {
    addToCart({
      productId: 'sticker-custom',
      productName: lang === 'fr' ? 'Sticker Custom' : 'Custom Sticker',
      finish: lang === 'fr' ? finishLabel?.labelFr : finishLabel?.labelEn,
      shape: lang === 'fr' ? shapeLabel?.labelFr : shapeLabel?.labelEn,
      size: sizeLabel,
      quantity: priceInfo.qty,
      unitPrice: priceInfo.unitPrice,
      totalPrice: priceInfo.price,
      image: stickerImages[0],
      uploadedFiles,
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
      {/* Finish selector */}
      <div className="mb-5">
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          {lang === 'fr' ? 'Finition' : 'Finish'}
        </label>
        <div className="flex flex-wrap gap-2">
          {stickerFinishes.map(f => (
            <button
              key={f.id}
              onClick={() => setFinish(f.id)}
              className={`flex flex-col items-center justify-center min-w-[4.5rem] py-2.5 px-3 rounded-lg text-xs font-medium transition-all border-2 ${finish === f.id
                ? 'border-accent option-selected'
                : 'border-transparent hover:border-grey-muted/30 option-default'
              }`}
            >
              <span className={`w-4 h-4 rounded-full mb-1.5 border ${
                f.id === 'matte' ? 'bg-gray-400 border-gray-400' :
                f.id === 'glossy' ? 'bg-white border-gray-300 shadow-sm' :
                f.id === 'transparent' ? 'bg-transparent border-gray-300 border-dashed' :
                'bg-gradient-to-br from-pink-300 via-purple-300 to-cyan-300 border-transparent'
              }`} />
              <span className="text-heading leading-tight text-center">
                {lang === 'fr' ? f.labelFr.replace('Vinyle ', '') : f.labelEn.replace(' Vinyl', '')}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Shape selector */}
      <div className="mb-5">
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          {lang === 'fr' ? 'Forme' : 'Shape'}
        </label>
        <div className="flex flex-wrap gap-2">
          {stickerShapes.map(s => (
            <button
              key={s.id}
              onClick={() => handleShapeChange(s.id)}
              className={`flex flex-col items-center justify-center min-w-[4.5rem] py-2.5 px-3 rounded-lg text-xs font-medium transition-all border-2 ${shape === s.id
                ? 'border-accent option-selected'
                : 'border-transparent hover:border-grey-muted/30 option-default'
              }`}
            >
              <span className={`mb-1.5 ${
                s.id === 'round' ? 'w-4 h-4 rounded-full border-2 border-current' :
                s.id === 'square' ? 'w-4 h-4 rounded-sm border-2 border-current' :
                s.id === 'rectangle' ? 'w-5 h-3.5 rounded-sm border-2 border-current' :
                'w-5 h-4 border-2 border-current border-dashed rounded-lg'
              } text-grey-muted`} />
              <span className="text-heading leading-tight text-center">
                {lang === 'fr' ? s.labelFr : s.labelEn}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Size selector */}
      <div className="mb-5">
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          {lang === 'fr' ? 'Taille' : 'Size'}
        </label>
        <div className="flex flex-wrap gap-2">
          {stickerSizes.map(s => (
            <button
              key={s.id}
              onClick={() => setSize(s.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${size === s.id
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
      <div className="mb-6">
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          {lang === 'fr' ? 'Quantit\u00e9' : 'Quantity'}
        </label>
        <div className="flex flex-wrap gap-2">
          {tiers.map((tier, i) => {
            const p = getStickerPrice(finish, shape, tier.qty);
            return (
              <button
                key={tier.qty}
                onClick={() => setQtyIndex(i)}
                className={`flex flex-col items-center py-2.5 px-4 rounded-lg text-xs font-medium transition-all border-2 min-w-[5rem] ${qtyIndex === i
                  ? 'border-accent option-selected'
                  : 'border-transparent hover:border-grey-muted/30 option-default'
                }`}
              >
                <span className="text-heading font-bold text-sm">{tier.qty}</span>
                <span className="text-grey-muted mt-0.5">{p ? `${p.price}$` : ''}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* File upload */}
      <FileUpload
        files={uploadedFiles}
        onFilesChange={setUploadedFiles}
        label={lang === 'fr' ? 'Votre design (PNG, SVG, AI, PDF)' : 'Your design (PNG, SVG, AI, PDF)'}
      />

      {/* Price display */}
      {priceInfo && (
        <div className="p-5 rounded-xl mb-5 highlight-bordered">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-heading font-bold text-heading">{priceInfo.price}$</span>
            <span className="text-grey-muted text-sm">
              ({priceInfo.unitPrice.toFixed(2)}$/sticker)
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {finish === 'holographic' && (
              <span className="text-accent text-xs font-medium">
                {lang === 'fr' ? 'Holographique (Effets Sp\u00e9ciaux)' : 'Holographic (Special Effects)'}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
              <Sparkles size={12} />
              {lang === 'fr' ? 'Design inclus' : 'Design included'}
            </span>
          </div>
        </div>
      )}

      {/* Add to cart */}
      <button onClick={handleAddToCart} className="btn-primary w-full justify-center text-base py-3.5 mb-3">
        {added ? (
          <><Check size={20} className="mr-2" />{lang === 'fr' ? 'Ajout\u00e9 au panier!' : 'Added to cart!'}</>
        ) : (
          <><ShoppingCart size={20} className="mr-2" />{lang === 'fr' ? 'Ajouter au panier' : 'Add to cart'}</>
        )}
      </button>

      <Link to="/panier" className="btn-outline w-full justify-center text-sm py-2.5">
        {lang === 'fr' ? 'Voir le panier' : 'View cart'}
      </Link>

      <p className="text-grey-muted text-xs mt-3 text-center">
        {lang === 'fr'
          ? 'Nous vous contacterons pour confirmer les d\u00e9tails et organiser le paiement.'
          : 'We\'ll contact you to confirm details and arrange payment.'}
      </p>
    </>
  );
}

export default ConfiguratorStickers;
