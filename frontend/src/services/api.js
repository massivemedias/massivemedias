import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337/api';

const api = axios.create({
  baseURL: API_URL,
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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
// Ne redirige vers /login que pour les requêtes authentifiées (pas les requêtes publiques)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      localStorage.removeItem('token');
      // Ne redirige que si on est déjà sur une page protégée
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
