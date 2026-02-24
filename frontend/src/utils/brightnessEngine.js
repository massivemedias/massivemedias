// ============================================================
// brightnessEngine.js - Moteur de thèmes
// 10 palettes discrètes avec boutons/accents dynamiques
// ============================================================

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
  if (m) return { r: parseFloat(m[1]), g: parseFloat(m[2]), b: parseFloat(m[3]), a: m[4] !== undefined ? parseFloat(m[4]) : 1 };
  return { r: 0, g: 0, b: 0, a: 1 };
}

function pc(hex) { return parseColor(hex); }

// ============================================================
// Helper : palette sombre complète
// ============================================================

function darkPalette(base, darker, darkest, accent, hoverBg, hoverText, logoMain, logoAccent) {
  const b = pc(base), d = pc(darker), dk = pc(darkest), a = pc(accent);
  return {
    '--color-purple-dark': darkest,
    '--color-purple-mid': darker,
    '--color-purple-main': base,
    '--color-grey-light': '#E8E0F0',
    '--color-grey-muted': '#B8ACCC',
    '--color-heading': '#FFFFFF',
    '--logo-main': logoMain,
    '--logo-accent': logoAccent,
    '--aurora-glow1': 'rgba(0, 0, 0, 0)',
    '--aurora-glow2': 'rgba(0, 0, 0, 0)',
    '--aurora-glow3': `rgba(${b.r}, ${b.g}, ${b.b}, 1)`,
    '--aurora-bg-start': base,
    '--aurora-bg-mid': base,
    '--aurora-bg-end': base,
    '--bg-body': base,
    '--bg-card': 'rgba(255, 255, 255, 0.08)',
    '--bg-card-solid': `rgba(${dk.r}, ${dk.g}, ${dk.b}, 0.85)`,
    '--bg-card-border': `rgba(${a.r}, ${a.g}, ${a.b}, 0.15)`,
    '--bg-header': `rgba(${b.r}, ${b.g}, ${b.b}, 0.96)`,
    '--bg-footer': darkest,
    '--bg-input': `rgba(${b.r}, ${b.g}, ${b.b}, 0.5)`,
    '--bg-input-border': `rgba(${a.r}, ${a.g}, ${a.b}, 0.2)`,
    '--bg-glass': 'rgba(255, 255, 255, 0.06)',
    '--bg-glass-alt': 'rgba(255, 255, 255, 0.08)',
    '--bg-table-head': `rgba(${b.r}, ${b.g}, ${b.b}, 0.6)`,
    '--bg-select-option': base,
    '--icon-bg': `rgba(${a.r}, ${a.g}, ${a.b}, 0.12)`,
    '--header-dropdown-bg': base,
    '--header-item-hover': 'rgba(255, 255, 255, 0.1)',
    '--header-border': `rgba(${a.r}, ${a.g}, ${a.b}, 0.15)`,
    '--nav-text': 'rgba(255, 255, 255, 0.85)',
    '--nav-text-hover': '#FFFFFF',
    '--outline-border': `rgba(${a.r}, ${a.g}, ${a.b}, 0.35)`,
    '--outline-hover-bg': `rgba(${a.r}, ${a.g}, ${a.b}, 0.1)`,
    '--outline-hover-border': `rgba(${a.r}, ${a.g}, ${a.b}, 0.6)`,
    '--table-border': `rgba(${a.r}, ${a.g}, ${a.b}, 0.08)`,
    '--table-hover': `rgba(${a.r}, ${a.g}, ${a.b}, 0.05)`,
    '--scrollbar-track': darker,
    '--scrollbar-thumb': `rgba(${a.r}, ${a.g}, ${a.b}, 0.4)`,
    '--scrollbar-thumb-hover': accent,
    '--pattern-dot': `rgba(${a.r}, ${a.g}, ${a.b}, 0.12)`,
    '--overlay-cta': `rgba(${b.r}, ${b.g}, ${b.b}, 0.92)`,
    '--icon-glass': 'rgba(255, 255, 255, 0.12)',
    '--toggle-border': `rgba(${a.r}, ${a.g}, ${a.b}, 0.3)`,
    '--toggle-text': 'rgba(255, 255, 255, 0.85)',
    '--toggle-hover-border': `rgba(${a.r}, ${a.g}, ${a.b}, 0.5)`,
    '--footer-border': `rgba(${a.r}, ${a.g}, ${a.b}, 0.12)`,
    '--footer-text': '#FFFFFF',
    '--footer-text-muted': 'rgba(255, 255, 255, 0.5)',
    '--btn-outline-text': '#FFFFFF',
    '--btn-primary-bg': accent,
    '--btn-primary-hover-bg': hoverBg,
    '--btn-primary-hover-text': hoverText,
    '--btn-primary-shadow': `rgba(${a.r}, ${a.g}, ${a.b}, 0.3)`,
    '--accent-color': accent,
    '--filter-active-bg': accent,
    '--filter-hover-bg': hoverBg,
    '--filter-hover-text': hoverText,
    '--card-shadow': '0 4px 24px rgba(0, 0, 0, 0.2)',
    '--header-dropdown-shadow': '0 8px 32px rgba(0, 0, 0, 0.4)',
    '--header-shadow': 'none',
    '--hero-gradient': `linear-gradient(180deg, rgba(${b.r},${b.g},${b.b},0.85) 0%, rgba(${dk.r},${dk.g},${dk.b},0.92) 100%)`,
    '--highlight-bg': `linear-gradient(145deg, rgba(${b.r},${b.g},${b.b},0.5), rgba(${d.r},${d.g},${d.b},0.4))`,
    '--cta-bg': `linear-gradient(145deg, rgba(${b.r},${b.g},${b.b},0.7), rgba(${d.r},${d.g},${d.b},0.5))`,
    '--cta-text-bg': `linear-gradient(145deg, rgba(${b.r},${b.g},${b.b},0.5), rgba(${d.r},${d.g},${d.b},0.4))`,
    '--space-overlay': `linear-gradient(180deg, transparent 0%, rgba(${dk.r},${dk.g},${dk.b},0.95) 100%)`,
    '--icon-glass-blur': 'blur(8px)',
  };
}

