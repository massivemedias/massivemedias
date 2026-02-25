import { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useLang } from '../../i18n/LanguageContext';
import FileUpload from '../FileUpload';
import {
  flyerSides, flyerPriceTiers, getFlyerPrice, flyerImages,
} from '../../data/products';

function ConfiguratorFlyers() {
  const { lang } = useLang();
  const { addToCart } = useCart();

  const [side, setSide] = useState('recto');
  const [qtyIndex, setQtyIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const priceInfo = getFlyerPrice(side, qtyIndex);
  const sideLabel = flyerSides.find(s => s.id === side);

  const handleAddToCart = () => {
    if (!priceInfo) return;
    addToCart({
      productId: 'flyer-a6',
      productName: lang === 'fr' ? 'Flyers A6' : 'A6 Flyers',
      finish: lang === 'fr' ? sideLabel?.labelFr : sideLabel?.labelEn,
      shape: null,
      size: 'A6 (4"x6")',
      quantity: priceInfo.qty,
      unitPrice: priceInfo.unitPrice,
      totalPrice: priceInfo.price,
      image: flyerImages[0],
      uploadedFiles,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      {/* Side selector */}
      <div className="mb-5">
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          {lang === 'fr' ? 'Impression' : 'Printing'}
        </label>
        <div className="flex flex-wrap gap-2">
          {flyerSides.map(s => (
            <button
              key={s.id}
              onClick={() => setSide(s.id)}
              className={`flex flex-col items-center justify-center min-w-[7rem] py-2.5 px-4 rounded-lg text-xs font-medium transition-all border-2 ${side === s.id
                ? 'border-accent option-selected'
                : 'border-transparent hover:border-grey-muted/30 option-default'
              }`}
            >
              <span className="text-heading leading-tight text-center font-semibold text-sm">
                {lang === 'fr' ? s.labelFr : s.labelEn}
              </span>
              {s.multiplier > 1 && (
                <span className="text-grey-muted mt-0.5 text-[10px]">+30%</span>
              )}
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
          {flyerPriceTiers.map((tier, i) => {
            const p = getFlyerPrice(side, i);
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
        label={lang === 'fr' ? 'Votre fichier (PDF, PNG, JPG, AI)' : 'Your file (PDF, PNG, JPG, AI)'}
      />

      {/* Price display */}
      {priceInfo && (
        <div className="p-5 rounded-xl mb-5 highlight-bordered">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-heading font-bold text-heading">{priceInfo.price}$</span>
            <span className="text-grey-muted text-sm">
              ({priceInfo.unitPrice.toFixed(2)}$/{lang === 'fr' ? 'unit\u00e9' : 'unit'})
            </span>
          </div>
          <div className="text-grey-muted text-xs mt-2">
            {lang === 'fr' ? 'Papier premium 300g+ \u2014 Qualit\u00e9 professionnelle' : 'Premium 300g+ paper \u2014 Professional quality'}
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
          ? 'Design graphique disponible en option. D\u00e9lai express 24h disponible.'
          : 'Graphic design available as an option. 24h express turnaround available.'}
      </p>
    </>
  );
}

export default ConfiguratorFlyers;
