/**
 * socialLinks - liens externes centralises pour faciliter le remplacement
 * sans avoir a chasser les hardcoded strings dans plusieurs composants.
 *
 * GOOGLE_REVIEW_LINK : URL Google Business Profile pour laisser un avis. Le
 * placeholder `#GOOGLE_REVIEW_LINK` est volontairement laisse tel quel - le
 * client doit remplacer par le vrai lien (typiquement de la forme
 * https://g.page/r/<place-id>/review ou https://search.google.com/local/
 * writereview?placeid=<place-id>) une fois la fiche Google Business validee.
 *
 * Pour update : changer la string ci-dessous, tous les CTAs (Footer +
 * CheckoutSuccess) suivront automatiquement.
 */
export const GOOGLE_REVIEW_LINK = '#GOOGLE_REVIEW_LINK';
