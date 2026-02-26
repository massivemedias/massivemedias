import { thumb } from '../utils/paths';

/**
 * Artist print pricing - returns final client price (production + artist margin included)
 */
export function getArtistPrintPrice(pricing, tier, format, withFrame) {
  const prices = tier === 'museum' ? pricing.museum : pricing.studio;
  const base = prices[format];
  if (base == null) return null;
  const framePrice = withFrame ? (pricing.framePrice || 20) : 0;
  return { price: base + framePrice, basePrice: base, framePrice };
}

export const artistPrinterTiers = [
  { id: 'studio', labelFr: 'Série Studio', labelEn: 'Studio Series', desc: 'Epson ET-15000' },
  { id: 'museum', labelFr: 'Série Musée', labelEn: 'Museum Series', desc: 'Canon PRO-1000' },
];

export const artistFormats = [
  { id: 'a4', label: 'A4 (8.5×11")' },
  { id: 'a3', label: 'A3 (11×17")' },
  { id: 'a3plus', label: 'A3+ (13×19")' },
  { id: 'a2', label: 'A2 (18×24")' },
];

const artistsData = {
  'mok': {
    slug: 'mok',
    name: 'Mok',
    tagline: {
      fr: 'Photographie urbaine & lumière',
      en: 'Urban Photography & Light',
    },
    bio: {
      fr: "Photographe montréalais avec un oeil unique pour la composition et la lumière. Ses oeuvres capturent l'essence de la ville à travers des perspectives inattendues - architecture, reflets, textures urbaines. Chaque tirage est une invitation à voir Montréal autrement.",
      en: "Montreal photographer with a unique eye for composition and light. His work captures the essence of the city through unexpected perspectives - architecture, reflections, urban textures. Each print is an invitation to see Montreal differently.",
    },
    avatar: null,
    heroImage: thumb('/images/prints/Printstoutcourt.webp'),
    prints: [
      { id: 'mok-001', titleFr: 'Oeuvre I', titleEn: 'Artwork I', image: thumb('/images/prints/Printstoutcourt.webp'), limited: false },
      { id: 'mok-002', titleFr: 'Oeuvre II', titleEn: 'Artwork II', image: thumb('/images/prints/Printstoutcourt.webp'), limited: false },
      { id: 'mok-003', titleFr: 'Oeuvre III', titleEn: 'Artwork III', image: thumb('/images/prints/Printstoutcourt.webp'), limited: false },
      { id: 'mok-004', titleFr: 'Oeuvre IV', titleEn: 'Artwork IV', image: thumb('/images/prints/Printstoutcourt.webp'), limited: false },
      { id: 'mok-005', titleFr: 'Oeuvre V', titleEn: 'Artwork V', image: thumb('/images/prints/Printstoutcourt.webp'), limited: false },
      { id: 'mok-006', titleFr: 'Oeuvre VI', titleEn: 'Artwork VI', image: thumb('/images/prints/Printstoutcourt.webp'), limited: false },
    ],
    pricing: {
      studio: { a4: 35, a3: 50, a3plus: 65, a2: 85 },
      museum: { a4: 75, a3: 120, a3plus: 160, a2: 225 },
      framePrice: 20,
    },
  },
};

export default artistsData;
