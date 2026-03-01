import { useState, useEffect } from 'react';
import { ShoppingCart, Check, Frame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useLang } from '../../i18n/LanguageContext';
import {
  getArtistPrintPrice, artistPrinterTiers, artistFormats,
} from '../../data/artists';

function ConfiguratorArtistPrint({ artist, selectedPrint }) {
  const { lang } = useLang();
  const { addToCart } = useCart();

  const [tier, setTier] = useState('studio');
  const [format, setFormat] = useState('a4');
  const [withFrame, setWithFrame] = useState(false);
  const [frameColor, setFrameColor] = useState('black');
  const [added, setAdded] = useState(false);
  const [notes, setNotes] = useState('');

  // Reset added state when print changes
  useEffect(() => { setAdded(false); }, [selectedPrint?.id]);

  if (!selectedPrint || !artist) return null;

  const priceInfo = getArtistPrintPrice(artist.pricing, tier, format, withFrame);
  const tierLabel = artistPrinterTiers.find(t => t.id === tier);
  const formatLabel = artistFormats.find(f => f.id === format);
  const printTitle = lang === 'fr' ? selectedPrint.titleFr : selectedPrint.titleEn;

  const handleAddToCart = () => {
    if (!priceInfo) return;
    addToCart({
      productId: `artist-print-${artist.slug}-${selectedPrint.id}`,
      productName: `${artist.name} - ${printTitle}`,
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
      image: selectedPrint.image,
      uploadedFiles: [],
      notes,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // Get price for display in format buttons
  const getFormatPrice = (fmtId) => {
    const p = getArtistPrintPrice(artist.pricing, tier, fmtId, false);
    return p?.basePrice;
  };

  return (
    <div className="space-y-4">
      {/* Selected print info */}
      <div className="p-4 rounded-xl bg-glass flex items-center gap-4">
        <img
          src={selectedPrint.image}
          alt={printTitle}
          className="w-16 h-16 rounded-lg object-cover"
        />
        <div>
          <div className="text-heading font-heading font-bold text-sm">{printTitle}</div>
          <div className="text-grey-muted text-xs">{artist.name}</div>
        </div>
      </div>

      {/* Printer tier selector */}
      <div>
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          {lang === 'fr' ? 'Qualit\u00e9 d\'impression' : 'Print Quality'}
        </label>
        <div className="space-y-2">
          {artistPrinterTiers.map(t => (
            <button
              key={t.id}
              onClick={() => setTier(t.id)}
              className={`block w-full text-center py-3.5 px-4 rounded-lg text-xs font-medium transition-all border-2 ${tier === t.id
                ? 'border-accent option-selected'
                : 'border-transparent hover:border-grey-muted/30 option-default'
              }`}
            >
              <span className="text-heading font-semibold text-sm">
                {lang === 'fr' ? t.labelFr : t.labelEn}
              </span>
              <span className="text-grey-muted ml-2 text-[11px]">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Format selector */}
      <div>
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          Format
        </label>
        <div className="grid grid-cols-2 gap-2">
          {artistFormats.map(f => {
            const price = getFormatPrice(f.id);
            return (
              <button
                key={f.id}
                onClick={() => setFormat(f.id)}
                className={`block w-full text-center py-3.5 px-3 rounded-lg text-xs font-medium transition-all border-2 ${format === f.id
                  ? 'border-accent option-selected'
                  : 'border-transparent hover:border-grey-muted/30 option-default'
                }`}
              >
                <div className="text-heading font-bold text-sm">{f.label}</div>
                {price != null && <div className="text-grey-muted mt-0.5">{price}$</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Frame option */}
      <div>
        <label className={`flex items-center gap-3 w-full p-4 rounded-lg cursor-pointer transition-all border-2 ${withFrame ? 'checkbox-active' : 'option-default'}`}>
          <input
            type="checkbox"
            checked={withFrame}
            onChange={(e) => setWithFrame(e.target.checked)}
            className="sr-only"
          />
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${withFrame ? 'bg-accent border-accent' : 'border-grey-muted/50'}`}>
            {withFrame && <Check size={14} className="text-white" />}
          </div>
          <div className="flex-1">
            <span className="text-heading font-medium text-sm">
              {lang === 'fr' ? 'Ajouter un cadre' : 'Add a frame'}
            </span>
          </div>
          <span className="text-accent font-semibold text-sm">+{artist.pricing.framePrice}$</span>
        </label>

        {withFrame && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => setFrameColor('black')}
              className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg text-xs font-medium transition-all border-2 ${frameColor === 'black'
                ? 'border-accent option-selected'
                : 'border-transparent hover:border-grey-muted/30 option-default'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-black border border-grey-muted/30" />
              <span className="text-heading font-semibold">{lang === 'fr' ? 'Noir' : 'Black'}</span>
            </button>
            <button
              onClick={() => setFrameColor('white')}
              className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg text-xs font-medium transition-all border-2 ${frameColor === 'white'
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

      {/* Notes */}
      <div>
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          {lang === 'fr' ? 'Notes / Description' : 'Notes / Description'}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder={lang === 'fr' ? 'Decrivez vos preferences (dedicace, message, details...)' : 'Describe your preferences (dedication, message, details...)'}
          className="w-full rounded-lg border-2 border-grey-muted/20 bg-transparent px-4 py-3 text-sm text-heading placeholder:text-grey-muted/50 focus:border-accent focus:outline-none transition-colors resize-none"
        />
      </div>

      {/* Price display */}
      {priceInfo && (
        <div className="p-5 rounded-xl highlight-bordered">
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
                ? (lang === 'fr' ? 'Qualit\u00e9 mus\u00e9e - 12 encres pigment\u00e9es, conservation 100+ ans' : 'Museum quality - 12 pigmented inks, 100+ year archival')
                : (lang === 'fr' ? 'Qualit\u00e9 studio - impression professionnelle pigment\u00e9e' : 'Studio quality - professional pigmented printing')}
            </span>
          </div>
        </div>
      )}

      {/* Add to cart */}
      <button onClick={handleAddToCart} className="btn-primary w-full justify-center text-base py-4">
        {added ? (
          <><Check size={20} className="mr-2" />{lang === 'fr' ? 'Ajout\u00e9 au panier!' : 'Added to cart!'}</>
        ) : (
          <><ShoppingCart size={20} className="mr-2" />{lang === 'fr' ? 'Ajouter au panier' : 'Add to cart'}</>
        )}
      </button>

      <Link to="/panier" className="btn-outline w-full justify-center text-sm py-3">
        {lang === 'fr' ? 'Voir le panier' : 'View cart'}
      </Link>

      <p className="text-grey-muted text-xs text-center">
        {lang === 'fr'
          ? 'Impression professionnelle par Massive Medias. Soft proofing inclus.'
          : 'Professional printing by Massive Medias. Soft proofing included.'}
      </p>
    </div>
  );
}

export default ConfiguratorArtistPrint;
