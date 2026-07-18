/**
 * socialLinks - liens externes centralises pour faciliter le remplacement
 * sans avoir a chasser les hardcoded strings dans plusieurs composants.
 *
 * GOOGLE_REVIEW_LINK : URL officielle de la fiche Google Business Profile
 * de Massive Medias (5338 rue Marquette) pour laisser un avis. Lien court
 * g.page qui redirige vers le formulaire writereview de la fiche.
 *
 * CORRECTIF (17 juillet 2026) : l'ancien CID `CWK-Btz-SN2WEAE` etait MORT
 * (g.page redirigeait vers l'accueil google.com au lieu du formulaire). Le
 * nouveau lien resout vers writereview?placeid=ChIJazrBfSAbyUwRY87el64z7mc
 * (verifie par curl : redirige bien vers le formulaire d'avis). Ce N'EST PAS
 * le doublon Mile-End (CID 10388806778305886299) qu'il fallait eviter.
 *
 * Pour update futur : changer uniquement la string ci-dessous, tous les
 * CTAs (Footer + CheckoutSuccess) suivront automatiquement.
 */
export const GOOGLE_REVIEW_LINK = 'https://g.page/r/CWPO3peuM-5nEBM/review';
