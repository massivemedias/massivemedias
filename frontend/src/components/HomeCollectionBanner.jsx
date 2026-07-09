import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { STICKERS_SHOP_ENABLED } from '../config/stickersShopStatus'
import { STICKER_COLLECTION_UNIT_PRICE, MYSTERY_PACK_PRICES } from '../data/products'

/**
 * HOME-COLLECTION (9 juillet 2026, agrandie HOME-02) : section a de la
 * vitrine d'accueil, annonce de la vente de la Collection Stickers, juste
 * apres le hero/rideau.
 *
 * Conditionnel a STICKERS_SHOP_ENABLED : si le flag tombe, le composant
 * retourne null et la section disparait sans laisser de trou.
 *
 * HOME-02 : version agrandie et vendeuse. Eventail plus fourni, PRIX visibles
 * (3 $ le sticker, packs des 8 $ - dual-source depuis les constantes), un
 * design vedette pose sur le mockup gourde (meme tumbler que la fiche
 * produit). Style du site (fond mauve degrade, accent rose), pas un popup.
 * Micro-thumbs 160px en lazy pour ne pas peser sur le LCP de la home.
 */

// Designs FORTS et NON-IP, en eventail. Micro-thumbs 160px (thumbs-mini).
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

// Design vedette pose sur la gourde (mockup tumbler du repo).
const VEDETTE = 'massive-adian-fumeuse'

export default function HomeCollectionBanner() {
  const { tx } = useLang()
  if (!STICKERS_SHOP_ENABLED) return null

  // Prix d'appel des packs (dual-source : plus petit prix de MYSTERY_PACK_PRICES).
  const packFrom = Math.min(...Object.values(MYSTERY_PACK_PRICES))

  return (
    <section className="px-4 sm:px-6 py-10 sm:py-14">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="max-w-5xl mx-auto rounded-3xl px-6 sm:px-12 py-12 sm:py-14 relative overflow-hidden border border-accent/25"
        style={{ background: 'linear-gradient(135deg, #2a0a4a, #3D0079)', boxShadow: '0 24px 70px rgba(0,0,0,0.4)' }}
      >
        <div className="grid md:grid-cols-[1.4fr_1fr] gap-8 md:gap-10 items-center">
          {/* Colonne texte + eventail */}
          <div className="text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent text-white text-xs font-extrabold uppercase tracking-wide mb-5">
              <Sparkles size={13} />
              {tx({ fr: 'Nouveau', en: 'New', es: 'Nuevo' })}
            </span>

            <h2 className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl text-white leading-tight mb-3">
              {tx({
                fr: 'La Collection Stickers est arrivée',
                en: 'The Sticker Collection is here',
                es: 'La Coleccion de Stickers ya esta aqui',
              })}
            </h2>
            <p className="text-base sm:text-lg mb-5" style={{ color: '#d9c8f0' }}>
              {tx({
                fr: '270 designs originaux créés à Montréal.',
                en: '270 original designs made in Montreal.',
                es: '270 disenos originales hechos en Montreal.',
              })}
            </p>

            {/* Prix visibles (dual-source) */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 mb-7">
              <span className="text-white">
                <span className="font-heading font-bold text-2xl text-accent">{STICKER_COLLECTION_UNIT_PRICE}&nbsp;$</span>
                <span className="text-sm ml-1.5" style={{ color: '#d9c8f0' }}>
                  {tx({ fr: 'le sticker', en: 'per sticker', es: 'por sticker' })}
                </span>
              </span>
              <span className="hidden sm:inline text-white/25">|</span>
              <span className="text-white">
                <span className="font-heading font-bold text-2xl text-accent">
                  {tx({ fr: `Packs dès ${packFrom} $`, en: `Packs from $${packFrom}`, es: `Packs desde ${packFrom} $` })}
                </span>
              </span>
            </div>

            {/* Apercu en eventail (micro-thumbs, lazy) */}
            <div className="relative h-28 sm:h-36 mb-8 mx-auto md:mx-0 max-w-md" aria-hidden="true">
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
          </div>

          {/* Colonne mockup gourde avec design vedette (meme rendu que la fiche
              produit UI-02). Cache sur tres petit ecran pour rester aere. */}
          <div className="hidden md:flex items-center justify-center">
            <div className="relative h-72 lg:h-80 w-full flex items-center justify-center">
              <img
                src="/images/mugs/tumbler-white.webp"
                alt={tx({ fr: 'Gourde avec un sticker de la collection', en: 'Bottle with a collection sticker', es: 'Botella con un sticker de la coleccion' })}
                className="h-full w-auto object-contain drop-shadow-2xl"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute" style={{ left: '50%', top: '52%', width: '42%', aspectRatio: '1', transform: 'translate(-50%, -50%)' }}>
                <img
                  src={`${MINI}/${VEDETTE}.webp`}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-contain"
                  style={{ transform: 'rotate(-2deg)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))' }}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
