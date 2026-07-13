/**
 * AUDIT (FIX-MOCKUP-TUMBLER, bug 1) : detecte les designs de la collection
 * stickers qui ont un FOND OPAQUE rectangulaire (non detoure), au lieu du
 * die-cut attendu (exterieur transparent). Symptome visible sur le mockup
 * gourde : carre blanc autour du design (ex "animals").
 *
 * Detection : on echantillonne les 4 coins (patch 5x5). Un sticker die-cut
 * correct a des coins TRANSPARENTS (alpha ~0). Un fond opaque = coins opaques
 * (alpha eleve). On rapporte aussi la couleur moyenne des coins et leur
 * uniformite (ecart max entre coins) : un fond uni (blanc) = detourable en
 * auto ; un fond bariole = candidat traitement manuel.
 *
 * READ-ONLY : ne modifie aucun fichier. Sortie = liste des coupables.
 *
 * Usage : node scripts/audit-sticker-backgrounds.mjs
 */
import sharp from 'sharp'
import { readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIRS = {
  full: join(ROOT, 'public/images/stickers-massive'),
  thumb: join(ROOT, 'public/images/thumbs/stickers-massive'),
  mini: join(ROOT, 'public/images/thumbs-mini/stickers-massive'),
}
const ALPHA_OPAQUE = 200 // alpha au-dessus = pixel opaque
const PATCH = 5          // patch NxN echantillonne a chaque coin

// Moyenne RGBA d'un patch PATCHxPATCH ancre au coin (cx, cy correspond au pixel
// du coin, on avance vers l'interieur).
function cornerSample(raw, W, H, corner) {
  let r = 0, g = 0, b = 0, a = 0, n = 0
  for (let dy = 0; dy < PATCH; dy++) {
    for (let dx = 0; dx < PATCH; dx++) {
      const x = corner.x === 0 ? dx : W - 1 - dx
      const y = corner.y === 0 ? dy : H - 1 - dy
      const i = (y * W + x) * 4
      r += raw[i]; g += raw[i + 1]; b += raw[i + 2]; a += raw[i + 3]; n++
    }
  }
  return { r: r / n, g: g / n, b: b / n, a: a / n }
}

async function opaqueCorners(path) {
  const img = sharp(path)
  const { width: W, height: H } = await img.metadata()
  const raw = await img.ensureAlpha().raw().toBuffer()
  const corners = [
    cornerSample(raw, W, H, { x: 0, y: 0 }),
    cornerSample(raw, W, H, { x: 1, y: 0 }),
    cornerSample(raw, W, H, { x: 0, y: 1 }),
    cornerSample(raw, W, H, { x: 1, y: 1 }),
  ]
  const op = corners.filter((c) => c.a >= ALPHA_OPAQUE)
  const avg = op.length
    ? op.reduce((s, c) => ({ r: s.r + c.r / op.length, g: s.g + c.g / op.length, b: s.b + c.b / op.length }), { r: 0, g: 0, b: 0 })
    : { r: 0, g: 0, b: 0 }
  let ecartMax = 0
  for (const c of op) ecartMax = Math.max(ecartMax, Math.abs(c.r - avg.r) + Math.abs(c.g - avg.g) + Math.abs(c.b - avg.b))
  return { opaques: op.length, avg, ecart: Math.round(ecartMax) }
}

const fichiers = readdirSync(DIRS.full).filter((f) => f.endsWith('.webp')).sort()
const coupables = []
for (const f of fichiers) {
  const full = await opaqueCorners(join(DIRS.full, f))
  const thumb = await opaqueCorners(join(DIRS.thumb, f))
  const mini = await opaqueCorners(join(DIRS.mini, f))
  if (full.opaques === 0 && thumb.opaques === 0 && mini.opaques === 0) continue
  const ref = full.opaques ? full : thumb.opaques ? thumb : mini
  coupables.push({
    f,
    full: full.opaques, thumb: thumb.opaques, mini: mini.opaques,
    couleur: `rgb(${Math.round(ref.avg.r)},${Math.round(ref.avg.g)},${Math.round(ref.avg.b)})`,
    ecart: ref.ecart,
    uni: ref.ecart < 24,
  })
}

console.log(`\n=== AUDIT FONDS OPAQUES (coins opaques full/thumb/mini) : ${coupables.length} / ${fichiers.length} suspects ===\n`)
coupables
  .sort((a, b) => (b.full + b.thumb + b.mini) - (a.full + a.thumb + a.mini) || a.ecart - b.ecart)
  .forEach((c) => console.log(`  ${c.full}/${c.thumb}/${c.mini}  ${c.couleur.padEnd(18)}  ecart=${String(c.ecart).padStart(3)}  ${c.uni ? 'UNI ' : 'complexe'}  ${c.f}`))
console.log('\n(colonnes = nb de coins opaques sur 4, dans full / thumb / mini)\n')
