import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';
import { img, thumb } from '../utils/paths';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';

/* Paths bruts - résolus au rendu via thumb() (grille) et img() (lightbox) */
const projects = [
  // Web - Sites et applications
  { path: '/images/web/sonaa.webp', titleKey: 'sonaa', category: 'web', url: 'https://sonaa.ca' },
  { path: '/images/web/recrutementspvm.webp', titleKey: 'recrutementspvm', category: 'web', url: 'https://recrutementspvm.ca' },
  { path: '/images/web/mauditemachine.webp', titleKey: 'mauditemachine', category: 'web', url: 'https://mauditemachine.com' },
  { path: '/images/web/spvm.webp', titleKey: 'spvm', category: 'web', url: 'https://spvm.qc.ca' },
  { path: '/images/web/sarahlatulippe.webp', titleKey: 'sarahlatulippe', category: 'web', url: 'https://sarahlatulippe.com' },
  { path: '/images/web/lapresse.webp', titleKey: 'lapresse', category: 'web', url: 'https://lapresse.ca' },
  { path: '/images/web/qrgenerator.webp', titleKey: 'qrgenerator', category: 'web', url: 'https://main.d15strqjqfjba7.amplifyapp.com/' },
  { path: '/images/web/boutiquemaude.webp', titleKey: 'boutiquemaude', category: 'web', url: 'https://boutiquemaude.com' },
  // Prints
  { path: '/images/prints/FineArt1.webp', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/FineArt4.webp', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/FineArt6.webp', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/FineArt-Photo.webp', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints7.webp', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints17.webp', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints18.webp', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints22.webp', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints24.webp', titleKey: 'print', category: 'prints' },
  // Stickers
  { path: '/images/stickers/Stickers-Cosmo.webp', titleKey: 'sticker', category: 'stickers' },
  { path: '/images/stickers/Stickers-Cosmovision.webp', titleKey: 'sticker', category: 'stickers' },
  { path: '/images/stickers/Stickers-Fusion-State-Rec.webp', titleKey: 'sticker', category: 'stickers' },
  { path: '/images/stickers/Stickers-Maudite-Machine.webp', titleKey: 'sticker', category: 'stickers' },
  { path: '/images/stickers/Stickers-Vrstl.webp', titleKey: 'sticker', category: 'stickers' },
  { path: '/images/stickers/Stickers-massive.webp', titleKey: 'sticker', category: 'stickers' },
  // Textile
  { path: '/images/textile/Textile1.webp', titleKey: 'textile', category: 'textile' },
  { path: '/images/textile/Textile2.webp', titleKey: 'textile', category: 'textile' },
  { path: '/images/textile/Textile3.webp', titleKey: 'textile', category: 'textile' },
  { path: '/images/textile/Textile4.webp', titleKey: 'textile', category: 'textile' },
  { path: '/images/textile/Textile5.webp', titleKey: 'textile', category: 'textile' },
  { path: '/images/textile/Textile6.webp', titleKey: 'textile', category: 'textile' },
  { path: '/images/textile/Textile7.webp', titleKey: 'textile', category: 'textile' },
  { path: '/images/textile/Textile9.webp', titleKey: 'textile', category: 'textile' },
  { path: '/images/textile/Textile10.webp', titleKey: 'textile', category: 'textile' },
  { path: '/images/textile/Textile11.webp', titleKey: 'textile', category: 'textile' },
  { path: '/images/textile/Textile12.webp', titleKey: 'textile', category: 'textile' },
  { path: '/images/textile/Textile13.webp', titleKey: 'textile', category: 'textile' },
  // Locale / studio
  { path: '/images/locale/locale1.webp', titleKey: 'workspace', category: 'locale' },
  { path: '/images/locale/locale2.webp', titleKey: 'workspace', category: 'locale' },
  { path: '/images/locale/locale3.webp', titleKey: 'workspace', category: 'locale' },
  { path: '/images/locale/locale4.webp', titleKey: 'workspace', category: 'locale' },
  { path: '/images/locale/locale5.webp', titleKey: 'workspace', category: 'locale' },
  { path: '/images/locale/locale6.webp', titleKey: 'workspace', category: 'locale' },
  { path: '/images/locale/locale7.webp', titleKey: 'workspace', category: 'locale' },
  { path: '/images/locale/locale8.webp', titleKey: 'workspace', category: 'locale' },
  { path: '/images/locale/locale9.webp', titleKey: 'workspace', category: 'locale' },
  { path: '/images/locale/locale10.webp', titleKey: 'workspace', category: 'locale' },
  { path: '/images/locale/locale11.webp', titleKey: 'workspace', category: 'locale' },
  { path: '/images/locale/locale12.webp', titleKey: 'workspace', category: 'locale' },
  { path: '/images/locale/locale13.webp', titleKey: 'workspace', category: 'locale' },
  { path: '/images/locale/locale14.webp', titleKey: 'workspace', category: 'locale' },
];

