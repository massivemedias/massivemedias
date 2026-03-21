import { useState, useMemo } from 'react';
import { ShoppingCart, Check, Frame, Upload, ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useLang } from '../../i18n/LanguageContext';
import { useProduct } from '../../hooks/useProducts';
import FileUpload from '../FileUpload';
import {
  fineArtPrinterTiers as defaultTiers, fineArtFormats as defaultFormats, fineArtFramePrice as defaultFramePrice,
  fineArtFramePriceByFormat, getFineArtPrice as defaultGetPrice, fineArtImages,
} from '../../data/products';

function FramePreview({ image, withFrame, frameColor, format, formats, tx }) {
  const fmt = formats.find(f => f.id === format);
  const w = fmt?.w || 8.5;
  const h = fmt?.h || 11;
  // Aspect ratio pour le preview
  const aspect = w / h;

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className="relative transition-all duration-300 w-full max-w-[320px]"
        style={{ aspectRatio: `${w}/${h}` }}
      >
        {/* Cadre */}
        {withFrame ? (
          <div
            className="w-full h-full transition-colors duration-300"
            style={{
              border: `12px solid ${frameColor === 'white' ? '#e5e5e5' : '#1a1a1a'}`,
              padding: '16px',
              background: '#ffffff',
              boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
            }}
          >
            {image ? (
              <img src={image} alt="Preview" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-300">
                  <ImageIcon size={32} className="mx-auto mb-2" />
                  <p className="text-xs">{tx({ fr: 'Votre image ici', en: 'Your image here', es: 'Tu imagen aqui' })}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Sans cadre - juste l'image sur fond blanc */
          <div className="w-full h-full bg-white flex items-center justify-center" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            {image ? (
              <img src={image} alt="Preview" className="w-full h-full object-contain p-2" />
            ) : (
              <div className="text-center text-gray-300">
                <ImageIcon size={32} className="mx-auto mb-2" />
                <p className="text-xs">{tx({ fr: 'Deposez votre image', en: 'Drop your image', es: 'Deposita tu imagen' })}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ConfiguratorFineArt() {
  const { lang, tx } = useLang();
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

  // Image preview : premiere image uploadee
  const previewImage = useMemo(() => {
    const img = uploadedFiles.find(f => f.mime?.startsWith('image/'));
    return img?.url || null;
  }, [uploadedFiles]);

  const handleAddToCart = () => {
    if (!priceInfo) return;
    addToCart({
      productId: 'fine-art-print',
      productName: tx({ fr: 'Impression Fine Art', en: 'Fine Art Print', es: 'Impresion Fine Art' }),
      finish: tx({ fr: tierLabel?.labelFr, en: tierLabel?.labelEn, es: tierLabel?.labelEn }),
      shape: withFrame
        ? tx({
            fr: `Cadre ${frameColor === 'black' ? 'noir' : 'blanc'}`,
            en: `${frameColor === 'black' ? 'Black' : 'White'} frame`,
            es: `Marco ${frameColor === 'black' ? 'negro' : 'blanco'}`,
          })
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
    <div className="flex flex-col md:flex-row gap-6">
      {/* ========== COLONNE GAUCHE : Preview ========== */}
      <div className="md:w-[45%] lg:w-[42%]">
        {/* Upload mobile seulement */}
        <div className="md:hidden mb-4">
          <FileUpload
            files={uploadedFiles}
            onFilesChange={setUploadedFiles}
            label={tx({ fr: 'Votre fichier', en: 'Your file', es: 'Tu archivo' })}
            compact
          />
        </div>

        {/* Preview cadre - sticky en desktop */}
        <div className="md:sticky md:top-28">
          <FramePreview
            image={previewImage}
            withFrame={withFrame}
            frameColor={frameColor}
            format={format}
            formats={fineArtFormats}
            tx={tx}
          />
          {/* Info format sous le preview */}
          <div className="text-center mt-2">
            <span className="text-grey-muted text-xs">
              {formatLabel?.label} · {tier === 'museum'
                ? tx({ fr: 'Serie Musee', en: 'Museum Series', es: 'Serie Museo' })
                : tx({ fr: 'Serie Studio', en: 'Studio Series', es: 'Serie Studio' })}
            </span>
          </div>
        </div>
      </div>

      {/* ========== COLONNE DROITE : Selecteurs ========== */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Printer tier selector */}
        <div>
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
            {tx({ fr: 'Imprimante', en: 'Printer', es: 'Impresora' })}
          </label>
          <div className="flex flex-wrap gap-2">
            {fineArtPrinterTiers.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setTier(t.id);
                  const curFmt = fineArtFormats.find(f => f.id === format);
                  const price = t.id === 'museum' ? curFmt?.museumPrice : curFmt?.studioPrice;
                  if (price == null) setFormat('a4');
                }}
                className={`flex flex-col items-center justify-center min-w-[7rem] py-2.5 px-3 rounded-lg text-xs font-medium transition-all border-2 ${tier === t.id
                  ? 'border-accent option-selected'
                  : 'border-transparent hover:border-grey-muted/30 option-default'
                }`}
              >
                <span className="text-heading leading-tight text-center font-semibold">
                  {tx({ fr: t.labelFr, en: t.labelEn, es: t.labelEn })}
                </span>
                <span className="text-grey-muted mt-0.5 text-[10px]">
                  {tx({ fr: t.descFr, en: t.descEn, es: t.descEn })}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Format selector */}
        <div>
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
            Format
          </label>
          <div className="flex items-end gap-2 md:gap-3 justify-center">
            {fineArtFormats.map(f => {
              const price = tier === 'museum' ? f.museumPrice : f.studioPrice;
              const isAvailable = price != null;
              const scale = 4.5;
              const rectH = Math.max(40, Math.round((f.h || 11) * scale));
              const rectW = Math.max(28, Math.round((f.w || 8.5) * scale));
              return (
                <button
                  key={f.id}
                  onClick={() => isAvailable && setFormat(f.id)}
                  disabled={!isAvailable}
                  title={f.typeName || f.label}
                  className={`group flex flex-col items-center transition-all ${
                    !isAvailable ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <div
                    className={`rounded-sm transition-all duration-200 flex items-center justify-center mb-2 ${
                      format === f.id
                        ? 'bg-accent/30 ring-2 ring-accent'
                        : 'bg-white/8 hover:bg-white/12'
                    }`}
                    style={{ width: `${rectW}px`, height: `${rectH}px` }}
                  />
                  <span className={`text-[11px] font-bold ${format === f.id ? 'text-accent' : 'text-heading'}`}>
                    {f.label}
                  </span>
                  <span className={`text-[11px] mt-0.5 ${format === f.id ? 'text-accent' : 'text-grey-muted'}`}>
                    {isAvailable ? `${price}$` : 'N/A'}
                  </span>
                  {format === f.id && f.typeName && (
                    <span className="text-[9px] text-accent/70 mt-0.5 font-medium">{f.typeName}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Frame option */}
        <div>
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
                {tx({ fr: 'Ajouter un cadre', en: 'Add a frame', es: 'Agregar un marco' })}
              </span>
            </div>
            <span className="text-accent font-semibold text-sm">+{fineArtFramePriceByFormat[format] || fineArtFramePrice}$</span>
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
                <span className="text-heading font-semibold">{tx({ fr: 'Noir', en: 'Black', es: 'Negro' })}</span>
              </button>
              <button
                onClick={() => setFrameColor('white')}
                className={`flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-medium transition-all border-2 ${frameColor === 'white'
                  ? 'border-accent option-selected'
                  : 'border-transparent hover:border-grey-muted/30 option-default'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white border border-grey-muted/30" />
                <span className="text-heading font-semibold">{tx({ fr: 'Blanc', en: 'White', es: 'Blanco' })}</span>
              </button>
            </div>
          )}
        </div>

        {/* File upload - desktop only (mobile is above the preview) */}
        <div className="hidden md:block">
          <FileUpload
            files={uploadedFiles}
            onFilesChange={setUploadedFiles}
            label={tx({ fr: 'Votre fichier', en: 'Your file', es: 'Tu archivo' })}
            compact
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
            {tx({ fr: 'Notes / Description', en: 'Notes / Description', es: 'Notas / Descripcion' })}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={tx({ fr: 'Decrivez le produit souhaite (format, finition, details...)', en: 'Describe the desired product (format, finish, details...)', es: 'Describe el producto deseado (formato, acabado, detalles...)' })}
            className="w-full min-h-[80px] rounded-lg border-2 border-grey-muted/20 bg-transparent px-4 py-3 text-sm text-heading placeholder:text-grey-muted/50 focus:border-accent focus:outline-none transition-colors resize-none"
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
                {tx({
                  fr: `Tirage ${priceInfo.basePrice}$ + Cadre ${priceInfo.framePrice}$`,
                  en: `Print ${priceInfo.basePrice}$ + Frame ${priceInfo.framePrice}$`,
                  es: `Impresion ${priceInfo.basePrice}$ + Marco ${priceInfo.framePrice}$`,
                })}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-grey-muted text-xs">
                {tier === 'museum'
                  ? tx({ fr: 'Qualite musee - 12 encres pigmentees', en: 'Museum quality - 12 pigmented inks', es: 'Calidad museo - 12 tintas pigmentadas' })
                  : tx({ fr: 'Qualite studio - impression professionnelle', en: 'Studio quality - professional printing', es: 'Calidad estudio - impresion profesional' })}
              </span>
            </div>
          </div>
        )}

        {/* Add to cart */}
        <button onClick={handleAddToCart} className="btn-primary w-full justify-center text-base py-3.5 mb-3">
          {added ? (
            <><Check size={20} className="mr-2" />{tx({ fr: 'Ajoute au panier!', en: 'Added to cart!', es: 'Agregado al carrito!' })}</>
          ) : (
            <><ShoppingCart size={20} className="mr-2" />{tx({ fr: 'Ajouter au panier', en: 'Add to cart', es: 'Agregar al carrito' })}</>
          )}
        </button>

        <Link to="/panier" className="btn-outline w-full justify-center text-sm py-2.5">
          {tx({ fr: 'Voir le panier', en: 'View cart', es: 'Ver el carrito' })}
        </Link>

        <p className="text-grey-muted text-xs mt-3 text-center">
          {tx({
            fr: 'Soft proofing inclus. Nous validerons les couleurs avec vous avant impression.',
            en: 'Soft proofing included. We\'ll validate colors with you before printing.',
            es: 'Soft proofing incluido. Validaremos los colores contigo antes de imprimir.',
          })}
        </p>
      </div>
    </div>
  );
}

export default ConfiguratorFineArt;
