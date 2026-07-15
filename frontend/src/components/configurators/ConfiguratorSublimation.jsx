import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Check, Palette, Sparkles, Shirt, ShoppingBag, Coffee, Package, ChevronDown, Upload } from 'lucide-react';
import MerchPreview from '../merch/MerchPreview';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useLang } from '../../i18n/LanguageContext';
import { useProduct } from '../../hooks/useProducts';
import FileUpload from '../FileUpload';
import MerchPauseBanner from '../MerchPauseBanner';
import { MERCH_PAUSED, blockIfMerchPaused } from '../../config/merchStatus';
import {
  sublimationProducts as defaultProducts, sublimationPriceTiers as defaultPriceTiers, sublimationDesignPrice as defaultDesignPrice,
  getSublimationPrice as defaultGetPrice, sublimationImages,
  canBringOwnGarment, sublimationBlankCost,
} from '../../data/products';
import { merchColors, merchSizes, getTshirtImage, hoodieColors, getHoodieImage, longsleeveColors, getLongSleeveImage, totebagColors, getTotebagImage } from '../../data/merchData';

// Products that support color selection
const productsWithColors = ['tshirt', 'hoodie', 'longsleeve', 'totebag'];
// Products that also have size selection
const productsWithSizes = ['tshirt', 'hoodie', 'longsleeve'];
// Products with front/back views
const productsWithSides = ['tshirt', 'hoodie', 'longsleeve', 'totebag'];
// Icons for product type selector
const PRODUCT_ICONS = {
  tshirt: Shirt, longsleeve: Shirt, hoodie: Shirt,
  totebag: ShoppingBag, bag: Package, mug: Coffee, tumbler: Coffee,
};

// Back view mockup images (noir - pas d'images couleur disponibles pour le dos)
// totebag: pas de mockup back, utilise l'image couleur (fallback dans le JSX)
const BACK_IMAGES = {
  tshirt: '/images/mockups/tshirt/back.webp',
  hoodie: '/images/mockups/hoodie/back.webp',
  longsleeve: '/images/mockups/longsleeve/back.webp',
};

// Static preview images for products without color picker
const staticProductImages = {
  mug: '/images/mugs/mug-white.webp',
  tumbler: '/images/mugs/tumbler-white.webp',
  bag: '/images/realisations/textile/Textile1.webp',
};

