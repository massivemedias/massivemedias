/**
 * ADMIN-STICKERS phase 2 - fusion catalogue statique + overrides admin.
 *
 * ARCHITECTURE (option B, validee 21 juillet 2026) : `data/massiveStickers.js`
 * reste le catalogue de BASE (385 designs, dans le bundle, affichage instantane).
 * Strapi ne porte que le DELTA edite par l'admin. Un slug absent des overrides
 * garde ses valeurs d'origine.
 *
 * DEGRADATION VOLONTAIRE : si l'API est injoignable, on affiche le catalogue de
 * base. Consequence assumee et a connaitre : un design masque DEPUIS L'ADMIN
 * redeviendrait visible le temps de la panne. Les masques NSFW cures a la main
 * vivent, eux, dans la liste STATIQUE `stickersModeration.js` et ne bougent
 * jamais. Cote argent il n'y a pas de trou : le refus au checkout est fait
 * serveur (sku-registry + sticker-override), donc si Strapi tombe, le checkout
 * tombe avec lui.
 */
import api from '../services/api';

/**
 * Applique les overrides sur une liste de stickers. FONCTION PURE.
 * @param {Array} list      catalogue de base (MASSIVE_STICKERS)
 * @param {Array} overrides [{ slug, nameFr, nameEn, nameEs, hidden }]
 * @returns {Array} nouvelle liste, meme ordre, avec `hiddenByAdmin` annote
 */
export function applyOverrides(list, overrides) {
  if (!Array.isArray(list)) return [];
  if (!Array.isArray(overrides) || overrides.length === 0) return list;

  const byslug = new Map();
  for (const o of overrides) {
    if (o && typeof o.slug === 'string') byslug.set(o.slug, o);
  }
  if (byslug.size === 0) return list;

  return list.map((s) => {
    const o = byslug.get(s?.slug);
    if (!o) return s;
    return {
      ...s,
      // Un nom vide/absent dans l'override = on garde l'original. On ne
      // remplace que ce qui a REELLEMENT ete saisi.
      fr: o.nameFr || s.fr,
      en: o.nameEn || s.en,
      es: o.nameEs || s.es,
      hiddenByAdmin: !!o.hidden,
      // Phase 3 : epaisseur du contour die-cut. null/absent = defaut du site.
      strokeWidth: (typeof o.strokeWidth === 'number' ? o.strokeWidth : undefined),
    };
  });
}

/**
 * Style inline du contour pour un sticker. Retourne undefined quand rien n'est
 * surcharge, pour ne poser AUCUN attribut style sur les 385 vignettes par
 * defaut (le CSS garde alors sa valeur d'origine).
 */
export function strokeStyle(sticker) {
  const w = sticker?.strokeWidth;
  return (typeof w === 'number') ? { '--stk': `${w}px` } : undefined;
}

/** Slugs masques par l'admin (a cumuler avec HIDDEN_STICKERS statique). */
export function adminHiddenSlugs(overrides) {
  const out = new Set();
  for (const o of overrides || []) {
    if (o && o.hidden && typeof o.slug === 'string') out.add(o.slug);
  }
  return out;
}

/** GET public. Retourne [] en cas d'echec : la vitrine ne doit jamais casser. */
export async function fetchStickerOverrides() {
  try {
    const res = await api.get('/sticker-overrides');
    const data = res?.data?.data ?? res?.data ?? [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** PUT admin (upsert partiel). Laisse remonter l'erreur : l'admin doit la voir. */
export async function saveStickerOverride(slug, patch) {
  const res = await api.put(`/sticker-overrides/${encodeURIComponent(slug)}`, patch);
  return res?.data?.data ?? null;
}
