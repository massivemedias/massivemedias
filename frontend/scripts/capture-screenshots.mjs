/**
 * capture-screenshots.mjs - Captures portfolio web (desktop + mobile)
 *
 * Genere une capture DESKTOP et une capture MOBILE d'un site, les convertit
 * en webp (q80) et les ecrit au nommage attendu par webProjects
 * (frontend/src/data/services.js).
 *
 * Chaque capture est ecrite dans les DEUX dossiers (convention Massive) :
 *   public/images/<chemin>         (full, 1600px)
 *   public/images/thumbs/<chemin>  (thumb, 800px)
 * IMPORTANT : a l'affichage, webProjects passe par thumb() qui lit la version
 * thumbs/. Les deux dossiers sont donc obligatoires (sinon 404 a l'affichage).
 *
 * Usage UNITAIRE :
 *   npm run capture -- <url> <nom> [dossier]
 *   ex : npm run capture -- https://jprunier.com jprunier
 *   -> ecrit <dossier>/<nom>.webp (desktop) + <dossier>/<nom>_mobile.webp (mobile)
 *      (dossier defaut: web). Relancer avec le meme <nom> rafraichit.
 *
 * Mode BATCH (tout le portfolio) : npm run capture:all (cf capture-all.mjs).
 *
 * Expose launchBrowser() + captureOne() reutilises par le mode batch.
 * Reutilise Puppeteer + Sharp deja en stack (meme pattern de lancement que
 * scripts/prerender.mjs).
 */
import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = join(__dirname, '..', 'public')

// Cibles de capture. Le desktop est un viewport laptop standard, le mobile un
// iPhone (deviceScaleFactor 2 -> sortie ~828px de large, ratio aligne sur les
// captures _mobile existantes du portfolio).
const DESKTOP = { label: 'desktop', width: 1440, height: 900, dsf: 2, isMobile: false }
const MOBILE = { label: 'mobile', width: 414, height: 896, dsf: 2, isMobile: true }

const FULL_WIDTH = 1600   // largeur full (images/<chemin>)
const THUMB_WIDTH = 800   // largeur thumb (images/thumbs/<chemin>) - lue par thumb()
const QUALITY = 80        // webp q80, convention Massive
const NAV_TIMEOUT = 45000
// Attente FIXE apres le chargement (networkidle) et AVANT la capture. Laisse le
// contenu asynchrone s'afficher : apps React/Angular, loaders, agregation de
// donnees (ex Sonaa "Aggregating frequencies", SPVM a moitie blanc si capture
// trop tot). Ceinture-bretelles avec networkidle2. Appliquee a CHAQUE passe :
// desktop et mobile chargent chacun leur propre viewport (layout mobile fidele,
// et les sites qui re-render au resize - comme Sonaa qui relance son loader -
// ne cassent pas). Donc payee 2x par site. Ajustable ici (Mika peut la baisser
// plus tard sans fouiller le reste du script).
const WAIT_MS = 30000

// Lance Puppeteer (meme pattern que prerender.mjs). Reutilise par l'unitaire
// ET le batch (un seul browser pour toute la boucle -> RAM maitrisee).
export async function launchBrowser() {
  const { default: puppeteer } = await import('puppeteer')
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=fr-CA'],
  })
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// Charge l'url au viewport de la cible, attend WAIT_MS que le contenu async
// s'affiche, puis retourne le buffer PNG. Chaque cible (desktop/mobile) a sa
// PROPRE passe de chargement -> le layout mobile est rendu a 414px des le
// depart (fidele), et les sites qui re-render/relancent un loader au resize ne
// posent pas de probleme.
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
    await wait(WAIT_MS)
    // fullPage false : on capture le viewport (haut de page, facon hero).
    return await page.screenshot({ type: 'png', fullPage: false })
  } finally {
    await page.close().catch(() => {})
  }
}

