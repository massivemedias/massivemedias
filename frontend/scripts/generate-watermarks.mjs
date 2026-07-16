/**
 * Filigrane MASSIVE sur les COPIES WEB des produits prets a l'achat.
 *
 * POURQUOI
 * Le contrat artiste (src/data/artistContract.js) PROMET que les oeuvres sont
 * affichees "avec filigrane visible". Or le site servait des images propres, et
 * le seul filigrane existant etait du CSS (`::after`) : peint par-dessus dans le
 * navigateur, l'image `<img>` en dessous se telecharge PROPRE d'un clic droit.
 * Fausse protection. Ce script cuit le filigrane DANS LE PIXEL.
 *
 * REGLE ABSOLUE : les ORIGINAUX (Google Drive, TIFF, sources Supabase) ne sont
 * JAMAIS touches. Ce script n'agit que sur les COPIES WEB LOCALES du repo, qui
 * sont ce que le site sert. L'impression tire des originaux Drive.
 *
 * CE QUI EST FILIGRANE (perimetre valide par Mika) :
 *   - public/images/stickers-massive/*.webp   (800px, fiche produit + hero vedette)
 *   - public/images/artists/<slug>/posters-trimmed/*.webp
 *       (les vues OEUVRE en grand : fiche detail ArtisteDetail + lightbox HD,
 *        via `fullImage || toFull(image)` -> LE trou beant, 3344px propre avant)
 * PAS touche (trop petit pour reimprimer, le filigrane y tuerait la vente) :
 *   - les thumbs de grille (thumbs/), micro-thumbs (thumbs-mini/), le Supabase
 *     800 (vignettes 56px), le mockup gourde, les collages.
 *
 * STYLE (round 3 / OPTION B, verdict Mika sur le round 2 "gris fantome, les
 * tampons debordent hors du dessin") : UN SEUL tampon MASSIVE en diagonale,
 * calibre sur 60 % de la largeur de la SILHOUETTE (bbox alpha) et CENTRE dessus.
 * Rasterise depuis le SVG A LA TAILLE CIBLE -> trace NET a toute resolution.
 * Blanc + ombre noire decalee PROPORTIONNELLE (tient sur fonds clairs ET noirs),
 * opacite 5 % ("a peine le voir", mais visible a 100 % sur les zones plates).
 * Centrer sur la SILHOUETTE (pas l'image) garantit que sur les die-cut a
 * silhouette etroite/decentree le tampon tombe TOUJOURS sur le dessin (fini les
 * fragments blancs hors-silhouette du round 2). Masque a l'alpha de la source :
 * le filigrane ne tombe QUE sur le dessin.
 *
 * IDEMPOTENT : un manifeste (scripts/.watermark-manifest.json) retient
 * l'empreinte de chaque fichier deja filigrane. Un re-run saute les fichiers
 * inchanges et ne traite que les NOUVEAUX -> aucun double-tampon. Pour reforcer
 * depuis le propre : `git checkout <fichier>` puis relancer.
 *
 * USAGE
 *   node scripts/generate-watermarks.mjs            # tout le perimetre
 *   node scripts/generate-watermarks.mjs <glob...>  # cibles precises (ajout d'un design)
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, mkdtempSync, statSync, createReadStream } from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join, resolve, dirname, relative } from 'node:path'
import { glob } from 'node:fs/promises'

const REPO = resolve(import.meta.dirname, '..')
const PUBLIC = resolve(REPO, 'public')
// Cle de manifeste = chemin RELATIF au repo -> portable entre machines.
const key = (abs) => relative(REPO, abs)
const MANIFEST = resolve(import.meta.dirname, '.watermark-manifest.json')
const OPACITY = 0.05           // "a peine le voir" ; visible a 100% sur zones plates
const STAMP_RATIO = 0.60       // largeur du tampon / largeur de la SILHOUETTE (bbox alpha)

// Logo MASSIVE : le MEME trace vectoriel que le filigrane CSS du site
// (index.css .watermark-light). Rotation -25 deja dans le SVG.
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-300 -250 1800 800" width="200" height="89"><g transform="rotate(-25 590 137)"><path d="M356.9 25.2L533.4 25.6V83.5L430.5 83.1V97.5H533.4V227.8H356.9V169.9H459.9V155.5H356.9V25.2Z" fill="white"/><path d="M549.1 25.1L814.9 25.2V83.1L622.7 83V97.5H725.8V227.8H549.1V169.9H652.2V155.4H549.1V25.1Z" fill="white"/><path d="M814.9 97.8V228H741.3V97.8H814.9Z" fill="white"/><path d="M960.7 25.1H1034.2L917.6 228L828.2 226.9V25.1H901.8L902.6 112.3L960.7 25.1Z" fill="white"/><path d="M1134 155.4L974.6 155.6L1008 97.5L1134 97.3V155.4Z" fill="white"/><path d="M1134 227.8H933.1L966.5 169.8H1134V227.8Z" fill="white"/><path d="M1134 83.3L1015.8 83.1L1049.2 25L1134 25.2V83.3Z" fill="white"/><path d="M25 25.2C25 25.2 25 225 25 227.8H95V82.7H122.8L122.8 227.7L192.2 227.8V92.3C192.2 92.3 304.2 28.9 307.8 25.2" fill="white"/><path d="M207.4 102.6V178.9L270.7 143.6L270.8 227.8L340.6 227.7V25.3L207.4 102.6Z" fill="white"/></g></svg>`

const sha = (p) => new Promise((res) => {
  const h = createHash('sha1'); const s = createReadStream(p)
  s.on('data', (d) => h.update(d)); s.on('end', () => res(h.digest('hex')))
})

const work = mkdtempSync(join(tmpdir(), 'mm-wm-'))
const magick = (args) => execFileSync('magick', args, { stdio: ['ignore', 'ignore', 'inherit'] })

// --- tampon NET par largeur cible : le SVG est rasterise directement a la
// taille voulue (width/height reecrits -> rendu vectoriel, zero upscale bitmap).
// Cache par largeur : le lot n'a que quelques tailles d'images distinctes.
const stampCache = new Map()
function stampFor(stampW) {
  if (stampCache.has(stampW)) return stampCache.get(stampW)
  const stampH = Math.round(stampW * 89 / 200)
  const off = Math.max(1, Math.round(stampW * 0.008))            // ombre proportionnelle
  const svgSized = LOGO_SVG.replace('width="200" height="89"', `width="${stampW}" height="${stampH}"`)
  const svgPath = join(work, `logo-${stampW}.svg`); writeFileSync(svgPath, svgSized)
  const lw = join(work, `lw-${stampW}.png`), lb = join(work, `lb-${stampW}.png`)
  const stamp = join(work, `stamp-${stampW}.png`)
  magick(['-background', 'none', svgPath, lw])                                     // blanc, net a la taille cible
  magick([lw, '-channel', 'RGB', '-evaluate', 'set', '0', '+channel', lb])         // copie noire (l'ombre)
  magick(['-size', `${stampW + off}x${stampH + off}`, 'xc:none',
    lb, '-geometry', `+${off}+${off}`, '-composite',                               // ombre dessous, decalee
    lw, '-geometry', '+0+0', '-composite',                                         // blanc dessus
    stamp])
  stampCache.set(stampW, stamp)
  return stamp
}

function watermark(file) {
  const [w, h] = execFileSync('magick', ['identify', '-format', '%w %h', file]).toString().split(' ').map(Number)
  const layer = join(work, 'layer.png'), mask = join(work, 'mask.png'), out = join(work, 'out.webp')
  // OPTION B (round 3, verdict Mika sur le round 2 "gris fantome / fragments") :
  // UN SEUL tampon en diagonale, calibre sur 60% de la largeur de la SILHOUETTE
  // (bbox alpha) et CENTRE dessus. Sur les die-cut a silhouette etroite/decentree,
  // le tampon tombe TOUJOURS sur le dessin (fini les fragments hors-silhouette du
  // round 2, ou les 3 tampons debordaient dans le vide).
  const bbox = execFileSync('magick', ['identify', '-format', '%@', file]).toString().trim() // WxH+X+Y
  const m = bbox.match(/(\d+)x(\d+)\+(\d+)\+(\d+)/)
  const [bw, bh, bx, by] = m ? [+m[1], +m[2], +m[3], +m[4]] : [w, h, 0, 0]
  const stampW = Math.round(bw * STAMP_RATIO)
  const stampH = Math.round(stampW * 89 / 200)
  const stamp = stampFor(stampW)
  const px = Math.round(bx + bw / 2 - stampW / 2), py = Math.round(by + bh / 2 - stampH / 2)
  magick(['-size', `${w}x${h}`, 'xc:none',
    stamp, '-gravity', 'NorthWest', '-geometry', `+${px}+${py}`, '-composite',
    '-channel', 'A', '-evaluate', 'multiply', String(OPACITY), '+channel', layer])
  // masque = alpha de la source (die-cut : filigrane que sur le dessin)
  magick([file, '-alpha', 'extract', mask])
  magick([layer, mask, '-compose', 'DstIn', '-composite', layer])
  // compose sur la source, reencode WebP (memes reglages que le site : q80)
  magick([file, layer, '-compose', 'over', '-composite', '-quality', '80', out])
  execFileSync('cp', [out, file])
}

// --- perimetre par defaut ---
async function targets() {
  const argv = process.argv.slice(2)
  if (argv.length) return argv.map((a) => resolve(a))
  const out = []
  for await (const f of glob(join(PUBLIC, 'images/stickers-massive/*.webp'))) out.push(f)
  for await (const f of glob(join(PUBLIC, 'images/artists/*/posters-trimmed/*.webp'))) out.push(f)
  return out
}

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {}
const files = await targets()
let done = 0, skip = 0
for (const f of files) {
  if (!existsSync(f)) { console.warn('  absent, ignore :', f); continue }
  const k = key(f)
  const before = await sha(f)
  if (manifest[k] === before) { skip++; continue }    // deja filigrane (empreinte connue)
  watermark(f)
  manifest[k] = await sha(f)                           // empreinte de la version filigranee
  done++
}
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 0))
console.log(`filigrane : ${done} traites, ${skip} deja fait(s) (idempotent), ${files.length} cibles`)
console.log(`  perimetre : stickers-massive/ (800) + artists/*/posters-trimmed/ ; OPTION B = 1 tampon diagonal centre sur la silhouette (${STAMP_RATIO * 100}% bbox), opacite ${OPACITY * 100}% + ombre`)
