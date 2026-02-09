import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const categories = [
  { id: 'all', label: 'Tout' },
  { id: 'prints', label: 'Impressions' },
  { id: 'stickers', label: 'Stickers' },
  { id: 'textile', label: 'Textile & Merch' },
  { id: 'locale', label: 'Studio' },
];

const projects = [
  // Prints
  { image: '/images/prints/Prints1.jpeg', title: 'Tirage Fine Art', category: 'prints' },
  { image: '/images/prints/Prints2.jpeg', title: 'Affiche photographique', category: 'prints' },
  { image: '/images/prints/Prints3.jpeg', title: 'Print galerie', category: 'prints' },
  { image: '/images/prints/Prints4.JPG', title: 'Poster artistique', category: 'prints' },
  { image: '/images/prints/Prints5.jpeg', title: 'Impression sur Hahnemühle', category: 'prints' },
  { image: '/images/prints/Prints6.jpeg', title: 'Tirage photo pro', category: 'prints' },
  { image: '/images/prints/Prints7.jpeg', title: 'Fine art Canon Pro-1000', category: 'prints' },
  { image: '/images/prints/Prints8.jpeg', title: 'Affiche événement', category: 'prints' },
  { image: '/images/prints/Prints9.jpeg', title: 'Impression grand format', category: 'prints' },
  { image: '/images/prints/Prints10.jpeg', title: 'Print premium', category: 'prints' },
  { image: '/images/prints/Prints11.jpeg', title: 'Tirage d\'exposition', category: 'prints' },
  { image: '/images/prints/Prints12.jpeg', title: 'Poster collector', category: 'prints' },
  { image: '/images/prints/Prints13.jpeg', title: 'Fine art encadré', category: 'prints' },
  { image: '/images/prints/Prints14.jpeg', title: 'Photo d\'art', category: 'prints' },
  { image: '/images/prints/Prints15.jpeg', title: 'Impression Ilford', category: 'prints' },
  { image: '/images/prints/Prints16.jpeg', title: 'Tirage couleur', category: 'prints' },
  { image: '/images/prints/Prints17.jpeg', title: 'Affiche promo', category: 'prints' },
  { image: '/images/prints/Prints18.jpeg', title: 'Print artistique', category: 'prints' },
  { image: '/images/prints/Prints19.jpeg', title: 'Impression sur papier coton', category: 'prints' },
  { image: '/images/prints/Prints20.jpeg', title: 'Poster grand format', category: 'prints' },
  { image: '/images/prints/Prints21.jpeg', title: 'Fine art galerie', category: 'prints' },
  { image: '/images/prints/Prints22.jpeg', title: 'Tirage photographique', category: 'prints' },
  { image: '/images/prints/Prints23.jpeg', title: 'Print limited edition', category: 'prints' },
  { image: '/images/prints/Prints24.jpeg', title: 'Impression professionnelle', category: 'prints' },
  { image: '/images/prints/Prints25.jpeg', title: 'Affiche artistique', category: 'prints' },
  { image: '/images/prints/Prints26.jpeg', title: 'Tirage premium', category: 'prints' },
  // Stickers
  { image: '/images/stickers/Stickers1.jpeg', title: 'Stickers holographiques', category: 'stickers' },
  { image: '/images/stickers/Stickers2.jpg', title: 'Die-cut personnalisé', category: 'stickers' },
  { image: '/images/stickers/Stickers3.jpeg', title: 'Stickers vinyle matte', category: 'stickers' },
  { image: '/images/stickers/Stickers4.jpeg', title: 'Autocollants label', category: 'stickers' },
  { image: '/images/stickers/Stickers5.jpeg', title: 'Stickers glossy', category: 'stickers' },
  { image: '/images/stickers/Stickers9.jpeg', title: 'Stickers transparent', category: 'stickers' },
  { image: '/images/stickers/Stickers10.jpeg', title: 'Pack stickers custom', category: 'stickers' },
  { image: '/images/stickers/Stickers11.jpeg', title: 'Die-cut contour', category: 'stickers' },
  { image: '/images/stickers/Stickers12.jpeg', title: 'Stickers événement', category: 'stickers' },
  { image: '/images/stickers/Stickers13.jpeg', title: 'Stickers promo', category: 'stickers' },
  { image: '/images/stickers/Stickers14.jpeg', title: 'Autocollants sur mesure', category: 'stickers' },
  { image: '/images/stickers/Stickers15.jpeg', title: 'Stickers holographiques premium', category: 'stickers' },
  // Textile
  { image: '/images/textile/Textile1.jpeg', title: 'T-shirt sublimation', category: 'textile' },
  { image: '/images/textile/Textile2.jpeg', title: 'Hoodie custom', category: 'textile' },
  { image: '/images/textile/Textile3.jpeg', title: 'Merch artiste', category: 'textile' },
  { image: '/images/textile/Textile4.jpeg', title: 'Mug personnalisé', category: 'textile' },
  { image: '/images/textile/Textile5.jpeg', title: 'Thermos sublimation', category: 'textile' },
  { image: '/images/textile/Textile6.jpeg', title: 'Tapis de souris', category: 'textile' },
  { image: '/images/textile/Textile7.jpeg', title: 'Porte-clés sublimation', category: 'textile' },
  { image: '/images/textile/Textile8.jpeg', title: 'T-shirt all-over print', category: 'textile' },
  { image: '/images/textile/Textile9.jpeg', title: 'Accessoire custom', category: 'textile' },
  { image: '/images/textile/Textile10.jpeg', title: 'Collection merch', category: 'textile' },
  { image: '/images/textile/Textile11.jpeg', title: 'Sublimation textile', category: 'textile' },
  { image: '/images/textile/Textile13.jpeg', title: 'Gobelet personnalisé', category: 'textile' },
  { image: '/images/textile/Textile14.jpeg', title: 'Vêtement imprimé', category: 'textile' },
  { image: '/images/textile/Textile15.jpeg', title: 'Merch événement', category: 'textile' },
  { image: '/images/textile/Textile16.jpeg', title: 'Article promo', category: 'textile' },
  { image: '/images/textile/Textile17.jpeg', title: 'Casquette sublimation', category: 'textile' },
  { image: '/images/textile/Textile18.jpeg', title: 'Textile personnalisé', category: 'textile' },
  { image: '/images/textile/Textile19.jpeg', title: 'Poche sublimation', category: 'textile' },
  { image: '/images/textile/Textile20.jpeg', title: 'Chandail custom', category: 'textile' },
  { image: '/images/textile/Textile21.jpeg', title: 'Objet promo', category: 'textile' },
  { image: '/images/textile/Textile22.jpeg', title: 'Collection textile', category: 'textile' },
  { image: '/images/textile/Textile23.jpeg', title: 'Sublimation drinkware', category: 'textile' },
  { image: '/images/textile/Textile24.jpeg', title: 'Merch personnalisé', category: 'textile' },
  { image: '/images/textile/Textile25.jpeg', title: 'Article sur mesure', category: 'textile' },
  // Locale / studio
  { image: '/images/locale/locale1.jpeg', title: 'Espace de travail', category: 'locale' },
  { image: '/images/locale/locale2.jpeg', title: 'Studio production', category: 'locale' },
  { image: '/images/locale/locale3.jpeg', title: 'Versatile espace', category: 'locale' },
  { image: '/images/locale/locale4.jpeg', title: 'Zone impression', category: 'locale' },
  { image: '/images/locale/locale5.jpeg', title: 'Atelier', category: 'locale' },
  { image: '/images/locale/locale6.jpeg', title: 'Canon Pro-1000', category: 'locale' },
  { image: '/images/locale/locale7.jpeg', title: 'Silhouette Cameo 5', category: 'locale' },
  { image: '/images/locale/locale8.jpeg', title: 'Espace collab', category: 'locale' },
  { image: '/images/locale/locale9.jpeg', title: 'Vue studio', category: 'locale' },
  { image: '/images/locale/locale10.jpeg', title: 'Presses sublimation', category: 'locale' },
  { image: '/images/locale/locale11.jpeg', title: 'Mile-End', category: 'locale' },
  { image: '/images/locale/locale12.jpeg', title: 'Production', category: 'locale' },
  { image: '/images/locale/locale13.jpeg', title: 'Espace Versatile', category: 'locale' },
  { image: '/images/locale/locale14.jpeg', title: 'Atelier créatif', category: 'locale' },
];

