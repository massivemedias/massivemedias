import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingCart, Check, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
import ColorDropdown from '../components/ColorDropdown';
import { useLang } from '../i18n/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { merchColors, merchSizes, merchTshirtPrice, getTshirtImage } from '../data/merchData';

function BoutiqueMerchTshirt() {
  const { lang } = useLang();
  const { addToCart } = useCart();

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
      productName: lang === 'fr' ? 'T-Shirt Massive' : 'Massive T-Shirt',
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
        title={lang === 'fr' ? 'T-Shirt Massive | Boutique' : 'Massive T-Shirt | Shop'}
        description={lang === 'fr'
          ? 'T-Shirt Massive Medias. 60+ couleurs, tailles S a 3XL.'
          : 'Massive Medias T-Shirt. 60+ colors, sizes S to 3XL.'}
        breadcrumbs={[
          { name: lang === 'fr' ? 'Accueil' : 'Home', url: '/' },
          { name: lang === 'fr' ? 'Boutique' : 'Shop', url: '/boutique' },
          { name: 'T-Shirt' },
        ]}
      />

      {/* Hero compact */}
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 hero-aurora"></div>
        <div className="relative z-10 section-container !py-0">
          <Link to="/boutique" className="inline-flex items-center gap-2 text-sm text-grey-muted hover:text-accent transition-colors mb-6">
            <ArrowLeft size={16} />
            {lang === 'fr' ? 'Retour a la boutique' : 'Back to shop'}
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
              {lang === 'fr'
                ? '60+ couleurs disponibles. Coton preshrunk, impression durable.'
                : '60+ colors available. Preshrunk cotton, durable print.'}
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
            <div className="rounded-2xl card-bg-bordered p-6 md:p-10">
              <img
                key={selectedColor}
                src={getTshirtImage(selectedColor)}
                alt={`T-Shirt ${colorObj.name}`}
                className="w-full h-auto object-contain max-h-[500px] mx-auto"
              />
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
            <ColorDropdown
              colors={merchColors}
              selected={selectedColor}
              onChange={setSelectedColor}
              label={lang === 'fr' ? 'Couleur' : 'Color'}
            />

            {/* Size */}
            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
                {lang === 'fr' ? 'Taille' : 'Size'}
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
                {lang === 'fr' ? 'Quantite' : 'Quantity'}
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
                {lang === 'fr' ? 'Notes / Instructions' : 'Notes / Instructions'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder={lang === 'fr' ? 'Taille exacte, coupe, details...' : 'Exact fit, cut, details...'}
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
                <><Check size={20} className="mr-2" />{lang === 'fr' ? 'Ajoute au panier!' : 'Added to cart!'}</>
              ) : (
                <><ShoppingCart size={20} className="mr-2" />{lang === 'fr' ? 'Ajouter au panier' : 'Add to cart'}</>
              )}
            </button>

            <Link to="/panier" className="btn-outline w-full justify-center text-sm py-2.5">
              {lang === 'fr' ? 'Voir le panier' : 'View cart'}
            </Link>

            <p className="text-grey-muted text-xs text-center">
              {lang === 'fr'
                ? 'Nous vous contacterons pour confirmer les details avant production.'
                : 'We\'ll contact you to confirm details before production.'}
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}

export default BoutiqueMerchTshirt;
