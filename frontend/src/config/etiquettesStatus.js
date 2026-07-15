/**
 * SOURCE UNIQUE de l'etat du produit ETIQUETTES (etiquettes d'identification
 * personnalisees pour enfants). Modele : merchStatus.js / stickersShopStatus.js.
 *
 * ETIQUETTES_ENABLED = false tant que le TEST PHYSIQUE lave-vaisselle de Mika
 * n'est pas concluant (c'est LE gate du lancement public, Phase 3).
 *
 * En DEV (vite local), la page /etiquettes reste visible pour construire et
 * valider (Phases 1-2) : c'est le sens du `|| import.meta.env.DEV`. En PROD,
 * seul le flag compte : false = la route n'est pas montee, aucune entree de
 * menu, invisible.
 */
// LANCEMENT (15 juillet 2026) : claims eau + UV seulement (le lave-vaisselle
// attend le test physique, ETIQUETTE_CLAIM_LAVE_VAISSELLE reste false). Amelina
// (licence) + coin concave (test decoupe) restent masques en prod par leurs
// propres gates. Checkout SEC-04 branche et deploye (Etape 1) AVANT ce flag.
export const ETIQUETTES_ENABLED = true

export const ETIQUETTES_VISIBLE = ETIQUETTES_ENABLED || import.meta.env.DEV
