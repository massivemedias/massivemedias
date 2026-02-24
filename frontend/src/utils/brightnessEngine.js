// ============================================================
// brightnessEngine.js - Moteur pour le fader de luminosité
// Interpolation fluide entre vibrant (gauche) et light (droite)
// ============================================================

// ---------- Color helpers ----------

function parseColor(str) {
  if (!str || str === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  str = str.trim();

  if (str.startsWith('#')) {
    let hex = str.slice(1);
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: 1,
    };
  }

  const m = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (m) {
    return {
      r: parseFloat(m[1]),
      g: parseFloat(m[2]),
      b: parseFloat(m[3]),
      a: m[4] !== undefined ? parseFloat(m[4]) : 1,
    };
  }

  return { r: 0, g: 0, b: 0, a: 1 };
}

function toRgba({ r, g, b, a }) {
  r = Math.round(Math.max(0, Math.min(255, r)));
  g = Math.round(Math.max(0, Math.min(255, g)));
  b = Math.round(Math.max(0, Math.min(255, b)));
  a = Math.round(a * 1000) / 1000;
  if (a >= 1) return `rgb(${r}, ${g}, ${b})`;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function lerpColor(c1, c2, t) {
  return {
    r: c1.r + (c2.r - c1.r) * t,
    g: c1.g + (c2.g - c1.g) * t,
    b: c1.b + (c2.b - c1.b) * t,
    a: c1.a + (c2.a - c1.a) * t,
  };
}

function interpolateColor(startVal, endVal, t) {
  return toRgba(lerpColor(parseColor(startVal), parseColor(endVal), t));
}

// ---------- Shadow interpolation ----------

function parseShadow(str) {
  if (!str || str === 'none') return null;
  const colorMatch = str.match(/(rgba?\([^)]+\))/);
  if (!colorMatch) return null;
  const color = colorMatch[1];
  const prefix = str.slice(0, str.indexOf(color)).trim();
  return { prefix, color };
}

function interpolateShadow(startVal, endVal, t) {
  const sA = parseShadow(startVal);
  const sB = parseShadow(endVal);
  if (!sA || !sB) return t < 0.5 ? startVal : endVal;
  const color = interpolateColor(sA.color, sB.color, t);
  const prefix = t < 0.5 ? sA.prefix : sB.prefix;
  return `${prefix} ${color}`;
}

// ---------- 2 Palettes ----------

