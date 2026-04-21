import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || 'massivemedias@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase());

const UserRoleContext = createContext(null);

const ROLE_CACHE_KEY = 'mm-user-role-cache';

function getCachedRole(email) {
  try {
    const raw = localStorage.getItem(ROLE_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (cached.email === email && Date.now() - cached.ts < 86400000) return cached.data;
  } catch { /* ignore */ }
  return null;
}

function setCachedRole(email, data) {
  try {
    localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify({ email, data, ts: Date.now() }));
  } catch { /* ignore */ }
}

export function UserRoleProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [roleData, setRoleData] = useState(null);
  const [fetched, setFetched] = useState(false);

  const email = (user?.email || '').toLowerCase();
  const isAdmin = ADMIN_EMAILS.includes(email);

  // loading = true tant que auth OU role n'ont pas fini
  const loading = authLoading || (!fetched && !!user?.email);

  useEffect(() => {
    if (authLoading) return;

    if (!user?.email) {
      setRoleData(null);
      setFetched(true);
      return;
    }

    let cancelled = false;

    // Utiliser le cache localStorage pour un affichage instantane
    const cached = getCachedRole(user.email);
    if (cached) {
      setRoleData(cached);
      setFetched(true);
    } else {
      setFetched(false);
    }

    async function fetchRole(attempt = 1) {
      try {
        const { data } = await api.get('/user-roles/by-email', {
          params: { email: user.email },
        });
        if (!cancelled) {
          const rd = data.data || { role: 'user', artistSlug: null };
          setRoleData(rd);
          setCachedRole(user.email, rd);
          setFetched(true);
        }
      } catch {
        if (!cancelled) {
          // Retry up to 3 times with shorter delays (3s, 6s)
          if (attempt < 3) {
            setTimeout(() => {
              if (!cancelled) fetchRole(attempt + 1);
            }, attempt * 3000);
          } else if (!cached) {
            // After all retries and no cache, fallback to user
            setRoleData({ role: 'user', artistSlug: null });
            setFetched(true);
          }
        }
      }
    }

    fetchRole();
    return () => { cancelled = true; };
  }, [user?.email, authLoading]);

  const role = isAdmin ? 'admin' : (roleData?.role || 'user');
  const artistSlug = roleData?.artistSlug || null;

  const refreshRole = useCallback(async () => {
    if (!user?.email) return;
    try {
      const { data } = await api.get('/user-roles/by-email', {
        params: { email: user.email },
      });
      setRoleData(data.data || { role: 'user', artistSlug: null });
    } catch {
      // ignore
    }
  }, [user?.email]);

  const value = useMemo(() => ({
    role,
    artistSlug,
    isAdmin,
    isArtist: role === 'artist',
    loading,
    refreshRole,
  }), [role, artistSlug, isAdmin, loading, refreshRole]);

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const ctx = useContext(UserRoleContext);
  if (!ctx) return { role: 'user', artistSlug: null, isAdmin: false, isArtist: false, loading: false, refreshRole: () => {} };
  return ctx;
}
