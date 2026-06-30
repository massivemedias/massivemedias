/**
 * capture-all.mjs - Mode BATCH du script de capture portfolio.
 *
 * Lit le tableau webProjects de src/data/services.js (source LOCALE ; le CMS
 * webProjectsFr de Strapi n'est pas accessible depuis un script local) et
 * genere les captures desktop + mobile de CHAQUE projet ayant une url, aux
 * chemins EXACTS de ses champs screenshot / phoneScreenshot (certains projets
 * sortent du pattern <nom>/<nom>_mobile, ex jprunier -> realisations/...).
 *
 * Pourquoi on parse le source au lieu d'importer le module : services.js
 * importe paths.js qui lit import.meta.env (Vite) -> non importable en Node.
 * On extrait donc le tableau du source et on l'evalue avec thumb() stubbe en
 * identite, ce qui laisse screenshot/phoneScreenshot a leur chemin /images/...
 *
 * Sequentiel : un seul browser Puppeteer pour toute la boucle (RAM maitrisee).
 * Un echec sur un site est logue, n'ecrase pas sa capture existante (fallback)
 * et n'arrete PAS les autres. Resume final reussis / ignores / echecs.
 *
 * Usage :
 *   npm run capture:all
 *   node scripts/capture-all.mjs --out <dir>   (sortie staging/test au lieu de public)
 */
import { readFileSync } from 'fs'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { launchBrowser, captureOne } from './capture-screenshots.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SERVICES = join(__dirname, '..', 'src', 'data', 'services.js')

// Extrait le 1er tableau literal `<key>: [ ... ]` du source en equilibrant les
// crochets (string-aware), pour ne pas dependre de l'import du module Vite.
function extractArrayLiteral(src, key) {
  const keyIdx = src.indexOf(key + ':')
  if (keyIdx < 0) return null
  const start = src.indexOf('[', keyIdx)
  if (start < 0) return null
  let depth = 0
  let inStr = null
  let esc = false
  for (let i = start; i < src.length; i++) {
    const c = src[i]
    if (inStr) {
      if (esc) { esc = false; continue }
      if (c === '\\') { esc = true; continue }
      if (c === inStr) inStr = null
      continue
    }
    if (c === '\'' || c === '"' || c === '`') { inStr = c; continue }
    if (c === '[') depth += 1
    else if (c === ']') {
      depth -= 1
      if (depth === 0) return src.slice(start, i + 1)
    }
  }
  return null
}

// Chemin relatif a /images depuis un champ screenshot / phoneScreenshot
// (ex '/images/web/sonaa.webp' -> 'web/sonaa.webp').
function toRelImage(p) {
  if (!p) return null
  const s = String(p).replace(/\?.*$/, '').replace('/images/thumbs/', '/images/')
  const m = s.match(/images\/(.+)$/)
  return m ? m[1] : null
}

// Lit webProjects sans importer le module (cf entete). thumb() stubbe en
// identite -> les champs image restent leur chemin /images/... brut.
function loadWebProjects() {
  const src = readFileSync(SERVICES, 'utf8')
  const literal = extractArrayLiteral(src, 'webProjects')
  if (!literal) throw new Error('tableau webProjects introuvable dans services.js')
  // eslint-disable-next-line no-new-func
  const build = new Function('thumb', `return ${literal}`)
  const arr = build((p) => p)
  if (!Array.isArray(arr)) throw new Error('webProjects n\'est pas un tableau')
  return arr
}

async function main() {
  // Flag optionnel --out <dir> : redirige la sortie (staging/test) au lieu de public/.
  const args = process.argv.slice(2)
  const outIdx = args.indexOf('--out')
  const publicDir = outIdx >= 0 && args[outIdx + 1] ? resolve(args[outIdx + 1]) : undefined

  let projects
  try {
    projects = loadWebProjects()
  } catch (err) {
    console.error('Lecture de webProjects a echoue :', err?.message || err)
    process.exit(1)
  }
  console.log(`${projects.length} projets dans webProjects.${publicDir ? ` Sortie -> ${publicDir}` : ''}\n`)

  const ok = []
  const failed = []
  const skipped = []
  let browser
  try {
    browser = await launchBrowser()
    for (const p of projects) {
      const label = p.name || p.url || '(sans nom)'
      if (!p.url) {
        console.log(`skip ${label} : pas d'url`)
        skipped.push(label)
        continue
      }
      const desktopFile = toRelImage(p.screenshot)
      if (!desktopFile) {
        console.log(`skip ${label} : screenshot illisible`)
        skipped.push(label)
        continue
      }
      const mobileFile = toRelImage(p.phoneScreenshot)
      console.log(`${label} (${p.url})`)
      console.log(`  desktop -> ${desktopFile}${mobileFile ? `\n  mobile  -> ${mobileFile}` : '\n  (pas de phoneScreenshot, desktop seul)'}`)
      const { failures } = await captureOne({ browser, url: p.url, desktopFile, mobileFile, publicDir })
      if (failures > 0) failed.push(label)
      else ok.push(label)
    }
  } catch (err) {
    console.error('Lancement Chromium a echoue :', err?.message || err)
    process.exit(1)
  } finally {
    if (browser) await browser.close().catch(() => {})
  }

  console.log('\n=== Resume ===')
  console.log(`reussis : ${ok.length}${ok.length ? ` (${ok.join(', ')})` : ''}`)
  if (skipped.length) console.log(`ignores : ${skipped.length} (${skipped.join(', ')})`)
  if (failed.length) {
    console.log(`echecs  : ${failed.length} (${failed.join(', ')})`)
    process.exit(1)
  }
}

main()
