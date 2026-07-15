// ============================================================================
// ETIQUETTES (nouveau produit, chantier ETIQUETTES Phase 1, 14 juillet 2026)
// Etiquettes d'identification personnalisees pour enfants : un sticker de la
// collection + un rectangle arrondi assorti portant le nom de l'enfant,
// l'ensemble decoupe en UNE etiquette die-cut sur le pipeline Cameo.
//
// TOUT est derriere ETIQUETTES_ENABLED (config/etiquettesStatus.js) tant que le
// test physique lave-vaisselle de Mika n'est pas concluant.
// ============================================================================

/**
 * KIDS_SAFE : la curation "enfants" de la collection (270 -> ~75).
 *
 * CRITERES D'INCLUSION : mignon, colore, lisible en petit (l'etiquette mini
 * fait 9 mm de haut), sujets aimes des enfants (animaux cute, aliens
 * sympathiques, robots, fun & food, personnages doux).
 * CRITERES D'EXCLUSION (verdicts commentes en bas de fichier) : dark / skulls /
 * zombies / demons, drogue-fumee (y compris slugs "lsd", "smoke", geishas
 * fumeuses), armes / violence / bourreau / duel, suggestif / pin-up,
 * vulgarite, tristesse morbide, attitude ("pas touche", "paye-moi").
 *
 * LISTE EDITABLE : Mika ajuste librement. Chaque slug doit exister dans
 * MASSIVE_STICKERS (data/massiveStickers.js) ; apres TOUT ajout, relancer
 *   node scripts/generate-etiquettes-palettes.mjs
 * pour generer les combos de couleurs auto-assorties du nouveau design.
 */
export const KIDS_SAFE = [
  // --- Animaux cute (le gisement principal) ---
  'massive-animals-meeting', 'massive-animals', 'massive-beau-oiseau',
  'massive-bois-diplo', 'massive-boom1', 'massive-canardos', 'massive-chame',
  'massive-chameleon-bois', 'massive-chameleon-branche', 'massive-chameleon-skate',
  'massive-chameleon', 'massive-chat-aquarium', 'massive-chat-chameleon',
  'massive-chat-deco', 'massive-chat-oeils', 'massive-chat-poisson-papillon',
  'massive-chenille', 'massive-chien-liseur', 'massive-cochon',
  'massive-cute-chien', 'massive-cute-ourson', 'massive-elephant-ramen',
  'massive-escargot', 'massive-fire-with-pet', 'massive-fox', 'massive-frog-tired',
  'massive-grenouille-mouche', 'massive-grenouille-reel', 'massive-grenouille',
  'massive-grosse-vache', 'massive-kapibara', 'massive-lapin', 'massive-loutre',
  'massive-lunette-duck', 'massive-mami-canard', 'massive-moino-cool',
  'massive-oiseau-ruche', 'massive-oiso-dessin', 'massive-oiso1', 'massive-oiso2',
  'massive-oizo', 'massive-ours-blanc', 'massive-ours2', 'massive-panda-cute',
  'massive-papillon', 'massive-paresseux', 'massive-pengouin-cactus',
  'massive-peroquet', 'massive-petit-chien', 'massive-pigeon-gris',
  'massive-pirate-pengouin', 'massive-poisson-chat', 'massive-poisson-inquiet',
  'massive-poisson-rose', 'massive-poisson-rouge', 'massive-poulet-lunette',
  'massive-poulpe', 'massive-poulpon', 'massive-racoon', 'massive-renard',
  'massive-requin', 'massive-rhino-relax', 'massive-rhino', 'massive-rhino2',
  'massive-tiger', 'massive-tortue', 'massive-velociraptor',
  'massive-ver-et-pomme', 'massive-ver',
  // --- Fun & food ---
  'massive-hotdog', 'massive-mais', 'massive-ramen', 'massive-run',
  'massive-slowride', 'massive-treasue-talker',
  // --- Aliens sympathiques, espace & robots ---
  'massive-alien-bleu', 'massive-alien-calote', 'massive-alien-hot',
  'massive-alien-vert', 'massive-astro', 'massive-astrodisco',
  'massive-astronaute-spain', 'massive-chat-alien', 'massive-chat-enlevement',
  'massive-chat-roux-soucoupe', 'massive-dragon-firefly', 'massive-monstre-dormeur',
  'massive-ptit-robot', 'massive-robot-qui-court', 'massive-soucoupe',
  // --- Personnages doux ---
  'massive-bonet', 'massive-kouklikou', 'massive-meme', 'massive-mimi-gris',
  'massive-mimi', 'massive-poskai', 'massive-pretty', 'massive-piraton',
]