// ============================================================
// 10 Palettes
// ============================================================

// 0 - Violet Profond (INCHANGÉ)
const PALETTE_0 = darkPalette(
  '#410081', '#2A0054', '#150030',
  '#FF52A0', '#FFCC02', '#1E0E30',
  '#FF52A0', '#FFCC00'
);

// 1 - Bleu Nuit
const PALETTE_1 = darkPalette(
  '#0C1E3A', '#081428', '#040C18',
  '#3B9FFF', '#00D4FF', '#0A1628',
  '#3B9FFF', '#00D4FF'
);

// 2 - Océan (NOUVEAU)
const PALETTE_2 = darkPalette(
  '#0D3040', '#082028', '#041418',
  '#00BCD4', '#4DD0E1', '#0A2830',
  '#00BCD4', '#26C6DA'
);

// 3 - Vert Forêt
const PALETTE_3 = darkPalette(
  '#0B2818', '#062010', '#031208',
  '#00CC88', '#A0FF50', '#062010',
  '#00CC88', '#A0FF50'
);

// 4 - Bordeaux
const PALETTE_4 = darkPalette(
  '#2E0A1A', '#200812', '#120408',
  '#FF4080', '#FFB347', '#200812',
  '#FF4080', '#FFB347'
);

// 5 - Espresso (NOUVEAU)
const PALETTE_5 = darkPalette(
  '#2A1A10', '#1C1008', '#100804',
  '#D4A574', '#FFD4A8', '#1C1008',
  '#D4A574', '#FFD4A8'
);

// 6 - Charbon
const PALETTE_6 = darkPalette(
  '#1A1A28', '#12121E', '#0A0A14',
  '#FF6B35', '#FFAB40', '#12121E',
  '#FF6B35', '#FFAB40'
);

// 7 - Ardoise
const PALETTE_7 = darkPalette(
  '#2D3748', '#1A2332', '#0F1620',
  '#38B2AC', '#63B3ED', '#1A2332',
  '#38B2AC', '#63B3ED'
);