// Ordre des sections pour l'affichage "Tout"
const sectionOrder = ['web', 'prints', 'stickers', 'textile', 'locale'];

// Titres par langue
const projectTitles = {
  fr: {
    print: 'Fine Art Print',
    sticker: 'Stickers',
    textile: 'Sublimation & Merch',
    workspace: 'Workspace',
    sonaa: 'Sonaa - Actualites technologiques',
    recrutementspvm: 'Recrutement SPVM',
    mauditemachine: 'Maudite Machine - Artiste electronique',
    spvm: 'SPVM - Service de police de Montreal',
    sarahlatulippe: 'Sarah Latulippe - Photographe',
    lapresse: 'La Presse - Journal du Quebec',
    qrgenerator: 'Generateur de Code QR',
    boutiquemaude: 'Boutique Maude - Pret-a-porter',
  },
  en: {
    print: 'Fine Art Print',
    sticker: 'Stickers',
    textile: 'Sublimation & Merch',
    workspace: 'Workspace',
    sonaa: 'Sonaa - Tech News',
    recrutementspvm: 'SPVM Recruitment',
    mauditemachine: 'Maudite Machine - Electronic Music Artist',
    spvm: 'SPVM - Montreal Police Service',
    sarahlatulippe: 'Sarah Latulippe - Photographer',
    lapresse: 'La Presse - Quebec Newspaper',
    qrgenerator: 'QR Code Generator',
    boutiquemaude: 'Boutique Maude - Fashion',
  },
};

