/**
 * MOCKUPS "En situation" de Mini Massive : l'etiquette exemple est CUITE dans
 * la photo avec une VRAIE integration (round 2, verdict Mika : "les stickers
 * sont juste par-dessus, ils doivent s'adapter a la forme").
 *
 * Ces cartes sont ILLUSTRATIVES (pas dynamiques) : la qualite prime. Le
 * configurateur, lui, garde son apercu live (l'etiquette seule).
 *
 * INTEGRATION par objet :
 * - COURBURE : surfaces cylindriques (gourde, verre, crayon) via
 *   `-distort Plane2Cylinder <rayon>` - l'etiquette s'enroule vraiment.
 *   Le crayon est un cylindre HORIZONTAL : rotate 90 -> warp -> rotate -90.
 * - SHADING : gradient cosinus multiplie AVANT le warp (les bords enroules
 *   s'assombrissent exactement la ou la surface fuit la lumiere).
 * - PERSPECTIVE/ANGLE : rotation finale alignee a l'objet (pente du crayon,
 *   inclinaison du cahier).
 * - ECHELLE REALISTE : l'etiquette a sa taille RELATIVE a l'objet (60x18 mm
 *   sur une gourde de ~7 cm = ~85 % de la largeur visible ; la mini 46x9
 *   couvre presque toute la longueur visible du crayon sans depasser le fut).
 * - LUMIERE : ombre de contact douce (blur serre + offset leger) sous chaque
 *   etiquette.
 *
 * SOURCES (scripts/mockups-src/) :
 * - photo-gourde.webp  : Pexels 8611290 (RDNE Stock project) - licence Pexels
 * - photo-verre.webp   : Pexels 38380651 (Ann H) - licence Pexels
 * - photo-crayon.webp  : Pexels 4237814 (crayon bleu, fond rose) - licence Pexels
 * - photo-cahier.webp  : Pexels 7054764 (cahier spirale, fond mauve) - licence Pexels
 *   (licence Pexels : usage commercial libre, modification permise. La boite a
 *   lunch demandee n'existe pas en banque libre exploitable - boites ouvertes,
 *   marques, ou CC BY-SA - le cahier la remplace : meme surface PLATE, usage
 *   reel du produit "Cahiers, gourdes, boites a collation".)
 * - label-*.png : etiquettes exemple rendues du configurateur (Baloo 2,
 *   combos auto-assortis, prenom Lyse), 4 designs differents.
 *
 * Sortie : public/images/etiquettes/mockup-{gourde,verre,crayon,cahier}.webp
 * (800x600, q82). Relancer apres tout changement de source :
 *   node scripts/generate-etiquettes-mockups.mjs
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const REPO = resolve(import.meta.dirname, '..')
const SRC = resolve(REPO, 'scripts/mockups-src')
const OUT = resolve(REPO, 'public/images/etiquettes')
const work = mkdtempSync(join(tmpdir(), 'mm-mockup-'))
const magick = (args) => execFileSync('magick', args, { stdio: ['ignore', 'pipe', 'inherit'] })

/**
 * Chaque config : ou, comment et a quelle echelle l'etiquette se pose.
 * - targetW : largeur de l'etiquette EN PX de la photo 800x600 (echelle reelle
 *   mesuree sur l'objet).
 * - fov : angle de champ du warp cylindrique EN DEGRES (l'argument de
 *   Plane2Cylinder est un FOV, PAS un rayon !) : ~40 cylindre large (gobelet),
 *   ~60 gourde, ~100 cylindre fin (crayon). 0 = surface plate, pas de warp.
 * - axis : 'v' cylindre vertical (gourde/verre), 'h' horizontal (crayon).
 * - rotate : alignement final a l'objet (degres).
 * - center : [x, y] du POINT DE POSE dans la photo.
 * - shade : force de l'assombrissement des bords enroules (0..1).
 */
