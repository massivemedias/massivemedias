import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import api from '../services/api';
import { markAuthInitialized } from '../services/authState';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  // isInitializing = on attend la reponse initiale de supabase.auth.getSession().
  // Pendant cette fenetre, les routes protegees affichent un spinner et NE redirigent
  // JAMAIS (c'est la source principale du bug race-condition admin->index).
  // Expose aussi `loading` comme alias backward-compat pour le code existant.
  const [isInitializing, setIsInitializing] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setIsInitializing(false);
      markAuthInitialized();
      return;
    }

    // Sync Supabase JWT to localStorage so axios interceptor in services/api.js can pick it up
    // and attach Authorization: Bearer <jwt> to every request.
    const syncToken = (s) => {
      try {
        if (s?.access_token) {
          localStorage.setItem('token', s.access_token);
        } else {
          localStorage.removeItem('token');
        }
      } catch (e) { /* quota / private mode - ignore */ }
    };

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      // IMPORTANT : syncToken AVANT les setState. Les setState declenchent
      // des re-renders qui peuvent causer des navigations (Login -> /admin),
      // lesquelles montent des composants qui firent des API calls. Si le
      // token n'est pas deja dans localStorage, ces calls partent sans auth.
      syncToken(s);
      setSession(s);
      setUser(s?.user ?? null);
      setIsInitializing(false);
      markAuthInitialized();
    }).catch(() => {
      // Session fetch failed (reseau, supabase down) : on debloquer quand meme l'UI
      // sinon le spinner reste coince a vie. Les routes protegees redirigeront vers /login.
      setIsInitializing(false);
      markAuthInitialized();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      // syncToken AVANT setState (voir commentaire ci-dessus). Critique apres
      // SIGNED_IN : Login.jsx navigate('/admin') des que session est truthy,
      // donc il faut que localStorage.token soit deja ecrit au moment du render.
      syncToken(s);
      setSession(s);
      setUser(s?.user ?? null);

      // Detect password recovery flow
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Ecoute l'evenement 'auth:expired' emis par l'intercepteur axios quand le
  // backend renvoie 401 sur un call authentifie. Plutot qu'un reload brutal
  // (ancien window.location.href qui boucle parce que Supabase remet le token
  // en cache a chaque reboot), on appelle supabase.auth.signOut() : detruit
  // la session, fire SIGNED_OUT, user -> null. Les AdminRoute/ProtectedRoute
  // redirigent alors vers /login via Navigate (React Router, pas reload).
  const handlingExpiredRef = useRef(false);
  useEffect(() => {
    if (!supabase) return;
    const onExpired = async () => {
      if (handlingExpiredRef.current) return; // de-dup : plusieurs 401 en rafale
      handlingExpiredRef.current = true;
      try {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
      } catch (e) {
        // Meme si signOut fail (reseau), on force l'etat local a signed-out
        setUser(null);
        setSession(null);
      } finally {
        try { localStorage.removeItem('token'); } catch {}
        // Reset la garde apres un court delai pour absorber la prochaine session
        setTimeout(() => { handlingExpiredRef.current = false; }, 1500);
      }
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const signUp = useCallback(async (email, password, fullName, referredBy) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    const meta = { full_name: fullName };
    if (referredBy) meta.referred_by = referredBy;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: meta },
    });
    // Notifier le backend de la nouvelle inscription + linker les guest orders par email
    if (!error && data?.user) {
      api.post('/clients/notify-signup', {
        name: fullName,
        email,
        provider: 'email',
        supabaseUserId: data.user.id,
      }).catch(() => {});
    }
    return { data, error };
  }, []);

  const verifyOtp = useCallback(async (email, token) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });
    return { data, error };
  }, []);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setPasswordRecovery(false);
  }, []);

  const resetPassword = useCallback(async (email) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    return { data, error };
  }, []);

  const updatePassword = useCallback(async (newPassword) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) {
      setPasswordRecovery(false);
    }
    return { data, error };
  }, []);

  const signInWithOAuth = useCallback(async (provider) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    });
    return { data, error };
  }, []);

  const updateProfile = useCallback(async (metadata) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    const { data, error } = await supabase.auth.updateUser({
      data: metadata,
    });
    if (!error && data?.user) {
      setUser(data.user);
    }
    return { data, error };
  }, []);

  const value = useMemo(() => ({
    user, session,
    // Alias pour retrocompat (plein de code lit `loading`). Nouveau nom explicite : isInitializing.
    loading: isInitializing,
    isInitializing,
    passwordRecovery,
    signUp, signIn, signInWithOAuth, signOut, resetPassword, updatePassword, updateProfile, verifyOtp,
  }), [user, session, isInitializing, passwordRecovery, signUp, signIn, signInWithOAuth, signOut, resetPassword, updatePassword, updateProfile, verifyOtp]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
