import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCookies } from '../contexts/CookieContext';
import { useAuth } from '../contexts/AuthContext';
import { useArtists } from './useArtists';
import { initGA, trackPageView, setAnalyticsIdentity } from '../utils/analytics';

// Hook to init GA on consent and track page views
export function useAnalytics() {
  const { hasConsent } = useCookies();
  const location = useLocation();
  const { user } = useAuth() || {};
  const { artists } = useArtists() || {};

  // EXCLUSION TRAFIC INTERNE (mission Top 3 oeuvres GA4) : on pousse
  // l'email du user courant + la liste des emails artistes vers le
  // module analytics, qui gate ensuite TOUS les events. Si l'admin
  // ou un artiste regarde sa propre page, aucun hit GA n'est emis.
  useEffect(() => {
    const email = user?.email || '';
    const artistEmails = artists
      ? Object.values(artists).map((a) => a?.email).filter(Boolean)
      : [];
    setAnalyticsIdentity({ email, artistEmails });
  }, [user?.email, artists]);

  // Init GA when analytics consent is given
  useEffect(() => {
    if (hasConsent('analytics')) {
      initGA();
    }
  }, [hasConsent]);

  // Track page views on route change
  useEffect(() => {
    if (hasConsent('analytics')) {
      trackPageView(location.pathname);
    }
  }, [location.pathname, hasConsent]);
}
