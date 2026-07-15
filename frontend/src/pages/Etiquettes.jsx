import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Tag, Droplets, Sun, Shield, Scissors, WashingMachine, Truck,
  Pencil, NotebookPen, Box, Sparkles, ChevronDown,
} from 'lucide-react'
import SEO from '../components/SEO'
import { useLang } from '../i18n/LanguageContext'
import { MASSIVE_STICKERS } from '../data/massiveStickers'
import {
  KIDS_SAFE, ETIQUETTE_FORMATS, ETIQUETTE_PACKS, ETIQUETTE_FONTS,
  PAGE_NAME_OPTIONS, PAGE_NAME_CHOICE, ETIQUETTE_CLAIMS, ETIQUETTE_CLAIM_LAVE_VAISSELLE,
  formatDims, formatDimsShort, SAMPLE_NAMES,
} from '../data/etiquettes'
import { ETIQUETTES_PALETTES } from '../data/etiquettesPalettes'

/**
 * ETIQUETTES (Phase 1, 14 juillet 2026) : etiquettes d'identification
 * personnalisees pour enfants. UN sticker de la collection (curation KIDS_SAFE)
 * + un rectangle arrondi ASSORTI (combos de couleurs extraits du design au
 * build, lisibilite AA garantie - cf. scripts/generate-etiquettes-palettes.mjs)
 * portant le nom de l'enfant. L'ensemble = une etiquette die-cut Cameo.
 *
 * Page + configurateur SANS paiement (le pont panier arrive en Phase 2, le
 * lancement public en Phase 3 apres le test lave-vaisselle de Mika). Toute la
 * page vit derriere ETIQUETTES_VISIBLE (flag false + visible en dev).
 *
 * Reference fonctionnelle etudiee : le wizard "Kids Labels" de monimpression
 * (Nom -> Design -> Police, tailles bornees par scale). Notre difference : le
 * design est un VRAI sticker Massive et le cadre s'assortit tout seul.
 */

// Echelle d'apercu : ~5.4 px/mm (l'etiquette Grande 76mm tient dans ~410px).
const PX_PER_MM = 5.4

// Le nom lisible d'un design (depuis le catalogue principal).
const stickerBySlug = Object.fromEntries(MASSIVE_STICKERS.map((s) => [s.slug, s]))

/* --------------------------------------------------------------------------
 * L'APERCU LIVE : le rendu fidele de l'etiquette (sticker + cadre + nom).
 * Auto-fit PARFAIT : la taille de police est calculee par mesure canvas
 * (ctx.measureText) pour remplir la largeur disponible, bornee min/max, jamais
 * de debordement. Re-mesure a chaque frappe, changement de format, de police,
 * et une fois les webfonts chargees (document.fonts.ready).
 * ------------------------------------------------------------------------ */
function useAutoFit(text, fontFamily, fontWeight, maxWidthPx, maxHeightPx) {
  const [size, setSize] = useState(12)
  const [fontsReady, setFontsReady] = useState(false)
  useEffect(() => {
    let alive = true
    if (document.fonts?.ready) document.fonts.ready.then(() => { if (alive) setFontsReady(true) })
    else setFontsReady(true)
    return () => { alive = false }
  }, [])
  useEffect(() => {
    if (!text || maxWidthPx <= 0) return
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const probe = 100
    ctx.font = `${fontWeight} ${probe}px ${fontFamily}`
    const w = ctx.measureText(text).width || 1
    // taille qui remplit la largeur, plafonnee par la hauteur de ligne dispo
    const fit = Math.min((maxWidthPx / w) * probe, maxHeightPx)
    setSize(Math.max(7, Math.floor(fit)))
  }, [text, fontFamily, fontWeight, maxWidthPx, maxHeightPx, fontsReady])
  return size
}

