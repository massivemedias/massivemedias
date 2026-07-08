// Calcul des frais de livraison par poids
// Source de verite cote serveur - le frontend a un miroir pour l'affichage
import { STICKER_COLLECTION_UNIT_PRICE, MYSTERY_PACK_PRICES } from './pricing-config'

// ─── Poids par produit (grammes) ───

interface CartItem {
  productId: string;
  size?: string;
  shape?: string | null;
  quantity: number;
}

const PRINT_WEIGHTS: Record<string, { print: number; framed: number }> = {
  a4:     { print: 100,  framed: 800 },
  a3:     { print: 150,  framed: 1200 },
  a3plus: { print: 200,  framed: 1500 },
  'a3+':  { print: 200,  framed: 1500 },
  a2:     { print: 300,  framed: 2500 },
};

const CLOTHING_WEIGHTS: Record<string, number> = {
  tshirt:   250,
  hoodie:   600,
  longsleeve: 450,
  totebag:  200,
  bag:      200,
  mug:      350,
  tumbler:  300,
};

const PACKAGING_WEIGHT = 200; // grammes d'emballage par commande

export function getItemWeight(item: CartItem): number {
  const id = (item.productId || '').toLowerCase();
  const qty = item.quantity || 1;

  // Stickers custom: 50g base + 10g par tranche de 25
  if (id === 'sticker-custom') {
    return 50 + Math.ceil(qty / 25) * 10;
  }

  // STICKERS-SHOP-B : collection Massive. Poids pour les paniers MIXTES
  // (regles par paliers) - le cas 100% collection passe par le forfait
  // enveloppe dans calculateShipping et n'utilise pas ces poids.
  if (id.startsWith('sticker-massive-')) {
    return 10 * qty
  }
  if (id.startsWith('mystery-pack-')) {
    const packSize = parseInt(id.replace('mystery-pack-', ''), 10)
    const per = packSize === 20 ? 210 : packSize === 10 ? 110 : 60
    return per * qty
  }

  // Packs stickers artistes via configurateur (artist-sticker-pack-<slug>-<timestamp>)
  // quantity = nombre total de stickers du pack, ~10g piece comme sticker-massive-
  if (id.startsWith('artist-sticker-pack-')) {
    return 10 * qty;
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
    // Fallback taille inconnue
    return (isFramed ? 1000 : 150) * qty;
  }

  // Sublimation et merch (sublimation-hoodie, merch-tshirt-orchid-L, etc.)
  if (id.startsWith('sublimation-') || id.startsWith('merch-')) {
    const type = id.replace('sublimation-', '').replace('merch-', '').split('-')[0];
    return (CLOTHING_WEIGHTS[type] || 250) * qty;
  }

  // Flyers: 5g par flyer
  if (id.startsWith('flyer-')) {
    return 5 * qty;
  }

  // Cartes d'affaires: 3g par carte (plus petit qu'un flyer)
  if (id.startsWith('business-card-')) {
    return 3 * qty;
  }

  // Fallback
  return 200 * qty;
}

export function calculateTotalWeight(items: CartItem[]): number {
  const itemsWeight = items.reduce((sum, item) => sum + getItemWeight(item), 0);
  return itemsWeight + PACKAGING_WEIGHT;
}

// ─── Tarifs livraison par zone ───

interface ShippingTier {
  maxGrams: number;
  price: number;
}

const QUEBEC_TIERS: ShippingTier[] = [
  { maxGrams: 500,    price: 12 },
  { maxGrams: 1000,   price: 16 },
  { maxGrams: 2000,   price: 20 },
  { maxGrams: 5000,   price: 28 },
  { maxGrams: Infinity, price: 38 },
];

const CANADA_TIERS: ShippingTier[] = [
  { maxGrams: 500,    price: 16 },
  { maxGrams: 1000,   price: 22 },
  { maxGrams: 2000,   price: 28 },
  { maxGrams: 5000,   price: 38 },
  { maxGrams: Infinity, price: 50 },
];

function getTierPrice(tiers: ShippingTier[], weightGrams: number): number {
  for (const tier of tiers) {
    if (weightGrams <= tier.maxGrams) return tier.price;
  }
  return tiers[tiers.length - 1].price;
}

export function calculateShipping(
  province: string,
  postalCode: string,
  items: CartItem[],
): { shippingCost: number; totalWeight: number } {
  const totalWeight = calculateTotalWeight(items);

  // Montreal (code postal H): toujours gratuit
  if (province === 'QC' && postalCode?.toUpperCase().startsWith('H')) {
    return { shippingCost: 0, totalWeight };
  }

  // STICKERS-SHOP-B : commande composee UNIQUEMENT de la collection Massive
  // (unites sticker-massive-* et/ou mystery packs) -> enveloppe rigide a
  // tarif fixe, PAS les paliers par poids (12 $+ serait disproportionne pour
  // 10-25 $ de stickers). Montreal reste gratuit via le check ci-dessus.
  // Des 30 $ de stickers collection : gratuit partout au Quebec (pousse le
  // panier vers le pack 20 + unites). Le Canada hors Quebec reste a 6 $.
  // Panier MIXTE (au moins un autre produit) : paliers par poids inchanges.
  const isCollectionOnly = items.length > 0 && items.every((i) => {
    const id = (i.productId || '').toLowerCase()
    return id.startsWith('sticker-massive-') || id.startsWith('mystery-pack-')
  })
  if (isCollectionOnly) {
    let collectionSubtotal = 0
    for (const i of items) {
      const id = (i.productId || '').toLowerCase()
      const qty = i.quantity || 1
      if (id.startsWith('sticker-massive-')) {
        collectionSubtotal += STICKER_COLLECTION_UNIT_PRICE * qty
      } else {
        const packSize = parseInt(id.replace('mystery-pack-', ''), 10)
        collectionSubtotal += (MYSTERY_PACK_PRICES[packSize] || 0) * qty
      }
    }
    if (province === 'QC') {
      return { shippingCost: collectionSubtotal >= 30 ? 0 : 4, totalWeight }
    }
    return { shippingCost: 6, totalWeight }
  }

  // Reste du Quebec
  if (province === 'QC') {
    return { shippingCost: getTierPrice(QUEBEC_TIERS, totalWeight), totalWeight };
  }

  // Reste du Canada
  return { shippingCost: getTierPrice(CANADA_TIERS, totalWeight), totalWeight };
}
