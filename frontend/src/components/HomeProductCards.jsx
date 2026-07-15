import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { ETIQUETTES_VISIBLE } from '../config/etiquettesStatus'

/**
 * HOME-CARTES (15 juillet 2026) : 3 cartes produits (Stickers / Prints / Mini
 * Massive) au pattern etabli (surface-vitrine, ZERO bordure permanente, lift +
 * ombre au survol 200ms). STRUCTURE IDENTIQUE sur les 3 : zone image 4:3 en
 * haut + titre + texte 1 ligne + CTA ; hauteurs egales (flex, CTA en bas).
 * VRAIS visuels produit (aucun placeholder) :
 *   - Stickers : eventail de 3 designs.
 *   - Prints   : une oeuvre d'artiste dans un CADRE (CSS : passe-partout blanc +
 *     bordure epaisse + ombre portee), legerement inclinee -> "print encadre".
 *   - Mini Massive : l'etiquette panda EN SITUATION (mockup boite a lunch).
 * 3 colonnes desktop, empilees mobile. Images LAZY (sous le pli). FR/EN/ES.
 */

const STICKER_FAN = ['massive-dj-skull', 'massive-chameleon', 'massive-alien-hot']
const MINI = '/images/thumbs-mini/stickers-massive'
// oeuvre vedette de la carte Prints (swappable). Thumb leger dedie.
const PRINT_CARD = '/images/home/print-card.webp'
// etiquette en situation (panda sur boite a lunch, deja composee).
const ETI_MOCKUP = '/images/etiquettes/mockup-lunchbox.webp'

function Card({ to, title, desc, cta, zoneClass = '', children }) {
  return (
    <Link
      to={to}
      className="surface-vitrine card-shadow rounded-3xl overflow-hidden flex flex-col group transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className={`aspect-[4/3] w-full overflow-hidden relative flex items-center justify-center ${zoneClass}`}>
        {children}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="section-title-sm text-heading text-lg mb-1.5">{title}</h3>
        <p className="text-grey-light text-sm leading-snug mb-3 flex-1">{desc}</p>
        <span className="inline-flex items-center gap-1.5 text-accent font-semibold text-sm">
          {cta}
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}

export default function HomeProductCards() {
  const { tx } = useLang()

  return (
    <section className="section-container py-4">
      <div className="grid gap-4 sm:gap-5 sm:grid-cols-3 max-w-5xl mx-auto items-stretch">
        {/* --- Stickers : eventail de 3 designs --- */}
        <Card
          to="/stickers"
          zoneClass="bg-black/10"
          title={tx({ fr: 'Stickers', en: 'Stickers', es: 'Stickers' })}
          desc={tx({
            fr: '270 designs originaux dès 3 $, résistants à l’eau, imprimés à Montréal.',
            en: '270 original designs from $3, water resistant, printed in Montreal.',
            es: '270 diseños originales desde 3 $, resistentes al agua, impresos en Montreal.',
          })}
          cta={tx({ fr: 'Voir la collection', en: 'See the collection', es: 'Ver la colección' })}
        >
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
                className="sticker-stroke absolute w-24 h-24 object-contain drop-shadow-xl"
                style={{ transform: `translateX(${t * 42}px) rotate(${t * 8}deg)`, zIndex: 10 - Math.abs(t) }}
              />
            )
          })}
        </Card>

        {/* --- Prints : oeuvre encadree, legerement inclinee --- */}
        <Card
          to="/artistes"
          zoneClass="bg-gradient-to-br from-white/5 to-black/15"
          title={tx({ fr: 'Prints d’artistes', en: 'Artist prints', es: 'Prints de artistas' })}
          desc={tx({
            fr: 'Les œuvres d’artistes d’ici, en tirage fine art encadré.',
            en: 'Works by local artists, as framed fine art prints.',
            es: 'Obras de artistas locales, en impresión fine art enmarcada.',
          })}
          cta={tx({ fr: 'Découvrir les artistes', en: 'Meet the artists', es: 'Conocer los artistas' })}
        >
          <div
            className="bg-white p-2 shadow-2xl"
            style={{ border: '5px solid #14141a', transform: 'rotate(-2deg)' }}
          >
            <img
              src={PRINT_CARD}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="h-36 w-28 object-cover object-top block"
            />
          </div>
        </Card>

        {/* --- Mini Massive : etiquette EN SITUATION (boite a lunch) --- */}
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
            <img
              src={ETI_MOCKUP}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          </Card>
        )}
      </div>
    </section>
  )
}
