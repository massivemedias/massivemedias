/**
 * capture-screenshots.mjs - Captures portfolio web (desktop + mobile)
 *
 * Genere une capture DESKTOP et une capture MOBILE d'un site, les convertit
 * en webp (q80) et les ecrit au nommage attendu par webProjects
 * (frontend/src/data/services.js) :
 *   <nom>.webp         -> champ `screenshot`      (desktop)
 *   <nom>_mobile.webp  -> champ `phoneScreenshot` (mobile)
 *
 * Chaque capture est ecrite dans les DEUX dossiers (convention Massive) :
 *   public/images/<dossier>/         (full, 1600px)
 *   public/images/thumbs/<dossier>/  (thumb, 800px)
 * IMPORTANT : a l'affichage, webProjects passe par thumb() qui lit la version
 * thumbs/. Les deux dossiers sont donc obligatoires (sinon 404 a l'affichage).
 *
 * Usage :
 *   npm run capture -- <url> <nom> [dossier]
 *   ex : npm run capture -- https://jprunier.com jprunier
 * Relancer avec le meme <nom> rafraichit (ecrase) les captures.
 *
 * Reutilise Puppeteer + Sharp deja en stack (meme pattern de lancement que
 * scripts/prerender.mjs).
 */
import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = join(__dirname, '..', 'public')

// Cibles de capture. Le desktop est un viewport laptop standard, le mobile un
// iPhone (deviceScaleFactor 2 -> sortie ~828px de large, ratio aligne sur les
// captures _mobile existantes du portfolio).
const DESKTOP = { label: 'desktop', width: 1440, height: 900, dsf: 2, isMobile: false, suffix: '' }
const MOBILE = { label: 'mobile', width: 414, height: 896, dsf: 2, isMobile: true, suffix: '_mobile' }

const FULL_WIDTH = 1600   // largeur full (public/images/<dossier>/)
const THUMB_WIDTH = 800   // largeur thumb (public/images/thumbs/<dossier>/) - lue par thumb()
const QUALITY = 80        // webp q80, convention Massive
const NAV_TIMEOUT = 45000
const SETTLE_MS = 1800    // delai post-networkidle pour polices + images lazy

function usage(msg) {
  if (msg) console.error(`\nErreur : ${msg}`)
  console.error('\nUsage : npm run capture -- <url> <nom> [dossier]')
  console.error('  <url>      URL complete du site (https://...)')
  console.error('  <nom>      nom de fichier sans extension (ex jprunier)')
  console.error('  [dossier]  sous-dossier de public/images (defaut: web)')
  console.error('\nGenere <nom>.webp (desktop) + <nom>_mobile.webp (mobile) dans')
  console.error('public/images/<dossier>/ ET public/images/thumbs/<dossier>/\n')
  process.exit(1)
}

// Capture une cible (desktop ou mobile) et retourne le buffer PNG brut.
async function shoot(browser, target, url) {
  const page = await browser.newPage()
  try {
    await page.setViewport({
      width: target.width,
      height: target.height,
      deviceScaleFactor: target.dsf,
      isMobile: target.isMobile,
      hasTouch: target.isMobile,
    })
    await page.goto(url, { waitUntil: 'networkidle2', timeout: NAV_TIMEOUT })
    await new Promise((resolve) => setTimeout(resolve, SETTLE_MS))
    // fullPage false : on capture le viewport (haut de page, facon hero).
    return await page.screenshot({ type: 'png', fullPage: false })
  } finally {
    await page.close().catch(() => {})
  }
}

// Ecrit le buffer en webp dans les deux dossiers (full + thumb). Retourne les
// chemins relatifs + dimensions finales pour le log.
async function writePair(buffer, folder, name, suffix) {
  const fullDir = join(PUBLIC, 'images', folder)
  const thumbDir = join(PUBLIC, 'images', 'thumbs', folder)
  mkdirSync(fullDir, { recursive: true })
  mkdirSync(thumbDir, { recursive: true })

  const file = `${name}${suffix}.webp`
  const full = await sharp(buffer)
    .resize({ width: FULL_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(join(fullDir, file))
  const thumb = await sharp(buffer)
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(join(thumbDir, file))

  return [
    { path: `images/${folder}/${file}`, w: full.width, h: full.height },
    { path: `images/thumbs/${folder}/${file}`, w: thumb.width, h: thumb.height },
  ]
}

async function main() {
  const [url, name, folderArg] = process.argv.slice(2)
  if (!url || !name) usage('arguments <url> et <nom> obligatoires')
  if (!/^https?:\/\//i.test(url)) usage(`url invalide : ${url}`)
  if (!/^[a-z0-9._-]+$/i.test(name)) usage(`nom invalide (lettres, chiffres, . _ - seulement) : ${name}`)
  const folder = folderArg && /^[a-z0-9/_-]+$/i.test(folderArg) ? folderArg : 'web'

  let puppeteer
  try {
    ({ default: puppeteer } = await import('puppeteer'))
  } catch (err) {
    console.error('Import de puppeteer a echoue :', err?.message || err)
    process.exit(1)
  }

  let browser
  let failures = 0
  const written = []
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=fr-CA'],
    })
    for (const target of [DESKTOP, MOBILE]) {
      try {
        console.log(`Capture ${target.label} de ${url} ...`)
        const buffer = await shoot(browser, target, url)
        // On ecrit UNIQUEMENT si la capture a reussi -> une capture manuelle
        // existante reste intacte en cas d'echec (fallback preserve).
        written.push(...await writePair(buffer, folder, name, target.suffix))
      } catch (err) {
        failures++
        console.error(`Echec capture ${target.label} : ${err?.message || err}`)
        console.error('  -> fichier existant conserve (aucune ecriture).')
      }
    }
  } catch (err) {
    console.error('Lancement Chromium a echoue :', err?.message || err)
    process.exit(1)
  } finally {
    if (browser) await browser.close().catch(() => {})
  }

  if (written.length) {
    console.log('\nFichiers ecrits :')
    for (const f of written) console.log(`  ${f.path}  (${f.w}x${f.h})`)
  }
  if (failures > 0) {
    console.error(`\n${failures} capture(s) en echec.`)
    process.exit(1)
  }
  console.log('\nTermine. A referencer dans webProjects (data/services.js) :')
  console.log(`  screenshot:      thumb('/images/${folder}/${name}.webp'),`)
  console.log(`  phoneScreenshot: thumb('/images/${folder}/${name}_mobile.webp'),`)
}

main()
