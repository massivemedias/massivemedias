import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { fineArtFormats, fineArtPrinterTiers } from '../data/products'
import { thumb } from '../utils/paths'

/**
 * HOME-02 section b : PRINTS & FINE ART.
 *
 * STICKERS-UI (revision) : showcase SOBRE. Petites vignettes d'oeuvres
 * encadrees (pas de scenes de piece salon/studio/zen - juges trop gros).
 * Les oeuvres viennent des prints artistes deja charges par la home (prop
 * `artworks`), avec un fallback local d'exemples de prints pour le prerender
 * / CMS vide. Tiers Studio / Musee mentionnes avec prix d'appel DUAL-SOURCE
 * (plus petit prix de FINE_ART_GRID via fineArtFormats), jamais hardcode.
 *
 * Perf : vignettes en lazy, transform/opacity au hover uniquement.
 */

// Fallback local (exemples de prints reels) si aucun print CMS charge.
const FALLBACK = [
  '/images/realisations/prints/FineArt1.webp',
  '/images/realisations/prints/FineArt4.webp',
  '/images/realisations/prints/FineArt6.webp',
  '/images/realisations/prints/Prints7.webp',
  '/images/realisations/prints/Prints17.webp',
  '/images/realisations/prints/Prints24.webp',
]

function priceFrom(key) {
  const vals = fineArtFormats.map((f) => f[key]).filter((v) => typeof v === 'number' && v > 0)
  return vals.length ? Math.min(...vals) : null
}

export default function HomePrintsSection({ artworks = [] }) {
  const { tx, lang } = useLang()
  const studioFrom = priceFrom('studioPrice')
  const museumFrom = priceFrom('museumPrice')
  const tierLabel = (id) => {
    const t = fineArtPrinterTiers.find((x) => x.id === id)
    if (!t) return ''
    return lang === 'en' ? t.labelEn : lang === 'es' ? t.labelEs : t.labelFr
  }

  // Vignettes : prints artistes si dispo, sinon exemples locaux.
  const vignettes = artworks.length
    ? artworks.slice(0, 6).map((a) => ({ src: a.image, link: `/artistes/${a.artistSlug}`, title: a.titleFr || a.titleEn || '' }))
    : FALLBACK.map((src) => ({ src: thumb(src), link: '/services/prints', title: '' }))

  return (
    <section className="section-container">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-center mb-8"
      >
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-heading mb-3 hero-title">
          {tx({ fr: 'Prints & Fine Art', en: 'Prints & Fine Art', es: 'Prints & Fine Art' })}
        </h2>
        <p className="text-xl text-grey-light max-w-2xl mx-auto">
          {tx({
            fr: 'Tes oeuvres imprimées à Montréal sur papier fine art, encres pigmentaires.',
            en: 'Your works printed in Montreal on fine art paper, pigment inks.',
            es: 'Tus obras impresas en Montreal en papel fine art, tintas pigmentadas.',
          })}
        </p>
      </motion.div>

      {/* Showcase compact : petites vignettes encadrees, rangee centree */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-3xl mx-auto mb-10">
        {vignettes.map((v, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            viewport={{ once: true }}
          >
            <Link
              to={v.link}
              className="group block w-20 sm:w-24 rounded-md bg-white p-1.5 shadow-lg transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl"
              aria-label={v.title || tx({ fr: 'Voir les prints', en: 'View prints', es: 'Ver los prints' })}
            >
              <div className="aspect-[3/4] overflow-hidden rounded-sm">
                <img
                  src={v.src}
                  alt={v.title || tx({ fr: 'Print fine art Massive', en: 'Massive fine art print', es: 'Print fine art Massive' })}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  width="200"
                  height="267"
                />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Tiers Studio / Musee + prix d'appel (dual-source) */}
      <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 max-w-3xl mx-auto mb-8">
        {studioFrom != null && (
          <div className="flex-1 rounded-2xl bg-glass border border-white/5 p-5 text-center">
            <h3 className="font-heading font-bold text-heading">{tierLabel('studio')}</h3>
            <p className="text-sm text-grey-light mt-1">
              {tx({ fr: '4 encres pigmentées', en: '4 pigment inks', es: '4 tintas pigmentadas' })}
            </p>
            <p className="text-accent font-heading font-bold text-xl mt-2">
              {tx({ fr: `dès ${studioFrom} $`, en: `from $${studioFrom}`, es: `desde ${studioFrom} $` })}
            </p>
          </div>
        )}
        {museumFrom != null && (
          <div className="flex-1 rounded-2xl bg-glass border border-white/5 p-5 text-center">
            <h3 className="font-heading font-bold text-heading">{tierLabel('museum')}</h3>
            <p className="text-sm text-grey-light mt-1">
              {tx({ fr: '12 encres, papier archive sans acide', en: '12 inks, acid-free archival paper', es: '12 tintas, papel de archivo sin acido' })}
            </p>
            <p className="text-accent font-heading font-bold text-xl mt-2">
              {tx({ fr: `dès ${museumFrom} $`, en: `from $${museumFrom}`, es: `desde ${museumFrom} $` })}
            </p>
          </div>
        )}
      </div>

      <div className="text-center">
        <Link to="/services/prints" className="btn-primary">
          {tx({ fr: 'Découvrir les prints', en: 'Explore prints', es: 'Descubrir los prints' })}
          <ArrowRight className="ml-2" size={18} />
        </Link>
      </div>
    </section>
  )
}
