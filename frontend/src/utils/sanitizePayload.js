/**
 * sanitizePayload - nettoie un objet payload avant un POST/PUT vers Strapi.
 *
 * Probleme adresse : Strapi v5 utilise Yup en interne pour valider les
 * attributes. Quand un champ est defini en `required: true` dans le schema
 * et que le frontend envoie `null` ou `undefined`, Yup leve une erreur du
 * type :
 *   "<champ> must be a string type, but the final value was: null"
 *
 * Pour un champ OPTIONNEL (required: false), Strapi accepte :
 *   - une string (vide ou non)
 *   - le champ ABSENT du payload
 *
 * Cette fonction supprime les keys avec valeur null/undefined/'' (chaine vide
 * pure) du payload pour que Strapi tombe dans le cas "champ absent" -> il
 * applique le default du schema (souvent null pour optionnel).
 *
 * @param {object} payload         - Objet a nettoyer (non muté).
 * @param {object} [options]
 * @param {string[]} [options.keep] - Liste de keys a conserver meme si la
 *                                    valeur est null/undefined/'' (ex: pour
 *                                    "vider explicitement" un champ).
 * @param {boolean} [options.deep] - Si true, sanitise recursivement les
 *                                    sous-objets (defaut false : top-level
 *                                    seulement, suffisant pour la majorite
 *                                    des creates/updates Strapi).
 * @returns {object} Nouvel objet sans les keys vides.
 *
 * Exemples :
 *
 *   sanitizePayload({ name: 'Bob', email: '', phone: null, age: 0 })
 *   // -> { name: 'Bob', age: 0 }
 *
 *   sanitizePayload({ name: 'Bob', email: '' }, { keep: ['email'] })
 *   // -> { name: 'Bob', email: '' }
 *
 *   sanitizePayload({ user: { name: 'Bob', email: '' } }, { deep: true })
 *   // -> { user: { name: 'Bob' } }
 */
export function sanitizePayload(payload, options = {}) {
  const { keep = [], deep = false } = options;
  const keepSet = new Set(keep);

  const isEmpty = (v) => v === null || v === undefined || v === '';

  if (Array.isArray(payload)) {
    return deep ? payload.map((v) => (typeof v === 'object' && v !== null ? sanitizePayload(v, options) : v)) : payload;
  }

  if (payload === null || typeof payload !== 'object') return payload;

  const out = {};
  for (const [k, v] of Object.entries(payload)) {
    if (isEmpty(v) && !keepSet.has(k)) continue;
    if (deep && typeof v === 'object' && v !== null && !(v instanceof File) && !(v instanceof Blob)) {
      out[k] = sanitizePayload(v, options);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * trimStrings - retourne une copie de l'objet avec toutes les valeurs string
 * trimmees. Combinable avec sanitizePayload pour nettoyer les espaces puis
 * retirer les chaines devenues vides.
 *
 *   trimStrings({ name: '  Bob  ', email: ' ' })
 *   // -> { name: 'Bob', email: '' }
 *
 *   sanitizePayload(trimStrings({ name: '  Bob  ', email: ' ' }))
 *   // -> { name: 'Bob' }
 */
export function trimStrings(payload) {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) return payload;
  const out = {};
  for (const [k, v] of Object.entries(payload)) {
    out[k] = typeof v === 'string' ? v.trim() : v;
  }
  return out;
}

/**
 * cleanForApi - raccourci pratique : trimStrings puis sanitizePayload.
 * A utiliser comme dernier appel avant fetch/api.post.
 *
 *   await api.post('/foo', cleanForApi({ name: '  Bob  ', email: '', phone: null }));
 *   // -> body envoye : { name: 'Bob' }
 */
export function cleanForApi(payload, options = {}) {
  return sanitizePayload(trimStrings(payload), options);
}
