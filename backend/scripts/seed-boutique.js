/**
 * Seed script pour peupler Strapi avec les données de la boutique.
 *
 * Usage: cd backend && node scripts/seed-boutique.js
 *
 * Prérequis: Strapi doit être lancé (npm run develop)
 * Configure STRAPI_URL et STRAPI_TOKEN si besoin.
 */

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

const headers = {
  'Content-Type': 'application/json',
  ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
};

async function apiPost(endpoint, data) {
  const res = await fetch(`${STRAPI_URL}/api${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${endpoint} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function apiGet(endpoint) {
  const res = await fetch(`${STRAPI_URL}/api${endpoint}`, { headers });
  if (!res.ok) throw new Error(`GET ${endpoint} failed: ${res.status}`);
  return res.json();
}

// ── Boutique Items ──
const boutiqueItems = [
  {
    slug: 'stickers',
    titleFr: 'Stickers',
    titleEn: 'Stickers',
    subtitleFr: 'Die-cut sur mesure, vinyle premium, livraison rapide',
    subtitleEn: 'Custom die-cut, premium vinyl, fast delivery',
    serviceKey: 'stickers',
    startingPrice: 30,
    hasCart: true,
    sortOrder: 1,
    active: true,
  },
  {
    slug: 'fine-art',
    titleFr: 'Impressions Fine Art',
    titleEn: 'Fine Art Prints',
    subtitleFr: 'Tirages giclée sur papier fine art, encres pigmentées archivales',
    subtitleEn: 'Giclée prints on fine art paper, archival pigment inks',
    serviceKey: 'prints',
    startingPrice: 16,
    hasCart: true,
    sortOrder: 2,
    active: true,
  },
  {
    slug: 'sublimation',
    titleFr: 'Sublimation & Merch',
    titleEn: 'Sublimation & Merch',
    subtitleFr: 'T-shirts, hoodies, mugs, tapis de souris et plus',
    subtitleEn: 'T-shirts, hoodies, mugs, mousepads and more',
    serviceKey: 'merch',
    startingPrice: 30,
    hasCart: true,
    sortOrder: 3,
    active: true,
  },
  {
    slug: 'flyers',
    titleFr: 'Flyers & Affiches',
    titleEn: 'Flyers & Posters',
    subtitleFr: 'Impression pro recto-verso, papier premium',
    subtitleEn: 'Professional double-sided printing, premium paper',
    serviceKey: 'prints',
    startingPrice: 40,
    hasCart: true,
    sortOrder: 4,
    active: true,
  },
  {
    slug: 'design',
    titleFr: 'Design Graphique',
    titleEn: 'Graphic Design',
    subtitleFr: 'Logos, identité visuelle, affiches et retouche photo',
    subtitleEn: 'Logos, visual identity, posters and photo retouching',
    serviceKey: 'design',
    startingPrice: 150,
    hasCart: false,
    sortOrder: 5,
    active: true,
  },
  {
    slug: 'web',
    titleFr: 'Développement Web',
    titleEn: 'Web Development',
    subtitleFr: 'Sites web sur mesure, SEO et référencement',
    subtitleEn: 'Custom websites, SEO and search ranking',
    serviceKey: 'design',
    startingPrice: 900,
    hasCart: false,
    sortOrder: 6,
    active: true,
  },
];

// ── Service Packages ──
const servicePackages = [
  {
    nameFr: 'Pack Artiste',
    nameEn: 'Artist Pack',
    descriptionFr: 'Idéal pour les artistes et musiciens qui veulent du merch de qualité.',
    descriptionEn: 'Ideal for artists and musicians who want quality merch.',
    items: [
      { labelFr: '50 stickers die-cut', labelEn: '50 die-cut stickers' },
      { labelFr: '10 tirages fine art 8×10"', labelEn: '10 fine art prints 8×10"' },
      { labelFr: 'Design graphique inclus', labelEn: 'Graphic design included' },
    ],
    priceFr: 'À partir de 120$',
    priceEn: 'Starting at $120',
    popular: false,
    ctaType: 'price',
    sortOrder: 1,
    active: true,
  },
  {
    nameFr: 'Pack Événement',
    nameEn: 'Event Pack',
    descriptionFr: 'Tout ce qu\'il faut pour promouvoir un événement.',
    descriptionEn: 'Everything you need to promote an event.',
    items: [
      { labelFr: '100 flyers A6', labelEn: '100 A6 flyers' },
      { labelFr: '100 stickers promo', labelEn: '100 promo stickers' },
      { labelFr: 'Affiche 18×24" (x5)', labelEn: '18×24" poster (x5)' },
      { labelFr: 'Création graphique incluse', labelEn: 'Graphic design included' },
    ],
    priceFr: 'À partir de 250$',
    priceEn: 'Starting at $250',
    popular: true,
    ctaType: 'price',
    sortOrder: 2,
    active: true,
  },
  {
    nameFr: 'Pack Lancement',
    nameEn: 'Launch Pack',
    descriptionFr: 'Le package complet pour lancer une marque ou un projet.',
    descriptionEn: 'The complete package to launch a brand or project.',
    items: [
      { labelFr: 'Site web vitrine', labelEn: 'Showcase website' },
      { labelFr: 'Logo + identité visuelle', labelEn: 'Logo + visual identity' },
      { labelFr: '200 stickers + 200 flyers', labelEn: '200 stickers + 200 flyers' },
      { labelFr: 'Merch (t-shirts sublimation)', labelEn: 'Merch (sublimation t-shirts)' },
    ],
    priceFr: 'Sur devis',
    priceEn: 'Custom quote',
    popular: false,
    ctaType: 'quote',
    sortOrder: 3,
    active: true,
  },
];

// ── Pricing Data for Products ──
const productPricingData = {
  stickers: {
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
    tiers: {
      standard: [
        { qty: 25, price: 30, unitPrice: 1.20 },
        { qty: 50, price: 45, unitPrice: 0.90 },
        { qty: 100, price: 75, unitPrice: 0.75 },
        { qty: 250, price: 150, unitPrice: 0.60 },
        { qty: 500, price: 250, unitPrice: 0.50 },
      ],
      laminated: [
        { qty: 25, price: 35, unitPrice: 1.40 },
        { qty: 50, price: 55, unitPrice: 1.10 },
        { qty: 100, price: 95, unitPrice: 0.95 },
        { qty: 250, price: 190, unitPrice: 0.76 },
        { qty: 500, price: 325, unitPrice: 0.65 },
      ],
      holographic: [
        { qty: 25, price: 42, unitPrice: 1.68 },
        { qty: 50, price: 65, unitPrice: 1.30 },
        { qty: 100, price: 110, unitPrice: 1.10 },
        { qty: 250, price: 220, unitPrice: 0.88 },
        { qty: 500, price: 380, unitPrice: 0.76 },
      ],
    },
  },
  'fine-art': {
    printerTiers: [
      { id: 'studio', labelFr: 'Studio (Epson ET-15000)', labelEn: 'Studio (Epson ET-15000)' },
      { id: 'museum', labelFr: 'Museum (Canon PRO-1000/2600)', labelEn: 'Museum (Canon PRO-1000/2600)' },
    ],
    formats: [
      { id: 'a4', label: 'A4 (8.5×11")', studioPrice: 16, museumPrice: 35 },
      { id: 'a3', label: 'A3 (11×17")', studioPrice: 22, museumPrice: 65 },
      { id: 'a3plus', label: 'A3+ (13×19")', studioPrice: 30, museumPrice: 95 },
      { id: 'a2', label: 'A2 (17×22")', studioPrice: 42, museumPrice: 125 },
    ],
    frameOption: { price: 30, labelFr: 'Cadre (+30$)', labelEn: 'Frame (+$30)' },
  },
  sublimation: {
    products: [
      { id: 'tshirt', labelFr: 'T-shirt', labelEn: 'T-shirt', prices: { 1: 30, 5: 25, 10: 22 } },
      { id: 'crewneck', labelFr: 'Crewneck', labelEn: 'Crewneck', prices: { 1: 45, 5: 38, 10: 32 } },
      { id: 'hoodie', labelFr: 'Hoodie', labelEn: 'Hoodie', prices: { 1: 50, 5: 45, 10: 40 } },
      { id: 'bag', labelFr: 'Fanny Pack', labelEn: 'Fanny Pack', prices: { 1: 80, 5: 70, 10: 60 } },
    ],
    designCost: 125,
  },
  flyers: {
    sides: [
      { id: 'recto', labelFr: 'Recto', labelEn: 'Front only', multiplier: 1 },
      { id: 'recto-verso', labelFr: 'Recto-verso', labelEn: 'Front & back', multiplier: 1.3 },
    ],
    tiers: [
      { qty: 50, price: 40, unitPrice: 0.80 },
      { qty: 100, price: 65, unitPrice: 0.65 },
      { qty: 250, price: 137.50, unitPrice: 0.55 },
      { qty: 500, price: 225, unitPrice: 0.45 },
    ],
  },
  design: {
    services: [
      { id: 'logo', labelFr: 'Logo', labelEn: 'Logo', priceRange: '$300-600' },
      { id: 'identity', labelFr: 'Identité complète', labelEn: 'Full Identity', priceRange: '$800-1500' },
      { id: 'poster', labelFr: 'Affiche', labelEn: 'Poster', priceRange: '$150-300' },
      { id: 'album-cover', labelFr: 'Pochette d\'album', labelEn: 'Album Cover', priceRange: '$200-400' },
      { id: 'icons', labelFr: 'Iconographie', labelEn: 'Icon Set', priceRange: '$200-500' },
      { id: 'retouching', labelFr: 'Retouche photo', labelEn: 'Photo Retouching', priceRange: '$15-50/photo' },
    ],
  },
  web: {
    projects: [
      { id: 'landing', labelFr: 'Landing page', labelEn: 'Landing page', price: 900 },
      { id: 'showcase', labelFr: 'Site vitrine', labelEn: 'Showcase site', priceRange: '$2000-3500' },
      { id: 'ecommerce', labelFr: 'E-commerce', labelEn: 'E-commerce', priceRange: '$4000-6000' },
    ],
    hourlyRate: 85,
  },
};

async function seed() {
  console.log('🌱 Seeding Strapi with boutique data...\n');

  // 1. Seed Boutique Items
  console.log('📦 Creating Boutique Items...');
  for (const item of boutiqueItems) {
    try {
      await apiPost('/boutique-items', item);
      console.log(`  ✅ ${item.slug}`);
    } catch (err) {
      console.log(`  ⚠️  ${item.slug}: ${err.message}`);
    }
  }

  // 2. Seed Service Packages
  console.log('\n🎁 Creating Service Packages...');
  for (const pkg of servicePackages) {
    try {
      await apiPost('/service-packages', pkg);
      console.log(`  ✅ ${pkg.nameFr}`);
    } catch (err) {
      console.log(`  ⚠️  ${pkg.nameFr}: ${err.message}`);
    }
  }

  // 3. Update Product pricingData
  console.log('\n💰 Updating Product pricing data...');
  for (const [slug, pricing] of Object.entries(productPricingData)) {
    try {
      // Find existing product by slug
      const res = await apiGet(`/products?filters[slug]=${slug}`);
      const products = res.data;

      if (products && products.length > 0) {
        const product = products[0];
        const updateRes = await fetch(`${STRAPI_URL}/api/products/${product.documentId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ data: { pricingData: pricing } }),
        });
        if (updateRes.ok) {
          console.log(`  ✅ ${slug} pricing updated`);
        } else {
          console.log(`  ⚠️  ${slug}: update failed ${updateRes.status}`);
        }
      } else {
        console.log(`  ⏭️  ${slug}: product not found in Strapi, skipping`);
      }
    } catch (err) {
      console.log(`  ⚠️  ${slug}: ${err.message}`);
    }
  }

  console.log('\n✅ Seed complete!');
}

seed().catch(console.error);
