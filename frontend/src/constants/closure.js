// Notice de fermeture temporaire affichee sur la Home et la page Contact.
// Rouge, discrete mais presente (composant ClosureNotice).
//
// POUR LA RETIRER apres la reouverture : passer CLOSURE_ACTIVE a false ci-dessous
// (le composant ne rend alors plus rien, aucune autre modification necessaire),
// puis redeployer. Le texte se modifie ici aussi, au meme endroit, en 3 langues.

export const CLOSURE_ACTIVE = true;

export const CLOSURE_NOTICE = {
  fr: 'Fermé jusqu\'au début juillet. De retour très bientôt, merci de votre patience.',
  en: 'Closed until early July. Back very soon, thank you for your patience.',
  es: 'Cerrado hasta principios de julio. De vuelta muy pronto, gracias por tu paciencia.',
};
