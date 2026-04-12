import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paintbrush } from 'lucide-react';
import { useTheme } from '../i18n/ThemeContext';
import { THEME_NAMES, THEME_COLORS, THEME_ACCENTS } from '../utils/brightnessEngine';
import { useLang } from '../i18n/LanguageContext';

function BrightnessFader() {
  const { step, setStep } = useTheme();
  const { tx } = useLang();
  const [open, setOpen] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const ref = useRef(null);

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

  // Fermer le dropdown au clic exterieur
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref} style={{ overflow: 'visible' }}>
      {/* Icone palette */}
      <button
        onClick={() => { setOpen(!open); setShowTip(false); }}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Theme"
      >
        <Paintbrush size={18} style={{ color: THEME_ACCENTS[step] }} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 p-2 rounded-xl border border-white/10 shadow-2xl shadow-black/50"
            style={{ zIndex: 9999, minWidth: '160px', backgroundColor: THEME_COLORS[step] }}
          >
            {THEME_NAMES.map((name, i) => {
              const isSelected = step === i;
              return (
                <button
                  key={i}
                  onClick={() => { setStep(i); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                    isSelected ? 'font-semibold ring-1' : 'hover:opacity-90'
                  }`}
                  style={{
                    background: isSelected ? THEME_COLORS[i] : 'transparent',
                    color: isSelected ? THEME_ACCENTS[i] : undefined,
                    ringColor: isSelected ? THEME_ACCENTS[i] : undefined,
                    borderColor: isSelected ? THEME_ACCENTS[i] : undefined,
                    boxShadow: isSelected ? `inset 0 0 0 1px ${THEME_ACCENTS[i]}40` : undefined,
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      background: THEME_COLORS[i],
                      border: i >= 9 ? '1.5px solid rgba(0,0,0,0.15)' : `1.5px solid ${THEME_ACCENTS[i]}40`,
                      boxShadow: `inset 0 0 0 1px ${THEME_ACCENTS[i]}30`,
                    }}
                  />
                  <span className={isSelected ? '' : 'text-grey-light'}>{name}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <AnimatePresence>
        {showTip && !open && (
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
            {tx({ fr: 'Change le theme!', en: 'Try a theme!', es: 'Cambia el tema!' })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BrightnessFader;
