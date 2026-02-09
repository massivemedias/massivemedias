import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Users, Zap, MapPin, Printer, Scissors, Shirt, Monitor } from 'lucide-react';
import MassiveLogo from '../assets/massive-logo.svg';

function APropos() {
  const equipment = [
    { name: 'Canon imagePROGRAF PRO-1000', desc: 'Impression fine art 12 couleurs, jusqu\'à 17"', icon: Printer },
    { name: 'Silhouette Cameo 5', desc: 'Découpe stickers et vinyle de précision', icon: Scissors },
    { name: 'Heat Press Bettersub', desc: 'Presse à chaud sublimation grand format', icon: Shirt },
    { name: 'Heat Press Cricut', desc: 'Presse à chaud compacte polyvalente', icon: Shirt },
    { name: 'Lamineuse VEVOR 25"', desc: 'Lamination et finition professionnelle', icon: Monitor },
    { name: 'Epson ET-2850', desc: 'Impression courante et épreuves', icon: Printer },
    { name: 'MacBook Pro M1 + M4', desc: 'Production, design et développement', icon: Monitor },
  ];

  const timeline = [
    { year: '2018-2019', event: 'Début impression et matériel promotionnel pour la scène musicale' },
    { year: '2020', event: 'Massive Medias devient activité structurée. Lancement officiel.' },
    { year: '2023-2024', event: 'Acquisition équipements professionnels — Canon Pro-1000, Cameo 5, presses sublimation' },
    { year: '2025', event: 'Enregistrement officiel au REQ. Recentrage: prints, stickers, graphisme, web' },
    { year: '2026', event: 'Incorporation provinciale prévue. Lancement Merch-as-a-Service.' },
  ];

  return (
    <>
      <Helmet>
        <title>À propos — Massive Medias</title>
        <meta name="description" content="Studio de production créative fondé en 2020 à Montréal. L'équipe, l'espace et notre histoire." />
      </Helmet>

      {/* Hero avec photo de l'espace */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/locale/locale3.jpeg" alt="Espace Versatile" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,10,10,0.85) 0%, rgba(26,0,51,0.95) 100%)' }}></div>
        </div>

        <div className="relative z-10 section-container !py-0 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-white mb-6">
              À propos
            </h1>
            <p className="text-xl md:text-2xl text-grey-light">
              Un studio créatif ancré dans le Mile-End, au cœur de la scène artistique montréalaise.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="section-container max-w-6xl mx-auto">

        {/* L'histoire */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-heading font-bold text-gradient mb-6">
                L'histoire
              </h2>
              <div className="text-grey-light space-y-4 text-lg leading-relaxed">
                <p>
                  Massive Medias est un studio de production créative établi depuis 2020 dans le Mile-End, au cœur de l'écosystème artistique montréalais.
                </p>
                <p>
                  L'entreprise offre quatre services intégrés destinés aux artistes visuels, photographes, musiciens et créateurs indépendants : impressions fine art, stickers personnalisés, design graphique et développement web.
                </p>
                <p>
                  Notre philosophie : offrir un service local, personnalisé et de qualité professionnelle, sans les délais et les complications des services en ligne. Pas de shipping, pas d'attente. Pick-up au Mile-End ou livraison locale.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img src="/images/locale/locale1.jpeg" alt="Studio Massive Medias" className="rounded-xl w-full h-48 object-cover" />
              <img src="/images/locale/locale2.jpeg" alt="Espace de travail" className="rounded-xl w-full h-48 object-cover" />
              <img src="/images/locale/locale4.jpeg" alt="Équipement" className="rounded-xl w-full h-48 object-cover" />
              <img src="/images/locale/locale5.jpeg" alt="Productions" className="rounded-xl w-full h-48 object-cover" />
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-4xl font-heading font-bold text-gradient mb-10 text-center">
            Notre parcours
          </h2>
          <div className="relative max-w-3xl mx-auto">
            {/* Ligne verticale */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-magenta to-electric-purple"></div>
            
            {timeline.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start gap-6 mb-8 relative"
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 border-magenta" style={{ background: 'linear-gradient(145deg, #310051, #46015E)' }}>
                  <span className="text-magenta font-heading font-bold text-xs text-center leading-tight">{item.year}</span>
                </div>
                <div className="pt-3">
                  <p className="text-grey-light text-lg">{item.event}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* L'équipe */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-4xl font-heading font-bold text-gradient mb-10 text-center">
            L'équipe
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mika */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden border border-purple-main/30"
              style={{ background: 'linear-gradient(145deg, #310051, #46015E)' }}
            >
              <div className="h-64 overflow-hidden">
                <img src="/images/locale/locale8.jpeg" alt="Michael Sanchez" className="w-full h-full object-cover" />
              </div>
              <div className="p-8">
                <div className="mb-3 p-2 rounded-lg w-fit" style={{ background: 'rgba(255, 0, 164, 0.1)' }}>
                  <Users size={24} className="text-magenta" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-white mb-1">
                  Michael "Mika" Sanchez
                </h3>
                <p className="text-magenta font-semibold mb-4">Fondateur</p>
                <p className="text-grey-light leading-relaxed">
                  Fondateur de Massive Medias, Mika est aussi compositeur de musique électronique et producteur sous le nom <strong className="text-white">Maudite Machine</strong> et fondateur du label <strong className="text-white">VRSTL Records</strong>. Programmeur-analyste de formation, il combine expertise technique et connaissance intime de la scène créative montréalaise.
                </p>
                <p className="text-grey-light leading-relaxed mt-3">
                  15+ années d'expérience en développement web et design graphique. Expertise en gestion de la couleur et calibration pour l'impression Fine Art.
                </p>
              </div>
            </motion.div>

            {/* Christopher */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden border border-purple-main/30"
              style={{ background: 'linear-gradient(145deg, #310051, #46015E)' }}
            >
              <div className="h-64 overflow-hidden">
                <img src="/images/locale/locale9.jpeg" alt="Christopher Gagnon" className="w-full h-full object-cover" />
              </div>
              <div className="p-8">
                <div className="mb-3 p-2 rounded-lg w-fit" style={{ background: 'rgba(255, 0, 164, 0.1)' }}>
                  <Zap size={24} className="text-magenta" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-white mb-1">
                  Christopher Gagnon
                </h3>
                <p className="text-magenta font-semibold mb-4">Partenaire Design</p>
                <p className="text-grey-light leading-relaxed">
                  Infographiste diplômé avec près de 10 ans d'expérience. Spécialisé en identité visuelle, packaging et design web. Christopher apporte une expertise créative complète à chaque projet.
                </p>
                <p className="text-grey-light leading-relaxed mt-3">
                  Portfolio : Soundwave Festival, Laboratoire Bio Stratège, ChromaPur, Nutramazonie, NextGen Football et plus encore.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Équipement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-4xl font-heading font-bold text-gradient mb-10 text-center">
            Notre équipement
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Photos d'équipement */}
            <div className="grid grid-cols-2 gap-4">
              <img src="/images/locale/locale6.jpeg" alt="Canon Pro-1000" className="rounded-xl w-full h-40 object-cover" />
              <img src="/images/locale/locale7.jpeg" alt="Cameo 5" className="rounded-xl w-full h-40 object-cover" />
              <img src="/images/locale/locale10.jpeg" alt="Presses" className="rounded-xl w-full h-40 object-cover col-span-2" />
            </div>
            
            {/* Liste d'équipements */}
            <div className="space-y-4">
              {equipment.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.08 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-4 p-4 rounded-xl border border-purple-main/30"
                  style={{ background: 'rgba(49, 0, 81, 0.3)' }}
                >
                  <div className="p-2 rounded-lg flex-shrink-0" style={{ background: 'rgba(255, 0, 164, 0.1)' }}>
                    <item.icon size={20} className="text-magenta" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{item.name}</h4>
                    <p className="text-grey-muted text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* L'espace Versatile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="rounded-2xl overflow-hidden relative">
            <img src="/images/locale/locale11.jpeg" alt="Espace Versatile" className="w-full h-80 object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(26,0,51,0.95) 100%)' }}></div>
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={20} className="text-magenta" />
                <span className="text-magenta font-semibold">Mile-End, Montréal</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
                L'espace Versatile
              </h2>
              <p className="text-grey-light text-lg max-w-2xl">
                On opère depuis l'espace collaboratif Versatile, au 7049 rue Saint-Urbain dans le Mile-End. Un lieu de création partagé avec une quinzaine de créateurs : vidéastes, photographes, designers, artistes. Pick-up disponible sur rendez-vous.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Aussi dans l'univers Massive */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-heading font-bold text-gradient mb-8 text-center">
            Aussi dans l'univers Massive
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="p-8 rounded-2xl border border-purple-main/30" style={{ background: 'linear-gradient(145deg, #310051, #46015E)' }}>
              <h3 className="text-2xl font-heading font-bold text-white mb-3">Maudite Machine</h3>
              <p className="text-grey-light leading-relaxed">
                Compositeur de musique électronique et producteur. Sets et productions dark disco / indie dance. Sorties sur plusieurs labels, performances lors d'événements majeurs au Canada.
              </p>
            </div>
            <div className="p-8 rounded-2xl border border-purple-main/30" style={{ background: 'linear-gradient(145deg, #310051, #46015E)' }}>
              <h3 className="text-2xl font-heading font-bold text-white mb-3">VRSTL Records</h3>
              <p className="text-grey-light leading-relaxed">
                Label canadien dédié à l'Indie Dance et la Dark Minimal. Direction artistique, gestion des sorties, distribution digitale et promotion.
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </>
  );
}

export default APropos;
