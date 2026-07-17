import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import { ArrowRight, Instagram } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { useArtists } from '../hooks/useArtists'
import { MASSIVE_STICKERS } from '../data/massiveStickers'
import { KIDS_SAFE } from '../data/etiquettes'
import { getInstagramPosts } from '../services/instagramService'
import TumblerDesign from './TumblerDesign'

/**
 * HOME-05 : la section magazine devient un VRAI magazine editorial qu'on
 * DECOUVRE au scroll. Trois "tranches" a la hierarchie claire (titre + 2-3
 * lignes + lien), apparitions douces (reduced-motion respecte), et un CONTENU
 * ALEATOIRE a chaque visite (comme la grille /stickers). Deux variantes de
 * composition (prop `variant` A|B) pour le choix Mika.
 *
 * ALEATOIRE prerender-stable : etat initial DETERMINISTE (premiers du pool) rendu
 * au prerender, puis shuffle client APRES mount (useEffect) - meme lecon que la
 * grille 270. La gourde porte un design surprise (comme le sticker vedette du
 * hero /stickers). Les oeuvres viennent du CMS (useArtists) ; fallback local si
 * le CMS n'a pas encore repondu (et pour la maquette hors-ligne).
 *
 * PERF : tout en lazy, le LCP de la home (image hero prechargee) est inchange.
 */

const STICKER_DIR = '/images/stickers-massive'
const st = (slug) => `${STICKER_DIR}/${slug}.webp`
const stThumb = (slug) => `/images/thumbs/stickers-massive/${slug}.webp`

// Oeuvres de secours (varie, 6 artistes) : sert quand le CMS n'a pas repondu
// et pour la maquette locale (CORS). En prod le pool vient de useArtists().
const LOCAL_ARTWORKS = [
  '/images/artists/psyqu33n/posters-trimmed/Psyqu33n1.webp',
  '/images/artists/psyqu33n/posters-trimmed/Psyqu33n10.webp',
  '/images/artists/mok/posters-trimmed/Mok-A-flot.webp',
  '/images/artists/cornelia-rose/posters-trimmed/CorneliaRose1.webp',
  '/images/artists/cornelia-rose/posters-trimmed/CorneliaRose10.webp',
  '/images/artists/no-pixl/posters-trimmed/NoPixl1.webp',
  '/images/artists/gallium/posters-trimmed/dancing-warrior-16x20.webp',
  '/images/artists/eric-sanchez/posters-trimmed/EricSanchez-001.webp',
]

const IG_URL = 'https://www.instagram.com/massivemedias/'

// IG-FEED (juillet) : le vrai feed Instagram est synchronise cote BACKEND
// (Instagram Graph API, cron 6h) et lu via getInstagramPosts() -> NOTRE cache,
// jamais Meta cote client (zero cookie tiers, Loi 25 clean ; images proxifiees).
//
// IG_FALLBACK sert DEUX roles : (1) en Phase 1, tant que le token Meta n'est pas
// branche, la section rend ces posts de TEST ; (2) filet permanent si l'API
// tombe -> la section n'est JAMAIS vide. Images = oeuvres locales (aucun appel
// Meta). Les vraies legendes/dates/liens arrivent du backend en Phase 2.
// Une legende IG est UNE chaine (pas de traduction) : c'est du contenu social.
const IG_FALLBACK = [
  { thumbUrl: LOCAL_ARTWORKS[0], caption: 'Nouveau drop de stickers die-cut, imprimés au Plateau 🎨', postedAt: '2026-07-14T15:00:00Z', permalink: IG_URL },
  { thumbUrl: LOCAL_ARTWORKS[2], caption: 'Dans l\'atelier : découpe en direct des dernières commandes.', postedAt: '2026-07-10T18:30:00Z', permalink: IG_URL },
  { thumbUrl: LOCAL_ARTWORKS[5], caption: 'Prints fine art sur papier coton, édition limitée.', postedAt: '2026-07-05T12:00:00Z', permalink: IG_URL },
  { thumbUrl: LOCAL_ARTWORKS[7], caption: 'Collab avec un artiste local ce mois-ci. Restez à l\'affût !', postedAt: '2026-06-28T20:00:00Z', permalink: IG_URL },
]

// Date lisible selon la langue (les legendes, elles, restent dans la langue du post).
function fmtIgDate(iso, lang) {
  try {
    const loc = lang === 'en' ? 'en-CA' : lang === 'es' ? 'es-ES' : 'fr-CA'
    return new Date(iso).toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return '' }
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }
  return a
}

