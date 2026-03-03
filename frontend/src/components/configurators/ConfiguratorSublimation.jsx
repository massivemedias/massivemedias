import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Check, Palette } from 'lucide-react';
import ColorDropdown from '../ColorDropdown';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useLang } from '../../i18n/LanguageContext';
import { useProduct } from '../../hooks/useProducts';
import FileUpload from '../FileUpload';
import {
  sublimationProducts as defaultProducts, sublimationPriceTiers as defaultPriceTiers, sublimationDesignPrice as defaultDesignPrice,
  getSublimationPrice as defaultGetPrice, sublimationImages,
} from '../../data/products';
import { merchColors, merchSizes, getTshirtImage, hoodieColors, getHoodieImage, crewneckColors, getCrewneckImage, totebagColors, getTotebagImage } from '../../data/merchData';

// Products that support color selection
const productsWithColors = ['tshirt', 'hoodie', 'crewneck', 'totebag'];
// Products that also have size selection
const productsWithSizes = ['tshirt', 'hoodie', 'crewneck'];

function ConfiguratorSublimation() {
  const { lang } = useLang();
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
  const [selectedColor, setSelectedColor] = useState('orchid');
  const [selectedSize, setSelectedSize] = useState('M');

  const tiers = sublimationPriceTiers[product] || [];
  const priceInfo = getSublimationPrice(product, qtyIndex, withDesign);
  const productLabel = sublimationProducts.find(p => p.id === product);

  const hasColors = productsWithColors.includes(product);
  const hasSizes = productsWithSizes.includes(product);
  const colorsMap = { tshirt: merchColors, hoodie: hoodieColors, crewneck: crewneckColors, totebag: totebagColors };
  const imageMap = { tshirt: getTshirtImage, hoodie: getHoodieImage, crewneck: getCrewneckImage, totebag: getTotebagImage };
  const currentColors = colorsMap[product] || merchColors;
  const currentGetImage = imageMap[product] || getTshirtImage;
  const colorObj = currentColors.find(c => c.id === selectedColor) || currentColors[0];

  // Preferred default color per product type
  const defaultColorMap = { tshirt: 'orchid', hoodie: 'orchid', crewneck: 'orchid', totebag: 'lavender' };

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

  const handleAddToCart = () => {
    if (!priceInfo) return;
    addToCart({
      productId: `sublimation-${product}`,
      productName: lang === 'fr'
        ? `${productLabel?.labelFr} Sublimation`
        : `Sublimation ${productLabel?.labelEn}`,
      finish: [
        withDesign ? (lang === 'fr' ? 'Avec design' : 'With design') : (lang === 'fr' ? 'Design fourni' : 'Design provided'),
        hasColors ? colorObj.name : null,
      ].filter(Boolean).join(' - '),
      shape: null,
      size: hasSizes ? selectedSize : (lang === 'fr' ? productLabel?.labelFr : productLabel?.labelEn),
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
      <div className="mb-5">
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          {lang === 'fr' ? 'Produit' : 'Product'}
        </label>
        <div className="flex flex-wrap gap-2">
          {sublimationProducts.map(p => (
            <button
              key={p.id}
              onClick={() => handleProductChange(p.id)}
              className={`flex flex-col items-center justify-center min-w-[7rem] py-2.5 px-3 rounded-lg text-xs font-medium transition-all border-2 ${product === p.id
                ? 'border-accent option-selected'
                : 'border-transparent hover:border-grey-muted/30 option-default'
              }`}
            >
              <span className="text-heading leading-tight text-center font-semibold">
                {lang === 'fr' ? p.labelFr : p.labelEn}
              </span>
              {p.descFr && (
                <span className="text-grey-muted mt-0.5 text-[10px]">
                  {lang === 'fr' ? p.descFr : p.descEn}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Color + Size + Preview for textile products */}
      {hasColors && (
        <div className="mb-5">
          {/* Side by side: preview + selectors */}
          <div className={`flex gap-5 ${hasColors ? 'flex-row items-start' : 'flex-col'}`}>
            {/* Product preview */}
            {hasColors && (
              <div className="flex-shrink-0 w-48 rounded-xl card-bg-bordered p-3 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={`${product}-${selectedColor}`}
                    src={currentGetImage(selectedColor)}
                    alt={`${productLabel ? (lang === 'fr' ? productLabel.labelFr : productLabel.labelEn) : product} ${colorObj.name}`}
                    className="w-full h-auto object-contain"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                </AnimatePresence>
              </div>
            )}

            {/* Color + Size selectors */}
            <div className="flex-1 min-w-0 space-y-4">
              <ColorDropdown
                colors={currentColors}
                selected={selectedColor}
                onChange={setSelectedColor}
                label={lang === 'fr' ? 'Couleur' : 'Color'}
              />

              {hasSizes && (
                <div>
                  <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
                    {lang === 'fr' ? 'Taille' : 'Size'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {merchSizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[3.5rem] py-2.5 px-3 rounded-lg text-xs font-semibold transition-all border-2 ${
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

      {/* Quantity selector */}
      <div className="mb-5">
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          {lang === 'fr' ? 'Quantite' : 'Quantity'}
        </label>
        <div className="flex flex-wrap gap-2">
          {tiers.map((tier, i) => {
            const savings = i > 0 ? Math.round((1 - tier.unitPrice / tiers[0].unitPrice) * 100) : 0;
            return (
              <button
                key={tier.qty}
                onClick={() => setQtyIndex(i)}
                className={`flex flex-col items-center py-2.5 px-4 rounded-lg text-xs font-medium transition-all border-2 min-w-[5rem] relative ${qtyIndex === i
                  ? 'border-accent option-selected'
                  : 'border-transparent hover:border-grey-muted/30 option-default'
                }`}
              >
                {savings > 0 && (
                  <span className="absolute -top-2 -right-1 text-[9px] font-bold text-accent bg-accent/10 rounded-full px-1.5">
                    -{savings}%
                  </span>
                )}
                <span className="text-heading font-bold text-sm">{tier.qty}</span>
                <span className="text-grey-muted mt-0.5">
                  {tier.surSoumission ? (lang === 'fr' ? 'Sur soumission' : 'On quote') : `${tier.unitPrice}$/u`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Design option */}
      <div className="mb-6">
        <label className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all border-2 ${withDesign ? 'checkbox-active' : 'option-default'}`}>
          <input
            type="checkbox"
            checked={withDesign}
            onChange={(e) => setWithDesign(e.target.checked)}
            className="sr-only"
          />
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${withDesign ? 'bg-accent border-accent' : 'border-grey-muted/50'}`}>
            {withDesign && <Check size={14} className="text-white" />}
          </div>
          <div className="flex-1">
            <span className="text-heading font-medium text-sm flex items-center gap-1.5">
              <Palette size={14} className="text-accent" />
              {lang === 'fr' ? 'Creation graphique' : 'Graphic design'}
            </span>
            <span className="text-grey-muted text-xs block mt-0.5">
              {lang === 'fr' ? 'Si vous n\'avez pas de design pret' : 'If you don\'t have a ready design'}
            </span>
          </div>
          <span className="text-accent font-semibold text-sm">+{sublimationDesignPrice}$</span>
        </label>
      </div>

      {/* File upload + Notes side by side */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-4 mb-5">
        <FileUpload
          files={uploadedFiles}
          onFilesChange={setUploadedFiles}
          label={lang === 'fr' ? 'Votre design' : 'Your design'}
          compact
        />
        <div>
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
            {lang === 'fr' ? 'Notes / Description' : 'Notes / Description'}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder={lang === 'fr' ? 'Decrivez le produit souhaite (taille, couleur, placement...)' : 'Describe the desired product (size, color, placement...)'}
            className="w-full min-h-[100px] rounded-lg border-2 border-grey-muted/20 bg-transparent px-4 py-3 text-sm text-heading placeholder:text-grey-muted/50 focus:border-accent focus:outline-none transition-colors resize-none"
          />
        </div>
      </div>

      {/* Price display */}
      {priceInfo && !priceInfo.surSoumission && (
        <div className="p-5 rounded-xl mb-5 highlight-bordered">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-heading font-bold text-heading">{priceInfo.price}$</span>
            <span className="text-grey-muted text-sm">
              ({priceInfo.unitPrice.toFixed(2)}$/{lang === 'fr' ? 'unite' : 'unit'})
            </span>
          </div>
          {withDesign && (
            <div className="text-grey-muted text-xs mt-1">
              {lang === 'fr'
                ? `${priceInfo.qty}x ${productLabel?.labelFr} ${priceInfo.basePrice}$ + Design ${priceInfo.designPrice}$`
                : `${priceInfo.qty}x ${productLabel?.labelEn} ${priceInfo.basePrice}$ + Design ${priceInfo.designPrice}$`}
            </div>
          )}
          {hasColors && (
            <div className="text-grey-muted text-xs mt-1">
              {colorObj.name}{hasSizes ? ` / ${selectedSize}` : ''}
            </div>
          )}
          <div className="text-grey-muted text-xs mt-2">
            {lang === 'fr' ? 'Impression permanente - resistant au lavage' : 'Permanent print - wash resistant'}
          </div>
        </div>
      )}

      {/* Sur soumission display */}
      {priceInfo && priceInfo.surSoumission && (
        <div className="p-5 rounded-xl mb-5 highlight-bordered">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-heading font-bold text-heading">
              {lang === 'fr' ? 'Sur soumission' : 'On quote'}
            </span>
          </div>
          <div className="text-grey-muted text-xs mt-1">
            {lang === 'fr'
              ? `${priceInfo.qty}+ unites - a partir de ${priceInfo.unitPrice}$/unite`
              : `${priceInfo.qty}+ units - from ${priceInfo.unitPrice}$/unit`}
          </div>
        </div>
      )}

      {/* Add to cart or contact */}
      {priceInfo && !priceInfo.surSoumission ? (
        <>
          <button onClick={handleAddToCart} className="btn-primary w-full justify-center text-base py-3.5 mb-3">
            {added ? (
              <><Check size={20} className="mr-2" />{lang === 'fr' ? 'Ajoute au panier!' : 'Added to cart!'}</>
            ) : (
              <><ShoppingCart size={20} className="mr-2" />{lang === 'fr' ? 'Ajouter au panier' : 'Add to cart'}</>
            )}
          </button>

          <Link to="/panier" className="btn-outline w-full justify-center text-sm py-2.5">
            {lang === 'fr' ? 'Voir le panier' : 'View cart'}
          </Link>
        </>
      ) : (
        <a href="/contact" className="btn-primary w-full justify-center text-base py-3.5 mb-3">
          {lang === 'fr' ? 'Demander une soumission' : 'Request a quote'}
        </a>
      )}

      <p className="text-grey-muted text-xs mt-3 text-center">
        {lang === 'fr'
          ? 'Nous vous contacterons pour confirmer les details (taille, couleur, design).'
          : 'We\'ll contact you to confirm details (size, color, design).'}
      </p>
    </>
  );
}

export default ConfiguratorSublimation;
