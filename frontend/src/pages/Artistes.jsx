import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MessageSquare } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import artistsData from '../data/artists';

function Artistes() {
  const { lang } = useLang();
  const artists = Object.values(artistsData);

  return (
    <>
      <SEO
        title={lang === 'fr' ? 'Artistes — Tirages Fine Art | Massive Medias' : 'Artists — Fine Art Prints | Massive Medias'}
        description={lang === 'fr'
          ? 'Découvrez les artistes de Massive Medias. Tirages fine art professionnels, qualité galerie. Montréal.'
          : 'Discover Massive Medias artists. Professional fine art prints, gallery quality. Montreal.'}
        breadcrumbs={[
          { name: lang === 'fr' ? 'Accueil' : 'Home', url: '/' },
          { name: lang === 'fr' ? 'Artistes' : 'Artists' },
        ]}
      />

      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 hero-aurora"></div>
        <div className="relative z-10 section-container !py-0 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-heading mb-6">
              {lang === 'fr' ? 'Artistes' : 'Artists'}
            </h1>
            <p className="text-xl md:text-2xl text-grey-light max-w-3xl mx-auto">
              {lang === 'fr'
                ? 'Tirages fine art d\'artistes sélectionnés. Imprimés professionnellement, qualité galerie.'
                : 'Fine art prints from selected artists. Professionally printed, gallery quality.'}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="section-container">
        {/* Artists grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20">
          {artists.map((artist, index) => {
            const tagline = lang === 'fr' ? artist.tagline.fr : artist.tagline.en;
            const minPrice = Math.min(...Object.values(artist.pricing.studio));

            return (
              <motion.div
                key={artist.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link
                  to={`/artistes/${artist.slug}`}
                  className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 card-bg-bordered"
                >
                  <div className="relative overflow-hidden aspect-[4/3]">
                    <img
                      src={artist.heroImage}
                      alt={artist.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="text-white/70 text-xs">
                        {artist.prints.length} {lang === 'fr' ? 'oeuvres' : 'artworks'}
                      </div>
                      <div className="text-white text-xs mt-0.5">
                        {lang === 'fr' ? `À partir de ${minPrice}$` : `Starting at $${minPrice}`}
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h2 className="text-2xl font-heading font-bold text-heading mb-1">
                      {artist.name}
                    </h2>
                    <p className="text-grey-muted text-sm mb-4">{tagline}</p>
                    <span className="inline-flex items-center gap-1.5 text-accent text-sm font-semibold group-hover:gap-2.5 transition-all">
                      {lang === 'fr' ? 'Voir la boutique' : 'View shop'}
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* CTA for artists */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center p-12 rounded-2xl mb-8 cta-text-bordered"
        >
          <h2 className="text-3xl font-heading font-bold text-heading mb-4">
            {lang === 'fr' ? 'Tu es artiste?' : 'Are you an artist?'}
          </h2>
          <p className="text-grey-light text-lg mb-8 max-w-2xl mx-auto">
            {lang === 'fr'
              ? 'Rejoins notre plateforme. On s\'occupe de tout : site web dédié, impression pro, packaging et shipping. Tu fournis tes fichiers, tu fixes ta marge, et tu reçois ton argent. Zéro mal de tête.'
              : 'Join our platform. We handle everything: dedicated website, professional printing, packaging and shipping. You provide your files, set your margin, and get paid. Zero headaches.'}
          </p>
          <Link to="/contact" className="btn-primary">
            <MessageSquare size={20} className="mr-2" />
            {lang === 'fr' ? 'Nous contacter' : 'Contact us'}
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </motion.div>
      </div>
    </>
  );
}

export default Artistes;
