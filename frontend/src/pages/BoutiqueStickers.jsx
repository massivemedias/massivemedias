import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, Check, Droplets, Scissors, ChevronDown,
  ChevronLeft, ChevronRight, X, Sparkles, Shield, Truck,
  Wrench, ZoomIn
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useLang } from '../i18n/LanguageContext';
import { useTheme } from '../i18n/ThemeContext';
import { toFull } from '../utils/paths';
import getServicesData from '../data/getServicesData';
import {
  stickerFinishes, stickerShapes, stickerSizes,
  stickerPriceTiers, getStickerPrice,
  stickerImages, stickerFaq
} from '../data/products';

function BoutiqueStickers() {
  const { lang } = useLang();
  const { theme } = useTheme();
  const { addToCart } = useCart();

  // Service data (process, equipment)
  const servicesData = getServicesData(lang);
  const stickerService = servicesData['stickers-custom'];

  // Configurator state
  const [finish, setFinish] = useState('matte');
  const [shape, setShape] = useState('round');
  const [size, setSize] = useState('2.5in');
  const [qtyIndex, setQtyIndex] = useState(0);
  const [added, setAdded] = useState(false);

  // Gallery state
  const [mainImage, setMainImage] = useState(0);
  const [lightbox, setLightbox] = useState(null);

  // FAQ state
  const [openFaq, setOpenFaq] = useState(null);

  const tiers = stickerPriceTiers;
  const currentTier = tiers[qtyIndex] || tiers[0];
  const priceInfo = getStickerPrice(finish, shape, currentTier.qty);

  const finishLabel = stickerFinishes.find(f => f.id === finish);
  const shapeLabel = stickerShapes.find(s => s.id === shape);
  const sizeLabel = stickerSizes.find(s => s.id === size)?.label;
  const unitLabel = 'sticker';

  const handleAddToCart = () => {
    addToCart({
      productId: 'sticker-custom',
      productName: lang === 'fr' ? 'Sticker Custom' : 'Custom Sticker',
      finish: lang === 'fr' ? finishLabel?.labelFr : finishLabel?.labelEn,
      shape: lang === 'fr' ? shapeLabel?.labelFr : shapeLabel?.labelEn,
      size: sizeLabel,
      quantity: priceInfo.qty,
      unitPrice: priceInfo.unitPrice,
      totalPrice: priceInfo.price,
      image: stickerImages[0],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleShapeChange = (s) => {
    setShape(s);
    setQtyIndex(0);
  };

  const prevImage = useCallback(() => {
    setMainImage(i => (i - 1 + stickerImages.length) % stickerImages.length);
  }, []);

  const nextImage = useCallback(() => {
    setMainImage(i => (i + 1) % stickerImages.length);
  }, []);

  const faq = stickerFaq[lang] || stickerFaq.fr;

  const trustItems = [
    { icon: Scissors, fr: 'Découpe précision', en: 'Precision cutting' },
    { icon: Shield, fr: 'Durabilité 3-5 ans', en: '3-5 year durability' },
    { icon: Sparkles, fr: 'Design inclus', en: 'Design included' },
    { icon: Truck, fr: 'Livraison locale gratuite', en: 'Free local delivery' },
  ];

  const features = [
    { icon: Scissors, fr: 'Découpe de précision', en: 'Precision cutting', descFr: 'Contour cut professionnel à la forme exacte de votre design. Équipement pro jusqu\'à 12" de large.', descEn: 'Professional contour cutting to the exact shape of your design. Pro equipment up to 12" wide.' },
    { icon: Droplets, fr: 'Résistant à tout', en: 'Weather resistant', descFr: 'Lamination intégrée. Eau, UV, rayures — vos stickers durent 3 à 5 ans en extérieur.', descEn: 'Integrated lamination. Water, UV, scratches — your stickers last 3-5 years outdoors.' },
    { icon: Sparkles, fr: 'Design inclus', en: 'Design included', descFr: 'Création ou adaptation graphique incluse dans tous les prix. On optimise votre design pour l\'impression.', descEn: 'Graphic creation or adaptation included in all prices. We optimize your design for printing.' },
  ];

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'Stickers Custom — Boutique | Massive Medias' : 'Custom Stickers — Shop | Massive Medias'}</title>
        <meta name="description" content={lang === 'fr'
          ? 'Commandez vos stickers custom. Vinyle matte, glossy, transparent, holographique. Découpe de précision. Design inclus.'
          : 'Order your custom stickers. Matte, glossy, clear, holographic vinyl. Precision cutting. Design included.'
        } />
      </Helmet>

      <div className="section-container pt-28 max-w-7xl mx-auto">

        {/* ============ BREADCRUMB ============ */}
        <div className="flex items-center gap-2 mb-8 text-sm">
          <Link to="/" className="text-grey-muted hover:text-magenta transition-colors">
            {lang === 'fr' ? 'Accueil' : 'Home'}
          </Link>
          <span className="text-grey-muted">/</span>
          <Link to="/boutique" className="text-grey-muted hover:text-magenta transition-colors">
            {lang === 'fr' ? 'Boutique' : 'Shop'}
          </Link>
          <span className="text-grey-muted">/</span>
          <span className="text-heading font-medium">Stickers</span>
        </div>

        {/* ============ HERO PRODUCT (2 cols) ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 mb-16">

          {/* LEFT — Gallery */}
          <div className="lg:col-span-7">
            <div className="relative rounded-xl overflow-hidden mb-4 cursor-pointer group" style={{ aspectRatio: '4/3' }} onClick={() => setLightbox(mainImage)}>
              <img
                src={stickerImages[mainImage]}
                alt="Sticker preview"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Design inclus badge */}
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-magenta text-white text-xs font-semibold flex items-center gap-1.5">
                <Sparkles size={14} />
                {lang === 'fr' ? 'Design inclus' : 'Design included'}
              </div>
              <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-heading transition-colors" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
                <ChevronLeft size={20} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-heading transition-colors" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {stickerImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setMainImage(i)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${mainImage === i ? 'border-magenta' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT — Configurator (sticky on desktop) */}
          <div className="lg:col-span-5 sticky-config">
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-2">
              {lang === 'fr' ? 'Stickers Custom' : 'Custom Stickers'}
            </h1>
            <p className="text-grey-muted mb-4">
              {lang === 'fr'
                ? 'Autocollants découpés sur mesure. Design graphique inclus.'
                : 'Custom die-cut stickers. Graphic design included.'}
            </p>
            <div className="w-10 h-0.5 bg-magenta mb-6" />

            {/* Finish selector — MOO tile style */}
            <div className="mb-5">
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
                {lang === 'fr' ? 'Finition' : 'Finish'}
              </label>
              <div className="flex flex-wrap gap-2">
                {stickerFinishes.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFinish(f.id)}
                    className={`flex flex-col items-center justify-center min-w-[4.5rem] py-2.5 px-3 rounded-lg text-xs font-medium transition-all border-2 ${finish === f.id
                      ? 'border-magenta'
                      : 'border-transparent hover:border-grey-muted/30'
                    }`}
                    style={{ background: finish === f.id ? 'var(--highlight-bg)' : 'var(--bg-glass)' }}
                  >
                    <span className={`w-4 h-4 rounded-full mb-1.5 border ${
                      f.id === 'matte' ? 'bg-gray-400 border-gray-400' :
                      f.id === 'glossy' ? 'bg-white border-gray-300 shadow-sm' :
                      f.id === 'transparent' ? 'bg-transparent border-gray-300 border-dashed' :
                      'bg-gradient-to-br from-pink-300 via-purple-300 to-cyan-300 border-transparent'
                    }`} />
                    <span className="text-heading leading-tight text-center">
                      {lang === 'fr' ? f.labelFr.replace('Vinyle ', '') : f.labelEn.replace(' Vinyl', '')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Shape selector — MOO tile style */}
            <div className="mb-5">
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
                {lang === 'fr' ? 'Forme' : 'Shape'}
              </label>
              <div className="flex flex-wrap gap-2">
                {stickerShapes.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleShapeChange(s.id)}
                    className={`flex flex-col items-center justify-center min-w-[4.5rem] py-2.5 px-3 rounded-lg text-xs font-medium transition-all border-2 ${shape === s.id
                      ? 'border-magenta'
                      : 'border-transparent hover:border-grey-muted/30'
                    }`}
                    style={{ background: shape === s.id ? 'var(--highlight-bg)' : 'var(--bg-glass)' }}
                  >
                    <span className={`mb-1.5 ${
                      s.id === 'round' ? 'w-4 h-4 rounded-full border-2 border-current' :
                      s.id === 'square' ? 'w-4 h-4 rounded-sm border-2 border-current' :
                      s.id === 'rectangle' ? 'w-5 h-3.5 rounded-sm border-2 border-current' :
                      'w-5 h-4 border-2 border-current border-dashed rounded-lg'
                    } text-grey-muted`} />
                    <span className="text-heading leading-tight text-center">
                      {lang === 'fr' ? s.labelFr : s.labelEn}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size selector */}
            <div className="mb-5">
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
                {lang === 'fr' ? 'Taille' : 'Size'}
              </label>
              <div className="flex flex-wrap gap-2">
                {stickerSizes.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSize(s.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${size === s.id
                      ? 'border-magenta text-heading'
                      : 'border-transparent text-heading hover:border-grey-muted/30'
                    }`}
                    style={{ background: size === s.id ? 'var(--highlight-bg)' : 'var(--bg-glass)' }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity selector — cards with price */}
            <div className="mb-6">
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
                {lang === 'fr' ? 'Quantité' : 'Quantity'}
              </label>
              <div className="flex flex-wrap gap-2">
                {tiers.map((tier, i) => {
                  const p = getStickerPrice(finish, shape, tier.qty);
                  return (
                    <button
                      key={tier.qty}
                      onClick={() => setQtyIndex(i)}
                      className={`flex flex-col items-center py-2.5 px-4 rounded-lg text-xs font-medium transition-all border-2 min-w-[5rem] ${qtyIndex === i
                        ? 'border-magenta'
                        : 'border-transparent hover:border-grey-muted/30'
                      }`}
                      style={{ background: qtyIndex === i ? 'var(--highlight-bg)' : 'var(--bg-glass)' }}
                    >
                      <span className="text-heading font-bold text-sm">
                        {tier.qty}
                      </span>
                      <span className="text-grey-muted mt-0.5">
                        {p ? `${p.price}$` : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price display */}
            {priceInfo && (
              <div className="p-5 rounded-xl mb-5" style={{ background: 'var(--highlight-bg)', border: '1px solid var(--bg-card-border)' }}>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-heading font-bold text-heading">{priceInfo.price}$</span>
                  <span className="text-grey-muted text-sm">
                    ({priceInfo.unitPrice.toFixed(2)}$/{unitLabel})
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {finish === 'holographic' && (
                    <span className="text-magenta text-xs font-medium">
                      {lang === 'fr' ? 'Holographique +15%' : 'Holographic +15%'}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-magenta/10 text-magenta">
                    <Sparkles size={12} />
                    {lang === 'fr' ? 'Design inclus' : 'Design included'}
                  </span>
                </div>
              </div>
            )}

            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              className="btn-primary w-full justify-center text-base py-3.5 mb-3"
            >
              {added ? (
                <>
                  <Check size={20} className="mr-2" />
                  {lang === 'fr' ? 'Ajouté au panier!' : 'Added to cart!'}
                </>
              ) : (
                <>
                  <ShoppingCart size={20} className="mr-2" />
                  {lang === 'fr' ? 'Ajouter au panier' : 'Add to cart'}
                </>
              )}
            </button>

            <Link to="/panier" className="btn-outline w-full justify-center text-sm py-2.5">
              {lang === 'fr' ? 'Voir le panier' : 'View cart'}
            </Link>

            <p className="text-grey-muted text-xs mt-3 text-center">
              {lang === 'fr'
                ? 'Nous vous contacterons pour confirmer les détails et organiser le paiement.'
                : 'We\'ll contact you to confirm details and arrange payment.'}
            </p>
          </div>
        </div>
      </div>

      {/* ============ TRUST BAR (full width) ============ */}
      <div className="py-6 mb-16" style={{ background: 'var(--highlight-bg)', borderTop: '1px solid var(--bg-card-border)', borderBottom: '1px solid var(--bg-card-border)' }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center flex-wrap gap-x-8 gap-y-3">
          {trustItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-3">
                {i > 0 && <div className="trust-divider hidden sm:block" />}
                <Icon size={18} className="text-magenta flex-shrink-0" />
                <span className="text-sm text-grey-muted font-medium">
                  {lang === 'fr' ? item.fr : item.en}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section-container max-w-7xl mx-auto">

        {/* ============ FEATURES (3 cols) ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-3 text-center">
            {lang === 'fr' ? 'Pourquoi nos stickers?' : 'Why our stickers?'}
          </h2>
          <p className="text-grey-muted text-center mb-10 max-w-xl mx-auto">
            {lang === 'fr'
              ? 'Des autocollants professionnels conçus pour durer.'
              : 'Professional stickers built to last.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="p-6 rounded-xl border-t-2 border-magenta"
                  style={{ background: 'var(--bg-glass)', border: '1px solid var(--bg-card-border)', borderTop: '2px solid #FF52A0' }}
                >
                  <div className="mb-4 p-3.5 rounded-lg w-fit" style={{ background: 'var(--icon-bg)' }}>
                    <Icon size={28} className="text-magenta" />
                  </div>
                  <h3 className="font-heading font-bold text-heading text-lg mb-2">
                    {lang === 'fr' ? feature.fr : feature.en}
                  </h3>
                  <p className="text-grey-muted text-sm leading-relaxed">
                    {lang === 'fr' ? feature.descFr : feature.descEn}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ============ PROCESS (Comment ça marche) ============ */}
        {stickerService?.process && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-3 text-center">
              {lang === 'fr' ? 'Comment ça marche' : 'How it works'}
            </h2>
            <p className="text-grey-muted text-center mb-10 max-w-xl mx-auto">
              {lang === 'fr'
                ? 'De votre idée à vos stickers en 6 étapes simples.'
                : 'From your idea to your stickers in 6 simple steps.'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stickerService.process.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  viewport={{ once: true }}
                  className="p-6 rounded-xl relative"
                  style={{ background: 'var(--bg-glass)', border: '1px solid var(--bg-card-border)' }}
                >
                  <div className="absolute -top-3 -left-1 process-step-number">
                    {item.step}
                  </div>
                  <h3 className="text-heading font-heading font-bold text-lg mt-2 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-grey-muted text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ============ EQUIPMENT ============ */}
        {stickerService?.equipment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-10 text-center flex items-center justify-center gap-3">
              <Wrench size={28} className="text-magenta" />
              {lang === 'fr' ? 'Notre équipement' : 'Our equipment'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {stickerService.equipment.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="p-6 rounded-xl text-center"
                  style={{ background: 'var(--bg-glass)', border: '1px solid var(--bg-card-border)' }}
                >
                  <h4 className="text-heading font-heading font-bold mb-2">{item.name}</h4>
                  <p className="text-grey-muted text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ============ GALLERY ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-10 text-center">
            {lang === 'fr' ? 'Exemples de réalisations' : 'Examples of our work'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {stickerImages.map((imgSrc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                viewport={{ once: true }}
                className="relative rounded-xl overflow-hidden cursor-pointer group"
                style={{ aspectRatio: '1/1' }}
                onClick={() => setLightbox(i)}
              >
                <img src={imgSrc} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <ZoomIn size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ============ FAQ ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20 max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-10 text-center">
            {lang === 'fr' ? 'Questions fréquentes' : 'Frequently asked questions'}
          </h2>
          <div className="space-y-3">
            {faq.map((item, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden transition-all"
                style={{
                  border: '1px solid var(--bg-card-border)',
                  borderLeft: openFaq === i ? '3px solid #FF52A0' : '1px solid var(--bg-card-border)',
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left transition-colors"
                  style={{ background: openFaq === i ? 'var(--highlight-bg)' : 'transparent' }}
                >
                  <span className="font-semibold text-heading pr-4">{item.q}</span>
                  <ChevronDown size={20} className={`text-grey-muted flex-shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-grey-light text-sm leading-relaxed">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ============ CTA + Services connexes ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center p-12 rounded-2xl mb-8"
          style={{ background: 'var(--cta-text-bg)', border: '1px solid var(--bg-card-border)' }}
        >
          <h2 className="text-3xl font-heading font-bold text-heading mb-4">
            {lang === 'fr' ? 'Besoin d\'un projet custom?' : 'Need a custom project?'}
          </h2>
          <p className="text-grey-light text-lg mb-8 max-w-2xl mx-auto">
            {lang === 'fr'
              ? 'Quantités spéciales, matériaux particuliers ou design complexe? Contactez-nous pour un devis sur mesure.'
              : 'Special quantities, unique materials, or complex design? Contact us for a custom quote.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <Link to="/contact" className="btn-primary">
              {lang === 'fr' ? 'Demander un devis' : 'Request a quote'}
            </Link>
            <Link to="/services" className="btn-outline">
              {lang === 'fr' ? 'Voir nos services' : 'View our services'}
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link to="/services/design-graphique" className="text-grey-muted hover:text-magenta transition-colors">
              Design Graphique
            </Link>
            <span className="text-grey-muted/30">·</span>
            <Link to="/services/impression-fine-art" className="text-grey-muted hover:text-magenta transition-colors">
              {lang === 'fr' ? 'Impression Fine Art' : 'Fine Art Print'}
            </Link>
            <span className="text-grey-muted/30">·</span>
            <Link to="/services/sublimation-merch" className="text-grey-muted hover:text-magenta transition-colors">
              Sublimation & Merch
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ============ LIGHTBOX ============ */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + stickerImages.length) % stickerImages.length); }}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white w-12 h-12 flex items-center justify-center"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % stickerImages.length); }}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white w-12 h-12 flex items-center justify-center"
            >
              <ChevronRight size={32} />
            </button>
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 text-white/70 hover:text-white w-10 h-10 flex items-center justify-center"
            >
              <X size={28} />
            </button>
            <img
              src={toFull(stickerImages[lightbox])}
              alt=""
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default BoutiqueStickers;
