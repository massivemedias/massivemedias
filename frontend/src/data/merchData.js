import { img } from '../utils/paths';

/**
 * Merch product data - colors, sizes, pricing
 * 10 couleurs unifiees pour tous les textiles + tote bag
 * Sorted lightest to darkest (perceived luminance: 0.299R + 0.587G + 0.114B)
 */

// Palette commune a tous les textiles et tote bags
const TEXTILE_COLORS = [
  { id: 'white',        name: 'White',        hex: '#F5F5F0' },
  { id: 'light-pink',   name: 'Light Pink',   hex: '#E8C4D8' },
  { id: 'daisy',        name: 'Daisy',        hex: '#E0C832' },
  { id: 'gold',         name: 'Gold',         hex: '#D9922E' },
  { id: 'kelly',        name: 'Kelly',        hex: '#2E8B3E' },
  { id: 'dark-heather', name: 'Dark Heather', hex: '#5A5A5A' },
  { id: 'royal',        name: 'Royal',        hex: '#2456A4' },
  { id: 'scarlet-red',  name: 'Scarlet Red',  hex: '#CC1828' },
  { id: 'purple',       name: 'Purple',       hex: '#3E2260' },
  { id: 'black',        name: 'Black',        hex: '#1A1A1A' },
];

export const merchColors     = TEXTILE_COLORS;
export const hoodieColors    = TEXTILE_COLORS;
export const longsleeveColors = TEXTILE_COLORS;
export const totebagColors   = TEXTILE_COLORS;

export const merchSizes = ['S', 'M', 'L', 'XL', '2XL', '3XL'];

export const merchTshirtPrice = {
  base: 22,
  sizes: {
    'S': 22, 'M': 22, 'L': 22, 'XL': 22, '2XL': 22, '3XL': 22,
  },
};

/** Get t-shirt product image path for a given color ID */
export const getTshirtImage = (colorId) => img(`/images/tshirts/${colorId}.webp`);

export const merchHoodiePrice = {
  base: 39,
  sizes: {
    'S': 39, 'M': 39, 'L': 39, 'XL': 39, '2XL': 39, '3XL': 39,
  },
};

/** Get hoodie product image path for a given color ID */
export const getHoodieImage = (colorId) => img(`/images/hoodies/${colorId}.webp`);

export const merchLongSleevePrice = {
  base: 30,
  sizes: {
    'S': 30, 'M': 30, 'L': 30, 'XL': 30, '2XL': 30, '3XL': 30,
  },
};

/** Get longsleeve product image path for a given color ID */
export const getLongSleeveImage = (colorId) => img(`/images/longsleeve/${colorId}.webp`);

/** Get tote bag product image path for a given color ID */
export const getTotebagImage = (colorId) => img(`/images/totebags/${colorId}.webp`);
