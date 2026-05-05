/**
 * Helpers de formatage monetaire centralises (5 mai 2026).
 *
 * Avant : chaque composant reinventait son propre format ou affichait
 * des montants bruts ({total}$) - resultat : un client a vu
 * "125.99999999$" a cause de l'arithmetique flottante JS.
 *
 * Apres : on canalise TOUT l'affichage de montants par ces helpers.
 * Toujours arrondi a 2 decimales, toujours tolerant aux NaN/null/undefined.
 *
 * Regles :
 *   - money(123.45)         -> "123.45"          (string, 2 decimales)
 *   - formatPrice(123.45)   -> "123.45$"         (suffixe dollar canadien)
 *   - formatPrice(125.99999999) -> "126.00$"     (arrondi correct)
 *   - formatPrice(null)     -> "0.00$"           (defensif, jamais crash)
 *   - formatPrice('25.5')   -> "25.50$"          (coerce string -> number)
 *   - formatCents(12500)    -> "125.00$"         (cents -> dollars + suffixe)
 *
 * Pourquoi pas Intl.NumberFormat ?
 *   - Plus lourd, et on veut un format minimal coherent avec l'existant
 *     ("12.50$" pas "12,50 $ CAD"). Si plus tard on veut localiser pour
 *     EN/ES, il sera trivial d'ajouter une variante locale.
 */

/**
 * Coerce un input en number safely. Tolere :
 *   - number (passthrough)
 *   - string ("25.50", "25,50" -> 25.5)
 *   - null / undefined / NaN -> 0
 */
function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value == null) return 0;
  // Strings : remplacer virgule par point pour parser fr-CA correctement
  const cleaned = String(value).replace(',', '.').trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Arrondit a 2 decimales en utilisant Math.round pour eviter les
 * artefacts d'IEEE 754. (0.1 + 0.2).toFixed(2) === "0.30" mais
 * (0.1 + 0.2 - 0.3) -> 5.5e-17 - le * 100 / 100 force la precision.
 */
export function roundMoney(value) {
  const n = toNumber(value);
  return Math.round(n * 100) / 100;
}

/**
 * Retourne un STRING avec exactement 2 decimales (pas de suffixe).
 * Utile pour interpoler dans des templates sans afficher le $ (ex: input value).
 */
export function money(value) {
  return roundMoney(value).toFixed(2);
}

/**
 * Format affichage user-facing : "123.45$" (suffixe dollar canadien).
 * C'est CE helper qu'on utilise dans la majorite des composants React.
 */
export function formatPrice(value) {
  return `${money(value)}$`;
}

/**
 * Pour les valeurs stockees en CENTS (ex: certaines tables admin
 * utilisent des entiers pour eviter le FP). Convertit + formate.
 */
export function formatCents(centValue) {
  return formatPrice(toNumber(centValue) / 100);
}

/**
 * Format alternatif avec "$" en prefixe (style USD) - moins commun
 * dans le projet mais expose au cas ou.
 */
export function formatPriceUSD(value) {
  return `$${money(value)}`;
}
