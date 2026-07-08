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
 * NOTE chantier 3B (commerce) : prix, minimum de commande, mystery packs et
 * checkout viendront dans un chantier separe. Cette page est une VITRINE :
 * aucun prix affiche, aucun achat possible.
 */
export const STICKERS_SHOP_ENABLED = false
