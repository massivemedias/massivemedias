import { useCallback, useRef } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../i18n/ThemeContext';

function BrightnessFader({ size = 'default' }) {
  const { brightness, setBrightness } = useTheme();
  const rafRef = useRef(null);

  const handleInput = useCallback((e) => {
    const val = Number(e.target.value);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setBrightness(val);
    });
  }, [setBrightness]);

  const compact = size === 'compact';

  return (
    <div className={`flex items-center ${compact ? 'gap-1.5' : 'gap-2'}`}>
      <Moon size={compact ? 12 : 14} className="text-current opacity-60 flex-shrink-0" />
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={brightness}
        onInput={handleInput}
        onChange={handleInput}
        className="brightness-slider"
        aria-label="Brightness"
        style={{ width: compact ? '60px' : '80px' }}
      />
      <Sun size={compact ? 12 : 14} className="text-current opacity-60 flex-shrink-0" />
    </div>
  );
}

export default BrightnessFader;
