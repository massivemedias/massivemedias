/**
 * NEVER_PUBLISH - liste d'exclusion PERMANENTE (verdict Mika, 16 juillet 2026).
 *
 * ============================ REGLE PERMANENTE ============================
 * Les designs de personnages / marques SOUS LICENCE ne remontent JAMAIS au
 * catalogue public, PEU IMPORTE les synchronisations futures du Drive.
 * Motif : risque IP + risque Stripe (compte marchand).
 *
 * Ils vivent dans l'archive de production de Mika (Google Drive) mais ne
 * doivent JAMAIS :
 *   - entrer dans data/massiveStickers.js (catalogue),
 *   - recevoir un SKU (sku-registry backend),
 *   - apparaitre sur /stickers, dans les familles, le hero, les packs,
 *   - entrer dans KIDS_SAFE / Mini Massive.
 *
 * CE FICHIER EST LE GARDE-FOU QUI SURVIT AUX SYNCS ET AUX SESSIONS.
 * Toute sync catalogue (Drive -> site) DOIT filtrer avec `isNeverPublish()`
 * AVANT de proposer un design a l'ajout. Ne jamais retirer une entree sans
 * un verdict ecrit de Mika.
 *
 * Difference avec stickersModeration.js (HIDDEN_STICKERS) : celui-la masque des
 * designs NOTRES deja au catalogue (moderation NSFW, reversible). NEVER_PUBLISH
 * empeche des designs TIERS d'entrer au catalogue (IP, definitif).
 * ==========================================================================
 *
 * Le matching se fait sur le NOM DE FICHIER SOURCE du Drive (normalise), parce
 * que ces designs n'ont pas de slug : ils ne sont jamais entres au catalogue.
 */

/** Noms de fichiers Drive (sans extension, normalises) interdits de publication. */
export const NEVER_PUBLISH_FILES = new Set([
  // --- Nintendo ---
  'sticker mario',
  'sticker mario fight',
  'sticker mario et plante',
  'sticker pikajaune',        // Pikachu / Pokemon

  // --- Disney ---
  'sticker mickey cerveau',
  'sticker alien mickey',

  // --- Fox / Simpsons ---
  'sticker simpson clown',
  'sticker homer pieuvre',
  'sticker lisa',

  // --- MGM ---
  'sticker pink panther',

  // --- Films / franchises ---
  'sticker terminator',
  'sticker predator1',
  'sticker predataure',       // Predator
  'sticker conan',
  'sticker hellboy',
  'sticker bettlejuice',      // Beetlejuice
  'sticker robocopon',        // Robocop
  'sticker redrum',           // The Shining
  'sticker asian godzilla',   // Toho
  'sticker harry1',           // Harry Potter
  // Pulp Fiction
  'sticker john travolta',
  'sticker mia wallace',
  // Le Cinquieme Element
  'sticker leeloo',
  'sticker zorg',
  'sticker mangalor',
  'sticker mondoshawan',

  // --- Musique (artistes / groupes) ---
  'sticker daft',             // Daft Punk
  'sticker fatboyslim',
  'sticker the prodigy',

  // --- Marques ---
  'sticker macdo',            // McDonald's

  // --- Personnes reelles (droit a l'image) ---
  'sticker frida',            // Frida Kahlo
  'sticker donald trump',     // + politiquement charge
  'sticker edouard',          // Edward aux mains d'argent (Johnny Depp)

  // ====================================================================
  // AJOUTS DU SCAN VISUEL COMPLET DES 148 NOUVEAUX (16 juillet).
  // LEÇON : le filtre par NOM est INFIABLE. Ces 30 ont ete identifies
  // seulement en REGARDANT les images (montages ImageMagick). Un nom
  // comme "Vega", "buldo", "ca 3", "Sleep" ou "Ronds jaunes" ne dit rien.
  // TOUT nouveau lot DOIT passer par un scan visuel avant publication.
  // ====================================================================

  // --- Nintendo / Pokemon ---
  'sticker warrio',           // Wario
  'sticker sleep',            // Snorlax ("I choose to sleep")
  'sticker buldo',            // Blastoise
  'sticker fish game',        // carte Pokemon (Magikarp)
  'sticker ronds jaunes',     // Masque de Majora (Zelda)
  'sticker player ready',     // Game Boy
  'sticker goth6',            // fantomes Boo dans la compo

  // --- Viacom / Nickelodeon ---
  'sticker bob leponge',      // SpongeBob
  'sticker bob hello',        // Ghostface + SpongeBob
  'sticker vert et rose',     // GIR (Invader Zim) + cochon

  // --- Warner / DC ---
  'sticker gollum',           // Le Seigneur des Anneaux
  'sticker gremlins',
  'sticker joker fume',       // Joker (DC)
  'sticker joker gros nez',   // Joker (DC)
  'sticker mechant',          // Bane (Batman)

  // --- Horreur / franchises ---
  'sticker ca 3',             // Pennywise (Ca)
  'sticker goth13',           // Ghostface (Scream)
  'sticker peuple',           // collage de tueurs (Myers/Ghostface/Chucky/Jason)

  // --- Autres franchises ---
  'sticker vega',             // Freezer (Dragon Ball)
  'sticker triple face',      // Sans-Visage (Ghibli, Le Voyage de Chihiro)
  'sticker alien vert2',      // Xenomorph (Alien, Fox)
  'sticker surfer boy',       // van Surfer Boy Pizza (Stranger Things)
  'sticker coyote',           // trop proche de Wile E. Coyote (Looney Tunes)

  // --- Marques ---
  'sticker play',             // manette / symboles PlayStation (Sony)
  'sticker volk skull',       // combi Volkswagen
  'sticker ricard rats',      // Ricard (Pernod Ricard)
  'sticker ici c\'est paris', // slogan + maillot PSG
  'sticker trou du diable',   // brasserie Le Trou du Diable (QC)
  'sticker 8day',             // logo de marque tierce
  'sticker catarsis',         // logo clothing co. tiers
  'sticker mas',              // logo "mas" tiers
])

/**
 * Marques de materiel audio : gamme "Synth Stickers" = concept produit SEPARE,
 * et les noms/designs sont des marques deposees (Roland, Elektron, Teenage
 * Engineering, Make Noise, Erica Synths). Hors catalogue public par defaut.
 */
export const SYNTH_GEAR_FILES = new Set([
  'sticker op-1',
  'sticker tr808',
  'sticker tr909',
  'sticker roland',
  'sticker digitakt2',
  'sticker machinedrum',
  'sticker 0coast',
  'sticker erica synth',
])

/** Normalise un nom de fichier Drive pour le matching (casse, extension, espaces). */
export const normalizeFileName = (name) =>
  String(name || '')
    .replace(/\.(png|jpg|jpeg|psd|webp)$/i, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

/**
 * true si ce fichier Drive ne doit JAMAIS entrer au catalogue public.
 * A appeler dans TOUTE sync catalogue avant de proposer un ajout.
 */
export const isNeverPublish = (fileName) => {
  const n = normalizeFileName(fileName)
  return NEVER_PUBLISH_FILES.has(n) || SYNTH_GEAR_FILES.has(n)
}

/** Filtre une liste de noms de fichiers Drive : retire tout ce qui est interdit. */
export const filterNeverPublish = (fileNames) =>
  (fileNames || []).filter((f) => !isNeverPublish(f))