/*
 * EXCLUSIONS notables (motifs, pour que la curation soit auditable) :
 * dark/skulls/zombies/demons : TOUTE la categorie 'dark' + basketball-man (Dunk
 *   zombie), biker (fantome), guitariste (Riff zombie), rousse (Zombie glace),
 *   statue-liberte (Liberte zombie), leprochaune (Lutin damne), dame-masque
 *   (Dame demon), rechercheur (Alambic maudit), arte-moderno (Jardin crane)
 * drogue / fumee : chat-lsd, chat-lsd2, chat-lsd3 (slug "lsd"), smoke (Brume
 *   rose), adian-fumeuse (Geisha fumeuse) et l'essentiel de 'asiatique'
 * armes / violence : jack-le-faisant (Bourreau), rousse-couteau (lame),
 *   tete-de-noeud (Coup de masse), shark-hunter (chasseur), poulets (Duel),
 *   pirate-epee, marin-pirate (naufrage), moustique (enrage)
 * vulgaire / attitude : fuckyou (Paye-moi), couille, cacane (bombe aerosol /
 *   vandalisme), stickers-dont-touch-my-truck (Pas touche), wesh
 * suggestif : pinup-bleue, alien-hot RESTE (hot-dog, pas "hot" suggestif)
 * tristesse / malaise : canar-pleure (Canard triste), pigeon (Coeur brise),
 *   fille-pleure (Double visage), swim-card (Nage ou coule), gamer (Gamer mou),
 *   grumpy-comptable (Lundi matin), destructured-person (Rameur seul)
 * trippy / clivant enfants : l'essentiel de 'psyche', patins (Clown patineur),
 *   grizly (Grizzly fou), coagule (Koala punk), cochon-punk, chat-sans-poils,
 *   chauvesourie (Chauve-monstre), singe-teuffeur (rave), pig-chapeau
 *   (Parrain), alien-bizarre (Ventre ouvert), alien-corps (Festin macabre),
 *   cervo-robot (Cerveau bocal, aussi suspect IP), jade (portrait, pas kids)
 */

/**
 * FORMATS d'etiquettes : les 3 tailles du marche (references etudiees :
 * Colle a Moi, Mabel's Labels, StickerKid), dimensions REELLES imprimables
 * et decoupables sur la Cameo (die-cut rectangle arrondi, 300 dpi).
 * `sticker` = cote du carre reserve au design a gauche ; le rectangle du nom
 * occupe le reste, moins la gouttiere.
 */
export const ETIQUETTE_FORMATS = [
  // `w/h` en mm (production Cameo) ; `inW/inH` = equivalents POUCES commerciaux
  // (46mm=1,8 po, 9=0,35, 60=2,4, 18=0,7, 76=3, 25=1). AFFICHAGE PAR LANGUE
  // (decision Mika 1b) : FR/EN en pouces avec le mm discret en secondaire,
  // ES en metrique. Cf. formatDims() plus bas.
  // Les SACS ont disparu des usages (decision Mika 1b : tenue sur sac non
  // validee, aucune promesse tant que ce n'est pas teste).
  {
    id: 'mini',
    w: 46, h: 9, inW: '1,8', inH: '0,35', inWEn: '1.8', inHEn: '0.35',
    fr: 'Mini', en: 'Mini', es: 'Mini',
    usageFr: 'Crayons, ustensiles, petits objets',
    usageEn: 'Pencils, utensils, small items',
    usageEs: 'Lapices, utensilios, objetos pequenos',
  },
  {
    id: 'moyenne',
    w: 60, h: 18, inW: '2,4', inH: '0,7', inWEn: '2.4', inHEn: '0.7',
    fr: 'Moyenne', en: 'Medium', es: 'Mediana',
    usageFr: 'Cahiers, gourdes, boites a collation',
    usageEn: 'Notebooks, bottles, snack boxes',
    usageEs: 'Cuadernos, botellas, cajas de snacks',
  },
  {
    id: 'grande',
    w: 76, h: 25, inW: '3', inH: '1', inWEn: '3', inHEn: '1',
    fr: 'Grande', en: 'Large', es: 'Grande',
    usageFr: 'Boites a lunch, bacs, contenants',
    usageEn: 'Lunch boxes, bins, containers',
    usageEs: 'Loncheras, cajas, envases',
  },
]

