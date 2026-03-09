/**
 * Seed Strapi inventory items matching products being sold.
 * Usage: node scripts/seed-inventory.mjs
 *        STRAPI_URL=https://massivemedias-api.onrender.com node scripts/seed-inventory.mjs
 */

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
let TOKEN = '';

// ---- Auth ----
async function login() {
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      const res = await fetch(`${STRAPI_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'massivemedias@gmail.com', password: 'Massive1423!!' }),
      });
      if (!res.ok) {
        console.warn(`  Login failed (${res.status}), retry ${attempt}/10 in ${15*attempt}s...`);
        await sleep(15000 * attempt);
        continue;
      }
      const data = await res.json();
      TOKEN = data.data.token;
      console.log('Logged in to Strapi admin');
      return;
    } catch (err) {
      console.warn(`  Login error (${err.message}), retry ${attempt}/10 in ${15*attempt}s...`);
      await sleep(15000 * attempt);
    }
  }
  throw new Error('Failed to login after 10 attempts');
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const isRemote = !STRAPI_URL.includes('localhost');
const DELAY = isRemote ? 10000 : 0; // 10s between creates for Render free tier
const MAX_RETRIES = 5;

// ---- API helpers ----
async function getEntries(contentType) {
  if (DELAY) await sleep(DELAY);
  const res = await fetch(`${STRAPI_URL}/content-manager/collection-types/api::${contentType}?pageSize=100`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) { console.error(`  GET FAIL (${res.status}): ${contentType}`); return []; }
  const data = await res.json();
  return data.results || [];
}

async function createEntry(contentType, data) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (DELAY) await sleep(DELAY);

    try {
      const res = await fetch(`${STRAPI_URL}/content-manager/collection-types/api::${contentType}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        return await res.json();
      }

      if (res.status === 401 || res.status === 403) {
        console.warn(`  Re-login (${res.status})...`);
        await sleep(15000);
        await login();
        continue;
      }
      if (res.status >= 500 && attempt < MAX_RETRIES) {
        console.warn(`  RETRY ${attempt}/${MAX_RETRIES} (${res.status}) - waiting ${15*attempt}s`);
        await sleep(15000 * attempt);
        try { await login(); } catch {}
        continue;
      }

      const err = await res.text();
      console.error(`  CREATE FAIL ${contentType} (${res.status}): ${err.slice(0, 300)}`);
      return null;
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        console.warn(`  RETRY ${attempt}/${MAX_RETRIES} (network) - waiting ${15*attempt}s`);
        await sleep(15000 * attempt);
        try { await login(); } catch {}
        continue;
      }
      console.error(`  CREATE FAIL ${contentType} (network): ${err.message}`);
      return null;
    }
  }
  return null;
}

// ---- Inventory items to create ----
// Category enum: textile, frame, accessory, sticker, print, merch, other

