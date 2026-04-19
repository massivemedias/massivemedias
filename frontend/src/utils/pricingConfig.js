// PRIX-02 (frontend) : client de lecture du pricing backend.
//
// Le backend expose /api/pricing-config avec toutes les constantes (frames,
// sticker tiers, size multipliers, etc). Ce module fetch une fois au boot
// et cache en memoire, avec fallback automatique sur les valeurs hardcoded
// de src/data/products.js si l'API est down.
//
// Usage (incremental migration path) :
//   import { getPricing, getPricingSync } from '@/utils/pricingConfig';
//
//   // React (attend le fetch au premier render) :
//   const pricing = await getPricing();
//   const a3Price = pricing.framePricesByFormat.a3;
//
//   // Script sync (returns fallback si pas encore fetch) :
//   const a3 = getPricingSync().framePricesByFormat.a3;
//
// Tant que les composants utilisent encore les exports de data/products.js
// directement, ils continuent de fonctionner sur la valeur hardcoded (la
// source de verite reste le backend pour la validation des checkouts, donc
// pas de risque de sur/sous-facturation si les 2 fichiers divergent).

import {
  SIZE_MULTIPLIERS as FALLBACK_SIZE_MULTIPLIERS,
  stickerPriceTiers as FALLBACK_STICKER_TIERS,
  holographicPriceTiers as FALLBACK_HOLO_TIERS,
} from '../data/products';

const API_BASE = import.meta.env.VITE_API_URL || 'https://massivemedias-api.onrender.com';
const CACHE_TTL_MS = 10 * 60_000; // 10 minutes

const FALLBACK_CONFIG = Object.freeze({
  framePricesByFormat: { postcard: 20, a4: 20, a3: 30, a3plus: 35, a2: 45 },
  stickerTiersStandard: Object.fromEntries(
    FALLBACK_STICKER_TIERS.map((t) => [t.qty, t.price]),
  ),
  stickerTiersFx: Object.fromEntries(
    FALLBACK_HOLO_TIERS.map((t) => [t.qty, t.price]),
  ),
  sizeMultipliers: FALLBACK_SIZE_MULTIPLIERS,
  artistDiscount: 0.15,
  source: 'fallback',
});

let cachedConfig = null;
let cachedAt = 0;
let inflight = null;

export function getPricingSync() {
  return cachedConfig || FALLBACK_CONFIG;
}

export async function getPricing({ forceRefresh = false } = {}) {
  const now = Date.now();
  if (!forceRefresh && cachedConfig && now - cachedAt < CACHE_TTL_MS) {
    return cachedConfig;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/pricing-config`, {
        method: 'GET',
        signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      cachedConfig = { ...payload, source: 'backend' };
      cachedAt = Date.now();
      return cachedConfig;
    } catch (err) {
      // Fallback : les valeurs hardcoded ne sont pas identiques au backend
      // mais le backend reste source de verite lors du checkout (server-side
      // validation). Donc une divergence temporaire ne cree pas de fraude.
      console.warn('[pricingConfig] Fetch failed, using fallback:', err?.message || err);
      cachedConfig = FALLBACK_CONFIG;
      cachedAt = Date.now();
      return cachedConfig;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

// Warm le cache au boot de l'app (import-time side effect). Non-bloquant :
// les premiers composants qui call getPricingSync() auront le fallback, les
// suivants auront la vraie valeur backend.
if (typeof window !== 'undefined') {
  getPricing().catch(() => {});
}
