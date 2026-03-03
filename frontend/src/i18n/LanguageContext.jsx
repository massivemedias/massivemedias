import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import translations from './translations';

const LanguageContext = createContext();

const SUPPORTED_LANGS = ['fr', 'en', 'es'];
const DEFAULT_LANG = 'fr';

function get(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem('massive-lang');
      if (saved && SUPPORTED_LANGS.includes(saved)) return saved;

      // Auto-detect browser language on first visit
      const browserLangs = navigator.languages || [navigator.language || ''];
      for (const bl of browserLangs) {
        const code = bl.toLowerCase().split('-')[0];
        if (SUPPORTED_LANGS.includes(code)) return code;
      }
      return DEFAULT_LANG;
    } catch {
      return DEFAULT_LANG;
    }
  });

  const setLang = useCallback((newLang) => {
    if (!SUPPORTED_LANGS.includes(newLang)) return;
    setLangState(newLang);
    try { localStorage.setItem('massive-lang', newLang); } catch {}
    document.documentElement.lang = newLang;
  }, []);

  const cycleLang = useCallback(() => {
    setLangState(prev => {
      const idx = SUPPORTED_LANGS.indexOf(prev);
      const next = SUPPORTED_LANGS[(idx + 1) % SUPPORTED_LANGS.length];
      try { localStorage.setItem('massive-lang', next); } catch {}
      document.documentElement.lang = next;
      return next;
    });
  }, []);

  const t = useCallback((key, fallback) => {
    const result = get(translations[lang], key);
    if (result !== undefined) return result;
    // Fallback: es -> en -> fr
    if (lang === 'es') {
      const enResult = get(translations.en, key);
      if (enResult !== undefined) return enResult;
    }
    const frResult = get(translations.fr, key);
    if (frResult !== undefined) return frResult;
    return fallback || key;
  }, [lang]);

  // Inline translation helper for migrating ternaries
  // Usage: tx({ fr: 'Bonjour', en: 'Hello', es: 'Hola' })
  const tx = useCallback((map) => {
    return map[lang] || map.en || map.fr || '';
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, cycleLang, toggleLang: cycleLang, t, tx }), [lang, setLang, cycleLang, t, tx]);

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
