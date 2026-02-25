/**
 * Seed script to populate Strapi with product data.
 * Run with: node scripts/seed-products.js
 *
 * Prerequisites:
 * - Strapi must be running (npm run develop)
 * - Create an API token in Strapi admin (Settings > API Tokens)
 * - Set STRAPI_TOKEN env var or edit the token below
 */

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || 'YOUR_API_TOKEN_HERE';

const products = [
  {
    name: 'Custom Stickers',
    slug: 'stickers',
    category: 'stickers',
    nameFr: 'Stickers Custom',
    nameEn: 'Custom Stickers',
    sortOrder: 1,
    active: true,
    pricingData: {
      finishes: [
        { id: 'matte', labelFr: 'Vinyle Matte', labelEn: 'Matte Vinyl' },
        { id: 'glossy', labelFr: 'Vinyle Glossy', labelEn: 'Glossy Vinyl' },
        { id: 'transparent', labelFr: 'Vinyle Transparent', labelEn: 'Clear Vinyl' },
        { id: 'holographic', labelFr: 'Holographique', labelEn: 'Holographic' },
      ],
      shapes: [
        { id: 'round', labelFr: 'Rond', labelEn: 'Round' },
        { id: 'square', labelFr: 'Carré', labelEn: 'Square' },
        { id: 'rectangle', labelFr: 'Rectangle', labelEn: 'Rectangle' },
        { id: 'diecut', labelFr: 'Die-cut (custom)', labelEn: 'Die-cut (custom)' },
      ],
      sizes: [
        { id: '2in', label: '2"' },
        { id: '2.5in', label: '2.5"' },
        { id: '3in', label: '3"' },
        { id: '4in', label: '4"' },
      ],
      standardPriceTiers: [
        { qty: 25, price: 30, unitPrice: 1.20 },
        { qty: 50, price: 45, unitPrice: 0.90 },
        { qty: 100, price: 75, unitPrice: 0.75 },
        { qty: 250, price: 150, unitPrice: 0.60 },
        { qty: 500, price: 250, unitPrice: 0.50 },
      ],
      holographicPriceTiers: [
        { qty: 25, price: 42, unitPrice: 1.68 },
        { qty: 50, price: 65, unitPrice: 1.30 },
        { qty: 100, price: 110, unitPrice: 1.10 },
        { qty: 250, price: 220, unitPrice: 0.88 },
        { qty: 500, price: 380, unitPrice: 0.76 },
      ],
    },
    highlightsFr: [
      'Découpe de précision professionnelle',
      'Vinyle matte, glossy, transparent, holographique',
      'Découpe contour à la forme exacte du design',
      'Lamination incluse - résistant eau, UV, rayures',
      'Design graphique inclus dans le prix',
      'Livraison locale disponible',
      'Délai rapide : 24-72h',
    ],
    highlightsEn: [
      'Professional precision cutting',
      'Matte, glossy, clear, holographic vinyl',
      'Contour cut to exact design shape',
      'Lamination included - water, UV, scratch resistant',
      'Graphic design included in price',
      'Local delivery available',
      'Fast turnaround: 24-72h',
    ],
    faqFr: [
      { q: 'Quels fichiers dois-je fournir?', a: 'Idéalement un fichier vectoriel (AI, SVG, PDF) ou un PNG haute résolution (300 DPI minimum) avec fond transparent.' },
      { q: 'Quel est le délai de production?', a: 'Production en 24 à 72 heures selon la complexité et la quantité.' },
      { q: 'Peut-on commander une forme totalement custom?', a: 'Oui! L\'option die-cut permet de découper vos stickers selon n\'importe quelle forme.' },
      { q: 'Quelle est la qualité du vinyle?', a: 'Vinyle professionnel avec lamination intégrée. Résistant à l\'eau, aux UV et aux rayures. Durée de vie extérieure de 3-5 ans.' },
    ],
    faqEn: [
      { q: 'What files should I provide?', a: 'Ideally a vector file (AI, SVG, PDF) or high-resolution PNG (300 DPI minimum) with transparent background.' },
      { q: 'What is the production time?', a: 'Production in 24 to 72 hours depending on complexity and quantity.' },
      { q: 'Can I order a completely custom shape?', a: 'Yes! The die-cut option lets us cut your stickers in any shape.' },
      { q: 'What is the vinyl quality?', a: 'Professional-grade vinyl with integrated lamination. Water, UV, and scratch resistant. Outdoor lifespan of 3-5 years.' },
    ],
  },
  {
    name: 'Fine Art Prints',
    slug: 'fine-art',
    category: 'fine-art',
    nameFr: 'Impression Fine Art',
    nameEn: 'Fine Art Print',
    sortOrder: 2,
    active: true,
    pricingData: {
      printerTiers: [
        { id: 'studio', labelFr: 'Série Studio', labelEn: 'Studio Series', desc: 'Epson ET-15000' },
        { id: 'museum', labelFr: 'Série Musée', labelEn: 'Museum Series', desc: 'Canon PRO-1000 / PRO-2600' },
      ],
      formats: [
        { id: 'a4', label: 'A4 (8.5×11")', studioPrice: 16, museumPrice: 35 },
        { id: 'a3', label: 'A3 (11×17")', studioPrice: 22, museumPrice: 65 },
        { id: 'a3plus', label: 'A3+ (13×19")', studioPrice: 30, museumPrice: 95 },
        { id: 'a2', label: 'A2 (18×24")', studioPrice: 42, museumPrice: 125 },
      ],
      framePrice: 30,
    },
    highlightsFr: [
      'Imprimantes professionnelles Canon & Epson',
      'Papiers fine art certifiés musée',
      'Durée de conservation 100+ ans',
      'Profils ICC sur mesure',
      'Option cadre noir ou blanc',
    ],
    highlightsEn: [
      'Professional Canon & Epson printers',
      'Museum-certified fine art papers',
      '100+ year conservation life',
      'Custom ICC profiles',
      'Black or white frame option',
    ],
    faqFr: [
      { q: 'Quelle est la différence entre Série Studio et Série Musée?', a: 'La Série Studio (Epson ET-15000) offre une excellente qualité pour tous les usages. La Série Musée (Canon PRO-1000/PRO-2600) utilise 12 encres pigmentées pour une qualité supérieure.' },
      { q: 'Quelle est la durée de conservation?', a: 'Nos tirages fine art ont une durée de conservation de 100+ ans grâce aux encres pigmentées et papiers d\'archives.' },
    ],
    faqEn: [
      { q: 'What is the difference between Studio and Museum Series?', a: 'The Studio Series (Epson ET-15000) offers excellent quality for all uses. The Museum Series (Canon PRO-1000/PRO-2600) uses 12 pigmented inks for superior quality.' },
      { q: 'What is the conservation lifespan?', a: 'Our fine art prints have a 100+ year conservation life thanks to pigmented inks and archival papers.' },
    ],
  },
  {
    name: 'Sublimation & Merch',
    slug: 'sublimation',
    category: 'sublimation',
    nameFr: 'Sublimation & Merch',
    nameEn: 'Sublimation & Merch',
    sortOrder: 3,
    active: true,
    pricingData: {
      products: [
        { id: 'tshirt', labelFr: 'T-shirt', labelEn: 'T-shirt' },
        { id: 'crewneck', labelFr: 'Crewneck', labelEn: 'Crewneck' },
        { id: 'hoodie', labelFr: 'Hoodie', labelEn: 'Hoodie' },
        { id: 'bag', labelFr: 'Sac banane', labelEn: 'Fanny Pack' },
      ],
      priceTiers: {
        tshirt: [
          { qty: 1, unitPrice: 30, price: 30 },
          { qty: 5, unitPrice: 25, price: 125 },
          { qty: 10, unitPrice: 22, price: 220 },
        ],
        crewneck: [
          { qty: 1, unitPrice: 45, price: 45 },
          { qty: 5, unitPrice: 40, price: 200 },
          { qty: 10, unitPrice: 35, price: 350 },
        ],
        hoodie: [
          { qty: 1, unitPrice: 50, price: 50 },
          { qty: 5, unitPrice: 45, price: 225 },
          { qty: 10, unitPrice: 40, price: 400 },
        ],
        bag: [
          { qty: 1, unitPrice: 80, price: 80 },
          { qty: 5, unitPrice: 70, price: 350 },
          { qty: 10, unitPrice: 60, price: 600 },
        ],
      },
      designPrice: 125,
    },
    highlightsFr: [
      'Impression permanente intégrée dans la fibre',
      'Ne craque pas, ne s\'efface pas au lavage',
      'T-shirts, crewnecks, hoodies, sacs bananes',
      'Design graphique disponible en option',
    ],
    highlightsEn: [
      'Permanent print integrated into the fiber',
      'Doesn\'t crack, doesn\'t fade in wash',
      'T-shirts, crewnecks, hoodies, fanny packs',
      'Graphic design available as option',
    ],
    faqFr: [
      { q: 'Qu\'est-ce que la sublimation?', a: 'La sublimation transfère l\'encre directement dans la fibre du tissu à haute température. Résultat permanent.' },
      { q: 'Quelle est la quantité minimale?', a: 'Nous acceptons les commandes à partir d\'une seule unité. Prix dégressifs à partir de 5 et 10 unités.' },
    ],
    faqEn: [
      { q: 'What is sublimation?', a: 'Sublimation transfers ink directly into the fabric fiber at high temperature. Permanent result.' },
      { q: 'What is the minimum quantity?', a: 'We accept orders starting from a single unit. Prices decrease at 5 and 10 units.' },
    ],
  },
  {
    name: 'Flyers & Cards',
    slug: 'flyers',
    category: 'flyers',
    nameFr: 'Flyers & Cartes',
    nameEn: 'Flyers & Cards',
    sortOrder: 4,
    active: true,
    pricingData: {
      sides: [
        { id: 'recto', labelFr: 'Recto', labelEn: 'Single-sided', multiplier: 1.0 },
        { id: 'recto-verso', labelFr: 'Recto-verso', labelEn: 'Double-sided', multiplier: 1.3 },
      ],
      priceTiers: [
        { qty: 50, price: 40, unitPrice: 0.80 },
        { qty: 100, price: 65, unitPrice: 0.65 },
        { qty: 150, price: 90, unitPrice: 0.60 },
        { qty: 250, price: 130, unitPrice: 0.52 },
        { qty: 500, price: 225, unitPrice: 0.45 },
      ],
    },
    highlightsFr: [
      'Papier premium 300g+',
      'Finition matte ou brillante',
      'Recto ou recto-verso',
      'Délai 24-48h',
    ],
    highlightsEn: [
      'Premium 300g+ paper',
      'Matte or glossy finish',
      'Single or double-sided',
      '24-48h turnaround',
    ],
    faqFr: [
      { q: 'Quels formats proposez-vous?', a: 'Flyers A6 (4"×6"), A5, lettre (8,5×11"). Cartes postales et cartes d\'affaires.' },
      { q: 'Quel papier utilisez-vous?', a: 'Papier premium 300g+ en finition matte ou brillante.' },
    ],
    faqEn: [
      { q: 'What formats do you offer?', a: 'A6 (4"×6"), A5, letter (8.5×11") flyers. Postcards and business cards.' },
      { q: 'What paper do you use?', a: 'Premium 300g+ paper in matte or glossy finish.' },
    ],
  },
  {
    name: 'Design Services',
    slug: 'design',
    category: 'design',
    nameFr: 'Design Graphique',
    nameEn: 'Graphic Design',
    sortOrder: 5,
    active: true,
    pricingData: {
      services: [
        { id: 'logo', labelFr: 'Création logo', labelEn: 'Logo design', priceRange: '300$ - 600$', timelineFr: '5-10 jours', timelineEn: '5-10 days' },
        { id: 'identity', labelFr: 'Identité visuelle complète', labelEn: 'Complete visual identity', priceRange: '800$ - 1 500$', timelineFr: '2-3 semaines', timelineEn: '2-3 weeks' },
        { id: 'poster', labelFr: 'Affiche / flyer événement', labelEn: 'Event poster / flyer', priceRange: '150$ - 300$', timelineFr: '3-5 jours', timelineEn: '3-5 days' },
        { id: 'album', labelFr: 'Pochette album / single', labelEn: 'Album / single cover', priceRange: '200$ - 400$', timelineFr: '5-7 jours', timelineEn: '5-7 days' },
        { id: 'icons', labelFr: 'Design d\'icônes (set)', labelEn: 'Icon set design', priceRange: '200$ - 500$', timelineFr: '3-7 jours', timelineEn: '3-7 days' },
        { id: 'retouching', labelFr: 'Retouche photo (par image)', labelEn: 'Photo retouching (per image)', priceRange: '15$ - 50$', timelineFr: '24-48h', timelineEn: '24-48h' },
      ],
    },
    highlightsFr: [
      'Adobe Illustrator, Figma, Photoshop, InDesign',
      '2 rondes de révisions incluses',
      'Fichiers vectoriels livrés (AI, EPS, SVG, PNG, PDF)',
    ],
    highlightsEn: [
      'Adobe Illustrator, Figma, Photoshop, InDesign',
      '2 rounds of revisions included',
      'Vector files delivered (AI, EPS, SVG, PNG, PDF)',
    ],
    faqFr: [
      { q: 'Qu\'est-ce qui est inclus dans une création de logo?', a: 'Recherche de références, exploration visuelle, création vectorielle, 2 rondes de révisions, et fichiers finaux.' },
    ],
    faqEn: [
      { q: 'What is included in a logo creation?', a: 'Reference research, visual exploration, vector creation, 2 rounds of revisions, and final files.' },
    ],
  },
  {
    name: 'Web Development',
    slug: 'web',
    category: 'web',
    nameFr: 'Développement Web',
    nameEn: 'Web Development',
    sortOrder: 6,
    active: true,
    pricingData: {
      services: [
        { id: 'landing', labelFr: 'Landing page événement', labelEn: 'Event landing page', price: '900$' },
        { id: 'showcase', labelFr: 'Site vitrine (5-10 pages)', labelEn: 'Showcase site (5-10 pages)', price: '2 000$ - 3 500$' },
        { id: 'ecommerce', labelFr: 'Site e-commerce', labelEn: 'E-commerce site', price: '4 000$ - 6 000$' },
        { id: 'redesign', labelFr: 'Refonte site existant', labelEn: 'Existing site redesign', price: { fr: 'Sur soumission', en: 'On quote' } },
        { id: 'maintenance', labelFr: 'Maintenance mensuelle', labelEn: 'Monthly maintenance', price: '100$ - 200$/mois' },
      ],
      hourlyRate: '85$/h',
    },
    highlightsFr: [
      'React/Next.js, Angular, Node.js, WordPress, Shopify, Strapi',
      'Sites responsive mobile-first',
      'SEO technique inclus',
    ],
    highlightsEn: [
      'React/Next.js, Angular, Node.js, WordPress, Shopify, Strapi',
      'Mobile-first responsive sites',
      'Technical SEO included',
    ],
    faqFr: [
      { q: 'Quelles technologies utilisez-vous?', a: 'React/Next.js, Angular, Node.js, WordPress, Shopify, Strapi.' },
      { q: 'Le SEO est-il inclus?', a: 'Oui, l\'optimisation SEO technique est incluse.' },
    ],
    faqEn: [
      { q: 'What technologies do you use?', a: 'React/Next.js, Angular, Node.js, WordPress, Shopify, Strapi.' },
      { q: 'Is SEO included?', a: 'Yes, technical SEO optimization is included.' },
    ],
  },
];

async function seed() {
  console.log('Seeding products into Strapi...\n');

  for (const product of products) {
    try {
      const response = await fetch(`${STRAPI_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${STRAPI_TOKEN}`,
        },
        body: JSON.stringify({ data: product }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`  Created: ${product.name} (${result.data?.documentId || 'ok'})`);
      } else {
        const error = await response.json();
        console.error(`  FAILED: ${product.name}`, error.error?.message || response.status);
      }
    } catch (err) {
      console.error(`  ERROR: ${product.name}`, err.message);
    }
  }

  console.log('\nDone! Check Strapi admin to verify products.');
}

seed();
