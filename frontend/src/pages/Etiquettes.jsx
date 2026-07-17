import { useEffect, useMemo, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Tag, Droplets, Sun, Shield, Scissors, WashingMachine, Truck,
  Pencil, NotebookPen, Box, Sparkles, ChevronDown, ShoppingBag,
} from 'lucide-react'
import { formatPrice } from '../utils/formatCurrency'
import SEO from '../components/SEO'
import { useLang } from '../i18n/LanguageContext'
import { useCart } from '../contexts/CartContext'
import { MASSIVE_STICKERS } from '../data/massiveStickers'
import {
  KIDS_SAFE, ETIQUETTE_THEMES, ETIQUETTE_FORMATS, ETIQUETTE_PACKS, ETIQUETTE_FONTS, ETIQUETTE_FONTS_CSS_URL, FONT_TOO_THIN_NOTE,
  DEFAULT_FONT_ID, googleFontHref,
  PAGE_NAME_OPTIONS, PAGE_NAME_CHOICE, PAGE_SEO_PRODUCT, ETIQUETTE_CLAIMS, ETIQUETTE_CLAIM_LAVE_VAISSELLE,
  formatDims, formatDimsShort, SAMPLE_NAMES, SAMPLE_NAME_POOL,
  ETIQUETTE_CORNERS, cornerFramePath,
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
  const [fontsReady, setFontsReady] = useState(0)
  useEffect(() => {
    let alive = true
    if (document.fonts?.ready) document.fonts.ready.then(() => { if (alive) setFontsReady((t) => t + 1) })
    else setFontsReady(1)
    // les webfonts du configurateur sont injectees PAR la page (chargement
    // scoped) : elles peuvent arriver apres fonts.ready -> re-mesurer
    const onDone = () => { if (alive) setFontsReady((t) => t + 1) }
    document.fonts?.addEventListener?.('loadingdone', onDone)
    return () => { alive = false; document.fonts?.removeEventListener?.('loadingdone', onDone) }
  }, [])
  useEffect(() => {
    if (!text || maxWidthPx <= 0) return
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const probe = 100
    ctx.font = `${fontWeight} ${probe}px ${fontFamily}`
    const m = ctx.measureText(text)
    const w = m.width || 1
    // hauteur REELLE du texte rendu (ascendantes + descendantes mesurees) :
    // une cursive expressive (Homemade Apple) depasse largement sa boite em,
    // borner fontSize a maxHeight ne suffit pas - c'est le trace qui doit tenir
    const hReal = ((m.actualBoundingBoxAscent || probe * 0.8) + (m.actualBoundingBoxDescent || 0)) || probe
    const fit = Math.min((maxWidthPx / w) * probe, (maxHeightPx / hReal) * probe)
    setSize(Math.max(7, Math.floor(fit)))
  }, [text, fontFamily, fontWeight, maxWidthPx, maxHeightPx, fontsReady])
  return size
}

// un prenon d'exemple au hasard dans le pool (placeholder tournant de l'apercu)
const pickSampleName = () => SAMPLE_NAME_POOL[Math.floor(Math.random() * SAMPLE_NAME_POOL.length)]
// polices offertes au client : les non-licenciees (Amelina) restent en DEV mais
// disparaissent du build prod ; les commerciales PREPAREES (available:false, pas
// encore hebergees) sont masquees PARTOUT tant que Mika n'a pas achete+ajoute la font.
const AVAILABLE_FONTS = ETIQUETTE_FONTS.filter((f) => (f.licensed !== false || import.meta.env.DEV) && f.available !== false)

// CHARGEMENT LAZY d'une police (archi Mika) : la police par DEFAUT est prechargee
// (ETIQUETTE_FONTS_CSS_URL dans la page) ; les autres se chargent A LA DEMANDE, ici
// par injection d'un <link> Google Fonts dedie (robuste vs les URLs woff2 de
// FontFace qui bougent) quand la tuile devient visible / au survol / a la selection.
// font-display:swap. Idempotent. Amelina (self-hosted @font-face index.css) : no-op.
const _etiFontLoaded = new Set([DEFAULT_FONT_ID])
function loadEtiquetteFont(f) {
  if (!f || _etiFontLoaded.has(f.id) || !f.google) return
  _etiFontLoaded.add(f.id)
  const l = document.createElement('link')
  l.rel = 'stylesheet'; l.href = googleFontHref(f.google); l.dataset.etiFont = f.id
  document.head.appendChild(l)
}
// coins offerts : le concave (devOnly) reste masque en prod tant que le test de
// decoupe Cameo n'est pas concluant (round + coupe au lancement).
const AVAILABLE_CORNERS = ETIQUETTE_CORNERS.filter((c) => !c.devOnly || import.meta.env.DEV)
// Badge fierte locale : 'chip' (discret, defaut - verdict Mika "le plus sobre")
// ou 'seal' (sceau rond). Swappable en une ligne.
const BADGE_VARIANT = 'chip'

