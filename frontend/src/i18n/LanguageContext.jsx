import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import translations from './translations';

const LanguageContext = createContext();

function get(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem('massive-lang');
      return saved === 'en' ? 'en' : 'fr';
    } catch {
      return 'fr';
    }
  });

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'fr' ? 'en' : 'fr';
      try { localStorage.setItem('massive-lang', next); } catch {}
      document.documentElement.lang = next;
      return next;
    });
  }, []);

  const t = useCallback((key, fallback) => {
    const result = get(translations[lang], key);
    if (result !== undefined) return result;
    // Fallback to French if key missing in current lang
    const frResult = get(translations.fr, key);
    if (frResult !== undefined) return frResult;
    return fallback || key;
  }, [lang]);

  const value = useMemo(() => ({ lang, toggleLang, t }), [lang, toggleLang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
