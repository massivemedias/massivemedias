import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../i18n/ThemeContext';
import { THEME_NAMES } from '../utils/brightnessEngine';
import { useLang } from '../i18n/LanguageContext';

function BrightnessFader() {
  const { step, setStep } = useTheme();
  const { tx } = useLang();
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    const key = 'mm-theme-tip-seen';
    if (!sessionStorage.getItem(key)) {
      const timer = setTimeout(() => {
        setShowTip(true);
        sessionStorage.setItem(key, '1');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (showTip) {
      const timer = setTimeout(() => setShowTip(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showTip]);

  return (
    <div className="relative" style={{ overflow: 'visible' }}>
      <select
        value={step}
        onChange={(e) => setStep(Number(e.target.value))}
        className="theme-select"
        aria-label="Theme"
      >
        {THEME_NAMES.map((name, i) => (
          <option key={i} value={i}>{name}</option>
        ))}
      </select>

      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.85 }}
            animate={{
              opacity: 1,
              y: [0, -3, 0],
              scale: 1,
            }}
            exit={{ opacity: 0, y: -6, scale: 0.85 }}
            transition={{
              opacity: { duration: 0.3 },
              y: { duration: 1.5, repeat: 2, ease: 'easeInOut' },
              scale: { type: 'spring', stiffness: 400, damping: 15 },
            }}
            className="absolute left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-lg bg-accent text-white text-[11px] font-medium whitespace-nowrap pointer-events-none"
            style={{ top: '100%', zIndex: 9999 }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-accent rotate-45" />
            {tx({ fr: 'Change le thème!', en: 'Try a theme!', es: 'Cambia el tema!' })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BrightnessFader;
