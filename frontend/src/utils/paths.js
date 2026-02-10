/**
 * Prefixer un chemin d'image public avec le base URL de Vite.
 * Gère automatiquement GitHub Pages (/massivemedias/) et custom domain (/).
 * Convertit automatiquement les extensions JPEG/JPG en WebP.
 */
const BASE = import.meta.env.BASE_URL;

/**
 * Convertir l'extension en .webp
 */
function toWebP(path) {
  return path.replace(/\.(jpeg|jpg|JPG|png)$/i, '.webp');
}

/**
 * Chemin vers l'image pleine résolution (1600px, WebP quality 80).
 * Utilisé pour le lightbox et les vues détaillées.
 */
export function img(path) {
  if (!path) return path;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return BASE + toWebP(cleanPath);
}

/**
 * Chemin vers le thumbnail (800px, WebP quality 75).
 * Utilisé pour les grilles, cartes, héros — chargement ultra-rapide.
 * Transforme /images/prints/X.jpeg → /images/thumbs/prints/X.webp
 */
export function thumb(path) {
  if (!path) return path;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const thumbPath = cleanPath.replace('images/', 'images/thumbs/');
  return BASE + toWebP(thumbPath);
}

/**
 * Convertir un chemin thumb résolu en chemin pleine résolution.
 * Enlève /thumbs/ du chemin.
 */
export function toFull(resolvedPath) {
  if (!resolvedPath) return resolvedPath;
  return resolvedPath.replace('/images/thumbs/', '/images/');
}
