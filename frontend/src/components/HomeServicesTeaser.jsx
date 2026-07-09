import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Palette, Globe, Sticker, ArrowRight } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'

/**
 * HOME-02 section e : TEASER services, rangee sobre. Le menu reste la
 * navigation profonde ; ici on rappelle juste que Massive fait aussi du sur
 * mesure, avec un lien vers chaque page service existante.
 *
 * Arbitrage HOME-02 : NOMS ACTUELS des services (pas d'anticipation du
 * renommage "Creation" qui appartient au chantier ARCHI). Design graphique,
 * Developpement web, Stickers custom - avec leurs routes existantes.
 */
const TEASERS = [
  {
    icon: Palette,
    link: '/services/design',
    fr: 'Design graphique', en: 'Graphic design', es: 'Diseno grafico',
    dFr: 'Logos, identité visuelle, pochettes', dEn: 'Logos, visual identity, covers', dEs: 'Logos, identidad visual, portadas',
  },
  {
    icon: Globe,
    link: '/services/web',
    fr: 'Développement web', en: 'Web development', es: 'Desarrollo web',
    dFr: 'Sites sur mesure pour la scène culturelle', dEn: 'Custom sites for the cultural scene', dEs: 'Sitios a medida para la escena cultural',
  },
  {
    icon: Sticker,
    link: '/services/stickers',
    fr: 'Stickers custom', en: 'Custom stickers', es: 'Stickers custom',
    dFr: 'Die-cut vinyle, tes designs, dès 25 unités', dEn: 'Die-cut vinyl, your designs, from 25 units', dEs: 'Vinilo die-cut, tus disenos, desde 25 unidades',
  },
]

export default function HomeServicesTeaser() {
  const { tx } = useLang()
  return (
    <section className="section-container">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-2">
          {tx({ fr: 'Aussi sur mesure', en: 'Also made to order', es: 'Tambien a medida' })}
        </h2>
        <p className="text-grey-light max-w-2xl mx-auto">
          {tx({
            fr: 'Au-delà de la boutique, Massive conçoit et produit sur mesure.',
            en: 'Beyond the shop, Massive designs and produces custom work.',
            es: 'Mas alla de la tienda, Massive disena y produce a medida.',
          })}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {TEASERS.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div
              key={s.link}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              viewport={{ once: true }}
            >
              <Link
                to={s.link}
                className="group flex flex-col h-full rounded-2xl bg-glass card-shadow border border-white/5 hover:border-accent/40 p-6 transition-all"
              >
                <div className="mb-4 p-2.5 rounded-lg w-fit icon-bg">
                  <Icon size={22} className="text-accent" />
                </div>
                <h3 className="font-heading font-bold text-lg text-heading mb-1">
                  {tx({ fr: s.fr, en: s.en, es: s.es })}
                </h3>
                <p className="text-sm text-grey-light flex-1">
                  {tx({ fr: s.dFr, en: s.dEn, es: s.dEs })}
                </p>
                <span className="inline-flex items-center gap-1.5 text-accent text-sm font-semibold mt-4">
                  {tx({ fr: 'En savoir plus', en: 'Learn more', es: 'Saber mas' })}
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
