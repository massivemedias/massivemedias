/**
 * Centralized API URL resolver (3 mai 2026).
 *
 * Cause racine du bug fix : plusieurs fichiers avaient
 *   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337/api'
 * Si VITE_API_URL n'etait pas injectee au moment du build (Cloudflare Pages
 * sans la variable env, ou typo .env), le bundle prod tapait sur localhost
 * au lieu du backend Render. Resultat : tous les calls API echouaient
 * silencieusement (CORS / connection refused) une fois deploye.
 *
 * Cette utility resout l'URL avec une logique de fallback explicite :
 *   1. Si VITE_API_URL est defini -> on utilise (override explicite)
 *   2. Sinon, si MODE === 'production' -> fallback URL prod hardcodee
 *      (jamais de localhost en prod, peu importe l'oubli env var)
 *   3. Sinon (dev / test) -> fallback localhost
 *
 * Usage :
 *   import { getApiUrl } from './utils/apiUrl';
 *   const API_URL = getApiUrl();             // -> ".../api"
 *   const API_BASE = getApiUrl({ noApiSuffix: true });  // -> "...." (sans /api)
 */

const PROD_API_URL = 'https://massivemedias-api.onrender.com/api';
const DEV_API_URL = 'http://localhost:1337/api';

/**
 * @param {object} [opts]
 * @param {boolean} [opts.noApiSuffix=false] - retourne l'URL sans le suffixe /api
 * @returns {string}
 */
export function getApiUrl(opts = {}) {
  const fromEnv = import.meta.env.VITE_API_URL;
  const isProd = import.meta.env.MODE === 'production';

  let url;
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
    url = fromEnv.trim();
  } else if (isProd) {
    // Fallback DUR : on refuse de pointer sur localhost en prod meme si
    // VITE_API_URL n'a pas ete injectee. Log warn pour signaler la fuite
    // de config sans casser l'app.
    if (typeof console !== 'undefined') {
      console.warn(
        '[apiUrl] VITE_API_URL non injectee au build. Fallback prod hardcode applique. ' +
        'Verifier la variable env sur Cloudflare Pages.'
      );
    }
    url = PROD_API_URL;
  } else {
    url = DEV_API_URL;
  }

  // Strip trailing slash pour eviter les doubles slashs sur les paths.
  url = url.replace(/\/+$/, '');

  if (opts.noApiSuffix) {
    // Strip /api a la fin si demande (utile pour les utilities qui veulent
    // l'origine seule, ex: cms mediaUrl()).
    return url.replace(/\/api$/, '');
  }
  // DEBUG-NETWORK (3 mai 2026) : log brutal pour tracer la resolution
  // d'URL en production. A retirer une fois le diagnostic termine.
  console.error('[DEBUG NETWORK] Resolved URL:', url, '| VITE_API_URL:', fromEnv, '| MODE:', import.meta.env.MODE);
  return url;
}
