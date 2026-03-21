/**
 * Prefixer un chemin d'image public avec le base URL de Vite.
 * Gere automatiquement GitHub Pages (/massivemedias/) et custom domain (/).
 * Convertit automatiquement les extensions JPEG/JPG en WebP.
 * Ajoute un cache buster unique par build pour eviter les problemes de cache.
 */
const BASE = import.meta.env.BASE_URL;

/**
 * Cache buster: timestamp unique genere au moment du build.
 * Chaque deploy produit un nouveau timestamp = nouvelles URLs = zero cache.
 */
const V = import.meta.env.VITE_BUILD_TIME || '';

function addV(url) {
  if (!V) return url;
  return url + '?v=' + V;
}

/**
 * Convertir l'extension en .webp
 */
function toWebP(path) {
  return path.replace(/\.(jpeg|jpg|JPG|png)$/i, '.webp');
}

/**
 * Chemin vers l'image pleine resolution (1600px, WebP quality 80).
 * Utilise pour le lightbox et les vues detaillees.
 */
export function img(path) {
  if (!path) return path;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return addV(BASE + toWebP(cleanPath));
}

/**
 * Chemin vers le thumbnail (800px, WebP quality 75).
 * Utilise pour les grilles, cartes, heros - chargement ultra-rapide.
 * Transforme /images/prints/X.jpeg -> /images/thumbs/prints/X.webp
 */
export function thumb(path) {
  if (!path) return path;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const thumbPath = cleanPath.replace('images/', 'images/thumbs/');
  return addV(BASE + toWebP(thumbPath));
}

/**
 * Convertir un chemin thumb resolu en chemin pleine resolution.
 * Enleve /thumbs/ du chemin.
 */
export function toFull(resolvedPath) {
  if (!resolvedPath) return resolvedPath;
  return resolvedPath.replace('/images/thumbs/', '/images/');
}
