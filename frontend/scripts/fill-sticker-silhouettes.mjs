/**
 * STICKERS-UI-03 (8 juillet 2026) : remplissage blanc de l'interieur des
 * silhouettes de la collection stickers. Reproduit le rendu du sticker
 * physique : les designs a lignes noires sur alpha (ex Double trouble)
 * etaient invisibles sur le fond fonce du site ; sur le vinyle reel,
 * l'interieur de la decoupe est du blanc opaque.
 *
 * Technique : flood fill BFS de la transparence depuis les bords de
 * l'image = masque EXTERIEUR (la zone vraiment decoupee). Tout pixel
 * NON exterieur recoit un fond blanc opaque, puis le design original est
 * recompose par-dessus (traits, couleurs et anti-aliasing preserves).
 * Consequence assumee : les effets semi-transparents interieurs (fumee,
 * glow) deviennent "laiteux", comme imprimes sur vinyle blanc reel.
 *
 * Usage :
 *   node scripts/fill-sticker-silhouettes.mjs           # batch complet
 *   node scripts/fill-sticker-silhouettes.mjs <slug>    # un seul design
 *
 * ECRASE les webp en place (800px q80 + thumbs 400px q75), memes noms,
 * manifest inchange. Les originaux du dossier source (.ai/exports) ne
 * sont jamais touches - ces webp sont deja les copies de travail 3A.
 */
import sharp from 'sharp'
import { readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const FULL_DIR = join(ROOT, 'public/images/stickers-massive')
const THUMB_DIR = join(ROOT, 'public/images/thumbs/stickers-massive')
const ALPHA_SEUIL = 8

async function fillSilhouette(path, quality) {
  const img = sharp(path)
  const { width: W, height: H } = await img.metadata()
  const raw = await img.ensureAlpha().raw().toBuffer()
  const N = W * H

  // Flood fill depuis les bords : marque la transparence EXTERIEURE.
  const exterior = new Uint8Array(N)
  const queue = new Int32Array(N)
  let head = 0
  let tail = 0
  const isTransparent = (i) => raw[i * 4 + 3] <= ALPHA_SEUIL
  const push = (i) => { if (!exterior[i] && isTransparent(i)) { exterior[i] = 1; queue[tail++] = i } }
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

  // Fond blanc opaque sous tout pixel interieur, design original par-dessus.
  const fond = Buffer.alloc(N * 4, 0)
  let trous = 0
  for (let i = 0; i < N; i++) {
    if (!exterior[i]) {
      fond[i * 4] = 255
      fond[i * 4 + 1] = 255
      fond[i * 4 + 2] = 255
      fond[i * 4 + 3] = 255
      if (isTransparent(i)) trous++
    }
  }

  const avant = statSync(path).size
  await sharp(fond, { raw: { width: W, height: H, channels: 4 } })
    .composite([{ input: raw, raw: { width: W, height: H, channels: 4 }, blend: 'over' }])
    .webp({ quality })
    .toFile(path + '.tmp')
  const { renameSync } = await import('fs')
  renameSync(path + '.tmp', path)
  const apres = statSync(path).size
  return { pctTrous: (trous / N) * 100, avant, apres }
}

const seul = process.argv[2]
const fichiers = readdirSync(FULL_DIR).filter((f) => f.endsWith('.webp') && (!seul || f === `${seul}.webp`))
let totalAvant = 0
let totalApres = 0
const notables = []
for (const f of fichiers) {
  const full = await fillSilhouette(join(FULL_DIR, f), 80)
  const th = await fillSilhouette(join(THUMB_DIR, f), 75)
  totalAvant += full.avant + th.avant
  totalApres += full.apres + th.apres
  if (full.pctTrous >= 2) notables.push({ f, pct: Math.round(full.pctTrous * 10) / 10 })
}
console.log(`${fichiers.length} designs traites (800px + thumb)`)
console.log(`Poids total : ${Math.round(totalAvant / 1024)} ko -> ${Math.round(totalApres / 1024)} ko (${Math.round((1 - totalApres / totalAvant) * 100)} % de reduction)`)
console.log(`Designs avec remplissage notable (>= 2 % de la surface) : ${notables.length}`)
notables.sort((a, b) => b.pct - a.pct).forEach((n) => console.log(`  ${n.pct} %  ${n.f}`))
