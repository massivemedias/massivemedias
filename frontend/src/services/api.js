import axios from 'axios';
import { isAuthInitialized } from './authState';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper : recupere le token d'auth le plus frais possible.
// Priorite a supabase.auth.getSession() (source de verite, auto-refresh si expire)
// avec fallback localStorage pour les cas edge (supabase pas dispo, offline).
async function getFreshToken() {
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      const supabaseToken = data?.session?.access_token;
      if (supabaseToken) return supabaseToken;
    } catch { /* fall through to localStorage */ }
  }
  try {
    return localStorage.getItem('token') || null;
  } catch {
    return null;
  }
}

// Intercepteur REQUETE : async, pull le token frais de Supabase a chaque call.
// Elimine la race post-signIn ou le navigate vers /admin se declenchait AVANT
// que onAuthStateChange ait sync le token dans localStorage -> 1ere requete
// partait sans Authorization -> 401 -> logout instantane.
api.interceptors.request.use(
  async (config) => {
    const token = await getFreshToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Compteur de retry interne
    if (!config._retryCount) config._retryCount = 0;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Retry automatique sur erreurs transitoires (503 backend restart, erreurs reseau).
// Le backend Render est sur plan "Always On" (pas de sleep), mais on garde un retry
// court pour les redemarrages post-deploy et coupures reseau client.
const MAX_RETRIES = 3;
const RETRY_DELAYS = [4000, 8000, 15000]; // 4s, 8s, 15s - total ~27s de patience

// Track si le serveur est down pour eviter le spam de retry
let serverDown = false;
let serverDownSince = 0;
const SERVER_DOWN_COOLDOWN = 60000; // 1 min avant de re-essayer

function shouldRetry(error) {
  if (error.config?._retryCount >= MAX_RETRIES) return false;
  // Si serveur deja marque down, pas de retry du tout
  if (serverDown && Date.now() - serverDownSince < SERVER_DOWN_COOLDOWN) return false;

  // FRONT-01: retry sur toute la fenetre 500-504 (pas seulement 503).
  //   500 = crash transitoire (OOM en cours, exception non gere)
  //   502 = Bad Gateway (conteneur Render en train de redemarrer)
  //   503 = Service Unavailable (maintenance / load)
  //   504 = Gateway Timeout (DB slow / API externe lente)
  // Tous ces statuts sont des "rests quelques secondes et re-essaye" legitimes
  // pour un SPA qui enchaine checkout/upload/admin. Avant ce fix, seul 503
  // re-essayait - un 502 pendant un deploy Render plantait le checkout.
  const status = error.response?.status;
  if (status >= 500 && status <= 504) return true;

  // Erreur reseau (pas de reponse = serveur down) - 1 seul retry puis on arrete
  if (!error.response && error.code !== 'ERR_CANCELED') {
    if (error.config?._retryCount >= 1) {
      markServerDown(); // Marquer down des le 1er echec de retry
      return false;
    }
    return true;
  }
  return false;
}

function markServerDown() {
  serverDown = true;
  serverDownSince = Date.now();
}

function markServerUp() {
  serverDown = false;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Intercepteur pour gerer les erreurs + retry
api.interceptors.response.use(
  (response) => {
    markServerUp();
    return response;
  },
  async (error) => {
    // Retry sur erreurs transitoires (503, network/CORS)
    if (shouldRetry(error)) {
      error.config._retryCount += 1;
      const attempt = error.config._retryCount;
      const delay = RETRY_DELAYS[attempt - 1] || 15000;
      console.warn(
        `API retry ${attempt}/${MAX_RETRIES} dans ${delay / 1000}s:`,
        error.config.url
      );
      await wait(delay);
      return api.request(error.config);
    }

    // Marquer le serveur down si erreur reseau apres tous les retries
    if (!error.response && error.code !== 'ERR_CANCELED') {
      markServerDown();
    }

    // 401 = token expire OU race condition pendant l'init auth OU token stale
    // (requete partie avec un ancien token alors que Supabase a refresh entre-temps).
    //
    // Strategie a trois niveaux pour eviter le faux-positif logout :
    //   1. Auth pas encore initialisee : swallow, laisse AuthContext finir
    //   2. Requete partie avec un token DIFFERENT du token Supabase actuel :
    //      retry une fois avec le token frais (un seul retry via _tokenRetry)
    //   3. Meme token Supabase refuse par le backend : vraie expiration ->
    //      dispatch 'auth:expired'. AuthContext ecoute, appelle signOut().
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      if (!isAuthInitialized()) {
        return Promise.reject(error);
      }

      // Protection faux-positif : si le token utilise n'est plus le token actuel,
      // c'est une race (signIn -> navigate -> 1er call avec ancien token).
      // On retry UNE SEULE fois avec le token frais avant de declarer la session morte.
      if (!error.config._tokenRetry && supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          const currentToken = data?.session?.access_token;
          const requestToken = String(error.config.headers.Authorization || '').replace(/^Bearer\s+/i, '');
          if (currentToken && currentToken !== requestToken) {
            error.config._tokenRetry = true;
            error.config.headers.Authorization = `Bearer ${currentToken}`;
            return api.request(error.config);
          }
        } catch { /* fallthrough vers auth:expired */ }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }
    return Promise.reject(error);
  }
);

// Expose pour que le polling puisse verifier avant de spammer
export function isServerDown() {
  return serverDown && Date.now() - serverDownSince < SERVER_DOWN_COOLDOWN;
}

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
