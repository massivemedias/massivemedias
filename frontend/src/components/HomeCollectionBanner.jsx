import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { STICKERS_SHOP_ENABLED } from '../config/stickersShopStatus'

/**
 * HOME-COLLECTION (9 juillet 2026) : bandeau d'annonce de la vente de
 * designs sur la page d'accueil, insere juste apres le hero.
 *
 * Conditionnel a STICKERS_SHOP_ENABLED : si le flag tombe, le composant
 * retourne null et la section disparait sans laisser de trou.
 *
 * Style du site (fond mauve degrade, accent rose), pas un popup, pas de
 * clignotant. Apercu = 5 designs forts en eventail via les micro-thumbs
 * 160px (memes assets que les collages des cartes de familles), en
 * loading="lazy" pour ne pas ralentir la home.
 */

// 5 designs FORTS et NON-IP, en eventail. Micro-thumbs 160px (thumbs-mini).
const APERCU = [
  'massive-dj-skull',
  'massive-chameleon',
  'massive-adian-fumeuse',
  'massive-alien-hot',
  'massive-fleur-degueu',
]
const MINI = '/images/thumbs-mini/stickers-massive'
const OFFSETS = [-200, -100, 0, 100, 200]
const ROTS = [-10, 6, -3, 8, -7]
const ZS = [1, 2, 4, 3, 1]
const ORDER = [0, 4, 1, 3, 2] // centre dessine en dernier (au-dessus)

export default function HomeCollectionBanner() {
  const { tx } = useLang()
  if (!STICKERS_SHOP_ENABLED) return null

  return (
    <section className="px-4 sm:px-6 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto rounded-3xl px-6 sm:px-10 py-10 sm:py-12 text-center relative overflow-hidden border border-accent/25"
        style={{ background: 'linear-gradient(135deg, #2a0a4a, #3D0079)', boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}
      >
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent text-white text-xs font-extrabold uppercase tracking-wide mb-5">
          <Sparkles size={13} />
          {tx({ fr: 'Nouveau', en: 'New', es: 'Nuevo' })}
        </span>

        <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white leading-tight mb-3">
          {tx({
            fr: 'La Collection Stickers est arrivée',
            en: 'The Sticker Collection is here',
            es: 'La Coleccion de Stickers ya esta aqui',
          })}
        </h2>
        <p className="text-base sm:text-lg mb-8" style={{ color: '#d9c8f0' }}>
          {tx({
            fr: '270 designs originaux créés à Montréal, dès 3 $ le sticker.',
            en: '270 original designs made in Montreal, from $3 per sticker.',
            es: '270 disenos originales hechos en Montreal, desde 3 $ por sticker.',
          })}
        </p>

        {/* Apercu en eventail (micro-thumbs, lazy) */}
        <div className="relative h-28 sm:h-36 mb-8" aria-hidden="true">
          {ORDER.map((i) => {
            const size = i === 2 ? 112 : 88
            return (
              <img
                key={APERCU[i]}
                loading="lazy"
                decoding="async"
                width={size}
                height={size}
                src={`${MINI}/${APERCU[i]}.webp`}
                alt=""
                className="sticker-stroke absolute object-contain"
                style={{
                  width: size,
                  height: size,
                  left: `calc(50% + ${OFFSETS[i]}px - ${size / 2}px)`,
                  top: '50%',
                  marginTop: -size / 2,
                  transform: `rotate(${ROTS[i]}deg)`,
                  zIndex: ZS[i],
                }}
              />
            )
          })}
        </div>

        <Link
          to="/stickers"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-accent text-white font-semibold text-base hover:brightness-110 transition-all"
        >
          {tx({ fr: 'Découvrir la Collection', en: 'Discover the Collection', es: 'Descubrir la Coleccion' })}
          <ArrowRight size={18} />
        </Link>
      </motion.div>
    </section>
  )
}
