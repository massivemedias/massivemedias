/**
 * Prefixer un chemin d'image public avec le base URL de Vite.
 * Gère automatiquement GitHub Pages (/massivemedias/) et custom domain (/).
 */
const BASE = import.meta.env.BASE_URL;

export function img(path) {
  if (!path) return path;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return BASE + cleanPath;
}
