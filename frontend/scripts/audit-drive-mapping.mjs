/**
 * AUDIT DRIVE <-> SITE : regenere `src/data/drive-mapping.csv`.
 *
 *   node frontend/scripts/audit-drive-mapping.mjs
 *
 * ============================ POURQUOI CE SCRIPT ============================
 * Le lien entre un slug du site et son fichier source dans le Drive de Mika
 * n'existait NULLE PART de facon durable : il vivait dans des scripts jetables
 * (scratchpad de session), qui ont ete purges. Resultat, le lien a ete PERDU
 * pour les 115 designs de la sync de juillet, et il a fallu le reconstruire par
 * comparaison d'images. Ce script + le CSV qu'il produit sont la reponse : la
 * correspondance est versionnee, regenerable, et survit aux sessions.
 * ===========================================================================
 *
 * ☠️ INTERDIT ABSOLU : NE JAMAIS RENOMMER, DEPLACER NI SUPPRIMER UN FICHIER DU
 * DOSSIER DRIVE STICKERS.
 * TOUS ces fichiers sont LIES (Place) dans les .ai Illustrator de Mika, RIEN n'est
 * incorpore. Toucher a un seul nom CASSE les liens de ses .ai. La casse est
 * SILENCIEUSE : aucun test ni build ne la voit, elle n'apparait qu'a l'ouverture
 * du .ai, des mois plus tard. Le chantier "renommer le Drive selon les noms du
 * site" a ete ANNULE DEFINITIVEMENT pour cette raison (16 juillet 2026).
 * On croise par le CSV. On ne renomme JAMAIS le disque.
 *
 * REGLE : le SITE est la reference. Les slugs et les URLs ne changent JAMAIS.
 * Les ecarts de noms entre Drive et site ne sont PAS des anomalies a corriger :
 * c'est un fait, et ce CSV est le pont entre les deux mondes.
 *
 * LECTURE SEULE STRICTE sur le Drive. Ce script n'ecrit que le CSV.
 *
 * STATUTS :
 *   - match exact               : le nom du fichier Drive == ce que le site attend
 *   - nom different             : un fichier existe, sous un autre nom -> a renommer
 *   - orphelin site sans source : aucun fichier au Drive (PNG final nettoye apres export)
 *
 * COLONNE `perimetre` : sans elle le tableau ment, les deux moities ne se
 * comparent pas a la meme reference.
 *   - "mapping 270"  : la reference est le fichier source de sticker-names-mapping.md
 *   - "sync juillet" : pas de nom canonique enregistre, la reference est le nom FR du site
 *
 * DEUX PIEGES qui ont fausse trois versions de cet audit :
 *   1. le prefixe "Sticker " doit tomber des DEUX cotes (une regex `stc?ker` ne
 *      matche jamais "sticker"), + la coquille "Stcker coquelicot.png" existe ;
 *   2. le slug `massive-goth-1` correspond au fichier `Sticker Goth1.png` : il
 *      faut coller les espaces avant les chiffres, sinon 19 Goth partent en
 *      faux orphelins.
 * Le rapprochement par IMAGE (16x16 gris) rattrape ce que le texte ne peut pas :
 * les renommages defensifs (`Sticker Red Skull.png` -> "Crane ecarlate").
 */
import { readFileSync, readdirSync, writeFileSync, statSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, resolve } from 'node:path'

const DRIVE = '/Users/mauditemachine/Library/CloudStorage/GoogleDrive-mauditemachine@gmail.com/My Drive/Massive/Projets/Massive/Stickers'
const ROOT = resolve(import.meta.dirname, '..')
const PUB = `${ROOT}/public/images/stickers-massive`
const OUT = `${ROOT}/src/data/drive-mapping.csv`

const norm = (s) => String(s || '')
  .replace(/\.(png|jpe?g|psd|webp)$/i, '')
  .normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .trim().toLowerCase().replace(/\s+/g, ' ')
/** sans le prefixe "Sticker " (+ la coquille "Stcker") */
const base = (s) => norm(s).replace(/^stic?kers?\s+|^stcker\s+/, '')
/** cle de rapprochement : "goth 1" et "goth1" doivent se rejoindre */
const key = (s) => base(s).replace(/\s+(?=\d)/g, '')

if (!existsSync(DRIVE)) {
  console.error(`Drive introuvable : ${DRIVE}\nGoogle Drive Desktop est-il monte ?`)
  process.exit(1)
}

