import { useState, useMemo } from 'react';
import { ShoppingCart, Check, Sparkles, Info } from 'lucide-react';
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
import { lookupStickerPriceCustomQty } from '../../utils/pricingData';
import { formatPrice, money } from '../../utils/formatCurrency';

// Image par defaut quand le client n'a rien upload (logo Massive Medias)
const DEFAULT_STICKER_URL = '/images/graphism/massive_sticker.webp';

function ConfiguratorStickers({ onFinishChange }) {
  const { tx } = useLang();
  const { addToCart } = useCart();
  // PRIX-HARDCODE : on lit UNIQUEMENT les labels (finitions, formes, tailles) depuis le CMS.
  // Les prix et paliers sont STRICTEMENT hardcodes dans data/products.js pour que le
  // frontend soit totalement decouple du backend/CMS sur la grille tarifaire.
  const cmsProduct = useProduct('stickers');
  const pd = cmsProduct?.pricingData;

  const stickerFinishes = pd?.finishes || defaultFinishes;
  const stickerShapes = pd?.shapes || defaultShapes;
  const stickerSizes = pd?.sizes || defaultSizes;

  const [finish, setFinish] = useState('matte');
  const [shape, setShape] = useState('diecut');
  const [size, setSize] = useState('2.5in');
  const [qtyIndex, setQtyIndex] = useState(0);
  // CUSTOM-QTY (5 mai 2026) : input libre du client. Quand non vide et valide
  // (>= 25), il PRIME sur qtyIndex et le prix est calcule par interpolation
  // lineaire entre les paliers via lookupStickerPriceCustomQty.
  // Format : string pour permettre la saisie progressive ('1' -> '15' -> '150').
  // Vide ('') = mode palier classique (les boutons gerent qtyIndex).
  const [customQty, setCustomQty] = useState('');
  const [added, setAdded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [notes, setNotes] = useState('');
  const [strokeColor, setStrokeColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null); // preview derive des fichiers upload
  const [thumbUrl, setThumbUrl] = useState(null); // thumb PNG genere par le canvas

  // PRIX-HARDCODE : on IGNORE pd?.tiers. La grille officielle vit uniquement dans
  // data/products.js. Aucun override CMS/API possible depuis avril 2026.
  // FIX-PRICING-TIERS (27 avril 2026) : on PASSE maintenant `size` a getStickerPrice
  // pour que le prix reflete le palier de taille (Standard/Medium/Large). React
  // re-render automatiquement quand `size` change dans le state -> prix dynamique.
  const getStickerPrice = defaultGetPrice;
  const tiers = defaultTiers;
  const currentTier = tiers[qtyIndex] || tiers[0];

  // CUSTOM-QTY-RESOLVE : si customQty saisie >= 25, on remplace priceInfo par
  // l'interpolation. Sinon mode palier classique. useMemo evite recalcul a
  // chaque keystroke pour les autres deps.
  const customPriceInfo = useMemo(() => {
    if (!customQty || String(customQty).trim() === '') return null;
    return lookupStickerPriceCustomQty(finish, customQty, size);
  }, [customQty, finish, size]);
  const priceInfo = customPriceInfo || getStickerPrice(finish, shape, currentTier.qty, size);

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

  // Sync du preview avec les fichiers upload
  const handleFilesChange = (files) => {
    setUploadedFiles(files);
    const firstImage = files.find(f => (f.type || '').startsWith('image/') || /\.(png|jpe?g|webp|svg)$/i.test(f.name || ''));
    setLocalPreviewUrl(firstImage?.url || null);
  };

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    addToCart({
      productId: 'sticker-custom',
      productName: tx({ fr: 'Sticker Custom', en: 'Custom Sticker', es: 'Sticker Personalizado' }),
      finish: tx({ fr: finishLabel?.labelFr, en: finishLabel?.labelEn, es: finishLabel?.labelEn }),
      shape: tx({ fr: shapeLabel?.labelFr, en: shapeLabel?.labelEn, es: shapeLabel?.labelEn }),
      size: sizeLabel, // affichage label (ex: '3"')
      sizeId: size,    // id stable pour le recalcul (ex: '3in')
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

  return (
    <>
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
                {sizeLabel} · {tx({ fr: 'Die-cut', en: 'Die-cut', es: 'Die-cut' })}
              </span>
            </div>

            {/* Controles stroke (contour) */}
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
        <div className="flex-1 min-w-0 space-y-4 md:space-y-5">
          {/* Votre design + Finition (cote a cote) */}
          {/* FIX-UI (5 mai 2026) : on retire le label "Votre design (haute def)"
              ET le preview image upload parce que le preview cote gauche
              affiche deja exactement le meme visuel. Le user voit juste le
              nom du fichier (FileUpload en mode compact + hidePreview).
              Strict DRY : 2 previews du meme image en parallele = bruit. */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-3 md:gap-4 items-start">
            <FileUpload
              files={uploadedFiles}
              onFilesChange={handleFilesChange}
              compact
              hidePreview
            />
            <div>
              <label className="block text-heading font-semibold text-sm uppercase tracking-wider mb-2">
                {tx({ fr: 'Finition', en: 'Finish', es: 'Acabado' })}
              </label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5">
                {stickerFinishes.map(f => (
                  <button
                    key={f.id}
                    onClick={() => { setFinish(f.id); onFinishChange?.(f.id); }}
                    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-xs font-medium transition-all border-2 ${finish === f.id
                      ? 'border-accent option-selected'
                      : 'border-transparent hover:border-grey-muted/30 option-default'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full mb-1 border ${
                      f.id === 'matte' ? 'bg-gradient-to-br from-gray-300 to-gray-400 border-gray-500' :
                      f.id === 'glossy' ? 'bg-white border-gray-300 shadow-sm' :
                      f.id === 'holographic' ? 'bg-gradient-to-br from-pink-300 via-purple-300 to-cyan-300 border-transparent' :
                      f.id === 'broken-glass' ? 'bg-gradient-to-br from-cyan-200 via-white to-cyan-400 border-cyan-300' :
                      f.id === 'stars' ? 'bg-gradient-to-br from-yellow-200 via-amber-300 to-yellow-400 border-yellow-300' :
                      f.id === 'dots' ? 'bg-gradient-to-br from-orange-200 via-rose-300 to-pink-400 border-rose-300' :
                      'bg-white/80 border-gray-300'
                    }`} />
                    <span className="text-heading leading-tight text-center font-semibold text-[11px]">
                      {tx({ fr: f.labelFr.replace('Vinyle ', ''), en: f.labelEn.replace(' Vinyl', ''), es: f.labelEn.replace(' Vinyl', '') })}
                    </span>
                  </button>
                ))}
              </div>
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
            {/* FIX-PRICING-TIERS (27 avril 2026) : helper qui explique les 3
                paliers de prix selon la taille. Avant : tous formats au meme
                prix (devenu FAUX avec la refonte). Maintenant : 3 paliers
                (Standard <=2.5", Medium <=3.5", Large <=5") avec une grille
                de prix par palier. Le helper indique le palier actuel actif. */}
            <p className="mt-2 flex items-start gap-1.5 text-[11px] text-grey-muted leading-relaxed">
              <Info size={11} className="text-accent flex-shrink-0 mt-0.5" />
              <span>
                {priceInfo?.tier === 'large' ? (
                  tx({
                    fr: 'Palier Large (jusqu\'a 5"). Prix calcule selon la dimension la plus large de ton design.',
                    en: 'Large tier (up to 5"). Price based on the longest dimension of your design.',
                    es: 'Nivel Large (hasta 5"). Precio según la dimensión más larga de tu diseño.',
                  })
                ) : priceInfo?.tier === 'medium' ? (
                  tx({
                    fr: 'Palier Medium (jusqu\'a 3.5"). Prix calcule selon la dimension la plus large de ton design.',
                    en: 'Medium tier (up to 3.5"). Price based on the longest dimension of your design.',
                    es: 'Nivel Medium (hasta 3.5"). Precio según la dimensión más larga de tu diseño.',
                  })
                ) : (
                  tx({
                    fr: 'Palier Standard (jusqu\'a 2.5"). Prix calcule selon la dimension la plus large de ton design.',
                    en: 'Standard tier (up to 2.5"). Price based on the longest dimension of your design.',
                    es: 'Nivel Standard (hasta 2.5"). Precio según la dimensión más larga de tu diseño.',
                  })
                )}
              </span>
            </p>
          </div>

          {/* Quantite - grille 5 paliers + input custom */}
          <div>
            <label className="block text-heading font-semibold text-sm uppercase tracking-wider mb-2.5">
              {tx({ fr: 'Quantité', en: 'Quantity', es: 'Cantidad' })}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {tiers.map((tier, i) => {
                const p = getStickerPrice(finish, shape, tier.qty, size);
                // Bouton actif si on est en mode palier (pas de customQty) ET qtyIndex matche
                const isActive = !customPriceInfo && qtyIndex === i;
                return (
                  <button
                    key={tier.qty}
                    onClick={() => {
                      setQtyIndex(i);
                      // Sortir du mode custom quand on clique un palier preset
                      setCustomQty('');
                    }}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg transition-all border-2 ${isActive
                      ? 'border-accent option-selected'
                      : 'border-transparent hover:border-grey-muted/30 option-default'
                    }`}
                  >
                    <span className="text-heading font-bold text-sm">{tier.qty}</span>
                    <span className="text-grey-muted mt-0.5 text-sm">{p ? `${money(p.unitPrice)}$/u` : ''}</span>
                  </button>
                );
              })}
            </div>

            {/* CUSTOM-QTY-INPUT (5 mai 2026) : input numerique pour quantite
                exacte. Le prix unitaire est calcule par interpolation lineaire
                entre paliers (lookupStickerPriceCustomQty). Mise a jour temps
                reel a chaque keystroke (controlled input -> useMemo). */}
            <div className="mt-3 p-3 rounded-lg bg-glass border border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                {/* FIX-LISIBILITE (5 mai 2026) : label en text-sm font-bold pour
                    lisibilite + placeholder/heading plus contraste, helper
                    text bumpe a text-xs (12px) au lieu de text-[10px]. */}
                <label className="text-heading text-sm font-bold uppercase tracking-wider sm:flex-shrink-0">
                  {tx({ fr: 'Quantité personnalisée', en: 'Custom quantity', es: 'Cantidad personalizada' })}
                </label>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="number"
                    min="25"
                    step="1"
                    inputMode="numeric"
                    value={customQty}
                    onChange={(e) => {
                      // Strip non-numeric pour eviter les saisies louches type "1e10"
                      const cleaned = e.target.value.replace(/[^0-9]/g, '');
                      setCustomQty(cleaned);
                    }}
                    placeholder={tx({ fr: 'Ex: 150', en: 'Ex: 150', es: 'Ej: 150' })}
                    className="flex-1 sm:max-w-[120px] rounded-lg border-2 border-grey-muted/20 bg-transparent px-3 py-2 text-sm text-heading placeholder:text-grey-muted/80 focus:border-accent focus:outline-none transition-colors"
                  />
                  {customQty && customPriceInfo && (
                    <span className="text-accent text-sm font-semibold whitespace-nowrap">
                      {money(customPriceInfo.unitPrice)}$/u
                    </span>
                  )}
                  {customQty && !customPriceInfo && (
                    <span className="text-yellow-400 text-xs">
                      {tx({ fr: 'Min. 25', en: 'Min. 25', es: 'Mín. 25' })}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-grey-muted mt-2 leading-relaxed">
                {tx({
                  fr: 'Tarif calculé entre les paliers ci-dessus (interpolation linéaire).',
                  en: 'Price calculated between the tiers above (linear interpolation).',
                  es: 'Precio calculado entre los niveles arriba (interpolación lineal).',
                })}
              </p>
            </div>
          </div>

          {/* Notes + Prix cote a cote */}
          <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-3 md:gap-4 items-start">
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
            {priceInfo && (
              <div className="p-4 rounded-xl highlight-bordered">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl md:text-3xl font-heading font-bold text-heading">{formatPrice(priceInfo.price)}</span>
                  <span className="text-grey-muted text-xs">
                    ({money(priceInfo.unitPrice)}$/u × {priceInfo.qty})
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {(finish === 'holographic' || finish === 'broken-glass' || finish === 'stars' || finish === 'dots') && (
                    <span className="text-accent text-xs font-medium">
                      {tx({ fr: 'Effets Speciaux', en: 'Special Effects', es: 'Efectos Especiales' })}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                    <Sparkles size={12} />
                    {tx({ fr: 'Proof avant impression', en: 'Digital proof included', es: 'Prueba antes de imprimir' })}
                  </span>
                </div>
                {/* PREMIUM-VALUE-PROP (29 avril 2026) : justification du
                    positionnement tarifaire haut de gamme. Typographie
                    discrete (text-[11px] grey-muted/80) + separateur
                    subtil pour rester aere avec le thème sombre. */}
                <p className="mt-3 pt-2.5 border-t border-white/5 text-[11px] text-grey-muted/80 leading-relaxed">
                  {tx({
                    fr: 'Inclus : Vérification manuelle des fichiers, épreuve numérique et contrôle qualité studio.',
                    en: 'Included: Manual file check, digital proof and studio quality control.',
                    es: 'Incluido: Verificación manual de archivos, prueba digital y control de calidad del estudio.',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

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