function EtiquettePreview({ slug, combo, format, font, line1, line2, lang = 'fr', showDims = true }) {
  const wPx = format.w * PX_PER_MM
  const hPx = format.h * PX_PER_MM
  const radius = hPx / 2.6                     // border-radius genereux (die-cut)
  const stickerSide = hPx * 0.86               // le sticker occupe la hauteur
  const padX = hPx * 0.22
  const textZoneW = wPx - stickerSide - padX * 3
  const hasLine2 = Boolean(line2.trim())
  // hauteur allouee a chaque ligne (la ligne 2 est plus petite)
  const line1MaxH = hasLine2 ? hPx * 0.5 : hPx * 0.66
  const line2MaxH = hPx * 0.3

  const t1 = line1.trim() || SAMPLE_NAMES[lang] || SAMPLE_NAMES.fr
  const t2 = line2.trim()
  const size1 = useAutoFit(t1, font.family, font.weight, textZoneW, line1MaxH)
  const size2 = useAutoFit(t2 || ' ', font.family, font.weight, textZoneW, line2MaxH)

  return (
    <div className="flex flex-col items-center gap-2">
      {/* L'etiquette : le fond/stroke/texte viennent du combo auto-assorti. */}
      <div
        className="flex items-center"
        style={{
          width: wPx, height: hPx, borderRadius: radius,
          background: combo.bg,
          border: `${Math.max(2, hPx * 0.045)}px solid ${combo.stroke}`,
          paddingLeft: padX * 0.6, paddingRight: padX,
          boxShadow: '0 10px 26px rgba(0,0,0,0.28)',
        }}
      >
        <img
          src={`/images/thumbs-mini/stickers-massive/${slug}.webp`}
          alt=""
          aria-hidden="true"
          className="sticker-stroke object-contain shrink-0"
          style={{ width: stickerSide, height: stickerSide }}
        />
        <div className="flex-1 min-w-0 text-center leading-none" style={{ paddingLeft: padX * 0.5 }}>
          <div style={{ fontFamily: font.family, fontWeight: font.weight, fontSize: size1, color: combo.text, whiteSpace: 'nowrap' }}>
            {t1}
          </div>
          {hasLine2 && (
            <div style={{ fontFamily: font.family, fontWeight: font.weight, fontSize: size2, color: combo.text, whiteSpace: 'nowrap', opacity: 0.82, marginTop: hPx * 0.04 }}>
              {t2}
            </div>
          )}
        </div>
      </div>
      {showDims && (
        <p className="text-grey-muted text-[11px]">
          {formatDims(format, lang)}
        </p>
      )}
    </div>
  )
}


/**
 * Fleur de lys STYLISEE ORIGINALE (badge "Fabrique a Montreal").
 * DROITS : dessin original minimaliste - ni le logo officiel de la Ville de
 * Montreal, ni le drapeau/armoiries (marques protegees). Un lys generique
 * au trait rond, coherent avec lucide.
 */
function FleurDeLys({ className = '', fill = 'currentColor', style }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true">
      <path
        fill={fill}
        d="M12 2c1.5 2 2.4 3.8 2.4 5.6 0 1.5-.7 2.9-1.6 4h2.4c2 0 3.4-1.2 3.9-2.9.8 1 1.2 2.1 1.2 3.2 0 2.3-1.9 4-4.3 4h-1.9c.2 1.4 1 2.6 2.4 3.4-1 .5-2.1.7-3 .5-.4.9-.9 1.6-1.5 2.2-.6-.6-1.1-1.3-1.5-2.2-.9.2-2 0-3-.5 1.4-.8 2.2-2 2.4-3.4H8c-2.4 0-4.3-1.7-4.3-4 0-1.1.4-2.2 1.2-3.2.5 1.7 1.9 2.9 3.9 2.9h2.4c-.9-1.1-1.6-2.5-1.6-4C9.6 5.8 10.5 4 12 2Z"
      />
    </svg>
  )
}

/* --------------------------------------------------------------------------
 * LE CONFIGURATEUR : design -> nom (+ ligne 2) -> combo -> format -> police.
 * ------------------------------------------------------------------------ */