// Reveal doux au scroll, reduced-motion respecte. IntersectionObserver + CSS
// transition (PAS whileInView/rAF) : robuste meme si l'animation ne tourne pas
// (onglet en arriere-plan -> rAF throttle) - un fallback timeout montre le
// contenu quoi qu'il arrive. La LISIBILITE ne depend jamais de l'animation.
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (reduce) { setShown(true); return }
    const el = ref.current
    if (!el) return
    const fallback = setTimeout(() => setShown(true), 1200) // filet : visible meme sans intersection
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setShown(true); io.disconnect(); clearTimeout(fallback) }
    }, { rootMargin: '-70px 0px' })
    io.observe(el)
    return () => { io.disconnect(); clearTimeout(fallback) }
  }, [reduce])
  return (
    <div
      ref={ref}
      className={`transition-all duration-[600ms] ease-out ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-7'} ${className}`}
      style={{ transitionDelay: shown ? `${delay}s` : '0s' }}
    >{children}</div>
  )
}

function Kicker({ children }) {
  return <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-accent mb-3">{children}</p>
}

// Sticker geant "langage hero /stickers" : stroke + rotation, dominant.
function GiantSticker({ slug, rotate = -4, className = '' }) {
  return (
    <Link to="/stickers" className={`block group ${className}`} aria-label="Voir la collection de stickers">
      {/* thumb PROPRE (400, non filigrane) : affiche a ~300px = trop petit pour
          reimprimer, donc pas besoin du filigrane 800 -> home 100% sans le
          "MASSIVE" fantome. Le filigrane reste sur la vue produit/lightbox. */}
      <img
        src={stThumb(slug)} alt="" loading="lazy"
        className="sticker-stroke w-full h-full object-contain transition-transform duration-500 group-hover:-translate-y-2 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        style={{ transform: `rotate(${rotate}deg)` }}
      />
    </Link>
  )
}

function FloatSticker({ slug, className = '', style }) {
  return (
    <Link to="/stickers" className={`block group ${className}`} style={style} aria-label="Voir la collection de stickers">
      <img src={stThumb(slug)} alt="" loading="lazy"
        className="sticker-stroke w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)]" />
    </Link>
  )
}

function Artwork({ src, framed = false, className = '', style }) {
  if (framed) {
    return (
      <Link to="/artistes" className={`block group ${className}`} style={style} aria-label="Voir les prints d'artistes">
        <div className="bg-white p-[6%] rounded-[3px] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)] ring-1 ring-black/10 transition-transform duration-300 group-hover:-translate-y-1">
          <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
        </div>
      </Link>
    )
  }
  return (
    <Link to="/artistes" className={`block group overflow-hidden rounded-sm ${className}`} style={style} aria-label="Voir les prints d'artistes">
      <img src={src} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 shadow-[0_16px_40px_rgba(0,0,0,0.5)]" />
    </Link>
  )
}

function Gourde({ design, rotate = -4, className = '' }) {
  return (
    <Link to="/stickers" className={`block group ${className}`} aria-label="Stickers sur ta gourde">
      <div className="relative h-full flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-1">
        <img src="/images/mugs/tumbler-white.webp" alt="" loading="lazy" className="h-full object-contain drop-shadow-[0_20px_44px_rgba(0,0,0,0.55)]" />
        {design && <TumblerDesign design={st(design)} rotate={rotate} />}
      </div>
    </Link>
  )
}

// ---- hook contenu aleatoire (shuffle apres mount, prerender-stable) ---------

function useMagazineContent() {
  const { artists } = useArtists()
  // pool d'oeuvres CMS (aplati) sinon fallback local.
  const artworkPool = useMemo(() => {
    const cms = []
    Object.values(artists || {}).forEach((a) => (a?.prints || []).forEach((p) => { if (p?.image) cms.push(p.image) }))
    return cms.length >= 4 ? cms : LOCAL_ARTWORKS
  }, [artists])
  // Pool restreint a la curation KIDS_SAFE (deja validee par Mika) : le sticker
  // hero du magazine est tire au sort, il ne doit JAMAIS tomber sur un design
  // NSFW/pin-up sur la page d'accueil grand public. Intersection avec le
  // catalogue reel -> uniquement des slugs valides ET surs.
  const stickerPool = useMemo(() => {
    const safe = new Set(KIDS_SAFE)
    const inter = MASSIVE_STICKERS.map((s) => s.slug).filter((slug) => safe.has(slug))
    return inter.length ? inter : MASSIVE_STICKERS.map((s) => s.slug)
  }, [])

  // Etat DETERMINISTE au prerender (premiers), shuffle client apres mount.
  const [picks, setPicks] = useState(() => ({
    stickers: stickerPool.slice(0, 8),
    artworks: artworkPool.slice(0, 4),
    gourde: stickerPool[0],
  }))
  useEffect(() => {
    setPicks({
      stickers: shuffle(stickerPool).slice(0, 8),
      artworks: shuffle(artworkPool).slice(0, 4),
      gourde: shuffle(stickerPool)[0],
    })
  }, [stickerPool, artworkPool])
  return picks
}

