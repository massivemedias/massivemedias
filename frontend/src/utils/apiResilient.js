/**
 * Resilient API client with automatic retry + backoff + backend availability tracking.
 *
 * FRONT-01 scope clarification (avril 2026):
 * Ce module a initialement ete cree pour un usage large, mais en pratique il n'est
 * importe QUE par `BackendHealthBanner.jsx` pour les pings de sante globaux
 * (pingBackend, onBackendStatusChange). Le reste de l'app utilise `services/api.js`
 * (axios) qui a son propre retry interceptor - desormais elargi pour couvrir 500-504
 * (pas seulement 503) pour matcher le comportement de ce module.
 *
 * Nouveau code: PREFER `services/api.js` (axios + auth + retry). Ce module reste
 * reserve pour BackendHealthBanner + eventuels futurs probes de sante fetch-based.
 *
 * Usage (limite au health banner):
 *   import { pingBackend, onBackendStatusChange } from '@/utils/apiResilient';
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://massivemedias-api.onrender.com';

// Retry config: 5 tentatives, backoff 1s/2s/4s/8s/16s (total ~31s)
const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 1000;
const BACKOFF_FACTOR = 2;

// Status patterns that should trigger a retry (backend temporarily unavailable):
// - Network errors (TypeError from fetch, no response at all)
// - 502 Bad Gateway (Render container restarting)
// - 503 Service Unavailable
// - 504 Gateway Timeout
// - 500 Internal Server Error (generous: might be OOM in progress)
// NON-retryable: 400 (bad request), 401/403 (auth), 404 (not found), 409 (conflict), 413 (too large)
function isRetryable(err, status) {
  if (err && err.name === 'AbortError') return false; // user cancelled
  if (err && !status) return true; // network error (no HTTP status reached)
  if (status >= 500 && status <= 599) return true;
  return false;
}

// Global backend status tracker
// MON-01 : ajout de 'slow' - moyenne des 3 dernieres latences > SLOW_THRESHOLD_MS
let currentBackendStatus = 'unknown'; // 'up' | 'slow' | 'down' | 'unknown'
const statusListeners = new Set();

const SLOW_THRESHOLD_MS = 3000;
const LATENCY_WINDOW = 3;
const recentLatencies = []; // rolling window des N dernieres latences reussies

function recordLatency(ms) {
  recentLatencies.push(ms);
  if (recentLatencies.length > LATENCY_WINDOW) recentLatencies.shift();
}

function avgLatency() {
  if (recentLatencies.length === 0) return 0;
  return recentLatencies.reduce((a, b) => a + b, 0) / recentLatencies.length;
}

export function getBackendStatus() {
  return currentBackendStatus;
}

export function getAverageLatency() {
  return Math.round(avgLatency());
}

export function onBackendStatusChange(callback) {
  statusListeners.add(callback);
  callback(currentBackendStatus); // fire immediately with current status
  return () => statusListeners.delete(callback);
}

function setBackendStatus(newStatus) {
  if (newStatus === currentBackendStatus) return;
  currentBackendStatus = newStatus;
  for (const listener of statusListeners) {
    try { listener(newStatus); } catch (e) { /* ignore */ }
  }
}

// Transition 'up' <-> 'slow' basee sur la latence moyenne, sans ecraser 'down'
// (qui a priorite tant qu'on n'a pas confirme la recovery via pingBackend).
function maybeMarkSlow() {
  if (currentBackendStatus === 'down') return;
  if (recentLatencies.length < LATENCY_WINDOW) return; // besoin de la fenetre pleine
  const avg = avgLatency();
  if (avg > SLOW_THRESHOLD_MS) {
    setBackendStatus('slow');
  } else {
    setBackendStatus('up');
  }
}

/**
 * Main fetch wrapper with retry + backend status tracking.
 * Accepts the same arguments as fetch() but:
 * - path can be relative (will prefix with API_BASE)
 * - automatically retries on network/5xx errors with exponential backoff
 * - updates global backend status
 * - returns the final Response (or throws if all retries exhausted)
 */
export async function apiFetch(pathOrUrl, options = {}) {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API_BASE}${pathOrUrl}`;
  const { retries = MAX_RETRIES, signal, timeout = 30000, ...fetchOptions } = options;

  let lastError = null;
  let lastStatus = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    if (signal) {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const startTime = performance.now();
    try {
      const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
      clearTimeout(timeoutId);
      lastStatus = response.status;

      if (response.ok || (response.status >= 400 && response.status < 500)) {
        // Success or non-retryable client error - record latency, update status
        recordLatency(performance.now() - startTime);
        maybeMarkSlow();
        return response;
      }

      if (isRetryable(null, response.status) && attempt < retries) {
        const backoff = INITIAL_BACKOFF_MS * Math.pow(BACKOFF_FACTOR, attempt);
        console.warn(`[apiResilient] ${url} returned ${response.status}, retry ${attempt + 1}/${retries} in ${backoff}ms`);
        setBackendStatus('down');
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }

      // Not retryable or out of retries
      setBackendStatus(response.status >= 500 ? 'down' : 'up');
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
      if (err.name === 'AbortError' && signal?.aborted) {
        throw err; // user cancelled, do not retry
      }

      if (isRetryable(err, null) && attempt < retries) {
        const backoff = INITIAL_BACKOFF_MS * Math.pow(BACKOFF_FACTOR, attempt);
        console.warn(`[apiResilient] ${url} network error (${err.message}), retry ${attempt + 1}/${retries} in ${backoff}ms`);
        setBackendStatus('down');
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }

      // Exhausted retries on a network error
      setBackendStatus('down');
      throw new Error(`Backend unreachable after ${retries + 1} attempts: ${err.message}`);
    }
  }

  // Should not reach here, but just in case
  if (lastError) throw lastError;
  throw new Error(`Backend error after ${retries + 1} attempts: HTTP ${lastStatus}`);
}

/**
 * Convenience wrapper for JSON POST
 */
export async function apiPostJson(path, body, options = {}) {
  const response = await apiFetch(path, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return response.json();
}

/**
 * Convenience wrapper for JSON GET
 */
export async function apiGetJson(path, options = {}) {
  const response = await apiFetch(path, { ...options, method: 'GET' });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return response.json();
}

/**
 * Active backend health check. Used by the health banner component to
 * probe recovery after a detected outage. Light endpoint, returns fast.
 */
export async function pingBackend() {
  const startTime = performance.now();
  try {
    const response = await fetch(`${API_BASE}/api/artists`, {
      method: 'GET',
      cache: 'no-store',
      mode: 'cors',
      signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined,
    });
    const up = response.ok;
    if (up) {
      recordLatency(performance.now() - startTime);
      // Apres recovery, on re-evalue slow vs up avec la fenetre de latences.
      maybeMarkSlow();
    } else {
      setBackendStatus('down');
    }
    return up;
  } catch (e) {
    setBackendStatus('down');
    return false;
  }
}

// Auto-ping every 30s when backend is down to detect recovery fast
let autoHealCheckInterval = null;
if (typeof window !== 'undefined') {
  onBackendStatusChange((status) => {
    if (status === 'down' && !autoHealCheckInterval) {
      autoHealCheckInterval = setInterval(() => {
        pingBackend().then((up) => {
          if (up && autoHealCheckInterval) {
            clearInterval(autoHealCheckInterval);
            autoHealCheckInterval = null;
          }
        });
      }, 30000);
    } else if (status === 'up' && autoHealCheckInterval) {
      clearInterval(autoHealCheckInterval);
      autoHealCheckInterval = null;
    }
  });
}
