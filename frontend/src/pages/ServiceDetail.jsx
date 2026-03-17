import { useParams, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle, Wrench, Users, ChevronLeft, ChevronRight, X, ExternalLink, Globe, Palette, Code as CodeIcon, Smartphone, Search, Gauge, Shield, ChevronDown, ShoppingCart, ArrowUp } from 'lucide-react';
import { useState, useCallback, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { toFull } from '../utils/paths';
import SEO from '../components/SEO';
import { getServiceSchema, getFAQSchema } from '../components/seo/schemas';
import { useLang } from '../i18n/LanguageContext';
import { useTheme } from '../i18n/ThemeContext';
import getServicesData from '../data/getServicesData';
import { useServicePages } from '../hooks/useServicePages';
import { bl, mediaUrl } from '../utils/cms';
import { getIcon } from '../utils/iconMap';

// Lazy-load configurators per boutiqueSlug
const configuratorMap = {
  stickers: lazy(() => import('../components/configurators/ConfiguratorStickers')),
  'fine-art': lazy(() => import('../components/configurators/ConfiguratorFineArt')),
  sublimation: lazy(() => import('../components/configurators/ConfiguratorSublimation')),
  design: lazy(() => import('../components/configurators/ConfiguratorDesign')),
  web: lazy(() => import('../components/configurators/ConfiguratorWeb')),
};

function buildServiceFromCMS(cms, lang) {
  if (!cms) return null;
  const l = (field) => bl(cms, field, lang);
  const j = (field) => cms[`${field}${lang === 'en' ? 'En' : 'Fr'}`] || cms[`${field}Fr`] || null;
  const pricing = j('pricing');
  return {
    slug: cms.slug,
    boutiqueSlug: cms.boutiqueSlug || null,
    icon: getIcon(cms.iconName),
    title: l('title'),
    subtitle: l('subtitle'),
    heroImage: mediaUrl(cms.heroImage),
    description: l('description'),
    highlights: j('highlights') || [],
    process: j('process') || [],
    pricing: pricing || {},
    equipment: j('equipment'),
    faq: j('faq') || [],
    gallery: cms.gallery?.map(img => mediaUrl(img)) || [],
    comparison: j('comparison') || null,
    whatWeDeliver: j('whatWeDeliver') || null,
    webProjects: j('webProjects') || null,
    technologies: j('technologies') || null,
    team: j('team') || null,
    seo: {
      title: bl(cms.seo, 'title', lang) || l('title'),
      description: bl(cms.seo, 'description', lang) || l('subtitle'),
    },
  };
}

function WebProjectCard({ project, index }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const desktopY = useTransform(scrollYProgress, [0, 1], [15, -15]);
  const phoneY = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const isEven = index % 2 === 0;
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isEven ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      viewport={{ once: true, margin: '-80px' }}
      className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 md:gap-12`}
    >
      {/* Colonne info */}
      <div className="flex-none w-full md:w-56 flex flex-col items-center md:items-start text-center md:text-left">
        <div className="w-28 h-20 flex items-center justify-center mb-4 rounded-xl border border-purple-main/25 bg-white/5 p-2">
          <img src={project.logo} alt={project.name} className="max-w-full max-h-full object-contain" loading="lazy" />
        </div>
        <h3 className="text-lg font-heading font-bold text-heading mb-1.5">{project.name}</h3>
        <p className="text-grey-muted leading-relaxed mb-4 text-xs">{project.desc}</p>
        <div className="flex flex-wrap gap-1.5 mb-4 justify-center md:justify-start">
          {project.tags.map((tag, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-semibold border border-purple-main/30 glass-alt-text">
              {tag}
            </span>
          ))}
        </div>
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-accent/50 text-accent text-xs font-semibold hover:bg-accent/10 transition-colors"
        >
          Voir le site <ExternalLink size={11} />
        </a>
      </div>
      {/* Colonne devices */}
      <div className="relative pb-8 pr-8 md:w-[420px] flex-none">
        {/* Cadre browser desktop */}
        <motion.div style={{ y: desktopY }} className="rounded-lg overflow-hidden border border-white/10 shadow-xl">
          <div className="h-5 bg-[#0e0e20] flex items-center px-2.5 gap-1">
            <span className="w-2 h-2 rounded-full bg-[#ff5f57] block" />
            <span className="w-2 h-2 rounded-full bg-[#febc2e] block" />
            <span className="w-2 h-2 rounded-full bg-[#28c840] block" />
            <div className="flex-1 mx-2 h-3 rounded-sm bg-white/8 text-[7px] text-white/20 flex items-center px-1.5 overflow-hidden truncate">
              {project.url}
            </div>
          </div>
          <div className="aspect-video overflow-hidden">
            <img src={project.screenshot} alt={project.name} className="w-full h-full object-cover object-top" loading="lazy" />
          </div>
        </motion.div>
        {/* Cadre phone */}
        <motion.div
          style={{ y: phoneY, aspectRatio: '9 / 19' }}
          className="absolute bottom-0 right-0 w-[17%] rounded-[10px] border-[2px] border-[#0e0e20] shadow-2xl overflow-hidden bg-black"
        >
          <img
            src={project.phoneScreenshot || project.screenshot}
            alt={`${project.name} mobile`}
            className="w-full h-full object-cover"
            style={{ objectPosition: '20% top' }}
            loading="lazy"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

function ServiceDetail() {
  const { lang, t, tx } = useLang();
  const { theme } = useTheme();
  const { slug } = useParams();
  const { servicePages } = useServicePages() || {};
  const fallbackData = getServicesData(lang);

  // CMS prioritaire, local en fallback
  const service = useMemo(() => {
    const local = fallbackData[slug] || null;
    const cmsPage = servicePages?.find(s => s.slug === slug);
    if (!cmsPage && !local) return null;
    if (!cmsPage) return local;
    const cms = buildServiceFromCMS(cmsPage, lang);
    if (!local) return cms;
    return {
      ...local,
      title: cms.title || local.title,
      subtitle: cms.subtitle || local.subtitle,
      heroImage: cms.heroImage || local.heroImage,
      description: cms.description || local.description,
      highlights: cms.highlights?.length ? cms.highlights : local.highlights,
      process: cms.process?.length ? cms.process : local.process,
      pricing: (cms.pricing && Object.keys(cms.pricing).length) ? cms.pricing : local.pricing,
      equipment: cms.equipment?.length ? cms.equipment : local.equipment,
      faq: cms.faq?.length ? cms.faq : local.faq,
      gallery: [...(cms.gallery || []), ...(local.gallery || [])].filter((v, i, a) => a.indexOf(v) === i),
      comparison: cms.comparison || local.comparison,
      whatWeDeliver: cms.whatWeDeliver || local.whatWeDeliver,
      webProjects: cms.webProjects || local.webProjects,
      technologies: cms.technologies || local.technologies,
      team: cms.team || local.team,
      icon: cms.icon || local.icon,
      boutiqueSlug: cms.boutiqueSlug || local.boutiqueSlug,
      seo: {
        title: cms.seo?.title || local.seo?.title,
        description: cms.seo?.description || local.seo?.description,
      },
    };
  }, [servicePages, slug, lang, fallbackData]);

  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const configuratorRef = useRef(null);

  const openConfigurator = useCallback(() => {
    if (configuratorRef.current) {
      const y = configuratorRef.current.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, []);

  // All images for lightbox navigation
  const allImages = useMemo(() => [
    ...(service?.gallery || []),
  ], [service?.gallery]);

  if (!service) {
    return <Navigate to="/" replace />;
  }

  const openLightbox = useCallback((image, index) => {
    setLightboxImage(image);
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxImage(null);
  }, []);

  const goToPrevious = useCallback((e) => {
    e.stopPropagation();
    if (!allImages.length) return;
    const newIndex = (lightboxIndex - 1 + allImages.length) % allImages.length;
    setLightboxIndex(newIndex);
    setLightboxImage(allImages[newIndex]);
  }, [lightboxIndex, allImages]);

  const goToNext = useCallback((e) => {
    e.stopPropagation();
    if (!allImages.length) return;
    const newIndex = (lightboxIndex + 1) % allImages.length;
    setLightboxIndex(newIndex);
    setLightboxImage(allImages[newIndex]);
  }, [lightboxIndex, allImages]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxImage) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goToPrevious(e);
      if (e.key === 'ArrowRight') goToNext(e);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage, closeLightbox, goToPrevious, goToNext]);

  // Track scroll position for scroll-to-top button
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const Icon = service.icon;
  const hasConfigurator = service.boutiqueSlug && configuratorMap[service.boutiqueSlug];

  // Build ordered slug list from CMS (sorted) or fallback data
  const allServices = useMemo(() => {
    if (servicePages?.length) {
      return servicePages.map(sp => ({
        slug: sp.slug,
        title: bl(sp, 'title', lang),
      }));
    }
    return Object.values(fallbackData).map(s => ({ slug: s.slug, title: s.title }));
  }, [servicePages, fallbackData, lang]);

  const currentIndex = allServices.findIndex(s => s.slug === slug);
  const prevService = currentIndex > 0 ? allServices[currentIndex - 1] : null;
  const nextService = currentIndex < allServices.length - 1 ? allServices[currentIndex + 1] : null;

  return (
    <>
      <SEO
        title={service.seo.title}
        description={service.seo.description}
        ogImage={service.heroImage}
        breadcrumbs={[
          { name: tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' }), url: '/' },
          { name: tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' }), url: '/' },
          { name: service.title },
        ]}
        jsonLd={[
          getServiceSchema({
            name: service.title,
            description: service.seo.description,
            url: `/services/${slug}`,
          }),
          ...(service.faq ? [getFAQSchema(service.faq)] : []),
        ]}
      />

      {/* ============ HERO ============ */}
      <section className="relative py-4 overflow-hidden">
        <div className="absolute inset-0 hero-aurora"></div>

        <div className="relative z-10 section-container !py-0">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl lg:flex-1"
            >
              <div className="flex items-center gap-2 mb-2 text-sm">
                <Link to="/" className="text-grey-muted hover:text-accent transition-colors">{tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' })}</Link>
                <span className="text-grey-muted">/</span>
                <span className="text-accent">{service.title}</span>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl icon-bg-blur">
                  <Icon size={26} className="text-accent" />
                </div>
                <h1 className="text-3xl md:text-5xl font-heading font-bold text-heading">
                  {service.title}
                </h1>
              </div>

              <p className="text-base md:text-lg text-grey-light mb-4">
                {service.subtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                {service.boutiqueSlug && configuratorMap[service.boutiqueSlug] && (
                  <button onClick={openConfigurator} className="btn-primary cursor-pointer">
                    <ShoppingCart className="mr-2" size={20} />
                    {tx({ fr: 'Commander en ligne', en: 'Order online', es: 'Pedir en línea' })}
                    <ChevronDown className="ml-2" size={20} />
                  </button>
                )}
                <Link to="/contact" className={service.boutiqueSlug && configuratorMap[service.boutiqueSlug] ? 'btn-outline' : 'btn-primary'}>
                  {t('serviceDetail.requestQuote')}
                  <ArrowRight className="ml-2" size={20} />
                </Link>
                <a href="#tarifs" className="btn-outline">
                  {t('serviceDetail.viewPricing')}
                </a>
              </div>
            </motion.div>

            {service.heroImage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="hidden lg:block lg:flex-1 max-w-xs"
              >
                <img
                  src={service.heroImage}
                  alt={service.title}
                  className="w-full h-auto object-contain drop-shadow-2xl"
                />
              </motion.div>
            )}
          </div>
        </div>
      </section>


      <div className="section-container max-w-6xl mx-auto">

        {/* ============ DESCRIPTION + HIGHLIGHTS (or SHOWCASE) ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className={`grid grid-cols-1 lg:grid-cols-2 gap-12 ${service.showcaseRight ? 'mb-12' : 'mb-20'}`}
        >
          <div>
            <h2 className="text-3xl font-heading font-bold text-gradient mb-6">
              {t('serviceDetail.theService')}
            </h2>
            {service.description.split('\n\n').map((paragraph, i) => (
              <p key={i} className="text-grey-light text-base leading-relaxed mb-4">
                {paragraph}
              </p>
            ))}
          </div>

          {service.showcaseRight ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden"
            >
              <img
                src={service.showcaseRight}
                alt={service.title}
                className="w-full h-full object-cover rounded-2xl"
                loading="lazy"
              />
            </motion.div>
          ) : (
            <div className="p-8 rounded-2xl border border-purple-main/30 transition-colors duration-300 highlight-shadow">
              <h3 className="text-xl font-heading font-bold text-heading mb-6 flex items-center gap-2">
                <CheckCircle size={22} className="text-accent" />
                {t('serviceDetail.highlights')}
              </h3>
              <ul className="space-y-4">
                {service.highlights.map((highlight, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.08 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0"></div>
                    <span className="text-grey-light">{highlight}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>

        {/* ============ SHOWCASE LEFT + HIGHLIGHTS (si showcase) ============ */}
        {service.showcaseLeft && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden"
            >
              <img
                src={service.showcaseLeft}
                alt={service.title}
                className="w-full h-full object-cover rounded-2xl"
                loading="lazy"
              />
            </motion.div>

            <div className="p-8 rounded-2xl border border-purple-main/30 transition-colors duration-300 highlight-shadow">
              <h3 className="text-xl font-heading font-bold text-heading mb-6 flex items-center gap-2">
                <CheckCircle size={22} className="text-accent" />
                {t('serviceDetail.highlights')}
              </h3>
              <ul className="space-y-4">
                {service.highlights.map((highlight, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.08 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0"></div>
                    <span className="text-grey-light">{highlight}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* ============ CE QUE COMPREND UN SITE (whatWeDeliver) ============ */}
        {service.whatWeDeliver && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl font-heading font-bold text-gradient mb-3 text-center">
              {t('serviceDetail.whatWeDeliver') || 'Ce que comprend votre site'}
            </h2>
            <p className="text-grey-muted text-center mb-10 max-w-2xl mx-auto">
              {t('serviceDetail.whatWeDeliverSub') || 'Chaque projet inclut un ensemble complet de services professionnels'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {service.whatWeDeliver.map((item, index) => {
                const deliverIcons = [Palette, CodeIcon, Smartphone, Search, Gauge, Shield];
                const DeliverIcon = deliverIcons[index] || Globe;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    viewport={{ once: true }}
                    className="p-6 rounded-xl border border-purple-main/30 transition-colors duration-300 glass-shadow"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg icon-bg">
                        <DeliverIcon size={20} className="text-accent" />
                      </div>
                      <h3 className="text-heading font-heading font-bold">{item.title}</h3>
                    </div>
                    <p className="text-grey-muted text-sm leading-relaxed">{item.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ============ PROJETS WEB REALISES (webProjects) - seulement pour le service web ============ */}
        {slug === 'web' && service.webProjects && service.webProjects.length > 0 && (
          <div className="mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-heading font-bold text-gradient mb-3">
                {t('serviceDetail.webProjectsTitle') || 'Sites realises'}
              </h2>
              <p className="text-grey-muted max-w-2xl mx-auto">
                {t('serviceDetail.webProjectsSub') || 'Une selection de projets web livres pour nos clients'}
              </p>
            </motion.div>
            <div className="space-y-16 md:space-y-20">
              {service.webProjects.map((project, index) => (
                <WebProjectCard key={index} project={project} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* ============ PROCESSUS ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-3xl font-heading font-bold text-gradient mb-10 text-center">
            {t('serviceDetail.process')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.process.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl border border-purple-main/30 relative transition-colors duration-300 glass-shadow"
              >
                <div className="absolute -top-3 -left-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: theme === 'light' ? '#1A1A1A' : `linear-gradient(135deg, var(--logo-main, #8100D1), var(--accent-color, #FF52A0))` }}>
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

        {/* ============ COMPARATIF ============ */}
        {service.comparison && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl font-heading font-bold text-gradient mb-8 text-center">
              {service.comparison.title}
            </h2>
            <div className="rounded-xl overflow-hidden border border-purple-main/30 max-w-5xl mx-auto card-shadow">
              <table className="price-table">
                <thead>
                  <tr>
                    {service.comparison.headers.map((header, i) => (
                      <th key={i}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {service.comparison.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className={j === 0 ? 'text-heading font-semibold' : 'text-grey-light'}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ============ TARIFS ============ */}
        {service.pricing && <motion.div
          id="tarifs"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20 scroll-mt-24"
        >
          <h2 className="text-3xl font-heading font-bold text-gradient mb-3 text-center">
            {service.pricing.title}
          </h2>
          <p className="text-grey-muted text-center mb-8">{service.pricing.note}</p>

          {service.pricing.headers && (
            <div className="rounded-xl overflow-hidden border border-purple-main/30 max-w-5xl mx-auto card-shadow overflow-x-auto">
              <table className="price-table">
                <thead>
                  <tr>
                    {service.pricing.headers.map((header, i) => (
                      <th key={i}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {service.pricing.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className={j === 0 ? 'text-heading font-semibold' : j === 1 ? 'text-gradient font-bold whitespace-nowrap' : 'text-grey-muted whitespace-nowrap'}
                        >
                          {service.pricing.headers[j]?.includes('Réf') || service.pricing.headers[j]?.includes('Ref') ? (
                            cell !== '-' ? <span className="line-through">{cell}</span> : cell
                          ) : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {service.pricing.cards && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {service.pricing.cards.map((card, ci) => (
                <div key={ci} className="rounded-xl border border-purple-main/30 card-shadow overflow-hidden">
                  <div className="p-4 border-b border-purple-main/30 bg-glass-alt">
                    <h3 className="text-heading font-heading font-bold text-base">{card.product}</h3>
                    {card.desc && <p className="text-grey-muted text-xs mt-0.5">{card.desc}</p>}
                  </div>
                  <div className="p-4 space-y-2">
                    {card.tiers.map((tier, ti) => (
                      <div key={ti} className="flex items-center justify-between">
                        <span className="text-grey-muted text-sm">{tier.qty} {tier.qty === '1' ? 'unité' : 'unités'}</span>
                        <span className="text-heading font-bold text-sm">{tier.price}<span className="text-grey-muted font-normal text-xs">/u</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {service.pricing.tables && (
            <div className={`gap-8 mx-auto ${service.pricing.tables.length === 1 ? 'max-w-5xl' : 'grid grid-cols-1 md:grid-cols-2 max-w-5xl'}`}>
              {service.pricing.tables.map((table, tableIndex) => (
                <div key={tableIndex} className="rounded-xl overflow-hidden border border-purple-main/30 card-shadow">
                  <div className="p-3 md:p-4 border-b border-purple-main/30 bg-glass-alt">
                    <h3 className="text-heading font-heading font-bold text-sm md:text-base">{table.subtitle}</h3>
                  </div>
                  <table className="price-table w-full">
                    <thead>
                      <tr>
                        {table.headers.map((header, i) => (
                          <th key={i} className="text-xs md:text-sm">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j} className={`whitespace-nowrap ${j === 0 ? 'text-heading font-semibold' : j === 1 ? 'text-gradient font-bold' : 'text-grey-muted'}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </motion.div>}

        {/* ============ ÉQUIPEMENT ============ */}
        {service.equipment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl font-heading font-bold text-gradient mb-8 text-center flex items-center justify-center gap-3">
              <Wrench size={28} className="text-accent" />
              {t('serviceDetail.equipment')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {service.equipment.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="p-6 rounded-xl border border-purple-main/30 text-center transition-colors duration-300 glass-shadow"
                >
                  <h4 className="text-heading font-heading font-bold mb-2">{item.name}</h4>
                  <p className="text-grey-muted text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ============ TECHNOLOGIES ============ */}
        {service.technologies && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl font-heading font-bold text-gradient mb-8 text-center">
              {t('serviceDetail.technologies')}
            </h2>
            <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
              {service.technologies.map((tech, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold border border-purple-main/50 transition-colors duration-300 glass-alt-text"
                >
                  {tech}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}

        {/* ============ ÉQUIPE DESIGN ============ */}
        {service.team && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl font-heading font-bold text-gradient mb-8 text-center flex items-center justify-center gap-3">
              <Users size={28} className="text-accent" />
              {t('serviceDetail.team')}
            </h2>
            <div className="max-w-2xl mx-auto p-8 rounded-2xl border border-purple-main/30 text-center transition-colors duration-300 highlight-shadow">
              <h3 className="text-2xl font-heading font-bold text-heading mb-1">{service.team.name}</h3>
              <p className="text-accent font-semibold mb-4">{service.team.role}</p>
              <p className="text-grey-light leading-relaxed mb-4">{service.team.bio}</p>
              <p className="text-grey-muted text-sm">
                <strong className="text-grey-light">{t('serviceDetail.portfolioLabel')} :</strong> {service.team.portfolio}
              </p>
            </div>
          </motion.div>
        )}

        {/* ============ FAQ ============ */}
        {service.faq && service.faq.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl font-heading font-bold text-gradient mb-8 text-center">
              {tx({ fr: 'Questions fréquentes', en: 'Frequently Asked Questions', es: 'Preguntas frecuentes' })}
            </h2>
            <div className="max-w-3xl mx-auto space-y-3">
              {service.faq.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="rounded-xl border border-purple-main/30 overflow-hidden transition-colors duration-300"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left transition-colors duration-200 hover:bg-glass-alt"
                  >
                    <span className="text-heading font-semibold pr-4">{item.q}</span>
                    <ChevronDown
                      size={20}
                      className={`text-accent flex-shrink-0 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-grey-light leading-relaxed border-t border-purple-main/20 pt-4">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ============ GALERIE (si elle contient des images) ============ */}
        {service.gallery && service.gallery.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl font-heading font-bold text-gradient mb-8 text-center">
              {t('serviceDetail.gallery')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {service.gallery.map((image, index) => {
                const globalIndex = index;
                return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="group relative rounded-xl overflow-hidden cursor-pointer aspect-square"
                  onClick={() => openLightbox(image, globalIndex)}
                >
                  <img
                    src={image}
                    alt={`${service.title} - ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30 backdrop-blur-sm rounded-full p-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
                      </svg>
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ============ CTA ============ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-20 p-12 rounded-2xl text-center border border-accent/30 transition-colors duration-300 cta-shadow"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-4">
            {t('serviceDetail.ctaTitle')}
          </h2>
          <p className="text-grey-light text-lg mb-8 max-w-2xl mx-auto">
            {t('serviceDetail.ctaSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {service.boutiqueSlug && configuratorMap[service.boutiqueSlug] && (
              <button
                onClick={openConfigurator}
                className="btn-primary cursor-pointer"
              >
                <ShoppingCart className="mr-2" size={20} />
                {tx({ fr: 'Commander en ligne', en: 'Order online', es: 'Pedir en línea' })}
                <ArrowRight className="ml-2" size={20} />
              </button>
            )}
            <Link to="/contact" className={service.boutiqueSlug && configuratorMap[service.boutiqueSlug] ? 'btn-outline' : 'btn-primary'}>
              {t('serviceDetail.requestQuote')}
              <ArrowRight className="ml-2" size={20} />
            </Link>
          </div>
        </motion.div>

        {/* ============ CONFIGURATEUR (bas de page) ============ */}
        {hasConfigurator && (() => {
          const Comp = configuratorMap[service.boutiqueSlug];
          if (!Comp) return null;
          return (
            <div ref={configuratorRef} id="configurateur" className="mb-20 scroll-mt-24">
              <h2 className="text-3xl font-heading font-bold text-gradient mb-8 text-center flex items-center justify-center gap-3">
                <ShoppingCart size={28} className="text-accent" />
                {tx({ fr: 'Commander en ligne', en: 'Order online', es: 'Pedir en línea' })}
              </h2>
              <div className="rounded-2xl p-6 md:p-10 card-bg">
                <Suspense fallback={
                  <div className="text-center py-8 text-grey-muted">
                    {tx({ fr: 'Chargement...', en: 'Loading...', es: 'Cargando...' })}
                  </div>
                }>
                  <Comp />
                </Suspense>
              </div>
            </div>
          );
        })()}

        {/* ============ NAVIGATION SERVICES ============ */}
        <div className="flex justify-between items-center py-8 footer-border">
          {prevService ? (
            <Link
              to={`/services/${prevService.slug}`}
              className="flex items-center gap-3 text-grey-light hover:text-accent transition-colors group"
            >
              <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
              <div>
                <div className="text-xs text-grey-muted">{t('serviceDetail.prev')}</div>
                <div className="font-heading font-bold">{prevService.title}</div>
              </div>
            </Link>
          ) : <div />}

          {nextService ? (
            <Link
              to={`/services/${nextService.slug}`}
              className="flex items-center gap-3 text-grey-light hover:text-accent transition-colors text-right group"
            >
              <div>
                <div className="text-xs text-grey-muted">{t('serviceDetail.next')}</div>
                <div className="font-heading font-bold">{nextService.title}</div>
              </div>
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            </Link>
          ) : <div />}
        </div>
      </div>

      {/* ============ LIGHTBOX ============ */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 cursor-pointer lightbox-overlay"
            onClick={closeLightbox}
          >
            {/* Flèche gauche */}
            {allImages.length > 1 && (
              <button
                onClick={goToPrevious}
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-[110] text-white/70 hover:text-white transition-colors w-12 h-12 flex items-center justify-center rounded-full lightbox-btn"
                aria-label={tx({ fr: 'Image précédente', en: 'Previous image', es: 'Imagen anterior' })}
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {/* Flèche droite */}
            {allImages.length > 1 && (
              <button
                onClick={goToNext}
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-[110] text-white/70 hover:text-white transition-colors w-12 h-12 flex items-center justify-center rounded-full lightbox-btn"
                aria-label={tx({ fr: 'Image suivante', en: 'Next image', es: 'Imagen siguiente' })}
              >
                <ChevronRight size={28} />
              </button>
            )}

            <motion.div
              key={lightboxImage}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={toFull(lightboxImage)}
                alt={service.title}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors w-10 h-10 flex items-center justify-center rounded-full lightbox-btn"
                aria-label={tx({ fr: 'Fermer', en: 'Close', es: 'Cerrar' })}
              >
                <X size={20} />
              </button>
            </motion.div>

            {/* Indicateur */}
            {allImages.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[110] text-white/50 text-sm">
                {lightboxIndex + 1} / {allImages.length}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ BOUTONS FIXES ============ */}
      <div className="fixed bottom-6 right-20 z-50 flex items-center gap-3">
        {/* Scroll to top */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-grey-light hover:text-accent hover:border-accent/40 transition-all shadow-lg flex items-center justify-center"
              aria-label="Scroll to top"
            >
              <ArrowUp size={20} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Commander en ligne - fixe */}
        {hasConfigurator && (
          <button
            onClick={openConfigurator}
            className="btn-primary shadow-lg shadow-accent/20 flex items-center gap-2 py-2.5 px-5 text-sm"
          >
            <ShoppingCart size={18} />
            {tx({ fr: 'Commander en ligne', en: 'Order online', es: 'Pedir en línea' })}
          </button>
        )}
      </div>
    </>
  );
}

export default ServiceDetail;
