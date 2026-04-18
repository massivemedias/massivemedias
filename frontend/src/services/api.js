import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
  // 503 = backend en train de redemarrer (post-deploy ou incident) - retry normal
  if (error.response?.status === 503) return true;
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

    // 401 = token expire
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      localStorage.removeItem('token');
      const protectedPaths = ['/account', '/checkout', '/mm-admin', '/admin'];
      if (protectedPaths.some(p => window.location.pathname.startsWith(p))) {
        window.location.href = '/login?expired=1';
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
