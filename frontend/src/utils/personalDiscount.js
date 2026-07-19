/**
 * RABAIS-CLIENT (front) - MIROIR du calcul serveur.
 *
 * Le montant reellement facture est TOUJOURS calcule cote serveur
 * (backend/src/utils/pricing-config.ts -> computeOrderDiscount, applique dans
 * createCheckoutSession avec la regle "le meilleur gagne"). Ces fonctions ne
 * font QU'AFFICHER : elles reproduisent le calcul serveur pour que le total
 * montre au client dans le panier et au checkout corresponde exactement a ce
 * qu'il paiera. Toute divergence ici est cosmetique - le serveur tranche.
 *
 * REGLES (identiques au back) :
 *   - % borne 0..100 ; $ borne 0..sous-total (le rabais ne depasse jamais la base)
 *   - la base est le sous-total POST-rabais-artiste (l'artiste 25% est a part)
 *   - "le meilleur gagne" : rabais perso et code promo ne se cumulent PAS,
 *     on applique le plus avantageux des deux
 *   - la livraison n'est jamais rabaissee ; les taxes portent sur le NET
 */

/** Miroir EXACT de computeOrderDiscount (backend pricing-config.ts). */
export function computeOrderDiscount(subtotal, discountType, discountValue) {
  const sub = Number(subtotal);
  const raw = typeof discountValue === 'string'
    ? parseFloat(discountValue.replace(',', '.'))
    : Number(discountValue);
  const v = Number.isFinite(raw) ? raw : 0;
  if (!(sub > 0) || !(v > 0) || (discountType !== 'percent' && discountType !== 'fixed')) {
    return { discountAmount: 0, type: null, value: 0 };
  }
  let amount;
  let value;
  if (discountType === 'percent') {
    value = Math.min(100, Math.max(0, v));
    amount = sub * (value / 100);
  } else {
    value = Math.max(0, v);
    amount = value;
  }
  amount = Math.round(Math.min(amount, sub) * 100) / 100;
  return { discountAmount: amount, type: discountType, value };
}

/**
 * "Le meilleur gagne" entre le rabais personnel et le code promo, sur la base
 * post-artiste. Retourne quel rabais afficher et son montant. Miroir du bloc
 * best-wins de createCheckoutSession.
 *
 * @param {number} subtotalAfterArtist  sous-total apres rabais artiste (dollars)
 * @param {{type:'percent'|'fixed', value:number}|null} personal  rabais perso actif
 * @param {number} promoPercent  pourcentage entier du code promo (0 si aucun)
 * @returns {{winner:'personal'|'promo'|null, personalDiscount:number, promoDiscount:number, appliedDiscount:number}}
 */
export function resolvePersonalVsPromo(subtotalAfterArtist, personal, promoPercent) {
  const base = Number(subtotalAfterArtist) || 0;
  const personalDiscount = personal
    ? computeOrderDiscount(base, personal.type, personal.value).discountAmount
    : 0;
  const promoDiscount = promoPercent > 0
    ? Math.round(base * (promoPercent / 100) * 100) / 100
    : 0;
  if (personalDiscount > 0 && personalDiscount >= promoDiscount) {
    return { winner: 'personal', personalDiscount, promoDiscount: 0, appliedDiscount: personalDiscount };
  }
  if (promoDiscount > 0) {
    return { winner: 'promo', personalDiscount: 0, promoDiscount, appliedDiscount: promoDiscount };
  }
  return { winner: null, personalDiscount: 0, promoDiscount: 0, appliedDiscount: 0 };
}

/**
 * Libelle court du rabais personnel pour l'affichage ("-15 %" ou "-10 $").
 * `tx` optionnel pour la trilingue ; sans lui, format FR par defaut.
 */
export function personalDiscountLabel(personal) {
  if (!personal) return '';
  if (personal.type === 'percent') return `-${Number(personal.value)} %`;
  return `-${Number(personal.value)} $`;
}
