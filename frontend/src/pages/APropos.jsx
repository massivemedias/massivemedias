import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { thumb } from '../utils/paths';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { useSiteContent } from '../hooks/useSiteContent';
import { bl, mediaUrl } from '../utils/cms';

function APropos() {
  const { t, lang, tx } = useLang();
  const { content } = useSiteContent();

  // ── Timeline ──
  const cmsTimeline = content?.aboutTimeline?.length ? content.aboutTimeline : null;
  const timelineEvents = cmsTimeline
    ? cmsTimeline.map((ev) => ({
        year: ev.year,
        event: bl(ev, 'event', lang),
      }))
    : null;

  // ── Team ──
  const cmsTeam = content?.aboutTeam?.length ? content.aboutTeam : null;

  // ── Universe ──
  const cmsUniverse = content?.aboutUniverse?.length >= 3 ? content.aboutUniverse : null;

  // Fallback data
  const fbTimelineEvents = t('aboutPage.timeline.events');
  const fbHistoryParagraphs = t('aboutPage.history.paragraphs');

  // History paragraphs from CMS (richtext field: aboutTextFr/En) or fallback
  const historyParagraphs = (content && bl(content, 'aboutText', lang))
    ? bl(content, 'aboutText', lang).split('\n').filter(Boolean)
    : fbHistoryParagraphs;

  // History images
  const historyImages = content?.aboutHistoryImages;

  return (
    <>
      <SEO
        title={content?.aboutSeo ? bl(content.aboutSeo, 'title', lang) || t('aboutPage.seo.title') : t('aboutPage.seo.title')}
        description={content?.aboutSeo ? bl(content.aboutSeo, 'description', lang) || t('aboutPage.seo.description') : t('aboutPage.seo.description')}
        breadcrumbs={[
          { name: tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' }), url: '/' },
          { name: t('nav.aPropos') },
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
              {(content && bl(content, 'aboutHeroTitle', lang)) || t('aboutPage.hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-grey-light">
              {(content && bl(content, 'aboutHeroSubtitle', lang)) || t('aboutPage.hero.subtitle')}
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
                {(content && bl(content, 'aboutHistoryTitle', lang)) || t('aboutPage.history.title')}
              </h2>
              <div className="text-grey-light space-y-4 text-lg leading-relaxed">
                {historyParagraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {historyImages && historyImages.length > 0
                ? historyImages.slice(0, 4).map((img, i) => (
                    <img key={i} src={mediaUrl(img)} alt={`Studio Massive Mile-End - Photo ${i + 1}`} className="rounded-xl w-full h-48 object-cover" loading="lazy" />
                  ))
                : <>
                    <img src={thumb('/images/locale/locale2.webp')} alt="Studio Massive" className="rounded-xl w-full h-48 object-cover" loading="lazy" />
                    <img src={thumb('/images/locale/locale9.webp')} alt="Espace de travail" className="rounded-xl w-full h-48 object-cover" loading="lazy" />
                    <img src={thumb('/images/locale/locale10.webp')} alt="Équipement" className="rounded-xl w-full h-48 object-cover" loading="lazy" />
                    <img src={thumb('/images/locale/locale11.webp')} alt="Productions" className="rounded-xl w-full h-48 object-cover" loading="lazy" />
                  </>
              }
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
          <h2 className="text-4xl font-heading font-bold text-gradient mb-12 text-center">
            {(content && bl(content, 'aboutTimelineTitle', lang)) || t('aboutPage.timeline.title')}
          </h2>
          <div className="relative max-w-4xl mx-auto">
            {/* Ligne verticale continue */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-accent/60 via-electric-purple/40 to-accent/20 md:-translate-x-px" />

            {(timelineEvents || fbTimelineEvents).map((item, index, arr) => {
              const isLeft = index % 2 === 0;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  viewport={{ once: true }}
                  className={`relative flex items-start gap-0 md:gap-0 mb-6 last:mb-0 ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                >
                  {/* Mobile: dot + card a droite */}
                  {/* Desktop: alternating sides */}

                  {/* Card */}
                  <div className={`flex-1 ml-14 md:ml-0 ${isLeft ? 'md:pr-10 md:text-right' : 'md:pl-10 md:text-left'}`}>
                    <div className="rounded-xl border border-purple-main/20 p-5 card-bg backdrop-blur-sm hover:border-accent/30 transition-all duration-300 group">
                      <div className={`flex items-center gap-3 mb-2 ${isLeft ? 'md:justify-end' : 'md:justify-start'}`}>
                        <span className="text-2xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-electric-purple">
                          {item.year}
                        </span>
                      </div>
                      <p className="text-grey-light text-sm md:text-base leading-relaxed">{item.event}</p>
                    </div>
                  </div>

                  {/* Center dot - mobile: absolute left, desktop: center */}
                  <div className="absolute left-6 md:left-1/2 top-6 -translate-x-1/2 z-10">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-accent to-electric-purple ring-4 ring-[var(--bg-primary)] group-hover:scale-125 transition-transform" />
                  </div>

                  {/* Spacer for the other side (desktop only) */}
                  <div className="hidden md:block flex-1" />
                </motion.div>
              );
            })}
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
            <img
              src={content?.aboutSpaceImage ? mediaUrl(content.aboutSpaceImage) : thumb('/images/locale/locale11.webp')}
              alt="Espace Versatile"
              className="w-full h-80 object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 space-overlay"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={20} className="text-accent" />
                <span className="text-accent font-semibold">
                  {(content && bl(content, 'aboutSpaceLocation', lang)) || t('aboutPage.space.location')}
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-4">
                {(content && bl(content, 'aboutSpaceTitle', lang)) || t('aboutPage.space.title')}
              </h2>
              <p className="text-grey-light text-lg max-w-2xl">
                {(content && bl(content, 'aboutSpaceDescription', lang)) || t('aboutPage.space.description')}
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
            {(content && bl(content, 'aboutUniverseTitle', lang)) || t('aboutPage.universe.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {cmsUniverse
              ? cmsUniverse.map((project, index) => (
                  <a key={index} href={project.url || '#'} target="_blank" rel="noopener noreferrer" className="block">
                    <div className="p-8 rounded-2xl border border-purple-main/30 transition-colors duration-300 card-bg card-shadow">
                      <h3 className="text-2xl font-heading font-bold text-heading mb-3">{bl(project, 'title', lang)}</h3>
                      <p className="text-grey-light leading-relaxed">
                        {bl(project, 'description', lang)}
                      </p>
                    </div>
                  </a>
                ))
              : <>
                  <a href="https://mauditemachine.com" target="_blank" rel="noopener noreferrer" className="block p-8 rounded-2xl border border-purple-main/30 hover:border-accent/50 transition-colors duration-300 card-bg card-shadow group">
                    <h3 className="text-2xl font-heading font-bold text-heading mb-3 group-hover:text-accent transition-colors">{t('aboutPage.universe.mauditeMachine.title')}</h3>
                    <p className="text-grey-light leading-relaxed">
                      {t('aboutPage.universe.mauditeMachine.description')}
                    </p>
                  </a>
                  <a href="https://vrstlrecords.com" target="_blank" rel="noopener noreferrer" className="block p-8 rounded-2xl border border-purple-main/30 hover:border-accent/50 transition-colors duration-300 card-bg card-shadow group">
                    <h3 className="text-2xl font-heading font-bold text-heading mb-3 group-hover:text-accent transition-colors">{t('aboutPage.universe.vrstl.title')}</h3>
                    <p className="text-grey-light leading-relaxed">
                      {t('aboutPage.universe.vrstl.description')}
                    </p>
                  </a>
                  <a href="https://belette3000.com" target="_blank" rel="noopener noreferrer" className="block p-8 rounded-2xl border border-purple-main/30 hover:border-accent/50 transition-colors duration-300 card-bg card-shadow group">
                    <h3 className="text-2xl font-heading font-bold text-heading mb-3 group-hover:text-accent transition-colors">{t('aboutPage.universe.belette3000.title')}</h3>
                    <p className="text-grey-light leading-relaxed">
                      {t('aboutPage.universe.belette3000.description')}
                    </p>
                  </a>
                </>
            }
          </div>
        </motion.div>

      </div>
    </>
  );
}

export default APropos;
