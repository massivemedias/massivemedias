/**
 * Codes promo centralises - UN SEUL ENDROIT a modifier
 * Format: 'CODE': { discountPercent: 15, label: 'Description' }
 *
 * IMPORTANT : ces codes sont la SEULE source de verite pour le calcul
 * du rabais final cote order.ts (Stripe checkout). Les codes definis
 * dans la BDD Strapi (api::promo-code.promo-code) sont utilises
 * uniquement pour la validation initiale au panier - pour qu'un code
 * fonctionne de bout en bout, il DOIT etre present ici.
 */
export const PROMO_CODES: Record<string, { discountPercent: number; label: string }> = {
  'CINDY20': { discountPercent: 20, label: 'Promo Cindy 20%' },
  'WELCOME23': { discountPercent: 15, label: 'Bienvenue - 15%' },
};
