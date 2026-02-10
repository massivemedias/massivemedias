import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { img, thumb } from '../utils/paths';
import { useLang } from '../i18n/LanguageContext';

/* Paths bruts — résolus au rendu via thumb() (grille) et img() (lightbox) */
const projects = [
  // Prints
  { path: '/images/prints/Prints1.jpeg', titleKey: 'fineArtPrint', category: 'prints' },
  { path: '/images/prints/Prints2.jpeg', titleKey: 'photoGraphicPoster', category: 'prints' },
  { path: '/images/prints/Prints3.jpeg', titleKey: 'galleryPrint', category: 'prints' },
  { path: '/images/prints/Prints4.JPG', titleKey: 'artisticPoster', category: 'prints' },
  { path: '/images/prints/Prints5.jpeg', titleKey: 'fineArtPaper', category: 'prints' },
  { path: '/images/prints/Prints6.jpeg', titleKey: 'proPhotoPrint', category: 'prints' },
  { path: '/images/prints/Prints7.jpeg', titleKey: 'largeFormatFineArt', category: 'prints' },
  { path: '/images/prints/Prints8.jpeg', titleKey: 'eventPoster', category: 'prints' },
  { path: '/images/prints/Prints9.jpeg', titleKey: 'largeFormatPrint', category: 'prints' },
  { path: '/images/prints/Prints10.jpeg', titleKey: 'premiumPrint', category: 'prints' },
  { path: '/images/prints/Prints11.jpeg', titleKey: 'exhibitionPrint', category: 'prints' },
  { path: '/images/prints/Prints12.jpeg', titleKey: 'collectorPoster', category: 'prints' },
  { path: '/images/prints/Prints13.jpeg', titleKey: 'framedFineArt', category: 'prints' },
  { path: '/images/prints/Prints14.jpeg', titleKey: 'artPhoto', category: 'prints' },
  { path: '/images/prints/Prints15.jpeg', titleKey: 'premiumPaperPrint', category: 'prints' },
  { path: '/images/prints/Prints16.jpeg', titleKey: 'colorPrint', category: 'prints' },
  { path: '/images/prints/Prints17.jpeg', titleKey: 'promoPoster', category: 'prints' },
  { path: '/images/prints/Prints18.jpeg', titleKey: 'artisticPrint', category: 'prints' },
  { path: '/images/prints/Prints19.jpeg', titleKey: 'cottonPaperPrint', category: 'prints' },
  { path: '/images/prints/Prints20.jpeg', titleKey: 'largeFormatPoster', category: 'prints' },
  { path: '/images/prints/Prints21.jpeg', titleKey: 'galleryFineArt', category: 'prints' },
  { path: '/images/prints/Prints22.jpeg', titleKey: 'photographicPrint', category: 'prints' },
  { path: '/images/prints/Prints23.jpeg', titleKey: 'limitedEdition', category: 'prints' },
  { path: '/images/prints/Prints24.jpeg', titleKey: 'proPrint', category: 'prints' },
  { path: '/images/prints/Prints25.jpeg', titleKey: 'artisticPoster2', category: 'prints' },
  { path: '/images/prints/Prints26.jpeg', titleKey: 'premiumPrint2', category: 'prints' },
  // Stickers
  { path: '/images/stickers/Stickers1.jpeg', titleKey: 'holoStickers', category: 'stickers' },
  { path: '/images/stickers/Stickers2.jpg', titleKey: 'customDieCut', category: 'stickers' },
  { path: '/images/stickers/Stickers3.jpeg', titleKey: 'matteVinyl', category: 'stickers' },
  { path: '/images/stickers/Stickers4.jpeg', titleKey: 'labelStickers', category: 'stickers' },
  { path: '/images/stickers/Stickers5.jpeg', titleKey: 'glossyStickers', category: 'stickers' },
  { path: '/images/stickers/Stickers9.jpeg', titleKey: 'clearStickers', category: 'stickers' },
  { path: '/images/stickers/Stickers10.jpeg', titleKey: 'customPack', category: 'stickers' },
  { path: '/images/stickers/Stickers11.jpeg', titleKey: 'contourDieCut', category: 'stickers' },
  { path: '/images/stickers/Stickers12.jpeg', titleKey: 'eventStickers', category: 'stickers' },
  { path: '/images/stickers/Stickers13.jpeg', titleKey: 'promoStickers', category: 'stickers' },
  { path: '/images/stickers/Stickers14.jpeg', titleKey: 'customStickers', category: 'stickers' },
  { path: '/images/stickers/Stickers15.jpeg', titleKey: 'premiumHolo', category: 'stickers' },
  // Textile
  { path: '/images/textile/Textile1.jpeg', titleKey: 'subTshirt', category: 'textile' },
  { path: '/images/textile/Textile2.jpeg', titleKey: 'customHoodie', category: 'textile' },
  { path: '/images/textile/Textile3.jpeg', titleKey: 'artistMerch', category: 'textile' },
  { path: '/images/textile/Textile4.jpeg', titleKey: 'customMug', category: 'textile' },
  { path: '/images/textile/Textile5.jpeg', titleKey: 'subTumbler', category: 'textile' },
  { path: '/images/textile/Textile6.jpeg', titleKey: 'mousepad', category: 'textile' },
  { path: '/images/textile/Textile7.jpeg', titleKey: 'subKeychain', category: 'textile' },
  { path: '/images/textile/Textile8.jpeg', titleKey: 'allOverTshirt', category: 'textile' },
  { path: '/images/textile/Textile9.jpeg', titleKey: 'customAccessory', category: 'textile' },
  { path: '/images/textile/Textile10.jpeg', titleKey: 'merchCollection', category: 'textile' },
  { path: '/images/textile/Textile11.jpeg', titleKey: 'textileSub', category: 'textile' },
  { path: '/images/textile/Textile13.jpeg', titleKey: 'customTumbler', category: 'textile' },
  { path: '/images/textile/Textile14.jpeg', titleKey: 'printedClothing', category: 'textile' },
  { path: '/images/textile/Textile15.jpeg', titleKey: 'eventMerch', category: 'textile' },
  { path: '/images/textile/Textile16.jpeg', titleKey: 'promoItem', category: 'textile' },
  { path: '/images/textile/Textile17.jpeg', titleKey: 'subCap', category: 'textile' },
  { path: '/images/textile/Textile18.jpeg', titleKey: 'customTextile', category: 'textile' },
  { path: '/images/textile/Textile19.jpeg', titleKey: 'subPouch', category: 'textile' },
  { path: '/images/textile/Textile20.jpeg', titleKey: 'customSweater', category: 'textile' },
  { path: '/images/textile/Textile21.jpeg', titleKey: 'promoObject', category: 'textile' },
  { path: '/images/textile/Textile22.jpeg', titleKey: 'textileCollection', category: 'textile' },
  { path: '/images/textile/Textile23.jpeg', titleKey: 'drinkwareSub', category: 'textile' },
  { path: '/images/textile/Textile24.jpeg', titleKey: 'personalizedMerch', category: 'textile' },
  { path: '/images/textile/Textile25.jpeg', titleKey: 'customItem', category: 'textile' },
  // Locale / studio
  { path: '/images/locale/locale1.jpeg', titleKey: 'workspace', category: 'locale' },
  { path: '/images/locale/locale2.jpeg', titleKey: 'productionStudio', category: 'locale' },
  { path: '/images/locale/locale3.jpeg', titleKey: 'versatileSpace', category: 'locale' },
  { path: '/images/locale/locale4.jpeg', titleKey: 'printZone', category: 'locale' },
  { path: '/images/locale/locale5.jpeg', titleKey: 'workshop', category: 'locale' },
  { path: '/images/locale/locale6.jpeg', titleKey: 'largeFormatPrinter', category: 'locale' },
  { path: '/images/locale/locale7.jpeg', titleKey: 'proCuttingGear', category: 'locale' },
  { path: '/images/locale/locale8.jpeg', titleKey: 'collabSpace', category: 'locale' },
  { path: '/images/locale/locale9.jpeg', titleKey: 'studioView', category: 'locale' },
  { path: '/images/locale/locale10.jpeg', titleKey: 'subPresses', category: 'locale' },
  { path: '/images/locale/locale11.jpeg', titleKey: 'mileEnd', category: 'locale' },
  { path: '/images/locale/locale12.jpeg', titleKey: 'production', category: 'locale' },
  { path: '/images/locale/locale13.jpeg', titleKey: 'versatileSpace2', category: 'locale' },
  { path: '/images/locale/locale14.jpeg', titleKey: 'creativeWorkshop', category: 'locale' },
];

