import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { applyTheme, brightnessToStep, THEME_COUNT } from '../utils/brightnessEngine';

const ThemeContext = createContext();

const STORAGE_KEY = 'massive-theme-step';
const OLD_STORAGE_KEY = 'massive-brightness';
const DEFAULT_STEP = THEME_COUNT - 1; // 7 = Blanc

export function ThemeProvider({ children }) {
  const [step, setStepState] = useState(() => {
    try {
      // Nouveau format : step 0-7
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const val = Number(saved);
        if (!isNaN(val) && val >= 0 && val < THEME_COUNT) return val;
      }
      // Migration : ancien format brightness 0-100
      const oldBrightness = localStorage.getItem(OLD_STORAGE_KEY);
      if (oldBrightness !== null) {
        const migrated = brightnessToStep(Number(oldBrightness));
        localStorage.removeItem(OLD_STORAGE_KEY);
        return migrated;
      }
      // Migration : très ancien format "light"/"vibrant"
      const oldTheme = localStorage.getItem('massive-theme');
      if (oldTheme === 'vibrant') return 0;
      return DEFAULT_STEP;
    } catch {
      return DEFAULT_STEP;
    }
  });

  const rafRef = useRef(null);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      applyTheme(step);
    });
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [step]);

  const setStep = useCallback((value) => {
    const clamped = Math.max(0, Math.min(THEME_COUNT - 1, Math.round(value)));
    setStepState(clamped);
    try { localStorage.setItem(STORAGE_KEY, String(clamped)); } catch {}
  }, []);

  // Valeur dérivée pour rétro-compatibilité (CSS overrides, etc.)
  const theme = step <= 5 ? 'vibrant' : 'light';

  // brightness rétro-compatible (pour anti-FOUC dans index.html)
  const brightness = Math.round((step / (THEME_COUNT - 1)) * 100);

  // toggleTheme conservé pour compat
  const toggleTheme = useCallback(() => {
    setStepState(prev => {
      const next = prev <= 5 ? DEFAULT_STEP : 0;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {};
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ step, setStep, brightness, theme, toggleTheme }),
    [step, setStep, brightness, theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