const MOCKUPS = [
  {
    name: 'gourde', photo: 'photo-gourde.webp', label: 'label-gourde.png',
    targetW: 185, fov: 60, axis: 'v', rotate: -2, center: [480, 350], shade: 0.30,
  },
  {
    name: 'verre', photo: 'photo-verre.webp', label: 'label-verre.png',
    targetW: 230, fov: 40, axis: 'v', rotate: 0.5, center: [385, 430], shade: 0.24,
  },
  {
    name: 'crayon', photo: 'photo-crayon.webp', label: 'label-crayon.png',
    targetW: 205, fov: 100, axis: 'h', rotate: -0.5, center: [190, 287], shade: 0.38,
  },
  {
    name: 'cahier', photo: 'photo-cahier.webp', label: 'label-cahier.png',
    targetW: 300, fov: 0, axis: 'v', rotate: -12, center: [415, 260], shade: 0,
  },
]

function compose({ name, photo, label, targetW, fov, axis, rotate, center, shade }) {
  const flat = join(work, `${name}-flat.png`)
  const shaded = join(work, `${name}-shaded.png`)
  const warped = join(work, `${name}-warped.png`)
  const rotated = join(work, `${name}-rot.png`)
  const shadow = join(work, `${name}-shadow.png`)
  const out = join(OUT, `mockup-${name}.webp`)

  // 1. etiquette a l'echelle reelle de l'objet
  magick([join(SRC, label), '-resize', `${targetW}x`, flat])

  // 2. shading cylindrique AVANT le warp : gradient cosinus multiplie sur les
  // couleurs (l'alpha est preserve) -> les bords enroules recoivent moins de
  // lumiere, exactement comme un vrai vinyle sur un cylindre
  if (shade > 0) {
    const [w, h] = magick(['identify', '-format', '%w %h', flat]).toString().split(' ').map(Number)
    const shadeMap = join(work, `${name}-shade.png`)
    magick(['-size', '256x1', 'xc:', '-fx', `${1 - shade}+${shade}*cos(3.1416*(i/w-0.5)*1.7)`, '-resize', `${w}x${h}!`, shadeMap])
    // -channel RGB : ne multiplier QUE les couleurs, garder l'alpha de
    // l'etiquette (sinon les coins arrondis transparents deviennent gris)
    magick([flat, shadeMap, '-channel', 'RGB', '-compose', 'multiply', '-composite', '+channel', shaded])
  } else {
    magick([flat, shaded])
  }

  // 3. courbure : enroulement reel sur le cylindre (axe vertical par defaut ;
  // crayon = cylindre horizontal, on tourne l'etiquette pour le warp)
  if (fov > 0) {
    if (axis === 'h') {
      magick([shaded, '-rotate', '90', '-alpha', 'set', '-virtual-pixel', 'transparent',
        '-distort', 'Plane2Cylinder', String(fov), '-rotate', '-90', warped])
    } else {
      magick([shaded, '-alpha', 'set', '-virtual-pixel', 'transparent',
        '-distort', 'Plane2Cylinder', String(fov), warped])
    }
  } else {
    magick([shaded, warped])
  }

  // 4. alignement a l'objet (pente du fut, inclinaison du cahier)
  magick([warped, '-background', 'none', '-rotate', String(rotate), '+repage', rotated])

  // 5. ombre de contact : silhouette noire floutee, decalee vers le bas
  magick([rotated, '-background', 'black', '-shadow', '45x3+0+5', shadow])

  // 6. composite ombre PUIS etiquette, centres sur le point de pose
  const [lw, lh] = magick(['identify', '-format', '%w %h', rotated]).toString().split(' ').map(Number)
  const [sw, sh] = magick(['identify', '-format', '%w %h', shadow]).toString().split(' ').map(Number)
  const px = Math.round(center[0] - lw / 2), py = Math.round(center[1] - lh / 2)
  const sx = Math.round(center[0] - sw / 2), sy = Math.round(center[1] - sh / 2 + 3)
  magick([join(SRC, photo),
    shadow, '-geometry', `+${sx}+${sy}`, '-composite',
    rotated, '-geometry', `+${px}+${py}`, '-composite',
    '-quality', '82', out])
  console.log(`  mockup-${name}.webp : etiquette ${lw}x${lh} posee en [${center}] (fov ${fov || 'plat'})`)
}

for (const m of MOCKUPS) compose(m)
console.log('mockups composes ->', OUT)
