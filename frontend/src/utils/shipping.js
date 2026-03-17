// Calcul des frais de livraison par poids (miroir client)
// Utilise pour l'affichage en temps reel - le backend recalcule de facon autoritaire

// --- Poids par produit (grammes) ---

const PRINT_WEIGHTS = {
  a4:     { print: 100,  framed: 800 },
  a3:     { print: 150,  framed: 1200 },
  a3plus: { print: 200,  framed: 1500 },
  'a3+':  { print: 200,  framed: 1500 },
  a2:     { print: 300,  framed: 2500 },
};

const CLOTHING_WEIGHTS = {
  tshirt:   250,
  hoodie:   600,
  crewneck: 450,
  totebag:  200,
  bag:      200,
  mug:      350,
  tumbler:  300,
};

const PACKAGING_WEIGHT = 200;

export function getItemWeight(item) {
  const id = (item.productId || '').toLowerCase();
  const qty = item.quantity || 1;

  // Stickers custom: 50g base + 10g par tranche de 25
  if (id === 'sticker-custom') {
    return 50 + Math.ceil(qty / 25) * 10;
  }

  // Packs stickers artistes (ex: psyqu33n-stk-001-x3)
  if (id.includes('-stk-')) {
    return 30 * qty;
  }

  // Prints (fine-art-print, artist-print-*)
  if (id === 'fine-art-print' || id.startsWith('artist-print-')) {
    const isFramed = !!(item.shape && item.shape.toLowerCase().includes('frame'));
    const sizeKey = (item.size || '').toLowerCase().replace(/\s/g, '');

    for (const [key, weights] of Object.entries(PRINT_WEIGHTS)) {
      if (sizeKey === key || sizeKey === key.replace('+', 'plus')) {
        return (isFramed ? weights.framed : weights.print) * qty;
      }
    }
    return (isFramed ? 1000 : 150) * qty;
  }

  // Sublimation et merch
  if (id.startsWith('sublimation-') || id.startsWith('merch-')) {
    const type = id.replace('sublimation-', '').replace('merch-', '').split('-')[0];
    return (CLOTHING_WEIGHTS[type] || 250) * qty;
  }

  // Flyers: 5g par flyer
  if (id.startsWith('flyer-')) {
    return 5 * qty;
  }

  return 200 * qty;
}

export function calculateTotalWeight(items) {
  const itemsWeight = items.reduce((sum, item) => sum + getItemWeight(item), 0);
  return itemsWeight + PACKAGING_WEIGHT;
}

// --- Tarifs livraison par zone ---

const QUEBEC_TIERS = [
  { maxGrams: 500,    price: 12 },
  { maxGrams: 1000,   price: 16 },
  { maxGrams: 2000,   price: 20 },
  { maxGrams: 5000,   price: 28 },
  { maxGrams: Infinity, price: 38 },
];

const CANADA_TIERS = [
  { maxGrams: 500,    price: 16 },
  { maxGrams: 1000,   price: 22 },
  { maxGrams: 2000,   price: 28 },
  { maxGrams: 5000,   price: 38 },
  { maxGrams: Infinity, price: 50 },
];

function getTierPrice(tiers, weightGrams) {
  for (const tier of tiers) {
    if (weightGrams <= tier.maxGrams) return tier.price;
  }
  return tiers[tiers.length - 1].price;
}

export function calculateShipping(province, postalCode, items) {
  const totalWeight = calculateTotalWeight(items);

  // Montreal (code postal H): toujours gratuit
  if (province === 'QC' && postalCode?.toUpperCase().startsWith('H')) {
    return { shippingCost: 0, totalWeight };
  }

  // Reste du Quebec
  if (province === 'QC') {
    return { shippingCost: getTierPrice(QUEBEC_TIERS, totalWeight), totalWeight };
  }

  // Reste du Canada
  return { shippingCost: getTierPrice(CANADA_TIERS, totalWeight), totalWeight };
}
