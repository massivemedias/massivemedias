import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Truck,
  Award,
  Users,
  Zap,
  DollarSign,
  Music,
  Quote
} from 'lucide-react';
import ServiceCard from '../components/ServiceCard';
import Counter from '../components/Counter';
import SEO from '../components/SEO';
import { getOrganizationSchema, getLocalBusinessSchema } from '../components/seo/schemas';
import MassiveLogo from '../components/MassiveLogo';
import { img, thumb } from '../utils/paths';
import { useLang } from '../i18n/LanguageContext';
import { useSiteContent } from '../hooks/useSiteContent';
import { bl, mediaUrl } from '../utils/cms';
import { getIcon } from '../utils/iconMap';

// Fallback icons & data if CMS not available
const fallbackServiceIcons = ['Printer', 'Sticker', 'Shirt', 'Palette', 'Globe'];
const fallbackServiceLinks = [
  '/services/prints',
  '/services/stickers',
  '/services/merch',
  '/services/design',
  '/services/web',
];
const fallbackServiceImages = [
  thumb('/images/prints/PrintsHero.webp'),
  thumb('/images/stickers/StickersHero.webp'),
  thumb('/images/textile/MerchHero.webp'),
  thumb('/images/graphism/GraphicDesignHero.webp'),
  thumb('/images/web/DevWebHero.webp'),
];
const fallbackAdvantageIcons = [Truck, Award, Users, Zap, DollarSign, Music];
const fallbackFeaturedProjectImages = [
  thumb('/images/prints/FineArt1.webp'),
  thumb('/images/stickers/Stickers-Cosmovision.webp'),
  thumb('/images/textile/Textile2.webp'),
  thumb('/images/flyers/discodyssee.webp'),
  thumb('/images/stickers/Stickers-Vrstl.webp'),
  thumb('/images/textile/Textile9.webp'),
];
const fallbackFeaturedProjectLinks = [
  '/boutique/fine-art',
  '/boutique/stickers',
  '/boutique/sublimation',
  '/boutique/flyers',
  '/boutique/stickers',
  '/boutique/sublimation',
];

