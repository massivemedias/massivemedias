/**
 * Image utility functions for mockup generation
 * Validation, resize, conversion, download
 */

// Limites
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MIN_DIMENSION = 200;
const MAX_DIMENSION = 4096;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'];

/**
 * Valide un fichier image avant upload
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImage(file) {
  if (!file) return { valid: false, error: 'no_file' };
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'invalid_type' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'too_large' };
  }
  return { valid: true };
}

/**
 * Valide les dimensions d'une image via un element Image
 * @param {string} src - URL ou data URI de l'image
 * @returns {Promise<{ width: number, height: number, valid: boolean, error?: string }>}
 */
export function validateImageDimensions(src) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const { width, height } = img;
      if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
        resolve({ width, height, valid: false, error: 'too_small' });
      } else if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        resolve({ width, height, valid: false, error: 'too_big' });
      } else {
        resolve({ width, height, valid: true });
      }
    };
    img.onerror = () => resolve({ width: 0, height: 0, valid: false, error: 'load_failed' });
    img.src = src;
  });
}

/**
 * Convertit un File en base64 data URI
 * @param {File} file
 * @returns {Promise<string>}
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

/**
 * Telecharge une image (base64 ou URL) comme fichier
 * @param {string} dataOrUrl - base64 data URI ou URL
 * @param {string} filename
 */
export function downloadImage(dataOrUrl, filename = 'mockup.png') {
  const link = document.createElement('a');
  link.href = dataOrUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Formate des bytes en taille lisible
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Messages d'erreur de validation traduits
 */
export const IMAGE_ERRORS = {
  no_file: { fr: 'Aucun fichier selectionne', en: 'No file selected', es: 'Ningun archivo seleccionado' },
  invalid_type: { fr: 'Format non supporte (JPG, PNG, WebP)', en: 'Unsupported format (JPG, PNG, WebP)', es: 'Formato no soportado (JPG, PNG, WebP)' },
  too_large: { fr: 'Image trop lourde (max 5 MB)', en: 'Image too large (max 5 MB)', es: 'Imagen demasiado grande (max 5 MB)' },
  too_small: { fr: 'Image trop petite (min 200x200)', en: 'Image too small (min 200x200)', es: 'Imagen demasiado pequena (min 200x200)' },
  too_big: { fr: 'Image trop grande (max 4096x4096)', en: 'Image too large (max 4096x4096)', es: 'Imagen demasiado grande (max 4096x4096)' },
  load_failed: { fr: 'Impossible de charger l\'image', en: 'Failed to load image', es: 'No se pudo cargar la imagen' },
};
