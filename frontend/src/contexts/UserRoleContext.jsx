import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || 'massivemedias@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase());

const UserRoleContext = createContext(null);

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
    setFetched(false);

    async function fetchRole(attempt = 1) {
      try {
        const { data } = await api.get('/user-roles/by-email', {
          params: { email: user.email },
        });
        if (!cancelled) {
          setRoleData(data.data || { role: 'user', artistSlug: null });
          setFetched(true);
        }
      } catch {
        if (!cancelled) {
          // Retry up to 3 times with increasing delay (server might be cold-starting)
          if (attempt < 3) {
            setTimeout(() => {
              if (!cancelled) fetchRole(attempt + 1);
            }, attempt * 10000); // 10s, 20s
          } else {
            // After all retries, fallback to user
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
  const tatoueurSlug = roleData?.tatoueurSlug || null;

  const refreshRole = useCallback(async () => {
    if (!user?.email) return;
    try {
      const { data } = await api.get('/user-roles/by-email', {
        params: { email: user.email },
      });
      setRoleData(data.data || { role: 'user', artistSlug: null, tatoueurSlug: null });
    } catch {
      // ignore
    }
  }, [user?.email]);

  const value = useMemo(() => ({
    role,
    artistSlug,
    tatoueurSlug,
    isAdmin,
    isArtist: role === 'artist',
    isTatoueur: role === 'tatoueur',
    loading,
    refreshRole,
  }), [role, artistSlug, tatoueurSlug, isAdmin, loading, refreshRole]);

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const ctx = useContext(UserRoleContext);
  if (!ctx) return { role: 'user', artistSlug: null, tatoueurSlug: null, isAdmin: false, isArtist: false, isTatoueur: false, loading: false, refreshRole: () => {} };
  return ctx;
}
