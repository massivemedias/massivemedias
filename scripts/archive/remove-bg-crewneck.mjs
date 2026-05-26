#!/usr/bin/env node
import { removeBackground } from '@imgly/background-removal-node';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'frontend/public/images/crewneck/black.webp');
const TARGETS = [
  path.join(ROOT, 'frontend/public/images/crewneck/black.webp'),
  path.join(ROOT, 'frontend/public/images/longsleeve/black.webp'),
];

console.log('[1/3] Reading source + converting to PNG:', SRC);
const buf = fs.readFileSync(SRC);
// imgly node v1.4.5 ne supporte pas WebP directement -> convertir en PNG d'abord
const pngBufInput = await sharp(buf).png().toBuffer();
const blob = new Blob([pngBufInput], { type: 'image/png' });

console.log('[2/3] Running background removal (isnet, FP32)...');
const t0 = Date.now();
const resultBlob = await removeBackground(blob, {
  model: 'medium',
  output: { format: 'image/png', quality: 1.0 },
  debug: false,
});
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`     -> done in ${elapsed}s`);

console.log('[3/3] Converting to WebP with alpha + writing targets...');
const pngBuf = Buffer.from(await resultBlob.arrayBuffer());
const webpBuf = await sharp(pngBuf).webp({ quality: 92, lossless: false, alphaQuality: 100 }).toBuffer();
for (const t of TARGETS) {
  fs.writeFileSync(t, webpBuf);
  console.log(`     -> ${path.relative(ROOT, t)} (${(webpBuf.length / 1024).toFixed(1)} KB)`);
}
console.log('Done.');
