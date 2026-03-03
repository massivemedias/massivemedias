import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Lock, Shirt, Coffee, ShoppingBag, Image, Scissors } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import artistsData from '../data/artists';

const merchMassiveItems = [
  { fr: 'T-Shirts', en: 'T-Shirts', icon: Shirt, link: '/boutique/merch-tshirt' },
  { fr: 'Hoodies', en: 'Hoodies', icon: Shirt },
  { fr: 'Mugs', en: 'Mugs', icon: Coffee },
  { fr: 'Tote Bags', en: 'Tote Bags', icon: ShoppingBag },
];

// Maudite Machine (Massive) en premier
const artistOrder = ['maudite-machine', 'psyqu33n', 'adrift', 'mok'];

function Boutique() {
  const { lang } = useLang();
  const [view, setView] = useState('main'); // 'main' | 'prints'

  const orderedArtists = artistOrder
    .map(slug => ({ ...artistsData[slug], slug }))
    .filter(a => a.name);

  const totalPrintCount = orderedArtists.reduce((sum, a) => sum + (a.prints?.length || 0), 0);

  // ── Vue Prints par artiste ──
  if (view === 'prints') {
    return (
      <>
        <SEO
          title={lang === 'fr' ? 'Prints - Boutique | Massive Medias' : 'Prints - Shop | Massive Medias'}
          description=""
          noindex
        />

        <section className="relative py-16 overflow-hidden">
          <div className="absolute inset-0 hero-aurora"></div>
          <div className="relative z-10 section-container !py-0 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-7xl font-heading font-bold text-heading mb-4">
                Prints
              </h1>
              <p className="text-xl text-grey-light max-w-3xl mx-auto">
                {lang === 'fr'
                  ? 'Tirages fine art par nos artistes. Cliquez sur une oeuvre pour configurer votre tirage.'
                  : 'Fine art prints by our artists. Click an artwork to configure your print.'}
              </p>
            </motion.div>
          </div>
        </section>

        <div className="section-container max-w-7xl mx-auto">
          <button
            onClick={() => setView('main')}
            className="inline-flex items-center gap-2 text-grey-muted hover:text-accent transition-colors mb-10 text-sm"
          >
            <ArrowLeft size={16} />
            {lang === 'fr' ? 'Retour a la boutique' : 'Back to shop'}
          </button>

          {/* Artists sections */}
          {orderedArtists.map((artist, ai) => {
            const hasPrints = artist.prints && artist.prints.length > 0;
            const minPrice = hasPrints ? Math.min(...Object.values(artist.pricing.studio)) : null;

            return (
              <motion.div
                key={artist.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: ai * 0.1 }}
                viewport={{ once: true }}
                className="mb-16"
              >
                {/* Artist header */}
                <Link
                  to={`/artistes/${artist.slug}`}
                  className="group flex items-center gap-4 mb-6 hover:opacity-80 transition-opacity"
                >
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden ring-2 ring-purple-main/20 group-hover:ring-accent/60 transition-all flex-shrink-0">
                    <img
                      src={artist.avatar || artist.heroImage}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-heading font-bold text-heading group-hover:text-accent transition-colors">
                      {artist.name}
                    </h2>
                    <p className="text-grey-muted text-xs">
                      {hasPrints
                        ? `${artist.prints.length} ${lang === 'fr' ? 'oeuvres' : 'artworks'}${minPrice ? (lang === 'fr' ? ` - a partir de ${minPrice}$` : ` - from $${minPrice}`) : ''}`
                        : (lang === 'fr' ? 'Bientot disponible' : 'Coming soon')}
                    </p>
                  </div>
                  <ArrowRight size={18} className="text-grey-muted group-hover:text-accent ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all" />
                </Link>

                {/* Prints grid */}
                {hasPrints ? (
                  <div className="flex flex-wrap gap-4">
                    {artist.prints.map((print, pi) => (
                      <motion.div
                        key={print.id}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: pi * 0.03 }}
                        viewport={{ once: true }}
                        className="w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.667rem)] lg:w-[calc(20%-0.8rem)]"
                      >
                        <Link
                          to={`/artistes/${artist.slug}`}
                          className="group block rounded-2xl overflow-hidden card-bg-bordered hover:border-accent/50 transition-all duration-300"
                        >
                          <div className="aspect-[2/3] overflow-hidden">
                            <img
                              src={print.image}
                              alt={lang === 'fr' ? print.titleFr : print.titleEn}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                          </div>
                          <div className="p-3">
                            <h3 className="text-sm font-heading font-bold text-heading truncate">
                              {lang === 'fr' ? print.titleFr : print.titleEn}
                            </h3>
                            <p className="text-accent text-xs font-semibold mt-1">
                              {lang === 'fr' ? `A partir de ${minPrice}$` : `From $${minPrice}`}
                            </p>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-purple-main/20 p-8 text-center">
                    <p className="text-grey-muted text-sm">
                      {lang === 'fr'
                        ? 'Prints bientot disponibles. Restez a l\'affut!'
                        : 'Prints coming soon. Stay tuned!'}
                    </p>
                  </div>
                )}

                {/* Separator between artists */}
                {ai < orderedArtists.length - 1 && (
                  <div className="border-t border-grey-muted/10 mt-12" />
                )}
              </motion.div>
            );
          })}
        </div>
      </>
    );
  }

  // ── Vue principale (categories) ──
  return (
    <>
      <SEO
        title={lang === 'fr' ? 'Boutique | Massive Medias' : 'Shop | Massive Medias'}
        description={lang === 'fr'
          ? 'Boutique Massive Medias. Tirages fine art, stickers custom, merch. Montreal.'
          : 'Massive Medias Shop. Fine art prints, custom stickers, merch. Montreal.'}
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
                ? 'Prints, stickers, merch - tout imprime a Montreal.'
                : 'Prints, stickers, merch - everything printed in Montreal.'}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="section-container max-w-5xl mx-auto">

        {/* ── Categories ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">

          {/* Prints */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <button
              onClick={() => { setView('prints'); window.scrollTo(0, 0); }}
              className="group w-full rounded-2xl overflow-hidden card-bg-bordered hover:border-accent/50 transition-all duration-300 text-left"
            >
              <div className="aspect-[4/3] bg-glass flex items-center justify-center relative">
                <Image size={48} className="text-accent/40 group-hover:text-accent/70 transition-colors" />
              </div>
              <div className="p-5">
                <h2 className="text-xl font-heading font-bold text-heading group-hover:text-accent transition-colors mb-1">
                  Prints
                </h2>
                <p className="text-grey-muted text-xs mb-3">
                  {lang === 'fr'
                    ? `${totalPrintCount} tirages fine art`
                    : `${totalPrintCount} fine art prints`}
                </p>
                <span className="inline-flex items-center gap-1.5 text-accent text-xs font-semibold group-hover:gap-2.5 transition-all">
                  {lang === 'fr' ? 'Explorer' : 'Explore'}
                  <ArrowRight size={14} />
                </span>
              </div>
            </button>
          </motion.div>

          {/* Stickers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <Link
              to="/boutique/stickers"
              className="group block w-full rounded-2xl overflow-hidden card-bg-bordered hover:border-accent/50 transition-all duration-300"
            >
              <div className="aspect-[4/3] bg-glass flex items-center justify-center relative">
                <Scissors size={48} className="text-accent/40 group-hover:text-accent/70 transition-colors" />
              </div>
              <div className="p-5">
                <h2 className="text-xl font-heading font-bold text-heading group-hover:text-accent transition-colors mb-1">
                  Stickers
                </h2>
                <p className="text-grey-muted text-xs mb-3">
                  {lang === 'fr'
                    ? 'Vinyle die-cut, qualite pro'
                    : 'Die-cut vinyl, pro quality'}
                </p>
                <span className="inline-flex items-center gap-1.5 text-accent text-xs font-semibold group-hover:gap-2.5 transition-all">
                  {lang === 'fr' ? 'Commander' : 'Order'}
                  <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* ── Separateur ── */}
        <div className="border-t border-grey-muted/20 mb-16" />

        {/* ── Merch Massive ── */}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
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
                    <div className="aspect-square bg-glass flex items-center justify-center">
                      <Icon size={40} className={isActive ? 'text-accent/60 group-hover:text-accent transition-colors' : 'text-grey-muted/40'} />
                    </div>
                    {!isActive && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="px-3 py-1.5 rounded-full bg-glass backdrop-blur-sm text-grey-muted text-xs font-semibold uppercase tracking-wider border border-white/10 flex items-center gap-1.5">
                          <Lock size={12} />
                          {lang === 'fr' ? 'Bientot' : 'Soon'}
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
                    <div className="p-3 text-center">
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

        {/* ── Separateur ── */}
        <div className="border-t border-grey-muted/20 mb-16" />

        {/* ── Sublimation ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <Link
            to="/boutique/sublimation"
            className="group flex items-center gap-6 p-8 rounded-2xl card-bg-bordered hover:border-accent/50 transition-all duration-300"
          >
            <div className="w-14 h-14 rounded-xl bg-glass flex items-center justify-center flex-shrink-0 group-hover:bg-accent/10 transition-colors">
              <Shirt size={28} className="text-accent/60 group-hover:text-accent transition-colors" />
            </div>
            <div className="flex-grow">
              <h2 className="text-xl md:text-2xl font-heading font-bold text-heading group-hover:text-accent transition-colors">
                Sublimation & Merch Custom
              </h2>
              <p className="text-grey-muted text-sm mt-1">
                {lang === 'fr'
                  ? 'T-shirts, hoodies, mugs - impression permanente sur mesure'
                  : 'T-shirts, hoodies, mugs - custom permanent printing'}
              </p>
            </div>
            <ArrowRight size={24} className="text-grey-muted group-hover:text-accent group-hover:translate-x-1 transition-all flex-shrink-0" />
          </Link>
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
