// Textes explicatifs des series d'impression Studio vs Musee, en 3 langues.
// Modele : constants/workshop.js (objets { fr, en, es } consommes via tx()).
// SSOT, ne PAS dupliquer ces textes ailleurs dans le codebase.
//
// Regles de contenu (chantier TIERS-01) :
// - aucun nom de modele ou de marque d'imprimante (contenu public),
// - aucun tiret cadratin ni demi-cadratin,
// - duree de conservation qui fait foi : plus de 100 ans (alignee sur les
//   FAQ existantes, decision du 10 juin 2026).
//
// Consommation :
// - TIER_EXPLAINER_SHORT : sous les tuiles de choix de qualite (configurateurs).
// - TIER_EXPLAINER_TITLE + TIER_EXPLAINER_LONG : sections explicatives et FAQ
//   (3 paragraphes : studio, museum, summary).
// - TIER_EXPLAINER_LONG_FLAT : version concatenee en une seule string par
//   langue, pour les reponses de FAQ (champ `a:` texte simple).

export const TIER_EXPLAINER_SHORT = {
  studio: {
    fr: 'Impression jet d\'encre de qualité sur papier premium. Idéale pour la déco, les affiches d\'événements et les tirages courants.',
    en: 'Quality inkjet printing on premium paper. Ideal for decor, event posters and everyday prints.',
    es: 'Impresión de inyección de tinta de calidad en papel premium. Ideal para decoración, afiches de eventos e impresiones corrientes.',
  },
  museum: {
    fr: 'Impression Fine Art 12 encres pigmentaires sur papier d\'archive. Couleurs plus riches, noirs plus profonds, conservation de plusieurs décennies. Le standard des galeries et collectionneurs.',
    en: 'Fine Art printing with 12 pigment inks on archival paper. Richer colors, deeper blacks, conservation lasting several decades. The standard for galleries and collectors.',
    es: 'Impresión Fine Art con 12 tintas pigmentarias en papel de archivo. Colores más ricos, negros más profundos, conservación de varias décadas. El estándar de galerías y coleccionistas.',
  },
};

export const TIER_EXPLAINER_TITLE = {
  fr: 'Quelle est la différence entre Studio et Musée?',
  en: 'What is the difference between Studio and Museum?',
  es: '¿Cuál es la diferencia entre Studio y Museo?',
};

export const TIER_EXPLAINER_LONG = {
  studio: {
    fr: 'Série Studio. Nos tirages Studio sont imprimés avec des encres de qualité sur papiers premium mat ou lustré. C\'est le choix parfait pour décorer un espace, promouvoir un événement ou offrir un tirage à prix accessible, avec un excellent rendu des couleurs.',
    en: 'Studio Series. Our Studio prints are made with quality inks on premium matte or luster papers. It is the perfect choice to decorate a space, promote an event or offer an affordable print, with excellent color rendering.',
    es: 'Serie Studio. Nuestras impresiones Studio se realizan con tintas de calidad en papeles premium mate o lustre. Es la opción perfecta para decorar un espacio, promover un evento u ofrecer una impresión a precio accesible, con una excelente reproducción del color.',
  },
  museum: {
    fr: 'Série Musée. Nos tirages Musée sont réalisés avec un système professionnel à 12 encres pigmentaires sur papiers Fine Art certifiés sans acide. Résultat : une gamme de couleurs étendue, des dégradés plus fins, des noirs profonds et une résistance à la décoloration estimée à plus de 100 ans dans des conditions normales d\'exposition. C\'est la qualité exigée par les artistes, galeries et collectionneurs pour des éditions limitées ou des œuvres destinées à durer.',
    en: 'Museum Series. Our Museum prints are produced with a professional 12 pigment ink system on certified acid-free Fine Art papers. The result: an extended color gamut, finer gradients, deep blacks and fade resistance estimated at over 100 years under normal display conditions. This is the quality demanded by artists, galleries and collectors for limited editions or artworks meant to last.',
    es: 'Serie Museo. Nuestras impresiones Museo se producen con un sistema profesional de 12 tintas pigmentarias en papeles Fine Art certificados libres de ácido. El resultado: una gama de colores extendida, degradados más finos, negros profundos y una resistencia a la decoloración estimada en más de 100 años en condiciones normales de exposición. Es la calidad que exigen artistas, galerías y coleccionistas para ediciones limitadas u obras destinadas a perdurar.',
  },
  summary: {
    fr: 'En résumé : Studio pour le quotidien, Musée pour l\'œuvre d\'art.',
    en: 'In short: Studio for everyday use, Museum for the work of art.',
    es: 'En resumen: Studio para el día a día, Museo para la obra de arte.',
  },
};

// Version "plate" pour les reponses de FAQ (string unique par langue).
export const TIER_EXPLAINER_LONG_FLAT = {
  fr: `${TIER_EXPLAINER_LONG.studio.fr} ${TIER_EXPLAINER_LONG.museum.fr} ${TIER_EXPLAINER_LONG.summary.fr}`,
  en: `${TIER_EXPLAINER_LONG.studio.en} ${TIER_EXPLAINER_LONG.museum.en} ${TIER_EXPLAINER_LONG.summary.en}`,
  es: `${TIER_EXPLAINER_LONG.studio.es} ${TIER_EXPLAINER_LONG.museum.es} ${TIER_EXPLAINER_LONG.summary.es}`,
};
