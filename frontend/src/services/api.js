// PURGE NUCLEAIRE (5 mai 2026) : reduction au strict minimum suite a une
// cascade d'erreurs reseau en production qui faisaient suspecter une
// corruption de l'instance axios par les couches d'intercepteurs accumulees.
//
// Ce qui A ETE SUPPRIME :
//   - Intercepteur response (retry sur 5xx, markServerDown, log 401, etc)
//   - Logique de retry MAX_RETRIES + RETRY_DELAYS + shouldRetry + wait
//   - Tracking serverDown (markServerDown / markServerUp / SERVER_DOWN_COOLDOWN)
//   - Helper isExpected401 et tout le matching d'URL pattern
//   - Headers exotiques (Cache-Control, Pragma) qui declenchaient des
//     preflights CORS supplementaires
//   - Nettoyage agressif de localStorage (qui detruisait code_verifier OAuth)
//   - Compteur _retryCount dans la config
//
// Ce qui RESTE :
//   - axios.create avec baseURL + timeout + adapter fetch
//     (adapter fetch est la SEULE config exotique, justifiee par
//      diagnostic Chrome DevTools live qui montrait que toutes les
//      requetes XHR etaient ERR_CONNECTION_RESET alors que les requetes
//      fetch passaient en 200. Sans cette ligne, le user actuel ne peut
//      plus rien charger - ce n'est pas un intercepteur, c'est le
//      transport sous-jacent)
//   - 1 SEUL intercepteur request, ultra simple : pull token Supabase
//     et injecte Authorization Bearer. C'est tout.
//   - isServerDown() stub qui retourne false (compat avec callers externes
//     dans NotificationContext + Account qui s'en servent pour skip leur
//     polling - sans ce stub, ces fichiers crashent a l'import)
//   - uploadArtistFile / uploadFile : helpers Supabase Storage qui ne
//     touchent PAS l'instance axios - n'ont rien a voir avec ce purge
//     mais doivent rester exportes (utilises par d'autres composants)

import axios from 'axios';
import { supabase } from '../lib/supabase';

const API_URL = 'https://massivemedias-api.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  adapter: 'fetch',
});

// Intercepteur request UNIQUE et MINIMAL : injection Bearer token. Rien d'autre.
api.interceptors.request.use(async (config) => {
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Silent : si Supabase fail, la requete part sans Authorization
      // et le backend retournera 401 que le caller pourra gerer.
    }
  }
  return config;
});

// AUTH-EXPIRED-A10 (2026-05-13) : intercepteur 401 minimaliste avec
// auto-refresh du token Supabase. Resout A10 (UX cassee a l'expiration
// du JWT 1h).
//
// Garde-fous DURS contre les faux-positifs (cause de la purge nucleaire
// precedente) :
//   1. `_authRetry` flag sur config -> empeche la boucle infinie si la
//      requete re-retry retombe sur 401.
//   2. On NE FIRE PAS l'event auth:expired si pas de session locale au
//      moment du 401 (cas "pas connecte du tout" = comportement normal,
//      l'admin n'a pas a etre redirige vers /login alors qu'il n'avait
//      jamais essaye de s'y connecter).
//   3. On tente un `refreshSession()` AVANT de declarer la session morte.
//      Supabase auto-rotate normalement, mais si une rotation a foire,
//      cette tentative explicite recupere souvent un nouveau token sans
//      logout visible pour l'utilisateur. La requete originale est retentee.
//   4. Le dispatch d'event auth:expired est unique : on set un flag
//      sessionStorage `auth_expired_flag` avant le dispatch ; la page
//      Login.jsx le lit a l'affichage pour montrer le message.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const cfg = error?.config;
    if (status !== 401 || !cfg || cfg._authRetry || !supabase) {
      return Promise.reject(error);
    }
    cfg._authRetry = true;

    // Etat de session au moment du 401 : si on n'avait pas de session,
    // le 401 est attendu (caller anonyme) -> on laisse passer en silence.
    let hadSession = false;
    try {
      const { data } = await supabase.auth.getSession();
      hadSession = !!data?.session?.access_token;
    } catch {
      hadSession = false;
    }
    if (!hadSession) {
      return Promise.reject(error);
    }

    // On avait une session ET le serveur dit 401 -> token probablement
    // expire. Tentative d'auto-refresh avant de declarer la session morte.
    try {
      const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
      const newToken = refreshed?.session?.access_token;
      if (!refreshErr && newToken) {
        cfg.headers = cfg.headers || {};
        cfg.headers.Authorization = `Bearer ${newToken}`;
        return api(cfg);
      }
    } catch {
      // refresh a throw : on traite comme expiration definitive ci-dessous.
    }

    // SSR-SAFE (2026-05-14) : double protection. (1) typeof window guard
    // pour eviter ReferenceError si jamais ce code s'execute en Node (SSR,
    // build prerender). (2) try/catch pour le cas browser ou sessionStorage
    // est indisponible (mode prive Safari, quota plein, etc.).
    // Refresh a echoue : session vraiment morte. Signale aux contextes UI.
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('auth_expired_flag', '1');
      } catch {
        // sessionStorage indisponible : tant pis, l'utilisateur verra juste
        // la page Login sans message specifique.
      }
      try {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      } catch {
        // dispatchEvent ne peut pas vraiment fail dans un navigateur normal.
      }
    }
    return Promise.reject(error);
  },
);

