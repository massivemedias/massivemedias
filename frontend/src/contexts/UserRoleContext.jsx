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

    async function fetchRole() {
      try {
        const { data } = await api.get('/user-roles/by-email', {
          params: { email: user.email },
        });
        if (!cancelled) {
          setRoleData(data.data || { role: 'user', artistSlug: null });
        }
      } catch {
        if (!cancelled) {
          setRoleData({ role: 'user', artistSlug: null });
        }
      } finally {
        if (!cancelled) setFetched(true);
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