// 8 - Crème (thème clair chaud)
const PALETTE_8 = {
  '--color-purple-dark': '#FFFFFF',
  '--color-purple-mid': '#F5F0EB',
  '--color-purple-main': '#DDD5CC',
  '--color-grey-light': '#4A4340',
  '--color-grey-muted': '#8A7F78',
  '--color-heading': '#2A2220',
  '--logo-main': '#2A2220',
  '--logo-accent': '#C07830',
  '--aurora-glow1': 'rgba(0, 0, 0, 0)',
  '--aurora-glow2': 'rgba(0, 0, 0, 0)',
  '--aurora-glow3': 'rgba(0, 0, 0, 0)',
  '--aurora-bg-start': '#F0EBE5',
  '--aurora-bg-mid': '#E8E0D8',
  '--aurora-bg-end': '#E8E0D8',
  '--bg-body': '#E8E0D8',
  '--bg-card': '#FFFFFF',
  '--bg-card-solid': '#FFFFFF',
  '--bg-card-border': 'rgba(42, 34, 32, 0.08)',
  '--bg-header': 'rgba(232, 224, 216, 0.96)',
  '--bg-footer': '#2A2220',
  '--bg-input': 'rgba(42, 34, 32, 0.03)',
  '--bg-input-border': 'rgba(42, 34, 32, 0.15)',
  '--bg-glass': 'rgba(42, 34, 32, 0.02)',
  '--bg-glass-alt': 'rgba(42, 34, 32, 0.04)',
  '--bg-table-head': '#F0EBE5',
  '--bg-select-option': '#E8E0D8',
  '--icon-bg': 'rgba(192, 120, 48, 0.08)',
  '--header-dropdown-bg': '#E8E0D8',
  '--header-item-hover': '#F0EBE5',
  '--header-border': 'rgba(42, 34, 32, 0.08)',
  '--nav-text': '#4A4340',
  '--nav-text-hover': '#2A2220',
  '--outline-border': 'rgba(42, 34, 32, 0.18)',
  '--outline-hover-bg': 'rgba(42, 34, 32, 0.04)',
  '--outline-hover-border': 'rgba(42, 34, 32, 0.35)',
  '--table-border': 'rgba(42, 34, 32, 0.06)',
  '--table-hover': 'rgba(42, 34, 32, 0.03)',
  '--scrollbar-track': '#F0EBE5',
  '--scrollbar-thumb': '#DDD5CC',
  '--scrollbar-thumb-hover': '#C07830',
  '--pattern-dot': 'transparent',
  '--overlay-cta': 'rgba(42, 34, 32, 0.88)',
  '--icon-glass': 'rgba(42, 34, 32, 0.06)',
  '--toggle-border': 'rgba(42, 34, 32, 0.18)',
  '--toggle-text': '#4A4340',
  '--toggle-hover-border': 'rgba(42, 34, 32, 0.35)',
  '--footer-border': 'rgba(255, 255, 255, 0.08)',
  '--footer-text': '#FFFFFF',
  '--footer-text-muted': 'rgba(255, 255, 255, 0.5)',
  '--btn-outline-text': '#2A2220',
  '--btn-primary-bg': '#2A2220',
  '--btn-primary-hover-bg': '#C07830',
  '--btn-primary-hover-text': '#FFFFFF',
  '--btn-primary-shadow': 'rgba(42, 34, 32, 0.2)',
  '--accent-color': '#C07830',
  '--filter-active-bg': '#2A2220',
  '--filter-hover-bg': '#C07830',
  '--filter-hover-text': '#FFFFFF',
  '--card-shadow': '0 1px 4px rgba(42, 34, 32, 0.06)',
  '--header-dropdown-shadow': '0 4px 16px rgba(42, 34, 32, 0.10)',
  '--header-shadow': '0 1px 3px rgba(42, 34, 32, 0.06)',
  '--hero-gradient': 'linear-gradient(180deg, rgba(232,224,216,0.85) 0%, rgba(240,235,229,0.96) 100%)',
  '--highlight-bg': '#F0EBE5',
  '--cta-bg': '#F0EBE5',
  '--cta-text-bg': '#F0EBE5',
  '--space-overlay': 'linear-gradient(180deg, transparent 0%, rgba(232,224,216,0.95) 100%)',
  '--icon-glass-blur': 'blur(8px)',
};

