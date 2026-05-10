/**
 * removeBg (10 mai 2026) - wrapper autour de @imgly/background-removal pour
 * supprimer le fond d'une image 100% in-browser via WebAssembly + ONNX.
 *
 * Architecture :
 *   - Lazy import du package (~3MB JS + ~10MB de modeles WASM/ONNX au 1er
 *     usage, telecharges depuis le CDN imgly et caches par le browser).
 *     L'import statique aurait gonfle le bundle initial -> on importe a la
 *     demande seulement quand le user coche le toggle "Remove background".
 *   - Cache LRU simple par URL source pour eviter de retraiter la meme
 *     image quand le user coche/decoche plusieurs fois (le model met 2-5s).
 *   - Retourne un Object URL (blob:) du PNG resultat avec canal alpha
 *     transparent. Le caller doit URL.revokeObjectURL() quand il termine
 *     pour eviter les fuites memoire.
 *
 * Usage typique :
 *   import { removeBackground } from '../utils/removeBg';
 *   const transparentUrl = await removeBackground(originalImageUrl);
 *   // ... utiliser transparentUrl comme src d'un <img> ou Image()
 *   URL.revokeObjectURL(transparentUrl); // au cleanup
 *
 * Performance :
 *   - 1er appel : 5-15s (telechargement model + warmup)
 *   - Appels suivants : 1-3s (model en memoire)
 *   - Resultat cache LRU : 0ms (lookup synchrone)
 */

// Cache LRU simple : key = URL source, value = blob URL detoure.
// Limite a 10 entrees pour ne pas exploser la memoire (chaque blob = 100-500KB).
const CACHE_MAX_SIZE = 10;
const cache = new Map();

function getCached(sourceUrl) {
  if (!cache.has(sourceUrl)) return null;
  // LRU : on re-set pour mettre en tete (les Maps preservent l'ordre d'insertion)
  const value = cache.get(sourceUrl);
  cache.delete(sourceUrl);
  cache.set(sourceUrl, value);
  return value;
}

function setCached(sourceUrl, blobUrl) {
  if (cache.size >= CACHE_MAX_SIZE) {
    // Evict le plus ancien (premiere cle dans l'ordre d'insertion)
    const oldestKey = cache.keys().next().value;
    const oldestBlob = cache.get(oldestKey);
    cache.delete(oldestKey);
    // On revoque l'ancien blob pour liberer la memoire
    try { URL.revokeObjectURL(oldestBlob); } catch { /* ignore */ }
  }
  cache.set(sourceUrl, blobUrl);
}

// Module promise singleton : import lazy une seule fois meme si on appelle
// removeBackground() plusieurs fois en parallele rapidement.
let modulePromise = null;

async function loadModule() {
  if (!modulePromise) {
    modulePromise = import('@imgly/background-removal');
  }
  return modulePromise;
}

/**
 * Detoure le sujet d'une image et retourne un Object URL (PNG transparent).
 *
 * @param {string} sourceUrl - URL de l'image source (blob: ou http(s):).
 * @returns {Promise<string>} Object URL du PNG sans fond. A revoquer manuellement.
 * @throws Si la lib ne charge pas ou si l'image est inaccessible.
 */
export async function removeBackground(sourceUrl) {
  if (!sourceUrl) throw new Error('removeBackground: sourceUrl requis');

  // Hit cache : retour instantane
  const cached = getCached(sourceUrl);
  if (cached) return cached;

  // Lazy load la lib
  const mod = await loadModule();
  const removeBackgroundFn = mod.removeBackground || mod.default?.removeBackground || mod.default;
  if (typeof removeBackgroundFn !== 'function') {
    throw new Error('removeBackground: API @imgly/background-removal inattendue');
  }

  // CF-PAGES-25MB-FIX (10 mai 2026) : Cloudflare Pages limite a 25 MiB par
  // fichier. Le WASM ort-wasm-simd-threaded.jsep fait exactement 25 MiB,
  // depasse la limite et fait echouer le build. Solution : on configure
  // imgly pour charger les WASM depuis leur CDN officiel au lieu de les
  // servir depuis notre dist. Le post-build supprime ces fichiers du dist
  // (cf. package.json build script).
  const blob = await removeBackgroundFn(sourceUrl, {
    publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
    debug: false,
  });
  const blobUrl = URL.createObjectURL(blob);
  setCached(sourceUrl, blobUrl);
  return blobUrl;
}

/**
 * Vide tout le cache (et libere les blobs). A appeler quand on quitte une
 * page qui n'aura plus besoin des resultats (eviter les fuites memoire).
 */
export function clearRemoveBgCache() {
  for (const blobUrl of cache.values()) {
    try { URL.revokeObjectURL(blobUrl); } catch { /* ignore */ }
  }
  cache.clear();
}
