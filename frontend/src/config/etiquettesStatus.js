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
export const ETIQUETTES_ENABLED = false

export const ETIQUETTES_VISIBLE = ETIQUETTES_ENABLED || import.meta.env.DEV
