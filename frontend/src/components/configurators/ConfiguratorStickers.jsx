import { useState, useMemo, useRef } from 'react';
import { ShoppingCart, Check, Sparkles, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useLang } from '../../i18n/LanguageContext';
import { useProduct } from '../../hooks/useProducts';
import FileUpload from '../FileUpload';
import StickerPreviewCanvas from '../StickerPreviewCanvas';
import {
  stickerFinishes as defaultFinishes, stickerShapes as defaultShapes, stickerSizes as defaultSizes,
  stickerPriceTiers as defaultTiers, getStickerPrice as defaultGetPrice, stickerImages,
} from '../../data/products';

// Image par defaut quand le client n'a rien upload (logo Massive Medias)
const DEFAULT_STICKER_URL = '/images/graphism/massive_sticker.webp';

function ConfiguratorStickers({ onFinishChange }) {
  const { tx } = useLang();
  const { addToCart } = useCart();
  const cmsProduct = useProduct('stickers');
  const pd = cmsProduct?.pricingData;

  const stickerFinishes = pd?.finishes || defaultFinishes;
  const stickerShapes = pd?.shapes || defaultShapes;
  const stickerSizes = pd?.sizes || defaultSizes;

  const [finish, setFinish] = useState('clear');
  const [shape, setShape] = useState('round');
  const [size, setSize] = useState('2.5in');
  const [qtyIndex, setQtyIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [notes, setNotes] = useState('');
  const [strokeColor, setStrokeColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null); // preview local avant upload complet
  const [thumbUrl, setThumbUrl] = useState(null); // thumb PNG genere par le canvas
  const localFileRef = useRef(null);

  const getStickerPrice = pd?.tiers
    ? (f, s, qty) => {
        const isSpecial = f === 'holographic' || f === 'broken-glass' || f === 'stars' || f === 'dots';
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

  // Image source du preview:
  // 1. Si le client a upload un fichier (localPreviewUrl), on l'utilise
  // 2. Sinon, sticker Massive Medias par defaut
  const previewSource = useMemo(() => {
    return localPreviewUrl || DEFAULT_STICKER_URL;
  }, [localPreviewUrl]);

  const canAddToCart = uploadedFiles.length > 0 || notes.trim().length > 0;

  // Capture le fichier local pour preview instantane (avant meme l'upload serveur)
  const handleLocalFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return; // seules les images pour le preview
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    const url = URL.createObjectURL(file);
    setLocalPreviewUrl(url);
  };

  // Quand l'upload serveur des fichiers finit, on synchronise le preview local
  // avec la premiere image upload (au cas ou le client draggait dans FileUpload directement)
  const handleFilesChange = (files) => {
    setUploadedFiles(files);
    // Si aucun preview local + on a un fichier image upload, on l'utilise comme preview
    if (!localPreviewUrl && files.length > 0) {
      const firstImage = files.find(f => (f.type || '').startsWith('image/') || /\.(png|jpe?g|webp|svg)$/i.test(f.name || ''));
      if (firstImage?.url) {
        setLocalPreviewUrl(firstImage.url);
      }
    }
  };

  const handleClearUpload = () => {
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setLocalPreviewUrl(null);
    setUploadedFiles([]);
    if (localFileRef.current) localFileRef.current.value = '';
  };

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    addToCart({
      productId: 'sticker-custom',
      productName: tx({ fr: 'Sticker Custom', en: 'Custom Sticker', es: 'Sticker Personalizado' }),
      finish: tx({ fr: finishLabel?.labelFr, en: finishLabel?.labelEn, es: finishLabel?.labelEn }),
      shape: tx({ fr: shapeLabel?.labelFr, en: shapeLabel?.labelEn, es: shapeLabel?.labelEn }),
      size: sizeLabel,
      quantity: priceInfo.qty,
      unitPrice: priceInfo.unitPrice,
      totalPrice: priceInfo.price,
      // image = thumb PNG genere avec FX. Fallback sur une image statique si le canvas n'a pas encore produit.
      image: thumbUrl || stickerImages[0],
      uploadedFiles,
      notes,
      fxPreview: {
        finish,
        shape,
        size,
        strokeColor,
        strokeWidth,
        hasCustomDesign: !!localPreviewUrl,
      },
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
      {/* Preview canvas + selectors */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Preview (canvas avec FX live) */}
        <div className="md:w-72 flex-shrink-0 md:self-start">
          <div className="rounded-xl card-bg-bordered p-3 md:p-4">
            <StickerPreviewCanvas
              imageUrl={previewSource}
              shape={shape}
              finish={finish}
              strokeColor={strokeColor}
              strokeWidth={strokeWidth}
              onThumbChange={setThumbUrl}
              className="w-full"
            />
            <div className="mt-3 text-center">
              <span className="text-heading text-sm font-semibold">
                {tx({ fr: finishLabel?.labelFr, en: finishLabel?.labelEn, es: finishLabel?.labelEn })}
              </span>
              <span className="block text-grey-muted text-xs mt-0.5">
                {sizeLabel} · {tx({ fr: shapeLabel?.labelFr, en: shapeLabel?.labelEn, es: shapeLabel?.labelEn })}
              </span>
              {!localPreviewUrl && (
                <span className="block text-grey-muted/70 text-[10px] mt-1.5 italic">
                  {tx({ fr: 'Aperçu avec logo Massive - upload ton design pour voir ton sticker', en: 'Preview with Massive logo - upload your design', es: 'Vista previa con logo Massive - sube tu diseño' })}
                </span>
              )}
            </div>

            {/* Quick upload pour preview instantane (separate du FileUpload en bas qui lui push vers Drive) */}
            <div className="mt-3 flex items-center gap-2">
              <label className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent text-xs font-semibold cursor-pointer transition-colors border border-accent/30">
                <Upload size={14} />
                <span>{tx({ fr: 'Tester ton design', en: 'Try your design', es: 'Probar tu diseño' })}</span>
                <input
                  ref={localFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleLocalFileSelect}
                />
              </label>
              {localPreviewUrl && (
                <button
                  type="button"
                  onClick={handleClearUpload}
                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                  title={tx({ fr: 'Retirer', en: 'Remove', es: 'Quitar' })}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Controles stroke (contour) - visible surtout sur diecut mais dispo partout */}
            <div className="mt-3 p-2.5 rounded-lg bg-black/10 space-y-2">
              <label className="block text-[10px] uppercase tracking-wider text-grey-muted font-semibold">
                {tx({ fr: 'Contour (optionnel)', en: 'Outline (optional)', es: 'Contorno (opcional)' })}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border border-white/10"
                />
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                  className="flex-1 accent-accent"
                />
                <span className="text-[10px] font-mono text-grey-muted w-6 text-right">{strokeWidth}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Selectors */}
        <div className="flex-1 min-w-0 space-y-4 md:space-y-5">
          {/* Finish selector */}
          <div>
            <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
              {tx({ fr: 'Finition', en: 'Finish', es: 'Acabado' })}
            </label>
            <div className="grid grid-cols-3 md:flex md:flex-wrap gap-1.5 md:gap-1.5">
              {stickerFinishes.map(f => (
                <button
                  key={f.id}
                  onClick={() => { setFinish(f.id); onFinishChange?.(f.id); }}
                  className={`flex flex-col items-center justify-center py-2 px-1.5 md:py-2 md:px-2.5 rounded-lg text-xs font-medium transition-all border-2 ${finish === f.id
                    ? 'border-accent option-selected'
                    : 'border-transparent hover:border-grey-muted/30 option-default'
                  }`}
                >
                  <span className={`w-4 h-4 md:w-3.5 md:h-3.5 rounded-full mb-1.5 border ${
                    f.id === 'clear' ? 'bg-white/80 border-gray-300 shadow-inner' :
                    f.id === 'glossy' ? 'bg-white border-gray-300 shadow-sm' :
                    f.id === 'broken-glass' ? 'bg-gradient-to-br from-cyan-200 via-white to-cyan-400 border-cyan-300' :
                    f.id === 'stars' ? 'bg-gradient-to-br from-yellow-200 via-amber-300 to-yellow-400 border-yellow-300' :
                    f.id === 'dots' ? 'bg-gradient-to-br from-orange-200 via-rose-300 to-pink-400 border-rose-300' :
                    'bg-gradient-to-br from-pink-300 via-purple-300 to-cyan-300 border-transparent'
                  }`} />
                  <span className="text-heading leading-tight text-center font-semibold text-[10px] md:text-[11px]">
                    {tx({ fr: f.labelFr.replace('Vinyle ', ''), en: f.labelEn.replace(' Vinyl', ''), es: f.labelEn.replace(' Vinyl', '') })}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Forme + Taille + Quantite */}
          <div className="grid grid-cols-3 gap-3 md:grid-cols-1 md:gap-5">
            {/* Shape selector */}
            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1.5 md:mb-2.5">
                {tx({ fr: 'Forme', en: 'Shape', es: 'Forma' })}
              </label>
              <div className="flex flex-col md:flex-row md:flex-wrap gap-1.5 md:gap-2">
                {stickerShapes.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleShapeChange(s.id)}
                    className={`flex items-center md:flex-col justify-center gap-1.5 md:gap-0 md:min-w-[4.5rem] py-1.5 px-2 md:py-2.5 md:px-3 rounded-lg text-xs font-medium transition-all border-2 ${shape === s.id
                      ? 'border-accent option-selected'
                      : 'border-transparent hover:border-grey-muted/30 option-default'
                    }`}
                  >
                    <span className={`md:mb-1.5 flex-shrink-0 ${
                      s.id === 'round' ? 'w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border-2 border-current' :
                      s.id === 'square' ? 'w-3.5 h-3.5 md:w-4 md:h-4 rounded-sm border-2 border-current' :
                      s.id === 'rectangle' ? 'w-4 h-3 md:w-5 md:h-3.5 rounded-sm border-2 border-current' :
                      'w-4 h-3.5 md:w-5 md:h-4 border-2 border-current border-dashed rounded-lg'
                    } text-grey-muted`} />
                    <span className="text-heading leading-tight text-center font-semibold text-[11px] md:text-xs">
                      {tx({ fr: s.labelFr, en: s.labelEn, es: s.labelEn })}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size selector */}
            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1.5 md:mb-2.5">
                {tx({ fr: 'Taille', en: 'Size', es: 'Tamaño' })}
              </label>
              <div className="flex flex-col md:flex-row md:flex-wrap gap-1.5 md:gap-2">
                {stickerSizes.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSize(s.id)}
                    className={`py-1.5 px-2 md:px-4 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all border-2 ${size === s.id
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
            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1.5 md:mb-2.5">
                {tx({ fr: 'Quantité', en: 'Quantity', es: 'Cantidad' })}
              </label>
              <div className="flex flex-col md:flex-row md:flex-wrap gap-1.5 md:gap-2">
                {tiers.map((tier, i) => {
                  const p = getStickerPrice(finish, shape, tier.qty);
                  return (
                    <button
                      key={tier.qty}
                      onClick={() => setQtyIndex(i)}
                      className={`flex items-center md:flex-col justify-between md:justify-center py-1.5 px-2 md:py-2.5 md:px-4 rounded-lg text-xs font-medium transition-all border-2 md:min-w-[5rem] ${qtyIndex === i
                        ? 'border-accent option-selected'
                        : 'border-transparent hover:border-grey-muted/30 option-default'
                      }`}
                    >
                      <span className="text-heading font-bold text-xs md:text-sm">{tier.qty}</span>
                      <span className="text-grey-muted md:mt-0.5 text-[11px]">{p ? `${p.unitPrice.toFixed(2)}$/u` : ''}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload fichier complet (workflow normal Google Drive) + Notes */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-3 md:gap-4 mb-4 md:mb-5">
        <FileUpload
          files={uploadedFiles}
          onFilesChange={handleFilesChange}
          label={tx({ fr: 'Votre design (haute def)', en: 'Your design (high res)', es: 'Tu diseño (alta res)' })}
          compact
        />
        <div>
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
            {tx({ fr: 'Notes / Description', en: 'Notes / Description', es: 'Notas / Descripción' })}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={tx({ fr: 'Décrivez le produit souhaité (couleurs, style, details...)', en: 'Describe the desired product (colors, style, details...)', es: 'Describe el producto deseado (colores, estilo, detalles...)' })}
            className="w-full min-h-[80px] md:min-h-[100px] rounded-lg border-2 border-grey-muted/20 bg-transparent px-3 py-2.5 md:px-4 md:py-3 text-sm text-heading placeholder:text-grey-muted/50 focus:border-accent focus:outline-none transition-colors resize-none"
          />
        </div>
      </div>

      {/* Price display */}
      {priceInfo && (
        <div className="p-4 md:p-5 rounded-xl mb-4 md:mb-5 highlight-bordered">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl md:text-3xl font-heading font-bold text-heading">{priceInfo.price}$</span>
            <span className="text-grey-muted text-xs md:text-sm">
              ({priceInfo.unitPrice.toFixed(2)}$/sticker)
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 md:mt-2">
            {(finish === 'holographic' || finish === 'broken-glass' || finish === 'stars' || finish === 'dots') && (
              <span className="text-accent text-xs font-medium">
                {tx({ fr: 'Effets Speciaux', en: 'Special Effects', es: 'Efectos Especiales' })}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
              <Sparkles size={12} />
              {tx({ fr: 'Design inclus', en: 'Design included', es: 'Diseño incluido' })}
            </span>
          </div>
        </div>
      )}

      {/* Add to cart */}
      <button onClick={handleAddToCart} disabled={!canAddToCart} className={`btn-primary w-full justify-center text-sm md:text-base py-3 md:py-3.5 mb-2 md:mb-3 ${!canAddToCart ? 'opacity-40 cursor-not-allowed' : ''}`}>
        {added ? (
          <><Check size={18} className="mr-2" />{tx({ fr: 'Ajoute!', en: 'Added!', es: 'Agregado!' })}</>
        ) : (
          <><ShoppingCart size={18} className="mr-2" />{tx({ fr: 'Ajouter au panier', en: 'Add to cart', es: 'Agregar al carrito' })}</>
        )}
      </button>
      {!canAddToCart && (
        <p className="text-yellow-400 text-xs text-center">
          {tx({ fr: 'Ajoutez votre design ou decrivez votre projet dans les notes', en: 'Upload your design or describe your project in the notes', es: 'Suba su diseno o describa su proyecto en las notas' })}
        </p>
      )}

      <Link to="/panier" className="btn-outline w-full justify-center text-sm py-2 md:py-2.5">
        {tx({ fr: 'Voir le panier', en: 'View cart', es: 'Ver el carrito' })}
      </Link>

      <p className="text-grey-muted text-xs mt-2 md:mt-3 text-center">
        {tx({
          fr: 'Massive vous contactera pour valider le rendu par photo ou video avant l\'envoi du produit.',
          en: 'Massive will contact you to validate the result by photo or video before shipping.',
          es: 'Massive te contactara para validar el resultado por foto o video antes del envio.',
        })}
      </p>
    </>
  );
}

export default ConfiguratorStickers;
