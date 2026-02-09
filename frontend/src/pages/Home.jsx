import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Printer, 
  Sticker, 
  Shirt, 
  FileText, 
  Palette, 
  Code,
  Truck,
  Award,
  Users,
  Zap,
  DollarSign,
  Music
} from 'lucide-react';
import ServiceCard from '../components/ServiceCard';
import Counter from '../components/Counter';
import MassiveLogo from '../assets/massive-logo.svg';

const services = [
  {
    icon: Printer,
    title: 'Impression Fine Art',
    description: 'Tirages premium sur Canon Pro-1000. Posters, affiches, photos d\'art sur papiers professionnels Canon, Ilford et Hahnemühle.',
    link: '/services/impression-fine-art',
    image: '/images/prints/Prints1.jpeg',
  },
  {
    icon: Sticker,
    title: 'Stickers Custom',
    description: 'Die-cut sur mesure avec la Silhouette Cameo 5. Matte, glossy, transparent, holographique basic ou premium.',
    link: '/services/stickers-custom',
    image: '/images/stickers/Stickers1.jpeg',
  },
  {
    icon: Shirt,
    title: 'Sublimation & Merch',
    description: 'T-shirts, hoodies, mugs, thermos, tapis de souris, porte-clés et plus. Impression sublimation sur mesure.',
    link: '/services/sublimation-merch',
    image: '/images/textile/Textile1.jpeg',
  },
  {
    icon: FileText,
    title: 'Flyers & Cartes',
    description: 'Flyers A6, cartes postales, cartes d\'affaires. Impression rapide et locale pour tes événements et promotions.',
    link: '/services/flyers-cartes',
    image: '/images/prints/Prints5.jpeg',
  },
  {
    icon: Palette,
    title: 'Design Graphique',
    description: 'Logos, identités visuelles, affiches, packaging. En partenariat avec Christopher Gagnon, infographiste.',
    link: '/services/design-graphique',
    image: '/images/prints/Prints10.jpeg',
  },
  {
    icon: Code,
    title: 'Développement Web',
    description: 'Sites vitrines, e-commerce, landing pages. Technologies modernes : React, Strapi, WordPress, Shopify.',
    link: '/services/developpement-web',
    image: '/images/locale/locale1.jpeg',
  }
];

const advantages = [
  {
    icon: Truck,
    title: 'Livraison locale gratuite',
    description: 'Basé dans le Mile-End à Montréal. Pick-up ou livraison locale, zéro frais de shipping, zéro délai postal.'
  },
  {
    icon: Award,
    title: 'Qualité professionnelle',
    description: 'Canon Pro-1000, papiers Ilford et Hahnemühle, Silhouette Cameo 5. Du matériel pro pour des résultats pro.'
  },
  {
    icon: Users,
    title: 'Service personnalisé',
    description: 'Un seul interlocuteur de A à Z. On comprend ton projet parce qu\'on vient du même milieu créatif.'
  },
  {
    icon: Zap,
    title: 'Solution complète',
    description: 'Impression + design + web + merch. Pas besoin de courir entre 4 fournisseurs différents.'
  },
  {
    icon: DollarSign,
    title: 'Prix compétitifs',
    description: 'Fine art 20% sous la concurrence. Pas de frais cachés, pas de minimum excessif.'
  },
  {
    icon: Music,
    title: 'La scène, on connaît',
    description: 'Musiciens, photographes, artistes visuels, promoteurs d\'événements — c\'est notre monde depuis le jour 1.'
  }
];

/* Images pour le carrousel de réalisations */
const featuredProjects = [
  { image: '/images/prints/Prints2.jpeg', title: 'Tirages Fine Art', category: 'Impression' },
  { image: '/images/stickers/Stickers3.jpeg', title: 'Stickers Holographiques', category: 'Stickers' },
  { image: '/images/textile/Textile3.jpeg', title: 'T-shirts Sublimation', category: 'Merch' },
  { image: '/images/prints/Prints8.jpeg', title: 'Affiches Événement', category: 'Impression' },
  { image: '/images/stickers/Stickers5.jpeg', title: 'Die-Cut Custom', category: 'Stickers' },
  { image: '/images/textile/Textile5.jpeg', title: 'Mugs & Accessoires', category: 'Merch' },
];

