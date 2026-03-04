import { img } from '../utils/paths';

/**
 * Merch product data - colors, sizes, pricing
 * Colors based on Gildan 5000 / standard blank t-shirt catalog
 */

// Sorted lightest to darkest (perceived luminance: 0.299R + 0.587G + 0.114B)
export const merchColors = [
  { id: 'white', name: 'White', hex: '#F5F5F0' },
  { id: 'pfd-white', name: 'PFD White', hex: '#F0ECE4' },
  { id: 'mint-green', name: 'Mint Green', hex: '#D5EDDA' },
  { id: 'natural', name: 'Natural', hex: '#E8DFD0' },
  { id: 'cornsilk', name: 'Cornsilk', hex: '#F0E68C' },
  { id: 'light-pink', name: 'Light Pink', hex: '#E8C4D8' },
  { id: 'light-blue', name: 'Light Blue', hex: '#B8D4E8' },
  { id: 'pistachio', name: 'Pistachio', hex: '#C8D89A' },
  { id: 'lime', name: 'Lime', hex: '#C4DC6A' },
  { id: 'safety-green', name: 'Safety Green', hex: '#C8E020' },
  { id: 'sky', name: 'Sky', hex: '#88D8F0' },
  { id: 'azalea', name: 'Azalea', hex: '#F4A6C9' },
  { id: 'ash', name: 'Ash', hex: '#C4BFB6' },
  { id: 'ice-grey', name: 'Ice Grey', hex: '#C5BFB2' },
  { id: 'vegas-gold', name: 'Vegas Gold', hex: '#D4C080' },
  { id: 'daisy', name: 'Daisy', hex: '#E0C832' },
  { id: 'safety-pink', name: 'Safety Pink', hex: '#F0A0B0' },
  { id: 'sand', name: 'Sand', hex: '#C8B898' },
  { id: 'orchid', name: 'Orchid', hex: '#C0A8D0' },
  { id: 'sport-grey', name: 'Sport Grey', hex: '#B0AEA8' },
  { id: 'tan', name: 'Tan', hex: '#C0AA8A' },
  { id: 'carolina-blue', name: 'Carolina Blue', hex: '#7BA4CC' },
  { id: 'gold', name: 'Gold', hex: '#D9922E' },
  { id: 'heather-sapphire', name: 'Heather Sapphire', hex: '#6BAEB8' },
  { id: 'safety-orange', name: 'Safety Orange', hex: '#E88830' },
  { id: 'tangerine', name: 'Tangerine', hex: '#E87830' },
  { id: 'stone-blue', name: 'Stone Blue', hex: '#7A8EA0' },
  { id: 'indigo-blue', name: 'Indigo Blue', hex: '#7888A0' },
  { id: 'orange', name: 'Orange', hex: '#E06A28' },
  { id: 'heather-cardinal', name: 'Heather Cardinal', hex: '#B07070' },
  { id: 'heather-indigo', name: 'Heather Indigo', hex: '#7B7B9E' },
  { id: 'irish-green', name: 'Irish Green', hex: '#3EA060' },
  { id: 'prairie-dust', name: 'Prairie Dust', hex: '#8B7B4A' },
  { id: 'antique-irish-green', name: 'Antique Irish Green', hex: '#3B9B6D' },
  { id: 'iris', name: 'Iris', hex: '#5B7BA0' },
  { id: 'texas-orange', name: 'Texas Orange', hex: '#BA5A20' },
  { id: 'heliconia', name: 'Heliconia', hex: '#E2365B' },
  { id: 'jade-dome', name: 'Jade Dome', hex: '#2E8B7A' },
  { id: 'kelly', name: 'Kelly', hex: '#2E8B3E' },
  { id: 'olive', name: 'Olive', hex: '#6B6B3C' },
  { id: 'sapphire', name: 'Sapphire', hex: '#1E7EA0' },
  { id: 'charcoal', name: 'Charcoal', hex: '#5C5C5C' },
  { id: 'dark-heather', name: 'Dark Heather', hex: '#5A5A5A' },
  { id: 'galapagos-blue', name: 'Galapagos Blue', hex: '#2A6B6E' },
  { id: 'cherry-red', name: 'Cherry Red', hex: '#B52535' },
  { id: 'military-green', name: 'Military Green', hex: '#4A5A3A' },
  { id: 'royal', name: 'Royal', hex: '#2456A4' },
  { id: 'red', name: 'Red', hex: '#B52030' },
  { id: 'forest', name: 'Forest', hex: '#2D5A4B' },
  { id: 'cardinal-red', name: 'Cardinal Red', hex: '#8C2A3C' },
  { id: 'blue-dusk', name: 'Blue Dusk', hex: '#4A4463' },
  { id: 'antique-cherry-red', name: 'Antique Cherry Red', hex: '#8B2252' },
  { id: 'antique-royal', name: 'Antique Royal', hex: '#1E4D8C' },
  { id: 'heather-navy', name: 'Heather Navy', hex: '#3A3E50' },
  { id: 'dark-chocolate', name: 'Dark Chocolate', hex: '#4A3728' },
  { id: 'maroon', name: 'Maroon', hex: '#582240' },
  { id: 'purple', name: 'Purple', hex: '#3E2260' },
  { id: 'metro-blue', name: 'Metro Blue', hex: '#1E2A5A' },
  { id: 'navy', name: 'Navy', hex: '#0F1F3E' },
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
  { id: 'mint-green', name: 'Mint Green', hex: '#D5EDDA' },
  { id: 'light-pink', name: 'Light Pink', hex: '#E8C4D8' },
  { id: 'light-blue', name: 'Light Blue', hex: '#B8D4E8' },
  { id: 'safety-green', name: 'Safety Green', hex: '#C8E020' },
  { id: 'azalea', name: 'Azalea', hex: '#F4A6C9' },
  { id: 'ash', name: 'Ash', hex: '#C4BFB6' },
  { id: 'safety-pink', name: 'Safety Pink', hex: '#F0A0B0' },
  { id: 'sand', name: 'Sand', hex: '#C8B898' },
  { id: 'orchid', name: 'Orchid', hex: '#C0A8D0' },
  { id: 'sport-grey', name: 'Sport Grey', hex: '#B0AEA8' },
  { id: 'old-gold', name: 'Old Gold', hex: '#D4A840' },
  { id: 'carolina-blue', name: 'Carolina Blue', hex: '#7BA4CC' },
  { id: 'gold', name: 'Gold', hex: '#D9922E' },
  { id: 'safety-orange', name: 'Safety Orange', hex: '#E88830' },
  { id: 'graphite-heather', name: 'Graphite Heather', hex: '#6E6E6E' },
  { id: 'indigo-blue', name: 'Indigo Blue', hex: '#7888A0' },
  { id: 'orange', name: 'Orange', hex: '#E06A28' },
  { id: 'heather-deep-royal', name: 'Heather Deep Royal', hex: '#4A6AAE' },
  { id: 'heather-dark-green', name: 'Heather Dark Green', hex: '#4A7A5A' },
  { id: 'heather-dark-maroon', name: 'Heather Dark Maroon', hex: '#7A4050' },
  { id: 'heliconia', name: 'Heliconia', hex: '#E2365B' },
  { id: 'irish-green', name: 'Irish Green', hex: '#3EA060' },
  { id: 'antique-sapphire', name: 'Antique Sapphire', hex: '#3A7EA0' },
  { id: 'sapphire', name: 'Sapphire', hex: '#1E7EA0' },
  { id: 'garnet', name: 'Garnet', hex: '#8B3040' },
  { id: 'violet', name: 'Violet', hex: '#6A3FA0' },
  { id: 'charcoal', name: 'Charcoal', hex: '#5C5C5C' },
  { id: 'dark-heather', name: 'Dark Heather', hex: '#5A5A5A' },
  { id: 'heather-dark-navy', name: 'Heather Dark Navy', hex: '#3A4460' },
  { id: 'cherry-red', name: 'Cherry Red', hex: '#B52535' },
  { id: 'military-green', name: 'Military Green', hex: '#4A5A3A' },
  { id: 'royal', name: 'Royal', hex: '#2456A4' },
  { id: 'red', name: 'Red', hex: '#B52030' },
  { id: 'forest', name: 'Forest', hex: '#2D5A4B' },
  { id: 'cardinal-red', name: 'Cardinal Red', hex: '#8C2A3C' },
  { id: 'antique-cherry-red', name: 'Antique Cherry Red', hex: '#8B2252' },
  { id: 'dark-chocolate', name: 'Dark Chocolate', hex: '#4A3728' },
  { id: 'maroon', name: 'Maroon', hex: '#582240' },
  { id: 'purple', name: 'Purple', hex: '#3E2260' },
  { id: 'navy', name: 'Navy', hex: '#0F1F3E' },
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
 * Crewneck colors - Gildan 18000
 * Sorted lightest to darkest (perceived luminance)
 */
export const crewneckColors = [
  { id: 'white', name: 'White', hex: '#F5F5F0' },
  { id: 'light-pink', name: 'Light Pink', hex: '#E8C4D8' },
  { id: 'light-blue', name: 'Light Blue', hex: '#B8D4E8' },
  { id: 'safety-green', name: 'Safety Green', hex: '#C8E020' },
  { id: 'ash', name: 'Ash', hex: '#C4BFB6' },
  { id: 'safety-pink', name: 'Safety Pink', hex: '#F0A0B0' },
  { id: 'sand', name: 'Sand', hex: '#C8B898' },
  { id: 'sport-grey', name: 'Sport Grey', hex: '#B0AEA8' },
  { id: 'carolina-blue', name: 'Carolina Blue', hex: '#7BA4CC' },
  { id: 'gold', name: 'Gold', hex: '#D9922E' },
  { id: 'graphite-heather', name: 'Graphite Heather', hex: '#6E6E6E' },
  { id: 'indigo-blue', name: 'Indigo Blue', hex: '#7888A0' },
  { id: 'orange', name: 'Orange', hex: '#E06A28' },
  { id: 'heather-deep-royal', name: 'Heather Deep Royal', hex: '#4A6AAE' },
  { id: 'heather-dark-green', name: 'Heather Dark Green', hex: '#4A7A5A' },
  { id: 'heather-dark-maroon', name: 'Heather Dark Maroon', hex: '#7A4050' },
  { id: 'heather-scarlet-red', name: 'Heather Scarlet Red', hex: '#B04050' },
  { id: 'heliconia', name: 'Heliconia', hex: '#E2365B' },
  { id: 'irish-green', name: 'Irish Green', hex: '#3EA060' },
  { id: 'sapphire', name: 'Sapphire', hex: '#1E7EA0' },
  { id: 'garnet', name: 'Garnet', hex: '#8B3040' },
  { id: 'charcoal', name: 'Charcoal', hex: '#5C5C5C' },
  { id: 'dark-heather', name: 'Dark Heather', hex: '#5A5A5A' },
  { id: 'cherry-red', name: 'Cherry Red', hex: '#B52535' },
  { id: 'military-green', name: 'Military Green', hex: '#4A5A3A' },
  { id: 'royal', name: 'Royal', hex: '#2456A4' },
  { id: 'red', name: 'Red', hex: '#B52030' },
  { id: 'forest', name: 'Forest', hex: '#2D5A4B' },
  { id: 'cardinal-red', name: 'Cardinal Red', hex: '#8C2A3C' },
  { id: 'dark-chocolate', name: 'Dark Chocolate', hex: '#4A3728' },
  { id: 'maroon', name: 'Maroon', hex: '#582240' },
  { id: 'purple', name: 'Purple', hex: '#3E2260' },
  { id: 'navy', name: 'Navy', hex: '#0F1F3E' },
  { id: 'black', name: 'Black', hex: '#1A1A1A' },
];

export const merchCrewneckPrice = {
  base: 30,
  sizes: {
    'S': 30, 'M': 30, 'L': 30, 'XL': 30, '2XL': 30, '3XL': 30,
  },
};

/** Get crewneck product image path for a given color ID */
export const getCrewneckImage = (colorId) => img(`/images/crewneck/${colorId}.webp`);

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
