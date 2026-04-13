import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Check, Frame, Upload, ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useLang } from '../../i18n/LanguageContext';
import { useProduct } from '../../hooks/useProducts';
import FileUpload from '../FileUpload';
import PrintPreviewCarousel from '../PrintPreviewCarousel';
import {
  fineArtPrinterTiers as defaultTiers, fineArtFormats as defaultFormats, fineArtFramePrice as defaultFramePrice,
  fineArtFramePriceByFormat, getFineArtPrice as defaultGetPrice, fineArtImages,
} from '../../data/products';

function FramePreview({ image, withFrame, frameColor, format, formats, tx, isLandscape, onClickImage }) {
  const fmt = formats.find(f => f.id === format);
  const fmtW = fmt?.w || 8.5;
  const fmtH = fmt?.h || 11;

  const isPostcard = format === 'postcard';
  const useLandscape = image ? isLandscape : false;
  const w = useLandscape ? Math.max(fmtW, fmtH) : Math.min(fmtW, fmtH);
  const h = useLandscape ? Math.min(fmtW, fmtH) : Math.max(fmtW, fmtH);

  const frameW = isPostcard && withFrame ? (useLandscape ? 7 : 5) : w;
  const frameH = isPostcard && withFrame ? (useLandscape ? 5 : 7) : h;

  const maxDim = Math.max(fmtW, fmtH);
  const scaleFactor = 320 / 24;
  const previewMaxW = Math.max(180, Math.round(maxDim * scaleFactor));

  const frameThickness = withFrame ? (isPostcard ? Math.max(6, Math.round(previewMaxW * 0.035)) : Math.max(8, Math.round(previewMaxW * 0.04))) : 0;
  const matThickness = withFrame ? (isPostcard ? Math.max(16, Math.round(previewMaxW * 0.1)) : Math.max(12, Math.round(previewMaxW * 0.06))) : 0;

  return (
    <div className="flex items-center justify-center p-2">
      <div
        className={`relative transition-all duration-500 ease-out ${image && onClickImage ? 'cursor-zoom-in' : ''}`}
        onClick={image && onClickImage ? onClickImage : undefined}
        style={{
          aspectRatio: withFrame ? `${frameW}/${frameH}` : `${w}/${h}`,
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

  const businessCardTier = defaultTiers.find(t => t.id === 'business-card');
  const baseTiers = pd?.tiers || defaultTiers;
  const fineArtPrinterTiers = baseTiers.some(t => t.id === 'business-card') ? baseTiers : [...baseTiers, businessCardTier].filter(Boolean);
  const fineArtFormats = pd?.formats || defaultFormats;
  const fineArtFramePrice = pd?.framePrice ?? defaultFramePrice;

  const [tier, setTier] = useState('studio');
  const [format, setFormat] = useState('a4');
  const [withFrame, setWithFrame] = useState(false);
  const [frameColor, setFrameColor] = useState('black');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [notes, setNotes] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Business card state
  const [cardFinish, setCardFinish] = useState('standard');
  const [cardQtyIndex, setCardQtyIndex] = useState(0);
  const [cardSize, setCardSize] = useState('standard');

  const isBusinessCard = tier === 'business-card';

  const getFineArtPrice = pd?.formats
    ? (t, f, frame) => {
        const fmt = fineArtFormats.find(x => x.id === f);
        if (!fmt) return null;
        const base = t === 'museum' ? fmt.museumPrice : fmt.studioPrice;
        const fp = frame ? (fineArtFramePriceByFormat[f] || fineArtFramePrice) : 0;
        return { price: base + fp, basePrice: base, framePrice: fp };
      }
    : defaultGetPrice;

  const priceInfo = isBusinessCard
    ? getBusinessCardPrice(cardFinish, cardQtyIndex)
    : getFineArtPrice(tier, format, withFrame);

  const tierLabel = fineArtPrinterTiers.find(t => t.id === tier);
  const formatLabel = fineArtFormats.find(f => f.id === format);

  // Images uploadees (filtrer que les images)
  const imageFiles = useMemo(() => uploadedFiles.filter(f => f.mime?.startsWith('image/')), [uploadedFiles]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    if (activeImageIdx >= imageFiles.length) setActiveImageIdx(Math.max(0, imageFiles.length - 1));
  }, [imageFiles.length]);

  const previewImage = imageFiles[activeImageIdx]?.url || null;

  useEffect(() => {
    if (!previewImage) { setIsLandscape(false); return; }
    const img = new Image();
    img.onload = () => setIsLandscape(img.naturalWidth > img.naturalHeight);
    img.src = previewImage;
  }, [previewImage]);

  const canAddToCart = uploadedFiles.length > 0 || notes.trim().length > 0;

  const handleAddToCart = () => {
    if (!priceInfo || !canAddToCart) return;

    if (isBusinessCard) {
      const finishObj = businessCardFinishes.find(f => f.id === cardFinish);
      const sizeObj = businessCardSizes.find(s => s.id === cardSize);
      addToCart({
        productId: `business-card-${cardFinish}`,
        productName: tx({ fr: 'Cartes d\'affaires', en: 'Business Cards', es: 'Tarjetas de presentacion' }),
        finish: tx({ fr: finishObj?.labelFr, en: finishObj?.labelEn, es: finishObj?.labelEs }),
        shape: null,
        size: sizeObj?.label || '3.5 x 2"',
        quantity: priceInfo.qty,
        unitPrice: priceInfo.unitPrice,
        totalPrice: priceInfo.price,
        image: fineArtImages[0],
        uploadedFiles,
        notes,
      });
    } else {
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
        quantity,
        unitPrice: priceInfo.price,
        totalPrice: priceInfo.price * quantity,
        image: fineArtImages[0],
        uploadedFiles,
        notes,
      });
    }

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const cardTiers = businessCardPriceTiers[cardFinish] || [];

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-5">
      {/* ========== COLONNE GAUCHE : Preview + Upload ========== */}
      <div className="md:w-[35%] lg:w-[30%] flex-shrink-0">
        <div className="md:sticky md:top-28 space-y-3">
          <FileUpload
            files={uploadedFiles}
            onFilesChange={setUploadedFiles}
            label={tx({ fr: 'Votre fichier', en: 'Your file', es: 'Tu archivo' })}
            compact
            hidePreview
          />
          {!isBusinessCard && (
            <PrintPreviewCarousel
              image={previewImage}
              withFrame={withFrame}
              frameColor={frameColor}
              format={format}
              formats={fineArtFormats}
              tx={tx}
              isLandscape={isLandscape}
              onClickImage={() => previewImage && setLightboxOpen(true)}
            />
          )}
          {isBusinessCard && previewImage && (
            <div className="flex items-center justify-center p-4">
              <div className="rounded-lg overflow-hidden shadow-lg" style={{ aspectRatio: '3.5/2', maxWidth: '280px', width: '100%' }}>
                <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========== COLONNE DROITE : Selecteurs ========== */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Cadre - checkbox + couleurs (seulement pour prints) */}
        {!isBusinessCard && (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={withFrame} onChange={(e) => setWithFrame(e.target.checked)} className="sr-only" />
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${withFrame ? 'bg-accent border-accent' : 'border-grey-muted/50'}`}>
                {withFrame && <Check size={10} className="text-white" />}
              </div>
              <span className="text-heading text-sm">{tx({ fr: 'Cadre', en: 'Frame', es: 'Marco' })}</span>
              <span className="text-accent text-xs font-semibold">+{fineArtFramePriceByFormat[format] || fineArtFramePrice}$</span>
            </label>
            {withFrame && (
              <div className="flex gap-1.5">
                <button onClick={() => setFrameColor('black')}
                  className={`w-6 h-6 rounded-full bg-black border-2 transition-all ${frameColor === 'black' ? 'border-accent scale-110' : 'border-grey-muted/30'}`} />
                <button onClick={() => setFrameColor('white')}
                  className={`w-6 h-6 rounded-full bg-white border-2 transition-all ${frameColor === 'white' ? 'border-accent scale-110' : 'border-grey-muted/30'}`} />
              </div>
            )}
          </div>
        )}

        {/* Qualite / Type */}
        <div>
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
            {tx({ fr: 'Type', en: 'Type', es: 'Tipo' })}
          </label>
          <div className="flex gap-2">
            {fineArtPrinterTiers.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setTier(t.id);
                  if (t.id !== 'business-card') {
                    const curFmt = fineArtFormats.find(f => f.id === format);
                    const price = t.id === 'museum' ? curFmt?.museumPrice : curFmt?.studioPrice;
                    if (price == null) setFormat('a4');
                  }
                }}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all border-2 ${tier === t.id
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-transparent bg-white/5 text-grey-muted hover:bg-white/8 hover:text-heading'
                }`}
              >
                {tx({ fr: t.labelFr, en: t.labelEn, es: t.labelEs || t.labelEn })}
                <span className="block text-[10px] font-normal mt-0.5 opacity-60">
                  {tx({ fr: t.descFr, en: t.descEn, es: t.descEs || t.descEn })}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ===== MODE PRINT: Format + Quantity ===== */}
        {!isBusinessCard && (
          <>
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
                      <span className={`text-xs font-bold leading-tight ${format === f.id ? 'text-accent' : 'text-heading'}`}>
                        {f.label}
                      </span>
                      {f.typeName && (
                        <span className={`text-[9px] ${format === f.id ? 'text-accent/60' : 'text-grey-muted/50'}`}>
                          {f.typeName}
                        </span>
                      )}
                      <span className={`text-xs ${format === f.id ? 'text-accent' : 'text-grey-muted'}`}>
                        {isAvailable ? `${price}$` : 'N/A'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ===== MODE BUSINESS CARD: Finition + Format + Quantite ===== */}
        {isBusinessCard && (
          <>
            {/* Finition */}
            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
                {tx({ fr: 'Finition', en: 'Finish', es: 'Acabado' })}
              </label>
              <div className="flex gap-2">
                {businessCardFinishes.map(f => (
                  <button
                    key={f.id}
                    onClick={() => { setCardFinish(f.id); setCardQtyIndex(0); }}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all border-2 ${cardFinish === f.id
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-transparent bg-white/5 text-grey-muted hover:bg-white/8 hover:text-heading'
                    }`}
                  >
                    {tx({ fr: f.labelFr, en: f.labelEn, es: f.labelEs })}
                    <span className="block text-[10px] font-normal mt-0.5 opacity-60">
                      {tx({ fr: f.descFr, en: f.descEn, es: f.descEs })}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Format carte */}
            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
                Format
              </label>
              <div className="flex gap-2">
                {businessCardSizes.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setCardSize(s.id)}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all border-2 ${cardSize === s.id
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-transparent bg-white/5 text-grey-muted hover:bg-white/8 hover:text-heading'
                    }`}
                  >
                    {tx({ fr: s.labelFr, en: s.labelEn, es: s.labelEs })}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantite par paliers */}
            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
                {tx({ fr: 'Quantite', en: 'Quantity', es: 'Cantidad' })}
              </label>
              <div className="flex flex-wrap gap-2">
                {cardTiers.map((t, i) => {
                  const p = getBusinessCardPrice(cardFinish, i);
                  return (
                    <button
                      key={t.qty}
                      onClick={() => setCardQtyIndex(i)}
                      className={`flex flex-col items-center py-2.5 px-4 rounded-lg text-xs font-medium transition-all border-2 min-w-[5rem] ${cardQtyIndex === i
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-transparent bg-white/5 text-grey-muted hover:bg-white/8 hover:text-heading'
                      }`}
                    >
                      <span className="font-bold text-sm">{t.qty}</span>
                      <span className="mt-0.5">{p ? `${p.price}$` : ''}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Notes */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder={isBusinessCard
            ? tx({ fr: 'Informations pour vos cartes (nom, titre, coordonnees, style...)', en: 'Info for your cards (name, title, contact, style...)', es: 'Info para tus tarjetas (nombre, titulo, contacto, estilo...)' })
            : tx({ fr: 'Notes ou instructions (optionnel)', en: 'Notes or instructions (optional)', es: 'Notas o instrucciones (opcional)' })
          }
          className="w-full rounded-lg bg-white/5 px-3 py-2.5 text-sm text-heading placeholder:text-grey-muted/40 focus:bg-white/8 focus:outline-none transition-colors resize-none"
        />

        {/* Prix + bouton panier */}
        {priceInfo && (
          <div className="flex items-center justify-end gap-3">
            <div className="flex-shrink-0 text-right">
              {isBusinessCard ? (
                <>
                  <span className="text-xl font-heading font-bold text-heading">{priceInfo.price}$</span>
                  <span className="text-grey-muted text-xs ml-1">
                    ({priceInfo.unitPrice.toFixed(2)}$/{tx({ fr: 'unite', en: 'unit', es: 'unidad' })})
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xl font-heading font-bold text-heading">{priceInfo.price}$</span>
                  {withFrame && (
                    <span className="text-grey-muted text-xs ml-1">
                      ({priceInfo.basePrice}+{priceInfo.framePrice})
                    </span>
                  )}
                </>
              )}
            </div>
            {!isBusinessCard && (
              <div className="flex items-center gap-2">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg border border-white/10 text-heading font-bold text-sm flex items-center justify-center hover:border-accent/50">-</button>
                <span className="text-heading font-bold w-6 text-center">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="w-8 h-8 rounded-lg border border-white/10 text-heading font-bold text-sm flex items-center justify-center hover:border-accent/50">+</button>
              </div>
            )}
            <button onClick={handleAddToCart} disabled={!canAddToCart} className={`btn-primary justify-center text-sm py-2 px-5 ${!canAddToCart ? 'opacity-40 cursor-not-allowed' : ''}`}>
              {added ? (
                <><Check size={14} className="mr-1" />{tx({ fr: 'Ajoute!', en: 'Added!', es: 'Agregado!' })}</>
              ) : (
                <><ShoppingCart size={14} className="mr-1" />{tx({ fr: 'Ajouter au panier', en: 'Add to cart', es: 'Agregar' })}</>
              )}
            </button>
          </div>
        )}

        {/* Info sous le prix pour business cards */}
        {isBusinessCard && (
          <p className="text-grey-muted text-xs text-right">
            {tx({
              fr: 'Recto-verso inclus - Design graphique disponible en option',
              en: 'Double-sided included - Graphic design available as option',
              es: 'Doble cara incluida - Diseno grafico disponible como opcion',
            })}
          </p>
        )}

      </div>

      {/* Lightbox avec cadre/bordures (prints seulement) */}
      <AnimatePresence>
        {lightboxOpen && previewImage && !isBusinessCard && (() => {
          const fmt = fineArtFormats.find(f => f.id === format);
          const fW = fmt?.w || 8.5;
          const fH = fmt?.h || 11;
          const lbLandscape = isLandscape;
          const imgW = lbLandscape ? Math.max(fW, fH) : Math.min(fW, fH);
          const imgH = lbLandscape ? Math.min(fW, fH) : Math.max(fW, fH);
          const borderPx = withFrame ? 16 : 0;
          const matPx = withFrame ? 24 : 12;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center cursor-zoom-out"
              onClick={() => setLightboxOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative"
                style={{
                  aspectRatio: `${imgW}/${imgH}`,
                  maxWidth: '80vw',
                  maxHeight: '85vh',
                  width: lbLandscape ? '70vw' : '50vw',
                }}
                onClick={e => e.stopPropagation()}
              >
                <div
                  className="w-full h-full"
                  style={{
                    border: withFrame ? `${borderPx}px solid ${frameColor === 'white' ? '#e5e5e5' : '#1a1a1a'}` : 'none',
                    padding: `${matPx}px`,
                    background: '#ffffff',
                    boxShadow: '0 12px 60px rgba(0,0,0,0.5)',
                  }}
                >
                  <div className="relative w-full h-full watermark-light">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <p className="text-center text-white/60 text-sm mt-3">
                  {fmt?.label} · {tier === 'museum' ? tx({ fr: 'Musee', en: 'Museum', es: 'Museo' }) : 'Studio'}
                  {withFrame && ` · ${tx({ fr: 'Cadre', en: 'Frame', es: 'Marco' })} ${frameColor === 'white' ? tx({ fr: 'blanc', en: 'white', es: 'blanco' }) : tx({ fr: 'noir', en: 'black', es: 'negro' })}`}
                </p>
              </motion.div>
              <button
                onClick={() => setLightboxOpen(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl transition-colors"
              >
                &times;
              </button>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

export default ConfiguratorFineArt;
