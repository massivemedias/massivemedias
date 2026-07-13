/**
 * DETOURAGE (FIX-MOCKUP-TUMBLER, bug 1) : retire le fond opaque rectangulaire
 * (carre blanc) des designs signales par audit-sticker-backgrounds.mjs, pour
 * retrouver le die-cut attendu (exterieur transparent). Symptome : carre blanc
 * autour du design sur le mockup gourde (ex "animals").
 *
 * Technique (inverse du remplissage UI-03) : flood fill BFS depuis les bords a
 * travers les pixels PROCHES de la couleur de fond (echantillonnee aux coins).
 * Ces pixels exterieurs connectes deviennent transparents. Rampe d'alpha sur la
 * bande d'anti-aliasing (TOL_CORE..TOL_EDGE) + de-premultiplication du blanc sur
 * ces pixels de bord = pas de halo blanc, bord net. Le die-cut s'arrete au
 * premier pixel du design (contour colore/fonce, distance > TOL_EDGE du fond).
 *
 * NE traite QUE les fonds UNIS detourables (blanc net). Les posters (texte sur
 * fond) et fonds complexes/atmospheriques sont exclus (traitement manuel Mika).
 *
 * ECRASE les webp en place dans les 3 tailles (full 80 / thumb 75 / mini 75),
 * memes noms. git + backup scratchpad = filet de securite.
 *
 * Usage : node scripts/detourage-sticker-backgrounds.mjs <slug> [slug...]
 */
import sharp from 'sharp'
import { statSync, renameSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SIZES = [
  { dir: join(ROOT, 'public/images/stickers-massive'), q: 80 },
  { dir: join(ROOT, 'public/images/thumbs/stickers-massive'), q: 75 },
  { dir: join(ROOT, 'public/images/thumbs-mini/stickers-massive'), q: 75 },
]
const ALPHA_SEUIL = 8   // deja transparent
const TOL_CORE = 42     // dist <= : pur fond -> alpha 0
const TOL_EDGE = 115    // dist >= : pixel du design (stop). Bande = anti-aliasing
const PATCH = 6

function bgFromCorners(raw, W, H) {
  let r = 0, g = 0, b = 0, n = 0
  const corners = [[0, 0], [1, 0], [0, 1], [1, 1]]
  for (const [cx, cy] of corners) {
    for (let dy = 0; dy < PATCH; dy++) for (let dx = 0; dx < PATCH; dx++) {
      const x = cx === 0 ? dx : W - 1 - dx
      const y = cy === 0 ? dy : H - 1 - dy
      const i = (y * W + x) * 4
      r += raw[i]; g += raw[i + 1]; b += raw[i + 2]; n++
    }
  }
  return { r: r / n, g: g / n, b: b / n }
}

async function detourage(path, quality) {
  const img = sharp(path)
  const { width: W, height: H } = await img.metadata()
  const raw = await img.ensureAlpha().raw().toBuffer()
  const N = W * H
  const bg = bgFromCorners(raw, W, H)
  const dist = (i) => {
    const dr = raw[i * 4] - bg.r, dg = raw[i * 4 + 1] - bg.g, db = raw[i * 4 + 2] - bg.b
    return Math.sqrt(dr * dr + dg * dg + db * db)
  }

  // Flood fill depuis les bords a travers le fond (transparent OU proche du bg).
  const exterior = new Uint8Array(N)
  const queue = new Int32Array(N)
  let head = 0, tail = 0
  const bgLike = (i) => raw[i * 4 + 3] <= ALPHA_SEUIL || dist(i) < TOL_EDGE
  const push = (i) => { if (!exterior[i] && bgLike(i)) { exterior[i] = 1; queue[tail++] = i } }
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x) }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1) }
  while (head < tail) {
    const i = queue[head++]
    const x = i % W
    if (x > 0) push(i - 1)
    if (x < W - 1) push(i + 1)
    if (i >= W) push(i - W)
    if (i < N - W) push(i + W)
  }

  // Applique alpha aux pixels exterieurs + de-premultiplie le fond sur la bande.
  const out = Buffer.from(raw)
  let effaces = 0
  for (let i = 0; i < N; i++) {
    if (!exterior[i]) continue
    const d = dist(i)
    let a
    if (d <= TOL_CORE) a = 0
    else if (d >= TOL_EDGE) a = raw[i * 4 + 3] // pixel du design touche par le fill : garde
    else a = Math.round(255 * (d - TOL_CORE) / (TOL_EDGE - TOL_CORE))
    a = Math.min(a, raw[i * 4 + 3])
    if (a < raw[i * 4 + 3]) effaces++
    // De-premultiplie : retire la contribution du fond pour recuperer la couleur
    // reelle du design sur les pixels de bord (evite le halo blanc/noir).
    if (a > 0 && a < 250) {
      const f = a / 255
      for (let c = 0; c < 3; c++) {
        const v = (raw[i * 4 + c] - (1 - f) * (c === 0 ? bg.r : c === 1 ? bg.g : bg.b)) / f
        out[i * 4 + c] = Math.max(0, Math.min(255, Math.round(v)))
      }
    }
    out[i * 4 + 3] = a
  }

  const avant = statSync(path).size
  await sharp(out, { raw: { width: W, height: H, channels: 4 } }).webp({ quality }).toFile(path + '.tmp')
  renameSync(path + '.tmp', path)
  return { effaces, pct: (effaces / N) * 100, avant, apres: statSync(path).size }
}

const slugs = process.argv.slice(2)
if (!slugs.length) { console.error('Usage: node scripts/detourage-sticker-backgrounds.mjs <slug> [slug...]'); process.exit(1) }
for (const slug of slugs) {
  const parts = []
  for (const { dir, q } of SIZES) {
    const r = await detourage(join(dir, `${slug}.webp`), q)
    parts.push(`${r.pct.toFixed(1)}%`)
  }
  console.log(`  ${slug.padEnd(28)} efface full/thumb/mini : ${parts.join(' / ')}`)
}
console.log('\nDetourage termine. Verif visuelle avant/apres recommandee.\n')
