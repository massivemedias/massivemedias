/**
 * GoogleOneTap - prompt de connexion Google non-bloquant
 *
 * Charge le SDK Google Identity Services (https://accounts.google.com/gsi/client),
 * initialise un client avec VITE_GOOGLE_CLIENT_ID, et declenche le prompt
 * "One Tap" qui apparait en haut a droite si :
 *   1. L'utilisateur n'est pas deja connecte (sinon skip silencieux)
 *   2. Le user n'a pas dismiss le prompt recemment (cookie GIS auto-gere)
 *   3. VITE_GOOGLE_CLIENT_ID est defini
 *
 * Au retour du token Google, on echange contre une session Supabase via
 * signInWithIdToken('google'). L'utilisateur est cree (premier login) ou
 * connecte automatiquement.
 *
 * Usage : monter une seule fois en haut de l'arbre (MainLayout). Le
 * composant s'auto-destruit apres login reussi pour eviter de re-prompt
 * sur les pages internes.
 */
import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function loadGisScript() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.google?.accounts?.id) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${GIS_SCRIPT_SRC}"]`);
    if (existing) {
      // Script deja injecte par un autre composant - attendre qu'il finisse
      existing.addEventListener('load', () => resolve(!!window.google?.accounts?.id));
      existing.addEventListener('error', () => resolve(false));
      // S'il a deja load avant qu'on s'abonne :
      if (window.google?.accounts?.id) resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(!!window.google?.accounts?.id);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export default function GoogleOneTap() {
  const { user, isInitializing, signInWithIdToken } = useAuth();
  const promptedRef = useRef(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    // Garde-fous successifs :
    // 1. Pas de client ID configure -> on log un warn dev seulement, pas d'erreur runtime
    if (!CLIENT_ID) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.info('[GoogleOneTap] VITE_GOOGLE_CLIENT_ID non defini - prompt desactive');
      }
      return;
    }
    // 2. Auth pas encore initialisee (Supabase getSession en cours) - on attend
    if (isInitializing) return;
    // 3. Deja connecte -> ne pas prompt
    if (user) return;
    // 4. Deja prompt durant cette session client -> ne pas re-prompt
    if (promptedRef.current) return;

    let cancelled = false;
    cancelledRef.current = false;

    (async () => {
      const loaded = await loadGisScript();
      if (cancelled || !loaded) return;
      if (!window.google?.accounts?.id) return;

      try {
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (response) => {
            const credential = response?.credential;
            if (!credential) return;
            try {
              const { error } = await signInWithIdToken({
                provider: 'google',
                token: credential,
              });
              if (error) {
                // eslint-disable-next-line no-console
                console.warn('[GoogleOneTap] signInWithIdToken failed:', error.message || error);
              } else {
                // Cleanup : la session Supabase prend la suite, AuthContext re-render
                window.google?.accounts?.id?.cancel();
              }
            } catch (err) {
              // eslint-disable-next-line no-console
              console.warn('[GoogleOneTap] callback error:', err?.message || err);
            }
          },
          auto_select: false, // l'utilisateur doit confirmer le compte choisi
          cancel_on_tap_outside: true,
          // FedCM API obligatoire depuis Chrome 128 (oct 2024). Sans ca le
          // prompt One Tap ne s'affiche plus du tout sur Chrome moderne.
          use_fedcm_for_prompt: true,
          context: 'signin',
        });

        if (!cancelled) {
          promptedRef.current = true;
          window.google.accounts.id.prompt();
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[GoogleOneTap] init failed:', err?.message || err);
      }
    })();

    return () => {
      cancelled = true;
      cancelledRef.current = true;
      try { window.google?.accounts?.id?.cancel(); } catch { /* ignore */ }
    };
  }, [user, isInitializing, signInWithIdToken]);

  // Pas de DOM rendu - tout se passe via le SDK Google qui gere son propre overlay.
  return null;
}
