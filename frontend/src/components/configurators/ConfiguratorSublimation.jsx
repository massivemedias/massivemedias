import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Check, Palette } from 'lucide-react';
import ColorSwatches from '../ColorSwatches';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useLang } from '../../i18n/LanguageContext';
import { useProduct } from '../../hooks/useProducts';
import FileUpload from '../FileUpload';
import {
  sublimationProducts as defaultProducts, sublimationPriceTiers as defaultPriceTiers, sublimationDesignPrice as defaultDesignPrice,
  getSublimationPrice as defaultGetPrice, sublimationImages,
} from '../../data/products';
import { merchColors, merchSizes, getTshirtImage, hoodieColors, getHoodieImage, longsleeveColors, getLongSleeveImage, totebagColors, getTotebagImage } from '../../data/merchData';

// Products that support color selection
const productsWithColors = ['tshirt', 'hoodie', 'longsleeve', 'totebag'];
// Products that also have size selection
const productsWithSizes = ['tshirt', 'hoodie', 'longsleeve'];
// Static preview images for products without color picker
const staticProductImages = {
  mug: '/images/mugs/mug-white.webp',
  tumbler: '/images/mugs/tumbler-white.webp',
  bag: '/images/realisations/textile/Textile1.webp',
};

function ConfiguratorSublimation() {
  const { lang, tx } = useLang();
  const { addToCart } = useCart();
  const cmsProduct = useProduct('sublimation');
  const pd = cmsProduct?.pricingData;

  const sublimationProducts = pd?.products || defaultProducts;
  const sublimationPriceTiers = pd?.priceTiers || defaultPriceTiers;
  const sublimationDesignPrice = pd?.designPrice ?? defaultDesignPrice;

  const getSublimationPrice = pd?.priceTiers
    ? (prod, qi, design) => {
        const tiers = sublimationPriceTiers[prod];
        if (!tiers || !tiers[qi]) return null;
        const tier = tiers[qi];
        if (tier.surSoumission) return { qty: tier.qty, unitPrice: tier.unitPrice, surSoumission: true };
        return { qty: tier.qty, price: tier.price + (design ? sublimationDesignPrice : 0), basePrice: tier.price, unitPrice: tier.unitPrice, designPrice: design ? sublimationDesignPrice : 0 };
      }
    : defaultGetPrice;

  const [product, setProduct] = useState('tshirt');
  const [qtyIndex, setQtyIndex] = useState(0);
  const [withDesign, setWithDesign] = useState(false);
  const [added, setAdded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [notes, setNotes] = useState('');
  const [selectedColor, setSelectedColor] = useState('black');
  const [selectedSize, setSelectedSize] = useState('M');

  const tiers = sublimationPriceTiers[product] || [];
  const priceInfo = getSublimationPrice(product, qtyIndex, withDesign);
  const productLabel = sublimationProducts.find(p => p.id === product);

  const hasColors = productsWithColors.includes(product);
  const hasSizes = productsWithSizes.includes(product);
  const colorsMap = { tshirt: merchColors, hoodie: hoodieColors, longsleeve: longsleeveColors, totebag: totebagColors };
  const imageMap = { tshirt: getTshirtImage, hoodie: getHoodieImage, longsleeve: getLongSleeveImage, totebag: getTotebagImage };
  const currentColors = colorsMap[product] || merchColors;
  const currentGetImage = imageMap[product] || getTshirtImage;
  const colorObj = currentColors.find(c => c.id === selectedColor) || currentColors[0];

  // Preferred default color per product type
  const defaultColorMap = { tshirt: 'black', hoodie: 'black', longsleeve: 'black', totebag: 'lavender' };

  const handleProductChange = (p) => {
    setProduct(p);
    setQtyIndex(0);
    // Reset color if not available in new product's palette
    const newColors = colorsMap[p] || merchColors;
    if (!newColors.find(c => c.id === selectedColor)) {
      const preferred = defaultColorMap[p];
      const hasPreferred = newColors.find(c => c.id === preferred);
      setSelectedColor(hasPreferred ? preferred : newColors[0]?.id || 'black');
    }
  };

  const canAddToCart = uploadedFiles.length > 0 || notes.trim().length > 0;

  const handleAddToCart = () => {
    if (!priceInfo || !canAddToCart) return;
    addToCart({
      productId: `sublimation-${product}`,
      productName: tx({
        fr: `${productLabel?.labelFr} Sublimation`,
        en: `Sublimation ${productLabel?.labelEn}`,
        es: `Sublimacion ${productLabel?.labelEs || productLabel?.labelEn}`,
      }),
      finish: [
        withDesign ? tx({ fr: 'Avec design', en: 'With design', es: 'Con diseno' }) : tx({ fr: 'Design fourni', en: 'Design provided', es: 'Diseno proporcionado' }),
        hasColors ? colorObj.name : null,
      ].filter(Boolean).join(' - '),
      shape: null,
      size: hasSizes ? selectedSize : tx({ fr: productLabel?.labelFr, en: productLabel?.labelEn, es: productLabel?.labelEs || productLabel?.labelEn }),
      quantity: priceInfo.qty,
      unitPrice: priceInfo.unitPrice,
      totalPrice: priceInfo.price,
      image: sublimationImages[0],
      uploadedFiles,
      notes,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      {/* Product type selector */}
      <div className="mb-4 md:mb-5">
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
          {tx({ fr: 'Produit', en: 'Product', es: 'Producto' })}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-1.5 md:gap-2">
          {sublimationProducts.map(p => (
            <button
              key={p.id}
              onClick={() => handleProductChange(p.id)}
              className={`flex flex-col items-center justify-center py-2 px-2 md:min-w-[7rem] md:py-2.5 md:px-3 rounded-lg text-xs font-medium transition-all border-2 ${product === p.id
                ? 'border-accent option-selected'
                : 'border-transparent hover:border-grey-muted/30 option-default'
              }`}
            >
              <span className="text-heading leading-tight text-center font-semibold text-[13px] md:text-xs">
                {tx({ fr: p.labelFr, en: p.labelEn, es: p.labelEs || p.labelEn })}
              </span>
              {p.descFr && (
                <span className="text-grey-muted mt-0.5 text-[9px] md:text-[10px] hidden sm:block">
                  {tx({ fr: p.descFr, en: p.descEn, es: p.descEs || p.descEn })}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Color + Size + Preview for textile products */}
      {hasColors && (
        <div className="mb-4 md:mb-5">
          {/* Mobile: compact horizontal strip / Desktop: side by side */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-5">
            {/* Product preview */}
            <div className="flex md:flex-col items-center gap-3 md:gap-0 md:w-48 rounded-xl card-bg-bordered p-3 overflow-hidden md:self-start">
              <AnimatePresence mode="wait">
                <motion.img
                  key={`${product}-${selectedColor}`}
                  src={currentGetImage(selectedColor)}
                  alt={`${productLabel ? tx({ fr: productLabel.labelFr, en: productLabel.labelEn, es: productLabel.labelEs || productLabel.labelEn }) : product} ${colorObj.name}`}
                  className="w-32 h-32 md:w-full md:h-auto object-contain rounded-lg flex-shrink-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </AnimatePresence>
              <div className="text-left md:text-center md:mt-3">
                <span className="text-heading text-sm font-semibold">
                  {colorObj.name}
                </span>
                <span className="block text-grey-muted text-xs mt-0.5">
                  {hasSizes ? selectedSize : tx({ fr: productLabel?.labelFr, en: productLabel?.labelEn, es: productLabel?.labelEs || productLabel?.labelEn })}
                </span>
              </div>
            </div>

            {/* Color + Size selectors */}
            <div className="flex-1 min-w-0 space-y-3 md:space-y-4">
              <ColorSwatches
                colors={currentColors}
                selected={selectedColor}
                onChange={setSelectedColor}
                label={tx({ fr: 'Couleur', en: 'Color', es: 'Color' })}
              />

              {hasSizes && (
                <div>
                  <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1.5 md:mb-2">
                    {tx({ fr: 'Taille', en: 'Size', es: 'Talla' })}
                  </label>
                  <div className="grid grid-cols-6 md:flex md:flex-wrap gap-1.5 md:gap-2">
                    {merchSizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`py-1.5 px-1 md:min-w-[3.5rem] md:py-2.5 md:px-3 rounded-lg text-xs font-semibold transition-all border-2 ${
                          selectedSize === size
                            ? 'border-accent option-selected'
                            : 'border-transparent hover:border-grey-muted/30 option-default'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Static preview for non-textile products (mug, tumbler, bag) */}
      {!hasColors && staticProductImages[product] && (
        <div className="mb-4 md:mb-5">
          <div className="flex md:flex-col items-center gap-3 md:gap-0 md:w-48 rounded-xl card-bg-bordered p-3 overflow-hidden md:self-start">
            <AnimatePresence mode="wait">
              <motion.img
                key={product}
                src={staticProductImages[product]}
                alt={productLabel ? tx({ fr: productLabel.labelFr, en: productLabel.labelEn, es: productLabel.labelEs || productLabel.labelEn }) : product}
                className="w-[96px] h-[96px] md:w-full md:h-auto object-contain rounded-lg flex-shrink-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </AnimatePresence>
            <div className="text-left md:text-center md:mt-3">
              <span className="text-heading text-sm font-semibold">
                {tx({ fr: productLabel?.labelFr, en: productLabel?.labelEn, es: productLabel?.labelEs || productLabel?.labelEn })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quantity selector */}
      <div className="mb-4 md:mb-5">
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1.5 md:mb-2.5">
          {tx({ fr: 'Quantite', en: 'Quantity', es: 'Cantidad' })}
        </label>
        <div className="grid grid-cols-4 md:flex md:flex-wrap gap-1.5 md:gap-2">
          {tiers.map((tier, i) => {
            return (
              <button
                key={tier.qty}
                onClick={() => setQtyIndex(i)}
                className={`flex flex-col items-center py-1.5 px-2 md:py-2.5 md:px-4 rounded-lg text-xs font-medium transition-all border-2 md:min-w-[5rem] ${qtyIndex === i
                  ? 'border-accent option-selected'
                  : 'border-transparent hover:border-grey-muted/30 option-default'
                }`}
              >
                <span className="text-heading font-bold text-[15px] md:text-sm">{tier.qty}</span>
                <span className="text-grey-muted mt-0.5 text-[10px] md:text-xs">
                  {tier.surSoumission ? tx({ fr: 'Soumission', en: 'Quote', es: 'Cotizacion' }) : `${tier.unitPrice}$/u`}
                </span>
              </button>
            );
          })}
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
            <span className="text-grey-muted text-xs block mt-0.5">
              {tx({ fr: 'Si vous n\'avez pas de design pret', en: 'If you don\'t have a ready design', es: 'Si no tienes un diseno listo' })}
            </span>
          </div>
          <span className="text-accent font-semibold text-sm flex-shrink-0">+{sublimationDesignPrice}$</span>
        </label>
      </div>

      {/* File upload + Notes side by side */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-3 md:gap-4 mb-4 md:mb-5">
        <FileUpload
          files={uploadedFiles}
          onFilesChange={setUploadedFiles}
          label={tx({ fr: 'Votre design', en: 'Your design', es: 'Tu diseno' })}
          compact
        />
        <div>
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
            {tx({ fr: 'Notes / Description', en: 'Notes / Description', es: 'Notas / Descripcion' })}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={tx({ fr: 'Décrivez le produit souhaité (taille, couleur, placement...)', en: 'Describe the desired product (size, color, placement...)', es: 'Describe el producto deseado (talla, color, ubicacion...)' })}
            className="w-full min-h-[80px] md:min-h-[100px] rounded-lg border-2 border-grey-muted/20 bg-transparent px-3 py-2.5 md:px-4 md:py-3 text-sm text-heading placeholder:text-grey-muted/50 focus:border-accent focus:outline-none transition-colors resize-none"
          />
        </div>
      </div>

      {/* Price display */}
      {priceInfo && !priceInfo.surSoumission && (
        <div className="p-4 md:p-5 rounded-xl mb-4 md:mb-5 highlight-bordered">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl md:text-3xl font-heading font-bold text-heading">{priceInfo.price}$</span>
            <span className="text-grey-muted text-xs md:text-sm">
              ({priceInfo.unitPrice.toFixed(2)}$/{tx({ fr: 'unite', en: 'unit', es: 'unidad' })})
            </span>
          </div>
          {withDesign && (
            <div className="text-grey-muted text-xs mt-1">
              {tx({
                fr: `${priceInfo.qty}x ${productLabel?.labelFr} ${priceInfo.basePrice}$ + Design ${priceInfo.designPrice}$`,
                en: `${priceInfo.qty}x ${productLabel?.labelEn} ${priceInfo.basePrice}$ + Design ${priceInfo.designPrice}$`,
                es: `${priceInfo.qty}x ${productLabel?.labelEs || productLabel?.labelEn} ${priceInfo.basePrice}$ + Diseno ${priceInfo.designPrice}$`,
              })}
            </div>
          )}
          {hasColors && (
            <div className="text-grey-muted text-xs mt-1">
              {colorObj.name}{hasSizes ? ` / ${selectedSize}` : ''}
            </div>
          )}
          <div className="text-grey-muted text-xs mt-2">
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
          <div className="text-grey-muted text-xs mt-1">
            {tx({
              fr: `${priceInfo.qty}+ unités - à partir de ${priceInfo.unitPrice}$/unité`,
              en: `${priceInfo.qty}+ units - from ${priceInfo.unitPrice}$/unit`,
              es: `${priceInfo.qty}+ unidades - desde ${priceInfo.unitPrice}$/unidad`,
            })}
          </div>
        </div>
      )}

      {/* Add to cart or contact */}
      {priceInfo && !priceInfo.surSoumission ? (
        <>
          <button onClick={handleAddToCart} disabled={!canAddToCart} className={`btn-primary w-full justify-center text-sm md:text-base py-3 md:py-3.5 mb-2 md:mb-3 ${!canAddToCart ? 'opacity-40 cursor-not-allowed' : ''}`}>
            {added ? (
              <><Check size={18} className="mr-2" />{tx({ fr: 'Ajoute!', en: 'Added!', es: 'Agregado!' })}</>
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

export default ConfiguratorSublimation;
