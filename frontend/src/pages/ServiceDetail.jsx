import { useParams, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle, Wrench, Users, ChevronLeft, ChevronRight, X, ExternalLink, Globe, Palette, Code as CodeIcon, Smartphone, Search, Gauge, Shield, ChevronDown } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { toFull } from '../utils/paths';
import SEO from '../components/SEO';
import { getServiceSchema, getFAQSchema } from '../components/seo/schemas';
import { useLang } from '../i18n/LanguageContext';
import { useTheme } from '../i18n/ThemeContext';
import getServicesData from '../data/getServicesData';

function ServiceDetail() {
  const { lang, t } = useLang();
  const { theme } = useTheme();
  const { slug } = useParams();
  const servicesData = getServicesData(lang);
  const service = servicesData[slug];
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState({});
  const [openFaq, setOpenFaq] = useState(null);

  const toggleCard = useCallback((index) => {
    setFlippedCards(prev => ({ ...prev, [index]: !prev[index] }));
  }, []);

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
    if (!service.gallery) return;
    const newIndex = (lightboxIndex - 1 + service.gallery.length) % service.gallery.length;
    setLightboxIndex(newIndex);
    setLightboxImage(service.gallery[newIndex]);
  }, [lightboxIndex, service.gallery]);

  const goToNext = useCallback((e) => {
    e.stopPropagation();
    if (!service.gallery) return;
    const newIndex = (lightboxIndex + 1) % service.gallery.length;
    setLightboxIndex(newIndex);
    setLightboxImage(service.gallery[newIndex]);
  }, [lightboxIndex, service.gallery]);

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

  const Icon = service.icon;

  const slugs = Object.keys(servicesData);
  const currentIndex = slugs.indexOf(slug);
  const prevService = currentIndex > 0 ? servicesData[slugs[currentIndex - 1]] : null;
  const nextService = currentIndex < slugs.length - 1 ? servicesData[slugs[currentIndex + 1]] : null;

  return (
    <>
      <SEO
        title={service.seo.title}
        description={service.seo.description}
        ogImage={service.heroImage}
        breadcrumbs={[
          { name: lang === 'fr' ? 'Accueil' : 'Home', url: '/' },
          { name: lang === 'fr' ? 'Accueil' : 'Home', url: '/' },
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
      <section className="relative py-[2.08rem] md:py-[2.6rem] overflow-hidden">
        <div className="absolute inset-0 hero-aurora"></div>

        <div className="relative z-10 section-container !py-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <div className="flex items-center gap-2 mb-6 text-sm">
              <Link to="/" className="text-grey-muted hover:text-accent transition-colors">{lang === 'fr' ? 'Accueil' : 'Home'}</Link>
              <span className="text-grey-muted">/</span>
              <span className="text-accent">{service.title}</span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-xl icon-bg-blur">
                <Icon size={36} className="text-accent" />
              </div>
              <div>
                <h1 className="text-4xl md:text-6xl font-heading font-bold text-heading">
                  {service.title}
                </h1>
              </div>
            </div>

            <p className="text-xl md:text-2xl text-grey-light mb-8">
              {service.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/contact" className="btn-primary">
                {t('serviceDetail.requestQuote')}
                <ArrowRight className="ml-2" size={20} />
              </Link>
              <a href="#tarifs" className="btn-outline">
                {t('serviceDetail.viewPricing')}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="section-container max-w-6xl mx-auto">

        {/* ============ DESCRIPTION + HIGHLIGHTS ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20"
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

        {/* ============ PROJETS WEB RÉALISÉS (webProjects) ============ */}
        {service.webProjects && service.webProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl font-heading font-bold text-gradient mb-3 text-center">
              {t('serviceDetail.webProjectsTitle') || 'Sites réalisés'}
            </h2>
            <p className="text-grey-muted text-center mb-10 max-w-2xl mx-auto">
              {t('serviceDetail.webProjectsSub') || 'Une sélection de projets web livrés pour nos clients'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {service.webProjects.map((project, index) => {
                const isFlipped = !!flippedCards[index];
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    viewport={{ once: true }}
                    className="rounded-2xl overflow-hidden border border-purple-main/30 transition-all duration-300 hover:border-accent/40 card-bg card-shadow"
                  >
                    <AnimatePresence mode="wait">
                      {!isFlipped ? (
                        <motion.div
                          key="logo"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="group"
                        >
                          <div className="relative aspect-[16/10] flex items-center justify-center bg-glass">
                            <div className="flex flex-col items-center">
                              <img
                                src={project.logo}
                                alt={`${project.name} logo`}
                                className="w-24 h-24 md:w-32 md:h-32 object-contain"
                                style={{ filter: 'var(--logo-filter, none)' }}
                                loading="lazy"
                              />
                              <span className="text-grey-muted text-xs mt-3 md:hidden">
                                {lang === 'fr' ? 'Tap pour voir' : 'Tap to preview'}
                              </span>
                            </div>
                            <div
                              className="absolute inset-0 flex items-center justify-center group-hover:bg-black/10 transition-all duration-300 cursor-pointer"
                              onClick={() => toggleCard(index)}
                            >
                              <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 bg-accent/90 backdrop-blur-sm rounded-full p-3">
                                <ArrowRight size={20} className="text-white" />
                              </div>
                            </div>
                          </div>
                          <div className="p-6">
                            <div className="flex items-center gap-3 mb-3">
                              <img
                                src={project.logo}
                                alt={`${project.name} logo`}
                                className="w-8 h-8 object-contain rounded"
                                style={{ filter: 'var(--logo-filter, none)' }}
                              />
                              <h3 className="text-heading font-heading font-bold text-lg">{project.name}</h3>
                            </div>
                            <p className="text-grey-muted text-sm leading-relaxed mb-4">{project.desc}</p>
                            <div className="flex flex-wrap gap-2">
                              {project.tags.map((tag, i) => (
                                <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold border border-purple-main/30 glass-alt-text">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="screenshot"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="relative overflow-hidden aspect-[16/10]">
                            <img
                              src={project.screenshot}
                              alt={project.name}
                              className="w-full h-full object-cover object-top"
                              loading="lazy"
                            />
                            <button
                              onClick={() => toggleCard(index)}
                              className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm rounded-full p-2 text-white/80 hover:text-white hover:bg-black/70 transition-all duration-300"
                              aria-label={lang === 'fr' ? 'Retour' : 'Back'}
                            >
                              <ArrowLeft size={16} />
                            </button>
                            <a
                              href={project.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full p-2 text-white/80 hover:text-white hover:bg-black/70 transition-all duration-300"
                              aria-label={`${lang === 'fr' ? 'Visiter' : 'Visit'} ${project.name}`}
                            >
                              <ExternalLink size={16} />
                            </a>
                          </div>
                          <div className="p-6">
                            <div className="flex items-center gap-3 mb-3">
                              <img
                                src={project.logo}
                                alt={`${project.name} logo`}
                                className="w-8 h-8 object-contain rounded"
                                style={{ filter: 'var(--logo-filter, none)' }}
                              />
                              <h3 className="text-heading font-heading font-bold text-lg">{project.name}</h3>
                            </div>
                            <p className="text-grey-muted text-sm leading-relaxed mb-4">{project.desc}</p>
                            <a
                              href={project.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-accent text-sm font-semibold hover:gap-3 transition-all duration-300"
                            >
                              <Globe size={14} />
                              <span>{project.url.replace('https://', '').replace('http://', '').replace(/\/$/, '')}</span>
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
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
              {service.gallery.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="group relative rounded-xl overflow-hidden cursor-pointer aspect-square"
                  onClick={() => openLightbox(image, index)}
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
              ))}
            </div>
          </motion.div>
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
        <motion.div
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
            <div className="rounded-xl overflow-hidden border border-purple-main/30 max-w-5xl mx-auto card-shadow">
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
                          className={j === 0 ? 'text-heading font-semibold' : j === 1 ? 'text-gradient font-bold' : 'text-grey-muted'}
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

          {service.pricing.tables && (
            <div className={`gap-8 mx-auto ${service.pricing.tables.length === 1 ? 'max-w-5xl' : 'grid grid-cols-1 md:grid-cols-2 max-w-5xl'}`}>
              {service.pricing.tables.map((table, tableIndex) => (
                <div key={tableIndex} className="rounded-xl overflow-hidden border border-purple-main/30 card-shadow">
                  <div className="p-4 border-b border-purple-main/30 bg-glass-alt">
                    <h3 className="text-heading font-heading font-bold">{table.subtitle}</h3>
                  </div>
                  <table className="price-table">
                    <thead>
                      <tr>
                        {table.headers.map((header, i) => (
                          <th key={i}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j} className={j === 0 ? 'text-heading font-semibold' : j === 1 ? 'text-gradient font-bold' : 'text-grey-muted'}>
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
        </motion.div>

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
              {lang === 'fr' ? 'Questions fréquentes' : 'Frequently Asked Questions'}
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
            {service.boutiqueSlug && (
              <Link to={`/boutique/${service.boutiqueSlug}`} className="btn-primary">
                {t('serviceDetail.goToShop')}
                <ArrowRight className="ml-2" size={20} />
              </Link>
            )}
            <Link to="/contact" className={service.boutiqueSlug ? 'btn-outline' : 'btn-primary'}>
              {t('serviceDetail.requestQuote')}
              <ArrowRight className="ml-2" size={20} />
            </Link>
          </div>
        </motion.div>

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
            {service.gallery && service.gallery.length > 1 && (
              <button
                onClick={goToPrevious}
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-[110] text-white/70 hover:text-white transition-colors w-12 h-12 flex items-center justify-center rounded-full lightbox-btn"
                aria-label={lang === 'fr' ? 'Image précédente' : 'Previous image'}
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {/* Flèche droite */}
            {service.gallery && service.gallery.length > 1 && (
              <button
                onClick={goToNext}
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-[110] text-white/70 hover:text-white transition-colors w-12 h-12 flex items-center justify-center rounded-full lightbox-btn"
                aria-label={lang === 'fr' ? 'Image suivante' : 'Next image'}
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
                aria-label={lang === 'fr' ? 'Fermer' : 'Close'}
              >
                <X size={20} />
              </button>
            </motion.div>

            {/* Indicateur */}
            {service.gallery && service.gallery.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[110] text-white/50 text-sm">
                {lightboxIndex + 1} / {service.gallery.length}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ServiceDetail;
