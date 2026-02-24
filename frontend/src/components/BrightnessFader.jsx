import { useCallback, useRef } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../i18n/ThemeContext';
import { THEME_COUNT } from '../utils/brightnessEngine';

function BrightnessFader({ size = 'default' }) {
  const { step, setStep } = useTheme();
  const rafRef = useRef(null);

  const handleInput = useCallback((e) => {
    const val = Number(e.target.value);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setStep(val);
    });
  }, [setStep]);

  const compact = size === 'compact';

  return (
    <div className={`flex items-center ${compact ? 'gap-1.5' : 'gap-2'}`}>
      <Moon size={compact ? 12 : 14} className="text-current opacity-60 flex-shrink-0" />
      <input
        type="range"
        min="0"
        max={THEME_COUNT - 1}
        step="1"
        value={step}
        onInput={handleInput}
        onChange={handleInput}
        className="brightness-slider"
        aria-label="Thème"
        style={{ width: compact ? '60px' : '80px' }}
      />
      <Sun size={compact ? 12 : 14} className="text-current opacity-60 flex-shrink-0" />
    </div>
  );
}

export default BrightnessFader;