function Portfolio() {
  const { lang, t } = useLang();
  const [activeCategory, setActiveCategory] = useState('all');
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const cats = t('portfolioPage.categories');
  const categories = [
    { id: 'all', label: cats.all },
    { id: 'web', label: cats.web || 'Web' },
    { id: 'prints', label: cats.prints },
    { id: 'stickers', label: cats.stickers },
    { id: 'textile', label: cats.textile || 'Textile' },
    { id: 'locale', label: cats.locale },
  ];

  const filteredProjects = activeCategory === 'all'
    ? projects
    : projects.filter(p => p.category === activeCategory);

  const getTitle = (key) => projectTitles[lang]?.[key] || projectTitles.fr[key] || key;
  const getCategoryLabel = (catId) => cats[catId] || catId;

  const openLightbox = (project, globalIndex) => {
    setLightboxImage(project);
    setLightboxIndex(globalIndex);
  };

  const goToPrevious = (e) => {
    e.stopPropagation();
    const newIndex = lightboxIndex > 0 ? lightboxIndex - 1 : filteredProjects.length - 1;
    setLightboxIndex(newIndex);
    setLightboxImage(filteredProjects[newIndex]);
  };

  const goToNext = (e) => {
    e.stopPropagation();
    const newIndex = lightboxIndex < filteredProjects.length - 1 ? lightboxIndex + 1 : 0;
    setLightboxIndex(newIndex);
    setLightboxImage(filteredProjects[newIndex]);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
    setLightboxIndex(0);
  };

  // Rendu d'une carte projet
  const renderCard = (project, index) => (
    <motion.div
      key={project.path}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      className={`group relative rounded-xl overflow-hidden cursor-pointer ${project.category === 'web' ? 'aspect-[16/10]' : 'aspect-square'}`}
      onClick={() => {
        if (project.url) {
          window.open(project.url, '_blank', 'noopener,noreferrer');
        } else {
          // Trouver l'index global dans filteredProjects pour le lightbox
          const globalIdx = filteredProjects.indexOf(project);
          openLightbox(project, globalIdx >= 0 ? globalIdx : 0);
        }
      }}
    >
      <img
        src={thumb(project.path)}
        alt={getTitle(project.titleKey)}
        className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${project.category === 'web' ? 'object-cover object-top' : 'object-cover'}`}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <p className="text-white font-heading font-bold text-sm flex items-center gap-2">
          {getTitle(project.titleKey)}
          {project.url && <ExternalLink size={14} />}
        </p>
      </div>
    </motion.div>
  );

  return (
    <>
      <SEO
        title={t('portfolioPage.seo.title')}
        description={t('portfolioPage.seo.description')}
        breadcrumbs={[
          { name: lang === 'fr' ? 'Accueil' : 'Home', url: '/' },
          { name: t('nav.portfolio') },
        ]}
      />

      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 hero-aurora"></div>
        <div className="relative z-10 section-container !py-0 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-heading mb-6">
              {t('portfolioPage.hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-grey-light max-w-3xl mx-auto">
              {t('portfolioPage.hero.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-container">
        {/* Filtres */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`filter-btn ${activeCategory === cat.id ? 'filter-btn-active' : ''}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Compteur */}
        <p className="text-center text-grey-muted mb-8">
          {filteredProjects.length} {filteredProjects.length > 1 ? t('common.projectsPlural') : t('common.projects')}
        </p>

        {/* Affichage par sections quand "Tout" est sélectionné */}
        {activeCategory === 'all' ? (
          <div className="space-y-16">
            {sectionOrder.map((sectionId) => {
              const sectionProjects = projects.filter(p => p.category === sectionId);
              if (sectionProjects.length === 0) return null;
              return (
                <div key={sectionId}>
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-4 mb-8"
                  >
                    <h2 className="text-2xl md:text-3xl font-heading font-bold text-heading whitespace-nowrap">
                      {getCategoryLabel(sectionId)}
                    </h2>
                    <div className="flex-1 h-px" style={{ background: 'var(--bg-card-border)' }}></div>
                    <span className="text-grey-muted text-sm whitespace-nowrap">{sectionProjects.length} {sectionProjects.length > 1 ? t('common.projectsPlural') : t('common.projects')}</span>
                  </motion.div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {sectionProjects.map((project, index) => renderCard(project, index))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Grille filtrée */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProjects.map((project, index) => renderCard(project, index))}
          </div>
        )}
      </section>

      {/* Lightbox avec navigation */}
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
            {/* Bouton Fermer (top-right) */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-[110] text-white/70 hover:text-white transition-colors w-12 h-12 flex items-center justify-center rounded-full lightbox-btn"
              aria-label="Fermer"
            >
              <X size={28} />
            </button>

            {/* Flèche Précédent (gauche) */}
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-[110] text-white/70 hover:text-white transition-all duration-200 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full hover:scale-110 lightbox-btn"
              aria-label="Photo précédente"
            >
              <ChevronLeft size={32} />
            </button>

            {/* Flèche Suivant (droite) */}
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-[110] text-white/70 hover:text-white transition-all duration-200 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full hover:scale-110 lightbox-btn"
              aria-label="Photo suivante"
            >
              <ChevronRight size={32} />
            </button>

            {/* Container image centré */}
            <motion.div
              key={lightboxImage.path}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
                <img
                  src={img(lightboxImage.path)}
                  alt={getTitle(lightboxImage.titleKey)}
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                  style={{ maxHeight: '90vh' }}
                />
                {/* Titre en bas */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                  <h3 className="text-white font-heading font-bold text-lg md:text-xl text-center">
                    {getTitle(lightboxImage.titleKey)}
                  </h3>
                  <p className="text-white/60 text-sm text-center mt-1">
                    {lightboxIndex + 1} / {filteredProjects.length}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Portfolio;
