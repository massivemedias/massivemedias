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
const MAX_RETRIES = 2;
const RETRY_DELAY = 3000; // 3 secondes entre chaque retry

function shouldRetry(error) {
  if (error.config?._retryCount >= MAX_RETRIES) return false;
  // 503 = Render en train de demarrer
  if (error.response?.status === 503) return true;
  // Erreur reseau (pas de reponse du serveur)
  if (!error.response && error.code !== 'ERR_CANCELED') return true;
  return false;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Intercepteur pour gerer les erreurs + retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Retry sur erreurs transitoires (503, network)
    if (shouldRetry(error)) {
      error.config._retryCount += 1;
      const attempt = error.config._retryCount;
      const delay = RETRY_DELAY * attempt; // 3s, 6s
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
