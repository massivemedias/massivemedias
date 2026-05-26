/**
 * Detecte le rectangle vert dans chaque image de mockup en utilisant
 * ImageMagick pour extraire les pixels bruts, puis scan en JS
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DIR = path.resolve('frontend/public/images/mockups');
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.png') && (f.includes('_black') || f.includes('_white')));

const results = {};

for (const file of files) {
  const filePath = path.join(DIR, file);
  const key = file.replace('.png', '');

  // Obtenir les dimensions
  const dims = execSync(`magick identify -format "%w %h" "${filePath}"`, { encoding: 'utf-8' }).trim();
  const [imgW, imgH] = dims.split(' ').map(Number);

  // Extraire les pixels RGB en format texte (echantillonnage 1 pixel sur 2 pour la vitesse)
  // Utiliser -depth 8 -size pour forcer
  const raw = execSync(
    `magick "${filePath}" -resize 50% -depth 8 txt:- | grep -E "#[0-9A-Fa-f]{6}" | head -500000`,
    { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 }
  );

  const halfW = Math.round(imgW / 2);
  const halfH = Math.round(imgH / 2);

  let minX = halfW, minY = halfH, maxX = 0, maxY = 0;
  let greenCount = 0;

  for (const line of raw.split('\n')) {
    // Format: "x,y: (R,G,B)  #RRGGBB  ..."
    const m = line.match(/^(\d+),(\d+):.*#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})/);
    if (!m) continue;
    const [, xs, ys, rh, gh, bh] = m;
    const x = parseInt(xs), y = parseInt(ys);
    const r = parseInt(rh, 16), g = parseInt(gh, 16), b = parseInt(bh, 16);

    // Vert vif: R < 120, G > 150, B < 120
    if (r < 120 && g > 150 && b < 120) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      greenCount++;
    }
  }

  if (greenCount > 50) {
    // Convertir les coords de l'image 50% vers l'image originale
    const ox = minX * 2, oy = minY * 2;
    const ow = (maxX - minX + 1) * 2, oh = (maxY - minY + 1) * 2;
    results[key] = {
      x: +(ox / imgW * 100).toFixed(1),
      y: +(oy / imgH * 100).toFixed(1),
      w: +(ow / imgW * 100).toFixed(1),
      h: +(oh / imgH * 100).toFixed(1),
    };
    console.log(`OK ${key}: ${results[key].x}%,${results[key].y}% ${results[key].w}%x${results[key].h}% (${greenCount} pixels)`);
  } else {
    console.warn(`FAIL ${key}: only ${greenCount} green pixels found`);
  }
}

const coordsPath = path.join(DIR, 'frame-coords.json');
fs.writeFileSync(coordsPath, JSON.stringify(results, null, 2));
console.log(`\nCoords: ${coordsPath}`);
