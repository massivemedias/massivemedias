import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Printer, Sticker, Palette, Code, Shirt, FileText, Package } from 'lucide-react';
import { img, thumb } from '../utils/paths';
import { useLang } from '../i18n/LanguageContext';

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
          <img src={thumb('/images/prints/Prints6.jpeg')} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'var(--hero-gradient)' }}></div>
        </div>
        <div className="relative z-10 section-container !py-0 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-white mb-6">
              {t('tarifsPage.hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto">
              {t('tarifsPage.hero.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="section-container max-w-6xl mx-auto">

        {/* Impressions Fine Art */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg" style={{ background: 'var(--icon-bg)' }}>
              <Printer size={28} className="text-magenta" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-heading">{t('tarifsPage.fineArt.title')}</h2>
          </div>
          <p className="text-grey-light mb-6">{t('tarifsPage.fineArt.subtitle')}</p>

          <div className="rounded-xl overflow-hidden border border-purple-main/30" style={{ boxShadow: 'var(--card-shadow)' }}>
            <table className="price-table">
              <thead>
                <tr>
                  {t('tarifsPage.fineArt.headers').map((h, i) => (
                    <th key={i} className={i === 3 ? 'text-grey-muted' : ''}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-heading font-semibold">A4 (8×10")</td>
                  <td className="text-gradient font-bold">45$</td>
                  <td>75$</td>
                  <td className="text-grey-muted line-through">59$ + shipping</td>
                </tr>
                <tr>
                  <td className="text-heading font-semibold">A3 (12×18")</td>
                  <td className="text-gradient font-bold">55$</td>
                  <td>95$</td>
                  <td className="text-grey-muted line-through">76$ + shipping</td>
                </tr>
                <tr>
                  <td className="text-heading font-semibold">A3+ (13×19")</td>
                  <td className="text-gradient font-bold">65$</td>
                  <td>110$</td>
                  <td className="text-grey-muted">-</td>
                </tr>
                <tr>
                  <td className="text-heading font-semibold">A2 (18×24")</td>
                  <td className="text-gradient font-bold">95$</td>
                  <td>150$</td>
                  <td className="text-grey-muted line-through">132$ + shipping</td>
                </tr>
                <tr>
                  <td className="text-heading font-semibold">24×36"</td>
                  <td className="text-gradient font-bold">150$</td>
                  <td>{t('tarifsPage.fineArt.headers')[3] === 'Etsy Ref.' ? 'On request' : 'Sur demande'}</td>
                  <td className="text-grey-muted line-through">189$ + shipping</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-grey-muted text-sm mt-3 italic">{t('tarifsPage.fineArt.note')}</p>
        </motion.div>

        {/* Stickers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg" style={{ background: 'var(--icon-bg)' }}>
              <Sticker size={28} className="text-magenta" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-heading">{t('tarifsPage.stickers.title')}</h2>
          </div>
          <p className="text-grey-light mb-6">{t('tarifsPage.stickers.subtitle')}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-xl overflow-hidden border border-purple-main/30" style={{ boxShadow: 'var(--card-shadow)' }}>
              <div className="p-4 border-b border-purple-main/30" style={{ background: 'var(--bg-glass-alt)' }}>
                <h3 className="text-heading font-heading font-bold">{t('tarifsPage.stickers.table1Title')}</h3>
              </div>
              <table className="price-table">
                <thead>
                  <tr>
                    {t('tarifsPage.stickers.table1Headers').map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="text-heading">50</td><td className="text-gradient font-bold">50$</td><td className="text-grey-muted">1,00$/u</td></tr>
                  <tr><td className="text-heading">100</td><td className="text-gradient font-bold">85$</td><td className="text-grey-muted">0,85$/u</td></tr>
                  <tr><td className="text-heading">150</td><td className="text-gradient font-bold">110$</td><td className="text-grey-muted">0,73$/u</td></tr>
                  <tr><td className="text-heading">250</td><td className="text-gradient font-bold">175$</td><td className="text-grey-muted">0,70$/u</td></tr>
                </tbody>
              </table>
            </div>

            <div className="rounded-xl overflow-hidden border border-purple-main/30" style={{ boxShadow: 'var(--card-shadow)' }}>
              <div className="p-4 border-b border-purple-main/30" style={{ background: 'var(--bg-glass-alt)' }}>
                <h3 className="text-heading font-heading font-bold">{t('tarifsPage.stickers.table2Title')}</h3>
              </div>
              <table className="price-table">
                <thead>
                  <tr>
                    {t('tarifsPage.stickers.table2Headers').map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="text-heading">10</td><td className="text-gradient font-bold">70$</td><td className="text-grey-muted">7,00$/f</td></tr>
                  <tr><td className="text-heading">25</td><td className="text-gradient font-bold">150$</td><td className="text-grey-muted">6,00$/f</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Design Graphique */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg" style={{ background: 'var(--icon-bg)' }}>
              <Palette size={28} className="text-magenta" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-heading">{t('tarifsPage.design.title')}</h2>
          </div>
          <p className="text-grey-light mb-6">{t('tarifsPage.design.subtitle')}</p>

          <div className="rounded-xl overflow-hidden border border-purple-main/30" style={{ boxShadow: 'var(--card-shadow)' }}>
            <table className="price-table">
              <thead>
                <tr>
                  {t('tarifsPage.design.headers').map((h, i) => <th key={i}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {t('tarifsPage.design.rows').map((row, i) => (
                  <tr key={i}>
                    <td className="text-heading font-semibold">{row[0]}</td>
                    <td className="text-gradient font-bold">{row[1]}</td>
                    <td className="text-grey-muted">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Développement Web */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg" style={{ background: 'var(--icon-bg)' }}>
              <Code size={28} className="text-magenta" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-heading">{t('tarifsPage.web.title')}</h2>
          </div>
          <p className="text-grey-light mb-6">{t('tarifsPage.web.subtitle')}</p>

          <div className="rounded-xl overflow-hidden border border-purple-main/30" style={{ boxShadow: 'var(--card-shadow)' }}>
            <table className="price-table">
              <thead>
                <tr>
                  {t('tarifsPage.web.headers').map((h, i) => <th key={i}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {t('tarifsPage.web.rows').map((row, i) => (
                  <tr key={i}>
                    <td className="text-heading font-semibold">{row[0]}</td>
                    <td className="text-gradient font-bold">{row[1]}</td>
                    <td className="text-grey-muted">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

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
                <img src={thumb('/images/prints/Prints3.jpeg')} alt={t('tarifsPage.packages.artistTitle')} className="w-full h-40 object-cover rounded-xl" />
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
                <img src={thumb('/images/stickers/Stickers3.jpeg')} alt={t('tarifsPage.packages.eventTitle')} className="w-full h-40 object-cover rounded-xl" />
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
