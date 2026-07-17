/**
 * C5 (AUDIT-ENDPOINTS, 17 juillet 2026) : MIROIR backend de HIDDEN_STICKERS.
 *
 * HIDDEN_STICKERS masque des designs (NSFW, retraits reversibles) des vues
 * PUBLIQUES cote front (frontend/src/data/stickersModeration.js). Mais le
 * masquage etait UI-only : le SKU `sticker-massive-<slug>` resolvait toujours
 * son prix au checkout, donc un design masque restait ACHETABLE (via un favori
 * enregistre avant le masquage, ou un panier force). Ce miroir permet au
 * registre SKU de REFUSER un design masque au checkout (defense en profondeur).
 *
 * ⚠️ DUAL-SOURCE : cette liste DOIT rester identique a HIDDEN_STICKERS du front.
 * Quand Mika masque/demasque un design, mettre a jour LES DEUX. Le test
 * `frontend/src/data/hiddenStickersDualSource.test.js` casse au CI si elles
 * divergent - c'est le garde-fou.
 */
export const HIDDEN_STICKER_SLUGS: ReadonlySet<string> = new Set([
  // TIER 1 : sexuel explicite
  'massive-cute-girl-manga',
  'massive-pinup-bleue',
  'massive-asian-vulve',
  'massive-lingerie',
  // TIER 1 : gore / body-horror
  'massive-alien-bizarre',
  'massive-alien-corps',
  // TIER 1 : vulgaire
  'massive-fuckyou',
  // TIER 2/3
  'massive-punk-rose',
  'massive-rousse',
  'massive-rousse-couteau',
  'massive-geisha1',
  'massive-geisha2',
  'massive-geisha-rapsody',
  'massive-couille',
  'massive-tete-de-noeud',
  'massive-born-to-kill',
  'massive-adian-fumeuse',
  'massive-femme-oeil-fumee',
  'massive-chat-lsd',
  'massive-chat-lsd2',
  'massive-chat-lsd3',
  'massive-graffeur-en-herbe',
])

/** true si le design de la collection est masque (donc non achetable). */
export function isHiddenStickerSlug(slug: string): boolean {
  return HIDDEN_STICKER_SLUGS.has(slug)
}
