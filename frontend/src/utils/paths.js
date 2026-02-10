/**
 * Prefixer un chemin d'image public avec le base URL de Vite.
 * Gère automatiquement GitHub Pages (/massivemedias/) et custom domain (/).
 */
const BASE = import.meta.env.BASE_URL;

/**
 * Chemin vers l'image pleine résolution (2400px, quality 85).
 * Utilisé pour le lightbox et les vues détaillées.
 */
export function img(path) {
  if (!path) return path;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return BASE + cleanPath;
}

/**
 * Chemin vers le thumbnail (1200px, quality 82).
 * Utilisé pour les grilles, cartes, héros — chargement rapide.
 * Transforme /images/prints/X.jpeg → /images/thumbs/prints/X.jpeg
 */
export function thumb(path) {
  if (!path) return path;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const thumbPath = cleanPath.replace('images/', 'images/thumbs/');
  return BASE + thumbPath;
}

/**
 * Convertir un chemin thumb résolu en chemin pleine résolution.
 * Enlève /thumbs/ du chemin.
 */
export function toFull(resolvedPath) {
  if (!resolvedPath) return resolvedPath;
  return resolvedPath.replace('/images/thumbs/', '/images/');
}
