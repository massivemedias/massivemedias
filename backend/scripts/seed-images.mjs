/**
 * Seed Strapi media fields with images from the frontend repo.
 * Usage: node scripts/seed-images.mjs
 *
 * Requires: STRAPI running on localhost:1337
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.resolve(__dirname, '../../frontend/public/images');
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
let TOKEN = '';

// ---- Auth ----
async function login() {
  const res = await fetch(`${STRAPI_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'massivemedias@gmail.com', password: 'Massive1423!!' }),
  });
  const data = await res.json();
  TOKEN = data.data.token;
  console.log('Logged in to Strapi admin');
}

// ---- Helpers ----
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const DELAY = STRAPI_URL.includes('localhost') ? 0 : 45000; // 45s between uploads for free tier
const MAX_RETRIES = 5;

async function uploadFile(filePath) {
  const fullPath = path.resolve(IMAGES_DIR, filePath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`  SKIP (not found): ${filePath}`);
    return null;
  }

  const ext = path.extname(fullPath).toLowerCase();
  const mimeMap = {
    '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (DELAY) await sleep(DELAY);

    const blob = new Blob([fs.readFileSync(fullPath)], { type: mimeMap[ext] || 'application/octet-stream' });
    const form = new FormData();
    form.append('files', blob, path.basename(fullPath));

    try {
      const res = await fetch(`${STRAPI_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}` },
        body: form,
      });

      if (res.ok) {
        const [uploaded] = await res.json();
        console.log(`  Uploaded: ${filePath} -> id=${uploaded.id}`);
        return uploaded.id;
      }

      if (res.status === 401 || res.status === 403) {
        console.warn(`  Re-login (${res.status})...`);
        await sleep(30000);
        await login();
        continue;
      }
      if (res.status >= 500 && attempt < MAX_RETRIES) {
        console.warn(`  RETRY ${attempt}/${MAX_RETRIES} (${res.status}): ${filePath} - waiting ${30*attempt}s`);
        await sleep(30000 * attempt); // heavy backoff - wait for Render restart
        // Re-login in case server restarted
        try { await login(); } catch {}
        continue;
      }

      console.error(`  UPLOAD FAIL (${res.status}): ${filePath}`);
      return null;
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        console.warn(`  RETRY ${attempt}/${MAX_RETRIES} (network): ${filePath}`);
        await sleep(5000 * attempt);
        continue;
      }
      console.error(`  UPLOAD FAIL (network): ${filePath} - ${err.message}`);
      return null;
    }
  }
  return null;
}

// ---- Update content helper ----
async function updateEntry(contentType, documentId, data) {
  const res = await fetch(`${STRAPI_URL}/content-manager/collection-types/api::${contentType}/${documentId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`  UPDATE FAIL ${contentType}/${documentId}: ${err.slice(0, 200)}`);
    return false;
  }
  return true;
}

async function updateSingleType(contentType, data) {
  const res = await fetch(`${STRAPI_URL}/content-manager/single-types/api::${contentType}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`  UPDATE FAIL single ${contentType}: ${err.slice(0, 200)}`);
    return false;
  }
  return true;
}

// ---- Get entries ----
async function getEntries(contentType) {
  if (DELAY) await sleep(1000);
  const res = await fetch(`${STRAPI_URL}/content-manager/collection-types/api::${contentType}?pageSize=100`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) { console.error(`  GET FAIL (${res.status}): ${contentType}`); return []; }
  const data = await res.json();
  return data.results || [];
}

async function getSingleType(contentType) {
  if (DELAY) await sleep(1000);
  const res = await fetch(`${STRAPI_URL}/content-manager/single-types/api::${contentType}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) { console.error(`  GET FAIL (${res.status}): ${contentType}`); return {}; }
  return await res.json();
}

// ---- Upload multiple images, return array of IDs ----
async function uploadMultiple(paths) {
  const ids = [];
  for (const p of paths) {
    const id = await uploadFile(p);
    if (id) ids.push(id);
  }
  return ids;
}

// ===================== SEED DATA =====================

async function seedArtists() {
  console.log('\n=== ARTISTS ===');
  const entries = await getEntries('artist.artist');

  const artistImages = {
    'adrift': {
      avatar: 'prints/AdriftAvatar.webp',
      heroImage: 'prints/Adrift1.webp',
      printImages: [
        'prints/Adrift1.webp', 'prints/Adrift2.webp', 'prints/Adrift5.webp',
        'prints/Adrift6.webp', 'prints/Adrift7.webp', 'prints/Adrift8.webp',
        'prints/Adrift9.webp', 'prints/Adrift10.webp', 'prints/Adrift11.webp',
        'prints/Adrift12.webp', 'prints/Adrift13.webp', 'prints/Adrift14.webp',
        'prints/Adrift15.webp', 'prints/Adrift16.webp',
      ],
    },
    'maudite-machine': {
      avatar: 'stickers/Stickers-Maudite-Machine.webp',
      heroImage: 'prints/Gemini2.webp',
      printImages: ['prints/Gemini2.webp', 'prints/Gemini4.webp'],
    },
    'mok': {
      avatar: 'prints/MokAvatar.webp',
      heroImage: 'prints/Mok1.webp',
      printImages: ['prints/Mok1.webp'],
    },
    'psyqu33n': {
      avatar: 'prints/Psyqu33nAvatar.webp',
      heroImage: 'prints/Psyqu33n1.webp',
      printImages: [
        'prints/Psyqu33n1.webp', 'prints/Psyqu33n2.webp', 'prints/Psyqu33n3.webp',
        'prints/Psyqu33n4.webp', 'prints/Psyqu33n5.webp', 'prints/Psyqu33n6.webp',
        'prints/Psyqu33n7.webp', 'prints/Psyqu33n8.webp', 'prints/Psyqu33n9.webp',
        'prints/Psyqu33n10.webp', 'prints/Psyqu33n11.webp', 'prints/Psyqu33n12.webp',
      ],
    },
  };

  for (const entry of entries) {
    const mapping = artistImages[entry.slug];
    if (!mapping) { console.log(`  No mapping for artist: ${entry.slug}`); continue; }

    console.log(`\n  Artist: ${entry.slug} (id=${entry.documentId})`);

    const avatarId = await uploadFile(mapping.avatar);
    const heroId = await uploadFile(mapping.heroImage);
    const printIds = await uploadMultiple(mapping.printImages);

    const updateData = {};
    if (avatarId) updateData.avatar = avatarId;
    if (heroId) updateData.heroImage = heroId;
    if (printIds.length) updateData.printImages = printIds;

    if (Object.keys(updateData).length) {
      const ok = await updateEntry('artist.artist', entry.documentId, updateData);
      console.log(`  ${ok ? 'OK' : 'FAIL'}: updated ${entry.slug}`);
    }
  }
}

async function seedServicePages() {
  console.log('\n=== SERVICE PAGES ===');
  const entries = await getEntries('service-page.service-page');

  const serviceImages = {
    'prints': {
      heroImage: 'prints/PrintsHero.webp',
      gallery: [
        'realisations/prints/FineArt1.webp', 'realisations/prints/FineArt4.webp',
        'realisations/prints/FineArt6.webp', 'realisations/prints/FineArt-Photo.webp',
        'realisations/prints/Prints7.webp', 'realisations/prints/Prints17.webp',
        'realisations/prints/Prints18.webp', 'realisations/prints/Prints22.webp',
        'realisations/prints/Prints24.webp',
      ],
    },
    'stickers': {
      heroImage: 'stickers/StickersHero.webp',
      gallery: [
        'realisations/stickers/Stickers-Cosmovision.webp',
        'realisations/stickers/Stickers-Fusion-State-Rec.webp',
        'realisations/stickers/Stickers-Maudite-Machine.webp',
        'realisations/stickers/Stickers-Vrstl.webp',
        'realisations/stickers/Stickers-massive.webp',
      ],
    },
    'merch': {
      heroImage: 'realisations/textile/MerchHero.webp',
      gallery: [
        'realisations/textile/Textile1.webp', 'realisations/textile/Textile2.webp',
        'realisations/textile/Textile3.webp', 'realisations/textile/Textile4.webp',
        'realisations/textile/Textile5.webp', 'realisations/textile/Textile6.webp',
        'realisations/textile/Textile7.webp',
      ],
    },
    'design': {
      heroImage: 'graphism/GraphicDesignHero.webp',
      gallery: [
        'graphism/logo_massive.webp', 'graphism/logo_mok.webp',
        'graphism/onomiko.webp', 'graphism/logo_pq.webp',
        'graphism/logo_cosmovision.webp', 'graphism/logo_fusionstate.webp',
      ],
    },
  };

  for (const entry of entries) {
    const mapping = serviceImages[entry.slug];
    if (!mapping) { console.log(`  No mapping for service: ${entry.slug}`); continue; }

    console.log(`\n  Service: ${entry.slug} (id=${entry.documentId})`);

    const heroId = await uploadFile(mapping.heroImage);
    const galleryIds = await uploadMultiple(mapping.gallery || []);

    const updateData = {};
    if (heroId) updateData.heroImage = heroId;
    if (galleryIds.length) updateData.gallery = galleryIds;

    if (Object.keys(updateData).length) {
      const ok = await updateEntry('service-page.service-page', entry.documentId, updateData);
      console.log(`  ${ok ? 'OK' : 'FAIL'}: updated ${entry.slug}`);
    }
  }
}

async function seedProducts() {
  console.log('\n=== PRODUCTS ===');
  const entries = await getEntries('product.product');

  const productImages = {
    'stickers': { images: ['stickers/StickersHero.webp'] },
    'fine-art': { images: ['prints/PrintsHero.webp'] },
    'sublimation': { images: ['realisations/textile/Textile1.webp'] },
    'flyers': { images: ['realisations/prints/Prints17.webp'] },
    'design': { images: ['graphism/GraphicDesignHero.webp'] },
    'web': { images: ['web/DevWebHero.webp'] },
    'merch-tshirt': { images: ['tshirts/white.webp'] },
    'merch-hoodie': { images: ['hoodies/white.webp'] },
    'merch-crewneck': { images: ['crewneck/white.webp'] },
    'merch-totebag': { images: ['totebags/natural.webp'] },
  };

  for (const entry of entries) {
    const mapping = productImages[entry.slug];
    if (!mapping) { console.log(`  No mapping for product: ${entry.slug}`); continue; }

    console.log(`\n  Product: ${entry.slug} (id=${entry.documentId})`);

    const imageIds = await uploadMultiple(mapping.images);

    if (imageIds.length) {
      const ok = await updateEntry('product.product', entry.documentId, { images: imageIds });
      console.log(`  ${ok ? 'OK' : 'FAIL'}: updated ${entry.slug}`);
    }
  }
}

async function seedBoutiqueItems() {
  console.log('\n=== BOUTIQUE ITEMS ===');
  const entries = await getEntries('boutique-item.boutique-item');

  const boutiqueImages = {
    'stickers': 'stickers/StickersHero.webp',
    'fine-art': 'prints/PrintsHero.webp',
    'sublimation': 'realisations/textile/Textile1.webp',
    'flyers': 'realisations/prints/Prints17.webp',
    'design': 'graphism/GraphicDesignHero.webp',
    'web': 'web/DevWebHero.webp',
  };

  for (const entry of entries) {
    const imagePath = boutiqueImages[entry.slug];
    if (!imagePath) { console.log(`  No mapping for boutique: ${entry.slug}`); continue; }

    console.log(`\n  Boutique: ${entry.slug} (id=${entry.documentId})`);

    const imageId = await uploadFile(imagePath);
    if (imageId) {
      const ok = await updateEntry('boutique-item.boutique-item', entry.documentId, { image: imageId });
      console.log(`  ${ok ? 'OK' : 'FAIL'}: updated ${entry.slug}`);
    }
  }
}

async function seedSiteContent() {
  console.log('\n=== SITE CONTENT ===');
  const entry = await getSingleType('site-content.site-content');
  if (!entry || !entry.documentId) {
    console.log('  Site content not found or not created yet');
    return;
  }

  console.log(`  Site content (documentId=${entry.documentId})`);

  const heroIds = await uploadMultiple([
    'prints/Adrift1.webp', 'prints/Psyqu33n1.webp', 'prints/Gemini2.webp',
  ]);

  const updateData = {};
  if (heroIds.length) updateData.heroImages = heroIds;

  if (Object.keys(updateData).length) {
    const ok = await updateSingleType('site-content.site-content', updateData);
    console.log(`  ${ok ? 'OK' : 'FAIL'}: updated site-content`);
  }
}

// ===================== MAIN =====================

async function main() {
  console.log('Seeding Strapi with images from frontend repo...');
  console.log(`Images dir: ${IMAGES_DIR}`);

  await login();
  await seedArtists();
  await seedServicePages();
  await seedProducts();
  await seedBoutiqueItems();
  await seedSiteContent();

  console.log('\n=== DONE ===');
}

main().catch(console.error);
