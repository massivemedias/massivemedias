import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Printer, Sticker, Shirt, FileText, Palette, Code } from 'lucide-react';
import ServiceCard from '../components/ServiceCard';
import SEO from '../components/SEO';
import { img, thumb } from '../utils/paths';
import { useLang } from '../i18n/LanguageContext';

const serviceIcons = [Printer, Sticker, Shirt, FileText, Palette, Code];
const serviceLinks = [
  '/services/impression-fine-art',
  '/services/stickers-custom',
  '/services/sublimation-merch',
  '/services/flyers-cartes',
  '/services/design-graphique',
  '/services/developpement-web',
];
const serviceImages = [
  thumb('/images/prints/Prints17.webp'),
  thumb('/images/stickers/Stickers-Cosmo.webp'),
  thumb('/images/textile/Textile1.webp'),
  thumb('/images/flyers/discodyssee.webp'),
  thumb('/images/graphism/logo_massive.webp'),
  thumb('/images/web/devweb_hero.webp'),
];

function Services() {
  const { t, lang } = useLang();

  const serviceCards = t('servicesPage.serviceCards');

  return (
    <>
      <SEO
        title={t('servicesPage.seo.title')}
        description={t('servicesPage.seo.description')}
        breadcrumbs={[
          { name: lang === 'fr' ? 'Accueil' : 'Home', url: '/' },
          { name: t('nav.services') },
        ]}
      />

      {/* Hero avec image de fond */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 hero-aurora"></div>

        <div className="relative z-10 section-container !py-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-heading mb-6">
              {t('servicesPage.hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-grey-light">
              {t('servicesPage.hero.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Grille de services */}
      <section className="section-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {serviceCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <ServiceCard
                icon={serviceIcons[index]}
                title={card.title}
                description={card.description}
                link={serviceLinks[index]}
                image={serviceImages[index]}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Section packages */}
      <section className="section-container">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-heading mb-4">
            {t('servicesPage.packages.title')}
          </h2>
          <p className="text-xl text-grey-light max-w-2xl mx-auto">
            {t('servicesPage.packages.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Package Lancement Artiste */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden border border-magenta/30 transition-colors duration-300 card-bg card-shadow"
          >
            <div className="p-2">
              <img src={thumb('/images/prints/FineArt1.webp')} alt={t('servicesPage.packageArtist.title')} className="w-full h-48 object-cover rounded-xl" />
            </div>
            <div className="p-8">
              <div className="text-magenta text-sm font-semibold uppercase tracking-wider mb-2">{t('servicesPage.packageArtist.badge')}</div>
              <h3 className="text-2xl font-heading font-bold text-heading mb-2">{t('servicesPage.packageArtist.title')}</h3>
              <div className="text-4xl font-heading font-bold text-gradient mb-4">{t('servicesPage.packageArtist.price')}</div>
              <p className="text-grey-muted text-sm mb-6 line-through">{t('servicesPage.packageArtist.originalPrice')}</p>
              <ul className="space-y-3 text-grey-light mb-8">
                {t('servicesPage.packageArtist.items').map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-magenta"></div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/contact" className="btn-primary w-full text-center">{t('common.requestPackage')}</Link>
            </div>
          </motion.div>

          {/* Package Événement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden border border-purple-main/30 transition-colors duration-300 card-bg card-shadow"
          >
            <div className="p-2">
              <img src={thumb('/images/stickers/Stickers-Cosmovision.webp')} alt={t('servicesPage.packageEvent.title')} className="w-full h-48 object-cover rounded-xl" />
            </div>
            <div className="p-8">
              <div className="text-electric-purple text-sm font-semibold uppercase tracking-wider mb-2">{t('servicesPage.packageEvent.badge')}</div>
              <h3 className="text-2xl font-heading font-bold text-heading mb-2">{t('servicesPage.packageEvent.title')}</h3>
              <div className="text-4xl font-heading font-bold text-gradient mb-4">{t('servicesPage.packageEvent.price')}</div>
              <p className="text-grey-muted text-sm mb-6 line-through">{t('servicesPage.packageEvent.originalPrice')}</p>
              <ul className="space-y-3 text-grey-light mb-8">
                {t('servicesPage.packageEvent.items').map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-magenta"></div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/contact" className="btn-primary w-full text-center">{t('common.requestPackage')}</Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

export default Services;
