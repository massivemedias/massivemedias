import { Link } from 'react-router-dom'
import { useLang } from '../i18n/LanguageContext'
import TumblerDesign from './TumblerDesign'

/**
 * HOME-04 (#) : section editoriale "magazine" unique de la home, stickers ET
 * prints d'artistes MELANGES. Composition asymetrique (colonne texte a gauche +
 * collage dense a droite : dominant + satellites, chevauchements, rotations
 * subtiles, typo d'appoint), PAS une grille. Remplace HomePrintsSection + le
 * teaser services + la grille d'oeuvres, absorbes ici.
 *
 * Contenu pilote par la constante MAGAZINE : Mika change les vedettes ici, zero
 * dev. Desktop : collage absolu. Mobile : 2 colonnes organiques, chevauchements
 * reduits mais pas disparus. Lazy strict sur toutes les images (la home protege
 * son LCP = mockup gourde du rideau, precharge par HOME-PERF-01b, inchange).
 */

// Vedettes (rotation possible : editer cette constante).
const MAGAZINE = {
  gourdeDesign: 'massive-adian-fumeuse',                 // design pose sur la gourde
  framed: '/images/prints/Adrift1.webp',                 // print encadre (oeuvre AdriftVision)
  raw: '/images/prints/Adrift11.webp',                   // oeuvre brute
  stickers: ['massive-racoon', 'massive-dj-skull', 'massive-alien-hot', 'massive-biker'],
}
const st = (slug) => `/images/stickers-massive/${slug}.webp`

// ---- briques reutilisables -------------------------------------------------

function Sticker({ slug, className = '', style }) {
  return (
    <Link to="/stickers" className={`block group ${className}`} style={style} aria-label="Voir la collection de stickers">
      <img
        src={st(slug)}
        alt=""
        loading="lazy"
        className="sticker-stroke w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
      />
    </Link>
  )
}

function Framed({ src, to = '/artistes', className = '', style, label }) {
  // Print encadre : passe-partout blanc + fine bordure + ombre portee = "accroche au mur".
  return (
    <Link to={to} className={`block group ${className}`} style={style} aria-label={label || 'Voir les prints d\'artistes'}>
      <div className="bg-white p-[6%] rounded-[3px] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)] ring-1 ring-black/10 transition-transform duration-300 group-hover:-translate-y-1">
        <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
      </div>
    </Link>
  )
}

function RawArt({ src, to = '/artistes', className = '', style, label }) {
  return (
    <Link to={to} className={`block group overflow-hidden rounded-sm ${className}`} style={style} aria-label={label || 'Voir les prints d\'artistes'}>
      <img src={src} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 shadow-[0_16px_40px_rgba(0,0,0,0.5)]" />
    </Link>
  )
}

function Gourde({ rotate = -4, className = '', style }) {
  return (
    <Link to="/stickers" className={`block group ${className}`} style={style} aria-label="Stickers sur ta gourde">
      <div className="relative h-full flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-1">
        <img src="/images/mugs/tumbler-white.webp" alt="" loading="lazy" className="h-full object-contain drop-shadow-[0_20px_44px_rgba(0,0,0,0.55)]" />
        <TumblerDesign design={st(MAGAZINE.gourdeDesign)} rotate={rotate} />
      </div>
    </Link>
  )
}