function Home() {
  const { t, lang } = useLang();
  const { content } = useSiteContent();

  // ── Service Cards (fallback si vide ou absent) ──
  const cmsServiceCards = content?.serviceCards?.length ? content.serviceCards : null;
  const serviceCards = cmsServiceCards
    ? cmsServiceCards.map((c) => ({
        title: bl(c, 'title', lang),
        description: bl(c, 'description', lang),
        icon: getIcon(c.iconName),
        link: c.link,
        image: mediaUrl(c.image, null),
      }))
    : null;

  // ── Featured Projects ──
  const cmsFeaturedProjects = content?.featuredProjects?.length ? content.featuredProjects : null;
  const featuredProjects = cmsFeaturedProjects
    ? cmsFeaturedProjects.map((p) => ({
        title: bl(p, 'title', lang),
        category: bl(p, 'category', lang),
        link: p.link,
        image: mediaUrl(p.image, null),
      }))
    : null;

  // ── Stats ──
  const cmsStats = content?.stats?.length ? content.stats : null;

  // ── Advantages ──
  const cmsAdvantages = content?.advantages?.length ? content.advantages : null;
  const advantages = cmsAdvantages
    ? cmsAdvantages.map((a) => ({
        title: bl(a, 'title', lang),
        description: bl(a, 'description', lang),
        icon: getIcon(a.iconName),
      }))
    : null;

  // ── Testimonials ──
  const cmsTestimonials = content?.testimonials?.length ? content.testimonials : null;
  const testimonials = cmsTestimonials
    ? cmsTestimonials.map((tm) => ({
        name: tm.name,
        role: bl(tm, 'role', lang),
        text: bl(tm, 'text', lang),
      }))
    : null;

  // Fallback data from translations
  const fbServiceCards = t('home.serviceCards');
  const fbAdvantages = t('home.advantages');
  const fbFeaturedProjects = t('home.featuredProjects');
  const fbTestimonials = t('home.testimonials.items');

  return (
    <>
      <SEO
        title={content?.homeSeo ? bl(content.homeSeo, 'title', lang) || t('home.seo.title') : t('home.seo.title')}
        description={content?.homeSeo ? bl(content.homeSeo, 'description', lang) || t('home.seo.description') : t('home.seo.description')}
        breadcrumbs={[{ name: lang === 'fr' ? 'Accueil' : 'Home' }]}
        jsonLd={[getOrganizationSchema(), getLocalBusinessSchema(lang)]}
      />

      {/* ============ HERO ============ */}
      <section className="relative min-h-[80vh] md:min-h-screen flex items-center justify-center overflow-hidden">
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
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 2, ease: [0.25, 0.1, 0.25, 1] }}
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
              {(content && bl(content, 'heroSubtitle', lang)) || t('home.hero.subtitle')}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="text-lg mb-12 max-w-3xl mx-auto hero-services"
            >
              {(content && bl(content, 'heroServices', lang)) || t('home.hero.services')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link to="/contact" className="btn-primary">
                {(content && bl(content, 'heroCta1', lang)) || t('home.hero.cta1')}
                <ArrowRight className="ml-2" size={20} />
              </Link>
              <Link to="/contact" className="btn-outline btn-outline-hero">
                {(content && bl(content, 'heroCta2', lang)) || t('home.hero.cta2')}
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
            {(content && bl(content, 'servicesSectionTitle', lang)) || t('home.servicesSection.title')}
          </h2>
          <p className="text-xl text-grey-light max-w-2xl mx-auto">
            {(content && bl(content, 'servicesSectionSubtitle', lang)) || t('home.servicesSection.subtitle')}
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-5 max-w-6xl mx-auto">
          {(serviceCards
            ? serviceCards
            : fbServiceCards.map((card, index) => ({
                ...card,
                icon: getIcon(fallbackServiceIcons[index]),
                link: fallbackServiceLinks[index],
                image: fallbackServiceImages[index],
              }))
          ).map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.875rem)]"
            >
              <ServiceCard
                icon={card.icon}
                title={card.title}
                description={card.description}
                link={card.link}
                image={card.image}
                mirror={index === 1}
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
            {(content && bl(content, 'projectsSectionTitle', lang)) || t('home.projectsSection.title')}
          </h2>
          <p className="text-xl text-grey-light max-w-2xl mx-auto">
            {(content && bl(content, 'projectsSectionSubtitle', lang)) || t('home.projectsSection.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {featuredProjects
            ? featuredProjects.map((project, index) => (
                <Link key={index} to={project.link || '#'}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    viewport={{ once: true }}
                    className="group relative rounded-lg overflow-hidden cursor-pointer aspect-square"
                  >
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <span className="text-accent text-xs font-semibold uppercase tracking-wider">{project.category}</span>
                      <h3 className="text-white text-base font-heading font-bold mt-0.5">{project.title}</h3>
                    </div>
                  </motion.div>
                </Link>
              ))
            : fbFeaturedProjects.map((project, index) => (
                <Link key={index} to={fallbackFeaturedProjectLinks[index]}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    viewport={{ once: true }}
                    className="group relative rounded-lg overflow-hidden cursor-pointer aspect-square"
                  >
                    <img
                      src={fallbackFeaturedProjectImages[index]}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <span className="text-accent text-xs font-semibold uppercase tracking-wider">{project.category}</span>
                      <h3 className="text-white text-base font-heading font-bold mt-0.5">{project.title}</h3>
                    </div>
                  </motion.div>
                </Link>
              ))
          }
        </div>
      </section>

      {/* ============ CHIFFRES ============ */}
      <section className="section-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {cmsStats
            ? cmsStats.map((stat, index) => (
                stat.isCounter
                  ? <Counter key={index} end={Number(stat.value)} suffix={stat.suffix || ''} label={bl(stat, 'label', lang)} />
                  : (
                    <div key={index} className="text-center p-6">
                      <div className="text-5xl md:text-6xl font-heading font-bold text-gradient mb-2 hero-title">
                        {stat.value}{stat.suffix || ''}
                      </div>
                      <div className="text-grey-light text-lg">{bl(stat, 'label', lang)}</div>
                    </div>
                  )
              ))
            : <>
                <Counter end={2013} suffix="" label={t('home.stats.since')} />
                <Counter end={150} suffix="+" label={t('home.stats.projects')} />
                <Counter end={100} suffix="%" label={t('home.stats.local')} />
                <div className="text-center p-6">
                  <div className="text-5xl md:text-6xl font-heading font-bold text-gradient mb-2 hero-title">24-48h</div>
                  <div className="text-grey-light text-lg">{t('home.stats.delay')}</div>
                </div>
              </>
          }
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
            {(content && bl(content, 'advantagesTitle', lang)) || t('home.why.title')}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {advantages
            ? advantages.map((advantage, index) => {
                const Icon = advantage.icon;
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
                      <Icon size={28} className="text-accent" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-heading mb-3">
                      {advantage.title}
                    </h3>
                    <p className="text-grey-light">
                      {advantage.description}
                    </p>
                  </motion.div>
                );
              })
            : fbAdvantages.map((advantage, index) => {
                const Icon = fallbackAdvantageIcons[index];
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
                      <Icon size={28} className="text-accent" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-heading mb-3">
                      {advantage.title}
                    </h3>
                    <p className="text-grey-light">
                      {advantage.description}
                    </p>
                  </motion.div>
                );
              })
          }
        </div>
      </section>

      {/* ============ TÉMOIGNAGES ============ */}
      <section className="section-container">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl md:text-6xl font-heading font-bold text-heading mb-4 hero-title">
            {(content && bl(content, 'testimonialsTitle', lang)) || t('home.testimonials.title')}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {(testimonials || fbTestimonials).map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-8 rounded-xl transition-all duration-300 bg-glass card-shadow relative"
            >
              <Quote size={32} className="text-accent/20 absolute top-4 right-4" />
              <p className="text-grey-light leading-relaxed mb-6 italic">
                "{item.text}"
              </p>
              <div>
                <div className="text-heading font-heading font-bold">{item.name}</div>
                <div className="text-accent text-sm">{item.role}</div>
              </div>
            </motion.div>
          ))}
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
            src={content ? mediaUrl(content.ctaBackgroundImage, thumb('/images/locale/locale10.webp')) : thumb('/images/locale/locale10.webp')}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 overlay-cta"></div>

          <div className="relative z-10 p-12 md:p-16 text-center">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
              {(content && bl(content, 'ctaTitle', lang)) || t('home.cta.title')}
            </h2>
            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              {(content && bl(content, 'ctaSubtitle', lang)) || t('home.cta.subtitle')}
            </p>
            <Link to="/contact" className="btn-primary">
              {(content && bl(content, 'ctaButton', lang)) || t('home.cta.button')}
              <ArrowRight className="ml-2" size={20} />
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
}

export default Home;
