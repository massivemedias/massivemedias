/**
 * Seed Strapi with images by uploading directly to Supabase Storage
 * then registering them in Strapi's database via the admin API.
 *
 * This avoids Strapi's image processing (which crashes free tier Render).
 *
 * Usage: STRAPI_URL=https://massivemedias-api.onrender.com node scripts/seed-images-direct.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.resolve(__dirname, '../../frontend/public/images');
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

// Supabase config
const SUPABASE_URL = 'https://jmpznduhnbcqyyznsyhe.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptcHpuZHVobmJjcXl5em5zeWhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUxMjEzNSwiZXhwIjoyMDg3MDg4MTM1fQ.lYpdymvd4zx51Jwggifi-m6u_HhlkI2Wguzq_Op1bZc';
const BUCKET = 'strapi-media';

let TOKEN = '';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const MIME_MAP = {
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml',
};

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

// ---- Get image dimensions without sharp ----
function getImageSize(filePath) {
  // Read webp header for dimensions (simplified)
  try {
    const buf = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.webp') {
      // VP8 format
      if (buf[12] === 0x56 && buf[13] === 0x50 && buf[14] === 0x38) {
        if (buf[15] === 0x20) { // VP8
          const w = (buf[26] | (buf[27] << 8)) & 0x3fff;
          const h = (buf[28] | (buf[29] << 8)) & 0x3fff;
          return { width: w, height: h };
        }
        if (buf[15] === 0x4C) { // VP8L
          const bits = buf[21] | (buf[22] << 8) | (buf[23] << 16) | (buf[24] << 24);
          const w = (bits & 0x3fff) + 1;
          const h = ((bits >> 14) & 0x3fff) + 1;
          return { width: w, height: h };
        }
        if (buf[15] === 0x58) { // VP8X
          const w = 1 + ((buf[24]) | (buf[25] << 8) | (buf[26] << 16));
          const h = 1 + ((buf[27]) | (buf[28] << 8) | (buf[29] << 16));
          return { width: w, height: h };
        }
      }
      // RIFF header with VP8
      if (buf[0] === 0x52 && buf[1] === 0x49) { // RIFF
        for (let i = 12; i < Math.min(buf.length, 100); i++) {
          if (buf[i] === 0x56 && buf[i+1] === 0x50 && buf[i+2] === 0x38) {
            if (buf[i+3] === 0x20) {
              const off = i + 14;
              const w = (buf[off] | (buf[off+1] << 8)) & 0x3fff;
              const h = (buf[off+2] | (buf[off+3] << 8)) & 0x3fff;
              if (w > 0 && h > 0) return { width: w, height: h };
            }
            if (buf[i+3] === 0x4C) {
              const off = i + 9;
              const bits = buf[off] | (buf[off+1] << 8) | (buf[off+2] << 16) | (buf[off+3] << 24);
              const w = (bits & 0x3fff) + 1;
              const h = ((bits >> 14) & 0x3fff) + 1;
              if (w > 0 && h > 0) return { width: w, height: h };
            }
            if (buf[i+3] === 0x58) {
              const off = i + 12;
              const w = 1 + (buf[off] | (buf[off+1] << 8) | (buf[off+2] << 16));
              const h = 1 + (buf[off+3] | (buf[off+4] << 8) | (buf[off+5] << 16));
              if (w > 0 && h > 0) return { width: w, height: h };
            }
          }
        }
      }
    }
  } catch {}
  return { width: 0, height: 0 };
}

// ---- Upload to Supabase directly ----
async function uploadToSupabase(filePath) {
  const fullPath = path.resolve(IMAGES_DIR, filePath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`  SKIP (not found): ${filePath}`);
    return null;
  }

  const ext = path.extname(fullPath).toLowerCase();
  const mime = MIME_MAP[ext] || 'application/octet-stream';
  const hash = path.basename(fullPath, ext).replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now().toString(36);
  const key = `${hash}${ext}`;
  const fileData = fs.readFileSync(fullPath);
  const { width, height } = getImageSize(fullPath);

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Content-Type': mime,
      'x-upsert': 'true',
      'cache-control': 'max-age=3600',
    },
    body: fileData,
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`  SUPABASE FAIL (${res.status}): ${filePath} - ${err.slice(0, 100)}`);
    return null;
  }

  const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`;

  return {
    name: path.basename(fullPath),
    hash,
    ext,
    mime,
    size: (fileData.length / 1024).toFixed(2),
    url,
    width,
    height,
  };
}

// ---- Register file in Strapi ----
async function registerInStrapi(fileInfo) {
  // Use the Strapi upload API to register an already-uploaded file
  // We create a minimal upload with the file metadata
  const form = new FormData();
  // Create a tiny 1x1 pixel so Strapi processes quickly, then update the URL
  const tinyWebp = Buffer.from('UklGRiYAAABXRUJQVlA4IBoAAAAwAQCdASoBAAEAAkA4JYwCdAEO/hepAAD++9YAAA==', 'base64');
  const blob = new Blob([tinyWebp], { type: 'image/webp' });
  form.append('files', blob, fileInfo.name);
  form.append('fileInfo', JSON.stringify({
    name: fileInfo.name,
    alternativeText: '',
    caption: '',
  }));

  const res = await fetch(`${STRAPI_URL}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: form,
  });

  if (!res.ok) {
    console.error(`  STRAPI REGISTER FAIL (${res.status}): ${fileInfo.name}`);
    return null;
  }

  const [uploaded] = await res.json();

  // Now update the URL to point to our Supabase file
  const updateRes = await fetch(`${STRAPI_URL}/upload?id=${uploaded.id}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileInfo: {
        name: fileInfo.name,
        url: fileInfo.url,
        width: fileInfo.width || uploaded.width,
        height: fileInfo.height || uploaded.height,
        size: parseFloat(fileInfo.size),
        mime: fileInfo.mime,
      },
    }),
  });

  return uploaded.id;
}

// ---- Combined upload ----
const uploadedCache = new Map();

async function uploadFile(filePath) {
  if (uploadedCache.has(filePath)) {
    console.log(`  Cached: ${filePath} -> id=${uploadedCache.get(filePath)}`);
    return uploadedCache.get(filePath);
  }

  // Upload to Supabase directly
  const info = await uploadToSupabase(filePath);
  if (!info) return null;

  // Register in Strapi with a delay for free tier
  if (!STRAPI_URL.includes('localhost')) await sleep(8000);

  const id = await registerInStrapi(info);
  if (id) {
    uploadedCache.set(filePath, id);
    console.log(`  OK: ${filePath} -> id=${id} (${info.url.split('/').pop()})`);
  }
  return id;
}

// ---- Strapi helpers ----
async function getEntries(contentType) {
  await sleep(1000);
  const res = await fetch(`${STRAPI_URL}/content-manager/collection-types/api::${contentType}?pageSize=100`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) { console.error(`  GET FAIL (${res.status}): ${contentType}`); return []; }
  const data = await res.json();
  return data.results || [];
}

async function updateEntry(contentType, documentId, data) {
  const res = await fetch(`${STRAPI_URL}/content-manager/collection-types/api::${contentType}/${documentId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`  UPDATE FAIL: ${err.slice(0, 200)}`);
    return false;
  }
  return true;
}

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
    if (!mapping) continue;
    console.log(`\n  Artist: ${entry.slug}`);
    const avatarId = await uploadFile(mapping.avatar);
    const heroId = await uploadFile(mapping.heroImage);
    const printIds = await uploadMultiple(mapping.printImages);
    const data = {};
    if (avatarId) data.avatar = avatarId;
    if (heroId) data.heroImage = heroId;
    if (printIds.length) data.printImages = printIds;
    if (Object.keys(data).length) {
      const ok = await updateEntry('artist.artist', entry.documentId, data);
      console.log(`  ${ok ? 'UPDATED' : 'FAIL'}: ${entry.slug}`);
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
      ],
    },
    'stickers': {
      heroImage: 'stickers/StickersHero.webp',
      gallery: [
        'realisations/stickers/Stickers-Cosmovision.webp',
        'realisations/stickers/Stickers-Maudite-Machine.webp',
        'realisations/stickers/Stickers-massive.webp',
      ],
    },
    'merch': {
      gallery: [
        'realisations/textile/Textile1.webp', 'realisations/textile/Textile2.webp',
        'realisations/textile/Textile3.webp',
      ],
    },
    'design': {
      heroImage: 'graphism/GraphicDesignHero.webp',
      gallery: ['graphism/logo_massive.webp', 'graphism/onomiko.webp'],
    },
  };

  for (const entry of entries) {
    const mapping = serviceImages[entry.slug];
    if (!mapping) continue;
    console.log(`\n  Service: ${entry.slug}`);
    const data = {};
    if (mapping.heroImage) {
      const id = await uploadFile(mapping.heroImage);
      if (id) data.heroImage = id;
    }
    if (mapping.gallery) {
      const ids = await uploadMultiple(mapping.gallery);
      if (ids.length) data.gallery = ids;
    }
    if (Object.keys(data).length) {
      const ok = await updateEntry('service-page.service-page', entry.documentId, data);
      console.log(`  ${ok ? 'UPDATED' : 'FAIL'}: ${entry.slug}`);
    }
  }
}

async function seedProducts() {
  console.log('\n=== PRODUCTS ===');
  const entries = await getEntries('product.product');
  const productImages = {
    'stickers': ['stickers/StickersHero.webp'],
    'fine-art': ['prints/PrintsHero.webp'],
    'sublimation': ['realisations/textile/Textile1.webp'],
    'flyers': ['realisations/prints/Prints17.webp'],
    'design': ['graphism/GraphicDesignHero.webp'],
    'web': ['web/DevWebHero.webp'],
    'merch-tshirt': ['tshirts/white.webp'],
    'merch-hoodie': ['hoodies/white.webp'],
    'merch-longsleeve': ['longsleeve/white.webp'],
    'merch-totebag': ['totebags/natural.webp'],
  };

  for (const entry of entries) {
    const images = productImages[entry.slug];
    if (!images) continue;
    console.log(`\n  Product: ${entry.slug}`);
    const ids = await uploadMultiple(images);
    if (ids.length) {
      const ok = await updateEntry('product.product', entry.documentId, { images: ids });
      console.log(`  ${ok ? 'UPDATED' : 'FAIL'}: ${entry.slug}`);
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
    const img = boutiqueImages[entry.slug];
    if (!img) continue;
    console.log(`\n  Boutique: ${entry.slug}`);
    const id = await uploadFile(img);
    if (id) {
      const ok = await updateEntry('boutique-item.boutique-item', entry.documentId, { image: id });
      console.log(`  ${ok ? 'UPDATED' : 'FAIL'}: ${entry.slug}`);
    }
  }
}

// ===================== MAIN =====================
async function main() {
  console.log(`Seeding Strapi (${STRAPI_URL}) with images...`);
  console.log(`Images dir: ${IMAGES_DIR}`);
  console.log(`Supabase bucket: ${BUCKET}`);

  await login();
  await seedArtists();
  await seedServicePages();
  await seedProducts();
  await seedBoutiqueItems();

  console.log('\n=== DONE ===');
  console.log(`Total uploads: ${uploadedCache.size}`);
}

main().catch(console.error);
