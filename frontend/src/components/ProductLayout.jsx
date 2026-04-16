import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown, ChevronLeft, ChevronRight, X,
  Sparkles, Wrench, ZoomIn
} from 'lucide-react';
import SEO from './SEO';
import { getFAQSchema, getServiceSchema, getProductSchema } from './seo/schemas';
import { useLang } from '../i18n/LanguageContext';
import { toFull } from '../utils/paths';
import getServicesData from '../data/getServicesData';
import { useServicePages } from '../hooks/useServicePages';

function ProductLayout({
  serviceSlug,
  pageTitle,
  metaDescription,
  productTitle,
  productSubtitle,
  badge,
  trustItems,
  features,
  featuresTitle,
  featuresSubtitle,
  useCases,
  images,
  faq,
  ctaLinks,
  galleryResetKey,
  containMainCount,
  startingPrice,
  children,
}) {
  const { lang, tx } = useLang();
  const servicesData = getServicesData(lang);
  const localService = servicesData[serviceSlug];
  const { servicePages } = useServicePages() || {};
  // Map legacy serviceSlug to CMS slug/boutiqueSlug
  const slugMap = { 'impression-fine-art': 'prints', 'stickers-custom': 'stickers', 'sublimation-merch': 'merch', 'design-graphique': 'design', 'developpement-web': 'web', 'flyers-cartes': 'prints' };
  const mappedSlug = slugMap[serviceSlug] || serviceSlug;
  const cmsPage = servicePages?.find(s => s.slug === mappedSlug || s.boutiqueSlug === mappedSlug || s.slug === serviceSlug || s.boutiqueSlug === serviceSlug);
  const cmsProcess = cmsPage?.[`process${lang === 'en' ? 'En' : 'Fr'}`] || cmsPage?.processFr || null;
  const cmsEquipment = cmsPage?.[`equipment${lang === 'en' ? 'En' : 'Fr'}`] || cmsPage?.equipmentFr || null;
  const service = {
    ...localService,
    process: cmsProcess?.length ? cmsProcess : localService?.process,
    equipment: cmsEquipment?.length ? cmsEquipment : localService?.equipment,
  };

  // Gallery state
  const [mainImage, setMainImage] = useState(0);
  const [lightbox, setLightbox] = useState(null);

  // Reset to first image when gallery content changes (e.g. finish selection)
  useEffect(() => {
    if (galleryResetKey !== undefined) setMainImage(0);
  }, [galleryResetKey]);

  // FAQ state
  const [openFaq, setOpenFaq] = useState(null);

  const prevImage = useCallback(() => {
    setMainImage(i => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const nextImage = useCallback(() => {
    setMainImage(i => (i + 1) % images.length);
  }, [images.length]);

  const faqData = faq[lang] || faq.en || faq.fr;
  const lt = (obj) => obj[lang] || obj.en || obj.fr;

  return (
    <>
      <SEO
        title={lt(pageTitle)}
        description={lt(metaDescription)}
        ogType="product"
        ogImage={images[0]}
        breadcrumbs={[
          { name: tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' }), url: '/' },
          { name: tx({ fr: 'Boutique', en: 'Shop', es: 'Tienda' }), url: '/boutique' },
          { name: lt(productTitle) },
        ]}
        jsonLd={[
          ...(faqData.length > 0 ? [getFAQSchema(faqData)] : []),
          getServiceSchema({
            name: lt(productTitle),
            description: lt(metaDescription),
            url: `/boutique/${slugMap[serviceSlug] || serviceSlug}`,
            priceRange: '$$',
          }),
          ...(startingPrice ? [getProductSchema({
            name: lt(productTitle),
            description: lt(metaDescription),
            price: startingPrice,
            image: images[0],
            url: `/boutique/${slugMap[serviceSlug] || serviceSlug}`,
          })] : []),
        ]}
      />

      <div className="section-container pt-28 max-w-7xl mx-auto">

        {/* ============ BREADCRUMB ============ */}
        <div className="flex items-center gap-2 mb-8 text-sm">
          <Link to="/" className="text-grey-muted hover:text-accent transition-colors">
            {tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' })}
          </Link>
          <span className="text-grey-muted">/</span>
          <Link to="/boutique" className="text-grey-muted hover:text-accent transition-colors">
            {tx({ fr: 'Boutique', en: 'Shop', es: 'Tienda' })}
          </Link>
          <span className="text-grey-muted">/</span>
          <span className="text-heading font-medium">{lt(productTitle)}</span>
        </div>

        {/* ============ HERO PRODUCT (2 cols) ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-10 mb-16">

          {/* LEFT - Gallery */}
          <div>
            <div
              className="relative rounded-xl overflow-hidden mb-4 cursor-pointer group aspect-[4/3]"
              onClick={() => setLightbox(mainImage)}
            >
              <img
                src={images[mainImage]}
                alt={lt(productTitle)}
                className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${containMainCount && mainImage < containMainCount ? 'object-contain p-4' : 'object-cover'}`}
              />
              {badge && (
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-accent text-white text-xs font-semibold flex items-center gap-1.5">
                  {badge.icon && <badge.icon size={14} />}
                  {lt(badge)}
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-heading transition-colors card-bg card-border"
                aria-label={tx({ fr: 'Image precedente', en: 'Previous image', es: 'Imagen anterior' })}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-heading transition-colors card-bg card-border"
                aria-label={tx({ fr: 'Image suivante', en: 'Next image', es: 'Siguiente imagen' })}
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setMainImage(i)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${mainImage === i ? 'border-accent' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt={`${productTitle} - ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT - Configurator (sticky on desktop) */}
          <div className="sticky-config">
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-2">
              {lt(productTitle)}
            </h1>
            <p className="text-grey-muted mb-4">
              {lt(productSubtitle)}
            </p>
            <div className="w-10 h-0.5 bg-accent mb-6" />

            {/* Service-specific configurator */}
            {children}
          </div>
        </div>
      </div>

      {/* ============ TRUST BAR (full width) ============ */}
      {trustItems && trustItems.length > 0 && (
        <div
          className="py-6 mb-16 highlight-border-y"
        >
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-center flex-wrap gap-x-8 gap-y-3">
            {trustItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  {i > 0 && <div className="trust-divider hidden sm:block" />}
                  <Icon size={18} className="text-accent flex-shrink-0" />
                  <span className="text-sm text-grey-muted font-medium">
                    {lt(item)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="section-container max-w-7xl mx-auto">

        {/* ============ FEATURES (3 cols) ============ */}
        {features && features.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-3 text-center">
              {featuresTitle ? lt(featuresTitle) : ''}
            </h2>
            {featuresSubtitle && (
              <p className="text-grey-muted text-center mb-10 max-w-xl mx-auto">
                {lt(featuresSubtitle)}
              </p>
            )}
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
                    className="p-6 rounded-xl glass-accent-top"
                  >
                    <div className="mb-4 p-3.5 rounded-lg w-fit icon-bg">
                      <Icon size={28} className="text-accent" />
                    </div>
                    <h3 className="font-heading font-bold text-heading text-lg mb-2">
                      {lt(feature)}
                    </h3>
                    <p className="text-grey-muted text-sm leading-relaxed">
                      {tx({ fr: feature.descFr, en: feature.descEn, es: feature.descEs || feature.descEn })}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ============ USE CASES ============ */}
        {useCases && useCases.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-3 text-center">
              {tx({ fr: 'Idees d\'utilisation', en: 'Use Cases', es: 'Ideas de uso' })}
            </h2>
            <p className="text-grey-muted text-center mb-10 max-w-xl mx-auto">
              {tx({
                fr: 'Comment nos clients utilisent ce produit.',
                en: 'How our clients use this product.',
                es: 'Como nuestros clientes usan este producto.',
              })}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {useCases.map((uc, i) => {
                const Icon = uc.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    viewport={{ once: true }}
                    className="p-5 rounded-xl text-center bg-glass"
                  >
                    <div className="w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center icon-bg">
                      <Icon size={20} className="text-accent" />
                    </div>
                    <h3 className="font-heading font-bold text-heading text-sm mb-1">
                      {lt(uc)}
                    </h3>
                    <p className="text-grey-muted text-xs">
                      {tx({ fr: uc.descFr, en: uc.descEn, es: uc.descEs || uc.descEn })}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ============ PROCESS ============ */}
        {service?.process && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-3 text-center">
              {tx({ fr: 'Comment \u00e7a marche', en: 'How it works', es: 'Como funciona' })}
            </h2>
            <p className="text-grey-muted text-center mb-10 max-w-xl mx-auto">
              {tx({
                fr: `De votre id\u00e9e \u00e0 votre projet en ${service.process.length} \u00e9tapes simples.`,
                en: `From your idea to your project in ${service.process.length} simple steps.`,
                es: `De tu idea a tu proyecto en ${service.process.length} pasos simples.`,
              })}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {service.process.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  viewport={{ once: true }}
                  className="p-6 rounded-xl relative bg-glass"
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
        {service?.equipment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-10 text-center flex items-center justify-center gap-3">
              <Wrench size={28} className="text-accent" />
              {tx({ fr: 'Notre \u00e9quipement', en: 'Our equipment', es: 'Nuestro equipo' })}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {service.equipment.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="p-6 rounded-xl text-center bg-glass"
                >
                  <h4 className="text-heading font-heading font-bold mb-2">{item.name}</h4>
                  <p className="text-grey-muted text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ============ GALLERY ============ */}
        {images && images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-10 text-center">
              {tx({ fr: 'Exemples de r\u00e9alisations', en: 'Examples of our work', es: 'Ejemplos de nuestro trabajo' })}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((imgSrc, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  viewport={{ once: true }}
                  className="relative rounded-xl overflow-hidden cursor-pointer group aspect-square"
                  onClick={() => setLightbox(i)}
                >
                  <img src={imgSrc} alt={`${productTitle} - ${tx({ fr: 'realisation', en: 'example', es: 'ejemplo' })} ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 transition-colors duration-300 flex items-center justify-center">
                    <ZoomIn size={28} className="text-white drop-shadow-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ============ FAQ ============ */}
        {faqData && faqData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20 max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-10 text-center">
              {tx({ fr: 'Questions fr\u00e9quentes', en: 'Frequently asked questions', es: 'Preguntas frecuentes' })}
            </h2>
            <div className="space-y-3">
              {faqData.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden transition-all"
                  style={{
                    border: '1px solid var(--bg-card-border)',
                    borderLeft: openFaq === i ? '3px solid var(--accent-color, #F00098)' : '1px solid var(--bg-card-border)',
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
        )}

        {/* ============ CTA ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center p-12 rounded-2xl mb-8 cta-text-bordered"
        >
          <h2 className="text-3xl font-heading font-bold text-heading mb-4">
            {tx({ fr: 'Besoin d\'un projet custom?', en: 'Need a custom project?', es: 'Necesitas un proyecto personalizado?' })}
          </h2>
          <p className="text-grey-light text-lg mb-8 max-w-2xl mx-auto">
            {tx({
              fr: 'Quantit\u00e9s sp\u00e9ciales, mat\u00e9riaux particuliers ou design complexe? Contactez-nous pour un devis sur mesure.',
              en: 'Special quantities, unique materials, or complex design? Contact us for a custom quote.',
              es: 'Cantidades especiales, materiales unicos o diseno complejo? Contactanos para una cotizacion personalizada.',
            })}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <Link to="/contact" className="btn-primary">
              {tx({ fr: 'Demander un devis', en: 'Request a quote', es: 'Solicitar cotizacion' })}
            </Link>
            <Link to="/boutique" className="btn-outline">
              {tx({ fr: 'Voir nos services', en: 'View our services', es: 'Ver nuestros servicios' })}
            </Link>
          </div>
          {ctaLinks && ctaLinks.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              {ctaLinks.map((link, i) => (
                <span key={i} className="flex items-center gap-4">
                  {i > 0 && <span className="text-grey-muted/30">&middot;</span>}
                  <Link to={link.to} className="text-grey-muted hover:text-accent transition-colors">
                    {lt(link)}
                  </Link>
                </span>
              ))}
            </div>
          )}
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
              onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + images.length) % images.length); }}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white w-12 h-12 flex items-center justify-center"
              aria-label={tx({ fr: 'Image precedente', en: 'Previous image', es: 'Imagen anterior' })}
            >
              <ChevronLeft size={32} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % images.length); }}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white w-12 h-12 flex items-center justify-center"
              aria-label={tx({ fr: 'Image suivante', en: 'Next image', es: 'Siguiente imagen' })}
            >
              <ChevronRight size={32} />
            </button>
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 text-white/70 hover:text-white w-10 h-10 flex items-center justify-center"
              aria-label={tx({ fr: 'Fermer', en: 'Close', es: 'Cerrar' })}
            >
              <X size={28} />
            </button>
            <img
              src={toFull(images[lightbox])}
              alt={lt(productTitle)}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ProductLayout;