// Ecrit un buffer en webp dans les deux dossiers a partir d'un chemin relatif
// a /images (ex 'web/sonaa.webp') : full dans images/<rel>, thumb dans
// images/thumbs/<rel>. publicDir permet de rediriger la sortie (staging/test).
async function writeImage(buffer, relImage, publicDir) {
  const fullPath = join(publicDir, 'images', relImage)
  const thumbPath = join(publicDir, 'images', 'thumbs', relImage)
  mkdirSync(dirname(fullPath), { recursive: true })
  mkdirSync(dirname(thumbPath), { recursive: true })
  const full = await sharp(buffer)
    .resize({ width: FULL_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(fullPath)
  const thumb = await sharp(buffer)
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(thumbPath)
  return [
    { path: `images/${relImage}`, w: full.width, h: full.height },
    { path: `images/thumbs/${relImage}`, w: thumb.width, h: thumb.height },
  ]
}

/**
 * Capture desktop + mobile d'une url et ecrit aux chemins fournis (relatifs a
 * /images, ex 'web/sonaa.webp'). mobileFile est optionnel (skip si absent ->
 * projet sans phoneScreenshot). Ecriture UNIQUEMENT en cas de succes : une
 * capture manuelle existante reste intacte si la capture echoue (fallback).
 * Reutilise le browser passe (l'appelant gere launch/close).
 * Retourne { written: [...], failures: n }.
 */
export async function captureOne({ browser, url, desktopFile, mobileFile, publicDir = PUBLIC }) {
  const written = []
  let failures = 0
  const jobs = [{ target: DESKTOP, file: desktopFile }]
  if (mobileFile) jobs.push({ target: MOBILE, file: mobileFile })
  for (const job of jobs) {
    try {
      const buffer = await shoot(browser, job.target, url)
      written.push(...await writeImage(buffer, job.file, publicDir))
    } catch (err) {
      failures += 1
      console.error(`  echec ${job.target.label} (${url}) : ${err?.message || err} -> fichier existant conserve`)
    }
  }
  return { written, failures }
}

function usage(msg) {
  if (msg) console.error(`\nErreur : ${msg}`)
  console.error('\nUsage : npm run capture -- <url> <nom> [dossier]')
  console.error('  <url>      URL complete du site (https://...)')
  console.error('  <nom>      nom de fichier sans extension (ex jprunier)')
  console.error('  [dossier]  sous-dossier de public/images (defaut: web)')
  console.error('\nGenere <nom>.webp + <nom>_mobile.webp dans')
  console.error('public/images/<dossier>/ ET public/images/thumbs/<dossier>/')
  console.error('\nPour TOUT le portfolio d\'un coup : npm run capture:all\n')
  process.exit(1)
}

async function main() {
  const [url, name, folderArg] = process.argv.slice(2)
  if (!url || !name) usage('arguments <url> et <nom> obligatoires')
  if (!/^https?:\/\//i.test(url)) usage(`url invalide : ${url}`)
  if (!/^[a-z0-9._-]+$/i.test(name)) usage(`nom invalide (lettres, chiffres, . _ - seulement) : ${name}`)
  const folder = folderArg && /^[a-z0-9/_-]+$/i.test(folderArg) ? folderArg : 'web'

  let browser
  let result = { written: [], failures: 0 }
  try {
    browser = await launchBrowser()
    console.log(`Capture de ${url} ...`)
    result = await captureOne({
      browser,
      url,
      desktopFile: `${folder}/${name}.webp`,
      mobileFile: `${folder}/${name}_mobile.webp`,
    })
  } catch (err) {
    console.error('Lancement Chromium a echoue :', err?.message || err)
    process.exit(1)
  } finally {
    if (browser) await browser.close().catch(() => {})
  }

  if (result.written.length) {
    console.log('\nFichiers ecrits :')
    for (const f of result.written) console.log(`  ${f.path}  (${f.w}x${f.h})`)
  }
  if (result.failures > 0) {
    console.error(`\n${result.failures} capture(s) en echec.`)
    process.exit(1)
  }
  console.log('\nTermine. A referencer dans webProjects (data/services.js) :')
  console.log(`  screenshot:      thumb('/images/${folder}/${name}.webp'),`)
  console.log(`  phoneScreenshot: thumb('/images/${folder}/${name}_mobile.webp'),`)
}

// N'execute le CLI unitaire QUE si le fichier est lance directement (pas
// quand il est importe par capture-all.mjs).
const invoked = process.argv[1] ? resolve(process.argv[1]) : ''
if (invoked === fileURLToPath(import.meta.url)) main()
