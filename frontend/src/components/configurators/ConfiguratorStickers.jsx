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

  const [finish, setFinish] = useState('matte');
  const [shape, setShape] = useState('diecut');
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
        // matte, glossy = standard; holographic/broken-glass/stars/dots = special
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
      {/* Upload CTA en haut - premiere action du user */}
      <div className="mb-4 md:mb-6">
        <label
          className={`group flex items-center gap-3 md:gap-4 w-full px-4 md:px-5 py-3 md:py-4 rounded-xl cursor-pointer transition-all ${
            localPreviewUrl
              ? 'bg-white/[0.02] hover:bg-white/[0.04] shadow-md shadow-black/20 hover:shadow-lg hover:shadow-black/30'
              : 'bg-accent/10 hover:bg-accent/20 shadow-md shadow-accent/10 hover:shadow-lg hover:shadow-accent/20'
          }`}
        >
          <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center ${localPreviewUrl ? 'bg-accent/20 text-accent' : 'bg-accent text-white'}`}>
            {localPreviewUrl ? <ImageIcon size={20} /> : <Upload size={20} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-heading font-semibold text-sm md:text-base">
              {localPreviewUrl
                ? tx({ fr: 'Design charge ✓ - Essaie les finitions ci-dessous', en: 'Design loaded ✓ - Try the finishes below', es: 'Diseno cargado ✓ - Prueba los acabados' })
                : tx({ fr: 'Upload ton design', en: 'Upload your design', es: 'Sube tu diseno' })}
            </div>
            <div className="text-grey-muted text-sm mt-0.5">
              {localPreviewUrl
                ? tx({ fr: 'Clique pour changer d\'image', en: 'Click to change image', es: 'Haz clic para cambiar' })
                : tx({ fr: 'PNG, JPG, WebP, SVG - le preview se met a jour en direct', en: 'PNG, JPG, WebP, SVG - preview updates live', es: 'PNG, JPG, WebP, SVG - vista previa en vivo' })}
            </div>
          </div>
          {localPreviewUrl && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClearUpload(); }}
              className="flex-shrink-0 p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
              title={tx({ fr: 'Retirer', en: 'Remove', es: 'Quitar' })}
            >
              <X size={16} />
            </button>
          )}
          <input
            ref={localFileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleLocalFileSelect}
          />
        </label>
      </div>

      {/* Preview canvas + selectors */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Preview (canvas avec FX live) */}
        <div className="md:w-72 flex-shrink-0 md:self-start">
          <div className="rounded-xl p-3 md:p-4">
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
              <span className="block text-grey-muted text-sm mt-0.5">
                {sizeLabel} · {tx({ fr: shapeLabel?.labelFr, en: shapeLabel?.labelEn, es: shapeLabel?.labelEn })}
              </span>
              {!localPreviewUrl && (
                <span className="block text-grey-muted/70 text-sm mt-1.5 italic">
                  {tx({ fr: 'Aperçu avec logo Massive - upload ton design pour voir ton sticker', en: 'Preview with Massive logo - upload your design', es: 'Vista previa con logo Massive - sube tu diseno' })}
                </span>
              )}
            </div>

            {/* Controles stroke (contour) - visible surtout sur diecut mais dispo partout */}
            <div className="mt-3 p-2.5 rounded-lg bg-black/10 space-y-2">
              <label className="block text-sm uppercase tracking-wider text-grey-muted font-semibold">
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
                <span className="text-sm font-mono text-grey-muted w-6 text-right">{strokeWidth}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Selectors */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Finish selector - grille 3 (mobile) / 6 (desktop) egale */}
          <div>
            <label className="block text-heading font-semibold text-sm uppercase tracking-wider mb-2.5">
              {tx({ fr: 'Finition', en: 'Finish', es: 'Acabado' })}
            </label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {stickerFinishes.map(f => (
                <button
                  key={f.id}
                  onClick={() => { setFinish(f.id); onFinishChange?.(f.id); }}
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg text-sm font-medium transition-all border-2 ${finish === f.id
                    ? 'border-accent option-selected'
                    : 'border-transparent hover:border-grey-muted/30 option-default'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full mb-1.5 border ${
                    f.id === 'matte' ? 'bg-gradient-to-br from-gray-300 to-gray-400 border-gray-500' :
                    f.id === 'glossy' ? 'bg-white border-gray-300 shadow-sm' :
                    f.id === 'holographic' ? 'bg-gradient-to-br from-pink-300 via-purple-300 to-cyan-300 border-transparent' :
                    f.id === 'broken-glass' ? 'bg-gradient-to-br from-cyan-200 via-white to-cyan-400 border-cyan-300' :
                    f.id === 'stars' ? 'bg-gradient-to-br from-yellow-200 via-amber-300 to-yellow-400 border-yellow-300' :
                    f.id === 'dots' ? 'bg-gradient-to-br from-orange-200 via-rose-300 to-pink-400 border-rose-300' :
                    'bg-white/80 border-gray-300'
                  }`} />
                  <span className="text-heading leading-tight text-center font-semibold text-sm">
                    {tx({ fr: f.labelFr.replace('Vinyle ', ''), en: f.labelEn.replace(' Vinyl', ''), es: f.labelEn.replace(' Vinyl', '') })}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Forme - grille 4 egale */}
          <div>
            <label className="block text-heading font-semibold text-sm uppercase tracking-wider mb-2.5">
              {tx({ fr: 'Forme', en: 'Shape', es: 'Forma' })}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {stickerShapes.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleShapeChange(s.id)}
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg text-sm font-medium transition-all border-2 ${shape === s.id
                    ? 'border-accent option-selected'
                    : 'border-transparent hover:border-grey-muted/30 option-default'
                  }`}
                >
                  <span className={`mb-1.5 flex-shrink-0 ${
                    s.id === 'round' ? 'w-4 h-4 rounded-full border-2 border-current' :
                    s.id === 'square' ? 'w-4 h-4 rounded-sm border-2 border-current' :
                    s.id === 'rectangle' ? 'w-5 h-3.5 rounded-sm border-2 border-current' :
                    'w-5 h-4 border-2 border-current border-dashed rounded-lg'
                  } text-grey-muted`} />
                  <span className="text-heading leading-tight text-center font-semibold text-sm">
                    {tx({ fr: s.labelFr, en: s.labelEn, es: s.labelEn })}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Taille - grille 4 egale */}
          <div>
            <label className="block text-heading font-semibold text-sm uppercase tracking-wider mb-2.5">
              {tx({ fr: 'Taille', en: 'Size', es: 'Tamaño' })}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {stickerSizes.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSize(s.id)}
                  className={`py-3 px-2 rounded-lg text-sm font-semibold transition-all border-2 ${size === s.id
                    ? 'border-accent text-heading option-selected'
                    : 'border-transparent text-heading hover:border-grey-muted/30 option-default'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantite - grille 5 egale */}
          <div>
            <label className="block text-heading font-semibold text-sm uppercase tracking-wider mb-2.5">
              {tx({ fr: 'Quantité', en: 'Quantity', es: 'Cantidad' })}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {tiers.map((tier, i) => {
                const p = getStickerPrice(finish, shape, tier.qty);
                return (
                  <button
                    key={tier.qty}
                    onClick={() => setQtyIndex(i)}
                    className={`flex flex-col items-center justify-center py-3 px-1 rounded-lg transition-all border-2 ${qtyIndex === i
                      ? 'border-accent option-selected'
                      : 'border-transparent hover:border-grey-muted/30 option-default'
                    }`}
                  >
                    <span className="text-heading font-bold text-sm">{tier.qty}</span>
                    <span className="text-grey-muted mt-0.5 text-sm">{p ? `${p.unitPrice.toFixed(2)}$/u` : ''}</span>
                  </button>
                );
              })}
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
          <label className="block text-heading font-semibold text-sm uppercase tracking-wider mb-2">
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
            <span className="text-grey-muted text-sm md:text-sm">
              ({priceInfo.unitPrice.toFixed(2)}$/sticker)
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 md:mt-2">
            {(finish === 'holographic' || finish === 'broken-glass' || finish === 'stars' || finish === 'dots') && (
              <span className="text-accent text-sm font-medium">
                {tx({ fr: 'Effets Speciaux', en: 'Special Effects', es: 'Efectos Especiales' })}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
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
        <p className="text-yellow-400 text-sm text-center">
          {tx({ fr: 'Ajoutez votre design ou decrivez votre projet dans les notes', en: 'Upload your design or describe your project in the notes', es: 'Suba su diseno o describa su proyecto en las notas' })}
        </p>
      )}

      <Link to="/panier" className="btn-outline w-full justify-center text-sm py-2 md:py-2.5">
        {tx({ fr: 'Voir le panier', en: 'View cart', es: 'Ver el carrito' })}
      </Link>

      <p className="text-grey-muted text-sm mt-2 md:mt-3 text-center">
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
