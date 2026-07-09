/**
 * STICKERS-UI-04 : micro-thumbs 160px pour les collages des cartes de
 * familles (affiches a ~64-90px, les thumbs 400px etaient surdimensionnes :
 * ~22 ko -> ~4 ko piece). Genere depuis les thumbs 400px existants pour
 * TOUS les designs du catalogue (FAMILY_COLLAGES reste librement ajustable).
 *
 * A RELANCER apres tout ajout au catalogue (comme fill-sticker-silhouettes).
 * Usage : node scripts/generate-mini-thumbs.mjs
 */
import sharp from 'sharp'
import { readdirSync, mkdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'public/images/thumbs/stickers-massive')
const OUT = join(ROOT, 'public/images/thumbs-mini/stickers-massive')
mkdirSync(OUT, { recursive: true })

const files = readdirSync(SRC).filter((f) => f.endsWith('.webp'))
let total = 0
for (const f of files) {
  await sharp(join(SRC, f)).resize(160, 160, { fit: 'inside' }).webp({ quality: 70 }).toFile(join(OUT, f))
  total += statSync(join(OUT, f)).size
}
console.log(`${files.length} micro-thumbs 160px generes, ${Math.round(total / 1024)} ko au total (moyenne ${Math.round(total / files.length / 1024 * 10) / 10} ko)`)