function EtiquettePreview({ slug, combo, format, font, line1, line2, lang = 'fr', showDims = true, placeholder = '', corner = 'round' }) {
  const wPx = format.w * PX_PER_MM
  const hPx = format.h * PX_PER_MM
  const stickerSide = hPx * 0.86               // le sticker occupe la hauteur
  const padX = hPx * 0.22
  // coins coupes/concaves grugent l'espace aux extremites : on retire de la
  // largeur utile + on decale le sticker pour que rien ne touche jamais un coin.
  const cornerInset = corner === 'round' ? 0 : hPx * 0.14
  const textZoneW = wPx - stickerSide - padX * 3 - cornerInset
  const hasLine2 = Boolean(line2.trim())
  // hauteur allouee a chaque ligne : les 2 lignes + l'ecart DOIVENT tenir dans
  // la hauteur du rectangle, sinon le texte deborde. Budgets serres (somme
  // ~0,66 h) et l'ecart est minimal -> l'ecriture reste centree, jamais coupee.
  const line1MaxH = hasLine2 ? hPx * 0.38 : hPx * 0.62
  const line2MaxH = hPx * 0.23

  const t1 = line1.trim() || placeholder || SAMPLE_NAMES[lang] || SAMPLE_NAMES.fr
  const t2 = line2.trim()
  const size1 = useAutoFit(t1, font.family, font.weight, textZoneW, line1MaxH)
  const size2 = useAutoFit(t2 || ' ', font.family, font.weight, textZoneW, line2MaxH)

  const sw = Math.max(2, hPx * 0.045)
  const framePath = cornerFramePath(wPx, hPx, corner, sw / 2)   // axe du trait
  const clipInside = cornerFramePath(wPx, hPx, corner, sw)      // interieur du trait -> clip du contenu

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Cadre = path SVG : le STROKE epouse fidelement le coin (chanfrein,
          concave) - impossible en border-radius CSS pur. Le meme path sert la
          decoupe Cameo (cf cornerFramePath). Contenu clippe a la forme, ombre
          portee qui suit la forme (pas une ombre rectangulaire). */}
      <div style={{ position: 'relative', width: wPx, height: hPx, filter: 'drop-shadow(0 10px 26px rgba(0,0,0,0.28))' }}>
        <svg width={wPx} height={hPx} viewBox={`0 0 ${wPx} ${hPx}`} style={{ position: 'absolute', inset: 0, display: 'block' }} aria-hidden="true">
          <path d={framePath} fill={combo.bg} stroke={combo.stroke} strokeWidth={sw} strokeLinejoin={corner === 'chamfer' ? 'miter' : 'round'} />
        </svg>
        <div
          className="absolute inset-0 flex items-center"
          style={{ paddingLeft: padX * 0.6 + cornerInset * 0.5, paddingRight: padX + cornerInset, clipPath: `path('${clipInside}')` }}
        >
          <img
            src={`/images/thumbs-mini/stickers-massive/${slug}.webp`}
            alt=""
            aria-hidden="true"
            className="sticker-stroke object-contain shrink-0"
            style={{ width: stickerSide, height: stickerSide }}
          />
          {/* padding SYMETRIQUE (pas paddingLeft seul) : le texte se centre
              EXACTEMENT dans la zone a droite du sticker, H et V, sans biais.
              Un paddingLeft seul + justify-center decalait le bloc vers la droite. */}
          <div className="flex-1 min-w-0 self-stretch flex flex-col items-center justify-center text-center" style={{ paddingInline: padX * 0.35 }}>
            {/* wrapper compact : les 2 lignes forment UN groupe (marge negative
                calibree par police), recale verticalement (vNudge), et le
                justify-center du parent centre ce groupe dans le rectangle. */}
            <div className="flex flex-col items-center" style={{ transform: `translateY(${hPx * (font.vNudge || 0)}px)` }}>
              <div style={{ fontFamily: font.family, fontWeight: font.weight, fontSize: size1, lineHeight: 1, color: combo.text, whiteSpace: 'nowrap' }}>
                {t1}
              </div>
              {hasLine2 && (
                <div style={{ fontFamily: font.family, fontWeight: font.weight, fontSize: size2, lineHeight: 1, color: combo.text, whiteSpace: 'nowrap', opacity: 0.82, marginTop: size2 * (font.lineGap ?? -0.12) }}>
                  {t2}
                </div>
              )}
            </div>
          </div>
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

/* ---- FONT PICKER : tuiles carrees (apercu "Abc" dans la police + nom marketing),
 *      radiogroup accessible clavier, chargement lazy des polices visibles. ---- */