// Stub no-op pour compat avec NotificationContext.jsx + Account.jsx qui
// importent isServerDown de ce module. Avant le purge, cette fonction
// retournait true pendant 60s apres une serie d'erreurs reseau pour eviter
// le spam de retry. Maintenant : pas de retry, pas de tracking, on retourne
// toujours false (= serveur considere comme up). Les callers continuent de
// faire leurs polling normalement.
export function isServerDown() {
  return false;
}

// ============================================================================
// API PUBLIC (8 mai 2026) - instance dediee aux endpoints non-authentifies.
// ============================================================================
// Probleme corrige : Strapi v5 rejette en 401 toute requete contenant un
// Authorization Bearer qui n'est pas un JWT Strapi natif. Notre Bearer Supabase
// JWT (injecte automatiquement par l'intercepteur de `api`) declenchait donc
// 401 sur les routes publiques (/artists, /products, /site-content, /news-articles,
// /testimonials, /pricing-config, etc.) DES QU'UN ADMIN ETAIT CONNECTE.
//
// Symptome difficile a debugger : les guests non-loggues voyaient bien le contenu
// CMS, mais les admins (qui sont les seuls a tester) voyaient un fallback local
// stale -> on croyait que les approves CMS ne marchaient pas.
//
// Cette instance NE FAIT PAS d'injection d'auth header, elle ne devrait JAMAIS
// servir pour des endpoints proteges. Pattern : pour les endpoints qui doivent
// fonctionner pour TOUT VISITEUR (loggue ou non), utiliser apiPublic. Pour les
// endpoints admin / proteges, garder `api` (default export).
const apiPublic = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  adapter: 'fetch',
});
// Aucun intercepteur. Aucune injection Authorization. Volontaire.

export { apiPublic };

// === Upload Supabase Storage helpers (non lies a l'instance axios) ===

export async function uploadArtistFile(file) {
  const { supabase } = await import('../lib/supabase');
  if (!supabase) throw new Error('Storage not available');

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `artist-submissions/${timestamp}-${safeName}`;

  const { data, error } = await supabase.storage
    .from('order-files')
    .upload(path, file, { upsert: false });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('order-files')
    .getPublicUrl(data.path);

  return {
    id: data.id || data.path,
    name: file.name,
    url: urlData.publicUrl,
    size: Math.round(file.size / 1000),
    mime: file.type,
  };
}

export async function uploadFile(file) {
  const { supabase } = await import('../lib/supabase');
  if (!supabase) throw new Error('Storage not available');

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `orders/${timestamp}-${safeName}`;

  const { data, error } = await supabase.storage
    .from('order-files')
    .upload(path, file, { upsert: false });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('order-files')
    .getPublicUrl(data.path);

  return {
    id: data.id || data.path,
    name: file.name,
    url: urlData.publicUrl,
    size: Math.round(file.size / 1000),
    mime: file.type,
  };
}

export default api;
