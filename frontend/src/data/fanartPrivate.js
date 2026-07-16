/**
 * FANART_PRIVATE - fan-art perso de Mika (verdict Mika, 16 juillet 2026).
 *
 * ====================== LIBELLE OFFICIEL (Mika) ======================
 * "Fan-art perso, JAMAIS commercialisable en ligne, vente main-a-main
 *  seulement."
 * =====================================================================
 *
 * Ce sont des designs que Mika a dessines lui-meme, mais qui representent des
 * personnages / marques appartenant a des tiers (Nintendo, Viacom, Warner, DC,
 * Ghibli, Sony, Volkswagen, PSG...). Ils restent ARCHIVES dans son Drive et
 * peuvent exister physiquement, mais ils ne doivent JAMAIS :
 *   - entrer dans data/massiveStickers.js (catalogue),
 *   - recevoir un SKU / etre vendables en ligne (risque IP + risque Stripe),
 *   - apparaitre sur /stickers, familles, hero, packs, Mini Massive.
 *
 * Cette liste est le PENDANT de neverPublish.js : meme mecanique permanente,
 * meme survie aux syncs futures et aux prochaines sessions.
 *   - neverPublish.js  = le GARDE-FOU technique (isNeverPublish -> bloque).
 *   - fanartPrivate.js = la MEMOIRE metier (quoi, quel ayant droit, pourquoi).
 *
 * ============================ LEÇON CLE ============================
 * Ces 33 designs ont ete trouves par SCAN VISUEL des images, PAS par leur nom.
 * Un nom comme "Vega", "buldo", "ca 3", "Sleep" ou "Ronds jaunes" ne revele
 * RIEN. TOUT nouveau lot du Drive DOIT passer un scan visuel avant publication.
 * ===================================================================
 */

/** Fan-art perso : {fichier Drive, ce que c'est, ayant droit}. */
export const FANART_PRIVATE = [
  // --- Nintendo / Pokemon ---
  { file: 'Sticker Warrio.png', sujet: 'Wario', ayantDroit: 'Nintendo' },
  { file: 'Sticker Sleep', sujet: 'Snorlax ("I choose to sleep")', ayantDroit: 'Nintendo / The Pokemon Company' },
  { file: 'Sticker buldo.png', sujet: 'Blastoise', ayantDroit: 'Nintendo / The Pokemon Company' },
  { file: 'Sticker Fish Game.png', sujet: 'Carte Pokemon (Magikarp)', ayantDroit: 'Nintendo / The Pokemon Company' },
  { file: 'Sticker Ronds jaunes.png', sujet: 'Masque de Majora (Zelda)', ayantDroit: 'Nintendo' },
  { file: 'Sticker Player Ready.png', sujet: 'Game Boy', ayantDroit: 'Nintendo' },
  { file: 'Sticker Goth6.png', sujet: 'Fantomes Boo dans la composition', ayantDroit: 'Nintendo' },

  // --- Viacom / Nickelodeon ---
  { file: 'Sticker Bob leponge.png', sujet: 'Bob l\'eponge (SpongeBob)', ayantDroit: 'Viacom / Nickelodeon' },
  { file: 'Sticker bob hello.png', sujet: 'Ghostface + Bob l\'eponge', ayantDroit: 'Paramount + Viacom' },
  { file: 'Sticker vert et rose.png', sujet: 'GIR (Invader Zim) + cochon', ayantDroit: 'Viacom / Nickelodeon' },

  // --- Warner / DC ---
  { file: 'Sticker Gollum.png', sujet: 'Gollum (Le Seigneur des Anneaux)', ayantDroit: 'Warner / Tolkien Estate' },
  { file: 'Sticker Gremlins.png', sujet: 'Gremlin', ayantDroit: 'Warner Bros' },
  { file: 'Sticker Joker fume.png', sujet: 'Joker', ayantDroit: 'DC Comics / Warner' },
  { file: 'Sticker Joker gros nez.png', sujet: 'Joker', ayantDroit: 'DC Comics / Warner' },
  { file: 'Sticker Mechant.png', sujet: 'Bane (Batman)', ayantDroit: 'DC Comics / Warner' },

  // --- Horreur / franchises ---
  { file: 'Sticker ca 3.png', sujet: 'Pennywise (Ca)', ayantDroit: 'Warner / Stephen King' },
  { file: 'Sticker Goth13.png', sujet: 'Ghostface (Scream)', ayantDroit: 'Paramount' },
  { file: 'Sticker peuple.png', sujet: 'Collage de tueurs (Myers, Ghostface, Chucky, Jason...)', ayantDroit: 'multiples (Universal, Paramount, MGM...)' },

  // --- Autres franchises ---
  { file: 'Sticker Vega', sujet: 'Freezer (Dragon Ball)', ayantDroit: 'Toei / Bird Studio / Shueisha' },
  { file: 'Sticker triple face.png', sujet: 'Sans-Visage (Le Voyage de Chihiro)', ayantDroit: 'Studio Ghibli' },
  { file: 'Sticker Alien vert2.png', sujet: 'Xenomorph (Alien)', ayantDroit: '20th Century / Disney' },
  { file: 'Sticker Surfer boy', sujet: 'Van Surfer Boy Pizza (Stranger Things)', ayantDroit: 'Netflix' },
  { file: 'Sticker Coyote.png', sujet: 'Coyote tres proche de Wile E. Coyote', ayantDroit: 'Warner (Looney Tunes)', conteste: true },

  // --- Marques ---
  { file: 'Sticker play.png', sujet: 'Manette / symboles PlayStation', ayantDroit: 'Sony' },
  { file: 'Sticker Volk skull.png', sujet: 'Combi Volkswagen', ayantDroit: 'Volkswagen' },
  { file: 'Sticker Ricard Rats.png', sujet: 'Ricard', ayantDroit: 'Pernod Ricard' },
  { file: 'Sticker Ici c\'est paris.png', sujet: 'Slogan + maillot PSG', ayantDroit: 'Paris Saint-Germain' },
  { file: 'Sticker Trou du diable.png', sujet: 'Brasserie Le Trou du Diable', ayantDroit: 'Le Trou du Diable (QC)' },
  { file: 'Sticker 8day.png', sujet: 'Logo de marque tierce', ayantDroit: '8day', conteste: true },
  { file: 'Sticker Catarsis.png', sujet: 'Logo clothing co. tiers sur un camion', ayantDroit: 'a identifier', conteste: true },
  { file: 'Sticker Mas.png', sujet: 'Logo "mas" tiers', ayantDroit: 'a identifier', conteste: true },

  // --- Personnes reelles (droit a l'image) ---
  { file: 'Sticker Donald Trump.png', sujet: 'Donald Trump (+ politiquement charge)', ayantDroit: 'droit a l\'image' },
  { file: 'Sticker Edouard.png', sujet: 'Edward aux mains d\'argent (Johnny Depp)', ayantDroit: '20th Century / droit a l\'image' },
]

/** Les 4 verdicts CONTESTES par Mika : bloques par defaut en attendant son oeil. */
export const FANART_CONTESTED = FANART_PRIVATE.filter((e) => e.conteste)

/** Libelle officiel a afficher partout ou cette liste est expliquee. */
export const FANART_PRIVATE_LABEL =
  'Fan-art perso, jamais commercialisable en ligne, vente main-a-main seulement.'
