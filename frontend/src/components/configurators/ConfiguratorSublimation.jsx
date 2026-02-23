import { useState } from 'react';
import { ShoppingCart, Check, Palette } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useLang } from '../../i18n/LanguageContext';
import FileUpload from '../FileUpload';
import {
  sublimationProducts, sublimationPriceTiers, sublimationDesignPrice,
  getSublimationPrice, sublimationImages,
} from '../../data/products';

function ConfiguratorSublimation() {
  const { lang } = useLang();
  const { addToCart } = useCart();

  const [product, setProduct] = useState('tshirt');
  const [qtyIndex, setQtyIndex] = useState(0);
  const [withDesign, setWithDesign] = useState(false);
  const [added, setAdded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const tiers = sublimationPriceTiers[product] || [];
  const priceInfo = getSublimationPrice(product, qtyIndex, withDesign);
  const productLabel = sublimationProducts.find(p => p.id === product);

  const handleProductChange = (p) => {
    setProduct(p);
    setQtyIndex(0);
  };

  const handleAddToCart = () => {
    if (!priceInfo) return;
    addToCart({
      productId: `sublimation-${product}`,
      productName: lang === 'fr'
        ? `${productLabel?.labelFr} Sublimation`
        : `Sublimation ${productLabel?.labelEn}`,
      finish: withDesign ? (lang === 'fr' ? 'Avec cr\u00e9ation design' : 'With design creation') : (lang === 'fr' ? 'Design fourni' : 'Design provided'),
      shape: null,
      size: lang === 'fr' ? productLabel?.labelFr : productLabel?.labelEn,
      quantity: priceInfo.qty,
      unitPrice: priceInfo.unitPrice,
      totalPrice: priceInfo.price,
      image: sublimationImages[0],
      uploadedFiles,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      {/* Product type selector */}
      <div className="mb-5">
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          {lang === 'fr' ? 'Produit' : 'Product'}
        </label>
        <div className="flex flex-wrap gap-2">
          {sublimationProducts.map(p => (
            <button
              key={p.id}
              onClick={() => handleProductChange(p.id)}
              className={`flex flex-col items-center justify-center min-w-[6rem] py-2.5 px-4 rounded-lg text-xs font-medium transition-all border-2 ${product === p.id
                ? 'border-magenta'
                : 'border-transparent hover:border-grey-muted/30'
              }`}
              style={{ background: product === p.id ? 'var(--highlight-bg)' : 'var(--bg-glass)' }}
            >
              <span className="text-heading leading-tight text-center font-semibold text-sm">
                {lang === 'fr' ? p.labelFr : p.labelEn}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quantity selector */}
      <div className="mb-5">
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          {lang === 'fr' ? 'Quantit\u00e9' : 'Quantity'}
        </label>
        <div className="flex flex-wrap gap-2">
          {tiers.map((tier, i) => (
            <button
              key={tier.qty}
              onClick={() => setQtyIndex(i)}
              className={`flex flex-col items-center py-2.5 px-4 rounded-lg text-xs font-medium transition-all border-2 min-w-[5rem] ${qtyIndex === i
                ? 'border-magenta'
                : 'border-transparent hover:border-grey-muted/30'
              }`}
              style={{ background: qtyIndex === i ? 'var(--highlight-bg)' : 'var(--bg-glass)' }}
            >
              <span className="text-heading font-bold text-sm">{tier.qty}</span>
              <span className="text-grey-muted mt-0.5">{tier.unitPrice}$/u</span>
            </button>
          ))}
        </div>
      </div>

      {/* Design option */}
      <div className="mb-6">
        <label className="flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all border-2"
          style={{
            background: withDesign ? 'var(--highlight-bg)' : 'var(--bg-glass)',
            borderColor: withDesign ? '#FF52A0' : 'transparent',
          }}
        >
          <input
            type="checkbox"
            checked={withDesign}
            onChange={(e) => setWithDesign(e.target.checked)}
            className="sr-only"
          />
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${withDesign ? 'bg-magenta border-magenta' : 'border-grey-muted/50'}`}>
            {withDesign && <Check size={14} className="text-white" />}
          </div>
          <div className="flex-1">
            <span className="text-heading font-medium text-sm flex items-center gap-1.5">
              <Palette size={14} className="text-magenta" />
              {lang === 'fr' ? 'Cr\u00e9ation graphique' : 'Graphic design'}
            </span>
            <span className="text-grey-muted text-xs block mt-0.5">
              {lang === 'fr' ? 'Si vous n\'avez pas de design pr\u00eat' : 'If you don\'t have a ready design'}
            </span>
          </div>
          <span className="text-magenta font-semibold text-sm">+{sublimationDesignPrice}$</span>
        </label>
      </div>

      {/* File upload */}
      <FileUpload
        files={uploadedFiles}
        onFilesChange={setUploadedFiles}
        label={lang === 'fr' ? 'Votre design (PNG, JPG, SVG, PDF)' : 'Your design (PNG, JPG, SVG, PDF)'}
      />

      {/* Price display */}
      {priceInfo && (
        <div className="p-5 rounded-xl mb-5" style={{ background: 'var(--highlight-bg)', border: '1px solid var(--bg-card-border)' }}>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-heading font-bold text-heading">{priceInfo.price}$</span>
            <span className="text-grey-muted text-sm">
              ({priceInfo.unitPrice.toFixed(2)}$/{lang === 'fr' ? 'unit\u00e9' : 'unit'})
            </span>
          </div>
          {withDesign && (
            <div className="text-grey-muted text-xs mt-1">
              {lang === 'fr'
                ? `${priceInfo.qty}x ${productLabel?.labelFr} ${priceInfo.basePrice}$ + Design ${priceInfo.designPrice}$`
                : `${priceInfo.qty}x ${productLabel?.labelEn} ${priceInfo.basePrice}$ + Design ${priceInfo.designPrice}$`}
            </div>
          )}
          <div className="text-grey-muted text-xs mt-2">
            {lang === 'fr' ? 'Impression permanente \u2014 r\u00e9sistant au lavage' : 'Permanent print \u2014 wash resistant'}
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
          ? 'Nous vous contacterons pour confirmer les d\u00e9tails (taille, couleur, design).'
          : 'We\'ll contact you to confirm details (size, color, design).'}
      </p>
    </>
  );
}

export default ConfiguratorSublimation;