/**
 * Dimensions affichees PAR LANGUE (decision Mika 1b) :
 *  FR : pouces (virgule) + mm discret  -> "2,4 × 0,7 po · 60 × 18 mm"
 *  EN : pouces (point) + mm discret    -> "2.4 × 0.7 in · 60 × 18 mm"
 *  ES : metrique                        -> "60 × 18 mm"
 */
export function formatDims(f, lang) {
  if (lang === 'es') return `${f.w} × ${f.h} mm`
  if (lang === 'en') return `${f.inWEn} × ${f.inHEn} in · ${f.w} × ${f.h} mm`
  return `${f.inW} × ${f.inH} po · ${f.w} × ${f.h} mm`
}
export function formatDimsShort(f, lang) {
  if (lang === 'es') return `${f.w} × ${f.h} mm`
  if (lang === 'en') return `${f.inWEn} × ${f.inHEn} in`
  return `${f.inW} × ${f.inH} po`
}

/**
 * PACKS : structure alignee sur le marche quebecois (Colle a Moi vend des
 * ensembles 83 a 218 etiquettes entre 22,50 $ et 46,50 $ ; Mabel's 15-44 $).
 * Nos couts pipeline : ~0,05-0,10 $ l'etiquette en materiel (vinyle + lamination).
 * PRIX PROPOSES (Mika tranche) - dual-source : ces montants devront etre
 * repliques dans le registre SKU backend en Phase 2 (SEC-04).
 */
export const ETIQUETTE_PACKS = [
  {
    id: 'essentiel',
    fr: 'Essentiel', en: 'Essential', es: 'Esencial',
    contenu: { mini: 12, moyenne: 14, grande: 4 }, // 30 etiquettes
    total: 30,
    price: 24,
    dFr: 'Le depart parfait : crayons, cahiers et boite a lunch.',
    dEn: 'The perfect starter: pencils, notebooks and lunch box.',
    dEs: 'El comienzo perfecto: lapices, cuadernos y lonchera.',
  },
  {
    id: 'rentree',
    fr: 'Rentrée', en: 'Back to School', es: 'Vuelta al cole',
    contenu: { mini: 24, moyenne: 28, grande: 8 }, // 60 etiquettes
    total: 60,
    price: 34,
    populaire: true,
    dFr: 'Tout le materiel scolaire couvert, de l’etui a la boite a lunch.',
    dEn: 'Every school supply covered, from pencil case to lunch box.',
    dEs: 'Todo el material escolar cubierto, del estuche a la lonchera.',
  },
  {
    id: 'complet',
    fr: 'Complet', en: 'Complete', es: 'Completo',
    contenu: { mini: 40, moyenne: 46, grande: 14 }, // 100 etiquettes
    total: 100,
    price: 44,
    dFr: 'Ecole, garderie, sport et maison : la famille est equipee.',
    dEn: 'School, daycare, sports and home: the whole family is set.',
    dEs: 'Escuela, guarderia, deporte y casa: toda la familia lista.',
  },
]

/**
 * POLICES : SF Pro Rounded est proprietaire Apple (pas de licence web) ->
 * 3 jumelles libres (Google Fonts, chargees dans index.html). Mika tranche en
 * Phase 1 ; l'architecture accepte d'autres familles (ajouter ici + le <link>).
 */
/**
 * POLICES au choix du client (DECISION Mika 15 juillet : le configurateur
 * offre plusieurs fonts, pattern du marche).
 * - Baloo 2 : gardee (Google Fonts, OFL).
 * - Homemade Apple : ajoutee (Google Fonts, Apache 2.0 = OK commercial).
 * - Amelina Colette : ECARTEE - l'EULA 1001Fonts fournie est "Free For
 *   PERSONAL Use", usage commercial interdit sans licence achetee a l'auteur.
 *   Jamais de font sans droit commercial sur un produit vendu. Si Mika achete
 *   la licence : subsetter le TTF en woff2 local et l'ajouter ici.
 * `tooThinFormats` : formats ou la font est illisible A TAILLE REELLE
 * (traits trop fins pour impression + lamination + decoupe) -> grisee dans le
 * selecteur avec une note, pour qu'un parent ne commande jamais d'illisible.
 * Chargement SCOPE a la page Mini Massive via ETIQUETTE_FONTS_CSS_URL
 * (rien dans index.html, zero poids pour le reste du site).
 */