// 9 - Blanc (clean, sobre)
const PALETTE_9 = {
  '--color-purple-dark': '#FFFFFF',
  '--color-purple-mid': '#F5F5F5',
  '--color-purple-main': '#E0E0E0',
  '--color-grey-light': '#3A3A3A',
  '--color-grey-muted': '#7A7A7A',
  '--color-heading': '#1A1A1A',
  '--logo-main': '#1A1A1A',
  '--logo-accent': '#444444',
  '--aurora-glow1': 'rgba(0, 0, 0, 0)',
  '--aurora-glow2': 'rgba(0, 0, 0, 0)',
  '--aurora-glow3': 'rgba(0, 0, 0, 0)',
  '--aurora-bg-start': '#F8F8F8',
  '--aurora-bg-mid': '#FFFFFF',
  '--aurora-bg-end': '#FFFFFF',
  '--bg-body': '#FFFFFF',
  '--bg-card': '#FFFFFF',
  '--bg-card-solid': '#FFFFFF',
  '--bg-card-border': 'rgba(0, 0, 0, 0.06)',
  '--bg-header': 'rgba(255, 255, 255, 0.96)',
  '--bg-footer': '#1A1A1A',
  '--bg-input': 'rgba(0, 0, 0, 0.02)',
  '--bg-input-border': 'rgba(0, 0, 0, 0.12)',
  '--bg-glass': 'rgba(0, 0, 0, 0.02)',
  '--bg-glass-alt': 'rgba(0, 0, 0, 0.03)',
  '--bg-table-head': '#F5F5F5',
  '--bg-select-option': '#FFFFFF',
  '--icon-bg': 'rgba(0, 0, 0, 0.04)',
  '--header-dropdown-bg': '#FFFFFF',
  '--header-item-hover': '#F5F5F5',
  '--header-border': 'rgba(0, 0, 0, 0.06)',
  '--nav-text': '#3A3A3A',
  '--nav-text-hover': '#1A1A1A',
  '--outline-border': 'rgba(0, 0, 0, 0.15)',
  '--outline-hover-bg': 'rgba(0, 0, 0, 0.03)',
  '--outline-hover-border': 'rgba(0, 0, 0, 0.3)',
  '--table-border': 'rgba(0, 0, 0, 0.05)',
  '--table-hover': 'rgba(0, 0, 0, 0.02)',
  '--scrollbar-track': '#F5F5F5',
  '--scrollbar-thumb': '#D0D0D0',
  '--scrollbar-thumb-hover': '#1A1A1A',
  '--pattern-dot': 'transparent',
  '--overlay-cta': 'rgba(26, 26, 26, 0.88)',
  '--icon-glass': 'rgba(0, 0, 0, 0.04)',
  '--toggle-border': 'rgba(0, 0, 0, 0.15)',
  '--toggle-text': '#3A3A3A',
  '--toggle-hover-border': 'rgba(0, 0, 0, 0.3)',
  '--footer-border': 'rgba(255, 255, 255, 0.08)',
  '--footer-text': '#FFFFFF',
  '--footer-text-muted': 'rgba(255, 255, 255, 0.5)',
  '--btn-outline-text': '#1A1A1A',
  '--btn-primary-bg': '#1A1A1A',
  '--btn-primary-hover-bg': '#3A3A3A',
  '--btn-primary-hover-text': '#FFFFFF',
  '--btn-primary-shadow': 'rgba(0, 0, 0, 0.15)',
  '--accent-color': '#1A1A1A',
  '--filter-active-bg': '#1A1A1A',
  '--filter-hover-bg': '#3A3A3A',
  '--filter-hover-text': '#FFFFFF',
  '--card-shadow': '0 1px 4px rgba(0, 0, 0, 0.04)',
  '--header-dropdown-shadow': '0 4px 16px rgba(0, 0, 0, 0.08)',
  '--header-shadow': '0 1px 3px rgba(0, 0, 0, 0.04)',
  '--hero-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(248,248,248,0.96) 100%)',
  '--highlight-bg': '#F5F5F5',
  '--cta-bg': '#F5F5F5',
  '--cta-text-bg': '#F5F5F5',
  '--space-overlay': 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.95) 100%)',
  '--icon-glass-blur': 'blur(8px)',
};

// ============================================================
// Exports
// ============================================================

const PALETTES = [PALETTE_0, PALETTE_1, PALETTE_2, PALETTE_3, PALETTE_4, PALETTE_5, PALETTE_6, PALETTE_7, PALETTE_8, PALETTE_9];

export const THEME_COUNT = PALETTES.length;

export const THEME_NAMES = [
  'Violet', 'Nuit', 'Océan', 'Forêt', 'Bordeaux',
  'Espresso', 'Charbon', 'Ardoise', 'Crème', 'Blanc'
];

export const THEME_COLORS = [
  '#410081', '#0C1E3A', '#0D3040', '#0B2818', '#2E0A1A',
  '#2A1A10', '#1A1A28', '#2D3748', '#E8E0D8', '#FFFFFF'
];

// Couleur accent par thème (pour le slider dots)
export const THEME_ACCENTS = [
  '#FF52A0', '#3B9FFF', '#00BCD4', '#00CC88', '#FF4080',
  '#D4A574', '#FF6B35', '#38B2AC', '#9B30FF', '#A600FF'
];

const ALL_PROPS = Object.keys(PALETTE_0);

export function applyTheme(step) {
  const root = document.documentElement;
  const palette = PALETTES[step] || PALETTES[PALETTES.length - 1];

  for (const prop of ALL_PROPS) {
    root.style.setProperty(prop, palette[prop]);
  }

  // data-theme : "vibrant" pour les thèmes sombres (0-7), absent pour les clairs (8-9)
  if (step <= 7) {
    root.setAttribute('data-theme', 'vibrant');
  } else {
    root.removeAttribute('data-theme');
  }
}

export function brightnessToStep(brightness) {
  if (brightness <= 5) return 0;
  if (brightness >= 95) return 9;
  return Math.round((brightness / 100) * 9);
}

export function applyBrightness(t) {
  applyTheme(brightnessToStep(Math.round(t * 100)));
}
