import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const CookieContext = createContext();

const STORAGE_KEY = 'massive-cookie-consent';

// Categories: necessary (toujours actif), analytics, marketing
function getStoredConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveConsent(consent) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...consent,
      timestamp: Date.now(),
    }));
  } catch {}
}

export function CookieProvider({ children }) {
  const [consent, setConsentState] = useState(() => getStoredConsent());

  // null = pas encore répondu → afficher la bannière
  const showBanner = consent === null;

  const acceptAll = useCallback(() => {
    const c = { necessary: true, analytics: true, marketing: true };
    setConsentState(c);
    saveConsent(c);
  }, []);

  const rejectAll = useCallback(() => {
    const c = { necessary: true, analytics: false, marketing: false };
    setConsentState(c);
    saveConsent(c);
  }, []);

  const acceptSelected = useCallback((selected) => {
    const c = { necessary: true, analytics: !!selected.analytics, marketing: !!selected.marketing };
    setConsentState(c);
    saveConsent(c);
  }, []);

  const hasConsent = useCallback((category) => {
    if (!consent) return false;
    if (category === 'necessary') return true;
    return !!consent[category];
  }, [consent]);

  const value = useMemo(() => ({
    consent,
    showBanner,
    acceptAll,
    rejectAll,
    acceptSelected,
    hasConsent,
  }), [consent, showBanner, acceptAll, rejectAll, acceptSelected, hasConsent]);

  return (
    <CookieContext.Provider value={value}>
      {children}
    </CookieContext.Provider>
  );
}

export function useCookies() {
  const ctx = useContext(CookieContext);
  if (!ctx) throw new Error('useCookies must be used within CookieProvider');
  return ctx;
}
