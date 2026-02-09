/**
 * Prefixer un chemin d'image public avec le base URL de Vite.
 * Gère automatiquement GitHub Pages (/massivemedias/) et custom domain (/).
 * 
 * En prod, les images déployées sont les versions compressées (800px).
 * Pas de distinction thumb/full en prod — même chemin.
 */
const BASE = import.meta.env.BASE_URL;

export function img(path) {
  if (!path) return path;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return BASE + cleanPath;
}

/**
 * Alias pour clarté sémantique dans le code.
 * En dev, pointe vers /images/thumbs/... ; en prod, même chose que img().
 */
export function thumb(path) {
  return img(path);
}

/**
 * Convertir un chemin thumb (résolu) en chemin original pleine résolution.
 * En prod, c'est un no-op puisque les thumbs remplacent les originaux.
 */
export function toFull(resolvedPath) {
  return resolvedPath;
}
