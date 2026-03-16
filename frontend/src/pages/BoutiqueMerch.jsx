import { useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Check, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
import ColorDropdown from '../components/ColorDropdown';
import { useLang } from '../i18n/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useProduct } from '../hooks/useProducts';
import {
  merchColors, merchSizes, merchTshirtPrice, getTshirtImage,
  hoodieColors, merchHoodiePrice, getHoodieImage,
  crewneckColors, merchCrewneckPrice, getCrewneckImage,
} from '../data/merchData';

const merchConfig = {
  tshirt: {
    colors: merchColors,
    sizes: merchSizes,
    price: merchTshirtPrice,
    getImage: getTshirtImage,
    defaultColor: 'orchid',
    cmsSlug: 'merch-tshirt',
    label: { fr: 'T-Shirt Massive', en: 'Massive T-Shirt', es: 'Camiseta Massive' },
    subtitle: {
      fr: '60+ couleurs disponibles. Coton preshrunk, impression durable.',
      en: '60+ colors available. Preshrunk cotton, durable print.',
      es: '60+ colores disponibles. Algodón preencogido, impresión duradera.',
    },
    seoDesc: {
      fr: 'T-Shirt Massive. 60+ couleurs, tailles S à 3XL.',
      en: 'Massive T-Shirt. 60+ colors, sizes S to 3XL.',
      es: 'Camiseta Massive. 60+ colores, tallas S a 3XL.',
    },
  },
  hoodie: {
    colors: hoodieColors,
    sizes: merchSizes,
    price: merchHoodiePrice,
    getImage: getHoodieImage,
    defaultColor: 'mint-green',
    cmsSlug: 'merch-hoodie',
    label: { fr: 'Hoodie Massive', en: 'Massive Hoodie', es: 'Sudadera Massive' },
    subtitle: {
      fr: '40+ couleurs disponibles. Molleton épais, impression durable.',
      en: '40+ colors available. Heavy fleece, durable print.',
      es: '40+ colores disponibles. Forro polar grueso, impresión duradera.',
    },
    seoDesc: {
      fr: 'Hoodie Massive. 40+ couleurs, tailles S à 3XL.',
      en: 'Massive Hoodie. 40+ colors, sizes S to 3XL.',
      es: 'Sudadera Massive. 40+ colores, tallas S a 3XL.',
    },
  },
  crewneck: {
    colors: crewneckColors,
    sizes: merchSizes,
    price: merchCrewneckPrice,
    getImage: getCrewneckImage,
    defaultColor: 'light-pink',
    cmsSlug: 'merch-crewneck',
    label: { fr: 'Crewneck Massive', en: 'Massive Crewneck', es: 'Sudadera Massive' },
    subtitle: {
      fr: '30+ couleurs disponibles. Molleton mi-poids, impression durable.',
      en: '30+ colors available. Midweight fleece, durable print.',
      es: '30+ colores disponibles. Forro polar de peso medio, impresión duradera.',
    },
    seoDesc: {
      fr: 'Crewneck Massive. 30+ couleurs, tailles S à 3XL.',
      en: 'Massive Crewneck. 30+ colors, sizes S to 3XL.',
      es: 'Sudadera cuello redondo Massive. 30+ colores, tallas S a 3XL.',
    },
  },
};

function BoutiqueMerch() {
  const { type } = useParams();
  const config = merchConfig[type];

  if (!config) return <Navigate to="/boutique" replace />;

  return <MerchPage key={type} config={config} type={type} />;
}

function MerchPage({ config, type }) {
  const { tx } = useLang();
  const { addToCart } = useCart();
  const cmsProduct = useProduct(config.cmsSlug);
  const pd = cmsProduct?.pricingData;

  const colors = pd?.colors || config.colors;
  const sizes = pd?.sizes || config.sizes;
  const pricing = pd?.price || config.price;

  const [selectedColor, setSelectedColor] = useState(config.defaultColor);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [notes, setNotes] = useState('');

  const colorObj = colors.find(c => c.id === selectedColor) || colors[0];
  const unitPrice = pricing.sizes[selectedSize] || pricing.base;
  const totalPrice = unitPrice * quantity;
  const productLabel = tx(config.label);

  const handleAddToCart = () => {
    addToCart({
      productId: `merch-${type}-${selectedColor}-${selectedSize}`,
      productName: productLabel,
      finish: colorObj.name,
      shape: null,
      size: selectedSize,
      quantity,
      unitPrice,
      totalPrice,
      image: config.getImage(selectedColor),
      notes,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      <SEO
        title={`${productLabel} Montreal | ${tx({ fr: 'Boutique Massive', en: 'Massive Shop', es: 'Tienda Massive' })}`}
        description={tx(config.seoDesc)}
        breadcrumbs={[
          { name: tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' }), url: '/' },
          { name: tx({ fr: 'Boutique', en: 'Shop', es: 'Tienda' }), url: '/boutique' },
          { name: productLabel },
        ]}
      />

      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 hero-aurora"></div>
        <div className="relative z-10 section-container !py-0">
          <Link to="/boutique" className="inline-flex items-center gap-2 text-sm text-grey-muted hover:text-accent transition-colors mb-6">
            <ArrowLeft size={16} />
            {tx({ fr: 'Retour à la boutique', en: 'Back to shop', es: 'Volver a la tienda' })}
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-heading mb-3">
              {productLabel}
            </h1>
            <p className="text-lg text-grey-light max-w-2xl">
              {tx(config.subtitle)}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="section-container max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,minmax(0,380px)] gap-8 lg:gap-14 items-start">

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="lg:sticky lg:top-24"
          >
            <div className="rounded-2xl card-bg-bordered p-6 md:p-10 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedColor}
                  src={config.getImage(selectedColor)}
                  alt={`${productLabel} ${colorObj.name}`}
                  className="w-full h-auto object-contain max-h-[500px] mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </AnimatePresence>
            </div>
            <p className="text-center text-grey-muted text-sm mt-3 font-medium">{colorObj.name}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-5"
          >
            <ColorDropdown
              colors={colors}
              selected={selectedColor}
              onChange={setSelectedColor}
              label={tx({ fr: 'Couleur', en: 'Color', es: 'Color' })}
            />

            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
                {tx({ fr: 'Taille', en: 'Size', es: 'Talla' })}
              </label>
              <div className="flex flex-wrap gap-2">
                {sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[3.5rem] py-2.5 px-4 rounded-lg text-sm font-semibold transition-all border-2 ${
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

            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
                {tx({ fr: 'Quantité', en: 'Quantity', es: 'Cantidad' })}
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-lg border border-white/10 text-heading font-bold text-lg flex items-center justify-center hover:border-accent/50 transition-colors"
                >
                  -
                </button>
                <span className="text-heading font-bold text-lg w-10 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-10 rounded-lg border border-white/10 text-heading font-bold text-lg flex items-center justify-center hover:border-accent/50 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
                {tx({ fr: 'Notes / Instructions', en: 'Notes / Instructions', es: 'Notas / Instrucciones' })}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder={tx({ fr: 'Taille exacte, coupe, détails...', en: 'Exact fit, cut, details...', es: 'Talla exacta, corte, detalles...' })}
                className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-heading placeholder:text-grey-muted/40 focus:border-accent/40 focus:outline-none transition-colors resize-none"
              />
            </div>

            <div className="p-5 rounded-xl highlight-bordered">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-heading font-bold text-heading">{totalPrice}$</span>
                {quantity > 1 && (
                  <span className="text-grey-muted text-sm">
                    ({unitPrice}$ x {quantity})
                  </span>
                )}
              </div>
              <div className="text-grey-muted text-xs mt-1">
                {colorObj.name} / {selectedSize}
              </div>
            </div>

            <button onClick={handleAddToCart} className="btn-primary w-full justify-center text-base py-3.5">
              {added ? (
                <><Check size={20} className="mr-2" />{tx({ fr: 'Ajouté au panier!', en: 'Added to cart!', es: 'Agregado al carrito!' })}</>
              ) : (
                <><ShoppingCart size={20} className="mr-2" />{tx({ fr: 'Ajouter au panier', en: 'Add to cart', es: 'Agregar al carrito' })}</>
              )}
            </button>

            <Link to="/panier" className="btn-outline w-full justify-center text-sm py-2.5">
              {tx({ fr: 'Voir le panier', en: 'View cart', es: 'Ver el carrito' })}
            </Link>

            <p className="text-grey-muted text-xs text-center">
              {tx({
                fr: 'Nous vous contacterons pour confirmer les détails avant production.',
                en: 'We\'ll contact you to confirm details before production.',
                es: 'Nos comunicaremos contigo para confirmar los detalles antes de la producción.',
              })}
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}

export default BoutiqueMerch;