// --- SITE : la reference ---
const cat = readFileSync(`${ROOT}/src/data/massiveStickers.js`, 'utf8')
const site = [...cat.matchAll(/\{\s*slug:\s*'([^']+)',\s*fr:\s*"([^"]*)"/g)].map((m) => ({ slug: m[1], fr: m[2] }))

// --- MAPPING : nom de fichier canonique des 270 d'origine ---
const canon = new Map(), alt = new Map()
for (const line of readFileSync(`${ROOT}/src/data/sticker-names-mapping.md`, 'utf8').split('\n')) {
  const m = line.match(/^\|\s*(massive-[a-z0-9-]+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/)
  if (!m) continue
  const [, slug, ancien, fr, en, es, f] = m.map((x) => (typeof x === 'string' ? x.trim() : x))
  canon.set(slug, f)
  alt.set(slug, new Set([f, ancien, fr, en, es].filter(Boolean).map(key)))
}

// --- DRIVE ---
const files = readdirSync(DRIVE).filter((f) => {
  if (f.startsWith('.')) return false
  try { if (!statSync(join(DRIVE, f)).isFile()) return false } catch { return false }
  return /\.(png|jpe?g|psd)$/i.test(f) || !f.includes('.')
})
const idx = new Map()
for (const f of files) {
  const k = key(f)
  if (!idx.has(k)) idx.set(k, [])
  idx.get(k).push(f)
}
/**
 * Choix DETERMINISTE quand plusieurs fichiers Drive partagent la meme cle.
 * Cas reel : "Sticker Woods.png" ET "Sticker Woods" (sans extension) coexistent.
 * Sans tri, on prenait le premier renvoye par readdir -> le CSV changeait d'une
 * machine/execution a l'autre. Inacceptable pour une source de verite.
 * Ordre : .png > .jpg > sans extension > .psd, puis alphabetique.
 */
const rang = (f) => (/\.png$/i.test(f) ? 0 : /\.jpe?g$/i.test(f) ? 1 : !f.includes('.') ? 2 : 3)
const pick = (k) => {
  const h = idx.get(k)
  if (!h?.length) return null
  return [...h].sort((a, b) => rang(a) - rang(b) || a.localeCompare(b))[0]
}

/** signature perceptuelle 16x16 gris, sur la silhouette aplatie sur blanc */
const sig = (p) => {
  try {
    const out = execFileSync('magick', [p, '-background', 'white', '-alpha', 'remove', '-alpha', 'off',
      '-resize', '16x16!', '-colorspace', 'Gray', '-depth', '8', 'txt:-'], { encoding: 'utf8', maxBuffer: 1e7 })
    const v = [...out.matchAll(/gray\((\d+)\)/g)].map((m) => +m[1])
    return v.length === 256 ? v : null
  } catch { return null }
}

// --- passe 1 : rapprochement textuel ---
const prelim = site.map(({ slug, fr }) => {
  const dans = canon.has(slug)
  const cles = [...new Set([
    ...(dans ? [key(canon.get(slug))] : []),
    key(fr), key(slug.replace(/^massive-/, '').replace(/-/g, ' ')),
    ...(dans ? [...alt.get(slug)] : []),
  ].filter(Boolean))]
  let found = null
  for (const c of cles) { const f = pick(c); if (f) { found = f; break } }
  return { slug, fr, found, perim: dans ? 'mapping 270' : 'sync juillet', via: found ? 'texte' : null }
})

// --- passe 2 : rapprochement par IMAGE pour les non resolus ---
const pris = new Set(prelim.map((r) => r.found).filter(Boolean))
const restants = prelim.filter((r) => !r.found)
if (restants.length) {
  console.log(`rapprochement par image : ${restants.length} slug(s) non resolus par le texte...`)
  const cands = new Map()
  for (const f of files) {
    if (pris.has(f) || !/\.png$/i.test(f)) continue
    const s = sig(join(DRIVE, f))
    if (s) cands.set(f, s)
  }
  for (const r of restants) {
    const p = `${PUB}/${r.slug}.webp`
    if (!existsSync(p)) continue
    const a = sig(p)
    if (!a) continue
    let best = null, bd = Infinity
    for (const [f, b] of cands) {
      let d = 0
      for (let i = 0; i < 256; i++) { const x = a[i] - b[i]; d += x * x }
      if (d < bd) { bd = d; best = f }
    }
    if (Math.sqrt(bd / 256) < 18) { r.found = best; r.via = 'image' }
  }
}

// --- statuts + CSV ---
const cnt = { 'match exact': 0, 'nom different': 0, 'orphelin site sans source': 0 }
const rows = prelim.map(({ slug, fr, found, perim, via }) => {
  const attendu = canon.get(slug) ?? `Sticker ${fr}`
  let st, rem = ''
  if (!found) { st = 'orphelin site sans source'; rem = `attendu "${attendu}" introuvable au Drive` }
  else if (base(found) === base(attendu)) { st = 'match exact'; if (/\.psd$/i.test(found)) rem = 'PSD seulement, pas de PNG final' }
  else {
    st = 'nom different'; rem = `site attend "${attendu}", Drive a "${found}"`
    if (/\.psd$/i.test(found)) rem += ' (PSD seulement)'
    if (via === 'image') rem += ' [lien retrouve par comparaison d image]'
  }
  cnt[st]++
  return [slug, fr, found ?? 'ABSENT', st, perim, rem]
})

const esc = (v) => { const t = String(v ?? ''); return /[",;\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t }
writeFileSync(OUT, '﻿' + ['slug site,nom FR site,fichier Drive,statut,perimetre,remarque',
  ...rows.map((r) => r.map(esc).join(','))].join('\n') + '\n')

console.log(`site: ${site.length} designs | Drive: ${files.length} fichiers indexes`)
for (const [k, v] of Object.entries(cnt)) console.log(`  ${k.padEnd(28)} ${v}`)
console.log(`  ${'TOTAL'.padEnd(28)} ${rows.length}`)
console.log(`  PSD seulement : ${rows.filter((r) => /PSD seulement/.test(r[5])).length}`)
console.log(`  liens par image : ${rows.filter((r) => /comparaison d image/.test(r[5])).length}`)
console.log(`-> ${OUT}`)
