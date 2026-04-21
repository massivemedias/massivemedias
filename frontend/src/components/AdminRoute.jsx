import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../i18n/LanguageContext';

// Emails autorises pour l'admin - configurable via env
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || 'massivemedias@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase());

/**
 * Route protegee admin. Contrat d'ordre strict pour empecher le bug race
 * condition observe au hard refresh (/admin/* -> / index) :
 *
 *   1. Si isInitializing : render spinner, JAMAIS de redirect
 *   2. Si !user : redirect vers /login avec ?redirect=<chemin courant>
 *   3. Si email pas admin : ecran "access denied" (pas de redirect automatique)
 *   4. Sinon : render children
 *
 * Le step 1 est critique : tant que AuthContext n'a pas resolu getSession(),
 * on ne peut pas savoir si le user est connecte ou non, donc on attend.
 */
function AdminRoute({ children }) {
  const { user, isInitializing } = useAuth();
  const { tx } = useLang();
  const location = useLocation();

  // STEP 1 : auth encore en cours d'initialisation. On attend, on ne redirige pas.
  if (isInitializing) {
    return (
      <div className="section-container pt-32 pb-20 flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  // STEP 2 : auth resolue, user null -> login (en preservant le chemin cible)
  if (!user) {
    const redirectParam = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectParam}`} replace />;
  }

  // STEP 3 : user connecte mais pas dans la whitelist admin
  const email = (user.email || '').toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) {
    return (
      <div className="section-container pt-32 pb-20 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-heading font-bold text-heading mb-3">
            {tx({ fr: 'Acces refuse', en: 'Access denied', es: 'Acceso denegado' })}
          </h1>
          <p className="text-grey-muted mb-6">
            {tx({
              fr: 'Tu n\'as pas les permissions pour acceder a cette page.',
              en: 'You don\'t have permission to access this page.',
              es: 'No tienes permiso para acceder a esta pagina.',
            })}
          </p>
          <a href="/" className="btn-primary inline-block">
            {tx({ fr: 'Retour à l\'accueil', en: 'Back to home', es: 'Volver al inicio' })}
          </a>
        </div>
      </div>
    );
  }

  // STEP 4 : admin authentifie -> render
  return children;
}

export default AdminRoute;
