import { motion } from 'framer-motion';
import { MapPin, Printer, Scissors, Shirt, Monitor } from 'lucide-react';
import { img, thumb } from '../utils/paths';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';

const equipmentIcons = [Printer, Scissors, Shirt, Shirt, Monitor, Printer, Monitor];

function APropos() {
  const { t, lang } = useLang();

  const equipmentItems = t('aboutPage.equipment.items');
  const timelineEvents = t('aboutPage.timeline.events');
  const historyParagraphs = t('aboutPage.history.paragraphs');

  return (
    <>
      <SEO
        title={t('aboutPage.seo.title')}
        description={t('aboutPage.seo.description')}
        breadcrumbs={[
          { name: lang === 'fr' ? 'Accueil' : 'Home', url: '/' },
          { name: t('nav.about') },
        ]}
      />

      {/* Hero avec photo de l'espace */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 hero-aurora"></div>

        <div className="relative z-10 section-container !py-0 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-heading mb-6">
              {t('aboutPage.hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-grey-light">
              {t('aboutPage.hero.subtitle')}
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
                {t('aboutPage.history.title')}
              </h2>
              <div className="text-grey-light space-y-4 text-lg leading-relaxed">
                {historyParagraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img src={thumb('/images/locale/locale2.webp')} alt="Studio Massive Medias" className="rounded-xl w-full h-48 object-cover" />
              <img src={thumb('/images/locale/locale9.webp')} alt="Espace de travail" className="rounded-xl w-full h-48 object-cover" />
              <img src={thumb('/images/locale/locale10.webp')} alt="Équipement" className="rounded-xl w-full h-48 object-cover" />
              <img src={thumb('/images/locale/locale11.webp')} alt="Productions" className="rounded-xl w-full h-48 object-cover" />
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
            {t('aboutPage.timeline.title')}
          </h2>
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-accent to-electric-purple"></div>
            
            {timelineEvents.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start gap-6 mb-8 relative"
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 border-accent card-bg">
                  <span className="text-accent font-heading font-bold text-xs text-center leading-tight">{item.year}</span>
                </div>
                <div className="pt-3">
                  <p className="text-grey-light text-lg">{item.event}</p>
                </div>
              </motion.div>
            ))}
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
            {t('aboutPage.equipment.title')}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="grid grid-cols-2 gap-4">
              <img src={thumb('/images/locale/locale3.webp')} alt="Studio" className="rounded-xl w-full h-40 object-cover" />
              <img src={thumb('/images/locale/locale10.webp')} alt="Équipement" className="rounded-xl w-full h-40 object-cover" />
            </div>
            
            <div className="space-y-4">
              {equipmentItems.map((item, index) => {
                const Icon = equipmentIcons[index] || Monitor;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.08 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-4 p-4 rounded-xl border border-purple-main/30 transition-colors duration-300 glass-shadow"
                  >
                    <div className="p-2 rounded-lg flex-shrink-0 icon-bg">
                      <Icon size={20} className="text-accent" />
                    </div>
                    <div>
                      <h4 className="text-heading font-semibold">{item.name}</h4>
                      <p className="text-grey-muted text-sm">{item.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
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
            <img src={thumb('/images/locale/locale11.webp')} alt="Espace Versatile" className="w-full h-80 object-cover" />
            <div className="absolute inset-0 space-overlay"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={20} className="text-accent" />
                <span className="text-accent font-semibold">{t('aboutPage.space.location')}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-4">
                {t('aboutPage.space.title')}
              </h2>
              <p className="text-grey-light text-lg max-w-2xl">
                {t('aboutPage.space.description')}
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
            {t('aboutPage.universe.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="p-8 rounded-2xl border border-purple-main/30 transition-colors duration-300 card-bg card-shadow">
              <h3 className="text-2xl font-heading font-bold text-heading mb-3">{t('aboutPage.universe.mauditeMachine.title')}</h3>
              <p className="text-grey-light leading-relaxed">
                {t('aboutPage.universe.mauditeMachine.description')}
              </p>
            </div>
            <div className="p-8 rounded-2xl border border-purple-main/30 transition-colors duration-300 card-bg card-shadow">
              <h3 className="text-2xl font-heading font-bold text-heading mb-3">{t('aboutPage.universe.vrstl.title')}</h3>
              <p className="text-grey-light leading-relaxed">
                {t('aboutPage.universe.vrstl.description')}
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </>
  );
}

export default APropos;
