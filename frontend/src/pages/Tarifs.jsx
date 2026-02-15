import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Printer, Sticker, Palette, Code, Shirt, FileText, Package } from 'lucide-react';
import { thumb } from '../utils/paths';
import { useLang } from '../i18n/LanguageContext';

function PriceSection({ icon: Icon, titleKey, subtitleKey, headersKey, rowsKey, noteKey, t }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="mb-16"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg" style={{ background: 'var(--icon-bg)' }}>
          <Icon size={28} className="text-magenta" />
        </div>
        <h2 className="text-3xl font-heading font-bold text-heading">{t(titleKey)}</h2>
      </div>
      <p className="text-grey-light mb-6">{t(subtitleKey)}</p>

      <div className="rounded-xl overflow-hidden border border-purple-main/30" style={{ boxShadow: 'var(--card-shadow)' }}>
        <table className="price-table">
          <thead>
            <tr>
              {t(headersKey).map((h, i) => <th key={i}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {t(rowsKey).map((row, i) => (
              <tr key={i}>
                <td className="text-heading font-semibold">{row[0]}</td>
                <td className="text-gradient font-bold">{row[1]}</td>
                {row[2] !== undefined && <td className="text-grey-muted">{row[2]}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {noteKey && <p className="text-grey-muted text-sm mt-3 italic">{t(noteKey)}</p>}
    </motion.div>
  );
}

function Tarifs() {
  const { t } = useLang();

  return (
    <>
      <Helmet>
        <title>{t('tarifsPage.seo.title')}</title>
        <meta name="description" content={t('tarifsPage.seo.description')} />
      </Helmet>

      {/* Hero */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img src={thumb('/images/prints/FineArt1.webp')} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'var(--hero-gradient)' }}></div>
        </div>
        <div className="relative z-10 section-container !py-0 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-heading mb-6">
              {t('tarifsPage.hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-grey-light max-w-3xl mx-auto">
              {t('tarifsPage.hero.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="section-container max-w-6xl mx-auto">

        {/* Impressions Fine Art */}
        <PriceSection
          icon={Printer}
          titleKey="tarifsPage.fineArt.title"
          subtitleKey="tarifsPage.fineArt.subtitle"
          headersKey="tarifsPage.fineArt.headers"
          rowsKey="tarifsPage.fineArt.rows"
          noteKey="tarifsPage.fineArt.note"
          t={t}
        />

        {/* Stickers */}
        <PriceSection
          icon={Sticker}
          titleKey="tarifsPage.stickers.title"
          subtitleKey="tarifsPage.stickers.subtitle"
          headersKey="tarifsPage.stickers.headers"
          rowsKey="tarifsPage.stickers.rows"
          t={t}
        />

        {/* Sublimation & Merch */}
        <PriceSection
          icon={Shirt}
          titleKey="tarifsPage.sublimation.title"
          subtitleKey="tarifsPage.sublimation.subtitle"
          headersKey="tarifsPage.sublimation.headers"
          rowsKey="tarifsPage.sublimation.rows"
          noteKey="tarifsPage.sublimation.note"
          t={t}
        />

        {/* Flyers & Cartes */}
        <PriceSection
          icon={FileText}
          titleKey="tarifsPage.flyers.title"
          subtitleKey="tarifsPage.flyers.subtitle"
          headersKey="tarifsPage.flyers.headers"
          rowsKey="tarifsPage.flyers.rows"
          t={t}
        />

        {/* Design Graphique */}
        <PriceSection
          icon={Palette}
          titleKey="tarifsPage.design.title"
          subtitleKey="tarifsPage.design.subtitle"
          headersKey="tarifsPage.design.headers"
          rowsKey="tarifsPage.design.rows"
          t={t}
        />

        {/* Développement Web */}
        <PriceSection
          icon={Code}
          titleKey="tarifsPage.web.title"
          subtitleKey="tarifsPage.web.subtitle"
          headersKey="tarifsPage.web.headers"
          rowsKey="tarifsPage.web.rows"
          t={t}
        />

        {/* Packages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg" style={{ background: 'var(--icon-bg)' }}>
              <Package size={28} className="text-magenta" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-heading">{t('tarifsPage.packages.title')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Package Lancement Artiste */}
            <div className="rounded-2xl overflow-hidden border-2 border-magenta/40 transition-colors duration-300" style={{ background: 'var(--bg-card)', boxShadow: 'var(--card-shadow)' }}>
              <div className="p-2">
                <img src={thumb('/images/prints/FineArt4.webp')} alt={t('tarifsPage.packages.artistTitle')} className="w-full h-40 object-cover rounded-xl" />
              </div>
              <div className="p-8">
                <div className="text-magenta text-xs font-semibold uppercase tracking-wider mb-2">{t('tarifsPage.packages.artistBadge')}</div>
                <h3 className="text-2xl font-heading font-bold text-heading mb-1">{t('tarifsPage.packages.artistTitle')}</h3>
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-4xl font-heading font-bold text-gradient">2 800$</span>
                  <span className="text-grey-muted line-through text-sm">4 660$</span>
                  <span className="text-magenta text-sm font-semibold">{t('tarifsPage.packages.artistDiscount')}</span>
                </div>
                <ul className="space-y-2 text-grey-light text-sm mb-6">
                  {t('tarifsPage.packages.artistItems').map((item, i) => (
                    <li key={i} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-magenta"></div>{item}</li>
                  ))}
                </ul>
                <Link to="/contact" className="btn-primary w-full text-center">{t('common.requestPackage')}</Link>
              </div>
            </div>

            {/* Package Événement */}
            <div className="rounded-2xl overflow-hidden border border-purple-main/30 transition-colors duration-300" style={{ background: 'var(--bg-card)', boxShadow: 'var(--card-shadow)' }}>
              <div className="p-2">
                <img src={thumb('/images/stickers/Stickers-Cosmovision.webp')} alt={t('tarifsPage.packages.eventTitle')} className="w-full h-40 object-cover rounded-xl" />
              </div>
              <div className="p-8">
                <div className="text-electric-purple text-xs font-semibold uppercase tracking-wider mb-2">{t('tarifsPage.packages.eventBadge')}</div>
                <h3 className="text-2xl font-heading font-bold text-heading mb-1">{t('tarifsPage.packages.eventTitle')}</h3>
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-4xl font-heading font-bold text-gradient">900$</span>
                  <span className="text-grey-muted line-through text-sm">1 410$</span>
                  <span className="text-magenta text-sm font-semibold">{t('tarifsPage.packages.eventDiscount')}</span>
                </div>
                <ul className="space-y-2 text-grey-light text-sm mb-6">
                  {t('tarifsPage.packages.eventItems').map((item, i) => (
                    <li key={i} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-magenta"></div>{item}</li>
                  ))}
                </ul>
                <Link to="/contact" className="btn-primary w-full text-center">{t('common.requestPackage')}</Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center p-12 rounded-2xl border border-purple-main/30 transition-colors duration-300"
          style={{ background: 'var(--cta-text-bg)', boxShadow: 'var(--card-shadow)' }}
        >
          <h2 className="text-3xl font-heading font-bold text-heading mb-4">
            {t('tarifsPage.cta.title')}
          </h2>
          <p className="text-grey-light text-lg mb-8 max-w-2xl mx-auto">
            {t('tarifsPage.cta.subtitle')}
          </p>
          <Link to="/contact" className="btn-primary">
            {t('tarifsPage.cta.button')}
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </motion.div>

      </div>
    </>
  );
}

export default Tarifs;
