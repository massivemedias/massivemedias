import { img } from '../utils/paths';

/**
 * Merch product data - colors, sizes, pricing
 * Colors based on Gildan 5000 / standard blank t-shirt catalog
 */

// Sorted lightest to darkest (perceived luminance: 0.299R + 0.587G + 0.114B)
export const merchColors = [
  { id: 'white', name: 'White', hex: '#F5F5F0' },
  { id: 'light-pink', name: 'Light Pink', hex: '#E8C4D8' },
  { id: 'daisy', name: 'Daisy', hex: '#E0C832' },
  { id: 'kelly', name: 'Kelly', hex: '#2E8B3E' },
  { id: 'dark-heather', name: 'Dark Heather', hex: '#5A5A5A' },
  { id: 'royal', name: 'Royal', hex: '#2456A4' },
  { id: 'purple', name: 'Purple', hex: '#3E2260' },
  { id: 'black', name: 'Black', hex: '#1A1A1A' },
];

export const merchSizes = ['S', 'M', 'L', 'XL', '2XL', '3XL'];

export const merchTshirtPrice = {
  base: 22,
  sizes: {
    'S': 22, 'M': 22, 'L': 22, 'XL': 22, '2XL': 22, '3XL': 22,
  },
};

/** Get t-shirt product image path for a given color ID */
export const getTshirtImage = (colorId) => img(`/images/tshirts/${colorId}.webp`);

/**
 * Hoodie colors - Gildan 18500
 * Sorted lightest to darkest (perceived luminance)
 */
export const hoodieColors = [
  { id: 'white', name: 'White', hex: '#F5F5F0' },
  { id: 'light-pink', name: 'Light Pink', hex: '#E8C4D8' },
  { id: 'daisy', name: 'Daisy', hex: '#E0C832' },
  { id: 'kelly', name: 'Kelly', hex: '#2E8B3E' },
  { id: 'dark-heather', name: 'Dark Heather', hex: '#5A5A5A' },
  { id: 'royal', name: 'Royal', hex: '#2456A4' },
  { id: 'purple', name: 'Purple', hex: '#3E2260' },
  { id: 'black', name: 'Black', hex: '#1A1A1A' },
];

export const merchHoodiePrice = {
  base: 39,
  sizes: {
    'S': 39, 'M': 39, 'L': 39, 'XL': 39, '2XL': 39, '3XL': 39,
  },
};

/** Get hoodie product image path for a given color ID */
export const getHoodieImage = (colorId) => img(`/images/hoodies/${colorId}.webp`);

/**
 * Long Sleeve colors - Gildan 18000
 * Sorted lightest to darkest (perceived luminance)
 */
export const longsleeveColors = [
  { id: 'white', name: 'White', hex: '#F5F5F0' },
  { id: 'light-pink', name: 'Light Pink', hex: '#E8C4D8' },
  { id: 'daisy', name: 'Daisy', hex: '#E0C832' },
  { id: 'kelly', name: 'Kelly', hex: '#2E8B3E' },
  { id: 'dark-heather', name: 'Dark Heather', hex: '#5A5A5A' },
  { id: 'royal', name: 'Royal', hex: '#2456A4' },
  { id: 'purple', name: 'Purple', hex: '#3E2260' },
  { id: 'black', name: 'Black', hex: '#1A1A1A' },
];

export const merchLongSleevePrice = {
  base: 30,
  sizes: {
    'S': 30, 'M': 30, 'L': 30, 'XL': 30, '2XL': 30, '3XL': 30,
  },
};

/** Get longsleeve product image path for a given color ID */
export const getLongSleeveImage = (colorId) => img(`/images/longsleeve/${colorId}.webp`);

/**
 * Tote Bag colors - Q-Tees QTB
 * Sorted lightest to darkest (perceived luminance)
 */
export const totebagColors = [
  { id: 'white', name: 'White', hex: '#F5F5F0' },
  { id: 'natural', name: 'Natural', hex: '#E8DFD0' },
  { id: 'lavender', name: 'Lavender', hex: '#C8C0E0' },
  { id: 'light-pink', name: 'Light Pink', hex: '#E8C4D8' },
  { id: 'gold', name: 'Gold', hex: '#D9922E' },
  { id: 'hot-pink', name: 'Hot Pink', hex: '#E8408A' },
  { id: 'carolina-blue', name: 'Carolina Blue', hex: '#7BA4CC' },
  { id: 'turquoise', name: 'Turquoise', hex: '#30B0B0' },
  { id: 'orange', name: 'Orange', hex: '#E06A28' },
  { id: 'kelly', name: 'Kelly', hex: '#2E8B3E' },
  { id: 'sapphire', name: 'Sapphire', hex: '#1E7EA0' },
  { id: 'red', name: 'Red', hex: '#B52030' },
  { id: 'charcoal', name: 'Charcoal', hex: '#5C5C5C' },
  { id: 'royal', name: 'Royal', hex: '#2456A4' },
  { id: 'forest', name: 'Forest', hex: '#2D5A4B' },
  { id: 'purple', name: 'Purple', hex: '#3E2260' },
  { id: 'navy', name: 'Navy', hex: '#0F1F3E' },
  { id: 'black', name: 'Black', hex: '#1A1A1A' },
];

/** Get tote bag product image path for a given color ID */
export const getTotebagImage = (colorId) => img(`/images/totebags/${colorId}.webp`);
