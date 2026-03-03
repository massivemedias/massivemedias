import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock, Shirt, Coffee, ShoppingBag } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import artistsData from '../data/artists';
import { thumb } from '../utils/paths';

const merchMassiveItems = [
  { fr: 'T-Shirts', en: 'T-Shirts', icon: Shirt, link: '/boutique/merch-tshirt' },
  { fr: 'Hoodies', en: 'Hoodies', icon: Shirt },
  { fr: 'Mugs', en: 'Mugs', icon: Coffee },
  { fr: 'Tote Bags', en: 'Tote Bags', icon: ShoppingBag },
];

const stickerItems = [
  { name: 'Maudite Machine', image: thumb('/images/stickers/Stickers-Maudite-Machine.webp') },
  { name: 'Massive Medias', image: thumb('/images/stickers/Stickers-massive.webp') },
  { name: 'Vrstl Records', image: thumb('/images/stickers/Stickers-Vrstl.webp') },
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

          <div className="flex flex-wrap justify-center gap-10 md:gap-14">
            {artists.map((artist, i) => {
              const minPrice = Math.min(...Object.values(artist.pricing.studio));
              return (
                <motion.div
                  key={artist.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link
                    to={`/artistes/${artist.slug}`}
                    className="group flex flex-col items-center text-center w-40 md:w-48"
                  >
                    <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden ring-2 ring-purple-main/20 group-hover:ring-accent/60 transition-all duration-500 group-hover:scale-105 group-hover:shadow-[0_0_30px_rgba(var(--accent-rgb,255,82,160),0.25)]">
                      <img
                        src={artist.avatar || artist.heroImage}
                        alt={artist.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                    </div>
                    <h3 className="text-base md:text-lg font-heading font-bold text-heading mt-4 mb-0.5 group-hover:text-accent transition-colors duration-300">
                      {artist.name}
                    </h3>
                    <p className="text-grey-muted text-[11px] leading-tight mb-2">
                      {artist.prints.length} {lang === 'fr' ? 'oeuvres' : 'artworks'} · {lang === 'fr' ? `${minPrice}$+` : `$${minPrice}+`}
                    </p>
                    <span className="inline-flex items-center gap-1 text-accent text-xs font-semibold opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                      {lang === 'fr' ? 'Explorer' : 'Explore'}
                      <ArrowRight size={14} />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Separateur ── */}
        <div className="border-t border-grey-muted/20 mb-16" />

        {/* ── Tous les Prints ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gradient mb-3">
              Prints
            </h2>
            <p className="text-grey-muted max-w-2xl mx-auto">
              {lang === 'fr'
                ? 'Tous les tirages fine art disponibles. Cliquez pour configurer.'
                : 'All available fine art prints. Click to configure.'}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {artists.filter(a => a.prints.length > 0).flatMap(artist =>
              artist.prints.map((print, pi) => (
                <motion.div
                  key={print.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: pi * 0.04 }}
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
                      <p className="text-grey-muted text-xs">{artist.name}</p>
                      <p className="text-accent text-xs font-semibold mt-1">
                        {lang === 'fr' ? `A partir de ${Math.min(...Object.values(artist.pricing.studio))}$` : `From $${Math.min(...Object.values(artist.pricing.studio))}`}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* ── Separateur ── */}
        <div className="border-t border-grey-muted/20 mb-16" />

        {/* ── Stickers ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gradient mb-3">
              Stickers
            </h2>
            <p className="text-grey-muted max-w-2xl mx-auto">
              {lang === 'fr'
                ? 'Stickers vinyle die-cut, qualite pro. Contactez-nous pour commander.'
                : 'Die-cut vinyl stickers, pro quality. Contact us to order.'}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {stickerItems.map((sticker, i) => (
              <motion.div
                key={sticker.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                viewport={{ once: true }}
                className="w-48 md:w-56"
              >
                <Link
                  to="/services/stickers"
                  className="group block rounded-2xl overflow-hidden card-bg-bordered hover:border-accent/50 transition-all duration-300"
                >
                  <div className="aspect-square overflow-hidden bg-glass flex items-center justify-center p-4">
                    <img
                      src={sticker.image}
                      alt={sticker.name}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3 text-center">
                    <h3 className="text-sm font-heading font-bold text-heading">{sticker.name}</h3>
                  </div>
                </Link>
              </motion.div>
            ))}
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
