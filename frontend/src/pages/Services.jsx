import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Printer, Sticker, Shirt, FileText, Palette, Code } from 'lucide-react';
import ServiceCard from '../components/ServiceCard';
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
  thumb('/images/prints/Prints1.jpeg'),
  thumb('/images/stickers/Stickers1.jpeg'),
  thumb('/images/textile/Textile1.jpeg'),
  thumb('/images/prints/Prints5.jpeg'),
  thumb('/images/prints/Prints10.jpeg'),
  thumb('/images/locale/locale1.jpeg'),
];

function Services() {
  const { t } = useLang();

  const serviceCards = t('servicesPage.serviceCards');

  return (
    <>
      <Helmet>
        <title>{t('servicesPage.seo.title')}</title>
        <meta name="description" content={t('servicesPage.seo.description')} />
      </Helmet>

      {/* Hero avec image de fond */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img src={thumb('/images/locale/locale5.jpeg')} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'var(--hero-gradient)' }}></div>
        </div>

        <div className="relative z-10 section-container !py-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-white mb-6">
              {t('servicesPage.hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-white/70">
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
            className="rounded-2xl overflow-hidden border border-magenta/30 transition-colors duration-300"
            style={{ background: 'var(--bg-card)', boxShadow: 'var(--card-shadow)' }}
          >
            <div className="p-2">
              <img src={thumb('/images/prints/Prints3.jpeg')} alt={t('servicesPage.packageArtist.title')} className="w-full h-48 object-cover rounded-xl" />
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
            className="rounded-2xl overflow-hidden border border-purple-main/30 transition-colors duration-300"
            style={{ background: 'var(--bg-card)', boxShadow: 'var(--card-shadow)' }}
          >
            <div className="p-2">
              <img src={thumb('/images/stickers/Stickers3.jpeg')} alt={t('servicesPage.packageEvent.title')} className="w-full h-48 object-cover rounded-xl" />
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
