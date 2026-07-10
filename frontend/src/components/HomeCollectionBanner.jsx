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
 * HOME-02 : PRIX visibles (3 $ le sticker, packs des 8 $ - dual-source depuis
 * les constantes), un design vedette pose sur le mockup gourde (meme tumbler
 * que la fiche produit). Style du site (fond mauve degrade, accent rose).
 * Micro-thumbs 160px en lazy pour ne pas peser sur le LCP de la home.
 *
 * HOME-03 (9 juillet 2026) : redesign de l'annonce (variante 1).
 *  1. Plus de bordure rose au repos - le conteneur est nu ; un lift leger + un
 *     glow rose + une fine bordure apparaissent UNIQUEMENT au survol.
 *  2. La rangee de stickers a plat devient un VRAI eventail (chevauchement,
 *     rotations, profondeur, stroke) facon cartes de familles /stickers.
 *  3. 8 designs forts et varies entre familles au lieu de 5 (FAN_DESIGNS,
 *     constante ajustable).
 * La gourde, le badge, le titre, les prix et le CTA sont conserves. La gourde
 * est masquee sous 700px (portrait etroit) ; l'eventail se resserre a 4
 * stickers sur mobile. Les micro-thumbs restent en lazy pour ne pas regresser
 * le LCP (fix HOME-PERF-01b : l'element preload reste la gourde, inchange).
 */

const MINI = '/images/thumbs-mini/stickers-massive'

// HOME-03 : 8 designs FORTS et varies entre familles. Constante ajustable :
// ajouter/retirer des slugs recalcule la geometrie de l'eventail automatiquement.
const FAN_DESIGNS = [
  'massive-dj-skull',
  'massive-chameleon',
  'massive-adian-fumeuse',
  'massive-alien-hot',
  'massive-fleur-degueu',
  'massive-jade',
  'massive-art-de-rue',
  'massive-mais',
]
const FAN_N = FAN_DESIGNS.length

// Geometrie pre-calculee (pure) : t symetrique autour du centre. Le centre est
// plus gros et au-dessus (z le plus haut). Reveal gradue pour tenir dans une
// colonne etroite sans clipper : la paire la plus externe n'apparait qu'a lg,
// la suivante des sm, le coeur (4 stickers) toujours -> eventail resserre sur
// mobile (brief HOME-03).
const FAN = FAN_DESIGNS.map((slug, i) => {
  const t = i - (FAN_N - 1) / 2
  const at = Math.abs(t)
  const end = Math.min(i, FAN_N - 1 - i) // 0 = paire la plus externe
  return {
    slug,
    size: Math.round(104 - at * 5),
    x: Math.round(t * 44),
    y: Math.round(at * 5),
    rot: Number((t * 5).toFixed(1)),
    z: Math.round(30 - at * 4),
    vis: end === 0 ? 'hidden lg:block' : end === 1 ? 'hidden sm:block' : '',
  }
})

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
        className="max-w-5xl mx-auto"
      >
        {/* HOME-03 : conteneur SANS bordure au repos. Lift leger + glow rose +
            fine bordure UNIQUEMENT au survol (transitions douces). */}
        <div
          className="relative overflow-hidden rounded-3xl px-6 sm:px-12 py-12 sm:py-14 transition-all duration-300 shadow-[0_24px_70px_rgba(0,0,0,0.4)] hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(240,0,152,0.20)] hover:ring-1 hover:ring-accent/20"
          style={{ background: 'linear-gradient(135deg, #2a0a4a, #3D0079)' }}
        >
          <div className="grid min-[700px]:grid-cols-[1.5fr_1fr] gap-8 md:gap-10 items-center">
            {/* Colonne texte + eventail */}
            <div className="text-center min-[700px]:text-left">
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
              <div className="flex flex-wrap items-center justify-center min-[700px]:justify-start gap-x-5 gap-y-2 mb-7">
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

              {/* Apercu en VRAI eventail (micro-thumbs 160px, lazy - ne pas
                  regresser le LCP HOME-PERF-01b). Purement decoratif. */}
              <div className="relative h-32 sm:h-36 mb-8 w-full max-w-lg mx-auto min-[700px]:mx-0" aria-hidden="true">
                {FAN.map((s) => (
                  <img
                    key={s.slug}
                    loading="lazy"
                    decoding="async"
                    width={s.size}
                    height={s.size}
                    src={`${MINI}/${s.slug}.webp`}
                    alt=""
                    className={`sticker-stroke absolute object-contain ${s.vis}`}
                    style={{
                      width: s.size,
                      height: s.size,
                      left: `calc(50% + ${s.x}px)`,
                      top: '50%',
                      marginLeft: -s.size / 2,
                      marginTop: -s.size / 2 + s.y,
                      transform: `rotate(${s.rot}deg)`,
                      zIndex: s.z,
                    }}
                  />
                ))}
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
                produit UI-02). Masquee sous 700px (portrait etroit). */}
            <div className="hidden min-[700px]:flex items-center justify-center">
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
        </div>
      </motion.div>
    </section>
  )
}
