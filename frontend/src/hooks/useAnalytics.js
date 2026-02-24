import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCookies } from '../contexts/CookieContext';
import { initGA, trackPageView } from '../utils/analytics';

// Hook to init GA on consent and track page views
export function useAnalytics() {
  const { hasConsent } = useCookies();
  const location = useLocation();

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
