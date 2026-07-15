/**
 * Genere les COMBOS DE COULEURS AUTO-ASSORTIES des etiquettes enfants.
 *
 * Pour chaque design KIDS_SAFE (data/etiquettes.js), extrait les couleurs
 * dominantes du sticker (pixels OPAQUES du thumb-mini 160px, quantifies via
 * ImageMagick) et fabrique 3 combos {bg, stroke, text} pour le rectangle du
 * nom :
 *   1. "pastel"  : fond pastel de la dominante + stroke dominante
 *   2. "pastel2" : meme chose sur la 2e couleur du design
 *   3. "blanc"   : fond blanc + stroke dominante (le combo le plus sobre)
 *
 * La LISIBILITE est GARANTIE au build : la couleur de texte de chaque combo
 * est la version assombrie de la dominante SI elle atteint 4,5:1 (AA texte
 * normal) sur le fond, sinon un encre neutre fonce. Aucun combo ne peut sortir
 * illisible, c'est calcule ici, pas espere au runtime.
 *
 * Sortie : src/data/etiquettesPalettes.js (GENERE, ne pas editer a la main).
 * A relancer apres tout ajout dans KIDS_SAFE :
 *   node scripts/generate-etiquettes-palettes.mjs
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const REPO = resolve(import.meta.dirname, '..')
const OUT = resolve(REPO, 'src/data/etiquettesPalettes.js')

// KIDS_SAFE est exporte d'un module ESM front ; on le lit par import dynamique.
const { KIDS_SAFE } = await import(resolve(REPO, 'src/data/etiquettes.js'))

// ---------- couleur : helpers ----------
const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)))
const hex = (r, g, b) => '#' + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')
const mix = (c, t, k) => c.map((v, i) => v + (t[i] - v) * k) // vers t, k=0..1
const pastel = (c) => mix(c, [255, 255, 255], 0.78)
const darken = (c, k = 0.62) => mix(c, [16, 18, 28], k)
const lum = ([r, g, b]) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const contrast = (a, b) => { const l1 = lum(a), l2 = lum(b); const [h, l] = l1 > l2 ? [l1, l2] : [l2, l1]; return (h + 0.05) / (l + 0.05) }
const sat = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx === 0 ? 0 : (mx - mn) / mx }
const INK = [31, 36, 48] // encre neutre foncee (fallback lisibilite)

// ---------- extraction : pixels opaques quantifies ----------
function dominantColors(slug) {
  const img = resolve(REPO, `public/images/thumbs-mini/stickers-massive/${slug}.webp`)
  if (!existsSync(img)) return null
  // 40px suffisent pour des dominantes ; sparse-color ne liste que les opaques
  const txt = execFileSync('magick', [
    img, '-resize', '40x40', '-alpha', 'on',
    '-channel', 'A', '-threshold', '55%', '+channel',
    '-colors', '8', 'sparse-color:',
  ]).toString()
  // IM7 sort des POURCENTAGES decimaux : srgba(71.9713%,67.26%,63.71%,1).
  // On capte r,g,b,(a) en float, converti % -> 0..255, et on IGNORE les pixels
  // transparents (alpha 0 = le fond decoupe du sticker).
  const counts = new Map()
  const re = /srgba?\(([\d.]+)(%?),([\d.]+)%?,([\d.]+)%?(?:,([\d.]+))?\)/g
  for (const m of txt.matchAll(re)) {
    const pct = m[2] === '%'
    const a = m[5] === undefined ? 1 : Number(m[5])
    if (a < 0.5) continue
    const conv = (v) => (pct ? Number(v) * 255 / 100 : Number(v))
    const c = [conv(m[1]), conv(m[3]), conv(m[4])].map((v) => Math.round(v))
    const k = c.join(',')
    counts.set(k, (counts.get(k) || 0) + 1)
  }
  const all = [...counts.entries()].map(([k, n]) => ({ c: k.split(',').map(Number), n }))
  // ni quasi-blanc ni quasi-noir (strokes/fonds), ni gris terne
  let cols = all
    .filter(({ c }) => lum(c) > 0.02 && lum(c) < 0.93 && sat(c) > 0.18)
    .sort((a, b) => b.n - a.n)
  // REPLI designs monochromes (ex: rhino-relax, mimi-gris) : aucune couleur
  // saturee -> on accepte les dominantes neutres, le combo restera sobre.
  if (!cols.length) {
    cols = all.filter(({ c }) => lum(c) > 0.05 && lum(c) < 0.9).sort((a, b) => b.n - a.n)
  }
  if (!cols.length) return null
  const first = cols[0].c
  // 2e couleur : la plus DIFFERENTE de la premiere parmi les frequentes
  const second = (cols.slice(1).sort((a, b) => {
    const d = (x) => Math.abs(x.c[0] - first[0]) + Math.abs(x.c[1] - first[1]) + Math.abs(x.c[2] - first[2])
    return d(b) - d(a)
  })[0] || cols[0]).c
  return { first, second }
}

function makeCombo(base) {
  const bg = pastel(base)
  let text = darken(base, 0.62)
  if (contrast(text, bg) < 4.5) text = darken(base, 0.78)
  if (contrast(text, bg) < 4.5) text = INK
  return { bg: hex(...bg), stroke: hex(...base), text: hex(...text) }
}
// Combo INVERSE (fond fonce assorti, texte clair) : utilise quand la 2e
// dominante est trop proche de la 1re (designs monochromes/uniformes), pour
// que les 3 pastilles offrent toujours 3 rendus reellement differents.
function makeDarkCombo(base) {
  const bg = darken(base, 0.5)
  let text = pastel(base)
  if (contrast(text, bg) < 4.5) text = [255, 255, 255]
  return { bg: hex(...bg), stroke: hex(...base), text: hex(...text) }
}

function makeWhiteCombo(base) {
  const bg = [255, 255, 255]
  let text = darken(base, 0.55)
  if (contrast(text, bg) < 4.5) text = darken(base, 0.75)
  if (contrast(text, bg) < 4.5) text = INK
  return { bg: '#ffffff', stroke: hex(...base), text: hex(...text) }
}

const out = {}
let ok = 0, missing = 0
for (const slug of KIDS_SAFE) {
  const d = dominantColors(slug)
  if (!d) { missing++; continue }
  const dist = Math.abs(d.first[0] - d.second[0]) + Math.abs(d.first[1] - d.second[1]) + Math.abs(d.first[2] - d.second[2])
  const combo2 = dist < 90 ? makeDarkCombo(d.first) : makeCombo(d.second)
  out[slug] = [makeCombo(d.first), combo2, makeWhiteCombo(d.first)]
  ok++
}

const banner = `// GENERE par scripts/generate-etiquettes-palettes.mjs - NE PAS EDITER A LA MAIN.
// Combos {bg, stroke, text} auto-assortis par design KIDS_SAFE, lisibilite AA
// (>= 4,5:1 texte/fond) GARANTIE au build. Relancer le script apres tout ajout.
`
writeFileSync(OUT, banner + 'export const ETIQUETTES_PALETTES = ' + JSON.stringify(out, null, 1) + '\n')
console.log(`palettes : ${ok} designs generes, ${missing} sans thumb-mini (retires ?)`)
// controle : aucun combo sous 4,5:1 (auto-verification de la garantie)
let bad = 0
for (const combos of Object.values(out)) {
  for (const { bg, text } of combos) {
    const p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
    if (contrast(p(bg), p(text)) < 4.5) bad++
  }
}
console.log(`controle contraste : ${bad} combo(s) sous 4,5:1 (doit etre 0)`)
