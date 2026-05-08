/**
 * slugify - convertit un texte humain en slug URL-friendly.
 * Normalise les accents, met en minuscules, remplace tout ce qui n'est ni
 * a-z ni 0-9 par un tiret, et compacte les tirets multiples / supprime ceux
 * en debut/fin. Si le resultat est vide (texte 100% non-alphanumerique),
 * retourne 'untitled'.
 *
 * Exemples :
 *   slugify('Gallium')          -> 'gallium'
 *   slugify('No Pixl')          -> 'no-pixl'
 *   slugify('Quentin Délobel')  -> 'quentin-delobel'
 *   slugify('Cornélia & Rose')  -> 'cornelia-rose'
 *   slugify('  ---!!  ')        -> 'untitled'
 */
export function slugify(input: any): string {
  const s = String(input ?? '');
  const out = s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // diacritiques
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return out || 'untitled';
}