// 0% (gauche) - Vibrant violet
const PALETTE_START = {
  '--color-purple-dark': '#150030',
  '--color-purple-mid': '#220050',
  '--color-purple-main': '#2C0066',
  '--color-grey-light': '#E8D4FF',
  '--color-grey-muted': '#B89CDB',
  '--color-heading': '#FFFFFF',
  '--logo-main': '#FF52A0',
  '--logo-accent': '#FFCC00',
  '--aurora-glow1': 'rgba(60, 0, 140, 0.5)',
  '--aurora-glow2': 'rgba(255, 82, 160, 0.15)',
  '--aurora-glow3': 'rgba(44, 0, 102, 1)',
  '--aurora-bg-start': '#220050',
  '--aurora-bg-mid': '#2C0066',
  '--aurora-bg-end': '#220050',
  '--bg-body': '#2C0066',
  '--bg-card': 'rgba(255, 255, 255, 0.08)',
  '--bg-card-solid': 'rgba(25, 0, 55, 0.85)',
  '--bg-card-border': 'rgba(255, 82, 160, 0.15)',
  '--bg-header': 'rgba(44, 0, 102, 0.96)',
  '--bg-footer': '#150030',
  '--bg-input': 'rgba(44, 0, 102, 0.5)',
  '--bg-input-border': 'rgba(255, 82, 160, 0.2)',
  '--bg-glass': 'rgba(255, 255, 255, 0.06)',
  '--bg-glass-alt': 'rgba(255, 255, 255, 0.08)',
  '--bg-table-head': 'rgba(44, 0, 102, 0.6)',
  '--bg-select-option': '#2C0066',
  '--icon-bg': 'rgba(255, 82, 160, 0.12)',
  '--header-dropdown-bg': '#2C0066',
  '--header-item-hover': 'rgba(255, 255, 255, 0.1)',
  '--header-border': 'rgba(255, 82, 160, 0.15)',
  '--nav-text': 'rgba(255, 255, 255, 0.85)',
  '--nav-text-hover': '#FFFFFF',
  '--outline-border': 'rgba(255, 82, 160, 0.35)',
  '--outline-hover-bg': 'rgba(255, 82, 160, 0.1)',
  '--outline-hover-border': 'rgba(255, 82, 160, 0.6)',
  '--table-border': 'rgba(255, 82, 160, 0.08)',
  '--table-hover': 'rgba(255, 82, 160, 0.05)',
  '--scrollbar-track': '#220050',
  '--scrollbar-thumb': '#4A1090',
  '--scrollbar-thumb-hover': '#FF52A0',
  '--pattern-dot': 'rgba(255, 82, 160, 0.12)',
  '--overlay-cta': 'rgba(44, 0, 102, 0.92)',
  '--icon-glass': 'rgba(255, 255, 255, 0.12)',
  '--toggle-border': 'rgba(255, 82, 160, 0.3)',
  '--toggle-text': 'rgba(255, 255, 255, 0.85)',
  '--toggle-hover-border': 'rgba(255, 82, 160, 0.5)',
  '--footer-border': 'rgba(255, 82, 160, 0.12)',
  '--footer-text': '#FFFFFF',
  '--footer-text-muted': 'rgba(255, 255, 255, 0.5)',
  '--btn-outline-text': '#FFFFFF',
  '--card-shadow': '0 4px 24px rgba(0, 0, 0, 0.2)',
  '--header-dropdown-shadow': '0 8px 32px rgba(0, 0, 0, 0.4)',
  '--header-shadow': 'none',
  '--hero-gradient': 'linear-gradient(180deg, rgba(44,0,102,0.85) 0%, rgba(21,0,48,0.92) 100%)',
  '--highlight-bg': 'linear-gradient(145deg, rgba(44,0,102,0.5), rgba(34,0,80,0.4))',
  '--cta-bg': 'linear-gradient(145deg, rgba(44,0,102,0.7), rgba(34,0,80,0.5))',
  '--cta-text-bg': 'linear-gradient(145deg, rgba(44,0,102,0.5), rgba(34,0,80,0.4))',
  '--space-overlay': 'linear-gradient(180deg, transparent 0%, rgba(21,0,48,0.95) 100%)',
  '--icon-glass-blur': 'blur(8px)',
};