function ConfiguratorSublimation() {
  const { lang, tx } = useLang();
  const { addToCart } = useCart();
  // PRIX-HARDCODE : on IGNORE les champs de pricing du CMS.
  // La grille officielle vit uniquement dans utils/pricingData.js (SUBLIMATION_UNIT_PRICES).
  const cmsProduct = useProduct('sublimation');
  const pd = cmsProduct?.pricingData;

  // Seuls les labels (products list UI) peuvent venir du CMS. Les prix sont hardcoded.
  const sublimationProducts = pd?.products || defaultProducts;
  const sublimationPriceTiers = defaultPriceTiers;
  const sublimationDesignPrice = defaultDesignPrice;

  const getSublimationPrice = defaultGetPrice;

  const [product, setProduct] = useState('tshirt');
  const [qtyIndex, setQtyIndex] = useState(0);
  const [withDesign, setWithDesign] = useState(false);
  const [bringOwnGarment, setBringOwnGarment] = useState(false);
  const [added, setAdded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [notes, setNotes] = useState('');
  const [selectedColor, setSelectedColor] = useState('black');
  const [selectedSize, setSelectedSize] = useState('M');
  const [showMockup, setShowMockup] = useState(false);

  // Front / Back mockup state
  const [frontLogoUrl, setFrontLogoUrl] = useState(null);
  const [backLogoUrl, setBackLogoUrl] = useState(null);
  const [frontLogoPos, setFrontLogoPos] = useState({ x: 0.28, y: 0.22, width: 0.35 });
  const [backLogoPos, setBackLogoPos] = useState({ x: 0.28, y: 0.22, width: 0.35 });

  const tiers = sublimationPriceTiers[product] || [];
  // Si le produit selectionne ne supporte pas BYOT, on force-reset le toggle
  // pour eviter d'appliquer une deduction a un produit non-eligible (ex: mug).
  const byotAllowed = canBringOwnGarment(product);
  const effectiveByot = bringOwnGarment && byotAllowed;
  const priceInfo = getSublimationPrice(product, qtyIndex, withDesign, effectiveByot);
  const productLabel = sublimationProducts.find(p => p.id === product);

  // Reset BYOT si on change vers un produit qui ne le supporte pas
  // (ex: user coche BYOT sur tshirt, puis change vers mug -> on decoche)
  useEffect(() => {
    if (bringOwnGarment && !byotAllowed) setBringOwnGarment(false);
  }, [product, bringOwnGarment, byotAllowed]);

  const hasColors = productsWithColors.includes(product);
  const hasSizes = productsWithSizes.includes(product);
  const hasSides = productsWithSides.includes(product);
  const colorsMap = { tshirt: merchColors, hoodie: hoodieColors, longsleeve: longsleeveColors, totebag: totebagColors };
  // STRICT-MAPPING-V3 (12 mai 2026) : association produit -> image. Chaque
  // cle DOIT matcher exactement le `id` de sublimationProducts (cf
  // data/products.js : 'tshirt', 'longsleeve', 'hoodie', 'totebag').
  //   getLongSleeveImage('black') -> /images/longsleeve/black.webp (verifie
  //   present dans public/images/longsleeve/).
  //   getTshirtImage('black') -> /images/tshirts/black.webp.
  //   getHoodieImage('black') -> /images/hoodies/black.webp.
  //   getTotebagImage('black') -> /images/totebags/black.webp.
  const imageMap = {
    tshirt:     getTshirtImage,
    longsleeve: getLongSleeveImage,
    hoodie:     getHoodieImage,
    totebag:    getTotebagImage,
  };
  const currentColors = colorsMap[product] || merchColors;
  // STRICT-MAPPING : pas de fallback silencieux vers T-shirt si la cle
  // n'existe pas dans imageMap. On warn dans la console et on renvoie null
  // (l'image ne s'affiche pas plutot que d'afficher un mauvais produit).
  const currentGetImage = imageMap[product];
  if (!currentGetImage && hasColors) {
    // eslint-disable-next-line no-console
    console.warn(`[ConfiguratorSublimation] No image getter for product='${product}'. Check imageMap keys vs sublimationProducts ids in data/products.js.`);
  }
  const colorObj = currentColors.find(c => c.id === selectedColor) || currentColors[0];

  const defaultColorMap = { tshirt: 'black', hoodie: 'black', longsleeve: 'black', totebag: 'black' };

  const handleProductChange = (p) => {
    setProduct(p);
    setQtyIndex(0);
    const newColors = colorsMap[p] || merchColors;
    if (!newColors.find(c => c.id === selectedColor)) {
      const preferred = defaultColorMap[p];
      const hasPreferred = newColors.find(c => c.id === preferred);
      setSelectedColor(hasPreferred ? preferred : newColors[0]?.id || 'black');
    }
  };

  const canAddToCart = uploadedFiles.length > 0 || frontLogoUrl || backLogoUrl || notes.trim().length > 0;

  const handleAddToCart = () => {
    // Blocage service en pause: alert explicatif, pas d'ajout au panier
    if (blockIfMerchPaused(tx)) return;
    if (!priceInfo || !canAddToCart) return;
    const placements = [];
    if (frontLogoUrl && frontLogoPos) {
      placements.push(`Front: x=${Math.round(frontLogoPos.x * 100)}% y=${Math.round(frontLogoPos.y * 100)}% w=${Math.round(frontLogoPos.width * 100)}%`);
    }
    if (backLogoUrl && backLogoPos) {
      placements.push(`Back: x=${Math.round(backLogoPos.x * 100)}% y=${Math.round(backLogoPos.y * 100)}% w=${Math.round(backLogoPos.width * 100)}%`);
    }
    const placementNote = placements.length ? `\n[${placements.join(' | ')}]` : '';
    // Marque BYOT dans les notes pour que l'equipe impression sache qu'aucun
    // blank n'est a commander pour cet item (le client fournit son textile).
    const byotNote = effectiveByot ? `\n[BYOT - Client apporte son propre textile - print fee seul]` : '';
    addToCart({
      productId: `sublimation-${product}${effectiveByot ? '-byot' : ''}`,
      productName: tx({
        fr: `${productLabel?.labelFr} Sublimation${effectiveByot ? ' (BYOT)' : ''}`,
        en: `Sublimation ${productLabel?.labelEn}${effectiveByot ? ' (BYOT)' : ''}`,
        es: `Sublimacion ${productLabel?.labelEs || productLabel?.labelEn}${effectiveByot ? ' (BYOT)' : ''}`,
      }),
      finish: [
        withDesign ? tx({ fr: 'Avec design', en: 'With design', es: 'Con diseno' }) : tx({ fr: 'Design fourni', en: 'Design provided', es: 'Diseno proporcionado' }),
        hasColors && !effectiveByot ? colorObj.name : null,
        effectiveByot ? tx({ fr: 'Textile client', en: 'Client textile', es: 'Textil cliente' }) : null,
        frontLogoUrl && backLogoUrl ? tx({ fr: 'Devant + Dos', en: 'Front + Back', es: 'Delante + Detras' }) : frontLogoUrl ? tx({ fr: 'Devant', en: 'Front', es: 'Delante' }) : backLogoUrl ? tx({ fr: 'Dos', en: 'Back', es: 'Detras' }) : null,
      ].filter(Boolean).join(' - '),
      shape: null,
      size: hasSizes ? selectedSize : tx({ fr: productLabel?.labelFr, en: productLabel?.labelEn, es: productLabel?.labelEs || productLabel?.labelEn }),
      quantity: priceInfo.qty,
      unitPrice: priceInfo.unitPrice,
      totalPrice: priceInfo.price,
      image: frontLogoUrl || backLogoUrl || sublimationImages[0],
      uploadedFiles,
      notes: notes + placementNote + byotNote,
      bringOwnGarment: effectiveByot, // flag dans l'item pour validation serveur
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // SELECT-STYLE-V3 (12 mai 2026) : classes Tailwind reutilisables pour
  // tous les <select> du configurateur (Produit/Couleur/Taille/Quantite).
  // Coherent avec le configurateur stickers.
  const SELECT_CLASS = 'w-full appearance-none bg-black/20 border-2 border-grey-muted/20 hover:border-grey-muted/40 focus:border-accent rounded-lg px-3 py-2.5 pr-9 text-sm text-heading transition-colors cursor-pointer focus:outline-none';

  return (
    <>
      {/* LAYOUT-2COL-V3 (12 mai 2026) : grid 12 colonnes responsive.
          Desktop (lg+) : preview lg:col-span-7 sticky a gauche, controles
          lg:col-span-5 a droite. Mobile (<lg) : stack 1 colonne, preview en
          haut. Coherent avec le configurateur stickers refondu. */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 mb-4">

        {/* ============ COLONNE GAUCHE : PREVIEW (lg:col-span-7, sticky) ============ */}
        <div className="lg:col-span-7 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl bg-black/10 p-4 md:p-6">
            {/* Apercu image produit dynamique (textiles) ou statique (mug/tumbler/bag).
                IMG-SYNC-FIX (12 mai 2026) : retrait d'AnimatePresence + motion.img
                qui causaient un bug ou l'image ancienne (T-shirt) restait affichee
                meme apres changement de produit (Long Sleeve). Le mode="wait"
                + key change ne forcait pas le re-mount correctement dans le
                nouveau layout 2-col. Remplace par un simple <img> avec key
                explicite pour garantir le re-render. */}
            {/* PREVIEW-MORPH (12 mai 2026) : 2 modes de rendu :
                  - showMockup=false (defaut) : image statique du produit
                  - showMockup=true (textiles only) : MerchPreview drag/drop
                    front (+ back si hasSides) prend la place du preview
                    -> user peut directement deposer son logo sur le vetement
                Plus de double rendu (preview + mockup en dessous). */}
            {showMockup && hasColors ? (
              <div className={`grid gap-3 ${hasSides ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 max-w-md mx-auto'}`}>
                <div>
                  <span className="block text-sm font-semibold text-heading mb-1.5">
                    {hasSides ? tx({ fr: 'Devant', en: 'Front', es: 'Delante' }) : tx({ fr: 'Apercu', en: 'Preview', es: 'Vista previa' })}
                    {frontLogoUrl && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-green-400 align-middle" />}
                  </span>
                  <MerchPreview
                    productImageUrl={currentGetImage(selectedColor)}
                    logoUrl={frontLogoUrl}
                    logoPosition={frontLogoPos}
                    onLogoPositionChange={setFrontLogoPos}
                    onFileSelect={(file) => {
                      const url = URL.createObjectURL(file);
                      if (frontLogoUrl) URL.revokeObjectURL(frontLogoUrl);
                      setFrontLogoUrl(url);
                      setUploadedFiles(prev => [...prev, file]);
                    }}
                    onLogoRemove={() => { if (frontLogoUrl) URL.revokeObjectURL(frontLogoUrl); setFrontLogoUrl(null); }}
                  />
                </div>
                {hasSides && (
                  <div>
                    <span className="block text-sm font-semibold text-heading mb-1.5">
                      {tx({ fr: 'Dos', en: 'Back', es: 'Detras' })}
                      {backLogoUrl && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-green-400 align-middle" />}
                    </span>
                    <MerchPreview
                      productImageUrl={BACK_IMAGES[product] || currentGetImage(selectedColor)}
                      logoUrl={backLogoUrl}
                      logoPosition={backLogoPos}
                      onLogoPositionChange={setBackLogoPos}
                      onFileSelect={(file) => {
                        const url = URL.createObjectURL(file);
                        if (backLogoUrl) URL.revokeObjectURL(backLogoUrl);
                        setBackLogoUrl(url);
                        setUploadedFiles(prev => [...prev, file]);
                      }}
                      onLogoRemove={() => { if (backLogoUrl) URL.revokeObjectURL(backLogoUrl); setBackLogoUrl(null); }}
                    />
                  </div>
                )}
              </div>
            ) : hasColors ? (
              <img
                key={`${product}-${selectedColor}`}
                src={currentGetImage(selectedColor)}
                alt={`${productLabel ? tx({ fr: productLabel.labelFr, en: productLabel.labelEn }) : product} ${colorObj.name}`}
                className="w-full max-w-md mx-auto h-auto object-contain rounded-lg"
              />
            ) : staticProductImages[product] ? (
              <img
                key={product}
                src={staticProductImages[product]}
                alt={productLabel ? tx({ fr: productLabel.labelFr, en: productLabel.labelEn, es: productLabel.labelEs || productLabel.labelEn }) : product}
                className="w-full max-w-md mx-auto h-auto object-contain rounded-lg"
              />
            ) : null}

            {/* Label couleur + taille sous l'image (cache pendant le mockup pour libérer l'espace) */}
            {!showMockup && (
              <div className="mt-3 text-center">
                <span className="text-heading text-base font-semibold">
                  {hasColors ? colorObj.name : tx({ fr: productLabel?.labelFr, en: productLabel?.labelEn, es: productLabel?.labelEs || productLabel?.labelEn })}
                </span>
                {hasSizes && <span className="text-grey-muted text-sm block mt-0.5">{selectedSize}</span>}
              </div>
            )}

            {/* Bouton "Personnaliser" / "Retour a l'apercu" (textiles only) */}
            {hasColors && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowMockup(!showMockup)}
                  className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] shadow-md shadow-black/20 hover:shadow-lg hover:shadow-black/30 transition-all"
                >
                  <span className="flex items-center gap-2 text-base font-bold" style={{ color: 'var(--logo-accent, #ffcc02)' }}>
                    <Upload size={17} style={{ color: 'var(--logo-accent, #ffcc02)' }} />
                    {showMockup
                      ? tx({ fr: "Revenir a l'apercu", en: 'Back to preview', es: 'Volver a vista previa' })
                      : tx({
                          fr: `Personnaliser votre ${productLabel?.labelFr || 'produit'}`,
                          en: `Customize your ${productLabel?.labelEn || 'product'}`,
                          es: `Personalizar tu ${productLabel?.labelEs || productLabel?.labelEn || 'producto'}`,
                        })}
                    {(frontLogoUrl || backLogoUrl) && (
                      <span className="ml-1 inline-block w-2 h-2 rounded-full bg-green-400" />
                    )}
                  </span>
                  <ChevronDown size={18} className={`text-accent transition-transform ${showMockup ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ============ COLONNE DROITE : CONTROLES (lg:col-span-5) ============ */}
        <div className="lg:col-span-5 space-y-3 md:space-y-4">

          {/* Produit - select natif */}
          <div>
            <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1.5">
              {tx({ fr: 'Produit', en: 'Product', es: 'Producto' })}
            </label>
            <div className="relative">
              <select
                value={product}
                onChange={(e) => handleProductChange(e.target.value)}
                className={SELECT_CLASS}
              >
                {sublimationProducts.map((p) => (
                  <option key={p.id} value={p.id} className="bg-black text-white">
                    {tx({ fr: p.labelFr, en: p.labelEn, es: p.labelEs || p.labelEn })}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-muted pointer-events-none" />
            </div>
          </div>

          {/* Couleur - select natif (textiles only) */}
          {hasColors && (
            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1.5">
                {tx({ fr: 'Couleur', en: 'Color', es: 'Color' })}
              </label>
              <div className="relative">
                <select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className={SELECT_CLASS}
                >
                  {currentColors.map((c) => (
                    <option key={c.id} value={c.id} className="bg-black text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-muted pointer-events-none" />
              </div>
            </div>
          )}

          {/* Taille - select natif (textiles only) */}
          {hasSizes && (
            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1.5">
                {tx({ fr: 'Taille', en: 'Size', es: 'Talla' })}
              </label>
              <div className="relative">
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className={SELECT_CLASS}
                >
                  {merchSizes.map((size) => (
                    <option key={size} value={size} className="bg-black text-white">
                      {size}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-muted pointer-events-none" />
              </div>
            </div>
          )}

          {/* Quantite - select natif (deja fait) */}
          <div>
            <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1.5">
              {tx({ fr: 'Quantite', en: 'Quantity', es: 'Cantidad' })}
            </label>
            <div className="relative">
              <select
                value={qtyIndex}
                onChange={(e) => setQtyIndex(parseInt(e.target.value, 10))}
                className={SELECT_CLASS}
              >
                {tiers.map((tier, i) => (
                  <option key={tier.qty} value={i} className="bg-black text-white">
                    {tier.qty}
                    {' · '}
                    {tier.surSoumission
                      ? tx({ fr: 'Sur soumission', en: 'On quote', es: 'Cotizacion' })
                      : `${tier.unitPrice}$/u`}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-muted pointer-events-none" />
            </div>
          </div>

          {/* Design option */}
      <div className="mb-4 md:mb-6">
        <label className={`flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-lg cursor-pointer transition-all border-2 ${withDesign ? 'checkbox-active' : 'option-default'}`}>
          <input
            type="checkbox"
            checked={withDesign}
            onChange={(e) => setWithDesign(e.target.checked)}
            className="sr-only"
          />
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${withDesign ? 'bg-accent border-accent' : 'border-grey-muted/50'}`}>
            {withDesign && <Check size={14} className="text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-heading font-medium text-sm flex items-center gap-1.5">
              <Palette size={14} className="text-accent" />
              {tx({ fr: 'Creation graphique', en: 'Graphic design', es: 'Creacion grafica' })}
            </span>
            <span className="text-grey-muted text-sm block mt-0.5">
              {tx({ fr: 'Si vous n\'avez pas de design pret', en: 'If you don\'t have a ready design', es: 'Si no tienes un diseno listo' })}
            </span>
          </div>
          <span className="text-accent font-semibold text-sm flex-shrink-0">+{sublimationDesignPrice}$</span>
        </label>
      </div>

      {/* BYOT - J'apporte mon propre textile (disponible uniquement pour tshirt/hoodie/longsleeve/totebag).
          Bloque visuellement quand MERCH_PAUSED - le bouton 'Ajouter au panier' est deja disabled
          par la banniere de pause, donc cocher n'a aucun effet utilisateur pendant la pause. */}
      {byotAllowed && (
        <div className="mb-4 md:mb-6">
          <label className={`flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-lg cursor-pointer transition-all border-2 ${bringOwnGarment ? 'checkbox-active' : 'option-default'} ${MERCH_PAUSED ? 'opacity-60' : ''}`}>
            <input
              type="checkbox"
              checked={bringOwnGarment}
              onChange={(e) => setBringOwnGarment(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${bringOwnGarment ? 'bg-accent border-accent' : 'border-grey-muted/50'}`}>
              {bringOwnGarment && <Check size={14} className="text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-heading font-medium text-sm flex items-center gap-1.5">
                <Shirt size={14} className="text-accent" />
                {tx({ fr: "J'apporte mon propre vetement", en: 'I bring my own garment', es: 'Traigo mi propia prenda' })}
              </span>
              <span className="text-grey-muted text-sm block mt-0.5">
                {tx({
                  fr: `On ne facture que le print fee (economie de ${sublimationBlankCost[product] || 0}$/unite)`,
                  en: `We only charge the print fee (save $${sublimationBlankCost[product] || 0}/unit)`,
                  es: `Solo cobramos la impresion (ahorro ${sublimationBlankCost[product] || 0}$/u)`,
                })}
              </span>
            </div>
            {priceInfo && priceInfo.byotActive && priceInfo.byotDiscount > 0 && (
              <span className="text-emerald-400 font-semibold text-sm flex-shrink-0">-{priceInfo.byotDiscount}$</span>
            )}
          </label>

          {bringOwnGarment && (
            <div className="mt-2 rounded-lg bg-accent/5 p-3 md:p-4 flex items-start gap-3">
              <span className="text-xl md:text-2xl flex-shrink-0" aria-hidden="true">👕</span>
              <p className="text-xs md:text-sm text-grey-muted leading-relaxed">
                {tx({
                  fr: "Option Locale : Deposez vos propres textiles directement a notre atelier ! Nous imprimerons votre design dessus. (Note : Vous recevrez les instructions de depot par courriel apres votre commande).",
                  en: "Local Option: Drop off your own textiles directly at our workshop! We'll print your design on them. (Note: You'll receive drop-off instructions by email after your order).",
                  es: "Opcion Local: Deja tus propios textiles directamente en nuestro taller! Imprimiremos tu diseno sobre ellos. (Nota: Recibiras las instrucciones de entrega por correo despues de tu pedido).",
                })}
              </p>
            </div>
          )}
        </div>
      )}

      {/* File upload (non-textile only) + Notes */}
      <div className={`grid gap-3 md:gap-4 mb-4 md:mb-5 ${!hasColors ? 'grid-cols-1 md:grid-cols-[2fr_3fr]' : 'grid-cols-1'}`}>
        {!hasColors && (
          <FileUpload
            files={uploadedFiles}
            onFilesChange={setUploadedFiles}
            label={tx({ fr: 'Votre design', en: 'Your design', es: 'Tu diseno' })}
            compact
          />
        )}
        <div>
          <label className="block text-heading font-semibold text-sm uppercase tracking-wider mb-2">
            {tx({ fr: 'Notes / Description', en: 'Notes / Description', es: 'Notas / Descripcion' })}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={hasColors ? 2 : 3}
            placeholder={tx({ fr: 'Placement, details, instructions...', en: 'Placement, details, instructions...', es: 'Ubicacion, detalles, instrucciones...' })}
            className="w-full min-h-[60px] md:min-h-[80px] rounded-lg border-2 border-grey-muted/20 bg-transparent px-3 py-2.5 md:px-4 md:py-3 text-sm text-heading placeholder:text-grey-muted/50 focus:border-accent focus:outline-none transition-colors resize-none"
          />
        </div>
      </div>

      {/* Price display */}
      {priceInfo && !priceInfo.surSoumission && (
        <div className="p-4 md:p-5 rounded-xl mb-4 md:mb-5 highlight-bordered">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl md:text-3xl font-heading font-bold text-heading">{priceInfo.price}$</span>
            <span className="text-grey-muted text-sm">
              ({priceInfo.unitPrice.toFixed(2)}$/{tx({ fr: 'unite', en: 'unit', es: 'unidad' })})
            </span>
          </div>
          {priceInfo.byotActive && priceInfo.byotDiscount > 0 && (
            <div className="text-emerald-400 text-sm mt-1 flex items-center gap-1.5">
              <Shirt size={12} />
              {tx({
                fr: `Textile client - ${priceInfo.basePrice}$ - ${priceInfo.byotDiscount}$ blank = ${priceInfo.basePrice - priceInfo.byotDiscount}$ print fee`,
                en: `Client textile - $${priceInfo.basePrice} - $${priceInfo.byotDiscount} blank = $${priceInfo.basePrice - priceInfo.byotDiscount} print fee`,
                es: `Textil cliente - ${priceInfo.basePrice}$ - ${priceInfo.byotDiscount}$ blank = ${priceInfo.basePrice - priceInfo.byotDiscount}$ impresion`,
              })}
            </div>
          )}
          {withDesign && (
            <div className="text-grey-muted text-sm mt-1">
              {tx({
                fr: `${priceInfo.qty}x ${productLabel?.labelFr} ${priceInfo.basePrice}$ + Design ${priceInfo.designPrice}$`,
                en: `${priceInfo.qty}x ${productLabel?.labelEn} ${priceInfo.basePrice}$ + Design ${priceInfo.designPrice}$`,
                es: `${priceInfo.qty}x ${productLabel?.labelEs || productLabel?.labelEn} ${priceInfo.basePrice}$ + Diseno ${priceInfo.designPrice}$`,
              })}
            </div>
          )}
          {hasColors && !priceInfo.byotActive && (
            <div className="text-grey-muted text-sm mt-1">
              {colorObj.name}{hasSizes ? ` / ${selectedSize}` : ''}
            </div>
          )}
          <div className="text-grey-muted text-sm mt-2">
            {tx({ fr: 'Impression permanente - resistant au lavage', en: 'Permanent print - wash resistant', es: 'Impresion permanente - resistente al lavado' })}
          </div>
        </div>
      )}

      {/* Sur soumission display */}
      {priceInfo && priceInfo.surSoumission && (
        <div className="p-4 md:p-5 rounded-xl mb-4 md:mb-5 highlight-bordered">
          <div className="flex items-baseline gap-3">
            <span className="text-xl md:text-2xl font-heading font-bold text-heading">
              {tx({ fr: 'Sur soumission', en: 'On quote', es: 'Bajo cotizacion' })}
            </span>
          </div>
          <div className="text-grey-muted text-sm mt-1">
            {tx({
              fr: `${priceInfo.qty}+ unites - a partir de ${priceInfo.unitPrice}$/unite`,
              en: `${priceInfo.qty}+ units - from ${priceInfo.unitPrice}$/unit`,
              es: `${priceInfo.qty}+ unidades - desde ${priceInfo.unitPrice}$/unidad`,
            })}
          </div>
        </div>
      )}

      {/* Add to cart or contact */}
      {priceInfo && !priceInfo.surSoumission ? (
        <>
          {/* Visuellement desactive quand MERCH_PAUSED. On garde onClick actif
              pour afficher l'alert explicatif si le client clique quand meme. */}
          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart && !MERCH_PAUSED}
            aria-disabled={MERCH_PAUSED ? 'true' : undefined}
            title={MERCH_PAUSED ? tx({ fr: 'Service temporairement suspendu', en: 'Service temporarily suspended', es: 'Servicio temporalmente suspendido' }) : undefined}
            className={`btn-primary w-full justify-center text-sm md:text-base py-3 md:py-3.5 mb-2 md:mb-3 ${(!canAddToCart || MERCH_PAUSED) ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {added ? (
              <><Check size={18} className="mr-2" />{tx({ fr: 'Ajoute!', en: 'Added!', es: 'Agregado!' })}</>
            ) : MERCH_PAUSED ? (
              <><Package size={18} className="mr-2" />{tx({ fr: 'Service en pause', en: 'Service paused', es: 'Servicio en pausa' })}</>
            ) : (
              <><ShoppingCart size={18} className="mr-2" />{tx({ fr: 'Ajouter au panier', en: 'Add to cart', es: 'Agregar al carrito' })}</>
            )}
          </button>

          <Link to="/panier" className="btn-outline w-full justify-center text-sm py-2 md:py-2.5">
            {tx({ fr: 'Voir le panier', en: 'View cart', es: 'Ver carrito' })}
          </Link>
        </>
      ) : (
        <Link to="/contact" className="btn-primary w-full justify-center text-sm md:text-base py-3 md:py-3.5 mb-2 md:mb-3">
          {tx({ fr: 'Demander une soumission', en: 'Request a quote', es: 'Solicitar cotizacion' })}
        </Link>
      )}

        </div>{/* /col droite */}
      </div>{/* /grid 2col */}

      <p className="text-grey-muted text-sm mt-2 md:mt-3 text-center">
        {tx({
          fr: 'Massive vous contactera pour valider le rendu avant production.',
          en: 'Massive will contact you to validate the result before production.',
          es: 'Massive te contactara para validar el resultado antes de produccion.',
        })}
      </p>
    </>
  );
}

export default ConfiguratorSublimation;
