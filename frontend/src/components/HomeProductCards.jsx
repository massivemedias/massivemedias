import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { thumb } from '../utils/paths'
import { mediaUrl } from '../utils/cms'
import { ETIQUETTES_VISIBLE } from '../config/etiquettesStatus'

/**
 * HOME-CARTES (15 juillet 2026) : rangee de 3 cartes produits qui remplace la
 * grosse banniere Collection sous le hero. Pattern etabli du site : surface
 * `surface-vitrine` (bg-glass), ZERO bordure permanente, lift + halo au survol.
 * 3 colonnes desktop, empilees en mobile. FR/EN/ES.
 *
 * Toutes les images sont des micro/petits thumbs LAZY : les cartes sont
 * sous le pli (revelees au scroll apres le rideau), elles ne doivent PAS
 * devenir le LCP. Le preload LCP de la home est gere dans Home.jsx.
 */

// eventail compact de la carte Stickers (3 designs forts, stroke via CSS).
const STICKER_FAN = ['massive-dj-skull', 'massive-chameleon', 'massive-alien-hot']
const MINI = '/images/thumbs-mini/stickers-massive'

// carte Mini Massive : petit sticker + prenom exemple dans une pastille.
const ETI_DESIGN = 'massive-panda-cute'
const ETI_NAME = 'Léa'

function Card({ children, to, title, desc, cta }) {
  return (
    <Link
      to={to}
      className="surface-vitrine card-shadow rounded-3xl p-5 sm:p-6 flex flex-col group transition-all duration-200 hover:-translate-y-1"
    >
      <div className="h-32 flex items-center justify-center mb-4">{children}</div>
      <h3 className="font-heading font-bold text-heading text-lg mb-1.5">{title}</h3>
      <p className="text-grey-light text-sm leading-snug mb-4 flex-1">{desc}</p>
      <span className="inline-flex items-center gap-1.5 text-accent font-semibold text-sm">
        {cta}
        <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}

export default function HomeProductCards({ artworks = [] }) {
  const { tx } = useLang()
  const artwork = artworks.find((a) => a?.image) || null
  const artworkSrc = artwork ? (mediaUrl(artwork.image, null) || thumb(artwork.image)) : null

  return (
    <section className="section-container py-4">
      <div className="grid gap-4 sm:gap-5 sm:grid-cols-3 max-w-5xl mx-auto">
        {/* --- Stickers : eventail de 3 designs --- */}
        <Card
          to="/stickers"
          title={tx({ fr: 'Stickers', en: 'Stickers', es: 'Stickers' })}
          desc={tx({
            fr: '270 designs originaux dès 3 $, résistants à l’eau, imprimés à Montréal.',
            en: '270 original designs from $3, water resistant, printed in Montreal.',
            es: '270 diseños originales desde 3 $, resistentes al agua, impresos en Montreal.',
          })}
          cta={tx({ fr: 'Voir la collection', en: 'See the collection', es: 'Ver la colección' })}
        >
          <div className="relative w-full flex items-center justify-center">
            {STICKER_FAN.map((slug, i) => {
              const t = i - 1
              return (
                <img
                  key={slug}
                  src={`${MINI}/${slug}.webp`}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="sticker-stroke w-20 h-20 object-contain drop-shadow-lg"
                  style={{ transform: `translateX(${t * 34}px) rotate(${t * 8}deg)`, zIndex: 10 - Math.abs(t) }}
                />
              )
            })}
          </div>
        </Card>

        {/* --- Prints : une oeuvre encadree --- */}
        <Card
          to="/artistes"
          title={tx({ fr: 'Prints d’artistes', en: 'Artist prints', es: 'Prints de artistas' })}
          desc={tx({
            fr: 'Les œuvres d’artistes d’ici, en tirage fine art encadré.',
            en: 'Works by local artists, as framed fine art prints.',
            es: 'Obras de artistas locales, en impresión fine art enmarcada.',
          })}
          cta={tx({ fr: 'Découvrir les artistes', en: 'Meet the artists', es: 'Conocer los artistas' })}
        >
          {artworkSrc ? (
            <div className="bg-white p-1.5 shadow-xl rotate-[-2deg]" style={{ border: '3px solid #1a1a1a' }}>
              <img src={artworkSrc} alt="" aria-hidden="true" loading="lazy" decoding="async" className="h-24 w-auto object-cover" />
            </div>
          ) : (
            <div className="bg-white p-1.5 shadow-xl rotate-[-2deg] h-24 w-20" style={{ border: '3px solid #1a1a1a' }} />
          )}
        </Card>

        {/* --- Mini Massive : etiquette exemple (sticker + prenom) --- */}
        {ETIQUETTES_VISIBLE && (
          <Card
            to="/etiquettes"
            title="Mini Massive"
            desc={tx({
              fr: 'Étiquettes personnalisées pour enfants : son design, son nom.',
              en: 'Custom name labels for kids: their design, their name.',
              es: 'Etiquetas personalizadas para niños: su diseño, su nombre.',
            })}
            cta={tx({ fr: 'Créer une étiquette', en: 'Create a label', es: 'Crear una etiqueta' })}
          >
            <div
              className="flex items-center gap-2 rounded-full pl-2 pr-4 py-1.5 rotate-[-3deg] shadow-xl"
              style={{ background: '#d4d3d7', border: '3px solid #3b3849' }}
            >
              <img src={`${MINI}/${ETI_DESIGN}.webp`} alt="" aria-hidden="true" loading="lazy" decoding="async" className="w-11 h-11 object-contain shrink-0" />
              <span className="font-heading font-bold text-2xl" style={{ color: '#20202d' }}>{ETI_NAME}</span>
            </div>
          </Card>
        )}
      </div>
    </section>
  )
}