// 100% (droite) - Light blanc
const PALETTE_END = {
  '--color-purple-dark': '#FFFFFF',
  '--color-purple-mid': '#F8F5FC',
  '--color-purple-main': '#D9CCE8',
  '--color-grey-light': '#4A3B5C',
  '--color-grey-muted': '#8B7BA0',
  '--color-heading': '#1E0E30',
  '--logo-main': '#C400FF',
  '--logo-accent': '#FF00A1',
  '--aurora-glow1': 'rgba(73, 0, 168, 0.08)',
  '--aurora-glow2': 'rgba(255, 82, 160, 0.06)',
  '--aurora-glow3': 'rgba(0, 0, 0, 0)',
  '--aurora-bg-start': '#F8F5FC',
  '--aurora-bg-mid': '#FFFFFF',
  '--aurora-bg-end': '#FFFFFF',
  '--bg-body': '#FFFFFF',
  '--bg-card': '#FFFFFF',
  '--bg-card-solid': '#FFFFFF',
  '--bg-card-border': 'rgba(129, 0, 209, 0.10)',
  '--bg-header': 'rgba(255, 255, 255, 0.96)',
  '--bg-footer': '#1E0E30',
  '--bg-input': 'rgba(129, 0, 209, 0.03)',
  '--bg-input-border': 'rgba(129, 0, 209, 0.15)',
  '--bg-glass': 'rgba(129, 0, 209, 0.02)',
  '--bg-glass-alt': 'rgba(129, 0, 209, 0.04)',
  '--bg-table-head': '#F8F5FC',
  '--bg-select-option': '#FFFFFF',
  '--icon-bg': 'rgba(129, 0, 209, 0.06)',
  '--header-dropdown-bg': '#FFFFFF',
  '--header-item-hover': '#F8F5FC',
  '--header-border': 'rgba(129, 0, 209, 0.08)',
  '--nav-text': '#4A3B5C',
  '--nav-text-hover': '#1E0E30',
  '--outline-border': 'rgba(129, 0, 209, 0.20)',
  '--outline-hover-bg': 'rgba(129, 0, 209, 0.04)',
  '--outline-hover-border': 'rgba(255, 82, 160, 0.5)',
  '--table-border': 'rgba(129, 0, 209, 0.06)',
  '--table-hover': 'rgba(129, 0, 209, 0.03)',
  '--scrollbar-track': '#F8F5FC',
  '--scrollbar-thumb': '#D9CCE8',
  '--scrollbar-thumb-hover': '#8100D1',
  '--pattern-dot': 'transparent',
  '--overlay-cta': 'rgba(30, 14, 48, 0.88)',
  '--icon-glass': 'rgba(129, 0, 209, 0.06)',
  '--toggle-border': 'rgba(129, 0, 209, 0.18)',
  '--toggle-text': '#4A3B5C',
  '--toggle-hover-border': 'rgba(255, 82, 160, 0.5)',
  '--footer-border': 'rgba(255, 82, 160, 0.12)',
  '--footer-text': '#FFFFFF',
  '--footer-text-muted': 'rgba(255, 255, 255, 0.5)',
  '--btn-outline-text': '#1E0E30',
  '--card-shadow': '0 1px 4px rgba(129, 0, 209, 0.06)',
  '--header-dropdown-shadow': '0 4px 16px rgba(129, 0, 209, 0.10)',
  '--header-shadow': '0 1px 3px rgba(129, 0, 209, 0.08)',
  '--hero-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(248,245,252,0.96) 100%)',
  '--highlight-bg': '#F8F5FC',
  '--cta-bg': '#F8F5FC',
  '--cta-text-bg': '#F8F5FC',
  '--space-overlay': 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.95) 100%)',
  '--icon-glass-blur': 'blur(8px)',
};

// ---------- Property classification ----------

const SHADOW_PROPS = ['--card-shadow', '--header-dropdown-shadow', '--header-shadow'];

// Props that snap at 50% instead of interpolating (text, gradients)
const SNAP_PROPS = [
  '--color-heading', '--color-grey-light', '--color-grey-muted',
  '--nav-text', '--nav-text-hover', '--btn-outline-text', '--toggle-text',
  '--hero-gradient', '--highlight-bg', '--cta-bg', '--cta-text-bg',
  '--space-overlay', '--icon-glass-blur',
];

const COLOR_PROPS = Object.keys(PALETTE_START).filter(
  (k) => !SHADOW_PROPS.includes(k) && !SNAP_PROPS.includes(k)
);

// ---------- Main apply function ----------

export function applyBrightness(t) {
  const root = document.documentElement;

  // Smooth color interpolation
  for (const prop of COLOR_PROPS) {
    root.style.setProperty(prop, interpolateColor(PALETTE_START[prop], PALETTE_END[prop], t));
  }

  // Shadow interpolation
  for (const prop of SHADOW_PROPS) {
    root.style.setProperty(prop, interpolateShadow(PALETTE_START[prop], PALETTE_END[prop], t));
  }

  // Snap properties - jump at 50%
  for (const prop of SNAP_PROPS) {
    root.style.setProperty(prop, t < 0.5 ? PALETTE_START[prop] : PALETTE_END[prop]);
  }

  // data-theme attribute for CSS component overrides
  if (t < 0.5) {
    root.setAttribute('data-theme', 'vibrant');
  } else {
    root.removeAttribute('data-theme');
  }
}