export default function MagazineSection() {
  const { tx } = useLang()

  const eyebrow = tx({ fr: 'En vrac', en: 'The mix', es: 'A granel' })
  const explore = tx({ fr: 'Explorer', en: 'Explore', es: 'Explorar' })
  const captionText = tx({
    fr: 'Vinyle découpé, tirages fine art, une gourde qui traîne. Ce qu\'on colle, ce qu\'on encadre.',
    en: 'Die-cut vinyl, fine art prints, a bottle lying around. What we stick, what we frame.',
    es: 'Vinilo troquelado, impresiones fine art, una botella por ahí. Lo que pegamos, lo que enmarcamos.',
  })
  const Heading = (
    <h2 className="font-heading font-black text-heading leading-[0.95] text-4xl sm:text-5xl md:text-6xl">
      {tx({ fr: 'Stickers & prints,', en: 'Stickers & prints,', es: 'Stickers & prints,' })}<br />
      <span className="text-gradient">{tx({ fr: 'faits à Montréal.', en: 'made in Montreal.', es: 'hechos en Montreal.' })}</span>
    </h2>
  )

  return (
    <section className="section-container py-16 md:py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* DESKTOP : colonne texte gauche + collage dense a droite (spread magazine) */}
        <div className="hidden md:grid grid-cols-[35%_1fr] gap-8 items-center">
          {/* colonne texte */}
          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-accent mb-3">{eyebrow}</p>
            {Heading}
            <p className="text-sm text-grey-light max-w-xs leading-relaxed mt-7">{captionText}</p>
            <Link to="/stickers" className="btn-primary justify-center mt-7 inline-flex">{explore}</Link>
            <span className="absolute right-0 -bottom-16 font-heading font-black text-[92px] leading-none text-white/[0.05] select-none pointer-events-none">01</span>
          </div>

          {/* collage : cadre + gourde (agrandie) + oeuvre brute + 4 stickers, chevauches/tournes */}
          <div className="relative h-[560px]">
            <span className="absolute right-[2%] top-[-5%] -rotate-90 origin-right text-[12px] font-bold uppercase tracking-[0.45em] text-accent/40 select-none pointer-events-none">Atelier</span>
            <Framed src={MAGAZINE.framed} className="absolute left-[3%] top-[5%] w-[260px] z-10" style={{ transform: 'rotate(-2deg)' }} label="Prints" />
            <Gourde rotate={-4} className="absolute left-[33%] top-[22%] h-[360px] z-20" />
            <RawArt src={MAGAZINE.raw} className="absolute left-[1%] bottom-[0%] w-[184px] h-[210px] z-0" style={{ transform: 'rotate(-3deg)' }} />
            <Sticker slug={MAGAZINE.stickers[1]} className="absolute left-[18%] top-[-3%] w-[112px] z-30" style={{ transform: 'rotate(-9deg)' }} />
            <Sticker slug={MAGAZINE.stickers[0]} className="absolute right-[3%] top-[3%] w-[152px] z-30" style={{ transform: 'rotate(9deg)' }} />
            <Sticker slug={MAGAZINE.stickers[2]} className="absolute right-[1%] top-[46%] w-[160px] z-20" style={{ transform: 'rotate(5deg)' }} />
            <Sticker slug={MAGAZINE.stickers[3]} className="absolute right-[27%] bottom-[0%] w-[130px] z-30" style={{ transform: 'rotate(-6deg)' }} />
          </div>
        </div>

        {/* MOBILE : en-tete + 2 colonnes organiques, chevauchements reduits */}
        <div className="md:hidden">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-accent mb-3">{eyebrow}</p>
          {Heading}
          <div className="mt-6 grid grid-cols-2 gap-3 items-start">
            <Framed src={MAGAZINE.framed} className="col-span-1 mt-4" style={{ transform: 'rotate(-2deg)' }} label="Prints" />
            <div className="flex flex-col gap-3">
              <Sticker slug={MAGAZINE.stickers[0]} className="w-[66%] ml-auto" style={{ transform: 'rotate(7deg)' }} />
              <Gourde rotate={-4} className="h-[210px] -mt-4" />
            </div>
            <RawArt src={MAGAZINE.raw} className="h-[150px] -mt-2" style={{ transform: 'rotate(-2deg)' }} />
            <div className="flex items-start gap-2 -mt-1">
              <Sticker slug={MAGAZINE.stickers[1]} className="w-[46%]" style={{ transform: 'rotate(-6deg)' }} />
              <Sticker slug={MAGAZINE.stickers[3]} className="w-[46%] mt-6" style={{ transform: 'rotate(5deg)' }} />
            </div>
          </div>
          <div className="mt-7 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-grey-light max-w-xs leading-relaxed">{captionText}</p>
            <Link to="/stickers" className="btn-primary justify-center">{explore}</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
