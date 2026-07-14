/**
 * Genere les variantes "hero" des prints d'artistes.
 *
 * POURQUOI
 * Le hero de /artistes prend une oeuvre en fond. Le champ `print.image` servi par
 * le CMS est une image Supabase plafonnee a **800px de large**. Or le conteneur
 * de page (`.section-container`) est en `max-width: 1280px`, donc le hero est
 * rendu a ~1248px : le 800 y est etire x1,56 -> flou (retour Mika, 14 juillet).
 *
 * Ce script fabrique, depuis `fullImage` (la meilleure source LOCALE de chaque
 * print), une variante dediee au hero :
 *   /images/artists/<slug>/posters-trimmed/X.webp  ->  /images/artists/<slug>/hero/X.webp
 *   plafond 1400px de large (> les 1248 necessaires), qualite 74, JAMAIS d'upscale.
 * ~168 fichiers, ~135 ko de moyenne.
 *
 * LIMITE ASSUMEE : certaines sources locales font moins de 1248px (jusqu'a 795px).
 * Pour ces prints la variante fait la taille de la source : on ne peut pas
 * inventer du detail qui n'existe nulle part. Ils ne sont pas pires qu'avant.
 * Les prints sans fichier local restent sur l'image 800px (fallback runtime).
 *
 * QUAND LE RELANCER
 * A chaque ajout de prints au CMS.  node frontend/scripts/generate-hero-prints.mjs
 *
 * Les images sont gitignorees : penser au `git add -f` sur le dossier hero/.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, existsSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const API = 'https://massivemedias-api.onrender.com/api/artists?pagination[pageSize]=100'
const PUBLIC = resolve(import.meta.dirname, '../public')
const LARGEUR_MAX = 1400
const QUALITE = 74

const res = await fetch(API)
if (!res.ok) throw new Error(`CMS injoignable : HTTP ${res.status}`)
const { data: artistes = [] } = await res.json()

let generes = 0
let sansSource = 0
let sousDimensionnes = 0
let poids = 0

for (const a of artistes) {
  for (const p of a.prints || []) {
    const full = p.fullImage || ''
    if (!full.includes('/posters-trimmed/')) { sansSource++; continue }

    const src = PUBLIC + full
    if (!existsSync(src)) { sansSource++; continue }

    const dst = PUBLIC + full.replace('/posters-trimmed/', '/hero/')
    mkdirSync(dirname(dst), { recursive: true })

    // `1400x>` : ne redimensionne QUE si l'image est plus large. Pas d'upscale.
    execFileSync('magick', [src, '-resize', `${LARGEUR_MAX}x>`, '-quality', String(QUALITE), '-strip', dst])

    const largeur = Number(execFileSync('magick', ['identify', '-format', '%w', dst]).toString())
    if (largeur < 1248) sousDimensionnes++
    poids += statSync(dst).size
    generes++
  }
}

const mo = (poids / 1024 / 1024).toFixed(1)
const ko = Math.round(poids / generes / 1024)
console.log(`${generes} variantes hero generees (${LARGEUR_MAX}px max, q${QUALITE})`)
console.log(`  poids : ${mo} Mo, ${ko} ko de moyenne`)
console.log(`  dont ${sousDimensionnes} sous 1248px (source trop petite, aucun moyen de faire mieux)`)
console.log(`  ${sansSource} prints sans source locale -> fallback sur l'image 800px au runtime`)
