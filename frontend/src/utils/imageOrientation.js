/**
 * Image orientation utilities.
 *
 * Une seule source de verite pour categoriser une image selon son ratio
 * largeur/hauteur. Utilise par tous les composants de preview (cadre,
 * mockup environnemental, FramePreview CSS) pour qu'un upload carre
 * apparaisse dans un cadre carre, un portrait dans un cadre portrait,
 * un paysage dans un cadre paysage. Plus jamais de letterboxing parce
 * qu'on aurait force une image dans un cadre du mauvais ratio.
 *
 * Tolerance 'square' : 5% (un APN qui shoote 1.04:1 doit etre traite
 * comme carre - personne ne distingue 4:4 et 4:3.85 a l'oeil).
 */

export const SQUARE_TOLERANCE = 0.05;

/**
 * @param {number} width  - naturalWidth de l'image source
 * @param {number} height - naturalHeight de l'image source
 * @returns {'square' | 'portrait' | 'landscape' | 'unknown'}
 */
export function getImageOrientation(width, height) {
  if (!width || !height || width <= 0 || height <= 0) return 'unknown';
  const ratio = width / height;
  if (Math.abs(ratio - 1) <= SQUARE_TOLERANCE) return 'square';
  return ratio > 1 ? 'landscape' : 'portrait';
}

/**
 * Charge async une image et retourne son orientation. Pratique pour les
 * effets (useEffect) qui veulent reagir a un changement d'URL d'image.
 *
 * @param {string} url
 * @returns {Promise<{ orientation: string, width: number, height: number, ratio: number }>}
 */
export function detectImageOrientation(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve({ orientation: 'unknown', width: 0, height: 0, ratio: 0 });
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      resolve({
        orientation: getImageOrientation(w, h),
        width: w,
        height: h,
        ratio: w / h,
      });
    };
    img.onerror = () => resolve({ orientation: 'unknown', width: 0, height: 0, ratio: 0 });
    img.src = url;
  });
}

/**
 * Convertit une orientation en aspect-ratio CSS string. Pour les cadres
 * portrait/paysage on prefere un ratio 4:5 / 5:4 (proche A4 et 16x20)
 * plutot que le ratio exact de l'image source - sinon une image extreme
 * (16:1 panoramique) creerait un cadre minuscule absurde.
 *
 * @param {'square' | 'portrait' | 'landscape' | 'unknown'} orientation
 * @returns {string} ex: '1 / 1', '4 / 5', '5 / 4'
 */
export function orientationToAspectRatio(orientation) {
  switch (orientation) {
    case 'square': return '1 / 1';
    case 'landscape': return '5 / 4';
    case 'portrait': return '4 / 5';
    default: return '4 / 5'; // par defaut portrait (la plupart des prints le sont)
  }
}
