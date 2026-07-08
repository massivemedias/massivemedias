/**
 * SOURCE UNIQUE de l'etat de la boutique de stickers Massive (pattern
 * merchStatus.js, chantier STICKERS-SHOP-A, 8 juillet 2026).
 *
 * Quand STICKERS_SHOP_ENABLED est a `false` (defaut) :
 *   - La route /stickers n'est PAS declaree (404 comme avant le chantier)
 *   - Le lien "Stickers" du header n'apparait pas
 *   - Rien d'autre a faire : la page et les images restent deployees mais
 *     inaccessibles par navigation.
 *
 * Pour ACTIVER la vitrine :
 *   1. Passer STICKERS_SHOP_ENABLED a `true`
 *   2. Ajouter '/stickers' dans frontend/scripts/routes.mjs (prerender +
 *      sitemap au prochain build)
 *   C'est tout.
 *
 * NOTE chantier 3B (STICKERS-SHOP-B, commerce) : la page est ACHETABLE
 * quand le flag est actif - unite 3 $ (minimum 5 par commande), mystery
 * packs 5/10/20 a 8/14/25 $, checkout Stripe complet avec prix forces
 * serveur (registre SEC-04).
 *
 * ALLUMAGE le 8 juillet 2026 (GO lancement Mika, sequence pre-approuvee) :
 * flag passe a true + /stickers ajoutee au prerender/sitemap (routes.mjs).
 * Pour ETEINDRE en urgence : repasser a false + retirer la route de
 * routes.mjs, push sur main.
 */
export const STICKERS_SHOP_ENABLED = true
