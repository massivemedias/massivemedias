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

// Retry automatique sur 503 (Render cold start) et erreurs reseau
// Render free tier: hiberne apres 15min, reveil prend ~60s
const MAX_RETRIES = 3;
const RETRY_DELAYS = [4000, 8000, 15000]; // 4s, 8s, 15s - total ~27s de patience

function shouldRetry(error) {
  if (error.config?._retryCount >= MAX_RETRIES) return false;
  // 503 = Render en train de demarrer
  if (error.response?.status === 503) return true;
  // Erreur reseau / CORS bloque (pas de reponse = serveur dort, preflight CORS echoue)
  if (!error.response && error.code !== 'ERR_CANCELED') return true;
  return false;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Ping de warmup: reveille le serveur Render des le chargement du site
// Utilise fetch() direct (pas Axios) pour eviter les intercepteurs
let warmupDone = false;
function warmupServer() {
  if (warmupDone) return;
  warmupDone = true;
  const url = API_URL.replace(/\/api\/?$/, '');
  fetch(url, { method: 'HEAD', mode: 'no-cors' }).catch(() => {});
}
if (typeof window !== 'undefined') {
  warmupServer();
}

// Intercepteur pour gerer les erreurs + retry
api.interceptors.response.use(
  (response) => response,
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

    // 401 = token expire
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      localStorage.removeItem('token');
      const protectedPaths = ['/account', '/checkout', '/mm-admin'];
      if (protectedPaths.some(p => window.location.pathname.startsWith(p))) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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
