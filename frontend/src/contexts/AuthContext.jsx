import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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

  // OPTION NUCLEAIRE : listener 'auth:expired' neutralise.
  // Les faux-positifs 401 deconnectaient l'admin instantanement apres signIn.
  // On garde l'ecoute pour tracer dans la console, mais on NE TOUCHE PLUS a
  // la session : pas de signOut, pas de setUser(null). La session Supabase
  // reste active. L'intercepteur axios ne dispatch plus cet event non plus
  // (voir services/api.js), donc ce listener ne devrait plus fire - mais on
  // le garde comme filet de securite tant qu'une autre partie du code pourrait
  // le dispatcher.
  useEffect(() => {
    const onExpired = () => {
      console.error('[auth] 401 Intercepte - Auto-logout desactive pour la stabilite');
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

  // FORCE-LOGOUT (8 mai 2026) : la deconnexion DOIT toujours aboutir au plan
  // local meme si le call reseau vers Supabase echoue (ERR_CONNECTION_CLOSED,
  // antivirus qui bloque, offline, etc.). Avant ce fix, un fetch crash laissait
  // l'UI gelee : setPasswordRecovery(false) n'etait jamais atteint, setUser
  // restait au user connecte, et le bouton "Deconnexion" donnait l'impression
  // d'etre cassse. On wrap dans try/catch et on force-clear dans tous les cas.
  //
  // Param optionnel `redirectTo` pour piloter la cible de redirection (defaut
  // homepage). On utilise window.location.href plutot que useNavigate() pour
  // garantir un full reload qui reset TOUT le state React (caches React-Query,
  // contexts, refs) - critique apres un logout pour eviter de laisser fuiter
  // des donnees du compte precedent dans un autre onglet de meme origin.
  const signOut = useCallback(async (redirectTo = '/') => {
    // Robustesse : Account.jsx fait <button onClick={signOut}> ce qui passe le
    // SyntheticEvent React en premier argument. Si redirectTo n'est pas une
    // string, on retombe sur la homepage pour eviter window.location.replace(<event>)
    // qui partirait dans le decor.
    if (typeof redirectTo !== 'string' || !redirectTo.startsWith('/')) {
      redirectTo = '/';
    }

    // Helper : balaye localStorage pour purger toute trace de session Supabase.
    // Les SDK Supabase stockent le refresh token sous une cle dynamique du type
    // `sb-<project-ref>-auth-token` qu'on ne peut pas hardcoder. On itere donc
    // sur toutes les keys et on supprime ce qui matche le prefixe sb-.
    const purgeLocalSession = () => {
      try {
        localStorage.removeItem('token');
        // Snapshot des keys avant iteration : modifier localStorage pendant le
        // for-loop decale les indices et fait sauter des entrees.
        const keys = Object.keys(localStorage);
        for (const k of keys) {
          if (k.startsWith('sb-') || k === 'supabase.auth.token') {
            localStorage.removeItem(k);
          }
        }
        // sessionStorage par precaution (certaines integrations OAuth posent
        // des handshake tokens ici)
        const sKeys = Object.keys(sessionStorage);
        for (const k of sKeys) {
          if (k.startsWith('sb-')) sessionStorage.removeItem(k);
        }
      } catch (e) {
        // localStorage indisponible (mode prive Safari) ou quota plein : on
        // log et on continue. Le clear local du state React reste effectif.
        console.warn('[auth] purgeLocalSession partial:', e?.message || e);
      }
    };

    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      // ERR_CONNECTION_CLOSED, timeout, antivirus, etc. : on ignore, on continue
      // vers le clear local. Le serveur Supabase aura un refresh_token "orphelin"
      // qui expirera naturellement (24h) - pas un probleme de securite vu que
      // le client local n'a plus le token.
      console.warn('[auth] signOut reseau a echoue, on force le logout local:', err?.message || err);
    } finally {
      // CRITIQUE : ces 4 actions doivent s'executer meme si signOut throw,
      // sinon l'UI reste gelee sur le compte de l'utilisateur.
      setUser(null);
      setSession(null);
      setPasswordRecovery(false);
      purgeLocalSession();
      // Redirection full-reload pour reset definitivement tout le state React.
      // window.location.replace evite de laisser /account dans l'historique
      // (le bouton retour ramenerait l'utilisateur sur sa page de profil
      // vide une fois deconnecte, UX confusante).
      try {
        window.location.replace(redirectTo);
      } catch (e) {
        // Navigation bloquee (extension, sandbox iframe) : fallback hard reload
        window.location.href = redirectTo;
      }
    }
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

  // GOOGLE-ONE-TAP (3 mai 2026) : echange un ID token Google (recu via le
  // prompt non-bloquant Google Identity Services) contre une session Supabase.
  // Plus rapide que le flow redirect classique : pas de rechargement de page,
  // l'utilisateur reste sur sa page d'origine apres login.
  const signInWithIdToken = useCallback(async ({ provider, token, nonce }) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider,
      token,
      ...(nonce ? { nonce } : {}),
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
    signUp, signIn, signInWithOAuth, signInWithIdToken, signOut, resetPassword, updatePassword, updateProfile, verifyOtp,
  }), [user, session, isInitializing, passwordRecovery, signUp, signIn, signInWithOAuth, signInWithIdToken, signOut, resetPassword, updatePassword, updateProfile, verifyOtp]);

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
