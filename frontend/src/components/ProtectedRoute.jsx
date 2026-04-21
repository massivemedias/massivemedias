import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Route protegee (utilisateur authentifie requis, pas besoin d'etre admin).
 * Meme contrat que AdminRoute pour eviter le bug race condition au hard refresh :
 *
 *   1. Si isInitializing : render spinner, JAMAIS de redirect
 *   2. Si !user : redirect vers /login avec ?redirect=<chemin courant>
 *   3. Sinon : render children
 */
function ProtectedRoute({ children }) {
  const { user, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="section-container pt-32 pb-20 flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    const redirectParam = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectParam}`} replace />;
  }

  return children;
}

export default ProtectedRoute;
