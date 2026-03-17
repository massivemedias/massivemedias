import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setUser(s?.user ?? null);

      // Detect password recovery flow
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
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
    // Notifier le backend de la nouvelle inscription
    if (!error && data?.user) {
      api.post('/clients/notify-signup', {
        name: fullName,
        email,
        provider: 'email',
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
    user, session, loading, passwordRecovery,
    signUp, signIn, signInWithOAuth, signOut, resetPassword, updatePassword, updateProfile, verifyOtp,
  }), [user, session, loading, passwordRecovery, signUp, signIn, signInWithOAuth, signOut, resetPassword, updatePassword, updateProfile, verifyOtp]);

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
