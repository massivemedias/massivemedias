import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingCart, MessageSquare, Package } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { thumb } from '../utils/paths';
import getServicesData from '../data/getServicesData';

const boutiqueItems = [
  {
    slug: 'stickers',
    serviceKey: 'stickers',
    startingPrice: '30$',
    hasCart: true,
    image: thumb('/images/stickers/Stickers-Cosmo.webp'),
  },
  {
    slug: 'fine-art',
    serviceKey: 'prints',
    startingPrice: '16$',
    hasCart: true,
    image: thumb('/images/prints/FineArt1.webp'),
  },
  {
    slug: 'sublimation',
    serviceKey: 'merch',
    startingPrice: '30$',
    hasCart: true,
    image: thumb('/images/textile/Textile1.webp'),
  },
  {
    slug: 'flyers',
    serviceKey: 'prints',
    startingPrice: '40$',
    hasCart: true,
    image: thumb('/images/flyers/discodyssee.webp'),
  },
  {
    slug: 'design',
    serviceKey: 'design',
    startingPrice: '150$',
    hasCart: false,
    image: thumb('/images/graphism/logo_massive.webp'),
    titleOverride: { fr: 'Design Graphique', en: 'Graphic Design' },
    subtitleOverride: { fr: 'Logos, identité visuelle, affiches et retouche photo', en: 'Logos, visual identity, posters and photo retouching' },
  },
  {
    slug: 'web',
    serviceKey: 'design',
    startingPrice: '900$',
    hasCart: false,
    image: thumb('/images/web/devweb_hero.webp'),
    titleOverride: { fr: 'Développement Web', en: 'Web Development' },
    subtitleOverride: { fr: 'Sites web sur mesure, SEO et référencement', en: 'Custom websites, SEO and search ranking' },
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
                  className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 card-bg-bordered"
                >
                  <div className="relative overflow-hidden aspect-[16/10]">
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
                        {item.titleOverride ? item.titleOverride[lang] : service.title}
                      </h2>
                    </div>
                    <p className="text-grey-muted text-sm mb-4 line-clamp-2">
                      {item.subtitleOverride ? item.subtitleOverride[lang] : service.subtitle}
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

        {/* Packages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gradient mb-3">
              {lang === 'fr' ? 'Packages multi-services' : 'Multi-Service Packages'}
            </h2>
            <p className="text-grey-muted max-w-2xl mx-auto">
              {lang === 'fr'
                ? 'Combinez plusieurs services et économisez. Idéal pour les lancements, événements et projets complets.'
                : 'Combine multiple services and save. Ideal for launches, events and full projects.'}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Package,
                title: lang === 'fr' ? 'Pack Artiste' : 'Artist Pack',
                price: lang === 'fr' ? 'À partir de 120$' : 'Starting at $120',
                items: lang === 'fr'
                  ? ['50 stickers die-cut', '10 tirages fine art 8×10"', 'Design graphique inclus']
                  : ['50 die-cut stickers', '10 fine art prints 8×10"', 'Graphic design included'],
                saving: lang === 'fr' ? 'Économie ~15%' : 'Save ~15%',
              },
              {
                icon: Package,
                title: lang === 'fr' ? 'Pack Événement' : 'Event Pack',
                price: lang === 'fr' ? 'À partir de 250$' : 'Starting at $250',
                items: lang === 'fr'
                  ? ['100 flyers A6', '100 stickers promo', 'Affiche 18×24" (x5)', 'Création graphique incluse']
                  : ['100 A6 flyers', '100 promo stickers', '18×24" poster (x5)', 'Graphic design included'],
                saving: lang === 'fr' ? 'Économie ~20%' : 'Save ~20%',
                popular: true,
              },
              {
                icon: Package,
                title: lang === 'fr' ? 'Pack Lancement' : 'Launch Pack',
                price: lang === 'fr' ? 'Sur devis' : 'Custom quote',
                items: lang === 'fr'
                  ? ['Site web vitrine', 'Logo + identité visuelle', '200 stickers + 200 flyers', 'Merch (t-shirts sublimation)']
                  : ['Showcase website', 'Logo + visual identity', '200 stickers + 200 flyers', 'Merch (sublimation t-shirts)'],
                saving: lang === 'fr' ? 'Meilleur rapport qualité-prix' : 'Best value',
              },
            ].map((pkg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`p-8 rounded-2xl border transition-all duration-300 relative ${pkg.popular ? 'border-magenta/50 card-bg card-shadow' : 'border-purple-main/30 card-bg-bordered'}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-magenta text-white text-xs font-bold uppercase tracking-wider">
                    {lang === 'fr' ? 'Populaire' : 'Popular'}
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <pkg.icon size={24} className="text-magenta" />
                  <h3 className="text-xl font-heading font-bold text-heading">{pkg.title}</h3>
                </div>
                <div className="text-2xl font-heading font-bold text-gradient mb-4">{pkg.price}</div>
                <ul className="space-y-2 mb-6">
                  {pkg.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-grey-light text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-magenta mt-1.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="text-magenta text-sm font-semibold">{pkg.saving}</div>
                <Link
                  to="/contact"
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 border border-magenta/30 hover:bg-magenta hover:text-white text-magenta"
                >
                  {lang === 'fr' ? 'Demander un devis' : 'Request a quote'}
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center p-12 rounded-2xl mb-8 cta-text-bordered"
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
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default Boutique;
