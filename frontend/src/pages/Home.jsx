import { useState, useEffect, useMemo } from 'react';
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
  Quote,
  Shield,
  Heart,
  Clock,
  MapPin,
  ShoppingBag,
} from 'lucide-react';
import artistsData from '../data/artists';
import tatoueursData from '../data/tatoueurs';
import ServiceCard from '../components/ServiceCard';
import Counter from '../components/Counter';
import SEO from '../components/SEO';
import { getOrganizationSchema, getLocalBusinessSchema, getWebSiteSchema } from '../components/seo/schemas';
import MassiveLogo from '../components/MassiveLogo';
import { img, thumb } from '../utils/paths';
import { useLang } from '../i18n/LanguageContext';
import { useSiteContent } from '../hooks/useSiteContent';
import { bl, mediaUrl } from '../utils/cms';
import { getIcon } from '../utils/iconMap';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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
  thumb('/images/realisations/prints/FineArt4.webp'),
  thumb('/images/realisations/stickers/Stickers-Cosmovision.webp'),
  thumb('/images/realisations/textile/Textile1.webp'),
  thumb('/images/graphism/onomiko.webp'),
  thumb('/images/realisations/stickers/Stickers-massive.webp'),
  img('/images/mugs/mug-white.webp'),
];
const fallbackFeaturedProjectLinks = [
  '/boutique/fine-art',
  '/services/stickers',
  '/boutique/sublimation',
  '/services/design',
  '/services/stickers',
  '/boutique/sublimation',
];

