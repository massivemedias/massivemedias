import { useState } from 'react';
import { ShoppingCart, Check, Frame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useLang } from '../../i18n/LanguageContext';
import { useProduct } from '../../hooks/useProducts';
import FileUpload from '../FileUpload';
import {
  fineArtPrinterTiers as defaultTiers, fineArtFormats as defaultFormats, fineArtFramePrice as defaultFramePrice,
  getFineArtPrice as defaultGetPrice, fineArtImages,
} from '../../data/products';

function ConfiguratorFineArt() {
  const { lang } = useLang();
  const { addToCart } = useCart();
  const cmsProduct = useProduct('fine-art');
  const pd = cmsProduct?.pricingData;

  const fineArtPrinterTiers = pd?.tiers || defaultTiers;
  const fineArtFormats = pd?.formats || defaultFormats;
  const fineArtFramePrice = pd?.framePrice ?? defaultFramePrice;

  const [tier, setTier] = useState('studio');
  const [format, setFormat] = useState('a4');
  const [withFrame, setWithFrame] = useState(false);
  const [frameColor, setFrameColor] = useState('black');
  const [added, setAdded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [notes, setNotes] = useState('');

  const getFineArtPrice = pd?.formats
    ? (t, f, frame) => {
        const fmt = fineArtFormats.find(x => x.id === f);
        if (!fmt) return null;
        const base = t === 'museum' ? fmt.museumPrice : fmt.studioPrice;
        return { price: base + (frame ? fineArtFramePrice : 0), basePrice: base, framePrice: frame ? fineArtFramePrice : 0 };
      }
    : defaultGetPrice;

  const priceInfo = getFineArtPrice(tier, format, withFrame);
  const tierLabel = fineArtPrinterTiers.find(t => t.id === tier);
  const formatLabel = fineArtFormats.find(f => f.id === format);

  const handleAddToCart = () => {
    if (!priceInfo) return;
    addToCart({
      productId: 'fine-art-print',
      productName: lang === 'fr' ? 'Impression Fine Art' : 'Fine Art Print',
      finish: lang === 'fr' ? tierLabel?.labelFr : tierLabel?.labelEn,
      shape: withFrame
        ? (lang === 'fr'
          ? `Cadre ${frameColor === 'black' ? 'noir' : 'blanc'}`
          : `${frameColor === 'black' ? 'Black' : 'White'} frame`)
        : null,
      size: formatLabel?.label,
      quantity: 1,
      unitPrice: priceInfo.price,
      totalPrice: priceInfo.price,
      image: fineArtImages[0],
      uploadedFiles,
      notes,
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
                ? 'border-accent option-selected'
                : 'border-transparent hover:border-grey-muted/30 option-default'
              }`}
            >
              <span className="text-heading leading-tight text-center font-semibold">
                {lang === 'fr' ? t.labelFr : t.labelEn}
              </span>
              <span className="text-grey-muted mt-0.5 text-[10px]">
                {lang === 'fr' ? t.descFr : t.descEn}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Format selector - visual size cards */}
      <div className="mb-5">
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          Format
        </label>
        <div className="grid grid-cols-4 gap-2">
          {fineArtFormats.map(f => {
            const price = tier === 'museum' ? f.museumPrice : f.studioPrice;
            const heights = { a4: 'h-8', a3: 'h-10', a3plus: 'h-11', a2: 'h-12' };
            const widths = { a4: 'w-6', a3: 'w-7', a3plus: 'w-8', a2: 'w-9' };
            return (
              <button
                key={f.id}
                onClick={() => setFormat(f.id)}
                className={`flex flex-col items-center py-2 px-1.5 rounded-lg text-xs font-medium transition-all border-2 ${format === f.id
                  ? 'border-accent ring-1 ring-accent/30 option-selected'
                  : 'border-transparent hover:border-grey-muted/30 option-default'
                }`}
              >
                <div className={`${heights[f.id] || 'h-8'} ${widths[f.id] || 'w-6'} rounded border border-current text-grey-muted/40 mb-1.5 flex items-center justify-center`}>
                  <span className="text-[7px] text-grey-muted">{f.id.toUpperCase()}</span>
                </div>
                <span className="text-heading font-bold text-[11px]">{f.label}</span>
                <span className="text-accent font-semibold text-[11px] mt-0.5">{price}$</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Frame option */}
      <div className="mb-6">
        <label className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all border-2 ${withFrame ? 'checkbox-active' : 'option-default'}`}>
          <input
            type="checkbox"
            checked={withFrame}
            onChange={(e) => setWithFrame(e.target.checked)}
            className="sr-only"
          />
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${withFrame ? 'bg-accent border-accent' : 'border-grey-muted/50'}`}>
            {withFrame && <Check size={14} className="text-white" />}
          </div>
          <div className="flex-1">
            <span className="text-heading font-medium text-sm">
              {lang === 'fr' ? 'Ajouter un cadre' : 'Add a frame'}
            </span>
          </div>
          <span className="text-accent font-semibold text-sm">+{fineArtFramePrice}$</span>
        </label>

        {withFrame && (
          <div className="flex gap-2 mt-3 ml-1">
            <button
              onClick={() => setFrameColor('black')}
              className={`flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-medium transition-all border-2 ${frameColor === 'black'
                ? 'border-accent option-selected'
                : 'border-transparent hover:border-grey-muted/30 option-default'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-black border border-grey-muted/30" />
              <span className="text-heading font-semibold">{lang === 'fr' ? 'Noir' : 'Black'}</span>
            </button>
            <button
              onClick={() => setFrameColor('white')}
              className={`flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-medium transition-all border-2 ${frameColor === 'white'
                ? 'border-accent option-selected'
                : 'border-transparent hover:border-grey-muted/30 option-default'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white border border-grey-muted/30" />
              <span className="text-heading font-semibold">{lang === 'fr' ? 'Blanc' : 'White'}</span>
            </button>
          </div>
        )}
      </div>

      {/* File upload + Notes side by side */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-4 mb-5">
        <FileUpload
          files={uploadedFiles}
          onFilesChange={setUploadedFiles}
          label={lang === 'fr' ? 'Votre fichier' : 'Your file'}
          compact
        />
        <div>
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
            {lang === 'fr' ? 'Notes / Description' : 'Notes / Description'}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder={lang === 'fr' ? 'Decrivez le produit souhaite (format, finition, details...)' : 'Describe the desired product (format, finish, details...)'}
            className="w-full min-h-[100px] rounded-lg border-2 border-grey-muted/20 bg-transparent px-4 py-3 text-sm text-heading placeholder:text-grey-muted/50 focus:border-accent focus:outline-none transition-colors resize-none"
          />
        </div>
      </div>

      {/* Price display */}
      {priceInfo && (
        <div className="p-5 rounded-xl mb-5 highlight-bordered">
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