function ConfigurateurEtiquettes() {
  const { lang, tx } = useLang()
  const [slug, setSlug] = useState('massive-panda-cute')
  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [comboIdx, setComboIdx] = useState(0)
  const [formatId, setFormatId] = useState('moyenne')
  const [fontId, setFontId] = useState(ETIQUETTE_FONTS[0].id)
  const [showAll, setShowAll] = useState(false)

  const combos = ETIQUETTES_PALETTES[slug] || []
  const combo = combos[Math.min(comboIdx, combos.length - 1)] || { bg: '#fff', stroke: '#333', text: '#222' }
  const format = ETIQUETTE_FORMATS.find((f) => f.id === formatId)
  const font = ETIQUETTE_FONTS.find((f) => f.id === fontId)
  const designs = useMemo(() => (showAll ? KIDS_SAFE : KIDS_SAFE.slice(0, 24)), [showAll])

  return (
    <section id="configurateur" className="section-container scroll-mt-24">
      <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-2 text-center">
        {tx({ fr: 'Crée l’étiquette de ton enfant', en: 'Create your kid’s label', es: 'Crea la etiqueta de tu peque' })}
      </h2>
      <p className="text-grey-light text-center max-w-xl mx-auto mb-8">
        {tx({
          fr: 'Choisis un design, écris le nom : les couleurs s’assortissent toutes seules.',
          en: 'Pick a design, type the name: the colors match themselves.',
          es: 'Elige un diseño, escribe el nombre: los colores combinan solos.',
        })}
      </p>

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 max-w-5xl mx-auto items-start">
        {/* ---- gauche : l'apercu + les reglages texte ---- */}
        <div className="surface-vitrine card-shadow rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-center min-h-[150px] overflow-x-auto py-2">
            <EtiquettePreview slug={slug} combo={combo} format={format} font={font} line1={line1} line2={line2} lang={lang} />
          </div>

          {/* nom + ligne 2 */}
          <div className="mt-5 space-y-3">
            <input
              type="text"
              maxLength={22}
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              placeholder={tx({ fr: 'Prénom (ou prénom + nom)', en: 'First name (or full name)', es: 'Nombre (o nombre completo)' })}
              className="w-full rounded-xl bg-bg-elevated border border-white/10 px-4 py-3 text-heading text-base focus:border-accent/50 focus:outline-none"
              aria-label={tx({ fr: 'Nom sur l’étiquette', en: 'Name on the label', es: 'Nombre en la etiqueta' })}
            />
            <input
              type="text"
              maxLength={26}
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              placeholder={tx({ fr: 'Ligne 2 (optionnel : nom de famille, téléphone…)', en: 'Line 2 (optional: last name, phone…)', es: 'Línea 2 (opcional: apellido, teléfono…)' })}
              className="w-full rounded-xl bg-bg-elevated border border-white/10 px-4 py-2.5 text-heading text-sm focus:border-accent/50 focus:outline-none"
              aria-label={tx({ fr: 'Deuxième ligne', en: 'Second line', es: 'Segunda línea' })}
            />
          </div>

          {/* combos auto-assortis (2-3 par design, pas de picker libre) */}
          <div className="mt-5">
            <p className="text-grey-muted text-[11px] font-bold uppercase tracking-wider mb-2">
              {tx({ fr: 'Couleurs (assorties au design)', en: 'Colors (matched to the design)', es: 'Colores (a juego con el diseño)' })}
            </p>
            <div className="flex gap-2.5">
              {combos.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setComboIdx(i)}
                  aria-label={`Combo ${i + 1}`}
                  className={`w-12 h-9 rounded-lg transition-all ${comboIdx === i ? 'ring-2 ring-accent scale-105' : 'opacity-80 hover:opacity-100'}`}
                  style={{ background: c.bg, border: `3px solid ${c.stroke}` }}
                />
              ))}
            </div>
          </div>

          {/* police : les 3 candidates, rendues dans leur propre police */}
          <div className="mt-5">
            <p className="text-grey-muted text-[11px] font-bold uppercase tracking-wider mb-2">
              {tx({ fr: 'Police', en: 'Font', es: 'Tipografía' })}
            </p>
            <div className="flex flex-wrap gap-2">
              {ETIQUETTE_FONTS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFontId(f.id)}
                  className={`px-4 py-2 rounded-full text-sm transition-all border ${fontId === f.id ? 'border-accent text-accent bg-accent/10' : 'border-white/10 text-grey-light hover:border-white/25'}`}
                  style={{ fontFamily: f.family, fontWeight: f.weight }}
                >
                  {line1.trim() || f.label}
                </button>
              ))}
            </div>
          </div>

          {/* format */}
          <div className="mt-5">
            <p className="text-grey-muted text-[11px] font-bold uppercase tracking-wider mb-2">
              {tx({ fr: 'Format', en: 'Size', es: 'Formato' })}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {ETIQUETTE_FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormatId(f.id)}
                  className={`rounded-xl px-3 py-2.5 text-left border transition-all ${formatId === f.id ? 'border-accent bg-accent/10' : 'border-white/10 hover:border-white/25'}`}
                >
                  <span className={`block text-sm font-semibold ${formatId === f.id ? 'text-accent' : 'text-heading'}`}>{tx(f)}</span>
                  <span className="block text-grey-muted text-[11px]">{formatDimsShort(f, lang)}</span>
                </button>
              ))}
            </div>
            <p className="text-grey-muted text-xs mt-2">
              {tx({ fr: ETIQUETTE_FORMATS.find(f => f.id === formatId).usageFr, en: ETIQUETTE_FORMATS.find(f => f.id === formatId).usageEn, es: ETIQUETTE_FORMATS.find(f => f.id === formatId).usageEs })}
            </p>
          </div>
        </div>

        {/* ---- droite : la galerie des designs KIDS_SAFE ---- */}
        <div>
          <p className="text-grey-muted text-[11px] font-bold uppercase tracking-wider mb-2.5">
            {tx({ fr: 'Choisis ton design', en: 'Pick your design', es: 'Elige tu diseño' })} ({KIDS_SAFE.length})
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-2 max-h-[430px] overflow-y-auto pr-1">
            {designs.map((s) => {
              const st = stickerBySlug[s]
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setSlug(s); setComboIdx(0) }}
                  title={st ? st.fr : s}
                  className={`relative rounded-xl p-1.5 bg-glass-alt transition-all ${slug === s ? 'ring-2 ring-accent' : 'hover:brightness-110'}`}
                >
                  <img
                    src={`/images/thumbs-mini/stickers-massive/${s}.webp`}
                    alt={st ? st.fr : s}
                    loading="lazy"
                    decoding="async"
                    className="sticker-stroke w-full aspect-square object-contain"
                  />
                </button>
              )
            })}
          </div>
          {!showAll && KIDS_SAFE.length > 24 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-3 w-full py-2.5 rounded-full text-sm font-semibold text-grey-light border border-white/10 hover:border-white/25 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              {tx({ fr: `Voir les ${KIDS_SAFE.length} designs`, en: `See all ${KIDS_SAFE.length} designs`, es: `Ver los ${KIDS_SAFE.length} diseños` })}
              <ChevronDown size={15} />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------------------
 * LA PAGE : hero (pattern /stickers) + configurateur + packs + claims +
 * comment ca marche + FAQ. Tout FR/EN/ES, style du site.
 * ------------------------------------------------------------------------ */
export default function Etiquettes() {
  const { lang, tx } = useLang()
  const pageName = PAGE_NAME_OPTIONS[PAGE_NAME_CHOICE]
  const goConfig = () => document.getElementById('configurateur')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const claims = ETIQUETTE_CLAIMS.filter((c) => !c.pending || ETIQUETTE_CLAIM_LAVE_VAISSELLE)
  const claimIcons = { droplets: Droplets, sun: Sun, shield: Shield, scissors: Scissors, washing: WashingMachine, truck: Truck }
  const formatIcons = { mini: Pencil, moyenne: NotebookPen, grande: Box }

  return (
    <>
      <SEO
        title={tx({ fr: `${pageName.fr} | Massive`, en: `${pageName.en} | Massive`, es: `${pageName.es} | Massive` })}
        description={tx({
          fr: 'Étiquettes d’identification personnalisées pour enfants : un design de la collection Massive + le nom de ton enfant, couleurs assorties automatiquement. Résistantes à l’eau et aux UV, imprimées à Montréal.',
          en: 'Personalized kids name labels: a Massive collection design + your kid’s name, colors matched automatically. Water and UV resistant, printed in Montreal.',
          es: 'Etiquetas personalizadas para niños: un diseño de la colección Massive + el nombre de tu peque, colores a juego automáticos. Resistentes al agua y UV, impresas en Montreal.',
        })}
        breadcrumbs={[
          { name: tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' }), url: '/' },
          { name: tx(pageName) },
        ]}
      />

      {/* ============ HERO (pattern /stickers : aurora + vedette a droite) ==== */}
      <section className="relative py-4 overflow-hidden">
        <div className="section-container">
          <div className="relative overflow-hidden rounded-3xl px-6 sm:px-10 py-9 sm:py-11">
            <div className="absolute inset-0 hero-aurora" aria-hidden="true" />
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
              <div className="lg:flex-[1.3] w-full text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-3 text-sm">
                  <Link to="/" className="text-grey-muted hover:text-accent transition-colors">
                    {tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' })}
                  </Link>
                  <span className="text-grey-muted">/</span>
                  <span className="text-accent font-semibold">{tx(pageName)}</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-3">
                  <span className="p-2 rounded-lg icon-bg"><Tag size={24} className="text-accent" /></span>
                  <h1 className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl text-heading leading-[1.05]">
                    {tx(pageName)}
                  </h1>
                </div>
                <p className="text-base md:text-lg text-grey-light mb-5 max-w-xl mx-auto lg:mx-0">
                  {tx({
                    fr: 'Son design préféré, son nom, des couleurs qui s’assortissent toutes seules. Découpées à la forme et imprimées à Montréal, prêtes pour l’école et la garderie.',
                    en: 'Their favorite design, their name, colors that match themselves. Die-cut and printed in Montreal, ready for school and daycare.',
                    es: 'Su diseño favorito, su nombre, colores que combinan solos. Cortadas a medida e impresas en Montreal, listas para la escuela y la guardería.',
                  })}
                </p>
                <div className="flex justify-center lg:justify-start">
                  <button type="button" onClick={goConfig} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold text-sm hover:brightness-110 transition-all">
                    <Sparkles size={16} />
                    {tx({ fr: 'Créer mon étiquette', en: 'Create my label', es: 'Crear mi etiqueta' })}
                  </button>
                </div>
              </div>
              {/* vedette : une etiquette exemple, statique et fidele */}
              <div className="lg:flex-1 w-full flex items-center justify-center min-h-[150px]">
                <div style={{ transform: 'rotate(-3deg)' }}>
                  <EtiquettePreview
                    slug="massive-panda-cute"
                    combo={(ETIQUETTES_PALETTES['massive-panda-cute'] || [{ bg: '#fff', stroke: '#333', text: '#222' }])[1] || (ETIQUETTES_PALETTES['massive-panda-cute'] || [])[0]}
                    format={ETIQUETTE_FORMATS[1]}
                    font={ETIQUETTE_FONTS[0]}
                    line1={SAMPLE_NAMES[lang] || SAMPLE_NAMES.fr}
                    line2=""
                    lang={lang}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CLAIMS HONNETES ============ */}
      <section className="section-container py-2">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
          {claims.map((c, i) => {
            const Icon = claimIcons[c.icon] || Shield
            return (
              <span key={i} className="inline-flex items-center gap-2 text-sm text-grey-light">
                <Icon size={15} className="text-accent" />
                {tx(c)}
              </span>
            )
          })}
        </div>
      </section>

      {/* ============ CONFIGURATEUR ============ */}
      <ConfigurateurEtiquettes />

      {/* ============ PACKS ============ */}
      <section className="section-container">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-2 text-center">
          {tx({ fr: 'Les ensembles', en: 'The sets', es: 'Los packs' })}
        </h2>
        <p className="text-grey-light text-center max-w-xl mx-auto mb-8">
          {tx({
            fr: 'Un seul design, un seul nom, trois formats mélangés : tout ce qu’il faut pour la rentrée.',
            en: 'One design, one name, three mixed sizes: everything you need for back-to-school.',
            es: 'Un diseño, un nombre, tres formatos mezclados: todo para la vuelta al cole.',
          })}
        </p>
        <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {ETIQUETTE_PACKS.map((p) => (
            <div key={p.id} className={`surface-vitrine card-shadow rounded-2xl p-6 flex flex-col ${p.populaire ? 'ring-2 ring-accent' : ''}`}>
              {p.populaire && (
                <span className="self-start px-3 py-1 rounded-full bg-accent text-white text-[11px] font-bold uppercase tracking-wider mb-3">
                  {tx({ fr: 'Populaire', en: 'Popular', es: 'Popular' })}
                </span>
              )}
              <h3 className="font-heading font-bold text-xl text-heading">{tx(p)}</h3>
              <p className="text-grey-light text-sm mt-1 flex-1">{tx({ fr: p.dFr, en: p.dEn, es: p.dEs })}</p>
              <div className="mt-4 space-y-1 text-sm text-grey-light">
                <p>{p.contenu.mini} {tx({ fr: 'mini (crayons)', en: 'mini (pencils)', es: 'mini (lápices)' })}</p>
                <p>{p.contenu.moyenne} {tx({ fr: 'moyennes (cahiers, gourdes)', en: 'medium (notebooks, bottles)', es: 'medianas (cuadernos, botellas)' })}</p>
                <p>{p.contenu.grande} {tx({ fr: 'grandes (lunch, bacs)', en: 'large (lunch, bins)', es: 'grandes (lonchera, cajas)' })}</p>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-heading font-bold text-3xl text-accent">{p.price} $</span>
                <span className="text-grey-muted text-xs">{p.total} {tx({ fr: 'étiquettes', en: 'labels', es: 'etiquetas' })}</span>
              </div>
              <button type="button" onClick={goConfig} className="mt-4 w-full py-2.5 rounded-full bg-accent text-white text-sm font-semibold hover:brightness-110 transition-all">
                {tx({ fr: 'Personnaliser', en: 'Personalize', es: 'Personalizar' })}
              </button>
            </div>
          ))}
        </div>
        <p className="text-grey-muted text-xs text-center mt-4">
          {tx({
            fr: 'Phase 1 : prix proposés, paiement branché en Phase 2.',
            en: 'Phase 1: proposed prices, checkout wired in Phase 2.',
            es: 'Fase 1: precios propuestos, pago conectado en Fase 2.',
          })}
        </p>
      </section>

      {/* ============ COMMENT CA MARCHE ============ */}
      <section className="section-container">
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-heading mb-8 text-center">
          {tx({ fr: 'Comment ça marche', en: 'How it works', es: 'Cómo funciona' })}
        </h2>
        <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            { n: 1, fr: 'Choisis le design et écris le nom', en: 'Pick the design and type the name', es: 'Elige el diseño y escribe el nombre' },
            { n: 2, fr: 'On imprime et découpe à Montréal', en: 'We print and die-cut in Montreal', es: 'Imprimimos y cortamos en Montreal' },
            { n: 3, fr: 'Colle-les sur tout ce qui part à l’école', en: 'Stick them on everything school-bound', es: 'Pégalas en todo lo que va a la escuela' },
          ].map((s) => (
            <div key={s.n} className="bg-glass card-shadow rounded-2xl p-6 text-center">
              <span className="inline-flex w-9 h-9 rounded-full bg-accent text-white font-bold items-center justify-center mb-3">{s.n}</span>
              <p className="text-grey-light text-sm">{tx(s)}</p>
            </div>
          ))}
        </div>
      </section>


      {/* ============ EN SITUATION (mockups factices) ============
          Objets composes/reutilises (gourde + tasse du repo, crayon compose en
          CSS) avec l'etiquette posee dessus. La ligne sous la section leve toute
          ambiguite : Massive vend LES ETIQUETTES, pas les objets. */}
      <section className="section-container">
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-heading mb-8 text-center">
          {tx({ fr: 'En situation', en: 'In the wild', es: 'En situación' })}
        </h2>
        <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {/* gourde */}
          <div className="surface-vitrine card-shadow rounded-2xl h-56 relative overflow-hidden flex items-center justify-center">
            <img src="/images/mugs/tumbler-white.webp" alt="" aria-hidden="true" loading="lazy" decoding="async"
              className="h-[88%] w-auto object-contain drop-shadow-xl" />
            <div className="absolute" style={{ transform: 'translate(2%, 12%) rotate(-4deg) scale(0.52)' }}>
              <EtiquettePreview slug="massive-renard" combo={(ETIQUETTES_PALETTES['massive-renard'] || [])[0] || { bg: '#fff', stroke: '#333', text: '#222' }}
                format={ETIQUETTE_FORMATS[1]} font={ETIQUETTE_FONTS[0]} line1={SAMPLE_NAMES[lang]} line2="" lang={lang} showDims={false} />
            </div>
            <span className="absolute bottom-2.5 left-0 right-0 text-center text-grey-muted text-xs">
              {tx({ fr: 'Sur sa gourde', en: 'On their bottle', es: 'En su botella' })}
            </span>
          </div>
          {/* tasse / contenant */}
          <div className="surface-vitrine card-shadow rounded-2xl h-56 relative overflow-hidden flex items-center justify-center">
            <img src="/images/mugs/mug-white.webp" alt="" aria-hidden="true" loading="lazy" decoding="async"
              className="h-[74%] w-auto object-contain drop-shadow-xl" />
            <div className="absolute" style={{ transform: 'translate(-4%, 6%) rotate(3deg) scale(0.46)' }}>
              <EtiquettePreview slug="massive-alien-vert" combo={(ETIQUETTES_PALETTES['massive-alien-vert'] || [])[0] || { bg: '#fff', stroke: '#333', text: '#222' }}
                format={ETIQUETTE_FORMATS[1]} font={ETIQUETTE_FONTS[0]} line1={SAMPLE_NAMES[lang]} line2="" lang={lang} showDims={false} />
            </div>
            <span className="absolute bottom-2.5 left-0 right-0 text-center text-grey-muted text-xs">
              {tx({ fr: 'Sur son verre ou contenant', en: 'On their cup or container', es: 'En su vaso o envase' })}
            </span>
          </div>
          {/* crayon compose en CSS + etiquette MINI */}
          <div className="surface-vitrine card-shadow rounded-2xl h-56 relative overflow-hidden flex items-center justify-center">
            <div className="relative" style={{ transform: 'rotate(-18deg)' }}>
              {/* corps du crayon */}
              <div className="flex items-center">
                <div style={{ width: 14, height: 26, background: '#e8b7c2', borderRadius: '4px 0 0 4px' }} />
                <div style={{ width: 10, height: 26, background: '#c9cdd6' }} />
                <div style={{ width: 150, height: 26, background: 'linear-gradient(180deg, #f7c948 0 33%, #f0b429 33% 66%, #de911d 66%)' }} />
                <div style={{ width: 0, height: 0, borderTop: '13px solid transparent', borderBottom: '13px solid transparent', borderLeft: '26px solid #e8cfa2' }} />
                <div style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '11px solid #3b3540', marginLeft: -14 }} />
              </div>
              {/* etiquette MINI posee sur le corps */}
              <div className="absolute" style={{ left: 34, top: -22, transform: 'scale(0.5)', transformOrigin: 'left top' }}>
                <EtiquettePreview slug="massive-tortue" combo={(ETIQUETTES_PALETTES['massive-tortue'] || [])[0] || { bg: '#fff', stroke: '#333', text: '#222' }}
                  format={ETIQUETTE_FORMATS[0]} font={ETIQUETTE_FONTS[0]} line1={SAMPLE_NAMES[lang]} line2="" lang={lang} showDims={false} />
              </div>
            </div>
            <span className="absolute bottom-2.5 left-0 right-0 text-center text-grey-muted text-xs">
              {tx({ fr: 'Sur ses crayons (format mini)', en: 'On their pencils (mini size)', es: 'En sus lápices (formato mini)' })}
            </span>
          </div>
        </div>
        <p className="text-grey-muted text-xs text-center mt-4 max-w-xl mx-auto">
          {tx({
            fr: 'Les objets sont montrés à titre d’exemple seulement : Massive fournit les étiquettes, pas les gourdes, verres ou crayons.',
            en: 'Objects are shown as examples only: Massive supplies the labels, not the bottles, cups or pencils.',
            es: 'Los objetos se muestran solo como ejemplo: Massive suministra las etiquetas, no las botellas, vasos ni lápices.',
          })}
        </p>
      </section>

      {/* ============ BADGE FIERTE LOCALE (2 variantes, Mika tranche) ============
          DROITS : fleur de lys STYLISEE originale (SVG dessine ici), PAS le logo
          officiel de la Ville de Montreal ni les armoiries (marques protegees). */}
      <section className="section-container">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          {/* Variante A : sceau rond accent */}
          <div className="flex items-center gap-3 surface-vitrine card-shadow rounded-2xl px-5 py-4">
            <span className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shrink-0">
              <FleurDeLys className="w-6 h-6" fill="#ffffff" />
            </span>
            <div>
              <p className="text-heading font-heading font-bold text-sm leading-tight">
                {tx({ fr: 'Fièrement fabriqué à Montréal', en: 'Proudly made in Montreal', es: 'Hecho con orgullo en Montreal' })}
              </p>
              <p className="text-grey-muted text-xs">{tx({ fr: 'Variante A — sceau', en: 'Variant A — seal', es: 'Variante A — sello' })}</p>
            </div>
          </div>
          {/* Variante B : chip MTL */}
          <div className="flex items-center gap-3 surface-vitrine card-shadow rounded-2xl px-5 py-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/15">
              <FleurDeLys className="w-4 h-4" fill="currentColor" style={{ color: 'var(--accent-color)' }} />
              <span className="text-accent font-heading font-extrabold text-sm tracking-wide">MTL</span>
            </span>
            <div>
              <p className="text-heading font-heading font-bold text-sm leading-tight">
                {tx({ fr: 'Fabriqué à Montréal', en: 'Made in Montreal', es: 'Hecho en Montreal' })}
              </p>
              <p className="text-grey-muted text-xs">{tx({ fr: 'Variante B — chip MTL', en: 'Variant B — MTL chip', es: 'Variante B — chip MTL' })}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FORMATS EN DETAIL ============ */}
      <section className="section-container">
        <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {ETIQUETTE_FORMATS.map((f) => {
            const Icon = formatIcons[f.id] || Tag
            return (
              <div key={f.id} className="bg-glass card-shadow rounded-2xl p-5 flex items-start gap-3">
                <span className="p-2 rounded-lg icon-bg shrink-0"><Icon size={18} className="text-accent" /></span>
                <div>
                  <p className="text-heading font-semibold text-sm">{tx(f)} <span className="text-grey-muted font-normal">({formatDims(f, lang)})</span></p>
                  <p className="text-grey-muted text-xs mt-0.5">{tx({ fr: f.usageFr, en: f.usageEn, es: f.usageEs })}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ============ FAQ COURTE ============ */}
      <section className="section-container max-w-3xl mx-auto pb-16">
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-heading mb-6 text-center">FAQ</h2>
        <div className="space-y-3">
          {[
            {
              qFr: 'Elles résistent à quoi, exactement ?', qEn: 'What exactly do they resist?', qEs: '¿A qué resisten exactamente?',
              aFr: 'Eau et UV : c’est du vinyle laminé, le même que nos stickers de collection. On teste actuellement le lave-vaisselle et on ne promet rien avant d’avoir le résultat.',
              aEn: 'Water and UV: it’s laminated vinyl, the same as our collection stickers. We are currently testing the dishwasher and won’t promise anything before the results are in.',
              aEs: 'Agua y UV: es vinilo laminado, el mismo de nuestros stickers. Estamos probando el lavavajillas y no prometemos nada antes de tener resultados.',
            },
            {
              qFr: 'Je peux mettre le nom complet ?', qEn: 'Can I use the full name?', qEs: '¿Puedo poner el nombre completo?',
              aFr: 'Oui : prénom seul, prénom + nom, et même une 2e ligne (téléphone des parents, groupe). La taille du texte s’ajuste toute seule.',
              aEn: 'Yes: first name, full name, and even a 2nd line (parent phone, class). The text size adjusts itself.',
              aEs: 'Sí: nombre, nombre completo, e incluso una 2ª línea (teléfono, grupo). El tamaño se ajusta solo.',
            },
            {
              qFr: 'Pourquoi je ne choisis pas mes couleurs librement ?', qEn: 'Why can’t I pick any color?', qEs: '¿Por qué no elijo cualquier color?',
              aFr: 'Les combinaisons sont extraites du design que tu choisis : le cadre est toujours assorti et le nom toujours lisible. C’est le produit.',
              aEn: 'The combos are extracted from the design you pick: the frame always matches and the name is always readable. That’s the product.',
              aEs: 'Las combinaciones salen del diseño que eliges: el marco siempre combina y el nombre siempre se lee. Ese es el producto.',
            },
            {
              qFr: 'C’est imprimé où ?', qEn: 'Where is it printed?', qEs: '¿Dónde se imprime?',
              aFr: 'Dans notre atelier du Plateau Mont-Royal, à Montréal, comme tout le reste du site.',
              aEn: 'In our Plateau Mont-Royal studio in Montreal, like everything else on the site.',
              aEs: 'En nuestro taller del Plateau Mont-Royal, en Montreal, como todo lo demás.',
            },
          ].map((f, i) => (
            <details key={i} className="bg-glass card-shadow rounded-xl px-5 py-4 group">
              <summary className="cursor-pointer text-heading font-semibold text-sm list-none flex items-center justify-between">
                {tx({ fr: f.qFr, en: f.qEn, es: f.qEs })}
                <ChevronDown size={16} className="text-grey-muted transition-transform group-open:rotate-180" />
              </summary>
              <p className="text-grey-light text-sm mt-2">{tx({ fr: f.aFr, en: f.aEn, es: f.aEs })}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  )
}
