import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingCart, MessageSquare } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { thumb } from '../utils/paths';
import getServicesData from '../data/getServicesData';

const boutiqueItems = [
  {
    slug: 'stickers',
    serviceKey: 'stickers-custom',
    startingPrice: '30$',
    hasCart: true,
    image: thumb('/images/stickers/Stickers-Cosmo.webp'),
  },
  {
    slug: 'fine-art',
    serviceKey: 'impression-fine-art',
    startingPrice: '16$',
    hasCart: true,
    image: thumb('/images/prints/FineArt1.webp'),
  },
  {
    slug: 'sublimation',
    serviceKey: 'sublimation-merch',
    startingPrice: '30$',
    hasCart: true,
    image: thumb('/images/textile/Textile1.webp'),
  },
  {
    slug: 'flyers',
    serviceKey: 'flyers-cartes',
    startingPrice: '40$',
    hasCart: true,
    image: thumb('/images/flyers/coagule.webp'),
  },
  {
    slug: 'design',
    serviceKey: 'design-graphique',
    startingPrice: '150$',
    hasCart: false,
    image: thumb('/images/graphism/logo_massive.webp'),
  },
  {
    slug: 'web',
    serviceKey: 'developpement-web',
    startingPrice: '900$',
    hasCart: false,
    image: thumb('/images/web/devweb_hero.webp'),
  },
];

function Boutique() {
  const { lang } = useLang();
  const servicesData = getServicesData(lang);

  return (
    <>
      <SEO
        title={lang === 'fr' ? 'Boutique | Massive Medias' : 'Shop | Massive Medias'}
        description={lang === 'fr'
          ? 'Boutique Massive Medias. Stickers, impressions fine art, sublimation, flyers, design graphique, d\u00e9veloppement web. Montr\u00e9al.'
          : 'Massive Medias Shop. Stickers, fine art prints, sublimation, flyers, graphic design, web development. Montreal.'}
        breadcrumbs={[
          { name: lang === 'fr' ? 'Accueil' : 'Home', url: '/' },
          { name: lang === 'fr' ? 'Boutique' : 'Shop' },
        ]}
      />

      {/* Hero */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img src={thumb('/images/stickers/Stickers-Cosmo.webp')} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'var(--hero-gradient)' }} />
        </div>
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
                ? 'Tous nos services de cr\u00e9ation et production. Commandez en ligne ou demandez un devis.'
                : 'All our creation and production services. Order online or request a quote.'}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="section-container max-w-7xl mx-auto">

        {/* Service cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {boutiqueItems.map((item, i) => {
            const service = servicesData[item.serviceKey];
            if (!service) return null;
            return (
              <motion.div
                key={item.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                viewport={{ once: true }}
              >
                <Link
                  to={`/boutique/${item.slug}`}
                  className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', boxShadow: 'var(--card-shadow)' }}
                >
                  <div className="relative overflow-hidden" style={{ aspectRatio: '16/10' }}>
                    <img
                      src={item.image}
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                      <div>
                        <div className="text-white/70 text-xs font-medium mb-1">
                          {lang === 'fr' ? '\u00c0 partir de' : 'Starting at'}
                        </div>
                        <div className="text-white text-2xl font-heading font-bold">
                          {item.startingPrice}
                        </div>
                      </div>
                      <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${item.hasCart ? 'bg-magenta text-white' : 'bg-white/20 text-white backdrop-blur-sm'}`}>
                        {item.hasCart
                          ? (lang === 'fr' ? 'Commander' : 'Order')
                          : (lang === 'fr' ? 'Devis' : 'Quote')}
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      {service.icon && <service.icon size={20} className="text-magenta flex-shrink-0" />}
                      <h2 className="text-xl font-heading font-bold text-heading">
                        {service.title}
                      </h2>
                    </div>
                    <p className="text-grey-muted text-sm mb-4 line-clamp-2">
                      {service.subtitle}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-magenta text-sm font-semibold group-hover:gap-2.5 transition-all">
                      {item.hasCart
                        ? (<><ShoppingCart size={16} />{lang === 'fr' ? 'Voir les options' : 'See options'}</>)
                        : (<><MessageSquare size={16} />{lang === 'fr' ? 'Demander un devis' : 'Request a quote'}</>)}
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center p-12 rounded-2xl mb-8"
          style={{ background: 'var(--cta-text-bg)', border: '1px solid var(--bg-card-border)' }}
        >
          <h2 className="text-3xl font-heading font-bold text-heading mb-4">
            {lang === 'fr' ? 'Besoin d\'aide pour choisir?' : 'Need help choosing?'}
          </h2>
          <p className="text-grey-light text-lg mb-8 max-w-2xl mx-auto">
            {lang === 'fr'
              ? 'Contactez-nous pour discuter de votre projet. On vous guidera vers la meilleure solution.'
              : 'Contact us to discuss your project. We\'ll guide you to the best solution.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/contact" className="btn-primary">
              {lang === 'fr' ? 'Nous contacter' : 'Contact us'}
              <ArrowRight className="ml-2" size={20} />
            </Link>
            <Link to="/tarifs" className="btn-outline">
              {lang === 'fr' ? 'Voir tous les tarifs' : 'View all pricing'}
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default Boutique;