// ---- textes editoriaux (i18n) ----------------------------------------------

function useTranches(tx) {
  return {
    t1: {
      kicker: tx({ fr: 'Ce qu\'on fait', en: 'What we do', es: 'Lo que hacemos' }),
      title: tx({ fr: 'On dessine, on imprime, tu colles.', en: 'We design, we print, you stick.', es: 'Diseñamos, imprimimos, tú pegas.' }),
      body: tx({
        fr: `${MASSIVE_STICKERS.length} designs originaux en vinyle découpé à la main, et les tirages fine art de nos artistes. Tout est imprimé ici, à Montréal.`,
        en: `${MASSIVE_STICKERS.length} original designs in hand-cut vinyl, plus fine art prints from our artists. All printed right here in Montreal.`,
        es: `${MASSIVE_STICKERS.length} diseños originales en vinilo cortado a mano, más impresiones fine art de nuestros artistas. Todo impreso aquí, en Montreal.`,
      }),
    },
    t2: {
      kicker: tx({ fr: 'Comment ça marche', en: 'How it works', es: 'Cómo funciona' }),
      title: tx({ fr: 'Trois étapes, pas plus.', en: 'Three steps, no more.', es: 'Tres pasos, no más.' }),
      steps: [
        { n: '1', t: tx({ fr: 'Tu choisis', en: 'You pick', es: 'Eliges' }), d: tx({ fr: `Parmi ${MASSIVE_STICKERS.length} designs, ou tu envoies les tiens.`, en: `From ${MASSIVE_STICKERS.length} designs, or send your own.`, es: `Entre ${MASSIVE_STICKERS.length} diseños, o envías los tuyos.` }) },
        { n: '2', t: tx({ fr: 'On imprime au Plateau', en: 'We print in the Plateau', es: 'Imprimimos en el Plateau' }), d: tx({ fr: 'Vinyle die-cut résistant eau et UV, ou fine art sur papier coton.', en: 'Die-cut vinyl, water & UV proof, or fine art on cotton paper.', es: 'Vinilo die-cut resistente al agua y UV, o fine art en papel de algodón.' }) },
        { n: '3', t: tx({ fr: 'Tu reçois ou tu ramasses', en: 'You get it or grab it', es: 'Recibes o recoges' }), d: tx({ fr: 'Livraison partout au Québec, ou cueillette à Montréal.', en: 'Shipping across Quebec, or pickup in Montreal.', es: 'Envío por todo Quebec, o recogida en Montreal.' }) },
      ],
    },
    t3: {
      kicker: tx({ fr: 'Nouveautés', en: 'What\'s new', es: 'Novedades' }),
      title: tx({ fr: 'Les derniers arrivés.', en: 'Fresh off the press.', es: 'Recién salidos.' }),
      body: tx({ fr: 'De nouveaux designs chaque mois. Suis-nous pour ne rien manquer.', en: 'New designs every month. Follow us so you don\'t miss a thing.', es: 'Nuevos diseños cada mes. Síguenos para no perderte nada.' }),
    },
  }
}

// ---- boutons liens partages ------------------------------------------------

function LinkRow({ tx }) {
  return (
    <div className="flex flex-wrap gap-3 mt-6">
      <Link to="/stickers" className="btn-primary justify-center">{tx({ fr: 'Voir les stickers', en: 'See the stickers', es: 'Ver los stickers' })}</Link>
      <Link to="/artistes" className="btn-outline justify-center">{tx({ fr: 'Voir les prints', en: 'See the prints', es: 'Ver los prints' })}</Link>
    </div>
  )
}

// IG-FEED : bloc news editorial. Vignette du post a gauche, legende extraite +
// date + lien a droite (style "bloc de news"). Lit NOTRE cache backend
// (getInstagramPosts), jamais Meta. Prerender = IG_FALLBACK (deterministe),
// puis hydratation client avec les vrais posts s'ils existent. JAMAIS vide :
// si l'API ne renvoie rien, on garde le fallback.
function InstagramNews({ tx }) {
  const { lang } = useLang()
  const [posts, setPosts] = useState(null) // null = pas encore charge -> rend le fallback au prerender
  useEffect(() => {
    let alive = true
    getInstagramPosts(4).then((p) => { if (alive && p.length) setPosts(p) })
    return () => { alive = false }
  }, [])
  const items = (posts && posts.length ? posts : IG_FALLBACK).slice(0, 4)
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {items.map((p, i) => (
        <Reveal key={p.igId || i} delay={i * 0.06}>
          <a
            href={p.permalink || IG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex gap-4 p-3 rounded-2xl surface-vitrine transition-transform duration-300 hover:-translate-y-0.5"
          >
            <div className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden ring-1 ring-white/10">
              <img src={p.thumbUrl} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <span className="absolute top-1.5 right-1.5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"><Instagram size={14} /></span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-heading text-sm leading-snug line-clamp-3">
                {p.caption || tx({ fr: 'Voir sur Instagram', en: 'See on Instagram', es: 'Ver en Instagram' })}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs">
                {p.postedAt && <span className="text-grey-muted">{fmtIgDate(p.postedAt, lang)}</span>}
                <span className="inline-flex items-center gap-1 text-accent font-semibold group-hover:brightness-110">
                  {tx({ fr: 'Voir le post', en: 'View post', es: 'Ver publicación' })} <ArrowRight size={13} />
                </span>
              </div>
            </div>
          </a>
        </Reveal>
      ))}
    </div>
  )
}

