import { useState } from 'react';
import { ShoppingCart, Check, Frame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useLang } from '../../i18n/LanguageContext';
import {
  fineArtPrinterTiers, fineArtFormats, fineArtFramePrice,
  getFineArtPrice, fineArtImages,
} from '../../data/products';

function ConfiguratorFineArt() {
  const { lang } = useLang();
  const { addToCart } = useCart();

  const [tier, setTier] = useState('studio');
  const [format, setFormat] = useState('a4');
  const [withFrame, setWithFrame] = useState(false);
  const [added, setAdded] = useState(false);

  const priceInfo = getFineArtPrice(tier, format, withFrame);
  const tierLabel = fineArtPrinterTiers.find(t => t.id === tier);
  const formatLabel = fineArtFormats.find(f => f.id === format);

  const handleAddToCart = () => {
    if (!priceInfo) return;
    addToCart({
      productId: 'fine-art-print',
      productName: lang === 'fr' ? 'Impression Fine Art' : 'Fine Art Print',
      finish: lang === 'fr' ? tierLabel?.labelFr : tierLabel?.labelEn,
      shape: withFrame ? (lang === 'fr' ? 'Avec cadre' : 'With frame') : null,
      size: formatLabel?.label,
      quantity: 1,
      unitPrice: priceInfo.price,
      totalPrice: priceInfo.price,
      image: fineArtImages[0],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      {/* Printer tier selector */}
      <div className="mb-5">
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          {lang === 'fr' ? 'Imprimante' : 'Printer'}
        </label>
        <div className="flex flex-wrap gap-2">
          {fineArtPrinterTiers.map(t => (
            <button
              key={t.id}
              onClick={() => setTier(t.id)}
              className={`flex flex-col items-center justify-center min-w-[7rem] py-2.5 px-3 rounded-lg text-xs font-medium transition-all border-2 ${tier === t.id
                ? 'border-magenta'
                : 'border-transparent hover:border-grey-muted/30'
              }`}
              style={{ background: tier === t.id ? 'var(--highlight-bg)' : 'var(--bg-glass)' }}
            >
              <span className="text-heading leading-tight text-center font-semibold">
                {lang === 'fr' ? t.labelFr : t.labelEn}
              </span>
              <span className="text-grey-muted mt-0.5 text-[10px]">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Format selector */}
      <div className="mb-5">
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          Format
        </label>
        <div className="flex flex-wrap gap-2">
          {fineArtFormats.map(f => {
            const price = tier === 'museum' ? f.museumPrice : f.studioPrice;
            return (
              <button
                key={f.id}
                onClick={() => setFormat(f.id)}
                className={`flex flex-col items-center py-2.5 px-4 rounded-lg text-xs font-medium transition-all border-2 min-w-[5rem] ${format === f.id
                  ? 'border-magenta'
                  : 'border-transparent hover:border-grey-muted/30'
                }`}
                style={{ background: format === f.id ? 'var(--highlight-bg)' : 'var(--bg-glass)' }}
              >
                <span className="text-heading font-bold text-sm">{f.label}</span>
                <span className="text-grey-muted mt-0.5">{price}$</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Frame option */}
      <div className="mb-6">
        <label className="flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all border-2"
          style={{
            background: withFrame ? 'var(--highlight-bg)' : 'var(--bg-glass)',
            borderColor: withFrame ? '#FF52A0' : 'transparent',
          }}
        >
          <input
            type="checkbox"
            checked={withFrame}
            onChange={(e) => setWithFrame(e.target.checked)}
            className="sr-only"
          />
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${withFrame ? 'bg-magenta border-magenta' : 'border-grey-muted/50'}`}>
            {withFrame && <Check size={14} className="text-white" />}
          </div>
          <div className="flex-1">
            <span className="text-heading font-medium text-sm">
              {lang === 'fr' ? 'Ajouter un cadre' : 'Add a frame'}
            </span>
            <span className="text-grey-muted text-xs ml-2">
              {lang === 'fr' ? '(noir ou blanc)' : '(black or white)'}
            </span>
          </div>
          <span className="text-magenta font-semibold text-sm">+{fineArtFramePrice}$</span>
        </label>
      </div>

      {/* Price display */}
      {priceInfo && (
        <div className="p-5 rounded-xl mb-5" style={{ background: 'var(--highlight-bg)', border: '1px solid var(--bg-card-border)' }}>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-heading font-bold text-heading">{priceInfo.price}$</span>
          </div>
          {withFrame && (
            <div className="text-grey-muted text-xs mt-1">
              {lang === 'fr' ? `Tirage ${priceInfo.basePrice}$ + Cadre ${priceInfo.framePrice}$` : `Print ${priceInfo.basePrice}$ + Frame ${priceInfo.framePrice}$`}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-grey-muted text-xs">
              {tier === 'museum'
                ? (lang === 'fr' ? 'Qualit\u00e9 mus\u00e9e \u2014 12 encres pigment\u00e9es' : 'Museum quality \u2014 12 pigmented inks')
                : (lang === 'fr' ? 'Qualit\u00e9 studio \u2014 impression professionnelle' : 'Studio quality \u2014 professional printing')}
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
          ? 'Soft proofing inclus. Nous validerons les couleurs avec vous avant impression.'
          : 'Soft proofing included. We\'ll validate colors with you before printing.'}
      </p>
    </>
  );
}

export default ConfiguratorFineArt;
