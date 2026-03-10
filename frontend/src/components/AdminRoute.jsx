import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../i18n/LanguageContext';

// Emails autorises pour l'admin - configurable via env
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || 'massivemedias@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase());

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const { tx } = useLang();

  if (loading) {
    return (
      <div className="section-container pt-32 text-center">
        <div className="animate-pulse text-grey-muted text-lg">...</div>
      </div>
    );
  }

  // Pas connecte -> page login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Connecte mais pas admin -> acces refuse
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
            {tx({ fr: 'Retour a l\'accueil', en: 'Back to home', es: 'Volver al inicio' })}
          </a>
        </div>
      </div>
    );
  }

  return children;
}

export default AdminRoute;
