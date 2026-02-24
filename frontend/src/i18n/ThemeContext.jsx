import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { applyBrightness } from '../utils/brightnessEngine';

const ThemeContext = createContext();

const STORAGE_KEY = 'massive-brightness';
const DEFAULT_BRIGHTNESS = 100;

export function ThemeProvider({ children }) {
  const [brightness, setBrightnessState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const val = Number(saved);
        if (!isNaN(val) && val >= 0 && val <= 100) return val;
      }
      // Migration: ancien format "light"/"vibrant"
      const oldTheme = localStorage.getItem('massive-theme');
      if (oldTheme === 'vibrant') return 50;
      return DEFAULT_BRIGHTNESS;
    } catch {
      return DEFAULT_BRIGHTNESS;
    }
  });

  const rafRef = useRef(null);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      applyBrightness(brightness / 100);
    });
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [brightness]);

  const setBrightness = useCallback((value) => {
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    setBrightnessState(clamped);
    try { localStorage.setItem(STORAGE_KEY, String(clamped)); } catch {}
  }, []);

  // Valeur dérivée pour rétro-compatibilité (logo switch, etc.)
  const theme = brightness >= 88 ? 'light' : 'vibrant';

  // toggleTheme conservé pour compat
  const toggleTheme = useCallback(() => {
    setBrightnessState(prev => {
      const next = prev >= 88 ? 50 : 100;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ brightness, setBrightness, theme, toggleTheme }),
    [brightness, setBrightness, theme, toggleTheme]
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
