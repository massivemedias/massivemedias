import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock, Scissors, Frame, Shirt, Coffee, ShoppingBag, Image } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import artistsData from '../data/artists';

const merchMassiveItems = [
  { fr: 'Stickers Massive', en: 'Massive Stickers', icon: Scissors },
  { fr: 'Prints Massive', en: 'Massive Prints', icon: Frame },
  { fr: 'T-Shirts', en: 'T-Shirts', icon: Shirt, link: '/boutique/merch-tshirt' },
  { fr: 'Hoodies', en: 'Hoodies', icon: Shirt },
  { fr: 'Mugs', en: 'Mugs', icon: Coffee },
  { fr: 'Tote Bags', en: 'Tote Bags', icon: ShoppingBag },
];

const featuredArtistSlugs = ['psyqu33n', 'adrift', 'mok', 'maudite-machine'];

function Boutique() {
  const { lang } = useLang();

  const artists = featuredArtistSlugs
    .map(slug => artistsData[slug])
    .filter(Boolean);

  return (
    <>
      <SEO
        title={lang === 'fr' ? 'Boutique | Massive Medias' : 'Shop | Massive Medias'}
        description={lang === 'fr'
          ? 'Boutique Massive Medias. Tirages fine art par nos artistes - Psyqu33n, Adrift, Mok, Maudite Machine. Merch officiel bientot disponible.'
          : 'Massive Medias Shop. Fine art prints by our artists - Psyqu33n, Adrift, Mok, Maudite Machine. Official merch coming soon.'}
        breadcrumbs={[
          { name: lang === 'fr' ? 'Accueil' : 'Home', url: '/' },
          { name: lang === 'fr' ? 'Boutique' : 'Shop' },
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
              {lang === 'fr' ? 'Boutique' : 'Shop'}
            </h1>
            <p className="text-xl md:text-2xl text-grey-light max-w-3xl mx-auto">
              {lang === 'fr'
                ? 'Tirages fine art par les artistes Massive Medias. Imprime et encadre a Montreal.'
                : 'Fine art prints by Massive Medias artists. Printed and framed in Montreal.'}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="section-container max-w-7xl mx-auto">

        {/* ── Artistes Massive Medias ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gradient mb-3">
              {lang === 'fr' ? 'Nos artistes' : 'Our Artists'}
            </h2>
            <p className="text-grey-muted max-w-2xl mx-auto">
              {lang === 'fr'
                ? 'Decouvrez les oeuvres de nos artistes. Tirages fine art, qualite galerie.'
                : 'Discover our artists\' works. Fine art prints, gallery quality.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {artists.map((artist, i) => {
              const minPrice = Math.min(...Object.values(artist.pricing.studio));
              const tagline = lang === 'fr' ? artist.tagline.fr : artist.tagline.en;
              return (
                <motion.div
                  key={artist.slug}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  viewport={{ once: true }}
                >
                  <Link
                    to={`/artistes/${artist.slug}`}
                    className="block group rounded-2xl overflow-hidden card-bg-bordered hover:border-accent/50 transition-all duration-300"
                  >
                    {/* Image / hero */}
                    <div className="relative aspect-[16/9] bg-glass overflow-hidden">
                      {artist.heroImage ? (
                        <img
                          src={artist.heroImage}
                          alt={artist.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image size={48} className="text-grey-muted/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-2xl font-heading font-bold text-white drop-shadow-lg">
                          {artist.name}
                        </h3>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-5">
                      <p className="text-grey-light text-sm mb-3">{tagline}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-grey-muted text-xs">
                          {artist.prints.length} {lang === 'fr' ? 'oeuvres' : 'artworks'} - {lang === 'fr' ? 'a partir de' : 'from'} {minPrice}$
                        </span>
                        <span className="text-accent text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                          {lang === 'fr' ? 'Voir' : 'View'}
                          <ArrowRight size={16} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Separateur ── */}
        <div className="border-t border-grey-muted/20 mb-16" />

        {/* ── Merch Massive (Coming Soon) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gradient mb-3">
              Merch Massive
            </h2>
            <p className="text-grey-muted max-w-2xl mx-auto">
              {lang === 'fr'
                ? 'Notre collection de produits arrive bientot.'
                : 'Our product collection coming soon.'}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {merchMassiveItems.map((item, i) => {
              const Icon = item.icon;
              const isActive = !!item.link;
              const Wrapper = isActive ? Link : 'div';
              const wrapperProps = isActive ? { to: item.link } : {};
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  viewport={{ once: true }}
                >
                  <Wrapper
                    {...wrapperProps}
                    className={`block relative rounded-2xl overflow-hidden card-bg-bordered ${
                      isActive
                        ? 'cursor-pointer hover:border-accent/50 transition-all duration-300 group'
                        : 'opacity-50 cursor-default'
                    }`}
                  >
                    <div className="aspect-[16/10] bg-glass flex items-center justify-center">
                      <Icon size={48} className={isActive ? 'text-accent/60 group-hover:text-accent transition-colors' : 'text-grey-muted/40'} />
                    </div>
                    {!isActive && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="px-3 py-1.5 rounded-full bg-glass backdrop-blur-sm text-grey-muted text-xs font-semibold uppercase tracking-wider border border-white/10 flex items-center gap-1.5">
                          <Lock size={12} />
                          {lang === 'fr' ? 'Bientot' : 'Coming Soon'}
                        </span>
                      </div>
                    )}
                    {isActive && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 rounded-full bg-accent/20 text-accent text-[10px] font-bold uppercase tracking-wider">
                          {lang === 'fr' ? 'Nouveau' : 'New'}
                        </span>
                      </div>
                    )}
                    <div className="p-4 text-center">
                      <h3 className={`text-sm font-heading font-bold ${isActive ? 'text-heading' : 'text-grey-muted'}`}>
                        {lang === 'fr' ? item.fr : item.en}
                      </h3>
                      {isActive && (
                        <span className="text-accent text-xs font-semibold flex items-center justify-center gap-1 mt-1 group-hover:gap-2 transition-all">
                          {lang === 'fr' ? 'Configurer' : 'Configure'}
                          <ArrowRight size={14} />
                        </span>
                      )}
                    </div>
                  </Wrapper>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA - Services custom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center p-12 rounded-2xl mb-8 cta-text-bordered"
        >
          <h2 className="text-3xl font-heading font-bold text-heading mb-4">
            {lang === 'fr' ? 'Besoin d\'impression custom?' : 'Need custom printing?'}
          </h2>
          <p className="text-grey-light text-lg mb-8 max-w-2xl mx-auto">
            {lang === 'fr'
              ? 'Stickers, prints fine art, sublimation, design graphique - consultez nos services.'
              : 'Stickers, fine art prints, sublimation, graphic design - check out our services.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/services" className="btn-primary">
              {lang === 'fr' ? 'Voir nos services' : 'See our services'}
              <ArrowRight className="ml-2" size={20} />
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default Boutique;