function FontPicker({ fonts, value, onChange, formatId, tx }) {
  const wrapRef = useRef(null)
  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof IntersectionObserver === 'undefined') { fonts.forEach(loadEtiquetteFont); return }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) loadEtiquetteFont(fonts.find((f) => f.id === e.target.dataset.fid))
      })
    }, { rootMargin: '250px' })
    el.querySelectorAll('[data-fid]').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [fonts])
  return (
    <div ref={wrapRef} role="radiogroup" aria-label={tx({ fr: 'Police', en: 'Font', es: 'Tipografía' })} className="grid grid-cols-3 gap-2">
      {fonts.map((f) => {
        const tooThin = (f.tooThinFormats || []).includes(formatId)
        const sel = value === f.id
        return (
          <button
            key={f.id} data-fid={f.id} type="button" role="radio" aria-checked={sel} disabled={tooThin}
            onMouseEnter={() => loadEtiquetteFont(f)} onFocus={() => loadEtiquetteFont(f)}
            onClick={() => onChange(f.id)}
            title={tooThin ? `${tx(f.name)} : ${tx(FONT_TOO_THIN_NOTE)}` : tx(f.name)}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl border aspect-[1.4/1] min-h-[52px] transition-all ${tooThin ? 'opacity-40 cursor-not-allowed border-white/5' : sel ? 'border-accent bg-accent/10' : 'border-white/10 hover:border-white/25'}`}
          >
            <span className="text-[26px] leading-none text-heading" style={{ fontFamily: f.family, fontWeight: f.weight }}>{f.preview || 'Abc'}</span>
            <span className={`text-[11.5px] font-semibold ${sel ? 'text-accent' : 'text-grey-light'}`}>{tx(f.name)}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ---- ENCART TAILLE : les 3 formats a l'ECHELLE (hors des cases du selecteur),
 *      silhouettes comparees + dims + usage. Clic = selectionne le format. ---- */
function SizeEncart({ formatId, onPick, lang, tx }) {
  const maxW = Math.max(...ETIQUETTE_FORMATS.map((f) => f.w))
  return (
    <div className="surface-vitrine rounded-2xl p-5 mt-4">
      <p className="text-heading font-semibold text-sm">{tx({ fr: 'Les 3 tailles, à l’échelle', en: 'The 3 sizes, to scale', es: 'Los 3 tamaños, a escala' })}</p>
      <p className="text-grey-muted text-[11.5px] mb-4">{tx({ fr: 'Comparées côte à côte pour bien choisir', en: 'Compared side by side to help you choose', es: 'Comparados para elegir mejor' })}</p>
      <div className="flex items-end gap-5 flex-wrap">
        {ETIQUETTE_FORMATS.map((f) => {
          const w = 66 + (f.w / maxW) * 92
          const h = Math.max(13, w * (f.h / f.w))
          const sel = formatId === f.id
          return (
            <button key={f.id} type="button" onClick={() => onPick(f.id)} className="flex flex-col items-center gap-2 group">
              <div className="rounded-md grid place-items-center font-bold transition-all" style={{ width: w, height: h, fontSize: Math.min(13, h * 0.5), background: '#f4efe4', color: '#2a2233', border: `2px solid ${sel ? 'var(--accent)' : '#cbb98f'}` }}>{f.h >= 12 ? 'Emma' : 'Aa'}</div>
              <div className="text-center leading-tight">
                <b className={`text-[12.5px] ${sel ? 'text-accent' : 'text-heading'}`}>{tx(f)}</b>
                <div className="text-grey-muted text-[11px]">{formatDimsShort(f, lang)}</div>
                <div className="text-grey-muted/70 text-[10.5px]">{tx({ fr: f.usageFr, en: f.usageEn, es: f.usageEs })}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ---- CARROUSEL de designs auto-defilant (une rangee, boucle douce, pause au
 *      survol/touch, clic = selectionne). Reduced-motion : pas d'animation. ---- */
/**
 * ETAPE 3 : chips de filtre par thematique, en tete du selecteur.
 * Filtre le carrousel ET la grille. Scrollables horizontalement en mobile
 * (les 10 chips ne tiennent pas sur 375 px). Le theme actif PERSISTE pendant
 * toute la configuration (etat remonte dans le composant page).
 */
function ThemeChips({ themes, value, onChange, countBySlug, tx }) {
  return (
    <div className="-mx-1 mb-3 overflow-x-auto eti-chips" role="tablist" aria-label="Thematiques">
      <div className="flex gap-1.5 px-1 w-max">
        {themes.map((t) => {
          const on = value === t.id
          return (
            <button
              key={t.id} type="button" role="tab" aria-selected={on}
              onClick={() => onChange(t.id)}
              className={`shrink-0 rounded-full px-3.5 py-2.5 text-[13px] font-semibold border transition-all min-h-[44px] ${
                on ? 'border-accent bg-accent/15 text-accent' : 'border-white/10 text-grey-light hover:border-white/25'
              }`}
            >
              {t.id === 'tous' ? tx({ fr: 'Tous', en: 'All', es: 'Todos' }) : tx(t.name)}
              <span className={`ml-1.5 text-[11px] ${on ? 'text-accent/70' : 'text-grey-muted'}`}>{countBySlug[t.id]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DesignCarousel({ slugs, current, onPick, labelBySlug }) {
  const loop = [...slugs, ...slugs]
  return (
    <div className="eti-carou" aria-hidden="false">
      <div className="eti-track">
        {loop.map((s, i) => (
          <button
            key={i} type="button" onClick={() => onPick(s)} title={labelBySlug?.[s]?.fr || s} tabIndex={i < slugs.length ? 0 : -1}
            className={`eti-dz shrink-0 rounded-xl p-1 bg-glass-alt transition-all ${current === s ? 'ring-2 ring-accent' : 'hover:brightness-110'}`}
          >
            <img src={`/images/thumbs-mini/stickers-massive/${s}.webp`} alt="" aria-hidden="true" loading="lazy" decoding="async" className="sticker-stroke w-14 h-14 object-contain" />
          </button>
        ))}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------------
 * LE CONFIGURATEUR : design -> prenom -> FORMAT -> couleurs -> police -> coins
 * -> pack. Layout 2 colonnes : apercu vedette large sticky a GAUCHE, controles
 * a droite (mobile : apercu sticky en haut, sections empilees).
 * ------------------------------------------------------------------------ */
function ConfigurateurEtiquettes() {
  const { lang, tx } = useLang()
  const [slug, setSlug] = useState('massive-panda-cute')
  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [comboIdx, setComboIdx] = useState(0)
  const [formatId, setFormatId] = useState('moyenne')
  const [fontId, setFontId] = useState(DEFAULT_FONT_ID)
  const [cornerId, setCornerId] = useState(ETIQUETTE_CORNERS[0].id)
  const [packId, setPackId] = useState(ETIQUETTE_PACKS.find((p) => p.populaire)?.id || ETIQUETTE_PACKS[0].id)
  const [showAll, setShowAll] = useState(false)
  // ETAPE 3 : theme actif, persiste pendant toute la configuration
  const [theme, setTheme] = useState('tous')
  const kidsSet = useMemo(() => new Set(KIDS_SAFE), [])
  const chipThemes = useMemo(() => ([
    { id: 'tous', name: { fr: 'Tous', en: 'All', es: 'Todos' } },
    ...ETIQUETTE_THEMES.filter((t) => t.slugs.some((x) => kidsSet.has(x))),
  ]), [kidsSet])
  const countByTheme = useMemo(() => {
    const o = { tous: KIDS_SAFE.length }
    ETIQUETTE_THEMES.forEach((t) => { o[t.id] = t.slugs.filter((x) => kidsSet.has(x)).length })
    return o
  }, [kidsSet])
  // la liste filtree alimente le carrousel ET la grille (une seule source)
  const designs = useMemo(() => {
    if (theme === 'tous') return KIDS_SAFE
    const t = ETIQUETTE_THEMES.find((x) => x.id === theme)
    return t ? t.slugs.filter((x) => kidsSet.has(x)) : KIDS_SAFE
  }, [theme, kidsSet])
  const [sampleName, setSampleName] = useState(pickSampleName)
  // prenom d'exemple : nouveau tirage a chaque changement de design
  useEffect(() => { setSampleName(pickSampleName()) }, [slug])

  const { addToCart, openCartDrawer } = useCart()
  const pack = ETIQUETTE_PACKS.find((p) => p.id === packId) || ETIQUETTE_PACKS[0]
  const canAdd = line1.trim().length > 0
  // ETAPE 2 checkout : la config COMPLETE part dans le panier -> order.items ->
  // dashboard production + courriels. Prix FORCE serveur (SEC-04, etiquette-pack-<id>) ;
  // isUnique = chaque etiquette personnalisee est sa propre ligne (jamais fusionnee).
  const handleAddToCart = () => {
    if (!canAdd) return
    const fontMeta = AVAILABLE_FONTS.find((f) => f.id === fontId)
    const cornerMeta = AVAILABLE_CORNERS.find((c) => c.id === cornerId) || ETIQUETTE_CORNERS[0]
    const nm = line1.trim() + (line2.trim() ? ` / ${line2.trim()}` : '')
    addToCart({
      productId: `etiquette-pack-${pack.id}`,
      sku: `etiquette-${pack.id}-${slug}`,
      productName: `Mini Massive — ${tx(pack)}`,
      // le prenom voyage dans size -> visible dans le courriel de confirmation
      // (template itemRows : productName - size) et en chip AdminOrders.
      size: `${line1.trim()}${line2.trim() ? ` / ${line2.trim()}` : ''} · ${pack.total} étiq.`,
      quantity: 1,
      unitPrice: pack.price,
      totalPrice: pack.price, // affichage : le prix reel est force serveur
      image: `/images/thumbs/stickers-massive/${slug}.webp`,
      isUnique: true,
      notes: `Prénom : ${nm} · Design : ${slug} · Police : ${tx(fontMeta?.name || {})} · Coins : ${tx(cornerMeta.label)}`,
      // bloc structure lu par le dashboard production (AdminOrders)
      etiquette: {
        design: slug, line1: line1.trim(), line2: line2.trim(),
        comboIdx, format: formatId, font: fontId, corner: cornerId,
        pack: pack.id, contenu: pack.contenu, total: pack.total,
      },
    })
    openCartDrawer()
  }

  const combos = ETIQUETTES_PALETTES[slug] || []
  const combo = combos[Math.min(comboIdx, combos.length - 1)] || { bg: '#fff', stroke: '#333', text: '#222' }
  const format = ETIQUETTE_FORMATS.find((f) => f.id === formatId)
  const font = ETIQUETTE_FONTS.find((f) => f.id === fontId)

  // la font selectionnee devient interdite quand on passe a un format trop
  // petit pour elle -> bascule sur la premiere font permise (jamais d'apercu
  // dans une font non commandable)
  useEffect(() => {
    if ((font?.tooThinFormats || []).includes(formatId)) {
      const ok = AVAILABLE_FONTS.find((f) => !(f.tooThinFormats || []).includes(formatId))
      if (ok) setFontId(ok.id)
    }
  }, [formatId, font])

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

      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-8 max-w-6xl mx-auto items-start">
        {/* ============ GAUCHE : APERCU vedette LARGE (~55%). Sticky : desktop
            toute la colonne colle ; mobile la carte apercu colle en haut pendant
            qu'on configure dessous. + encart TAILLE (desktop). ============ */}
        <div className="lg:sticky lg:top-24 order-1 min-w-0">
          <div className="surface-vitrine card-shadow rounded-2xl p-6 sm:p-8 sticky top-2 z-20 lg:static lg:z-auto">
            <div className="flex items-center justify-center min-h-[150px] lg:min-h-[220px] overflow-x-auto py-2">
              <EtiquettePreview slug={slug} combo={combo} format={format} font={font} line1={line1} line2={line2} lang={lang} placeholder={sampleName} corner={cornerId} />
            </div>
          </div>
          {/* ENCART TAILLE : les 3 formats a l'echelle, HORS des cases (desktop) */}
          <div className="hidden lg:block">
            <SizeEncart formatId={formatId} onPick={setFormatId} lang={lang} tx={tx} />
          </div>
        </div>

        {/* ============ DROITE : CONTROLES (nouvel ordre design -> prenom ->
            FORMAT -> couleurs -> police -> coins -> pack) ============ */}
        <div className="order-2 space-y-5 min-w-0">
          {/* 1. DESIGN : carrousel auto-defilant en tete + grille complete au clic */}
          <div>
            <p className="text-grey-muted text-[11px] font-bold uppercase tracking-wider mb-2.5">
              {tx({ fr: 'Choisis ton design', en: 'Pick your design', es: 'Elige tu diseño' })} ({designs.length})
            </p>
            <ThemeChips themes={chipThemes} value={theme} onChange={(id) => { setTheme(id); setShowAll(false) }} countBySlug={countByTheme} tx={tx} />
            <DesignCarousel slugs={designs.slice(0, 24)} current={slug} onPick={(s) => { setSlug(s); setComboIdx(0) }} labelBySlug={stickerBySlug} />
            {!showAll ? (
              <button type="button" onClick={() => setShowAll(true)} className="mt-3 w-full py-2.5 rounded-full text-sm font-semibold text-grey-light border border-white/10 hover:border-white/25 transition-colors inline-flex items-center justify-center gap-1.5">
                {tx({ fr: `Voir les ${designs.length} designs`, en: `See all ${designs.length} designs`, es: `Ver los ${designs.length} diseños` })}
                <ChevronDown size={15} />
              </button>
            ) : (
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-[300px] overflow-y-auto pr-1 mt-3">
                {designs.map((s) => {
                  const st = stickerBySlug[s]
                  return (
                    <button key={s} type="button" onClick={() => { setSlug(s); setComboIdx(0) }} title={st ? st.fr : s}
                      className={`relative rounded-xl p-1.5 bg-glass-alt transition-all ${slug === s ? 'ring-2 ring-accent' : 'hover:brightness-110'}`}>
                      <img src={`/images/thumbs-mini/stickers-massive/${s}.webp`} alt={st ? st.fr : s} loading="lazy" decoding="async" className="sticker-stroke w-full aspect-square object-contain" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* 2. PRENOM + ligne 2 (touch targets >=44px) */}
          <div className="space-y-3">
            <input type="text" maxLength={22} value={line1} onChange={(e) => setLine1(e.target.value)}
              placeholder={tx({ fr: 'Prénom (ou prénom + nom)', en: 'First name (or full name)', es: 'Nombre (o nombre completo)' })}
              className="w-full rounded-xl bg-bg-elevated border border-white/10 px-4 py-3.5 text-heading text-base focus:border-accent/50 focus:outline-none"
              aria-label={tx({ fr: 'Nom sur l’étiquette', en: 'Name on the label', es: 'Nombre en la etiqueta' })} />
            <input type="text" maxLength={26} value={line2} onChange={(e) => setLine2(e.target.value)}
              placeholder={tx({ fr: 'Ligne 2 (optionnel : nom de famille, téléphone…)', en: 'Line 2 (optional: last name, phone…)', es: 'Línea 2 (opcional: apellido, teléfono…)' })}
              className="w-full rounded-xl bg-bg-elevated border border-white/10 px-4 py-3 text-heading text-sm focus:border-accent/50 focus:outline-none"
              aria-label={tx({ fr: 'Deuxième ligne', en: 'Second line', es: 'Segunda línea' })} />
          </div>

          {/* 3. FORMAT (remonte au-dessus des couleurs) - libelles agrandis, cartes
              compactes (nom + dim), le detail a l'echelle est dans l'encart */}
          <div>
            <p className="text-grey-muted text-[11px] font-bold uppercase tracking-wider mb-2">
              {tx({ fr: 'Format', en: 'Size', es: 'Formato' })}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {ETIQUETTE_FORMATS.map((f) => (
                <button key={f.id} type="button" onClick={() => setFormatId(f.id)}
                  className={`rounded-xl px-3 py-3 text-center border transition-all min-h-[44px] ${formatId === f.id ? 'border-accent bg-accent/10' : 'border-white/10 hover:border-white/25'}`}>
                  <span className={`block text-base font-bold ${formatId === f.id ? 'text-accent' : 'text-heading'}`}>{tx(f)}</span>
                  <span className="block text-grey-light text-xs mt-0.5">{formatDimsShort(f, lang)}</span>
                </button>
              ))}
            </div>
            {/* encart taille : MOBILE seulement (desktop = colonne gauche) */}
            <div className="lg:hidden">
              <SizeEncart formatId={formatId} onPick={setFormatId} lang={lang} tx={tx} />
            </div>
          </div>

          {/* 4. COULEURS (assorties au design, pas de picker libre) */}
          <div>
            <p className="text-grey-muted text-[11px] font-bold uppercase tracking-wider mb-2">
              {tx({ fr: 'Couleurs (assorties au design)', en: 'Colors (matched to the design)', es: 'Colores (a juego con el diseño)' })}
            </p>
            <div className="flex gap-2.5">
              {combos.map((c, i) => (
                <button key={i} type="button" onClick={() => setComboIdx(i)} aria-label={`Combo ${i + 1}`}
                  className={`w-12 h-11 rounded-lg transition-all ${comboIdx === i ? 'ring-2 ring-accent scale-105' : 'opacity-80 hover:opacity-100'}`}
                  style={{ background: c.bg, border: `3px solid ${c.stroke}` }} />
              ))}
            </div>
          </div>

          {/* 5. POLICE : font picker en tuiles (Abc + nom marketing), lazy-load */}
          <div>
            <p className="text-grey-muted text-[11px] font-bold uppercase tracking-wider mb-2">
              {tx({ fr: 'Police', en: 'Font', es: 'Tipografía' })}
            </p>
            <FontPicker fonts={AVAILABLE_FONTS} value={fontId} onChange={setFontId} formatId={formatId} tx={tx} />
            {AVAILABLE_FONTS.some((f) => (f.tooThinFormats || []).includes(formatId)) && (
              <p className="text-grey-muted text-xs mt-2">
                {AVAILABLE_FONTS.filter((f) => (f.tooThinFormats || []).includes(formatId)).map((f) => tx(f.name)).join(', ')} : {tx(FONT_TOO_THIN_NOTE)}
              </p>
            )}
          </div>

          {/* 6. COINS : vignettes de la forme (meme path cornerFramePath que l'apercu) */}
          <div>
            <p className="text-grey-muted text-[11px] font-bold uppercase tracking-wider mb-2">
              {tx({ fr: 'Coins', en: 'Corners', es: 'Esquinas' })}
            </p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_CORNERS.map((cn) => {
                const active = cornerId === cn.id
                return (
                  <button key={cn.id} type="button" onClick={() => setCornerId(cn.id)} title={tx(cn.label)} aria-label={tx(cn.label)}
                    className={`p-2 rounded-xl border transition-all min-h-[44px] ${active ? 'border-accent bg-accent/10 text-accent' : 'border-white/10 text-grey-light hover:border-white/25'}`}>
                    <svg width="38" height="38" viewBox="0 0 44 44" aria-hidden="true">
                      <path d={cornerFramePath(44, 44, cn.id, 3)} fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="2.5" strokeLinejoin={cn.id === 'chamfer' ? 'miter' : 'round'} />
                    </svg>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 7. PACK + ajout au panier */}
          <div className="pt-5 border-t border-white/10">
            <p className="text-grey-muted text-[11px] font-bold uppercase tracking-wider mb-2">
              {tx({ fr: 'Trousse', en: 'Kit', es: 'Kit' })}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {ETIQUETTE_PACKS.map((p) => (
                <button key={p.id} type="button" onClick={() => setPackId(p.id)}
                  className={`relative rounded-xl px-2.5 py-3 text-center border transition-all min-h-[44px] ${packId === p.id ? 'border-accent bg-accent/10' : 'border-white/10 hover:border-white/25'}`}>
                  {p.populaire && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-accent text-white whitespace-nowrap">
                      {tx({ fr: 'Populaire', en: 'Popular', es: 'Popular' })}
                    </span>
                  )}
                  <span className={`block text-sm font-semibold ${packId === p.id ? 'text-accent' : 'text-heading'}`}>{tx(p)}</span>
                  <span className="block text-grey-muted text-[11px]">{p.total} · {formatPrice(p.price)}</span>
                </button>
              ))}
            </div>
            <p className="text-grey-muted text-xs mt-2">{tx({ fr: pack.dFr, en: pack.dEn, es: pack.dEs })}</p>
            <button type="button" onClick={handleAddToCart} disabled={!canAdd}
              className={`mt-4 w-full py-3.5 rounded-full font-semibold text-sm inline-flex items-center justify-center gap-2 transition-all ${canAdd ? 'bg-accent text-white hover:brightness-110' : 'bg-white/5 text-grey-muted cursor-not-allowed'}`}>
              <ShoppingBag size={16} />
              {canAdd
                ? tx({ fr: `Ajouter au panier — ${formatPrice(pack.price)}`, en: `Add to cart — ${formatPrice(pack.price)}`, es: `Añadir al carrito — ${formatPrice(pack.price)}` })
                : tx({ fr: 'Écris d’abord le prénom', en: 'Enter the name first', es: 'Escribe el nombre primero' })}
            </button>
          </div>
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
  const [heroSample] = useState(pickSampleName) // prenom d'exemple du hero (tire au chargement)
  const goConfig = () => document.getElementById('configurateur')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // Webfonts du configurateur chargees ICI seulement (rien dans index.html,
  // zero poids pour le reste du site). Idempotent, le link reste pose.
  useEffect(() => {
    if (document.getElementById('etiquettes-fonts')) return
    const link = document.createElement('link')
    link.id = 'etiquettes-fonts'
    link.rel = 'stylesheet'
    link.href = ETIQUETTE_FONTS_CSS_URL
    document.head.appendChild(link)
  }, [])

  const claims = ETIQUETTE_CLAIMS.filter((c) => !c.pending || ETIQUETTE_CLAIM_LAVE_VAISSELLE)
  const claimIcons = { droplets: Droplets, sun: Sun, shield: Shield, scissors: Scissors, washing: WashingMachine, truck: Truck }
  const formatIcons = { mini: Pencil, moyenne: NotebookPen, grande: Box }

  return (
    <>
      <SEO
        title={tx({
          fr: `${pageName.fr} - ${PAGE_SEO_PRODUCT.fr} | Massive`,
          en: `${pageName.en} - ${PAGE_SEO_PRODUCT.en} | Massive`,
          es: `${pageName.es} - ${PAGE_SEO_PRODUCT.es} | Massive`,
        })}
        description={tx({
          fr: 'Mini Massive : étiquettes d’identification personnalisées pour enfants. Un design de la collection Massive + le nom de ton enfant, couleurs assorties automatiquement. Résistantes à l’eau et aux UV, imprimées à Montréal.',
          en: 'Mini Massive: personalized kids name labels. A Massive collection design + your kid’s name, colors matched automatically. Water and UV resistant, printed in Montreal.',
          es: 'Mini Massive: etiquetas personalizadas para niños. Un diseño de la colección Massive + el nombre de tu peque, colores a juego automáticos. Resistentes al agua y UV, impresas en Montreal.',
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
                    fr: 'Des étiquettes personnalisées pour enfants : son design préféré, son nom, des couleurs qui s’assortissent toutes seules. Découpées à la forme et imprimées à Montréal, prêtes pour l’école et la garderie.',
                    en: 'Custom name labels for kids: their favorite design, their name, colors that match themselves. Die-cut and printed in Montreal, ready for school and daycare.',
                    es: 'Etiquetas personalizadas para niños: su diseño favorito, su nombre, colores que combinan solos. Cortadas a medida e impresas en Montreal, listas para la escuela y la guardería.',
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
                    font={AVAILABLE_FONTS[0]}
                    line1=""
                    placeholder={heroSample}
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
            fr: 'Personnalise ton étiquette ci-dessus, choisis ta trousse et ajoute au panier.',
            en: 'Design your label above, choose your kit and add to cart.',
            es: 'Diseña tu etiqueta arriba, elige tu kit y añade al carrito.',
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


      {/* ============ EN SITUATION (mockups STATIQUES composes) ============
          Round 2 (verdict Mika : "les stickers doivent s'adapter a la forme") :
          l'etiquette exemple est CUITE dans la photo par
          scripts/generate-etiquettes-mockups.mjs - vrai warp cylindrique
          (Plane2Cylinder), shading des bords enroules, echelle reelle relative
          a l'objet, ombre de contact. Ces cartes sont ILLUSTRATIVES : le
          configurateur garde son apercu live a lui. Photos Pexels (licence
          Pexels, commercial libre) : gourde 8611290 (RDNE Stock project),
          verre 38380651 (Ann H), crayon 4237814, cahier 7054764. Etiquettes :
          4 designs, prenom Emma. RELANCER le script apres tout changement.
          La ligne sous la section leve toute ambiguite : Massive vend LES
          ETIQUETTES, pas les objets. */}
      <section className="section-container">
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-heading mb-8 text-center">
          {tx({ fr: 'En situation', en: 'In the wild', es: 'En situación' })}
        </h2>
        <div className="grid sm:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {[
            { img: '/images/etiquettes/mockup-gourde.webp', legend: { fr: 'Sur sa gourde', en: 'On their bottle', es: 'En su botella' } },
            { img: '/images/etiquettes/mockup-verre.webp', legend: { fr: 'Sur son verre', en: 'On their cup', es: 'En su vaso' } },
            { img: '/images/etiquettes/mockup-lunchbox.webp', legend: { fr: 'Sur sa boîte à lunch', en: 'On their lunch box', es: 'En su lonchera' } },
          ].map((m) => (
            <div key={m.img} className="surface-vitrine card-shadow rounded-2xl relative overflow-hidden aspect-[4/3] w-full max-w-[360px] mx-auto">
              <img src={m.img} alt={tx(m.legend)} loading="lazy" decoding="async"
                className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 to-transparent" aria-hidden="true" />
              <span className="absolute bottom-2 left-0 right-0 text-center text-white/95 text-xs font-medium [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
                {tx(m.legend)}
              </span>
            </div>
          ))}
        </div>
        <p className="text-grey-muted text-xs text-center mt-4 max-w-xl mx-auto">
          {tx({
            fr: 'Les objets sont montrés à titre d\u2019exemple seulement : Massive fournit les étiquettes, pas les gourdes, verres ou boîtes à lunch.',
            en: 'Objects are shown as examples only: Massive supplies the labels, not the bottles, cups or lunch boxes.',
            es: 'Los objetos se muestran solo como ejemplo: Massive suministra las etiquetas, no las botellas, vasos ni loncheras.',
          })}
        </p>
      </section>

      {/* ============ BADGE FIERTE LOCALE (verdict Mika : le plus sobre) ========
          DROITS : fleur de lys STYLISEE originale (SVG dessine ici), PAS le logo
          officiel de la Ville de Montreal ni les armoiries (marques protegees).
          Une seule variante affichee (BADGE_VARIANT), swappable en une ligne. */}
      <section className="section-container">
        <div className="flex justify-center">
          {BADGE_VARIANT === 'seal' ? (
            <div className="flex items-center gap-3 surface-vitrine card-shadow rounded-2xl px-5 py-4">
              <span className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shrink-0">
                <FleurDeLys className="w-6 h-6" fill="#ffffff" />
              </span>
              <p className="text-heading font-heading font-bold text-sm leading-tight">
                {tx({ fr: 'Fièrement fabriqué à Montréal', en: 'Proudly made in Montreal', es: 'Hecho con orgullo en Montreal' })}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 surface-vitrine card-shadow rounded-2xl px-5 py-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/15">
                <FleurDeLys className="w-4 h-4" fill="currentColor" style={{ color: 'var(--accent-color)' }} />
                <span className="text-accent font-heading font-extrabold text-sm tracking-wide">MTL</span>
              </span>
              <p className="text-heading font-heading font-bold text-sm leading-tight">
                {tx({ fr: 'Fièrement fabriqué à Montréal', en: 'Proudly made in Montreal', es: 'Hecho con orgullo en Montreal' })}
              </p>
            </div>
          )}
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