export const ETIQUETTE_FONTS = [
  { id: 'baloo', label: 'Baloo 2', family: "'Baloo 2', sans-serif", weight: 700, tooThinFormats: [] },
  { id: 'homemade-apple', label: 'Homemade Apple', family: "'Homemade Apple', cursive", weight: 400, tooThinFormats: ['mini'] },
]
export const ETIQUETTE_FONTS_CSS_URL = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@700&family=Homemade+Apple&display=swap'
export const FONT_TOO_THIN_NOTE = {
  fr: 'trop fine pour ce format',
  en: 'too thin for this size',
  es: 'demasiado fina para este formato',
}

/**
 * NOM DE PAGE : "Mini Massive" (DECISION Mika, 15 juillet 2026).
 * Le H1/breadcrumb utilisent PAGE_NAME_OPTIONS[PAGE_NAME_CHOICE] ; le title/meta
 * SEO composent nom de marque + requete Google ("Mini Massive - Étiquettes
 * personnalisées pour enfants | Massive") - les deux vivent ensemble.
 * L'entree de menu future (Phase 3 seulement) = "Mini Massive".
 * Les 2 options non retenues restent la, temoin de l'arbitrage.
 */
export const PAGE_NAME_OPTIONS = [
  {
    id: 'descriptif',
    fr: 'Étiquettes pour enfants', en: 'Kids Name Labels', es: 'Etiquetas para niños',
    note: 'SEO direct, comprehension immediate (pattern Colle a Moi / Mabel’s)',
  },
  {
    id: 'signature',
    fr: 'Colle ton nom', en: 'Stick Your Name', es: 'Pega tu nombre',
    note: 'Signature Massive, memorable, coherent avec le ton du site',
  },
  {
    id: 'sous-marque',
    fr: 'Mini Massive', en: 'Mini Massive', es: 'Mini Massive',
    note: 'Sous-marque extensible (pourra couvrir d’autres produits enfants)',
  },
]
export const PAGE_NAME_CHOICE = 2 // "Mini Massive" (verdict Mika)

/** La requete Google, accolee au nom de marque dans le title/meta SEO. */
export const PAGE_SEO_PRODUCT = {
  fr: 'Étiquettes personnalisées pour enfants',
  en: 'Custom Kids Name Labels',
  es: 'Etiquetas personalizadas para niños',
}

/**
 * ARGUMENTS PRODUIT HONNETES - AUCUNE promesse lave-vaisselle/laveuse tant que
 * le test physique n'est pas concluant. `pending: true` = claim PLACEHOLDER,
 * masque tant que ETIQUETTE_CLAIM_LAVE_VAISSELLE n'est pas active (Phase 3).
 */
export const ETIQUETTE_CLAIM_LAVE_VAISSELLE = false
export const ETIQUETTE_CLAIMS = [
  { icon: 'droplets', fr: 'Résiste à l’eau', en: 'Water resistant', es: 'Resistente al agua', pending: false },
  { icon: 'sun', fr: 'Résiste aux UV', en: 'UV resistant', es: 'Resistente a los UV', pending: false },
  { icon: 'shield', fr: 'Vinyle laminé premium', en: 'Premium laminated vinyl', es: 'Vinilo laminado premium', pending: false },
  { icon: 'scissors', fr: 'Découpe à la forme, coins arrondis', en: 'Die-cut, rounded corners', es: 'Corte a medida, esquinas redondeadas', pending: false },
  // Livraison : UNIQUEMENT ce qu'on tient (regle collection existante). Libelle
  // SIMPLIFIE (Mika, 15 juillet) - la verification codes H reste au checkout.
  { icon: 'truck', fr: 'Livraison gratuite à Montréal', en: 'Free delivery in Montreal', es: 'Entrega gratis en Montreal', pending: false },
  // PLACEHOLDER Phase 3 (s'active au verdict du test physique de Mika, 10 cycles en cours) :
  { icon: 'washing', fr: 'Passe au lave-vaisselle', en: 'Dishwasher safe', es: 'Apto lavavajillas', pending: true },
]

/** Prenoms d'exemple par langue (decision Mika 1b). */
export const SAMPLE_NAMES = { fr: 'Lyse', en: 'Kevin', es: 'Paolo' }
