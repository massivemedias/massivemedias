import { useTheme } from '../i18n/ThemeContext';
import { THEME_NAMES } from '../utils/brightnessEngine';

function BrightnessFader() {
  const { step, setStep } = useTheme();

  return (
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
  );
}

export default BrightnessFader;
