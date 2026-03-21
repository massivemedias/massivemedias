import { useState, useMemo, useEffect, useRef } from 'react';
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

function FramePreview({ image, withFrame, frameColor, format, formats, tx, isLandscape }) {
  const fmt = formats.find(f => f.id === format);
  const fmtW = fmt?.w || 8.5;
  const fmtH = fmt?.h || 11;

  // A6 = carte postale = paysage par defaut, autres = portrait par defaut
  // L'image uploadee peut overrider l'orientation
  const isPostcard = format === 'postcard';
  const defaultLandscape = isPostcard; // carte postale = paysage par defaut
  const useLandscape = image ? isLandscape : defaultLandscape;
  const w = useLandscape ? Math.max(fmtW, fmtH) : Math.min(fmtW, fmtH);
  const h = useLandscape ? Math.min(fmtW, fmtH) : Math.max(fmtW, fmtH);

  // Taille du preview proportionnelle mais compacte (+10px)
  const maxDim = Math.max(fmtW, fmtH);
  const scaleFactor = 230 / 24; // A2 = 230px max
  const previewMaxW = Math.max(130, Math.round(maxDim * scaleFactor));

  // Epaisseur du cadre proportionnelle
  const frameThickness = withFrame ? Math.max(8, Math.round(previewMaxW * 0.04)) : 0;
  const matThickness = withFrame ? Math.max(12, Math.round(previewMaxW * 0.06)) : 0;

  return (
    <div className="flex items-center justify-center p-2">
      <div
        className="relative transition-all duration-500 ease-out"
        style={{
          aspectRatio: `${w}/${h}`,
          width: '100%',
          maxWidth: `${previewMaxW}px`,
        }}
      >
        {withFrame ? (
          <div
            className="w-full h-full transition-all duration-500"
            style={{
              border: `${frameThickness}px solid ${frameColor === 'white' ? '#e5e5e5' : '#1a1a1a'}`,
              padding: `${matThickness}px`,
              background: '#ffffff',
              boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
            }}
          >
            {image ? (
              <img src={image} alt="Preview" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-300">
                  <ImageIcon size={28} className="mx-auto mb-1" />
                  <p className="text-[10px]">{tx({ fr: 'Votre image ici', en: 'Your image here', es: 'Tu imagen aqui' })}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full bg-white flex items-center justify-center" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            {image ? (
              <img src={image} alt="Preview" className="w-full h-full object-contain p-2" />
            ) : (
              <div className="text-center text-gray-300">
                <ImageIcon size={28} className="mx-auto mb-1" />
                <p className="text-[10px]">{tx({ fr: 'Deposez votre image', en: 'Drop your image', es: 'Deposita tu imagen' })}</p>
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

  // Images uploadees (filtrer que les images)
  const imageFiles = useMemo(() => uploadedFiles.filter(f => f.mime?.startsWith('image/')), [uploadedFiles]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isLandscape, setIsLandscape] = useState(false);

  // Reset index si les fichiers changent
  useEffect(() => {
    if (activeImageIdx >= imageFiles.length) setActiveImageIdx(Math.max(0, imageFiles.length - 1));
  }, [imageFiles.length]);

  const previewImage = imageFiles[activeImageIdx]?.url || null;

  // Detecter orientation de l'image active
  useEffect(() => {
    if (!previewImage) { setIsLandscape(false); return; }
    const img = new Image();
    img.onload = () => setIsLandscape(img.naturalWidth > img.naturalHeight);
    img.src = previewImage;
  }, [previewImage]);

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
    <div className="flex flex-col md:flex-row gap-4 md:gap-5">
      {/* ========== COLONNE GAUCHE : Preview + Upload ========== */}
      <div className="md:w-[35%] lg:w-[30%] flex-shrink-0">
        <div className="md:sticky md:top-28 space-y-3">
          {/* Preview cadre */}
          <FramePreview
            image={previewImage}
            withFrame={withFrame}
            frameColor={frameColor}
            format={format}
            formats={fineArtFormats}
            tx={tx}
            isLandscape={isLandscape}
          />
          {/* Bullets navigation entre images */}
          {imageFiles.length > 1 && (
            <div className="flex items-center justify-center gap-2">
              {imageFiles.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === activeImageIdx ? 'bg-accent scale-125' : 'bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
          {/* Info format */}
          <div className="text-center">
            <span className="text-grey-muted text-[10px]">
              {formatLabel?.label} · {tier === 'museum'
                ? tx({ fr: 'Musee', en: 'Museum', es: 'Museo' })
                : tx({ fr: 'Studio', en: 'Studio', es: 'Studio' })}
            </span>
          </div>
          {/* Upload sous le cadre */}
          <FileUpload
            files={uploadedFiles}
            onFilesChange={setUploadedFiles}
            label={tx({ fr: 'Votre fichier', en: 'Your file', es: 'Tu archivo' })}
            compact
            hidePreview
          />
        </div>
      </div>

      {/* ========== COLONNE DROITE : Selecteurs ========== */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Qualite - boutons plus gros */}
        <div>
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
            {tx({ fr: 'Qualite', en: 'Quality', es: 'Calidad' })}
          </label>
          <div className="flex gap-2">
            {fineArtPrinterTiers.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setTier(t.id);
                  const curFmt = fineArtFormats.find(f => f.id === format);
                  const price = t.id === 'museum' ? curFmt?.museumPrice : curFmt?.studioPrice;
                  if (price == null) setFormat('a4');
                }}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all border-2 ${tier === t.id
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-transparent bg-white/5 text-grey-muted hover:bg-white/8 hover:text-heading'
                }`}
              >
                {tx({ fr: t.labelFr, en: t.labelEn, es: t.labelEn })}
                <span className="block text-[10px] font-normal mt-0.5 opacity-60">
                  {tx({ fr: t.descFr, en: t.descEn, es: t.descEn })}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Format - rectangles proportionnels */}
        <div>
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
            Format
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {fineArtFormats.map(f => {
              const price = tier === 'museum' ? f.museumPrice : f.studioPrice;
              const isAvailable = price != null;
              const scale = 2.8;
              const rectH = Math.max(24, Math.round((f.h || 11) * scale));
              const rectW = Math.max(16, Math.round((f.w || 8.5) * scale));
              return (
                <button
                  key={f.id}
                  onClick={() => isAvailable && setFormat(f.id)}
                  disabled={!isAvailable}
                  title={f.typeName || f.label}
                  className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-lg transition-all border-2 ${
                    !isAvailable
                      ? 'opacity-25 cursor-not-allowed border-transparent bg-white/3'
                      : format === f.id
                      ? 'border-accent bg-accent/10'
                      : 'border-transparent bg-white/5 hover:bg-white/8 hover:border-grey-muted/20'
                  }`}
                >
                  <div
                    className={`rounded-[2px] mb-1.5 ${
                      format === f.id ? 'bg-accent/40' : 'bg-white/10'
                    }`}
                    style={{ width: `${rectW}px`, height: `${rectH}px` }}
                  />
                  <span className={`text-[10px] font-bold leading-tight ${format === f.id ? 'text-accent' : 'text-heading'}`}>
                    {f.label}
                  </span>
                  <span className={`text-[10px] ${format === f.id ? 'text-accent' : 'text-grey-muted'}`}>
                    {isAvailable ? `${price}$` : 'N/A'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cadre - checkbox + couleurs */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={withFrame}
              onChange={(e) => setWithFrame(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${withFrame ? 'bg-accent border-accent' : 'border-grey-muted/50'}`}>
              {withFrame && <Check size={10} className="text-white" />}
            </div>
            <span className="text-heading text-sm">
              {tx({ fr: 'Cadre', en: 'Frame', es: 'Marco' })}
            </span>
            <span className="text-accent text-xs font-semibold">+{fineArtFramePriceByFormat[format] || fineArtFramePrice}$</span>
          </label>
          {withFrame && (
            <div className="flex gap-1.5">
              <button
                onClick={() => setFrameColor('black')}
                className={`w-6 h-6 rounded-full bg-black border-2 transition-all ${frameColor === 'black' ? 'border-accent scale-110' : 'border-grey-muted/30 hover:border-grey-muted/60'}`}
                title={tx({ fr: 'Noir', en: 'Black', es: 'Negro' })}
              />
              <button
                onClick={() => setFrameColor('white')}
                className={`w-6 h-6 rounded-full bg-white border-2 transition-all ${frameColor === 'white' ? 'border-accent scale-110' : 'border-grey-muted/30 hover:border-grey-muted/60'}`}
                title={tx({ fr: 'Blanc', en: 'White', es: 'Blanco' })}
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder={tx({ fr: 'Notes ou instructions (optionnel)', en: 'Notes or instructions (optional)', es: 'Notas o instrucciones (opcional)' })}
          className="w-full rounded-lg bg-white/5 px-3 py-2.5 text-sm text-heading placeholder:text-grey-muted/40 focus:bg-white/8 focus:outline-none transition-colors resize-none"
        />

        {/* Prix + bouton panier */}
        {priceInfo && (
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <span className="text-xl font-heading font-bold text-heading">{priceInfo.price}$</span>
              {withFrame && (
                <span className="text-grey-muted text-[10px] ml-1">
                  ({priceInfo.basePrice}+{priceInfo.framePrice})
                </span>
              )}
            </div>
            <button onClick={handleAddToCart} className="btn-primary justify-center text-xs py-2 px-5">
              {added ? (
                <><Check size={14} className="mr-1" />{tx({ fr: 'Ajoute!', en: 'Added!', es: 'Agregado!' })}</>
              ) : (
                <><ShoppingCart size={14} className="mr-1" />{tx({ fr: 'Ajouter au panier', en: 'Add to cart', es: 'Agregar' })}</>
              )}
            </button>
          </div>
        )}

        <p className="text-grey-muted text-xs">
          {tx({
            fr: 'Soft proofing inclus - validation des couleurs avant impression.',
            en: 'Soft proofing included - color validation before printing.',
            es: 'Soft proofing incluido - validacion de colores antes de imprimir.',
          })}
        </p>
      </div>
    </div>
  );
}

export default ConfiguratorFineArt;
