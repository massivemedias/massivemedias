import { useState, useMemo, useEffect, useRef } from 'react';
import { ShoppingCart, Check, Sparkles, Info, Scissors, Loader2, ChevronDown } from 'lucide-react';
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
import { removeBackground } from '../../utils/removeBg';

// Image par defaut affichee au montage du composant, avant tout upload.
// Asset Massive Sticker PNG importe depuis l'atelier print du studio.
// PNG avec transparency preserve pour que le die-cut + stroke fonctionnent
// directement (pas besoin de remove-bg pour cette image precise).
const DEFAULT_STICKER_URL = '/images/stickers/massive-sticker-default.png';

// Classe Tailwind reutilisable pour tous les <select> natifs. Look custom :
// appearance-none + caret chevron Lucide overlay positionne en absolute via
// le wrapper. Padding right plus large pour ne pas chevaucher le chevron.
const SELECT_CLASS = 'w-full appearance-none bg-black/20 border-2 border-grey-muted/20 hover:border-grey-muted/40 focus:border-accent rounded-lg px-3 py-2.5 pr-9 text-sm text-heading transition-colors cursor-pointer focus:outline-none';

function SelectControl({ label, value, onChange, options, getOptionLabel }) {
  return (
    <div>
      <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={SELECT_CLASS}
        >
          {options.map((opt) => (
            <option key={opt.id} value={opt.id} className="bg-black text-white">
              {getOptionLabel(opt)}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-muted pointer-events-none"
        />
      </div>
    </div>
  );
}

function ConfiguratorStickers({ onFinishChange }) {
  const { tx } = useLang();
  const { addToCart } = useCart();
  // PRIX-HARDCODE : on lit UNIQUEMENT les labels (finitions, formes, tailles) depuis le CMS.
  // Les prix et paliers sont strictement hardcodes dans data/products.js.
  const cmsProduct = useProduct('stickers');
  const pd = cmsProduct?.pricingData;

  const stickerFinishes = pd?.finishes || defaultFinishes;
  const stickerShapes = pd?.shapes || defaultShapes;
  const stickerSizes = pd?.sizes || defaultSizes;

  const [finish, setFinish] = useState('matte');
  const [shape, setShape] = useState('diecut');
  const [size, setSize] = useState('2.5in');
  const [qtyIndex, setQtyIndex] = useState(0);
  const [customQty, setCustomQty] = useState('');
  // FIX-CUSTOM-QTY : mode "quantite personnalisee" pilote par un flag explicite,
  // PAS par la validite du prix. Avant, le mode custom dependait de
  // customPriceInfo (null sous 25), donc taper "60" passait par "6" (<25) ->
  // l'input disparaissait et retombait au palier 25. Le flag garde l'input
  // ouvert pendant la saisie ; le clamp au minimum se fait au blur.
  const [isCustom, setIsCustom] = useState(false);
  const [added, setAdded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [notes, setNotes] = useState('');
  const [strokeColor, setStrokeColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
  const [thumbUrl, setThumbUrl] = useState(null);

  // REMOVE-BG : detourage IA in-browser via @imgly/background-removal.
  const [activeRemoveBg, setActiveRemoveBg] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgRemovedUrl, setBgRemovedUrl] = useState(null);
  const [bgRemoveError, setBgRemoveError] = useState(null);
  const lastProcessedRef = useRef(null);

  // CLICKABLE-PREVIEW (12 mai 2026) : ref vers le composant FileUpload pour
  // declencher son file picker quand l'utilisateur clique sur la zone de
  // preview du sticker. Reutilise le meme flux d'upload Drive existant.
  const fileUploadRef = useRef(null);
  const openFilePicker = () => fileUploadRef.current?.openPicker?.();

  const getStickerPrice = defaultGetPrice;
  const tiers = defaultTiers;
  const currentTier = tiers[qtyIndex] || tiers[0];

  // Prix custom interpole entre les paliers quand customQty >= 25.
  const customPriceInfo = useMemo(() => {
    if (!customQty || String(customQty).trim() === '') return null;
    return lookupStickerPriceCustomQty(finish, customQty, size);
  }, [customQty, finish, size]);
  const priceInfo = customPriceInfo || getStickerPrice(finish, shape, currentTier.qty, size);

  const finishLabel = stickerFinishes.find(f => f.id === finish);
  const shapeLabel = stickerShapes.find(s => s.id === shape);
  const sizeLabel = stickerSizes.find(s => s.id === size)?.label;

  // FINISH-LABELS (9 juillet 2026) : prix/u courant a cote de chaque finition
  // dans le dropdown (ex "Matte laminé · 0,60 $/u"), pour que le client voie la
  // difference de prix entre finitions. Calcule pour la qty + taille choisies.
  const qtyForOptionPrice = isCustom && customQty ? customQty : currentTier.qty;
  const finishOptionLabel = (f) => {
    const label = tx({ fr: f.labelFr, en: f.labelEn, es: f.labelEs });
    const u = lookupStickerPriceCustomQty(f.id, qtyForOptionPrice, size)?.unitPrice;
    if (u == null) return label;
    const price = tx({ fr: `${u.toFixed(2).replace('.', ',')} $/u`, en: `$${u.toFixed(2)}/u`, es: `${u.toFixed(2).replace('.', ',')} $/u` });
    return `${label} · ${price}`;
  };

  // Source brute du sticker (avant detourage eventuel) : upload utilisateur
  // si dispo, sinon l'asset par defaut Massive Sticker.
  const rawSource = localPreviewUrl || DEFAULT_STICKER_URL;

  // Source affichee dans le preview : bgRemovedUrl > rawSource.
  const previewSource = useMemo(() => {
    if (activeRemoveBg && bgRemovedUrl) return bgRemovedUrl;
    return rawSource;
  }, [activeRemoveBg, bgRemovedUrl, rawSource]);

  // Detourage IA quand le toggle est active. Fonctionne autant sur l'upload
  // utilisateur que sur l'image par defaut - le mandat exige que tous les
  // effets (stroke, 3D, bg removal) s'appliquent meme avant upload.
  useEffect(() => {
    if (!activeRemoveBg) {
      setIsRemovingBg(false);
      return;
    }
    if (!rawSource) {
      setBgRemovedUrl(null);
      setBgRemoveError(null);
      return;
    }
    if (lastProcessedRef.current === rawSource && bgRemovedUrl) return;

    let cancelled = false;
    setIsRemovingBg(true);
    setBgRemoveError(null);
    removeBackground(rawSource)
      .then((url) => {
        if (cancelled) return;
        lastProcessedRef.current = rawSource;
        setBgRemovedUrl(url);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[ConfiguratorStickers] removeBackground failed:', err);
        setBgRemoveError(err?.message || 'Detourage echoue');
        setBgRemovedUrl(null);
        // ERROR-RESET (12 mai 2026) : si le detourage echoue, on revient a
        // l'image originale pour eviter une UX trompeuse (bouton qui dit
        // "Arriere-plan retire" alors qu'aucun detourage n'a eu lieu).
        setActiveRemoveBg(false);
      })
      .finally(() => {
        if (!cancelled) setIsRemovingBg(false);
      });

    return () => { cancelled = true; };
  }, [activeRemoveBg, rawSource]);  // eslint-disable-line react-hooks/exhaustive-deps

  const canAddToCart = uploadedFiles.length > 0 || notes.trim().length > 0;

  const handleFilesChange = (files) => {
    setUploadedFiles(files);
    // PREVIEW-DETECT-V2 (12 mai 2026) : FileUpload stocke le MIME dans `mime`
    // et le filename original dans `originalName` (le `name` est un hash
    // Google Drive sans extension). Avant on cherchait seulement `type` et
    // `name` -> aucun match -> preview ne se replace pas. Maintenant on
    // verifie mime + type + name + originalName et on accepte plus de
    // formats (gif/bmp/tiff). Fallback sur driveUrl si url est vide.
    const firstImage = files.find((f) => {
      const mime = f.mime || f.type || '';
      if (mime.startsWith('image/')) return true;
      const candidate = f.originalName || f.name || '';
      return /\.(png|jpe?g|webp|svg|gif|bmp|tiff?|avif)$/i.test(candidate);
    });
    setLocalPreviewUrl(firstImage?.url || firstImage?.driveUrl || null);
  };

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    // INVENTORY-A1 (2026-05-13) : SKU deterministe pour permettre au backend
    // (order.ts ligne 1364, `item.sku || item.slug`) de decrementer la
    // bonne entree d'inventaire. L'admin peut creer des inventory items
    // avec ces SKUs (ou avec un suffixe -NNN auto-genere : le backend
    // gere les deux via exact match + prefix fallback).
    const cartSku = `sticker-${finish || 'clear'}-${shape || 'diecut'}-${size || 'std'}`;
    addToCart({
      productId: 'sticker-custom',
      sku: cartSku,
      productName: tx({ fr: 'Sticker Custom', en: 'Custom Sticker', es: 'Sticker Personalizado' }),
      finish: tx({ fr: finishLabel?.labelFr, en: finishLabel?.labelEn, es: finishLabel?.labelEs }),
      // FIX-CHECKOUT-CUSTOM-QTY : l'ID de finition voyage jusqu'au checkout. Le
      // prix depend du KIND (matte/clear/fx), que le back derive de l'ID - le
      // label traduit (item.finish) ne suffit pas et le classait en matte.
      finishId: finish,
      shape: tx({ fr: shapeLabel?.labelFr, en: shapeLabel?.labelEn, es: shapeLabel?.labelEs }),
      size: sizeLabel,
      sizeId: size,
      quantity: priceInfo.qty,
      unitPrice: priceInfo.unitPrice,
      totalPrice: priceInfo.price,
      image: thumbUrl || stickerImages[0],
      uploadedFiles,
      notes,
      fxPreview: { finish, shape, size, strokeColor, strokeWidth, hasCustomDesign: !!localPreviewUrl },
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // Options du select Quantite : 5 paliers + une option "Custom".
  // qtyValue == 'custom' active l'input libre en dessous.
  const qtyValue = isCustom ? 'custom' : String(qtyIndex);

  return (
    <>
      {/* LAYOUT-V3 (11 mai 2026) : grid 2/3 - 1/3 sur desktop pour donner
          la majorite de l'espace au preview du sticker. Le tilt 3D + FX
          live sont visibles a grande echelle, les controles sont compacts
          en colonne droite via des selects natifs. */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 lg:gap-7 mb-4">
        {/* ============ PREVIEW (col gauche, grand) ============ */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl p-3 md:p-4 lg:p-6 bg-black/10">
            {/* CLICKABLE-PREVIEW v3 (12 mai 2026) - VERSION FINALE GELEE.
                REGLES DURES (validation client) :
                  - AUCUN overlay sombre au hover.
                  - AUCUNE icone Upload visible.
                  - AUCUN texte "Televerse ton image" / "Upload your image".
                  - AUCUN flou (filter:blur, backdrop-filter).
                  - AUCUN assombrissement (opacity, bg-black/X).
                Seul indicateur d'interactivite : cursor:pointer (CSS native).
                Le tilt 3D + FX du sticker continuent de fonctionner car
                ils sont rendus a l'interieur du StickerPreviewCanvas et
                NE SONT PAS des overlays UI sur la zone cliquable.
                Accessibilite preservee (role/tabIndex/aria-label/clavier). */}
            <div
              className="relative cursor-pointer w-full max-w-lg mx-auto"
              onClick={openFilePicker}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFilePicker(); } }}
              role="button"
              tabIndex={0}
              aria-label={tx({ fr: 'Cliquer pour televerser une nouvelle image', en: 'Click to upload a new image', es: 'Haz clic para subir una nueva imagen' })}
            >
              <StickerPreviewCanvas
                imageUrl={previewSource}
                shape={shape}
                finish={finish}
                strokeColor={strokeColor}
                strokeWidth={strokeWidth}
                onThumbChange={setThumbUrl}
                enableTilt
                className="w-full"
              />
              {/* LOADING-OVERLAY (12 mai 2026) : overlay visible pendant le
                  detourage IA (~5-15s). Spinner + texte + barre de progression
                  CSS pulse pour montrer que ça travaille. pointerEvents:auto
                  pour bloquer les clics pendant le traitement. */}
              {isRemovingBg && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-black/70 backdrop-blur-sm z-20"
                  style={{ pointerEvents: 'auto' }}
                  onClick={(e) => e.stopPropagation()}
                  aria-live="polite"
                >
                  <Loader2 size={36} className="text-accent animate-spin" />
                  <div className="text-center px-4">
                    <p className="text-white text-base font-bold uppercase tracking-wider drop-shadow-lg">
                      {tx({ fr: 'Detourage en cours...', en: 'Removing background...', es: 'Recortando fondo...' })}
                    </p>
                    <p className="text-white/80 text-xs mt-1">
                      {tx({ fr: '~5 a 15 secondes', en: '~5 to 15 seconds', es: '~5 a 15 segundos' })}
                    </p>
                  </div>
                  {/* Barre de progression indeterminate (CSS animation) */}
                  <div className="w-40 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-accent rounded-full animate-[loading_1.2s_ease-in-out_infinite]" style={{ animation: 'loading-slide 1.4s ease-in-out infinite' }} />
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <span className="text-heading text-base font-semibold">
                {tx({ fr: finishLabel?.labelFr, en: finishLabel?.labelEn, es: finishLabel?.labelEs })}
              </span>
              <span className="block text-grey-muted text-sm mt-0.5">
                {sizeLabel} · {tx({ fr: 'Die-cut', en: 'Die-cut', es: 'Die-cut' })}
              </span>
            </div>

          </div>
        </div>

        {/* ============ CONTROLES (col droite, compact) ============ */}
        <div className="space-y-3">
          {/* Upload du design */}
          <div>
            <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1.5">
              {tx({ fr: 'Design', en: 'Design', es: 'Diseno' })}
            </label>
            <FileUpload
              ref={fileUploadRef}
              files={uploadedFiles}
              onFilesChange={handleFilesChange}
              compact
              hidePreview
            />
          </div>

          {/* Finition - select natif */}
          <SelectControl
            label={tx({ fr: 'Finition', en: 'Finish', es: 'Acabado' })}
            value={finish}
            onChange={(v) => { setFinish(v); onFinishChange?.(v); }}
            options={stickerFinishes}
            getOptionLabel={finishOptionLabel}
          />

          {/* Forme - select natif */}
          <SelectControl
            label={tx({ fr: 'Forme', en: 'Shape', es: 'Forma' })}
            value={shape}
            onChange={setShape}
            options={stickerShapes}
            getOptionLabel={(s) => tx({ fr: s.labelFr, en: s.labelEn, es: s.labelEs })}
          />

          {/* Taille - select natif */}
          <SelectControl
            label={tx({ fr: 'Taille', en: 'Size', es: 'Tamano' })}
            value={size}
            onChange={setSize}
            options={stickerSizes}
            getOptionLabel={(s) => s.label}
          />

          {/* Quantite - select avec paliers + option Custom */}
          <div>
            <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1.5">
              {tx({ fr: 'Quantite', en: 'Quantity', es: 'Cantidad' })}
            </label>
            <div className="relative">
              <select
                value={qtyValue}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === 'custom') {
                    setIsCustom(true)
                    if (!customQty) setCustomQty('25')
                  } else {
                    setIsCustom(false)
                    setQtyIndex(parseInt(v, 10))
                    setCustomQty('')
                  }
                }}
                className={SELECT_CLASS}
              >
                {tiers.map((tier, i) => {
                  const p = getStickerPrice(finish, shape, tier.qty, size);
                  return (
                    <option key={tier.qty} value={String(i)} className="bg-black text-white">
                      {tier.qty} · {p ? `${money(p.unitPrice)}$/u` : ''} · {p ? formatPrice(p.price) : ''}
                    </option>
                  );
                })}
                <option value="custom" className="bg-black text-white">
                  {tx({ fr: 'Personnalisee (min. 25)', en: 'Custom (min. 25)', es: 'Personalizada (min. 25)' })}
                </option>
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-muted pointer-events-none"
              />
            </div>
            {qtyValue === 'custom' && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="25"
                  step="1"
                  inputMode="numeric"
                  value={customQty}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^0-9]/g, '');
                    setCustomQty(cleaned);
                  }}
                  onBlur={() => {
                    // Clamp au minimum a la validation (pas a chaque frappe) :
                    // vide ou sous 25 -> 25. La saisie de 60, 137... reste libre.
                    const n = parseInt(customQty, 10)
                    if (!Number.isFinite(n) || n < 25) setCustomQty('25')
                  }}
                  placeholder="25"
                  className="flex-1 bg-black/20 border-2 border-grey-muted/20 focus:border-accent rounded-lg px-3 py-2 text-sm text-heading focus:outline-none"
                />
                <span className="text-grey-muted text-xs whitespace-nowrap">
                  {customPriceInfo ? (
                    <span className="text-accent font-semibold">{money(customPriceInfo.unitPrice)}$/u</span>
                  ) : customQty ? (
                    <span className="text-yellow-400">{tx({ fr: 'Min. 25', en: 'Min. 25', es: 'Min. 25' })}</span>
                  ) : null}
                </span>
              </div>
            )}
          </div>

          {/* Contour (stroke) - compact */}
          <div>
            <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1.5">
              {tx({ fr: 'Contour', en: 'Outline', es: 'Contorno' })}
            </label>
            <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2.5 border-2 border-grey-muted/20">
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-7 h-7 rounded cursor-pointer bg-transparent border border-white/10"
                aria-label={tx({ fr: 'Couleur du contour', en: 'Outline color', es: 'Color del contorno' })}
              />
              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                className="flex-1 accent-accent"
                aria-label={tx({ fr: 'Epaisseur du contour', en: 'Outline thickness', es: 'Grosor del contorno' })}
              />
              <span className="text-xs font-mono text-grey-muted w-6 text-right">{strokeWidth}</span>
            </div>
          </div>

          {/* Toggle Retirer l'arriere-plan : juste sous le selecteur de
              contour. Fonctionne sur l'image upload OU sur l'image par
              defaut (le mandat impose que bg removal s'applique aussi
              avant upload). */}
          <div>
            <button
              onClick={() => setActiveRemoveBg((v) => !v)}
              disabled={isRemovingBg}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all border-2 ${
                activeRemoveBg
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-grey-muted/20 hover:border-grey-muted/40 text-heading'
              } disabled:opacity-50 disabled:cursor-wait`}
            >
              {isRemovingBg ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  {tx({ fr: 'Detourage en cours...', en: 'Removing background...', es: 'Recortando...' })}
                </>
              ) : (
                <>
                  <Scissors size={15} />
                  {activeRemoveBg
                    ? tx({ fr: 'Arriere-plan retire - cliquer pour annuler', en: 'Background removed - click to undo', es: 'Fondo eliminado - clic para deshacer' })
                    : tx({ fr: "Retirer l'arriere-plan", en: 'Remove background', es: 'Quitar fondo' })}
                </>
              )}
            </button>
            {bgRemoveError && (
              <p className="text-xs text-red-400 mt-1.5 text-center">
                {tx({ fr: 'Erreur : ', en: 'Error: ', es: 'Error: ' })}{bgRemoveError}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1.5">
              {tx({ fr: 'Notes', en: 'Notes', es: 'Notas' })}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={tx({ fr: 'Couleurs, style, details...', en: 'Colors, style, details...', es: 'Colores, estilo, detalles...' })}
              className="w-full rounded-lg border-2 border-grey-muted/20 bg-black/20 px-3 py-2 text-sm text-heading placeholder:text-grey-muted/50 focus:border-accent focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Prix + actions */}
          {priceInfo && (
            <div className="p-3 rounded-xl highlight-bordered">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-heading font-bold text-heading">{formatPrice(priceInfo.price)}</span>
                <span className="text-grey-muted text-xs">
                  ({money(priceInfo.unitPrice)}$/u × {priceInfo.qty})
                </span>
              </div>
              {priceInfo?.tier && (
                <p className="mt-1.5 flex items-center gap-1 text-[11px] text-grey-muted">
                  <Info size={10} className="text-accent flex-shrink-0" />
                  <span>
                    {priceInfo.tier === 'large'
                      ? tx({ fr: 'Palier Large (jusqu\'a 5")', en: 'Large tier (up to 5")', es: 'Nivel Large (hasta 5")' })
                      : priceInfo.tier === 'medium'
                      ? tx({ fr: 'Palier Medium (jusqu\'a 3.5")', en: 'Medium tier (up to 3.5")', es: 'Nivel Medium (hasta 3.5")' })
                      : tx({ fr: 'Palier Standard (jusqu\'a 2.5")', en: 'Standard tier (up to 2.5")', es: 'Nivel Standard (hasta 2.5")' })}
                  </span>
                </p>
              )}
              {(finish === 'holographic' || finish === 'broken-glass' || finish === 'stars' || finish === 'dots') && (
                <span className="inline-block mt-2 text-accent text-[11px] font-medium">
                  {tx({ fr: 'Effets Speciaux inclus', en: 'Special Effects included', es: 'Efectos Especiales incluidos' })}
                </span>
              )}
              <span className="block mt-2 text-[11px] text-grey-muted/80 leading-snug flex items-center gap-1">
                <Sparkles size={11} className="text-accent flex-shrink-0" />
                {tx({ fr: 'Proof + verification studio inclus', en: 'Proof + studio verification included', es: 'Prueba + verificacion estudio incluido' })}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className={`btn-primary w-full justify-center text-sm py-2.5 ${!canAddToCart ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {added ? (
                <><Check size={16} className="mr-1.5" />{tx({ fr: 'Ajoute!', en: 'Added!', es: 'Agregado!' })}</>
              ) : (
                <><ShoppingCart size={16} className="mr-1.5" />{tx({ fr: 'Ajouter au panier', en: 'Add to cart', es: 'Agregar al carrito' })}</>
              )}
            </button>
            <Link to="/panier" className="btn-outline w-full justify-center text-sm py-2">
              {tx({ fr: 'Voir le panier', en: 'View cart', es: 'Ver el carrito' })}
            </Link>
            {!canAddToCart && (
              <p className="text-yellow-400 text-[11px] text-center leading-snug">
                {tx({
                  fr: 'Ajoute un design ou decris ton projet dans les notes.',
                  en: 'Upload a design or describe your project in the notes.',
                  es: 'Sube un diseno o describe tu proyecto en las notas.',
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="text-grey-muted text-xs mt-2 text-center">
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
