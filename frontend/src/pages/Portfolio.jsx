import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';
import { img, thumb } from '../utils/paths';
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
  { path: '/images/prints/Prints1.jpeg', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints2.jpeg', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints3.jpeg', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints4.JPG', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints5.jpeg', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints6.jpeg', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints7.jpeg', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints8.jpeg', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints9.jpeg', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints10.jpeg', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints11.jpeg', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints12.jpeg', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints13.jpeg', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints14.jpeg', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints15.jpeg', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints16.jpeg', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints17.jpeg', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints18.jpeg', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints19.jpeg', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints20.jpeg', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints21.jpeg', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints22.jpeg', titleKey: 'print', category: 'prints' },
  { path: '/images/prints/Prints23.jpeg', titleKey: 'print', category: 'prints' },
  // Stickers
  { path: '/images/stickers/Stickers1.jpeg', titleKey: 'sticker', category: 'stickers' },
  { path: '/images/stickers/Stickers2.jpg', titleKey: 'sticker', category: 'stickers' },
  { path: '/images/stickers/Stickers3.jpeg', titleKey: 'sticker', category: 'stickers' },
  { path: '/images/stickers/Stickers4.jpeg', titleKey: 'sticker', category: 'stickers' },
  { path: '/images/stickers/Stickers5.jpeg', titleKey: 'sticker', category: 'stickers' },
  { path: '/images/stickers/Stickers9.jpeg', titleKey: 'sticker', category: 'stickers' },
  { path: '/images/stickers/Stickers10.jpeg', titleKey: 'sticker', category: 'stickers' },
  { path: '/images/stickers/Stickers11.jpeg', titleKey: 'sticker', category: 'stickers' },
  { path: '/images/stickers/Stickers12.jpeg', titleKey: 'sticker', category: 'stickers' },
  { path: '/images/stickers/Stickers13.jpeg', titleKey: 'sticker', category: 'stickers' },
  { path: '/images/stickers/Stickers14.jpeg', titleKey: 'sticker', category: 'stickers' },
  { path: '/images/stickers/Stickers15.jpeg', titleKey: 'sticker', category: 'stickers' },
  // Locale / studio
  { path: '/images/locale/locale2.jpeg', titleKey: 'workspace', category: 'locale' },
  { path: '/images/locale/locale3.jpeg', titleKey: 'workspace', category: 'locale' },
  { path: '/images/locale/locale9.jpeg', titleKey: 'workspace', category: 'locale' },
  { path: '/images/locale/locale10.jpeg', titleKey: 'workspace', category: 'locale' },
  { path: '/images/locale/locale11.jpeg', titleKey: 'workspace', category: 'locale' },
];

// Titres par langue
const projectTitles = {
  fr: {
    print: 'Fine Art Print',
    sticker: 'Stickers',
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
    { id: 'locale', label: cats.locale },
  ];

  const filteredProjects = activeCategory === 'all'
    ? projects
    : projects.filter(p => p.category === activeCategory);

  const getTitle = (key) => projectTitles[lang]?.[key] || projectTitles.fr[key] || key;

  const openLightbox = (project, index) => {
    setLightboxImage(project);
    setLightboxIndex(index);
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

  return (
    <>
      <Helmet>
        <title>{t('portfolioPage.seo.title')}</title>
        <meta name="description" content={t('portfolioPage.seo.description')} />
      </Helmet>

      {/* Hero */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img src={thumb('/images/prints/Prints2.jpeg')} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'var(--hero-gradient)' }}></div>
        </div>
        <div className="relative z-10 section-container !py-0 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-white mb-6">
              {t('portfolioPage.hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto">
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
              className="px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300"
              style={{
                background: activeCategory === cat.id
                  ? 'linear-gradient(135deg, #8100D1, #FF52A0)'
                  : 'var(--bg-glass)',
                color: activeCategory === cat.id ? '#FFFFFF' : 'var(--color-heading)',
                border: activeCategory === cat.id
                  ? 'none'
                  : '1px solid var(--bg-card-border)',
                boxShadow: 'none',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Compteur */}
        <p className="text-center text-grey-muted mb-8">
          {filteredProjects.length} {filteredProjects.length > 1 ? t('common.projectsPlural') : t('common.projects')}
        </p>

        {/* Grille */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.path}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.3) }}
                className="group relative rounded-xl overflow-hidden cursor-pointer"
                style={{ aspectRatio: project.category === 'web' ? '16/10' : '1' }}
                onClick={() => {
                  if (project.url) {
                    window.open(project.url, '_blank', 'noopener,noreferrer');
                  } else {
                    openLightbox(project, index);
                  }
                }}
              >
                <img
                  src={thumb(project.path)}
                  alt={getTitle(project.titleKey)}
                  className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${project.category === 'web' ? 'object-cover object-top' : 'object-cover'}`}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white font-heading font-bold text-sm flex items-center gap-2">
                    {getTitle(project.titleKey)}
                    {project.url && <ExternalLink size={14} />}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Lightbox avec navigation */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 cursor-pointer"
            style={{ background: 'rgba(0, 0, 0, 0.95)' }}
            onClick={closeLightbox}
          >
            {/* Bouton Fermer (top-right) */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-[110] text-white/70 hover:text-white transition-colors w-12 h-12 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              aria-label="Fermer"
            >
              <X size={28} />
            </button>

            {/* Flèche Précédent (gauche) */}
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-[110] text-white/70 hover:text-white transition-all duration-200 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full hover:scale-110"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              aria-label="Photo précédente"
            >
              <ChevronLeft size={32} />
            </button>

            {/* Flèche Suivant (droite) */}
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-[110] text-white/70 hover:text-white transition-all duration-200 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full hover:scale-110"
              style={{ background: 'rgba(0,0,0,0.5)' }}
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
