import { img } from '../utils/paths';

export const stickerFinishes = [
  { id: 'matte', labelFr: 'Vinyle Matte', labelEn: 'Matte Vinyl' },
  { id: 'glossy', labelFr: 'Vinyle Glossy', labelEn: 'Glossy Vinyl' },
  { id: 'transparent', labelFr: 'Vinyle Transparent', labelEn: 'Clear Vinyl' },
  { id: 'holographic', labelFr: 'Holographique', labelEn: 'Holographic' },
];

export const stickerShapes = [
  { id: 'round', labelFr: 'Rond', labelEn: 'Round' },
  { id: 'square', labelFr: 'Carré', labelEn: 'Square' },
  { id: 'rectangle', labelFr: 'Rectangle', labelEn: 'Rectangle' },
  { id: 'diecut', labelFr: 'Die-cut (custom)', labelEn: 'Die-cut (custom)' },
];

export const stickerSizes = [
  { id: '2in', label: '2"' },
  { id: '2.5in', label: '2.5"' },
  { id: '3in', label: '3"' },
  { id: '4in', label: '4"' },
];

// Prix de base (matte/glossy/transparent). Holographique = +15%
export const stickerPriceTiers = [
  { qty: 50, price: 50, unitPrice: 1.00 },
  { qty: 100, price: 85, unitPrice: 0.85 },
  { qty: 150, price: 110, unitPrice: 0.73 },
  { qty: 250, price: 175, unitPrice: 0.70 },
];

// Die-cut utilise les mêmes prix (Cameo 5 = coût minimal)
export const diecutPriceTiers = stickerPriceTiers;

export function getStickerPrice(finish, shape, qty) {
  const tiers = stickerPriceTiers;
  const tier = tiers.find(t => t.qty === qty);
  if (!tier) return null;
  const multiplier = finish === 'holographic' ? 1.15 : 1;
  return {
    qty: tier.qty,
    price: Math.round(tier.price * multiplier),
    unitPrice: Math.round(tier.unitPrice * multiplier * 100) / 100,
  };
}

export const stickerImages = [
  img('/images/stickers/Stickers-Cosmo.webp'),
  img('/images/stickers/Stickers-Cosmo-2.webp'),
  img('/images/stickers/Stickers-Cosmovision.webp'),
  img('/images/stickers/Stickers-Digital.webp'),
  img('/images/stickers/Stickers-Fusion-State-Rec.webp'),
  img('/images/stickers/Stickers-Maudite-Machine.webp'),
  img('/images/stickers/Stickers-Vrstl.webp'),
  img('/images/stickers/Stickers-massive.webp'),
];

export const stickerHighlights = {
  fr: [
    'Découpe de précision professionnelle',
    'Vinyle matte, glossy, transparent, holographique',
    'Découpe contour à la forme exacte du design',
    'Lamination incluse — résistant eau, UV, rayures',
    'Design graphique inclus dans le prix',
    'Livraison locale disponible',
    'Délai rapide : 24-72h',
  ],
  en: [
    'Professional precision cutting',
    'Matte, glossy, clear, holographic vinyl',
    'Contour cut to exact design shape',
    'Lamination included — water, UV, scratch resistant',
    'Graphic design included in price',
    'Local delivery available',
    'Fast turnaround: 24-72h',
  ],
};

export const stickerFaq = {
  fr: [
    { q: 'Quels fichiers dois-je fournir?', a: 'Idéalement un fichier vectoriel (AI, SVG, PDF) ou un PNG haute résolution (300 DPI minimum) avec fond transparent. Si vous n\'avez pas de fichier prêt, notre service de design graphique est inclus dans le prix.' },
    { q: 'Quel est le délai de production?', a: 'Production en 24 à 72 heures selon la complexité et la quantité. Nous vous confirmerons le délai exact lors de la validation de votre commande.' },
    { q: 'Peut-on commander une forme totalement custom?', a: 'Oui! L\'option die-cut permet de découper vos stickers selon n\'importe quelle forme. Le contour suit exactement votre design.' },
    { q: 'Quelle est la qualité du vinyle?', a: 'Nous utilisons du vinyle professionnel avec lamination intégrée. Résistant à l\'eau, aux UV et aux rayures. Durée de vie extérieure de 3-5 ans.' },
    { q: 'La livraison est-elle disponible?', a: 'Livraison locale gratuite à Montréal (Mile-End et environs). Envoi postal disponible partout au Canada.' },
    { q: 'Le design est vraiment inclus?', a: 'Oui, la création ou l\'adaptation graphique de votre sticker est incluse dans tous nos prix. On s\'assure que votre design est optimisé pour l\'impression.' },
  ],
  en: [
    { q: 'What files should I provide?', a: 'Ideally a vector file (AI, SVG, PDF) or high-resolution PNG (300 DPI minimum) with transparent background. If you don\'t have a ready file, our graphic design service is included in the price.' },
    { q: 'What is the production time?', a: 'Production in 24 to 72 hours depending on complexity and quantity. We\'ll confirm the exact timeline when validating your order.' },
    { q: 'Can I order a completely custom shape?', a: 'Yes! The die-cut option lets us cut your stickers in any shape. The contour follows your design exactly.' },
    { q: 'What is the vinyl quality?', a: 'We use professional-grade vinyl with integrated lamination. Water, UV, and scratch resistant. Outdoor lifespan of 3-5 years.' },
    { q: 'Is delivery available?', a: 'Free local delivery in Montreal (Mile-End area). Postal shipping available across Canada.' },
    { q: 'Is design really included?', a: 'Yes, graphic creation or adaptation of your sticker is included in all our prices. We make sure your design is optimized for printing.' },
  ],
};