// ---- Le magazine editorial : collage vivant (composition retenue par Mika),
//      sticker geant qui deborde, 3 tranches decouvertes au scroll ------------

function Magazine({ tx, picks }) {
  const T = useTranches(tx)
  return (
    <section className="section-container py-16 md:py-24 overflow-hidden space-y-20 md:space-y-28">
      {/* Tranche 1 : sticker geant dominant qui deborde + texte + collage */}
      <div className="relative">
        <div className="grid md:grid-cols-[1.1fr_1fr] gap-8 items-center">
          {/* CHANTIER "calme le sticker geant" (Mika) : fini le collage qui
              debordait et se chevauchait. UN seul sticker, CONTENU dans sa
              colonne, centre, zero chevauchement a tout breakpoint (375/768/
              1440). Plus d'absolute, plus de bleed negatif. */}
          <Reveal delay={0.1} className="relative h-[260px] md:h-[400px] order-2 md:order-1 flex items-center justify-center">
            <GiantSticker slug={picks.stickers[0]} rotate={-4} className="w-[66%] max-w-[300px] h-full" />
          </Reveal>
          <Reveal className="order-1 md:order-2">
            <Kicker>{T.t1.kicker}</Kicker>
            <h2 className="section-title-lg text-heading">{T.t1.title}</h2>
            <p className="text-base text-grey-light leading-relaxed mt-5 max-w-md">{T.t1.body}</p>
            <LinkRow tx={tx} />
          </Reveal>
        </div>
      </div>

      {/* Tranche 2 : comment ca marche = TIMELINE (cercles numerotes relies).
          Desktop : 3 colonnes egales, cercles relies par une ligne horizontale.
          Mobile : timeline verticale, ligne a gauche, etapes empilees. AUCUNE
          image (fini le chevauchement). */}
      <div>
        <Reveal className="mb-10">
          <Kicker>{T.t2.kicker}</Kicker>
          <h3 className="section-title-lg text-heading">{T.t2.title}</h3>
        </Reveal>
        <div className="relative">
          {/* ligne horizontale desktop (derriere les cercles, a hauteur de leur centre) */}
          <div className="hidden sm:block absolute top-7 left-[16.6%] right-[16.6%] h-0.5 bg-white/15" aria-hidden="true" />
          <div className="grid gap-8 sm:grid-cols-3">
            {T.t2.steps.map((s, i) => (
              <Reveal key={i} delay={i * 0.12} className="relative flex sm:flex-col items-start sm:items-center sm:text-center gap-4">
                {/* ligne verticale mobile entre les etapes */}
                {i < T.t2.steps.length - 1 && (
                  <div className="sm:hidden absolute left-7 top-16 -bottom-8 w-0.5 bg-white/15" aria-hidden="true" />
                )}
                <span className="relative z-10 w-14 h-14 shrink-0 rounded-full bg-accent text-white font-heading font-black text-xl grid place-items-center shadow-lg">{s.n}</span>
                <div className="pt-1 sm:pt-3">
                  <h4 className="text-heading font-heading font-bold text-lg mb-1">{s.t}</h4>
                  <p className="text-sm text-grey-light leading-relaxed max-w-xs sm:mx-auto">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* Tranche 3 : nouveautes en cartes */}
      <div>
        <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <Kicker>{T.t3.kicker}</Kicker>
            <h3 className="section-title-lg text-heading">{T.t3.title}</h3>
            <p className="text-base text-grey-light leading-relaxed mt-3 max-w-lg">{T.t3.body}</p>
          </div>
          <a href="https://instagram.com/massivemedias" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-accent font-semibold hover:brightness-110">
            <Instagram size={18} /> @massivemedias <ArrowRight size={15} />
          </a>
        </Reveal>
        <Reveal delay={0.1}><InstagramNews tx={tx} /></Reveal>
      </div>
    </section>
  )
}

export default function MagazineSection() {
  const { tx } = useLang()
  const picks = useMagazineContent()
  // Composition retenue par Mika : "collage magazine" (sticker geant qui deborde).
  return <Magazine tx={tx} picks={picks} />
}
