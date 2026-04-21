/**
 * Etat d'initialisation de l'auth, lisible en dehors de React.
 *
 * Pourquoi : l'intercepteur axios dans services/api.js tourne en dehors du cycle
 * React. Quand une requete echoue en 401 PENDANT que AuthContext est en train
 * de resoudre getSession() (race condition au hard refresh), l'intercepteur ne
 * doit PAS rediriger vers /login - la session est en train d'etre validee.
 *
 * AuthContext appelle markAuthInitialized() apres la premiere resolution
 * (succes ou echec) de supabase.auth.getSession(). L'intercepteur consulte
 * isAuthInitialized() avant tout redirect 401.
 */

let _initialized = false;

export function markAuthInitialized() {
  _initialized = true;
}

export function isAuthInitialized() {
  return _initialized;
}

// Utile pour les tests ou un sign-out global
export function resetAuthInitialized() {
  _initialized = false;
}