// Titres par langue
const projectTitles = {
  fr: {
    fineArtPrint: 'Tirage Fine Art', photoGraphicPoster: 'Affiche photographique', galleryPrint: 'Print galerie',
    artisticPoster: 'Poster artistique', fineArtPaper: 'Impression sur papier fine art', proPhotoPrint: 'Tirage photo pro',
    largeFormatFineArt: 'Impression fine art grand format', eventPoster: 'Affiche événement',
    largeFormatPrint: 'Impression grand format', premiumPrint: 'Print premium', exhibitionPrint: "Tirage d'exposition",
    collectorPoster: 'Poster collector', framedFineArt: 'Fine art encadré', artPhoto: "Photo d'art",
    premiumPaperPrint: 'Impression papier premium', colorPrint: 'Tirage couleur', promoPoster: 'Affiche promo',
    artisticPrint: 'Print artistique', cottonPaperPrint: 'Impression sur papier coton',
    largeFormatPoster: 'Poster grand format', galleryFineArt: 'Fine art galerie',
    photographicPrint: 'Tirage photographique', limitedEdition: 'Print limited edition',
    proPrint: 'Impression professionnelle', artisticPoster2: 'Affiche artistique', premiumPrint2: 'Tirage premium',
    holoStickers: 'Stickers holographiques', customDieCut: 'Die-cut personnalisé',
    matteVinyl: 'Stickers vinyle matte', labelStickers: 'Autocollants label', glossyStickers: 'Stickers glossy',
    clearStickers: 'Stickers transparent', customPack: 'Pack stickers custom', contourDieCut: 'Die-cut contour',
    eventStickers: 'Stickers événement', promoStickers: 'Stickers promo',
    customStickers: 'Autocollants sur mesure', premiumHolo: 'Stickers holographiques premium',
    subTshirt: 'T-shirt sublimation', customHoodie: 'Hoodie custom', artistMerch: 'Merch artiste',
    customMug: 'Mug personnalisé', subTumbler: 'Thermos sublimation', mousepad: 'Tapis de souris',
    subKeychain: 'Porte-clés sublimation', allOverTshirt: 'T-shirt all-over print',
    customAccessory: 'Accessoire custom', merchCollection: 'Collection merch',
    textileSub: 'Sublimation textile', customTumbler: 'Gobelet personnalisé',
    printedClothing: 'Vêtement imprimé', eventMerch: 'Merch événement', promoItem: 'Article promo',
    subCap: 'Casquette sublimation', customTextile: 'Textile personnalisé',
    subPouch: 'Poche sublimation', customSweater: 'Chandail custom', promoObject: 'Objet promo',
    textileCollection: 'Collection textile', drinkwareSub: 'Sublimation drinkware',
    personalizedMerch: 'Merch personnalisé', customItem: 'Article sur mesure',
    workspace: 'Espace de travail', productionStudio: 'Studio production', versatileSpace: 'Versatile espace',
    printZone: 'Zone impression', workshop: 'Atelier', largeFormatPrinter: 'Imprimante grand format',
    proCuttingGear: 'Matériel de découpe pro', collabSpace: 'Espace collab', studioView: 'Vue studio',
    subPresses: 'Presses sublimation', mileEnd: 'Mile-End', production: 'Production',
    versatileSpace2: 'Espace Versatile', creativeWorkshop: 'Atelier créatif',
  },
  en: {
    fineArtPrint: 'Fine Art Print', photoGraphicPoster: 'Photographic Poster', galleryPrint: 'Gallery Print',
    artisticPoster: 'Artistic Poster', fineArtPaper: 'Fine Art Paper Print', proPhotoPrint: 'Pro Photo Print',
    largeFormatFineArt: 'Large Format Fine Art', eventPoster: 'Event Poster',
    largeFormatPrint: 'Large Format Print', premiumPrint: 'Premium Print', exhibitionPrint: 'Exhibition Print',
    collectorPoster: 'Collector Poster', framedFineArt: 'Framed Fine Art', artPhoto: 'Art Photo',
    premiumPaperPrint: 'Premium Paper Print', colorPrint: 'Color Print', promoPoster: 'Promo Poster',
    artisticPrint: 'Artistic Print', cottonPaperPrint: 'Cotton Paper Print',
    largeFormatPoster: 'Large Format Poster', galleryFineArt: 'Gallery Fine Art',
    photographicPrint: 'Photographic Print', limitedEdition: 'Limited Edition Print',
    proPrint: 'Professional Print', artisticPoster2: 'Artistic Poster', premiumPrint2: 'Premium Print',
    holoStickers: 'Holographic Stickers', customDieCut: 'Custom Die-Cut',
    matteVinyl: 'Matte Vinyl Stickers', labelStickers: 'Label Stickers', glossyStickers: 'Glossy Stickers',
    clearStickers: 'Clear Stickers', customPack: 'Custom Sticker Pack', contourDieCut: 'Contour Die-Cut',
    eventStickers: 'Event Stickers', promoStickers: 'Promo Stickers',
    customStickers: 'Custom Stickers', premiumHolo: 'Premium Holographic Stickers',
    subTshirt: 'Sublimation T-Shirt', customHoodie: 'Custom Hoodie', artistMerch: 'Artist Merch',
    customMug: 'Custom Mug', subTumbler: 'Sublimation Tumbler', mousepad: 'Mousepad',
    subKeychain: 'Sublimation Keychain', allOverTshirt: 'All-Over Print T-Shirt',
    customAccessory: 'Custom Accessory', merchCollection: 'Merch Collection',
    textileSub: 'Textile Sublimation', customTumbler: 'Custom Tumbler',
    printedClothing: 'Printed Clothing', eventMerch: 'Event Merch', promoItem: 'Promo Item',
    subCap: 'Sublimation Cap', customTextile: 'Custom Textile',
    subPouch: 'Sublimation Pouch', customSweater: 'Custom Sweater', promoObject: 'Promo Object',
    textileCollection: 'Textile Collection', drinkwareSub: 'Drinkware Sublimation',
    personalizedMerch: 'Personalized Merch', customItem: 'Custom Item',
    workspace: 'Workspace', productionStudio: 'Production Studio', versatileSpace: 'Versatile Space',
    printZone: 'Print Zone', workshop: 'Workshop', largeFormatPrinter: 'Large Format Printer',
    proCuttingGear: 'Pro Cutting Gear', collabSpace: 'Collab Space', studioView: 'Studio View',
    subPresses: 'Sublimation Presses', mileEnd: 'Mile-End', production: 'Production',
    versatileSpace2: 'Versatile Space', creativeWorkshop: 'Creative Workshop',
  },
};

