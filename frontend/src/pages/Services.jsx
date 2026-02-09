import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Printer, Sticker, Shirt, FileText, Palette, Code } from 'lucide-react';
import ServiceCard from '../components/ServiceCard';
import { img } from '../utils/paths';

function Services() {
  const services = [
    {
      icon: Printer,
      title: 'Impression Fine Art',
      description: 'Tirages premium sur Canon Pro-1000. Posters, affiches, photos d\'art sur papiers professionnels Canon, Ilford et Hahnemühle. Qualité galerie pour vos expositions et ventes d\'art.',
      link: '/services/impression-fine-art',
      image: img('/images/prints/Prints1.jpeg'),
    },
    {
      icon: Sticker,
      title: 'Stickers Custom',
      description: 'Die-cut sur mesure avec la Silhouette Cameo 5. Matte, glossy, transparent, holographique basic ou premium. Découpe précise à la forme de ton design.',
      link: '/services/stickers-custom',
      image: img('/images/stickers/Stickers1.jpeg'),
    },
    {
      icon: Shirt,
      title: 'Sublimation & Merch',
      description: 'T-shirts, hoodies, mugs, thermos, tapis de souris, porte-clés et plus. Impression sublimation permanente et vibrante pour ton merch d\'artiste.',
      link: '/services/sublimation-merch',
      image: img('/images/textile/Textile1.jpeg'),
    },
    {
      icon: FileText,
      title: 'Flyers & Cartes',
      description: 'Flyers A6, cartes postales, cartes d\'affaires. Impression rapide et locale pour tes événements, shows et promotions. Prix compétitifs.',
      link: '/services/flyers-cartes',
      image: img('/images/prints/Prints5.jpeg'),
    },
    {
      icon: Palette,
      title: 'Design Graphique',
      description: 'Logos, identités visuelles, affiches, packaging, supports marketing. En partenariat avec Christopher Gagnon, infographiste avec près de 10 ans d\'expérience.',
      link: '/services/design-graphique',
      image: img('/images/prints/Prints10.jpeg'),
    },
    {
      icon: Code,
      title: 'Développement Web',
      description: 'Sites vitrines, e-commerce, landing pages. Technologies modernes : React, Strapi, WordPress, Shopify. Du site d\'artiste à la boutique complète.',
      link: '/services/developpement-web',
      image: img('/images/locale/locale1.jpeg'),
    }
  ];

  return (
    <>
      <Helmet>
        <title>Services — Massive Medias</title>
        <meta name="description" content="Impression, stickers, sublimation, flyers, design graphique et développement web. Tous nos services créatifs." />
      </Helmet>

      {/* Hero avec image de fond */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img src={img('/images/locale/locale5.jpeg')} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,10,10,0.9) 0%, rgba(26,0,51,0.95) 100%)' }}></div>
        </div>

        <div className="relative z-10 section-container !py-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-white mb-6">
              Nos services
            </h1>
            <p className="text-xl md:text-2xl text-grey-light">
              De l'impression fine art aux stickers custom, de la sublimation textile au développement web — on couvre toute la chaîne de production créative.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Grille de services */}
      <section className="section-container">
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

      {/* Section packages */}
      <section className="section-container">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
            Packages combinés
          </h2>
          <p className="text-xl text-grey-light max-w-2xl mx-auto">
            Pour les créateurs qui veulent une solution complète.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Package Lancement Artiste */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden border border-magenta/30"
            style={{ background: 'linear-gradient(145deg, #3A0066, #5B0099)' }}
          >
            <div className="p-2">
              <img src={img('/images/prints/Prints3.jpeg')} alt="Package Lancement Artiste" className="w-full h-48 object-cover rounded-xl" />
            </div>
            <div className="p-8">
              <div className="text-magenta text-sm font-semibold uppercase tracking-wider mb-2">Le plus populaire</div>
              <h3 className="text-2xl font-heading font-bold text-white mb-2">Package Lancement Artiste</h3>
              <div className="text-4xl font-heading font-bold text-gradient mb-4">2 800$</div>
              <p className="text-grey-muted text-sm mb-6 line-through">Valeur séparée: 4 660$ — Économie de 40%</p>
              <ul className="space-y-3 text-grey-light mb-8">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-magenta"></div>
                  25 prints A3+
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-magenta"></div>
                  100 stickers promotionnels
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-magenta"></div>
                  10 affiches A2
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-magenta"></div>
                  Site vitrine 5 pages
                </li>
              </ul>
              <a href="/contact" className="btn-primary w-full text-center">Demander ce package</a>
            </div>
          </motion.div>

          {/* Package Événement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden border border-purple-main/30"
            style={{ background: 'linear-gradient(145deg, #3A0066, #5B0099)' }}
          >
            <div className="p-2">
              <img src={img('/images/stickers/Stickers3.jpeg')} alt="Package Événement" className="w-full h-48 object-cover rounded-xl" />
            </div>
            <div className="p-8">
              <div className="text-electric-purple text-sm font-semibold uppercase tracking-wider mb-2">Événements</div>
              <h3 className="text-2xl font-heading font-bold text-white mb-2">Package Événement</h3>
              <div className="text-4xl font-heading font-bold text-gradient mb-4">900$</div>
              <p className="text-grey-muted text-sm mb-6 line-through">Valeur séparée: 1 410$ — Économie de 36%</p>
              <ul className="space-y-3 text-grey-light mb-8">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-magenta"></div>
                  150 flyers 8,5x11"
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-magenta"></div>
                  25 affiches 11x17"
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-magenta"></div>
                  200 stickers 2,5" holographiques
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-magenta"></div>
                  Landing page événement
                </li>
              </ul>
              <a href="/contact" className="btn-primary w-full text-center">Demander ce package</a>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

export default Services;