function Portfolio() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [lightboxImage, setLightboxImage] = useState(null);

  const filteredProjects = activeCategory === 'all'
    ? projects
    : projects.filter(p => p.category === activeCategory);

  return (
    <>
      <Helmet>
        <title>Portfolio — Massive Medias</title>
        <meta name="description" content="Galerie de nos réalisations : impressions fine art, stickers, merch textile, design graphique et plus." />
      </Helmet>

      {/* Hero */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/prints/Prints2.jpeg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,10,10,0.9) 0%, rgba(26,0,51,0.95) 100%)' }}></div>
        </div>
        <div className="relative z-10 section-container !py-0 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-white mb-6">
              Portfolio
            </h1>
            <p className="text-xl md:text-2xl text-grey-light max-w-3xl mx-auto">
              Un aperçu de nos réalisations. Chaque projet est unique, chaque détail compte.
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
                  ? 'linear-gradient(135deg, #D700FE, #FF00A4)'
                  : 'rgba(49, 0, 81, 0.5)',
                color: '#FFFFFF',
                border: activeCategory === cat.id
                  ? 'none'
                  : '1px solid rgba(70, 1, 94, 0.5)',
                boxShadow: activeCategory === cat.id
                  ? '0 0 20px rgba(255, 0, 164, 0.3)'
                  : 'none',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Compteur */}
        <p className="text-center text-grey-muted mb-8">
          {filteredProjects.length} projet{filteredProjects.length > 1 ? 's' : ''}
        </p>

        {/* Grille */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.image}
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
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white font-heading font-bold text-sm">{project.title}</p>
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
                src={lightboxImage.image}
                alt={lightboxImage.title}
                className="w-full h-full object-contain rounded-lg"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                <h3 className="text-white font-heading font-bold text-xl">{lightboxImage.title}</h3>
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