function Portfolio() {
  const { lang, t } = useLang();
  const [activeCategory, setActiveCategory] = useState('all');
  const [lightboxImage, setLightboxImage] = useState(null);

  const cats = t('portfolioPage.categories');
  const categories = [
    { id: 'all', label: cats.all },
    { id: 'prints', label: cats.prints },
    { id: 'stickers', label: cats.stickers },
    { id: 'textile', label: cats.textile },
    { id: 'locale', label: cats.locale },
  ];

  const filteredProjects = activeCategory === 'all'
    ? projects
    : projects.filter(p => p.category === activeCategory);

  const getTitle = (key) => projectTitles[lang]?.[key] || projectTitles.fr[key] || key;

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
                style={{ aspectRatio: '1' }}
                onClick={() => setLightboxImage(project)}
              >
                <img
                  src={thumb(project.path)}
                  alt={getTitle(project.titleKey)}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white font-heading font-bold text-sm">{getTitle(project.titleKey)}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 cursor-pointer"
            style={{ background: 'rgba(0, 0, 0, 0.95)' }}
            onClick={() => setLightboxImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-5xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={img(lightboxImage.path)}
                alt={getTitle(lightboxImage.titleKey)}
                className="w-full h-full object-contain rounded-lg"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                <h3 className="text-white font-heading font-bold text-xl">{getTitle(lightboxImage.titleKey)}</h3>
              </div>
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl font-bold transition-colors w-10 h-10 flex items-center justify-center rounded-full"
                style={{ background: 'rgba(0,0,0,0.5)' }}
              >
                &times;
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Portfolio;