function Home() {
  const { t, lang, tx } = useLang();
  const { content } = useSiteContent();
  const { user } = useAuth();

  // ── Service Cards (fallback si vide ou absent) ──
  const cmsServiceCards = content?.serviceCards?.length ? content.serviceCards : null;
  const serviceCards = cmsServiceCards
    ? cmsServiceCards.map((c, i) => ({
        title: bl(c, 'title', lang),
        description: bl(c, 'description', lang),
        icon: getIcon(c.iconName),
        link: c.link,
        image: mediaUrl(c.image, null) || fallbackServiceImages[i] || null,
      }))
    : null;

  // ── Featured Projects (images locales forcees - CMS images non fiables) ──
  const cmsFeaturedProjects = content?.featuredProjects?.length ? content.featuredProjects : null;
  const featuredProjects = cmsFeaturedProjects
    ? cmsFeaturedProjects.map((p, i) => ({
        title: bl(p, 'title', lang),
        category: bl(p, 'category', lang),
        link: p.link,
        image: fallbackFeaturedProjectImages[i] || mediaUrl(p.image, null),
      }))
    : null;

  // ── Advantages ──
  const cmsAdvantages = content?.advantages?.length ? content.advantages : null;
  const advantages = cmsAdvantages
    ? cmsAdvantages.map((a) => ({
        title: bl(a, 'title', lang),
        description: bl(a, 'description', lang),
        icon: getIcon(a.iconName),
      }))
    : null;

  // ── Testimonials (donnees locales uniquement, Jeremy G. toujours en premier) ──
  const testimonials = null;

  // Fallback data from translations
  const fbServiceCards = t('home.serviceCards');
  const fbAdvantages = t('home.advantages');
  const fbFeaturedProjects = t('home.featuredProjects');
  const fbTestimonials = t('home.testimonials.items');

  // Carte Boutique injectee en position 2
  const boutiqueCard = {
    title: tx({ fr: 'Boutique', en: 'Shop', es: 'Tienda' }),
    description: tx({ fr: 'Prints, stickers, merch - commandez en ligne', en: 'Prints, stickers, merch - order online', es: 'Prints, stickers, merch - pedidos en línea' }),
    icon: ShoppingBag,
    link: '/boutique',
    image: thumb('/images/boutique.webp'),
  };
  const resolvedServiceCards = serviceCards
    ? serviceCards
    : fbServiceCards.map((card, i) => ({
        ...card,
        icon: getIcon(fallbackServiceIcons[i]),
        link: fallbackServiceLinks[i],
        image: fallbackServiceImages[i],
      }));
  const allServiceCards = resolvedServiceCards.length > 0
    ? [...resolvedServiceCards, boutiqueCard]
    : [boutiqueCard];

  // Oeuvres artistes pour le showcase homepage (aleatoire a chaque visite)
  const artistsList = Object.values(artistsData);
  const displayArtworks = useMemo(() => {
    const all = [];
    artistsList.forEach(artist => {
      (artist.prints || []).forEach(work => {
        all.push({ ...work, artistSlug: artist.slug, artistName: artist.name });
      });
    });
    // Fisher-Yates shuffle
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all.slice(0, 8);
  }, []);

  return (
    <>
      <SEO
        title={content?.homeSeo ? bl(content.homeSeo, 'title', lang) || t('home.seo.title') : t('home.seo.title')}
        description={content?.homeSeo ? bl(content.homeSeo, 'description', lang) || t('home.seo.description') : t('home.seo.description')}
        breadcrumbs={[{ name: tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' }) }]}
        jsonLd={[getOrganizationSchema(), getLocalBusinessSchema(lang), getWebSiteSchema()]}
      />

      {/* ============ HERO ============ */}
      <section className="relative min-h-[80vh] md:min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 hero-aurora"></div>

        <div className="relative z-10 text-center mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.img
              src={`${import.meta.env.BASE_URL}images/cpr-tagline.png`}
              alt="Create. Print. Repeat."
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mx-auto mb-6 h-[18px] md:h-[22px] w-auto cpr-invert"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 1.8, ease: [0.25, 0.1, 0.25, 1] }}
              className="mx-auto mb-10 logo-home max-w-[90vw]"
            >
              <MassiveLogo className="w-full h-full transition-colors duration-300" />
            </motion.div>
            <h1 className="sr-only">
              {tx({
                fr: 'Massive Medias - Impression Fine Art, Stickers personnalisés, Merch, Design graphique et Développement web à Montréal',
                en: 'Massive Medias - Fine Art Printing, Custom Stickers, Merch, Graphic Design and Web Development in Montreal',
                es: 'Massive Medias - Impresion Fine Art, Stickers personalizados, Merch, Diseno grafico y Desarrollo web en Montreal',
              })}
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-xl sm:text-2xl md:text-3xl mb-3 font-light hero-subtitle"
            >
              {(content && bl(content, 'heroSubtitle', lang)) || t('home.hero.subtitle')}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="text-sm sm:text-base md:text-lg mb-10 max-w-3xl mx-auto hero-services tracking-wide"
            >
              {(content && bl(content, 'heroServices', lang)) || t('home.hero.services')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <a href="#services" className="btn-primary" onClick={(e) => { e.preventDefault(); document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }); }}>
                {(content && bl(content, 'heroCta1', lang)) || t('home.hero.cta1')}
                <ArrowRight className="ml-2" size={20} />
              </a>
              <Link to="/contact" className="btn-outline btn-outline-hero">
                {(content && bl(content, 'heroCta2', lang)) || t('home.hero.cta2')}
              </Link>
            </motion.div>

            {/* Bouton connexion - visible surtout en mobile (le header cache le login derriere le menu) */}
            {!user && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="mt-4"
              >
                <button
                  onClick={() => window.dispatchEvent(new Event('open-login-modal'))}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-heading/70 hover:text-heading transition-colors border border-white/15 hover:border-white/30 hover:bg-white/5"
                >
                  <Users size={16} />
                  {tx({ fr: 'Se connecter / Creer un compte', en: 'Sign in / Create account', es: 'Conectarse / Crear cuenta' })}
                </button>
              </motion.div>
            )}
            {user && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="mt-4"
              >
                <Link
                  to="/account"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-heading/70 hover:text-heading transition-colors border border-white/15 hover:border-white/30 hover:bg-white/5"
                >
                  <Users size={16} />
                  {tx({ fr: 'Mon compte', en: 'My account', es: 'Mi cuenta' })}
                </Link>
              </motion.div>
            )}

          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-40 hero-fade"></div>
      </section>

      {/* ============ SERVICES ============ */}
      <section id="services" className="section-container">
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

        <div className="flex flex-wrap justify-center items-stretch gap-4 max-w-4xl mx-auto">
          {allServiceCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.7rem)] flex flex-col"
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

      {/* ============ ARTISTES & OEUVRES ============ */}
      <section className="section-container">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl md:text-6xl font-heading font-bold text-heading mb-4 hero-title">
            {tx({ fr: 'Massive Artistes', en: 'Massive Artists', es: 'Massive Artistas' })}
          </h2>
          <p className="text-xl text-grey-light max-w-2xl mx-auto">
            {tx({ fr: 'Prints fine art disponibles en boutique - oeuvres originales imprimées sur commande', en: 'Fine art prints available in our shop - original works printed on demand', es: 'Prints fine art disponibles en tienda - obras originales impresas a pedido' })}
          </p>
        </motion.div>

        {/* Avatars artistes */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-12 mb-12">
          {artistsList.map((artist, i) => (
            <motion.div
              key={artist.slug}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Link to={`/artistes/${artist.slug}`} className="flex flex-col items-center gap-2 group">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-purple-main/30 group-hover:border-accent/70 transition-colors duration-300">
                  <img src={artist.avatar} alt={artist.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <span className="text-sm font-heading font-bold text-heading">{artist.name}</span>
                <span className="text-xs text-grey-muted text-center max-w-[110px] leading-tight">
                  {artist.tagline?.[lang] || artist.tagline?.fr}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Grille oeuvres */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {displayArtworks.map((work, i) => (
            <motion.div
              key={work.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              viewport={{ once: true }}
            >
              <Link to={`/artistes/${work.artistSlug}`} className="group relative block rounded-lg overflow-hidden aspect-square">
                <img
                  src={work.image}
                  alt={work.titleFr || work.titleEn}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-3 md:translate-y-2 md:group-hover:translate-y-0 transition-transform duration-300 md:opacity-0 md:group-hover:opacity-100">
                  <span className="text-accent text-[10px] font-semibold uppercase tracking-wider">{work.artistName}</span>
                  <p className="text-white text-xs font-heading font-bold mt-0.5 line-clamp-1">
                    {lang === 'en' ? (work.titleEn || work.titleFr) : lang === 'es' ? (work.titleEs || work.titleFr) : work.titleFr}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/artistes" className="btn-outline">
            {tx({ fr: 'Voir tous les artistes', en: 'View all artists', es: 'Ver todos los artistas' })}
            <ArrowRight className="ml-2" size={16} />
          </Link>
          <Link to="/boutique" className="btn-primary">
            {tx({ fr: 'Voir la boutique', en: 'Visit the shop', es: 'Ver la tienda' })}
            <ArrowRight className="ml-2" size={16} />
          </Link>
        </div>
      </section>

      {/* ============ CHIFFRES ============ */}
      <section className="section-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <Counter end={2022} suffix="" label={t('home.stats.since')} />
          <Counter end={50} suffix="+" label={t('home.stats.projects')} />
          <Counter end={100} suffix="%" label={t('home.stats.local')} />
          <div className="text-center p-6">
            <div className="text-5xl md:text-6xl font-heading font-bold text-gradient mb-2 hero-title">100%</div>
            <div className="text-grey-light text-lg">{tx({ fr: 'Qualité garantie', en: 'Guaranteed quality', es: 'Calidad garantizada' })}</div>
          </div>
        </div>
      </section>

      {/* ============ LA PROMESSE MASSIVE ============ */}
      <section className="section-container !py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Shield, fr: 'La promesse Massive', en: 'The Massive Promise', es: 'La promesa Massive', descFr: 'Satisfaction garantie ou on refait', descEn: 'Satisfaction guaranteed or we redo it', descEs: 'Satisfaccion garantizada o lo rehacemos' },
              { icon: MapPin, fr: 'Imprimé à Montréal', en: 'Printed in Montreal', es: 'Impreso en Montreal', descFr: 'Production 100% locale, Mile-End', descEn: '100% local production, Mile-End', descEs: 'Producción 100% local, Mile-End' },
              { icon: Clock, fr: 'Production locale', en: 'Local production', es: 'Produccion local', descFr: 'Fabriqué à Montréal, Mile-End', descEn: 'Made in Montreal, Mile-End', descEs: 'Hecho en Montreal, Mile-End' },
              { icon: Heart, fr: 'Design inclus', en: 'Design included', es: 'Diseño incluido', descFr: 'Création graphique incluse', descEn: 'Graphic design included', descEs: 'Creación gráfica incluida' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center icon-bg">
                    <Icon size={22} className="text-accent" />
                  </div>
                  <h3 className="text-heading font-heading font-bold text-sm mb-1">
                    {tx({ fr: item.fr, en: item.en, es: item.es })}
                  </h3>
                  <p className="text-grey-muted text-xs">
                    {tx({ fr: item.descFr, en: item.descEn, es: item.descEs })}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
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

      {/* ============ PROJETS RÉALISÉS ============ */}
      <section className="section-container">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl md:text-6xl font-heading font-bold text-heading mb-4 hero-title">
            {tx({ fr: 'Projets réalisés', en: 'Recent Work', es: 'Proyectos realizados' })}
          </h2>
          <p className="text-grey-light max-w-2xl mx-auto">
            {tx({
              fr: 'Des clients, des produits, des vraies commandes qui partent de notre studio.',
              en: 'Real clients, real products, real orders shipped from our studio.',
              es: 'Clientes reales, productos reales, pedidos reales enviados desde nuestro estudio.',
            })}
          </p>
        </motion.div>

        {/* Projet POGOs dans le Sirop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
            {/* Galerie d'images - mosaic 4 photos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 rounded-xl overflow-hidden aspect-[4/3]">
                <img
                  src={thumb('/images/realisations/pogos/pogo2.webp')}
                  alt="Étiquette Les Pogos dans le Sirop - format XL"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-xl overflow-hidden aspect-square">
                <img
                  src={thumb('/images/realisations/pogos/pogo4.webp')}
                  alt="Packaging final Les Pogos avec étiquettes incluses"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-xl overflow-hidden aspect-square">
                <img
                  src={thumb('/images/realisations/pogos/pogo1.webp')}
                  alt="Étiquettes Pogos format regular et petit"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="col-span-2 rounded-xl overflow-hidden aspect-[16/9]">
                <img
                  src={thumb('/images/realisations/pogos/pogo3.webp')}
                  alt="Étiquette Pogos appliquée sur bouteille"
                  loading="lazy"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>

            {/* Story telling */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wider mb-4">
                {tx({ fr: 'Stickers die-cut', en: 'Die-cut stickers', es: 'Stickers die-cut' })}
              </div>
              <h3 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-3">
                Les Pogos dans le Sirop
              </h3>
              <p className="text-accent text-sm font-semibold mb-6">
                {tx({ fr: '1re Édition - Édition limitée', en: '1st Edition - Limited run', es: '1ª Edición - Edición limitada' })}
              </p>
              <div className="space-y-4 text-grey-light leading-relaxed">
                <p>
                  {tx({
                    fr: 'Le client arrive avec une idée précise : créer des étiquettes rondes pour accompagner son sirop d\'érable artisanal. Un univers visuel décalé, des mascottes, un story telling local.',
                    en: 'The client came in with a specific idea: create round labels for their artisanal maple syrup. A quirky visual universe, mascots, local storytelling.',
                    es: 'El cliente llegó con una idea clara: crear etiquetas redondas para su jarabe de arce artesanal. Un universo visual original, mascotas, narrativa local.',
                  })}
                </p>
                <p>
                  {tx({
                    fr: 'On a imprimé plusieurs formats die-cut (2 tailles d\'étiquettes rondes + une grosse étiquette de packaging) sur vinyle impermeable, finition matte pour un rendu doux au toucher. Le résultat : des étiquettes qui tiennent sur bouteilles, boîtes et contenants, sans décoller.',
                    en: 'We printed multiple die-cut formats (two round label sizes + a large packaging label) on waterproof vinyl with a matte finish for a soft, tactile feel. The result: labels that stick perfectly to bottles, boxes and containers without peeling.',
                    es: 'Imprimimos varios formatos die-cut (dos tamaños de etiquetas redondas + una etiqueta grande para packaging) en vinilo impermeable, acabado mate para un tacto suave. El resultado: etiquetas que se adhieren perfectamente a botellas, cajas y envases sin despegarse.',
                  })}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 mt-6">
                <Link to="/services/stickers" className="btn-primary text-sm">
                  {tx({ fr: 'Commander mes stickers', en: 'Order my stickers', es: 'Pedir mis stickers' })}
                  <ArrowRight size={16} className="ml-2" />
                </Link>
                <Link to="/contact" className="btn-outline text-sm">
                  {tx({ fr: 'Projet similaire ?', en: 'Similar project?', es: '¿Proyecto similar?' })}
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
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
