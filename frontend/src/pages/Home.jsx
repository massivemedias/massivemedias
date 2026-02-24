import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Printer,
  Sticker,
  Shirt,
  Palette,
  Truck,
  Award,
  Users,
  Zap,
  DollarSign,
  Music
} from 'lucide-react';
import ServiceCard from '../components/ServiceCard';
import Counter from '../components/Counter';
import SEO from '../components/SEO';
import { getOrganizationSchema, getLocalBusinessSchema } from '../components/seo/schemas';
import MassiveLogo from '../components/MassiveLogo';
import { img, thumb } from '../utils/paths';
import { useLang } from '../i18n/LanguageContext';

const serviceIcons = [Printer, Sticker, Shirt, Palette];
const serviceLinks = [
  '/services/prints',
  '/services/stickers',
  '/services/merch',
  '/services/design',
];
const serviceImages = [
  thumb('/images/prints/Prints1.webp'),
  thumb('/images/stickers/Stickers-Cosmo.webp'),
  thumb('/images/textile/Textile1.webp'),
  thumb('/images/graphism/logo_massive.webp'),
];

const advantageIcons = [Truck, Award, Users, Zap, DollarSign, Music];

const featuredProjectImages = [
  thumb('/images/prints/FineArt1.webp'),
  thumb('/images/stickers/Stickers-Cosmovision.webp'),
  thumb('/images/textile/Textile2.webp'),
  thumb('/images/flyers/discodyssee.webp'),
  thumb('/images/stickers/Stickers-Vrstl.webp'),
  thumb('/images/textile/Textile9.webp'),
];

function Home() {
  const { t, lang } = useLang();
  const serviceCards = t('home.serviceCards');
  const advantages = t('home.advantages');
  const featuredProjects = t('home.featuredProjects');

  return (
    <>
      <SEO
        title={t('home.seo.title')}
        description={t('home.seo.description')}
        breadcrumbs={[{ name: lang === 'fr' ? 'Accueil' : 'Home' }]}
        jsonLd={[getOrganizationSchema(), getLocalBusinessSchema(lang)]}
      />

      {/* ============ HERO ============ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 hero-aurora"></div>

        <div className="relative z-10 text-center max-w-5xl mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.img
              src="/images/cpr-tagline.png"
              alt="Create. Print. Repeat."
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mx-auto mb-8 h-[24px] w-auto cpr-invert"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.8, ease: 'easeOut' }}
              className="mx-auto mb-10 logo-home"
            >
              <MassiveLogo className="w-full h-full transition-colors duration-300" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-2xl md:text-3xl mb-4 font-light hero-subtitle"
            >
              {t('home.hero.subtitle')}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="text-lg mb-12 max-w-3xl mx-auto hero-services"
            >
              {t('home.hero.services')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link to="/contact" className="btn-primary">
                {t('home.hero.cta1')}
                <ArrowRight className="ml-2" size={20} />
              </Link>
              <Link to="/contact" className="btn-outline btn-outline-hero">
                {t('home.hero.cta2')}
              </Link>
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-40 hero-fade"></div>
      </section>

      {/* ============ SERVICES ============ */}
      <section className="section-container">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-heading font-bold text-heading mb-4 hero-title">
            {t('home.servicesSection.title')}
          </h2>
          <p className="text-xl text-grey-light max-w-2xl mx-auto">
            {t('home.servicesSection.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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

      {/* ============ PROJETS RÉCENTS ============ */}
      <section className="section-container">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-heading font-bold text-heading mb-4 hero-title">
            {t('home.projectsSection.title')}
          </h2>
          <p className="text-xl text-grey-light max-w-2xl mx-auto">
            {t('home.projectsSection.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProjects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              viewport={{ once: true }}
              className="group relative rounded-xl overflow-hidden cursor-pointer aspect-[4/3]"
            >
              <img
                src={featuredProjectImages[index]}
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <span className="text-magenta text-sm font-semibold uppercase tracking-wider">{project.category}</span>
                <h3 className="text-white text-xl font-heading font-bold mt-1">{project.title}</h3>
              </div>
            </motion.div>
          ))}
        </div>

      </section>

      {/* ============ CHIFFRES ============ */}
      <section className="section-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <Counter end={2024} suffix="" label={t('home.stats.since')} />
          <Counter end={50} suffix="+" label={t('home.stats.projects')} />
          <Counter end={100} suffix="%" label={t('home.stats.local')} />
          <div className="text-center p-6">
            <div className="text-5xl md:text-6xl font-heading font-bold text-gradient mb-2 hero-title">24-48h</div>
            <div className="text-grey-light text-lg">{t('home.stats.delay')}</div>
          </div>
        </div>
      </section>

      {/* ============ AVANTAGES ============ */}
      <section className="section-container">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-heading font-bold text-heading mb-4 hero-title">
            {t('home.why.title')}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {advantages.map((advantage, index) => {
            const Icon = advantageIcons[index];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-8 rounded-xl transition-all duration-300 bg-glass card-shadow"
              >
                <div className="mb-4 p-3 rounded-lg w-fit icon-bg">
                  <Icon size={28} className="text-magenta" />
                </div>
                <h3 className="font-heading text-xl font-bold text-heading mb-3">
                  {advantage.title}
                </h3>
                <p className="text-grey-light">
                  {advantage.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="section-container">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden"
        >
          <img
            src={thumb('/images/locale/locale10.webp')}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 overlay-cta"></div>

          <div className="relative z-10 p-12 md:p-16 text-center">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
              {t('home.cta.title')}
            </h2>
            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              {t('home.cta.subtitle')}
            </p>
            <Link to="/contact" className="btn-primary">
              {t('home.cta.button')}
              <ArrowRight className="ml-2" size={20} />
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
}

export default Home;
