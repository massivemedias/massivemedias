import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../contexts/UserRoleContext';
import { useLang } from '../i18n/LanguageContext';

function TatoueurRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { isTatoueur, isAdmin, loading: roleLoading } = useUserRole();
  const { tx } = useLang();

  if (authLoading || roleLoading) {
    return (
      <div className="section-container pt-32 text-center">
        <div className="animate-pulse text-grey-muted text-lg">...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin a acces a tout
  if (!isTatoueur && !isAdmin) {
    return (
      <div className="section-container pt-32 pb-20 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">&#x1f3a8;</div>
          <h1 className="text-2xl font-heading font-bold text-heading mb-3">
            {tx({ fr: 'Espace tatoueur', en: 'Tattoo artist area' })}
          </h1>
          <p className="text-grey-muted mb-6">
            {tx({
              fr: "Cette page est reservee aux tatoueurs partenaires de Massive Medias.",
              en: "This page is reserved for Massive Medias partner tattoo artists.",
            })}
          </p>
          <Link to="/tatoueur/inscription" className="btn-primary inline-block">
            {tx({ fr: "S'inscrire comme tatoueur", en: 'Sign up as a tattoo artist' })}
          </Link>
        </div>
      </div>
    );
  }

  return children;
}

export default TatoueurRoute;
