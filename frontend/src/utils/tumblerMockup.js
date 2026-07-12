// Ancre PARTAGEE du design pose sur le mockup tumbler (gourde blanche).
// UNE seule source de calibrage, utilisee par les trois surfaces qui rendent ce
// mockup : la fiche produit (MassiveStickers), la bande "In the wild" (SHOWCASE)
// et la banniere home collection (HomeCollectionBanner). Objectif : eviter les
// calibrages divergents constates avant (42% / 58% / 42% selon la surface).
//
// Reference PHYSIQUE : un sticker ~2,5 po sur un tumbler skinny 20 oz (corps
// ~8 po) occupe ~30-35% de la hauteur du CORPS. Le corps fait ~80% de la hauteur
// de l'image tumbler-white.webp (347x916 : straw + couvercle en haut) -> une
// boite design a ~28% de la hauteur du tumbler tombe a ~35% du corps.
//
// Modele HEIGHT-based volontaire : dans les trois conteneurs le tumbler est rendu
// en `h-full`, donc `height: X%` = X% de la hauteur du tumbler sans ambiguite
// (contrairement a `width: X%` qui reference tantot le tumbler, tantot la colonne
// selon le conteneur). aspectRatio 1 + object-contain : la plus grande dimension
// du design remplit la boite, donc tout ratio (vertical / carre / horizontal)
// reste dans les bords du cylindre sans deborder.
export const TUMBLER_DESIGN = { top: '52%', height: '28%' };
