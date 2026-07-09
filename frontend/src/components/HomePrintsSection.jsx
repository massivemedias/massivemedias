import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { fineArtFormats, fineArtPrinterTiers } from '../data/products'

/**
 * HOME-02 section b : PRINTS & FINE ART.
 *
 * Presente 2-3 prints "en situation" dans les scenes mockup v2 du repo
 * (salon, studio, zen - des fonds de piece vides sur lesquels on COMPOSE une
 * oeuvre vedette en CSS, leger et prerendu, sans le canvas chroma-key lourd
 * du configurateur qui plomberait le Lighthouse de la home).
 *
 * Les oeuvres vedettes viennent des prints artistes deja charges par la home
 * (prop `artworks`, images CMS propres). Sans oeuvre (prerender / CMS vide),
 * la scene affiche un cadre elegant vide -> jamais casse.
 *
 * Tiers Studio / Musee mentionnes avec prix d'appel DUAL-SOURCE (plus petit
 * prix de la grille FINE_ART_GRID via fineArtFormats), jamais hardcode.
 *
 * FRAME_RECT : rectangle du cadre par scene, en % du conteneur. Ajustable a
 * l'oeil (les scenes sont frontales, pas de perspective forte).
 */
const SCENES = [
  { id: 'living_room', fr: 'Salon', en: 'Living room', es: 'Salon', rect: { left: 34, top: 15, width: 31 } },
  { id: 'studio', fr: 'Studio', en: 'Studio', es: 'Estudio', rect: { left: 20, top: 20, width: 30 } },
  { id: 'zen', fr: 'Zen', en: 'Zen', es: 'Zen', rect: { left: 35, top: 17, width: 29 } },
]
const SCENE_DIR = '/images/mockups/v2'
const FRAME_RATIO = 4 / 3 // hauteur / largeur du cadre (portrait)

function priceFrom(key) {
  // Plus petit prix non nul de la grille pour le tier (studioPrice/museumPrice).
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

  return (
    <section className="section-container">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-center mb-10"
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

      {/* Scenes : oeuvre vedette composee sur le mur */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto mb-10">
        {SCENES.map((scene, i) => {
          const art = artworks[i]
          return (
            <motion.div
              key={scene.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="relative rounded-2xl overflow-hidden aspect-square"
            >
              <img
                src={`${SCENE_DIR}/${scene.id}.webp`}
                alt={tx({ fr: `Print en situation - ${scene.fr}`, en: `Print in a ${scene.en}`, es: `Print en un ${scene.es}` })}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                width="700"
                height="700"
              />
              {/* Cadre + oeuvre vedette composee sur le mur */}
              <div
                className="absolute shadow-2xl"
                style={{
                  left: `${scene.rect.left}%`,
                  top: `${scene.rect.top}%`,
                  width: `${scene.rect.width}%`,
                  aspectRatio: `1 / ${FRAME_RATIO}`,
                  background: '#fff',
                  padding: '4%',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                }}
              >
                {art ? (
                  <img
                    src={art.image}
                    alt={art.titleFr || art.titleEn || ''}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full bg-black/5" aria-hidden="true" />
                )}
              </div>
            </motion.div>
          )
        })}
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