const inventoryItems = [
  // === TEXTILES (blanks for sublimation) ===
  {
    nameFr: 'T-Shirt Gildan 5000',
    nameEn: 'T-Shirt Gildan 5000',
    sku: 'TEX-TSHIRT-G5000',
    category: 'textile',
    variant: 'Blanc - toutes tailles',
    quantity: 50,
    lowStockThreshold: 10,
    costPrice: 5.50,
    location: 'Atelier',
    notes: '62 couleurs disponibles, tailles S-3XL. Stock de base en blanc, commande sur demande pour autres couleurs.',
    active: true,
  },
  {
    nameFr: 'Hoodie Gildan 18500',
    nameEn: 'Hoodie Gildan 18500',
    sku: 'TEX-HOODIE-G18500',
    category: 'textile',
    variant: 'Noir - toutes tailles',
    quantity: 20,
    lowStockThreshold: 5,
    costPrice: 15.00,
    location: 'Atelier',
    notes: '40 couleurs disponibles, tailles S-3XL. Stock de base en noir.',
    active: true,
  },
  {
    nameFr: 'Crewneck Gildan 18000',
    nameEn: 'Crewneck Sweatshirt Gildan 18000',
    sku: 'TEX-CREW-G18000',
    category: 'textile',
    variant: 'Noir - toutes tailles',
    quantity: 20,
    lowStockThreshold: 5,
    costPrice: 12.00,
    location: 'Atelier',
    notes: '31 couleurs disponibles, tailles S-3XL.',
    active: true,
  },
  {
    nameFr: 'Tote Bag Q-Tees QTB',
    nameEn: 'Tote Bag Q-Tees QTB',
    sku: 'TEX-TOTE-QTB',
    category: 'textile',
    variant: 'Naturel',
    quantity: 30,
    lowStockThreshold: 10,
    costPrice: 3.00,
    location: 'Atelier',
    notes: '18 couleurs disponibles.',
    active: true,
  },

  // === ACCESSOIRES (sublimation) ===
  {
    nameFr: 'Fanny Pack / Sac banane',
    nameEn: 'Fanny Pack',
    sku: 'ACC-FANNY',
    category: 'accessory',
    variant: 'Sublimation all-over',
    quantity: 10,
    lowStockThreshold: 3,
    costPrice: 25.00,
    location: 'Atelier',
    notes: 'Impression sublimation all-over.',
    active: true,
  },
  {
    nameFr: 'Tasse sublimation',
    nameEn: 'Sublimation Mug',
    sku: 'ACC-MUG',
    category: 'accessory',
    variant: '11oz blanc',
    quantity: 25,
    lowStockThreshold: 10,
    costPrice: 2.50,
    location: 'Atelier',
    notes: 'Tasse ceramique blanche 11oz pour sublimation.',
    active: true,
  },
  {
    nameFr: 'Tumbler sublimation',
    nameEn: 'Sublimation Tumbler',
    sku: 'ACC-TUMBLER',
    category: 'accessory',
    variant: '20oz inox',
    quantity: 15,
    lowStockThreshold: 5,
    costPrice: 8.00,
    location: 'Atelier',
    notes: 'Tumbler acier inoxydable 20oz pour sublimation.',
    active: true,
  },

  // === STICKERS ===
  {
    nameFr: 'Vinyle autocollant - Mat',
    nameEn: 'Vinyl Sticker - Matte',
    sku: 'STK-MATTE',
    category: 'sticker',
    variant: 'Rouleau mat',
    quantity: 5,
    lowStockThreshold: 2,
    costPrice: 35.00,
    location: 'Atelier',
    notes: 'Vinyle mat pour decoupe. Formes: rond, carre, rectangle, die-cut. Tailles: 2"-4".',
    active: true,
  },
  {
    nameFr: 'Vinyle autocollant - Brillant',
    nameEn: 'Vinyl Sticker - Glossy',
    sku: 'STK-GLOSSY',
    category: 'sticker',
    variant: 'Rouleau brillant',
    quantity: 5,
    lowStockThreshold: 2,
    costPrice: 35.00,
    location: 'Atelier',
    notes: 'Vinyle brillant pour decoupe.',
    active: true,
  },
  {
    nameFr: 'Vinyle autocollant - Holographique',
    nameEn: 'Vinyl Sticker - Holographic',
    sku: 'STK-HOLO',
    category: 'sticker',
    variant: 'Rouleau holographique',
    quantity: 3,
    lowStockThreshold: 1,
    costPrice: 55.00,
    location: 'Atelier',
    notes: 'Vinyle holographique premium.',
    active: true,
  },
  {
    nameFr: 'Vinyle autocollant - Broken Glass',
    nameEn: 'Vinyl Sticker - Broken Glass',
    sku: 'STK-BROKENGLASS',
    category: 'sticker',
    variant: 'Rouleau broken glass',
    quantity: 3,
    lowStockThreshold: 1,
    costPrice: 55.00,
    location: 'Atelier',
    notes: 'Vinyle effet verre brise premium.',
    active: true,
  },
  {
    nameFr: 'Vinyle autocollant - Stars',
    nameEn: 'Vinyl Sticker - Stars',
    sku: 'STK-STARS',
    category: 'sticker',
    variant: 'Rouleau etoiles',
    quantity: 3,
    lowStockThreshold: 1,
    costPrice: 55.00,
    location: 'Atelier',
    notes: 'Vinyle effet etoiles premium.',
    active: true,
  },

  // === FINE ART PRINTS ===
  {
    nameFr: 'Papier Fine Art A4 (8.5x11")',
    nameEn: 'Fine Art Paper A4 (8.5x11")',
    sku: 'PRT-PAPER-A4',
    category: 'print',
    variant: 'A4 - 8.5x11 pouces',
    quantity: 100,
    lowStockThreshold: 20,
    costPrice: 2.00,
    location: 'Atelier',
    notes: 'Papier fine art premium avec profil ICC. Compatible Studio et Museum Series.',
    active: true,
  },
  {
    nameFr: 'Papier Fine Art A3 (11x17")',
    nameEn: 'Fine Art Paper A3 (11x17")',
    sku: 'PRT-PAPER-A3',
    category: 'print',
    variant: 'A3 - 11x17 pouces',
    quantity: 75,
    lowStockThreshold: 15,
    costPrice: 4.00,
    location: 'Atelier',
    notes: 'Papier fine art premium avec profil ICC.',
    active: true,
  },
  {
    nameFr: 'Papier Fine Art A3+ (13x19")',
    nameEn: 'Fine Art Paper A3+ (13x19")',
    sku: 'PRT-PAPER-A3PLUS',
    category: 'print',
    variant: 'A3+ - 13x19 pouces',
    quantity: 50,
    lowStockThreshold: 10,
    costPrice: 6.00,
    location: 'Atelier',
    notes: 'Papier fine art premium avec profil ICC.',
    active: true,
  },
  {
    nameFr: 'Papier Fine Art A2 (18x24")',
    nameEn: 'Fine Art Paper A2 (18x24")',
    sku: 'PRT-PAPER-A2',
    category: 'print',
    variant: 'A2 - 18x24 pouces',
    quantity: 30,
    lowStockThreshold: 5,
    costPrice: 10.00,
    location: 'Atelier',
    notes: 'Papier fine art premium avec profil ICC.',
    active: true,
  },

  // === ENCRES IMPRIMANTE ===
  {
    nameFr: 'Encre pigmentee - Studio Series (4 couleurs)',
    nameEn: 'Pigmented Ink - Studio Series (4 colors)',
    sku: 'PRT-INK-STUDIO',
    category: 'print',
    variant: 'Set 4 couleurs',
    quantity: 4,
    lowStockThreshold: 1,
    costPrice: 45.00,
    location: 'Atelier',
    notes: 'Cartouches encre pigmentee pour imprimante Studio Series.',
    active: true,
  },
  {
    nameFr: 'Encre pigmentee - Museum Series (12 couleurs)',
    nameEn: 'Pigmented Ink - Museum Series (12 colors)',
    sku: 'PRT-INK-MUSEUM',
    category: 'print',
    variant: 'Set 12 couleurs',
    quantity: 2,
    lowStockThreshold: 1,
    costPrice: 120.00,
    location: 'Atelier',
    notes: 'Cartouches encre pigmentee pour imprimante Museum Series.',
    active: true,
  },

  // === CADRES ===
  {
    nameFr: 'Cadre noir A4',
    nameEn: 'Black Frame A4',
    sku: 'FRM-BLK-A4',
    category: 'frame',
    variant: 'Noir - A4 (8.5x11")',
    quantity: 10,
    lowStockThreshold: 3,
    costPrice: 8.00,
    location: 'Atelier',
    active: true,
  },
  {
    nameFr: 'Cadre blanc A4',
    nameEn: 'White Frame A4',
    sku: 'FRM-WHT-A4',
    category: 'frame',
    variant: 'Blanc - A4 (8.5x11")',
    quantity: 10,
    lowStockThreshold: 3,
    costPrice: 8.00,
    location: 'Atelier',
    active: true,
  },
  {
    nameFr: 'Cadre noir A3',
    nameEn: 'Black Frame A3',
    sku: 'FRM-BLK-A3',
    category: 'frame',
    variant: 'Noir - A3 (11x17")',
    quantity: 5,
    lowStockThreshold: 2,
    costPrice: 12.00,
    location: 'Atelier',
    active: true,
  },
  {
    nameFr: 'Cadre blanc A3',
    nameEn: 'White Frame A3',
    sku: 'FRM-WHT-A3',
    category: 'frame',
    variant: 'Blanc - A3 (11x17")',
    quantity: 5,
    lowStockThreshold: 2,
    costPrice: 12.00,
    location: 'Atelier',
    active: true,
  },
  {
    nameFr: 'Cadre noir A3+',
    nameEn: 'Black Frame A3+',
    sku: 'FRM-BLK-A3PLUS',
    category: 'frame',
    variant: 'Noir - A3+ (13x19")',
    quantity: 3,
    lowStockThreshold: 1,
    costPrice: 18.00,
    location: 'Atelier',
    active: true,
  },
  {
    nameFr: 'Cadre blanc A3+',
    nameEn: 'White Frame A3+',
    sku: 'FRM-WHT-A3PLUS',
    category: 'frame',
    variant: 'Blanc - A3+ (13x19")',
    quantity: 3,
    lowStockThreshold: 1,
    costPrice: 18.00,
    location: 'Atelier',
    active: true,
  },
  {
    nameFr: 'Cadre noir A2',
    nameEn: 'Black Frame A2',
    sku: 'FRM-BLK-A2',
    category: 'frame',
    variant: 'Noir - A2 (18x24")',
    quantity: 2,
    lowStockThreshold: 1,
    costPrice: 25.00,
    location: 'Atelier',
    active: true,
  },
  {
    nameFr: 'Cadre blanc A2',
    nameEn: 'White Frame A2',
    sku: 'FRM-WHT-A2',
    category: 'frame',
    variant: 'Blanc - A2 (18x24")',
    quantity: 2,
    lowStockThreshold: 1,
    costPrice: 25.00,
    location: 'Atelier',
    active: true,
  },

  // === FLYERS / CARTES D'AFFAIRES ===
  {
    nameFr: 'Papier cartes d\'affaires / flyers',
    nameEn: 'Business Cards / Flyers Paper',
    sku: 'PRT-CARDSTOCK',
    category: 'print',
    variant: 'Carton 14pt recto-verso',
    quantity: 500,
    lowStockThreshold: 100,
    costPrice: 0.10,
    location: 'Atelier',
    notes: 'Papier carton premium pour flyers et cartes d\'affaires. Impression recto ou recto-verso.',
    active: true,
  },

  // === SUBLIMATION SUPPLIES ===
  {
    nameFr: 'Papier transfert sublimation',
    nameEn: 'Sublimation Transfer Paper',
    sku: 'SUB-PAPER',
    category: 'other',
    variant: 'Rouleau 13" large',
    quantity: 3,
    lowStockThreshold: 1,
    costPrice: 40.00,
    location: 'Atelier',
    notes: 'Papier transfert pour sublimation textile et accessoires.',
    active: true,
  },
  {
    nameFr: 'Encre sublimation (CMYK)',
    nameEn: 'Sublimation Ink (CMYK)',
    sku: 'SUB-INK',
    category: 'other',
    variant: 'Set 4 couleurs CMYK',
    quantity: 2,
    lowStockThreshold: 1,
    costPrice: 60.00,
    location: 'Atelier',
    notes: 'Encre sublimation pour impression sur textiles et accessoires.',
    active: true,
  },
];

