import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// FIX-INCOGNITO-OAUTH (6 mai 2026) : on force flowType: 'pkce' explicitement.
// En nav privee Chrome, les third-party cookies sont bloques par defaut, ce qui
// casse le flow OAuth implicit qui s'appuie sur un cookie cross-site de
// supabase.co pour tracker le state -> erreur "OAuth state not found or expired"
// au retour de Google.
//
// PKCE flow : le code_verifier est genere et stocke en localStorage cote client
// sur notre propre domaine (pas de cookie tiers). Au retour, le client envoie
// le verifier dans le body de l'echange contre la session. Ne depend d'aucun
// cookie cross-site, donc fonctionne partout (incognito, Safari ITP, etc.).
//
// storage: window.localStorage explicit -> evite que Supabase tombe sur un
// fallback memoire si la detection feature-detect echoue (cas rares Safari).
//
// persistSession + autoRefreshToken + detectSessionInUrl : valeurs par defaut
// rendues explicites pour ne pas dependre d'un changement de default Supabase
// dans une future bump de version.
let supabaseClient = null;
try {
  if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
} catch {
  // silently fail - auth features disabled
}

export const supabase = supabaseClient;
