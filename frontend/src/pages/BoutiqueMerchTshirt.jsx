import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingCart, Check, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
import ColorSwatches from '../components/ColorSwatches';
import { useLang } from '../i18n/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useProduct } from '../hooks/useProducts';
import { merchColors as defaultColors, merchSizes as defaultSizes, merchTshirtPrice as defaultPrice, getTshirtImage } from '../data/merchData';

function BoutiqueMerchTshirt() {
  const { lang, tx } = useLang();
  const { addToCart } = useCart();
  const cmsProduct = useProduct('merch-tshirt');
  const pd = cmsProduct?.pricingData;

  const merchColors = defaultColors;
  const merchSizes = pd?.sizes || defaultSizes;
  const merchTshirtPrice = pd?.price || defaultPrice;

  const [selectedColor, setSelectedColor] = useState('black');
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [notes, setNotes] = useState('');

  const colorObj = merchColors.find(c => c.id === selectedColor) || merchColors[0];
  const unitPrice = merchTshirtPrice.sizes[selectedSize] || merchTshirtPrice.base;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    addToCart({
      productId: `merch-tshirt-${selectedColor}-${selectedSize}`,
      productName: tx({ fr: 'T-Shirt Massive', en: 'Massive T-Shirt', es: 'Camiseta Massive' }),
      finish: colorObj.name,
      shape: null,
      size: selectedSize,
      quantity,
      unitPrice,
      totalPrice,
      image: getTshirtImage(selectedColor),
      notes,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      <SEO
        title={tx({ fr: 'T-Shirt Sublimation Montréal | Massive', en: 'Sublimation T-Shirt Montreal | Massive', es: 'Camiseta Sublimacion Montreal | Massive' })}
        description={tx({
          fr: 'T-Shirt sublimation Massive à Montréal. 8 couleurs, tailles S à 3XL. Impression full-color permanente. Production locale Mile-End.',
          en: 'Sublimation T-Shirt by Massive in Montreal. 8 colors, sizes S to 3XL. Permanent full-color print. Local production Mile-End.',
          es: 'Camiseta sublimacion de Massive en Montreal. 8 colores, tallas S a 3XL. Impresion full-color permanente. Produccion local Mile-End.',
        })}
        breadcrumbs={[
          { name: tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' }), url: '/' },
          { name: tx({ fr: 'Boutique', en: 'Shop', es: 'Tienda' }), url: '/boutique' },
          { name: 'T-Shirt' },
        ]}
      />

      {/* Hero compact */}
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
              T-Shirt Massive
            </h1>
            <p className="text-lg text-grey-light max-w-2xl">
              {tx({
                fr: 'Coton preshrunk, impression sublimation durable. 8 couleurs.',
                en: 'Preshrunk cotton, durable sublimation print. 8 colors.',
                es: 'Algodón preencogido, impresión duradera. 8 colores.',
              })}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="section-container max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,minmax(0,380px)] gap-8 lg:gap-14 items-start">

          {/* ── Left: Product Photo ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="lg:sticky lg:top-24"
          >
            <div className="rounded-2xl bg-white p-6 md:p-10 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedColor}
                  src={getTshirtImage(selectedColor)}
                  alt={`T-Shirt ${colorObj.name}`}
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

          {/* ── Right: Configuration ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-5"
          >
            {/* Color */}
            <ColorSwatches
              colors={merchColors}
              selected={selectedColor}
              onChange={setSelectedColor}
              label={tx({ fr: 'Couleur', en: 'Color', es: 'Color' })}
            />

            {/* Size */}
            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
                {tx({ fr: 'Taille', en: 'Size', es: 'Talla' })}
              </label>
              <div className="flex flex-wrap gap-2">
                {merchSizes.map(size => (
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

            {/* Quantity */}
            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
                {tx({ fr: 'Quantite', en: 'Quantity', es: 'Cantidad' })}
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

            {/* Notes */}
            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
                {tx({ fr: 'Notes / Instructions', en: 'Notes / Instructions', es: 'Notas / Instrucciones' })}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder={tx({ fr: 'Taille exacte, coupe, details...', en: 'Exact fit, cut, details...', es: 'Talla exacta, corte, detalles...' })}
                className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-heading placeholder:text-grey-muted/40 focus:border-accent/40 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Price */}
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

            {/* Add to cart */}
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
                fr: 'Nous vous contacterons pour confirmer les details avant production.',
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

export default BoutiqueMerchTshirt;