// ===================== MAIN =====================

async function main() {
  console.log(`Seeding inventory items in Strapi (${STRAPI_URL})...`);

  await login();

  // Check existing inventory items
  const existing = await getEntries('inventory-item.inventory-item');
  const existingSKUs = new Set(existing.map(e => e.sku));
  console.log(`\nExisting inventory items: ${existing.length}`);
  if (existing.length) {
    existing.forEach(e => console.log(`  - ${e.sku}: ${e.nameFr}`));
  }

  // Get products to link relations
  const products = await getEntries('product.product');
  console.log(`\nProducts found: ${products.length}`);
  products.forEach(p => console.log(`  - ${p.slug} (${p.documentId})`));

  // Map SKU prefixes to product slugs for auto-linking
  const skuToProduct = {
    'TEX-TSHIRT': 'merch-tshirt',
    'TEX-HOODIE': 'merch-hoodie',
    'TEX-CREW': 'merch-crewneck',
    'TEX-TOTE': 'merch-totebag',
    'STK-': 'stickers',
    'PRT-PAPER': 'fine-art',
    'PRT-INK': 'fine-art',
    'PRT-CARDSTOCK': 'flyers',
    'FRM-': 'fine-art',
    'ACC-FANNY': 'sublimation',
    'ACC-MUG': 'sublimation',
    'ACC-TUMBLER': 'sublimation',
    'SUB-': 'sublimation',
  };

  const productMap = {};
  for (const p of products) {
    productMap[p.slug] = p.documentId;
  }

  // Create inventory items
  let created = 0;
  let skipped = 0;

  for (const item of inventoryItems) {
    if (existingSKUs.has(item.sku)) {
      console.log(`  SKIP (exists): ${item.sku}`);
      skipped++;
      continue;
    }

    // Auto-link to product
    const data = { ...item };
    for (const [prefix, slug] of Object.entries(skuToProduct)) {
      if (item.sku.startsWith(prefix) && productMap[slug]) {
        data.product = { documentId: productMap[slug] };
        break;
      }
    }

    console.log(`\n  Creating: ${item.sku} - ${item.nameFr}`);
    const result = await createEntry('inventory-item.inventory-item', data);

    if (result) {
      console.log(`  OK: created ${item.sku} (status=${result.status || 'published'})`);
      created++;
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Created: ${created}, Skipped: ${skipped}, Total items: ${inventoryItems.length}`);
}

main().catch(console.error);
