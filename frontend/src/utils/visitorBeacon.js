// ADMIN-VISITORS (9 juillet 2026) : beacon de pageview non bloquant.
//
// Envoie {path} a l'endpoint public /visitor-hits/collect via
// navigator.sendBeacon (asynchrone, hors du main thread, ne retarde jamais
// le rendu ni la navigation). L'IP est hashee cote serveur, jamais ici.
// Degrade en silence si sendBeacon indisponible : AUCUN fetch bloquant de
// remplacement, un pageview manque n'a aucune importance.
//
// Zero impact perf : sendBeacon est concu exactement pour ca (envoi
// fire-and-forget qui survit meme a un unload de page).

const COLLECT_URL = 'https://massivemedias-api.onrender.com/api/visitor-hits/collect'

export function sendVisitorBeacon(path) {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return
    // Ne pas tracer le prerender (Puppeteer) ni les sous-domaines proxy.
    if (typeof window !== 'undefined' && window.__MASSIVE_PRERENDER__) return
    const body = new Blob([JSON.stringify({ path: path || '/' })], { type: 'application/json' })
    navigator.sendBeacon(COLLECT_URL, body)
  } catch (_) {
    // Silencieux : un beacon rate ne doit jamais remonter au client.
  }
}