function Home() {
  return (
    <>
      <Helmet>
        <title>Massive Medias — Studio de production créative, Montréal</title>
        <meta name="description" content="Impression fine art, stickers custom, sublimation, design graphique et développement web à Montréal. Service local depuis 2013." />
      </Helmet>

      {/* ============ HERO ============ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image locale + overlay */}
        <div className="absolute inset-0">
          <img
            src="/images/locale/locale3.jpeg"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(180deg, rgba(10,10,10,0.85) 0%, rgba(26,0,51,0.92) 100%)'
          }}></div>
          {/* Pattern subtil par-dessus */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,0,164,0.3) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Tagline au-dessus */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-grey-muted text-sm tracking-[0.3em] uppercase mb-8"
            >
              Create. Print. Repeat.
            </motion.p>

            {/* LOGO MASSIVE — centré, grand, le vrai SVG */}
            <motion.img
              src={MassiveLogo}
              alt="MASSIVE"
              className="mx-auto mb-10"
              style={{ width: '100%', maxWidth: '750px', height: 'auto' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.8, ease: 'easeOut' }}
            />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-2xl md:text-3xl text-grey-light mb-4 font-light"
            >
              Studio de production créative à Montréal
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="text-lg text-grey-muted mb-12 max-w-3xl mx-auto"
            >
              Impression fine art · Stickers · Merch · Design · Web
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link to="/services" className="btn-primary">
                Voir nos services
                <ArrowRight className="ml-2" size={20} />
              </Link>
              <Link to="/contact" className="btn-outline">
                Demander une soumission
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Fondu vers le bas */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent"></div>
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
          <h2 className="text-5xl md:text-6xl font-heading font-bold text-white mb-4">
            Tout sous un même toit.
          </h2>
          <p className="text-xl text-grey-light max-w-2xl mx-auto">
            De l'idée à l'objet fini, on s'occupe de tout.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <ServiceCard {...service} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ PROJETS RÉCENTS (galerie photo) ============ */}
      <section className="section-container">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-heading font-bold text-white mb-4">
            Nos réalisations
          </h2>
          <p className="text-xl text-grey-light max-w-2xl mx-auto">
            Quelques projets qui parlent d'eux-mêmes.
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
              className="group relative rounded-xl overflow-hidden cursor-pointer"
              style={{ aspectRatio: '4/3' }}
            >
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <span className="text-magenta text-sm font-semibold uppercase tracking-wider">{project.category}</span>
                <h3 className="text-white text-xl font-heading font-bold mt-1">{project.title}</h3>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/portfolio" className="btn-outline">
            Voir tout le portfolio
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </div>
      </section>

      {/* ============ CHIFFRES ============ */}
      <section className="section-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <Counter end={2020} suffix="" label="Depuis" />
          <Counter end={500} suffix="+" label="Projets livrés" />
          <Counter end={100} suffix="%" label="Local, Montréal" />
          <div className="text-center p-6">
            <div className="text-5xl md:text-6xl font-heading font-bold text-gradient mb-2">24-48h</div>
            <div className="text-grey-light text-lg">Délai standard</div>
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
          <h2 className="text-5xl md:text-6xl font-heading font-bold text-white mb-4">
            Pourquoi Massive?
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {advantages.map((advantage, index) => (
            <motion.div
              key={advantage.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-8 rounded-xl border border-purple-main/30 backdrop-blur-sm hover:border-magenta/50 transition-all duration-300"
              style={{ background: 'rgba(49, 0, 81, 0.3)' }}
            >
              <div className="mb-4 p-3 rounded-lg w-fit" style={{ background: 'rgba(255, 0, 164, 0.1)' }}>
                <advantage.icon size={28} className="text-magenta" />
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-3">
                {advantage.title}
              </h3>
              <p className="text-grey-light">
                {advantage.description}
              </p>
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
          {/* Image de fond */}
          <img
            src="/images/locale/locale5.jpeg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, rgba(49,0,81,0.92), rgba(70,1,94,0.88))' }}></div>

          <div className="relative z-10 p-12 md:p-16 text-center">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
              Prêt à lancer ton projet?
            </h2>
            <p className="text-xl text-grey-light mb-8 max-w-2xl mx-auto">
              Dis-nous ce que tu as en tête. Soumission rapide, sans engagement.
            </p>
            <Link to="/contact" className="btn-primary">
              Demander une soumission
              <ArrowRight className="ml-2" size={20} />
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
}

export default Home;
