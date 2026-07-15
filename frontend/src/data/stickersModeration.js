/**
 * MODERATION des stickers - "masque par defaut" (15 juillet 2026).
 *
 * POURQUOI : le site vend Mini Massive (etiquettes pour ENFANTS). Regle Mika :
 * "zero NSFW accessible". L'audit des 270 designs (cf memoire project_nsfw_audit)
 * a classe les limites en 3 tiers. CE fichier masque le TIER 1 (sexuel explicite,
 * gore, vulgaire) de toutes les vues publiques. Les Tiers 2/3 (suggestif, drogue)
 * sont au choix de Mika, design par design -> il les ajoutera ici.
 *
 * Les designs restent dans data/massiveStickers.js (catalogue brut, reference) ;
 * ils sont juste FILTRES des listes publiques (grille /stickers, hero, packs,
 * collages familles). Un design masque n'est plus proposable a l'achat via l'UI.
 *
 * Pour masquer un design : ajouter son slug ici. Pour le re-montrer : le retirer.
 */
export const HIDDEN_STICKERS = new Set([
  // --- TIER 1 : sexuel explicite (pin-up lingerie / nom explicite) ---
  'massive-cute-girl-manga',
  'massive-pinup-bleue',
  'massive-asian-vulve',
  // --- TIER 1 : gore / body-horror ---
  'massive-alien-bizarre', // "Ventre ouvert" (organes)
  'massive-alien-corps',   // "Festin macabre" (sang)
  // --- TIER 1 : vulgaire ---
  'massive-fuckyou',       // "FUK U PAY ME"
])

/** true si le slug est masque des vues publiques. */
export const isHiddenSticker = (slug) => HIDDEN_STICKERS.has(slug)

/** Filtre une liste d'objets {slug} pour retirer les designs masques. */
export const filterHidden = (list) => (list || []).filter((s) => !HIDDEN_STICKERS.has(s?.slug))

/** Filtre une liste de slugs (strings) pour retirer les masques. */
export const filterHiddenSlugs = (slugs) => (slugs || []).filter((s) => !HIDDEN_STICKERS.has(s))
