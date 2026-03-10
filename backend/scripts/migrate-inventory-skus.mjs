/**
 * Migration: Renommer les SKUs en MS- et desactiver les consommables (papier, encre)
 * Usage: node scripts/migrate-inventory-skus.mjs
 *        STRAPI_URL=https://massivemedias-api.onrender.com node scripts/migrate-inventory-skus.mjs
 */

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
let TOKEN = '';

async function login() {
  const res = await fetch(`${STRAPI_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'massivemedias@gmail.com', password: 'Massive1423!!' }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const data = await res.json();
  TOKEN = data.data.token;
  console.log('Logged in');
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const isRemote = !STRAPI_URL.includes('localhost');
const DELAY = isRemote ? 8000 : 0;

async function getEntries() {
  if (DELAY) await sleep(DELAY);
  const res = await fetch(`${STRAPI_URL}/content-manager/collection-types/api::inventory-item.inventory-item?pageSize=100`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) throw new Error(`GET failed: ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

async function updateEntry(documentId, data) {
  if (DELAY) await sleep(DELAY);
  const res = await fetch(`${STRAPI_URL}/content-manager/collection-types/api::inventory-item.inventory-item/${documentId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`  UPDATE FAIL ${documentId}: ${err.slice(0, 200)}`);
    return false;
  }
  return true;
}

// Mapping ancien SKU -> nouveau SKU
const SKU_RENAME = {
  'TEX-TSHIRT-G5000': 'MS-TSHIRT-G5000',
  'TEX-HOODIE-G18500': 'MS-HOODIE-G18500',
  'TEX-CREW-G18000': 'MS-CREW-G18000',
  'TEX-TOTE-QTB': 'MS-TOTE-QTB',
  'ACC-FANNY': 'MS-FANNY',
  'ACC-MUG': 'MS-MUG',
  'ACC-TUMBLER': 'MS-TUMBLER',
  'STK-MATTE': 'MS-STK-MATTE',
  'STK-GLOSSY': 'MS-STK-GLOSSY',
  'STK-HOLO': 'MS-STK-HOLO',
  'STK-BROKENGLASS': 'MS-STK-BROKENGLASS',
  'STK-STARS': 'MS-STK-STARS',
  'FRM-BLK-A4': 'MS-FRM-BLK-A4',
  'FRM-WHT-A4': 'MS-FRM-WHT-A4',
  'FRM-BLK-A3': 'MS-FRM-BLK-A3',
  'FRM-WHT-A3': 'MS-FRM-WHT-A3',
  'FRM-BLK-A3PLUS': 'MS-FRM-BLK-A3PLUS',
  'FRM-WHT-A3PLUS': 'MS-FRM-WHT-A3PLUS',
  'FRM-BLK-A2': 'MS-FRM-BLK-A2',
  'FRM-WHT-A2': 'MS-FRM-WHT-A2',
};

// SKUs a desactiver (consommables)
const DEACTIVATE_SKUS = [
  'PRT-PAPER-A4', 'PRT-PAPER-A3', 'PRT-PAPER-A3PLUS', 'PRT-PAPER-A2',
  'PRT-INK-STUDIO', 'PRT-INK-MUSEUM', 'PRT-CARDSTOCK',
  'SUB-PAPER', 'SUB-INK',
];

async function main() {
  console.log(`Migration SKUs inventaire (${STRAPI_URL})\n`);
  await login();

  const items = await getEntries();
  console.log(`${items.length} items trouves\n`);

  let renamed = 0;
  let deactivated = 0;
  let unchanged = 0;

  for (const item of items) {
    const oldSku = item.sku;

    // Desactiver consommable ?
    if (DEACTIVATE_SKUS.includes(oldSku)) {
      console.log(`  DESACTIVER: ${oldSku} - ${item.nameFr}`);
      const ok = await updateEntry(item.documentId, { active: false });
      if (ok) deactivated++;
      continue;
    }

    // Renommer SKU ?
    const newSku = SKU_RENAME[oldSku];
    if (newSku) {
      console.log(`  RENOMMER: ${oldSku} -> ${newSku}`);
      const ok = await updateEntry(item.documentId, { sku: newSku });
      if (ok) renamed++;
      continue;
    }

    // Deja MS- ou inconnu
    if (oldSku && oldSku.startsWith('MS-')) {
      unchanged++;
    } else {
      console.log(`  INCONNU: ${oldSku} - ${item.nameFr} (aucune action)`);
      unchanged++;
    }
  }

  console.log(`\n=== MIGRATION TERMINEE ===`);
  console.log(`Renommes: ${renamed}`);
  console.log(`Desactives: ${deactivated}`);
  console.log(`Inchanges: ${unchanged}`);
}

main().catch(console.error);
